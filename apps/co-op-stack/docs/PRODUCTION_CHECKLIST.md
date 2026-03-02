# Production Deployment Checklist

## Pre-Deployment Verification

### 🔧 **Environment Setup**

- [ ] Node.js version >= 18.0.0 installed
- [ ] pnpm version >= 8.0.0 installed
- [ ] `.env` file created with production values
- [ ] Supabase project configured for production
- [ ] SSL certificate configured (if self-hosting)

### 📦 **Dependencies & Build**

- [ ] `pnpm install` completed successfully
- [ ] `npm run type-check` passes
- [ ] `npm run build:prod` completes without errors
- [ ] Bundle size optimized (< 1MB for main bundle)
- [ ] Console/debug statements removed in production build

### 🔒 **Security**

- [ ] Environment variables validated
- [ ] Supabase RLS policies active
- [ ] Content Security Policy configured
- [ ] Security headers in place (`_headers` file)
- [ ] No hardcoded secrets in codebase

### 🗄️ **Database**

- [ ] All migrations applied to production database
- [ ] Database indexes optimized
- [ ] RLS policies performance-tested
- [ ] Backup strategy in place

### 📱 **Mobile (if deploying)**

- [ ] Capacitor sync completed (`npm run cap:sync`)
- [ ] iOS certificates configured
- [ ] Android keystore configured
- [ ] App store accounts ready

### 🚀 **Deployment**

- [ ] Domain DNS configured
- [ ] CDN configured (if applicable)
- [ ] Monitoring/logging setup
- [ ] Health check endpoints working
- [ ] Rollback plan prepared

## Deployment Commands

### Web Deployment

```bash
# Build production bundle
npm run build:prod

# Deploy to hosting provider
npm run deploy:netlify    # Netlify
npm run deploy:vercel     # Vercel
# OR upload dist/ folder manually
```

### Mobile Deployment

```bash
# Build mobile apps
npm run cap:build:android  # Android APK
npm run cap:build:ios      # iOS app

# Submit to app stores
# - Upload APK/AAB to Google Play
# - Upload IPA to Apple App Store
```

## Post-Deployment Verification

### ✅ **Functional Testing**

- [ ] Application loads successfully
- [ ] Authentication works
- [ ] Database connections functional
- [ ] Real-time features working
- [ ] Mobile apps install and run (if applicable)

### 📊 **Performance Monitoring**

- [ ] Core Web Vitals acceptable
- [ ] Bundle size within limits
- [ ] API response times < 500ms
- [ ] Database query performance optimized

### 🔍 **Error Monitoring**

- [ ] Error logging configured
- [ ] Sentry/DataDog integration working
- [ ] User feedback system in place
- [ ] Support contact information available

### 🔄 **Maintenance**

- [ ] Automated backup schedule
- [ ] Monitoring alerts configured
- [ ] Log rotation setup
- [ ] Update strategy documented

## Emergency Procedures

### Rollback Plan

1. **Immediate rollback**: Deploy previous version
2. **Database rollback**: Restore from backup if schema changes
3. **Communication**: Notify users of temporary issues
4. **Investigation**: Analyze logs for root cause
5. **Fix & redeploy**: Apply fixes and redeploy

### Monitoring Dashboards

- **Application**: Check uptime and response times
- **Database**: Monitor query performance and connections
- **Error tracking**: Review error rates and user reports
- **User analytics**: Track user engagement and feature usage

## Support & Maintenance

### Regular Tasks

- [ ] Security updates applied monthly
- [ ] Performance monitoring reviewed weekly
- [ ] Database maintenance (vacuum, reindex) monthly
- [ ] Backup integrity verified weekly
- [ ] User feedback reviewed regularly

### Contact Information

- **Technical Support**: [support@stackmastertool.com]
- **Emergency Contact**: [emergency@stackmastertool.com]
- **Documentation**: [docs.stackmastertool.com]

---

## Production Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Web App       │    │   Mobile Apps   │
│   (React)       │    │   (Capacitor)   │
│                 │    │                 │
│ • Vite build    │    │ • Native iOS    │
│ • PWA ready     │    │ • Native Android│
│ • CDN hosted    │    │ • App Store     │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────────────────┘
                │
         ┌─────────────────┐
         │   Supabase      │
         │   Database      │
         │                 │
         │ • PostgreSQL    │
         │ • RLS Security  │
         │ • Real-time     │
         │ • Edge Functions│
         └─────────────────┘
```

## Success Metrics

- **Uptime**: > 99.9%
- **Response Time**: < 500ms
- **Error Rate**: < 0.1%
- **User Satisfaction**: > 4.5/5
- **Mobile App Rating**: > 4.0/5
