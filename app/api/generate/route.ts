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

export async function POST(request: NextRequest) {
    try {
        const { title, description, content, url, notes }: GenerateRequest =
            await request.json();

        if (!title && !description && !content) {
            return NextResponse.json(
                { error: 'Content is required' },
                { status: 400 }
            );
        }

        if (!genAI) {
            return NextResponse.json(
                { error: 'Gemini API key not configured. Please add GEMINI_API_KEY to .env.local' },
                { status: 500 }
            );
        }

        const prompt = `You are a professional presentation designer.
Create a structured presentation based on this content:

Title: ${title}
Description: ${description}
Main Content: ${content.substring(0, 2000)}
URL: ${url}
${notes ? `\nUser Notes: ${notes}` : ''}

Generate a JSON response representing a slide deck with 5-8 slides.
The structure must be exactly:
{
  "presentation": {
    "title": "Main Presentation Title",
    "slides": [
      {
        "type": "title",
        "title": "Slide Title",
        "subtitle": "Subtitle",
        "notes": "Speaker notes"
      },
      {
        "type": "content",
        "title": "Slide Title",
        "content": ["Bullet point 1", "Bullet point 2", "Bullet point 3"],
        "notes": "Speaker notes"
      }
    ]
  }
}

Requirements:
- First slide must be type "title"
- Last slide should be type "content" (Conclusion/Takeaways)
- Content slides should have 3-5 concise bullet points
- Speaker notes should be conversational and helpful
- JSON must be valid and parseable

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
    } catch (error: any) {
        console.error('Generation error:', error);

        if (error?.message?.includes('API key')) {
            return NextResponse.json(
                { error: 'Invalid API key. Please check your Gemini API key in .env.local' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to generate presentation: ' + (error?.message || 'Unknown error') },
            { status: 500 }
        );
    }
}
