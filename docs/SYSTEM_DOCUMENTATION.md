# CustomDoorDesigner System Documentation

A full-stack application for designing and ordering custom shaker-style cabinet doors with CNC manufacturing support.

---

## System Architecture

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + Vite | Interactive door configurator with 3D preview |
| Backend | Express.js | REST API for door configuration, pricing, orders |
| ORM | Drizzle ORM | Type-safe database queries |
| Database | PostgreSQL | Persistent storage for orders, customers, pricing |
| Export | DXF/SVG Generator | CNC-ready manufacturing files |

---

## Database Schema

### Core Tables (16 total)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | Authentication | username, password |
| `customers` | Customer records | company, email, addresses |
| `door_styles` | Door configurations | SHAKER, SLAB, DORDOGNE, etc. |
| `finish_options` | Finish types | RAW_MDF, PRIMED |
| `orders` | Customer orders | reference, status, totals |
| `order_items` | Door line items | dimensions, style, pricing |
| `order_item_hinges` | Hinge configurations | position, cup diameter |
| `order_item_mid_rails` | Mid-rail specs | position, width |
| `price_brackets_height` | Height pricing tiers | 7 brackets (200-2400mm) |
| `price_brackets_width` | Width pricing tiers | 4 brackets (400-1200mm) |
| `pricing_matrix` | Price lookup table | 28 price combinations |
| `surcharge_types` | Additional charges | ANGLED, MID_RAIL, HINGE |
| `delivery_options` | Delivery/collection | COLLECTION, LOCAL, NATIONAL |
| `system_settings` | Configuration settings | VAT_RATE, dimensions, fees |
| `order_attachments` | File uploads | SketchUp, PDF, DXF |
| `shopify_sync_log` | Integration logs | Shopify order sync |

---

## API Reference

### Door Styles

```http
GET /api/door-styles
```
Returns all active door styles (SHAKER, SLAB, SLAB_18, SLAB_25, DORDOGNE, SLIM_SHAKER).

### Finish Options

```http
GET /api/finish-options
```
Returns active finish types with price multipliers.

### Pricing

```http
GET /api/price-brackets/height
GET /api/price-brackets/width
GET /api/surcharges
```

```http
POST /api/calculate-price
Content-Type: application/json

{
  "heightMm": 600,
  "widthMm": 400,
  "styleCode": "SHAKER",
  "isAngled": false,
  "numPanels": 1,
  "panelSquaring": false,
  "hingeQty": 2
}
```
Returns: `{"price": 26.40}`

### Customers

```http
GET    /api/customers        # List all
GET    /api/customers/:id    # Get by ID
POST   /api/customers        # Create
PUT    /api/customers/:id    # Update
```

### Orders

```http
GET    /api/orders                    # List all
GET    /api/orders?customerId=1       # Filter by customer
GET    /api/orders/:id                # Get with items
POST   /api/orders                    # Create
PUT    /api/orders/:id                # Update
```

### Order Items

```http
GET    /api/orders/:orderId/items     # List items
POST   /api/orders/:orderId/items     # Add item
PUT    /api/order-items/:id           # Update item
DELETE /api/order-items/:id           # Remove item
```

### Export (DXF/SVG)

```http
POST /api/export/dxf
POST /api/export/svg
Content-Type: application/json
```
Generates CNC-ready manufacturing files.

### System Settings

```http
GET /api/settings           # All settings
GET /api/settings/:key      # Single setting
PUT /api/settings/:key      # Update setting
```

---

## Door Styles Reference

| Code | Name | Thickness | Angled | Mid-Rails | Price Adj. |
|------|------|----------|--------|-----------|------------|
| SHAKER | Shaker Style | 22mm | ✅ | ✅ | £0.00 |
| SLAB | Slab/Flat Panel | 22mm | ✅ | ❌ | £0.00 |
| SLAB_18 | Slab 18mm | 18mm | ✅ | ❌ | £0.00 |
| SLAB_25 | Slab 25mm | 25mm | ✅ | ❌ | £0.00 |
| DORDOGNE | Dordogne Style | 22mm | ✅ | ✅ | +£15.00 |
| SLIM_SHAKER | Slim Shaker | 22mm | ✅ | ✅ | +£10.00 |

## Surcharges Reference

| Code | Name | Type | Amount |
|------|------|------|--------|
| ANGLED | Angled Door | Fixed | £25.00 |
| MID_RAIL | Mid Rail | Per Item | £5.00 |
| HINGE_HOLE | Hinge Drilling | Per Item | £1.50 |
| PANEL_SQUARING | Corner Squaring | Fixed | £5.00 |
| ASSEMBLED | Assembly & Prep | Multiplier | 1.5x |
| PRIMED | Primed Finish | Multiplier | 2x |

---

## Quick Start

### 1. Database Setup
```bash
# Apply migrations
npm run db:push

# Seed initial data
DATABASE_URL="postgresql://user:pass@localhost:5432/tradeshaker_doors" npm run db:seed
```

### 2. Start Development Server
```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/tradeshaker_doors" npm run dev
```
Server runs on `http://localhost:5000`

### 3. Production Build
```bash
npm run build
npm start
```

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/tradeshaker_doors` |

---

## System Settings (Database)

| Key | Default | Description |
|-----|---------|-------------|
| VAT_RATE | 0.20 | UK VAT rate (20%) |
| MAX_HEIGHT_MM | 2400 | Maximum door height |
| MAX_WIDTH_MM | 1200 | Maximum door width |
| MIN_BORDER_WIDTH_MM | 50 | Minimum shaker border |
| DEFAULT_BORDER_WIDTH_MM | 90 | Default border width |
| FIXED_FEE_BASE | 3.00 | Base fee per door |
| PRICE_PER_SQM | 85.00 | Price per square meter |
| HINGE_CUP_DIAMETER_MM | 35 | Standard hinge cup |
| HINGE_CUP_DEPTH_MM | 13 | Hinge cup depth |
| DOOR_THICKNESS_MM | 22 | Standard thickness |

---

## Project Structure

```
CustomDoorDesigner/
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/            # Route pages  
│   │   ├── hooks/            # Custom React hooks
│   │   └── stores/           # Zustand state management
│   └── public/               # Static assets
├── server/                    # Express backend
│   ├── index.ts              # Server entry
│   ├── routes.ts             # API endpoints
│   ├── storage.ts            # Database operations
│   ├── db.ts                 # Drizzle connection
│   ├── seed.ts               # Database seeding
│   ├── dxfGenerator.ts       # DXF file generation
│   └── svgGenerator.ts       # SVG file generation
├── shared/                    # Shared types
│   ├── schema.ts             # Drizzle schema
│   └── doorSchema.ts         # Door configuration types
├── drizzle.config.ts         # Database configuration
└── package.json              # Dependencies
```
