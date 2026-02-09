// client/src/lib/stores/useDoorConfig.ts
import { create } from "zustand";
import { getPresetById, calculateAngleFromCutout } from "../anglePresets";

export type DoorPreset = "single" | "double" | "shaker_2" | "shaker_4" | "shaker_6" | "panel_3" | "panel_4" | "panel_6";
export type PanelType = "STANDARD_12MM" | "REEDED_19MM" | "MELAMINE_18MM" | "FRETWORK" | "GLASS" | "NONE";
export type PanelOrientation = "vertical" | "horizontal";
export type BorderStyle = "none" | "simple" | "detailed";
export type DoorShape = "rectangular" | "angled";
export type MaterialType = "MDF";
export type FinishType = "RAW_UNASSEMBLED" | "ASSEMBLED_PREP" | "PRIMED";
export type HingeType = "SCREW_POINTS" | "INSERTA";
export type AnglePresetId = "under-stair-standard" | "under-stair-gentle" | "loft-access" | "corner-unit" | "steep-attic" | "custom";

export interface Hinge {
  id: string;
  positionFromBottomMm: number;
  side: "LEFT" | "RIGHT";
  type: HingeType;
}

export interface MidRail {
  id: string;
  positionFromBottom: number;
  dimension: number;
}

export interface DoorConfig {
  width: number;
  height: number;
  thickness: number;
  preset: DoorPreset;
  panelType: PanelType;
  panelCount: number;
  panelOrientation: PanelOrientation;
  shape: DoorShape;

  angledLeft: boolean;
  angledRight: boolean;
  leftAnglePreset: AnglePresetId;
  rightAnglePreset: AnglePresetId;
  leftTriangleCutoutWidth: number;
  leftTriangleCutoutHeight: number;
  rightTriangleCutoutWidth: number;
  rightTriangleCutoutHeight: number;
  leftAngleDegrees: number;
  rightAngleDegrees: number;

  borderWidth: number;
  customBorders: boolean;
  leftStile: number;
  rightStile: number;
  bottomRail: number;
  topRail: number;

  rebateWidthMm: number;
  rebateDepthMm: number;
  frontFaceThicknessMm: number;
  cornerRadiusMm: number;

  midRailsEnabled: boolean;
  midRailsEqualise: boolean;
  midRails: MidRail[];

  hingeDrilling: boolean;
  hinges: Hinge[];

  material: MaterialType;
  finish: FinishType;
  showDimensions: boolean;
  price: number;
  selectedSection: string;
}

interface DoorConfigStore extends DoorConfig {
  setWidth: (width: number) => void;
  setHeight: (height: number) => void;
  setThickness: (thickness: number) => void;
  setPreset: (preset: DoorPreset) => void;
  setPanelType: (type: PanelType) => void;
  setPanelCount: (count: number) => void;
  setPanelOrientation: (orientation: PanelOrientation) => void;
  setShape: (shape: DoorShape) => void;

  setAngledLeft: (enabled: boolean) => void;
  setAngledRight: (enabled: boolean) => void;
  setLeftAnglePreset: (presetId: AnglePresetId) => void;
  setRightAnglePreset: (presetId: AnglePresetId) => void;
  setLeftTriangleCutoutWidth: (width: number) => void;
  setLeftTriangleCutoutHeight: (height: number) => void;
  setRightTriangleCutoutWidth: (width: number) => void;
  setRightTriangleCutoutHeight: (height: number) => void;
  applyAnglePreset: (side: "left" | "right", presetId: AnglePresetId) => void;

  setBorderWidth: (width: number) => void;
  setCustomBorders: (enabled: boolean) => void;
  setLeftStile: (width: number) => void;
  setRightStile: (width: number) => void;
  setBottomRail: (height: number) => void;
  setTopRail: (height: number) => void;

  setRebateWidth: (width: number) => void;
  setRebateDepth: (depth: number) => void;
  setFrontFaceThickness: (thickness: number) => void;
  setCornerRadius: (radius: number) => void;

  setMidRailsEnabled: (enabled: boolean) => void;
  setMidRailsEqualise: (enabled: boolean) => void;
  addMidRail: () => void;
  removeMidRail: (id: string) => void;
  updateMidRail: (id: string, field: 'positionFromBottom' | 'dimension', value: number) => void;

  setHingeDrilling: (enabled: boolean) => void;
  addHinge: () => void;
  removeHinge: (id: string) => void;
  updateHinge: (id: string, field: keyof Hinge, value: any) => void;

  setFinish: (finish: FinishType) => void;
  toggleDimensions: () => void;
  calculatePrice: () => void;
  resetConfig: () => void;
  setSelectedSection: (section: string) => void;
}

const initialState: DoorConfig = {
  width: 450,
  height: 1200,
  thickness: 22,
  preset: "single",
  panelType: "STANDARD_12MM",
  panelCount: 1,
  panelOrientation: "vertical",
  shape: "rectangular",

  angledLeft: false,
  angledRight: false,
  leftAnglePreset: "under-stair-standard",
  rightAnglePreset: "under-stair-standard",
  leftTriangleCutoutWidth: 180,
  leftTriangleCutoutHeight: 400,
  rightTriangleCutoutWidth: 180,
  rightTriangleCutoutHeight: 400,
  leftAngleDegrees: 42,
  rightAngleDegrees: 42,

  borderWidth: 70,
  customBorders: false,
  leftStile: 70,
  rightStile: 70,
  bottomRail: 70,
  topRail: 70,

  rebateWidthMm: 10,
  rebateDepthMm: 14,
  frontFaceThicknessMm: 8,
  cornerRadiusMm: 2.5,

  midRailsEnabled: false,
  midRailsEqualise: false,
  midRails: [],

  hingeDrilling: false,
  hinges: [],

  material: "MDF",
  finish: "RAW_UNASSEMBLED",
  showDimensions: true,
  price: 0,
  selectedSection: "door-style",
};

let midRailIdCounter = 0;
let hingeIdCounter = 0;

export const useDoorConfig = create<DoorConfigStore>((set, get) => ({
  ...initialState,

  setWidth: (width: number) => {
    set({ width });
    const state = get();
    if (state.angledLeft && state.leftAnglePreset !== "custom") {
      get().applyAnglePreset("left", state.leftAnglePreset);
    }
    if (state.angledRight && state.rightAnglePreset !== "custom") {
      get().applyAnglePreset("right", state.rightAnglePreset);
    }
    get().calculatePrice();
  },

  setHeight: (height: number) => {
    set({ height });
    const state = get();
    if (state.angledLeft && state.leftAnglePreset !== "custom") {
      get().applyAnglePreset("left", state.leftAnglePreset);
    }
    if (state.angledRight && state.rightAnglePreset !== "custom") {
      get().applyAnglePreset("right", state.rightAnglePreset);
    }
    get().calculatePrice();
  },

  setThickness: (thickness: number) => {
    set({ thickness });
    get().calculatePrice();
  },

  setPreset: (preset: DoorPreset) => {
    set({ preset });
    get().calculatePrice();
  },

  setPanelType: (panelType: PanelType) => {
    set({ panelType });
    get().calculatePrice();
  },

  setPanelCount: (panelCount: number) => {
    set({ panelCount });
    get().calculatePrice();
  },

  setPanelOrientation: (panelOrientation: PanelOrientation) => {
    set({ panelOrientation });
  },

  setShape: (shape: DoorShape) => {
    set({ shape });
  },

  setAngledLeft: (angledLeft: boolean) => {
    set({ angledLeft });
    if (angledLeft) {
      get().applyAnglePreset("left", get().leftAnglePreset);
    }
    get().calculatePrice();
  },

  setAngledRight: (angledRight: boolean) => {
    set({ angledRight });
    if (angledRight) {
      get().applyAnglePreset("right", get().rightAnglePreset);
    }
    get().calculatePrice();
  },

  setLeftAnglePreset: (presetId: AnglePresetId) => {
    set({ leftAnglePreset: presetId });
    if (presetId !== "custom") {
      get().applyAnglePreset("left", presetId);
    }
  },

  setRightAnglePreset: (presetId: AnglePresetId) => {
    set({ rightAnglePreset: presetId });
    if (presetId !== "custom") {
      get().applyAnglePreset("right", presetId);
    }
  },

  applyAnglePreset: (side: "left" | "right", presetId: AnglePresetId) => {
    const state = get();
    const preset = getPresetById(presetId);
    if (!preset || presetId === "custom") return;

    const cutout = preset.calculateCutout(state.width, state.height, state.borderWidth);
    const angle = calculateAngleFromCutout(cutout.width, cutout.height);

    if (side === "left") {
      set({
        leftTriangleCutoutWidth: cutout.width,
        leftTriangleCutoutHeight: cutout.height,
        leftAngleDegrees: angle,
      });
    } else {
      set({
        rightTriangleCutoutWidth: cutout.width,
        rightTriangleCutoutHeight: cutout.height,
        rightAngleDegrees: angle,
      });
    }
  },

  setLeftTriangleCutoutWidth: (width: number) => {
    const state = get();
    set({
      leftTriangleCutoutWidth: width,
      leftAnglePreset: "custom",
      leftAngleDegrees: calculateAngleFromCutout(width, state.leftTriangleCutoutHeight),
    });
  },

  setLeftTriangleCutoutHeight: (height: number) => {
    const state = get();
    set({
      leftTriangleCutoutHeight: height,
      leftAnglePreset: "custom",
      leftAngleDegrees: calculateAngleFromCutout(state.leftTriangleCutoutWidth, height),
    });
  },

  setRightTriangleCutoutWidth: (width: number) => {
    const state = get();
    set({
      rightTriangleCutoutWidth: width,
      rightAnglePreset: "custom",
      rightAngleDegrees: calculateAngleFromCutout(width, state.rightTriangleCutoutHeight),
    });
  },

  setRightTriangleCutoutHeight: (height: number) => {
    const state = get();
    set({
      rightTriangleCutoutHeight: height,
      rightAnglePreset: "custom",
      rightAngleDegrees: calculateAngleFromCutout(state.rightTriangleCutoutWidth, height),
    });
  },

  setBorderWidth: (borderWidth: number) => {
    set({
      borderWidth,
      leftStile: borderWidth,
      rightStile: borderWidth,
      bottomRail: borderWidth,
      topRail: borderWidth,
    });
    const state = get();
    if (state.angledLeft && state.leftAnglePreset !== "custom") {
      get().applyAnglePreset("left", state.leftAnglePreset);
    }
    if (state.angledRight && state.rightAnglePreset !== "custom") {
      get().applyAnglePreset("right", state.rightAnglePreset);
    }
  },

  setCustomBorders: (customBorders: boolean) => {
    const state = get();
    if (!customBorders) {
      set({
        customBorders,
        leftStile: state.borderWidth,
        rightStile: state.borderWidth,
        bottomRail: state.borderWidth,
        topRail: state.borderWidth,
      });
    } else {
      set({ customBorders });
    }
  },

  setLeftStile: (leftStile: number) => set({ leftStile }),
  setRightStile: (rightStile: number) => set({ rightStile }),
  setBottomRail: (bottomRail: number) => set({ bottomRail }),
  setTopRail: (topRail: number) => set({ topRail }),

  setRebateWidth: (rebateWidthMm: number) => set({ rebateWidthMm }),
  setRebateDepth: (rebateDepthMm: number) => set({ rebateDepthMm }),
  setFrontFaceThickness: (frontFaceThicknessMm: number) => set({ frontFaceThicknessMm }),
  setCornerRadius: (cornerRadiusMm: number) => set({ cornerRadiusMm }),

  setMidRailsEnabled: (midRailsEnabled: boolean) => {
    set({ midRailsEnabled });
    if (midRailsEnabled && get().midRails.length === 0) {
      get().addMidRail();
    }
    get().calculatePrice();
  },

  setMidRailsEqualise: (midRailsEqualise: boolean) => {
    const state = get();
    if (midRailsEqualise && state.midRails.length > 0) {
      const railCount = state.midRails.length;
      const usableHeight = state.height - state.bottomRail - state.topRail;
      const spacing = usableHeight / (railCount + 1);

      const updatedRails = state.midRails.map((rail, index) => ({
        ...rail,
        positionFromBottom: Math.round(state.bottomRail + spacing * (index + 1)),
      }));

      set({ midRailsEqualise, midRails: updatedRails });
    } else {
      set({ midRailsEqualise });
    }
  },

  addMidRail: () => {
    const state = get();
    const newRail: MidRail = {
      id: `rail_${++midRailIdCounter}`,
      positionFromBottom: Math.round(state.height / 2),
      dimension: 70,
    };
    set({ midRails: [...state.midRails, newRail] });
    get().calculatePrice();
  },

  removeMidRail: (id: string) => {
    set((state) => ({
      midRails: state.midRails.filter(rail => rail.id !== id)
    }));
    get().calculatePrice();
  },

  updateMidRail: (id: string, field: 'positionFromBottom' | 'dimension', value: number) => {
    set((state) => ({
      midRails: state.midRails.map(rail =>
        rail.id === id ? { ...rail, [field]: value } : rail
      )
    }));
  },

  setHingeDrilling: (hingeDrilling: boolean) => {
    set({ hingeDrilling });
    if (hingeDrilling && get().hinges.length === 0) {
      const state = get();
      const h1: Hinge = { id: `hinge_${++hingeIdCounter}`, positionFromBottomMm: 100, side: "LEFT", type: "SCREW_POINTS" };
      const h2: Hinge = { id: `hinge_${++hingeIdCounter}`, positionFromBottomMm: state.height - 100, side: "LEFT", type: "SCREW_POINTS" };
      set({ hinges: [h1, h2] });
    }
    get().calculatePrice();
  },

  addHinge: () => {
    const state = get();
    const newHinge: Hinge = {
      id: `hinge_${++hingeIdCounter}`,
      positionFromBottomMm: Math.round(state.height / 2),
      side: "LEFT",
      type: "SCREW_POINTS",
    };
    set({ hinges: [...state.hinges, newHinge] });
    get().calculatePrice();
  },

  removeHinge: (id: string) => {
    set((state) => ({
      hinges: state.hinges.filter(h => h.id !== id)
    }));
    get().calculatePrice();
  },

  updateHinge: (id: string, field: keyof Hinge, value: any) => {
    set((state) => ({
      hinges: state.hinges.map(h => h.id === id ? { ...h, [field]: value } : h)
    }));
  },

  setFinish: (finish: FinishType) => {
    set({ finish });
    get().calculatePrice();
  },

  toggleDimensions: () => {
    set((state) => ({ showDimensions: !state.showDimensions }));
  },

  calculatePrice: () => {
    const state = get();

    const FIXED_FEE = 3.00;
    const SQM_RATE_SHAKER = 75.00;
    const SQM_RATE_SLAB = 45.00;
    const ANGLED_FEE = 25.00;
    const MID_RAIL_FEE = 5.00;
    const HINGE_HOLE_FEE = 1.50;

    const areaM2 = (state.width * state.height) / 1000000;
    const isSlab = state.panelType === "NONE";
    const sqmRate = isSlab ? SQM_RATE_SLAB : SQM_RATE_SHAKER;

    let price = FIXED_FEE + (areaM2 * sqmRate);

    if (state.angledLeft || state.angledRight) {
      price += ANGLED_FEE;
    }

    if (state.midRailsEnabled) {
      price += state.midRails.length * MID_RAIL_FEE;
    }

    if (state.hingeDrilling) {
      price += state.hinges.length * HINGE_HOLE_FEE;
    }

    const finishMultipliers: Record<FinishType, number> = {
      RAW_UNASSEMBLED: 1.0,
      ASSEMBLED_PREP: 1.3,
      PRIMED: 1.8,
    };
    price *= finishMultipliers[state.finish] || 1.0;

    if (state.panelType === "REEDED_19MM") {
      price += 10 + (areaM2 * 60);
    } else if (state.panelType === "MELAMINE_18MM") {
      price += 10 + (areaM2 * 40);
    }

    set({ price: Math.round(price * 100) / 100 });
  },

  resetConfig: () => {
    set(initialState);
    get().calculatePrice();
  },

  setSelectedSection: (selectedSection: string) => {
    set({ selectedSection });
  },
}));

// Initialize price on load
setTimeout(() => {
  useDoorConfig.getState().calculatePrice();
}, 0);