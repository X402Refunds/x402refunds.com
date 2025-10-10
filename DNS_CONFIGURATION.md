# DNS Configuration for api.consulatehq.com

## Current Status

The Consulate API is configured to use the custom domain `api.consulatehq.com`, but DNS propagation may not be complete yet.

## Required Configuration

### Step 1: Convex Dashboard Setup

1. Go to [Convex Dashboard](https://dashboard.convex.dev)
2. Select your production deployment (perceptive-lyrebird-89)
3. Navigate to **Settings** → **Custom Domains**
4. Click **Add Custom Domain**
5. Enter: `api.consulatehq.com`
6. Convex will provide a CNAME target (similar to: `perceptive-lyrebird-89.convex.site`)

### Step 2: DNS Configuration

Add the following CNAME record to your DNS provider (likely Vercel or your domain registrar):

```
Type:  CNAME
Name:  api
Value: perceptive-lyrebird-89.convex.site (or value provided by Convex)
TTL:   Auto (or 3600)
```

**If using Vercel DNS:**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select the `consulatehq` project
3. Navigate to **Settings** → **Domains**
4. Click **Add** → **Add DNS Record**
5. Add the CNAME record above

**If using external DNS provider (Cloudflare, Route53, etc.):**
1. Log into your DNS provider
2. Find DNS settings for `consulatehq.com`
3. Add the CNAME record above
4. If using Cloudflare, set proxy status to **DNS only** (not proxied)

### Step 3: Verification

Once DNS propagates (can take 5 minutes to 48 hours), verify:

```bash
# Check DNS resolution
nslookup api.consulatehq.com

# Test API endpoint
curl https://api.consulatehq.com/health

# Expected response:
# {"status":"healthy","timestamp":1234567890,"service":"consulate-ai"}
```

### Step 4: SSL Certificate

Convex automatically provisions SSL certificates for custom domains. Once DNS is configured:
- Convex will detect the CNAME
- Automatically provision a Let's Encrypt certificate
- Enable HTTPS (usually within 5-10 minutes)

## Current Fallback

While DNS propagates, the API is still accessible at:
```
https://perceptive-lyrebird-89.convex.site
```

All code and documentation already reference `api.consulatehq.com`, so no further updates are needed once DNS is live.

## Troubleshooting

### DNS Not Resolving
```bash
# Check if CNAME is configured
dig api.consulatehq.com CNAME

# Check what DNS sees
dig api.consulatehq.com +trace
```

### SSL Certificate Issues
- Wait 10-15 minutes after DNS propagates
- Convex automatically provisions certs via Let's Encrypt
- Check Convex dashboard for cert status

### Still Using Old URL
If api.consulatehq.com works but apps still use old URL:
- Clear browser cache
- Redeploy frontend: `vercel --prod`
- Check environment variables in Vercel dashboard

## Monitoring

Once live, monitor the API:
- **Health Check**: https://api.consulatehq.com/health
- **Convex Dashboard**: https://dashboard.convex.dev (check metrics)
- **Uptime Monitoring**: Consider adding to UptimeRobot or similar

## Configuration Files Updated

All configuration files have been updated to use `api.consulatehq.com`:
- ✅ `convex.json` - Production URL configured
- ✅ `docs/api/endpoints.md` - API documentation
- ✅ `dashboard/src/app/docs/api/page.tsx` - Interactive API docs
- ✅ `dashboard/public/llms.txt` - AI agent discovery
- ✅ `README.md` - Main documentation
- ✅ All curl examples and code snippets

## Next Steps

1. **Configure DNS** following Step 2 above
2. **Wait for propagation** (check with `nslookup api.consulatehq.com`)
3. **Verify SSL** is working (`curl https://api.consulatehq.com/health`)
4. **Test all endpoints** from the API documentation
5. **Update any external integrations** that may still use the old URL

---

**Questions?** Contact: vivek@consulatehq.com

