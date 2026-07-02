import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

const svg = await readFile('static/icons/icon.svg');
await sharp(svg).resize(192, 192).png().toFile('static/icons/icon-192.png');
await sharp(svg).resize(512, 512).png().toFile('static/icons/icon-512.png');
await sharp(svg).resize(180, 180).png().toFile('static/icons/apple-touch-icon.png');

// OGP 画像(Social preview と同じデザインをサイトから配信する)
const social = await readFile('.github/social-preview.svg');
await sharp(social, { density: 96 }).resize(1280, 640).png().toFile('static/ogp.png');

console.log('icons generated');
