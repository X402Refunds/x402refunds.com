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

#### **Emerald Authority** (Primary Brand & Actions)
```css
emerald-950: #022c22  /* Deep emerald for gradients */
emerald-900: #064e3b  /* */
emerald-600: #059669  /* */
emerald-500: #10b981  /* PRIMARY BRAND - Actions, accents, trust */
emerald-400: #34d399  /* Hover states, highlights */
emerald-300: #6ee7b7  /* Light accents */
emerald-200: #a7f3d0  /* Badge borders */
emerald-100: #d1fae5  /* Subtle backgrounds */
emerald-50:  #ecfdf5  /* Success backgrounds */
```

**Usage:**
- **emerald-500** (#10b981): Primary brand color - buttons, links, key actions
- **emerald-400**: Hover states, active elements
- **emerald-50**: Success states, positive badges

**Why Emerald?**
- Professional and trustworthy (government/legal associations)
- Stands out in enterprise B2B space (differentiates from typical blue)
- Conveys "verified", "approved", "operational" states
- Works beautifully with slate for high contrast

---

#### **Supporting Green** (Complementary Accents)
```css
green-600: #16a34a   /* Complementary to emerald */
green-500: #22c55e   /* Secondary brand accents */
```

---

### Semantic Colors: Status System

#### **Success / Approved** (Emerald)
```css
emerald-600: #059669  /* Success actions */
emerald-200: #a7f3d0  /* Badge borders */
emerald-50:  #ecfdf5  /* Success backgrounds */
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
- Headings: `text-white font-bold` or `text-emerald-300`
- Body: `text-slate-100` or `text-emerald-100`
- Labels: `text-slate-200`

---

## 🔲 **Component Library**

### Buttons

#### **Primary Action** (Emerald - Main CTAs)
```tsx
<Button className="bg-gradient-to-r from-emerald-500 to-green-600 
                   text-white hover:from-emerald-400 hover:to-green-500 
                   px-8 py-3 rounded-lg font-semibold 
                   shadow-lg shadow-emerald-500/50 hover:shadow-xl 
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
<Button className="border-2 border-emerald-500/50 text-emerald-300 
                   hover:bg-emerald-500/10 hover:border-emerald-400 
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
<Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 
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
<Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 
                 backdrop-blur-sm shadow-lg shadow-emerald-500/20">
  Production-Ready
</Badge>
```

---

### Cards

#### **Standard Card** (Light theme)
```tsx
<Card className="bg-white border-2 border-slate-200 
               hover:border-emerald-300 hover:shadow-xl 
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
<Card className="border-2 border-slate-200 hover:border-emerald-300 
               shadow-md hover:shadow-xl transition-all duration-300 group">
  <CardHeader>
    <div className="w-14 h-14 bg-gradient-to-br from-emerald-50 to-emerald-100 
                   rounded-xl flex items-center justify-center mb-4 
                   group-hover:scale-110 transition-transform">
      <Icon className="h-7 w-7 text-emerald-600" />
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
                   bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950">
  <AnimatedGrid color="#10b981" />
  
  <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 w-full text-center relative z-10">
    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 
                     backdrop-blur-sm shadow-lg shadow-emerald-500/20">
      Production-Ready
    </Badge>
    
    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
      <span className="bg-gradient-to-r from-emerald-400 via-green-300 to-emerald-500 
                     bg-clip-text text-transparent 
                     drop-shadow-[0_0_30px_rgba(16,185,129,0.5)]">
        Your Headline
      </span>
    </h1>
    
    <p className="text-xl sm:text-2xl text-emerald-100 max-w-3xl mx-auto">
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
      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 mb-4">
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
<AnimatedGrid color="#10b981" />
```

### Gradient Backgrounds

#### **Dark Hero**
```css
bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950
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
shadow-lg shadow-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/60
```

---

## 🎯 **Design Patterns**

### Landing Page Structure

1. **Hero Section** - Dark gradient with AnimatedGrid, emerald accents
2. **Problem/Solution** - Light background, clear problem/solution split
3. **How It Works** - Light background with numbered steps
4. **Features** - Dark background with premium feel
5. **API Documentation** - Light background with code examples
6. **Final CTA** - Dark gradient, bold call-to-action

### Dashboard Structure

1. **Header** - Light, professional, jurisdiction badge
2. **Sidebar** - Light background, clear navigation
3. **Main Content** - Metric cards, data tables
4. **Cards** - White with emerald hover accents

---

## 🚀 **Implementation Guidelines**

### DO ✅

- Use emerald-500 (#10b981) as primary brand color
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
✅ emerald-500 on white:  4.8:1 (AA)
✅ slate-900 on white:   17.5:1 (AAA)
✅ slate-600 on white:    8.2:1 (AAA)
✅ white on emerald-500:  4.8:1 (AA)
✅ white on slate-900:   17.5:1 (AAA)
```

### Focus States

```css
focus:outline-none 
focus:ring-2 
focus:ring-emerald-500 
focus:ring-offset-2
```

---

## 📋 **Quick Reference**

### Color Quick Picks

```css
/* Primary Brand */
bg-emerald-500 text-white              /* Primary button */
text-emerald-500                       /* Links, accents */

/* Backgrounds */
bg-slate-50                            /* Page background (light) */
bg-white                               /* Card background */
bg-slate-900                           /* Dark sections */
bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950  /* Hero */

/* Text */
text-slate-900                         /* Headings (light bg) */
text-slate-600                         /* Body (light bg) */
text-white                             /* Text (dark bg) */
text-emerald-100                       /* Text (dark bg, accented) */

/* Borders */
border-slate-200                       /* Default borders */
border-emerald-200                     /* Accented borders */
hover:border-emerald-300               /* Hover states */
```

---

## 🎨 **Design System Version**

**Version:** 2.0.0 (Digital Courthouse)  
**Last Updated:** November 2025  
**Previous Version:** 1.0.0 (Sovereign Civic)

### Changelog

- **v2.0.0** (Nov 2025): Digital Courthouse redesign
  - Emerald (#10b981) as primary brand color
  - Professional slate + emerald color system
  - AnimatedGrid background component
  - Removed playful elements (Matrix rain)
  - Enterprise-grade polish
  - Stripe-inspired professionalism

- **v1.0.0** (Oct 2025): Initial Sovereign Civic Design System
  - Institutional slate + blue color system
  - Constitutional-grade component library

---

**Remember:** This is a **legal arbitration platform**, not a consumer app. Every design decision should convey authority, professionalism, and trustworthiness. We're building the Stripe of dispute resolution. 🏛️

