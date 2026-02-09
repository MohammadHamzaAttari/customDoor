# Door Configurator

## Overview

This is a 3D door configurator web application that allows users to design custom doors with real-time visualization. Users can adjust door dimensions, panel styles, border configurations, and preview their design in an interactive 3D environment. The application supports saving configurations and adding designed doors to a shopping cart.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack**: React with TypeScript, using Vite as the build tool and development server.

**3D Rendering**: Built with React Three Fiber (R3F) and Three.js for 3D door visualization. The application uses @react-three/drei for helper components like OrbitControls, Environment, and ContactShadows, providing realistic lighting and camera controls.

**UI Framework**: Radix UI components with Tailwind CSS for styling. The design system uses CSS custom properties for theming and class-variance-authority for component variants. Components follow a consistent design pattern with shadcn/ui structure.

**State Management**: Zustand stores manage application state:
- `useDoorConfig`: Manages door configuration parameters (dimensions, panel type, preset selection, pricing)
- `useGame`: Manages game-like interaction phases (appears to be a remnant from template code)
- `useAudio`: Manages audio state (also appears to be template remnant)

**Data Fetching**: TanStack Query (React Query) handles server state management with custom query functions that include authentication support and error handling.

### Backend Architecture

**Server Framework**: Express.js server with TypeScript, serving both API endpoints and the built frontend in production.

**Development Setup**: Vite development server runs in middleware mode during development, enabling hot module replacement (HMR) while the Express server handles API routes.

**API Design**: RESTful API with the following endpoints:
- `POST /api/door-config`: Save door configuration
- `GET /api/door-config/:id`: Retrieve door configuration by ID
- `POST /api/cart`: Add item to cart
- `GET /api/cart`: Get all cart items
- `DELETE /api/cart/:id`: Remove item from cart
- `POST /api/export/dxf`: Generate DXF (Drawing Exchange Format) file for CNC manufacturing

### DXF Export Feature

**Purpose**: Generate production-ready DXF files that can be directly used by CNC machines for door manufacturing.

**Technology**: Uses `@tarikjabiri/dxf` library for DXF file generation.

**DXF Layers**:
- FRAME: Main door outline (rectangular or angled/trapezoid)
- PANELS: Panel cutouts with shaker/raised styles
- BORDERS: Top and bottom border decorations
- RAILS: Horizontal rails at configurable positions
- HANDLES: Handle and lock hardware positions
- DIMENSIONS: Measurement annotations
- CENTER_LINES: Reference lines for alignment

**Features**:
- Supports both rectangular and angled door shapes
- Double door configurations with proper spacing
- Panel styles: flat, shaker, raised
- Border styles: none, simple, detailed
- Configurable rail positions and heights
- Title block with complete specifications

**Request Validation**: Zod schemas validate incoming requests for door configurations and cart items, ensuring type safety between client and server.

### Data Storage

**ORM**: Drizzle ORM configured for PostgreSQL with migrations stored in `/migrations` directory.

**Database Strategy**: The application uses a dual-storage approach:
- **Development/In-Memory**: `MemStorage` class provides in-memory storage using JavaScript Maps for rapid development
- **Production/PostgreSQL**: Database connection through Neon serverless driver (@neondatabase/serverless)

**Schema Design**: 
- User table defined with username/password fields
- Door configurations and cart items are validated through Zod schemas but don't yet have corresponding database tables (stored in memory only)

**Rationale**: This approach allows developers to work without database setup initially, with a clear migration path to persistent storage. The `IStorage` interface abstracts storage implementation, making it easy to swap between memory and database storage.

### External Dependencies

**Database**: 
- Neon PostgreSQL (serverless) via `@neondatabase/serverless`
- Connection string provided through `DATABASE_URL` environment variable
- Drizzle ORM for schema management and migrations

**3D Graphics Libraries**:
- Three.js: Core 3D rendering engine
- @react-three/fiber: React renderer for Three.js
- @react-three/drei: Helper components and abstractions
- @react-three/postprocessing: Visual effects pipeline
- vite-plugin-glsl: GLSL shader support

**UI Component Libraries**:
- Radix UI: Headless accessible components (accordion, dialog, dropdown, select, slider, switch, tabs, etc.)
- Tailwind CSS: Utility-first CSS framework
- class-variance-authority: Component variant management
- cmdk: Command menu component

**Form & Validation**:
- Zod: Runtime type validation and schema definition
- React Hook Form: Form state management (imported in form.tsx)
- drizzle-zod: Integration between Drizzle schemas and Zod validation

**Developer Experience**:
- TypeScript: Type safety across the stack
- ESBuild: Fast bundling for production server code
- @replit/vite-plugin-runtime-error-modal: Development error overlay
- Path aliases: `@/*` for client code, `@shared/*` for shared types

**Asset Support**: Configured to handle 3D models (GLTF, GLB) and audio files (MP3, OGG, WAV), suggesting future multimedia features.