import { NextResponse } from 'next/server';
import Replicate from 'replicate';

// Initialize Replicate client
// It will automatically use the REPLICATE_API_TOKEN environment variable if set,
// or we can pass it directly since we have the key.
const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN || '',
});

// A narrative arc helper to give each panel a specific narrative beat.
const narrativeBeats = [
    "The beginning: Establishing shot, setting the scene.",
    "The inciting incident: A sudden event or realization occurs.",
    "Rising action: The character takes their first steps or reacts to the situation.",
    "Complication: An obstacle appears or tension builds.",
    "The midpoint: A significant shift or discovery in the situation.",
    "Escalation: Tensions rise as the character faces mounting challenges.",
    "The crisis: The character struggles or faces their biggest challenge yet.",
    "The climax: The most intense moment of action, emotion, or confrontation.",
    "Falling action: The immediate aftermath of the climax, catching their breath.",
    "Resolution: The final outcome, showing the result of their journey."
];

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { storyText, style, characterImage } = body;

        if (!storyText || !style || !characterImage) {
            return NextResponse.json(
                { error: 'Missing required fields: storyText, style, or characterImage' },
                { status: 400 }
            );
        }

        console.log(`Starting generation for 10 panels. Style: ${style}`);

        // Define stylistic keywords based on user selection
        let styleKeywords = '';
        if (style === 'manga') {
            styleKeywords = 'black and white manga style, Japanese comic book illustration, dynamic ink lines, screentones';
        } else if (style === 'manhwa') {
            styleKeywords = 'full color Korean webtoon manhwa style, polished digital painting, vertical scrolling comic art';
        } else if (style === 'comic') {
            styleKeywords = 'American comic book style, bold outlines, vibrant colors, dynamic superhero style illustration';
        }

        // Generate 10 panels
        // We will execute a few at a time to avoid heavy rate limiting
        const generatedImages: string[] = [];

        // For V1, we will do Promise.all since google/nano-banana-2 is very fast.
        // It might be safer to do them sequentially or in batches if Replicate complains about concurrency limits.
        // generate one by one to avoid Replicate's "High demand / concurrency" limits.
        const batchSize = 1;
        for (let i = 0; i < 10; i += batchSize) {
            const batchPromises = [];
            for (let j = 0; j < batchSize && (i + j) < 10; j++) {
                const panelIndex = i + j;
                const narrativeBeat = narrativeBeats[panelIndex];
                
                // Construct the full prompt
                const fullPrompt = `${styleKeywords}. A single comic panel. ${narrativeBeat} The main character is visually consistent with the input image. The story setting: ${storyText}.`;

                const promise = replicate.run(
                    "google/nano-banana",
                    {
                        input: {
                            prompt: fullPrompt,
                            image_input: [characterImage], // use the uploaded character base64
                            aspect_ratio: "3:4", // Good typical portrait aspect ratio for comic panels
                            output_format: "jpg"
                        }
                    }
                ).then(output => {
                    // Replicate usually returns an array of URIs for image models, or a single URI string depending on the exact schema
                    // The nano-banana-2 schema indicates it returns a single string URI:
                    // "https://replicate.delivery/..."
                    return output as unknown as string;
                });
                
                batchPromises.push(promise);
            }

            console.log(`Waiting for batch ${i / batchSize + 1}...`);
            const batchResults = await Promise.all(batchPromises);
            generatedImages.push(...batchResults);
        }

        console.log('Generation complete!', generatedImages.length, 'images generated.');

        return NextResponse.json({ images: generatedImages });
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
