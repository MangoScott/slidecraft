# SlideCraft 🎨

**Turn any URL into a beautiful presentation with AI.**

SlideCraft is a modern web application that transforms articles, blog posts, and documentation into ready-to-present slide decks. It features a stunning physics-based UI and professional slide rendering.

![SlideCraft Demo](/Users/mangoscott/.gemini/antigravity/brain/cd0e1995-4db3-4445-950f-bd1eadfb7082/slidecraft_cards_landing_1764654810868.png)

## Features

- **URL to Slides**: Instantly convert web content into structured presentations
- **Physics UI**: Interactive floating "Slide Cards" you can drag and toss
- **AI-Powered**: Uses Google Gemini 1.5 Flash for intelligent summarization
- **Professional Rendering**: Built with `reveal.js` for smooth transitions
- **Export Ready**: Print to PDF support
- **Free to Use**: Built on Gemini's free tier

## Quick Start

1. **Clone the repo**:
   ```bash
   git clone https://github.com/yourusername/slidecraft.git
   cd slidecraft
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up API Key**:
   - Get a free key from [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create `.env.local`:
     ```
     GEMINI_API_KEY=your_key_here
     ```

4. **Run locally**:
   ```bash
   npm run dev
   ```

## Deployment

Ready to go live? Check out our [Deployment Guide](DEPLOYMENT.md) for step-by-step instructions on deploying to Vercel.

## Usage

1. **Enter a URL**: Paste any article, blog post, or webpage URL
2. **Add Notes** (optional): Provide context or specific points to highlight
3. **Generate Posts**: Click "Generate Posts" to create content for all platforms
4. **Switch Platforms**: Use tabs to view posts for Twitter, LinkedIn, and Instagram
5. **Edit**: Modify the generated text directly in the text area
6. **Copy**: Click "Copy" to copy the post to your clipboard
7. **Regenerate**: Click "Regenerate" to create a new variation

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Vanilla CSS with CSS Modules
- **AI**: Google Gemini 1.5 Flash (Free Tier)
- **Scraping**: Cheerio

## Project Structure

```
postpilot/
├── app/
│   ├── api/
│   │   ├── scrape/route.ts    # URL scraping endpoint
│   │   └── generate/route.ts  # AI generation endpoint
│   ├── globals.css            # Global styles & design system
│   ├── page.tsx               # Main application page
│   ├── page.module.css        # Page-specific styles
│   └── layout.tsx             # Root layout
├── public/                    # Static assets
├── .env.local                 # Environment variables (create this)
└── package.json
```

## API Routes

### POST /api/scrape
Scrapes content from a URL.

**Request**:
```json
{
  "url": "https://example.com/article"
}
```

**Response**:
```json
{
  "title": "Article Title",
  "description": "Article description",
  "image": "https://example.com/image.jpg",
  "content": "Main article content...",
  "url": "https://example.com/article"
}
```

### POST /api/generate
Generates a social media post for a specific platform.

**Request**:
```json
{
  "title": "Article Title",
  "description": "Article description",
  "content": "Main content",
  "url": "https://example.com",
  "notes": "Optional user notes",
  "platform": "twitter"
}
```

**Response**:
```json
{
  "post": "Generated social media post...",
  "platform": "twitter",
  "characterCount": 245
}
```

## Building for Production

```bash
npm run build
npm start
```

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
