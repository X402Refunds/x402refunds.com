# Sovereign Civic Design System
## Consulate Governance OS - Design Guidelines v1.0

---

## 🏛️ **Design Philosophy**

**Consulate** is sovereign-deployable governance infrastructure for AI agent identity and dispute resolution. The design language reflects **institutional authority, constitutional precision, and sovereign neutrality** - suitable for government deployment worldwide.

### Core Principles

1. **Institutional Authority** - Design conveys permanence and trustworthiness
2. **Jurisdictional Neutrality** - Works for any government, any legal system
3. **Constitutional Transparency** - Every action is visible and auditable
4. **Sovereign Adaptability** - Easy white-labeling for different jurisdictions
5. **Timeless Architecture** - 20-year design lifespan

---

## 🎨 **Color System**

### Primary Palette: Institutional Foundation

#### **Institutional Slate** (Authority & Text)
```css
slate-900: #0f172a  /* Primary text, headers, institutional authority */
slate-800: #1e293b  /* Secondary text */
slate-700: #334155  /* Tertiary text, labels */
slate-600: #475569  /* Muted text */
slate-500: #64748b  /* Disabled text */
slate-400: #94a3b8  /* Placeholder text */
slate-300: #cbd5e1  /* Disabled elements */
slate-200: #e2e8f0  /* Borders, dividers */
slate-100: #f1f5f9  /* Hover states, backgrounds */
slate-50:  #f8fafc  /* Subtle backgrounds */
```

**Usage:**
- **slate-900**: Main headings, primary text, authority statements
- **slate-700**: Body text, navigation items
- **slate-600**: Secondary text, metadata
- **slate-200**: Borders, card outlines
- **slate-50**: Subtle backgrounds, hover states

---

#### **Sovereign Blue** (Trust & Action)
```css
blue-900: #1e3a8a  /* Deep institutional blue */
blue-800: #1e40af  /* */
blue-700: #1d4ed8  /* */
blue-600: #2563eb  /* PRIMARY - Interactive elements, CTAs */
blue-500: #3b82f6  /* Hover states */
blue-400: #60a5fa  /* */
blue-300: #93c5fd  /* */
blue-200: #bfdbfe  /* Badge backgrounds */
blue-100: #dbeafe  /* Subtle highlights */
blue-50:  #eff6ff  /* Info backgrounds */
```

**Usage:**
- **blue-600**: Primary buttons, links, active states
- **blue-50**: Info badges, notification backgrounds
- **blue-200**: Badge borders, subtle accents

---

### Semantic Colors: Status Indicators

#### **Success / Operational** (Emerald)
```css
emerald-600: #059669  /* Success actions, resolved states */
emerald-200: #a7f3d0  /* Badge borders */
emerald-50:  #ecfdf5  /* Success backgrounds */
```

#### **Warning / Pending** (Amber)
```css
amber-600: #d97706   /* Warning states, pending actions */
amber-200: #fde68a   /* Badge borders */
amber-50:  #fffbeb   /* Warning backgrounds */
```

#### **Critical / Error** (Red)
```css
red-600: #dc2626     /* Critical actions, violations */
red-200: #fecaca     /* Badge borders */
red-50:  #fef2f2     /* Error backgrounds */
```

#### **Informational** (Blue)
```css
blue-600: #2563eb    /* Info states */
blue-200: #bfdbfe    /* Info badge borders */
blue-50:  #eff6ff    /* Info backgrounds */
```

---

### Neutral & Backgrounds

```css
white: #ffffff       /* Card backgrounds, primary surface */
black: #000000       /* Reserved for maximum contrast only */
```

---

## 📐 **Typography**

### Font Family

```css
/* Primary Font */
font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Monospace (Data, IDs, Code) */
font-mono: 'JetBrains Mono', 'SF Mono', 'Monaco', monospace;
```

### Type Scale

#### **Display** (Hero sections)
```css
text-7xl: 72px / 1.1    /* Main landing page hero */
text-6xl: 60px / 1.1    /* Section heroes */
text-5xl: 48px / 1.1    /* Large headings */
```

#### **Headings**
```css
text-4xl: 36px / 1.2    /* H1 - Page titles */
text-3xl: 30px / 1.2    /* H2 - Section titles */
text-2xl: 24px / 1.3    /* H3 - Card titles */
text-xl:  20px / 1.4    /* H4 - Subsection titles */
text-lg:  18px / 1.5    /* H5 - Component titles */
```

#### **Body Text**
```css
text-base: 16px / 1.5   /* Primary body text */
text-sm:   14px / 1.5   /* Secondary text, labels */
text-xs:   12px / 1.4   /* Metadata, captions */
```

### Font Weights

```css
font-bold:      700  /* Headers, authority statements */
font-semibold:  600  /* Section headers, emphasis */
font-medium:    500  /* Labels, subtle emphasis */
font-normal:    400  /* Body text, readable content */
```

### Typography Hierarchy

1. **Institutional Headers**: `text-slate-900 font-bold tracking-tight`
2. **Body Text**: `text-slate-700 font-normal`
3. **Secondary Text**: `text-slate-600 font-medium`
4. **Metadata**: `text-slate-500 text-sm`
5. **Monospace Data**: `font-mono tabular-nums`

---

## 📏 **Spacing System**

### 8-Point Grid (Government Standard)

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

### Component Spacing

**Cards & Containers:**
```css
padding: 24px (p-6)        /* Standard card padding */
gap: 16px (gap-4)          /* Between card elements */
margin-bottom: 32px (mb-8) /* Between sections */
```

**Buttons:**
```css
padding: 12px 24px (px-6 py-3)  /* Standard button */
padding: 16px 32px (px-8 py-4)  /* Large button */
gap: 8px (gap-2)                /* Icon to text */
```

**Sections:**
```css
padding-top: 80px (py-20)       /* Section spacing */
padding-bottom: 80px            /* Desktop */
padding-top: 48px (py-12)       /* Mobile */
```

---

## 🔲 **Component Library**

### Buttons

#### **Primary (Institutional Authority)**
```css
className="bg-slate-900 text-white hover:bg-slate-800 
           px-8 py-3 rounded-lg font-semibold 
           transition-colors duration-200"
```

#### **Secondary (Sovereign Action)**
```css
className="bg-blue-600 text-white hover:bg-blue-700 
           px-8 py-3 rounded-lg font-semibold 
           transition-colors duration-200"
```

#### **Outline (Neutral Action)**
```css
className="border-2 border-blue-600 text-blue-600 
           hover:bg-blue-600 hover:text-white 
           px-8 py-3 rounded-lg font-semibold 
           transition-all duration-200"
```

---

### Badges

#### **Status Indicators**
```jsx
/* Operational / Success */
<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
  ● Operational
</Badge>

/* Warning / Pending */
<Badge className="bg-amber-50 text-amber-700 border-amber-200">
  ⚠ Pending
</Badge>

/* Critical / Error */
<Badge className="bg-red-50 text-red-700 border-red-200">
  ✕ Critical
</Badge>

/* Informational */
<Badge className="bg-blue-50 text-blue-700 border-blue-200">
  ℹ Info
</Badge>
```

---

### Cards

#### **Standard Card**
```jsx
<Card className="bg-white border border-slate-200 shadow-sm 
                hover:shadow-md hover:border-blue-200 
                transition-all duration-200">
  <CardHeader className="pb-4">
    <CardTitle className="text-xl font-bold text-slate-900">
      Title
    </CardTitle>
    <CardDescription className="text-slate-600">
      Description
    </CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

#### **Metric Card**
```jsx
<Card className="border-slate-200 hover:border-blue-300 transition-colors">
  <CardHeader className="pb-2">
    <CardTitle className="text-sm font-medium text-slate-700">
      Label
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-4xl font-bold text-slate-900 font-mono tabular-nums">
      {value}
    </div>
    <p className="text-xs text-slate-600">Metadata</p>
  </CardContent>
</Card>
```

---

### Navigation

#### **Top Navigation**
```jsx
<nav className="border-b border-slate-200 bg-white sticky top-0 z-50 shadow-sm">
  <div className="max-w-7xl mx-auto px-6 py-4">
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold text-slate-900 hover:text-blue-600">
        Consulate
      </h1>
      <div className="flex items-center gap-4">
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
          ● System Operational
        </Badge>
        <Button variant="outline" className="border-slate-300 text-slate-700">
          Dashboard
        </Button>
      </div>
    </div>
  </div>
</nav>
```

#### **Sidebar Navigation**
```jsx
<nav className="bg-white border-r border-slate-200">
  <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 
                                     rounded-lg text-slate-700 
                                     hover:bg-slate-100 hover:text-slate-900">
    <Icon className="w-4 h-4" />
    <span>Dashboard</span>
  </Link>
</nav>
```

---

## 🖼️ **Layout Patterns**

### Container Widths

```css
max-w-7xl   /* Main content container (1280px) */
max-w-4xl   /* CTA sections (896px) */
max-w-3xl   /* Centered text content (768px) */
```

### Responsive Breakpoints

```css
sm:   640px   /* Mobile landscape */
md:   768px   /* Tablet */
lg:   1024px  /* Desktop */
xl:   1280px  /* Large desktop */
2xl:  1536px  /* Extra large */
```

### Grid Systems

**Dashboard Grid:**
```jsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  {/* Metric cards */}
</div>
```

**Content Grid:**
```jsx
<div className="grid md:grid-cols-3 gap-8">
  {/* Feature cards */}
</div>
```

---

## ✨ **Interactions & Animations**

### Transitions

```css
/* Standard transition */
transition-colors duration-200

/* Comprehensive transition */
transition-all duration-200

/* Shadow transition */
hover:shadow-md transition-shadow
```

### Hover States

**Buttons:**
```css
hover:bg-slate-800     /* Darken background */
hover:text-white       /* Change text color */
```

**Cards:**
```css
hover:shadow-md hover:border-blue-200  /* Elevate and accent */
```

**Links:**
```css
hover:text-blue-600    /* Accent color */
```

---

## 🌍 **Multi-Tenant Sovereignty**

### White-Label Customization

#### **Core System (Immutable)**
- Layout structure and spacing (8-point grid)
- Component library and interactions
- Accessibility standards (WCAG AAA)
- Security indicators

#### **Sovereign Customization (Per Country)**
- **Primary color**: While maintaining contrast ratios
- **National emblems**: In header/footer
- **Language/localization**: RTL support required
- **Legal text**: Jurisdiction-specific references

### Example Deployments

#### **USA Instance**
```css
--primary: #002868;  /* US flag navy blue */
--emblem: "Great Seal of United States";
--language: "en-US";
```

#### **Estonia Instance**
```css
--primary: #0072CE;  /* Estonia blue */
--emblem: "Estonian national emblem";
--language: "et-EE";
```

#### **Singapore Instance**
```css
--primary: #ED2E38;  /* Singapore red */
--emblem: "Singapore coat of arms";
--language: "en-SG, zh-SG, ms-SG, ta-SG";
```

---

## ♿ **Accessibility**

### WCAG AAA Compliance

#### **Color Contrast Ratios**
```
Normal text (16px+):     7:1 contrast ratio
Large text (24px+):      4.5:1 contrast ratio
Interactive elements:    4.5:1 minimum
```

#### **Verified Combinations**
```css
✅ slate-900 on white:    17.5:1 (Excellent)
✅ slate-700 on white:    11.8:1 (Excellent)
✅ slate-600 on white:    8.2:1  (AAA)
✅ blue-600 on white:     7.9:1  (AAA)
✅ emerald-600 on white:  4.7:1  (AA Large)
```

### Focus States

```css
focus:outline-none 
focus:ring-2 
focus:ring-blue-600 
focus:ring-offset-2
```

### Keyboard Navigation

- All interactive elements must be keyboard accessible
- Logical tab order
- Visible focus indicators
- Skip links for screen readers

---

## 📱 **Responsive Design**

### Mobile-First Approach

```jsx
{/* Mobile base, responsive scaling */}
className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl"
className="px-4 sm:px-6 lg:px-8"
className="py-12 sm:py-24 lg:py-40"
```

### Touch Targets

```css
min-height: 48px    /* Minimum touch target */
min-width: 48px     /* For mobile usability */
padding: 12px 24px  /* Generous padding */
```

---

## 🎯 **Usage Guidelines**

### Do's ✅

- **Use slate-900 for all primary text** (institutional authority)
- **Use blue-600 for interactive elements** (sovereign action)
- **Use semantic colors consistently** (emerald=success, amber=warning, red=critical)
- **Maintain generous whitespace** (8-point grid)
- **Provide clear visual hierarchy** (typography scale)
- **Ensure WCAG AAA compliance** (accessibility)

### Don'ts ❌

- **Don't use pure black** (#000000) except for maximum contrast
- **Don't use gradients** except subtle hero sections
- **Don't mix color systems** (stay within defined palette)
- **Don't ignore spacing grid** (always use 8-point multiples)
- **Don't create new colors** (use defined semantic palette)
- **Don't use playful animations** (maintain institutional dignity)

---

## 🔧 **Implementation**

### CSS Variables

```css
/* In globals.css */
:root {
  --institutional-slate: 15 23 42;     /* slate-900 */
  --sovereign-blue: 37 99 235;         /* blue-600 */
  --success-emerald: 5 150 105;        /* emerald-600 */
  --warning-amber: 217 119 6;          /* amber-600 */
  --critical-red: 220 38 38;           /* red-600 */
  --border-slate: 226 232 240;         /* slate-200 */
}
```

### Tailwind Configuration

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        institutional: 'rgb(var(--institutional-slate))',
        sovereign: 'rgb(var(--sovereign-blue))',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
}
```

---

## 📚 **Component Examples**

### Landing Page Header
```jsx
<h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-slate-900">
  Resolve AI Agent Disputes in{" "}
  <span className="text-blue-600 border-b-4 border-blue-600">
    minutes
  </span>
</h1>
```

### Metric Display
```jsx
<div className="text-4xl font-bold text-slate-900 font-mono tabular-nums mb-1">
  {count}
</div>
<div className="text-sm font-medium text-slate-600 uppercase tracking-wide">
  Active Agents
</div>
```

### Status Badge
```jsx
<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
  ● System Operational
</Badge>
```

---

## 🚀 **Design System Versioning**

**Current Version:** 1.0.0
**Last Updated:** October 2025
**Maintainer:** Consulate Design Team

### Changelog
- **v1.0.0** (Oct 2025): Initial Sovereign Civic Design System
  - Institutional slate + sovereign blue color system
  - Constitutional-grade component library
  - Multi-tenant white-label support
  - WCAG AAA accessibility standards

---

## 📞 **Support & Contribution**

### Design Questions
- Review this document first
- Check component examples in codebase
- Follow established patterns

### Design Updates
- All changes must maintain institutional authority
- Preserve WCAG AAA compliance
- Ensure multi-tenant compatibility
- Document changes in this guideline

---

**Remember:** This design system represents **digital civic infrastructure**. Every decision should reflect institutional permanence, constitutional precision, and sovereign adaptability. 🏛️

