import { NextResponse } from 'next/server';
import Replicate from 'replicate';

// Initialize Replicate client
// useFileOutput: false ensures we get plain URL strings back, not FileOutput objects
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

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { storyText, style, characters, characterImage } = body;

        // Build character list from the new format, or fallback to old format
        let characterList: CharacterData[] = [];
        if (Array.isArray(characters) && characters.length > 0) {
            characterList = characters;
        } else if (characterImage) {
            // Backward compatibility: old format with just one image
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

        console.log(`Starting generation. Style: ${style}, Characters: ${characterList.length}`);

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

        // Build a detailed character description string for LLaMA
        const characterDescriptions = characterList.map((c, i) => {
            return `Character ${i + 1}: "${c.name}" - Role: ${c.role}, Gender: ${c.gender}, Age: ${c.age}. A reference photo of this character is provided.`;
        }).join('\n');

        const llamaSystemPrompt = `You are a professional ${styleInstruction} scriptwriter. You create vivid, detailed panel-by-panel scripts for comic stories. You must output ONLY a valid JSON array of exactly 10 strings. No other text, no markdown, no explanation, no code fences. Just the raw JSON array.`;

        const llamaUserPrompt = `Create a 10-panel ${styleInstruction} story based on the following:

STORY CONCEPT: "${storyText}"

CHARACTERS:
${characterDescriptions}

CRITICAL RULES:
1. Output ONLY a valid JSON array of exactly 10 strings. Nothing else.
2. Each string is a detailed visual description of ONE comic panel (2-3 sentences).
3. You MUST mention each character BY NAME in the relevant panels.
4. Describe each character's physical appearance, clothing, and expressions in EVERY panel they appear in.
5. Include specific visual details: poses, facial expressions, backgrounds, lighting, camera angles.
6. The 10 panels must follow a clear narrative arc based on the story concept:
   - Panels 1-2: Setup and introduction
   - Panels 3-4: Rising action
   - Panels 5-6: Midpoint twist
   - Panels 7-8: Climax
   - Panels 9-10: Resolution
7. The story must be DIRECTLY about "${storyText}" - do not invent a different story.
8. Write all descriptions in English.

Output the JSON array now:`;

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

        console.log('LLaMA raw output (first 500 chars):', llamaText.substring(0, 500));

        // Parse the JSON array from LLaMA's output
        let panelDescriptions: string[] = [];
        try {
            // Try to extract JSON array from the response (LLaMA might add extra text)
            const jsonMatch = llamaText.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                panelDescriptions = JSON.parse(jsonMatch[0]);
            }
        } catch (parseError) {
            console.error('Failed to parse LLaMA output as JSON:', parseError);
        }

        // Fallback: if parsing failed, use the story text directly
        if (!Array.isArray(panelDescriptions) || panelDescriptions.length < 10) {
            console.warn('LLaMA parsing failed or returned < 10 panels. Using fallback.');
            const charNames = characterList.map(c => c.name).join(' and ');
            panelDescriptions = [
                `Opening scene: ${charNames} in the setting of "${storyText}". Wide establishing shot showing the environment and characters.`,
                `${characterList[0].name} reacts to an unexpected event. Close-up showing surprise and determination.`,
                `${charNames} takes action. Dynamic pose showing movement and energy.`,
                `An obstacle or antagonist appears, creating tension. Dramatic lighting with shadows.`,
                `A significant discovery or turning point. Medium shot of ${characterList[0].name} processing new information.`,
                `The stakes get higher. Action scene with dynamic movement between characters.`,
                `${characterList[0].name} faces the biggest challenge yet. Intense close-up showing struggle.`,
                `The climax: the most intense moment. Full dramatic impact with ${charNames}.`,
                `The immediate aftermath. ${characterList[0].name} catches their breath. Quieter mood.`,
                `Resolution: ${charNames} shown in the new status quo. Peaceful wide shot showing the outcome.`
            ];
        }

        // Ensure exactly 10 descriptions
        panelDescriptions = panelDescriptions.slice(0, 10);
        while (panelDescriptions.length < 10) {
            panelDescriptions.push(`A continuation scene featuring ${characterList[0].name} in the story "${storyText}".`);
        }

        console.log('Step 1 complete!', panelDescriptions.length, 'panel descriptions generated.');
        console.log('Panel 1 preview:', panelDescriptions[0].substring(0, 100));

        // ========================================================
        // STEP 2: Generate images one by one with nano-banana
        // ========================================================
        console.log('Step 2: Generating images with nano-banana...');

        const generatedImages: string[] = [];

        // Collect all character images for the image_input array
        const allCharacterImages = characterList.map(c => c.image);

        for (let i = 0; i < 10; i++) {
            const panelDesc = panelDescriptions[i];

            // Construct the full prompt: style keywords + LLaMA's scene description
            const fullPrompt = `${styleKeywords}. A single comic panel illustration. ${panelDesc}. The characters are visually consistent with the provided reference images. Maintain the same art style throughout.`;

            console.log(`Generating panel ${i + 1}/10...`);

            const output = await replicate.run(
                "google/nano-banana",
                {
                    input: {
                        prompt: fullPrompt,
                        image_input: allCharacterImages,
                        aspect_ratio: "3:4",
                        output_format: "jpg"
                    }
                }
            );

            // With useFileOutput: false, output is a plain URL string
            let imageUrl = '';
            if (typeof output === 'string') {
                imageUrl = output;
            } else if (output && typeof output === 'object' && 'url' in output) {
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
