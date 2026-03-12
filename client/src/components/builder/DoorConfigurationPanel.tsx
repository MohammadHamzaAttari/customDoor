import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDoorStore } from "@/lib/stores/useDoorStore";
import { useDoorConfig } from "@/lib/stores/useDoorConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, Check, Download, FileCode, Plus, Trash2, AlertTriangle, ShoppingCart, Copy, Box, Loader2, ExternalLink, ArrowRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOrderSubmission } from "@/hooks/useOrderSubmission";
import { useSyncStatus } from "@/lib/stores/useSyncStatus";
import { ValidatedInput } from "@/components/ui/ValidatedInput";
import { SyncStatusPanel } from "@/components/ui/SyncStatusPanel";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use"; // This was missing
import { useSessionHistory, type OrderHistoryItem } from "@/lib/stores/useSessionHistory";
type PanelView = "config" | "cart" | "checkout" | "history";

export default function DoorConfigurationPanel({ doorId }: { doorId: string }) {
    const { doors, updateDoor, setActiveDoor, addDoor, duplicateDoor, removeDoor } = useDoorStore();
    const door = doors.find((d) => d.id === doorId);

    const [currentView, setCurrentView] = useState<PanelView>("config");
    const [isExporting, setIsExporting] = useState(false);
    const [orderResult, setOrderResult] = useState<{ orderReference: string; invoiceUrl?: string } | null>(null);
    const { history, addOrder } = useSessionHistory();
    const { width, height } = useWindowSize();

    const { phase, fieldErrors: syncFieldErrors } = useSyncStatus();
    const { submitOrder: submitOrderHook, isSubmitting: isSubmittingHook, orderValidation, reset: resetOrder } = useOrderSubmission();

    // Checkout State
    const [customerDetails, setCustomerDetails] = useState({
        customerName: "",
        customerEmail: "",
        phone: "",
        companyName: "",
        addressLine1: "",
        city: "",
        postcode: "",
        jobReference: "",
        specialRequirements: "",
    });

    const [touched, setTouched] = useState<Set<string>>(new Set());

    const handleInputChange = useCallback((field: string, value: string) => {
        setCustomerDetails(prev => ({ ...prev, [field]: value }));
        orderValidation.handleChange(field);
    }, [orderValidation]);

    // SYNC: Load active door config into editor store whenever selection changes
    const configStore = useDoorConfig();
    React.useEffect(() => {
        if (door) {
            configStore.loadFromCartItem(door);
        }
    }, [doorId, door?.id]);

    // SYNC: Automatically persist any changes from configStore back to the main door store
    React.useEffect(() => {
        // We only want to sync if we're actually editing a door and not during initial hydration
        if (doorId && configStore._hasInteracted) {
            const {
                width, height, thickness, preset, panelType, panelCount,
                panelOrientation, shape, angledLeft, angledRight,
                leftTriangleCutoutWidth, leftTriangleCutoutHeight,
                rightTriangleCutoutWidth, rightTriangleCutoutHeight,
                leftAngleDegrees, rightAngleDegrees,
                leftAngledRailWidth, rightAngledRailWidth,
                borderWidth, customBorders, leftStile, rightStile,
                bottomRail, topRail, rebateWidthMm, rebateDepthMm,
                frontFaceThicknessMm, cornerRadiusMm, rearCornerRadiusMm,
                midRailsEnabled, midRailsEqualise, midRails,
                hingeDrilling, hinges, material, finish, showDimensions
            } = configStore;

            updateDoor(doorId, {
                width, height, thickness, preset, panelType, panelCount,
                panelOrientation, shape, angledLeft, angledRight,
                leftTriangleCutoutWidth, leftTriangleCutoutHeight,
                rightTriangleCutoutWidth, rightTriangleCutoutHeight,
                leftAngleDegrees, rightAngleDegrees,
                leftAngledRailWidth, rightAngledRailWidth,
                borderWidth, customBorders, leftStile, rightStile,
                bottomRail, topRail, rebateWidthMm, rebateDepthMm,
                frontFaceThicknessMm, cornerRadiusMm, rearCornerRadiusMm,
                midRailsEnabled, midRailsEqualise, midRails,
                hingeDrilling, hinges, material, finish, showDimensions
            } as any);
        }
    }, [
        doorId,
        configStore.width, configStore.height, configStore.thickness,
        configStore.preset, configStore.panelType, configStore.panelCount,
        configStore.panelOrientation, configStore.shape,
        configStore.angledLeft, configStore.angledRight,
        configStore.leftTriangleCutoutWidth, configStore.leftTriangleCutoutHeight,
        configStore.rightTriangleCutoutWidth, configStore.rightTriangleCutoutHeight,
        configStore.leftAngleDegrees, configStore.rightAngleDegrees,
        configStore.leftAngledRailWidth, configStore.rightAngledRailWidth,
        configStore.borderWidth, configStore.customBorders,
        configStore.leftStile, configStore.rightStile,
        configStore.bottomRail, configStore.topRail,
        configStore.rebateWidthMm, configStore.rebateDepthMm,
        configStore.frontFaceThicknessMm, configStore.cornerRadiusMm,
        configStore.rearCornerRadiusMm, configStore.midRailsEnabled,
        configStore.midRailsEqualise, configStore.midRails,
        configStore.hingeDrilling, configStore.hinges,
        configStore.material, configStore.finish, configStore.showDimensions
    ]);

    const handleBlur = useCallback((field: string) => {
        setTouched(prev => {
            const next = new Set(prev);
            next.add(field);
            return next;
        });
        orderValidation.handleBlur(
            field,
            customerDetails[field as keyof typeof customerDetails],
            customerDetails
        );
    }, [customerDetails, orderValidation]);

    const getError = useCallback((field: string): string | undefined => {
        if (!touched.has(field)) return undefined;
        return syncFieldErrors[field] || orderValidation.fieldErrors[field];
    }, [touched, syncFieldErrors, orderValidation.fieldErrors]);

    if (!door) return null;

    const up = (vals: any) => updateDoor(doorId, vals);

    const calculateTotal = () => doors.reduce((acc, d) => acc + d.lineTotal, 0);

    const handleExport = async (type: "dxf" | "svg") => {
        setIsExporting(true);
        try {
            const exportConfig = { ...door };
            const response = await fetch(`/api/export/prepare?type=${type}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(exportConfig),
            });
            if (!response.ok) throw new Error(`Failed to prepare ${type.toUpperCase()} export`);
            const { token } = await response.json();
            window.location.href = `/api/download/${type}/${token}`;
        } catch (error) {
            console.error("Export Error:", error);
            toast.error("Export Failed", { description: "Could not prepare the file for download." });
        } finally {
            setIsExporting(false);
        }
    };

    const addHinge = () => {
        const newHinge = {
            id: Math.random().toString(36).substr(2, 9),
            positionMm: Math.round(door.height / 2),
            side: "LEFT" as const,
            type: "SCREW_POINTS" as const
        };
        up({ hinges: [...door.hinges, newHinge] });
    };

    const removeHinge = (id: string) => up({ hinges: door.hinges.filter(h => h.id !== id) });
    const updateHinge = (id: string, updates: any) => up({ hinges: door.hinges.map(h => h.id === id ? { ...h, ...updates } : h) });

    const isHingeInvalid = (hinge: any) => {
        const hY = hinge.positionMm;
        const hX = hinge.side === "LEFT" ? 22 : door.width - 22;
        if (hinge.side === "LEFT" && door.angledLeft) {
            if ((hX) / (door.leftTriangleCutoutWidth || 1) + (door.height - hY) / (door.leftTriangleCutoutHeight || 1) < 1) return true;
        }
        if (hinge.side === "RIGHT" && door.angledRight) {
            if ((door.width - hX) / (door.rightTriangleCutoutWidth || 1) + (door.height - hY) / (door.rightTriangleCutoutHeight || 1) < 1) return true;
        }
        return false;
    };

    const handleCheckout = useCallback(async () => {
        if (doors.length === 0) return;
        const fields = ["customerName", "customerEmail", "phone", "companyName", "addressLine1", "city", "postcode"];
        setTouched(new Set(fields));

        const submissionData = { ...customerDetails, quantity: 1 };
        const result = await submitOrderHook(submissionData, doors);

        if (result.success && result.orderReference) {
            const newHistoryItem: OrderHistoryItem = {
                orderReference: result.orderReference,
                customerName: submissionData.customerName,
                total: calculateTotal().toFixed(2),
                date: new Date(),
                itemCount: doors.length
            };
            addOrder(newHistoryItem);
            setOrderResult({ orderReference: result.orderReference, invoiceUrl: result.invoiceUrl });
            toast.success("Success!", { description: "Draft order created and synced to Shopify." });
            // Do NOT reset store here, let the user see the success screen first.
        }
    }, [customerDetails, doors, submitOrderHook, addOrder]);

    // --- Panel Transition Variants ---
    const panelVariants = {
        initial: { x: "100%", opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: "-100%", opacity: 0 },
    };

    return (
        <div className="config-panel-container">
            <AnimatePresence mode="wait">
                {/* MAIN CONFIG VIEW */}
                {currentView === "config" && (
                    <motion.div
                        key="config"
                        initial="initial" animate="animate" exit="exit"
                        variants={panelVariants}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="config-panel-view"
                    >
                        {/* Header */}
                        <div className="p-5 border-b bg-gradient-to-r from-background to-muted/30">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-lg tracking-tight flex items-center gap-2">
                                        {door.label}
                                        <span className="text-[9px] uppercase tracking-widest font-bold text-white px-2 py-0.5 premium-accent-gradient rounded-full">Premium</span>
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">{door.width} x {door.height}mm &bull; <span className="font-semibold text-foreground">£{door.unitPrice.toFixed(2)}</span></p>
                                </div>
                                {history.length > 0 && (
                                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => setCurrentView("history")}>
                                        <Check className="w-3 h-3 text-green-600" />
                                        History ({history.length})
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Content */}
                        <ScrollArea className="flex-1">
                            <div className="p-4 space-y-4">
                                <div className="flex items-center justify-between gap-4">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Door Configuration</h4>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-3 text-[10px] border-dashed border hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30 transition-colors"
                                        onClick={() => {
                                            if (window.confirm("Reset this door to default settings?")) {
                                                // 1. Reset the local config store
                                                configStore.resetConfig();

                                                // 2. Extract initial values (excluding state flags) to update the main store
                                                const defaultVals = {
                                                    width: 600,
                                                    height: 720,
                                                    thickness: 22,
                                                    preset: "single",
                                                    panelType: "STANDARD_12MM",
                                                    panelCount: 1,
                                                    shape: "rectangular",
                                                    angledLeft: false,
                                                    angledRight: false,
                                                    leftTriangleCutoutWidth: 0,
                                                    leftTriangleCutoutHeight: 0,
                                                    rightTriangleCutoutWidth: 0,
                                                    rightTriangleCutoutHeight: 0,
                                                    borderWidth: 65,
                                                    customBorders: false,
                                                    midRailsEnabled: false,
                                                    hingeDrilling: false,
                                                    hinges: [],
                                                    midRails: [],
                                                };
                                                updateDoor(doorId, defaultVals as any);
                                                toast.success("Door reset to defaults");
                                            }
                                        }}
                                    >
                                        Reset to Default
                                    </Button>
                                </div>

                                <Tabs defaultValue="dimensions">
                                    <TabsList className="w-full grid grid-cols-4 p-1 bg-muted/50 rounded-xl">
                                        <TabsTrigger value="dimensions" className="rounded-lg text-xs">Dims</TabsTrigger>
                                        <TabsTrigger value="style" className="rounded-lg text-xs">Style</TabsTrigger>
                                        <TabsTrigger value="frame" className="rounded-lg text-xs">Frame</TabsTrigger>
                                        <TabsTrigger value="hardware" className="rounded-lg text-xs">Hardware</TabsTrigger>
                                    </TabsList>

                                    {/* DIMENSIONS */}
                                    <TabsContent value="dimensions" className="space-y-3 mt-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5"><Label className="text-xs">Width (mm)</Label><Input type="number" value={door.width} onChange={(e) => up({ width: Number(e.target.value) })} className="h-9" /></div>
                                            <div className="space-y-1.5"><Label className="text-xs">Height (mm)</Label><Input type="number" value={door.height} onChange={(e) => up({ height: Number(e.target.value) })} className="h-9" /></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">Thickness</Label>
                                                <Select value={String(door.thickness)} onValueChange={(v) => up({ thickness: Number(v) })}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent className="bg-background"><SelectItem value="18">18mm</SelectItem><SelectItem value="22">22mm</SelectItem><SelectItem value="25">25mm</SelectItem></SelectContent></Select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">Preset</Label>
                                                <Select value={door.preset} onValueChange={(v) => up({ preset: v })}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent className="bg-background"><SelectItem value="single">Single Door</SelectItem><SelectItem value="double">Double Door Pair</SelectItem><SelectItem value="shaker_2">2 Panel Shaker</SelectItem><SelectItem value="shaker_4">4 Panel Shaker</SelectItem></SelectContent></Select>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* STYLE */}
                                    <TabsContent value="style" className="space-y-3 mt-4">
                                        <div className="space-y-1.5"><Label className="text-xs">Panel Type</Label><Select value={door.panelType} onValueChange={(v) => up({ panelType: v })}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="STANDARD_12MM">Standard 12mm</SelectItem><SelectItem value="REEDED_19MM">Reeded 19mm</SelectItem><SelectItem value="MELAMINE_18MM">Melamine 18mm</SelectItem><SelectItem value="NONE">Slab (Empty)</SelectItem></SelectContent></Select></div>
                                        <div className="space-y-1.5"><Label className="text-xs">Finish</Label><Select value={door.finish} onValueChange={(v) => up({ finish: v })}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="RAW_UNASSEMBLED">Raw (Unassembled)</SelectItem><SelectItem value="ASSEMBLED_PREP">Assembled (Sanded)</SelectItem><SelectItem value="PRIMED">Primed</SelectItem></SelectContent></Select></div>
                                    </TabsContent>

                                    {/* FRAME & ANGLES */}
                                    <TabsContent value="frame" className="space-y-3 mt-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5"><Label className="text-xs">Stile/Rail Width</Label><Input type="number" min="35" max="200" value={door.borderWidth} onChange={(e) => up({ borderWidth: Number(e.target.value) })} className="h-9" /></div>
                                            <div className="space-y-1.5"><Label className="text-xs">Internal Radius</Label><Input type="number" value={door.cornerRadiusMm} disabled className="bg-muted h-9" /><p className="text-[9px] text-muted-foreground">Fixed: 2.5mm</p></div>
                                        </div>
                                        <div className="border p-3 rounded-lg space-y-3"><h4 className="font-medium text-xs">Angled Doors</h4><div className="grid grid-cols-2 gap-3"><div className="flex items-center justify-between border p-2 rounded text-xs"><Label className="cursor-pointer" htmlFor="angL">Left Angle</Label><Switch id="angL" checked={door.angledLeft} onCheckedChange={(c) => up({ angledLeft: c })} /></div><div className="flex items-center justify-between border p-2 rounded text-xs"><Label className="cursor-pointer" htmlFor="angR">Right Angle</Label><Switch id="angR" checked={door.angledRight} onCheckedChange={(c) => up({ angledRight: c })} /></div></div>{(door.angledLeft || door.angledRight) && (<div className="grid grid-cols-2 gap-3">{door.angledLeft && (<div className="space-y-1"><Label className="text-[10px]">Left Cut W/H</Label><div className="flex gap-1"><Input type="number" value={door.leftTriangleCutoutWidth} onChange={(e) => up({ leftTriangleCutoutWidth: Number(e.target.value) })} className="h-8" /><Input type="number" value={door.leftTriangleCutoutHeight} onChange={(e) => up({ leftTriangleCutoutHeight: Number(e.target.value) })} className="h-8" /></div></div>)}{door.angledRight && (<div className="space-y-1"><Label className="text-[10px]">Right Cut W/H</Label><div className="flex gap-1"><Input type="number" value={door.rightTriangleCutoutWidth} onChange={(e) => up({ rightTriangleCutoutWidth: Number(e.target.value) })} className="h-8" /><Input type="number" value={door.rightTriangleCutoutHeight} onChange={(e) => up({ rightTriangleCutoutHeight: Number(e.target.value) })} className="h-8" /></div></div>)}</div>)}</div>
                                    </TabsContent>

                                    {/* HARDWARE */}
                                    <TabsContent value="hardware" className="space-y-3 mt-4">
                                        <div className="flex items-center justify-between border p-3 rounded-lg"><div><Label className="text-sm font-medium">Hinge Drilling</Label><p className="text-[10px] text-muted-foreground">(+£1.50/hole)</p></div><Switch checked={door.hingeDrilling} onCheckedChange={(c) => { const updates: any = { hingeDrilling: c }; if (c && door.hinges.length === 0) { updates.hinges = [{ id: 'h1', positionMm: 100, side: "LEFT", type: "SCREW_POINTS" }, { id: 'h2', positionMm: door.height - 100, side: "LEFT", type: "SCREW_POINTS" }]; } up(updates); }} /></div>
                                        {door.hingeDrilling && (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between"><Label className="text-xs">Hinges: {door.hinges.length}</Label><Button size="sm" variant="outline" onClick={addHinge} className="h-7 text-xs"><Plus className="w-3 h-3 mr-1" />Add</Button></div>
                                                <div className="space-y-2">
                                                    {door.hinges.map((h, i) => (
                                                        <div key={h.id} className="p-2.5 border rounded-lg bg-muted/30 space-y-2">
                                                            <div className="flex items-center justify-between"><span className="text-[10px] font-semibold text-muted-foreground uppercase">Hinge {i + 1}</span><Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-destructive" onClick={() => removeHinge(h.id)}><Trash2 className="w-3 h-3" /></Button></div>
                                                            {isHingeInvalid(h) && <div className="text-[9px] text-amber-600 bg-amber-100 p-1.5 rounded"><AlertTriangle className="w-3 h-3 inline mr-1" />In angled area</div>}
                                                            <div className="grid grid-cols-2 gap-2"><div className="space-y-0.5"><Label className="text-[9px] text-muted-foreground">Position (mm)</Label><Input type="number" value={h.positionMm} className="h-7 text-xs" onChange={(e) => updateHinge(h.id, { positionMm: Number(e.target.value) })} /></div><div className="space-y-0.5"><Label className="text-[9px] text-muted-foreground">Side</Label><Select value={h.side} onValueChange={(v) => updateHinge(h.id, { side: v })}><SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger><SelectContent className="bg-background"><SelectItem value="LEFT">Left</SelectItem><SelectItem value="RIGHT">Right</SelectItem></SelectContent></Select></div></div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </TabsContent>


                                </Tabs>
                            </div>
                        </ScrollArea>

                        {/* Footer Actions */}
                        <div className="p-2.5 border-t bg-gradient-to-r from-muted/30 to-background mt-auto shrink-0 shadow-[0_-4px_12px_-4px_rgba(0,0,0,0.1)]">
                            <motion.div
                                initial={{ scale: 0.98 }}
                                animate={{ scale: 1 }}
                                transition={{ repeat: Infinity, repeatType: "reverse", duration: 1.5, ease: "easeInOut" }}
                            >
                                <Button
                                    className="w-full h-12 premium-gradient text-white font-black text-base uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                                    onClick={() => setCurrentView("cart")}
                                    disabled={door.width < 200 || door.height < 200 || door.panelType === "UNSELECTED" || door.finish === "NONE"}
                                >
                                    <ShoppingCart className="w-5 h-5 mr-3" />
                                    {door.width < 200 || door.height < 200 ? "Enter Dimensions" : door.panelType === "UNSELECTED" ? "Select Panel" : door.finish === "NONE" ? "Select Finish" : "Add to Cart"}
                                </Button>
                            </motion.div>
                        </div>
                    </motion.div>
                )}

                {/* CART VIEW */}
                {currentView === "cart" && (
                    <motion.div
                        key="cart"
                        initial="initial" animate="animate" exit="exit"
                        variants={panelVariants}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="config-panel-view"
                    >
                        <div className="p-5 border-b bg-gradient-to-r from-background to-muted/30 flex items-center gap-3">
                            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setCurrentView("config")}><ChevronLeft className="w-5 h-5" /></Button>
                            <div>
                                <h3 className="font-bold text-lg">Your Project</h3>
                                <p className="text-xs text-muted-foreground">Total: <span className="font-semibold text-primary">£{calculateTotal().toFixed(2)}</span></p>
                            </div>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="p-4 space-y-3">
                                {doors.map((d) => (
                                    <div key={d.id} className={`p-3 border rounded-xl flex items-center gap-3 transition-all ${d.id === doorId ? 'ring-2 ring-primary bg-primary/5' : 'bg-muted/30'}`}>
                                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0"><Box className="w-6 h-6 text-muted-foreground" /></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm truncate">{d.label}</p>
                                            <p className="text-xs text-muted-foreground">{d.width}x{d.height}mm &bull; Qty: {d.qty}</p>
                                        </div>
                                        <p className="font-bold text-sm shrink-0">£{d.unitPrice.toFixed(2)}</p>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setActiveDoor(d.id); setCurrentView("config"); }}><Box className="w-4 h-4 text-primary" /></Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { duplicateDoor(d.id); toast.success("Door duplicated"); }}><Copy className="w-4 h-4" /></Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => {
                                                if (window.confirm("Remove this door from your project?")) {
                                                    removeDoor(d.id);
                                                    toast.success("Door removed");
                                                }
                                            }}><Trash2 className="w-4 h-4" /></Button>
                                        </div>
                                    </div>
                                ))}
                                {doors.length === 0 && <p className="text-center text-muted-foreground py-10">Your cart is empty.</p>}
                            </div>
                        </ScrollArea>
                        <div className="p-3 border-t mt-auto shrink-0 space-y-2 bg-muted/20">
                            <Button className="w-full h-11" variant="outline" onClick={() => { addDoor(); useDoorConfig.getState().resetConfig(); setCurrentView("config"); }}><Plus className="w-4 h-4 mr-2" />Add New Door</Button>
                            <Button className="w-full h-12 premium-gradient text-white font-bold text-base uppercase tracking-wide shadow-lg" onClick={() => setCurrentView("checkout")}>
                                Checkout Now<ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </div>
                    </motion.div>
                )}

                {/* CHECKOUT VIEW */}
                {currentView === "checkout" && (
                    <motion.div
                        key="checkout"
                        initial="initial" animate="animate" exit="exit"
                        variants={panelVariants}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="config-panel-view"
                    >
                        <div className="h-20 premium-gradient flex items-center px-5 text-white relative shrink-0">
                            <Button variant="ghost" size="icon" className="shrink-0 text-white hover:bg-white/20 mr-3" onClick={() => setCurrentView("cart")}><ChevronLeft className="w-5 h-5" /></Button>
                            <div>
                                <h3 className="font-bold text-lg">{phase === "complete" ? "Sync Complete" : "Secure Checkout"}</h3>
                                <p className="text-xs text-white/70">{phase === "complete" ? "Now in Shopify." : "Sync with your Shopify store."}</p>
                            </div>
                            <ShoppingCart className="w-10 h-10 absolute right-5 opacity-20" />
                        </div>

                        <ScrollArea className="flex-1">
                            <div className="p-5">
                                {phase !== "idle" && <div className="mb-4"><SyncStatusPanel /></div>}

                                {phase === "complete" ? (
                                    <div className="py-6 flex flex-col items-center justify-center text-center inset-0">
                                        {/* Confetti only when complete */}
                                        <div className="fixed inset-0 pointer-events-none z-[100]">
                                            <Confetti
                                                width={width}
                                                height={height}
                                                recycle={false}
                                                numberOfPieces={500}
                                                gravity={0.15}
                                            />
                                        </div>

                                        <motion.div
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                            className="bg-white dark:bg-zinc-900/80 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white/20 dark:border-white/10 max-w-sm w-full relative overflow-hidden"
                                        >
                                            {/* Decorative background glow */}
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-primary/20 blur-3xl rounded-full pointer-events-none" />

                                            <div className="w-20 h-20 mx-auto premium-accent-gradient rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30 mb-6 relative z-10">
                                                <Check className="w-10 h-10 text-white stroke-[3]" />
                                            </div>

                                            <h3 className="text-2xl font-black tracking-tight mb-2">Order Confirmed!</h3>
                                            <p className="text-muted-foreground text-sm mb-6">
                                                Your custom door configuration has been successfully synced to Shopify.
                                            </p>

                                            <div className="bg-muted/50 rounded-xl p-4 mb-8 border border-border/50">
                                                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Order Reference</p>
                                                <p className="text-xl font-mono font-bold text-primary tracking-wider">{orderResult?.orderReference || "Loading..."}</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 w-full">
                                                <Button
                                                    variant="outline"
                                                    className="h-11 rounded-xl"
                                                    onClick={() => {
                                                        const { resetStore } = useDoorStore.getState();
                                                        resetStore();
                                                        setCurrentView("history");
                                                        resetOrder();
                                                        setOrderResult(null);
                                                    }}
                                                >
                                                    View History
                                                </Button>
                                                <Button
                                                    className="h-11 rounded-xl premium-gradient text-white font-bold shadow-xl shadow-primary/20"
                                                    onClick={() => {
                                                        const { resetStore } = useDoorStore.getState();
                                                        resetStore();
                                                        setCurrentView("config");
                                                        resetOrder();
                                                        setOrderResult(null);
                                                    }}
                                                >
                                                    New Order
                                                </Button>
                                            </div>

                                            {orderResult?.invoiceUrl && (
                                                <>
                                                    <Button
                                                        className="w-full h-12 mt-4 rounded-xl bg-[#008060] hover:bg-[#004C3F] text-white font-bold shadow-xl shadow-green-900/10 text-lg"
                                                        onClick={() => window.open(orderResult.invoiceUrl, '_blank')}
                                                    >
                                                        Pay Securely with Shopify <ExternalLink className="w-5 h-5 ml-2" />
                                                    </Button>
                                                    <p className="text-[10px] text-muted-foreground text-center mt-2 break-all select-all">
                                                        Debug URL: {orderResult.invoiceUrl}
                                                    </p>
                                                </>
                                            )}
                                        </motion.div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <ValidatedInput label="Contact Name" value={customerDetails.customerName} onChange={(e) => handleInputChange("customerName", e.target.value)} onBlur={() => handleBlur("customerName")} error={getError("customerName")} touched={touched.has("customerName")} placeholder="John Doe" className="h-9" />
                                            <ValidatedInput label="Company" value={customerDetails.companyName} onChange={(e) => handleInputChange("companyName", e.target.value)} onBlur={() => handleBlur("companyName")} error={getError("companyName")} touched={touched.has("companyName")} placeholder="Acme Inc" className="h-9" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <ValidatedInput label="Email" type="email" value={customerDetails.customerEmail} onChange={(e) => handleInputChange("customerEmail", e.target.value)} onBlur={() => handleBlur("customerEmail")} error={getError("customerEmail")} touched={touched.has("customerEmail")} placeholder="john@example.com" className="h-9" />
                                            <ValidatedInput label="Phone" value={customerDetails.phone} onChange={(e) => handleInputChange("phone", e.target.value)} onBlur={() => handleBlur("phone")} error={getError("phone")} touched={touched.has("phone")} placeholder="+44 7700 900000" className="h-9" />
                                        </div>
                                        <div className="bg-muted/50 p-3 rounded-xl space-y-3 border">
                                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Shipping</h4>
                                            <ValidatedInput label="Address" value={customerDetails.addressLine1} onChange={(e) => handleInputChange("addressLine1", e.target.value)} onBlur={() => handleBlur("addressLine1")} error={getError("addressLine1")} touched={touched.has("addressLine1")} placeholder="123 High St" className="h-9" />
                                            <div className="grid grid-cols-2 gap-3">
                                                <ValidatedInput label="City" value={customerDetails.city} onChange={(e) => handleInputChange("city", e.target.value)} onBlur={() => handleBlur("city")} error={getError("city")} touched={touched.has("city")} placeholder="London" className="h-9" />
                                                <ValidatedInput label="Postcode" value={customerDetails.postcode} onChange={(e) => handleInputChange("postcode", e.target.value)} onBlur={() => handleBlur("postcode")} error={getError("postcode")} touched={touched.has("postcode")} placeholder="SW1A 1AA" className="h-9" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>

                        {phase !== "complete" && (
                            <div className="p-4 border-t mt-auto shrink-0">
                                <Button className="w-full h-11 premium-gradient text-white font-bold" onClick={handleCheckout} disabled={isSubmittingHook || (phase !== "idle" && (phase as string) !== "error")}>
                                    {isSubmittingHook ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</> : "Confirm & Sync To Shopify"}
                                </Button>
                            </div>
                        )}
                    </motion.div>
                )}
                {/* HISTORY VIEW */}
                {currentView === "history" && (
                    <motion.div
                        key="history"
                        initial="initial" animate="animate" exit="exit"
                        variants={panelVariants}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="config-panel-view"
                    >
                        <div className="p-5 border-b bg-gradient-to-r from-background to-muted/30 flex items-center gap-3">
                            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setCurrentView("config")}><ChevronLeft className="w-5 h-5" /></Button>
                            <div>
                                <h3 className="font-bold text-lg">Session History</h3>
                                <p className="text-xs text-muted-foreground">Orders placed in this session</p>
                            </div>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="p-4 space-y-3">
                                {history.map((h, i) => (
                                    <div key={i} className="p-4 border rounded-xl bg-muted/20 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-sm tracking-wide">{h.orderReference}</span>
                                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase">Success</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-y-1 text-xs text-muted-foreground">
                                            <span>Customer:</span><span className="text-foreground font-medium text-right">{h.customerName}</span>
                                            <span>Items:</span><span className="text-foreground font-medium text-right">{h.itemCount}</span>
                                            <span>Total:</span><span className="text-foreground font-medium text-right">£{h.total}</span>
                                            <span>Time:</span><span className="text-foreground font-medium text-right">{h.date.toLocaleTimeString()}</span>
                                        </div>
                                    </div>
                                ))}
                                {history.length === 0 && <p className="text-center text-muted-foreground py-10">No orders placed yet.</p>}
                            </div>
                        </ScrollArea>
                        <div className="p-4 border-t mt-auto shrink-0">
                            <Button className="w-full h-11 premium-gradient text-white" onClick={() => setCurrentView("config")}>
                                <Plus className="w-4 h-4 mr-2" /> Start New Order
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
