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
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Authentication required. Please log in.' },
                { status: 401 }
            );
        }

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

        // Check credits
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            return NextResponse.json(
                { error: 'Could not fetch user profile.' },
                { status: 500 }
            );
        }

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

        console.log(`Creation ${creation.id} started. Style: ${style}, Characters: ${characterList.length}`);

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
            return `Character ${i + 1}: "${c.name}" - Role: ${c.role}, Gender: ${c.gender}, Age: ${c.age}. A reference photo of this character is provided.`;
        }).join('\n');

        const llamaSystemPrompt = `You are a professional ${styleInstruction} scriptwriter. You create vivid, detailed page-by-page scripts for comic stories. You must output ONLY a valid JSON array of exactly 11 strings. No other text, no markdown, no explanation, no code fences. Just the raw JSON array.`;

        const llamaUserPrompt = `Create an 11-page ${styleInstruction} story based on the following:

STORY CONCEPT: "${storyText}"

CHARACTERS:
${characterDescriptions}

CRITICAL RULES:
1. Output ONLY a valid JSON array of exactly 11 strings. Nothing else.
2. The FIRST string (index 0) is the COVER PAGE description: a dramatic, eye-catching cover illustration featuring the main characters with the title of the story.
3. Strings 1 through 10 are the 10 STORY PAGES.
4. Each story page description must describe a FULL COMIC PAGE with 3-4 panels arranged in a layout, NOT a single image. Each panel within the page shows a different moment or angle.
5. Include dialogue in speech bubbles for each page. Write the actual dialogue the characters say.
6. You MUST mention each character BY NAME and describe their appearance in every page they appear in.
7. Include specific visual details: poses, facial expressions, backgrounds, lighting, camera angles for each panel.
8. The 10 story pages must follow a clear narrative arc:
   - Pages 1-2: Setup and introduction
   - Pages 3-4: Rising action and conflict
   - Pages 5-6: Midpoint twist
   - Pages 7-8: Climax
   - Pages 9-10: Resolution
9. The story must be DIRECTLY about "${storyText}" - do not invent a different story.
10. Write all descriptions in English.

Output the JSON array now:`;

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
        // STEP 2: Generate images one by one with nano-banana-2
        // ========================================================
        console.log('Step 2: Generating images with nano-banana-2...');

        const generatedImages: string[] = [];
        const allCharacterImages = characterList.map(c => c.image);

        for (let i = 0; i < 11; i++) {
            const pageDesc = pageDescriptions[i];
            const isCover = i === 0;

            let fullPrompt = '';
            if (isCover) {
                fullPrompt = `${styleKeywords}. A stunning comic book COVER PAGE illustration. ${pageDesc}. The characters must look exactly like the provided reference images. High quality, professional comic book cover design.`;
            } else {
                fullPrompt = `${styleKeywords}. A full comic book PAGE with 3-4 panels arranged in a dynamic layout. Each panel shows a different moment in the scene. Include speech bubbles with dialogue text. ${pageDesc}. The characters must look exactly like the provided reference images. Professional comic book page layout.`;
            }

            console.log(`Generating page ${i === 0 ? 'COVER' : i}/10...`);

            const imageUrl = await generateImageWithKie(fullPrompt, allCharacterImages);

            console.log(`Page ${i === 0 ? 'COVER' : i} generated: ${imageUrl.substring(0, 80)}...`);
            generatedImages.push(imageUrl);

            // Save each page to Supabase as it's generated
            await supabase
                .from('creation_pages')
                .insert({
                    creation_id: creation.id,
                    page_number: i,
                    image_url: imageUrl,
                });
        }

        // Mark creation as completed
        await supabase
            .from('creations')
            .update({ status: 'completed' })
            .eq('id', creation.id);

        // Decrement user's credits
        await supabase
            .from('profiles')
            .update({ credits: profile.credits - 1 })
            .eq('id', user.id);

        console.log('Generation complete!', generatedImages.length, 'images generated and saved to Supabase.');

        return NextResponse.json({
            images: generatedImages,
            creationId: creation.id,
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
