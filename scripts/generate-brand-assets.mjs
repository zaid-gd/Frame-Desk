import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const brandDir = path.join(root, "public", "brand");
const iconDir = path.join(brandDir, "icons");
await fs.mkdir(iconDir, { recursive: true });

const iconSizes = [16, 24, 32, 64, 128, 192, 256, 512, 1024];
const faviconSource = path.join(root, "assets", "Favicon.png");
await sharp(faviconSource)
  .resize(1024, 1024, { fit: "cover" })
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(path.join(brandDir, "favicon.png"));

for (const variant of ["dark", "light"]) {
  for (const size of iconSizes) {
    await sharp(faviconSource)
      .resize(size, size)
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toFile(path.join(iconDir, `app-icon-${variant}-${size}.png`));
  }
}

const reports = await fs.readFile(path.join(brandDir, "empty-states", "reports.png"));
const reportsData = `data:image/png;base64,${reports.toString("base64")}`;
const ogSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <defs>
    <radialGradient id="glow" cx="0" cy="0" r="1" gradientTransform="translate(1270 170) rotate(130) scale(670 530)" gradientUnits="userSpaceOnUse">
      <stop stop-color="#2D8C97" stop-opacity=".2"/>
      <stop offset="1" stop-color="#0C0F12" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="line" x1="110" y1="0" x2="480" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset=".6" stop-color="#E6E5E3"/>
      <stop offset="1" stop-color="#E6E5E3" stop-opacity=".08"/>
    </linearGradient>
    <linearGradient id="teal" x1="110" y1="0" x2="480" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset=".6" stop-color="#69C4CE"/>
      <stop offset="1" stop-color="#2D8C97" stop-opacity=".08"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="900" fill="#0C0F12"/>
  <rect width="1600" height="900" fill="url(#glow)"/>
  <g opacity=".16" stroke="#3A4552">
    <path d="M0 120H1600M0 300H1600M0 480H1600M0 660H1600M0 840H1600"/>
    <path d="M160 0V900M400 0V900M640 0V900M880 0V900M1120 0V900M1360 0V900"/>
  </g>
  <g transform="translate(104 86)">
    <path d="M0 0h176l78 70h190" fill="none" stroke="url(#line)" stroke-width="28"/>
    <path d="M0 54h158l78 70h208" fill="none" stroke="url(#line)" stroke-width="28"/>
    <path d="M0 108h140l78 70h226" fill="none" stroke="url(#teal)" stroke-width="28"/>
  </g>
  <text x="104" y="425" fill="#E6E5E3" font-family="Arial, sans-serif" font-size="104" font-weight="700" letter-spacing="-4">CutLab Studio</text>
  <text x="110" y="495" fill="#69C4CE" font-family="Arial, sans-serif" font-size="24" font-weight="600" letter-spacing="8">VIDEO EDITING WORKFLOW</text>
  <text x="110" y="585" fill="#A5ADB4" font-family="Arial, sans-serif" font-size="36">Plan. Track. Review. Deliver.</text>
  <text x="110" y="645" fill="#7B848E" font-family="Arial, sans-serif" font-size="25">A focused production workspace for editors and small teams.</text>
  <rect x="1010" y="120" width="500" height="620" rx="28" fill="#151B20" stroke="#2A3138" stroke-width="2"/>
  <image href="${reportsData}" x="950" y="170" width="620" height="416" preserveAspectRatio="xMidYMid meet"/>
  <rect x="1068" y="650" width="310" height="12" rx="6" fill="#293139"/>
  <rect x="1068" y="650" width="230" height="12" rx="6" fill="#2D8C97"/>
  <circle cx="1425" cy="656" r="18" fill="#69C4CE"/>
</svg>`;

await sharp(Buffer.from(ogSvg)).png({ compressionLevel: 9 }).toFile(path.join(root, "public", "og-image.png"));
console.log(`Generated favicon master, ${iconSizes.length * 2} app icon PNGs, and public/og-image.png`);
