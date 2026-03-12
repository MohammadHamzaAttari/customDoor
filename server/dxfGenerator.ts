import { DxfWriter, point3d, point2d, LWPolylineFlags } from "@tarikjabiri/dxf";
import { getInnerProfilePoints } from "./utils";

export interface DxfDoorConfig {
  width: number;
  height: number;
  thickness: number;
  preset: string;
  panelType: string;
  panelCount: number;
  shape: string;
  material: string;
  finish: string;
  rebateWidthMm: number;
  rebateDepthMm: number;
  frontFaceThicknessMm: number;
  cornerRadiusMm: number;
  angledLeft?: boolean;
  angledRight?: boolean;
  leftTriangleCutoutWidth?: number;
  leftTriangleCutoutHeight?: number;
  rightTriangleCutoutWidth?: number;
  rightTriangleCutoutHeight?: number;
  hinges: any[];
  leftStile?: number;
  rightStile?: number;
  topRail?: number;
  bottomRail?: number;
  midRailsEnabled?: boolean;
  midRails?: any[];
  leftAngledRailWidth?: number;
  rightAngledRailWidth?: number;
}

export function generateDoorDxf(config: DxfDoorConfig): string {
  const dxf = new DxfWriter();

  // --- CNC TOOLING LAYERS (8-Tool Standard) ---
  dxf.addLayer("T1_DRILL_V4", 3, "CONTINUOUS");
  dxf.addLayer("T8_DRILL_35MM", 3, "CONTINUOUS");
  dxf.addLayer("T6_REBATE_12MM", 1, "CONTINUOUS");
  dxf.addLayer("T6_INNER_ONION", 1, "CONTINUOUS");
  dxf.addLayer("T4_PROFILE_8MM_OS", 5, "CONTINUOUS");
  dxf.addLayer("T4_PROFILE_8MM_FINAL", 5, "CONTINUOUS");
  dxf.addLayer("T3_REBATE_FINISH", 6, "CONTINUOUS");
  dxf.addLayer("T3_INNER_BREAK", 6, "CONTINUOUS");
  dxf.addLayer("PANEL_GEOMETRY", 2, "CONTINUOUS");

  // Visual/Doc Layers
  dxf.addLayer("DIMENSIONS", 7, "CONTINUOUS");
  dxf.addLayer("SECTION_Graphics", 7, "CONTINUOUS");
  dxf.addLayer("HINGES", 7, "CONTINUOUS");
  dxf.addLayer("FRAME", 7, "CONTINUOUS");
  dxf.addLayer("BORDERS", 4, "CONTINUOUS");
  dxf.addLayer("PANELS", 2, "CONTINUOUS");
  dxf.addLayer("MIDRAILS", 4, "CONTINUOUS");

  const {
    width,
    height,
    thickness,
    preset,
    panelType,
    hinges,
    leftTriangleCutoutWidth,
    leftTriangleCutoutHeight,
    rightTriangleCutoutWidth,
    rightTriangleCutoutHeight,
  } = config;

  // Normalize angled flags
  const isAngledShape = config.shape === "angled";
  const aL = config.angledLeft ?? (isAngledShape && (config.leftTriangleCutoutWidth || 0) > 0);
  const aR = config.angledRight ?? (isAngledShape && (config.rightTriangleCutoutWidth || 0) > 0);

  // Defaults
  const defaultBorder = 75;
  const lStile = config.leftStile || defaultBorder;
  const rStile = config.rightStile || defaultBorder;
  const tRail = config.topRail || defaultBorder;
  const bRail = config.bottomRail || defaultBorder;
  const mRails = config.midRailsEnabled && config.midRails ? config.midRails : [];
  const lcw = leftTriangleCutoutWidth || 0;
  const lch = leftTriangleCutoutHeight || 0;
  const rcw = rightTriangleCutoutWidth || 0;
  const rch = rightTriangleCutoutHeight || 0;
  const arwL = config.leftAngledRailWidth ?? 90;
  const arwR = config.rightAngledRailWidth ?? 90;

  // ─── A. Outer Profile (T4) ───
  const outerPoints = getProfilePoints(width, height, aL, aR, lcw, lch, rcw, rch);
  dxf.addLWPolyline(outerPoints, { flags: LWPolylineFlags.Closed, layerName: "T4_PROFILE_8MM_OS" });
  dxf.addLWPolyline(outerPoints, { flags: LWPolylineFlags.Closed, layerName: "T4_PROFILE_8MM_FINAL" });

  // ─── B. Inner Profile (Panel Hole) ───
  if (panelType !== "NONE") {
    const innerPoints = getInnerProfilePoints(
      width, height,
      lStile, rStile, tRail, bRail,
      aL, aR,
      lcw, lch, rcw, rch,
      arwL, arwR
    ).map(p => ({ point: point2d(p.x, p.y) }));

    dxf.addLWPolyline(innerPoints, { flags: LWPolylineFlags.Closed, layerName: "T6_INNER_ONION" });
    dxf.addLWPolyline(innerPoints, { flags: LWPolylineFlags.Closed, layerName: "T3_INNER_BREAK" });

    // ─── C. Rebate Geometry ───
    const rM = config.rebateWidthMm || 10;
    const rebatePoints = getInnerProfilePoints(
      width, height,
      lStile - rM, rStile - rM, tRail - rM, bRail - rM,
      aL, aR,
      lcw, lch, rcw, rch,
      arwL - rM, arwR - rM
    ).map(p => ({ point: point2d(p.x, p.y) }));
    dxf.addLWPolyline(rebatePoints, { flags: LWPolylineFlags.Closed, layerName: "T6_REBATE_12MM" });
    dxf.addLWPolyline(rebatePoints, { flags: LWPolylineFlags.Closed, layerName: "T3_REBATE_FINISH" });

    // ─── D. Panel Geometry (Visual reference) ───
    const pInset = 10;
    const effectivePanelPoints = getInnerProfilePoints(
      width, height,
      lStile + pInset, rStile + pInset, tRail + pInset, bRail + pInset,
      aL, aR,
      lcw, lch, rcw, rch,
      arwL + pInset, arwR + pInset
    ).map(p => ({ point: point2d(p.x, p.y) }));
    dxf.addLWPolyline(effectivePanelPoints, { flags: LWPolylineFlags.Closed, layerName: "PANEL_GEOMETRY" });

    // ─── E. Mid Rails ───
    if (mRails.length > 0) {
      mRails.forEach((rail: any) => {
        const railBottomY = Number(rail.positionFromBottom || rail.position || 0);
        const railDim = Number(rail.dimension || rail.height || 100);
        const railTopY = railBottomY + railDim;

        // Mid rail extends between stiles (inner edges)
        // For simple rectangular doors:
        let mrLeftX = lStile;
        let mrRightX = width - rStile;

        // For angled doors, compute the inner X at the rail's Y midpoint
        if (aL && lcw > 0 && lch > 0) {
          const railMidY = railBottomY + railDim / 2;
          const hyp = Math.sqrt(lcw * lcw + lch * lch);
          const totalVertShift = arwL * (hyp / lcw);
          const m = lch / lcw;
          const xAtY = (railMidY - (height - lch) + totalVertShift) / m;
          mrLeftX = Math.max(mrLeftX, xAtY);
        }
        if (aR && rcw > 0 && rch > 0) {
          const railMidY = railBottomY + railDim / 2;
          const hyp = Math.sqrt(rcw * rcw + rch * rch);
          const totalVertShift = arwR * (hyp / rcw);
          const m = -rch / rcw;
          const xAtY = (railMidY - height + totalVertShift) / m + (width - rcw);
          mrRightX = Math.min(mrRightX, xAtY);
        }

        const mrPoints = [
          { point: point2d(mrLeftX, railBottomY) },
          { point: point2d(mrRightX, railBottomY) },
          { point: point2d(mrRightX, railTopY) },
          { point: point2d(mrLeftX, railTopY) },
        ];
        dxf.addLWPolyline(mrPoints, { flags: LWPolylineFlags.Closed, layerName: "MIDRAILS" });

        // Also add on the inner cut layers for CNC
        dxf.addLWPolyline(mrPoints, { flags: LWPolylineFlags.Closed, layerName: "FRAME" });

        // Add text label
        const railMidY = railBottomY + railDim / 2;
        dxf.addText(point3d((mrLeftX + mrRightX) / 2 - 50, railMidY - 7, 0), 16, `MID RAIL (${railDim}mm)`, { layerName: "DIMENSIONS" });
      });
    }
  }

  // ─── F. Hinges (T1 & T8) ───
  if (hinges && hinges.length > 0) {
    hinges.forEach((h: any) => {
      // Convert from client hinge format to absolute Y from bottom
      let y: number;
      if (h.positionFromBottomMm != null) {
        y = Number(h.positionFromBottomMm);
      } else if (h.positionMm != null && h.reference) {
        if (h.reference === "TOP") {
          let angleCutoutH = 0;
          if (h.side === "LEFT" && aL && lch) {
            angleCutoutH = Number(lch) || 0;
          } else if (h.side === "RIGHT" && aR && rch) {
            angleCutoutH = Number(rch) || 0;
          }
          y = (height - angleCutoutH) - Number(h.positionMm);
        } else {
          y = Number(h.positionMm);
        }
      } else if (h.position != null) {
        y = Number(h.position);
      } else {
        y = 100;
      }

      // Hinge center offset: 5mm gap + 17.5mm (half of 35mm cup) = 22.5mm
      const x = h.side === "LEFT" ? 22.5 : width - 22.5;

      // Skip hinges that fall outside angled cutouts
      if (h.side === "LEFT" && aL && lcw > 0 && lch > 0) {
        const heightFromBottom = y;
        const angleStartFromBottom = height - lch;
        if (heightFromBottom > angleStartFromBottom) {
          // Check if the hinge X is outside the angled edge at this Y
          const t = (heightFromBottom - angleStartFromBottom) / lch;
          const edgeX = lcw * t;
          if (x < edgeX + 17.5 + 2) return; // Cup radius + clearance
        }
      }
      if (h.side === "RIGHT" && aR && rcw > 0 && rch > 0) {
        const heightFromBottom = y;
        const angleStartFromBottom = height - rch;
        if (heightFromBottom > angleStartFromBottom) {
          const t = (heightFromBottom - angleStartFromBottom) / rch;
          const edgeX = width - rcw * t;
          if (x > edgeX - 17.5 - 2) return;
        }
      }

      // T8: 35mm Cup
      dxf.addCircle(point3d(x, y, 0), 35 / 2, { layerName: "T8_DRILL_35MM" });

      // T1: Screw/Inserta holes
      const screwOffset = 22.5; // 45mm spread
      const hingeType = h.type || h.hingeType || "SCREW_POINTS";
      const drillRadius = hingeType === "INSERTA" ? 4 : 2;

      dxf.addCircle(point3d(x, y + screwOffset, 0), drillRadius, { layerName: "T1_DRILL_V4" });
      dxf.addCircle(point3d(x, y - screwOffset, 0), drillRadius, { layerName: "T1_DRILL_V4" });

      // Visual hinge representation & Expert CNC Label
      dxf.addCircle(point3d(x, y, 0), 17.5, { layerName: "HINGES" });
      dxf.addCircle(point3d(x, y, 0), 2, { layerName: "HINGES" });

      const lblX = h.side === "LEFT" ? -150 : width + 50;
      dxf.addText(point3d(lblX, y + 15, 0), 12, `Ø35 DH13.5 (CUP)`, { layerName: "HINGES" });
      dxf.addText(point3d(lblX, y - 5, 0), 10, `Ø${drillRadius * 2} DH12 (${hingeType})`, { layerName: "HINGES" });
    });
  }

  // ─── PART IDENTIFICATION (Center of door) ───
  // Removed from center to prevent overlapping with inner toolpaths (mid rails, etc.). 
  // All relevant information is now strictly confined to the CNC JOB SPECIFICATION block on the right.

  // ─── G. Dimension Annotations ───
  addDimensionAnnotations(dxf, width, height, thickness, false, lStile, rStile, tRail, bRail);

  // ─── H. Section Views ───
  const sideViewX = width + 200;
  drawSideView(
    dxf, sideViewX, 0, height, thickness,
    config.rebateWidthMm || 10, config.rebateDepthMm || 14, config.frontFaceThicknessMm || 8,
    tRail, bRail, mRails, panelType
  );

  const topViewY = height + 200;
  drawTopView(
    dxf, 0, topViewY, width, thickness,
    config.rebateWidthMm || 10, config.rebateDepthMm || 14, config.frontFaceThicknessMm || 8,
    lStile, rStile, panelType
  );

  // ─── I. Title Block ───
  addTitleBlock(dxf, config);

  return dxf.stringify();
}

// ─── Helper: Outer Profile Points ───
function getProfilePoints(
  w: number, h: number,
  angL: any, angR: any,
  lW: any, lH: any,
  rW: any, rH: any
) {
  const pts = [];
  pts.push({ point: point2d(0, 0) });
  pts.push({ point: point2d(w, 0) });

  if (angR && rW > 0 && rH > 0) {
    pts.push({ point: point2d(w, h - rH) });
    pts.push({ point: point2d(w - rW, h) });
  } else {
    pts.push({ point: point2d(w, h) });
  }

  if (angL && lW > 0 && lH > 0) {
    pts.push({ point: point2d(lW, h) });
    pts.push({ point: point2d(0, h - lH) });
  } else {
    pts.push({ point: point2d(0, h) });
  }

  return pts;
}

// ─── Helper: Side View ───
function drawSideView(
  dxf: DxfWriter,
  xOffset: number,
  yOffset: number,
  height: number,
  thickness: number,
  rebateW: number,
  rebateD: number,
  frontFaceT: number,
  topRail: number,
  bottomRail: number,
  midRails: any[],
  panelType: string
) {
  const points: any[] = [];
  points.push({ point: point2d(xOffset, yOffset) });
  points.push({ point: point2d(xOffset + thickness, yOffset) });
  points.push({ point: point2d(xOffset + thickness, yOffset + height) });
  points.push({ point: point2d(xOffset, yOffset + height) });
  dxf.addLWPolyline(points, { flags: LWPolylineFlags.Closed, layerName: "FRAME" });

  // Rails
  dxf.addLine(
    point3d(xOffset, yOffset + bottomRail, 0),
    point3d(xOffset + thickness, yOffset + bottomRail, 0),
    { layerName: "BORDERS" }
  );
  dxf.addLine(
    point3d(xOffset, yOffset + height - topRail, 0),
    point3d(xOffset + thickness, yOffset + height - topRail, 0),
    { layerName: "BORDERS" }
  );

  // Mid Rails in side view
  if (midRails && midRails.length > 0) {
    midRails.forEach((rail: any) => {
      const railY = Number(rail.positionFromBottom || rail.position || 0);
      const railDim = Number(rail.dimension || rail.height || 100);
      dxf.addLine(
        point3d(xOffset, yOffset + railY, 0),
        point3d(xOffset + thickness, yOffset + railY, 0),
        { layerName: "MIDRAILS" }
      );
      dxf.addLine(
        point3d(xOffset, yOffset + railY + railDim, 0),
        point3d(xOffset + thickness, yOffset + railY + railDim, 0),
        { layerName: "MIDRAILS" }
      );
    });
  }

  // Panel
  if (panelType !== "NONE") {
    const pThk = panelType === "REEDED_19MM" ? 19 : panelType === "MELAMINE_18MM" ? 18 : 12;
    const pX1 = xOffset + frontFaceT;
    const pX2 = xOffset + frontFaceT + pThk;
    const pY1 = yOffset + bottomRail;
    const pY2 = yOffset + height - topRail;

    const pPoints: any[] = [];
    pPoints.push({ point: point2d(pX1, pY1) });
    pPoints.push({ point: point2d(pX2, pY1) });
    pPoints.push({ point: point2d(pX2, pY2) });
    pPoints.push({ point: point2d(pX1, pY2) });
    dxf.addLWPolyline(pPoints, { flags: LWPolylineFlags.Closed, layerName: "PANELS" });
  }

  dxf.addText(point3d(xOffset + thickness / 2 - 15, yOffset - 50, 0), 20, "SIDE VIEW", { layerName: "DIMENSIONS" });
  dxf.addText(point3d(xOffset, yOffset - 80, 0), 15, `Thk: ${thickness}mm`, { layerName: "DIMENSIONS" });
}

// ─── Helper: Top View ───
function drawTopView(
  dxf: DxfWriter,
  xOffset: number,
  yOffset: number,
  width: number,
  thickness: number,
  rebateW: number,
  rebateD: number,
  frontFaceT: number,
  leftStile: number,
  rightStile: number,
  panelType: string
) {
  const points: any[] = [];
  points.push({ point: point2d(xOffset, yOffset) });
  points.push({ point: point2d(xOffset + width, yOffset) });
  points.push({ point: point2d(xOffset + width, yOffset + thickness) });
  points.push({ point: point2d(xOffset, yOffset + thickness) });
  dxf.addLWPolyline(points, { flags: LWPolylineFlags.Closed, layerName: "FRAME" });

  // Stiles
  dxf.addLine(
    point3d(xOffset + leftStile, yOffset, 0),
    point3d(xOffset + leftStile, yOffset + thickness, 0),
    { layerName: "BORDERS" }
  );
  dxf.addLine(
    point3d(xOffset + width - rightStile, yOffset, 0),
    point3d(xOffset + width - rightStile, yOffset + thickness, 0),
    { layerName: "BORDERS" }
  );

  // Panel
  if (panelType !== "NONE") {
    const pThk = panelType === "REEDED_19MM" ? 19 : panelType === "MELAMINE_18MM" ? 18 : 12;
    const pY1 = yOffset + frontFaceT;
    const pY2 = yOffset + frontFaceT + pThk;
    const pX1 = xOffset + leftStile;
    const pX2 = xOffset + width - rightStile;

    const pPoints: any[] = [];
    pPoints.push({ point: point2d(pX1, pY1) });
    pPoints.push({ point: point2d(pX2, pY1) });
    pPoints.push({ point: point2d(pX2, pY2) });
    pPoints.push({ point: point2d(pX1, pY2) });
    dxf.addLWPolyline(pPoints, { flags: LWPolylineFlags.Closed, layerName: "PANELS" });
  }

  // Rebates
  if (rebateW > 0 && rebateD > 0) {
    const backY = yOffset + thickness;

    dxf.addLine(point3d(xOffset + rebateW, backY, 0), point3d(xOffset + rebateW, backY - rebateD, 0), { layerName: "BORDERS" });
    dxf.addLine(point3d(xOffset, backY - rebateD, 0), point3d(xOffset + rebateW, backY - rebateD, 0), { layerName: "BORDERS" });

    dxf.addLine(point3d(xOffset + width - rebateW, backY, 0), point3d(xOffset + width - rebateW, backY - rebateD, 0), { layerName: "BORDERS" });
    dxf.addLine(point3d(xOffset + width, backY - rebateD, 0), point3d(xOffset + width - rebateW, backY - rebateD, 0), { layerName: "BORDERS" });
  }

  dxf.addText(point3d(xOffset + width / 2 - 15, yOffset + thickness + 50, 0), 20, "TOP VIEW", { layerName: "DIMENSIONS" });
  dxf.addText(point3d(xOffset + leftStile / 2 - 10, yOffset - 30, 0), 12, `Stile: ${leftStile}`, { layerName: "DIMENSIONS" });
  dxf.addText(point3d(xOffset + width - rightStile / 2 - 20, yOffset - 30, 0), 12, `Stile: ${rightStile}`, { layerName: "DIMENSIONS" });
}

// ─── Helper: Draw Expert Dimension Line ───
function drawDimensionLine(
  dxf: DxfWriter,
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  text: string,
  offset: number,
  layerName: string = "DIMENSIONS"
) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return;
  const nx = -dy / len;
  const ny = dx / len;

  const dp1 = { x: p1.x + nx * offset, y: p1.y + ny * offset };
  const dp2 = { x: p2.x + nx * offset, y: p2.y + ny * offset };

  const extSign = Math.sign(offset) || 1;
  const e1S = { x: p1.x + nx * extSign * 10, y: p1.y + ny * extSign * 10 };
  const e1E = { x: dp1.x + nx * extSign * 15, y: dp1.y + ny * extSign * 15 };
  const e2S = { x: p2.x + nx * extSign * 10, y: p2.y + ny * extSign * 10 };
  const e2E = { x: dp2.x + nx * extSign * 15, y: dp2.y + ny * extSign * 15 };

  dxf.addLine(point3d(e1S.x, e1S.y, 0), point3d(e1E.x, e1E.y, 0), { layerName });
  dxf.addLine(point3d(e2S.x, e2S.y, 0), point3d(e2E.x, e2E.y, 0), { layerName });
  dxf.addLine(point3d(dp1.x, dp1.y, 0), point3d(dp2.x, dp2.y, 0), { layerName });

  const tick = 12;
  const tDx = (nx + dx / len) * (tick * 0.707);
  const tDy = (ny + dy / len) * (tick * 0.707);
  dxf.addLine(point3d(dp1.x - tDx, dp1.y - tDy, 0), point3d(dp1.x + tDx, dp1.y + tDy, 0), { layerName });
  dxf.addLine(point3d(dp2.x - tDx, dp2.y - tDy, 0), point3d(dp2.x + tDx, dp2.y + tDy, 0), { layerName });

  const midX = (dp1.x + dp2.x) / 2;
  const midY = (dp1.y + dp2.y) / 2;
  let textAngle = (Math.atan2(dy, dx) * 180) / Math.PI;

  // Keep text readable
  if (textAngle > 90 || textAngle < -90) {
    textAngle += 180;
  }

  const tx = midX + nx * (extSign * 8); // Text offset from line
  const ty = midY + ny * (extSign * 8);

  dxf.addText(point3d(tx, ty, 0), 18, text, { layerName, rotation: textAngle });
}

// ─── Helper: Dimension Annotations ───
function addDimensionAnnotations(
  dxf: DxfWriter,
  width: number,
  height: number,
  thickness: number,
  isDouble: boolean,
  lStile: number,
  rStile: number,
  tRail: number,
  bRail: number
) {
  // Width Dimension
  drawDimensionLine(dxf, { x: 0, y: 0 }, { x: width, y: 0 }, `${isDouble ? width * 2 + 10 : width}mm (Width)`, -100);

  // Height Dimension
  drawDimensionLine(dxf, { x: 0, y: 0 }, { x: 0, y: height }, `${height}mm (Height)`, 100);

  // Stile/Rail Dimension Labels
  dxf.addText(point3d(width / 2, height - 40, 0), 15, `TOP RAIL: ${tRail}mm`, { layerName: "DIMENSIONS" });
  dxf.addText(point3d(width / 2, 25, 0), 15, `BOTTOM RAIL: ${bRail}mm`, { layerName: "DIMENSIONS" });
  dxf.addText(point3d(40, height / 2, 0), 15, `L-STILE: ${lStile}mm`, { layerName: "DIMENSIONS", rotation: 90 });
  dxf.addText(point3d(width - 55, height / 2, 0), 15, `R-STILE: ${rStile}mm`, { layerName: "DIMENSIONS", rotation: 90 });
}

// ─── Helper: Title Block ───
function addTitleBlock(dxf: DxfWriter, config: DxfDoorConfig) {
  const tbX = config.width + 100;
  const tbY = config.height - 400; // Place it nicely high on the right side
  const boxWidth = 500;

  // Outer Border
  const pPts = [
    { point: point2d(tbX, tbY) },
    { point: point2d(tbX + boxWidth, tbY) },
    { point: point2d(tbX + boxWidth, tbY + 500) },
    { point: point2d(tbX, tbY + 500) },
  ];
  dxf.addLWPolyline(pPts, { flags: LWPolylineFlags.Closed, layerName: "DIMENSIONS" });

  // Title Background Line
  dxf.addLine(point3d(tbX, tbY + 440, 0), point3d(tbX + boxWidth, tbY + 440, 0), { layerName: "DIMENSIONS" });
  dxf.addText(point3d(tbX + 20, tbY + 455, 0), 24, `CNC JOB SPECIFICATION`, { layerName: "DIMENSIONS" });

  const lineHeight = 28;
  const mRailCount = config.midRailsEnabled && config.midRails ? config.midRails.length : 0;
  const hingeCount = config.hinges ? config.hinges.length : 0;

  const sections = [
    {
      title: "--- PART DETAILS ---", data: [
        `OVERALL SIZE: ${config.height}mm (H) x ${config.width}mm (W)`,
        `THICKNESS:    ${config.thickness}mm`,
        `MATERIAL:     ${config.material}`,
        `FINISH:       ${config.finish}`,
      ]
    },
    {
      title: "--- PROFILE SETTINGS ---", data: [
        `SHAPE:        ${config.shape.toUpperCase()}`,
        `PANEL TYPE:   ${config.panelType}`,
        `REBATE:       W:${config.rebateWidthMm}mm D:${config.rebateDepthMm}mm`,
        `FRONT FACE:   ${config.frontFaceThicknessMm}mm`,
        `STILES:       L->${config.leftStile || 75} R->${config.rightStile || 75}`,
        `RAILS:        T->${config.topRail || 75} B->${config.bottomRail || 75}`,
      ]
    },
    {
      title: "--- MACHINING ALERTS ---", data: [
        ...(mRailCount > 0 ? [`MID RAILS:    ${mRailCount} QTY. (Verify pockets)`] : []),
        ...(hingeCount > 0 ? [`HINGES:       ${hingeCount} QTY. (Check Ø35 depth)`] : []),
        ...(config.angledLeft ? [`LEFT ANGLE:   ${config.leftTriangleCutoutWidth}x${config.leftTriangleCutoutHeight}mm`] : []),
        ...(config.angledRight ? [`RIGHT ANGLE:  ${config.rightTriangleCutoutWidth}x${config.rightTriangleCutoutHeight}mm`] : []),
        ...((mRailCount === 0 && hingeCount === 0 && !config.angledLeft && !config.angledRight) ? ["* Standard Profile Routing Only"] : [])
      ]
    }
  ];

  let currentY = tbY + 400;
  sections.forEach(sec => {
    dxf.addText(point3d(tbX + 20, currentY, 0), 16, sec.title, { layerName: "DIMENSIONS" });
    currentY -= lineHeight;
    sec.data.forEach(line => {
      dxf.addText(point3d(tbX + 30, currentY, 0), 14, line, { layerName: "DIMENSIONS" });
      currentY -= lineHeight;
    });
    currentY -= 10; // Extra spacing between sections
  });
}