// client/src/lib/validation/doorValidation.ts
import { z } from "zod";

// Hinge validation
export const hingeSchema = z.object({
  id: z.string(),
  positionFromBottomMm: z.number()
    .min(50, "Hinge position must be at least 50mm from bottom")
    .max(2400, "Hinge position exceeds door height"),
  side: z.enum(["LEFT", "RIGHT"]),
  type: z.enum(["SCREW_POINTS", "INSERTA"]),
});

// Mid rail validation
export const midRailSchema = z.object({
  id: z.string(),
  positionFromBottom: z.number()
    .min(100, "Mid rail must be at least 100mm from bottom"),
  dimension: z.number()
    .min(40, "Mid rail width must be at least 40mm")
    .max(150, "Mid rail width cannot exceed 150mm"),
});

// Main door configuration validation
export const doorConfigValidationSchema = z.object({
  // Dimensions
  width: z.number()
    .min(200, "Width must be at least 200mm")
    .max(900, "Width cannot exceed 900mm"),
  height: z.number()
    .min(200, "Height must be at least 200mm")
    .max(2430, "Height cannot exceed 2430mm"),
  thickness: z.number()
    .min(18, "Thickness must be at least 18mm")
    .max(30, "Thickness cannot exceed 30mm"),

  // Panel type
  panelType: z.enum([
    "STANDARD_12MM",
    "REEDED_19MM",
    "MELAMINE_18MM",
    "FRETWORK",
    "GLASS",
    "NONE"
  ]),

  // Borders/Rails/Stiles
  leftStile: z.number()
    .min(35, "Left stile must be at least 35mm")
    .max(200, "Left stile cannot exceed 200mm"),
  rightStile: z.number()
    .min(35, "Right stile must be at least 35mm")
    .max(200, "Right stile cannot exceed 200mm"),
  topRail: z.number()
    .min(35, "Top rail must be at least 35mm")
    .max(200, "Top rail cannot exceed 200mm"),
  bottomRail: z.number()
    .min(35, "Bottom rail must be at least 35mm")
    .max(200, "Bottom rail cannot exceed 200mm"),

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
  // Cross-field validations

  // Check if borders fit within door dimensions
  const minPanelWidth = data.width - data.leftStile - data.rightStile;
  if (minPanelWidth < 50) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Stiles are too wide for the door width. Panel area must be at least 50mm wide.",
      path: ["leftStile"],
    });
  }

  const minPanelHeight = data.height - data.topRail - data.bottomRail;
  if (minPanelHeight < 50) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Rails are too tall for the door height. Panel area must be at least 50mm tall.",
      path: ["topRail"],
    });
  }

  // Validate angled corners
  if (data.angledLeft) {
    if (!data.leftTriangleCutoutWidth || data.leftTriangleCutoutWidth < 50) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Left triangle cutout width must be at least 50mm",
        path: ["leftTriangleCutoutWidth"],
      });
    } else if (data.leftTriangleCutoutWidth > data.width - 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Left cutout width exceeds max safe limit (${data.width - 100}mm)`,
        path: ["leftTriangleCutoutWidth"],
      });
    }

    if (!data.leftTriangleCutoutHeight || data.leftTriangleCutoutHeight < 50) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Left triangle cutout height must be at least 50mm",
        path: ["leftTriangleCutoutHeight"],
      });
    } else if (data.leftTriangleCutoutHeight > data.height - 150) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Left cutout height exceeds max safe limit (${data.height - 150}mm)`,
        path: ["leftTriangleCutoutHeight"],
      });
    }
  }

  if (data.angledRight) {
    if (!data.rightTriangleCutoutWidth || data.rightTriangleCutoutWidth < 50) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Right triangle cutout width must be at least 50mm",
        path: ["rightTriangleCutoutWidth"],
      });
    } else if (data.rightTriangleCutoutWidth > data.width - 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Right cutout width exceeds max safe limit (${data.width - 100}mm)`,
        path: ["rightTriangleCutoutWidth"],
      });
    }

    if (!data.rightTriangleCutoutHeight || data.rightTriangleCutoutHeight < 50) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Right triangle cutout height must be at least 50mm",
        path: ["rightTriangleCutoutHeight"],
      });
    } else if (data.rightTriangleCutoutHeight > data.height - 150) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Right cutout height exceeds max safe limit (${data.height - 150}mm)`,
        path: ["rightTriangleCutoutHeight"],
      });
    }
  }

  // Validate hinge positions if hinge drilling enabled
  if (data.hingeDrilling && data.hinges.length > 0) {
    // Check minimum hinges
    if (data.hinges.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least 2 hinges are required when hinge drilling is enabled",
        path: ["hinges"],
      });
    }

    // Validate each hinge position
    data.hinges.forEach((hinge, index) => {
      if (hinge.positionFromBottomMm > data.height - 50) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Hinge ${index + 1} position exceeds door height`,
          path: ["hinges", index, "positionFromBottomMm"],
        });
      }

      // Check if hinge is in angled cutout area
      if (hinge.side === "LEFT" && data.angledLeft) {
        const hX = 22; // Standard hinge offset
        const hY = hinge.positionFromBottomMm;
        const w = data.leftTriangleCutoutWidth || 0;
        const h = data.leftTriangleCutoutHeight || 0;

        if (w > 0 && h > 0) {
          if ((hX / w) + ((data.height - hY) / h) < 1) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Hinge ${index + 1} is in the angled cutout area`,
              path: ["hinges", index, "positionFromBottomMm"],
            });
          }
        }
      }
    });
  }

  // Validate mid rails
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

// Customer/Order validation for Shopify sync
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
    .min(10, "Please enter a valid phone number")
    .max(20, "Phone number is too long"),
  addressLine1: z.string()
    .min(5, "Address is required"),
  city: z.string()
    .min(2, "City is required"),
  postcode: z.string()
    .min(3, "Postcode is required"),
  jobReference: z.string().optional(),
  specialRequirements: z.string().optional(),
  quantity: z.number()
    .min(1, "Quantity must be at least 1")
    .max(100, "Maximum quantity is 100"),
});

export type DoorConfigValidation = z.infer<typeof doorConfigValidationSchema>;
export type OrderSubmission = z.infer<typeof orderSubmissionSchema>;