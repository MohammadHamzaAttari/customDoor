import { z } from "zod";

export const doorConfigSchema = z.object({
  width: z.number().min(400).max(1000),
  height: z.number().min(1500).max(2500),
  thickness: z.number().min(22).max(60),
  mainHeight: z.number().min(1500).max(2500),
  secondaryHeight: z.number().min(500).max(2000),
  topWidth: z.number().min(100).max(500),
  preset: z.enum(["single", "double", "shaker_2", "shaker_4", "shaker_6", "panel_3", "panel_4", "panel_6"]),
  panelType: z.enum(["flat", "shaker", "raised"]),
  panelCount: z.number().min(1).max(6),
  borderHeight: z.object({
    top: z.number().min(0).max(200),
    bottom: z.number().min(0).max(200),
  }),
  borderStyle: z.enum(["none", "simple", "detailed"]),
  showDimensions: z.boolean(),
  basePrice: z.number(),
  price: z.number(),
});

export type DoorConfig = z.infer<typeof doorConfigSchema>;

export const cartItemSchema = z.object({
  id: z.number(),
  timestamp: z.string(),
  config: doorConfigSchema,
  quantity: z.number().default(1),
});

export type CartItem = z.infer<typeof cartItemSchema>;
