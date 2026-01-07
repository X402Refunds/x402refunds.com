# Digital Courthouse Design System
## Consulate - Professional Arbitration Platform Design Guidelines v2.0

---

## 🏛️ **Design Philosophy**

**Consulate** is an automated AI vendor dispute resolution platform providing binding arbitration for enterprise AI services. The design language reflects **institutional authority, legal precision, and digital-first professionalism** - built for serious B2B infrastructure, not consumer apps.

### Core Principles

1. **Institutional Authority** - Design conveys trustworthiness and legal weight
2. **Enterprise-Grade** - Stripe-level polish for B2B decision makers
3. **Tech-Forward Professionalism** - Modern without being playful
4. **Transparent Process** - Every step is visible and understandable
5. **Timeless Architecture** - Designed to age gracefully

---

## 🎨 **Color System: Digital Courthouse**

### Primary Palette

#### **Professional Slate** (Backgrounds & Structure)
```css
slate-950: #020617  /* Dark hero backgrounds, deep authority */
slate-900: #0f172a  /* Primary dark backgrounds */
slate-800: #1e293b  /* Secondary dark backgrounds */
slate-700: #334155  /* Tertiary backgrounds, muted text */
slate-600: #475569  /* Body text on light backgrounds */
slate-500: #64748b  /* Secondary text */
slate-400: #94a3b8  /* Disabled/placeholder text */
slate-300: #cbd5e1  /* Borders, dividers */
slate-200: #e2e8f0  /* Card borders, subtle dividers */
slate-100: #f1f5f9  /* Subtle backgrounds */
slate-50:  #f8fafc  /* Page backgrounds */
```

**Usage:**
- **slate-950**: Hero sections, premium dark areas
- **slate-900**: Dashboard backgrounds, dark mode
- **slate-200**: Borders, card outlines
- **slate-50**: Default page backgrounds

---

#### **Blue Authority** (Primary Brand & Actions)
```css
blue-950: #172554    /* Deep blue for gradients */
blue-900: #1e3a8a    /* */
blue-700: #1d4ed8    /* */
blue-600: #2563eb    /* PRIMARY BRAND - Actions, accents, trust */
blue-500: #3b82f6    /* Hover states, highlights */
blue-300: #93c5fd    /* Light accents */
blue-200: #bfdbfe    /* Badge borders */
blue-100: #dbeafe    /* Subtle backgrounds */
blue-50:  #eff6ff    /* Info/success backgrounds */
```

**Usage:**
- **blue-600** (#2563eb): Primary brand color - buttons, links, key actions
- **blue-500**: Hover states, active elements
- **blue-50**: Positive/info badges and subtle backgrounds

**Why Blue?**
- Professional and trustworthy (security/infra associations)
- Matches the landing page and creates a consistent brand across the site
- Works beautifully with slate for high contrast

---

#### **Supporting Indigo** (Complementary Accents)
```css
indigo-600: #4f46e5   /* Complementary to blue */
indigo-500: #6366f1   /* Secondary accents */
```

---

### Semantic Colors: Status System

#### **Success / Approved** (Blue)
```css
blue-600: #2563eb   /* Success actions */
blue-200: #bfdbfe   /* Badge borders */
blue-50:  #eff6ff   /* Success backgrounds */
```

#### **Warning / Pending** (Amber)
```css
amber-600: #d97706   /* Warning states */
amber-200: #fde68a   /* Badge borders */
amber-50:  #fffbeb   /* Warning backgrounds */
```

#### **Error / Disputed** (Red)
```css
red-600: #dc2626     /* Error states */
red-200: #fecaca     /* Badge borders */
red-50:  #fef2f2     /* Error backgrounds */
```

#### **Info / Neutral** (Blue)
```css
blue-600: #2563eb    /* Info states */
blue-200: #bfdbfe    /* Info borders */
blue-50:  #eff6ff    /* Info backgrounds */
```

---

### Neutral Backgrounds

```css
white: #ffffff       /* Card surfaces, content areas */
black: #000000       /* Reserved for text on colored backgrounds */
```

---

## 📐 **Typography**

### Font Families

```css
/* Primary Font - Inter */
font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Monospace - For IDs, data, code */
font-mono: 'JetBrains Mono', 'SF Mono', 'Monaco', monospace;
```

### Type Scale

#### **Display** (Landing page heroes)
```css
text-7xl: 72px / 1.1    /* Main hero */
text-6xl: 60px / 1.1    /* Secondary hero */
text-5xl: 48px / 1.1    /* Large headings */
```

#### **Headings**
```css
text-4xl: 36px / 1.2    /* H1 - Page titles */
text-3xl: 30px / 1.2    /* H2 - Section titles */
text-2xl: 24px / 1.3    /* H3 - Card titles */
text-xl:  20px / 1.4    /* H4 - Component titles */
text-lg:  18px / 1.5    /* H5 - Labels */
```

#### **Body**
```css
text-base: 16px / 1.5   /* Primary body text */
text-sm:   14px / 1.5   /* Secondary text */
text-xs:   12px / 1.4   /* Metadata, timestamps */
```

### Font Weights

```css
font-bold:      700  /* Major headings, emphasis */
font-semibold:  600  /* Section headers, CTAs */
font-medium:    500  /* Labels, navigation */
font-normal:    400  /* Body text */
```

### Typography Rules

**Light Backgrounds:**
- Headings: `text-slate-900 font-bold`
- Body: `text-slate-600 font-normal`
- Labels: `text-slate-700 font-medium`

**Dark Backgrounds:**
- Headings: `text-white font-bold` or `text-blue-300`
- Body: `text-slate-100` or `text-blue-100`
- Labels: `text-slate-200`

---

## 🔲 **Component Library**

### Buttons

#### **Primary Action** (Blue - Main CTAs)
```tsx
<Button className="bg-gradient-to-r from-blue-600 to-blue-700 
                   text-white hover:from-blue-500 hover:to-blue-600 
                   px-8 py-3 rounded-lg font-semibold 
                   shadow-lg shadow-blue-600/40 hover:shadow-xl 
                   transition-all duration-200">
  Get Started Free
</Button>
```

#### **Secondary Action** (Dark Professional)
```tsx
<Button className="bg-slate-900 text-white hover:bg-slate-800 
                   px-8 py-3 rounded-lg font-semibold 
                   shadow-md transition-all duration-200">
  View Documentation
</Button>
```

#### **Outline** (Neutral Action)
```tsx
<Button className="border-2 border-blue-500/50 text-blue-300 
                   hover:bg-blue-500/10 hover:border-blue-400 
                   px-8 py-3 rounded-lg font-semibold backdrop-blur-sm 
                   transition-all duration-200">
  Learn More
</Button>
```

#### **Ghost** (Subtle Actions)
```tsx
<Button className="text-slate-700 hover:bg-slate-100 hover:text-slate-900 
                   px-4 py-2 rounded-lg transition-colors">
  Cancel
</Button>
```

---

### Badges

#### **Status Badges**
```tsx
// Success / Operational
<Badge className="bg-blue-50 text-blue-700 border border-blue-200 
                 font-semibold">
  ● Operational
</Badge>

// Warning / Pending
<Badge className="bg-amber-50 text-amber-700 border border-amber-200 
                 font-semibold">
  ⚠ Pending Review
</Badge>

// Error / Disputed
<Badge className="bg-red-50 text-red-700 border border-red-200 
                 font-semibold">
  ✕ Disputed
</Badge>

// Info
<Badge className="bg-blue-50 text-blue-700 border border-blue-200 
                 font-semibold">
  ℹ In Progress
</Badge>
```

#### **Feature Badges** (On dark backgrounds)
```tsx
<Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 
                 backdrop-blur-sm shadow-lg shadow-blue-500/20">
  Production-Ready
</Badge>
```

---

### Cards

#### **Standard Card** (Light theme)
```tsx
<Card className="bg-white border-2 border-slate-200 
               hover:border-blue-300 hover:shadow-xl 
               shadow-md transition-all duration-300">
  <CardHeader>
    <CardTitle className="text-2xl font-bold text-slate-900">
      Title
    </CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-slate-600">Content</p>
  </CardContent>
</Card>
```

#### **Dark Card** (For dark sections)
```tsx
<Card className="bg-white/5 border-white/10 backdrop-blur-sm 
               hover:bg-white/10 hover:scale-105 
               transition-all duration-300">
  <CardHeader>
    <CardTitle className="text-white">Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-slate-300">Content</p>
  </CardContent>
</Card>
```

#### **Feature Card with Icon**
```tsx
<Card className="border-2 border-slate-200 hover:border-blue-300 
               shadow-md hover:shadow-xl transition-all duration-300 group">
  <CardHeader>
    <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-blue-100 
                   rounded-xl flex items-center justify-center mb-4 
                   group-hover:scale-110 transition-transform">
      <Icon className="h-7 w-7 text-blue-600" />
    </div>
    <CardTitle className="text-2xl text-slate-900">Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-slate-600">Description</p>
  </CardContent>
</Card>
```

---

### Hero Sections

#### **Dark Professional Hero**
```tsx
<section className="relative overflow-hidden min-h-[calc(100vh-80px)] 
                   flex items-center py-20 sm:py-32 
                   bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
  <AnimatedGrid color="#2563eb" />
  
  <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 w-full text-center relative z-10">
    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 
                     backdrop-blur-sm shadow-lg shadow-blue-500/20">
      Production-Ready
    </Badge>
    
    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
      <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500 
                     bg-clip-text text-transparent 
                     drop-shadow-[0_0_30px_rgba(37,99,235,0.5)]">
        Your Headline
      </span>
    </h1>
    
    <p className="text-xl sm:text-2xl text-blue-100 max-w-3xl mx-auto">
      Your subheadline
    </p>
  </div>
</section>
```

#### **Light Professional Section**
```tsx
<section className="py-24 bg-white">
  <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
    <div className="text-center mb-16">
      <Badge className="bg-blue-100 text-blue-700 border-blue-200 mb-4">
        FEATURES
      </Badge>
      <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
        Section Title
      </h2>
      <p className="text-xl text-slate-600 max-w-2xl mx-auto">
        Description
      </p>
    </div>
  </div>
</section>
```

---

## 🧭 **Navigation & Layout Components**

### Navigation Header (Public Pages)

#### **Main Navigation**
```tsx
<nav className="border-b border-blue-200 
                bg-gradient-to-r from-white via-blue-50/30 to-white 
                backdrop-blur-sm sticky top-0 z-50 shadow-lg relative">
  {/* Blue accent bar */}
  <div className="absolute top-0 left-0 right-0 h-1 
                  bg-gradient-to-r from-blue-500/50 via-blue-500 to-blue-500/50" />
  
  {/* Navigation content */}
</nav>
```

**Pattern:**
- Subtle blue gradient background (white → blue-50/30 → white)
- Blue border (border-blue-200) instead of slate
- Blue accent bar at top (1px gradient line)
- Enhanced shadow for depth (shadow-lg)
- Backdrop blur for modern glass effect

#### **Navigation Dropdown Menu**
```tsx
<div className="w-[600px] p-6 
                bg-gradient-to-br from-white to-blue-50/20 
                border-2 border-blue-200 shadow-2xl rounded-lg">
  {/* Menu content */}
</div>
```

**Pattern:**
- Gradient background (white → blue-50/20)
- Blue border (border-blue-200)
- Strong shadow for elevation (shadow-2xl)

---

### Footer

#### **Main Footer**
```tsx
<footer className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 
                  text-slate-400 py-12 sm:py-16 
                  border-t-4 border-blue-600/30 relative">
  {/* Blue accent bar */}
  <div className="absolute top-0 left-0 right-0 h-1 
                  bg-gradient-to-r from-blue-500/50 via-blue-500 to-blue-500/50" />
  
  {/* Footer content */}
</footer>
```

**Pattern:**
- Dark gradient background (slate-900 → slate-900 → blue-950)
- Blue accent border at top (border-t-4 border-blue-600/30)
- Blue accent bar (1px gradient line)
- Text color: slate-400 for readability

**Why this works:**
- Creates visual continuity with blue brand throughout the page
- Dark footer provides strong contrast to white content areas
- Blue gradient adds warmth and brand presence
- Accent bars create cohesive design language

---

### Dashboard Header

#### **Government/Dashboard Header**
```tsx
<header className="bg-gradient-to-r from-white via-blue-50/20 to-white 
                  border-b border-blue-200 px-4 sm:px-6 py-3 relative shadow-sm">
  {/* Blue accent bar */}
  <div className="absolute top-0 left-0 right-0 h-1 
                  bg-gradient-to-r from-blue-500/50 via-blue-500 to-blue-500/50" />
  
  {/* Header content */}
</header>
```

**Pattern:**
- Subtle blue gradient (white → blue-50/20 → white)
- Blue border (border-blue-200)
- Blue accent bar (1px gradient)
- Light shadow for separation (shadow-sm)

**Design Rationale:**
- Matches public navigation header for consistency
- Subtle enough for dashboard context (less prominent than public nav)
- Blue accents maintain brand presence
- Professional appearance suitable for internal tools

---

## 📏 **Spacing & Layout**

### 8-Point Grid System

```css
0:   0px
1:   4px   (0.25rem)
2:   8px   (0.5rem)   /* Base unit */
3:   12px  (0.75rem)
4:   16px  (1rem)
6:   24px  (1.5rem)
8:   32px  (2rem)
12:  48px  (3rem)
16:  64px  (4rem)
24:  96px  (6rem)
32:  128px (8rem)
```

### Container Widths

```css
max-w-7xl: 1280px  /* Main content container */
max-w-4xl: 896px   /* Centered content sections */
max-w-3xl: 768px   /* Text-heavy content */
max-w-2xl: 672px   /* Narrow content */
```

### Section Spacing

```css
py-20:  80px  /* Standard section (desktop) */
py-12:  48px  /* Standard section (mobile) */
py-24:  96px  /* Large section spacing */
```

---

## ✨ **Backgrounds & Effects**

### Animated Grid Background

```tsx
// For dark hero sections
<AnimatedGrid color="#2563eb" />
```

### Gradient Backgrounds

#### **Dark Hero**
```css
bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950
```

#### **Light Sections**
```css
bg-gradient-to-b from-slate-50 to-white
```

#### **Premium Dark Sections**
```css
bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900
```

### Shadows & Elevation

```css
/* Standard card */
shadow-md hover:shadow-xl

/* Premium cards */
shadow-lg hover:shadow-2xl

/* Glowing elements */
shadow-lg shadow-blue-600/40 hover:shadow-xl hover:shadow-blue-600/50
```

---

## 🎯 **Design Patterns**

### Landing Page Structure

1. **Hero Section** - Dark gradient with AnimatedGrid, blue accents
2. **Problem/Solution** - Light background, clear problem/solution split
3. **How It Works** - Light background with numbered steps
4. **Features** - Dark background with premium feel
5. **API Documentation** - Light background with code examples
6. **Final CTA** - Dark gradient, bold call-to-action

### Dashboard Structure

1. **Header** - Light, professional, jurisdiction badge
2. **Sidebar** - Light background, clear navigation
3. **Main Content** - Metric cards, data tables
4. **Cards** - White with blue hover accents

---

## 🚀 **Implementation Guidelines**

### DO ✅

- Use blue-600 (#2563eb) as primary brand color
- Maintain dark hero sections with AnimatedGrid
- Use slate for professional neutrality
- Apply generous whitespace (8-point grid)
- Add subtle hover effects (scale, shadow, border color)
- Use gradients sparingly (hero sections only)
- Ensure high contrast for readability
- Add backdrop-blur to overlays and badges on dark backgrounds

### DON'T ❌

- Don't use playful animations (Matrix rain, particle effects)
- Don't mix multiple bright colors
- Don't use pure black backgrounds (#000) - use slate-950 or slate-900
- Don't create cluttered layouts
- Don't ignore hover states
- Don't use Comic Sans (obviously)
- Don't add emojis unless explicitly requested

---

## 📱 **Responsive Design**

### Mobile-First Breakpoints

```css
sm:   640px   /* Mobile landscape */
md:   768px   /* Tablet */
lg:   1024px  /* Desktop */
xl:   1280px  /* Large desktop */
2xl:  1536px  /* Extra large */
```

### Typography Scaling

```tsx
// Scale down for mobile
className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl"

// Padding scales
className="px-4 sm:px-6 lg:px-8"
className="py-12 sm:py-20 lg:py-32"
```

---

## ♿ **Accessibility**

### Color Contrast

All combinations meet WCAG AA standards (AAA preferred):

```
✅ blue-600 on white:     4.8:1 (AA)
✅ slate-900 on white:   17.5:1 (AAA)
✅ slate-600 on white:    8.2:1 (AAA)
✅ white on blue-600:     4.8:1 (AA)
✅ white on slate-900:   17.5:1 (AAA)
```

### Focus States

```css
focus:outline-none 
focus:ring-2 
focus:ring-blue-500 
focus:ring-offset-2
```

---

## 📋 **Quick Reference**

### Color Quick Picks

```css
/* Primary Brand */
bg-blue-600 text-white                 /* Primary button */
text-blue-600                          /* Links, accents */

/* Backgrounds */
bg-slate-50                            /* Page background (light) */
bg-white                               /* Card background */
bg-slate-900                           /* Dark sections */
bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950     /* Hero */

/* Text */
text-slate-900                         /* Headings (light bg) */
text-slate-600                         /* Body (light bg) */
text-white                             /* Text (dark bg) */
text-blue-100                          /* Text (dark bg, accented) */

/* Borders */
border-slate-200                       /* Default borders */
border-blue-200                        /* Accented borders (headers, footers) */
hover:border-blue-300                  /* Hover states */

/* Header/Footer Patterns */
bg-gradient-to-r from-white via-blue-50/30 to-white             /* Navigation header */
bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950      /* Footer */
border-t-4 border-blue-600/30                                /* Footer accent border */
```

---

## 🎨 **Design System Version**

**Version:** 2.0.1 (Digital Courthouse)  
**Last Updated:** November 2025  
**Previous Version:** 2.0.0 (Digital Courthouse)

### Changelog

- **v2.0.2** (Jan 2026): Switched primary brand color to blue
  - Updated shadcn `--primary` to blue for consistent branding across pages
  - Replaced emerald/green accents in UI components with blue equivalents
  - Updated header/footer accents, glows, and status styling to match landing page
  - Improved visual continuity across all pages
  - Maintains professional appearance while strengthening brand presence

- **v2.0.0** (Nov 2025): Digital Courthouse redesign
  - Professional slate + color system
  - AnimatedGrid background component
  - Removed playful elements (Matrix rain)
  - Enterprise-grade polish
  - Stripe-inspired professionalism

- **v1.0.0** (Oct 2025): Initial Sovereign Civic Design System
  - Institutional slate + blue color system
  - Constitutional-grade component library

---

**Remember:** This is a **legal arbitration platform**, not a consumer app. Every design decision should convey authority, professionalism, and trustworthiness. We're building the Stripe of dispute resolution. 🏛️

