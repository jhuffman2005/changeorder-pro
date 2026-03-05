# ChangeOrder Pro — Deployment Guide

## Get a live URL in 5 minutes (free)

### Step 1: Create a GitHub account (if you don't have one)
Go to github.com → Sign up (free)

### Step 2: Create a new repository
1. Click the "+" icon top right → "New repository"
2. Name it: `changeorder-pro`
3. Set to **Public**
4. Click "Create repository"

### Step 3: Upload these files
1. On your new repo page, click "uploading an existing file"
2. Drag ALL files from this folder into the upload area
   - Make sure to maintain the folder structure:
     - `index.html`
     - `package.json`
     - `vite.config.js`
     - `src/App.jsx`
     - `src/main.jsx`
     - `public/manifest.json`
3. Click "Commit changes"

### Step 4: Deploy on Vercel
1. Go to vercel.com → Sign up with your GitHub account
2. Click "Add New Project"
3. Select your `changeorder-pro` repository
4. Click "Deploy" (Vercel auto-detects Vite/React — no config needed)
5. Wait ~60 seconds

### Step 5: Get your live URL
Vercel gives you a URL like: `https://changeorder-pro.vercel.app`

**That's it. Open it on your phone. Bookmark it. Works like an app.**

### Optional: Add to iPhone Home Screen
1. Open the URL in Safari
2. Tap the Share button (box with arrow)
3. Scroll down → "Add to Home Screen"
4. Tap "Add"

Now it has its own icon on your home screen and opens fullscreen like a native app.

---

## Adding your Anthropic API key

The app calls the Anthropic API directly. For the prototype it uses the proxy built into Claude.ai.

For your production app:
1. Go to console.anthropic.com → get your API key
2. In Vercel dashboard → your project → Settings → Environment Variables
3. Add: `VITE_ANTHROPIC_KEY` = your key
4. Update the fetch call in App.jsx to include: `"x-api-key": import.meta.env.VITE_ANTHROPIC_KEY`

---

## Subscription / payments (when ready)
- Stripe Checkout is the easiest — add a payment gate before the app loads
- Or use Lemon Squeezy (simpler for SaaS)
- $49/mo per contractor is the target price point
