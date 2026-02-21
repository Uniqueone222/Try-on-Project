# Virtual Try-On Deployment Guide

## Frontend (Netlify) ✅ Already Connected

Your GitHub repo is connected to Netlify. You just need to:

1. **Go to Netlify Dashboard → Your Site → Site Settings**
2. **Build & Deploy → Edit Settings:**
   - Base directory: `frontend`
   - Build command: `npm install && npm run build`
   - Publish directory: `dist`

3. **Save and trigger a re-deploy** (or push to main branch)

✅ Frontend will be live at `https://your-site-name.netlify.app`

---

## Backend (Render.com) - FREE TIER ✅

### Step 1: Go to [render.com](https://render.com)
1. Sign up with GitHub
2. Click **"New +"** → Select **"Web Service"**
3. Select your repository
4. Configure:
   - **Name:** `tryon-backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Root Directory:** `backend`

### Step 2: Add Environment Variables
- No variables needed for the free tier (uses defaults)

### Step 3: Deploy
- Click **"Create Web Service"**
- Wait ~5 minutes for deployment
- Get your URL: `https://tryon-backend.onrender.com`

---

## Connect Frontend + Backend

### Update Frontend API URL

In `frontend/netlify.toml`, replace `your-backend-api-url`:
```toml
VITE_API_URL = "https://tryon-backend.onrender.com"
```

Push to GitHub → Netlify auto-redeploys → ✅ Live!

---

## Test Your Deployment

1. **Visit frontend:** `https://your-site-name.netlify.app`
2. **Check backend:** `https://tryon-backend.onrender.com/health`
   - Should return: `{"status":"ok","service":"Virtual Try-On Backend"}`

---

## Important Notes

### Render Free Tier
- ✅ Automatic GitHub deploys
- ✅ HTTPS included
- ⚠️ Spins down after 15 mins of inactivity (first request takes ~30 seconds)
- ⚠️ Limited to 100GB/month data
- **Perfect for prototypes!**

### If You Need Production:
- Render Starter: $7/month for always-on server
- Railway: $5/month minimum
- PythonAnywhere: £5/month

---

## Troubleshooting

### Frontend shows 404
- Check Netlify deploy logs
- Ensure base directory is `frontend`
- Publish directory should be `dist`

### API calls fail
- Check backend URL in `netlify.toml`
- Verify backend deployed on Render
- Check CORS in `backend/main.py`
- Open browser DevTools (F12) to see network errors

### Backend still spinning up?
- Render free tier spins down - first call takes 30 secs
- Check `https://tryon-backend.onrender.com` in browser
- Should see API response

---

## Deployment Checklist

- [ ] GitHub repo with both `frontend/` and `backend/` folders
- [ ] Netlify connected to GitHub repo
- [ ] Netlify build settings configured (base: `frontend`, publish: `dist`)
- [ ] Render.com account created
- [ ] Backend deployed on Render
- [ ] `frontend/netlify.toml` updated with Render URL
- [ ] Push final code to GitHub
- [ ] Both URLs working

**🚀 You're live!**
