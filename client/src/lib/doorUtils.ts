import { MidRail } from "./stores/useDoorConfig";

export interface HoleSection {
    bottom: number;
    top: number;
    isTop: boolean;
}

export interface RoofPoint {
    x: number;
    y: number;
}

/**
 * Calculates the outer edges of the door at a given Y height.
 * All units in meters.
 */
export function getOuterEdgesAtY(
    y: number,
    w: number,
    h: number,
    angledLeft: boolean,
    angledRight: boolean,
    lcw: number,
    lch: number,
    rcw: number,
    rch: number
): { leftEdge: number; rightEdge: number } {
    let leftEdge = -w / 2;
    let rightEdge = w / 2;

    if (angledLeft && lch > 0.001 && lcw > 0.001) {
        const angleStartY = h / 2 - lch;
        if (y > angleStartY) {
            const t = (y - angleStartY) / lch;
            leftEdge = -w / 2 + lcw * t;
        }
    }

    if (angledRight && rch > 0.001 && rcw > 0.001) {
        const angleStartY = h / 2 - rch;
        if (y > angleStartY) {
            const t = (y - angleStartY) / rch;
            rightEdge = w / 2 - rcw * t;
        }
    }

    return { leftEdge, rightEdge };
}

/**
 * Calculates the inner (panel/hole) edges at a given Y height.
 * Accounts for stile and rail widths, including angled ones.
 * Now supports a perpendicular inset for perfect padding.
 * All units in meters.
 */
export function getInnerEdgesAtY(
    y: number,
    w: number,
    h: number,
    ls: number,
    rs: number,
    ts: number,
    bs: number,
    arwL: number,
    arwR: number,
    angledLeft: boolean,
    angledRight: boolean,
    lcw: number,
    lch: number,
    rcw: number,
    rch: number,
    inset: number = 0 // New parameter for perpendicular padding
): { leftInner: number; rightInner: number } {
    // stile + inset (if not angled)
    let leftInner = -w / 2 + ls + inset;
    let rightInner = w / 2 - rs - inset;

    // Angled side constraints
    if (angledLeft && lch > 0.001 && lcw > 0.001) {
        const hyp = Math.sqrt(lcw * lcw + lch * lch);
        // We shift the line inward by (arwL + inset) perpendicularly
        const totalVertShift = (arwL + inset) * (hyp / lcw);
        const m = lch / lcw;
        const c = (h / 2 - lch) - m * (-w / 2) - totalVertShift;
        const xAtY = (y - c) / m;
        leftInner = Math.max(leftInner, xAtY);
    }

    if (angledRight && rch > 0.001 && rcw > 0.001) {
        const hyp = Math.sqrt(rcw * rcw + rch * rch);
        // We shift the line inward by (arwR + inset) perpendicularly
        const totalVertShift = (arwR + inset) * (hyp / rcw);
        const m = -rch / rcw;
        const c = (h / 2 - rch) - m * (w / 2) - totalVertShift;
        const xAtY = (y - c) / m;
        rightInner = Math.min(rightInner, xAtY);
    }

    return { leftInner, rightInner };
}

/**
 * Splits the panel height into sections based on mid-rails or panelCount.
 */
export function getHoleSections(
    midRails: MidRail[],
    h: number,
    bottomRail: number,
    topRail: number,
    panelCount: number = 1
): HoleSection[] {
    const panelBottom = -h / 2 + bottomRail;
    const panelTop = h / 2 - topRail;
    const panelPadding = 0.015; // 15mm default padding/gap

    if (panelTop <= panelBottom + 0.005) return [];

    // If we have manual mid-rails, they take precedence
    if (midRails && midRails.length > 0) {
        const sorted = midRails
            .map((r) => {
                const railBottom = -h / 2 + r.positionFromBottom / 1000;
                const railTop = railBottom + r.dimension / 1000;
                return { bottom: railBottom, top: railTop };
            })
            .filter((r) => r.top > panelBottom && r.bottom < panelTop)
            .sort((a, b) => a.bottom - b.bottom);

        const sections: HoleSection[] = [];
        let lastTop = panelBottom;

        for (const rail of sorted) {
            const effectiveBottom = Math.max(rail.bottom, panelBottom);
            const effectiveTop = Math.min(rail.top, panelTop);
            if (effectiveBottom > lastTop + 0.005) {
                sections.push({ bottom: lastTop, top: effectiveBottom, isTop: false });
            }
            lastTop = Math.max(lastTop, effectiveTop);
        }

        if (lastTop < panelTop - 0.005) {
            sections.push({ bottom: lastTop, top: panelTop, isTop: true });
        }

        if (sections.length > 0) {
            sections.forEach((s) => (s.isTop = false));
            sections[sections.length - 1].isTop = true;
        }
        return sections;
    }

    // Otherwise use panelCount for automatic splitting (horizontal slices)
    const sections: HoleSection[] = [];
    const totalPanelArea = panelTop - panelBottom;
    const netPanelArea = totalPanelArea - (panelCount - 1) * panelPadding;
    const individualPanelHeight = netPanelArea / panelCount;

    for (let i = 0; i < panelCount; i++) {
        const b = panelBottom + i * (individualPanelHeight + panelPadding);
        const t = b + individualPanelHeight;
        sections.push({
            bottom: b,
            top: t,
            isTop: i === panelCount - 1
        });
    }

    return sections;
}

/**
 * Calculates the polygonal points for the top of a panel or hole 
 * when it intersects with an angled door top.
 */
export function createRoofPoints(
    rightX: number,
    leftX: number,
    flatTopInset: number,
    angledInsetL: number,
    angledInsetR: number,
    w: number,
    h: number,
    angledLeft: boolean,
    angledRight: boolean,
    leftCutW: number,
    leftCutH: number,
    rightCutW: number,
    rightCutH: number
): RoofPoint[] {
    const hasL = angledLeft && leftCutH > 0.001 && leftCutW > 0.001;
    const hasR = angledRight && rightCutH > 0.001 && rightCutW > 0.001;

    // Line equations for angled edges (in door-center coords)
    // Right: y = mR * x + cR
    const mR = hasR ? -rightCutH / rightCutW : 0;
    const cR = hasR ? (h / 2 - rightCutH) - mR * (w / 2) : h / 2;
    // Left: y = mL * x + cL
    const mL = hasL ? leftCutH / leftCutW : 0;
    const cL = hasL ? (h / 2 - leftCutH) - mL * (-w / 2) : h / 2;

    // Perpendicular inset shift
    const lHyp = hasL ? Math.sqrt(leftCutW * leftCutW + leftCutH * leftCutH) : 0;
    const rHyp = hasR
        ? Math.sqrt(rightCutW * rightCutW + rightCutH * rightCutH)
        : 0;
    const lShift =
        hasL && leftCutW > 0 ? angledInsetL * (lHyp / leftCutW) : 0;
    const rShift =
        hasR && rightCutW > 0 ? angledInsetR * (rHyp / rightCutW) : 0;

    // Calculate intersection points for the inner lines
    // Inner Top Line: y = h/2 - flatTopInset
    // Inner Right Line: y = mR * x + cR - rShift
    // Intersection X (Right):
    // h/2 - flatTopInset = mR * x + cR - rShift
    // x = ((h/2 - flatTopInset) - (cR - rShift)) / mR

    let intersectionXR = w / 2; // Default if no angle
    if (hasR) {
        intersectionXR = ((h / 2 - flatTopInset) - (cR - rShift)) / mR;
    }

    let intersectionXL = -w / 2; // Default if no angle
    if (hasL) {
        intersectionXL = ((h / 2 - flatTopInset) - (cL - lShift)) / mL;
    }

    const getY = (x: number): number => {
        if (hasR && x > intersectionXR) {
            return mR * x + cR - rShift;
        }
        if (hasL && x < intersectionXL) {
            return mL * x + cL - lShift;
        }
        return h / 2 - flatTopInset;
    };

    const samples: number[] = [rightX, leftX];
    if (hasR) {
        // Add intersection point to samples so we get a vertex exactly at the corner
        if (intersectionXR < rightX && intersectionXR > leftX) {
            samples.push(intersectionXR);
        }
    }
    if (hasL) {
        if (intersectionXL < rightX && intersectionXL > leftX) {
            samples.push(intersectionXL);
        }
    }

    return Array.from(new Set(samples))
        .sort((a, b) => b - a)
        .map((x) => ({ x, y: Math.max(getY(x), -h / 2 + 0.01) }));
}
