// client/src/pages/CheckoutPage.tsx
import { useState, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Lock, CreditCard, Loader2, Package, Ruler,
  Layers, Settings2, Check, Plus, Minus, Trash2, ShoppingCart, AlertCircle,
  ArrowLeftRight, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDoorStore, type DoorOrderItem } from "@/lib/stores/useDoorStore";
import { DEFAULT_PRICING, cartItemSchema } from "@shared/doorSchema";
import { z } from "zod";
import { Door2D } from "@/components/door/Door2D";
import { useDoorConfig } from "@/lib/stores/useDoorConfig";

// ─── Constants ────────────────────────────────────────────────────────────────
const PANEL_LABELS: Record<string, string> = {
  STANDARD_12MM: "Standard 12mm",
  STANDARD_9MM: "Standard 9mm",
  REEDED_19MM: "Reeded 19mm",
  MELAMINE_18MM: "Melamine 18mm",
  NONE: "Slab (No Panel)",
  FRETWORK: "Fretwork Pattern",
  GLASS: "Glass Ready",
  UNSELECTED: "Not Selected",
};

const FINISH_LABELS: Record<string, { label: string; color: string }> = {
  RAW_UNASSEMBLED: { label: "Raw Unassembled", color: "bg-stone-100 text-stone-700" },
  ASSEMBLED_PREP: { label: "Assembled & Prepped", color: "bg-stone-200 text-stone-800" },
  PRIMED: { label: "Primed", color: "bg-emerald-100 text-emerald-700" },
  PAINTED: { label: "Painted", color: "bg-blue-100 text-blue-700" },
  NONE: { label: "Not Selected", color: "bg-gray-100 text-gray-500" },
};

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  shaker: { label: "Shaker Door", icon: "🚪" },
  slab: { label: "Slab Door", icon: "📐" },
  glass: { label: "Glass Door", icon: "🪟" },
  cabinet: { label: "Cabinet Door", icon: "🗄️" },
  drawer: { label: "Drawer Front", icon: "🗃️" },
  custom: { label: "Custom Door", icon: "⚙️" },
};

// ─── Cart Item Card ───────────────────────────────────────────────────────────
function CartItemCard({
  item,
  index,
  onQuantityChange,
  onRemove,
  onSwapHinge,
  onFinishChange,
  onEdit,
}: {
  item: DoorOrderItem;
  index: number;
  onQuantityChange: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onSwapHinge: (id: string) => void;
  onFinishChange: (id: string, finish: DoorOrderItem["finish"]) => void;
  onEdit: (item: DoorOrderItem) => void;
}) {
  const currentFinish = FINISH_LABELS[item.finish] || FINISH_LABELS.RAW_UNASSEMBLED;
  const areaM2 = (item.width * item.height) / 1_000_000;
  const category = item.panelType === "NONE" ? "slab" : "shaker";
  const categoryInfo = CATEGORY_LABELS[category] || CATEGORY_LABELS.custom;

  const hasCustomOptions =
    item.angledLeft ||
    item.angledRight ||
    (item.midRailsEnabled && item.midRails?.length) ||
    (item.hingeDrilling && item.hinges?.length);

  // Determine hinge side
  const hingeSide = item.hinges.length > 0 ? item.hinges[0].side : null;

  return (
    <Card className="border-0 shadow-lg bg-white overflow-hidden transition-all duration-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-1 group rounded-2xl card-premium">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 bg-gradient-to-r from-stone-50 via-white to-stone-50/80 border-b border-stone-100/80 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-orange-500/5 via-transparent to-transparent opacity-50 pointer-events-none" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-xl border border-stone-100 ring-1 ring-black/[0.02]">
            {categoryInfo.icon}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-stone-400 tracking-widest mb-0.5">Configuration {index + 1}</span>
            <span className="text-sm font-black text-stone-700 tracking-wide">
              {categoryInfo.label}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 sm:mt-0 relative z-10 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none h-9 px-4 rounded-xl border border-orange-200 bg-orange-50/50 text-orange-600 hover:bg-orange-500 hover:text-white hover:border-orange-500 hover:shadow-md hover:shadow-orange-500/20 transition-all duration-300 font-bold tracking-wide uppercase text-[11px]"
            onClick={() => onEdit(item)}
          >
            <Settings2 className="w-3.5 h-3.5 mr-2" />
            Edit Design
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-none h-9 w-9 p-0 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 transition-all duration-300"
            onClick={() => onRemove(item.id)}
            title="Remove item"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Render the 2D map side-by-side on desktop */}
        <div className="w-full md:w-56 shrink-0 bg-gradient-to-br from-stone-50 to-stone-100/50 p-3 border-r border-stone-100 flex items-center justify-center">
          <div className="w-full aspect-[3/4]" data-door-id={item.id}>
            <Door2D face="front" configOverride={{ ...item, showDimensions: false } as any} />
          </div>
        </div>

        <div className="flex-1">
          <CardHeader className="pb-3 pt-5 px-6">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
                  <Package className="w-5 h-5 text-orange-500" />
                  {item.label}
                </CardTitle>
                <CardDescription className="mt-1 text-[13px]">Made-to-order premium door</CardDescription>
              </div>
              <Badge className={cn("text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg", currentFinish.color)}>
                {currentFinish.label}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-3 pb-3">
            {/* Quantity + Line Price */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-br from-orange-50/60 to-orange-100/30 rounded-2xl border border-orange-100/80 shadow-inner">
              <div className="flex items-center gap-3">
                <span className="text-xs font-black text-stone-600 uppercase tracking-widest">Qty</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 rounded-lg border-stone-300 hover:bg-stone-100 transition-all duration-150 btn-press"
                    onClick={() => onQuantityChange(item.id, Math.max(1, item.qty - 1))}
                    disabled={item.qty <= 1}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="text-base font-bold w-7 text-center tabular-nums">{item.qty}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 rounded-lg border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700 transition-all duration-150 btn-press"
                    onClick={() => onQuantityChange(item.id, item.qty + 1)}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-stone-500 font-medium">£{item.unitPrice.toFixed(2)} ea</p>
                <p className="text-base font-black text-stone-900 tabular-nums">£{item.lineTotal.toFixed(2)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Dimensions */}
              <div>
                <h3 className="text-xs font-semibold text-stone-700 mb-2 flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5 text-stone-400" />
                  Dimensions
                </h3>
                <div className="bg-stone-50 rounded-lg p-2.5 flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs"><span className="text-stone-500">H:</span><span className="font-bold text-stone-900 tabular-nums">{item.height}mm</span></div>
                  <div className="flex justify-between text-xs"><span className="text-stone-500">W:</span><span className="font-bold text-stone-900 tabular-nums">{item.width}mm</span></div>
                  <div className="flex justify-between text-xs"><span className="text-stone-500">T:</span><span className="font-bold text-stone-900 tabular-nums">{item.thickness}mm</span></div>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="text-xs font-semibold text-stone-700 mb-2 flex items-center gap-1.5">
                  <Settings2 className="w-3.5 h-3.5 text-stone-400" />
                  Quick Edit
                </h3>
                <div className="space-y-2">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">Finish</span>
                    <div className="flex flex-wrap gap-1">
                      {(["RAW_UNASSEMBLED", "ASSEMBLED_PREP", "PRIMED", "PAINTED"] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => onFinishChange(item.id, f)}
                          className={cn(
                            "px-2 py-1 text-[10px] rounded-lg border transition-all truncate max-w-full font-bold btn-press",
                            item.finish === f
                              ? "border-orange-500 bg-orange-50 text-orange-700 shadow-sm"
                              : "border-stone-200 text-stone-500 hover:border-orange-300 hover:bg-stone-50"
                          )}
                          title={FINISH_LABELS[f].label}
                        >
                          {f === "RAW_UNASSEMBLED" ? "Raw" : f === "ASSEMBLED_PREP" ? "Prepped" : f === "PRIMED" ? "Primed" : "Painted"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {item.hingeDrilling && item.hinges.length > 0 && (
                    <div className="flex items-center justify-between p-1.5 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-[10px] font-medium text-blue-900">
                        {hingeSide} Hinges
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSwapHinge(item.id)}
                        className="border-blue-300 text-blue-700 hover:bg-blue-100 h-5 px-1.5 text-[10px] rounded btn-press"
                      >
                        <ArrowLeftRight className="w-2.5 h-2.5 mr-1" />
                        Swap
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Specifications */}
            <div>
              <h3 className="text-xs font-semibold text-stone-700 mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-stone-400" />
                Specifications
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex justify-between items-center py-1.5 px-2.5 bg-gray-50 rounded-lg text-xs">
                  <span className="text-stone-500">Panel</span>
                  <span className="font-bold text-stone-900 truncate max-w-[80px]" title={PANEL_LABELS[item.panelType] || item.panelType}>
                    {item.panelType === "NONE" ? "Slab" : (PANEL_LABELS[item.panelType] || item.panelType).split(" ")[0]}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 px-2.5 bg-gray-50 rounded-lg text-xs">
                  <span className="text-stone-500">Rebate</span>
                  <span className="font-bold text-stone-900 tabular-nums">{item.rebateWidthMm}×{item.rebateDepthMm}</span>
                </div>
              </div>
            </div>

            {/* Custom Options */}
            {hasCustomOptions && (
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-dashed border-stone-200 mt-2">
                {item.angledLeft && (
                  <div className="flex justify-between items-center py-1 px-2 bg-orange-50/50 rounded-lg text-[10px]">
                    <span className="text-orange-700 flex items-center gap-1">
                      <Check className="w-3 h-3" /> L-Angle
                    </span>
                    <span className="font-bold text-orange-900 tabular-nums">{item.leftAngleDegrees}°</span>
                  </div>
                )}
                {item.angledRight && (
                  <div className="flex justify-between items-center py-1 px-2 bg-orange-50/50 rounded-lg text-[10px]">
                    <span className="text-orange-700 flex items-center gap-1">
                      <Check className="w-3 h-3" /> R-Angle
                    </span>
                    <span className="font-bold text-orange-900 tabular-nums">{item.rightAngleDegrees}°</span>
                  </div>
                )}
                {item.midRailsEnabled && item.midRails?.length > 0 && (
                  <div className="flex justify-between items-center py-1 px-2 bg-orange-50/50 rounded-lg text-[10px] col-span-2 sm:col-span-1">
                    <span className="text-orange-700 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Rails
                    </span>
                    <span className="font-bold text-orange-900">{item.midRails.length}</span>
                  </div>
                )}
                {item.hingeDrilling && item.hinges?.length > 0 && (
                  <div className="flex justify-between items-center py-1 px-2 bg-orange-50/50 rounded-lg text-[10px] col-span-2 sm:col-span-1">
                    <span className="text-orange-700 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Hinges
                    </span>
                    <span className="font-bold text-orange-900">{item.hinges.length} h</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </div>
      </div>
    </Card>
  );
}

// ─── Main Checkout Page ───────────────────────────────────────────────────────
export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const {
    doors,
    updateQuantity,
    removeDoor,
    duplicateDoor,
    swapHingeSide,
    updateFinish,
    resetStore,
    getTotalItems,
    getSubtotal,
    getVat,
    getGrandTotal,
  } = useDoorStore();

  const loadFromCartItem = useDoorConfig(state => state.loadFromCartItem);

  const [isLoading, setIsLoading] = useState(false);

  // ─── Restore Cart from Session Storage ───
  // Defined BEFORE any conditional returns to respect Rules of Hooks
  const restoreCartFromBackup = useCallback(() => {
    try {
      const backup = sessionStorage.getItem('checkout-backup');
      if (backup) {
        console.log("Found checkout backup, attempting restore...");
        let data;
        try {
          data = JSON.parse(backup);
        } catch (e) {
          console.error("Failed to parse backup JSON", e);
          sessionStorage.removeItem('checkout-backup');
          return;
        }

        // Only restore if backup is less than 24 hours old
        if (Date.now() - data.timestamp < 86400000) {
          if (data.doors && Array.isArray(data.doors)) {
            const validDoors = data.doors.filter((d: any) => {
              return d && typeof d === 'object' && d.id && typeof d.width === 'number';
            });

            if (validDoors.length > 0) {
              useDoorStore.getState().restoreState(validDoors);
              toast.success("Cart restored", {
                description: "Your previous session has been recovered."
              });
              // Clear backup after successful restore to prevent auto-restore loops
              sessionStorage.removeItem('checkout-backup');
            }
          }
        }
      }
    } catch (e) {
      console.warn('Failed to restore cart from backup:', e);
    }
  }, []);

  // Attempt restore on mount ONLY
  useEffect(() => {
    if (doors.length === 0) {
      restoreCartFromBackup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const handleQuantityChange = useCallback((id: string, qty: number) => {
    updateQuantity(id, qty);
  }, [updateQuantity]);

  const handleRemoveItem = useCallback(
    (id: string) => {
      removeDoor(id);
      toast.success("Item removed from cart");
    },
    [removeDoor],
  );

  const handleSwapHinge = useCallback((id: string) => {
    swapHingeSide(id);
    toast.success("Hinge side swapped");
  }, [swapHingeSide]);

  const handleFinishChange = useCallback((id: string, finish: DoorOrderItem["finish"]) => {
    updateFinish(id, finish);
  }, [updateFinish]);

  const handleEditItem = useCallback((item: DoorOrderItem) => {
    loadFromCartItem(item);
    // Also set active door in store to ensure correct item is selected in builder
    useDoorStore.getState().setActiveDoor(item.id);
    setLocation("/");
  }, [loadFromCartItem, setLocation]);

  // ─── Totals ─────────────────────────────────────────────────────────────
  const totalItems = getTotalItems();
  const subtotal = getSubtotal();
  const vat = getVat();
  const grandTotal = getGrandTotal();


  // ─── Proceed to Payment ─────────────────────────────────────────────────
  const handleProceedToPayment = async () => {
    if (doors.length === 0) return;
    setIsLoading(true);

    try {
      // Build payload from useDoorStore doors
      const items = doors.map((door) => ({
        width: door.width,
        height: door.height,
        thickness: door.thickness,
        panelType: door.panelType,
        finish: door.finish,
        price: door.unitPrice,
        quantity: door.qty,
        category: door.panelType === "NONE" ? "slab" : "shaker",
        angledLeft: door.angledLeft,
        angledRight: door.angledRight,
        leftAngleDegrees: door.leftAngleDegrees,
        rightAngleDegrees: door.rightAngleDegrees,
        leftTriangleCutoutWidth: door.leftTriangleCutoutWidth,
        leftTriangleCutoutHeight: door.leftTriangleCutoutHeight,
        rightTriangleCutoutWidth: door.rightTriangleCutoutWidth,
        rightTriangleCutoutHeight: door.rightTriangleCutoutHeight,
        midRailsEnabled: door.midRailsEnabled,
        midRails: door.midRails,
        hingeDrilling: door.hingeDrilling,
        hinges: door.hinges,
      }));

      const payload: Record<string, any> = {
        items,
        // Backward compat: flat fields from first item
        ...items[0],
      };

      if (doors.length === 1) {
        payload.quantity = doors[0].qty;
      } else {
        payload.quantity = totalItems;
      }

      console.log("Checkout payload:", JSON.stringify(payload, null, 2));

      const response = await fetch("/api/quick-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data: any;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error("Non-JSON response:", text);
        throw new Error(`Server returned unexpected response (${response.status})`);
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || `Server error: ${response.status}`);
      }

      if (data.invoiceUrl) {
        // Backup cart to session storage before redirect (in case user cancels payment)
        try {
          sessionStorage.setItem('checkout-backup', JSON.stringify({
            doors: doors,
            timestamp: Date.now(),
          }));
        } catch (e) {
          console.warn('Failed to backup cart to session storage:', e);
        }

        toast.success("Redirecting to payment...", {
          description: "You'll complete your purchase on our secure checkout.",
        });

        // ─── Native Shopify Integration Path ───
        // If embedded in a Shopify iframe, send message to parent to use AJAX Cart
        const isEmbedded = window.parent !== window || window.location.search.includes('shop=');
        if (isEmbedded) {
          console.log("[Checkout] Embedded detected, messaging parent for Shopify Cart add...");
          window.parent.postMessage({
            type: 'SHOPIFY_ADD_TO_CART',
            items: items,
            invoiceUrl: data.invoiceUrl
          }, '*');

          // Important: We do NOT resetStore() here because the user might navigate back 
          // from the cart or checkout. The parent will handle the redirect.
          return;
        }

        // ─── Standalone Fallback Path ───
        // Do NOT clear the store synchronously here, doing so instantly unmounts the Checkout page 
        // into an 'Empty Cart' view and can interrupt the browser's navigation to Shopify.
        // User carts will remain intact if they click 'Back' from Shopify checkout.

        if (window.parent !== window) {
          window.parent.location.href = data.invoiceUrl;
        } else {
          window.location.href = data.invoiceUrl;
        }
      } else {
        throw new Error("No checkout URL received from server");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);

      // ─── Storefront Fallback Logic ───
      // If payment system is not configured, try to add to Shopify cart directly via AJAX
      if (error.message?.includes("Payment system not configured") || error.message?.includes("credentials")) {
        try {
          toast.info("Configuring direct checkout...", {
            description: "Server checkout is unconfigured. Attempting to add items to your Shopify cart instead.",
          });

          // This logic matches shopify-door-configurator.liquid
          // It assumes we are embedded in a Shopify store
          for (const door of doors) {
            // Build properties for the AJAX API
            const properties: Record<string, string> = {
              'Width': `${door.width}mm`,
              'Height': `${door.height}mm`,
              'Thickness': `${door.thickness}mm`,
              'Panel Type': door.panelType,
              'Finish': door.finish,
              'Door Type': door.preset === 'double' ? 'Double' : 'Single',
            };

            if (door.angledLeft) properties['Left Angle'] = `${(door.leftAngleDegrees || 0).toFixed(2)}°`;
            if (door.angledRight) properties['Right Angle'] = `${(door.rightAngleDegrees || 0).toFixed(2)}°`;
            if (door.midRailsEnabled) properties['Mid Rails'] = `${door.midRails.length}`;
            if (door.hingeDrilling) properties['Hinge Holes'] = `${door.hinges.length}`;

            // Add each door to the Shopify cart
            // We use /cart/add.js which is the standard Shopify AJAX API
            const addToCartRes = await fetch('/cart/add.js', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                // Note: We don't have a specific Variant ID here because the configurator 
                // is usually used on a Product page where the base product ID is known.
                // In an embedded context, we might need a dummy product ID.
                // For now, we try to use a common pattern or fallback to error.
                id: (window as any).ShopifyAnalytics?.lib?.config?.workspace_id ||
                  (window as any).meta?.product?.variants?.[0]?.id ||
                  null,
                quantity: door.qty,
                properties
              })
            });

            if (!addToCartRes.ok) {
              const errText = await addToCartRes.text();
              throw new Error(`Shopify cart error: ${errText}`);
            }
          }

          toast.success("Added to Shopify cart!", {
            description: "Redirecting to your cart page...",
          });

          // Redirect to Shopify cart
          setTimeout(() => {
            window.location.href = '/cart';
          }, 1000);
          return; // Exit early as we've handled the fallback
        } catch (fallbackError: any) {
          console.error("Fallback error:", fallbackError);
          toast.error("Checkout failed", {
            description: "Payment system not configured and fallback to Shopify cart failed. Please contact the administrator.",
          });
          return;
        }
      }

      toast.error("Checkout failed", {
        description: error.message || "Please try again or contact support.",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };


  // Redirect if empty (only after attempting restore)
  // We'll show the empty cart message if doors are still 0 after mount
  if (doors.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full animate-in">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-stone-100 to-stone-200/50 flex items-center justify-center mx-auto mb-6 shadow-sm animate-float">
            <ShoppingCart className="w-10 h-10 text-stone-300" />
          </div>
          <h2 className="text-2xl font-extrabold text-stone-900 mb-3 tracking-tight">Your cart is empty</h2>
          <p className="text-sm text-stone-500 mb-8 leading-relaxed">
            Configure a door and add it to your cart to get started. Your custom design awaits.
          </p>
          <Button
            className="h-12 px-8 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 font-bold text-sm shadow-lg shadow-orange-500/20 transition-all duration-300 hover:-translate-y-0.5 btn-press"
            onClick={() => setLocation("/")}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Design a Door
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Top Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            className="pl-0 hover:bg-transparent hover:text-orange-600 transition-colors duration-200"
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continue Shopping
          </Button>
          <Button
            variant="outline"
            className="border-orange-200 text-orange-700 hover:bg-orange-50 rounded-xl transition-all duration-200 btn-press"
            onClick={() => {
              useDoorConfig.getState().resetConfig();
              useDoorStore.getState().setActiveDoor(null);
              setLocation("/");
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Door
          </Button>
        </div>

        {/* Page Title */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center shadow-sm">
            <ShoppingCart className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">Your Order</h1>
            <p className="text-[13px] font-medium text-stone-500 mt-0.5 tracking-wide">
              {doors.length} product{doors.length > 1 ? "s" : ""} · {totalItems} total item
              {totalItems > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {doors.map((item, idx) => (
              <CartItemCard
                key={item.id}
                item={item}
                index={idx}
                onQuantityChange={handleQuantityChange}
                onRemove={handleRemoveItem}
                onSwapHinge={handleSwapHinge}
                onFinishChange={handleFinishChange}
                onEdit={handleEditItem}
              />
            ))}

            <button
              className="w-full relative overflow-hidden group bg-white border border-stone-200/60 rounded-[2rem] p-10 flex flex-col items-center justify-center gap-4 transition-all duration-500 hover:shadow-xl hover:shadow-orange-500/10 hover:border-orange-300 cursor-pointer"
              onClick={() => {
                useDoorConfig.getState().resetConfig();
                useDoorStore.getState().setActiveDoor(null);
                setLocation("/");
              }}
            >
              {/* Subtle animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50/0 via-orange-50/0 to-orange-100/0 group-hover:from-orange-50/50 group-hover:via-orange-100/30 group-hover:to-orange-50/50 transition-all duration-700 pointer-events-none" />

              <div className="relative z-10 w-16 h-16 rounded-full bg-stone-50 border border-stone-100 group-hover:bg-gradient-to-br group-hover:from-orange-400 group-hover:to-red-500 group-hover:border-transparent group-hover:shadow-lg group-hover:shadow-orange-500/30 flex items-center justify-center transition-all duration-500 transform group-hover:-translate-y-1">
                <Plus className="w-7 h-7 stroke-[2.5] text-stone-400 group-hover:text-white transition-colors duration-500" />
              </div>

              <div className="relative z-10 flex flex-col items-center">
                <span className="text-[15px] font-extrabold tracking-wide text-stone-700 group-hover:text-stone-900 transition-colors duration-300">
                  Build Another Door
                </span>
                <span className="text-[13px] font-medium text-stone-400 group-hover:text-stone-500 mt-1 transition-colors duration-300">
                  Configure a new size, style, or finish
                </span>
              </div>
            </button>
          </div>

          {/* Right Column: Order Summary */}
          <div className="space-y-6">
            <div className="relative">
              {/* Outer Glow Effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-br from-orange-500 via-red-500 to-amber-400 rounded-[2rem] blur-xl opacity-20" />

              <Card className="relative border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.08)] bg-white/90 backdrop-blur-2xl rounded-3xl overflow-hidden">
                {/* Top accent gradient line */}
                <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 via-red-500 to-amber-500" />

                <CardHeader className="bg-gradient-to-b from-white to-white/50 border-b border-stone-100/80 pb-6 px-7 pt-7">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2.5 text-xl font-black tracking-tight text-stone-800">
                      <Lock className="w-5 h-5 text-emerald-500" />
                      Order Summary
                    </CardTitle>
                    <div className="bg-orange-50 text-orange-600 text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded-md border border-orange-100">
                      {totalItems} {totalItems === 1 ? 'Item' : 'Items'}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-7 space-y-6 px-7 pb-8 bg-gradient-to-b from-transparent to-stone-50/30">
                  {/* Minimal Receipt view */}
                  <div className="space-y-3 pb-5 border-b border-stone-200/60 border-dashed">
                    {doors.map((item) => {
                      const cat = item.panelType === "NONE" ? "slab" : "shaker";
                      const catInfo = CATEGORY_LABELS[cat] || CATEGORY_LABELS.custom;
                      return (
                        <div key={item.id} className="flex justify-between items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-stone-800 text-[13px] truncate">
                              {catInfo.icon} <span className="ml-1">{item.label.replace(/^Door \d+\s*[—\-]\s*/, '')}</span>
                            </h3>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-black text-[13px] tabular-nums">£{item.lineTotal.toFixed(2)}</span>
                            {item.qty > 1 && (
                              <p className="text-[10px] font-bold text-stone-400 mt-0.5 uppercase tracking-wider">
                                Qty: {item.qty}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between items-center text-xl font-black pt-2">
                    <span>Total</span>
                    <span className="text-gradient tracking-tight tabular-nums">£{grandTotal.toFixed(2)}</span>
                  </div>

                  {totalItems >= 5 && (
                    <div className="flex items-start gap-2 bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5 mt-2">
                      <AlertCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      <p className="text-[11px] font-medium text-emerald-800 leading-relaxed">
                        <span className="font-bold">Bulk order:</span> Orders of 10+ doors may
                        qualify for trade discounts. Contact us for a quote.
                      </p>
                    </div>
                  )}

                  <div className="relative group mt-8">
                    <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500 group-hover:duration-200 animate-pulse-slow" />
                    <Button
                      className="relative w-full h-16 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 font-black tracking-wide text-[16px] shadow-xl shadow-orange-500/20 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-orange-500/40 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none btn-press overflow-hidden"
                      size="lg"
                      onClick={handleProceedToPayment}
                      disabled={isLoading || doors.length === 0}
                    >
                      {/* Shimmer effect overlay */}
                      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shimmer" />

                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Processing Securely...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5 mr-2.5 stroke-[2.5]" />
                          Proceed to Checkout
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center justify-center gap-2 mt-5 text-stone-400">
                    <Lock className="w-3.5 h-3.5" />
                    <p className="text-[10px] uppercase font-bold tracking-widest text-center mt-0.5">
                      Secure 256-bit Encrypted Checkout
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}