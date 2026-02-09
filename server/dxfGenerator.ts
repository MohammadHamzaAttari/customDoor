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
  // Detailed Section Props
  leftStile?: number;
  rightStile?: number;
  topRail?: number;
  bottomRail?: number;
  midRailsEnabled?: boolean;
  midRails?: any[];
}

export function generateDoorDxf(config: DxfDoorConfig): string {
  const dxf = new DxfWriter();

  // --- CNC TOOLING LAYERS (8-Tool Standard) ---
  dxf.addLayer("T1_DRILL_V4", 3, "CONTINUOUS");        // Green - Hinge Screws
  dxf.addLayer("T8_DRILL_35MM", 3, "CONTINUOUS");      // Green - Hinge Cups
  dxf.addLayer("T6_REBATE_12MM", 1, "CONTINUOUS");     // Red - Rebate Pocket
  dxf.addLayer("T6_INNER_ONION", 1, "CONTINUOUS");     // Red - Inner Cut Rough
  dxf.addLayer("T4_PROFILE_8MM_OS", 5, "CONTINUOUS");  // Blue - Outer Cut Rough
  dxf.addLayer("T4_PROFILE_8MM_FINAL", 5, "CONTINUOUS"); // Blue - Outer Cut Final
  dxf.addLayer("T3_REBATE_FINISH", 6, "CONTINUOUS");   // Magenta - Rebate Corners
  dxf.addLayer("T3_INNER_BREAK", 6, "CONTINUOUS");     // Magenta - Inner Cut Finish
  dxf.addLayer("PANEL_GEOMETRY", 2, "CONTINUOUS");     // Yellow - The Panel itself (Production Ref)

  // Visual/Doc Layers
  dxf.addLayer("DIMENSIONS", 7, "CONTINUOUS");
  dxf.addLayer("SECTION_Graphics", 7, "CONTINUOUS");
  dxf.addLayer("HINGES", 7, "CONTINUOUS"); // Visual hinge representation

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

  // Normalize angled flags (backend uses 'shape' string, frontend uses booleans)
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

  // 1. Generate CNC Geometry for the DOOR FRAME (Leaf)
  // Double door logic: Generate two layouts side-by-side? 
  // For CNC manufacturing, usually single parts are nested.
  // We will generate the CURRENT Leaf geometry at (0,0).
  // If double, we might need logic, but 'generateDoorDxf' usually handles one 'config' object which describes the *job*.
  // However, the frontend passes one config for the whole conceptual door.
  // We'll proceed assuming Single Leaf or specific geometry generation.

  // NOTE: For double doors, we usually manufacture two identical (or mirrored) leaves.
  // We will draw the PRIMARY leaf at 0,0 for machining.

  // Outer Profile Points
  const outerPoints = getProfilePoints(width, height, aL, aR, leftTriangleCutoutWidth, leftTriangleCutoutHeight, rightTriangleCutoutWidth, rightTriangleCutoutHeight);

  // A. Outer Profile (T4)
  // Two passes: Onion Skin and Final
  dxf.addLWPolyline(outerPoints, { flags: LWPolylineFlags.Closed, layerName: "T4_PROFILE_8MM_OS" });
  dxf.addLWPolyline(outerPoints, { flags: LWPolylineFlags.Closed, layerName: "T4_PROFILE_8MM_FINAL" });

  // B. Inner Profile (Hole)
  // Only if panelType is NOT Slab (NONE)
  if (panelType !== "NONE") {
    const innerPoints = getInnerProfilePoints(
      config.width, config.height,
      lStile, rStile, tRail, bRail,
      aL, aR,
      leftTriangleCutoutWidth || 0, leftTriangleCutoutHeight || 0,
      rightTriangleCutoutWidth || 0, rightTriangleCutoutHeight || 0
    ).map(p => ({ point: point2d(p.x, p.y) }));

    // T6 Inner Onion (Bulk removal/Through cut with skin)
    dxf.addLWPolyline(innerPoints, { flags: LWPolylineFlags.Closed, layerName: "T6_INNER_ONION" });
    // T3 Inner Break (Final cleanup)
    dxf.addLWPolyline(innerPoints, { flags: LWPolylineFlags.Closed, layerName: "T3_INNER_BREAK" });

    // --- REBATE GEOMETRY ---
    const rW = config.rebateWidthMm || 10;
    const rebatePoints = getInnerProfilePoints(
      config.width, config.height,
      lStile - rW, rStile - rW,
      tRail - rW, bRail - rW,
      aL, aR,
      leftTriangleCutoutWidth || 0, leftTriangleCutoutHeight || 0,
      rightTriangleCutoutWidth || 0, rightTriangleCutoutHeight || 0
    ).map(p => ({ point: point2d(p.x, p.y) }));
    dxf.addLWPolyline(rebatePoints, { flags: LWPolylineFlags.Closed, layerName: "T6_REBATE_12MM" });
    dxf.addLWPolyline(rebatePoints, { flags: LWPolylineFlags.Closed, layerName: "T3_REBATE_FINISH" });

    // --- PANEL GEOMETRY (Visual reference) ---
    const effectivePanelPoints = getInnerProfilePoints(
      config.width, config.height,
      lStile + 10, rStile + 10,
      tRail + 10, bRail + 10,
      aL, aR,
      leftTriangleCutoutWidth || 0, leftTriangleCutoutHeight || 0,
      rightTriangleCutoutWidth || 0, rightTriangleCutoutHeight || 0
    ).map(p => ({ point: point2d(p.x, p.y) }));
    dxf.addLWPolyline(effectivePanelPoints, { flags: LWPolylineFlags.Closed, layerName: "PANEL_GEOMETRY" });
  }

  // E. Hinges (T1 & T8)
  if (hinges && hinges.length > 0) {
    hinges.forEach(h => {
      const y = h.positionFromBottomMm;
      const x = h.side === "LEFT" ? 22 : width - 22;

      // Filtering logic for angled doors
      if (h.side === "LEFT" && aL && leftTriangleCutoutWidth && leftTriangleCutoutHeight) {
        if (x / leftTriangleCutoutWidth + (height - y) / leftTriangleCutoutHeight < 1) return;
      } else if (h.side === "RIGHT" && aR && rightTriangleCutoutWidth && rightTriangleCutoutHeight) {
        if ((width - x) / rightTriangleCutoutWidth + (height - y) / rightTriangleCutoutHeight < 1) return;
      }

      // T8: 35mm Cup
      dxf.addCircle(point3d(x, y, 0), 35 / 2, { layerName: "T8_DRILL_35MM" });

      // T1: Screw Centers
      const screwOffset = 22.5; // 45mm spread
      dxf.addCircle(point3d(x, y + screwOffset, 0), 2, { layerName: "T1_DRILL_V4" });
      dxf.addCircle(point3d(x, y - screwOffset, 0), 2, { layerName: "T1_DRILL_V4" });
    });
  }

  // Doc Data
  addDimensionAnnotations(dxf, width, height, thickness, false, lStile, rStile, tRail, bRail);

  // --- SECTIONS ---
  // Side View (Shifted right)
  const sideViewX = width + 200;
  drawSideView(
    dxf, sideViewX, 0, height, thickness,
    config.rebateWidthMm || 10, config.rebateDepthMm || 14, config.frontFaceThicknessMm || 8,
    tRail, bRail, mRails, panelType
  );

  // Top View (Shifted above)
  const topViewY = height + 200;
  drawTopView(
    dxf, 0, topViewY, width, thickness,
    config.rebateWidthMm || 10, config.rebateDepthMm || 14, config.frontFaceThicknessMm || 8,
    lStile, rStile, panelType
  );

  // Title Block (Shifted right of side view)
  addTitleBlock(dxf, config);

  return dxf.stringify();
}

// Helper to project points for polygon
function getProfilePoints(w: number, h: number, angL: any, angR: any, lW: any, lH: any, rW: any, rH: any) {
  const pts = [];
  pts.push({ point: point2d(0, 0) });
  pts.push({ point: point2d(w, 0) }); // Bottom Right

  // Top Right
  if (angR && rW > 0 && rH > 0) {
    pts.push({ point: point2d(w, h - rH) });
    pts.push({ point: point2d(w - rW, h) });
  } else {
    pts.push({ point: point2d(w, h) });
  }

  // Top Left
  if (angL && lW > 0 && lH > 0) {
    pts.push({ point: point2d(lW, h) });
    pts.push({ point: point2d(0, h - lH) });
  } else {
    pts.push({ point: point2d(0, h) });
  }

  return pts; // Closed by LWPolyline
}

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
  // Side View Projection: 
  // X-axis: Thickness (0 to thickness)
  // Y-axis: Height (0 to height)
  // 1. Draw Outer Boundary
  const points: any[] = [];
  points.push({ point: point2d(xOffset, yOffset) });
  points.push({ point: point2d(xOffset + thickness, yOffset) });
  points.push({ point: point2d(xOffset + thickness, yOffset + height) });
  points.push({ point: point2d(xOffset, yOffset + height) });

  dxf.addLWPolyline(points, { flags: LWPolylineFlags.Closed, layerName: "FRAME" });

  // 2. Rails (Horizontal lines in this view)
  dxf.addLine(point3d(xOffset, yOffset + bottomRail, 0), point3d(xOffset + thickness, yOffset + bottomRail, 0), { layerName: "BORDERS" });
  dxf.addLine(point3d(xOffset, yOffset + height - topRail, 0), point3d(xOffset + thickness, yOffset + height - topRail, 0), { layerName: "BORDERS" });

  // 3. Panel (Recessed)
  if (panelType !== "NONE") {
    const pThk = panelType === "REEDED_19MM" ? 19 : panelType === "MELAMINE_18MM" ? 18 : 12;
    // Y position: from bottomRail to height-topRail.
    // X position: Recessed from front (X=0) by frontFaceT.
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

  // Labels for verification
  dxf.addText(point3d(xOffset + thickness / 2 - 15, yOffset - 50, 0), 20, "SIDE VIEW", { layerName: "DIMENSIONS" });
  dxf.addText(point3d(xOffset, yOffset - 80, 0), 15, `Thk: ${thickness}mm`, { layerName: "DIMENSIONS" });
}


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
  // Top View Projection:
  // X-axis: Width (0 to width)
  // Y-axis: Thickness (0 to thickness)
  // X=0 is Left, X=Width is Right. Y=0 is Front, Y=Thickness is Back.

  // 1. Draw Outer Boundary
  const points: any[] = [];
  points.push({ point: point2d(xOffset, yOffset) });
  points.push({ point: point2d(xOffset + width, yOffset) });
  points.push({ point: point2d(xOffset + width, yOffset + thickness) });
  points.push({ point: point2d(xOffset, yOffset + thickness) });

  dxf.addLWPolyline(points, { flags: LWPolylineFlags.Closed, layerName: "FRAME" });

  // 2. Stiles (Vertical lines in this view? No, stiles are on left and right blocks)
  // Inner edge of Left Stile is at X = leftStile.
  dxf.addLine(point3d(xOffset + leftStile, yOffset, 0), point3d(xOffset + leftStile, yOffset + thickness, 0), { layerName: "BORDERS" });

  // Inner edge of Right Stile is at X = Width - rightStile.
  dxf.addLine(point3d(xOffset + width - rightStile, yOffset, 0), point3d(xOffset + width - rightStile, yOffset + thickness, 0), { layerName: "BORDERS" });

  // 3. Panel (Recessed)
  if (panelType !== "NONE") {
    const pThk = panelType === "REEDED_19MM" ? 19 : panelType === "MELAMINE_18MM" ? 18 : 12;
    // Panel sits between stiles.
    // Y position: Recessed from front (Y=0) by frontFaceT.
    const pY1 = yOffset + frontFaceT;
    const pY2 = yOffset + frontFaceT + pThk;

    const pX1 = xOffset + leftStile;
    const pX2 = xOffset + width - rightStile;

    // Draw Panel Rect in section
    const pPoints: any[] = [];
    pPoints.push({ point: point2d(pX1, pY1) });
    pPoints.push({ point: point2d(pX2, pY1) });
    pPoints.push({ point: point2d(pX2, pY2) });
    pPoints.push({ point: point2d(pX1, pY2) });

    dxf.addLWPolyline(pPoints, { flags: LWPolylineFlags.Closed, layerName: "PANELS" });

    // Hatch the panel? Maybe later.
  }

  // 4. Rebates (on top/bottom edges of door? No, rebates are on the stiles usually for double doors or jambs?)
  // If it's the rebate for the door stop:
  // Usually on the side edges (Stiles).
  if (rebateW > 0 && rebateD > 0) {
    // Left Edge Rebate (Back side)
    // Cut out from Back Left corner?
    // Back is Y=Thickness. Left is X=0.
    // Recess: X from 0 to rebateW. Y from Thickness-rebateD to Thickness.
    // But we already drew the outer box. We should draw lines indicating the cut.
    // Rebate Line: X=rebateW, from Y=Thk to Y=Thk-rebateD.

    const backY = yOffset + thickness;

    // Left Rebate
    dxf.addLine(point3d(xOffset + rebateW, backY, 0), point3d(xOffset + rebateW, backY - rebateD, 0), { layerName: "BORDERS" });
    dxf.addLine(point3d(xOffset, backY - rebateD, 0), point3d(xOffset + rebateW, backY - rebateD, 0), { layerName: "BORDERS" });

    // Right Rebate
    dxf.addLine(point3d(xOffset + width - rebateW, backY, 0), point3d(xOffset + width - rebateW, backY - rebateD, 0), { layerName: "BORDERS" });
    dxf.addLine(point3d(xOffset + width, backY - rebateD, 0), point3d(xOffset + width - rebateW, backY - rebateD, 0), { layerName: "BORDERS" });
  }

  // Dimensions
  dxf.addText(point3d(xOffset + width / 2 - 15, yOffset + thickness + 50, 0), 20, "TOP VIEW", { layerName: "DIMENSIONS" });
  dxf.addText(point3d(xOffset + leftStile / 2 - 10, yOffset - 30, 0), 12, `Stile: ${leftStile}`, { layerName: "DIMENSIONS" });
  dxf.addText(point3d(xOffset + width - rightStile / 2 - 20, yOffset - 30, 0), 12, `Stile: ${rightStile}`, { layerName: "DIMENSIONS" });
}

function drawDoorLeaf(
  dxf: DxfWriter,
  xOffset: number,
  yOffset: number,
  width: number,
  height: number,
  angledLeft: boolean,
  angledRight: boolean,
  leftCutW: number,
  leftCutH: number,
  rightCutW: number,
  rightCutH: number,
  panelType: string,
  panelCount: number,
  thickness: number,
  hinges: any[],
  isLeftLeafOfDouble: boolean
) {
  const points: any[] = [];
  points.push({ point: point2d(xOffset, yOffset) });
  points.push({ point: point2d(xOffset + width, yOffset) });

  if (angledRight) {
    points.push({ point: point2d(xOffset + width, yOffset + height - rightCutH) });
    points.push({ point: point2d(xOffset + width - rightCutW, yOffset + height) });
  } else {
    points.push({ point: point2d(xOffset + width, yOffset + height) });
  }

  if (angledLeft) {
    points.push({ point: point2d(xOffset + leftCutW, yOffset + height) });
    points.push({ point: point2d(xOffset, yOffset + height - leftCutH) });
  } else {
    points.push({ point: point2d(xOffset, yOffset + height) });
  }

  dxf.addLWPolyline(points, { flags: LWPolylineFlags.Closed, layerName: "FRAME" });

  // Panels (Simplified for now, matching the door outline)
  if (panelType !== "NONE" && panelCount > 0) {
    const stileWidth = 75;
    const railHeight = 75;
    const panelAreaW = width - stileWidth * 2;
    const panelAreaH = height - railHeight * 2;

    // Draw a single bounding box for panels if angled, or actual panels if rectangular
    // For brevity in DXF export of custom shapes, we often just provide the cutout profile
    // Here we'll draw one panel rectangle that's clipped by the same logic
    const pX = xOffset + stileWidth;
    const pY = yOffset + railHeight;

    const pPoints: any[] = [];
    pPoints.push({ point: point2d(pX, pY) });
    pPoints.push({ point: point2d(pX + panelAreaW, pY) });

    // Right cut check
    if (angledRight && rightCutH > 0 && rightCutW > 0) {
      const cutStartY = height - rightCutH;
      const pTopY = railHeight + panelAreaH;
      if (pTopY > cutStartY) {
        const cutRatio = rightCutW / rightCutH;
        const overlap = pTopY - cutStartY;
        pPoints.push({ point: point2d(pX + panelAreaW, yOffset + cutStartY) });
        pPoints.push({ point: point2d(pX + panelAreaW - overlap * cutRatio, yOffset + pTopY) });
      } else {
        pPoints.push({ point: point2d(pX + panelAreaW, yOffset + pTopY) });
      }
    } else {
      pPoints.push({ point: point2d(pX + panelAreaW, yOffset + railHeight + panelAreaH) });
    }

    // Left cut check
    if (angledLeft && leftCutH > 0 && leftCutW > 0) {
      const cutStartY = height - leftCutH;
      const pTopY = railHeight + panelAreaH;
      if (pTopY > cutStartY) {
        const cutRatio = leftCutW / leftCutH;
        const overlap = pTopY - cutStartY;
        pPoints.push({ point: point2d(pX + overlap * cutRatio, yOffset + pTopY) });
        pPoints.push({ point: point2d(pX, yOffset + cutStartY) });
      } else {
        pPoints.push({ point: point2d(pX, yOffset + pTopY) });
      }
    } else {
      pPoints.push({ point: point2d(pX, yOffset + railHeight + panelAreaH) });
    }

    dxf.addLWPolyline(pPoints, { flags: LWPolylineFlags.Closed, layerName: "PANELS" });
  }

  // Hinges
  if (hinges && hinges.length > 0) {
    hinges.forEach(hinge => {
      // Filter for double doors
      if (isLeftLeafOfDouble && hinge.side === "RIGHT") return;
      if (!isLeftLeafOfDouble && hinge.side === "LEFT" && xOffset > 0) return;

      const hY = yOffset + hinge.positionFromBottomMm;
      const hX = xOffset + (hinge.side === "LEFT" ? 22 : width - 22);

      // Validation
      let hidden = false;
      if (hinge.side === "LEFT" && angledLeft && leftCutW > 0 && leftCutH > 0) {
        if ((hX - xOffset) / leftCutW + (height - (hY - yOffset)) / leftCutH < 1) hidden = true;
      } else if (hinge.side === "RIGHT" && angledRight && rightCutW > 0 && rightCutH > 0) {
        if ((width - (hX - xOffset)) / rightCutW + (height - (hY - yOffset)) / rightCutH < 1) hidden = true;
      }

      if (!hidden) {
        dxf.addCircle(point3d(hX, hY, 0), 17.5, { layerName: "HINGES" });
        dxf.addCircle(point3d(hX, hY, 0), 2, { layerName: "HINGES" });
      }
    });
  }
}

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
  const dimOffset = 100;
  // Horizontal (Width)
  dxf.addLine(point3d(0, -dimOffset, 0), point3d(width, -dimOffset, 0), { layerName: "DIMENSIONS" });
  dxf.addText(point3d(width / 2, -dimOffset - 40, 0), 20, `${isDouble ? width * 2 + 10 : width}mm`, { layerName: "DIMENSIONS" });

  // Vertical (Height)
  dxf.addLine(point3d(-dimOffset, 0, 0), point3d(-dimOffset, height, 0), { layerName: "DIMENSIONS" });
  dxf.addText(point3d(-dimOffset - 40, height / 2, 0), 20, `${height}mm`, { layerName: "DIMENSIONS", rotation: 90 });

  // Border Labels (Internal)
  // Top Rail
  dxf.addText(point3d(width / 2 - 50, height - 50, 0), 15, `Top Rail: ${tRail}mm`, { layerName: "DIMENSIONS" });
  // Bottom Rail
  dxf.addText(point3d(width / 2 - 50, 50, 0), 15, `Bottom Rail: ${bRail}mm`, { layerName: "DIMENSIONS" });
  // Left Stile
  dxf.addText(point3d(25, height / 2, 0), 15, `Stile: ${lStile}mm`, { layerName: "DIMENSIONS", rotation: 90 });
  // Right Stile
  dxf.addText(point3d(width - 50, height / 2, 0), 15, `Stile: ${rStile}mm`, { layerName: "DIMENSIONS", rotation: 90 });
}

function addTitleBlock(dxf: DxfWriter, config: DxfDoorConfig) {
  const titleX = config.width / 2 + 400; // Shifted right due to Side View
  const titleY = 0;
  const lineHeight = 40;
  const specs = [
    `DOOR SPECIFICATION`,
    `Material: ${config.material}`,
    `Finish: ${config.finish}`,
    `Width: ${config.width}mm`,
    `Height: ${config.height}mm`,
    `Thickness: ${config.thickness}mm`,
    `Shape: ${config.shape.toUpperCase()}`
  ];

  specs.forEach((line, index) => {
    dxf.addText(point3d(titleX, titleY + (specs.length - index) * lineHeight, 0), 18, line, { layerName: "DIMENSIONS" });
  });
}
