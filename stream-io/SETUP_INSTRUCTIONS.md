# 🚀 StreamGuide Quick Setup Guide

## ✅ Issue: "No featured content available"

Your app is running but showing blank content because the **TMDB API key is missing**. Here's how to fix it:

## 🔑 Step 1: Get Your TMDB API Key (Required)

1. Go to [TMDB Registration](https://www.themoviedb.org/signup)
2. Create a free account (takes 30 seconds)
3. Go to **Settings** → **API** → **Request an API Key**
4. Choose **Developer** option
5. Copy the **"API Read Access Token"** (NOT the API Key)
   - It should look like: `eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJ...`

## ⚙️ Step 2: Configure Environment

1. Open the `.env.local` file I just created
2. Replace `your_tmdb_access_token_here` with your actual token:
   ```
   VITE_TMDB_ACCESS_TOKEN=eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJ...
   ```

## 🌟 Step 3: Get AI Features (Optional but Recommended)

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with Google account
3. Click **"Create API key"**
4. Copy the 40-character key
5. Add it to `.env.local`:
   ```
   VITE_GEMINI_API_KEY=your_gemini_key_here
   ```

## 🚀 Step 4: Start the App

Run in your terminal:
```bash
npm run dev
```

This will start both the backend (port 3001) and frontend (port 5173).

## ✅ Expected Result

After setup, you should see:
- Movie and TV show content loading
- Working search functionality
- Streaming service information
- AI-powered search (if Gemini key is configured)

## 🆘 Need Help?

- **TMDB Issues**: Check [TMDB API Docs](https://developer.themoviedb.org/docs)
- **AI Features**: Check [Gemini API Docs](https://ai.google.dev/gemini-api/docs)
- **App Issues**: Check browser console (F12) for error messages

---

**Note**: The app works with just the TMDB key. AI features are optional but enhance the experience significantly! 