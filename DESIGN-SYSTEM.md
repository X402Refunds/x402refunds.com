# Consulate Design System - Quick Reference

> **Digital Courthouse**: Professional arbitration platform design for enterprise B2B infrastructure

---

## 🎨 Core Color Scheme

### Primary Brand: **Emerald** (#10b981)
- Primary buttons, CTAs, brand accents
- Replaces generic blue across the site
- Conveys trust, verification, authority

### Professional Foundation: **Slate**
- Backgrounds, text, neutral elements
- slate-950 → emerald-950 gradients for hero sections

---

## 🔲 Component Quick Reference

### Buttons

```tsx
// Primary CTA (Emerald gradient)
<Button className="bg-gradient-to-r from-emerald-500 to-green-600 text-white 
                   hover:from-emerald-400 hover:to-green-500 
                   shadow-lg shadow-emerald-500/50">
  Get Started Free
</Button>

// Secondary (Dark professional)
<Button variant="secondary">  // Uses slate-900 background
  View Documentation
</Button>

// Outline (Neutral)
<Button variant="outline">  // Border slate-300, hover slate-100
  Learn More
</Button>
```

### Badges

```tsx
// Success / Operational (Emerald)
<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
  ● Operational
</Badge>

// Feature badges on dark backgrounds
<Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 backdrop-blur-sm">
  Production-Ready
</Badge>
```

### Cards

```tsx
// Standard card with emerald hover
<Card className="border-2 border-slate-200 hover:border-emerald-300 
               shadow-md hover:shadow-xl transition-all duration-300">
  {/* Content */}
</Card>

// Icon card with emerald accent
<Card className="hover:border-emerald-300 group">
  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 
                 rounded-xl group-hover:scale-110 transition-transform">
    <Icon className="text-emerald-600" />
  </div>
</Card>
```

### Hero Sections

```tsx
// Dark professional hero
<section className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950">
  <AnimatedGrid color="#10b981" />
  
  <h1>
    <span className="bg-gradient-to-r from-emerald-400 via-green-300 to-emerald-500 
                   bg-clip-text text-transparent">
      Your Headline
    </span>
  </h1>
</section>
```

---

## 📋 Global Updates Needed

### Find & Replace Patterns

**Primary accent color:**
- ❌ `blue-600` → ✅ `emerald-500` or `emerald-600`
- ❌ `blue-50` → ✅ `emerald-50`
- ❌ `blue-200` → ✅ `emerald-200`

**Hover states:**
- ❌ `hover:text-blue-700` → ✅ `hover:text-emerald-700`
- ❌ `hover:border-blue-300` → ✅ `hover:border-emerald-300`

**Keep blue for:**
- ✅ Info badges/states (use `blue-50`, `blue-600`)
- ✅ Links in body text (secondary accent)

---

## 🎯 Design Principles

1. **Emerald is authority** - Use for primary actions, trust signals
2. **Slate is professional** - Use for structure, text, neutrality
3. **Dark gradients** - from-slate-950 via-slate-900 to-emerald-950
4. **Subtle motion** - AnimatedGrid, not Matrix rain
5. **Enterprise polish** - Shadows, hover states, smooth transitions

---

## ✅ Updated Components

- [x] `globals.css` - CSS variables with emerald primary
- [x] `dashboard/src/components/ui/button.tsx` - New variants
- [x] `dashboard/src/components/AnimatedGrid.tsx` - Professional background
- [x] `dashboard/src/app/page.tsx` - Landing page hero

## ⏳ Pages to Update

Apply emerald accent colors to:
- [ ] `/about` - Replace blue badges/links with emerald
- [ ] `/pricing` - Update card borders, check marks
- [ ] `/dashboard/*` - All dashboard pages
- [ ] All components using `text-blue-600` for primary actions

---

## 📖 Full Documentation

See `internal/design/digital-courthouse-design-system.md` for complete design system documentation.

---

**Key Takeaway**: Emerald (#10b981) is our new brand color. It replaces blue for primary actions, signaling trust and authority appropriate for legal arbitration infrastructure.

