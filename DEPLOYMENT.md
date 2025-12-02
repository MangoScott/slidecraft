# Deploying SlideCraft to Production

This guide will help you deploy SlideCraft to **Vercel**, the best platform for Next.js applications.

## Prerequisites

1. A [GitHub](https://github.com) account
2. A [Vercel](https://vercel.com) account (you can sign up with GitHub)
3. Your **Google Gemini API Key**

---

## Step 1: Push to GitHub

First, we need to get your code onto GitHub.

1. **Create a new repository** on GitHub (e.g., named `slidecraft`).
2. **Push your code**:
   ```bash
   # Initialize git if you haven't already
   git init
   
   # Add all files
   git add .
   
   # Commit
   git commit -m "Initial commit: SlideCraft MVP"
   
   # Link to your new repo (replace YOUR_USERNAME)
   git remote add origin https://github.com/YOUR_USERNAME/slidecraft.git
   
   # Push
   git push -u origin main
   ```

---

## Step 2: Deploy on Vercel

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **"Add New..."** -> **"Project"**.
3. Import your `slidecraft` repository.
4. In the **Configure Project** screen:
   - **Framework Preset**: Next.js (should be auto-detected)
   - **Root Directory**: `./` (default)
   
5. **Environment Variables** (Crucial Step!):
   - Expand the "Environment Variables" section.
   - Add a new variable:
     - **Key**: `GEMINI_API_KEY`
     - **Value**: Your actual API key (starts with `AIza...`)
   - Click **Add**.

6. Click **Deploy**.

---

## Step 3: Verify & Share

Vercel will build your project (this takes about a minute). Once done:

1. You'll get a live URL (e.g., `https://slidecraft.vercel.app`).
2. Visit the URL and test it out!
3. **Share it!** Your app is now live and accessible to the world.

---

## Troubleshooting

- **500 Error on Generation**: This usually means the API key is missing or invalid. Check your Vercel project settings > Environment Variables.
- **Build Failed**: Check the "Logs" tab in Vercel. If it works locally with `npm run build`, it should work on Vercel.

## Frequently Asked Questions

### Can I host this on GitHub Pages?
**No.** GitHub Pages only hosts "static" websites (HTML/CSS/JS). SlideCraft uses **server-side API routes** to:
1. Securely talk to Google Gemini (hiding your API key)
2. Scrape websites (avoiding CORS errors)

These features require a server, which Vercel provides for free (via "Serverless Functions"). GitHub Pages cannot run these.

### Is Vercel really free?
Yes, the "Hobby" plan is free forever for personal projects.

## Next Steps

- **Custom Domain**: You can add a custom domain (like `slidecraft.com`) in Vercel settings.
- **Analytics**: Enable Vercel Analytics to see how many people use your app.
