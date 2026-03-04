import fs from 'fs';
import { generateDoorSvg } from './server/svgGenerator';
import sharp from 'sharp';

async function testImage(filename: string, config: any) {
    const svgContent = generateDoorSvg({ ...config, compact: true } as any);

    // Write the SVG
    fs.writeFileSync(`${filename}.svg`, svgContent);

    // Convert to PNG just like in routes.ts
    const pngBuffer = await sharp(Buffer.from(svgContent), { density: 300 })
        .flatten({ background: '#ffffff' })
        .resize({
            width: 1000,
            height: 1000,
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toBuffer();

    fs.writeFileSync(`${filename}.png`, pngBuffer);
    console.log(`Saved ${filename}.svg and ${filename}.png`);
}

async function runTests() {
    console.log("Generating Left Angled Door...");
    await testImage('test-angled-left', {
        width: 600,
        height: 1200,
        thickness: 22,
        preset: 'single',
        panelType: 'STANDARD_12MM',
        panelCount: 1,
        shape: 'angled',
        angledLeft: true,
        angledRight: false,
        leftAngleDegrees: 30, // Rough angle indication
        leftTriangleCutoutWidth: 200,
        leftTriangleCutoutHeight: 300,
        material: 'MR MDF',
        finish: 'PRIMED',
        leftStile: 90,
        rightStile: 90,
        topRail: 90,
        bottomRail: 90,
        leftAngledRailWidth: 90,
        rightAngledRailWidth: 90
    });

    console.log("Generating Right Angled Door with Mid-Rails...");
    await testImage('test-angled-right-midrail', {
        width: 800,
        height: 2000,
        thickness: 22,
        preset: 'single',
        panelType: 'STANDARD_12MM',
        panelCount: 3,
        shape: 'angled',
        angledLeft: false,
        angledRight: true,
        rightAngleDegrees: 45,
        rightTriangleCutoutWidth: 400,
        rightTriangleCutoutHeight: 400,
        material: 'MR MDF',
        finish: 'PRIMED',
        leftStile: 90,
        rightStile: 90,
        topRail: 90,
        bottomRail: 90,
        leftAngledRailWidth: 90,
        rightAngledRailWidth: 90,
        midRailsEnabled: true,
        midRails: [
            { positionFromBottom: 666, dimension: 90 },
            { positionFromBottom: 1333, dimension: 90 }
        ]
    });
}

runTests().catch(console.error).finally(() => process.exit(0));
