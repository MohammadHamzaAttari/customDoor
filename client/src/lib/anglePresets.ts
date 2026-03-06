// client/src/lib/anglePresets.ts

/**
 * Calculate the angle (in degrees) from cutout dimensions.
 * angle = atan(height / width)
 */
export function calculateAngleFromCutout(width: number, height: number): number {
  if (width <= 0 || height <= 0) return 0;
  // Calculate precise angle and retain 2 decimal digit precision instead of integer rounding
  const exactAngle = Math.atan(height / width) * (180 / Math.PI);
  return Number(exactAngle.toFixed(2));
}

/**
 * Calculate cutout dimensions from an angle (in degrees).
 * Given a target angle and the door dimensions, compute sensible cutout width/height.
 *
 * Strategy: use 40% of the door width as the cutout width, then derive
 * the cutout height from the angle. Clamp to valid door bounds.
 */
export function calculateCutoutFromAngle(
  angleDegrees: number,
  doorWidth: number,
  doorHeight: number,
): { width: number; height: number } {
  if (angleDegrees <= 0 || angleDegrees >= 90) {
    return { width: 0, height: 0 };
  }

  const radians = angleDegrees * (Math.PI / 180);
  // Use 40% of door width as default cutout width
  const cutWidth = Math.min(doorWidth * 0.4, doorWidth);
  const cutHeight = cutWidth * Math.tan(radians);

  // Clamp height so it doesn't exceed door height
  const clampedHeight = Math.min(cutHeight, doorHeight);
  // If height was clamped, recalculate width to maintain the angle
  const finalWidth = clampedHeight < cutHeight
    ? clampedHeight / Math.tan(radians)
    : cutWidth;

  return {
    width: Number(Math.max(0, finalWidth).toFixed(2)),
    height: Number(Math.max(0, clampedHeight).toFixed(2)),
  };
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