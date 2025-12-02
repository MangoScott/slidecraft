import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

interface GenerateRequest {
    title: string;
    description: string;
    content: string;
    url: string;
    notes?: string;
}

export async function POST(req: Request) {
    try {
        const { title, description, content, notes, url } = await req.json();

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || !genAI) {
            return NextResponse.json(
                { error: 'Gemini API key not configured. Please add GEMINI_API_KEY to .env.local' },
                { status: 500 }
            );
        }

        const prompt = `
    You are an expert presentation designer. Create a structured presentation based on the following content:
    
    Title: ${title}
    Description: ${description}
    Content: ${content ? content.substring(0, 3000) : ''}
    User Notes: ${notes}
    
    Generate a JSON object with a 'presentation' key containing:
    1. 'title': The main title of the deck.
    2. 'slides': An array of 5-8 slides.
    
    Each slide MUST have a 'type' and specific fields based on the type. Use a variety of these types to make the deck engaging:
    
    Types:
    - 'title': { type: 'title', title: string, subtitle: string, keywords: string[] (5 single words) }
    - 'statement': { type: 'statement', text: string (powerful single sentence) }
    - 'quote': { type: 'quote', text: string, author: string }
    - 'big-number': { type: 'big-number', number: string (e.g. "42%", "$1M"), label: string, detail: string }
    - 'two-column': { type: 'two-column', title: string, left: string[] (3-4 bullet points), right: string[] (3-4 bullet points) }
    - 'grid': { type: 'grid', title: string, items: { icon: string (emoji), label: string }[] (4 items) }
    - 'split': { type: 'split', left: { title: string, value: string, label: string }, right: { title: string, value: string, label: string } } (Use for comparisons like Before/After)
    - 'end': { type: 'end', title: string, cta: string }

    Ensure the content is concise, professional, and impactful.
    
    Generate ONLY the JSON, no markdown formatting or explanations.`;

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let generatedText = response.text().trim();

        // Clean up markdown code blocks if present
        if (generatedText.startsWith('```json')) {
            generatedText = generatedText.replace(/^```json\n/, '').replace(/\n```$/, '');
        } else if (generatedText.startsWith('```')) {
            generatedText = generatedText.replace(/^```\n/, '').replace(/\n```$/, '');
        }

        let presentationData;
        try {
            presentationData = JSON.parse(generatedText);
        } catch (e) {
            console.error('Failed to parse JSON:', generatedText);
            return NextResponse.json(
                { error: 'Failed to generate valid presentation data' },
                { status: 500 }
            );
        }

        return NextResponse.json(presentationData);

    } catch (error: unknown) {
        console.error('Generation error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        if (errorMessage.includes('API key')) {
            return NextResponse.json(
                { error: 'Invalid API key. Please check your Gemini API key in .env.local' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to generate presentation: ' + errorMessage },
            { status: 500 }
        );
    }
}
