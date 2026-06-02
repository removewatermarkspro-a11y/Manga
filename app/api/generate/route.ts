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
// Generate an image using Replicate's openai/gpt-image-2
// input_images accepts data URIs directly — no external CDN upload needed!
async function generateImageWithGpt(
    replicateClient: Replicate,
    prompt: string,
    characterDataUrls: string[]
): Promise<string> {
    console.log(`GPT-image-2 via Replicate — prompt: ${prompt.length} chars, input_images: ${characterDataUrls.length}`);

    const input: Record<string, any> = {
        prompt,
        aspect_ratio: "2:3",
        quality: "medium",
        output_format: "webp",
        number_of_images: 1,
        moderation: "low",
    };

    if (characterDataUrls.length > 0) {
        input.input_images = characterDataUrls;
    }

    const output = await replicateClient.run("openai/gpt-image-2", { input });

    if (Array.isArray(output) && output.length > 0 && typeof output[0] === 'string') {
        console.log(`GPT-image-2 result: ${(output[0] as string).substring(0, 80)}...`);
        return output[0] as string;
    }

    throw new Error(`GPT-image-2: unexpected output: ${JSON.stringify(output).substring(0, 200)}`);
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
        // IMPORTANT: Do NOT ask LLaMA to describe character physical appearance.
        // The user uploads selfies, and GPT-image-2 will use those reference photos.
        // If LLaMA invents appearances (e.g. "brown hair, blue eyes"), it OVERRIDES the photos.
        const llamaSystemPrompt = `You are a ${styleInstruction} comic book artist. You describe exactly what to draw: scenes, poses, expressions, backgrounds, lighting, dialogue in speech bubbles. NEVER describe character physical appearance (hair color, eye color, skin tone, body type) — reference photos are provided separately. Only use character names.`;

        // 6 pages total (cover + 5) to fit within Vercel Hobby 60s timeout
        const TOTAL_PAGES = 6;

        const llamaUserPrompt = `Write a visual script for a 6-page ${styleInstruction} comic book.

STORY: "${storyText}"
CHARACTERS: ${characterRoles}

IMPORTANT RULE: Do NOT describe any character's physical appearance (no hair color, eye color, skin tone, height, clothing description). Reference photos will be provided separately. Just use the character names.

Write the script using this EXACT format:

PAGE 0: [Cover page — single dramatic illustration of ${characterNames} with the title "${storyText}" in large stylized text. No panels.]
PAGE 1: [Opening scene — introduce characters and setting]
PAGE 2: [Conflict — a problem or challenge appears]
PAGE 3: [Climax — peak action and tension]
PAGE 4: [Resolution — the conflict is resolved]
PAGE 5: [Ending — emotional conclusion]

For each page, describe in 2-3 sentences:
- The SETTING (location, time of day, atmosphere)
- The CHARACTERS (pose, expression, what they're doing) — use their names, NOT physical descriptions
- The DIALOGUE (exact speech bubble text in quotes)

IMPORTANT: Under 80 words per page. Never mention hair color, eye color, skin tone, or clothing.`;

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
        for (let p = 0; p < TOTAL_PAGES; p++) {
            const marker = `PAGE ${p}:`;
            const nextMarker = p < TOTAL_PAGES - 1 ? `PAGE ${p + 1}:` : null;
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
        // STEP 2: Collect character images as data URIs
        // Replicate's openai/gpt-image-2 accepts data URIs natively in input_images
        // No external CDN upload needed!
        // ========================================================
        console.log('Step 2: Collecting character image data URIs...');

        const characterDataUrls: string[] = [];
        for (const c of characterList) {
            if (c.image && (c.image.startsWith('data:image') || c.image.startsWith('/9j/'))) {
                // Ensure proper data URI format
                const dataUrl = c.image.startsWith('data:') ? c.image : `data:image/jpeg;base64,${c.image}`;
                characterDataUrls.push(dataUrl);
                console.log(`Character ${c.name}: data URI ready (${Math.round(dataUrl.length / 1024)}KB)`);
            } else if (c.image && c.image.startsWith('http')) {
                characterDataUrls.push(c.image);
                console.log(`Character ${c.name}: URL ready`);
            } else {
                console.warn(`Character ${c.name}: no valid image, skipping`);
            }
        }

        console.log(`Step 2 complete: ${characterDataUrls.length} character image(s) ready for GPT-image-2.`);

        // ========================================================
        // STEP 3: Build GPT-image-2 prompts from the script
        // ========================================================

        // Detailed art style prefix — IDENTICAL for all pages
        const artStyle = style === 'manga'
            ? 'Professional manga illustration, clean sharp black ink linework, detailed screentones and hatching, high contrast black and white, dynamic panel layout with gutters, expressive faces, speed lines for action'
            : style === 'manhwa'
            ? 'Professional manhwa webtoon illustration, polished digital coloring, soft cell-shading, vivid saturated colors, clean linework, beautiful detailed backgrounds, dynamic panel layout'
            : 'Professional American comic book illustration, bold confident ink outlines, vibrant flat colors with halftone shading, dramatic lighting, dynamic panel layout with gutters';

        // The user's uploaded selfies are passed as input_images to GPT-image-2
        // The prompt tells the model to use those photos as reference

        // Build character name/role list (NO physical descriptions)
        const characterNamesRoles = characterList.map(c => `${c.name} (${c.role})`).join(', ');

        const imagePrompts: string[] = pageDescriptions.map((desc, i) => {
            const words = desc.split(/\s+/);
            const shortDesc = words.slice(0, 50).join(' ');

            // Photo-first character block — NO invented physical descriptions
            // This tells GPT-image-2 to use the input_urls reference photos as the ground truth
            const charBlock = `Characters: ${characterNamesRoles}. CRITICAL: The characters MUST look EXACTLY like the people in the reference input photos. Copy their exact face, facial features, skin tone, hair color, hair style, and body type from the photos. This is a photo-to-${styleInstruction} transformation — the illustrated characters must be clearly recognizable as the same people from the input photos. Do NOT invent or change any physical features.`;

            if (i === 0) {
                return `${artStyle}. Single cover illustration, no panels. ${shortDesc}. ${charBlock}`;
            } else {
                return `${artStyle}. Full comic page with multiple panels and speech bubbles. ${shortDesc}. ${charBlock}`;
            }
        });

        console.log(`Step 3: ${TOTAL_PAGES} GPT-image-2 prompts built.`);
        console.log(`Art style: ${artStyle.substring(0, 80)}...`);
        console.log(`Character names/roles: ${characterNamesRoles}`);
        console.log(`Character images count: ${characterDataUrls.length}`);
        imagePrompts.forEach((p, i) => console.log(`  Prompt ${i} (${p.length} chars): ${p.substring(0, 200)}...`));

        // ========================================================
        // STEP 4: Generate ALL pages in parallel via Replicate GPT-image-2
        // replicate.run() handles polling internally — much simpler than KIE
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

                const generatedImages: (string | null)[] = new Array(TOTAL_PAGES).fill(null);

                try {
                    const BATCH_SIZE = TOTAL_PAGES; // All pages in one batch
                    const totalBatches = Math.ceil(TOTAL_PAGES / BATCH_SIZE);

                    for (let batch = 0; batch < totalBatches; batch++) {
                        const start = batch * BATCH_SIZE;
                        const end = Math.min(start + BATCH_SIZE, TOTAL_PAGES);
                        console.log(`\n--- Batch ${batch + 1}/${totalBatches}: pages ${start}-${end - 1} ---`);

                        // Launch all pages in this batch in PARALLEL
                        const batchPromises = [];
                        for (let i = start; i < end; i++) {
                            batchPromises.push(
                                generateImageWithGpt(replicate, imagePrompts[i], characterDataUrls)
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

                    console.log(`Generation complete! ${successCount}/${TOTAL_PAGES} images generated.`);
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
