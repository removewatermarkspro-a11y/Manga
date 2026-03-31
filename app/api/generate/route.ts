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

// Increase Vercel serverless function timeout (300s on Pro, 60s on Hobby)
// and body size limit for large base64 character images
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { storyText, style, characters, characterImage } = body;

        // Build character list from the new format, or fallback to old format
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

        console.log(`Starting generation. Style: ${style}, Characters: ${characterList.length}`);

        // ========================================================
        // STEP 1: Generate a coherent story script via LLaMA
        // ========================================================
        console.log('Step 1: Generating story script with LLaMA...');

        // Define stylistic keywords based on user selection
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

        // Build a detailed character description string for LLaMA
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

        // LLaMA returns an array of string chunks, join them
        let llamaText = '';
        if (Array.isArray(llamaOutput)) {
            llamaText = llamaOutput.join('');
        } else {
            llamaText = String(llamaOutput);
        }

        console.log('LLaMA raw output (first 500 chars):', llamaText.substring(0, 500));

        // Parse the JSON array from LLaMA's output
        let pageDescriptions: string[] = [];
        try {
            const jsonMatch = llamaText.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                pageDescriptions = JSON.parse(jsonMatch[0]);
            }
        } catch (parseError) {
            console.error('Failed to parse LLaMA output as JSON:', parseError);
        }

        // Fallback: if parsing failed, use the story text directly
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

        // Ensure exactly 11 descriptions (1 cover + 10 pages)
        pageDescriptions = pageDescriptions.slice(0, 11);
        while (pageDescriptions.length < 11) {
            pageDescriptions.push(`A continuation comic page featuring ${characterList[0].name} in the story "${storyText}". Multiple panels with dialogue.`);
        }

        console.log('Step 1 complete!', pageDescriptions.length, 'page descriptions generated (1 cover + 10 pages).');

        // ========================================================
        // STEP 2: Generate images one by one with nano-banana-2
        // ========================================================
        console.log('Step 2: Generating images with nano-banana-2...');

        const generatedImages: string[] = [];

        // Collect all character images for the image_input array
        const allCharacterImages = characterList.map(c => c.image);

        for (let i = 0; i < 11; i++) {
            const pageDesc = pageDescriptions[i];
            const isCover = i === 0;

            // Construct the full prompt
            let fullPrompt = '';
            if (isCover) {
                fullPrompt = `${styleKeywords}. A stunning comic book COVER PAGE illustration. ${pageDesc}. The characters must look exactly like the provided reference images. High quality, professional comic book cover design.`;
            } else {
                fullPrompt = `${styleKeywords}. A full comic book PAGE with 3-4 panels arranged in a dynamic layout. Each panel shows a different moment in the scene. Include speech bubbles with dialogue text. ${pageDesc}. The characters must look exactly like the provided reference images. Professional comic book page layout.`;
            }

            console.log(`Generating page ${i === 0 ? 'COVER' : i}/10...`);

            const output = await replicate.run(
                "google/nano-banana-2",
                {
                    input: {
                        prompt: fullPrompt,
                        image_input: allCharacterImages,
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
                imageUrl = String((output as any).url());
            } else {
                imageUrl = String(output);
            }

            console.log(`Page ${i === 0 ? 'COVER' : i} generated: ${imageUrl.substring(0, 80)}...`);
            generatedImages.push(imageUrl);
        }

        console.log('Generation complete!', generatedImages.length, 'images generated (1 cover + 10 pages).');

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
