import fs from 'fs';
import path from 'path';
import { generateDoorSvg } from './server/svgGenerator';
import sharp from 'sharp';

async function generatePreview(name: string, config: any) {
    const svg = generateDoorSvg({ ...config, compact: true });
    const outDir = path.join(process.cwd(), 'test-outputs');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

    fs.writeFileSync(path.join(outDir, `${name}.svg`), svg);

    await sharp(Buffer.from(svg))
        .flatten({ background: '#ffffff' })
        .resize(1000, 1000, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toFile(path.join(outDir, `${name}.png`));

    console.log(`Generated ${name}.png`);
}

async function runTests() {
    const testCases = [
        {
            name: 'tall-narrow',
            config: { width: 300, height: 2100, panelType: 'STANDARD_12MM', preset: 'single' }
        },
        {
            name: 'wide-short',
            config: { width: 1000, height: 400, panelType: 'REEDED_19MM', preset: 'single' }
        },
        {
            name: 'angled-left-600x720',
            config: {
                width: 600, height: 720, shape: 'angled', angledLeft: true,
                leftTriangleCutoutWidth: 200, leftTriangleCutoutHeight: 400,
                panelType: 'MELAMINE_18MM', borderWidth: 90
            }
        },
        {
            name: 'double-door',
            config: { width: 1200, height: 2100, preset: 'double', panelType: 'STANDARD_12MM', borderWidth: 75 }
        }
    ];

    for (const tc of testCases) {
        await generatePreview(tc.name, tc.config);
    }
}

runTests().catch(console.error);
