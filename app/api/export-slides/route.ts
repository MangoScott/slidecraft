import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { presentation, template, accentColor } = body;

        if (!presentation || !presentation.slides) {
            return NextResponse.json(
                { error: 'Invalid presentation data' },
                { status: 400 }
            );
        }

        // For now, we'll create a simple text-based export
        // In a full implementation, this would use the Google Slides API
        // which requires OAuth authentication and API credentials

        // Create a formatted text version that can be copied to Google Slides
        const textContent = formatPresentationForSlides(presentation, template, accentColor);

        // Return instructions for manual import
        // In production, this would create an actual Google Slides presentation
        return NextResponse.json({
            success: true,
            message: 'Google Slides export is coming soon! For now, you can use the PDF export.',
            textContent,
            // This would be the actual presentation URL in production
            presentationUrl: null,
            instructions: [
                '1. Download the PDF version',
                '2. Go to Google Slides and create a new presentation',
                '3. Use File > Import slides to import from the PDF',
                'Or use a third-party tool to convert PDF to Google Slides'
            ]
        });

    } catch (error) {
        console.error('Error exporting to Google Slides:', error);
        return NextResponse.json(
            { error: 'Failed to export to Google Slides. Please try the PDF export instead.' },
            { status: 500 }
        );
    }
}

function formatPresentationForSlides(presentation: any, template: string, accentColor: string): string {
    let content = `# ${presentation.title}\n\n`;
    content += `Template: ${template}\n`;
    content += `Accent Color: ${accentColor}\n\n`;
    content += `---\n\n`;

    presentation.slides.forEach((slide: any, index: number) => {
        content += `## Slide ${index + 1}\n`;
        content += `Type: ${slide.type}\n`;
        content += `Title: ${slide.title || 'Untitled'}\n`;

        if (slide.subtitle) {
            content += `Subtitle: ${slide.subtitle}\n`;
        }

        if (slide.text) {
            content += `Text: ${slide.text}\n`;
        }

        if (slide.items && Array.isArray(slide.items)) {
            content += `Items:\n`;
            slide.items.forEach((item: string) => {
                content += `  - ${item}\n`;
            });
        }

        content += `\n---\n\n`;
    });

    return content;
}
