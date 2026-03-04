import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function run() {
    try {
        console.log("Trying raw insert...");
        await db.execute(sql`
      insert into "order_items" (
        "order_id", "line_number", "quantity", "style_id", "finish_id", 
        "height_mm", "width_mm", "panel_type", "panel_thickness_mm", 
        "panel_orientation", "material", "is_angled", "angled_shorter_side", 
        "left_angle_degrees", "right_angle_degrees", "left_triangle_cutout_width", 
        "left_triangle_cutout_height", "right_triangle_cutout_width", 
        "right_triangle_cutout_height", "border_bottom_rail", "border_top_rail", 
        "border_left_stile", "border_right_stile", "hinge_quantity", 
        "mid_rails_equalise", "base_price", "unit_price_exc_vat", 
        "line_total_exc_vat", "door_area_sqm"
      ) 
      values (
        17, 1, 1, 1, 1, 1000, 500, 'STANDARD_12MM', 22, 'vertical', 'MR MDF', 
        false, null, 0, 0, 0, 0, 0, 0, 90, 90, 90, 90, 0, false, 
        40.50, 40.50, 40.50, 0.5000
      );
    `);
        console.log("Success");
    } catch (e: any) {
        console.error("Postgres Error details:", e);
    }
}

run().catch(console.error).finally(() => process.exit(0));
