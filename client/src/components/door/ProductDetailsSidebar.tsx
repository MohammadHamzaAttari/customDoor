// client/src/components/door/ProductDetailsSidebar.tsx
import { useDoorConfig } from "@/lib/stores/useDoorConfig";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ShoppingCart,
  Download,
  Share2,
  Check,
  Info,
  Truck,
  Clock,
  Shield,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useLocation } from "wouter";

export function ProductDetailsSidebar() {
  const [_, setLocation] = useLocation();
  const config = useDoorConfig();
  const {
    width,
    height,
    thickness,
    panelType,
    finish,
    price,
    angledLeft,
    angledRight,
    leftAngleDegrees,
    rightAngleDegrees,
    midRailsEnabled,
    midRails,
    hingeDrilling,
    hinges,
  } = config;

  // Calculate area
  const areaM2 = (width * height) / 1000000;

  // Panel type labels
  const panelLabels: Record<string, string> = {
    "STANDARD_12MM": "Standard 12mm MDF",
    "REEDED_19MM": "Reeded 19mm MDF",
    "MELAMINE_18MM": "Melamine 18mm",
    "NONE": "Slab (No Panel)",
    "FRETWORK": "Fretwork Pattern",
    "GLASS": "Glass Ready",
  };

  // Finish labels
  const finishLabels: Record<string, { label: string; color: string }> = {
    "RAW_UNASSEMBLED": { label: "Raw Unassembled", color: "bg-stone-100 text-stone-700" },
    "ASSEMBLED_PREP": { label: "Assembled & Prepped", color: "bg-stone-200 text-stone-800" },
    "PRIMED": { label: "Primed", color: "bg-emerald-100 text-emerald-700" },
  };

  const currentFinish = finishLabels[finish] || finishLabels.RAW_UNASSEMBLED;

  // Build features list
  const features: { label: string; value: string; highlight?: boolean }[] = [
    { label: "Dimensions", value: `${width} × ${height} × ${thickness}mm` },
    { label: "Area", value: `${areaM2.toFixed(3)} m²` },
    { label: "Panel Type", value: panelLabels[panelType] || panelType },
  ];

  // Handle Add to Cart - stores config and navigates to cart/checkout page
  const handleAddToCart = () => {
    const configData = {
      width,
      height,
      thickness,
      panelType,
      finish,
      price,
      angledLeft,
      angledRight,
      leftAngleDegrees,
      rightAngleDegrees,
      midRailsEnabled,
      midRails,
      hingeDrilling,
      hinges,
    };

    // Store in session for checkout page
    sessionStorage.setItem('doorConfig', JSON.stringify(configData));

    toast.success("Added to Cart!", {
      description: `${width}×${height}mm door - £${price.toFixed(2)}`,
    });

    // Navigate to checkout page
    setLocation('/checkout');
  };

  if (angledLeft) {
    features.push({
      label: "Left Angle",
      value: `${leftAngleDegrees}°`,
      highlight: true
    });
  }
  if (angledRight) {
    features.push({
      label: "Right Angle",
      value: `${rightAngleDegrees}°`,
      highlight: true
    });
  }
  if (midRailsEnabled && midRails.length > 0) {
    features.push({
      label: "Mid Rails",
      value: `${midRails.length} rail${midRails.length > 1 ? 's' : ''}`,
      highlight: true
    });
  }
  if (hingeDrilling && hinges.length > 0) {
    features.push({
      label: "Hinge Holes",
      value: `${hinges.length} hole${hinges.length > 1 ? 's' : ''}`,
      highlight: true
    });
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 border-b bg-gradient-to-br from-stone-50 to-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Trade Shaker Door</h2>
            <p className="text-sm text-gray-500 mt-1">Custom MDF Door</p>
          </div>
          <Badge className={cn("text-xs font-medium", currentFinish.color)}>
            {currentFinish.label}
          </Badge>
        </div>

        {/* Price Display */}
        <div className="bg-gradient-to-r from-stone-800 to-stone-900 rounded-xl p-4 text-white shadow-lg border border-stone-700">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-stone-300 text-xs uppercase tracking-wider font-medium">
                Unit Price
              </p>
              <p className="text-3xl font-bold mt-1 text-white">
                £{price.toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-stone-400 text-xs">excl. VAT</p>
              <p className="text-sm font-medium mt-1">
                £{(price * 1.2).toFixed(2)} inc. VAT
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications */}
      <div className="flex-1 overflow-y-auto p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Package className="w-4 h-4 text-gray-400" />
          Specifications
        </h3>

        <div className="space-y-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center justify-between py-2 px-3 rounded-lg",
                feature.highlight ? "bg-orange-50" : "bg-gray-50"
              )}
            >
              <span className="text-sm text-gray-600">{feature.label}</span>
              <span className={cn(
                "text-sm font-medium",
                feature.highlight ? "text-orange-700" : "text-gray-900"
              )}>
                {feature.value}
              </span>
            </div>
          ))}
        </div>

        <Separator className="my-6" />

        {/* Delivery Info */}
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Truck className="w-4 h-4 text-gray-400" />
          Delivery & Lead Time
        </h3>

        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
            <Clock className="w-5 h-5 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-900">5-7 Working Days</p>
              <p className="text-xs text-amber-700">Standard production time</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Truck className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">UK Mainland Delivery</p>
              <p className="text-xs text-gray-500">Free on orders over £500</p>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Quality Assurance */}
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-gray-400" />
          Quality Assurance
        </h3>

        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Check, label: "Premium MDF", desc: "E1 Grade" },
            { icon: Check, label: "CNC Precision", desc: "±0.1mm" },
            { icon: Check, label: "Made in UK", desc: "British Made" },
            { icon: Check, label: "Trade Quality", desc: "Professional Grade" },
          ].map((item, index) => (
            <div key={index} className="flex items-start gap-2 p-2">
              <item.icon className="w-4 h-4 text-orange-500 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-gray-900">{item.label}</p>
                <p className="text-[10px] text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t bg-gray-50 space-y-3">
        <Button
          className="w-full h-12 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold tracking-wide shadow-lg transition-all hover:scale-[1.02]"
          size="lg"
          onClick={handleAddToCart}
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          Add to Cart
        </Button>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" size="sm" className="h-10">
            <Download className="w-4 h-4 mr-2" />
            Save Config
          </Button>
          <Button variant="outline" size="sm" className="h-10">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>

        <p className="text-[10px] text-center text-gray-400 pt-2">
          Prices subject to final confirmation. Trade accounts only.
        </p>
      </div>
    </div>
  );
}