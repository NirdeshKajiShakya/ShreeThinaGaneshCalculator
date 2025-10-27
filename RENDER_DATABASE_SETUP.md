# 🔧 Render Database Connection Error - SOLUTION

## ❌ Problem: ENETUNREACH Error

You're seeing this error because you're using the **External Database URL** instead of the **Internal Database URL**.

```
Error: connect ENETUNREACH 2406:da12:...
```

This IPv6 address indicates an External URL, which won't work within Render's network.

## ✅ Solution: Use Internal Database URL

### Step-by-Step Fix:

1. **Go to Render Dashboard** → [https://dashboard.render.com](https://dashboard.render.com)

2. **Find Your PostgreSQL Database**:
   - Click on your database (e.g., `jewelry-calculator-db`)

3. **Copy the INTERNAL Database URL**:
   - Scroll to the "Connections" section
   - Look for **"Internal Database URL"**
   - Click the copy icon 📋
   - Format: `postgresql://user:password@dpg-xxxxx-a.oregon-postgres.render.com/dbname`

4. **Update Your Web Service**:
   - Go to your web service (e.g., `jewelry-calculator`)
   - Click "Environment" in left sidebar
   - Find the `DATABASE_URL` variable
   - **REPLACE** the value with the Internal Database URL you just copied
   - Click "Save Changes"

5. **Render will auto-redeploy** and you should see:
   ```
   ✅ PostgreSQL connection successful
   ✅ PostgreSQL database initialized
   ```

## 🔍 How to Identify the URLs

### ❌ External URL (DON'T USE):
```
postgres://user:pass@dpg-xxxxx-a.oregon-postgres.render.com:5432/dbname
```
- Uses IPv6 address
- Has `:5432` port explicitly
- Used for connecting from outside Render

### ✅ Internal URL (USE THIS):
```
postgresql://user:pass@dpg-xxxxx-a.oregon-postgres.render.com/dbname
```
- Shorter, simpler format
- No port number
- Works within Render's internal network

## 🎯 Expected Log Output

**Before Fix (Current):**
```
🔌 Connecting to PostgreSQL database...
❌ Error initializing PostgreSQL: connect ENETUNREACH
```

**After Fix:**
```
🔌 Connecting to PostgreSQL database...
✅ PostgreSQL connection successful
✅ PostgreSQL database initialized
🪙✨ Nepal Gold & Silver Jewelry Calculator is running
```

## 🆘 Still Having Issues?

1. **Check both services are in the same region**:
   - Database region: (e.g., Oregon)
   - Web Service region: (should match)

2. **Verify DATABASE_URL format**:
   ```
   postgresql://username:password@hostname/database_name
   ```

3. **Check database status**: Must be "Available" (not "Creating")

4. **Try removing and re-adding DATABASE_URL**:
   - Delete the variable
   - Save
   - Add it again with Internal URL
   - Save

## 📝 Quick Reference

| Setting | Value |
|---------|-------|
| Variable Name | `DATABASE_URL` |
| Source | Render Dashboard → Database → Internal Database URL |
| Format | `postgresql://user:pass@dpg-xxx-a.region.render.com/db` |
| Region | Must match web service region |

Once you make this change, your app will deploy successfully! 🎉
