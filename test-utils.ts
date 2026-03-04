import { getInnerProfilePoints, getInnerEdgesAtY } from './server/utils';

// Test Right Angled Door with Mid-Rails (Match test-angled-right-midrail.svg)
const width = 800;
const height = 2000;
const leftStile = 90;
const rightStile = 90;
const topRail = 90;
const bottomRail = 90;
const rightCutW = 400;
const rightCutH = 400;

console.log("=== Testing getInnerEdgesAtY for Mid-Rails ===");
const m1Bottom = 666;
const m1Top = 666 + 90;
const m2Bottom = 1333;
const m2Top = 1333 + 90;

const edgesM1B = getInnerEdgesAtY(m1Bottom, width, height, leftStile, rightStile, topRail, bottomRail, 90, 90, false, true, 0, 0, rightCutW, rightCutH);
const edgesM1T = getInnerEdgesAtY(m1Top, width, height, leftStile, rightStile, topRail, bottomRail, 90, 90, false, true, 0, 0, rightCutW, rightCutH);
console.log(`Midrail 1 (Y=${m1Bottom}-${m1Top}): X_Left=${edgesM1B.leftInner}, X_Right_Bottom=${edgesM1B.rightInner}, X_Right_Top=${edgesM1T.rightInner}`);

const edgesM2B = getInnerEdgesAtY(m2Bottom, width, height, leftStile, rightStile, topRail, bottomRail, 90, 90, false, true, 0, 0, rightCutW, rightCutH);
const edgesM2T = getInnerEdgesAtY(m2Top, width, height, leftStile, rightStile, topRail, bottomRail, 90, 90, false, true, 0, 0, rightCutW, rightCutH);
console.log(`Midrail 2 (Y=${m2Bottom}-${m2Top}): X_Left=${edgesM2B.leftInner}, X_Right_Bottom=${edgesM2B.rightInner}, X_Right_Top=${edgesM2T.rightInner}`);

console.log("\n=== Testing getInnerProfilePoints for Top Panel ===");
// Only 3 panels, so the top panel starts at m2Top and goes to height-topRail
const pY_bottom = m2Top;
const pY_top = height - topRail;

const pX_left = leftStile; // no panel padding for raw test
const pX_right = width - rightStile;

const points = getInnerProfilePoints(
    width, height,
    pX_left, width - pX_right, height - pY_top, pY_bottom,
    false, true,
    0, 0,
    rightCutW, rightCutH,
    90, 90
);
console.log("Top Panel Points:", points);
