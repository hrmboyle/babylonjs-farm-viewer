# Babylon.js Farm Terrain Viewer

A first-person 3D viewer for farm terrain built with Babylon.js that loads OBJ/MTL mesh files and provides WASD+mouse controls for exploration.

## Features

### Core Functionality
- **OBJ/MTL Mesh Loading**: Loads farm terrain from `assets/farm.obj` with materials from `assets/farm.mtl`
- **Dual Camera System**: Starts with ArcRotate camera for overview, switches to UniversalCamera for first-person exploration
- **First-Person Controls**: WASD movement with mouse look and pointer lock
- **Physics & Collision**: Gravity simulation and collision detection to prevent falling through terrain
- **Safety Ground Plane**: Backup collision surface beneath the farm mesh

### Controls
- **WASD**: Move forward/backward/strafe left/right
- **Mouse**: Look around (after clicking to lock cursor)
- **Click**: Lock mouse cursor for first-person view
- **ESC**: Release mouse cursor

### Performance Optimizations
- Backface culling enabled on materials
- Static mesh matrix freezing for better performance  
- Scene-level optimizations (skip pointer move picking, optimized clearing)
- Collision system with efficient ellipsoid collision detection

## File Structure

```
babylonjs-farm-viewer/
├── index.html          # Main HTML page with canvas and Babylon.js imports
├── main.js             # Core application logic and scene setup
├── assets/             # Directory for 3D assets
│   ├── farm.obj        # Farm terrain mesh (place your file here)
│   ├── farm.mtl        # Farm materials (place your file here)  
│   └── README.md       # Assets directory documentation
└── README.md           # This file
```

## Setup & Usage

### Prerequisites
- Modern web browser with WebGL support
- Local web server (due to CORS restrictions for loading files)

### Quick Start

1. **Place your farm assets:**
   - Copy your `farm.obj` file to the `assets/` directory
   - Copy your `farm.mtl` file to the `assets/` directory (optional)

2. **Start a local web server:**
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js (if you have http-server installed)
   npx http-server
   
   # Using PHP
   php -S localhost:8000
   ```

3. **Open in browser:**
   - Navigate to `http://localhost:8000`
   - The farm terrain will load automatically
   - Click on the canvas to start first-person mode

### Without Farm Assets
If you don't have `farm.obj`/`farm.mtl` files yet, the application will create a placeholder cube that you can use to test the first-person controls and movement system.

## Technical Details

### Babylon.js Configuration
- **Engine**: Created with preserveDrawingBuffer and stencil buffer support
- **Physics**: Cannon.js physics engine with gravity (-9.81 m/s²)
- **Lighting**: Hemispheric light for ambient + directional light for depth
- **Collisions**: Full collision detection between camera and meshes

### Camera Configuration
- **Player Height**: 1.8 meters  
- **Move Speed**: 0.3 units per frame
- **Mouse Sensitivity**: 0.002 radians per pixel
- **Collision Ellipsoid**: 0.5×0.9×0.5 meter capsule around player

### Performance Features
- Static mesh optimization (freezeWorldMatrix)
- Material backface culling
- Optimized render loop with selective clearing
- Efficient collision detection

## Extension Ideas

This codebase is designed for easy extension. Consider adding:

- **Enhanced Lighting**: Dynamic day/night cycles, shadows
- **Terrain Interaction**: Click-to-interact with farm objects  
- **Audio**: Ambient sounds, footstep audio
- **Weather Effects**: Rain, fog, wind animations
- **UI Enhancements**: Minimap, object information panels
- **Multiple Terrains**: Load different farm layouts dynamically

## Browser Compatibility

- Chrome/Chromium: Full support
- Firefox: Full support  
- Safari: Full support
- Edge: Full support

Requires WebGL support and modern JavaScript features (ES6+ classes, async/await).

## Troubleshooting

### Common Issues

**"Failed to load farm terrain"**
- Ensure `farm.obj` is in the `assets/` directory
- Check browser console for specific error messages
- Verify you're running from a web server (not file:// protocol)

**Controls not responding**
- Click on the canvas to activate pointer lock
- Check browser console for JavaScript errors
- Ensure browser supports pointer lock API

**Performance issues**  
- Check WebGL support in browser
- Monitor browser console for warnings
- Consider reducing mesh complexity if using very detailed models

**Mesh appears too large/small**
- The camera auto-adjusts based on mesh bounding box
- Modify `this.camera.radius` calculation in `loadFarmMesh()` if needed
- Check mesh scale in your 3D modeling software