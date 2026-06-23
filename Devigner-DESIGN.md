---
version: alpha
name: "Vercel Light"
description: "Primary visual anchor uses #ebebeb with hairline dividers, grid lines, column separators, card borders — highest-count color in cssom. Typography baseline relies on Geist for hero headline — 'build and deploy on the ai cloud.' — tight negative tracking at display scale."
colors:
  gray-200: "#ebebeb"
  background-100: "#ffffff"
  background-200: "#fafafa"
  black: "#000000"
  blue-700: "#0070f3"
  gray-100: "#f2f2f2"
  gray-1000: "#171717"
  gray-600: "#a8a8a8"
  gray-800: "#7d7d7d"
  gray-900: "#4d4d4d"
typography:
  display-hero:
    fontFamily: "Geist"
    fontSize: "48px"
    fontWeight: "600"
    lineHeight: "56px"
    letterSpacing: "-2.88px"
  section-heading:
    fontFamily: "Geist"
    fontSize: "32px"
    fontWeight: "400"
    lineHeight: "48px"
    letterSpacing: "-1.28px"
  subheading:
    fontFamily: "Geist"
    fontSize: "24px"
    fontWeight: "600"
    lineHeight: "32px"
    letterSpacing: "-0.96px"
  body-default:
    fontFamily: "Geist"
    fontSize: "16px"
    fontWeight: "400"
    lineHeight: "24px"
  body-small:
    fontFamily: "Geist"
    fontSize: "14px"
    fontWeight: "400"
    lineHeight: "21px"
  label-medium:
    fontFamily: "Geist"
    fontSize: "14px"
    fontWeight: "500"
    lineHeight: "20px"
  label-small:
    fontFamily: "Geist"
    fontSize: "12px"
    fontWeight: "400"
    lineHeight: "16px"
  code-default:
    fontFamily: "geistMonoFont"
    fontSize: "13px"
    fontWeight: "500"
    lineHeight: "20px"
  code-large:
    fontFamily: "geistMonoFont"
    fontSize: "16px"
    fontWeight: "400"
    lineHeight: "24px"
rounded:
  radius-xs: "2px"
  radius-sm: "4px"
  radius-md: "6px"
  radius-lg: "8px"
  radius-xl: "16px"
  radius-2xl: "32px"
  radius-badge: "64px"
  radius-pill: "9999px"
spacing:
  space-1: "2px"
  space-2: "4px"
  space-3: "6px"
  space-4: "8px"
  space-5: "10px"
  space-6: "12px"
  space-7: "14px"
  space-8: "16px"
  space-9: "24px"
  space-10: "32px"
  space-11: "40px"
  space-12: "44px"
  space-13: "48px"
  space-14: "50px"
---

## Overview

Primary visual anchor uses #ebebeb with hairline dividers, grid lines, column separators, card borders — highest-count color in cssom. Typography baseline relies on Geist for hero headline — 'build and deploy on the ai cloud.' — tight negative tracking at display scale.

This system uses a 4px base grid with scale values 2, 4, 6, 8, 10, 12, 14, 16, 24, 32, 40, 44, 48, 50.

**Signature traits:**
- Core token rhythm: Token evidence indicates consistent color, spacing, and radius rhythm across visible UI.

## Colors

The palette uses 10 validated color tokens across 1 theme profile. Semantic roles stay attached to observed usage so generation agents can choose accents without inventing new color meaning.

**Semantic naming:**
- **action-text** maps to `gray-1000`: Role "text" is grounded by usage context "Primary text, headings, nav links, icon fills — dominant foreground color across all zones".
- **border-primary** maps to `gray-200`: Role "primary" is grounded by usage context "Hairline dividers, grid lines, column separators, card borders — highest-count color in CSSOM".
- **content-text** maps to `gray-900`: Role "text" is grounded by usage context "Secondary text, nav trigger labels, subdued body copy".
- **surface-background** maps to `background-200`: Role "background" is grounded by usage context "Page surface, card backgrounds, inner shadow ring color".

### Primary Brand
- **Gray 200** (#ebebeb): Hairline dividers, grid lines, column separators, card borders — highest-count color in CSSOM. Role: primary. {authored: rgb(235, 235, 235), space: rgb}

### Text Scale
- **Gray 1000** (#171717): Primary text, headings, nav links, icon fills — dominant foreground color across all zones. Role: text. {authored: rgb(23, 23, 23), space: rgb}
- **Gray 600** (#a8a8a8): Placeholder text, muted labels, disabled states. Role: text. {authored: rgb(168, 168, 168), space: rgb}
- **Gray 800** (#7d7d7d): Tertiary text, footer secondary labels. Role: text. {authored: rgb(125, 125, 125), space: rgb}
- **Gray 900** (#4d4d4d): Secondary text, nav trigger labels, subdued body copy. Role: text. {authored: rgb(77, 77, 77), space: rgb}

### Surface & Shadows
- **Background 100** (#ffffff): Pure white surfaces, button fills, overlay backgrounds. Role: background. {authored: rgb(255, 255, 255), space: rgb}
- **Background 200** (#fafafa): Page surface, card backgrounds, inner shadow ring color. Role: background. {authored: rgb(250, 250, 250), space: rgb}
- **Black** (#000000): Primary CTA button fill (Start Deploying), logo mark, alpha overlay tokens. Role: background. {authored: rgba(0, 0, 0, 0.08), space: rgb, alpha: 0.08}
- **Blue 700** (#0070f3): Badge link text (Events label), interactive link accent, brand blue. Role: background. {authored: rgb(0, 112, 243), space: rgb}
- **Gray 100** (#f2f2f2): Subtle surface tint, hover states. Role: background. {authored: rgb(242, 242, 242), space: rgb}

## Typography

Typography uses Geist, geistMonoFont across extracted hierarchy roles. Keep hierarchy mapped to these token rows before adding decorative type styles.

Mixes Geist and geistMonoFont for visual contrast. Weight range spans semi-bold, regular, medium. Sizes range from 12px to 48px.

### Font Roles
- **Headline Font**: Geist
- **Body Font**: Geist

### Type Scale Evidence
| Role | Font | Size | Weight | Line Height | Letter Spacing | Stack / Features | Notes |
|------|------|------|--------|-------------|----------------|------------------|-------|
| Hero headline — 'Build and deploy on the AI Cloud.' — tight negative tracking at display scale | Geist | 48px | 600 | 56px | -2.88px | Geist, Arial, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol; features: "calt" 0, "rlig" | Extracted token |
| Mid-page section titles with negative tracking | Geist | 32px | 400 | 48px | -1.28px | Geist, Arial, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol; features: "calt" 0, "rlig" | Extracted token |
| Card and feature headings | Geist | 24px | 600 | 32px | -0.96px | Geist, Arial, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol; features: "calt" 0, "rlig" | Extracted token |
| Primary body text, nav items, paragraph copy — most frequent typography tuple | Geist | 16px | 400 | 24px | normal | Geist, Arial, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol; features: "calt" 0, "rlig" | Extracted token |
| Secondary body text, descriptions, metadata | Geist | 14px | 400 | 21px | normal | Geist, Arial, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol; features: "calt" 0, "rlig" | Extracted token |
| Button labels, nav trigger text, interactive labels | Geist | 14px | 500 | 20px | normal | Geist, Arial, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol; features: "calt" 0, "rlig" | Extracted token |
| Badges, captions, fine-print labels | Geist | 12px | 400 | 16px | normal | Geist, Arial, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol; features: "calt" 0, "rlig" | Extracted token |
| Inline code, terminal output, monospaced UI elements | geistMonoFont | 13px | 500 | 20px | normal | geistMonoFont, ui-monospace, SFMono-Regular, Roboto Mono, Menlo, Monaco, Liberation Mono, DejaVu Sans Mono, Courier New, monospace, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol; features: "calt" 0, "rlig" | Extracted token |
| Code block body text | geistMonoFont | 16px | 400 | 24px | normal | geistMonoFont, ui-monospace, SFMono-Regular, Roboto Mono, Menlo, Monaco, Liberation Mono, DejaVu Sans Mono, Courier New, monospace, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol; features: "calt" 0, "rlig" | Extracted token |

## Layout

Responsive system uses 4 breakpoint tier(s): mobile, tablet, desktop, wide.

### Responsive Strategy
- **mobile (401-1150px)**: Constrain layout for small viewports and prioritize vertical stacking.
- **tablet (650-1200px)**: Increase spacing and column structure for medium-width viewports.
- **desktop (1036-1108px)**: Expand layout density and horizontal composition for wide viewports.
- **wide (>= 2300px)**: Stretch composition with generous gutters and wider layout spans.

### Spacing System
| Token | Value | Px | Notes |
|------|-------|----|-------|
| space-1 | 2px | 2 | Extracted spacing token |
| space-2 | 4px | 4 | Mapped to --geist-space |
| space-3 | 6px | 6 | Extracted spacing token |
| space-4 | 8px | 8 | Mapped to --geist-space-2x |
| space-5 | 10px | 10 | Extracted spacing token |
| space-6 | 12px | 12 | Mapped to --geist-space-3x |
| space-7 | 14px | 14 | Extracted spacing token |
| space-8 | 16px | 16 | Extracted spacing token |
| space-9 | 24px | 24 | Extracted spacing token |
| space-10 | 32px | 32 | Extracted spacing token |
| space-11 | 40px | 40 | Extracted spacing token |
| space-12 | 44px | 44 | Extracted spacing token |
| space-13 | 48px | 48 | Extracted spacing token |
| space-14 | 50px | 50 | Extracted spacing token |

## Elevation & Depth

Keep depth flat unless validated shadow or interaction evidence appears in the extraction payload. Do not invent shadows beyond this evidence boundary.

### Shadow Evidence
| Shadow Token | Layers | Details |
|--------------|--------|---------|
| shadow-card | 3 | 0px 0px 0px 1px rgba(0, 0, 0, 0.08) |
| shadow-subtle | 1 | 0px 2px 2px 0px rgba(0, 0, 0, 0.04) |
| shadow-ring | 2 | 0px 0px 0px 1px rgba(0, 0, 0, 0.08) |
| shadow-border-only | 1 | 0px 0px 0px 1px rgba(0, 0, 0, 0.08) |

### Interaction Signals
| Theme | Signal | Evidence |
|-------|--------|----------|
| Light | outline-color | rgb(23, 23, 23) ; rgb(77, 77, 77) ; rgb(102, 102, 102) |
| Light | outline-width | 3px ; 0px |
| Light | outline-offset | 0px ; 2px |
| Light | transform | matrix(1, 0, 0, 1, 0, 0) ; matrix3d(1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0, 18, 0, 1) ; matrix(1, 0, 0, 1, -16, -16) |

## Shapes

Shape language maps directly to rounded tokens. Keep component corners consistent with the role mapping below before introducing bespoke geometry.

### Radius Roles
| Token | Value | Px | Role Mapping |
|------|-------|----|--------------|
| radius-xs | 2px | 2 | Hairline corner |
| radius-sm | 4px | 4 | Subtle corner |
| radius-md | 6px | 6 | Subtle corner |
| radius-lg | 8px | 8 | Control corner |
| radius-xl | 16px | 16 | Card corner |
| radius-2xl | 32px | 32 | Large surface corner |
| radius-badge | 64px | 64 | Large surface corner |
| radius-pill | 9999px | 9999 | Large surface corner |

### Geometry Evidence
| Radius Token | Shape | Units |
|--------------|-------|-------|
| radius-xs | 2px | px |
| radius-sm | 4px | px |
| radius-md | 6px | px |
| radius-lg | 8px | px |
| radius-xl | 16px | px |
| radius-2xl | 32px | px |
| radius-badge | 64px | px |
| radius-pill | 9999px | px |

## Components

(none detected)

## Do's and Don'ts

Guardrails protect Core token rhythm without adding unsupported visual claims.

| Do | Don't |
|----|---------|
| Do maintain consistent spacing using the base grid | Don't make unsupported claims about absent visual features |
| Do maintain WCAG AA contrast ratios (4.5:1 for normal text) | Don't mix rounded and sharp corners in the same view |
| Do use the primary color only for the single most important action per screen |  |
| Do verify evidence before writing new design-system guidance |  |

## Responsive Evidence

### Breakpoints
| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | <= 370px | (max-width: 370px) |
| Mobile | <= 374px | (max-width: 374px) |
| Mobile | <= 383px | (max-width: 383px) |
| Mobile | <= 400px | (max-width: 400px) |
| Mobile | <= 427px | screen and (max-width: 427px) |
| Mobile | <= 440px | (max-width: 440px) |
| Mobile | <= 450px | (max-width: 450px) |
| Mobile | <= 480px | (max-width: 480px) |
| Mobile | <= 500px | (max-width: 500px) |
| Mobile | <= 600px | (max-width: 600px) |
| Mobile | <= 601px | (max-width: 601px) |
| Mobile | <= 640px | (max-width: 640px) |
| Mobile | <= 660px | (max-width: 660px) |
| Breakpoint 14 | <= 768px | (max-width: 768px) |
| Breakpoint 15 | <= 800px | (max-width: 800px) |
| Breakpoint 16 | <= 960px | (max-width: 960px) |
| Breakpoint 17 | <= 992px | (max-width: 992px) |
| Breakpoint 18 | <= 1024px | (max-width: 1024px) |
| Breakpoint 19 | <= 1080px | (max-width: 1080px) |
| Breakpoint 20 | <= 1120px | (max-width: 1120px) |

## Agent Prompt Guide

### Example Component Prompts
- Create button component using validated primary color role and spacing tokens.
- Create card component with mapped radius role and evidence-backed elevation.
- Create form input component using inferred typography hierarchy and border roles.

### Iteration Guide
1. Start with extracted palette and typography roles only.
2. Map spacing and radius directly from token tables before visual polish.
3. Apply component patterns one section at a time and compare against source intent.
4. Keep elevation claims tied to explicit evidence in output.
5. Iterate with smallest diffs and re-check section hierarchy after each change.
