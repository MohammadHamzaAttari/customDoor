// client/src/lib/anglePresets.ts

export interface AnglePreset {
  id: string;
  name: string;
  description: string;
  angle: number;
  icon: string;
  calculateCutout: (doorWidth: number, doorHeight: number, borderWidth: number) => {
    width: number;
    height: number;
  };
}

export const ANGLE_PRESETS: AnglePreset[] = [
  {
    id: "under-stair-standard",
    name: "Under Stair",
    description: "Standard UK staircase pitch (42°)",
    angle: 42,
    icon: "🏠",
    calculateCutout: (doorWidth: number, doorHeight: number, borderWidth: number) => {
      const maxCutWidth = Math.min(doorWidth * 0.45, doorWidth - borderWidth * 2 - 100);
      const cutHeight = maxCutWidth * 0.9004;
      const safeCutHeight = Math.min(cutHeight, doorHeight * 0.55);
      return {
        width: Math.round(Math.max(50, maxCutWidth)),
        height: Math.round(Math.max(50, safeCutHeight)),
      };
    },
  },
  {
    id: "under-stair-gentle",
    name: "Gentle Slope",
    description: "Older properties, lower pitch (35°)",
    angle: 35,
    icon: "🏡",
    calculateCutout: (doorWidth: number, doorHeight: number, borderWidth: number) => {
      const maxCutWidth = Math.min(doorWidth * 0.40, doorWidth - borderWidth * 2 - 100);
      const cutHeight = maxCutWidth * 0.7002;
      const safeCutHeight = Math.min(cutHeight, doorHeight * 0.50);
      return {
        width: Math.round(Math.max(50, maxCutWidth)),
        height: Math.round(Math.max(50, safeCutHeight)),
      };
    },
  },
  {
    id: "loft-access",
    name: "Loft Access",
    description: "Standard UK roof pitch (30°)",
    angle: 30,
    icon: "🏚️",
    calculateCutout: (doorWidth: number, doorHeight: number, borderWidth: number) => {
      const maxCutWidth = Math.min(doorWidth * 0.50, doorWidth - borderWidth * 2 - 100);
      const cutHeight = maxCutWidth * 0.5774;
      const safeCutHeight = Math.min(cutHeight, doorHeight * 0.45);
      return {
        width: Math.round(Math.max(50, maxCutWidth)),
        height: Math.round(Math.max(50, safeCutHeight)),
      };
    },
  },
  {
    id: "corner-unit",
    name: "Corner Unit",
    description: "45° diagonal cut for corners",
    angle: 45,
    icon: "📐",
    calculateCutout: (doorWidth: number, doorHeight: number, borderWidth: number) => {
      const maxCutWidth = Math.min(doorWidth * 0.35, doorWidth - borderWidth * 2 - 100);
      const cutHeight = maxCutWidth;
      const safeCutHeight = Math.min(cutHeight, doorHeight * 0.35);
      const finalSize = Math.min(maxCutWidth, safeCutHeight);
      return {
        width: Math.round(Math.max(50, finalSize)),
        height: Math.round(Math.max(50, finalSize)),
      };
    },
  },
  {
    id: "steep-attic",
    name: "Steep Attic",
    description: "Modern builds, steep pitch (50°)",
    angle: 50,
    icon: "🔺",
    calculateCutout: (doorWidth: number, doorHeight: number, borderWidth: number) => {
      const maxCutWidth = Math.min(doorWidth * 0.35, doorWidth - borderWidth * 2 - 100);
      const cutHeight = maxCutWidth * 1.1918;
      const safeCutHeight = Math.min(cutHeight, doorHeight * 0.60);
      return {
        width: Math.round(Math.max(50, maxCutWidth)),
        height: Math.round(Math.max(50, safeCutHeight)),
      };
    },
  },
  {
    id: "custom",
    name: "Custom",
    description: "Define your own dimensions",
    angle: 0,
    icon: "⚙️",
    calculateCutout: (doorWidth: number, doorHeight: number) => ({
      width: Math.round(doorWidth * 0.3),
      height: Math.round(doorHeight * 0.3),
    }),
  },
];

export function getPresetById(id: string): AnglePreset | undefined {
  return ANGLE_PRESETS.find(p => p.id === id);
}

export function calculateAngleFromCutout(width: number, height: number): number {
  if (width <= 0 || height <= 0) return 0;
  return Math.round(Math.atan(height / width) * (180 / Math.PI));
}

/**
 * Validate angle cutout dimensions.
 * FIXED: Now allows full-width cutouts (triangle doors where short side = 0).
 * The cutout width CAN equal the door width — this creates a pointed top.
 */
export function validateAngleCutout(
  doorWidth: number,
  doorHeight: number,
  cutWidth: number,
  cutHeight: number,
  borderWidth: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (cutWidth <= 0 || cutHeight <= 0) {
    return { valid: true, errors: [] };
  }

  // Allow cutWidth up to full door width (triangle door).
  // Only reject if it physically exceeds the door.
  if (cutWidth > doorWidth) {
    errors.push("Cutout width cannot exceed door width");
  }

  // Cut height: the triangle removed from the top.
  // Short side height = doorHeight - cutHeight. This CAN be 0 (pointed).
  // But cutHeight cannot exceed the full door height.
  if (cutHeight > doorHeight) {
    errors.push("Cutout height cannot exceed door height");
  }

  // Sanity: angle range
  const angle = calculateAngleFromCutout(cutWidth, cutHeight);
  if (angle > 0 && (angle < 3 || angle > 87)) {
    errors.push(`Angle ${angle}° is extreme — consider adjusting (recommended 5°–85°)`);
  }

  return { valid: errors.length === 0, errors };
}