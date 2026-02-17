import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { DoorDimensions } from "./DimensionLabel";
import { HINGE_CENTER_OFFSET_MM, HINGE_CUP_DIAMETER_MM } from "@/lib/stores/useDoorConfig";
import {
  getOuterEdgesAtY,
  getInnerEdgesAtY,
  getHoleSections,
  createRoofPoints,
  HoleSection,
  RoofPoint
} from "@/lib/doorUtils";

const HINGE_CENTER_M = HINGE_CENTER_OFFSET_MM / 1000;
const HINGE_CUP_RADIUS_M = (HINGE_CUP_DIAMETER_MM / 2) / 1000;

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

// ============================================
// WOOD GRAIN NORMAL MAP
// ============================================

function createWoodGrainNormalMap(): THREE.CanvasTexture {
  const s = 512;
  const c = document.createElement("canvas");
  c.width = s;
  c.height = s;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "rgb(128,128,255)";
  ctx.fillRect(0, 0, s, s);
  for (let y = 0; y < s; y += 3) {
    const v = Math.sin(y * 0.05) * 8 + Math.sin(y * 0.13) * 4;
    ctx.strokeStyle = `rgb(${Math.floor(128 + v)},128,255)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x < s; x += 10) {
      ctx.lineTo(x, y + Math.sin((x + y) * 0.02) * 2);
    }
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 2);
  return tex;
}

// ============================================
// DOOR OUTLINE SHAPE (door-center coords)
// x: -w/2..+w/2, y: -h/2..+h/2
// ============================================

function createDoorOutline(
  w: number,
  h: number,
  angledLeft: boolean,
  angledRight: boolean,
  leftCutW: number,
  leftCutH: number,
  rightCutW: number,
  rightCutH: number
): THREE.Shape {
  const shape = new THREE.Shape();
  // Bottom-left, clockwise
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

  shape.closePath();
  return shape;
}

// ============================================
// Create a rectangular hole path

// ============================================
// Create a rectangular hole path
// ============================================

function createHolePath(
  left: number,
  right: number,
  bottom: number,
  top: number,
  _cornerR: number,
  isTopSection: boolean,
  w: number,
  h: number,
  angledLeft: boolean,
  angledRight: boolean,
  leftCutW: number,
  leftCutH: number,
  rightCutW: number,
  rightCutH: number,
  flatTopInset: number,
  angledInset: number
): THREE.Path | null {
  const holeW = right - left;
  const holeH = top - bottom;

  if (holeW <= 0.002 || holeH <= 0.002) return null;

  const hole = new THREE.Path();

  // Start bottom-left, go clockwise — sharp corners (no arcs)
  hole.moveTo(left, bottom);
  hole.lineTo(right, bottom);

  if (isTopSection && (angledLeft || angledRight)) {
    const roofPts = createRoofPoints(
      right,
      left,
      flatTopInset,
      angledInset,
      w,
      h,
      angledLeft,
      angledRight,
      leftCutW,
      leftCutH,
      rightCutW,
      rightCutH
    );
    if (roofPts.length > 0) {
      hole.lineTo(right, Math.max(roofPts[0].y, bottom));
    }
    for (const p of roofPts) {
      hole.lineTo(p.x, Math.max(p.y, bottom));
    }
    hole.lineTo(left, bottom);
  } else {
    hole.lineTo(right, top);
    hole.lineTo(left, top);
    hole.lineTo(left, bottom);
  }

  return hole;
}

// ============================================
// Hole sections split by mid rails
// (Uses shared getHoleSections from doorUtils)
// ============================================

// ============================================
// SINGLE DOOR LEAF
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
  angledRailWidth?: number;
  panelCount?: number;
  onPartClick: (section: string) => void;
}

function SingleDoorLeaf({
  width: widthMm,
  height: heightMm,
  thickness: thicknessMm,
  panelType,
  position = [0, 0, 0],
  doorColor,
  angledLeft = false,
  angledRight = false,
  leftCutoutWidth = 0,
  leftCutoutHeight = 0,
  rightCutoutWidth = 0,
  rightCutoutHeight = 0,
  borderWidths,
  midRails = [],
  rebateWidthMm = 10,
  rebateDepthMm = 14,
  frontFaceThicknessMm = 8,
  cornerRadiusMm = 2.5,
  hingeDrilling = false,
  hinges = [],
  angledRailWidth: angledRailWidthMm = 90,
  panelCount = 1,
  onPartClick,
}: SingleDoorLeafProps) {
  // ── Convert to metres ──
  const w = widthMm / 1000;
  const h = heightMm / 1000;
  const t = thicknessMm / 1000;
  const rw = rebateWidthMm / 1000;
  const cr = cornerRadiusMm / 1000;

  // Clamp front face + rebate depth to thickness
  let ff = frontFaceThicknessMm / 1000;
  let rd = rebateDepthMm / 1000;
  if (ff + rd > t) {
    const ratio = t / (ff + rd);
    ff *= ratio;
    rd *= ratio;
  }
  const backT = Math.max(0, t - ff - rd);

  const ls = borderWidths.leftStile / 1000;
  const rs = borderWidths.rightStile / 1000;
  const tr = borderWidths.topRail / 1000;
  const br = borderWidths.bottomRail / 1000;
  const arw = angledRailWidthMm / 1000;

  const lcw = clamp(leftCutoutWidth / 1000, 0, w - 0.001);
  const lch = clamp(leftCutoutHeight / 1000, 0, h - 0.001);
  const rcw = clamp(rightCutoutWidth / 1000, 0, w - 0.001);
  const rch = clamp(rightCutoutHeight / 1000, 0, h - 0.001);

  // Inner opening edges (where the panel hole starts on the front face)
  const innerLeft = -w / 2 + ls;
  const innerRight = w / 2 - rs;
  const innerBottom = -h / 2 + br;
  const innerTop = h / 2 - tr;

  // Rebate opening edges (stepped back, wider by rw)
  // Clamp so rebate holes stay within door outline
  const rebateLeft = Math.max(-w / 2 + 0.002, innerLeft - rw);
  const rebateRight = Math.min(w / 2 - 0.002, innerRight + rw);
  const rebateBottom = Math.max(-h / 2 + 0.002, innerBottom - rw);
  // For top, in angled doors the constraint is more complex but
  // for the flat portion we just make sure it stays within bounds
  const rebateTopFlat = Math.min(h / 2 - 0.002, innerTop + rw);

  // Z positions (front face is at z = -t/2, back face at z = +t/2)
  const zFront = -t / 2;
  const zRebateStart = zFront + ff;
  const zRebateEnd = zRebateStart + rd;

  const woodNormalMap = useMemo(() => createWoodGrainNormalMap(), []);

  const reededNormalMap = useMemo(() => {
    if (panelType !== "REEDED_19MM") return null;
    const sz = 512;
    const c = document.createElement("canvas");
    c.width = sz;
    c.height = sz;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "rgb(128,128,255)";
    ctx.fillRect(0, 0, sz, sz);
    const cnt = 40;
    for (let i = 0; i < cnt; i++) {
      const x = (i * sz) / cnt;
      const g = ctx.createLinearGradient(x, 0, x + sz / cnt, 0);
      g.addColorStop(0, "rgb(40,128,255)");
      g.addColorStop(0.5, "rgb(128,128,255)");
      g.addColorStop(1, "rgb(216,128,255)");
      ctx.fillStyle = g;
      ctx.fillRect(x, 0, sz / cnt, sz);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(5, 5);
    return tex;
  }, [panelType]);

  const hasPanels = panelType !== "NONE";

  // ── Hole sections ──
  const holeSections = useMemo(
    () => getHoleSections(midRails, h, br, tr, panelCount),
    [midRails, h, br, tr, panelCount]
  );

  // ════════════════════════════════════════════
  // GEOMETRY LAYER 1: FRONT FACE (depth = ff)
  // Full door outline with panel holes punched through
  // ════════════════════════════════════════════
  const frontFaceGeo = useMemo(() => {
    const shape = createDoorOutline(
      w, h, angledLeft, angledRight, lcw, lch, rcw, rch
    );

    if (hasPanels && holeSections.length > 0) {
      for (const sec of holeSections) {
        const hole = createHolePath(
          innerLeft, innerRight, sec.bottom, sec.top, cr,
          sec.isTop, w, h, angledLeft, angledRight,
          lcw, lch, rcw, rch, tr, arw
        );
        if (hole) shape.holes.push(hole);
      }
    }

    const geo = new THREE.ExtrudeGeometry(shape, {
      steps: 1, depth: ff, bevelEnabled: false,
    });
    geo.translate(0, 0, zFront);
    geo.computeVertexNormals();
    return geo;
  }, [w, h, t, ff, hasPanels, angledLeft, angledRight, lcw, lch, rcw, rch,
    innerLeft, innerRight, cr, tr, arw, holeSections, zFront]);

  // ════════════════════════════════════════════
  // GEOMETRY LAYER 2: REBATE WALL (depth = rd)
  // Full door outline with LARGER holes (expanded by rw)
  // This creates the rebate step/ledge
  // ════════════════════════════════════════════
  const rebateWallGeo = useMemo(() => {
    if (!hasPanels || holeSections.length === 0) return null;

    const shape = createDoorOutline(
      w, h, angledLeft, angledRight, lcw, lch, rcw, rch
    );

    for (const sec of holeSections) {
      // Expanded hole for the rebate
      const holeLeft = rebateLeft;
      const holeRight = rebateRight;
      const holeBottom = Math.max(-h / 2 + 0.002, sec.bottom - rw);
      const holeTop = Math.min(h / 2 - 0.002, sec.top + rw);

      const hole = createHolePath(
        holeLeft, holeRight, holeBottom, holeTop, cr + rw,
        sec.isTop, w, h, angledLeft, angledRight,
        lcw, lch, rcw, rch,
        tr - rw, arw - rw
      );
      if (hole) shape.holes.push(hole);
    }

    const geo = new THREE.ExtrudeGeometry(shape, {
      steps: 1, depth: rd, bevelEnabled: false,
    });
    geo.translate(0, 0, zRebateStart);
    geo.computeVertexNormals();
    return geo;
  }, [w, h, rd, hasPanels, angledLeft, angledRight, lcw, lch, rcw, rch,
    rebateLeft, rebateRight, rw, cr, tr, arw, holeSections, zRebateStart]);

  // ════════════════════════════════════════════
  // GEOMETRY LAYER 3: BACK PANEL (depth = backT)
  // Full solid door outline, no holes
  // ════════════════════════════════════════════
  const backPanelGeo = useMemo(() => {
    if (backT <= 0.001) return null;

    const shape = createDoorOutline(
      w, h, angledLeft, angledRight, lcw, lch, rcw, rch
    );
    const geo = new THREE.ExtrudeGeometry(shape, {
      steps: 1, depth: backT, bevelEnabled: false,
    });
    geo.translate(0, 0, zRebateEnd);
    geo.computeVertexNormals();
    return geo;
  }, [w, h, backT, angledLeft, angledRight, lcw, lch, rcw, rch, zRebateEnd]);

  // ════════════════════════════════════════════
  // PANEL INSERTS
  // Fit inside the rebate groove
  // ════════════════════════════════════════════
  const panelSections = useMemo(() => {
    if (!hasPanels || holeSections.length === 0) return [];

    const pT =
      panelType === "REEDED_19MM"
        ? 0.019
        : panelType === "MELAMINE_18MM"
          ? 0.018
          : panelType === "GLASS"
            ? 0.004
            : 0.012;
    const clampedPT = Math.min(pT, rd);

    return holeSections
      .map((sec) => {
        // Panel sits in the rebate opening (the larger hole)
        const panelLeft = rebateLeft;
        const panelRight = rebateRight;
        const panelBottom = Math.max(-h / 2 + 0.002, sec.bottom - rw);
        const panelTop = Math.min(h / 2 - 0.002, sec.top + rw);

        const pw = panelRight - panelLeft;
        const ph = panelTop - panelBottom;
        if (pw <= 0.002 || ph <= 0.002) return null;

        const pcx = (panelLeft + panelRight) / 2;
        const pcy = (panelBottom + panelTop) / 2;

        const shape = new THREE.Shape();

        // Build in panel-local coords (centered on pcx, pcy) — sharp corners
        shape.moveTo(-pw / 2, -ph / 2);
        shape.lineTo(pw / 2, -ph / 2);

        if (sec.isTop && (angledLeft || angledRight)) {
          const roofPts = createRoofPoints(
            panelRight, panelLeft,
            tr - rw, arw - rw,
            w, h, angledLeft, angledRight,
            lcw, lch, rcw, rch
          );
          if (roofPts.length > 0) {
            shape.lineTo(
              pw / 2,
              Math.max(roofPts[0].y - pcy, -ph / 2)
            );
          }
          for (const p of roofPts) {
            shape.lineTo(p.x - pcx, Math.max(p.y - pcy, -ph / 2));
          }
          shape.lineTo(-pw / 2, -ph / 2);
        } else {
          shape.lineTo(pw / 2, ph / 2);
          shape.lineTo(-pw / 2, ph / 2);
          shape.lineTo(-pw / 2, -ph / 2);
        }

        const geo = new THREE.ExtrudeGeometry(shape, {
          steps: 1, depth: clampedPT, bevelEnabled: false,
        });
        geo.translate(0, 0, -clampedPT / 2);
        geo.computeVertexNormals();

        return { geometry: geo, centerX: pcx, centerY: pcy, thickness: clampedPT };
      })
      .filter(Boolean) as {
        geometry: THREE.ExtrudeGeometry;
        centerX: number;
        centerY: number;
        thickness: number;
      }[];
  }, [
    hasPanels, panelType, holeSections, rebateLeft, rebateRight,
    rw, cr, tr, arw, rd, w, h, angledLeft, angledRight,
    lcw, lch, rcw, rch,
  ]);

  // ════════════════════════════════════════════
  // MID RAIL GEOMETRIES
  // Rails span between stiles at the FRONT FACE depth.
  // They should be flush with the frame, not recessed.
  // ════════════════════════════════════════════
  const midRailGeos = useMemo(() => {
    if (!midRails || midRails.length === 0) return [];

    return midRails
      .map((rail: any) => {
        const railBottomFromDoorBottom = rail.positionFromBottom / 1000;
        const railDim = rail.dimension / 1000;

        // Door-center coords
        const railBottom = -h / 2 + railBottomFromDoorBottom;
        const railTop = railBottom + railDim;
        const railCenterY = (railBottom + railTop) / 2;

        // Check rail is within the door's panel area
        const panelAreaBottom = -h / 2 + br;
        const panelAreaTop = h / 2 - tr;
        if (railTop <= panelAreaBottom || railBottom >= panelAreaTop) return null;

        // Find narrowest width along the rail's height
        // by sampling the door edges at multiple Y positions
        let railLeft = innerLeft;
        let railRight = innerRight;

        const numSamples = 8;
        for (let i = 0; i <= numSamples; i++) {
          const sampleY = railBottom + (railTop - railBottom) * (i / numSamples);

          const { leftInner, rightInner } = getInnerEdgesAtY(
            sampleY, w, h, ls, rs, tr, br, arw,
            angledLeft, angledRight, lcw, lch, rcw, rch
          );

          railLeft = Math.max(railLeft, leftInner);
          railRight = Math.min(railRight, rightInner);
        }

        const railWidth = railRight - railLeft;
        if (railWidth <= 0.01) return null;

        const railCenterX = (railLeft + railRight) / 2;

        return {
          width: railWidth,
          height: railDim,
          centerX: railCenterX,
          centerY: railCenterY
        };
      })
      .filter(Boolean) as {
        width: number;
        height: number;
        centerX: number;
        centerY: number;
      }[];
  }, [
    midRails, h, innerLeft, innerRight, ls, rs, br, tr,
    angledLeft, angledRight, lcw, lch, rcw, rch, w, arw,
  ]);

  // ── Materials ──
  const frameMat = useMemo(
    () => ({
      color: doorColor,
      roughness: 0.45,
      metalness: 0.08,
      clearcoat: 0.25,
      clearcoatRoughness: 0.3,
      normalMap: woodNormalMap,
      normalScale: new THREE.Vector2(0.12, 0.12),
      envMapIntensity: 1.2,
    }),
    [doorColor, woodNormalMap]
  );

  const panelColors: Record<string, string> = {
    STANDARD_12MM: "#a08b70",
    REEDED_19MM: "#8b7860",
    MELAMINE_18MM: "#d4c5b0",
    FRETWORK: "#9b8570",
    GLASS: "#e8f4f8",
  };

  // ── Render ──
  const components = useMemo(() => {
    const parts: JSX.Element[] = [];

    // Front face
    parts.push(
      <mesh
        key="front"
        castShadow
        receiveShadow
        geometry={frontFaceGeo}
        onClick={(e) => { e.stopPropagation(); onPartClick("borders"); }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "auto")}
      >
        <meshPhysicalMaterial {...frameMat} />
      </mesh>
    );

    // Rebate wall
    if (rebateWallGeo) {
      parts.push(
        <mesh
          key="rebate"
          castShadow
          receiveShadow
          geometry={rebateWallGeo}
          onClick={(e) => { e.stopPropagation(); onPartClick("rebates"); }}
          onPointerOver={() => (document.body.style.cursor = "pointer")}
          onPointerOut={() => (document.body.style.cursor = "auto")}
        >
          <meshPhysicalMaterial
            color="#5a4a3a"
            roughness={0.6}
            metalness={0.04}
            clearcoat={0.08}
            envMapIntensity={0.8}
          />
        </mesh>
      );
    }

    // Back panel
    if (backPanelGeo) {
      parts.push(
        <mesh
          key="back"
          castShadow
          receiveShadow
          geometry={backPanelGeo}
          onClick={(e) => { e.stopPropagation(); onPartClick("door-style"); }}
          onPointerOver={() => (document.body.style.cursor = "pointer")}
          onPointerOut={() => (document.body.style.cursor = "auto")}
        >
          <meshPhysicalMaterial {...frameMat} />
        </mesh>
      );
    }

    // Panel sections
    panelSections.forEach((sec, i) => {
      // Center the panel in the rebate groove depth
      const panelZ = zRebateStart + rd / 2;
      const isReeded = panelType === "REEDED_19MM";

      parts.push(
        <mesh
          key={`panel-${i}`}
          position={[sec.centerX, sec.centerY, panelZ]}
          castShadow
          receiveShadow
          geometry={sec.geometry}
          onClick={(e) => { e.stopPropagation(); onPartClick("door-style"); }}
          onPointerOver={() => (document.body.style.cursor = "pointer")}
          onPointerOut={() => (document.body.style.cursor = "auto")}
        >
          <meshPhysicalMaterial
            color={panelColors[panelType] || "#a08b70"}
            roughness={isReeded ? 0.3 : 0.5}
            metalness={0.04}
            clearcoat={panelType === "MELAMINE_18MM" ? 0.4 : 0.15}
            clearcoatRoughness={0.4}
            normalMap={isReeded ? (reededNormalMap ?? undefined) : woodNormalMap}
            normalScale={
              isReeded
                ? new THREE.Vector2(1.2, 1.2)
                : new THREE.Vector2(0.08, 0.08)
            }
            envMapIntensity={1.0}
            transparent={panelType === "GLASS"}
            opacity={panelType === "GLASS" ? 0.3 : 1.0}
          />
        </mesh>
      );
    });

    // Mid rails - simple boxes at full thickness, rendered with polygon offset
    // to avoid z-fighting with the frame layers
    midRailGeos.forEach((rail, i) => {
      // Create a thin bar that sits flush with the front face
      // Mid-rail should be at the front face depth, not recessed
      const railGeo = new THREE.BoxGeometry(rail.width, rail.height, ff);
      railGeo.computeVertexNormals();

      parts.push(
        <mesh
          key={`midrail-${i}`}
          position={[rail.centerX, rail.centerY, zFront + ff / 2]}
          castShadow
          receiveShadow
          geometry={railGeo}
          onClick={(e) => { e.stopPropagation(); onPartClick("mid-rails"); }}
          onPointerOver={() => (document.body.style.cursor = "pointer")}
          onPointerOut={() => (document.body.style.cursor = "auto")}
        >
          <meshPhysicalMaterial
            {...frameMat}
            polygonOffset
            polygonOffsetFactor={-0.5}
            polygonOffsetUnits={-0.5}
          />
        </mesh>
      );
    });

    // Hinges
    if (hingeDrilling && hinges.length > 0) {
      hinges.forEach((hinge: any) => {
        const hY = -h / 2 + hinge.positionFromBottomMm / 1000;
        const hX =
          hinge.side === "LEFT"
            ? -w / 2 + HINGE_CENTER_M
            : w / 2 - HINGE_CENTER_M;

        const fromBottom = hinge.positionFromBottomMm / 1000;
        if (hinge.side === "LEFT" && angledLeft && lch > 0.001) {
          if (fromBottom > h - lch) return;
        }
        if (hinge.side === "RIGHT" && angledRight && rch > 0.001) {
          if (fromBottom > h - rch) return;
        }

        const cupZ = t / 2;

        parts.push(
          <group key={`hinge-${hinge.id}`} position={[hX, hY, 0]}>
            {/* Cup ring on back surface */}
            <mesh position={[0, 0, cupZ]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry
                args={[HINGE_CUP_RADIUS_M, HINGE_CUP_RADIUS_M, 0.002, 32]}
              />
              <meshPhysicalMaterial
                color="#b0b0b0"
                metalness={0.95}
                roughness={0.05}
                clearcoat={1.0}
                envMapIntensity={2.5}
              />
            </mesh>
            {/* Cup cavity */}
            <mesh
              position={[0, 0, cupZ - 0.007]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry
                args={[
                  HINGE_CUP_RADIUS_M - 0.001,
                  HINGE_CUP_RADIUS_M - 0.001,
                  0.013,
                  32,
                ]}
              />
              <meshPhysicalMaterial
                color="#2a2a2a"
                metalness={0.3}
                roughness={0.8}
              />
            </mesh>
          </group>
        );
      });
    }

    return parts;
  }, [
    frontFaceGeo, rebateWallGeo, backPanelGeo, panelSections, midRailGeos,
    reededNormalMap, woodNormalMap, frameMat, panelType, t, ff, rd, h, w,
    hingeDrilling, hinges, angledLeft, angledRight, lcw, lch, rcw, rch,
    onPartClick, doorColor, zFront, zRebateStart, zRebateEnd,
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
    width, height, thickness, panelType,
    angledLeft, angledRight,
    leftTriangleCutoutWidth, leftTriangleCutoutHeight,
    rightTriangleCutoutWidth, rightTriangleCutoutHeight,
    borderWidth, customBorders, leftStile, rightStile, bottomRail, topRail,
    midRailsEnabled, midRails,
    rebateWidthMm, rebateDepthMm, frontFaceThicknessMm, cornerRadiusMm,
    hingeDrilling, hinges, angledRailWidth,
  } = config;

  const DOOR_FRAME_COLOR = "#8B7355";

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y =
        Math.sin(state.clock.elapsedTime * 0.12) * 0.025;
    }
  });

  const finalBorders = customBorders
    ? { leftStile, rightStile, bottomRail, topRail }
    : {
      leftStile: borderWidth,
      rightStile: borderWidth,
      bottomRail: borderWidth,
      topRail: borderWidth,
    };

  const activeMidRails = midRailsEnabled ? midRails : [];

  // Door bottom at y=0
  const doorYOffset = height / 1000 / 2;

  return (
    <group ref={meshRef} position={[0, doorYOffset, 0]}>
      <SingleDoorLeaf
        width={width}
        height={height}
        thickness={thickness}
        panelType={panelType}
        position={[0, 0, 0]}
        doorColor={DOOR_FRAME_COLOR}
        angledLeft={angledLeft}
        angledRight={angledRight}
        leftCutoutWidth={leftTriangleCutoutWidth}
        leftCutoutHeight={leftTriangleCutoutHeight}
        rightCutoutWidth={rightTriangleCutoutWidth}
        rightCutoutHeight={rightTriangleCutoutHeight}
        borderWidths={finalBorders}
        midRails={activeMidRails}
        rebateWidthMm={rebateWidthMm}
        rebateDepthMm={rebateDepthMm}
        frontFaceThicknessMm={frontFaceThicknessMm}
        cornerRadiusMm={cornerRadiusMm}
        hingeDrilling={hingeDrilling}
        hinges={hinges}
        angledRailWidth={angledRailWidth}
        onPartClick={onPartClick}
      />
      <DoorDimensions config={config} forceHideLabels={forceHideLabels} />
    </group>
  );
}