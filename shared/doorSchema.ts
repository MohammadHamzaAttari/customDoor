// shared/doorSchema.ts
import { z } from "zod";

// =====================================================
// PANEL & FINISH ENUMS (shared between client and server)
// =====================================================

export const panelTypeValues = [
  "STANDARD_12MM",
  "STANDARD_9MM",
  "REEDED_19MM",
  "MELAMINE_18MM",
  "FRETWORK",
  "GLASS",
  "NONE",
  "UNSELECTED",
] as const;

export const finishTypeValues = [
  "RAW_UNASSEMBLED",
  "ASSEMBLED_PREP",
  "PRIMED",
  "PAINTED",
  "NONE",
] as const;

export const hingeTypeValues = [
  "SCREW_POINTS",
  "INSERTA",
] as const;

export const presetValues = [
  "single",
  "double",
  "shaker_2",
  "shaker_4",
  "shaker_6",
  "panel_3",
  "panel_4",
  "panel_6",
] as const;

// =====================================================
// HINGE SCHEMA
// =====================================================

export const hingeSchema = z.object({
  id: z.string(),
  positionMm: z.number().min(50).max(2400),
  reference: z.enum(["TOP", "BOTTOM"]),
  side: z.enum(["LEFT", "RIGHT"]),
  type: z.enum(hingeTypeValues),
});

export type HingeData = z.infer<typeof hingeSchema>;

// =====================================================
// MID RAIL SCHEMA
// =====================================================

export const midRailSchema = z.object({
  id: z.string(),
  positionFromBottom: z.number().min(50),
  dimension: z.number().min(35).max(200),
});

export type MidRailData = z.infer<typeof midRailSchema>;

// =====================================================
// DOOR CONFIG SCHEMA (Full specification)
// =====================================================

export const doorConfigSchema = z.object({
  // Dimensions
  width: z.number().min(0).max(1200),
  height: z.number().min(0).max(2430),
  thickness: z.number().refine(
    (v) => v === 18 || v === 22,
    { message: "Thickness must be 18mm or 22mm" }
  ),

  // Style
  preset: z.enum(presetValues),
  panelType: z.enum(panelTypeValues),
  panelCount: z.number().min(0).max(6),

  // Borders (mm, measured at front face)
  borderWidth: z.number().min(0).max(300),
  customBorders: z.boolean(),
  leftStile: z.number().min(0).max(300),
  rightStile: z.number().min(0).max(300),
  topRail: z.number().min(0).max(300),
  bottomRail: z.number().min(0).max(300),

  // Rebate specifications
  rebateWidthMm: z.number().min(0).max(20).default(10),
  rebateDepthMm: z.number().min(0).max(20).default(14),
  frontFaceThicknessMm: z.number().min(0).max(12).default(8),
  cornerRadiusMm: z.number().min(0).max(10).default(0),
  rearCornerRadiusMm: z.number().min(0).max(10).default(2.5),

  // Angled corners
  angledLeft: z.boolean().default(false),
  angledRight: z.boolean().default(false),
  leftTriangleCutoutWidth: z.number().min(0).default(0),
  leftTriangleCutoutHeight: z.number().min(0).default(0),
  rightTriangleCutoutWidth: z.number().min(0).default(0),
  rightTriangleCutoutHeight: z.number().min(0).default(0),
  leftAngleDegrees: z.number().min(0).max(90).default(0),
  rightAngleDegrees: z.number().min(0).max(90).default(0),
  leftAngledRailWidth: z.number().min(0).max(200).default(90),
  rightAngledRailWidth: z.number().min(0).max(200).default(90),

  // Mid rails
  midRailsEnabled: z.boolean().default(false),
  midRails: z.array(midRailSchema).default([]),

  // Hinges
  hingeDrilling: z.boolean().default(false),
  hinges: z.array(hingeSchema).default([]),

  // Material & Finish
  material: z.string().default("MDF"),
  finish: z.enum(finishTypeValues).default("RAW_UNASSEMBLED"),

  // Display
  showDimensions: z.boolean().default(true),

  // Calculated price
  price: z.number().min(0).default(0),
}).superRefine((data, ctx) => {
  // RULE: 18mm thickness only allowed for slab doors (NONE panel type)
  if (data.thickness === 18 && data.panelType !== "NONE") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "18mm thickness is only available for slab doors, plinths, and cover panels",
      path: ["thickness"],
    });
  }

  // RULE: Reeded and melamine panels only for 22mm doors
  if (data.thickness !== 22 && (data.panelType === "REEDED_19MM" || data.panelType === "MELAMINE_18MM")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `${data.panelType} panels are only available with 22mm door thickness`,
      path: ["panelType"],
    });
  }

  // RULE: 65mm minimum on hinge side
  if (data.hingeDrilling && data.hinges.length > 0) {
    const hingeSides = new Set(data.hinges.map(h => h.side));

    if (hingeSides.has("LEFT") && data.leftStile < 65) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Left stile must be at least 65mm when hinges are on the left side",
        path: ["leftStile"],
      });
    }
    if (hingeSides.has("RIGHT") && data.rightStile < 65) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Right stile must be at least 65mm when hinges are on the right side",
        path: ["rightStile"],
      });
    }
  }

  // RULE: Panel area must be at least 50mm in each direction
  const panelWidth = data.width - data.leftStile - data.rightStile;
  if (panelWidth < 50 && data.panelType !== "NONE") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Panel width too small — increase door width or reduce stile widths",
      path: ["width"],
    });
  }

  const panelHeight = data.height - data.topRail - data.bottomRail;
  if (panelHeight < 50 && data.panelType !== "NONE") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Panel height too small — increase door height or reduce rail heights",
      path: ["height"],
    });
  }
});

export type DoorConfig = z.infer<typeof doorConfigSchema>;

// =====================================================
// CART ITEM SCHEMA
// =====================================================

export const cartItemSchema = z.object({
  id: z.union([z.string(), z.number()]),
  label: z.string().default("Custom Door"),
  config: doorConfigSchema,
  quantity: z.number().min(1).max(100).default(1),
  category: z.string().default("shaker"),
});
export type CartItem = z.infer<typeof cartItemSchema>;

// =====================================================
// PRICING CONSTANTS (defaults — overrideable from DB)
// =====================================================

export const DEFAULT_PRICING = {
  FIXED_FEE_PER_DOOR: 3.00,
  SQM_RATE_SHAKER: 75.00,
  SQM_RATE_SLAB: 45.00,
  ANGLED_SURCHARGE: 25.00,
  MID_RAIL_SURCHARGE: 5.00,
  HINGE_HOLE_SURCHARGE: 1.50,
  REEDED_PANEL_FIXED: 10.00,
  REEDED_PANEL_SQM: 60.00,
  MELAMINE_PANEL_FIXED: 10.00,
  MELAMINE_PANEL_SQM: 40.00,
  DELIVERY_BASE_FEE: 20.00,
  DELIVERY_PER_MILE: 0.45,
  DELIVERY_PER_HOUR: 13.00,
  VAT_RATE: 0.20,
};

export type PricingConfig = typeof DEFAULT_PRICING;

// =====================================================
// PRICING CALCULATOR (shared, deterministic)
// =====================================================

export function calculateDoorPrice(
  config: DoorConfig,
  pricing: PricingConfig = DEFAULT_PRICING
): {
  basePrice: number;
  angledSurcharge: number;
  midRailSurcharge: number;
  hingeSurcharge: number;
  panelUpgrade: number;
  unitTotal: number;
} {
  const doorAreaM2 = (config.width * config.height) / 1_000_000;

  const panelWidth = config.width - config.leftStile - config.rightStile;
  const panelHeight = config.height - config.topRail - config.bottomRail;
  const panelAreaM2 = Math.max(0, (panelWidth * panelHeight) / 1_000_000);

  const isSlab = config.panelType === "NONE";
  const sqmRate = isSlab ? pricing.SQM_RATE_SLAB : pricing.SQM_RATE_SHAKER;
  const basePrice = pricing.FIXED_FEE_PER_DOOR + (doorAreaM2 * sqmRate);

  const angledSurcharge = (config.angledLeft || config.angledRight)
    ? pricing.ANGLED_SURCHARGE
    : 0;

  const midRailCount = config.midRailsEnabled ? config.midRails.length : 0;
  const midRailSurcharge = midRailCount * pricing.MID_RAIL_SURCHARGE;

  const hingeCount = config.hingeDrilling ? config.hinges.length : 0;
  const hingeSurcharge = hingeCount * pricing.HINGE_HOLE_SURCHARGE;

  let panelUpgrade = 0;
  if (config.panelType === "REEDED_19MM") {
    panelUpgrade = pricing.REEDED_PANEL_FIXED + (panelAreaM2 * pricing.REEDED_PANEL_SQM);
  } else if (config.panelType === "MELAMINE_18MM") {
    panelUpgrade = pricing.MELAMINE_PANEL_FIXED + (panelAreaM2 * pricing.MELAMINE_PANEL_SQM);
  }

  const finishMultipliers: Record<typeof config.finish, number> = {
    RAW_UNASSEMBLED: 1.0,
    ASSEMBLED_PREP: 1.15,
    PRIMED: 1.5,
    PAINTED: 1.8,
    NONE: 1.0,
  };
  const finishMultiplier = finishMultipliers[config.finish] || 1.0;

  const unitTotal = (basePrice + angledSurcharge + midRailSurcharge + hingeSurcharge + panelUpgrade) * finishMultiplier;

  return {
    basePrice: Math.round(basePrice * 100) / 100,
    angledSurcharge: Math.round(angledSurcharge * 100) / 100,
    midRailSurcharge: Math.round(midRailSurcharge * 100) / 100,
    hingeSurcharge: Math.round(hingeSurcharge * 100) / 100,
    panelUpgrade: Math.round(panelUpgrade * 100) / 100,
    unitTotal: Math.round(unitTotal * 100) / 100,
  };
}