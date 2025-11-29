# Rezio Deployment Guide

## Prerequisites

- GitHub repository (already set up)
- Vercel account
- PostgreSQL production database (Vercel Postgres, Neon, Supabase, or similar)
- All API keys for external services

## Step 1: Set Up Production Database

### Option A: Vercel Postgres (Recommended)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Storage" → "Create Database" → "Postgres"
3. Follow the setup wizard
4. Copy the `DATABASE_URL` connection string

### Option B: Neon (Alternative)
1. Go to [Neon Console](https://console.neon.tech)
2. Create a new project
3. Copy the connection string
4. Add `?connection_limit=5&pool_timeout=10` to the connection string

### Option C: Supabase (Alternative)
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Go to Settings → Database
4. Copy the "Connection pooling" URL (transaction mode)

## Step 2: Deploy to Vercel

### Via Vercel Dashboard (Recommended for First Deployment)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./` (or `web/` if repo has multiple projects)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm install` (default)

### Via Vercel CLI (Alternative)

```bash
# Install Vercel CLI globally
npm i -g vercel

# Navigate to project directory
cd /Users/Mike/Desktop/rezio-new/web

# Login to Vercel
vercel login

# Deploy (first time - will ask setup questions)
vercel

# Deploy to production
vercel --prod
```

## Step 3: Configure Environment Variables

In your Vercel project settings, add these environment variables:

### Required for All Environments

| Variable | Value | Description |
|----------|-------|-------------|
| `DATABASE_URL` | `postgresql://user:password@host:5432/dbname?connection_limit=5&pool_timeout=10` | Production PostgreSQL database URL |
| `NEXTAUTH_SECRET` | Generate with: `openssl rand -base64 32` | JWT signing secret (use strong random value) |
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` | Claude AI API key (from Anthropic Console) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | `AIza...` | Google Maps API key (from Google Cloud Console) |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | `pk.eyJ1...` | Mapbox API token (from Mapbox Account) |
| `REGRID_API_TOKEN` | `eyJhbG...` | Regrid parcel data API token (from Regrid Dashboard) |
| `GEMINI_API_KEY` | `AIza...` | Google Gemini API key (from Google AI Studio) |

### How to Add Environment Variables in Vercel Dashboard

1. Go to your project in Vercel Dashboard
2. Click "Settings" tab
3. Click "Environment Variables" in sidebar
4. For each variable:
   - Enter the **Key** (e.g., `DATABASE_URL`)
   - Enter the **Value** (paste from table above)
   - Select environments: **Production**, **Preview**, **Development** (check all three)
   - Click "Save"

### Security Notes

- **IMPORTANT:** Generate a new `NEXTAUTH_SECRET` for production:
  ```bash
  openssl rand -base64 32
  ```
- Never commit `.env` files to git
- Rotate API keys periodically
- Use different database credentials for production vs. development

## Step 4: Initialize Production Database

After first deployment:

```bash
# Option 1: Use Vercel CLI to run migration
vercel env pull .env.local  # Pull production env vars
npx prisma db push          # Push schema to production database

# Option 2: Run from Vercel dashboard
# Go to your project → "Deployments" → latest deployment → "..." menu → "Run Command"
# Enter: npx prisma db push
```

## Step 5: Verify Deployment

### Check Deployment Status
1. Go to Vercel Dashboard → Your Project → "Deployments"
2. Wait for deployment to complete (usually 1-3 minutes)
3. Click on the deployment to see build logs

### Test Production Application
1. Visit your production URL (e.g., `https://rezio.vercel.app`)
2. Test key features:
   - [ ] Sign up / Login works
   - [ ] Create new project
   - [ ] Address lookup (Regrid API)
   - [ ] Map visualization loads
   - [ ] AI Scout conversation works
   - [ ] Vision Board AI visualization works
   - [ ] Tasks creation works

### Check Production Logs
- Vercel Dashboard → Your Project → "Logs" tab
- Filter by "Error" to see any issues

## Step 6: Set Up Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → "Settings" → "Domains"
2. Click "Add Domain"
3. Enter your domain (e.g., `app.rezio.com`)
4. Follow DNS configuration instructions
5. Wait for DNS propagation (5-60 minutes)

## Troubleshooting

### Build Fails with TypeScript Errors
```bash
# Run build locally first to catch errors
npm run build
```

### Database Connection Issues
- Verify `DATABASE_URL` is correctly formatted
- Check database allows connections from Vercel IPs
- Ensure connection pooling parameters are included

### API Keys Not Working
- Verify all environment variables are set correctly
- Check "Production", "Preview", and "Development" are all selected
- Redeploy after changing environment variables

### 401 Unauthorized Errors
- Verify `NEXTAUTH_SECRET` is set
- Clear browser cookies and try again
- Check authentication configuration in `lib/auth.ts`

### Vision Board Images Not Saving
- Check database schema is up to date (`npx prisma db push`)
- Verify server logs in Vercel dashboard
- Ensure user is authenticated

## Continuous Deployment

Vercel automatically deploys when you push to GitHub:

- **Push to `main` branch** → Production deployment
- **Push to other branches** → Preview deployment
- **Pull requests** → Preview deployment with unique URL

To disable auto-deployment:
1. Vercel Dashboard → Your Project → "Settings" → "Git"
2. Configure deployment settings

## Team Access

### Add Team Members to Vercel
1. Vercel Dashboard → "Settings" → "Members"
2. Click "Invite Member"
3. Enter email and select role:
   - **Owner**: Full access
   - **Member**: Deploy and manage project
   - **Viewer**: Read-only access

### GitHub Collaborators
Vercel respects GitHub repository permissions. Add collaborators to your GitHub repository for version control access.

## Monitoring & Alerts

### Set Up Monitoring
1. Vercel Dashboard → Your Project → "Settings" → "Notifications"
2. Configure alerts for:
   - Deployment failures
   - Error rate thresholds
   - Performance degradation

### Analytics
- Enable Vercel Analytics: Settings → "Analytics" → "Enable"
- View performance metrics and user insights

## Backup Strategy

### Database Backups
- **Vercel Postgres**: Automatic daily backups (7-day retention)
- **Neon**: Automatic backups with point-in-time recovery
- **Supabase**: Automatic daily backups

### Manual Backup
```bash
# Backup production database locally
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backup-20250129.sql
```

## Cost Estimates

### Vercel (Hosting)
- **Hobby Plan**: Free (good for development/testing)
  - 100 GB bandwidth/month
  - Serverless function execution
- **Pro Plan**: $20/month (recommended for production)
  - 1 TB bandwidth/month
  - Advanced analytics
  - Team collaboration

### Database
- **Vercel Postgres**: $0.50/GB storage + compute time
- **Neon**: Free tier available, ~$19/month for production
- **Supabase**: Free tier available, ~$25/month for production

### API Costs (Pay-as-you-go)
- **Anthropic Claude**: ~$0.015/1K input tokens, ~$0.075/1K output tokens
- **Google Gemini**: Free tier, then usage-based
- **Google Maps**: $200/month free credit
- **Mapbox**: 50K map loads/month free
- **Regrid**: Varies by plan

## Environment-Specific Configurations

### Production
- Set `NODE_ENV=production` (automatic in Vercel)
- Use production database
- Enable error tracking (Sentry, LogRocket, etc.)
- Set up monitoring and alerts

### Staging/Preview
- Use separate staging database (optional)
- Test new features before production
- Preview deployments for pull requests

### Development
- Use local database
- Enable verbose logging
- Use `.env.local` for local overrides

## Next Steps After Deployment

1. [ ] Set up error tracking (Sentry recommended)
2. [ ] Configure custom domain
3. [ ] Enable Vercel Analytics
4. [ ] Set up monitoring alerts
5. [ ] Document deployment process for team
6. [ ] Schedule regular database backups
7. [ ] Plan scaling strategy as users grow
8. [ ] Set up staging environment for testing

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [NextAuth Deployment](https://next-auth.js.org/deployment)

## Quick Reference Commands

```bash
# Deploy to production
vercel --prod

# Pull production environment variables
vercel env pull .env.local

# View production logs
vercel logs [deployment-url]

# Run database migration on production
vercel env pull && npx prisma db push

# Rollback to previous deployment
# (Go to Vercel Dashboard → Deployments → Previous deployment → "..." → "Promote to Production")
```

---

**Last Updated:** January 29, 2025
**Maintained By:** Development Team
