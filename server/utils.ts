export interface Point {
    x: number;
    y: number;
}

/**
 * Line intersection of Ax + By = C
 */
export function intersect(A1: number, B1: number, C1: number, A2: number, B2: number, C2: number): Point | null {
    const det = A1 * B2 - A2 * B1;
    if (Math.abs(det) < 1e-6) return null;
    return {
        x: (B2 * C1 - B1 * C2) / det,
        y: (A1 * C2 - A2 * C1) / det
    };
}

/**
 * Generates points for interior profiles (panels, rebates, holes)
 * mirroring the door's angled shape with uniform border widths.
 * Ordering is CCW starting from bottom-left.
 */
export function getInnerProfilePoints(
    w: number, h: number,
    ls: number, rs: number, ts: number, br: number,
    angL: boolean, angR: boolean,
    lW: number, lH: number, rW: number, rH: number,
    arwL: number = 90, arwR: number = 90
): Point[] {
    const yBottom = br;
    const yTop = h - ts;
    if (yTop <= yBottom) return [];

    const ySamples: number[] = [yBottom, yTop];

    // Calculate elbow points (where stile meets angled rail)
    if (angL && lW > 0.1 && lH > 0.1) {
        const mL = lH / lW;
        const hypL = Math.sqrt(lW * lW + lH * lH);
        const yElbowL = mL * ls + (h - lH) - arwL * (hypL / lW);
        if (yElbowL > yBottom && yElbowL < yTop) ySamples.push(yElbowL);
    }

    if (angR && rW > 0.1 && rH > 0.1) {
        const mR = -rH / rW;
        const hypR = Math.sqrt(rW * rW + rH * rH);
        const yElbowR = mR * (rW - rs) + h - arwR * (hypR / rW);
        if (yElbowR > yBottom && yElbowR < yTop) ySamples.push(yElbowR);
    }

    // Sort unique samples
    const sortedYSamples = Array.from(new Set(ySamples)).sort((a, b) => a - b);

    const ptsLeft: Point[] = [];
    const ptsRight: Point[] = [];

    sortedYSamples.forEach(y => {
        const { leftInner, rightInner } = getInnerEdgesAtY(y, w, h, ls, rs, ts, br, arwL, arwR, angL, angR, lW, lH, rW, rH);
        ptsLeft.push({ x: leftInner, y });
        ptsRight.push({ x: rightInner, y });
    });

    // CCW order: left edge bottom-to-top, then right edge top-to-bottom
    return [...ptsLeft, ...ptsRight.reverse()];
}

/**
 * Calculates the inner (panel/hole/rail) edges at a given Y height (millimetres).
 * Accounts for stile and rail widths, including angled ones.
 * Reflects logic in client's doorUtils.ts
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
    angL: boolean,
    angR: boolean,
    lW: number,
    lH: number,
    rW: number,
    rH: number,
    inset: number = 0
): { leftInner: number; rightInner: number } {
    let leftInner = ls + inset;
    let rightInner = w - rs - inset;

    // Angled side constraints
    if (angL && lH > 0.1 && lW > 0.1) {
        const hyp = Math.sqrt(lW * lW + lH * lH);
        const totalVertShift = (arwL + inset) * (hyp / lW);
        const m = lH / lW;
        // y = m*(x - 0) + (h - lH) - shift -> simplified for server coordinate system (0,0 is bottom-left)
        // In client: y' = m*x' + c' where y' is height-relative.
        // Let's use the line equation: y = m*x + (h - lH) - shift
        // x = (y - (h - lH) + shift) / m
        const xAtY = (y - (h - lH) + totalVertShift) / m;
        leftInner = Math.max(leftInner, xAtY);
    }

    if (angR && rH > 0.1 && rW > 0.1) {
        const hyp = Math.sqrt(rW * rW + rH * rH);
        const totalVertShift = (arwR + inset) * (hyp / rW);
        const m = -rH / rW;
        // y = m*(x - (w - rW)) + h - shift
        // x = (y - h + shift) / m + (w - rW)
        const xAtY = (y - h + totalVertShift) / m + (w - rW);
        rightInner = Math.min(rightInner, xAtY);
    }

    return { leftInner, rightInner };
}
