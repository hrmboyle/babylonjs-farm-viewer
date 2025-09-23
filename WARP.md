# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a Babylon.js-based 3D farm terrain viewer that provides first-person exploration of multiple terrain blocks. The application loads multiple OBJ/MTL files from separate block directories and creates an immersive first-person experience with WASD+mouse controls, physics, and collision detection.

## Development Commands

### Local Development Server
The application requires a local web server due to CORS restrictions. Use one of these commands:

```bash
# Python 3 (most common)
python -m http.server 8000

# Node.js 
npx http-server

# PHP
php -S localhost:8000
```

Then navigate to `http://localhost:8000` to view the application.

### No Build Process
This is a vanilla JavaScript application with no build step. All changes are immediately reflected by refreshing the browser.

## Architecture Overview

### Core Design Pattern
The application uses a single-class architecture (`FarmViewer`) that manages the entire Babylon.js scene lifecycle:

1. **Initialization Flow**: ArcRotate camera → Mesh loading → First-person camera → Controls setup
2. **Dual Camera System**: Starts with overview camera, switches to UniversalCamera for exploration
3. **Graceful Fallback**: Creates placeholder geometry if farm assets are missing

### Key Components

**Scene Management** (`main.js` lines 69-85)
- Physics-enabled scene with Cannon.js
- Collision detection system
- Performance optimizations (skipPointerMovePicking, optimized clearing)

**Camera System** (`main.js` lines 87-256)
- Initial ArcRotate camera for scene overview
- UniversalCamera with collision ellipsoid for first-person exploration
- Auto-positioning based on mesh bounding boxes

**Asset Pipeline** (`main.js` lines 165-260)
- Multi-block OBJ/MTL loading with Promise.allSettled for parallel loading
- Individual block loading via loadBlock() helper function
- Automatic fallback to colorful placeholder blocks
- Material optimization (backface culling, matrix freezing)

**Control System** (`main.js` lines 258-323)
- Pointer lock API for mouse capture
- WASD movement with proper camera direction vectors
- Gravity and collision-aware movement

### File Structure
```
index.html          # Canvas setup and Babylon.js CDN imports
main.js             # Core application logic (single FarmViewer class)
assets/BlockAB/     # Individual terrain block directories
  BlockAB.obj       # Block mesh file
  BlockAB.mtl       # Block materials (optional)
assets/BlockAYA/    # Another terrain block
  BlockAYA.obj
  BlockAYA.mtl
# ... additional block directories
```

## Technical Constraints

### Browser Requirements
- WebGL support mandatory
- Pointer Lock API required for first-person controls
- Modern JavaScript (ES6+ classes, async/await)

### Performance Considerations
- Static mesh optimization via `freezeWorldMatrix()`
- Material backface culling enabled automatically
- Scene-level optimizations for rendering efficiency
- Physics simulation with Cannon.js (gravity: -9.81 m/s²)

### Asset Expectations
- Terrain blocks expected in subdirectories: `./assets/BlockName/BlockName.obj`
- Materials files at `./assets/BlockName/BlockName.mtl` (optional)
- Block names defined in `blockNames` array in `loadTerrainBlocks()` method
- Application auto-scales camera based on combined bounding box of all blocks
- Fallback to colorful placeholder blocks (2x2 grid) if assets missing

## Development Patterns

### Camera Configuration Values
```javascript
playerHeight: 1.8        // Player eye height in meters
moveSpeed: 0.3          // Movement speed per frame
mouseSensitivity: 0.002 // Radians per pixel
ellipsoid: 0.5×0.9×0.5  // Collision capsule dimensions
```

### Babylon.js Specific Setup
- Engine created with `preserveDrawingBuffer: true, stencil: true`
- Physics enabled with gravity vector `(0, -9.81, 0)`
- Hemispheric + directional lighting setup
- Ground plane safety net at Y = -5

### Error Handling Strategy
- Graceful fallback for missing assets
- Console logging for debugging mesh loading
- Loading screen with error display capability
- Browser compatibility checks implicit through feature usage

## Managing Terrain Blocks

### Adding New Blocks
1. Create directory: `/assets/NewBlockName/`
2. Add `NewBlockName.obj` (and optionally `NewBlockName.mtl`) to that directory
3. Add `"NewBlockName"` to the `blockNames` array in `loadTerrainBlocks()` method (~line 180)

### Current Terrain Blocks
The project currently includes 6 terrain blocks with real OBJ/MTL data:
- BlockAB, BlockAYA, BlockAYX, BlockXB, BlockXYA, BlockXYX

### Removing Blocks
1. Remove block name from `blockNames` array in `loadTerrainBlocks()` method
2. Optionally delete the `/assets/BlockName/` directory

### Block Requirements
- Meshes should be positioned correctly to tile together (no manual positioning applied)
- Each block loads independently - failures don't prevent other blocks from loading
- All blocks load in parallel for better performance

## Extension Points

The codebase is designed for easy modification in these areas:

**Lighting System** - Replace simple hemispheric/directional setup with dynamic lighting
**Dynamic Block Loading** - Load blocks based on player position or other criteria
**Interaction System** - Add click-to-interact functionality using Babylon.js picking
**Audio Integration** - Add spatial audio for immersive experience
**UI Enhancements** - Overlay information panels or minimap functionality

## Debugging Notes

### Common Issues
- **"Failed to load farm terrain"**: Check assets directory and web server setup
- **Controls unresponsive**: Verify pointer lock activation (click canvas)
- **Performance problems**: Check WebGL support and mesh complexity
- **Scale issues**: Modify camera radius calculation in `loadFarmMesh()`

### Console Output
The application provides detailed console logging for:
- Initialization steps
- Mesh loading progress
- Camera transitions
- Pointer lock status changes
- Performance optimizations applied