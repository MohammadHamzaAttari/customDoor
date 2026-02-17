// server/seed.ts
import { db } from "./db";
import {
    doorStyles,
    finishOptions,
    priceBracketsHeight,
    priceBracketsWidth,
    pricingMatrix,
    surchargeTypes,
    deliveryOptions,
    systemSettings,
} from "../shared/schema";

async function seed() {
    console.log("🌱 Starting database seed...");

    try {
        // =====================================================
        // DOOR STYLES
        // =====================================================
        console.log("📦 Seeding door styles...");
        await db.insert(doorStyles).values([
            {
                styleCode: "SHAKER",
                styleName: "Shaker Style",
                description: "Classic shaker door with center panel",
                thicknessMm: 22,
                rebateWidthMm: 10,
                rebateDepthMm: 14,
                frontFaceThicknessMm: 8,
                cornerRadiusMm: "2.5",
                panelThicknessMm: 12,
                minBorderWidthMm: 50,
                supportsAngled: true,
                supportsMidRails: true,
                priceAdjustment: "0.00",
                isActive: true,
            },
            {
                styleCode: "SLAB",
                styleName: "Slab/Flat Panel",
                description: "Modern flat panel door",
                thicknessMm: 22,
                rebateWidthMm: 0,
                rebateDepthMm: 0,
                frontFaceThicknessMm: 22,
                cornerRadiusMm: "0.0",
                panelThicknessMm: 22,
                minBorderWidthMm: 0,
                supportsAngled: true,
                supportsMidRails: false,
                priceAdjustment: "0.00",
                isActive: true,
            },
            {
                styleCode: "SLAB_18",
                styleName: "Slab 18mm",
                description: "Thin slab door 18mm thickness",
                thicknessMm: 18,
                rebateWidthMm: 0,
                rebateDepthMm: 0,
                frontFaceThicknessMm: 18,
                cornerRadiusMm: "0.0",
                panelThicknessMm: 18,
                minBorderWidthMm: 0,
                supportsAngled: true,
                supportsMidRails: false,
                priceAdjustment: "0.00",
                isActive: true,
            },
            {
                styleCode: "SLAB_25",
                styleName: "Slab 25mm",
                description: "Thick slab door 25mm thickness",
                thicknessMm: 25,
                rebateWidthMm: 0,
                rebateDepthMm: 0,
                frontFaceThicknessMm: 25,
                cornerRadiusMm: "0.0",
                panelThicknessMm: 25,
                minBorderWidthMm: 0,
                supportsAngled: true,
                supportsMidRails: false,
                priceAdjustment: "0.00",
                isActive: true,
            },
            {
                styleCode: "DORDOGNE",
                styleName: "Dordogne Style",
                description: "Premium dordogne style door",
                thicknessMm: 22,
                rebateWidthMm: 10,
                rebateDepthMm: 14,
                frontFaceThicknessMm: 8,
                cornerRadiusMm: "2.5",
                panelThicknessMm: 12,
                minBorderWidthMm: 60,
                supportsAngled: true,
                supportsMidRails: true,
                priceAdjustment: "15.00",
                isActive: true,
            },
            {
                styleCode: "SLIM_SHAKER",
                styleName: "Slim Shaker",
                description: "Shaker style with slimmer borders",
                thicknessMm: 22,
                rebateWidthMm: 10,
                rebateDepthMm: 14,
                frontFaceThicknessMm: 8,
                cornerRadiusMm: "2.5",
                panelThicknessMm: 12,
                minBorderWidthMm: 40,
                supportsAngled: true,
                supportsMidRails: true,
                priceAdjustment: "10.00",
                isActive: true,
            },
        ]).onConflictDoNothing();

        // =====================================================
        // FINISH OPTIONS
        // =====================================================
        console.log("🎨 Seeding finish options...");
        await db.insert(finishOptions).values([
            {
                finishCode: "RAW_UNASSEMBLED",
                finishName: "Raw MDF Components",
                description: "Parts straight off the CNC. Panels loose.",
                priceMultiplier: "1.00",
                fixedSurcharge: "0.00",
                isActive: true,
            },
            {
                finishCode: "ASSEMBLED_PREP",
                finishName: "Assembled & Prepped",
                description: "Arris rounding, sanding, gluing, caulking.",
                priceMultiplier: "1.00", // Additive pricing model
                fixedSurcharge: "15.00",
                isActive: true,
            },
            {
                finishCode: "PRIMED",
                finishName: "Primed",
                description: "Fully prepped and primed (Sayerlack AU474).",
                priceMultiplier: "1.00", // Additive pricing model
                fixedSurcharge: "35.00",
                isActive: true,
            },
        ]).onConflictDoNothing();

        // =====================================================
        // PRICE BRACKETS - HEIGHT
        // =====================================================
        console.log("📏 Seeding height price brackets...");
        await db.insert(priceBracketsHeight).values([
            { bracketName: "Drawer Front", maxHeightMm: 200, sortOrder: 1, isActive: true },
            { bracketName: "Tall Drawer Front", maxHeightMm: 400, sortOrder: 2, isActive: true },
            { bracketName: "Alcove/Small Base Cabinet", maxHeightMm: 650, sortOrder: 3, isActive: true },
            { bracketName: "Kitchen Base Cabinet", maxHeightMm: 800, sortOrder: 4, isActive: true },
            { bracketName: "Mid Height Door", maxHeightMm: 1500, sortOrder: 5, isActive: true },
            { bracketName: "Tall Door", maxHeightMm: 2200, sortOrder: 6, isActive: true },
            { bracketName: "Extra Tall Door", maxHeightMm: 2400, sortOrder: 7, isActive: true },
        ]).onConflictDoNothing();

        // =====================================================
        // PRICE BRACKETS - WIDTH
        // =====================================================
        console.log("📐 Seeding width price brackets...");
        await db.insert(priceBracketsWidth).values([
            { bracketName: "Narrow", maxWidthMm: 400, sortOrder: 1, isActive: true },
            { bracketName: "Standard", maxWidthMm: 600, sortOrder: 2, isActive: true },
            { bracketName: "Wide", maxWidthMm: 800, sortOrder: 3, isActive: true },
            { bracketName: "Oversize", maxWidthMm: 1200, sortOrder: 4, isActive: true },
        ]).onConflictDoNothing();

        // =====================================================
        // PRICING MATRIX
        // =====================================================
        console.log("💰 Seeding pricing matrix...");

        const heightBrackets = await db.select().from(priceBracketsHeight);
        const widthBrackets = await db.select().from(priceBracketsWidth);

        const basePrices: Record<string, Record<string, number>> = {
            "Drawer Front": { "Narrow": 15, "Standard": 18, "Wide": 22, "Oversize": 28 },
            "Tall Drawer Front": { "Narrow": 20, "Standard": 24, "Wide": 30, "Oversize": 38 },
            "Alcove/Small Base Cabinet": { "Narrow": 32, "Standard": 38, "Wide": 45, "Oversize": 55 },
            "Kitchen Base Cabinet": { "Narrow": 38, "Standard": 45, "Wide": 55, "Oversize": 68 },
            "Mid Height Door": { "Narrow": 55, "Standard": 65, "Wide": 78, "Oversize": 95 },
            "Tall Door": { "Narrow": 85, "Standard": 98, "Wide": 115, "Oversize": 140 },
            "Extra Tall Door": { "Narrow": 95, "Standard": 110, "Wide": 130, "Oversize": 160 },
        };

        const matrixEntries = [];
        for (const heightBracket of heightBrackets) {
            for (const widthBracket of widthBrackets) {
                const basePrice = basePrices[heightBracket.bracketName]?.[widthBracket.bracketName] || 50;
                matrixEntries.push({
                    heightBracketId: heightBracket.id,
                    widthBracketId: widthBracket.id,
                    basePriceExcVat: basePrice.toFixed(2),
                    isValidCombination: true,
                });
            }
        }

        if (matrixEntries.length > 0) {
            await db.insert(pricingMatrix).values(matrixEntries).onConflictDoNothing();
        }

        // =====================================================
        // SURCHARGE TYPES
        // =====================================================
        console.log("💵 Seeding surcharge types...");
        await db.insert(surchargeTypes).values([
            {
                surchargeCode: "ANGLED",
                surchargeName: "Angled Door Surcharge",
                calculationType: "FIXED",
                amount: "25.00",
                isActive: true,
            },
            {
                surchargeCode: "MID_RAIL",
                surchargeName: "Additional Mid Rail",
                calculationType: "PER_ITEM",
                amount: "5.00",
                isActive: true,
            },
            {
                surchargeCode: "HINGE_HOLE",
                surchargeName: "Hinge Cup Drilling",
                calculationType: "PER_ITEM",
                amount: "1.50",
                isActive: true,
            },
            {
                surchargeCode: "PANEL_SQUARING",
                surchargeName: "Panel Corner Squaring",
                calculationType: "FIXED",
                amount: "5.00",
                isActive: true,
            }
        ]).onConflictDoNothing();

        // =====================================================
        // DELIVERY OPTIONS
        // =====================================================
        console.log("🚚 Seeding delivery options...");
        await db.insert(deliveryOptions).values([
            {
                deliveryCode: "COLLECTION",
                deliveryName: "Collection from Workshop",
                basePrice: "0.00",
                pricePerDoor: "0.00",
                maxDistanceMiles: null,
                isActive: true,
            },
            {
                deliveryCode: "DELIVERY",
                deliveryName: "Standard Delivery",
                basePrice: "20.00",
                pricePerDoor: "0.00",
                maxDistanceMiles: 1000,
                isActive: true,
            },
        ]).onConflictDoNothing();

        // =====================================================
        // SYSTEM SETTINGS
        // =====================================================
        console.log("⚙️ Seeding system settings...");
        await db.insert(systemSettings).values([
            { settingKey: "VAT_RATE", settingValue: "0.20", settingType: "NUMBER", description: "UK VAT rate" },
            { settingKey: "MAX_HEIGHT_MM", settingValue: "2430", settingType: "NUMBER", description: "Maximum door height" },
            { settingKey: "MAX_WIDTH_MM", settingValue: "1200", settingType: "NUMBER", description: "Maximum door width" },
            { settingKey: "MIN_BORDER_WIDTH_MM", settingValue: "35", settingType: "NUMBER", description: "Minimum shaker border width" },
            { settingKey: "DEFAULT_BORDER_WIDTH_MM", settingValue: "80", settingType: "NUMBER", description: "Default border width" },
            { settingKey: "FIXED_FEE_BASE", settingValue: "3.00", settingType: "NUMBER", description: "Base fixed fee per door" },
            { settingKey: "PRICE_PER_SQM_SHAKER", settingValue: "75.00", settingType: "NUMBER", description: "Shaker price per sqm" },
            { settingKey: "PRICE_PER_SQM_SLAB", settingValue: "45.00", settingType: "NUMBER", description: "Slab price per sqm" },
            { settingKey: "HINGE_CUP_DIAMETER_MM", settingValue: "35", settingType: "NUMBER", description: "Standard hinge cup diameter" },
            { settingKey: "HINGE_CUP_DEPTH_MM", settingValue: "13", settingType: "NUMBER", description: "Standard hinge cup depth" },
            { settingKey: "HINGE_EDGE_DISTANCE_MM", settingValue: "5", settingType: "NUMBER", description: "Distance from door edge to hinge center" },
            { settingKey: "DOOR_THICKNESS_MM", settingValue: "22", settingType: "NUMBER", description: "Standard door thickness" },
            { settingKey: "FRONT_RECESS_MM", settingValue: "8", settingType: "NUMBER", description: "Front panel recess depth" },
            { settingKey: "PANEL_THICKNESS_MM", settingValue: "12", settingType: "NUMBER", description: "Center panel thickness" },
            { settingKey: "INTERNAL_CORNER_RADIUS_MM", settingValue: "2.5", settingType: "NUMBER", description: "Internal corner radius from CNC" },
        ]).onConflictDoNothing();

        console.log("✅ Database seed completed successfully!");
    } catch (error) {
        console.error("❌ Error during seeding:", error);
        throw error;
    }
}

seed()
    .then(() => {
        console.log("🎉 Seed script finished successfully");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Seed script failed:", error);
        process.exit(1);
    });