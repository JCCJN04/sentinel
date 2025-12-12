# Vercel Deployment Guide - Environment Variables

## Required Environment Variables

### 🔴 Server-Side Only (Secrets - NO `NEXT_PUBLIC_` prefix)

These variables must NEVER be exposed to the client. Add them in Vercel Dashboard under **Settings → Environment Variables**.

#### Gemini AI
```
GEMINI_API_KEY=your_gemini_api_key_here
```
- Get from: https://aistudio.google.com/app/apikey
- Used for: Medical document analysis (OCR)
- Scope: **Production, Preview, Development**

#### Twilio WhatsApp
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```
- Get from: https://console.twilio.com/
- Used for: Medication reminders via WhatsApp
- Scope: **Production, Preview**

#### Supabase Admin (API Routes Only)
```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```
- Get from: Supabase Dashboard → Settings → API
- ⚠️ **WARNING**: This key bypasses Row Level Security (RLS)
- Only use in API routes (`/app/api/*`), NEVER in client code
- Scope: **Production, Preview, Development**

---

### 🟢 Client-Side Safe (Public - CAN use `NEXT_PUBLIC_` prefix)

These variables are embedded in the browser bundle and are safe to expose.

#### Supabase Public
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```
- Get from: Supabase Dashboard → Settings → API
- Used for: Authentication and RLS-protected database queries
- Scope: **Production, Preview, Development**

#### App URL (Optional - Auto-detected on Vercel)
```
NEXT_PUBLIC_APP_URL=https://your-domain.com
```
- Vercel automatically provides `VERCEL_URL` for deployments
- Only needed if you have a custom domain
- For local development, defaults to `http://localhost:3000`
- Scope: **Production** (leave empty for Preview/Dev)

---

## Vercel Dashboard Setup

### Step 1: Open Environment Variables
1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Environment Variables**

### Step 2: Add Server-Side Secrets (Hidden)
Add each variable with:
- **Key**: Variable name (e.g., `GEMINI_API_KEY`)
- **Value**: Your actual secret
- **Environment**: Select `Production`, `Preview`, `Development`
- Click **Save**

**Example**:
```
Key: GEMINI_API_KEY
Value: AIzaSyD... (your actual key)
Environment: ✅ Production ✅ Preview ✅ Development
```

### Step 3: Add Client-Side Variables (Public)
Same process, but these will be visible in browser:
```
Key: NEXT_PUBLIC_SUPABASE_URL
Value: https://abcdefgh.supabase.co
Environment: ✅ Production ✅ Preview ✅ Development
```

### Step 4: Redeploy
After adding variables:
- Go to **Deployments** tab
- Click **...** on the latest deployment
- Select **Redeploy** → **Use existing Build Cache**

---

## Local Development Setup

### Create `.env.local` (Never commit this file!)
```bash
# Copy from example
cp .env.example .env.local

# Edit with your actual values
nano .env.local
```

### `.env.local` Template
```bash
# ============================================
# SERVER-SIDE SECRETS (NO NEXT_PUBLIC_ PREFIX)
# ============================================

# Gemini AI - Medical Document Analysis
GEMINI_API_KEY=your_gemini_api_key_here

# Twilio WhatsApp - Medication Reminders
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Supabase Admin (API Routes Only - Bypasses RLS)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# ============================================
# CLIENT-SIDE PUBLIC (NEXT_PUBLIC_ PREFIX OK)
# ============================================

# Supabase Public (Safe to expose)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# App URL (auto-detected on Vercel, manual for local)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Security Checklist ✅

Before deploying to production:

- [ ] ✅ `GEMINI_API_KEY` has NO `NEXT_PUBLIC_` prefix
- [ ] ✅ All Twilio credentials have NO `NEXT_PUBLIC_` prefix
- [ ] ✅ `SUPABASE_SERVICE_ROLE_KEY` has NO `NEXT_PUBLIC_` prefix
- [ ] ✅ Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` use `NEXT_PUBLIC_` prefix
- [ ] ✅ `.env.local` is in `.gitignore` (already included)
- [ ] ✅ All Vercel environment variables are set for Production scope
- [ ] ✅ Deployment succeeded without exposing secrets

### Verify Secrets Are Not Exposed

1. **Build Locally**:
   ```bash
   pnpm build
   # Check for exposed secrets
   grep -r "AIzaSy" .next/static/  # Should return 0 matches
   ```

2. **Browser Inspection**:
   - Open your deployed site
   - DevTools → Sources → Search for "GEMINI_API_KEY"
   - Should NOT find any matches in client bundles

3. **Environment Check**:
   ```bash
   # In Vercel deployment logs
   # Look for "Environment Variables" section
   # Ensure server secrets show as "[REDACTED]"
   ```

---

## Troubleshooting

### Build fails with "GEMINI_API_KEY is not defined"
- ✅ Add `GEMINI_API_KEY` to Vercel environment variables
- ✅ Ensure it's set for the environment you're deploying to (Production/Preview)
- ✅ Redeploy after adding the variable

### WhatsApp notifications not working
- ✅ Verify all 3 Twilio variables are set correctly
- ✅ Check Twilio dashboard for approved Content Templates
- ✅ Ensure `TWILIO_WHATSAPP_NUMBER` includes `whatsapp:` prefix

### "Cannot find module '@supabase/ssr'" error
- ✅ Run `pnpm install` locally
- ✅ Commit updated `pnpm-lock.yaml`
- ✅ Push to GitHub (Vercel will auto-deploy)

### Recipe analysis returns 401 Unauthorized
- ✅ User must be logged in (requires Supabase session)
- ✅ Check browser console for auth errors
- ✅ Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct

---

## Environment Variable Reference

| Variable | Prefix | Exposed to Browser? | Used In | Required |
|----------|--------|---------------------|---------|----------|
| `GEMINI_API_KEY` | None | ❌ No | API routes | ✅ Yes |
| `TWILIO_ACCOUNT_SID` | None | ❌ No | API routes | ✅ Yes |
| `TWILIO_AUTH_TOKEN` | None | ❌ No | API routes | ✅ Yes |
| `TWILIO_WHATSAPP_NUMBER` | None | ❌ No | API routes | ✅ Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | None | ❌ No | API routes | ✅ Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | ✅ Yes | Client & Server | ✅ Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | ✅ Yes | Client & Server | ✅ Yes |
| `NEXT_PUBLIC_APP_URL` | Yes | ✅ Yes | Client & Server | ⚠️ Optional |

---

## Quick Deploy Commands

```bash
# 1. Install dependencies
pnpm install

# 2. Create local environment file
cp .env.example .env.local

# 3. Edit .env.local with your actual credentials
nano .env.local

# 4. Run development server
pnpm dev

# 5. Test build locally before deploying
pnpm build

# 6. Commit and push (Vercel auto-deploys)
git add .
git commit -m "Update environment configuration"
git push origin main
```

---

**Last Updated**: December 14, 2024  
**Version**: 1.0.0  
**Platform**: Vercel (Next.js 14.2.31)