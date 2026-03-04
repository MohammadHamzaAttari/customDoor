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
    ls: number, rs: number, tr: number, br: number,
    angL: boolean, angR: boolean,
    lW: number, lH: number, rW: number, rH: number,
    arwL: number = 90, arwR: number = 90
): Point[] {
    const pts: Point[] = [];

    let lineRA = null;
    if (angR && rW > 0 && rH > 0) {
        const L = Math.sqrt(rW * rW + rH * rH);
        // Distance offset from outer diagonal (Angled Rail Width)
        const sOffsetR = arwR;
        // Outer Right: rH*x + rW*y = rH*w - rH*rW + rW*h
        const C = rH * w - rH * rW + rW * h;
        lineRA = { A: rH, B: rW, C: C - sOffsetR * L };
    }

    let lineLA = null;
    if (angL && lW > 0 && lH > 0) {
        const L = Math.sqrt(lW * lW + lH * lH);
        // Distance offset from outer diagonal (Angled Rail Width)
        const sOffsetL = arwL;
        // Outer Left: lH*x - lW*y = lH*lW - lW*h
        const C = lH * lW - lW * h;
        lineLA = { A: lH, B: -lW, C: C + sOffsetL * L };
    }

    // 1. Bottom Left (ls, br)
    pts.push({ x: ls, y: br });

    // 2. Bottom Right (w-rs, br)
    pts.push({ x: w - rs, y: br });

    // 3. Right side to Top
    if (lineRA) {
        // Intersect Right Stile (x = w-rs) with Right Angled
        const p1 = intersect(1, 0, w - rs, lineRA.A, lineRA.B, lineRA.C);

        // Safety check: point must be between bottom rail and top rail boundary
        if (p1 && p1.y > br && p1.y < h - tr) {
            pts.push(p1);
        }

        // Handle Peak or Top Rail
        if (lineLA) {
            const peak = intersect(lineLA.A, lineLA.B, lineLA.C, lineRA.A, lineRA.B, lineRA.C);

            if (peak && peak.y <= h - tr) {
                // p1 is valid if it's below the peak
                if (p1 && p1.y > peak.y) {
                    pts.pop();
                }
                pts.push(peak);
            } else {
                // Flat top
                const p2 = intersect(0, 1, h - tr, lineRA.A, lineRA.B, lineRA.C);
                const p3 = intersect(0, 1, h - tr, lineLA.A, lineLA.B, lineLA.C);

                if (p2 && p2.x > ls && p2.x < w - rs) {
                    pts.push(p2);
                } else if (!p1 && p2 && p2.x >= w - rs) {
                    // If no intersection on right stile, and top rail intersection is right of stile,
                    // then this panel's top-right corner is just the stile corner.
                    pts.push({ x: w - rs, y: h - tr });
                }

                if (p3 && p3.x < (p2 ? p2.x : w - rs) && p3.x > ls) {
                    pts.push(p3);
                }
            }
        } else {
            // Just Right angle to Top Rail
            const p2 = intersect(0, 1, h - tr, lineRA.A, lineRA.B, lineRA.C);
            if (p2 && p2.x > ls && p2.x < w - rs) {
                pts.push(p2);
                pts.push({ x: ls, y: h - tr });
            } else if (p2 && p2.x >= w - rs) {
                // Angle is entirely above or to the right of this panel
                pts.push({ x: w - rs, y: h - tr });
                pts.push({ x: ls, y: h - tr });
            } else if (p2) {
                // Cut hits the left stile directly
                const pL = intersect(1, 0, ls, lineRA.A, lineRA.B, lineRA.C);
                if (pL && pL.y > br && pL.y < h - tr) pts.push(pL);
                else pts.push({ x: ls, y: h - tr });
            } else {
                pts.push({ x: ls, y: h - tr });
            }
        }
    } else if (lineLA) {
        // Just Left angle
        const pTop = intersect(0, 1, h - tr, lineLA.A, lineLA.B, lineLA.C);
        if (pTop && pTop.x < w - rs && pTop.x > ls) {
            pts.push({ x: w - rs, y: h - tr });
            pts.push(pTop);
        } else if (pTop && pTop.x <= ls) {
            // Angle is entirely above or to the left of this panel
            pts.push({ x: w - rs, y: h - tr });
            pts.push({ x: ls, y: h - tr });
        } else if (pTop) {
            // Intersects right stile
            const pR = intersect(1, 0, w - rs, lineLA.A, lineLA.B, lineLA.C);
            if (pR && pR.y > br && pR.y < h - tr) {
                pts.push(pR);
            } else {
                pts.push({ x: w - rs, y: h - tr });
            }
        } else {
            pts.push({ x: w - rs, y: h - tr });
            pts.push({ x: ls, y: h - tr });
        }
    } else {
        // Standard Rectangle
        pts.push({ x: w - rs, y: h - tr });
        pts.push({ x: ls, y: h - tr });
    }

    // 4. Back to Left side
    if (lineLA) {
        const pL = intersect(1, 0, ls, lineLA.A, lineLA.B, lineLA.C);
        const last = pts[pts.length - 1];
        if (pL && pL.y > br && pL.y < h - tr && (!last || Math.abs(last.x - pL.x) > 0.1 || Math.abs(last.y - pL.y) > 0.1)) {
            if (pL.y < last.y) {
                pts.push(pL);
            }
        }
    }

    return pts;
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
