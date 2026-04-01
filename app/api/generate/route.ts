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
        // STEP 1: Generate structured story scenes via LLaMA 70B
        // ========================================================
        console.log('Step 1: Generating story scenes with LLaMA 70B...');

        let styleKeywords = '';
        let styleInstruction = '';
        if (style === 'manga') {
            styleKeywords = 'black and white manga style, Japanese comic, dynamic ink lines, screentones, high contrast';
            styleInstruction = 'manga';
        } else if (style === 'manhwa') {
            styleKeywords = 'full color Korean webtoon manhwa style, polished digital painting, vibrant colors';
            styleInstruction = 'manhwa';
        } else if (style === 'comic') {
            styleKeywords = 'American comic book style, bold outlines, vibrant colors, halftone dots';
            styleInstruction = 'comic book';
        }

        const characterNames = characterList.map(c => c.name).join(' and ');
        const characterSummary = characterList.map(c => `${c.name} (${c.role})`).join(', ');

        // LLaMA generates STRUCTURED SCENE DATA — we build the Kie prompts ourselves
        const llamaSystemPrompt = `You write story scenes for a ${styleInstruction} comic. Output ONLY a valid JSON array of 11 objects. No markdown, no code fences, no explanation. Just the raw JSON array.`;

        const llamaUserPrompt = `Write 11 scenes for a ${styleInstruction} comic about: "${storyText}"
Characters: ${characterSummary}

Output a JSON array of 11 objects. Each object has these fields:
- "visual": what we SEE in one sentence (max 20 words). Be specific: location, action, time of day.
- "emotion": the main character's emotion in one word (happy, scared, angry, surprised, sad, determined, etc.)
- "dialogue": a short speech bubble text (max 8 words). Use empty string "" for cover.
- "action": what the character is physically doing in one sentence (max 15 words)

Scene 0 = cover (dramatic pose, no panels).
Scenes 1-2 = introduction.
Scenes 3-4 = conflict rises.
Scenes 5-6 = twist.
Scenes 7-8 = climax.
Scenes 9-10 = resolution.

Example output:
[
  {"visual":"${characterNames} standing on a rooftop at sunset over the city","emotion":"determined","dialogue":"","action":"standing heroically with arms crossed"},
  {"visual":"a small coffee shop on a rainy morning, warm lighting inside","emotion":"nervous","dialogue":"Something feels wrong today","action":"sitting at a table looking out the window"},
  {"visual":"a dark alley at night with neon signs reflecting on wet ground","emotion":"scared","dialogue":"Who's there?","action":"turning around quickly hearing a noise"}
]

Now write all 11 scenes for "${storyText}". Output the JSON array:`;

        const llamaOutput = await replicate.run(
            "meta/meta-llama-3-70b-instruct",
            {
                input: {
                    prompt: llamaUserPrompt,
                    system_prompt: llamaSystemPrompt,
                    max_tokens: 2000,
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

        console.log('LLaMA raw output (first 800 chars):', llamaText.substring(0, 800));

        // Parse structured scenes from LLaMA
        interface SceneData {
            visual: string;
            emotion: string;
            dialogue: string;
            action: string;
        }

        let scenes: SceneData[] = [];
        try {
            const jsonMatch = llamaText.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                scenes = JSON.parse(jsonMatch[0]);
            }
        } catch (parseError) {
            console.error('Failed to parse LLaMA scenes:', parseError);
        }

        // Fallback if LLaMA failed
        if (!Array.isArray(scenes) || scenes.length < 11) {
            console.warn(`LLaMA returned ${scenes?.length || 0} scenes. Using fallback.`);
            scenes = [
                { visual: `${characterNames} in a dramatic heroic pose`, emotion: 'determined', dialogue: '', action: 'standing heroically' },
                { visual: `a quiet neighborhood at dawn`, emotion: 'calm', dialogue: 'Today is the day', action: 'walking down a street' },
                { visual: `a busy marketplace with crowds`, emotion: 'curious', dialogue: 'Look at this', action: 'pointing at something interesting' },
                { visual: `a dark room with a single light`, emotion: 'surprised', dialogue: 'What is this?', action: 'discovering a hidden object' },
                { visual: `a confrontation in an open field`, emotion: 'angry', dialogue: 'You lied to me!', action: 'shouting and pointing accusingly' },
                { visual: `a forest path at twilight`, emotion: 'confused', dialogue: 'Nothing makes sense', action: 'walking alone looking lost' },
                { visual: `a rooftop under a stormy sky`, emotion: 'scared', dialogue: 'We have to go now!', action: 'running towards the edge' },
                { visual: `an epic battle scene with debris flying`, emotion: 'fierce', dialogue: 'I will not give up!', action: 'fighting with full intensity' },
                { visual: `the aftermath of a battle, dust settling`, emotion: 'exhausted', dialogue: 'Is it over?', action: 'kneeling on the ground breathing hard' },
                { visual: `a peaceful sunset over a calm lake`, emotion: 'relieved', dialogue: 'We did it', action: 'sitting together watching the sunset' },
                { visual: `a bright new morning, birds flying`, emotion: 'happy', dialogue: 'A new beginning', action: 'smiling and walking towards the horizon' },
            ];
        }

        // Ensure exactly 11 scenes
        scenes = scenes.slice(0, 11);
        while (scenes.length < 11) {
            scenes.push({ visual: `a scene from the story "${storyText}"`, emotion: 'neutral', dialogue: '', action: `${characterNames} continuing the adventure` });
        }

        // BUILD Kie-optimized prompts programmatically from structured scenes
        const pageDescriptions: string[] = scenes.map((scene, i) => {
            const isCover = i === 0;
            if (isCover) {
                // Cover: single illustration, title text, no panels
                return `${styleKeywords}. Single dramatic illustration, NO panels. ${characterNames} ${scene.action}, looking ${scene.emotion}. ${scene.visual}. Title text "${storyText}" in large bold stylized letters at the top. Cinematic lighting, epic composition.`;
            } else {
                // Story page: comic page with panels
                const dialoguePart = scene.dialogue ? ` Speech bubble says: "${scene.dialogue}".` : '';
                return `${styleKeywords}. Comic book page with 3 panels and speech bubbles. ${characterNames} ${scene.action}. Expression: ${scene.emotion}. Setting: ${scene.visual}.${dialoguePart} Professional comic page layout.`;
            }
        });

        console.log('Step 1 complete!', pageDescriptions.length, 'Kie prompts built from scenes.');
        pageDescriptions.forEach((p, i) => console.log(`  Page ${i}: ${p.substring(0, 120)}...`));

        // ========================================================
        // STEP 2: Upload character images to get public URLs
        // ========================================================
        console.log('Step 2: Uploading character images to imgbb...');

        // Kie's image_input ONLY accepts public HTTP URLs
        const allCharacterImageUrls: string[] = [];
        for (let ci = 0; ci < characterList.length; ci++) {
            const c = characterList[ci];
            try {
                if (c.image.startsWith('data:image') || c.image.startsWith('/9j/')) {
                    console.log(`Uploading character ${ci + 1} (${c.name}) image to imgbb...`);
                    const publicUrl = await uploadBase64ToPublicUrl(c.image);
                    allCharacterImageUrls.push(publicUrl);
                } else if (c.image.startsWith('http')) {
                    allCharacterImageUrls.push(c.image);
                } else {
                    console.warn(`Character ${c.name}: unknown image format, skipping`);
                }
            } catch (uploadErr: any) {
                console.error(`Failed to upload image for ${c.name}: ${uploadErr.message}. Proceeding without this image.`);
            }
        }

        console.log(`Step 2 complete: ${allCharacterImageUrls.length} public URL(s) ready.`);

        // ========================================================
        // STEP 3: Stream image generation via SSE
        // ========================================================
        console.log('Step 3: Streaming images with nano-banana-2...');

        // Capture variables in closure for stream
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
                        const fullPrompt = pageDescriptions[i];

                        // Log each prompt
                        console.log(`\n=== PAGE ${i === 0 ? 'COVER' : i} PROMPT (${fullPrompt.length} chars) ===`);
                        console.log(fullPrompt);
                        console.log('=================================================');


                        const imageUrl = await generateImageWithKie(fullPrompt, allCharacterImageUrls);

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
