import { useDoorConfig, HINGE_CUP_DIAMETER_MM, HINGE_CENTER_OFFSET_MM } from "@/lib/stores/useDoorConfig";
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
}

export function Door2D({ face = "front" }: Door2DProps) {
  const config = useDoorConfig();

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
    angledRailWidth,
    customBorders,
    borderWidth,
    leftAngleDegrees,
    rightAngleDegrees,
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

  const scaleX = (maxWidth - padding * 2) / width;
  const scaleY = (maxHeight - padding * 2) / height;
  const scale = Math.min(scaleX, scaleY);

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
  const arw = (config.angledRailWidth ?? 90) / 1000;
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

    // Left stile line
    lines.push(
      <line key="left-stile"
        x1={toX(effectiveLeftStile)} y1={toY(effectiveBottomRail)}
        x2={toX(effectiveLeftStile)} y2={toY(height - effectiveTopRail)}
        stroke={frameStroke} strokeWidth={frameStrokeWidth} strokeDasharray={frameDash}
      />
    );

    // Right stile line
    lines.push(
      <line key="right-stile"
        x1={toX(width - effectiveRightStile)} y1={toY(effectiveBottomRail)}
        x2={toX(width - effectiveRightStile)} y2={toY(height - effectiveTopRail)}
        stroke={frameStroke} strokeWidth={frameStrokeWidth} strokeDasharray={frameDash}
      />
    );

    // Bottom rail line
    lines.push(
      <line key="bottom-rail"
        x1={toX(effectiveLeftStile)} y1={toY(effectiveBottomRail)}
        x2={toX(width - effectiveRightStile)} y2={toY(effectiveBottomRail)}
        stroke={frameStroke} strokeWidth={frameStrokeWidth} strokeDasharray={frameDash}
      />
    );

    // Top rail line (handle angled)
    if (!angledLeft && !angledRight) {
      lines.push(
        <line key="top-rail"
          x1={toX(effectiveLeftStile)} y1={toY(height - effectiveTopRail)}
          x2={toX(width - effectiveRightStile)} y2={toY(height - effectiveTopRail)}
          stroke={frameStroke} strokeWidth={frameStrokeWidth} strokeDasharray={frameDash}
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

      // Calculate angled ends using inner edges (respecting angled rails)
      const { leftInner: xLeftB, rightInner: xRightB } = getInnerEdgesAtY(
        yBottomM, w, h, ls, rs, ts, bs, arw,
        angledLeft, angledRight, lcw, lch, rcw, rch
      );

      const { leftInner: xLeftT, rightInner: xRightT } = getInnerEdgesAtY(
        yTopM, w, h, ls, rs, ts, bs, arw,
        angledLeft, angledRight, lcw, lch, rcw, rch
      );

      // Convert back to door-relative mm for toX/toY
      const pts = [
        `${toX((xLeftB + w / 2) * 1000)},${toY((yBottomM + h / 2) * 1000)}`,
        `${toX((xLeftT + w / 2) * 1000)},${toY((yTopM + h / 2) * 1000)}`,
        `${toX((xRightT + w / 2) * 1000)},${toY((yTopM + h / 2) * 1000)}`,
        `${toX((xRightB + w / 2) * 1000)},${toY((yBottomM + h / 2) * 1000)}`,
      ].join(" ");

      return (
        <polygon
          key={rail.id}
          points={pts}
          fill={railFillColor}
          stroke={strokeColor}
          strokeWidth={1}
        />
      );
    });
  };

  const renderPanels = () => {
    if (panelType === "NONE" || holeSections.length === 0) return null;

    const panels: JSX.Element[] = [];
    const panelPadding = 15; // mm
    const pPadM = panelPadding / 1000;

    holeSections.forEach((sec, idx) => {
      const secBottom = sec.bottom;
      const secTop = sec.top;

      // Get inner boundaries at top and bottom of this section
      const { leftInner: liB, rightInner: riB } = getInnerEdgesAtY(secBottom, w, h, ls, rs, ts, bs, arw, angledLeft, angledRight, lcw, lch, rcw, rch);
      const { leftInner: liT, rightInner: riT } = getInnerEdgesAtY(secTop, w, h, ls, rs, ts, bs, arw, angledLeft, angledRight, lcw, lch, rcw, rch);

      // Apply internal padding
      const pBottom = secBottom + pPadM;
      const pTop = secTop - pPadM;
      if (pTop <= pBottom) return;

      const pLeftB = liB + pPadM;
      const pRightB = riB - pPadM;
      const pLeftT = liT + pPadM;
      const pRightT = riT - pPadM;

      let points: string[] = [];
      points.push(`${toX((pLeftB + w / 2) * 1000)},${toY((pBottom + h / 2) * 1000)}`);

      if (sec.isTop && (angledLeft || angledRight)) {
        // Use createRoofPoints for the top panel's angled edge
        const roof = createRoofPoints(pRightB, pLeftB, ts + pPadM, arw + pPadM, w, h, angledLeft, angledRight, lcw, lch, rcw, rch);
        // Roof points are in door-centered coordinates
        roof.reverse().forEach(pt => {
          points.push(`${toX((pt.x + w / 2) * 1000)},${toY((pt.y + h / 2) * 1000)}`);
        });
      } else {
        points.push(`${toX((pLeftT + w / 2) * 1000)},${toY((pTop + h / 2) * 1000)}`);
        points.push(`${toX((pRightT + w / 2) * 1000)},${toY((pTop + h / 2) * 1000)}`);
      }

      points.push(`${toX((pRightB + w / 2) * 1000)},${toY((pBottom + h / 2) * 1000)}`);

      panels.push(
        <polygon
          key={`panel-sec-${idx}`}
          points={points.join(" ")}
          fill={panelFillColor}
          stroke={strokeColor}
          strokeWidth={1}
        />
      );
    });

    return panels;
  };

  const renderHinges = () => {
    if (!hingeDrilling || hinges.length === 0) return null;

    const cupRadiusMm = HINGE_CUP_DIAMETER_MM / 2;
    const cupRadiusSvg = cupRadiusMm * scale;

    return hinges.map((hinge) => {
      const hingeSide = hinge.side;
      const xCenter = hingeSide === "LEFT"
        ? HINGE_CENTER_OFFSET_MM
        : width - HINGE_CENTER_OFFSET_MM;
      const yCenter = hinge.positionFromBottomMm;

      return (
        <g key={`hinge-${hinge.id}`}>
          <circle
            cx={toX(xCenter)}
            cy={toY(yCenter)}
            r={cupRadiusSvg}
            fill="none"
            stroke={hingeStrokeColor}
            strokeWidth={1.5}
            strokeDasharray="4 2"
          />
          <line
            x1={toX(xCenter) - 4} y1={toY(yCenter)}
            x2={toX(xCenter) + 4} y2={toY(yCenter)}
            stroke={hingeStrokeColor} strokeWidth={1}
          />
          <line
            x1={toX(xCenter)} y1={toY(yCenter) - 4}
            x2={toX(xCenter)} y2={toY(yCenter) + 4}
            stroke={hingeStrokeColor} strokeWidth={1}
          />
          <text
            x={hingeSide === "LEFT" ? toX(xCenter) + cupRadiusSvg + 6 : toX(xCenter) - cupRadiusSvg - 6}
            y={toY(yCenter) + 4}
            textAnchor={hingeSide === "LEFT" ? "start" : "end"}
            fill={hingeStrokeColor}
            fontSize="9"
            fontFamily="Arial, sans-serif"
            fontWeight="600"
          >
            {yCenter}mm
          </text>
        </g>
      );
    });
  };

  const renderHingeSideIndicator = () => {
    if (!hingeDrilling || hinges.length === 0) return null;

    const side = hinges[0].side;
    const isLeft = side === "LEFT";
    const edgeX = isLeft ? 0 : width;
    const midY = height / 2;
    const arrowX = isLeft ? toX(edgeX) - 14 : toX(edgeX) + 14;

    return (
      <g>
        <text
          x={arrowX}
          y={toY(midY)}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={hingeStrokeColor}
          fontSize="9"
          fontFamily="Arial, sans-serif"
          fontWeight="700"
          letterSpacing="1"
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

    // Width dimension (bottom)
    elements.push(
      <g key="dim-width">
        <line x1={toX(0)} y1={toY(0) + dimOffset} x2={toX(width)} y2={toY(0) + dimOffset}
          stroke={dimensionColor} strokeWidth={1} />
        <line x1={toX(0)} y1={toY(0) + dimOffset - 5} x2={toX(0)} y2={toY(0) + dimOffset + 5}
          stroke={dimensionColor} strokeWidth={1} />
        <line x1={toX(width)} y1={toY(0) + dimOffset - 5} x2={toX(width)} y2={toY(0) + dimOffset + 5}
          stroke={dimensionColor} strokeWidth={1} />
        <text x={toX(width / 2)} y={toY(0) + dimOffset + 15}
          textAnchor="middle" fill={dimensionColor} fontSize="12" fontFamily="Arial, sans-serif" fontWeight="600">
          {width}mm
        </text>
      </g>
    );

    // Height dimension (right side - full height)
    elements.push(
      <g key="dim-height">
        <line x1={toX(width) + dimOffset} y1={toY(0)} x2={toX(width) + dimOffset} y2={toY(height)}
          stroke={dimensionColor} strokeWidth={1} />
        <line x1={toX(width) + dimOffset - 5} y1={toY(0)} x2={toX(width) + dimOffset + 5} y2={toY(0)}
          stroke={dimensionColor} strokeWidth={1} />
        <line x1={toX(width) + dimOffset - 5} y1={toY(height)} x2={toX(width) + dimOffset + 5} y2={toY(height)}
          stroke={dimensionColor} strokeWidth={1} />
        <text x={toX(width) + dimOffset + 8} y={toY(height / 2)}
          textAnchor="start" dominantBaseline="middle" fill={dimensionColor}
          fontSize="12" fontFamily="Arial, sans-serif" fontWeight="600">
          {height}mm
        </text>
      </g>
    );

    // Border dimensions (inside the door, blue color for clarity)
    if (panelType !== "NONE") {
      // Left stile dimension
      const borderDimY = height / 2;
      elements.push(
        <g key="dim-left-stile">
          <line x1={toX(0)} y1={toY(borderDimY)} x2={toX(effectiveLeftStile)} y2={toY(borderDimY)}
            stroke={borderDimColor} strokeWidth={0.7} />
          <text x={toX(effectiveLeftStile / 2)} y={toY(borderDimY) - 4}
            textAnchor="middle" fill={borderDimColor} fontSize="9" fontFamily="Arial, sans-serif">
            {effectiveLeftStile}
          </text>
        </g>
      );

      // Right stile dimension
      elements.push(
        <g key="dim-right-stile">
          <line x1={toX(width - effectiveRightStile)} y1={toY(borderDimY)} x2={toX(width)} y2={toY(borderDimY)}
            stroke={borderDimColor} strokeWidth={0.7} />
          <text x={toX(width - effectiveRightStile / 2)} y={toY(borderDimY) - 4}
            textAnchor="middle" fill={borderDimColor} fontSize="9" fontFamily="Arial, sans-serif">
            {effectiveRightStile}
          </text>
        </g>
      );

      // Bottom rail dimension
      const borderDimX = width / 2;
      elements.push(
        <g key="dim-bottom-rail">
          <line x1={toX(borderDimX)} y1={toY(0)} x2={toX(borderDimX)} y2={toY(effectiveBottomRail)}
            stroke={borderDimColor} strokeWidth={0.7} />
          <text x={toX(borderDimX) + 4} y={toY(effectiveBottomRail / 2)}
            textAnchor="start" dominantBaseline="middle" fill={borderDimColor}
            fontSize="9" fontFamily="Arial, sans-serif">
            {effectiveBottomRail}
          </text>
        </g>
      );

      // Top rail dimension (only if not angled at this point)
      if (!angledLeft && !angledRight) {
        elements.push(
          <g key="dim-top-rail">
            <line x1={toX(borderDimX)} y1={toY(height - effectiveTopRail)} x2={toX(borderDimX)} y2={toY(height)}
              stroke={borderDimColor} strokeWidth={0.7} />
            <text x={toX(borderDimX) + 4} y={toY(height - effectiveTopRail / 2)}
              textAnchor="start" dominantBaseline="middle" fill={borderDimColor}
              fontSize="9" fontFamily="Arial, sans-serif">
              {effectiveTopRail}
            </text>
          </g>
        );
      }
    }

    // Angled dimensions
    if (angledLeft && leftTriangleCutoutHeight > 0) {
      const shortSideHeight = height - leftTriangleCutoutHeight;
      // Short side height from bottom (left side)
      elements.push(
        <g key="dim-angle-left-short">
          <line x1={toX(0) - dimOffset} y1={toY(0)} x2={toX(0) - dimOffset} y2={toY(shortSideHeight)}
            stroke="#ea580c" strokeWidth={1} />
          <line x1={toX(0) - dimOffset - 4} y1={toY(0)} x2={toX(0) - dimOffset + 4} y2={toY(0)}
            stroke="#ea580c" strokeWidth={1} />
          <line x1={toX(0) - dimOffset - 4} y1={toY(shortSideHeight)} x2={toX(0) - dimOffset + 4} y2={toY(shortSideHeight)}
            stroke="#ea580c" strokeWidth={1} />
          <text x={toX(0) - dimOffset - 6} y={toY(shortSideHeight / 2)}
            textAnchor="end" dominantBaseline="middle" fill="#ea580c"
            fontSize="10" fontFamily="Arial, sans-serif" fontWeight="600">
            {shortSideHeight}mm
          </text>
        </g>
      );
    }

    if (angledRight && rightTriangleCutoutHeight > 0) {
      const shortSideHeight = height - rightTriangleCutoutHeight;
      // Short side height from bottom (right side)
      elements.push(
        <g key="dim-angle-right-short">
          <line x1={toX(width) + dimOffset + 25} y1={toY(0)} x2={toX(width) + dimOffset + 25} y2={toY(shortSideHeight)}
            stroke="#9333ea" strokeWidth={1} />
          <line x1={toX(width) + dimOffset + 21} y1={toY(0)} x2={toX(width) + dimOffset + 29} y2={toY(0)}
            stroke="#9333ea" strokeWidth={1} />
          <line x1={toX(width) + dimOffset + 21} y1={toY(shortSideHeight)} x2={toX(width) + dimOffset + 29} y2={toY(shortSideHeight)}
            stroke="#9333ea" strokeWidth={1} />
          <text x={toX(width) + dimOffset + 33} y={toY(shortSideHeight / 2)}
            textAnchor="start" dominantBaseline="middle" fill="#9333ea"
            fontSize="10" fontFamily="Arial, sans-serif" fontWeight="600">
            {shortSideHeight}mm
          </text>
        </g>
      );
    }

    // Angled Rail Width Labels
    if (panelType !== "NONE") {
      if (angledLeft && leftTriangleCutoutWidth > 0 && leftTriangleCutoutHeight > 0) {
        // Label for the left angled rail
        const midAngleX = -width / 2 + leftTriangleCutoutWidth / 2;
        const midAngleY = height - leftTriangleCutoutHeight / 2;
        // Position it slightly shifted inward from the angled edge
        elements.push(
          <g key="dim-angled-rail-left">
            <text
              x={toX(midAngleX + width / 2 + 10)}
              y={toY(midAngleY - 10)}
              textAnchor="middle"
              fill={borderDimColor}
              fontSize="9"
              fontFamily="Arial, sans-serif"
              transform={`rotate(${-leftAngleDegrees}, ${toX(midAngleX + width / 2 + 10)}, ${toY(midAngleY - 10)})`}
            >
              {angledRailWidth}
            </text>
          </g>
        );
      }

      if (angledRight && rightTriangleCutoutWidth > 0 && rightTriangleCutoutHeight > 0) {
        // Label for the right angled rail
        const midAngleX = width / 2 - rightTriangleCutoutWidth / 2;
        const midAngleY = height - rightTriangleCutoutHeight / 2;
        elements.push(
          <g key="dim-angled-rail-right">
            <text
              x={toX(midAngleX + width / 2 - 10)}
              y={toY(midAngleY - 10)}
              textAnchor="middle"
              fill={borderDimColor}
              fontSize="9"
              fontFamily="Arial, sans-serif"
              transform={`rotate(${rightAngleDegrees}, ${toX(midAngleX + width / 2 - 10)}, ${toY(midAngleY - 10)})`}
            >
              {angledRailWidth}
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

          {renderFrameLines()}
          {renderMidRails()}
          {renderPanels()}
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