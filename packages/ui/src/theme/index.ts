// medcord palette — see docs/product/mvp.md.
//   Primary: Deep Forest Green
//   Accent:  Cream / Soft Ivory
//   Highlight: Burnt Orange (alerts/CTAs only)
//   Neutrals: Charcoal, off-white
export const medcord_COLORS = {
  forest: {
    900: '#1B4332',
    700: '#2D5A3D',
  },
  cream: {
    50: '#F5EFE0',
  },
  orange: {
    600: '#C7522A',
  },
  charcoal: {
    900: '#1F2024',
    700: '#3A3B40',
  },
  offwhite: {
    50: '#FAFAF7',
  },
} as const;

export type medcordColorScale = keyof typeof medcord_COLORS;

export const FONTS = {
  display: '"Fraunces", Georgia, serif',
  body: '"Inter", system-ui, sans-serif',
} as const;
