# Assets Directory

Place your farm terrain files here:

## Required Files:
- `farm.obj` - The main farm terrain mesh in OBJ format
- `farm.mtl` - The material file for the farm mesh (optional but recommended)

## File Format Notes:
- The OBJ file should contain the farm terrain geometry
- The MTL file should define materials and textures for the mesh
- Both files should be placed directly in this `/assets` directory
- The application will automatically create a placeholder mesh if these files are not found

## Example Structure:
```
assets/
├── farm.obj
├── farm.mtl
└── README.md (this file)
```

If you don't have these files yet, the application will create a simple placeholder cube that you can use for testing the first-person controls.