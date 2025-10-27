# 🚀 Deployment Guide for Render

This guide will help you deploy the Nepal Silver Price Tracker to Render.

## Prerequisites

- A [Render](https://render.com) account (free tier available)
- Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Method 1: Deploy via Render Dashboard (Recommended)

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### Step 2: Connect to Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub/GitLab/Bitbucket account
4. Select your `ShreeThinaGaneshCalculator` repository

### Step 3: Configure the Web Service

Fill in the following details:

- **Name**: `nepal-silver-tracker` (or any name you prefer)
- **Region**: Choose the closest to Nepal (e.g., Singapore)
- **Branch**: `main`
- **Root Directory**: Leave blank
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: `Free`

### Step 4: Add Environment Variables (Optional)

Click **"Advanced"** and add:
- `NODE_ENV` = `production`

### Step 5: Deploy

1. Click **"Create Web Service"**
2. Render will automatically build and deploy your app
3. Wait 2-5 minutes for the build to complete
4. Your app will be live at: `https://your-app-name.onrender.com`

---

## Method 2: Deploy via Blueprint (Automatic)

If you have the `render.yaml` file in your repository:

1. Go to Render Dashboard
2. Click **"New +"** → **"Blueprint"**
3. Connect your repository
4. Render will automatically read `render.yaml` and configure everything
5. Click **"Apply"** to deploy

---

## Method 3: Deploy via Render CLI

### Install Render CLI

```bash
npm install -g render-cli
```

### Login and Deploy

```bash
render login
render deploy
```

---

## 🔧 Post-Deployment Configuration

### Custom Domain (Optional)

1. In your Render service dashboard, go to **"Settings"**
2. Scroll to **"Custom Domain"**
3. Add your domain name
4. Update your DNS records as instructed

### HTTPS

- Render automatically provides free SSL certificates
- Your app will be accessible via `https://` by default

### Monitoring

- Check logs: Dashboard → Your Service → **"Logs"** tab
- View metrics: Dashboard → Your Service → **"Metrics"** tab
- Health checks run at `/health` endpoint

---

## 📝 Local Testing Before Deployment

Test the production setup locally:

```bash
# Install dependencies
npm install

# Start the server
npm start

# Open in browser
http://localhost:3000
```

---

## 🐛 Troubleshooting

### Build Fails

**Problem**: Build command fails
**Solution**: Make sure `package.json` exists and has the correct `start` script

### App Crashes

**Problem**: App starts but crashes immediately
**Solution**: Check logs for errors. Ensure PORT is read from `process.env.PORT`

### Static Files Not Loading

**Problem**: CSS/JS files return 404
**Solution**: Verify that `express.static(__dirname)` is configured in `server.js`

### Slow Performance (Free Tier)

**Problem**: App spins down after 15 minutes of inactivity
**Solution**: 
- Upgrade to paid tier for always-on service
- Or use a service like [UptimeRobot](https://uptimerobot.com/) to ping your app every 5 minutes

---

## 🔄 Continuous Deployment

Render automatically redeploys when you push to your main branch:

```bash
# Make changes to your code
git add .
git commit -m "Update features"
git push origin main

# Render will automatically detect and deploy the changes
```

---

## 💰 Pricing

- **Free Tier**: Perfect for this app
  - 750 hours/month (enough for continuous running)
  - Spins down after 15 minutes of inactivity
  - 512 MB RAM
  - Shared CPU

- **Paid Tier**: Starting at $7/month
  - Always-on (no spin down)
  - More resources
  - Priority support

---

## 🌐 Your Live App

After deployment, your app will be accessible at:

```
https://your-app-name.onrender.com
```

Share this URL with users to access the Nepal Silver Price Tracker!

---

## 📊 Next Steps

1. ✅ Deploy to Render
2. ✅ Test all features on live site
3. ✅ Share the URL
4. 🔜 Integrate real silver price API
5. 🔜 Add user authentication
6. 🔜 Set up monitoring and alerts

---

## 🆘 Need Help?

- [Render Documentation](https://render.com/docs)
- [Render Community](https://community.render.com/)
- [Express.js Guide](https://expressjs.com/en/starter/basic-routing.html)

Happy Deploying! 🎉
