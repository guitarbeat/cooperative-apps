# 🎯 Stack Master Tool

**Meeting Facilitation Made Simple**

A modern React TypeScript application for democratic meeting facilitation with real-time speaking queues and analytics.

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build:prod
```

> **Environment variables:** Copy `.env.example` (or create a `.env`) and set
> `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` before starting the dev
> server. See [docs/ENVIRONMENT_SETUP.md](docs/ENVIRONMENT_SETUP.md) for
> details.

## 📊 Version Information

The application includes automated version tracking powered by Aaron's Love ❤️

**Current Version:**
```bash
# Check current version info
node scripts/update-version.js
```

**Version Display:**
- **Footer**: Shows fun, randomized "Powered by Aaron's Love" messages
- **Dev Mode**: Click "Dev Build" for detailed version information
- **Production**: Clean, professional version display

**Build-time Information:**
- Package version from `package.json`
- Git commit hash and branch
- Build timestamp
- Environment detection

**Version Management:**
```bash
# Bump version (updates package.json, creates git commit and tag)
npm version 1.1.0

# Or use the custom script
node scripts/update-version.js 1.1.0
```

## 📁 Project Structure

```
📦 Stack Master Tool
├── 📂 src/                 # Application source code
├── 📂 public/              # Static assets served by Vite
├── 📂 config/              # Shared configuration files
├── 📂 docs/                # Documentation and guides
│   ├── 📄 README.md        # Setup and usage guide
│   └── 📂 deployment/      # Deployment configuration samples
├── 📂 scripts/             # Project maintenance utilities
├── 📂 supabase/            # Supabase migrations and settings
└── 📄 package.json         # Dependencies and scripts
```

## 📚 Documentation

- **[📖 Documentation Index](docs/index.md)** - Complete documentation guide
- **[🚀 Full Documentation](docs/README.md)** - Setup and usage guide
- **[⚙️ Production Setup](docs/ENVIRONMENT_SETUP.md)** - Environment configuration
- **[📋 Deployment](docs/PRODUCTION_CHECKLIST.md)** - Production deployment checklist

## 🛠️ Development

```bash
# Type checking
pnpm type-check

# Linting
pnpm lint

# Testing
pnpm test

# Mobile development
pnpm cap:sync          # Sync mobile platforms
pnpm cap:build:android # Build Android app
pnpm cap:build:ios     # Build iOS app
```

> **Note:** If you run scripts with `npm`, use `./scripts/npm-with-clean-env.sh` (for example,
> `./scripts/npm-with-clean-env.sh run lint`) to mirror the pnpm behaviour and avoid legacy
> `http-proxy` warnings emitted by newer npm releases.

## 🌟 Key Features

- ✅ **Three-Mode Architecture** - HOST (facilitate), JOIN (participate), WATCH (observe) - inspired by jparty.tv
- ✅ **Real-time Speaking Queues** - Live queue management
- ✅ **Meeting Analytics** - Speaking time distribution charts
- ✅ **Display-Optimized Watch Mode** - Perfect for projection screens and observers
- ✅ **Cross-platform** - Web + Mobile (iOS/Android)
- ✅ **Type-safe** - Full TypeScript coverage
- ✅ **Production-ready** - Optimized builds and security

---

**Need help?** Check the [full documentation](docs/README.md) for detailed guides.
