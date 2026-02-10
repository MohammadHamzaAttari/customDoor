
import fetch from "node-fetch";
import { storage } from "../server/storage";
import fs from "fs";
import path from "path";

async function runVerification() {
    console.log("🚀 Starting Deep Alignment Checkout Verification...");

    // 1. Define Detailed Payload
    const payload = {
        items: [
            {
                width: 800,
                height: 2200,
                thickness: 22,
                panelType: "STANDARD_12MM",
                finish: "PRIMED",
                material: "MR MDF",
                price: 245.50,
                quantity: 1,
                category: "shaker",

                // Angled Spec
                angledLeft: true,
                leftAngleDegrees: 42.5,
                leftTriangleCutoutWidth: 150,
                leftTriangleCutoutHeight: 400,

                // Hinge Spec
                hingeDrilling: true,
                hinges: [
                    { position: 120, side: "LEFT" },
                    { position: 1100, side: "LEFT" },
                    { position: 2080, side: "LEFT" }
                ],

                // Mid Rail Spec
                midRailsEnabled: true,
                midRails: [
                    { position: 1100, height: 100 }
                ],

                // Borders
                customBorders: true,
                topRail: 100,
                bottomRail: 100,
                leftStile: 120,
                rightStile: 90
            }
        ]
    };

    console.log("\n📦 Sending POST request to /api/quick-checkout...");
    const start = Date.now();

    try {
        const res = await fetch("http://localhost:5000/api/quick-checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            throw new Error(`API Request Failed: ${res.status} ${res.statusText} - ${await res.text()}`);
        }

        const data: any = await res.json();
        console.log(`✅ API Success (${Date.now() - start}ms)`);

        // 2. Verify Database Record
        console.log("\n🔍 Verifying Deep Data Alignment...");
        const allOrders = await storage.getAllOrders();
        const order = allOrders.find(o => o.shopifyDraftOrderId === data.draftOrderId.toString());

        if (!order) {
            console.error("❌ FAILED: Could not find local order.");
            return;
        }

        const items = await storage.getOrderItemsByOrder(order.id);
        const item = items[0];

        if (!item) {
            console.error("❌ FAILED: No order items found.");
            return;
        }

        // --- FIELD CHECKS ---
        const checks = [
            { label: "Material", expected: "MR MDF", actual: item.material },
            { label: "Thickness", expected: 22, actual: item.panelThicknessMm },
            { label: "Is Angled", expected: true, actual: item.isAngled },
            { label: "Left Angle", expected: "42.50", actual: item.leftAngleDegrees },
            { label: "L Cutout W", expected: 150, actual: item.leftTriangleCutoutWidth },
            { label: "L Cutout H", expected: 400, actual: item.leftTriangleCutoutHeight },
            { label: "Top Rail", expected: 100, actual: item.borderTopRail },
            { label: "Left Stile", expected: 120, actual: item.borderLeftStile }
        ];

        let failedChecks = 0;
        checks.forEach(c => {
            if (c.expected.toString() === c.actual?.toString()) {
                console.log(`   ✅ ${c.label}: ${c.actual}`);
            } else {
                console.error(`   ❌ ${c.label}: Expected ${c.expected}, got ${c.actual}`);
                failedChecks++;
            }
        });

        // --- CHILD TABLE CHECKS ---
        const hingesInDb = await storage.getHingesByItem(item.id);
        const railsInDb = await storage.getMidRailsByItem(item.id);

        console.log(`   ✅ Hinges stored: ${hingesInDb.length} (Expected 3)`);
        console.log(`   ✅ Mid-rails stored: ${railsInDb.length} (Expected 1)`);

        if (hingesInDb.length !== 3 || railsInDb.length !== 1) {
            failedChecks++;
        }

        // --- BINARY CONTENT CHECK ---
        const attachments = await storage.getOrderAttachments(order.id);
        const hasContent = attachments.every(a => a.fileContent && a.fileContent.length > 0);
        console.log(`   ✅ Binary content in DB: ${hasContent ? "PRESENT" : "MISSING"}`);
        if (!hasContent) failedChecks++;

        if (failedChecks === 0) {
            console.log("\n🎉 FULL DATA ALIGNMENT VERIFIED SUCCESSFULLY!");
        } else {
            console.error(`\n❌ VERIFICATION FAILED with ${failedChecks} errors.`);
        }

    } catch (err) {
        console.error("Test Failed:", err);
    }
}

runVerification();
