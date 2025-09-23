# Assets Directory

Place your terrain block files here. The application now supports loading multiple terrain blocks instead of a single farm mesh.

## Directory Structure:
Each terrain block should be in its own subdirectory with matching OBJ/MTL files:

```
assets/
├── BlockAB/
│   ├── BlockAB.obj
│   ├── BlockAB.mtl (optional)
│   └── README.md
├── BlockAYA/
│   ├── BlockAYA.obj
│   ├── BlockAYA.mtl (optional)
│   └── README.md
├── BlockAYX/
│   ├── BlockAYX.obj
│   ├── BlockAYX.mtl (optional)
│   └── README.md
├── BlockXB/
│   ├── BlockXB.obj
│   ├── BlockXB.mtl (optional)
│   └── README.md
├── BlockXYA/
│   ├── BlockXYA.obj
│   ├── BlockXYA.mtl (optional)
│   └── README.md
├── BlockXYX/
│   ├── BlockXYX.obj
│   ├── BlockXYX.mtl (optional)
│   └── README.md
└── README.md (this file)
```

## File Format Notes:
- Each block directory must contain an OBJ file with the same name as the directory
- MTL files are optional but recommended for materials and textures
- Meshes should be positioned correctly to tile together (no manual positioning offsets are applied)
- The application will create colorful placeholder blocks if these files are not found

## Adding/Removing Blocks:
To modify which blocks are loaded, edit the `blockNames` array in `main.js` at line ~180:
```javascript
const blockNames = ["BlockAB", "BlockAYA", "BlockAYX", "BlockXB", "BlockXYA", "BlockXYX"];
```

Then create the corresponding directory structure in `/assets/`.
