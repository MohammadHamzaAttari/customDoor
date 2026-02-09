// client/src/lib/validation/doorValidation.ts
import { z } from "zod";
import {
  MIN_BORDER_WITH_HINGES,
  MIN_BORDER_WITHOUT_HINGES,
  HINGE_CENTER_OFFSET_MM,
} from "@/lib/stores/useDoorConfig";

// =====================================================
// HINGE VALIDATION
// =====================================================

export const hingeSchema = z.object({
  id: z.string(),
  positionFromBottomMm: z.number()
    .min(50, "Hinge position must be at least 50mm from bottom")
    .max(2400, "Hinge position exceeds maximum door height"),
  side: z.enum(["LEFT", "RIGHT"]),
  type: z.enum(["SCREW_POINTS", "INSERTA"]),
});

// =====================================================
// MID RAIL VALIDATION
// =====================================================

export const midRailSchema = z.object({
  id: z.string(),
  positionFromBottom: z.number()
    .min(50, "Mid rail must be at least 50mm from bottom"),
  dimension: z.number()
    .min(35, "Mid rail width must be at least 35mm")
    .max(200, "Mid rail width cannot exceed 200mm"),
});

// =====================================================
// MAIN DOOR CONFIG VALIDATION
// =====================================================

export const doorConfigValidationSchema = z.object({
  // Dimensions
  width: z.number()
    .min(200, "Width must be at least 200mm")
    .max(1200, "Width cannot exceed 1200mm"),
  height: z.number()
    .min(200, "Height must be at least 200mm")
    .max(2430, "Height cannot exceed 2430mm"),
  thickness: z.number()
    .refine((v) => v === 18 || v === 22, {
      message: "Thickness must be 18mm or 22mm",
    }),

  // Panel type
  panelType: z.enum([
    "STANDARD_12MM",
    "REEDED_19MM",
    "MELAMINE_18MM",
    "FRETWORK",
    "GLASS",
    "NONE",
  ]),

  // Borders/Rails/Stiles
  leftStile: z.number()
    .min(35, "Left stile must be at least 35mm")
    .max(300, "Left stile cannot exceed 300mm"),
  rightStile: z.number()
    .min(35, "Right stile must be at least 35mm")
    .max(300, "Right stile cannot exceed 300mm"),
  topRail: z.number()
    .min(35, "Top rail must be at least 35mm")
    .max(300, "Top rail cannot exceed 300mm"),
  bottomRail: z.number()
    .min(35, "Bottom rail must be at least 35mm")
    .max(300, "Bottom rail cannot exceed 300mm"),

  // Angled corners
  angledLeft: z.boolean(),
  angledRight: z.boolean(),
  leftTriangleCutoutWidth: z.number().min(0).optional(),
  leftTriangleCutoutHeight: z.number().min(0).optional(),
  rightTriangleCutoutWidth: z.number().min(0).optional(),
  rightTriangleCutoutHeight: z.number().min(0).optional(),

  // Rebate specs
  rebateWidthMm: z.number()
    .min(5, "Rebate width must be at least 5mm")
    .max(20, "Rebate width cannot exceed 20mm"),
  rebateDepthMm: z.number()
    .min(8, "Rebate depth must be at least 8mm")
    .max(20, "Rebate depth cannot exceed 20mm"),
  frontFaceThicknessMm: z.number()
    .min(4, "Front face must be at least 4mm")
    .max(12, "Front face cannot exceed 12mm"),
  cornerRadiusMm: z.number()
    .min(0, "Corner radius cannot be negative")
    .max(10, "Corner radius cannot exceed 10mm"),

  // Mid rails
  midRailsEnabled: z.boolean(),
  midRails: z.array(midRailSchema),

  // Hinges
  hingeDrilling: z.boolean(),
  hinges: z.array(hingeSchema),

  // Finish
  finish: z.enum(["RAW_UNASSEMBLED", "ASSEMBLED_PREP", "PRIMED"]),
}).superRefine((data, ctx) => {

  // ── RULE: 18mm thickness only for slab doors ──
  if (data.thickness === 18 && data.panelType !== "NONE") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "18mm thickness is only available for slab doors, plinths, and cover panels. Select 22mm for shaker doors.",
      path: ["thickness"],
    });
  }

  // ── RULE: Reeded/melamine panels require 22mm ──
  if (data.thickness !== 22 && (data.panelType === "REEDED_19MM" || data.panelType === "MELAMINE_18MM")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `${data.panelType === "REEDED_19MM" ? "Reeded 19mm" : "Melamine 18mm"} panels require 22mm door thickness.`,
      path: ["panelType"],
    });
  }

  // ── RULE: 65mm minimum border on hinge side ──
  if (data.hingeDrilling && data.hinges.length > 0) {
    const hingeSides = new Set(data.hinges.map(h => h.side));

    if (hingeSides.has("LEFT") && data.leftStile < MIN_BORDER_WITH_HINGES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Left stile must be at least ${MIN_BORDER_WITH_HINGES}mm when hinges are on the left side (space needed for hinge boss fixing plate).`,
        path: ["leftStile"],
      });
    }

    if (hingeSides.has("RIGHT") && data.rightStile < MIN_BORDER_WITH_HINGES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Right stile must be at least ${MIN_BORDER_WITH_HINGES}mm when hinges are on the right side (space needed for hinge boss fixing plate).`,
        path: ["rightStile"],
      });
    }
  }

  // ── RULE: Panel area minimum 50mm ──
  if (data.panelType !== "NONE") {
    const panelWidth = data.width - data.leftStile - data.rightStile;
    if (panelWidth < 50) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Stiles are too wide for the door width. Panel area must be at least 50mm wide.",
        path: ["leftStile"],
      });
    }

    const panelHeight = data.height - data.topRail - data.bottomRail;
    if (panelHeight < 50) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Rails are too tall for the door height. Panel area must be at least 50mm tall.",
        path: ["topRail"],
      });
    }
  }

  // ── RULE: Angled corner validation ──
  if (data.angledLeft) {
    const lcw = data.leftTriangleCutoutWidth || 0;
    const lch = data.leftTriangleCutoutHeight || 0;

    if (lcw < 50) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Left triangle cutout width must be at least 50mm",
        path: ["leftTriangleCutoutWidth"],
      });
    } else if (lcw > data.width - 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Left cutout width exceeds max safe limit (${data.width - 100}mm)`,
        path: ["leftTriangleCutoutWidth"],
      });
    }

    if (lch < 50) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Left triangle cutout height must be at least 50mm",
        path: ["leftTriangleCutoutHeight"],
      });
    } else if (lch > data.height - 150) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Left cutout height exceeds max safe limit (${data.height - 150}mm)`,
        path: ["leftTriangleCutoutHeight"],
      });
    }
  }

  if (data.angledRight) {
    const rcw = data.rightTriangleCutoutWidth || 0;
    const rch = data.rightTriangleCutoutHeight || 0;

    if (rcw < 50) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Right triangle cutout width must be at least 50mm",
        path: ["rightTriangleCutoutWidth"],
      });
    } else if (rcw > data.width - 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Right cutout width exceeds max safe limit (${data.width - 100}mm)`,
        path: ["rightTriangleCutoutWidth"],
      });
    }

    if (rch < 50) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Right triangle cutout height must be at least 50mm",
        path: ["rightTriangleCutoutHeight"],
      });
    } else if (rch > data.height - 150) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Right cutout height exceeds max safe limit (${data.height - 150}mm)`,
        path: ["rightTriangleCutoutHeight"],
      });
    }
  }

  // ── RULE: Hinge position validation ──
  if (data.hingeDrilling && data.hinges.length > 0) {
    if (data.hinges.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least 2 hinges are required when hinge drilling is enabled",
        path: ["hinges"],
      });
    }

    data.hinges.forEach((hinge, index) => {
      // Check hinge doesn't exceed door height
      if (hinge.positionFromBottomMm > data.height - 50) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Hinge ${index + 1} position exceeds door height`,
          path: ["hinges", index, "positionFromBottomMm"],
        });
      }

      // Check if hinge is in angled cutout area
      // Hinge center X = 22.5mm from edge (5mm gap + 17.5mm half cup)
      if (hinge.side === "LEFT" && data.angledLeft) {
        const hX = HINGE_CENTER_OFFSET_MM;
        const hY = hinge.positionFromBottomMm;
        const lcw = data.leftTriangleCutoutWidth || 0;
        const lch = data.leftTriangleCutoutHeight || 0;

        if (lcw > 0 && lch > 0) {
          const heightFromTop = data.height - hY;
          if (heightFromTop < lch) {
            const maxXAtThisHeight = lcw * (1 - heightFromTop / lch);
            if (hX < maxXAtThisHeight) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Hinge ${index + 1} is in the left angled cutout area. Move it lower or remove the angle.`,
                path: ["hinges", index, "positionFromBottomMm"],
              });
            }
          }
        }
      }

      if (hinge.side === "RIGHT" && data.angledRight) {
        const hX = data.width - HINGE_CENTER_OFFSET_MM;
        const hY = hinge.positionFromBottomMm;
        const rcw = data.rightTriangleCutoutWidth || 0;
        const rch = data.rightTriangleCutoutHeight || 0;

        if (rcw > 0 && rch > 0) {
          const heightFromTop = data.height - hY;
          if (heightFromTop < rch) {
            const minXAtThisHeight = data.width - rcw * (1 - heightFromTop / rch);
            if (hX > minXAtThisHeight) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Hinge ${index + 1} is in the right angled cutout area. Move it lower or remove the angle.`,
                path: ["hinges", index, "positionFromBottomMm"],
              });
            }
          }
        }
      }
    });
  }

  // ── RULE: Mid rail validation ──
  if (data.midRailsEnabled && data.midRails.length > 0) {
    data.midRails.forEach((rail, index) => {
      if (rail.positionFromBottom > data.height - data.topRail - 50) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Mid rail ${index + 1} position is too high`,
          path: ["midRails", index, "positionFromBottom"],
        });
      }
      if (rail.positionFromBottom < data.bottomRail + 50) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Mid rail ${index + 1} position is too low`,
          path: ["midRails", index, "positionFromBottom"],
        });
      }
    });
  }
});

// =====================================================
// ORDER SUBMISSION VALIDATION
// =====================================================

export const orderSubmissionSchema = z.object({
  customerEmail: z.string()
    .email("Please enter a valid email address"),
  customerName: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  companyName: z.string()
    .min(1, "Company name is required")
    .max(200, "Company name cannot exceed 200 characters"),
  phone: z.string()
    .min(1, "Phone number is required")
    .refine((val) => {
      // Accept UK numbers: 07xxx, +447xxx, 01234, etc.
      const cleaned = val.replace(/[\s\-\(\)]/g, "");
      // Must be at least 10 digits when stripped
      const digits = cleaned.replace(/[^\d]/g, "");
      return digits.length >= 10 && digits.length <= 15;
    }, "Please enter a valid UK phone number"),
  addressLine1: z.string()
    .min(5, "Address is required"),
  city: z.string()
    .min(2, "City is required"),
  postcode: z.string()
    .min(3, "Postcode is required")
    .max(10, "Postcode is too long"),
  jobReference: z.string().optional(),
  specialRequirements: z.string().optional(),
});

export type DoorConfigValidation = z.infer<typeof doorConfigValidationSchema>;
export type OrderSubmission = z.infer<typeof orderSubmissionSchema>;