import { getInnerProfilePoints, Point } from "./utils";

export interface SvgDoorConfig {
  width: number;
  height: number;
  thickness: number;
  preset: string;
  panelType: string;
  panelCount: number;
  panelOrientation?: string;
  shape: string;
  angledLeft?: boolean;
  angledRight?: boolean;
  leftTriangleCutoutWidth?: number;
  leftTriangleCutoutHeight?: number;
  rightTriangleCutoutWidth?: number;
  rightTriangleCutoutHeight?: number;
  borderWidth?: number;
  customBorders?: boolean;
  leftStile?: number;
  rightStile?: number;
  bottomRail?: number;
  topRail?: number;
  midRailsEnabled?: boolean;
  midRails?: Array<{ positionFromBottom: number; dimension: number }>;
  rebateWidthMm?: number;
  rebateDepthMm?: number;
  frontFaceThicknessMm?: number;
  cornerRadiusMm?: number;
  hingeDrilling?: boolean;
  hinges?: any[];
  material: string;
  finish: string;
}

export function generateDoorSvg(config: SvgDoorConfig): string {
  const {
    width,
    height,
    preset,
    panelType,
    panelCount,
    panelOrientation = "vertical",
    shape,
    angledLeft = false,
    angledRight = false,
    leftTriangleCutoutWidth = 100,
    leftTriangleCutoutHeight = 200,
    rightTriangleCutoutWidth = 100,
    rightTriangleCutoutHeight = 200,
    leftStile = 75,
    rightStile = 75,
    bottomRail = 75,
    topRail = 75,
    midRailsEnabled = false,
    midRails = [],
  } = config;

  const h = height;
  const w = width;
  const isDoubleDoor = preset === "double";

  const padding = 100;
  const svgWidth = w + padding * 2;
  const svgHeight = h + padding * 2 + 60;

  const strokeWidth = 2;
  const strokeColor = "#333333";
  const fillColor = "#f5f0e8";
  const panelFillColor = "#e8e0d0";
  const railFillColor = "#d4cbbf";

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}">
  <!-- Background -->
  <rect x="0" y="0" width="${svgWidth}" height="${svgHeight}" fill="#ffffff" />
`;

  const transformY = (y: number) => h - y + padding;

  // Style attributes
  const frameStyle = `fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}"`;
  const dimensionStyle = `font-family="Arial, sans-serif" font-size="12px" fill="#666"`;
  const titleStyle = `font-family="Arial, sans-serif" font-size="14px" font-weight="bold" fill="#333"`;

  if (isDoubleDoor) {
    const gap = 10;
    const leafWidth = (w - gap) / 2;

    svg += drawDoorLeaf(
      padding,
      leafWidth,
      h,
      shape,
      angledLeft,
      false,
      leftTriangleCutoutWidth,
      leftTriangleCutoutHeight,
      0,
      0,
      panelType,
      panelCount,
      panelOrientation,
      leftStile,
      rightStile,
      bottomRail,
      topRail,
      midRailsEnabled,
      midRails,
      transformY,
      config,
      padding,
      isDoubleDoor
    );

    svg += drawDoorLeaf(
      padding + leafWidth + gap,
      leafWidth,
      h,
      shape,
      false,
      angledRight,
      0,
      0,
      rightTriangleCutoutWidth,
      rightTriangleCutoutHeight,
      panelType,
      panelCount,
      panelOrientation,
      leftStile,
      rightStile,
      bottomRail,
      topRail,
      midRailsEnabled,
      midRails,
      transformY,
      config,
      padding,
      isDoubleDoor
    );
  } else {
    svg += drawDoorLeaf(
      padding,
      w,
      h,
      shape,
      angledLeft,
      angledRight,
      leftTriangleCutoutWidth,
      leftTriangleCutoutHeight,
      rightTriangleCutoutWidth,
      rightTriangleCutoutHeight,
      panelType,
      panelCount,
      panelOrientation,
      leftStile,
      rightStile,
      bottomRail,
      topRail,
      midRailsEnabled,
      midRails,
      transformY,
      config,
      padding,
      isDoubleDoor
    );
  }

  svg += addDimensions(padding, w, h, isDoubleDoor, transformY, dimensionStyle);
  svg += addTitleBlock(padding, svgHeight, config, titleStyle);
  svg += `</svg>`;

  return svg;
}

function drawDoorLeaf(
  xOffset: number,
  width: number,
  height: number,
  shape: string,
  angledLeft: boolean,
  angledRight: boolean,
  leftCutW: number,
  leftCutH: number,
  rightCutW: number,
  rightCutH: number,
  panelType: string,
  panelCount: number,
  panelOrientation: string,
  leftStile: number,
  rightStile: number,
  bottomRail: number,
  topRail: number,
  midRailsEnabled: boolean,
  midRails: Array<{ positionFromBottom: number; dimension: number }>,
  transformY: (y: number) => number,
  config: SvgDoorConfig,
  padding: number,
  isDoubleDoor: boolean
): string {
  let svg = "";

  const clipId = `clip-${xOffset}-${Date.now()}`;

  let clipPathD = "";
  if (angledLeft || angledRight) {
    const points: Array<[number, number]> = [];

    points.push([xOffset, transformY(0)]);

    if (angledLeft) {
      points.push([xOffset, transformY(height - leftCutH)]);
      points.push([xOffset + leftCutW, transformY(height)]);
    } else {
      points.push([xOffset, transformY(height)]);
    }

    if (angledRight) {
      points.push([xOffset + width - rightCutW, transformY(height)]);
      points.push([xOffset + width, transformY(height - rightCutH)]);
    } else {
      points.push([xOffset + width, transformY(height)]);
    }

    points.push([xOffset + width, transformY(0)]);

    clipPathD = `M ${points[0][0]} ${points[0][1]} `;
    for (let i = 1; i < points.length; i++) {
      clipPathD += `L ${points[i][0]} ${points[i][1]} `;
    }
    clipPathD += "Z";

    svg += `  <defs><clipPath id="${clipId}"><path d="${clipPathD}" /></clipPath></defs>\n`;
    svg += `  <path d="${clipPathD}" fill="${config.finish === "RAW_UNASSEMBLED" ? "#f5f0e8" : "#fefefe"}" stroke="#333" stroke-width="2" />\n`;
  } else {
    svg += `  <rect x="${xOffset}" y="${transformY(height)}" width="${width}" height="${height}" fill="${config.finish === "RAW_UNASSEMBLED" ? "#f5f0e8" : "#fefefe"}" stroke="#333" stroke-width="2" />\n`;
  }

  const useClip = angledLeft || angledRight;
  const clipAttr = useClip ? ` clip-path="url(#${clipId})"` : "";

  if (midRailsEnabled && midRails.length > 0) {
    for (const rail of midRails) {
      const railY = transformY(rail.positionFromBottom + rail.dimension / 2);
      svg += `  <rect x="${xOffset + leftStile}" y="${railY}" width="${width - leftStile - rightStile}" height="${rail.dimension}" fill="#d4cbbf" stroke="#333" stroke-width="1"${clipAttr} />\n`;
    }
  }

  if (panelType !== "NONE" && panelCount > 0) {
    const panelAreaWidth = width - leftStile - rightStile;
    const panelAreaHeight = height - bottomRail - topRail;
    const panelPadding = 15;

    const panelClipAttr = clipAttr;

    if (panelOrientation === "horizontal") {
      const panelHeight = (panelAreaHeight - panelPadding * (panelCount + 1)) / panelCount;
      const panelWidth = panelAreaWidth - panelPadding * 2;

      for (let i = 0; i < panelCount; i++) {
        const panelX = xOffset + leftStile + panelPadding;
        const panelBottomY = bottomRail + panelPadding + i * (panelHeight + panelPadding);
        const panelTopY = panelBottomY + panelHeight;

        if (panelType === "shaker") {
          svg += `  <rect class="panel" x="${panelX}" y="${transformY(panelTopY)}" width="${panelWidth}" height="${panelHeight}" rx="2"${panelClipAttr} />\n`;
        } else if (panelType === "raised") {
          svg += `  <rect class="panel" x="${panelX}" y="${transformY(panelTopY)}" width="${panelWidth}" height="${panelHeight}"${panelClipAttr} />\n`;
          const innerPad = 10;
          svg += `  <rect class="panel" x="${panelX + innerPad}" y="${transformY(panelTopY) + innerPad}" width="${panelWidth - innerPad * 2}" height="${panelHeight - innerPad * 2}"${panelClipAttr} />\n`;
        }
      }
    } else {
      let sections: Array<{ startY: number; endY: number }> = [];

      if (midRailsEnabled && midRails.length > 0) {
        const sortedRails = [...midRails].sort((a, b) => a.positionFromBottom - b.positionFromBottom);
        let lastY = bottomRail;
        for (const rail of sortedRails) {
          if (rail.positionFromBottom > lastY) {
            sections.push({ startY: lastY, endY: rail.positionFromBottom });
          }
          lastY = rail.positionFromBottom + rail.dimension;
        }
        if (lastY < height - topRail) {
          sections.push({ startY: lastY, endY: height - topRail });
        }
      } else {
        sections.push({ startY: bottomRail, endY: height - topRail });
      }

      for (const section of sections) {
        const sH = section.endY - section.startY;
        const pW = (panelAreaWidth - panelPadding * (panelCount + 1)) / panelCount;
        const pH = sH - panelPadding * 2;

        for (let i = 0; i < panelCount; i++) {
          const pX = xOffset + leftStile + panelPadding + i * (pW + panelPadding);
          const pY = section.startY + panelPadding;

          // Calculate precise panel points using shared geometry logic
          // Offset distance for panel border = topRail + panelPadding
          const currentLS = leftStile + panelPadding + i * (pW + panelPadding);
          const currentRS = width - (currentLS + pW);
          const currentTR = height - (pY + pH);
          const currentBR = pY;

          const panelPts = getInnerProfilePoints(
            width, height,
            currentLS, currentRS, currentTR, currentBR,
            angledLeft, angledRight,
            leftCutW, leftCutH,
            rightCutW, rightCutH
          );

          const pathD = `M ${panelPts.map(p => `${xOffset + p.x} ${transformY(p.y)}`).join(" L ")} Z`;
          svg += `  <path d="${pathD}" fill="#e8e0d0" stroke="#a09080" stroke-width="1"${panelClipAttr} />\n`;

          if (panelType === "raised") {
            const innerPad = 10;
            const innerPts = getInnerProfilePoints(
              width, height,
              currentLS + innerPad, currentRS + innerPad, currentTR + innerPad, currentBR + innerPad,
              angledLeft, angledRight,
              leftCutW, leftCutH,
              rightCutW, rightCutH
            );
            const innerPathD = `M ${innerPts.map(p => `${xOffset + p.x} ${transformY(p.y)}`).join(" L ")} Z`;
            svg += `  <path d="${innerPathD}" fill="#e8e0d0" stroke="#a09080" stroke-width="1"${panelClipAttr} />\n`;
          }
        }
      }
    }
  }

  // Hinges
  if (config.hingeDrilling && config.hinges && config.hinges.length > 0) {
    for (const hinge of config.hinges) {
      if (hinge.side === "LEFT" && xOffset > padding) continue;
      if (hinge.side === "RIGHT" && xOffset === padding && isDoubleDoor) continue;

      const hY = hinge.positionFromBottomMm;
      const hX = (hinge.side === "LEFT" ? 22 : width - 22);

      let hidden = false;
      if (hinge.side === "LEFT" && angledLeft) {
        if ((hX) / leftCutW + (height - hY) / leftCutH < 1) hidden = true;
      } else if (hinge.side === "RIGHT" && angledRight) {
        if ((width - hX) / rightCutW + (height - hY) / rightCutH < 1) hidden = true;
      }

      if (!hidden) {
        svg += `  <circle cx="${xOffset + hX}" cy="${transformY(hY)}" r="17.5" fill="#444" stroke="#333" stroke-width="1" fill-opacity="0.3" />\n`;
        svg += `  <circle cx="${xOffset + hX}" cy="${transformY(hY)}" r="2" fill="#333" />\n`;
      }
    }
  }

  return svg;
}

function addDimensions(
  padding: number,
  width: number,
  height: number,
  isDoubleDoor: boolean,
  transformY: (y: number) => number,
  dimStyle: string
): string {
  let svg = "";
  const dimOffset = 40;

  svg += `  <line x1="${padding}" y1="${transformY(0) + dimOffset}" x2="${padding + width}" y2="${transformY(0) + dimOffset}" stroke="#999" stroke-width="1" />\n`;
  svg += `  <line x1="${padding}" y1="${transformY(0) + dimOffset - 5}" x2="${padding}" y2="${transformY(0) + dimOffset + 5}" stroke="#999" stroke-width="1" />\n`;
  svg += `  <line x1="${padding + width}" y1="${transformY(0) + dimOffset - 5}" x2="${padding + width}" y2="${transformY(0) + dimOffset + 5}" stroke="#999" stroke-width="1" />\n`;
  svg += `  <text ${dimStyle} x="${padding + width / 2}" y="${transformY(0) + dimOffset + 20}" text-anchor="middle">${Math.round(width)}mm</text>\n`;

  svg += `  <line x1="${padding - dimOffset}" y1="${transformY(0)}" x2="${padding - dimOffset}" y2="${transformY(height)}" stroke="#999" stroke-width="1" />\n`;
  svg += `  <line x1="${padding - dimOffset - 5}" y1="${transformY(0)}" x2="${padding - dimOffset + 5}" y2="${transformY(0)}" stroke="#999" stroke-width="1" />\n`;
  svg += `  <line x1="${padding - dimOffset - 5}" y1="${transformY(height)}" x2="${padding - dimOffset + 5}" y2="${transformY(height)}" stroke="#999" stroke-width="1" />\n`;
  svg += `  <text ${dimStyle} x="${padding - dimOffset - 15}" y="${transformY(height / 2)}" text-anchor="end" dominant-baseline="middle">${Math.round(height)}mm</text>\n`;

  return svg;
}

function addTitleBlock(padding: number, svgHeight: number, config: SvgDoorConfig, titleStyle: string): string {
  const y = svgHeight - 30;
  return `  <text ${titleStyle} x="${padding}" y="${y}">Door: ${config.width}mm x ${config.height}mm | ${config.preset} | ${config.panelType} panel | ${config.material}</text>\n`;
}
