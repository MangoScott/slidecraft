import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Dynamic import to avoid build-time issues
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pdfParse = await import('pdf-parse') as any;
        const pdf = pdfParse.default || pdfParse;
        const data = await pdf(buffer);

        return NextResponse.json({ text: data.text });
    } catch (error: unknown) {
        console.error('PDF Parse Error:', error);
        return NextResponse.json({ error: 'Failed to parse PDF' }, { status: 500 });
    }
}
