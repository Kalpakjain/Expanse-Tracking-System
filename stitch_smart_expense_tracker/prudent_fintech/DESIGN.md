---
name: Prudent Fintech
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45464d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#002113'
  on-tertiary-container: '#009668'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  container-max: 1280px
  gutter: 24px
---

## Brand & Style

The design system is engineered for a sophisticated yet approachable fintech experience, specifically tailored for smart expense tracking. The brand personality balances professional reliability with the agility of modern technology. It aims to evoke a sense of financial control, clarity, and "intelligence" without being cold or overly institutional.

The design style is **Corporate / Modern** with a strong leaning towards **Minimalism**. It prioritizes high-readability and functional aesthetics, using generous whitespace to reduce cognitive load when viewing complex financial data. The interface utilizes soft-edged surfaces and subtle depth to make the financial journey feel intuitive and less daunting.

## Colors

The palette is anchored in a professional "Slate and White" foundation to provide a clean, high-contrast canvas for data.

- **Primary (Slate/Sapphire):** `Slate-900` (#0F172A) is used for core text and brand grounding. `Sapphire Blue` (#2563EB) is the primary action color, driving user focus toward buttons and interactive states.
- **Success (Emerald):** Use Emerald Green (#10B981) strictly for positive financial health, within-budget indicators, and completed transactions.
- **Warning (Sunset):** Sunset Orange (#F97316) is reserved for approaching limits, over-budget alerts, and items requiring immediate attention.
- **Neutral:** A range of Slate grays (from #F8FAFC to #64748B) is used for backgrounds, borders, and secondary metadata to maintain a hierarchical balance.

## Typography

This design system utilizes a dual-font approach. **Plus Jakarta Sans** is used for headlines and display elements to provide a modern, friendly character. **Inter** is used for body text, data points, and labels due to its exceptional legibility at small sizes and its neutral, systematic feel.

For financial figures and currency, use `Inter` with tabular numbers (tnum) enabled to ensure vertical alignment in lists and tables. Large headings should use tighter letter spacing to maintain a premium, "locked-in" appearance.

## Layout & Spacing

The layout utilizes a **fluid grid** logic with a maximum container width of 1280px. A 12-column system is used for desktop, 8-column for tablet, and 4-column for mobile.

- **Rhythm:** An 8px linear scale (4px, 8px, 16px, 24px, 32px, 48px, 64px) governs all padding and margins.
- **Vertical Spacing:** Generous whitespace is used between major sections (48px+) to prevent the financial data from feeling overwhelming.
- **Margins:** Standardize on 24px side margins for mobile devices to give the content "breathing room" against the edge of the screen.

## Elevation & Depth

Visual hierarchy is established through **Ambient Shadows** and **Tonal Layers**. 

- **Surface Layers:** The background uses `Slate-50` (#F8FAFC). Primary content cards use absolute white (#FFFFFF).
- **Shadows:** Use extremely soft, large-radius shadows with low opacity (4-8%) and a slight blue tint (using the Slate-900 color) to avoid a "dirty" gray look. 
- **Z-Index Strategy:** 
    - `Level 0`: Background.
    - `Level 1`: Content cards (Subtle 1px border #E2E8F0, no shadow).
    - `Level 2`: Hover states and active cards (Soft shadow: 0px 10px 15px -3px rgba(15, 23, 42, 0.08)).
    - `Level 3`: Modals and overlays (Deep shadow: 0px 20px 25px -5px rgba(15, 23, 42, 0.1)).

## Shapes

The shape language is defined as **Rounded**, promoting an approachable and modern fintech feel. 

- **Default (0.5rem):** Standard for buttons, input fields, and small UI components.
- **Large (1rem):** Used for main content cards and dashboard modules.
- **Extra Large (1.5rem):** Reserved for large promotional banners or bottom sheets on mobile.
- **Full (Pill):** Used for tags, badges, and search bars to distinguish them from structural card elements.

## Components

- **Buttons:** Primary buttons use the Sapphire Blue base with white text. High-emphasis actions use a subtle gradient. Ghost buttons use a Slate-200 border.
- **Cards:** White background, 1rem border radius, and a 1px Slate-200 stroke. On hover, apply Level 2 elevation.
- **Input Fields:** Use a Slate-50 background with a 1px border. Focus state should trigger a 2px Sapphire Blue ring with 20% opacity.
- **Chips/Badges:** Small, pill-shaped elements. Use Emerald for "In Budget" and Sunset for "Alerts". Text inside badges should use `label-sm` (bold, uppercase).
- **Lists:** Transaction lists should have 16px vertical padding per item with a subtle divider line (#F1F5F9). Icons for categories should be housed in soft-colored circles (10% opacity of the icon color).
- **Data Visualizations:** Use clean, thin lines for line charts (2px stroke). Area charts should use a very light gradient fill. Ensure all chart colors correspond to the functional palette (Emerald for growth/savings, Sapphire for spending).