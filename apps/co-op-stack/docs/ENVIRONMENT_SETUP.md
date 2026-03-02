# Environment Configuration Guide

## Production Environment Setup

### Required Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# ============================================
# SUPABASE CONFIGURATION (Required)
# ============================================
# Get these values from your Supabase project dashboard (Settings > API)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# ============================================
# APPLICATION CONFIGURATION
# ============================================
VITE_APP_ENV=production

# ============================================
# OPTIONAL: ANALYTICS & MONITORING
# ============================================
# VITE_ENABLE_ANALYTICS=true
# VITE_SENTRY_DSN=your-sentry-dsn-here

# ============================================
# OPTIONAL: FEATURE FLAGS
# ============================================
# VITE_ENABLE_EXPERIMENTAL=false
# VITE_DEBUG_MODE=false
```

### Getting Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to **Settings > API**
3. Copy the **Project URL** and **anon/public** key
4. Add them to your `.env` file

### Security Notes

- Never commit `.env` files to version control
- Use different Supabase projects for different environments (dev/staging/prod)
- Rotate API keys regularly
- Use environment-specific keys with appropriate permissions

### Capacitor Mobile Configuration

For mobile builds, ensure these additional configurations:

```bash
# Android specific
ANDROID_KEYSTORE_PATH=/path/to/keystore.jks
ANDROID_KEYSTORE_PASSWORD=your_keystore_password
ANDROID_KEY_ALIAS=your_key_alias
ANDROID_KEY_PASSWORD=your_key_password

# iOS specific
IOS_CODE_SIGN_IDENTITY=iPhone Distribution: Your Name
IOS_PROVISIONING_PROFILE=your_provisioning_profile.mobileprovision
IOS_DEVELOPMENT_TEAM=your_team_id
```

### Deployment Checklist

- [ ] `.env` file created with correct values
- [ ] Supabase project configured for production
- [ ] Environment variables validated
- [ ] Mobile certificates configured (if deploying to app stores)
- [ ] Database migrations applied
- [ ] Build tested locally
