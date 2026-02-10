// client/src/components/door/Door3D.tsx
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { DoorDimensions } from "./DimensionLabel";
import { HINGE_CENTER_OFFSET_MM, HINGE_CUP_DIAMETER_MM } from "@/lib/stores/useDoorConfig";

// ============================================
// CONSTANTS (from requirements)
// ============================================

const HINGE_CENTER_M = HINGE_CENTER_OFFSET_MM / 1000;   // 0.0225m
const HINGE_CUP_RADIUS_M = (HINGE_CUP_DIAMETER_MM / 2) / 1000; // 0.0175m
const HINGE_CUP_DEPTH_M = 13 / 1000; // 0.013m

// ============================================
// GEOMETRY UTILITIES (unchanged — keep existing)
// ============================================

interface RoofPoint {
  x: number;
  y: number;
}

interface DoorGeometryParams {
  width: number;
  height: number;
  thickness: number;
  leftStile: number;
  rightStile: number;
  topRail: number;
  bottomRail: number;
  angledLeft: boolean;
  angledRight: boolean;
  leftCutW: number;
  leftCutH: number;
  rightCutW: number;
  rightCutH: number;
  cornerRadius: number;
  rebateWidth: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function validateAngledParams(params: DoorGeometryParams): DoorGeometryParams {
  const { width, height, leftStile, rightStile, topRail } = params;
  let { leftCutW, leftCutH, rightCutW, rightCutH } = params;

  const maxCutWidth = width * 0.8;
  const maxCutHeight = height * 0.7;
  const minRemaining = 0.05;

  if (params.angledLeft) {
    leftCutW = clamp(leftCutW, 0, Math.min(maxCutWidth, width - rightStile - minRemaining));
    leftCutH = clamp(leftCutH, 0, Math.min(maxCutHeight, height - topRail - minRemaining));
  }

  if (params.angledRight) {
    rightCutW = clamp(rightCutW, 0, Math.min(maxCutWidth, width - leftStile - minRemaining));
    rightCutH = clamp(rightCutH, 0, Math.min(maxCutHeight, height - topRail - minRemaining));
  }

  return { ...params, leftCutW, leftCutH, rightCutW, rightCutH };
}

function createRoofPoints(
  holeRightX: number,
  holeLeftX: number,
  yOffset: number,
  params: DoorGeometryParams
): RoofPoint[] {
  const { width, height, angledLeft, angledRight, leftCutW, leftCutH, rightCutW, rightCutH } = params;
  const w = width;
  const h = height;

  const hasLeftAngle = angledLeft && leftCutH > 0.001 && leftCutW > 0.001;
  const hasRightAngle = angledRight && rightCutH > 0.001 && rightCutW > 0.001;

  const mR = hasRightAngle ? -rightCutH / rightCutW : 0;
  const cR = hasRightAngle ? h / 2 - mR * (w / 2 - rightCutW) : h / 2;
  const mL = hasLeftAngle ? leftCutH / leftCutW : 0;
  const cL = hasLeftAngle ? h / 2 - mL * (-w / 2 + leftCutW) : h / 2;

  const getY = (x: number): number => {
    let y = h / 2;
    if (hasRightAngle && x > w / 2 - rightCutW) {
      y = mR * x + cR;
    } else if (hasLeftAngle && x < -w / 2 + leftCutW) {
      y = mL * x + cL;
    }
    return y - yOffset;
  };

  const sampleX: number[] = [holeRightX, holeLeftX];

  if (hasRightAngle) {
    const startX = w / 2 - rightCutW;
    if (startX < holeRightX && startX > holeLeftX) sampleX.push(startX);
  }
  if (hasLeftAngle) {
    const startX = -w / 2 + leftCutW;
    if (startX < holeRightX && startX > holeLeftX) sampleX.push(startX);
  }

  const sortedX = Array.from(new Set(sampleX)).sort((a, b) => b - a);

  return sortedX.map((x) => ({
    x,
    y: Math.max(getY(x), -h / 2 + 0.01),
  }));
}

// ============================================
// WOOD GRAIN NORMAL MAP (unchanged)
// ============================================

function createWoodGrainNormalMap(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "rgb(128, 128, 255)";
  ctx.fillRect(0, 0, size, size);

  for (let y = 0; y < size; y += 3) {
    const variation = Math.sin(y * 0.05) * 8 + Math.sin(y * 0.13) * 4;
    const r = 128 + variation;
    ctx.strokeStyle = `rgb(${Math.floor(r)}, 128, 255)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x < size; x += 10) {
      const waveY = y + Math.sin((x + y) * 0.02) * 2;
      ctx.lineTo(x, waveY);
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 2);
  return texture;
}

// ============================================
// MID-RAIL GEOMETRY BUILDER (unchanged)
// ============================================

interface MidRailGeometryData {
  geometry: THREE.ExtrudeGeometry;
  centerX: number;
  centerY: number;
}

function buildMidRailGeometries(
  midRails: any[],
  w: number, h: number, t: number,
  angledLeft: boolean, angledRight: boolean,
  leftCutW: number, leftCutH: number,
  rightCutW: number, rightCutH: number
): MidRailGeometryData[] {
  return midRails.map((rail) => {
    const railY = -h / 2 + rail.positionFromBottom / 1000;
    const railDim = rail.dimension / 1000;
    const halfDim = railDim / 2;

    let railLeftX = -w / 2;
    let railRightX = w / 2;

    if (angledLeft && leftCutH > 0.001 && leftCutW > 0.001) {
      const railTopY = railY + halfDim;
      const distFromTop = h / 2 - railTopY;
      if (distFromTop < leftCutH) {
        railLeftX = -w / 2 + (leftCutW / leftCutH) * (leftCutH - distFromTop);
      }
    }

    if (angledRight && rightCutH > 0.001 && rightCutW > 0.001) {
      const railTopY = railY + halfDim;
      const distFromTop = h / 2 - railTopY;
      if (distFromTop < rightCutH) {
        railRightX = w / 2 - (rightCutW / rightCutH) * (rightCutH - distFromTop);
      }
    }

    const railWidth = Math.max(railRightX - railLeftX, 0.01);
    const centerX = (railLeftX + railRightX) / 2;

    const shape = new THREE.Shape();
    shape.moveTo(-railWidth / 2, -halfDim);
    shape.lineTo(railWidth / 2, -halfDim);
    shape.lineTo(railWidth / 2, halfDim);
    shape.lineTo(-railWidth / 2, halfDim);
    shape.closePath();

    const geometry = new THREE.ExtrudeGeometry(shape, {
      steps: 1, depth: t, bevelEnabled: false,
    });
    geometry.translate(0, 0, -t / 2);
    geometry.computeVertexNormals();

    return { geometry, centerX, centerY: railY };
  });
}

// ============================================
// PANEL SECTION BUILDER
// Builds separate panel geometries for each section between rails
// ============================================

interface PanelSectionData {
  geometry: THREE.ExtrudeGeometry;
  centerY: number;
  thickness: number;
}

function buildPanelSections(
  panelType: string,
  midRails: any[],
  w: number, h: number, t: number,
  leftStile: number, rightStile: number,
  topRail: number, bottomRail: number,
  rw: number, cornerRadius: number,
  angledLeft: boolean, angledRight: boolean,
  params: DoorGeometryParams
): PanelSectionData[] {
  if (panelType === "NONE") return [];

  const pT = panelType === "REEDED_19MM" ? 0.019
    : panelType === "MELAMINE_18MM" ? 0.018
      : 0.012;

  // Determine vertical sections
  interface Section { bottomY: number; topY: number; }
  const sections: Section[] = [];

  const doorBottom = -h / 2;
  const doorTop = h / 2;
  const panelBottom = doorBottom + bottomRail;
  const panelTop = doorTop - topRail;

  if (midRails.length === 0) {
    sections.push({ bottomY: panelBottom, topY: panelTop });
  } else {
    // Sort mid-rails by position
    const sorted = [...midRails]
      .map(r => ({
        posY: doorBottom + r.positionFromBottom / 1000,
        dim: r.dimension / 1000,
      }))
      .sort((a, b) => a.posY - b.posY);

    let lastTop = panelBottom;
    for (const rail of sorted) {
      const railBottom = rail.posY - rail.dim / 2;
      const railTop = rail.posY + rail.dim / 2;
      if (railBottom > lastTop + 0.01) {
        sections.push({ bottomY: lastTop, topY: railBottom });
      }
      lastTop = railTop;
    }
    if (lastTop < panelTop - 0.01) {
      sections.push({ bottomY: lastTop, topY: panelTop });
    }
  }

  // Build geometry for each section
  return sections.map((section) => {
    const sectionHeight = section.topY - section.bottomY;
    const sectionCenterY = (section.bottomY + section.topY) / 2;

    const innerWidth = w - leftStile - rightStile + 2 * rw;
    const innerHalfW = innerWidth / 2;
    const cx = (leftStile - rightStile) / 2;
    const r = cornerRadius + rw;

    const isTopSection = Math.abs(section.topY - panelTop) < 0.001;

    const shape = new THREE.Shape();
    const halfH = sectionHeight / 2;

    // Bottom-left
    shape.moveTo(cx - innerHalfW + r, -halfH);
    // Bottom-right
    shape.lineTo(cx + innerHalfW - r, -halfH);
    shape.absarc(cx + innerHalfW - r, -halfH + r, r, -Math.PI / 2, 0, false);

    // Right side up
    if (isTopSection && (angledLeft || angledRight)) {
      const holeRightX = cx + innerHalfW;
      const holeLeftX = cx - innerHalfW;
      const yOffset = topRail - rw;
      const roofPoints = createRoofPoints(holeRightX, holeLeftX, yOffset, params);

      // Map roof points relative to section center
      for (const p of roofPoints) {
        shape.lineTo(p.x, p.y - sectionCenterY);
      }
      shape.lineTo(cx - innerHalfW, -halfH + r);
    } else {
      // Normal rectangle top
      shape.lineTo(cx + innerHalfW, halfH - r);
      shape.absarc(cx + innerHalfW - r, halfH - r, r, 0, Math.PI / 2, false);
      shape.lineTo(cx - innerHalfW + r, halfH);
      shape.absarc(cx - innerHalfW + r, halfH - r, r, Math.PI / 2, Math.PI, false);
      shape.lineTo(cx - innerHalfW, -halfH + r);
    }

    shape.absarc(cx - innerHalfW + r, -halfH + r, r, Math.PI, Math.PI * 1.5, false);

    const geo = new THREE.ExtrudeGeometry(shape, {
      steps: 1, depth: pT, bevelEnabled: false,
    });
    geo.translate(0, 0, -pT / 2);
    geo.computeVertexNormals();

    return { geometry: geo, centerY: sectionCenterY, thickness: pT };
  });
}

// ============================================
// SINGLE DOOR LEAF (main rendering component)
// ============================================

interface SingleDoorLeafProps {
  width: number;
  height: number;
  thickness: number;
  panelType: string;
  position?: [number, number, number];
  doorColor: string;
  angledLeft?: boolean;
  angledRight?: boolean;
  leftCutoutWidth?: number;
  leftCutoutHeight?: number;
  rightCutoutWidth?: number;
  rightCutoutHeight?: number;
  borderWidths: {
    leftStile: number;
    rightStile: number;
    topRail: number;
    bottomRail: number;
  };
  midRails?: any[];
  rebateWidthMm?: number;
  rebateDepthMm?: number;
  frontFaceThicknessMm?: number;
  cornerRadiusMm?: number;
  hingeDrilling?: boolean;
  hinges?: any[];
  onPartClick: (section: string) => void;
}

function SingleDoorLeaf({
  width, height, thickness, panelType,
  position = [0, 0, 0],
  doorColor,
  angledLeft = false, angledRight = false,
  leftCutoutWidth = 0, leftCutoutHeight = 0,
  rightCutoutWidth = 0, rightCutoutHeight = 0,
  borderWidths, midRails = [],
  rebateWidthMm = 10, rebateDepthMm = 14,
  frontFaceThicknessMm = 8, cornerRadiusMm = 2.5,
  hingeDrilling = false, hinges = [],
  onPartClick,
}: SingleDoorLeafProps) {
  const w = width / 1000;
  const h = height / 1000;
  const t = thickness / 1000;
  const rw = rebateWidthMm / 1000;
  const rd = rebateDepthMm / 1000;
  const ff = frontFaceThicknessMm / 1000;

  const rawParams: DoorGeometryParams = {
    width: w, height: h, thickness: t,
    leftStile: borderWidths.leftStile / 1000,
    rightStile: borderWidths.rightStile / 1000,
    topRail: borderWidths.topRail / 1000,
    bottomRail: borderWidths.bottomRail / 1000,
    angledLeft, angledRight,
    leftCutW: Math.min(leftCutoutWidth, width / 2 - 10) / 1000,
    leftCutH: Math.min(leftCutoutHeight, height - 20) / 1000,
    rightCutW: Math.min(rightCutoutWidth, width - 20) / 1000,
    rightCutH: Math.min(rightCutoutHeight, height - 20) / 1000,
    cornerRadius: cornerRadiusMm / 1000,
    rebateWidth: rw,
  };

  const params = validateAngledParams(rawParams);
  const { leftCutW, leftCutH, rightCutW, rightCutH } = params;
  const leftStile = params.leftStile;
  const rightStile = params.rightStile;
  const topRail = params.topRail;
  const bottomRail = params.bottomRail;
  const cornerRadius = params.cornerRadius;

  const innerWidth = w - leftStile - rightStile;
  const innerHeight = h - topRail - bottomRail;
  const innerCenterX = (leftStile - rightStile) / 2;
  const innerCenterY = (bottomRail - topRail) / 2;

  const woodNormalMap = useMemo(() => createWoodGrainNormalMap(), []);

  // ── Reeded Normal Map ──
  const reededNormalMap = useMemo(() => {
    if (panelType !== "REEDED_19MM") return null;
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "rgb(128, 128, 255)";
    ctx.fillRect(0, 0, size, size);
    const reedCount = 40;
    const reedWidth = size / reedCount;
    for (let i = 0; i < reedCount; i++) {
      const xStart = i * reedWidth;
      const gradient = ctx.createLinearGradient(xStart, 0, xStart + reedWidth, 0);
      gradient.addColorStop(0, "rgb(40, 128, 255)");
      gradient.addColorStop(0.3, "rgb(100, 128, 255)");
      gradient.addColorStop(0.5, "rgb(128, 128, 255)");
      gradient.addColorStop(0.7, "rgb(156, 128, 255)");
      gradient.addColorStop(1, "rgb(216, 128, 255)");
      ctx.fillStyle = gradient;
      ctx.fillRect(xStart, 0, reedWidth, size);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    // Repeat texture to ensure seamless tiling in both directions
    // X: 5 repeats for horizontal reed pattern
    // Y: 5 repeats to ensure vertical tiling without gaps
    texture.repeat.set(5, 5);
    texture.needsUpdate = true;
    return texture;
  }, [panelType]);

  // ── Front Face Geometry (frame with panel hole) ──
  const frontFaceGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2, -h / 2);
    shape.lineTo(w / 2, -h / 2);
    if (angledRight && rightCutH > 0.001 && rightCutW > 0.001) {
      shape.lineTo(w / 2, h / 2 - rightCutH);
      shape.lineTo(w / 2 - rightCutW, h / 2);
    } else {
      shape.lineTo(w / 2, h / 2);
    }
    if (angledLeft && leftCutH > 0.001 && leftCutW > 0.001) {
      shape.lineTo(-w / 2 + leftCutW, h / 2);
      shape.lineTo(-w / 2, h / 2 - leftCutH);
    } else {
      shape.lineTo(-w / 2, h / 2);
    }
    shape.lineTo(-w / 2, -h / 2);

    // Only cut panel hole if not slab
    if (panelType !== "NONE") {
      const hole = new THREE.Path();
      const r = cornerRadius;
      const ih = innerHeight / 2;
      const iw = innerWidth / 2;
      const cx = innerCenterX;
      const cy = innerCenterY;

      hole.moveTo(cx - iw + r, cy - ih);
      hole.lineTo(cx + iw - r, cy - ih);
      hole.absarc(cx + iw - r, cy - ih + r, r, -Math.PI / 2, 0, false);

      const holeRightX = cx + iw;
      const holeLeftX = cx - iw;

      if (angledLeft || angledRight) {
        const roofPoints = createRoofPoints(holeRightX, holeLeftX, topRail, params);
        roofPoints.forEach((p) => hole.lineTo(p.x, p.y));
        hole.lineTo(holeLeftX, cy - ih + r);
      } else {
        hole.lineTo(holeRightX, cy + ih - r);
        hole.absarc(cx + iw - r, cy + ih - r, r, 0, Math.PI / 2, false);
        hole.lineTo(cx - iw + r, cy + ih);
        hole.absarc(cx - iw + r, cy + ih - r, r, Math.PI / 2, Math.PI, false);
        hole.lineTo(holeLeftX, cy - ih + r);
      }

      hole.absarc(cx - iw + r, cy - ih + r, r, Math.PI, Math.PI * 1.5, false);
      shape.holes.push(hole);
    }

    const geo = new THREE.ExtrudeGeometry(shape, { steps: 1, depth: ff, bevelEnabled: false });
    geo.translate(0, 0, -t / 2);
    geo.computeVertexNormals();
    return geo;
  }, [w, h, t, ff, panelType, angledLeft, angledRight, leftCutW, leftCutH, rightCutW, rightCutH,
    innerWidth, innerHeight, innerCenterX, innerCenterY, cornerRadius, topRail, params]);

  // ── Rebate Wall Geometry ──
  const rebateWallGeometry = useMemo(() => {
    if (panelType === "NONE") return null;

    const shape = new THREE.Shape();
    shape.moveTo(-w / 2, -h / 2);
    shape.lineTo(w / 2, -h / 2);
    if (angledRight && rightCutH > 0.001 && rightCutW > 0.001) {
      shape.lineTo(w / 2, h / 2 - rightCutH);
      shape.lineTo(w / 2 - rightCutW, h / 2);
    } else { shape.lineTo(w / 2, h / 2); }
    if (angledLeft && leftCutH > 0.001 && leftCutW > 0.001) {
      shape.lineTo(-w / 2 + leftCutW, h / 2);
      shape.lineTo(-w / 2, h / 2 - leftCutH);
    } else { shape.lineTo(-w / 2, h / 2); }
    shape.lineTo(-w / 2, -h / 2);

    const hole = new THREE.Path();
    const r = cornerRadius + rw;
    const ih = (innerHeight + 2 * rw) / 2;
    const iw = (innerWidth + 2 * rw) / 2;
    const cx = innerCenterX;
    const cy = innerCenterY;

    hole.moveTo(cx - iw + r, cy - ih);
    hole.lineTo(cx + iw - r, cy - ih);
    hole.absarc(cx + iw - r, cy - ih + r, r, -Math.PI / 2, 0, false);

    const holeRightX = cx + iw;
    const holeLeftX = cx - iw;

    if (angledLeft || angledRight) {
      const roofPoints = createRoofPoints(holeRightX, holeLeftX, topRail - rw, params);
      roofPoints.forEach((p) => hole.lineTo(p.x, p.y));
      hole.lineTo(holeLeftX, cy - ih + r);
    } else {
      hole.lineTo(holeRightX, cy + ih - r);
      hole.absarc(cx + iw - r, cy + ih - r, r, 0, Math.PI / 2, false);
      hole.lineTo(cx - iw + r, cy + ih);
      hole.absarc(cx - iw + r, cy + ih - r, r, Math.PI / 2, Math.PI, false);
      hole.lineTo(holeLeftX, cy - ih + r);
    }

    hole.absarc(cx - iw + r, cy - ih + r, r, Math.PI, Math.PI * 1.5, false);
    shape.holes.push(hole);

    const geo = new THREE.ExtrudeGeometry(shape, { steps: 1, depth: rd, bevelEnabled: false });
    geo.translate(0, 0, -t / 2 + ff);
    geo.computeVertexNormals();
    return geo;
  }, [w, h, t, ff, rd, rw, panelType, angledLeft, angledRight, leftCutW, leftCutH, rightCutW, rightCutH,
    innerWidth, innerHeight, innerCenterX, innerCenterY, cornerRadius, topRail, params]);

  // ── Back Panel (always render — the frame back behind the rebate) ──
  const backPanelGeometry = useMemo(() => {
    const backThickness = t - ff - rd;
    if (backThickness <= 0.001) return null;
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2, -h / 2);
    shape.lineTo(w / 2, -h / 2);
    if (angledRight && rightCutH > 0.001 && rightCutW > 0.001) {
      shape.lineTo(w / 2, h / 2 - rightCutH);
      shape.lineTo(w / 2 - rightCutW, h / 2);
    } else { shape.lineTo(w / 2, h / 2); }
    if (angledLeft && leftCutH > 0.001 && leftCutW > 0.001) {
      shape.lineTo(-w / 2 + leftCutW, h / 2);
      shape.lineTo(-w / 2, h / 2 - leftCutH);
    } else { shape.lineTo(-w / 2, h / 2); }
    shape.lineTo(-w / 2, -h / 2);

    const geo = new THREE.ExtrudeGeometry(shape, { steps: 1, depth: backThickness, bevelEnabled: false });
    geo.translate(0, 0, -t / 2 + ff + rd);
    geo.computeVertexNormals();
    return geo;
  }, [w, h, t, ff, rd, angledLeft, angledRight, leftCutW, leftCutH, rightCutW, rightCutH]);

  // ── Multi-Panel Sections (split at mid-rails) ──
  const panelSections = useMemo(() => {
    return buildPanelSections(
      panelType, midRails,
      w, h, t,
      leftStile, rightStile, topRail, bottomRail,
      rw, cornerRadius,
      angledLeft, angledRight,
      params
    );
  }, [panelType, midRails, w, h, t, leftStile, rightStile, topRail, bottomRail,
    rw, cornerRadius, angledLeft, angledRight, params]);

  // ── Mid-Rail Geometries ──
  const midRailGeometries = useMemo(() => {
    if (!midRails || midRails.length === 0) return [];
    return buildMidRailGeometries(
      midRails, w, h, t,
      angledLeft, angledRight,
      leftCutW, leftCutH, rightCutW, rightCutH
    );
  }, [midRails, w, h, t, angledLeft, angledRight, leftCutW, leftCutH, rightCutW, rightCutH]);

  // ── Frame Material ──
  const frameMaterialProps = useMemo(() => ({
    color: doorColor,
    roughness: 0.45,
    metalness: 0.08,
    clearcoat: 0.25,
    clearcoatRoughness: 0.3,
    normalMap: woodNormalMap,
    normalScale: new THREE.Vector2(0.12, 0.12),
    envMapIntensity: 1.2,
  }), [doorColor, woodNormalMap]);

  // ── Panel colors by type ──
  const panelColors: Record<string, string> = {
    STANDARD_12MM: "#a08b70",
    REEDED_19MM: "#8b7860",
    MELAMINE_18MM: "#d4c5b0",
    FRETWORK: "#9b8570",
    GLASS: "#e8f4f8",
  };
  const panelRoughness: Record<string, number> = {
    STANDARD_12MM: 0.5,
    REEDED_19MM: 0.3,
    MELAMINE_18MM: 0.2,
    FRETWORK: 0.6,
    GLASS: 0.1,
  };

  // ========================================
  // RENDER
  // ========================================
  const components = useMemo(() => {
    const parts: JSX.Element[] = [];

    // ── Front Face ──
    parts.push(
      <mesh key="front-face" castShadow receiveShadow geometry={frontFaceGeometry}
        onClick={(e) => { e.stopPropagation(); onPartClick("borders"); }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "auto")}
      >
        <meshPhysicalMaterial {...frameMaterialProps} />
      </mesh>
    );

    // ── Rebate Wall ──
    if (rebateWallGeometry) {
      parts.push(
        <mesh key="rebate-wall" castShadow receiveShadow geometry={rebateWallGeometry}
          onClick={(e) => { e.stopPropagation(); onPartClick("rebates"); }}
          onPointerOver={() => (document.body.style.cursor = "pointer")}
          onPointerOut={() => (document.body.style.cursor = "auto")}
        >
          <meshPhysicalMaterial color="#5a4a3a" roughness={0.6} metalness={0.04} clearcoat={0.08} envMapIntensity={0.8} />
        </mesh>
      );
    }

    // ── Back Panel (always render) ──
    if (backPanelGeometry) {
      parts.push(
        <mesh key="back-panel" castShadow receiveShadow geometry={backPanelGeometry}
          onClick={(e) => { e.stopPropagation(); onPartClick("door-style"); }}
          onPointerOver={() => (document.body.style.cursor = "pointer")}
          onPointerOut={() => (document.body.style.cursor = "auto")}
        >
          <meshPhysicalMaterial color="#6b5d50" roughness={0.65} metalness={0.05} envMapIntensity={0.6} />
        </mesh>
      );
    }

    // ── Panel Sections (split at mid-rails) ──
    panelSections.forEach((section, index) => {
      const zPos = -t / 2 + ff;
      parts.push(
        <mesh key={`panel-section-${index}`}
          position={[0, section.centerY, zPos]}
          castShadow receiveShadow geometry={section.geometry}
          onClick={(e) => { e.stopPropagation(); onPartClick("door-style"); }}
          onPointerOver={() => (document.body.style.cursor = "pointer")}
          onPointerOut={() => (document.body.style.cursor = "auto")}
        >
          <meshPhysicalMaterial
            color={panelColors[panelType] || "#a08b70"}
            roughness={panelRoughness[panelType] || 0.5}
            metalness={0.04}
            clearcoat={panelType === "MELAMINE_18MM" ? 0.4 : 0.15}
            clearcoatRoughness={0.4}
            normalMap={panelType === "REEDED_19MM" ? reededNormalMap ?? undefined : woodNormalMap}
            normalScale={
              panelType === "REEDED_19MM"
                ? new THREE.Vector2(1.2, 1.2)
                : new THREE.Vector2(0.08, 0.08)
            }
            envMapIntensity={1.0}
            // Glass panel transparency
            transparent={panelType === "GLASS"}
            opacity={panelType === "GLASS" ? 0.3 : 1.0}
            transmission={panelType === "GLASS" ? 0.9 : 0}
            thickness={panelType === "GLASS" ? 0.004 : 0}
          />
        </mesh>
      );
    });

    // ── Mid-Rails ──
    midRailGeometries.forEach((rail, index) => {
      parts.push(
        <mesh key={`mid-rail-${index}`}
          position={[rail.centerX, rail.centerY, 0.001]}
          castShadow receiveShadow geometry={rail.geometry}
          onClick={(e) => { e.stopPropagation(); onPartClick("mid-rails"); }}
          onPointerOver={() => (document.body.style.cursor = "pointer")}
          onPointerOut={() => (document.body.style.cursor = "auto")}
        >
          <meshPhysicalMaterial {...frameMaterialProps}
            polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1}
          />
        </mesh>
      );
    });

    // ── Hinges (FIXED: 35mm cup, 22.5mm center) ──
    if (hingeDrilling && hinges.length > 0) {
      hinges.forEach((hinge: any) => {
        const hY = -h / 2 + hinge.positionFromBottomMm / 1000;
        const hX = hinge.side === "LEFT" ? -w / 2 + HINGE_CENTER_M : w / 2 - HINGE_CENTER_M;

        // Check if hinge is in angled cutout
        let hidden = false;
        if (hinge.side === "LEFT" && angledLeft && leftCutH > 0.001) {
          const fromTop = h / 2 - hY;
          if (fromTop < leftCutH) {
            const maxX = -w / 2 + leftCutW * (1 - fromTop / leftCutH);
            if (hX < maxX) hidden = true;
          }
        }
        if (hinge.side === "RIGHT" && angledRight && rightCutH > 0.001) {
          const fromTop = h / 2 - hY;
          if (fromTop < rightCutH) {
            const minX = w / 2 - rightCutW * (1 - fromTop / rightCutH);
            if (hX > minX) hidden = true;
          }
        }
        if (hidden) return;

        const isInserta = hinge.type === "INSERTA";

        parts.push(
          <group key={`hinge-${hinge.id}`} position={[hX, hY, -t / 2 + 0.005]}>
            {/* Cup hole — FIXED: 35mm diameter = 0.0175m radius */}
            <mesh rotation={[Math.PI / 2, 0, 0]}
              onClick={(e) => { e.stopPropagation(); onPartClick("hinges"); }}
              onPointerOver={() => (document.body.style.cursor = "pointer")}
              onPointerOut={() => (document.body.style.cursor = "auto")}
            >
              <cylinderGeometry args={[HINGE_CUP_RADIUS_M, HINGE_CUP_RADIUS_M, 0.003, 32]} />
              <meshPhysicalMaterial color="#c0c0c0" metalness={0.95} roughness={0.08}
                clearcoat={0.9} clearcoatRoughness={0.05} envMapIntensity={2.0} />
            </mesh>
            {/* Cup depth indicator */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.002]}>
              <cylinderGeometry args={[HINGE_CUP_RADIUS_M - 0.002, HINGE_CUP_RADIUS_M - 0.002, 0.01, 32]} />
              <meshPhysicalMaterial color="#a0a0a0" metalness={0.92} roughness={0.1}
                clearcoat={0.7} envMapIntensity={1.8} />
            </mesh>

            {/* Fixing points — different for screw vs inserta */}
            {isInserta ? (
              <>
                {/* Inserta: 8mm holes (0.004m radius) */}
                <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.0095, 0]}>
                  <cylinderGeometry args={[0.004, 0.004, 0.004, 16]} />
                  <meshPhysicalMaterial color="#333" metalness={0.9} roughness={0.1} />
                </mesh>
                <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.0095, 0]}>
                  <cylinderGeometry args={[0.004, 0.004, 0.004, 16]} />
                  <meshPhysicalMaterial color="#333" metalness={0.9} roughness={0.1} />
                </mesh>
              </>
            ) : (
              <>
                {/* Screw points: small 4mm V-point marks */}
                <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.0095, 0.001]}>
                  <cylinderGeometry args={[0.002, 0.002, 0.002, 12]} />
                  <meshPhysicalMaterial color="#d0d0d0" metalness={0.98} roughness={0.03}
                    clearcoat={1.0} envMapIntensity={2.5} />
                </mesh>
                <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.0095, 0.001]}>
                  <cylinderGeometry args={[0.002, 0.002, 0.002, 12]} />
                  <meshPhysicalMaterial color="#d0d0d0" metalness={0.98} roughness={0.03}
                    clearcoat={1.0} envMapIntensity={2.5} />
                </mesh>
              </>
            )}
          </group>
        );
      });
    }

    return parts;
  }, [
    frontFaceGeometry, rebateWallGeometry, backPanelGeometry, panelSections,
    midRailGeometries, reededNormalMap, woodNormalMap, doorColor, frameMaterialProps,
    panelType, t, ff, h, w, hingeDrilling, hinges, angledLeft, angledRight,
    leftCutW, leftCutH, rightCutW, rightCutH, onPartClick,
  ]);

  return <group position={position}>{components}</group>;
}

// ============================================
// MAIN DOOR 3D COMPONENT
// ============================================

export function Door3D({
  config,
  onPartClick,
  forceHideLabels = false,
}: {
  config: any;
  onPartClick: (section: string) => void;
  forceHideLabels?: boolean;
}) {
  const meshRef = useRef<THREE.Group>(null);

  const {
    width, height, thickness, panelType, preset,
    angledLeft, angledRight,
    leftTriangleCutoutWidth, leftTriangleCutoutHeight,
    rightTriangleCutoutWidth, rightTriangleCutoutHeight,
    borderWidth, customBorders, leftStile, rightStile, bottomRail, topRail,
    midRailsEnabled, midRails,
    rebateWidthMm, rebateDepthMm, frontFaceThicknessMm, cornerRadiusMm,
    hingeDrilling, hinges,
  } = config;

  const DOOR_FRAME_COLOR = "#8B7355";

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.12) * 0.025;
    }
  });

  const finalBorders = customBorders
    ? { leftStile, rightStile, bottomRail, topRail }
    : { leftStile: borderWidth, rightStile: borderWidth, bottomRail: borderWidth, topRail: borderWidth };

  const activeMidRails = midRailsEnabled ? midRails : [];

  const isDouble = preset === "double";
  const gap = 2;
  const leafWidth = isDouble ? (width - gap) / 2 : width;

  return (
    <group ref={meshRef} position={[0, 0, 0]}>
      {isDouble ? (
        <>
          <SingleDoorLeaf
            width={leafWidth} height={height} thickness={thickness}
            panelType={panelType}
            position={[-(leafWidth / 2 + gap / 2) / 1000, 0, 0]}
            doorColor={DOOR_FRAME_COLOR}
            angledLeft={angledLeft} angledRight={false}
            leftCutoutWidth={leftTriangleCutoutWidth}
            leftCutoutHeight={leftTriangleCutoutHeight}
            borderWidths={finalBorders} midRails={activeMidRails}
            rebateWidthMm={rebateWidthMm} rebateDepthMm={rebateDepthMm}
            frontFaceThicknessMm={frontFaceThicknessMm} cornerRadiusMm={cornerRadiusMm}
            hingeDrilling={hingeDrilling}
            hinges={hinges.filter((h: any) => h.side === "LEFT")}
            onPartClick={onPartClick}
          />
          <SingleDoorLeaf
            width={leafWidth} height={height} thickness={thickness}
            panelType={panelType}
            position={[(leafWidth / 2 + gap / 2) / 1000, 0, 0]}
            doorColor={DOOR_FRAME_COLOR}
            angledLeft={false} angledRight={angledRight}
            rightCutoutWidth={rightTriangleCutoutWidth}
            rightCutoutHeight={rightTriangleCutoutHeight}
            borderWidths={finalBorders} midRails={activeMidRails}
            rebateWidthMm={rebateWidthMm} rebateDepthMm={rebateDepthMm}
            frontFaceThicknessMm={frontFaceThicknessMm} cornerRadiusMm={cornerRadiusMm}
            hingeDrilling={hingeDrilling}
            hinges={hinges.filter((h: any) => h.side === "RIGHT")}
            onPartClick={onPartClick}
          />
        </>
      ) : (
        <SingleDoorLeaf
          width={width} height={height} thickness={thickness}
          panelType={panelType}
          position={[0, 0, 0]}
          doorColor={DOOR_FRAME_COLOR}
          angledLeft={angledLeft} angledRight={angledRight}
          leftCutoutWidth={leftTriangleCutoutWidth}
          leftCutoutHeight={leftTriangleCutoutHeight}
          rightCutoutWidth={rightTriangleCutoutWidth}
          rightCutoutHeight={rightTriangleCutoutHeight}
          borderWidths={finalBorders} midRails={activeMidRails}
          rebateWidthMm={rebateWidthMm} rebateDepthMm={rebateDepthMm}
          frontFaceThicknessMm={frontFaceThicknessMm} cornerRadiusMm={cornerRadiusMm}
          hingeDrilling={hingeDrilling} hinges={hinges}
          onPartClick={onPartClick}
        />
      )}
      <DoorDimensions config={config} forceHideLabels={forceHideLabels} />
    </group>
  );
}