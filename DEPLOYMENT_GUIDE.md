# 🚀 Deployment Guide

This application is now ready to deploy to cloud platforms! It supports both PostgreSQL (cloud database) and Cloudinary (cloud image storage).

## 📋 Prerequisites

1. **Database**: PostgreSQL database (free tier available on):
   - [Supabase](https://supabase.com) - Recommended, free PostgreSQL
   - [Render](https://render.com) - Free PostgreSQL
   - [Railway](https://railway.app) - PostgreSQL with free tier
   - [Heroku](https://heroku.com) - PostgreSQL addon

2. **Image Storage**: Cloudinary account (free tier available)
   - Sign up at [Cloudinary](https://cloudinary.com)
   - Get your `CLOUDINARY_URL` from dashboard

## 🌐 Deployment Platforms

### Option 1: Render (Recommended - Free Tier Available)

1. **Create PostgreSQL Database**:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "PostgreSQL"
   - Name: `jewelry-calculator-db`
   - Copy the "Internal Database URL"

2. **Deploy Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Settings:
     - **Name**: `jewelry-calculator`
     - **Environment**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Environment Variables**:
       ```
       NODE_ENV=production
       DATABASE_URL=[paste your PostgreSQL URL]
       CLOUDINARY_URL=[paste your Cloudinary URL]
       ```

3. **Deploy**: Click "Create Web Service"

### Option 2: Railway (Free Tier Available)

1. **Create New Project**: 
   - Go to [Railway](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"

2. **Add PostgreSQL**:
   - Click "New" → "Database" → "Add PostgreSQL"
   - Copy the `DATABASE_URL` from variables

3. **Configure Service**:
   - Click on your service
   - Go to "Variables" tab
   - Add:
     ```
     NODE_ENV=production
     DATABASE_URL=[automatically set by Railway]
     CLOUDINARY_URL=[paste your Cloudinary URL]
     ```

4. **Deploy**: Railway auto-deploys on push

### Option 3: Heroku

1. **Create App**:
   ```bash
   heroku create jewelry-calculator
   ```

2. **Add PostgreSQL**:
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

3. **Set Environment Variables**:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set CLOUDINARY_URL=cloudinary://...
   ```

4. **Deploy**:
   ```bash
   git push heroku main
   ```

## 🔑 Environment Variables

Required for production:

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/database
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```

Optional:
```env
PORT=3000  # Usually set automatically by platform
```

## 🧪 Local Development

The app automatically uses SQLite and local file storage when running locally:

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Create `.env` file** (already created):
   ```env
   NODE_ENV=development
   PORT=3000
   ```

3. **Run**:
   ```bash
   npm start
   ```

Local mode uses:
- ✅ SQLite database (no PostgreSQL needed)
- ✅ Local file storage in `public/uploads/` (no Cloudinary needed)

## 📊 Database Migration

If you have existing SQLite data, you can migrate it to PostgreSQL:

1. **Export from SQLite**:
   ```bash
   sqlite3 jewelry.db .dump > jewelry.sql
   ```

2. **Import to PostgreSQL**:
   ```bash
   psql $DATABASE_URL < jewelry.sql
   ```

## 🖼️ Image Storage

**Local Development**: Images stored in `public/uploads/`

**Production**: Images stored on Cloudinary CDN
- Automatic optimization
- Fast global delivery
- No server storage needed

## 🔧 Troubleshooting

### Database Connection Issues
- Check `DATABASE_URL` format: `postgresql://user:pass@host:5432/dbname`
- Ensure PostgreSQL is running
- Check firewall/security group settings

### Image Upload Issues
- Verify `CLOUDINARY_URL` is correct
- Check Cloudinary dashboard for quota limits
- Ensure proper folder permissions locally

### Build Failures
- Run `npm install` to ensure all dependencies installed
- Check Node.js version (requires >= 14.0.0)
- Review build logs for specific errors

## 📝 Notes

- SQLite dependency (`sqlite3`) is still in package.json for local development
- Production automatically switches to PostgreSQL when `DATABASE_URL` is set
- Images automatically use Cloudinary when `CLOUDINARY_URL` is set
- No code changes needed between local and production!

## 🎉 Success!

Your app is now deployable! Choose a platform above and follow the steps.

For help, check:
- [Render Docs](https://render.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Cloudinary Docs](https://cloudinary.com/documentation)
