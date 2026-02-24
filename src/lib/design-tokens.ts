// DetailForge Design Tokens
// All agent-produced code imports from this file.
// Never hardcode values that appear here.

export const colors = {
  // Foundation
  background:   '#0A0A0F',
  surface:      '#12121A',
  elevated:     '#1A1A25',
  hover:        '#222230',
  border:       '#2A2A3A',
  muted:        '#8888A0',
  text:         '#E8E8EF',

  // Purple system
  purpleText:   '#9575FF',  // links, labels, active nav
  purpleAction: '#7C4DFF',  // buttons, icons, borders
  purpleDeep:   '#5E35B1',  // gradients, fills, hover darken

  // Neon accents
  magenta:      '#E040FB',  // AI-generated content only
  green:        '#39FF14',  // revenue, money, success
  cyan:         '#00E5FF',  // informational
  amber:        '#FFAB00',  // warnings, costs
};

export const fonts = {
  display: 'Lazer84, cursive',    // wordmark + one hero headline only
  ui:      'DM Sans, sans-serif', // all interface text
  data:    'JetBrains Mono, monospace', // numbers, metrics, badges
};

export const radius = {
  card:   '12px',
  nested: '10px',
  button: '8px',
  badge:  '6px',
};
