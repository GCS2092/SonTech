import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'fs';

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

const svgLogo = () => `<svg xmlns="http://www.w3.org/2000/svg" width="680" height="680" viewBox="0 0 680 680">
  <rect width="680" height="680" fill="#2C2C3E" rx="140"/>
  <rect x="40" y="40" width="600" height="600" fill="none" stroke="#C8748A" stroke-width="1.5" rx="110" opacity="0.3"/>
  <text x="160" y="400" text-anchor="start" font-family="Georgia, serif" font-size="300" font-weight="900" fill="#C8748A">S</text>
  <text x="355" y="400" text-anchor="start" font-family="Georgia, serif" font-size="120" font-weight="700" fill="#C8A96E">on</text>
  <line x1="120" y1="430" x2="560" y2="430" stroke="#C8A96E" stroke-width="1" opacity="0.5"/>
  <text x="340" y="530" text-anchor="middle" font-family="Georgia, serif" font-size="90" font-weight="700" letter-spacing="20" fill="#FFFFFF">SHOP</text>
  <line x1="120" y1="558" x2="560" y2="558" stroke="#C8A96E" stroke-width="1" opacity="0.5"/>
</svg>`;

mkdirSync('./public/icons', { recursive: true });

for (const size of sizes) {
  const svg = Buffer.from(svgLogo());
  await sharp(svg).resize(size, size).png().toFile(`./public/icons/icon-${size}x${size}.png`);
  console.log(`icon-${size}x${size}.png OK`);
}
