# Devigner UI - Implementation Plan

## 1. Product Overview

**Devigner UI** is a premium React + Tailwind CSS v4 component library with a CLI installer, documentation/showcase site, and tiered monetization. It targets developers and agencies who want production-ready, animated UI components without starting from scratch.

### Competitive Positioning

| Feature         | Aceternity | 21st.dev  | Skipper UI     | Cult UI        | **Devigner UI**                 |
| --------------- | ---------- | --------- | -------------- | -------------- | ------------------------------- |
| Components      | ~80        | Community | 105+           | 78+            | 20-30 (MVP)                     |
| CLI install     | Yes        | Yes       | Yes (shadcn)   | Yes (shadcn)   | Yes                             |
| Framework       | React      | React     | React (shadcn) | React (shadcn) | React + Vue (planned)           |
| Animations      | Heavy      | Mixed     | Heavy          | Moderate       | Equal mix                       |
| Pricing         | $99-199    | Free/Pro  | $129           | Free/Pro       | Freemium + $600 lifetime        |
| Design identity | Distinct   | Generic   | Premium        | Minimal        | Tailwind CSS-inspired editorial |

**Key differentiator:** Tailwind CSS-inspired clean aesthetic + tiered subscription model + component drops + copy counter.

---

## 2. Tech Stack

### Monorepo Foundation

- **Package manager:** pnpm (workspaces)
- **Build orchestration:** Turborepo
- **Node:** 20+ LTS

### Package: `devignerui` (Component Library)

- **Framework:** React 19 + TypeScript (strict)
- **Styling:** Tailwind CSS v4 (CSS-native config, no tailwind.config.js)
- **Animation:** Motion (framer-motion) v11+
- **Primitives:** Radix UI (for accessible dialogs, dropdowns, tooltips)
- **Icons:** Lucide React
- **Utilities:** `clsx` + `tailwind-merge` + `class-variance-authority`
- **Build:** tsup (for library output)

### Package: `devignerui` (CLI Tool)

- **Runtime:** Node.js 20+
- **Framework:** Commander.js
- **HTTP:** undici (fetch)
- **Template rendering:** EJS or Handlebars
- **Prompts:** @inquirer/prompts

### Package: `@devignerui/docs` (Docs/Showcase Site)

- **Framework:** Next.js 15 (App Router)
- **Docs engine:** Fumadocs (MDX-based, built for component libraries)
- **Styling:** Tailwind CSS v4
- **Animations:** Motion (framer-motion)
- **Auth:** NextAuth.js v5 (for subscription management)
- **Payments:** Creem (3.9% + $0.40, Pakistan supported)
- **Database:** Turso (SQLite edge) or Supabase (for user accounts, license keys)
- **Deployment:** Vercel

---

## 3. Design System

### Design Tokens (Tailwind CSS v4 @theme)

Tailwind CSS-inspired - clean, developer-focused, content-first:

```
Color palette:
- Background: near-black (#0a0a0a) / white (#fafafa)
- Surface: subtle gray tones
- Accent: a single signature color (e.g., electric blue or warm orange)
- Text: high-contrast, clean hierarchy

Typography:
- Primary: Geist Sans (clean, modern, developer aesthetic)
- Display: Geist Sans weight range for headlines
- Mono: Geist Mono for code blocks

Spacing: Tailwind default scale
Border radius: rounded-lg as default, with squircle option
Shadows: subtle, layered (not heavy drop shadows)
Easing: custom cubic-bezier for smooth micro-interactions
```

### Theming Strategy

- CSS custom properties for all tokens
- Light/dark mode via `.dark` class
- Users can override any token via CSS variables
- Components use semantic tokens (`bg-surface`, `text-content`) not hardcoded values

---

## 4. Landing Page Design (Tailwind CSS Style)

Clean, developer-focused, no flashy animations on the landing:

```
Section 1: Hero
- "Devigner UI" heading (clean, large, centered)
- Subline: "Beautiful React components, built with Tailwind CSS"
- Two buttons: "Get Started" / "Browse Components"
- Code snippet preview (like tailwindcss.com homepage)
- No animated background - clean white/dark with subtle grid

Section 2: Component Grid
- Grid of component thumbnails (like tailwindcss.com/plus/ui-blocks)
- Each card: preview image + component name + category
- Filter: All / Free / Pro / Blocks

Section 3: Code Example
- Split panel: live preview (left) + code (right)
- Framework tabs (React only for now)
- Copy button with counter

Section 4: CLI Install
- Terminal-style code block
- "npx devignerui add button" command
- Step-by-step setup instructions

Section 5: Pricing
- Clean comparison table
- Subscription tiers + Lifetime
- Feature matrix

Section 6: Footer
- Links, social, newsletter signup
```

---

## 5. Component Pages

### Layout (per component)

```
[Component Name]
[Free/Pro badge] [Category badge] [Variant count badge]

--- Preview ---
Live interactive sandbox
Users can toggle props to see variations

--- Code ---
[React] tab only (for now)

Code block with:
- Syntax highlighting (Shiki)
- Copy button with live counter: "📋 Copy (1,234 copies)"
- Counter increments on each copy across all users

--- Install ---
npx devignerui add [component-name]

--- Props ---
Table: Prop | Type | Default | Description

--- Accessibility ---
ARIA, keyboard nav, screen reader notes

--- Related ---
Links to similar components
```

### Copy Counter System

**Frontend Protection:**

- Button disables immediately after click (prevents double-click)
- 3-second cooldown before button re-enables
- Visual feedback: "Copied ✓" during cooldown
- Only ONE API call sent per click

**Backend Rate Limiting:**

- Per IP: max 10 copies per minute
- Per component per IP: max 3 copies per minute
- Per session (browser fingerprint): max 5 copies per minute
- Daily cap per IP: 100 copies/day
- Bot detection: ignore headless browsers or missing fingerprints

**DB Schema:**

```sql
CREATE TABLE copy_counts (
  component_name TEXT PRIMARY KEY,
  total_copies   INTEGER DEFAULT 0,
  last_updated   TIMESTAMP
);

CREATE TABLE copy_log (
  id             SERIAL PRIMARY KEY,
  component_name TEXT,
  ip_address     TEXT,
  session_id     TEXT,
  created_at     TIMESTAMP DEFAULT NOW()
);
```

**Counter Display:**

- Normal: `[ 📋 Copy (1,234 copies) ]`
- After click: `[ ✓ Copied (1,235 copies) ]` (disabled, 3s cooldown)
- Rate limited: `[ ⏳ Too fast, try again ]` (disabled, shows error)

---

## 6. Sidebar Component List (Variants + Status)

### Sidebar Structure

```
Components
├── Free
│   ├── Button .................. 5 variants
│   ├── Card ................... 3 variants
│   ├── Input .................. 4 variants
│   ├── Badge .................. 3 variants
│   └── Skeleton ............... 2 variants
│
├── Pro
│   ├── Hero Section ........... 4 variants    NEW
│   ├── Toast .................. 4 variants    NEW
│   ├── Modal .................. 3 variants
│   ├── Navbar ................. 3 variants
│   └── Pricing Table .......... 2 variants    UPDATED
│
└── Blocks
    ├── Feature Section ........ 3 variants
    ├── Testimonials ........... 3 variants
    └── CTA Section ............ 2 variants
```

### Status Badges

- NEW: Added in last 2 weeks
- UPDATED: Modified in last 2 weeks
- _(none)_: Stable, no recent changes

### Registry Schema

```json
{
  "name": "toast",
  "type": "component",
  "category": "feedback",
  "free": false,
  "status": "new",
  "description": "Animated notification component with multiple variants",
  "variants": [
    {
      "name": "Default Toast",
      "slug": "default",
      "code": "..."
    }
  ],
  "files": [...],
  "dependencies": [...]
}
```

---

## 7. MVP Scope: 5 Components First

| #   | Component        | Type      | Variants                                  | Why First                       |
| --- | ---------------- | --------- | ----------------------------------------- | ------------------------------- |
| 1   | **Button**       | Primitive | Solid, Outline, Ghost, Link, Icon         | Most used, sets API pattern     |
| 2   | **Card**         | Primitive | Default, Interactive, Header-only         | Compound pattern, very reusable |
| 3   | **Input**        | Form      | Text, Password, With Icon, Textarea       | Essential for any form          |
| 4   | **Badge**        | Primitive | Default, Secondary, Outline               | Simple, demonstrates variants   |
| 5   | **Hero Section** | Block     | Centered, Split, With Background, Minimal | Showcases blocks concept        |

---

## 8. Monorepo Structure

```
devignerui/
├── apps/
│   └── docs/                          # Next.js docs/showcase site
│       ├── app/
│       │   ├── page.tsx               # Landing page
│       │   ├── components/            # Component catalog pages
│       │   │   └── [slug]/page.tsx    # Individual component page
│       │   ├── blocks/                # Block catalog pages
│       │   ├── pricing/page.tsx       # Pricing page
│       │   └── layout.tsx
│       ├── components/                # Docs-specific components
│       │   ├── CodePreview.tsx
│       │   ├── CodeBlock.tsx
│       │   ├── CopyButton.tsx
│       │   └── ComponentDemo.tsx
│       ├── content/                   # MDX content files
│       │   ├── components/
│       │   └── blocks/
│       ├── lib/
│       │   ├── registry.ts
│       │   └── auth.ts
│       ├── public/
│       ├── package.json
│       └── next.config.ts
│
├── packages/
│   ├── ui/                            # Component library
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── badge.tsx
│   │   │   │   ├── hero-section.tsx
│   │   │   │   └── index.ts
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   │   ├── utils.ts
│   │   │   │   └── animations.ts
│   │   │   └── styles/
│   │   │       └── globals.css
│   │   ├── registry/
│   │   │   ├── index.json
│   │   │   ├── button.json
│   │   │   └── ...
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tsup.config.ts
│   │
│   ├── cli/                           # CLI installer
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── commands/
│   │   │   │   ├── init.ts
│   │   │   │   └── add.ts
│   │   │   └── utils/
│   │   │       ├── fetcher.ts
│   │   │       └── installer.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── shared/                        # Shared types
│       ├── src/
│       │   ├── types.ts
│       │   └── constants.ts
│       └── package.json
│
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
└── README.md
```

---

## 9. CLI Architecture

### Commands

```bash
npx devignerui init          # Initialize in a project
npx devignerui add button    # Add a component
npx devignerui list          # List available components
npx devignerui update        # Update to latest
```

### Registry Format

```json
{
  "name": "button",
  "type": "component",
  "category": "primitives",
  "free": true,
  "status": "stable",
  "variants": ["solid", "outline", "ghost", "link", "icon"],
  "dependencies": ["class-variance-authority", "clsx", "tailwind-merge"],
  "files": [
    {
      "path": "components/ui/button.tsx",
      "content": "...",
      "type": "registry:ui"
    }
  ]
}
```

---

## 10. Payments (Creem)

### Why Creem Over Lemon Squeezy

- Pakistan explicitly supported (86 countries list)
- Lower fees: 3.9% + $0.40 (vs LS 5-7.5% + $0.50)
- Stable: not undergoing acquisition transition
- MoR: handles VAT/GST in 190+ countries
- Payouts: 1st + 15th monthly, bank or USDC

### Products on Creem

| Product       | Price   | Type         |
| ------------- | ------- | ------------ |
| Basic Monthly | $9/mo   | Subscription |
| Basic Yearly  | $79/yr  | Subscription |
| Pro Monthly   | $19/mo  | Subscription |
| Pro Yearly    | $179/yr | Subscription |
| Ultra Monthly | $39/mo  | Subscription |
| Ultra Yearly  | $349/yr | Subscription |
| Lifetime      | $600    | One-time     |

---

## 11. Implementation Timeline (5 weeks)

### Week 1: Foundation

- Initialize monorepo (pnpm + Turborepo)
- Set up devignerui (React 19 + Tailwind v4)
- Design system tokens
- cn() utility + animation helpers
- Set up devignerui skeleton

### Week 2: First 5 Components

- Button, Card, Input, Badge, Hero Section
- Variants for each
- Tests

### Week 3: Docs Site + Landing

- Next.js 15 + Fumadocs
- Landing page (Tailwind CSS style)
- Component pages with live preview
- Copy counter system

### Week 4: CLI + Payments

- CLI init + add commands
- Registry JSON format
- Creem integration
- Auth system

### Week 5: Polish + Launch

- Dark/light mode
- Responsive + SEO
- Performance optimization
- npm publish setup
- Launch
