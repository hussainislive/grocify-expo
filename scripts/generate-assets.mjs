import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const assetsDir = join(__dirname, '..', 'assets', 'images');

const BG_GREEN = '#06281E';
const LIGHT_GREEN = '#0A4A30';
const WHITE = '#FFFFFF';
const ACCENT = '#4CAF82';

async function svgToPng(svgString, outputPath, width, height) {
  await sharp(Buffer.from(svgString))
    .resize(width, height)
    .png()
    .toFile(outputPath);
  console.log(`Written: ${outputPath}`);
}

// ─── 1. Main icon: 1024x1024 ────────────────────────────────────────────────
// Dark green background, subtle inner glow, shopping cart with G lettermark
const iconSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <!-- Background with rounded corners -->
  <rect width="1024" height="1024" rx="220" fill="${BG_GREEN}"/>
  <!-- Subtle inner glow -->
  <circle cx="512" cy="512" r="400" fill="${LIGHT_GREEN}" opacity="0.45"/>

  <!-- Shopping cart group, centered slightly above midpoint -->
  <g transform="translate(512,470)">
    <!-- Cart basket body -->
    <rect x="-155" y="-85" width="310" height="195" rx="22"
          fill="none" stroke="${WHITE}" stroke-width="30"/>
    <!-- Cart handle arm (diagonal) -->
    <path d="M -195 -138 L -155 -85"
          stroke="${WHITE}" stroke-width="30" stroke-linecap="round" fill="none"/>
    <!-- Cart handle bar (horizontal) -->
    <line x1="-195" y1="-138" x2="-265" y2="-138"
          stroke="${WHITE}" stroke-width="30" stroke-linecap="round"/>
    <!-- Left wheel outer -->
    <circle cx="-75" cy="142" r="40" fill="${WHITE}"/>
    <!-- Right wheel outer -->
    <circle cx="75" cy="142" r="40" fill="${WHITE}"/>
    <!-- Left wheel hub -->
    <circle cx="-75" cy="142" r="17" fill="${BG_GREEN}"/>
    <!-- Right wheel hub -->
    <circle cx="75" cy="142" r="17" fill="${BG_GREEN}"/>
    <!-- G lettermark inside cart basket -->
    <text x="0" y="68"
          font-family="'Helvetica Neue',Helvetica,Arial,sans-serif"
          font-size="158" font-weight="800"
          fill="${ACCENT}"
          text-anchor="middle"
          dominant-baseline="middle">G</text>
  </g>

  <!-- Decorative leaf accents (top-right corner) -->
  <ellipse cx="768" cy="255" rx="46" ry="18"
           fill="${ACCENT}" opacity="0.85"
           transform="rotate(-38 768 255)"/>
  <ellipse cx="810" cy="232" rx="34" ry="13"
           fill="${ACCENT}" opacity="0.55"
           transform="rotate(-55 810 232)"/>
  <!-- Small dot accent -->
  <circle cx="730" cy="290" r="10" fill="${ACCENT}" opacity="0.4"/>
</svg>`;

// ─── 2. Android adaptive foreground: 432x432 ────────────────────────────────
// Android adaptive icon: foreground PNG is composited over backgroundColor (#06281E).
// We include the background explicitly so it renders correctly in all contexts.
// Safe zone = center 66% ≈ 285x285. Scale cart to fit comfortably.
const androidFgSvg = `
<svg width="432" height="432" viewBox="0 0 432 432" xmlns="http://www.w3.org/2000/svg">
  <!-- Background fill matches app.json adaptiveIcon.backgroundColor -->
  <rect width="432" height="432" fill="${BG_GREEN}"/>
  <circle cx="216" cy="216" r="175" fill="${LIGHT_GREEN}" opacity="0.45"/>
  <g transform="translate(216,204) scale(0.72)">
    <rect x="-155" y="-85" width="310" height="195" rx="22"
          fill="none" stroke="${WHITE}" stroke-width="32"/>
    <path d="M -195 -138 L -155 -85"
          stroke="${WHITE}" stroke-width="32" stroke-linecap="round" fill="none"/>
    <line x1="-195" y1="-138" x2="-265" y2="-138"
          stroke="${WHITE}" stroke-width="32" stroke-linecap="round"/>
    <circle cx="-75" cy="142" r="44" fill="${WHITE}"/>
    <circle cx="75" cy="142" r="44" fill="${WHITE}"/>
    <circle cx="-75" cy="142" r="19" fill="${BG_GREEN}"/>
    <circle cx="75" cy="142" r="19" fill="${BG_GREEN}"/>
    <text x="0" y="68"
          font-family="'Helvetica Neue',Helvetica,Arial,sans-serif"
          font-size="158" font-weight="800"
          fill="${ACCENT}"
          text-anchor="middle"
          dominant-baseline="middle">G</text>
  </g>
</svg>`;

// ─── 3. Splash screen: 320x320 ───────────────────────────────────────────────
// expo-splash-screen renders this at imageWidth=170px centered on #06281E bg.
// We include the dark green background so it's self-contained and previews correctly.
const splashSvg = `
<svg width="320" height="320" viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg">
  <!-- Dark green background matching splash backgroundColor in app.json -->
  <rect width="320" height="320" fill="${BG_GREEN}"/>

  <!-- Mini cart icon -->
  <g transform="translate(160,98) scale(0.52)">
    <rect x="-110" y="-58" width="220" height="132" rx="16"
          fill="none" stroke="${WHITE}" stroke-width="24"/>
    <path d="M -138 -94 L -110 -58"
          stroke="${WHITE}" stroke-width="24" stroke-linecap="round" fill="none"/>
    <line x1="-138" y1="-94" x2="-180" y2="-94"
          stroke="${WHITE}" stroke-width="24" stroke-linecap="round"/>
    <circle cx="-55" cy="94" r="30" fill="${WHITE}"/>
    <circle cx="55" cy="94" r="30" fill="${WHITE}"/>
    <circle cx="-55" cy="94" r="13" fill="${BG_GREEN}"/>
    <circle cx="55" cy="94" r="13" fill="${BG_GREEN}"/>
  </g>

  <!-- "Grocify" wordmark -->
  <text x="160" y="210"
        font-family="'Helvetica Neue',Helvetica,Arial,sans-serif"
        font-size="56" font-weight="800"
        fill="${WHITE}"
        text-anchor="middle"
        letter-spacing="-1">Grocify</text>

  <!-- Tagline -->
  <text x="160" y="250"
        font-family="'Helvetica Neue',Helvetica,Arial,sans-serif"
        font-size="18" font-weight="400"
        fill="${ACCENT}"
        text-anchor="middle"
        letter-spacing="3.5">SMART SHOPPING</text>
</svg>`;

// ─── Generate all three ───────────────────────────────────────────────────────
await svgToPng(iconSvg,      join(assetsDir, 'grocify-icon.png'),               1024, 1024);
await svgToPng(androidFgSvg, join(assetsDir, 'grocify-android-foreground.png'), 432,  432);
await svgToPng(splashSvg,    join(assetsDir, 'grocify-splash.png'),             320,  320);

console.log('\nAll assets generated successfully!');
