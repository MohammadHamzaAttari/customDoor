
import fetch from "node-fetch";

async function verifyDxfDetails() {
    console.log("Starting Detailed DXF Verification...");

    // 1. Prepare Export with detailed dimensions
    const prepareUrl = "http://localhost:5000/api/export/prepare?type=dxf";
    const payload = {
        width: 900,
        height: 2100,
        thickness: 40,
        preset: "single",
        panelType: "STANDARD_12MM",
        panelCount: 1,
        shape: "rectangular",
        material: "MDF",
        finish: "RAW",
        rebateWidthMm: 10,
        rebateDepthMm: 15,
        frontFaceThicknessMm: 10,
        cornerRadiusMm: 0,
        hinges: [
            { id: "test-hinge", positionFromBottomMm: 100, side: "LEFT", type: "SCREW_POINTS" }
        ],
        // Detailed dimensions
        leftStile: 110,
        rightStile: 110,
        topRail: 110,
        bottomRail: 220,
        midRailsEnabled: false,
        midRails: []
    };

    try {
        const prepRes = await fetch(prepareUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!prepRes.ok) {
            const err = await prepRes.text();
            console.error("Preparation Failed:", prepRes.status, err);
            process.exit(1);
        }

        const { token } = (await prepRes.json()) as any;
        console.log("Token received:", token);

        // 2. Download DXF
        const downloadUrl = `http://localhost:5000/api/download/dxf/${token}`;
        const dlRes = await fetch(downloadUrl);

        if (!dlRes.ok) {
            console.error("Download Failed:", dlRes.status);
            process.exit(1);
        }

        const dxfText = await dlRes.text();
        console.log(`DXF Downloaded (${dxfText.length} bytes). Checking for detailed entities...`);

        // 3. Verify Content
        // Check for specific labels added in the new implementation
        const checks = [
            { label: "SECTION A-A (SIDE)", found: dxfText.includes("SECTION A-A (SIDE)") },
            { label: "SECTION B-B (TOP)", found: dxfText.includes("SECTION B-B (TOP)") },
            { label: "B.Rail: 220", found: dxfText.includes("B.Rail: 220") },
            { label: "T.Rail: 110", found: dxfText.includes("T.Rail: 110") },
            { label: "Stile: 110", found: dxfText.includes("Stile: 110") },
        ]; // Changed closing bracket to match array end

        // Check for CNC Layers
        const expectedLayers = [
            "T1_DRILL_V4",
            "T8_DRILL_35MM",
            "HINGES",
            "T6_REBATE_12MM",
            "T6_INNER_ONION",
            "T4_PROFILE_8MM_OS",
            "T4_PROFILE_8MM_FINAL",
            "T3_REBATE_FINISH",
            "T3_INNER_BREAK",
            "PANEL_GEOMETRY"
        ];

        let allLayersFound = true;
        expectedLayers.forEach(layer => {
            if (!dxfText.includes(layer)) {
                console.error(`❌ Missing Layer: ${layer}`);
                allLayersFound = false;
            } else {
                console.log(`✅ Found Layer: ${layer}`);
            }
        });

        // Basic entity check
        if (dxfText.includes("CIRCLE") && dxfText.includes("LWPOLYLINE")) {
            console.log("✅ Found Geometric Entities (Circle, Polyline)");
        } else {
            console.error("❌ Missing Geometric Entities");
            allLayersFound = false; // If entities are missing, the overall check should fail
        }

        if (allLayersFound) {
            console.log("\nSUCCESS: DXF contains all required manufacturing layers.");
            process.exit(0);
        } else {
            console.log("\nFAILURE: DXF is missing some manufacturing layers or entities.");
            process.exit(1);
        }

    } catch (error) {
        console.error("Verification Error:", error);
        process.exit(1);
    }
}

verifyDxfDetails();
