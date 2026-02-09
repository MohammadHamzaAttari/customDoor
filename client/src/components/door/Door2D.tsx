import { useDoorConfig } from "@/lib/stores/useDoorConfig";

export function Door2D() {
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
  } = config;

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

  const strokeColor = "#333333";
  const fillColor = "#f5e6d3";
  const panelFillColor = "#e8dcc8";
  const railFillColor = "#d4c4a8";
  const dimensionColor = "#666666";

  const toSvgX = (x: number) => offsetX + x * scale;
  const toSvgY = (y: number) => offsetY + (height - y) * scale;

  const getDoorOutline = () => {
    const points: string[] = [];

    points.push(`${toSvgX(0)},${toSvgY(0)}`);

    if (angledLeft) {
      points.push(`${toSvgX(0)},${toSvgY(height - leftTriangleCutoutHeight)}`);
      points.push(`${toSvgX(leftTriangleCutoutWidth)},${toSvgY(height)}`);
    } else {
      points.push(`${toSvgX(0)},${toSvgY(height)}`);
    }

    if (angledRight) {
      points.push(`${toSvgX(width - rightTriangleCutoutWidth)},${toSvgY(height)}`);
      points.push(`${toSvgX(width)},${toSvgY(height - rightTriangleCutoutHeight)}`);
    } else {
      points.push(`${toSvgX(width)},${toSvgY(height)}`);
    }

    points.push(`${toSvgX(width)},${toSvgY(0)}`);

    return points.join(" ");
  };

  const renderMidRails = () => {
    if (!midRailsEnabled || midRails.length === 0) return null;

    return midRails.map((rail) => {
      const railY = rail.positionFromBottom;
      const railHeight = rail.dimension;

      return (
        <rect
          key={rail.id}
          x={toSvgX(leftStile)}
          y={toSvgY(railY + railHeight)}
          width={(width - leftStile - rightStile) * scale}
          height={railHeight * scale}
          fill={railFillColor}
          stroke={strokeColor}
          strokeWidth={1}
        />
      );
    });
  };

  const renderPanels = () => {
    if (panelType === "NONE" || panelCount === 0) return null;

    const panels: JSX.Element[] = [];
    const panelPadding = 15;
    const panelAreaWidth = width - leftStile - rightStile;
    const panelAreaHeight = height - bottomRail - topRail;

    if (panelOrientation === "vertical") {
      const panelWidth = (panelAreaWidth - panelPadding * (panelCount + 1)) / panelCount;
      const basePanelHeight = panelAreaHeight - panelPadding * 2;

      for (let i = 0; i < panelCount; i++) {
        const panelX = leftStile + panelPadding + i * (panelWidth + panelPadding);
        const panelY = bottomRail + panelPadding;

        let panelHeight = basePanelHeight;
        let hasAngledTop = false;
        let angledCutWidth = 0;
        let angledCutHeight = 0;
        let isLeftAngle = false;

        if (angledLeft && i === 0) {
          const panelTopY = panelY + basePanelHeight;
          if (panelTopY > height - leftTriangleCutoutHeight) {
            hasAngledTop = true;
            isLeftAngle = true;
            angledCutWidth = leftTriangleCutoutWidth;
            angledCutHeight = leftTriangleCutoutHeight;
          }
        }

        if (angledRight && i === panelCount - 1) {
          const panelTopY = panelY + basePanelHeight;
          if (panelTopY > height - rightTriangleCutoutHeight) {
            hasAngledTop = true;
            isLeftAngle = false;
            angledCutWidth = rightTriangleCutoutWidth;
            angledCutHeight = rightTriangleCutoutHeight;
          }
        }

        if (hasAngledTop) {
          const cutStartY = height - angledCutHeight;
          const cutRatio = angledCutWidth / angledCutHeight;
          const panelTopY = panelY + basePanelHeight;
          const overlapHeight = panelTopY - cutStartY;

          if (overlapHeight > 0) {
            const cutIntoPanel = overlapHeight * cutRatio;

            let points: string;
            if (isLeftAngle) {
              points = `${toSvgX(panelX)},${toSvgY(panelY)} ${toSvgX(panelX)},${toSvgY(cutStartY)} ${toSvgX(panelX + cutIntoPanel)},${toSvgY(panelTopY)} ${toSvgX(panelX + panelWidth)},${toSvgY(panelTopY)} ${toSvgX(panelX + panelWidth)},${toSvgY(panelY)}`;
            } else {
              points = `${toSvgX(panelX)},${toSvgY(panelY)} ${toSvgX(panelX)},${toSvgY(panelTopY)} ${toSvgX(panelX + panelWidth - cutIntoPanel)},${toSvgY(panelTopY)} ${toSvgX(panelX + panelWidth)},${toSvgY(cutStartY)} ${toSvgX(panelX + panelWidth)},${toSvgY(panelY)}`;
            }

            panels.push(
              <polygon
                key={`panel-${i}`}
                points={points}
                fill={panelFillColor}
                stroke={strokeColor}
                strokeWidth={1}
              />
            );
            continue;
          }
        }

        panels.push(
          <rect
            key={`panel-${i}`}
            x={toSvgX(panelX)}
            y={toSvgY(panelY + panelHeight)}
            width={panelWidth * scale}
            height={panelHeight * scale}
            fill={panelFillColor}
            stroke={strokeColor}
            strokeWidth={1}
            rx={2}
          />
        );
      }
    } else {
      const panelWidth = panelAreaWidth - panelPadding * 2;
      const panelHeight = (panelAreaHeight - panelPadding * (panelCount + 1)) / panelCount;

      for (let i = 0; i < panelCount; i++) {
        const panelX = leftStile + panelPadding;
        const panelY = bottomRail + panelPadding + i * (panelHeight + panelPadding);
        const isTopPanel = i === panelCount - 1;

        if (isTopPanel && (angledLeft || angledRight)) {
          const panelTopY = panelY + panelHeight;
          const panelBottomY = panelY;

          let points: string[] = [];
          points.push(`${toSvgX(panelX)},${toSvgY(panelBottomY)}`);

          if (angledLeft) {
            const cutStartY = height - leftTriangleCutoutHeight;
            if (panelTopY > cutStartY) {
              const cutRatio = leftTriangleCutoutWidth / leftTriangleCutoutHeight;
              const overlapHeight = panelTopY - cutStartY;
              const cutIntoPanel = overlapHeight * cutRatio;

              if (panelBottomY < cutStartY) {
                points.push(`${toSvgX(panelX)},${toSvgY(cutStartY)}`);
              }
              points.push(`${toSvgX(panelX + cutIntoPanel)},${toSvgY(panelTopY)}`);
            } else {
              points.push(`${toSvgX(panelX)},${toSvgY(panelTopY)}`);
            }
          } else {
            points.push(`${toSvgX(panelX)},${toSvgY(panelTopY)}`);
          }

          if (angledRight) {
            const cutStartY = height - rightTriangleCutoutHeight;
            if (panelTopY > cutStartY) {
              const cutRatio = rightTriangleCutoutWidth / rightTriangleCutoutHeight;
              const overlapHeight = panelTopY - cutStartY;
              const cutIntoPanel = overlapHeight * cutRatio;

              points.push(`${toSvgX(panelX + panelWidth - cutIntoPanel)},${toSvgY(panelTopY)}`);
              if (panelBottomY < cutStartY) {
                points.push(`${toSvgX(panelX + panelWidth)},${toSvgY(cutStartY)}`);
              }
            } else {
              points.push(`${toSvgX(panelX + panelWidth)},${toSvgY(panelTopY)}`);
            }
          } else {
            points.push(`${toSvgX(panelX + panelWidth)},${toSvgY(panelTopY)}`);
          }

          points.push(`${toSvgX(panelX + panelWidth)},${toSvgY(panelBottomY)}`);

          panels.push(
            <polygon
              key={`panel-${i}`}
              points={points.join(" ")}
              fill={panelFillColor}
              stroke={strokeColor}
              strokeWidth={1}
            />
          );
        } else {
          panels.push(
            <rect
              key={`panel-${i}`}
              x={toSvgX(panelX)}
              y={toSvgY(panelY + panelHeight)}
              width={panelWidth * scale}
              height={panelHeight * scale}
              fill={panelFillColor}
              stroke={strokeColor}
              strokeWidth={1}
              rx={2}
            />
          );
        }
      }
    }

    return panels;
  };

  const renderDimensions = () => {
    if (!showDimensions) return null;

    const dimOffset = 20;

    return (
      <>
        <line
          x1={toSvgX(0)}
          y1={toSvgY(0) + dimOffset}
          x2={toSvgX(width)}
          y2={toSvgY(0) + dimOffset}
          stroke={dimensionColor}
          strokeWidth={1}
        />
        <line
          x1={toSvgX(0)}
          y1={toSvgY(0) + dimOffset - 5}
          x2={toSvgX(0)}
          y2={toSvgY(0) + dimOffset + 5}
          stroke={dimensionColor}
          strokeWidth={1}
        />
        <line
          x1={toSvgX(width)}
          y1={toSvgY(0) + dimOffset - 5}
          x2={toSvgX(width)}
          y2={toSvgY(0) + dimOffset + 5}
          stroke={dimensionColor}
          strokeWidth={1}
        />
        <text
          x={toSvgX(width / 2)}
          y={toSvgY(0) + dimOffset + 15}
          textAnchor="middle"
          fill={dimensionColor}
          fontSize="12"
          fontFamily="Arial, sans-serif"
        >
          {width}mm
        </text>

        <line
          x1={toSvgX(0) - dimOffset}
          y1={toSvgY(0)}
          x2={toSvgX(0) - dimOffset}
          y2={toSvgY(height)}
          stroke={dimensionColor}
          strokeWidth={1}
        />
        <line
          x1={toSvgX(0) - dimOffset - 5}
          y1={toSvgY(0)}
          x2={toSvgX(0) - dimOffset + 5}
          y2={toSvgY(0)}
          stroke={dimensionColor}
          strokeWidth={1}
        />
        <line
          x1={toSvgX(0) - dimOffset - 5}
          y1={toSvgY(height)}
          x2={toSvgX(0) - dimOffset + 5}
          y2={toSvgY(height)}
          stroke={dimensionColor}
          strokeWidth={1}
        />
        <text
          x={toSvgX(0) - dimOffset - 8}
          y={toSvgY(height / 2)}
          textAnchor="end"
          dominantBaseline="middle"
          fill={dimensionColor}
          fontSize="12"
          fontFamily="Arial, sans-serif"
        >
          {height}mm
        </text>
      </>
    );
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <svg
        viewBox={`0 0 ${maxWidth} ${maxHeight}`}
        className="max-w-full max-h-full"
        style={{ width: "100%", height: "100%" }}
      >
        <polygon
          points={getDoorOutline()}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={2}
        />

        {renderMidRails()}
        {renderPanels()}
        {renderDimensions()}

        <text
          x={maxWidth / 2}
          y={maxHeight - 10}
          textAnchor="middle"
          fill="#999"
          fontSize="11"
          fontFamily="Arial, sans-serif"
        >
          {width}mm x {height}mm | {panelType} panel
        </text>
      </svg>
    </div>
  );
}
