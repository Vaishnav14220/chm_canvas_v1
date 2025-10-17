# 🎨 Design System - Studium Chemistry Canvas

## Overview

Studium uses a modern, professional design system based on a cohesive color palette inspired by contemporary SaaS applications. This ensures visual consistency, reduces cognitive load, and creates a premium user experience.

## Color Palette

### Primary Color
- **Name**: Professional Blue
- **Light Mode**: `#3B82F6` (HSL: 217, 91%, 60%)
- **Dark Mode**: `#60A5FA` (HSL: 217, 91%, 70%)
- **Usage**: Primary actions, buttons, links, active states, focus rings
- **Psychology**: Trust, professionalism, focus, stability

### Accent Color
- **Name**: Vibrant Teal
- **Light & Dark**: `#20B2AA` (HSL: 175, 85%, 50%)
- **Usage**: Highlights, secondary actions, status indicators, emphasis
- **Psychology**: Energy, insight, innovation, attention-grabbing

### Background Colors
- **Light Background**: `#FFFFFF` (HSL: 0, 0%, 100%)
- **Light Card**: `#FFFFFF` (HSL: 0, 0%, 100%)
- **Dark Background**: `#0F1117` (HSL: 224, 71%, 10%)
- **Dark Card**: `#161B22` (HSL: 224, 71%, 14%)

### Neutral Colors
- **Foreground**: `#1A202C` (HSL: 224, 71%, 14%) - Light mode text
- **Foreground Dark**: `#E2E8F0` (HSL: 210, 40%, 98%) - Dark mode text
- **Muted**: `#F8FAFC` (HSL: 216, 33%, 97%) - Light mode secondary surface
- **Muted Foreground**: `#64748B` (HSL: 215, 16%, 47%) - Muted text
- **Border**: `#E8EEF7` (HSL: 214, 32%, 91%) - Light mode borders
- **Border Dark**: `#30363D` (HSL: 216, 33%, 25%) - Dark mode borders

### Semantic Colors
- **Destructive** (Error/Delete): `#EF4444` (HSL: 0, 84%, 60%)
- **Success**: Uses accent color
- **Warning**: Uses accent color with reduced opacity

## Color System Variables

The design system uses CSS custom properties (variables) for maintainability:

```css
/* Light mode (default) */
:root {
  --primary: 217 91% 60%;
  --accent: 175 85% 50%;
  --background: 0 0% 100%;
  --foreground: 224 71% 14%;
  --muted: 210 40% 96%;
  --border: 214 32% 91%;
  /* ... and more */
}

/* Dark mode */
.dark {
  --primary: 217 91% 60%;
  --accent: 175 85% 50%;
  --background: 224 71% 10%;
  --foreground: 210 40% 98%;
  --muted: 216 33% 25%;
  --border: 216 33% 25%;
  /* ... and more */
}
```

## Typography

### Font Family
- **Primary**: Inter (sans-serif)
- **Fallback**: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto

### Font Sizes
- **Display**: 36px (h1) - Page titles, main headings
- **Heading 1**: 28px (h2) - Section headings
- **Heading 2**: 22px (h3) - Subsection headings
- **Body**: 14px - Default text
- **Small**: 12px - Secondary information, captions
- **Tiny**: 11px - Metadata, badges

### Font Weights
- **Regular**: 400 - Body text
- **Medium**: 500 - Labels, emphasized text
- **Semibold**: 600 - Subheadings, buttons
- **Bold**: 700 - Headings
- **Extra Bold**: 800/900 - Special emphasis (rare)

### Line Heights
- **Headings**: 1.2
- **Body**: 1.5-1.7
- **Compact**: 1.4

## Component Colors

### Buttons
- **Primary Button**: 
  - Background: Primary blue
  - Text: White
  - Hover: Slightly darker blue
  
- **Secondary Button**:
  - Background: Secondary (light gray-blue)
  - Text: Dark foreground
  - Border: Subtle border
  - Hover: Primary blue tint
  
- **Ghost Button**:
  - Background: Transparent
  - Text: Primary blue
  - Border: None or subtle
  - Hover: Light primary tint

### Input Fields
- **Border Color**: Border color
- **Focus Ring**: Primary color
- **Background**: Background color
- **Text**: Foreground color
- **Placeholder**: Muted foreground

### Cards
- **Background**: Card background
- **Border**: Border color (optional)
- **Shadow**: Subtle elevation shadow
- **Hover**: Slight shadow increase

### Status Indicators
- **Success**: Accent teal color (#20B2AA)
- **Error/Alert**: Destructive red (#EF4444)
- **Warning**: Accent teal with reduced opacity
- **Info**: Primary blue

## Design Principles

### 1. **Minimalism**
- Use the fewest colors necessary to communicate information
- Avoid rainbow effects with multiple unrelated colors
- Each color should have a clear purpose

### 2. **Consistency**
- Use the defined color palette exclusively
- Apply colors consistently across similar components
- Maintain visual hierarchy through color intensity

### 3. **Accessibility**
- Ensure sufficient contrast ratios (WCAG AA standard)
- Don't rely on color alone to convey information
- Support both light and dark modes

### 4. **Hierarchy**
- Primary blue for main actions and critical elements
- Accent teal for secondary emphasis and status
- Neutral colors for structure and supporting information

### 5. **Professional**
- Clean, corporate aesthetic
- No garish or oversaturated colors
- Suitable for enterprise and scientific applications

## Migration from Old Design

### Old (Multi-colored) → New (Professional)

| Old Color | Old Use | New Color | New Approach |
|-----------|---------|-----------|--------------|
| Red (#EF4444) | Various buttons | Primary/Accent | Use icon context instead |
| Green (#10B981) | Success/Accept | Accent (#20B2AA) | Use accent teal |
| Blue (#3B82F6) | Primary | Primary (retained) | Continue primary blue |
| Purple (#A855F7) | Special tools | Primary with icon | Use primary + icon |
| Orange (#F97316) | Warnings | Accent | Use accent teal |
| Yellow (#EAB308) | Caution | Accent | Use accent teal |

**Key Principle**: Color alone doesn't define the button's meaning. Instead, use:
- **Icons** - Visual representation of function
- **Labels** - Clear text description
- **Position** - Contextual placement
- **Size** - Visual weight

## Implementation Examples

### Good ✅
```jsx
{/* Study tool with icon + label instead of color differentiation */}
<button className="bg-secondary hover:bg-primary/10">
  <div className="bg-primary/10 text-primary">
    <span>📊</span> {/* Icon communicates the function */}
  </div>
  <p>Reports</p>
</button>
```

### Bad ❌
```jsx
{/* Relying on color alone to indicate different tools */}
<button className="bg-orange-500">Reports</button>
<button className="bg-purple-500">Mind Map</button>
<button className="bg-green-500">Video</button>
```

## Dark Mode

The design system includes full dark mode support:
- Colors automatically adjust in `.dark` class
- Primary blue remains consistent for recognition
- Backgrounds and text reverse appropriately
- Borders and shadows adapt for visibility

## Future Enhancements

- **Semantic color tokens**: Add `success`, `warning`, `info` tokens
- **Gradient support**: Define approved gradients if needed
- **Animation colors**: Specify color transitions for animations
- **Component variants**: Document color variants for specific components

## Resources

- **Color Tool**: [HSL Color Picker](https://www.w3schools.com/colors/colors_hsl.asp)
- **Contrast Checker**: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- **Design System References**: Material Design, Tailwind UI, Vercel

---

**Version**: 1.0  
**Last Updated**: October 2025  
**Status**: Active
