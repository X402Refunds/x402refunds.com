# Consulate Agent Government OS - Professional Dashboard Specification

## Overview
Create an ultra-professional governance dashboard interface using shadcn/ui components, inspired by inference.net's clean, minimalist design aesthetic. The interface should feel institutional and serious - like enterprise-grade software that governments would use to manage AI agent infrastructure.

## Design Principles
- **Minimalism**: Clean, uncluttered layouts with purposeful white space
- **Professional Authority**: Convey institutional credibility and technical sophistication
- **Information Hierarchy**: Clear visual hierarchy with excellent typography
- **Government-Grade**: Look like software used by national institutions

## Color Scheme & Theme (inference.net inspired)
- **Primary Background**: Clean white (#ffffff) with subtle off-white sections (#f8fafc)
- **Card Backgrounds**: Pure white (#ffffff) with subtle shadows
- **Border Colors**: Light gray (#e2e8f0) for subtle definition
- **Text Colors**: 
  - Primary text: Charcoal (#0f172a)
  - Secondary text: Slate gray (#64748b)
  - Muted text: Light slate (#94a3b8)
- **Accent Colors**:
  - Success/For votes: Professional green (#059669)
  - Warning/Against votes: Professional red (#dc2626)
  - Primary brand: Deep blue (#1e40af)
  - Interactive elements: Blue (#3b82f6)

## Layout Structure

### Header Bar (shadcn/ui approach)
- **Left**: "Consulate" logo with professional typography
- **Center**: Clean navigation tabs (Dashboard, Agents, Governance, Court Engine)
- **Right**: User profile dropdown or settings menu
- **Style**: Fixed header with subtle border-bottom, minimal shadow

### Left Sidebar Navigation (shadcn/ui components)
Clean vertical navigation using shadcn NavigationMenu:
- **Court Engine** (Dispute Resolution)
- **Agent Registry** (Active AI Agents)  
- **Constitutional Framework** (Live Governance)
- **Sovereignty Controls** (Government Oversight)
- **Treasury** (Economic Management)
- **Federation** (International Cooperation)
- **Transparency** (Audit & Compliance)

**Style Notes:**
- Use shadcn Navigation components with subtle hover states
- Clean icons (Lucide React) with consistent spacing
- Professional gray sidebar background (#f8fafc)
- Active state with subtle blue accent

Below modules, include tagline:
"Constitutional AI Government Operating System"

### Main Content Area

#### Top Metrics Row (shadcn/ui Cards)
Three metric cards using shadcn Card components:

**Card 1: Active AI Agents**
- Primary metric: "137" (large, bold typography)
- Trend indicator: "+5.2%" (professional green #059669)
- Label: "Active AI Agents" (secondary text color)
- Icon: Activity icon from Lucide React

**Card 2: Constitutional Proposals** 
- Primary metric: "19"
- Trend indicator: "-1.4%" (professional red #dc2626)
- Label: "Active Proposals"
- Icon: FileText icon from Lucide React

**Card 3: Governance Actions**
- Primary metric: "14"
- Trend indicator: "+2.7%" (professional green)
- Label: "Completed This Month"
- Icon: CheckCircle icon from Lucide React

**Card Styling:**
- Use shadcn Card component with subtle shadow
- Clean white background (#ffffff)
- Generous padding (p-6)
- Subtle border (#e2e8f0)
- Hover effect with slight elevation

#### Constitutional Proposal Section (shadcn/ui)
**Section Title**: "Active Constitutional Proposal" (using shadcn heading typography)

**Proposal Card (shadcn Card component)**:
- **Title**: "Constitutional Amendment #42 - AI Agent Operational Standards"
- **Description**: Brief proposal summary with professional typography
- **Progress Component**: shadcn Progress component showing vote distribution
  - 68% progress fill in professional green (#059669)
  - Clean progress track in light gray
- **Vote Metrics**: 
  - "68% Supporting" (left, with thumbs-up icon)
  - "32% Opposing" (right, with thumbs-down icon)
- **Timing**: "Voting ends in 2h 14m" (top-right, muted text)
- **Action Buttons** (shadcn Button components):
  - Primary button: "Support Amendment" (solid blue #1e40af)
  - Secondary button: "Oppose Amendment" (outline variant)

**Card Features**:
- Clean white background with subtle shadow
- Professional spacing and typography
- Lucide React icons for visual clarity

#### AI Agent Registry (shadcn/ui Table)
**Section Title**: "Constitutional AI Agent Registry"

**Table Component (shadcn Table)**:
**Columns:**
- **Agent ID**: Clean identifier formatting (AG-101, AG-102)
- **Classification**: Two-dimensional system (e.g., "Verified.Legal", "Premium.Financial")
- **Specialization**: Functional capabilities and certifications
- **Reputation Score**: Professional numeric display with trend indicators
- **Constitutional Status**: Compliance status with clear indicators

**Sample Data (Government-focused)**:
1. **AG-101** | Verified.Legal | Constitutional Law, Compliance | 94 ⬆️ | Active ✅
2. **AG-102** | Premium.Financial | Treasury, Economic Policy | 88 ⬆️ | Active ✅  
3. **AG-103** | Physical.Security | Border Control, Enforcement | 76 ⬇️ | Under Review ⚠️
4. **AG-104** | Verified.Healthcare | Public Health, Emergency Response | 91 ⬆️ | Active ✅

**Table Styling:**
- Use shadcn Table component with clean borders
- Alternating row backgrounds for readability
- Professional status badges (shadcn Badge component)
- Sortable columns with subtle hover states
- Responsive design with proper spacing

## Typography (inference.net inspired)
- **Font Family**: Inter (fallback: system-ui, -apple-system, sans-serif)
- **Font Weights**:
  - Light (300): Subtle text, captions
  - Regular (400): Body text, descriptions
  - Medium (500): Emphasis, labels
  - Semi-bold (600): Section headings, important metrics
  - Bold (700): Page titles, primary metrics
- **Font Scale** (following shadcn conventions):
  - **Display**: text-4xl (36px) for page titles
  - **Headline**: text-2xl (24px) for section headers
  - **Title**: text-xl (20px) for card titles
  - **Body**: text-base (16px) for standard content
  - **Caption**: text-sm (14px) for secondary information
  - **Metrics**: text-3xl (30px) with font-bold for key numbers
- **Line Height**: 1.5 for body text, 1.2 for headings
- **Letter Spacing**: -0.025em for headings, normal for body

## Interactive Elements (shadcn/ui components)
- **Buttons**: Use shadcn Button component variants
  - Primary: Solid background, professional blue (#1e40af)
  - Secondary: Outline variant with subtle border
  - Ghost: Transparent background for subtle actions
  - Destructive: Professional red for critical actions
- **Hover States**: Subtle opacity changes and micro-animations
- **Progress Bars**: shadcn Progress component with smooth animations
- **Form Elements**: shadcn Input, Select, Checkbox components
- **Status Indicators**: shadcn Badge component with color variants

## Spacing & Layout (Tailwind/shadcn approach)
- **Container**: max-w-7xl mx-auto for main content
- **Grid**: CSS Grid with consistent gaps (gap-6, gap-8)
- **Card Spacing**: p-6 for card interiors, space-y-4 for content stacking
- **Section Spacing**: space-y-8 between major sections
- **Responsive**: Mobile-first responsive design with proper breakpoints

## shadcn/ui Component Implementation
- **Card**: For metrics, proposals, and content containers
- **Table**: For agent registry and data display
- **Button**: All interactive actions
- **Badge**: Status indicators and classifications
- **Progress**: Voting results and completion metrics
- **Navigation Menu**: Sidebar and header navigation
- **Dropdown Menu**: User actions and settings
- **Tooltip**: Contextual help and information
- **Alert**: System notifications and status messages

## Data Visualization (Professional Standards)
- **Metrics Display**: Large, bold numbers with subtle trend indicators
- **Progress Components**: Clean shadcn Progress bars with professional color coding
- **Real-time Updates**: Subtle fade-in animations for data changes
- **Status Visualization**: Professional badge system with clear hierarchy
- **Charts/Graphs**: Clean, minimal styling with inference.net aesthetic

## Accessibility (Government Standards)
- **Color Contrast**: WCAG AA compliance with 4.5:1 contrast ratios
- **Keyboard Navigation**: Full keyboard accessibility with focus indicators
- **Screen Readers**: Proper ARIA labels and semantic HTML structure
- **Visual Indicators**: Icons combined with color for status (not color alone)
- **Font Sizes**: Minimum 16px for body text, scalable with user preferences

## Technical Implementation
- **Framework**: React with TypeScript (recommended for government applications)
- **UI Library**: shadcn/ui components with Tailwind CSS
- **Icons**: Lucide React (consistent, professional icon set)
- **Animations**: Framer Motion for subtle micro-interactions
- **State Management**: Zustand or React Context for clean state handling
- **Build Tool**: Vite for fast development and production builds

## shadcn/ui Setup Requirements
```bash
# Core shadcn/ui installation
npx shadcn-ui@latest init

# Required components for this interface
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add table
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add navigation-menu
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add tooltip
```

## Overall Aesthetic Goals (inference.net inspired)
Create an interface that embodies:
- **Enterprise Professional**: Clean, authoritative, trustworthy
- **Government-Grade**: Suitable for national institutions and agencies
- **Technical Sophistication**: Advanced but accessible functionality
- **Constitutional Authority**: Conveys serious governmental responsibility
- **Global Standards**: Internationally acceptable and professional

**Design Philosophy:**
- Minimalism with purpose - every element serves a function
- Professional restraint - no flashy or consumer-oriented elements  
- Institutional credibility - looks like software governments would actually deploy
- Clean information hierarchy - crystal clear data presentation
- Accessible by design - usable by government officials of all technical levels

**Inspiration Sources:**
- inference.net's clean, professional aesthetic
- Government portals and institutional dashboards
- Enterprise SaaS platforms (linear, clean design)
- Constitutional documents and legal frameworks (serious, authoritative presentation)

The final result should make government officials think: *"This is the caliber of software we need for managing AI agents in our jurisdiction."*
