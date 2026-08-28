# Design System: Artisan-AI

## 1. Visual Theme & Atmosphere
A warm, trustworthy, accessibility-first mobile interface designed for Indian artisans with low digital literacy. The atmosphere is inviting and human — like a knowledgeable friend helping you sell your craft. Premium but not intimidating. Government/social-impact appropriate without feeling bureaucratic. AI-powered elements are subtle and supportive, never cold or futuristic.

**Density:** 3/10 — Gallery Airy (generous whitespace, one action per screen)
**Variance:** 4/10 — Slightly Asymmetric (structured but not rigid)
**Motion:** 5/10 — Fluid CSS (smooth transitions, voice waveforms, progress animations)

## 2. Color Palette & Roles
- **Deep Indigo** (#1E3A5F) — Primary: navigation, buttons, headers, active states, links
- **Warm Terracotta** (#C4704B) — Secondary accent: craft-themed highlights, secondary actions
- **Warm Off-White** (#FAF8F5) — Canvas background surface
- **Pure White** (#FFFFFF) — Card and container fill, elevated surfaces
- **Dark Charcoal** (#1C1C1E) — Primary text, headlines
- **Neutral Gray** (#6B7280) — Secondary text, descriptions, metadata, timestamps
- **Success Green** (#2E7D32) — Live status, confirmations, completed steps, checkmarks
- **Warning Amber** (#F59E0B) — Draft status, pending states, alerts requiring attention
- **Error Red** (#DC2626) — Out of stock, errors, critical alerts, decline actions
- **AI Gradient** (linear-gradient #1E3A5F → #2563EB) — Subtle gradient for AI-related elements only (mic button, AI cards, processing indicators)

**Constraint:** Maximum 1 accent per screen. No neon. No oversaturated colors. No dark/futuristic aesthetic.

## 3. Typography Rules
- **Display/Headlines:** Noto Sans — Bold weight, 24-28px for screen titles, controlled hierarchy through weight and color
- **Body:** Noto Sans — Regular weight, 14-16px, relaxed leading (1.5), max 65ch per line
- **Secondary:** Noto Sans — Regular weight, 12-14px, neutral gray color for metadata and timestamps
- **Buttons:** Noto Sans — Semibold weight, 15-16px
- **Multilingual Support:** Noto Sans supports English, Hindi (Devanagari), Gujarati, and all Indian regional scripts
- **Minimum Text Size:** 12px — NEVER use text smaller than this
- **Banned:** Inter, generic system fonts. This is a multilingual app requiring Noto Sans.

## 4. Component Stylings
* **Buttons:** Full-width primary buttons at 48px height minimum. Rounded corners (12px). Semibold text. Indigo fill for primary, outlined for secondary. Tactile -1px translate on active. No outer glow.
* **Cards:** White background, subtle shadow (0 2px 8px rgba(0,0,0,0.06)). Rounded corners (12px). Generous padding (16-20px). Used for product items, stats, actions, and AI suggestions.
* **Inputs:** Label above input. 52px height for easy tapping. Subtle gray border, indigo border on focus. Large placeholder text. No floating labels.
* **Bottom Navigation:** 5 items with icons + labels. Active state in indigo. White background. Subtle top shadow.
* **Floating Mic Button:** 56px indigo gradient circle. White microphone icon. Positioned bottom-right, above navigation bar. Subtle shadow for elevation.
* **AI Cards:** White card with subtle indigo gradient left border or border-all. Sparkle icon. Used for AI suggestions, insights, recommendations.
* **Status Pills:** Small rounded badges — green for Live, amber for Draft, red for Out of Stock. 8px padding horizontal, 4px vertical.
* **Progress Indicators:** Step-by-step checklist with green checkmarks (completed), indigo pulsing dot (in progress), gray empty circle (pending). Vertical connecting line between steps.
* **Bottom Sheets:** Rounded top corners (16px). Small drag handle centered at top. Smooth slide-up animation.
* **Filter Tabs:** Horizontal scrollable pills. Selected: filled indigo background with white text. Unselected: outlined with gray text.

## 5. Layout Principles
- Single column mobile layout (390px reference width)
- 16px horizontal padding on all screens
- 12-16px gaps between cards and sections
- Bottom navigation on all main screens (Home, Products, Orders, Sales, Profile)
- Floating mic button on key screens
- One-handed usage optimized — primary actions within thumb reach
- One screen = one primary action (the user always knows "what do I do next?")
- No overlapping elements
- No horizontal scroll on main content

## 6. Motion & Interaction
- Smooth transitions between screens (300ms ease-out)
- Voice waveform animation: vertical bars with varying heights in indigo
- AI processing: step-by-step checklist with sequential checkmark animations
- Button press: subtle scale-down (0.97) and translate-y(-1px)
- Pull-to-refresh on list screens
- Card press: subtle shadow increase
- Publish success: confetti/celebration dots animation
- Image before/after: horizontal slider transition

## 7. Accessibility Standards
- Touch targets: minimum 44-48px height
- All text meets WCAG AA contrast ratio (4.5:1 for body, 3:1 for large text)
- Large, clear icons (24px minimum)
- Voice-first input for all text entry
- Multilingual support (English, Hindi, Gujarati)
- Simple, non-technical language in all UI copy
- Clear error messages without technical jargon
- Haptic feedback on key actions
- Audio confirmation for important actions

## 8. Anti-Patterns (Banned)
- No dark/futuristic AI aesthetic
- No complex multi-column dashboards
- No tiny text or dense information layouts
- No technical jargon in UI copy ("HTTP 500", "Internal Server Error")
- No generic stock photography
- No neon colors or aggressive gradients
- No floating/overlapping elements that confuse layout
- No hidden navigation or hamburger-only menus
- No generic spinner-only loading states
- No complicated registration forms
- No auto-publish without user confirmation
- No AI actions without "AI generated — Please review" labels
