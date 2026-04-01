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
// fetch with timeout (30s) + automatic retry (up to 3 attempts)
async function fetchWithRetry(
    url: string,
    options: RequestInit,
    maxRetries = 3,
    timeoutMs = 30000
): Promise<Response> {
    let lastErr: Error = new Error('Unknown error');
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const res = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(timer);
            return res;
        } catch (err: any) {
            clearTimeout(timer);
            lastErr = err;
            const isLast = attempt === maxRetries;
            console.warn(`fetchWithRetry attempt ${attempt}/${maxRetries} failed for ${url}: ${err.message}${isLast ? '' : ' — retrying...'}`);
            if (!isLast) {
                await new Promise(r => setTimeout(r, attempt * 1500)); // 1.5s, 3s, 4.5s
            }
        }
    }
    throw lastErr;
}

// Kie API helper for nano-banana-2
// Accepts raw base64 strings (without data URI prefix) OR public HTTP URLs
async function generateImageWithKie(prompt: string, imageInput: string[]): Promise<string> {
    const KIE_API_KEY = "0ebb274e201da9dd3487833efa368f65";

    // Strip any "data:image/...;base64," prefixes — Kie expects raw base64 or plain URLs
    const cleanedImages = imageInput.map(img =>
        img.startsWith('data:image') ? img.replace(/^data:image\/\w+;base64,/, '') : img
    );

    console.log(`Kie createTask — prompt length: ${prompt.length}, images: ${cleanedImages.length}`);

    // 1. Create Task (with retry + timeout)
    const createRes = await fetchWithRetry(
        "https://api.kie.ai/api/v1/jobs/createTask",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${KIE_API_KEY}`
            },
            body: JSON.stringify({
                model: "nano-banana-2",
                input: {
                    prompt,
                    image_input: cleanedImages,
                    aspect_ratio: "3:4",
                    resolution: "1K",
                    output_format: "jpg"
                }
            })
        },
        3,
        30000
    );

    if (!createRes.ok) {
        let errMessage = 'Create Task failed';
        try { errMessage = JSON.stringify(await createRes.json()); } catch (_) {}
        throw new Error(`Kie API Create Error: ${createRes.status} — ${errMessage}`);
    }

    const createData = await createRes.json();
    if (createData.code !== 200 || !createData.data?.taskId) {
        throw new Error(`Kie API Create Error: ${JSON.stringify(createData)}`);
    }

    const taskId = createData.data.taskId;
    console.log(`Kie task created: ${taskId}`);

    // 2. Poll Task Status (with retry on each poll, max 120 polls à 3s = 6 min)
    for (let poll = 0; poll < 120; poll++) {
        await new Promise(resolve => setTimeout(resolve, 3000));

        let pollRes: Response;
        try {
            pollRes = await fetchWithRetry(
                `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`,
                {
                    method: "GET",
                    headers: { "Authorization": `Bearer ${KIE_API_KEY}` }
                },
                3,
                15000
            );
        } catch (pollErr) {
            console.warn(`Poll ${poll + 1} failed, continuing...`);
            continue;
        }

        if (!pollRes.ok) {
            console.warn(`Poll ${poll + 1}: HTTP ${pollRes.status}, continuing...`);
            continue;
        }

        const pollData = await pollRes.json();

        if (pollData.code === 200 && pollData.data) {
            const state = pollData.data.state;
            console.log(`Poll ${poll + 1}: state = ${state}`);

            if (state === "success") {
                try {
                    const resultJson = JSON.parse(pollData.data.resultJson);
                    return resultJson.resultUrls[0];
                } catch (e) {
                    throw new Error(`Failed to parse result URL: ${pollData.data.resultJson}`);
                }
            } else if (state === "fail") {
                throw new Error(`Kie task failed: ${pollData.data.failMsg}`);
            }
            // state === "waiting" or "running" — keep polling
        }
    }

    throw new Error('Kie task timed out after 6 minutes');
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
            return `Character ${i + 1}: Name="${c.name}", Role=${c.role}. Reference photo provided — keep exact face, hair, and features.`;
        }).join('\n');

        const characterNames = characterList.map(c => c.name).join(' and ');
        const characterSummary = characterList.map(c => `${c.name} (${c.role})`).join(', ');

        // LLaMA generates short, Kie-optimized image prompts (not long narratives)
        const llamaSystemPrompt = `You are an AI image prompt writer for a ${styleInstruction} comic book generator. Your output goes DIRECTLY to an image AI (Kie Nano-Banana 2). You must write SHORT, VISUAL, CONCRETE image generation prompts. Each prompt must be under 100 words. Focus on: what you SEE in the image, character poses, expressions, setting, lighting, dialogue in speech bubbles. Do NOT write plot summaries or narrative text. Output ONLY a valid JSON array of exactly 11 strings. No markdown, no code fences, just the raw JSON array.`;

        const llamaUserPrompt = `Write 11 image generation prompts for a ${styleInstruction} comic book about: "${storyText}"\n\nCHARACTERS: ${characterSummary}\nREFERENCE PHOTOS of characters are provided — always mention "[character name] from the reference photo".\n\nARRAY STRUCTURE:\n- Index 0: COVER PAGE prompt. Single dramatic illustration of ${characterNames}. Story title "${storyText}" in large stylized text. No panels. Epic pose, moody lighting.\n- Index 1-10: One COMIC PAGE prompt each, in story order. Each prompt describes a PAGE with 3 panels. For each panel: describe the exact scene, ${characterNames}'s pose and emotion, the background, and write the exact speech bubble dialogue in quotes.\n\nSTORY ARC for pages 1-10:\n- Pages 1-2: Opening scene, introduce characters and situation\n- Pages 3-4: Conflict or challenge rises\n- Pages 5-6: Twist or complication\n- Pages 7-8: Climax action\n- Pages 9-10: Resolution and ending\n\nEXAMPLE of a good prompt for one page:\n"${styleKeywords}. Full comic book page, 3 panels. Top panel (wide shot): ${characterNames} walks through a crowded marketplace, looking nervous, hand on pocket, golden sunset background. Middle panel (close-up): ${characterNames}'s eyes widen in shock, speech bubble says 'They found me!'. Bottom panel (medium shot): A hooded figure emerges from shadows behind ${characterNames}, pointing. Urban street background, tense atmosphere."\n\nNow write all 11 prompts following this exact structure. Output the JSON array:`;


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
        // STEP 2: Prepare character images for Kie
        // ========================================================
        console.log('Step 2: Preparing image inputs...');

        // Pass images as raw base64 (Kie supports it — we strip the data URI prefix in generateImageWithKie)
        // No external upload needed — eliminates ECONNRESET from freeimage.host
        const allCharacterImages: string[] = characterList.map(c => c.image);
        console.log(`Using ${allCharacterImages.length} character image(s) for Kie.`);

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

                        // LLaMA already generates Kie-optimized prompts
                        // Just prepend the style keywords for consistency
                        const fullPrompt = isCover
                            ? `${styleKeywords}. ${pageDesc}`
                            : `${styleKeywords}. ${pageDesc}. Characters must match the provided reference photos exactly.`;

                        // Log the full prompt for debugging
                        console.log(`\n=== PAGE ${isCover ? 'COVER' : i} PROMPT (${fullPrompt.length} chars) ===`);
                        console.log(fullPrompt.substring(0, 400) + (fullPrompt.length > 400 ? '...' : ''));
                        console.log('=================================================');


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
