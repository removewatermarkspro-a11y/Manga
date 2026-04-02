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
// Upload base64 image to telegra.ph (Telegram CDN) and return a public URL.
// No API key needed — free, reliable, works from Vercel.
async function uploadBase64ToPublicUrl(base64Str: string): Promise<string> {
    const rawB64 = base64Str.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(rawB64, 'base64');

    console.log(`Uploading image to telegra.ph (${Math.round(buffer.length / 1024)}KB)...`);

    // Build multipart form with the image as a file
    const blob = new Blob([new Uint8Array(buffer)], { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', blob, 'character.jpg');

    const res = await fetchWithRetry(
        'https://telegra.ph/upload',
        {
            method: 'POST',
            body: formData,
        },
        3,
        20000
    );

    if (!res.ok) {
        const text = await res.text().catch(() => 'no body');
        throw new Error(`Telegraph upload failed: HTTP ${res.status} — ${text.substring(0, 200)}`);
    }

    const data = await res.json();
    // Response: [{"src": "/file/abcdef123.jpg"}]
    if (Array.isArray(data) && data[0]?.src) {
        const publicUrl = `https://telegra.ph${data[0].src}`;
        console.log(`Telegraph upload success: ${publicUrl}`);
        return publicUrl;
    }
    // Error response: {"error": "..."}  
    throw new Error(`Telegraph upload failed: ${JSON.stringify(data).substring(0, 200)}`);
}

// -------------------------------------------------------------------------------------------------
// Kie API helper for nano-banana-2
async function generateImageWithKie(prompt: string, imageUrls: string[]): Promise<string> {
    const KIE_API_KEY = "0ebb274e201da9dd3487833efa368f65";

    console.log(`Kie createTask — prompt: ${prompt.length} chars, images: ${imageUrls.length}`);

    const inputPayload: Record<string, any> = {
        prompt,
        aspect_ratio: "3:4",
        resolution: "1K",
        output_format: "jpg"
    };
    if (imageUrls.length > 0) inputPayload.image_input = imageUrls;

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
                input: inputPayload
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
        const llamaSystemPrompt = `You are a ${styleInstruction} comic book artist. You describe exactly what to draw. Focus ONLY on visuals: characters, poses, expressions, backgrounds, lighting, dialogue in speech bubbles. Never write narrative or plot summaries.`;

        const llamaUserPrompt = `Write a visual script for an 11-page ${styleInstruction} comic book.

STORY: "${storyText}"
CHARACTERS: ${characterRoles}

FIRST, write a CHARACTER APPEARANCE section describing EACH character's physical look. This ensures they look the same on every page. Use this format:

CHARACTER APPEARANCE:
- ${characterList[0]?.name || 'Hero'}: [describe their hair color and style, skin tone, eye color, clothing they wear throughout the story, any distinctive features]
${characterList.length > 1 ? `- ${characterList[1].name}: [same details]` : ''}

THEN, write the script using this EXACT format:

PAGE 0: [Cover page — single dramatic illustration of ${characterNames} with the title "${storyText}" in large stylized text. No panels.]
PAGE 1: [Opening scene]
PAGE 2: [Continue introduction]
PAGE 3: [A problem or conflict]
PAGE 4: [Tension grows]
PAGE 5: [A twist]
PAGE 6: [Characters react]
PAGE 7: [Climax begins]
PAGE 8: [Peak action]
PAGE 9: [Resolution]
PAGE 10: [Ending]

For each page, describe in 2-3 sentences:
- The SETTING (location, time of day, atmosphere)
- The CHARACTERS (pose, expression, what they're doing) — always use their names
- The DIALOGUE (exact speech bubble text in quotes)

IMPORTANT: Keep the SAME clothing and appearance for each character across ALL pages. Under 80 words per page.`;

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
        console.log('Step 2: Uploading character images to telegra.ph...');

        const allCharacterImageUrls: string[] = [];
        for (let ci = 0; ci < characterList.length; ci++) {
            const c = characterList[ci];
            try {
                if (c.image.startsWith('data:image') || c.image.startsWith('/9j/')) {
                    console.log(`Uploading character ${ci + 1} (${c.name}) to telegra.ph...`);
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
        // Each prompt includes: art style + character appearance + scene + reference photo instruction
        // ========================================================

        // Detailed art style prefix — IDENTICAL for all 11 images
        const artStyle = style === 'manga'
            ? 'Professional manga illustration, clean sharp black ink linework, detailed screentones and hatching, high contrast black and white, dynamic panel layout with gutters, expressive faces, speed lines for action'
            : style === 'manhwa'
            ? 'Professional manhwa webtoon illustration, polished digital coloring, soft cell-shading, vivid saturated colors, clean linework, beautiful detailed backgrounds, dynamic panel layout'
            : 'Professional American comic book illustration, bold confident ink outlines, vibrant flat colors with halftone shading, dramatic lighting, dynamic panel layout with gutters';

        // Extract CHARACTER APPEARANCE description from LLaMA output (if present)
        // This ensures each prompt has the exact same character look
        let characterAppearance = '';
        const appearanceMatch = llamaText.match(/CHARACTER APPEARANCE:([\s\S]*?)(?=PAGE 0:|$)/);
        if (appearanceMatch) {
            characterAppearance = appearanceMatch[1].trim();
            console.log(`Character appearance extracted: ${characterAppearance.substring(0, 200)}`);
        } else {
            // Fallback: basic description
            characterAppearance = characterList.map(c => `${c.name} (${c.role})`).join(', ');
            console.log('No CHARACTER APPEARANCE section found in LLaMA output, using fallback.');
        }

        const kiePrompts: string[] = pageDescriptions.map((desc, i) => {
            const words = desc.split(/\s+/);
            const shortDesc = words.slice(0, 50).join(' ');

            // Character consistency block — repeated in EVERY prompt
            const charBlock = `Characters: ${characterAppearance}. The characters must look EXACTLY like the people in the reference photos provided — same face, same hair, same skin tone.`;

            if (i === 0) {
                return `${artStyle}. Single cover illustration, no panels. ${shortDesc}. ${charBlock}`;
            } else {
                return `${artStyle}. Full comic page with multiple panels and speech bubbles. ${shortDesc}. ${charBlock}`;
            }
        });

        console.log(`Step 3: 11 Kie prompts built.`);
        console.log(`Art style: ${artStyle.substring(0, 80)}...`);
        console.log(`Character block: ${characterAppearance.substring(0, 120)}...`);
        kiePrompts.forEach((p, i) => console.log(`  Prompt ${i} (${p.length} chars): ${p.substring(0, 200)}...`));

        // ========================================================
        // STEP 4: Stream images — PARALLEL batches of 3 to avoid 300s timeout
        // Sequential: 11 × 30s = 330s (TIMEOUT)
        // Parallel (3): 4 batches × 30s = 120s (OK)
        // ========================================================
        console.log('Step 4: Generating images in parallel batches...');

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

                const generatedImages: (string | null)[] = new Array(11).fill(null);

                try {
                    const BATCH_SIZE = 3;
                    const totalBatches = Math.ceil(11 / BATCH_SIZE);

                    for (let batch = 0; batch < totalBatches; batch++) {
                        const start = batch * BATCH_SIZE;
                        const end = Math.min(start + BATCH_SIZE, 11);
                        console.log(`\n--- Batch ${batch + 1}/${totalBatches}: pages ${start}-${end - 1} ---`);

                        // Launch all pages in this batch in PARALLEL
                        const batchPromises = [];
                        for (let i = start; i < end; i++) {
                            batchPromises.push(
                                generateImageWithKie(kiePrompts[i], allCharacterImageUrls)
                                    .then(url => ({ index: i, url, error: null as string | null }))
                                    .catch(err => ({ index: i, url: null as string | null, error: err.message as string }))
                            );
                        }

                        const results = await Promise.all(batchPromises);

                        // Stream results to client (ordered by page)
                        for (const r of results.sort((a, b) => a.index - b.index)) {
                            if (r.url) {
                                console.log(`Page ${r.index === 0 ? 'COVER' : r.index} done: ${r.url.substring(0, 60)}...`);
                                generatedImages[r.index] = r.url;
                                encode({ type: 'image', url: r.url, page: r.index });

                                if (!_isTesting && _creationId) {
                                    await _supabase.from('creation_pages').insert({
                                        creation_id: _creationId,
                                        page_number: r.index,
                                        image_url: r.url,
                                    });
                                }
                            } else {
                                console.error(`Page ${r.index} FAILED: ${r.error}`);
                                encode({ type: 'error', page: r.index, message: r.error });
                            }
                        }
                    }

                    // Finalize
                    const successCount = generatedImages.filter(Boolean).length;
                    if (!_isTesting && _creationId && _profile && _user) {
                        await _supabase.from('creations').update({ status: 'completed' }).eq('id', _creationId);
                        await _supabase.from('profiles').update({ credits: _profile.credits - 1 }).eq('id', _user.id);
                    }

                    console.log(`Generation complete! ${successCount}/11 images generated.`);
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
