import { useState } from "react";
import { useDoorConfig } from "@/lib/stores/useDoorConfig";
import { useDoorStore } from "@/lib/stores/useDoorStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ShoppingCart,
  Check,
  Package,
  Plus,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLocation } from "wouter";

export function ProductDetailsSidebar() {
  const [, setLocation] = useLocation();
  const config = useDoorConfig();
  const { addDoor, doors } = useDoorStore();

  const {
    width,
    height,
    thickness,
    panelType,
    panelCount,
    panelOrientation,
    preset,
    finish,
    price,
    shape,
    angledLeft,
    angledRight,
    leftAngleDegrees,
    rightAngleDegrees,
    leftTriangleCutoutWidth,
    leftTriangleCutoutHeight,
    rightTriangleCutoutWidth,
    rightTriangleCutoutHeight,
    borderWidth,
    customBorders,
    leftStile,
    rightStile,
    topRail,
    bottomRail,
    rebateWidthMm,
    rebateDepthMm,
    frontFaceThicknessMm,
    cornerRadiusMm,
    rearCornerRadiusMm,
    midRailsEnabled,
    midRailsEqualise,
    midRails,
    hingeDrilling,
    hinges,
    material,
    showDimensions,
    isNewSession,
    editingCartItemId,
    leftAngledRailWidth,
    rightAngledRailWidth,
  } = config;

  // ✅ Single source of truth
  const cartCount = doors.reduce((sum: number, d: any) => sum + d.qty, 0);
  const [justAdded, setJustAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // Panel type labels
  const panelLabels: Record<string, string> = {
    STANDARD_12MM: "Standard 12mm",
    STANDARD_9MM: "Standard 9mm",
    REEDED_19MM: "Reeded 19mm",
    MELAMINE_18MM: "Melamine 18mm",
    NONE: "Slab (No Panel)",
    FRETWORK: "Fretwork Pattern",
    GLASS: "Glass Ready",
  };

  // Finish labels
  const finishLabels: Record<string, { label: string; color: string }> = {
    RAW_UNASSEMBLED: {
      label: "Raw Unassembled",
      color: "bg-stone-100 text-stone-700",
    },
    ASSEMBLED_PREP: {
      label: "Assembled & Prepped",
      color: "bg-stone-200 text-stone-800",
    },
    PRIMED: {
      label: "Primed",
      color: "bg-emerald-100 text-emerald-700",
    },
    PAINTED: {
      label: "Painted",
      color: "bg-blue-100 text-blue-700",
    },
  };

  const currentFinish =
    finishLabels[finish] || finishLabels.RAW_UNASSEMBLED;

  // Build features list
  const features: { label: string; value: string; highlight?: boolean }[] = [];

  if (width > 0 && height > 0) {
    features.push({ label: "Dimensions", value: `${width} × ${height} × ${thickness}mm` });
  }

  if (panelType !== "UNSELECTED") {
    features.push({ label: "Panel Type", value: panelLabels[panelType] || panelType });
  }

  if (angledLeft) {
    features.push({
      label: "Left Angle",
      value: `${(leftAngleDegrees || 0).toFixed(2)}°`,
      highlight: true,
    });
  }

  if (angledRight) {
    features.push({
      label: "Right Angle",
      value: `${(rightAngleDegrees || 0).toFixed(2)}°`,
      highlight: true,
    });
  }

  if (angledLeft || angledRight) {
    features.push({
      label: "Angled Rails",
      value: `L: ${leftAngledRailWidth}mm | R: ${rightAngledRailWidth}mm`,
      highlight: true,
    });
  }

  if (panelType !== "NONE" && midRailsEnabled && midRails.length > 0) {
    features.push({
      label: "Mid Rails",
      value: `${midRails.length} rail${midRails.length > 1 ? "s" : ""}`,
      highlight: true,
    });
  }

  if (hingeDrilling && hinges.length > 0) {
    features.push({
      label: "Hinge Holes",
      value: `${hinges.length} hole${hinges.length > 1 ? "s" : ""}`,
      highlight: true,
    });
  }

  if (panelType !== "NONE") {
    if (rebateWidthMm > 0 || rebateDepthMm > 0) {
      features.push({
        label: "Rebate",
        value: `${rebateWidthMm}w × ${rebateDepthMm}d mm`,
      });
    }
    if (frontFaceThicknessMm > 0) {
      features.push({
        label: "Front Face",
        value: `${frontFaceThicknessMm}mm`,
      });
    }
    if (cornerRadiusMm > 0 || rearCornerRadiusMm > 0) {
      features.push({
        label: "Radii (F/R)",
        value: `R${cornerRadiusMm} / R${rearCornerRadiusMm}`,
      });
    }
  }

  const buildDoorData = () => ({
    id: editingCartItemId || undefined,
    qty: quantity,
    width,
    height,
    thickness,
    preset,
    panelType,
    panelCount,
    panelOrientation: panelOrientation || "vertical",
    shape: shape || "rectangular",
    angledLeft,
    angledRight,
    leftTriangleCutoutWidth,
    leftTriangleCutoutHeight,
    rightTriangleCutoutWidth,
    rightTriangleCutoutHeight,
    leftAngleDegrees,
    rightAngleDegrees,
    leftAngledRailWidth,
    rightAngledRailWidth,
    borderWidth,
    customBorders,
    leftStile: customBorders ? leftStile : borderWidth,
    rightStile: customBorders ? rightStile : borderWidth,
    bottomRail: customBorders ? bottomRail : borderWidth,
    topRail: customBorders ? topRail : borderWidth,
    rebateWidthMm,
    rebateDepthMm,
    frontFaceThicknessMm,
    cornerRadiusMm,
    rearCornerRadiusMm,
    midRailsEnabled,
    midRailsEqualise: midRailsEqualise || false,
    midRails: midRailsEnabled ? midRails : [],
    hingeDrilling,
    hinges: hingeDrilling ? hinges : [],
    material,
    finish,
    showDimensions,
  });

  const handleAddToCart = () => {
    const doorData = buildDoorData();

    if (editingCartItemId) {
      useDoorStore.getState().updateDoor(editingCartItemId, doorData);
    } else {
      addDoor(doorData);
    }

    setJustAdded(true);
    setQuantity(1); // Reset quantity back to 1 after adding
    setTimeout(() => setJustAdded(false), 2000);

    const newTotal = editingCartItemId ? cartCount : cartCount + 1;

    toast.success(
      editingCartItemId ? "Updated cart!" : "Added to cart!",
      {
        description: `${width}×${height}mm door — £${price.toFixed(
          2
        )}. ${newTotal} item${newTotal > 1 ? "s" : ""} in cart.`,
        action: {
          label: "View Cart",
          onClick: () => setLocation("/checkout"),
        },
      }
    );
  };

  const handleAddAndCheckout = () => {
    const doorData = buildDoorData();

    if (editingCartItemId) {
      useDoorStore.getState().updateDoor(editingCartItemId, doorData);
    } else {
      addDoor(doorData);
    }

    toast.success(
      editingCartItemId
        ? "Updated cart! Redirecting…"
        : "Added to cart! Redirecting…",
      {
        description: `${width}×${height}mm door — £${price.toFixed(2)}`,
      }
    );

    setTimeout(() => setLocation("/checkout"), 150);
  };

  const handleViewCart = () => {
    setLocation("/checkout");
  };

  const orderSubtotal = doors.reduce((sum: number, d: any) => sum + d.lineTotal, 0);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 border-b border-stone-100 bg-white">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">
              Trade Shaker Door
            </h2>
            <p className="text-[13px] text-stone-500 mt-0.5 font-medium">
              Custom MDF Door
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {finish !== "NONE" && (
              <Badge className={cn("text-[10px] uppercase font-bold tracking-wider", currentFinish.color)}>
                {currentFinish.label}
              </Badge>
            )}
            {editingCartItemId && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-[10px] font-bold uppercase tracking-tighter border-stone-200 text-stone-500 hover:text-black hover:bg-stone-50"
                onClick={() => {
                  config.resetConfig();
                  useDoorStore.getState().setActiveDoor(null);
                }}
              >
                Configure New
              </Button>
            )}
          </div>
        </div>

        <div className="relative group rounded-2xl p-[1px] bg-gradient-to-b from-stone-700 to-stone-900 shadow-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="bg-stone-950 rounded-[15px] p-5 relative">
            <p className="text-stone-400 text-[10px] uppercase tracking-widest font-bold mb-1">
              Unit Price
            </p>
            <p className="text-3xl font-black text-white tracking-tight flex items-baseline">
              <span className="text-lg mr-1 text-stone-500 font-bold">£</span>
              {isNewSession ? "0.00" : price.toFixed(2)}
            </p>
            {isNewSession && (
              <p className="text-[11px] text-stone-500 mt-2 font-medium">
                Configure your door to see the price
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Specifications */}
      <div className="flex-1 overflow-y-auto p-6 bg-stone-50/50">
        <h3 className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Package className="w-3.5 h-3.5" />
          Specifications
        </h3>

        <div className="space-y-2">
          {features.map((f, i) => (
            <div
              key={i}
              className={cn(
                "flex justify-between py-2 px-3 rounded-xl text-[12px] transition-colors",
                f.highlight
                  ? "bg-orange-50/80 text-orange-900 border border-orange-100/50"
                  : "bg-white text-stone-700 border border-stone-100/50 shadow-sm"
              )}
            >
              <span className="text-stone-500 font-medium truncate mr-2">{f.label}</span>
              <span className="font-bold text-right">
                {f.value}
              </span>
            </div>
          ))}
        </div>

        <Separator className="my-6 bg-stone-200/60" />

        {cartCount > 0 && (
          <button
            onClick={handleViewCart}
            className="w-full flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-xl hover:bg-orange-100 transition"
          >
            <div>
              <p className="text-sm font-semibold">
                {cartCount} item{cartCount > 1 ? "s" : ""} in cart
              </p>
              <p className="text-xs text-gray-500">
                Subtotal: £{orderSubtotal.toFixed(2)}
              </p>
            </div>
            <ExternalLink className="w-4 h-4 text-orange-500" />
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="p-5 border-t border-stone-100 bg-white space-y-3 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] z-10 relative">
        <div className="flex gap-2">
          {!editingCartItemId && (
            <div className="flex items-center border border-stone-200 rounded-xl bg-stone-50 overflow-hidden h-14 shrink-0 shadow-inner">
              <button
                className="px-4 hover:bg-stone-200 text-stone-600 h-full flex items-center justify-center font-bold text-lg transition-colors"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                -
              </button>
              <div className="px-1 font-bold w-6 text-center text-[15px]">{quantity}</div>
              <button
                className="px-4 hover:bg-stone-200 text-stone-600 h-full flex items-center justify-center font-bold text-lg transition-colors"
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </button>
            </div>
          )}
          <Button
            className={cn(
              "flex-1 h-14 rounded-xl font-extrabold text-[15px] shadow-lg transition-all duration-300 hover:-translate-y-0.5",
              justAdded
                ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/25"
                : "bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 shadow-orange-600/25"
            )}
            onClick={handleAddToCart}
            disabled={width < 200 || height < 200 || panelType === "UNSELECTED" || finish === "NONE"}
          >
            {justAdded ? (
              <>
                <Check className="w-5 h-5 mr-2 stroke-[3]" />
                {editingCartItemId ? "Saved!" : "Added!"}
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 mr-2 stroke-[3]" />
                {width < 200 || height < 200 ? "Enter Dimensions" : panelType === "UNSELECTED" ? "Select Panel" : finish === "NONE" ? "Select Finish" : editingCartItemId ? "Save Changes" : "Add to Cart"}
              </>
            )}
          </Button>
        </div>

        <Button
          variant="outline"
          onClick={handleViewCart}
          className="w-full h-14 rounded-xl font-bold text-stone-700 border-2 border-stone-200 hover:border-orange-200 hover:text-orange-700 hover:bg-orange-50 transition-all duration-300"
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          View Cart
        </Button>
      </div>
    </div>
  );
}

// ============================================
// MOBILE CART BAR (Exported for DoorConfigurator)
// ============================================

export function MobileCartBar() {
  const [, setLocation] = useLocation();
  const { doors, activeDoorId, addDoor } = useDoorStore();
  const {
    price, width, height, thickness, preset, panelType, panelCount, panelOrientation,
    shape, angledLeft, angledRight, leftTriangleCutoutWidth, leftTriangleCutoutHeight,
    rightTriangleCutoutWidth, rightTriangleCutoutHeight, leftAngleDegrees, rightAngleDegrees,
    leftAngledRailWidth, rightAngledRailWidth, borderWidth, customBorders,
    leftStile, rightStile, bottomRail, topRail, rebateWidthMm, rebateDepthMm, frontFaceThicknessMm,
    cornerRadiusMm, rearCornerRadiusMm, midRailsEnabled, midRailsEqualise, midRails,
    hingeDrilling, hinges, material, finish, showDimensions, editingCartItemId
  } = useDoorConfig();

  const [justAdded, setJustAdded] = useState(false);

  const cartCount = doors.reduce((total, item) => total + item.qty, 0);

  const buildDoorData = () => ({
    id: editingCartItemId || undefined,
    qty: 1,
    width, height, thickness, preset, panelType, panelCount, panelOrientation: panelOrientation || "vertical",
    shape: shape || "rectangular", angledLeft, angledRight, leftTriangleCutoutWidth, leftTriangleCutoutHeight,
    rightTriangleCutoutWidth, rightTriangleCutoutHeight, leftAngleDegrees, rightAngleDegrees,
    leftAngledRailWidth, rightAngledRailWidth, borderWidth, customBorders,
    leftStile: customBorders ? leftStile : borderWidth, rightStile: customBorders ? rightStile : borderWidth,
    bottomRail: customBorders ? bottomRail : borderWidth, topRail: customBorders ? topRail : borderWidth,
    rebateWidthMm, rebateDepthMm, frontFaceThicknessMm, cornerRadiusMm, rearCornerRadiusMm,
    midRailsEnabled, midRailsEqualise: midRailsEqualise || false, midRails: midRailsEnabled ? midRails : [],
    hingeDrilling, hinges: hingeDrilling ? hinges : [], material, finish, showDimensions,
  });

  const handleAddToCart = () => {
    const doorData = buildDoorData();
    if (editingCartItemId) {
      useDoorStore.getState().updateDoor(editingCartItemId, doorData);
    } else {
      addDoor(doorData);
    }

    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);

    const newTotal = editingCartItemId ? cartCount : cartCount + 1;
    toast.success(
      editingCartItemId ? "Updated cart!" : "Added to cart!",
      {
        description: `${width}×${height}mm door — £${price.toFixed(2)}. ${newTotal} item${newTotal > 1 ? "s" : ""} in cart.`,
        action: { label: "View Cart", onClick: () => setLocation("/checkout") },
      }
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-3 pb-safe border-t border-stone-200 bg-white/95 backdrop-blur-md shadow-[0_-10px_40px_-5px_rgba(0,0,0,0.1)] z-50 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex flex-col shrink-0" onClick={() => setLocation("/checkout")} role="button">
        <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider mb-0.5 ml-1">Total Unit Price</span>
        <div className="flex items-center gap-2 px-2 py-1 bg-stone-100 rounded-lg shrink-0 w-max">
          <ShoppingCart className="w-4 h-4 text-orange-600" />
          <span className="text-xl font-black text-stone-900 leading-none">£{price.toFixed(2)}</span>
          {cartCount > 0 && (
            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-[10px] font-bold text-white">
              {cartCount}
            </span>
          )}
        </div>
      </div>

      <Button
        className={cn(
          "flex-1 h-[46px] rounded-xl font-bold text-sm shadow-md transition-all duration-300",
          justAdded
            ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/25"
            : "bg-gradient-to-r from-[#c75b33] to-[#b04f2c] hover:from-[#b04f2c] hover:to-[#964325] shadow-[#c75b33]/25"
        )}
        onClick={handleAddToCart}
        disabled={width < 200 || height < 200 || panelType === "UNSELECTED" || finish === "NONE"}
      >
        {justAdded ? (
          <>
            <Check className="w-4 h-4 mr-2" />
            {editingCartItemId ? "Saved!" : "Added!"}
          </>
        ) : (
          <>
            <Plus className="w-4 h-4 mr-1" />
            {editingCartItemId ? "Save" : "Add to Cart"}
          </>
        )}
      </Button>
    </div>
  );
}