import { NextResponse } from 'next/server';
import Replicate from 'replicate';

// Initialize Replicate client
// IMPORTANT: useFileOutput: false ensures we get plain URL strings back,
// not FileOutput objects that the frontend can't use.
const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN || '',
    useFileOutput: false,
});

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

        // ========================================================
        // STEP 1: Generate a coherent 10-panel story script via LLaMA
        // ========================================================
        console.log('Step 1: Generating story script with LLaMA...');

        // Define stylistic keywords based on user selection
        let styleKeywords = '';
        let styleInstruction = '';
        if (style === 'manga') {
            styleKeywords = 'black and white manga style, Japanese comic book illustration, dynamic ink lines, screentones, high contrast';
            styleInstruction = 'manga (Japanese black and white comic)';
        } else if (style === 'manhwa') {
            styleKeywords = 'full color Korean webtoon manhwa style, polished digital painting, vertical scrolling comic art, vibrant colors';
            styleInstruction = 'manhwa (Korean full-color webtoon)';
        } else if (style === 'comic') {
            styleKeywords = 'American comic book style, bold outlines, vibrant colors, dynamic superhero style illustration, halftone dots';
            styleInstruction = 'comic (American-style comic book)';
        }

        const llamaSystemPrompt = `You are a professional comic book scriptwriter. You must output ONLY a valid JSON array of exactly 10 strings, with no other text, no markdown, no explanation. Each string is a detailed visual description of one comic panel. The descriptions must form a coherent narrative arc with consistent characters, settings, and visual details throughout all 10 panels. Every panel description must mention the main character's appearance consistently so the image generator can maintain visual consistency.`;

        const llamaUserPrompt = `Write a 10-panel ${styleInstruction} story based on this concept: "${storyText}"

Rules:
- Output ONLY a JSON array of 10 strings. No other text.
- Each string must be a rich, detailed visual scene description (2-3 sentences).
- Describe the character's physical appearance consistently in every panel.
- Include specific details: poses, expressions, backgrounds, lighting, camera angles.
- The panels must follow a clear narrative arc: Setup → Conflict → Climax → Resolution.
- Write all descriptions in English.

Example format:
["Panel 1 description...", "Panel 2 description...", ..., "Panel 10 description..."]`;

        const llamaOutput = await replicate.run(
            "meta/meta-llama-3-8b-instruct",
            {
                input: {
                    prompt: llamaUserPrompt,
                    system_prompt: llamaSystemPrompt,
                    max_tokens: 2048,
                    temperature: 0.7,
                    top_p: 0.9,
                }
            }
        );

        // LLaMA returns an array of string chunks, join them
        let llamaText = '';
        if (Array.isArray(llamaOutput)) {
            llamaText = llamaOutput.join('');
        } else {
            llamaText = String(llamaOutput);
        }

        console.log('LLaMA raw output:', llamaText.substring(0, 500));

        // Parse the JSON array from LLaMA's output
        let panelDescriptions: string[] = [];
        try {
            // Try to extract JSON array from the response (LLaMA might add extra text)
            const jsonMatch = llamaText.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                panelDescriptions = JSON.parse(jsonMatch[0]);
            }
        } catch (parseError) {
            console.error('Failed to parse LLaMA output as JSON, using fallback:', parseError);
        }

        // Fallback: if parsing failed, use generic narrative beats
        if (!Array.isArray(panelDescriptions) || panelDescriptions.length < 10) {
            console.warn('LLaMA parsing failed or returned < 10 panels. Using fallback narrative beats.');
            panelDescriptions = [
                `Establishing shot: The main character stands in the setting of ${storyText}. Wide angle view showing the environment.`,
                `The inciting incident: Something unexpected happens that disrupts the character's normal life. Close-up on their surprised expression.`,
                `Rising action: The character begins to react and take action. Dynamic pose showing determination.`,
                `Complication: An obstacle or antagonist appears, creating tension. Dramatic lighting and shadows.`,
                `The midpoint: A significant discovery or turning point changes everything. Medium shot of the character processing new information.`,
                `Escalation: The stakes get higher. Action scene with dynamic movement and energy.`,
                `The crisis: The character faces their biggest challenge yet. Intense close-up showing struggle and emotion.`,
                `The climax: The most intense moment of confrontation or action. Full-page spread feeling with maximum dramatic impact.`,
                `Falling action: The immediate aftermath. The character catches their breath. Quieter, reflective mood.`,
                `Resolution: The final outcome. The character has changed. Peaceful wide shot showing the new status quo.`
            ];
        }

        // Ensure exactly 10 descriptions
        panelDescriptions = panelDescriptions.slice(0, 10);
        while (panelDescriptions.length < 10) {
            panelDescriptions.push(`A continuation scene of the story: ${storyText}. The character is shown in a new pose.`);
        }

        console.log('Step 1 complete! Generated', panelDescriptions.length, 'panel descriptions.');

        // ========================================================
        // STEP 2: Generate images one by one with nano-banana
        // ========================================================
        console.log('Step 2: Generating images with nano-banana...');

        const generatedImages: string[] = [];

        for (let i = 0; i < 10; i++) {
            const panelDesc = panelDescriptions[i];

            // Construct the full prompt combining style + LLaMA description
            const fullPrompt = `${styleKeywords}. A single comic panel illustration. ${panelDesc}. The main character is visually consistent with the provided reference image.`;

            console.log(`Generating panel ${i + 1}/10...`);

            const output = await replicate.run(
                "google/nano-banana",
                {
                    input: {
                        prompt: fullPrompt,
                        image_input: [characterImage],
                        aspect_ratio: "3:4",
                        output_format: "jpg"
                    }
                }
            );

            // With useFileOutput: false, output should be a plain URL string
            let imageUrl = '';
            if (typeof output === 'string') {
                imageUrl = output;
            } else if (output && typeof output === 'object' && 'url' in output) {
                // Fallback for FileOutput objects
                imageUrl = String((output as any).url());
            } else {
                imageUrl = String(output);
            }

            console.log(`Panel ${i + 1} generated: ${imageUrl.substring(0, 80)}...`);
            generatedImages.push(imageUrl);
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
