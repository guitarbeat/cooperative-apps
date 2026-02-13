# HouseLove Design System

A comprehensive, accessible design system built with modern CSS custom properties and systematic design principles.

## 🎨 Design Philosophy

This design system prioritizes:
- **Accessibility**: WCAG AA compliance with proper contrast ratios
- **Consistency**: Unified spacing, typography, and component patterns
- **Maintainability**: CSS custom properties for easy theming and updates
- **Scalability**: Modular approach that grows with the application

## 🏗️ Architecture

### Core Files
- `src/styles/design-tokens.css` - Design tokens and component styles
- `src/components/ThemeToggle/` - Dark/light theme switching
- `src/components/StyleGuide/` - Interactive design system showcase

### Import Structure
```css
/* Import in your CSS/SCSS files */
@import './styles/design-tokens.css';
```

## 📏 Typography System

### Font Scale (1.25 ratio)
- **12px** - Body small, captions
- **15px** - Body text, UI labels
- **18px** - Body large, headings 5
- **24px** - Heading 4
- **30px** - Heading 3
- **37px** - Heading 2
- **46px** - Heading 1

### Font Weights
- **300** (Light) - Subtle body text
- **400** (Regular) - Body text, headings 5-6
- **600** (Semibold) - UI labels, headings 2-4
- **700** (Bold) - Heading 1, emphasis

### Line Heights
- **1.2** - Headings (tight, professional)
- **1.4** - UI elements (balanced)
- **1.5** - Body text (readable)

### Letter Spacing
- **-0.02em** - Large headings (tight, modern)
- **0em** - Body text (natural)
- **+0.05em** - Small caps (legible)

## 🎨 Color System

### Brand Colors
- **Primary**: `#E7A29B` (coral pink) - Main brand color
- **Secondary**: `#ef7c8e` (rose) - Supporting actions
- **Accent**: `#d8a7b1` (muted pink) - Subtle highlights

### Color Scale (50-900)
Each color has 10 variants for consistent theming:
- **50-200**: Light backgrounds, subtle borders
- **300-400**: Interactive states, secondary text
- **500**: Base color
- **600-700**: Primary actions, hover states
- **800-900**: Dark text, emphasis

### Semantic Colors
- **Success**: Green variants for positive feedback
- **Warning**: Amber variants for cautionary messages
- **Danger**: Red variants for errors and destructive actions
- **Info**: Blue variants for informational content

### WCAG Compliance
- All text meets 4.5:1 contrast ratio minimum
- Interactive elements have visible focus indicators
- Color is not the only way to convey information

## 📐 Spacing System

### Base Unit: 4px
- **4px** - Micro spacing, borders
- **8px** - Component padding, small gaps
- **12px** - Input padding, medium gaps
- **16px** - Section spacing, button padding
- **20px** - Component margins
- **24px** - Section padding, card padding
- **32px** - Major section spacing
- **40px** - Large margins
- **48px** - Page-level spacing
- **50px** - Custom spacing for specific components
- **64px** - Hero section spacing

## 🔲 Component System

### Buttons
```css
/* Base button */
.btn

/* Sizes */
.btn--sm    /* 32px height */
.btn--md    /* 40px height */
.btn--lg    /* 48px height */

/* Variants */
.btn--primary   /* Primary action */
.btn--secondary /* Secondary action */
.btn--ghost     /* Subtle action */
.btn--danger    /* Destructive action */
.btn--icon      /* Icon-only button */
```

### Inputs
```css
/* Base input */
.input

/* Sizes */
.input--sm    /* 32px height */
.input--md    /* 40px height */
.input--lg    /* 48px height */

/* States */
.is-error     /* Error state */
.is-success   /* Success state */
.is-disabled  /* Disabled state */
```

### Cards
```css
/* Base card */
.card

/* Variants */
.card--pad       /* With padding */
.card--elevated  /* With shadow */
```

### Feedback
```css
/* Badges */
.badge--info     /* Information */
.badge--ok       /* Success */
.badge--warn     /* Warning */
.badge--err      /* Error */

/* States */
.empty           /* Empty state */
.skeleton        /* Loading state */
```

## 🌓 Theme System

### Light Theme (Default)
- Background: Brand dark green
- Surface: White
- Text: Dark grays
- Borders: Subtle grays

### Dark Theme
- Background: Very dark gray
- Surface: Dark gray
- Text: White and light grays
- Borders: Subtle white

### Theme Toggle
```jsx
import ThemeToggle from './components/ThemeToggle';

// Automatically saves preference to localStorage
// Respects system preference on first visit
```

## 🎯 Usage Guidelines

### Typography
```css
/* Use semantic classes */
<h1 className="h1">Main Heading</h1>
<h2 className="h2">Section Heading</h2>
<p className="body">Body text</p>
<p className="body-sm">Small text</p>
<p className="ui">UI label</p>
<p className="caps">Small caps</p>
```

### Spacing
```css
/* Use spacing tokens */
.margin-top { margin-top: var(--space-24); }
.padding { padding: var(--space-16); }

/* Or utility classes */
<div className="m-24 p-16">Content</div>
```

### Colors
```css
/* Use semantic color tokens */
.text-primary { color: var(--primary-600); }
.bg-success { background: var(--success-100); }
.border-subtle { border-color: var(--border-subtle); }
```

## 🚀 Getting Started

### 1. Import Design Tokens
```css
/* In your main CSS file */
@import './styles/design-tokens.css';
```

### 2. Use Component Classes
```jsx
<button className="btn btn--primary btn--md">
  Primary Action
</button>

<div className="card card--pad">
  <h3 className="h3">Card Title</h3>
  <p className="body">Card content</p>
</div>
```

### 3. Apply Typography
```jsx
<h1 className="h1">Main Title</h1>
<p className="body-lg">Large body text</p>
<p className="body">Regular body text</p>
```

### 4. Use Spacing System
```css
.container {
  padding: var(--space-24);
  margin-bottom: var(--space-32);
}
```

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1200px
- **Desktop**: > 1200px

### Typography Scaling
- Headings use `clamp()` for fluid scaling
- Body text maintains readability across devices
- Spacing adjusts proportionally

## ♿ Accessibility Features

### Focus Management
- Visible focus indicators on all interactive elements
- Focus rings use brand colors with proper contrast
- Keyboard navigation support

### Color & Contrast
- Minimum 4.5:1 contrast ratio for text
- Semantic color usage beyond just aesthetics
- High contrast mode support

### Screen Reader Support
- Proper heading hierarchy
- Descriptive button and link text
- ARIA labels where needed

## 🔧 Customization

### Adding New Colors
```css
:root {
  --custom-50: #f0f9ff;
  --custom-100: #e0f2fe;
  /* ... continue scale */
  --custom-900: #0c4a6e;
}
```

### Extending Spacing
```css
:root {
  --space-80: 80px;
  --space-96: 96px;
}
```

### Component Variants
```css
.btn--custom {
  background: var(--custom-600);
  color: var(--on-custom);
}
```

## 📚 Style Guide

Visit `/styleguide` in your application to see:
- Interactive typography examples
- Color palette with all variants
- Component showcase
- Spacing system visualization
- Accessibility guidelines

## 🧪 Testing

### Contrast Testing
- Use browser dev tools to verify contrast ratios
- Test with color blindness simulators
- Validate against WCAG AA standards

### Component Testing
- Test all interactive states (hover, focus, active)
- Verify keyboard navigation
- Test with screen readers

### Theme Testing
- Verify both light and dark themes
- Test theme persistence
- Check system preference detection

## 🤝 Contributing

### Adding New Components
1. Define design tokens in `design-tokens.css`
2. Create component styles using tokens
3. Add to StyleGuide for documentation
4. Update this documentation

### Modifying Existing Components
1. Update design tokens if needed
2. Modify component styles
3. Update StyleGuide examples
4. Test across themes and breakpoints

## 📖 Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [Design Tokens](https://www.designtokens.org/)
- [Accessible Color Contrast](https://webaim.org/resources/contrastchecker/)

---

*This design system is built with ❤️ for the HouseLove application, ensuring beautiful, accessible, and maintainable user interfaces.*
