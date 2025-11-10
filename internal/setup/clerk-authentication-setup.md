# Clerk Authentication Setup Guide

This guide explains how to set up Clerk authentication for the Consulate dashboard with Google OAuth.

## Prerequisites

1. Create a Clerk account at [https://clerk.com](https://clerk.com)
2. Create a new Clerk application

## Configuration Steps

### 1. Get Clerk API Keys

1. Go to your Clerk dashboard
2. Navigate to **API Keys** in the left sidebar
3. Copy the following keys:
   - `Publishable Key` (starts with `pk_test_` or `pk_live_`)
   - `Secret Key` (starts with `sk_test_` or `sk_live_`)

### 2. Configure Google OAuth

1. In your Clerk dashboard, go to **User & Authentication** → **Social Connections**
2. Enable **Google** provider
3. Disable all other providers (Email, Phone, etc.) to have Google-only authentication
4. Follow Clerk's instructions to set up Google OAuth credentials

### 3. Configure JWT Template for Convex (CRITICAL)

**This step is REQUIRED for Convex authentication to work.**

1. Go to your Clerk dashboard
2. Navigate to **JWT Templates** in the left sidebar
3. Click **+ New template**
4. Name the template: `convex` (exactly this name, lowercase)
5. Click **Create**
6. Leave the template empty (or add custom claims if needed)
7. Click **Save**

**Why this is needed:** Convex uses this JWT template to authenticate users. The template name must match exactly what's used in the code (`auth.getToken({ template: "convex" })`).

### 4. Set Up Environment Variables

Create a `.env.local` file in the `dashboard/` directory:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here

# Clerk Frontend API URL (for Convex integration)
# Get this from Clerk Dashboard → API Keys → Frontend API
# Format: https://your-app.clerk.accounts.dev
CLERK_FRONTEND_API_URL=https://your-app.clerk.accounts.dev

# Clerk Sign-in/Sign-up URLs (optional, defaults work)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard

# Convex Backend
NEXT_PUBLIC_CONVEX_URL=https://your-convex-deployment.convex.cloud
```

**Important:** You also need to set `CLERK_FRONTEND_API_URL` in your Convex environment variables (for the backend). This is the same value as above.

### 5. Configure Organizations in Clerk

Organizations are enabled by default in Clerk. Configure them:

1. Go to **Organizations** in Clerk dashboard
2. Enable organizations if not already enabled
3. Set up organization roles:
   - **Admin** (`org:admin`): Can access Activity and Settings pages
   - **Member** (default): Standard user access

### 6. User Roles

The system recognizes two user levels:

- **Organization Owners**: Users who create/own organizations
- **Admin**: Users with `org:admin` role in an organization

#### How Roles Work:

- Activity and Settings pages are only visible to users with `org:admin` role
- All other pages (Dashboard, Agents, Cases) are visible to all authenticated users
- The sidebar dynamically hides/shows navigation items based on the user's role

### 7. Testing Authentication

1. Start the development server:
   ```bash
   cd dashboard
   pnpm dev
   ```

2. Navigate to `http://localhost:3000/dashboard`

3. You should be redirected to the sign-in page

4. Sign in with Google

5. After authentication, you'll be redirected to `/dashboard`

### 8. Managing Users and Roles

#### Assign Admin Role to a User:

1. Go to Clerk dashboard → **Organizations**
2. Select the organization
3. Click on a member
4. Change their role to **Admin**

#### Create a New User:

Users can sign up via the `/sign-up` page or by Google OAuth.

## Implementation Details

### Protected Routes

The following routes require authentication (configured in `middleware.ts`):

- `/dashboard/*` - All dashboard pages
- Any route except `/`, `/sign-in`, `/sign-up`

### Role-Based Access Control

Implemented in `government-sidebar.tsx`:

```typescript
const { orgRole } = useAuth()
const isAdmin = orgRole === 'org:admin' || orgRole === 'admin'

// Filter navigation items
const visibleItems = navigationItems.filter(item => 
  !item.adminOnly || isAdmin
)
```

### User Display

The header (`government-header.tsx`) shows:
- User's full name or first name
- User's role (Admin or Organization Owner)
- Clerk's UserButton for profile management and sign-out

## Customization

### Appearance Customization

Clerk components can be customized via the `appearance` prop. Current customizations:

**Sign-in/Sign-up pages:**
```typescript
appearance={{
  elements: {
    rootBox: "mx-auto",
    card: "shadow-xl border border-slate-200"
  }
}}
```

**UserButton in header:**
```typescript
appearance={{
  elements: {
    avatarBox: "h-8 w-8",
    userButtonTrigger: "focus:shadow-none"
  }
}}
```

### Adding More Authentication Methods

To add more authentication methods (not recommended per requirements):

1. Go to Clerk dashboard → **User & Authentication** → **Social Connections**
2. Enable desired providers
3. Configure OAuth credentials for each provider

## Troubleshooting

### "Invalid Publishable Key" Error

- Ensure your `.env.local` file has the correct keys
- Restart the development server after changing environment variables
- Check that keys match your Clerk application's environment (test vs production)

### Users Can't Access Admin Pages

- Verify the user has `org:admin` role in Clerk dashboard
- Check organization membership in Clerk dashboard
- Ensure the user is logged in to the correct organization

### Redirect Loop After Sign-in

- Verify `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` is set to `/dashboard`
- Check that `/dashboard` is not in the public routes list in `middleware.ts`
- Clear browser cache and cookies

### "No token retrieved - check Clerk JWT template 'convex'" Error

**This is the most common issue with Convex integration.**

1. **Verify JWT template exists:**
   - Go to Clerk dashboard → **JWT Templates**
   - Ensure a template named exactly `convex` exists
   - If missing, create it (see Step 3 above)

2. **Verify Frontend API URL:**
   - Go to Clerk dashboard → **API Keys**
   - Copy the **Frontend API** URL
   - Ensure `CLERK_FRONTEND_API_URL` in `.env.local` matches exactly
   - Also set this in Convex environment variables (for backend)

3. **Restart development server:**
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart
   pnpm dev
   ```

4. **Check browser console:**
   - Open browser DevTools → Console
   - Look for `[Convex Auth]` warnings or errors
   - These will indicate what's wrong

### SSL/TLS Error: `net::ERR_SSL_VERSION_OR_CIPHER_MISMATCH` for `clerk.consulatehq.com`

**This error occurs when Clerk is configured with a custom domain that has SSL issues.**

**Solution: Remove or fix the custom domain**

1. **Option A: Remove Custom Domain (Recommended)**
   - Go to Clerk dashboard → **Domains**
   - Find `clerk.consulatehq.com` (or your custom domain)
   - Click **Delete** or **Remove**
   - Clerk will automatically fall back to `*.clerk.accounts.dev`
   - Wait a few minutes for DNS propagation

2. **Option B: Fix Custom Domain SSL**
   - Ensure DNS CNAME is correctly configured
   - Wait for SSL certificate provisioning (can take up to 24 hours)
   - Verify SSL certificate is valid: `openssl s_client -connect clerk.consulatehq.com:443`

**After removing/fixing custom domain:**
- Clear browser cache
- Redeploy your application
- Test again

**Note:** The CSP has been updated to only allow `*.clerk.accounts.dev` (default domain). If you need a custom domain, ensure SSL is working before adding it back to CSP.

### "Invalid Publishable Key" or Authentication Not Working

1. **Check environment variables:**
   - Ensure `.env.local` is in the `dashboard/` directory (not root)
   - Verify keys match your Clerk application (test vs production)
   - Restart dev server after changing `.env.local`

2. **Verify Clerk application:**
   - Ensure you're using the correct Clerk application
   - Check that the application is active (not deleted/suspended)
   - **Important:** If you removed a custom domain, ensure `CLERK_FRONTEND_API_URL` points to `*.clerk.accounts.dev`, not the custom domain

3. **Check Vercel environment variables (for production):**
   - Go to Vercel dashboard → Your project → Settings → Environment Variables
   - Ensure all Clerk variables are set:
     - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
     - `CLERK_SECRET_KEY`
     - `CLERK_FRONTEND_API_URL` (should be `https://your-app.clerk.accounts.dev`, NOT custom domain)
   - Redeploy after adding/changing variables

## Security Considerations

- Never commit `.env.local` to version control
- Use different API keys for development and production
- Regularly rotate secret keys
- Enable MFA for Clerk dashboard access
- Monitor authentication logs in Clerk dashboard

## Additional Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk Next.js Integration](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk Organizations](https://clerk.com/docs/organizations/overview)
- [Clerk Roles & Permissions](https://clerk.com/docs/organizations/roles-permissions)

