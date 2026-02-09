
import fetch from "node-fetch";

const baseUrl = "http://localhost:5000";

async function verifyDxfGeometry() {
    console.log("Starting DXF Geometry Verification...");

    // Config: 900x2100 Door.
    // Angled Top Right: 200mm width, 200mm height.
    // Expected Points for Right Cut:
    // X=900, Y=1900 (Start of cut on right edge) -> Y = 2100 - 200
    // X=700, Y=2100 (End of cut on top edge) -> X = 900 - 200

    const payload = {
        "width": 900,
        "height": 2100,
        "thickness": 40,
        "preset": "single",
        "panelType": "NONE",
        "panelCount": 0,
        "shape": "angled",
        "material": "MDF",
        "finish": "Primed",
        "rebateWidthMm": 10,
        "rebateDepthMm": 10,
        "frontFaceThicknessMm": 5,
        "cornerRadiusMm": 0,
        "angledLeft": false,
        "angledRight": true,
        "leftTriangleCutoutWidth": 0,
        "leftTriangleCutoutHeight": 0,
        "rightTriangleCutoutWidth": 200,
        "rightTriangleCutoutHeight": 200,
        "hinges": []
    };

    try {
        // 1. Prepare
        const prepareRes = await fetch(`${baseUrl}/api/export/prepare?type=dxf`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!prepareRes.ok) throw new Error("Prepare failed");
        const { token } = await prepareRes.json();

        // 2. Download
        const downloadRes = await fetch(`${baseUrl}/api/download/dxf/${token}`);
        const dxfText = await downloadRes.text();

        console.log(`DXF Downloaded (${dxfText.length} bytes). Checking geometry...`);

        // Helper to check for coordinate pair availability in rough proximity (DXF format varies)
        // We look for specific values usually found in LWPOLYLINE or LINE entities
        // 10 = X, 20 = Y usually.

        // We expect to find 900.0 mixed with 1900.0 (The vertical start of the cut)
        // And 700.0 mixed with 2100.0 (The horizontal end of the cut)

        // Note: Dxf libraries often behave differently, but let's check for the presence of the calculated values.

        const hasRightEdgeCutStart = dxfText.includes("1900") || dxfText.includes("1900.0"); // Y value
        const hasTopEdgeCutEnd = dxfText.includes("700") || dxfText.includes("700.0");   // X value at top

        // Check for Side View (Starts at Width/2 + 200 => 450 + 200 = 650)
        // Wait, width/2 + 200 is used for SINGLE door? 
        // In drawSideView call: width / 2 + 200. Front view is -450 to 450.
        // So Side view starts at 450 + 200 = 650.
        // Let's check for TEXT "SIDE VIEW" and "TOP VIEW".

        const hasSideViewLabel = dxfText.includes("SIDE VIEW");
        const hasTopViewLabel = dxfText.includes("TOP VIEW");
        const hasThicknessDim = dxfText.includes("Thk: 40mm");

        if (hasRightEdgeCutStart && hasTopEdgeCutEnd && hasSideViewLabel && hasTopViewLabel && hasThicknessDim) {
            console.log("[PASS] Found coordinates consistent with 200x200 angled cut.");
            console.log("[PASS] Found Side View and Top View labels.");
            console.log("[PASS] Found Thickness dimension (40mm).");
        } else {
            console.error("[FAIL] Missing expected geometry or labels.");
            if (!hasSideViewLabel) console.error(" - Missing SIDE VIEW label");
            if (!hasTopViewLabel) console.error(" - Missing TOP VIEW label");
            process.exit(1);
        }

        console.log("Geometry Check Passed: Angled cut and Section views are present.");

    } catch (error) {
        console.error("Verification Failed:", error);
        process.exit(1);
    }
}

verifyDxfGeometry();
