// client/src/components/door/Door3D.tsx
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { DoorDimensions } from "./DimensionLabel";

// ============================================
// GEOMETRY UTILITIES
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

  return sortedX.map(x => ({
    x,
    y: Math.max(getY(x), -h / 2 + 0.01)
  }));
}

// ============================================
// SINGLE DOOR LEAF COMPONENT
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
  width,
  height,
  thickness,
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
  onPartClick,
}: SingleDoorLeafProps) {

  // Convert to meters
  const w = width / 1000;
  const h = height / 1000;
  const t = thickness / 1000;
  const rw = rebateWidthMm / 1000;
  const rd = rebateDepthMm / 1000;
  const ff = frontFaceThicknessMm / 1000;

  // Validate parameters
  const rawParams: DoorGeometryParams = {
    width: w,
    height: h,
    thickness: t,
    leftStile: borderWidths.leftStile / 1000,
    rightStile: borderWidths.rightStile / 1000,
    topRail: borderWidths.topRail / 1000,
    bottomRail: borderWidths.bottomRail / 1000,
    angledLeft,
    angledRight,
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

  // ========================================
  // FRONT FACE GEOMETRY
  // ========================================
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

    // Inner hole
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
      roofPoints.forEach(p => hole.lineTo(p.x, p.y));
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

    const geometry = new THREE.ExtrudeGeometry(shape, {
      steps: 1,
      depth: ff,
      bevelEnabled: false,
    });
    geometry.translate(0, 0, -t / 2);
    geometry.computeVertexNormals();
    return geometry;
  }, [w, h, t, ff, angledLeft, angledRight, leftCutW, leftCutH, rightCutW, rightCutH,
    innerWidth, innerHeight, innerCenterX, innerCenterY, cornerRadius, topRail, params]);

  // ========================================
  // REBATE WALL GEOMETRY
  // ========================================
  const rebateWallGeometry = useMemo(() => {
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

    const hole = new THREE.Path();
    const r = (cornerRadius + rw);
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
      roofPoints.forEach(p => hole.lineTo(p.x, p.y));
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

    const geometry = new THREE.ExtrudeGeometry(shape, {
      steps: 1,
      depth: rd,
      bevelEnabled: false,
    });
    geometry.translate(0, 0, -t / 2 + ff);
    geometry.computeVertexNormals();
    return geometry;
  }, [w, h, t, ff, rd, rw, angledLeft, angledRight, leftCutW, leftCutH, rightCutW, rightCutH,
    innerWidth, innerHeight, innerCenterX, innerCenterY, cornerRadius, topRail, params]);

  // ========================================
  // REEDED PANEL NORMAL MAP
  // ========================================
  const reededNormalMap = useMemo(() => {
    if (panelType !== "REEDED_19MM") return null;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = "rgb(128, 128, 255)";
    ctx.fillRect(0, 0, size, size);

    const reedCount = 40;
    const reedWidth = size / reedCount;

    for (let i = 0; i < reedCount; i++) {
      const xStart = i * reedWidth;
      const gradient = ctx.createLinearGradient(xStart, 0, xStart + reedWidth, 0);
      gradient.addColorStop(0, "rgb(50, 128, 255)");
      gradient.addColorStop(0.5, "rgb(128, 128, 255)");
      gradient.addColorStop(1, "rgb(205, 128, 255)");
      ctx.fillStyle = gradient;
      ctx.fillRect(xStart, 0, reedWidth, size);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(5, 1);
    return texture;
  }, [panelType]);

  // ========================================
  // PANEL GEOMETRY
  // ========================================
  const panelGeometry = useMemo(() => {
    if (panelType === "NONE") return null;

    const pT = panelType === "REEDED_19MM" ? 0.019 : panelType === "MELAMINE_18MM" ? 0.018 : 0.012;
    const r = (cornerRadius + rw);
    const ih = (innerHeight + 2 * rw) / 2;
    const iw = (innerWidth + 2 * rw) / 2;
    const pcx = innerCenterX;
    const pcy = innerCenterY;

    const pShape = new THREE.Shape();
    const holeRightX = pcx + iw;
    const holeLeftX = pcx - iw;

    pShape.moveTo(pcx - iw + r, pcy - ih);
    pShape.lineTo(pcx + iw - r, pcy - ih);
    pShape.absarc(pcx + iw - r, pcy - ih + r, r, -Math.PI / 2, 0, false);

    if (angledLeft || angledRight) {
      const roofPoints = createRoofPoints(holeRightX, holeLeftX, topRail - rw, params);
      roofPoints.forEach(p => pShape.lineTo(p.x, p.y));
      pShape.lineTo(holeLeftX, pcy - ih + r);
    } else {
      pShape.lineTo(holeRightX, pcy + ih - r);
      pShape.absarc(pcx + iw - r, pcy + ih - r, r, 0, Math.PI / 2, false);
      pShape.lineTo(pcx - iw + r, pcy + ih);
      pShape.absarc(pcx - iw + r, pcy + ih - r, r, Math.PI / 2, Math.PI, false);
      pShape.lineTo(holeLeftX, pcy - ih + r);
    }

    pShape.absarc(pcx - iw + r, pcy - ih + r, r, Math.PI, Math.PI * 1.5, false);

    const geometry = new THREE.ExtrudeGeometry(pShape, {
      steps: 1,
      depth: pT,
      bevelEnabled: false,
    });

    geometry.translate(0, 0, -pT / 2);
    geometry.computeVertexNormals();

    return { geometry, thickness: pT };
  }, [panelType, innerWidth, innerHeight, innerCenterX, innerCenterY, cornerRadius,
    rw, topRail, angledLeft, angledRight, params]);

  // ========================================
  // BACK PANEL GEOMETRY (for slab doors)
  // ========================================
  const backPanelGeometry = useMemo(() => {
    const backThickness = t - ff - rd;
    if (backThickness <= 0) return null;

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

    const geometry = new THREE.ExtrudeGeometry(shape, {
      steps: 1,
      depth: backThickness,
      bevelEnabled: false,
    });
    geometry.translate(0, 0, -t / 2 + ff + rd);
    geometry.computeVertexNormals();
    return geometry;
  }, [w, h, t, ff, rd, angledLeft, angledRight, leftCutW, leftCutH, rightCutW, rightCutH]);

  // ========================================
  // RENDER COMPONENTS
  // ========================================
  const components = useMemo(() => {
    const parts: JSX.Element[] = [];

    // Door Frame - Front Face
    parts.push(
      <mesh
        key="front-face"
        castShadow
        receiveShadow
        geometry={frontFaceGeometry}
        onClick={(e) => { e.stopPropagation(); onPartClick("borders"); }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "auto")}
      >
        <meshStandardMaterial
          color={doorColor}
          roughness={0.75}
          metalness={0.02}
          envMapIntensity={0.5}
        />
      </mesh>
    );

    // Door Frame - Rebate Wall
    parts.push(
      <mesh
        key="rebate-wall"
        castShadow
        receiveShadow
        geometry={rebateWallGeometry}
        onClick={(e) => { e.stopPropagation(); onPartClick("rebates"); }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "auto")}
      >
        <meshStandardMaterial
          color={doorColor}
          roughness={0.85}
          metalness={0.0}
        />
      </mesh>
    );

    // Back Panel (for slab doors or closing the back)
    if (backPanelGeometry && panelType === "NONE") {
      parts.push(
        <mesh
          key="back-panel"
          castShadow
          receiveShadow
          geometry={backPanelGeometry}
          onClick={(e) => { e.stopPropagation(); onPartClick("door-style"); }}
          onPointerOver={() => (document.body.style.cursor = "pointer")}
          onPointerOut={() => (document.body.style.cursor = "auto")}
        >
          <meshStandardMaterial
            color={doorColor}
            roughness={0.85}
            metalness={0.0}
          />
        </mesh>
      );
    }

    // Panel
    if (panelGeometry) {
      const zPos = -t / 2 + ff + panelGeometry.thickness / 2;

      const panelColors: Record<string, string> = {
        "STANDARD_12MM": "#D4C4A8",
        "REEDED_19MM": "#B8A080",
        "MELAMINE_18MM": "#E8DCC8",
      };

      parts.push(
        <mesh
          key="panel-center"
          position={[0, 0, zPos - panelGeometry.thickness / 2]}
          castShadow
          receiveShadow
          geometry={panelGeometry.geometry}
          onClick={(e) => { e.stopPropagation(); onPartClick("door-style"); }}
          onPointerOver={() => (document.body.style.cursor = "pointer")}
          onPointerOut={() => (document.body.style.cursor = "auto")}
        >
          <meshStandardMaterial
            color={panelColors[panelType] || "#E8DCC8"}
            roughness={panelType === "REEDED_19MM" ? 0.5 : 0.85}
            normalMap={reededNormalMap || undefined}
            normalScale={new THREE.Vector2(1, 1)}
            envMapIntensity={0.3}
          />
        </mesh>
      );
    }

    // Mid Rails
    if (midRails && midRails.length > 0) {
      midRails.forEach((rail: any, index: number) => {
        const railY = -h / 2 + rail.positionFromBottom / 1000;
        const railDim = rail.dimension / 1000;

        let railWidth = w;
        let railCenterX = 0;

        if (angledLeft && leftCutH > 0.001) {
          const heightFromTop = h / 2 - railY;
          if (heightFromTop < leftCutH) {
            const reduction = (leftCutW * heightFromTop) / leftCutH;
            railWidth -= reduction;
            railCenterX += reduction / 2;
          }
        }

        if (angledRight && rightCutH > 0.001) {
          const heightFromTop = h / 2 - railY;
          if (heightFromTop < rightCutH) {
            const reduction = (rightCutW * heightFromTop) / rightCutH;
            railWidth -= reduction;
            railCenterX -= reduction / 2;
          }
        }

        parts.push(
          <mesh
            key={`mid-rail-${index}`}
            position={[railCenterX, railY, 0]}
            castShadow
            receiveShadow
            onClick={(e) => { e.stopPropagation(); onPartClick("mid-rails"); }}
            onPointerOver={() => (document.body.style.cursor = "pointer")}
            onPointerOut={() => (document.body.style.cursor = "auto")}
          >
            <boxGeometry args={[railWidth, railDim, t]} />
            <meshStandardMaterial color={doorColor} roughness={0.8} metalness={0.0} />
          </mesh>
        );
      });
    }

    // Hinges
    if (hingeDrilling && hinges.length > 0) {
      hinges.forEach((hinge: any) => {
        const hY = -h / 2 + hinge.positionFromBottomMm / 1000;
        const hX = hinge.side === "LEFT" ? -w / 2 + 0.022 : w / 2 - 0.022;

        let hidden = false;
        if (hinge.side === "LEFT" && angledLeft && leftCutH > 0.001) {
          const heightFromTop = h / 2 - hY;
          if (heightFromTop < leftCutH) {
            const maxX = -w / 2 + (leftCutW * heightFromTop) / leftCutH;
            if (hX < maxX) hidden = true;
          }
        }
        if (hinge.side === "RIGHT" && angledRight && rightCutH > 0.001) {
          const heightFromTop = h / 2 - hY;
          if (heightFromTop < rightCutH) {
            const minX = w / 2 - (rightCutW * heightFromTop) / rightCutH;
            if (hX > minX) hidden = true;
          }
        }

        if (hidden) return;

        parts.push(
          <mesh
            key={`hinge-${hinge.id}`}
            position={[hX, hY, -t / 2 + 0.005]}
            rotation={[Math.PI / 2, 0, 0]}
            onClick={(e) => { e.stopPropagation(); onPartClick("hinges"); }}
            onPointerOver={() => (document.body.style.cursor = "pointer")}
            onPointerOut={() => (document.body.style.cursor = "auto")}
          >
            <cylinderGeometry args={[0.0175, 0.0175, 0.013, 32]} />
            <meshStandardMaterial color="#3a3a3a" metalness={0.9} roughness={0.15} />
          </mesh>
        );
      });
    }

    return parts;
  }, [frontFaceGeometry, rebateWallGeometry, backPanelGeometry, panelGeometry, reededNormalMap, doorColor,
    panelType, t, ff, h, w, midRails, hingeDrilling, hinges, angledLeft, angledRight,
    leftCutW, leftCutH, rightCutW, rightCutH, onPartClick]);

  return (
    <group position={position}>
      {components}
    </group>
  );
}

// ============================================
// MAIN DOOR 3D COMPONENT
// ============================================

export function Door3D({ config, onPartClick }: { config: any; onPartClick: (section: string) => void }) {
  const meshRef = useRef<THREE.Group>(null);

  const {
    width,
    height,
    thickness,
    panelType,
    preset,
    angledLeft,
    angledRight,
    leftTriangleCutoutWidth,
    leftTriangleCutoutHeight,
    rightTriangleCutoutWidth,
    rightTriangleCutoutHeight,
    borderWidth,
    customBorders,
    leftStile,
    rightStile,
    bottomRail,
    topRail,
    midRailsEnabled,
    midRails,
    rebateWidthMm,
    rebateDepthMm,
    frontFaceThicknessMm,
    cornerRadiusMm,
    hingeDrilling,
    hinges,
  } = config;

  const MDF_FRAME_COLOR = "#E8DCC8";

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.03;
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
            width={leafWidth}
            height={height}
            thickness={thickness}
            panelType={panelType}
            position={[-(leafWidth / 2 + gap / 2) / 1000, 0, 0]}
            doorColor={MDF_FRAME_COLOR}
            angledLeft={angledLeft}
            angledRight={false}
            leftCutoutWidth={leftTriangleCutoutWidth}
            leftCutoutHeight={leftTriangleCutoutHeight}
            borderWidths={finalBorders}
            midRails={activeMidRails}
            rebateWidthMm={rebateWidthMm}
            rebateDepthMm={rebateDepthMm}
            frontFaceThicknessMm={frontFaceThicknessMm}
            cornerRadiusMm={cornerRadiusMm}
            hingeDrilling={hingeDrilling}
            hinges={hinges.filter((h: any) => h.side === "LEFT")}
            onPartClick={onPartClick}
          />
          <SingleDoorLeaf
            width={leafWidth}
            height={height}
            thickness={thickness}
            panelType={panelType}
            position={[(leafWidth / 2 + gap / 2) / 1000, 0, 0]}
            doorColor={MDF_FRAME_COLOR}
            angledLeft={false}
            angledRight={angledRight}
            rightCutoutWidth={rightTriangleCutoutWidth}
            rightCutoutHeight={rightTriangleCutoutHeight}
            borderWidths={finalBorders}
            midRails={activeMidRails}
            rebateWidthMm={rebateWidthMm}
            rebateDepthMm={rebateDepthMm}
            frontFaceThicknessMm={frontFaceThicknessMm}
            cornerRadiusMm={cornerRadiusMm}
            hingeDrilling={hingeDrilling}
            hinges={hinges.filter((h: any) => h.side === "RIGHT")}
            onPartClick={onPartClick}
          />
        </>
      ) : (
        <SingleDoorLeaf
          width={width}
          height={height}
          thickness={thickness}
          panelType={panelType}
          position={[0, 0, 0]}
          doorColor={MDF_FRAME_COLOR}
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
          onPartClick={onPartClick}
        />
      )}
      <DoorDimensions config={config} />
    </group>
  );
}