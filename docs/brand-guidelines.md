# Brand Guidelines - Kit de Atividades

## Overview

This document contains the official brand guidelines for the Kit de Atividades platform, including colors, typography, and design principles.

## Color Palette

### Primary Brand Colors (Marca Associativa)

#### Primary Color
- **Pantone:** 383 C
- **Description:** Vibrant yellow-green
- **Usage:** Primary brand color, main CTAs, highlights

#### Secondary Color
- **Pantone:** 280 C
- **Description:** Deep dark blue
- **Usage:** Secondary elements, text, borders

### Special Thematic Colors (AEP 110 Anos)

#### Anniversary Primary Color
- **Pantone:** 383 C
- **Description:** Vibrant yellow-green
- **Usage:** Special anniversary branding, celebratory elements
- **Context:** 110th birthday of Portuguese Scout Association

#### Anniversary Secondary Color
- **Pantone:** 280 C
- **Description:** Deep dark blue
- **Usage:** Anniversary secondary elements, special features
- **Context:** 110th birthday of Portuguese Scout Association

**Note:** These colors are identical to the main brand colors but represent a special thematic application for the 110th anniversary celebration.

### Secondary Color Palette (AEP 110 Anos Derivatives)

**"Outras cores utilizadas (resultantes das cores dos 110 anos da AEP)"**

This palette consists of 4 color gradients, each with 3 shades (dark, medium, light), providing 12 supporting colors for charts, data visualization, and UI elements.

#### Blue/Teal Gradient
- **Dark:** Deep rich teal
- **Medium:** Sky blue
- **Light:** Very light pastel blue/grey-blue

#### Green Gradient
- **Dark:** Dark earthy olive green
- **Medium:** Vibrant lime green
- **Light:** Pale pastel green

#### Yellow/Gold Gradient
- **Dark:** Deep mustard yellow/goldenrod
- **Medium:** Bright clear yellow
- **Light:** Soft pastel yellow

#### Red/Orange/Brown Gradient
- **Dark:** Muted rusty red/terracotta brown
- **Medium:** Soft coral/salmon pink
- **Light:** Delicate pink/peach

**Usage:** Charts, data visualization, UI accents, supporting elements, background variations

### Color Implementation

These colors have been implemented as CSS custom properties in the application:

```css
:root {
  --primary: 84 47% 50%; /* Pantone 383 C - Vibrant yellow-green */
  --primary-foreground: 222.2 84% 4.9%;
  --secondary: 220 58% 23%; /* Pantone 280 C - Deep dark blue */
  --secondary-foreground: 210 40% 98%;
  --accent: 84 47% 50%; /* Brand primary color */
  --ring: 84 47% 50%; /* Brand primary color */
}
```

**Implementation Notes:**
- Colors converted to HSL format for better Tailwind CSS integration
- Applied to both light and dark mode themes
- Primary color used for main CTAs, accents, and focus rings
- Secondary color used for borders, backgrounds, and supporting elements

## Typography

### Font Family
- **Primary Font:** Inter (existing, no changes)
- **Fallback:** system-ui, -apple-system, sans-serif

### Font Weights
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

## Logo Usage

### Primary Logo
- **File:** `/public/logo_escoteiros.png`
- **Organization:** Escoteiros de Portugal
- **Usage:** Main navigation, branding

### Logo Guidelines
- Maintain aspect ratio
- Minimum height: 40px
- Use `unoptimized` prop for Next.js Image component
- Ensure proper contrast against backgrounds

### Logo Clear Space Requirements (Security Margins)

**"Unidades de medida" (Units of measurement) system**

The logo requires specific clear space around it to maintain visual integrity and readability. The clear space is defined using a proportional unit system based on the logo's own dimensions.

#### Clear Space Definition
- **Measurement Unit:** Based on logo element dimensions (marked as "1 unidade")
- **Reference Points:** 
  - Point "1": Height of the fleur-de-lis symbol (dark blue section)
  - Point "2": Width of the "te" letters in "escoteiros"
- **Clear Space:** Minimum required space around all sides of the logo

#### Logo Elements
- **Main Text:** "escoteiros" in bold dark blue (with yellow-green highlights on 'o' and 'e')
- **Fleur-de-lis Symbol:** Split vertically - left half dark blue with white star, right half yellow-green with shield
- **Subtitle:** "DE PORTUGAL" in smaller yellow-green font
- **Background:** Light yellow-green rectangular background

#### Implementation Guidelines
- Always maintain the defined clear space around the logo
- Use the unit system for proportional scaling
- Ensure the logo is never cramped or overlapped by other elements
- Preserve the visual hierarchy and color relationships

## Design Principles

### Accessibility
- Maintain WCAG 2.1 AA compliance
- Ensure proper color contrast ratios
- Support keyboard navigation
- Screen reader friendly

### Responsive Design
- Mobile-first approach
- Consistent spacing and sizing
- Touch-friendly interface elements

## Implementation Notes

### Story 2.2 Scope ✅ COMPLETED
- ✅ Focus on color palette implementation only
- ✅ Keep existing Inter font
- ✅ Update both main app and devlog colors (devlog minimal)
- ✅ Document color decisions and usage

### Future Considerations
- Dark mode support (future enhancement)
- Additional brand colors (if provided)
- Typography system expansion (if needed)
- Component variant system (future enhancement)
- Anniversary theme implementation (AEP 110 Anos)
- Special celebratory features and badges
- Chart and data visualization color system
- UI accent color implementation

## Version History

- **v1.0** - Initial brand colors (Pantone 383 C, Pantone 280 C)
- **Date:** 2025-01-28
- **Status:** In development (Story 2.2)
- **v1.1** - Added AEP 110 Anos thematic colors
- **Date:** 2025-01-28
- **Status:** Documented for future implementation
- **v1.2** - Added secondary color palette (12 colors, 4 gradients)
- **Date:** 2025-01-28
- **Status:** Documented for charts and UI accents
- **v1.3** - Added logo clear space requirements and security margins
- **Date:** 2025-01-28
- **Status:** Documented for proper logo implementation
- **v1.4** - Implemented primary brand colors in application
- **Date:** 2025-01-28
- **Status:** ✅ Completed - Colors applied to main app
