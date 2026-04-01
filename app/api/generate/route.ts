import { NextResponse } from 'next/server';
import Replicate from 'replicate';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Initialize Replicate client
const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN || '',
    useFileOutput: false,
});

interface CharacterData {
    name: string;
    role: string;
    gender: string;
    age: string;
    image: string;
}

// Increase Vercel serverless function timeout (300s on Pro, 60s on Hobby)
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

function getSupabaseClient() {
    const cookieStore = cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value, ...options });
                    } catch (error) {}
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value: '', ...options });
                    } catch (error) {}
                },
            },
        }
    );
}

// -------------------------------------------------------------------------------------------------
// Helper: Upload base64 strings to a free image host, to provide valid HTTP URLs to Kie API
// -------------------------------------------------------------------------------------------------
async function uploadBase64ToFreeImage(base64Str: string): Promise<string> {
    const b64 = base64Str.replace(/^data:image\/\w+;base64,/, '');

    const body = new URLSearchParams();
    // Public generic API key for freeimage.host, perfectly fine for temporary generations
    body.append('key', '6d207e02198a847aa98d0a2a901485a5');
    body.append('action', 'upload');
    body.append('source', b64);
    body.append('format', 'json');

    const res = await fetch('https://freeimage.host/api/1/upload', {
        method: 'POST',
        body: body,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    if (!res.ok) {
        console.error('FreeImage upload error HTTP status:', res.status);
        throw new Error(`Failed to upload image to FreeImage: ${res.statusText}`);
    }

    const data = await res.json();
    if (data && data.image && data.image.url) {
        return data.image.url;
    }
    throw new Error('Invalid response from FreeImage API');
}

// Kie API helper for nano-banana-2
async function generateImageWithKie(prompt: string, imageInput: string[]): Promise<string> {
    const KIE_API_KEY = "0ebb274e201da9dd3487833efa368f65";
    
    // 1. Create Task
    const createRes = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${KIE_API_KEY}`
        },
        body: JSON.stringify({
            model: "nano-banana-2",
            input: {
                prompt: prompt,
                image_input: imageInput,
                aspect_ratio: "3:4",
                resolution: "1K",
                output_format: "jpg"
            }
        })
    });
    
    if (!createRes.ok) {
        let errMessage = 'Create Task failed';
        try {
            const errData = await createRes.json();
            errMessage = JSON.stringify(errData);
        } catch(e) {}
        throw new Error(`Kie API Create Error: ${createRes.status} - ${errMessage}`);
    }
    
    const createData = await createRes.json();
    if (createData.code !== 200 || !createData.data?.taskId) {
        throw new Error(`Kie API Create Error: ${JSON.stringify(createData)}`);
    }
    
    const taskId = createData.data.taskId;
    
    // 2. Poll Task Status
    while (true) {
        await new Promise(resolve => setTimeout(resolve, 3000)); // Poll every 3 seconds
        
        const pollRes = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${KIE_API_KEY}`
            }
        });
        
        if (!pollRes.ok) {
            continue; // Retry on transient HTTP errors
        }
        
        const pollData = await pollRes.json();
        
        if (pollData.code === 200 && pollData.data) {
            const state = pollData.data.state;
            
            if (state === "success") {
                try {
                    const resultJson = JSON.parse(pollData.data.resultJson);
                    return resultJson.resultUrls[0];
                } catch (e) {
                    throw new Error(`Failed to parse result URL: ${pollData.data.resultJson}`);
                }
            } else if (state === "fail") {
                throw new Error(`Task failed: ${pollData.data.failMsg}`);
            }
            // If "waiting", loop continues
        }
    }
}

export async function POST(req: Request) {
    try {
        const supabase = getSupabaseClient();

        // Get the authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        // TEMPORARILY ALLOW TESTING WITHOUT AUTH
        const isTesting = !user;

        const body = await req.json();
        const { storyText, style, characters, characterImage } = body;

        // Build character list
        let characterList: CharacterData[] = [];
        if (Array.isArray(characters) && characters.length > 0) {
            characterList = characters;
        } else if (characterImage) {
            characterList = [{
                name: 'Main Character',
                role: 'protagonist',
                gender: 'unknown',
                age: 'unknown',
                image: characterImage
            }];
        }

        if (!storyText || !style || characterList.length === 0) {
            return NextResponse.json(
                { error: 'Missing required fields: storyText, style, or characters' },
                { status: 400 }
            );
        }

        let creationId: string | null = null;
        let profile: { credits: number } | null = null;

        if (!isTesting && user) {
            // Check credits
            const { data: p, error: profileError } = await supabase
                .from('profiles')
                .select('credits')
                .eq('id', user.id)
                .single();

            if (profileError || !p) {
                return NextResponse.json(
                    { error: 'Could not fetch user profile.' },
                    { status: 500 }
                );
            }

            profile = p;

            if (profile.credits <= 0) {
                return NextResponse.json(
                    { error: 'No credits remaining. Please purchase a plan to generate comics.' },
                    { status: 403 }
                );
            }

            // Create a creation record in Supabase
            const { data: creation, error: createError } = await supabase
                .from('creations')
                .insert({
                    user_id: user.id,
                    title: storyText.substring(0, 50) + (storyText.length > 50 ? '...' : ''),
                    style: style,
                    story_text: storyText,
                    status: 'generating',
                    characters: characterList.map(c => ({
                        name: c.name,
                        role: c.role,
                        gender: c.gender,
                        age: c.age,
                    })),
                })
                .select()
                .single();

            if (createError || !creation) {
                console.error('Error creating creation record:', createError);
                return NextResponse.json(
                    { error: 'Failed to create generation record.' },
                    { status: 500 }
                );
            }
            creationId = creation.id;
            console.log(`Creation ${creationId} started. Style: ${style}, Characters: ${characterList.length}`);
        } else {
            console.log(`Testing mode started. Style: ${style}, Characters: ${characterList.length}`);
        }

        // ========================================================
        // STEP 1: Generate a coherent story script via LLaMA
        // ========================================================
        console.log('Step 1: Generating story script with LLaMA...');

        let styleKeywords = '';
        let styleInstruction = '';
        if (style === 'manga') {
            styleKeywords = 'black and white manga style, Japanese comic book page layout with multiple panels, dynamic ink lines, screentones, high contrast, speech bubbles with dialogue';
            styleInstruction = 'manga (Japanese black and white comic)';
        } else if (style === 'manhwa') {
            styleKeywords = 'full color Korean webtoon manhwa style comic page layout with multiple panels, polished digital painting, speech bubbles with dialogue, vibrant colors';
            styleInstruction = 'manhwa (Korean full-color webtoon)';
        } else if (style === 'comic') {
            styleKeywords = 'American comic book style page layout with multiple panels, bold outlines, vibrant colors, dynamic superhero style illustration, halftone dots, speech bubbles with dialogue';
            styleInstruction = 'comic (American-style comic book)';
        }

        const characterDescriptions = characterList.map((c, i) => {
            return `Character ${i + 1}: Name="${c.name}", Role=${c.role}. A photo of this character is provided — keep their exact face, hair, skin tone, and eye color in every panel they appear.`;
        }).join('\n');

        const characterSummary = characterList.map(c => c.name).join(', ');

        const llamaSystemPrompt = `You are an expert ${styleInstruction} comic book art director AND storyteller. Your job is to write page-by-page IMAGE GENERATION PROMPTS for a comic book. Each prompt will be sent directly to an AI image generator, so it must be an extremely detailed visual description, NOT a script. You must output ONLY a valid JSON array of exactly 11 strings. No markdown, no explanation, no code fences. Just the raw JSON array.`;

        const llamaUserPrompt = `Create an 11-page ${styleInstruction} comic book based on this story: "${storyText}"\n\nCHARACTERS IN THIS STORY:\n${characterDescriptions}\n\nOUTPUT FORMAT: A JSON array of 11 strings. Each string is a detailed IMAGE GENERATION PROMPT for one page. Here is exactly what each string must contain:\n\nSTRING 0 — COVER PAGE:\nDescribe a single stunning illustration (NOT a multi-panel page). Include: the title "${storyText}" written in large stylized letters at the top or center, the main characters (${characterSummary}) in a dramatic heroic pose, the setting atmosphere, lighting, and mood. Keep it clean — just the cover illustration and title text, nothing else. No panels, no speech bubbles.\n\nSTRINGS 1-10 — STORY PAGES (must directly follow the story of "${storyText}"):\nEach string must describe ONE FULL COMIC PAGE with exactly 3 panels. For EACH panel, specify:\n- Panel position on the page (e.g., "Top wide panel", "Bottom-left panel", "Bottom-right panel")\n- Exact scene action happening in that moment of the story\n- Character(s) present: use their exact name, describe their emotion, body pose, gesture\n- Exact dialogue text in speech bubble for each character speaking (write the actual words)\n- Background details: location, time of day, lighting\n- Camera angle (close-up, medium shot, wide shot, over-the-shoulder, etc.)\n\nNARRATIVE ARC (follow this for strings 1-10):\n- Pages 1-2: Introduce the characters and setting, establish the situation\n- Pages 3-4: First conflict or challenge arises\n- Pages 5-6: Surprising twist or complication\n- Pages 7-8: Climax — most intense moment\n- Pages 9-10: Resolution and satisfying ending\n\nCRITICAL RULES:\n- Every page description MUST reference the exact story "${storyText}" — do not drift or invent unrelated scenes\n- Characters must be in EVERY panel with their exact name mentioned\n- Dialogue must be natural, short, and in-character (max 10 words per speech bubble)\n- Page descriptions must flow logically from one page to the next — this is a continuous story\n- Write all descriptions in English\n- Be very specific about visuals: colors, expressions, clothing, environment\n\nOutput the JSON array now:`;

        const llamaOutput = await replicate.run(
            "meta/meta-llama-3-8b-instruct",
            {
                input: {
                    prompt: llamaUserPrompt,
                    system_prompt: llamaSystemPrompt,
                    max_tokens: 3000,
                    temperature: 0.7,
                    top_p: 0.9,
                }
            }
        );

        let llamaText = '';
        if (Array.isArray(llamaOutput)) {
            llamaText = llamaOutput.join('');
        } else {
            llamaText = String(llamaOutput);
        }

        console.log('LLaMA raw output (first 500 chars):', llamaText.substring(0, 500));

        let pageDescriptions: string[] = [];
        try {
            const jsonMatch = llamaText.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                pageDescriptions = JSON.parse(jsonMatch[0]);
            }
        } catch (parseError) {
            console.error('Failed to parse LLaMA output as JSON:', parseError);
        }

        if (!Array.isArray(pageDescriptions) || pageDescriptions.length < 11) {
            console.warn('LLaMA parsing failed or returned < 11 pages. Using fallback.');
            const charNames = characterList.map(c => c.name).join(' and ');
            pageDescriptions = [
                `Cover page: A dramatic illustration of ${charNames} in an action pose. Title "${storyText}" in bold stylized text at the top. Dynamic composition with energy lines.`,
                `Page 1: A full comic page with 3 panels. Top panel: Wide establishing shot of the setting. Middle panel: ${characterList[0].name} is introduced. Bottom panel: Close-up of ${characterList[0].name}'s determined face. Speech bubble: "This is where it all begins."`,
                `Page 2: A comic page with 4 panels showing ${charNames} meeting. Dialogue between the characters about the situation at hand.`,
                `Page 3: Rising action page with 3 panels. ${characterList[0].name} discovers something important. Dramatic reveal panel.`,
                `Page 4: A comic page with 3-4 panels showing growing tension and conflict.`,
                `Page 5: Midpoint twist page. 3 panels showing a surprising revelation that changes everything.`,
                `Page 6: A comic page with 4 panels showing the characters reacting to the twist and planning their next move.`,
                `Page 7: Climax begins. 3 dramatic panels with intense action and emotion.`,
                `Page 8: The peak of the climax. Full-page dramatic moment with ${charNames} in the most intense scene.`,
                `Page 9: Aftermath. 3 quieter panels showing the resolution of the conflict. Characters process what happened.`,
                `Page 10: Final page. 3-4 panels showing the new status quo. Peaceful ending with ${charNames}. Final speech bubble with a meaningful closing line.`
            ];
        }

        pageDescriptions = pageDescriptions.slice(0, 11);
        while (pageDescriptions.length < 11) {
            pageDescriptions.push(`A continuation comic page featuring ${characterList[0].name} in the story "${storyText}". Multiple panels with dialogue.`);
        }

        console.log('Step 1 complete!', pageDescriptions.length, 'page descriptions generated.');

        // ========================================================
        // STEP 2: Upload character images then stream via SSE
        // ========================================================
        console.log('Step 2: Preparing image inputs...');

        // Convert any data URIs to actual public HTTP URLs for Kie API
        const allCharacterImages: string[] = [];
        for (const c of characterList) {
            if (c.image.startsWith('data:image')) {
                console.log(`Uploading base64 image for character ${c.name}...`);
                const url = await uploadBase64ToFreeImage(c.image);
                allCharacterImages.push(url);
            } else {
                allCharacterImages.push(c.image);
            }
        }

        console.log('Step 2: Streaming images with nano-banana-2...');

        // Capture supabase/creationId/profile/user/isTesting in closure for stream
        const _supabase = supabase;
        const _creationId = creationId;
        const _profile = profile;
        const _user = user;
        const _isTesting = isTesting;

        // Return a ReadableStream (SSE) so each image is sent to the client immediately
        const stream = new ReadableStream({
            async start(controller) {
                const encode = (obj: object) => {
                    const line = `data: ${JSON.stringify(obj)}\n\n`;
                    controller.enqueue(new TextEncoder().encode(line));
                };

                const generatedImages: string[] = [];

                try {
                    for (let i = 0; i < 11; i++) {
                        const pageDesc = pageDescriptions[i];
                        const isCover = i === 0;

                        let fullPrompt = '';
                        if (isCover) {
                            fullPrompt = `${styleKeywords}. COVER PAGE — single clean illustration. ${pageDesc}. Reference character photos provided — keep exact likeness. No panels, no page borders. High quality dramatic cover art.`;
                        } else {
                            fullPrompt = `${styleKeywords}. COMIC PAGE with 3 distinct panels arranged vertically or in a classic comic grid. Follow this exact visual script for each panel: ${pageDesc}. Characters must match the provided reference photos exactly — same face, hair, and features. Include speech bubbles with the exact dialogue text written in the description. Each panel must directly continue the story. Professional comic book page layout.`;
                        }

                        console.log(`Generating page ${isCover ? 'COVER' : i}/10...`);

                        const imageUrl = await generateImageWithKie(fullPrompt, allCharacterImages);

                        console.log(`Page ${isCover ? 'COVER' : i} generated: ${imageUrl.substring(0, 80)}...`);
                        generatedImages.push(imageUrl);

                        // Push image URL to client immediately
                        encode({ type: 'image', url: imageUrl, page: i });

                        // Save page to Supabase
                        if (!_isTesting && _creationId) {
                            await _supabase
                                .from('creation_pages')
                                .insert({
                                    creation_id: _creationId,
                                    page_number: i,
                                    image_url: imageUrl,
                                });
                        }
                    }

                    // Finalize
                    if (!_isTesting && _creationId && _profile && _user) {
                        await _supabase
                            .from('creations')
                            .update({ status: 'completed' })
                            .eq('id', _creationId);

                        await _supabase
                            .from('profiles')
                            .update({ credits: _profile.credits - 1 })
                            .eq('id', _user.id);
                    }

                    console.log('Generation complete!', generatedImages.length, 'images generated.');
                    encode({ type: 'done', creationId: _creationId });

                } catch (err: any) {
                    console.error('Streaming generation error:', err);
                    encode({ type: 'error', message: err.message || 'Generation failed' });
                } finally {
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                'X-Accel-Buffering': 'no',
                'Connection': 'keep-alive',
            },
        });

    } catch (error: any) {
        console.error('Error generating images:', error);

        let errorMessage = 'Failed to generate images';
        if (error.response?.data) {
            errorMessage = JSON.stringify(error.response.data);
        } else if (error.message) {
            errorMessage = error.message;
        } else {
            errorMessage = String(error);
        }

        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
