# Design System Document: The Sentient Archive

## 1. Overview & Creative North Star
**Creative North Star: "The Digital Heirloom"**

This design system rejects the cold, sterile nature of traditional data storage in favor of a "Warm yet Technological" sanctuary. We are building more than a gallery; we are crafting a living, breathing digital archive. The aesthetic combines the tactile warmth of a physical baby book with the precision of a cutting-edge biometric interface.

To break the "template" look, we employ **Intentional Asymmetry** and **Tonal Depth**. Layouts should feel editorial—think high-end fashion magazines meets futuristic data dashboards. By overlapping glass containers over soft, organic backgrounds and utilizing extreme typographic contrast, we create a space that feels both deeply emotional and scientifically secure.

---

## 2. Colors: Tonal Radiance
Our palette balances the "human" (warm creams and roses) with the "tech" (deep teals and vibrant blues).

### The "No-Line" Rule
**Strict Mandate:** 1px solid borders for sectioning are prohibited. 
Boundaries must be defined solely through background color shifts or tonal transitions. Use `surface-container-low` for a section resting on a `surface` background. If you need to separate content, use the Spacing Scale (e.g., `8` or `10`) to create breathing room, not a line.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. We use "Tonal Nesting" to define importance:
- **Base Layer:** `surface` (#fbf9f5) or `background`.
- **Secondary Content:** `surface-container-low`.
- **Primary Interactive Cards:** `surface-container-lowest` (#ffffff) to create a "lifted" feel.
- **Deep Content:** `surface-container-highest` for recessed areas like search bars or data wells.

### The "Glass & Gradient" Rule
To bridge the gap between "Warm" and "Tech," use Glassmorphism for floating elements (modals, navigation bars, hover states).
- **Glass Specs:** Background color at 60% opacity with a `20px` to `40px` backdrop-blur. 
- **Signature Gradients:** Use a subtle linear gradient from `primary` (#9f4043) to `primary-container` (#ffaba9) for Hero CTAs and data visualization highlights to give the UI a "soul."

---

### 3. Typography: The Editorial Voice
We use a high-contrast pairing to balance heritage with innovation.

*   **Headlines (The Heart):** `notoSerif`. This serif provides an authoritative, trustworthy, and emotional "journal" feel. 
    *   *Usage:* Use `display-lg` for milestones and `headline-md` for section titles.
*   **Functional Text (The Brain):** `spaceGrotesk`. A geometric sans-serif that screams precision and modern technology.
    *   *Usage:* All interactive elements, labels, and data visualizations.

**Scale Highlights:**
- **Display-LG (3.5rem):** For emotional hooks (e.g., "Day 402: First Steps").
- **Title-MD (1.125rem):** For card headers and navigational anchors.
- **Label-SM (0.6875rem):** For technical data points (e.g., "Weight: 8.4kg").

---

## 4. Elevation & Depth: Layering Over Shadows
Depth in this system is achieved through **Tonal Layering** rather than structural geometry.

*   **The Layering Principle:** Place a `surface-container-lowest` card atop a `surface-container-low` section. This creates a natural, soft lift that mimics fine paper stacked on a desk.
*   **Ambient Shadows:** For floating elements (e.g., a "New Memory" popover), use a `primary-dim` or `on-surface` tinted shadow at 4% opacity with a 32px blur. Avoid grey/black shadows; shadows should feel like light passing through colored glass.
*   **The "Ghost Border" Fallback:** If accessibility requires a border, use `outline-variant` (#b2b2ad) at **15% opacity**. It must feel like a suggestion of a line, not a hard stop.
*   **Corner Philosophy:** Follow the Roundedness Scale religiously. Use `xl` (3rem) for hero containers to feel "cradled" and friendly, and `sm` (0.5rem) for technical components like data chips to maintain the "tech" edge.

---

## 5. Components: Precision & Softness

### Buttons: The Tactile Pulse
- **Primary:** Gradient fill (`primary` to `primary-container`). Roundedness: `full`. No border.
- **Secondary:** `surface-container-highest` fill with `on-surface` text.
- **Interaction:** On hover, increase the backdrop-blur if the button is glass-based, or slightly shift the gradient angle.

### Data Visualizations: The Tech Aspect
- Use `tertiary` (#295fa7) and `secondary` (#006c5d) for growth charts.
- Lines should be "crisp" (2px width) but dots should be large, soft "glow" points using a `tertiary-fixed` neon effect.

### Input Fields & Text Areas
- **Style:** Use `surface-container-lowest` with a "Ghost Border" (15% `outline-variant`). 
- **States:** On focus, the border disappears and is replaced by a 2px `secondary` glow and a slight background shift to `surface-bright`.

### Cards & Lists
- **Rule:** Absolute prohibition of divider lines. 
- **Separation:** Use `1.5` (0.5rem) spacing between list items and alternating background tones (e.g., `surface` and `surface-container-low`) to create a striped, organized feel without the "jail cell" look of grid lines.

### Specialized Component: The "Timeline Beacon"
A vertical progress indicator for baby milestones. Use a `secondary` line with `lg` (2rem) rounded glass containers that overlap the line, creating a sense of 3D depth.

---

## 6. Do's and Don'ts

### Do:
- **Do** use intentional white space. Let the `display` typography breathe.
- **Do** overlap elements. A photo card should slightly overlap a text container to create a "scrapbook" feel.
- **Do** use `primary-fixed` for highlights to keep the "warmth" present even in data-heavy views.

### Don't:
- **Don't** use pure black (#000000). Use `on-surface` (#31332f) for all text to keep the contrast soft.
- **Don't** use sharp 90-degree corners. Even the smallest chip must have a `sm` radius.
- **Don't** use standard "drop shadows." If it looks like a 2010 web app, the shadow is too dark and the blur is too small.
- **Don't** use standard icons. Opt for thin-stroke (1.5px) custom icons that match the geometric nature of `spaceGrotesk`.