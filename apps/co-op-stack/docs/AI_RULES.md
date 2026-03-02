# AI Development Rules for Stack Master Tool

## Tech Stack Overview

This is a modern React TypeScript application built for meeting facilitation and stack management. The tech stack consists of:

### Core Technologies

- **Frontend Framework**: React 18 with TypeScript (strict mode enabled)
- **Build Tool**: Vite with SWC for fast development and optimized production builds
- **Package Manager**: pnpm (efficient package manager with strict dependency resolution)
- **Mobile Framework**: Capacitor (cross-platform mobile apps)
- **Backend/Database**: Supabase (PostgreSQL with real-time subscriptions)

### UI & Styling

- **CSS Framework**: Tailwind CSS with custom design system
- **UI Components**: shadcn/ui (built on Radix UI primitives)
- **Icons**: Lucide React
- **Theming**: next-themes with CSS custom properties
- **Typography**: @tailwindcss/typography plugin

### State Management & Data

- **Server State**: TanStack React Query (v5) for caching and synchronization
- **Forms**: React Hook Form with Zod schema validation
- **Authentication**: Supabase Auth with localStorage persistence

### Development Tools

- **Testing**: Vitest for unit tests, Playwright for E2E tests
- **Code Quality**: ESLint + TypeScript ESLint, Prettier
- **Git Hooks**: Husky with lint-staged for pre-commit quality checks
- **Coverage**: V8 coverage provider with 80% thresholds

### Additional Libraries

- **Routing**: React Router DOM v6
- **Charts**: Recharts for data visualization
- **Drag & Drop**: @dnd-kit for interactive components
- **Date Handling**: date-fns for date manipulation
- **QR Codes**: qrcode library for generating meeting links
- **Notifications**: Sonner for toast notifications

## Library Usage Rules

### 🚫 NEVER USE - Forbidden Libraries

- **No jQuery** - Modern React patterns replace DOM manipulation needs
- **No Moment.js** - Use date-fns instead
- **No Redux/Zustand** - Use TanStack Query for server state, local component state for UI
- **No Axios** - Use Supabase client or fetch API
- **No Lodash** - Use native JavaScript methods or small utility libraries
- **No Material-UI/MUI** - Stick to shadcn/ui + Radix UI
- **No Styled Components/Emotion** - Use Tailwind CSS classes
- **No React Testing Library alternatives** - Use built-in Vitest with jsdom

### ✅ REQUIRED - Always Use These

#### UI Components

```typescript
// ✅ Always import from shadcn/ui components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

// ✅ Always use Radix UI primitives for advanced interactions
import * as DialogPrimitive from "@radix-ui/react-dialog";
```

#### Forms & Validation

```typescript
// ✅ Always use React Hook Form + Zod
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
});

const form = useForm({
  resolver: zodResolver(schema),
});
```

#### Data Fetching

```typescript
// ✅ Always use TanStack Query for server state
import { useQuery, useMutation } from "@tanstack/react-query";

const { data, isLoading } = useQuery({
  queryKey: ["meetings"],
  queryFn: fetchMeetings,
});
```

#### Database Operations

```typescript
// ✅ Always use Supabase client
import { supabase } from "@/integrations/supabase/client";

const { data, error } = await supabase
  .from("meetings")
  .select("*")
  .eq("id", meetingId);
```

#### Icons

```typescript
// ✅ Always use Lucide React icons
import { Users, Clock, CheckCircle } from "lucide-react";
```

#### Styling

```typescript
// ✅ Always use Tailwind classes (never inline styles)
<div className="flex items-center justify-between p-4 bg-card rounded-lg">
  {/* Content */}
</div>

// ✅ Use custom CSS variables for theme colors
<div className="text-primary hover:text-primary-hover">
  {/* Content */}
</div>
```

### 🎯 CONDITIONAL - Use When Appropriate

#### Charts & Data Visualization

```typescript
// ✅ Use Recharts for data visualization
import { LineChart, Line, XAxis, YAxis } from "recharts";

// Only when displaying charts/graphs
const MyChart = () => (
  <LineChart data={data}>
    <Line type="monotone" dataKey="value" stroke="#8884d8" />
  </LineChart>
);
```

#### Drag & Drop

```typescript
// ✅ Use @dnd-kit for drag-and-drop functionality
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";

// Only when implementing drag-and-drop interactions
```

#### Date Handling

```typescript
// ✅ Use date-fns for date manipulation
import { format, addDays, isAfter } from "date-fns";

// Only for complex date operations
const formattedDate = format(new Date(), "yyyy-MM-dd");
```

#### QR Code Generation

```typescript
// ✅ Use qrcode library for QR codes
import QRCode from "qrcode";

// Only when generating QR codes for meeting sharing
```

#### Keyboard Shortcuts

```typescript
// ✅ Use react-hotkeys-hook for keyboard shortcuts
import { useHotkeys } from "react-hotkeys-hook";

// Only when implementing keyboard shortcuts
```

## Code Organization Rules

### File Structure

- **Components**: `src/components/` - Reusable UI components
- **Pages**: `src/pages/` - Route components
- **Hooks**: `src/hooks/` - Custom React hooks
- **Services**: `src/services/` - API calls and external service integrations
- **Utils**: `src/utils/` - Pure utility functions
- **Types**: `src/types/` - TypeScript type definitions
- **Integrations**: `src/integrations/` - Third-party service integrations

### Import Aliases

```typescript
// ✅ Use configured path aliases
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
```

### Component Patterns

- **Always use TypeScript** with strict mode
- **Use functional components** with hooks
- **Prefer custom hooks** for shared logic
- **Use proper error boundaries** for error handling
- **Implement loading states** appropriately

### Testing Rules

- **Unit tests**: Use Vitest with jsdom environment
- **E2E tests**: Use Playwright for critical user journeys
- **Coverage thresholds**: Maintain 80% across branches, functions, lines, statements
- **Test file location**: Co-located with components or in `__tests__` folders

## Performance Guidelines

### Bundle Optimization

- **Code splitting**: Implemented in Vite config with manual chunks
- **Tree shaking**: Enabled by default with ES modules
- **Minification**: Terser with console/debugger removal in production

### Image Optimization

- **Use appropriate formats**: WebP preferred, with fallbacks
- **Lazy loading**: Implement for images below the fold
- **Compression**: Optimize images before committing

### Database Optimization

- **Use Supabase real-time subscriptions** for live updates
- **Implement proper caching** with TanStack Query
- **Use appropriate indexes** on frequently queried columns

## Security Guidelines

### Authentication

- **Always use Supabase Auth** for user management
- **Implement proper session handling** with auto-refresh
- **Validate user permissions** on protected routes

### Data Validation

- **Use Zod schemas** for runtime validation
- **Sanitize user inputs** before database operations
- **Implement proper error handling** without exposing sensitive information

### Environment Variables

- **Never commit secrets** to version control
- **Use environment-specific configs** for different deployment environments
- **Validate required environment variables** at startup

## Deployment Rules

### Build Process

- **Use Vite build** for optimized production bundles
- **Enable source maps** only in development
- **Configure proper chunk splitting** for optimal loading

### Hosting

- **Primary**: Netlify/Vercel for frontend hosting
- **Database**: Supabase (managed PostgreSQL)
- **CDN**: Automatic with hosting providers

## Development Workflow

### Code Quality

- **ESLint**: Strict configuration with TypeScript rules
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks for quality checks
- **TypeScript**: Strict mode with comprehensive type checking

### Git Practices

- **Conventional commits**: Use semantic commit messages
- **Branch naming**: feature/, bugfix/, hotfix/ prefixes
- **PR reviews**: Required for all changes
- **Testing**: All changes must include appropriate tests

## Migration/Upgrade Rules

### Dependency Updates

- **Regular updates**: Keep dependencies current for security
- **Breaking changes**: Test thoroughly before deployment
- **Peer dependencies**: Ensure compatibility between related packages

### Framework Migrations

- **React versions**: Test compatibility before major upgrades
- **Node versions**: Support LTS versions only
- **Browser support**: Modern browsers only (ES2020+)

---

## Quick Reference

| Purpose       | Library               | When to Use           |
| ------------- | --------------------- | --------------------- |
| UI Components | shadcn/ui + Radix     | Always                |
| Forms         | React Hook Form + Zod | Always                |
| Data Fetching | TanStack Query        | Always                |
| Database      | Supabase              | Always                |
| Styling       | Tailwind CSS          | Always                |
| Icons         | Lucide React          | Always                |
| Charts        | Recharts              | When visualizing data |
| Drag & Drop   | @dnd-kit              | When needed           |
| Dates         | date-fns              | For date manipulation |
| QR Codes      | qrcode                | For sharing features  |
| Testing       | Vitest + Playwright   | Unit tests + E2E      |
| Build         | Vite + SWC            | Always                |
| Quality       | ESLint + Prettier     | Always                |
