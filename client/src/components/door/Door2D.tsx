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

  const strokeColor = "#44403c";
  const fillColor = "#fafaf9";
  const panelFillColor = "#e7e5e4";
  const railFillColor = "#fafaf9";
  const dimensionColor = "#78716c";
  const hingeFillColor = "#a1a1aa";
  const hingeStrokeColor = "#52525b";
  const borderDimColor = "#3b82f6"; // Blue for border dims

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

  const holeSections = getHoleSections(midRails, h, bs, ts, panelCount);

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

    // Top rail visible line (handle angled)
    if (!angledLeft && !angledRight) {
      lines.push(
        <line key="top-rail-vis"
          x1={toX(effectiveLeftStile)} y1={toY(height - effectiveTopRail)}
          x2={toX(width - effectiveRightStile)} y2={toY(height - effectiveTopRail)}
          stroke={frameStroke} strokeWidth={frameStrokeWidth} {...visibleFrameStyle}
        />
      );
    } else {
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
    const rStroke = isBack ? "#78716c" : "#a8a29e"; // More prominent if it's the solid back edge

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

    if (!angledLeft && !angledRight) {
      lines.push(
        <line key="top-rail-rebate"
          x1={toX(rL)} y1={toY(rT)} x2={toX(rR)} y2={toY(rT)}
          stroke={rStroke} strokeWidth={frameStrokeWidth} {...rebateStyle}
        />
      );
    } else {
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

    return midRails.map((rail) => {
      const railBottom = rail.positionFromBottom / 1000;
      const railTop = railBottom + rail.dimension / 1000;
      const yBottomM = -h / 2 + railBottom;
      const yTopM = -h / 2 + railTop;

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
        const { leftInner: xL } = getInnerEdgesAtY(y, w, h, ls, rs, ts, bs, arwL, arwR, angledLeft, angledRight, lcw, lch, rcw, rch);
        points.push(`${toX((xL + w / 2) * 1000)},${toY((y + h / 2) * 1000)}`);
      });
      [...uniqueYSamples].reverse().forEach(y => {
        const { rightInner: xR } = getInnerEdgesAtY(y, w, h, ls, rs, ts, bs, arwL, arwR, angledLeft, angledRight, lcw, lch, rcw, rch);
        points.push(`${toX((xR + w / 2) * 1000)},${toY((y + h / 2) * 1000)}`);
      });

      return (
        <polygon
          key={rail.id}
          points={points.join(" ")}
          fill={railFillColor}
          stroke={strokeColor}
          strokeWidth={1}
        />
      );
    });
  };

  const getPanelPoints = (sec: HoleSection, pPadM: number, rM: number) => {
    const pBottom = sec.bottom - rM + pPadM;
    const pTop = sec.top + rM - pPadM;
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
    const paddingMm = 15;
    const pPadM = paddingMm / 1000;
    const rM = (isBack ? -rebateWidthMm : 0) / 1000;

    return holeSections.map((sec, idx) => {
      const points = getPanelPoints(sec, pPadM, rM);
      if (points.length === 0) return null;
      return (
        <polygon
          key={`panel-sec-${idx}`}
          points={points.join(" ")}
          fill={panelFillColor}
          stroke={strokeColor}
          strokeWidth={1}
        />
      );
    });
  };

  const renderReededLines = () => {
    if (panelType !== "REEDED_19MM" || holeSections.length === 0) return null;

    const reedSpacingMm = 12;
    const reedStroke = "#a8a29e";
    const reedStrokeWidth = 0.4;
    const pPadM = 15 / 1000;
    const rM = (isBack ? -rebateWidthMm : 0) / 1000;

    const result: JSX.Element[] = [];

    holeSections.forEach((sec, secIdx) => {
      const pBottom = sec.bottom - rM + pPadM;
      const pTop = sec.top + rM - pPadM;
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
            stroke={reedStroke}
            strokeWidth={reedStrokeWidth}
            opacity={0.6}
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

    return hinges.map((hinge) => {
      const hingeSide = hinge.side;
      const xCenter = hingeSide === "LEFT" ? HINGE_CENTER_OFFSET_MM : width - HINGE_CENTER_OFFSET_MM;
      const yCenter = hinge.reference === "BOTTOM" ? hinge.positionMm : height - hinge.positionMm;

      return (
        <g key={`hinge-${hinge.id}`}>
          <circle cx={toX(xCenter)} cy={toY(yCenter)} r={cupRadiusSvg} fill="none" stroke={hingeStrokeColor} strokeWidth={1.5} strokeDasharray="4 2" />
          <line x1={toX(xCenter) - 4} y1={toY(yCenter)} x2={toX(xCenter) + 4} y2={toY(yCenter)} stroke={hingeStrokeColor} strokeWidth={1} />
          <line x1={toX(xCenter)} y1={toY(yCenter) - 4} x2={toX(xCenter)} y2={toY(yCenter) + 4} stroke={hingeStrokeColor} strokeWidth={1} />
          <text
            x={hingeSide === "LEFT" ? toX(xCenter) + cupRadiusSvg + 6 : toX(xCenter) - cupRadiusSvg - 6}
            y={toY(yCenter) + 4}
            textAnchor={hingeSide === "LEFT" ? "start" : "end"}
            fill={hingeStrokeColor} fontSize="9" fontFamily="Arial, sans-serif" fontWeight="600"
          >
            {hinge.reference === "BOTTOM" ? `B — ${hinge.positionMm}` : `T — ${hinge.positionMm}`}
          </text>
        </g>
      );
    });
  };

  const renderHingeSideIndicator = () => {
    if (!hingeDrilling || hinges.length === 0) return null;
    const isLeft = hinges[0].side === "LEFT";
    const arrowX = isLeft ? toX(0) - 14 : toX(width) + 14;
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
    const dimOffset = 25;
    const elements: JSX.Element[] = [];

    elements.push(
      <g key="dim-width">
        <line x1={toX(0)} y1={toY(0) + dimOffset} x2={toX(width)} y2={toY(0) + dimOffset} stroke={dimensionColor} strokeWidth={1} />
        <line x1={toX(0)} y1={toY(0) + dimOffset - 5} x2={toX(0)} y2={toY(0) + dimOffset + 5} stroke={dimensionColor} strokeWidth={1} />
        <line x1={toX(width)} y1={toY(0) + dimOffset - 5} x2={toX(width)} y2={toY(0) + dimOffset + 5} stroke={dimensionColor} strokeWidth={1} />
        <text x={toX(width / 2)} y={toY(0) + dimOffset + 15} textAnchor="middle" fill={dimensionColor} fontSize="12" fontFamily="Arial, sans-serif" fontWeight="600">{width}mm</text>
      </g>
    );

    elements.push(
      <g key="dim-height">
        <line x1={toX(width) + dimOffset} y1={toY(0)} x2={toX(width) + dimOffset} y2={toY(height)} stroke={dimensionColor} strokeWidth={1} />
        <line x1={toX(width) + dimOffset - 5} y1={toY(0)} x2={toX(width) + dimOffset + 5} y2={toY(0)} stroke={dimensionColor} strokeWidth={1} />
        <line x1={toX(width) + dimOffset - 5} y1={toY(height)} x2={toX(width) + dimOffset + 5} y2={toY(height)} stroke={dimensionColor} strokeWidth={1} />
        <text x={toX(width) + dimOffset + 8} y={toY(height / 2)} textAnchor="start" dominantBaseline="middle" fill={dimensionColor} fontSize="12" fontFamily="Arial, sans-serif" fontWeight="600">{height}mm</text>
      </g>
    );

    if (panelType !== "NONE") {
      const borderDimY = height / 2;
      elements.push(
        <g key="dim-left-stile">
          <line x1={toX(0)} y1={toY(borderDimY)} x2={toX(effectiveLeftStile)} y2={toY(borderDimY)} stroke={borderDimColor} strokeWidth={0.7} />
          <text x={toX(effectiveLeftStile / 2)} y={toY(borderDimY) - 4} textAnchor="middle" fill={borderDimColor} fontSize="9" fontFamily="Arial, sans-serif">{effectiveLeftStile}</text>
        </g>
      );
      elements.push(
        <g key="dim-right-stile">
          <line x1={toX(width - effectiveRightStile)} y1={toY(borderDimY)} x2={toX(width)} y2={toY(borderDimY)} stroke={borderDimColor} strokeWidth={0.7} />
          <text x={toX(width - effectiveRightStile / 2)} y={toY(borderDimY) - 4} textAnchor="middle" fill={borderDimColor} fontSize="9" fontFamily="Arial, sans-serif">{effectiveRightStile}</text>
        </g>
      );
      const borderDimX = width / 2;
      elements.push(
        <g key="dim-bottom-rail">
          <line x1={toX(borderDimX)} y1={toY(0)} x2={toX(borderDimX)} y2={toY(effectiveBottomRail)} stroke={borderDimColor} strokeWidth={0.7} />
          <text x={toX(borderDimX) + 4} y={toY(effectiveBottomRail / 2)} textAnchor="start" dominantBaseline="middle" fill={borderDimColor} fontSize="9" fontFamily="Arial, sans-serif">{effectiveBottomRail}</text>
        </g>
      );
      if (!angledLeft && !angledRight) {
        elements.push(
          <g key="dim-top-rail">
            <line x1={toX(borderDimX)} y1={toY(height - effectiveTopRail)} x2={toX(borderDimX)} y2={toY(height)} stroke={borderDimColor} strokeWidth={0.7} />
            <text x={toX(borderDimX) + 4} y={toY(height - effectiveTopRail / 2)} textAnchor="start" dominantBaseline="middle" fill={borderDimColor} fontSize="9" fontFamily="Arial, sans-serif">{effectiveTopRail}</text>
          </g>
        );
      }
    }

    if (angledLeft && leftTriangleCutoutHeight > 0) {
      const shortSideHeight = height - leftTriangleCutoutHeight;
      elements.push(
        <g key="dim-angle-left-short">
          <line x1={toX(0) - dimOffset} y1={toY(0)} x2={toX(0) - dimOffset} y2={toY(shortSideHeight)} stroke="#ea580c" strokeWidth={1} />
          <text x={toX(0) - dimOffset - 6} y={toY(shortSideHeight + leftTriangleCutoutHeight / 2)} textAnchor="end" dominantBaseline="middle" fill="#ea580c" fontSize="10" fontFamily="Arial, sans-serif" fontWeight="600">{leftTriangleCutoutHeight}mm</text>
        </g>
      );
      if (leftTriangleCutoutWidth > 0) {
        elements.push(
          <g key="dim-angle-left-width">
            <line x1={toX(0)} y1={toY(height) - dimOffset} x2={toX(leftTriangleCutoutWidth)} y2={toY(height) - dimOffset} stroke="#ea580c" strokeWidth={1} />
            <text x={toX(leftTriangleCutoutWidth / 2)} y={toY(height) - dimOffset - 6} textAnchor="middle" fill="#ea580c" fontSize="10" fontFamily="Arial, sans-serif" fontWeight="600">{leftTriangleCutoutWidth}mm</text>
          </g>
        );
        elements.push(
          <g key="dim-angle-left-degrees">
            <text x={toX(leftTriangleCutoutWidth / 3)} y={toY(height - leftTriangleCutoutHeight) - 15} textAnchor="middle" fill="#ea580c" fontSize="10" fontFamily="Arial, sans-serif" fontWeight="800">{leftAngleDegrees}°</text>
          </g>
        );
      }
    }

    if (angledRight && rightTriangleCutoutHeight > 0) {
      const shortSideHeight = height - rightTriangleCutoutHeight;
      elements.push(
        <g key="dim-angle-right-short">
          <line x1={toX(width) + dimOffset + 25} y1={toY(0)} x2={toX(width) + dimOffset + 25} y2={toY(shortSideHeight)} stroke="#9333ea" strokeWidth={1} />
          <text x={toX(width) + dimOffset + 33} y={toY(shortSideHeight + rightTriangleCutoutHeight / 2)} textAnchor="start" dominantBaseline="middle" fill="#9333ea" fontSize="10" fontFamily="Arial, sans-serif" fontWeight="600">{rightTriangleCutoutHeight}mm</text>
        </g>
      );
      if (rightTriangleCutoutWidth > 0) {
        elements.push(
          <g key="dim-angle-right-width">
            <line x1={toX(width - rightTriangleCutoutWidth)} y1={toY(height) - dimOffset} x2={toX(width)} y2={toY(height) - dimOffset} stroke="#9333ea" strokeWidth={1} />
            <text x={toX(width - rightTriangleCutoutWidth / 2)} y={toY(height) - dimOffset - 6} textAnchor="middle" fill="#9333ea" fontSize="10" fontFamily="Arial, sans-serif" fontWeight="600">{rightTriangleCutoutWidth}mm</text>
          </g>
        );
        elements.push(
          <g key="dim-angle-right-degrees">
            <text x={toX(width - rightTriangleCutoutWidth / 3)} y={toY(height - rightTriangleCutoutHeight) - 15} textAnchor="middle" fill="#9333ea" fontSize="10" fontFamily="Arial, sans-serif" fontWeight="800">{rightAngleDegrees}°</text>
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
              x1={toX(ax - nx * 10)} y1={toY(ay - ny * 10)}
              x2={toX(ax + nx * 10)} y2={toY(ay + ny * 10)}
              stroke={borderDimColor} strokeWidth={0.7} strokeOpacity={0.5}
            />
            {/* Ticks/Brackets */}
            <line
              x1={toX(mx + nx * (dimDist - 5))} y1={toY(my + ny * (dimDist - 5))}
              x2={toX(mx + nx * (dimDist + 5))} y2={toY(my + ny * (dimDist + 5))}
              stroke={borderDimColor} strokeWidth={1.5}
            />
            {/* Inner Tick for the actual rail edge */}
            <circle cx={toX(mx)} cy={toY(my)} r="1.5" fill={borderDimColor} />

            {/* Value (rotated) */}
            <text
              x={toX(ax)} y={toY(ay)} textAnchor="middle" fill={borderDimColor} fontSize="10" fontFamily="Arial, sans-serif" fontWeight="900"
              transform={`rotate(${-leftAngleDegrees}, ${toX(ax)}, ${toY(ay)})`}
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
              x1={toX(ax - nx * 10)} y1={toY(ay - ny * 10)}
              x2={toX(ax + nx * 10)} y2={toY(ay + ny * 10)}
              stroke={borderDimColor} strokeWidth={0.7} strokeOpacity={0.5}
            />
            <line
              x1={toX(mx + nx * (dimDist - 5))} y1={toY(my + ny * (dimDist - 5))}
              x2={toX(mx + nx * (dimDist + 5))} y2={toY(my + ny * (dimDist + 5))}
              stroke={borderDimColor} strokeWidth={1.5}
            />
            <circle cx={toX(mx)} cy={toY(my)} r="1.5" fill={borderDimColor} />
            <text
              x={toX(ax)} y={toY(ay)} textAnchor="middle" fill={borderDimColor} fontSize="10" fontFamily="Arial, sans-serif" fontWeight="900"
              transform={`rotate(${rightAngleDegrees}, ${toX(ax)}, ${toY(ay)})`}
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

  const faceLabel = isBack ? "BACK" : "FRONT";

  return (
    <div className="w-full h-full flex items-center justify-center bg-white p-4">
      <svg
        viewBox={`0 0 ${maxWidth} ${maxHeight}`}
        className="max-w-full max-h-full"
        style={{ width: "100%", height: "100%" }}
      >
        {/* Face label */}
        <text
          x={maxWidth / 2}
          y={16}
          textAnchor="middle"
          fill={isBack ? "#9333ea" : "#2563eb"}
          fontSize="13"
          fontFamily="Arial, sans-serif"
          fontWeight="700"
          letterSpacing="2"
        >
          {faceLabel} VIEW
        </text>

        {/* Main door group — mirrored for back view */}
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
          {renderHinges()}
        </g>

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
