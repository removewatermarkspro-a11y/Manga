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
// fetch with timeout + automatic retry
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
            console.warn(`fetchWithRetry attempt ${attempt}/${maxRetries} for ${url}: ${err.message}${isLast ? '' : ' — retrying...'}`);
            if (!isLast) await new Promise(r => setTimeout(r, attempt * 2000));
        }
    }
    throw lastErr;
}

// -------------------------------------------------------------------------------------------------
// Upload base64 image to imgbb.com (free, reliable) and return a public URL
// This is necessary because Kie's image_input ONLY accepts public HTTP URLs.
async function uploadBase64ToPublicUrl(base64Str: string): Promise<string> {
    // Strip data URI prefix if present
    const rawB64 = base64Str.replace(/^data:image\/\w+;base64,/, '');

    // Try imgbb.com (free tier, 32MB/month, very reliable)
    const imgbbKey = '44c4e51b3cb1cbc7aa2d89663bb6aa72'; // free API key
    const formBody = new URLSearchParams();
    formBody.append('key', imgbbKey);
    formBody.append('image', rawB64);

    console.log(`Uploading image to imgbb (${Math.round(rawB64.length / 1024)}KB base64)...`);

    const res = await fetchWithRetry(
        'https://api.imgbb.com/1/upload',
        {
            method: 'POST',
            body: formBody,
        },
        3,
        20000
    );

    if (!res.ok) {
        const text = await res.text().catch(() => 'no body');
        throw new Error(`imgbb upload failed: HTTP ${res.status} — ${text.substring(0, 200)}`);
    }

    const data = await res.json();
    if (data?.data?.url) {
        console.log(`imgbb upload success: ${data.data.url}`);
        return data.data.url;
    }
    throw new Error(`imgbb returned unexpected response: ${JSON.stringify(data).substring(0, 200)}`);
}

// -------------------------------------------------------------------------------------------------
// Kie API helper for nano-banana-2
// IMPORTANT: image_input MUST be an array of public HTTP URLs (not base64)
async function generateImageWithKie(prompt: string, imageUrls: string[]): Promise<string> {
    const KIE_API_KEY = "0ebb274e201da9dd3487833efa368f65";

    console.log(`Kie createTask — prompt: ${prompt.length} chars, images: ${imageUrls.length} URLs`);
    if (imageUrls.length > 0) console.log(`  First image URL: ${imageUrls[0].substring(0, 80)}...`);

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
                    image_input: imageUrls,
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
        // STEP 1: LLaMA 70B generates a full comic script
        // ========================================================
        console.log('Step 1: Generating full comic script with LLaMA 70B...');

        let styleKeywords = '';
        let styleInstruction = '';
        if (style === 'manga') {
            styleKeywords = 'black and white manga style, Japanese comic, dynamic ink lines, screentones, high contrast, speech bubbles';
            styleInstruction = 'manga';
        } else if (style === 'manhwa') {
            styleKeywords = 'full color Korean webtoon manhwa, polished digital art, vibrant colors, speech bubbles';
            styleInstruction = 'manhwa';
        } else if (style === 'comic') {
            styleKeywords = 'American comic book, bold outlines, vibrant colors, halftone dots, speech bubbles';
            styleInstruction = 'comic book';
        }

        const characterNames = characterList.map(c => c.name).join(' and ');
        const characterRoles = characterList.map(c => `${c.name} is the ${c.role}`).join('. ');

        // LLaMA writes a natural-language visual script — NOT JSON
        const llamaSystemPrompt = `You are a ${styleInstruction} comic book artist describing exactly what to draw on each page. Write vivid, visual descriptions. Focus on what the reader SEES: characters, poses, expressions, backgrounds, lighting, and dialogue in speech bubbles. Do NOT write narrative or plot summaries — describe images.`;

        const llamaUserPrompt = `Write a visual script for an 11-page ${styleInstruction} comic book.

STORY: "${storyText}"
CHARACTERS: ${characterRoles}

Write your script using this EXACT format (one description per page):

PAGE 0: [Cover page — single dramatic illustration of ${characterNames} with the title "${storyText}" in large stylized text. No panels.]
PAGE 1: [Opening scene — introduce the characters and setting]
PAGE 2: [Continue introduction]
PAGE 3: [A problem or conflict appears]
PAGE 4: [Tension grows]
PAGE 5: [A twist or surprising turn]
PAGE 6: [Characters react to the twist]
PAGE 7: [The biggest challenge — climax begins]
PAGE 8: [Peak action moment]
PAGE 9: [Resolution — the conflict is resolved]
PAGE 10: [Ending — final scene, characters at peace]

For each page, write 2-3 sentences describing:
- The SETTING (where are we? what time of day? what's the atmosphere?)
- The CHARACTERS (what are ${characterNames} doing? their pose? their face expression?)
- The DIALOGUE (what do they say? write the exact speech bubble text in quotes)

Keep each page description under 80 words. Be specific and visual.`;

        const llamaOutput = await replicate.run(
            "meta/meta-llama-3-70b-instruct",
            {
                input: {
                    prompt: llamaUserPrompt,
                    system_prompt: llamaSystemPrompt,
                    max_tokens: 2500,
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

        console.log('=== LLAMA FULL SCRIPT ===');
        console.log(llamaText);
        console.log('=========================');

        // Parse the script by splitting on "PAGE X:" markers
        const pageDescriptions: string[] = [];
        for (let p = 0; p <= 10; p++) {
            const marker = `PAGE ${p}:`;
            const nextMarker = p < 10 ? `PAGE ${p + 1}:` : null;
            const startIdx = llamaText.indexOf(marker);

            if (startIdx !== -1) {
                const contentStart = startIdx + marker.length;
                const endIdx = nextMarker ? llamaText.indexOf(nextMarker) : llamaText.length;
                const desc = llamaText.substring(contentStart, endIdx !== -1 ? endIdx : llamaText.length).trim();
                pageDescriptions.push(desc);
            } else {
                // Fallback for missing pages
                pageDescriptions.push(
                    p === 0
                        ? `A dramatic cover illustration showing ${characterNames} in a heroic pose. The title "${storyText}" appears in large bold stylized text.`
                        : `A ${styleInstruction} page showing ${characterNames} in an exciting scene from the story "${storyText}".`
                );
            }
        }

        console.log(`Step 1 complete: ${pageDescriptions.length} page descriptions parsed from script.`);

        // ========================================================
        // STEP 2: Upload character images to get public URLs
        // ========================================================
        console.log('Step 2: Uploading character images to imgbb...');

        const allCharacterImageUrls: string[] = [];
        for (let ci = 0; ci < characterList.length; ci++) {
            const c = characterList[ci];
            try {
                if (c.image.startsWith('data:image') || c.image.startsWith('/9j/')) {
                    console.log(`Uploading character ${ci + 1} (${c.name}) to imgbb...`);
                    const publicUrl = await uploadBase64ToPublicUrl(c.image);
                    allCharacterImageUrls.push(publicUrl);
                } else if (c.image.startsWith('http')) {
                    allCharacterImageUrls.push(c.image);
                } else {
                    console.warn(`Character ${c.name}: unknown image format, skipping`);
                }
            } catch (uploadErr: any) {
                console.error(`Failed to upload image for ${c.name}: ${uploadErr.message}`);
            }
        }

        console.log(`Step 2 complete: ${allCharacterImageUrls.length} photo URL(s) ready.`);

        // ========================================================
        // STEP 3: Build 11 Kie prompts from the script
        // ========================================================
        const kiePrompts: string[] = pageDescriptions.map((desc, i) => {
            const charRefInstruction = `The characters in this image must look exactly like the people in the provided reference photos. Use the reference photos to reproduce their exact face, hair, skin tone, and features.`;

            if (i === 0) {
                // Cover page
                return `${styleKeywords}. ${desc} ${charRefInstruction}`;
            } else {
                // Story page
                return `${styleKeywords}. Full ${styleInstruction} page with panels and speech bubbles. ${desc} ${charRefInstruction}`;
            }
        });

        console.log('Step 3: 11 Kie prompts built.');
        kiePrompts.forEach((p, i) => console.log(`  Prompt ${i} (${p.length} chars): ${p.substring(0, 150)}...`));

        // ========================================================
        // STEP 4: Stream image generation via SSE
        // ========================================================
        console.log('Step 4: Streaming images with nano-banana-2...');

        const _supabase = supabase;
        const _creationId = creationId;
        const _profile = profile;
        const _user = user;
        const _isTesting = isTesting;

        const stream = new ReadableStream({
            async start(controller) {
                const encode = (obj: object) => {
                    const line = `data: ${JSON.stringify(obj)}\n\n`;
                    controller.enqueue(new TextEncoder().encode(line));
                };

                const generatedImages: string[] = [];

                try {
                    for (let i = 0; i < 11; i++) {
                        const prompt = kiePrompts[i];

                        console.log(`\n=== GENERATING PAGE ${i === 0 ? 'COVER' : i} ===`);
                        console.log(`Prompt (${prompt.length} chars): ${prompt.substring(0, 300)}...`);
                        console.log(`Image refs: ${allCharacterImageUrls.length} photos`);

                        const imageUrl = await generateImageWithKie(prompt, allCharacterImageUrls);


                        console.log(`Page ${i === 0 ? 'COVER' : i} generated: ${imageUrl.substring(0, 80)}...`);
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
