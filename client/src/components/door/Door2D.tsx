import { useDoorConfig, HINGE_CUP_DIAMETER_MM, HINGE_CENTER_OFFSET_MM, DoorConfig } from "@/lib/stores/useDoorConfig";
import {
  getOuterEdgesAtY,
  getInnerEdgesAtY,
  getHoleSections,
  createRoofPoints,
  HoleSection,
  RoofPoint
} from "@/lib/doorUtils";

interface Door2DProps {
  face?: "front" | "back";
  configOverride?: Partial<DoorConfig>;
}

export function Door2D({ face = "front", configOverride }: Door2DProps) {
  const storeConfig = useDoorConfig();
  const config = configOverride ? { ...storeConfig, ...configOverride } : storeConfig;

  const {
    width,
    height,
    panelType,
    panelCount,
    panelOrientation,
    angledLeft,
    angledRight,
    leftTriangleCutoutWidth,
    leftTriangleCutoutHeight,
    rightTriangleCutoutWidth,
    rightTriangleCutoutHeight,
    leftStile,
    rightStile,
    bottomRail,
    topRail,
    midRailsEnabled,
    midRails,
    showDimensions,
    hingeDrilling,
    hinges,
    customBorders,
    borderWidth,
    leftAngleDegrees,
    rightAngleDegrees,
    rebateWidthMm,
    leftAngledRailWidth,
    rightAngledRailWidth,
    rearCornerRadiusMm,
  } = config;

  const isBack = face === "back";

  // Use effective border values
  const effectiveLeftStile = customBorders ? leftStile : borderWidth;
  const effectiveRightStile = customBorders ? rightStile : borderWidth;
  const effectiveTopRail = customBorders ? topRail : borderWidth;
  const effectiveBottomRail = customBorders ? bottomRail : borderWidth;

  const padding = 80;
  const maxWidth = 500;
  const maxHeight = 650;

  const scaleX = (maxWidth - padding * 2) / (width || 600);
  const scaleY = (maxHeight - padding * 2) / (height || 720);
  const scale = (isNaN(scaleX) || isNaN(scaleY) || !isFinite(scaleX) || !isFinite(scaleY))
    ? 0.5
    : Math.min(scaleX, scaleY);

  const scaledWidth = width * scale;
  const scaledHeight = height * scale;

  const offsetX = (maxWidth - scaledWidth) / 2;
  const offsetY = (maxHeight - scaledHeight) / 2;

  const isMDFModel = panelType === "MELAMINE_18MM";

  const strokeColor = isMDFModel ? "#5d4037" : "#44403c"; // Dark brown MDF edge or neutral dark
  const fillColor = isMDFModel ? "#d7ccc8" : "#fafaf9";   // Light tan MDF face or off-white
  const panelFillColor = isMDFModel ? "#c19a6b" : "#e7e5e4"; // Raw brown MDF panel or light gray
  const railFillColor = isMDFModel ? "#d7ccc8" : "#fafaf9";  // Light tan MDF rail or off-white
  const dimensionColor = strokeColor;
  const hingeFillColor = isMDFModel ? "#bcaaa4" : "#a1a1aa";
  const hingeStrokeColor = strokeColor;
  const borderDimColor = isMDFModel ? "#1e40af" : "#3b82f6"; // Darker blue for visibility on tan or standard blue

  const mirrorTransform = isBack
    ? `translate(${maxWidth}, 0) scale(-1, 1)`
    : undefined;

  const toX = (x: number) => offsetX + x * scale;
  const toY = (y: number) => offsetY + (height - y) * scale;

  const getDoorOutline = () => {
    const points: string[] = [];

    points.push(`${toX(0)},${toY(0)}`);

    if (angledLeft) {
      points.push(`${toX(0)},${toY(height - leftTriangleCutoutHeight)}`);
      points.push(`${toX(leftTriangleCutoutWidth)},${toY(height)}`);
    } else {
      points.push(`${toX(0)},${toY(height)}`);
    }

    if (angledRight) {
      points.push(`${toX(width - rightTriangleCutoutWidth)},${toY(height)}`);
      points.push(`${toX(width)},${toY(height - rightTriangleCutoutHeight)}`);
    } else {
      points.push(`${toX(width)},${toY(height)}`);
    }

    points.push(`${toX(width)},${toY(0)}`);

    return points.join(" ");
  };

  // Utilities converted to meters for shared geometry engine
  const w = width / 1000;
  const h = height / 1000;
  const ls = effectiveLeftStile / 1000;
  const rs = effectiveRightStile / 1000;
  const ts = effectiveTopRail / 1000;
  const bs = effectiveBottomRail / 1000;
  const arwL = (leftAngledRailWidth ?? 90) / 1000;
  const arwR = (rightAngledRailWidth ?? 90) / 1000;
  const lcw = leftTriangleCutoutWidth / 1000;
  const lch = leftTriangleCutoutHeight / 1000;
  const rcw = rightTriangleCutoutWidth / 1000;
  const rch = rightTriangleCutoutHeight / 1000;

  const effectiveMidRails = midRailsEnabled ? midRails : [];
  const holeSections = getHoleSections(effectiveMidRails, h, bs, ts, panelCount);

  // Render inner frame lines (stiles and rails as lines, not filled rectangles)
  const renderFrameLines = () => {
    if (panelType === "NONE") return null;

    const lines: JSX.Element[] = [];
    const frameStroke = "#78716c";
    const frameStrokeWidth = 0.5;
    const frameDash = "4 2";

    // "Outer" = The visible frame edge from front
    // "Inner" = The panel boundary inside the rebate

    // On the FRONT:
    // Solid line represents the visible frame opening (effectiveStile).
    // Dotted line represents the panel holding rebate (effectiveStile - rebateWidthMm).

    // On the BACK:
    // Solid line represents the rebate edge (effectiveStile - rebateWidthMm).
    // Dotted line represents the front frame opening edge (effectiveStile).

    // Therefore, visible frame edge is always:
    const visibleFrameStyle = isBack ? { strokeDasharray: frameDash } : {};
    const scaledInnerRadius = rearCornerRadiusMm * scale;

    // For non-angled doors, use <rect> with rx/ry for inner corner radii
    if (!angledLeft && !angledRight) {
      // Visible frame opening rectangle with inner corner radii
      const vx = toX(effectiveLeftStile);
      const vy = toY(height - effectiveTopRail);
      const vw = toX(width - effectiveRightStile) - toX(effectiveLeftStile);
      const vh = toY(effectiveBottomRail) - toY(height - effectiveTopRail);
      lines.push(
        <rect key="visible-frame-rect"
          x={vx} y={vy} width={vw} height={vh}
          rx={scaledInnerRadius} ry={scaledInnerRadius}
          fill="none" stroke={frameStroke} strokeWidth={frameStrokeWidth}
          {...visibleFrameStyle}
        />
      );
    } else {
      // Angled doors: use individual lines for the straight portions
      // Left stile visible line
      lines.push(
        <line key="left-stile-vis"
          x1={toX(effectiveLeftStile)} y1={toY(effectiveBottomRail)}
          x2={toX(effectiveLeftStile)} y2={toY(height - effectiveTopRail)}
          stroke={frameStroke} strokeWidth={frameStrokeWidth} {...visibleFrameStyle}
        />
      );
      // Right stile visible line
      lines.push(
        <line key="right-stile-vis"
          x1={toX(width - effectiveRightStile)} y1={toY(effectiveBottomRail)}
          x2={toX(width - effectiveRightStile)} y2={toY(height - effectiveTopRail)}
          stroke={frameStroke} strokeWidth={frameStrokeWidth} {...visibleFrameStyle}
        />
      );
      // Bottom rail visible line
      lines.push(
        <line key="bottom-rail-vis"
          x1={toX(effectiveLeftStile)} y1={toY(effectiveBottomRail)}
          x2={toX(width - effectiveRightStile)} y2={toY(effectiveBottomRail)}
          stroke={frameStroke} strokeWidth={frameStrokeWidth} {...visibleFrameStyle}
        />
      );
      // Top rail visible line (angled)
      const visibleRoof = createRoofPoints(
        w / 2 - rs, -w / 2 + ls, ts, arwL, arwR, w, h,
        angledLeft, angledRight, lcw, lch, rcw, rch
      );
      const vPoints = visibleRoof.map(p => `${toX((p.x + w / 2) * 1000)},${toY((p.y + h / 2) * 1000)}`).join(" ");
      lines.push(
        <polyline key="top-rail-vis-angled"
          points={vPoints}
          fill="none" stroke={frameStroke} strokeWidth={frameStrokeWidth} {...visibleFrameStyle}
        />
      );
    }

    // "Rebate" or panel extent line:
    const rebateStyle = isBack ? {} : { strokeDasharray: frameDash };
    const rL = effectiveLeftStile - rebateWidthMm;
    const rR = width - (effectiveRightStile - rebateWidthMm);
    const rB = effectiveBottomRail - rebateWidthMm;
    const rT = height - (effectiveTopRail - rebateWidthMm);
    const rStroke = isBack ? "#78716c" : "#a8a29e";

    if (!angledLeft && !angledRight) {
      // Rebate rectangle with inner corner radii
      const rx = toX(rL);
      const ry2 = toY(rT);
      const rw = toX(rR) - toX(rL);
      const rh = toY(rB) - toY(rT);
      lines.push(
        <rect key="rebate-frame-rect"
          x={rx} y={ry2} width={rw} height={rh}
          rx={scaledInnerRadius} ry={scaledInnerRadius}
          fill="none" stroke={rStroke} strokeWidth={frameStrokeWidth}
          {...rebateStyle}
        />
      );
    } else {
      // Angled doors: individual lines for rebate
      lines.push(
        <line key="left-stile-rebate"
          x1={toX(rL)} y1={toY(rB)} x2={toX(rL)} y2={toY(rT)}
          stroke={rStroke} strokeWidth={frameStrokeWidth} {...rebateStyle}
        />
      );
      lines.push(
        <line key="right-stile-rebate"
          x1={toX(rR)} y1={toY(rB)} x2={toX(rR)} y2={toY(rT)}
          stroke={rStroke} strokeWidth={frameStrokeWidth} {...rebateStyle}
        />
      );
      lines.push(
        <line key="bottom-rail-rebate"
          x1={toX(rL)} y1={toY(rB)} x2={toX(rR)} y2={toY(rB)}
          stroke={rStroke} strokeWidth={frameStrokeWidth} {...rebateStyle}
        />
      );
      const rM = (rebateWidthMm) / 1000;
      const rebateRoof = createRoofPoints(
        w / 2 - (rs - rM), -w / 2 + (ls - rM), ts - rM, arwL - rM, arwR - rM, w, h,
        angledLeft, angledRight, lcw, lch, rcw, rch
      );
      const rPoints = rebateRoof.map(p => `${toX((p.x + w / 2) * 1000)},${toY((p.y + h / 2) * 1000)}`).join(" ");
      lines.push(
        <polyline key="top-rail-rebate-angled"
          points={rPoints}
          fill="none" stroke={rStroke} strokeWidth={frameStrokeWidth} {...rebateStyle}
        />
      );
    }

    return lines;
  };

  const renderMidRails = () => {
    if (!midRailsEnabled || midRails.length === 0) return null;

    // FRONT: mid-rail fills to frame opening (stile). BACK: mid-rail extends to rebate edge.
    const rM = isBack ? -(rebateWidthMm / 1000) : 0;

    return midRails.map((rail) => {
      const railBottom = rail.positionFromBottom / 1000;
      const railTop = railBottom + rail.dimension / 1000;
      // On the back, the mid-rail is thinner vertically due to the rebate cutouts on top and bottom
      const yBottomM = -h / 2 + railBottom - rM;
      const yTopM = -h / 2 + railTop + rM;

      const transitionY_L = h / 2 - lch;
      const transitionY_R = h / 2 - rch;

      const steps = 4;
      const ySamples: number[] = [];
      for (let i = 0; i <= steps; i++) {
        ySamples.push(yBottomM + (yTopM - yBottomM) * (i / steps));
      }
      if (angledLeft && transitionY_L > yBottomM && transitionY_L < yTopM) ySamples.push(transitionY_L);
      if (angledRight && transitionY_R > yBottomM && transitionY_R < yTopM) ySamples.push(transitionY_R);

      ySamples.sort((a, b) => a - b);
      const uniqueYSamples = Array.from(new Set(ySamples));

      const points: string[] = [];
      uniqueYSamples.forEach(y => {
        const { leftInner: xL } = getInnerEdgesAtY(y, w, h, ls + rM, rs + rM, ts + rM, bs + rM, arwL + rM, arwR + rM, angledLeft, angledRight, lcw, lch, rcw, rch);
        points.push(`${toX((xL + w / 2) * 1000)},${toY((y + h / 2) * 1000)}`);
      });
      [...uniqueYSamples].reverse().forEach(y => {
        const { rightInner: xR } = getInnerEdgesAtY(y, w, h, ls + rM, rs + rM, ts + rM, bs + rM, arwL + rM, arwR + rM, angledLeft, angledRight, lcw, lch, rcw, rch);
        points.push(`${toX((xR + w / 2) * 1000)},${toY((y + h / 2) * 1000)}`);
      });

      return (
        <polygon
          key={rail.id}
          points={points.join(" ")}
          fill={railFillColor}
          stroke="#78716c"
          strokeWidth={0.5}
        />
      );
    });
  };

  const getPanelPoints = (sec: HoleSection, pPadM: number, rM: number) => {
    // rM is negative on BACK view to expand panel outward to rebate edge
    // +rM on bottom: negative rM moves bottom down (expand)
    // -rM on top: negative rM moves top up (expand)
    const pBottom = sec.bottom + rM + pPadM;
    const pTop = sec.top - rM - pPadM;
    if (pTop <= pBottom) return [];

    const steps = 6;
    const ySamples: number[] = [];
    for (let i = 0; i <= steps; i++) {
      ySamples.push(pBottom + (pTop - pBottom) * (i / steps));
    }

    // Inject precise elbow points where stile meets angled rail
    if (angledLeft && lcw > 0.001 && lch > 0.001) {
      const mL = lch / lcw;
      const hypL = Math.sqrt(lcw * lcw + lch * lch);
      const shiftL = (arwL + rM + pPadM) * (hypL / lcw);
      const yElbowL = mL * (ls + rM + pPadM) + (h / 2 - lch) - shiftL;
      if (yElbowL > pBottom && yElbowL < pTop) ySamples.push(yElbowL);
    }

    if (angledRight && rcw > 0.001 && rch > 0.001) {
      const mR = -rch / rcw;
      const hypR = Math.sqrt(rcw * rcw + rch * rch);
      const shiftR = (arwR + rM + pPadM) * (hypR / rcw);
      const yElbowR = -mR * (rs + rM + pPadM) + (h / 2 - rch) - shiftR;
      if (yElbowR > pBottom && yElbowR < pTop) ySamples.push(yElbowR);
    }

    ySamples.sort((a, b) => a - b);
    const uniqueYSamples = Array.from(new Set(ySamples));

    const points: string[] = [];
    uniqueYSamples.forEach(y => {
      const { leftInner: li } = getInnerEdgesAtY(y, w, h, ls + rM, rs + rM, ts + rM, bs + rM, arwL + rM, arwR + rM, angledLeft, angledRight, lcw, lch, rcw, rch, pPadM);
      points.push(`${toX((li + w / 2) * 1000)},${toY((y + h / 2) * 1000)}`);
    });

    if (sec.isTop && (angledLeft || angledRight)) {
      const { leftInner: liT } = getInnerEdgesAtY(pTop, w, h, ls + rM, rs + rM, ts + rM, bs + rM, arwL + rM, arwR + rM, angledLeft, angledRight, lcw, lch, rcw, rch, pPadM);
      const { rightInner: riT } = getInnerEdgesAtY(pTop, w, h, ls + rM, rs + rM, ts + rM, bs + rM, arwL + rM, arwR + rM, angledLeft, angledRight, lcw, lch, rcw, rch, pPadM);
      const roof = createRoofPoints(riT, liT, ts + rM + pPadM, arwL + rM + pPadM, arwR + rM + pPadM, w, h, angledLeft, angledRight, lcw, lch, rcw, rch);
      roof.reverse().forEach(pt => {
        points.push(`${toX((pt.x + w / 2) * 1000)},${toY((pt.y + h / 2) * 1000)}`);
      });
    }

    [...uniqueYSamples].reverse().forEach(y => {
      const { rightInner: ri } = getInnerEdgesAtY(y, w, h, ls + rM, rs + rM, ts + rM, bs + rM, arwL + rM, arwR + rM, angledLeft, angledRight, lcw, lch, rcw, rch, pPadM);
      points.push(`${toX((ri + w / 2) * 1000)},${toY((y + h / 2) * 1000)}`);
    });

    return points;
  };

  const renderPanels = () => {
    if (panelType === "NONE" || holeSections.length === 0) return null;
    const pPadM = 0;
    // FRONT: panel fills to frame opening (stile). BACK: panel extends to rebate edge.
    const rM = isBack ? -(rebateWidthMm / 1000) : 0;

    return holeSections.map((sec, idx) => {
      const points = getPanelPoints(sec, pPadM, rM);
      if (points.length === 0) return null;

      const panelHeightMm = Math.round((sec.top - sec.bottom) * 1000);
      const textY = (sec.top + sec.bottom) / 2;

      return (
        <g key={`panel-group-${idx}`}>
          <polygon
            key={`panel-sec-${idx}`}
            points={points.join(" ")}
            fill={panelFillColor}
            stroke="none"
          />
          {showDimensions && panelHeightMm > 30 && (
            <text
              transform={`translate(${toX(width / 2)}, ${toY((textY + h / 2) * 1000)}) ${isBack ? "scale(-1, 1)" : ""}`}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={dimensionColor}
              fontSize="12"
              fontFamily="Arial, sans-serif"
              fontWeight="600"
              opacity={0.6}
            >
              {panelHeightMm}mm
            </text>
          )}
        </g>
      );
    });
  };

  const renderReededLines = () => {
    if (panelType !== "REEDED_19MM" || holeSections.length === 0) return null;

    const reedSpacingMm = 12;
    const reedStrokeWidth = 0.4;
    const pPadM = 0;
    const rM = isBack ? -(rebateWidthMm / 1000) : 0;

    const result: JSX.Element[] = [];

    holeSections.forEach((sec, secIdx) => {
      const pBottom = sec.bottom + rM + pPadM;
      const pTop = sec.top - rM - pPadM;
      if (pTop <= pBottom) return;

      const points = getPanelPoints(sec, pPadM, rM);
      if (points.length === 0) return;

      const { leftInner: liB, rightInner: riB } = getInnerEdgesAtY(pBottom, w, h, ls + rM, rs + rM, ts + rM, bs + rM, arwL + rM, arwR + rM, angledLeft, angledRight, lcw, lch, rcw, rch, pPadM);
      const leftMm = (liB + w / 2) * 1000;
      const rightMm = (riB + w / 2) * 1000;
      const spanMm = rightMm - leftMm;
      if (spanMm <= 0) return;

      const count = Math.max(2, Math.round(spanMm / reedSpacingMm));
      const step = spanMm / count;
      const clipId = `reed-clip-${secIdx}-${isBack ? "back" : "front"}`;

      const lines: JSX.Element[] = [];
      for (let i = 0; i <= count; i++) {
        const xMm = leftMm + step * i;
        lines.push(
          <line
            key={`reed-${secIdx}-${i}`}
            x1={toX(xMm)} y1={toY((pBottom + h / 2) * 1000)}
            x2={toX(xMm)} y2={toY((pTop + h / 2) * 1000 + 100)}
            stroke={strokeColor}
            strokeWidth={reedStrokeWidth}
            opacity={0.4}
          />
        );
      }

      result.push(
        <g key={`reed-group-${secIdx}`}>
          <defs>
            <clipPath id={clipId}>
              <polygon points={points.join(" ")} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`}>
            {lines}
          </g>
        </g>
      );
    });

    return result;
  };

  const renderHinges = () => {
    if (!hingeDrilling || hinges.length === 0) return null;
    const cupRadiusMm = HINGE_CUP_DIAMETER_MM / 2;
    const cupRadiusSvg = cupRadiusMm * scale;

    // Sort hinges by position from top for labeling
    const topHinges = hinges.filter(h => h.reference === "TOP").sort((a, b) => a.positionMm - b.positionMm);
    const bottomHinges = hinges.filter(h => h.reference === "BOTTOM").sort((a, b) => a.positionMm - b.positionMm);



    // In back view, the door geometry is mirrored, so left angle appears on right and vice versa.
    // When clamping hinge positions (rendered outside the mirror group), we need to swap angle references.
    const effectiveAngledLeft = isBack ? angledRight : angledLeft;
    const effectiveAngledRight = isBack ? angledLeft : angledRight;
    const effectiveLeftCutoutW = isBack ? rightTriangleCutoutWidth : leftTriangleCutoutWidth;
    const effectiveLeftCutoutH = isBack ? rightTriangleCutoutHeight : leftTriangleCutoutHeight;
    const effectiveRightCutoutW = isBack ? leftTriangleCutoutWidth : rightTriangleCutoutWidth;
    const effectiveRightCutoutH = isBack ? leftTriangleCutoutHeight : rightTriangleCutoutHeight;

    return hinges.map((hinge) => {
      const hingeSide = hinge.side;
      // When showing back view, we mirror the horizontal position
      const effectiveSide = isBack ? (hingeSide === "LEFT" ? "RIGHT" : "LEFT") : hingeSide;
      let xCenter = effectiveSide === "LEFT" ? HINGE_CENTER_OFFSET_MM : width - HINGE_CENTER_OFFSET_MM;
      let angleCutoutH = 0;
      if (hingeSide === "LEFT" && angledLeft) angleCutoutH = leftTriangleCutoutHeight;
      else if (hingeSide === "RIGHT" && angledRight) angleCutoutH = rightTriangleCutoutHeight;

      const yCenter = hinge.reference === "BOTTOM"
        ? hinge.positionMm
        : height - angleCutoutH - hinge.positionMm;

      // Clamp hinge X inward if it falls outside the angled edge at this Y
      if (effectiveSide === "LEFT" && effectiveAngledLeft && effectiveLeftCutoutH > 0) {
        const heightFromTop = height - yCenter;
        if (heightFromTop < effectiveLeftCutoutH) {
          const edgeX = effectiveLeftCutoutW * (1 - heightFromTop / effectiveLeftCutoutH);
          xCenter = Math.max(xCenter, edgeX + cupRadiusMm + 2);
        }
      }
      if (effectiveSide === "RIGHT" && effectiveAngledRight && effectiveRightCutoutH > 0) {
        const heightFromTop = height - yCenter;
        if (heightFromTop < effectiveRightCutoutH) {
          const edgeX = width - effectiveRightCutoutW * (1 - heightFromTop / effectiveRightCutoutH);
          xCenter = Math.min(xCenter, edgeX - cupRadiusMm - 2);
        }
      }

      // Label: T1, T2... from top; B1, B2... from bottom
      let label: string;
      if (hinge.reference === "TOP") {
        const idx = topHinges.indexOf(hinge) + 1;
        label = `T${idx}`;
      } else {
        const idx = bottomHinges.indexOf(hinge) + 1;
        label = `B${idx}`;
      }

      const baseStrokeCol = isBack ? hingeStrokeColor : "#9ca3af";
      const dashArray = isBack ? "none" : "4 2";

      return (
        <g key={`hinge-${hinge.id}`}>
          <circle cx={toX(xCenter)} cy={toY(yCenter)} r={cupRadiusSvg} fill={isBack ? "rgba(0,0,0,0.05)" : "none"} stroke={baseStrokeCol} strokeWidth={1.5} strokeDasharray={dashArray} />
          <line x1={toX(xCenter) - 4} y1={toY(yCenter)} x2={toX(xCenter) + 4} y2={toY(yCenter)} stroke={baseStrokeCol} strokeWidth={1} strokeDasharray={dashArray} />
          <line x1={toX(xCenter)} y1={toY(yCenter) - 4} x2={toX(xCenter)} y2={toY(yCenter) + 4} stroke={baseStrokeCol} strokeWidth={1} strokeDasharray={dashArray} />
          <text
            x={effectiveSide === "LEFT" ? toX(xCenter) - cupRadiusSvg - 16 : toX(xCenter) + cupRadiusSvg + 16}
            y={toY(yCenter) + 4}
            textAnchor={effectiveSide === "LEFT" ? "end" : "start"}
            fill={baseStrokeCol} fontSize="9" fontFamily="Arial, sans-serif" fontWeight="600"
          >
            {label} — {hinge.positionMm}mm
          </text>
        </g>
      );
    });
  };

  const renderHingeSideIndicator = () => {
    if (!hingeDrilling || hinges.length === 0) return null;
    const isLeft = hinges[0].side === "LEFT";
    const effectiveIsLeft = isBack ? !isLeft : isLeft;
    // Push HINGE SIDE text out 40px to leave room for hinge text labels
    const arrowX = effectiveIsLeft ? toX(0) - 40 : toX(width) + 40;
    const midY = height / 2;
    return (
      <g>
        <text
          x={arrowX} y={toY(midY)} textAnchor="middle" dominantBaseline="middle"
          fill={hingeStrokeColor} fontSize="9" fontFamily="Arial, sans-serif" fontWeight="700" letterSpacing="1"
          transform={`rotate(-90, ${arrowX}, ${toY(midY)})`}
        >
          HINGE SIDE
        </text>
      </g>
    );
  };

  const renderDimensions = () => {
    if (!showDimensions) return null;
    // Base layout offset for furthest-out elements (total height, etc)
    const dimOffset = 65;
    const elements: JSX.Element[] = [];

    // View-aware helpers for mirroring text dimensions on back view
    const tx = (x: number) => toX(isBack ? width - x : x);
    const anchorStart = isBack ? "end" : "start";
    const anchorEnd = isBack ? "start" : "end";

    // Helper to format dimensions smartly removing trailing .00 if integer
    const formatDim = (val: number) => Number.isInteger(val) ? val.toString() : val.toFixed(2);

    elements.push(
      <g key="dim-width">
        <line x1={tx(0)} y1={toY(0) + dimOffset} x2={tx(width)} y2={toY(0) + dimOffset} stroke={dimensionColor} strokeWidth={1} />
        <line x1={tx(0)} y1={toY(0) + dimOffset - 5} x2={tx(0)} y2={toY(0) + dimOffset + 5} stroke={dimensionColor} strokeWidth={1} />
        <line x1={tx(width)} y1={toY(0) + dimOffset - 5} x2={tx(width)} y2={toY(0) + dimOffset + 5} stroke={dimensionColor} strokeWidth={1} />
        <text x={tx(width / 2)} y={toY(0) + dimOffset + 15} textAnchor="middle" fill={dimensionColor} fontSize="12" fontFamily="Arial, sans-serif" fontWeight="600">{formatDim(width)}mm</text>
      </g>
    );

    // Determine the ideal side for the overall height dimension to avoid hinges
    const hingesAreLeft = hingeDrilling && hinges.length > 0 && hinges[0].side === "LEFT";
    const dimSideIsLeft = hingeDrilling ? !hingesAreLeft : false; // Default to right if no hinges

    // Push the overall height outward to the furthest lane (dimOffset + 35) to leave room for inner segment dimensions
    const overallHeightOffset = dimOffset + 35;
    const dimXOffset = dimSideIsLeft ? -overallHeightOffset : width + overallHeightOffset;
    const dimX = tx(dimXOffset);

    // Calculate visual position dynamically for text anchoring
    const isVisuallyLeft = isBack ? !dimSideIsLeft : dimSideIsLeft;
    const hAnchor = isVisuallyLeft ? "end" : "start";
    const hTextX = dimX + (isVisuallyLeft ? -8 : 8);

    elements.push(
      <g key="dim-height">
        <line x1={dimX} y1={toY(0)} x2={dimX} y2={toY(height)} stroke={dimensionColor} strokeWidth={1} />
        <line x1={dimX - 5} y1={toY(0)} x2={dimX + 5} y2={toY(0)} stroke={dimensionColor} strokeWidth={1} />
        <line x1={dimX - 5} y1={toY(height)} x2={dimX + 5} y2={toY(height)} stroke={dimensionColor} strokeWidth={1} />
        <text x={hTextX} y={toY(height / 2)} textAnchor={hAnchor} dominantBaseline="middle" fill={dimensionColor} fontSize="12" fontFamily="Arial, sans-serif" fontWeight="600">{formatDim(height)}mm</text>
      </g>
    );

    if (panelType !== "NONE") {
      // Find the vertical center of the *straight* segment to avoid drawing dimensions across angled cuts
      const leftBorderDimY = angledLeft && leftTriangleCutoutHeight > 0
        ? (height - leftTriangleCutoutHeight) / 2
        : height / 2;

      const rightBorderDimY = angledRight && rightTriangleCutoutHeight > 0
        ? (height - rightTriangleCutoutHeight) / 2
        : height / 2;

      elements.push(
        <g key="dim-left-stile">
          <line x1={tx(0)} y1={toY(leftBorderDimY)} x2={tx(effectiveLeftStile)} y2={toY(leftBorderDimY)} stroke={borderDimColor} strokeWidth={0.7} />
          <text x={tx(effectiveLeftStile / 2)} y={toY(leftBorderDimY) - 4} textAnchor="middle" fill={borderDimColor} fontSize="9" fontFamily="Arial, sans-serif">{formatDim(effectiveLeftStile)}</text>
        </g>
      );
      elements.push(
        <g key="dim-right-stile">
          <line x1={tx(width - effectiveRightStile)} y1={toY(rightBorderDimY)} x2={tx(width)} y2={toY(rightBorderDimY)} stroke={borderDimColor} strokeWidth={0.7} />
          <text x={tx(width - effectiveRightStile / 2)} y={toY(rightBorderDimY) - 4} textAnchor="middle" fill={borderDimColor} fontSize="9" fontFamily="Arial, sans-serif">{formatDim(effectiveRightStile)}</text>
        </g>
      );
      const borderDimX = width / 2;
      elements.push(
        <g key="dim-bottom-rail">
          <line x1={tx(borderDimX)} y1={toY(0)} x2={tx(borderDimX)} y2={toY(effectiveBottomRail)} stroke={borderDimColor} strokeWidth={0.7} />
          <text x={tx(borderDimX) + 4} y={toY(effectiveBottomRail / 2)} textAnchor={anchorStart} dominantBaseline="middle" fill={borderDimColor} fontSize="9" fontFamily="Arial, sans-serif">{formatDim(effectiveBottomRail)}</text>
        </g>
      );
      if (!angledLeft && !angledRight) {
        elements.push(
          <g key="dim-top-rail">
            <line x1={tx(borderDimX)} y1={toY(height - effectiveTopRail)} x2={tx(borderDimX)} y2={toY(height)} stroke={borderDimColor} strokeWidth={0.7} />
            <text x={tx(borderDimX) + 4} y={toY(height - effectiveTopRail / 2)} textAnchor={anchorStart} dominantBaseline="middle" fill={borderDimColor} fontSize="9" fontFamily="Arial, sans-serif">{formatDim(effectiveTopRail)}</text>
          </g>
        );
      }
    }

    if (angledLeft && leftTriangleCutoutHeight > 0) {
      const shortSideHeight = height - leftTriangleCutoutHeight;
      const dimLX = tx(0 - dimOffset);

      elements.push(
        <g key="dim-angle-left-short">
          <line x1={dimLX} y1={toY(0)} x2={dimLX} y2={toY(shortSideHeight)} stroke="#ea580c" strokeWidth={1} />
          <line x1={dimLX - 5} y1={toY(0)} x2={dimLX + 5} y2={toY(0)} stroke="#ea580c" strokeWidth={1} />
          <line x1={dimLX - 5} y1={toY(shortSideHeight)} x2={dimLX + 5} y2={toY(shortSideHeight)} stroke="#ea580c" strokeWidth={1} />
          <text
            x={tx(0 - (dimOffset + 6))}
            y={toY(shortSideHeight / 2)}
            textAnchor={anchorEnd}
            dominantBaseline="middle"
            fill="#ea580c" fontSize="10" fontFamily="Arial, sans-serif" fontWeight="600"
          >
            {formatDim(shortSideHeight)}mm
          </text>
        </g>
      );
      if (leftTriangleCutoutWidth > 0) {
        elements.push(
          <g key="dim-angle-left-width">
            <line x1={tx(0)} y1={toY(height) - dimOffset} x2={tx(leftTriangleCutoutWidth)} y2={toY(height) - dimOffset} stroke="#ea580c" strokeWidth={1} />
            <text x={tx(leftTriangleCutoutWidth / 2)} y={toY(height) - dimOffset - 6} textAnchor="middle" fill="#ea580c" fontSize="10" fontFamily="Arial, sans-serif" fontWeight="600">{formatDim(leftTriangleCutoutWidth)}mm</text>
          </g>
        );
        elements.push(
          <g key="dim-angle-left-degrees">
            <text x={tx(leftTriangleCutoutWidth / 3)} y={toY(height - leftTriangleCutoutHeight) - 15} textAnchor="middle" fill="#ea580c" fontSize="10" fontFamily="Arial, sans-serif" fontWeight="800">{(leftAngleDegrees || 0).toFixed(2)}°</text>
          </g>
        );
      }
    }

    if (angledRight && rightTriangleCutoutHeight > 0) {
      const shortSideHeight = height - rightTriangleCutoutHeight;
      const dimRX = tx(width + dimOffset);

      elements.push(
        <g key="dim-angle-right-short">
          <line x1={dimRX} y1={toY(0)} x2={dimRX} y2={toY(shortSideHeight)} stroke="#9333ea" strokeWidth={1} />
          <line x1={dimRX - 5} y1={toY(0)} x2={dimRX + 5} y2={toY(0)} stroke="#9333ea" strokeWidth={1} />
          <line x1={dimRX - 5} y1={toY(shortSideHeight)} x2={dimRX + 5} y2={toY(shortSideHeight)} stroke="#9333ea" strokeWidth={1} />
          <text
            x={tx(width + dimOffset + 6)}
            y={toY(shortSideHeight / 2)}
            textAnchor={anchorStart}
            dominantBaseline="middle"
            fill="#9333ea" fontSize="10" fontFamily="Arial, sans-serif" fontWeight="600"
          >
            {formatDim(shortSideHeight)}mm
          </text>
        </g>
      );
      if (rightTriangleCutoutWidth > 0) {
        elements.push(
          <g key="dim-angle-right-width">
            <line x1={tx(width - rightTriangleCutoutWidth)} y1={toY(height) - dimOffset} x2={tx(width)} y2={toY(height) - dimOffset} stroke="#9333ea" strokeWidth={1} />
            <text x={tx(width - rightTriangleCutoutWidth / 2)} y={toY(height) - dimOffset - 6} textAnchor="middle" fill="#9333ea" fontSize="10" fontFamily="Arial, sans-serif" fontWeight="600">{formatDim(rightTriangleCutoutWidth)}mm</text>
          </g>
        );
        elements.push(
          <g key="dim-angle-right-degrees">
            <text x={tx(width - rightTriangleCutoutWidth / 3)} y={toY(height - rightTriangleCutoutHeight) - 15} textAnchor="middle" fill="#9333ea" fontSize="10" fontFamily="Arial, sans-serif" fontWeight="800">{(rightAngleDegrees || 0).toFixed(2)}°</text>
          </g>
        );
      }
    }

    if (panelType !== "NONE") {
      if (angledLeft && leftTriangleCutoutWidth > 0 && leftTriangleCutoutHeight > 0) {
        // Find midpoint of angled edge
        const x1 = 0;
        const y1 = height - leftTriangleCutoutHeight;
        const x2 = leftTriangleCutoutWidth;
        const y2 = height;
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;

        // Normal vector for offset (perpendicular to angle)
        const angleRad = (leftAngleDegrees * Math.PI) / 180;
        const nx = Math.cos(angleRad + Math.PI / 2);
        const ny = Math.sin(angleRad + Math.PI / 2); // Y is up for geometry

        const dimDist = 20; // Offset for dimension line
        const ax = mx + nx * dimDist;
        const ay = my + ny * dimDist;

        elements.push(
          <g key="dim-angled-rail-left">
            {/* Dimension line connecting the ticks */}
            <line
              x1={tx(ax - nx * 10)} y1={toY(ay - ny * 10)}
              x2={tx(ax + nx * 10)} y2={toY(ay + ny * 10)}
              stroke={borderDimColor} strokeWidth={0.7} strokeOpacity={0.5}
            />
            {/* Ticks/Brackets */}
            <line
              x1={tx(mx + nx * (dimDist - 5))} y1={toY(my + ny * (dimDist - 5))}
              x2={tx(mx + nx * (dimDist + 5))} y2={toY(my + ny * (dimDist + 5))}
              stroke={borderDimColor} strokeWidth={1.5}
            />
            {/* Inner Tick for the actual rail edge */}
            <circle cx={tx(mx)} cy={toY(my)} r="1.5" fill={borderDimColor} />

            {/* Value (rotated) */}
            <text
              x={tx(ax)} y={toY(ay)} textAnchor="middle" fill={borderDimColor} fontSize="10" fontFamily="Arial, sans-serif" fontWeight="900"
              transform={`rotate(${isBack ? (leftAngleDegrees || 0) : -(leftAngleDegrees || 0)}, ${tx(ax)}, ${toY(ay)})`}
              dy="-4"
            >
              {leftAngledRailWidth}mm
            </text>
          </g>
        );
      }
      if (angledRight && rightTriangleCutoutWidth > 0 && rightTriangleCutoutHeight > 0) {
        const x1 = width - rightTriangleCutoutWidth;
        const y1 = height;
        const x2 = width;
        const y2 = height - rightTriangleCutoutHeight;
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;

        const angleRad = (rightAngleDegrees * Math.PI) / 180;
        const nx = -Math.cos(angleRad - Math.PI / 2); // Mirror for right side
        const ny = Math.sin(angleRad - Math.PI / 2);

        const dimDist = 20;
        const ax = mx + nx * dimDist;
        const ay = my + ny * dimDist;

        elements.push(
          <g key="dim-angled-rail-right">
            <line
              x1={tx(ax - nx * 10)} y1={toY(ay - ny * 10)}
              x2={tx(ax + nx * 10)} y2={toY(ay + ny * 10)}
              stroke={borderDimColor} strokeWidth={0.7} strokeOpacity={0.5}
            />
            <line
              x1={tx(mx + nx * (dimDist - 5))} y1={toY(my + ny * (dimDist - 5))}
              x2={tx(mx + nx * (dimDist + 5))} y2={toY(my + ny * (dimDist + 5))}
              stroke={borderDimColor} strokeWidth={1.5}
            />
            <circle cx={tx(mx)} cy={toY(my)} r="1.5" fill={borderDimColor} />
            <text
              x={tx(ax)} y={toY(ay)} textAnchor="middle" fill={borderDimColor} fontSize="10" fontFamily="Arial, sans-serif" fontWeight="900"
              transform={`rotate(${isBack ? -(rightAngleDegrees || 0) : (rightAngleDegrees || 0)}, ${tx(ax)}, ${toY(ay)})`}
              dy="-4"
            >
              {rightAngledRailWidth}mm
            </text>
          </g>
        );
      }
    }

    return elements;
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-white p-4">
      <svg
        viewBox={`0 0 ${maxWidth} ${maxHeight}`}
        className="max-w-full max-h-full"
        style={{ width: "100%", height: "100%" }}
      >


        <g transform={mirrorTransform}>
          <polygon
            points={getDoorOutline()}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={2}
          />

          {renderPanels()}
          {renderReededLines()}
          {renderFrameLines()}
          {renderMidRails()}
        </g>

        {/* Hinges rendered outside mirror group so labels stay readable */}
        {renderHinges()}

        {/* Dimensions and labels stay un-mirrored so text reads correctly */}
        {renderDimensions()}
        {renderHingeSideIndicator()}

        {/* Info text at bottom */}
        <text
          x={maxWidth / 2}
          y={maxHeight - 8}
          textAnchor="middle"
          fill="#999"
          fontSize="10"
          fontFamily="Arial, sans-serif"
        >
          {width}mm × {height}mm | {panelType === "NONE" ? "Slab" : panelType.replace(/_/g, " ")}
        </text>
      </svg>
    </div>
  );
}
