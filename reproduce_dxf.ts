
import { generateDoorDxf, DxfDoorConfig } from "./server/dxfGenerator";
import fs from "fs";

const config: DxfDoorConfig = {
    width: 900,
    height: 2100,
    thickness: 40,
    preset: "single",
    shape: "angled",
    material: "MDF",
    finish: "Primed",
    customerName: "Mohammad Attari",
    jobName: "Getai Kitchen",
    doorId: "DOOR-12345",
    rebateWidthMm: 10,
    rebateDepthMm: 10,
    frontFaceThicknessMm: 5,
    cornerRadiusMm: 0,
    angledLeft: true,
    angledRight: true,
    leftTriangleCutoutWidth: 200,
    leftTriangleCutoutHeight: 200,
    rightTriangleCutoutWidth: 200,
    rightTriangleCutoutHeight: 200,
    hinges: [
        { side: "LEFT", positionFromBottomMm: 300 },
        { side: "LEFT", positionFromBottomMm: 1800 } // This one might be near the cut
    ],
    midRailsEnabled: true,
    midRails: [
        { position: 800, height: 100 },
        { position: 1500, height: 100 }
    ],
    panelType: "FLAT_12MM",
    panelCount: 3
};

try {
    console.log("Generating DXF...");
    const dxfContent = generateDoorDxf(config);
    console.log("DXF generated successfully. Length:", dxfContent.length);
    fs.writeFileSync("test.dxf", dxfContent);
} catch (error) {
    console.error("Error generating DXF:", error);
}

// Test with 0 dimensions for cut
try {
    console.log("Generating DXF with 0 dimensions for cut...");
    const configZero: DxfDoorConfig = { ...config, leftTriangleCutoutWidth: 0, leftTriangleCutoutHeight: 0 };
    const dxfContent = generateDoorDxf(configZero);
    console.log("DXF (zero cut) generated successfully. Length:", dxfContent.length);
} catch (error) {
    console.error("Error generating DXF (zero cut):", error);
}
