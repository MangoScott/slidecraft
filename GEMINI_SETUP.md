# Getting Your Free Gemini API Key

Follow these steps to get your free Google Gemini API key:

## Step 1: Visit Google AI Studio

Go to: **https://aistudio.google.com/app/apikey**

## Step 2: Sign In

- Sign in with your Google account
- If you don't have one, create a free Google account

## Step 3: Create API Key

1. Click **"Create API Key"** button
2. Select **"Create API key in new project"** (or choose an existing project)
3. Your API key will be generated instantly

## Step 4: Copy Your API Key

- Copy the API key that appears (it starts with `AIza...`)
- **Important**: Keep this key secure and don't share it publicly

## Step 5: Add to PostPilot

1. In the `postpilot` folder, create a file called `.env.local`
2. Add this line:
   ```
   GEMINI_API_KEY=AIza...your-actual-key-here
   ```
3. Save the file

## Step 6: Restart the Server

If the dev server is running, restart it:
```bash
# Press Ctrl+C to stop the server
npm run dev
```

## Free Tier Limits

Google Gemini's free tier is very generous:
- **15 requests per minute**
- **1 million tokens per day**
- **1,500 requests per day**

This is more than enough for personal use!

## Troubleshooting

If you get an error:
- Make sure the `.env.local` file is in the `postpilot` folder (not a subfolder)
- Make sure there are no spaces around the `=` sign
- Make sure you copied the entire API key
- Restart the dev server after creating the file

## Security Note

Never commit `.env.local` to git - it's already in `.gitignore` to protect your key.
