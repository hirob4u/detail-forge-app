/**
 * Generate DetailForge brand assets:
 * 1. OG image (1200x630) — wordmark on dark background
 * 2. Favicon SVG — "DF" in Lazer84
 * 3. Favicon ICO — 32x32 fallback
 * 4. Apple touch icon — 180x180
 *
 * Run: node scripts/generate-brand-assets.mjs
 */

import sharp from "sharp";
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const BG = "#0A0A0F";
const TEXT = "#E8E8EF";
const PURPLE = "#7C4DFF";
const MUTED = "#8888A0";

const lazer84Base64 = readFileSync(
  join(root, "public/fonts/Lazer84.ttf")
).toString("base64");

function lazer84FontFace() {
  return `@font-face {
    font-family: 'Lazer84';
    src: url('data:font/truetype;base64,${lazer84Base64}');
  }`;
}

// --- OG Image (1200x630) ---
async function generateOGImage() {
  const svg = `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="630" fill="${BG}"/>
      <style>${lazer84FontFace()}</style>
      <text x="600" y="280" text-anchor="middle" font-family="Lazer84, sans-serif" font-size="120" fill="${TEXT}">
        <tspan>Det</tspan><tspan dx="-12">a</tspan><tspan>il</tspan><tspan fill="${PURPLE}">Forge</tspan>
      </text>
      <text x="600" y="360" text-anchor="middle" font-family="sans-serif" font-size="28" fill="${MUTED}" letter-spacing="2">
        Is your business forged through details?
      </text>
    </svg>`;

  await sharp(Buffer.from(svg)).png().toFile(join(root, "public/og-image.png"));
  console.log("✓ public/og-image.png (1200x630)");
}

// --- Favicon SVG (embedded Lazer84) ---
function generateFaviconSVG() {
  const svg = `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <style>${lazer84FontFace()}</style>
  <rect width="32" height="32" rx="6" fill="${BG}"/>
  <text x="2" y="25" font-family="Lazer84, sans-serif" font-size="20" fill="${TEXT}">D</text>
  <text x="15" y="25" font-family="Lazer84, sans-serif" font-size="20" fill="${PURPLE}">F</text>
</svg>`;
  writeFileSync(join(root, "src/app/icon.svg"), svg);
  console.log("✓ src/app/icon.svg (favicon)");
}

// --- Favicon ICO (32x32 rendered with Lazer84) ---
async function generateFaviconICO() {
  const svg = `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <style>${lazer84FontFace()}</style>
  <rect width="64" height="64" rx="12" fill="${BG}"/>
  <text x="4" y="50" font-family="Lazer84, sans-serif" font-size="40" fill="${TEXT}">D</text>
  <text x="30" y="50" font-family="Lazer84, sans-serif" font-size="40" fill="${PURPLE}">F</text>
</svg>`;

  await sharp(Buffer.from(svg))
    .resize(32, 32)
    .png()
    .toFile(join(root, "src/app/favicon.ico"));
  console.log("✓ src/app/favicon.ico (32x32)");
}

// --- Apple Touch Icon (180x180 rendered with Lazer84) ---
async function generateAppleTouchIcon() {
  const svg = `<svg width="360" height="360" viewBox="0 0 360 360" xmlns="http://www.w3.org/2000/svg">
  <style>${lazer84FontFace()}</style>
  <rect width="360" height="360" rx="72" fill="${BG}"/>
  <text x="20" y="270" font-family="Lazer84, sans-serif" font-size="230" fill="${TEXT}">D</text>
  <text x="170" y="270" font-family="Lazer84, sans-serif" font-size="230" fill="${PURPLE}">F</text>
</svg>`;

  await sharp(Buffer.from(svg))
    .resize(180, 180)
    .png()
    .toFile(join(root, "src/app/apple-icon.png"));
  console.log("✓ src/app/apple-icon.png (180x180)");
}

await generateOGImage();
generateFaviconSVG();
await generateFaviconICO();
await generateAppleTouchIcon();
console.log("\nDone! All brand assets generated.");
