// Babylon.js Farm Terrain Viewer
// Main application file with scene setup, single terrain loading, and first-person controls
//
// SINGLE TERRAIN SYSTEM:
// This application loads a single terrain OBJ/MTL file from the /assets/ directory.
// By default it loads BlockAB, but you can change the terrainName property to load any available terrain.
//
// TO CHANGE TERRAIN:
// Modify the terrainName property in the constructor to use a different terrain block
// (e.g., change "BlockAB" to "BlockAYA", "BlockXB", etc.)

class FarmViewer {
    constructor() {
        this.canvas = null;
        this.engine = null;
        this.scene = null;
        this.camera = null;
        this.farmMesh = null; // Single terrain mesh
        this.groundPlane = null;
        this.keys = {};
        this.isPointerLocked = false;
        
        // Terrain configuration - change this to load different terrain
        this.terrainName = "BlockAB"; // Available: BlockAB, BlockAYA, BlockAYX, BlockXB, BlockXYA, BlockXYX
        
        // Movement settings
        this.moveSpeed = 0.08; // WASD speed made even slower
        this.mouseSensitivity = 0.002;
        this.gravity = -0.02;
        this.jumpHeight = 0.5;
        this.playerHeight = 1.8;
        this.verticalSpeed = 0.05; // Q/E speed made even slower
        this.terrainMinY = -5; // Minimum Y level (will be updated when terrain loads)
        
        // Initialize the application
        this.init();
    }

    async init() {
        try {
            console.log("Initializing Babylon.js Farm Viewer...");
            
            // Get canvas and create engine
            this.canvas = document.getElementById("babylonCanvas");
            this.engine = new BABYLON.Engine(this.canvas, true, { preserveDrawingBuffer: true, stencil: true });
            
            // Create scene
            this.createScene();
            
            // Set up initial camera (ArcRotate)
            this.createInitialCamera();
            
            // Add lighting
            this.addLighting();
            
            // Add ground plane (safety net)
            this.createGroundPlane();
            
            // Load single terrain
            await this.loadTerrain();
            
            // Switch to first-person camera
            this.setupFirstPersonCamera();
            
            // Position first-person camera above terrain
            this.positionCameraForTerrain();
            
            // Set up input controls
            this.setupControls();
            
            // Start render loop
            this.startRenderLoop();
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            console.log("Farm Viewer initialized successfully!");
            
        } catch (error) {
            console.error("Failed to initialize Farm Viewer:", error);
            this.showError("Failed to load the farm terrain. Please check the console for details.");
        }
    }

    createScene() {
        // Create scene with physics
        this.scene = new BABYLON.Scene(this.engine);
        
        // Using basic collision detection (no physics engine needed for terrain exploration)
        console.log("Using Babylon.js built-in collision detection");
        
        // Enable collisions (this works without physics engine)
        this.scene.collisionsEnabled = true;
        
        // Performance optimizations (adjusted to reduce artifacts)
        this.scene.skipPointerMovePicking = true;
        this.scene.autoClear = true;
        this.scene.autoClearDepthAndStencil = true;
        
        console.log("Scene created with collision detection");
    }

    createInitialCamera() {
        // Create ArcRotate camera initially positioned to view the farm
        this.camera = new BABYLON.ArcRotateCamera(
            "arcCamera",
            -Math.PI / 2,
            Math.PI / 2.2,
            50,
            BABYLON.Vector3.Zero(),
            this.scene
        );
        
        // Camera controls will be set up later for first-person view
        // No need to attach controls to the initial overview camera
        
        console.log("Initial ArcRotate camera created");
    }

    addLighting() {
        // Add hemispheric light for ambient lighting
        const hemisphericLight = new BABYLON.HemisphericLight(
            "hemisphericLight",
            new BABYLON.Vector3(0, 1, 0),
            this.scene
        );
        hemisphericLight.intensity = 0.8;
        hemisphericLight.diffuse = new BABYLON.Color3(1, 1, 0.9);
        hemisphericLight.specular = new BABYLON.Color3(0.5, 0.5, 0.4);
        
        // Add directional light for shadows (optional)
        const directionalLight = new BABYLON.DirectionalLight(
            "directionalLight",
            new BABYLON.Vector3(-1, -1, -0.5),
            this.scene
        );
        directionalLight.intensity = 0.5;
        
        console.log("Lighting setup complete");
    }

    createGroundPlane() {
        // Create a large ground plane as safety net
        this.groundPlane = BABYLON.MeshBuilder.CreateGround(
            "groundPlane",
            { width: 200, height: 200 },
            this.scene
        );
        
        // Position below expected farm mesh
        this.groundPlane.position.y = -5;
        
        // Create simple material for ground
        const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", this.scene);
        groundMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.35); // Subtle brownish-gray
        groundMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        this.groundPlane.material = groundMaterial;
        
        // Enable collisions for ground plane
        this.groundPlane.checkCollisions = true;
        
        console.log("Ground plane created as safety net");
    }

    /**
     * Find the .obj file in a terrain directory
     * Returns the filename of the first .obj file found
     */
    async findObjFile(terrainName) {
        // Try common naming patterns in order of likelihood
        const possibleNames = [
            'terrain.obj',         // New standard terrain file
            `${terrainName}.obj`,  // Directory name matches file name
            'Geordie.obj',         // Special case for BlockAB (legacy)
            'model.obj',           // Generic model name
            'mesh.obj',            // Generic mesh name
            'farm.obj'             // Legacy farm name
        ];
        
        for (const fileName of possibleNames) {
            try {
                // Test if file exists by attempting a HEAD request
                const testResponse = await fetch(`./assets/${terrainName}/${fileName}`, { 
                    method: 'HEAD' 
                });
                
                if (testResponse.ok) {
                    console.log(`Found .obj file: ${fileName}`);
                    return fileName;
                }
            } catch (error) {
                // File doesn't exist or network error, try next name
                continue;
            }
        }
        
        console.warn(`No .obj file found for terrain ${terrainName}, trying default name`);
        return `${terrainName}.obj`; // Fallback to expected name
    }

    /**
     * Load single terrain from assets directory
     * Automatically detects the .obj file name in the terrain directory
     */
    async loadTerrain() {
        try {
            console.log(`Loading terrain: ${this.terrainName}`);
            
            // Find the .obj file in the terrain directory
            const objFileName = await this.findObjFile(this.terrainName);
            if (!objFileName) {
                throw new Error(`No .obj file found in ${this.terrainName} directory`);
            }
            
            console.log(`Found .obj file: ${objFileName}`);
            
            // Use ImportMeshAsync for modern promise-based loading
            const result = await BABYLON.SceneLoader.ImportMeshAsync(
                "", // Import all meshes
                `./assets/${this.terrainName}/`, // Terrain directory
                objFileName, // Auto-detected OBJ file
                this.scene
            );
            
            if (result.meshes && result.meshes.length > 0) {
                console.log(`Successfully loaded ${result.meshes.length} mesh(es) for ${this.terrainName}`);
                
                // Use the first mesh as our main terrain, or create a parent if multiple meshes
                if (result.meshes.length === 1) {
                    this.farmMesh = result.meshes[0];
                } else {
                    // Create a parent mesh to contain all terrain meshes
                    this.farmMesh = new BABYLON.Mesh("terrainParent", this.scene);
                    result.meshes.forEach(mesh => {
                        mesh.parent = this.farmMesh;
                    });
                }
                
                // Calculate terrain bounds for collision detection
                const boundingBox = this.farmMesh.getBoundingInfo().boundingBox;
                this.terrainMinY = boundingBox.minimum.y - 1; // Add 1 unit buffer below terrain
                console.log(`Terrain minimum Y set to: ${this.terrainMinY}`);
                
                // Process all meshes
                result.meshes.forEach((mesh, index) => {
                    // Enable collisions for each mesh
                    mesh.checkCollisions = true;
                    
                    // Performance optimizations (backface culling disabled to prevent artifacts)
                    if (mesh.material) {
                        mesh.material.backFaceCulling = false;
                    }
                    
                    console.log(`Processed terrain mesh ${index}: ${mesh.name}`);
                });
                
                console.log("Terrain loading complete");
                
            } else {
                throw new Error(`No meshes found in ${this.terrainName}.obj`);
            }
            
        } catch (error) {
            console.error(`Failed to load terrain ${this.terrainName}:`, error);
            console.warn("Creating placeholder terrain instead");
            this.createPlaceholderTerrain();
        }
    }

    /**
     * Create placeholder terrain when real assets can't be loaded
     */
    createPlaceholderTerrain() {
        console.log("Creating placeholder terrain...");
        
        // Create a simple terrain-like mesh
        this.farmMesh = BABYLON.MeshBuilder.CreateGround(
            "placeholderTerrain",
            { width: 30, height: 30, subdivisions: 8 },
            this.scene
        );
        
        // Add some height variation to make it more interesting
        const positions = this.farmMesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        for (let i = 1; i < positions.length; i += 3) {
            positions[i] = Math.random() * 3; // Random height between 0 and 3
        }
        this.farmMesh.setVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
        this.farmMesh.createNormals(true);
        
        // Create material
        const material = new BABYLON.StandardMaterial("placeholderMaterial", this.scene);
        material.diffuseColor = new BABYLON.Color3(0.4, 0.7, 0.3); // Green terrain color
        material.specularColor = new BABYLON.Color3(0, 0, 0); // No shine
        this.farmMesh.material = material;
        
        // Enable collisions
        this.farmMesh.checkCollisions = true;
        
        console.log("Created placeholder terrain");
    }
    
    /**
     * Position the camera to view the loaded terrain
     * Uses the bounding box of the terrain mesh to determine optimal camera position
     */
    positionCameraForTerrain() {
        if (!this.farmMesh) return;
        
        // Get terrain bounding box
        const boundingBox = this.farmMesh.getBoundingInfo().boundingBox;
        const min = boundingBox.minimum;
        const max = boundingBox.maximum;
        
        // Calculate center and size of terrain
        const center = new BABYLON.Vector3(
            (min.x + max.x) / 2,
            (min.y + max.y) / 2,
            (min.z + max.z) / 2
        );
        const size = new BABYLON.Vector3(
            max.x - min.x,
            max.y - min.y,
            max.z - min.z
        );
        
        // Position camera based on type
        if (this.camera.setTarget) {
            // ArcRotate camera - position for overview
            this.camera.setTarget(center);
            this.camera.radius = Math.max(size.x, size.z) * 1.5;
            console.log(`ArcRotate camera positioned at radius: ${this.camera.radius}`);
        } else {
            // First-person camera - position at good starting location
            // Use center of terrain and add player height
            this.camera.position = new BABYLON.Vector3(
                center.x,
                Math.max(center.y + this.playerHeight, max.y + this.playerHeight),
                center.z + Math.max(size.z * 0.4, 10) // Start outside the terrain
            );
            console.log(`First-person camera positioned at: ${this.camera.position.toString()}`);
        }
        
        console.log(`Terrain bounds - Center: ${center.toString()}, Size: ${size.toString()}`);
    }

    setupFirstPersonCamera() {
        // Dispose of the ArcRotate camera
        this.camera.dispose();
        
        // Create UniversalCamera for first-person view
        // Position will be set after terrain bounds calculation
        this.camera = new BABYLON.UniversalCamera(
            "firstPersonCamera",
            new BABYLON.Vector3(0, this.playerHeight, 10),
            this.scene
        );
        
        // Configure camera for first-person controls
        this.camera.setTarget(BABYLON.Vector3.Zero());
        this.camera.minZ = 0.1;
        this.camera.speed = this.moveSpeed;
        this.camera.angularSensibility = 2000;
        
        // Enable collisions for camera (acts as player)
        this.camera.checkCollisions = true;
        
        // Apply gravity if physics is available, otherwise use basic gravity simulation
        try {
            this.camera.applyGravity = true;
        } catch (error) {
            console.warn("Gravity application failed, using manual gravity:", error.message);
            this.camera.applyGravity = false;
        }
        
        this.camera.ellipsoid = new BABYLON.Vector3(0.5, this.playerHeight / 2, 0.5);
        this.camera.ellipsoidOffset = new BABYLON.Vector3(0, this.playerHeight / 2, 0);
        
        // We'll handle camera controls manually with WASD + mouse
        // No need to detach controls since we're using manual movement
        
        console.log("First-person camera setup complete");
    }

    setupControls() {
        // Keyboard input handling
        document.addEventListener("keydown", (event) => {
            this.keys[event.key.toLowerCase()] = true;
        });
        
        document.addEventListener("keyup", (event) => {
            this.keys[event.key.toLowerCase()] = false;
        });
        
        // Mouse pointer lock for first-person view
        this.canvas.addEventListener("click", () => {
            this.canvas.requestPointerLock();
        });
        
        // Pointer lock change events
        document.addEventListener("pointerlockchange", () => {
            this.isPointerLocked = document.pointerLockElement === this.canvas;
            console.log(`Pointer lock: ${this.isPointerLocked}`);
        });
        
        // Mouse movement for looking around
        document.addEventListener("mousemove", (event) => {
            if (this.isPointerLocked && this.camera) {
                // Horizontal rotation (Y-axis)
                this.camera.rotation.y += event.movementX * this.mouseSensitivity;
                
                // Vertical rotation (X-axis) with limits
                this.camera.rotation.x += event.movementY * this.mouseSensitivity;
                this.camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.camera.rotation.x));
            }
        });
        
        console.log("Input controls setup complete");
    }

    updateMovement() {
        if (!this.camera) return;
        
        // Get camera forward and right vectors
        const forward = this.camera.getDirection(BABYLON.Vector3.Forward());
        const right = this.camera.getDirection(BABYLON.Vector3.Right());
        
        // Movement vector
        let movement = BABYLON.Vector3.Zero();
        let moved = false;
        
        // WASD movement (horizontal)
        if (this.keys['w']) {
            movement = movement.add(forward.scale(this.moveSpeed));
            moved = true;
        }
        if (this.keys['s']) {
            movement = movement.add(forward.scale(-this.moveSpeed));
            moved = true;
        }
        if (this.keys['a']) {
            movement = movement.add(right.scale(-this.moveSpeed));
            moved = true;
        }
        if (this.keys['d']) {
            movement = movement.add(right.scale(this.moveSpeed));
            moved = true;
        }
        
        // Q/E vertical movement
        let verticalMovement = 0;
        if (this.keys['q']) {
            verticalMovement -= this.verticalSpeed; // Move down
            moved = true;
        }
        if (this.keys['e']) {
            verticalMovement += this.verticalSpeed; // Move up
            moved = true;
        }
        
        // Apply horizontal movement (don't interfere with gravity for WASD)
        if (movement.length() > 0) {
            movement.y = 0; // Don't interfere with gravity
            this.camera.position = this.camera.position.add(movement);
        }
        
        // Apply vertical movement with bottom collision detection
        if (verticalMovement !== 0) {
            const newY = this.camera.position.y + verticalMovement;
            
            // Prevent going below terrain minimum
            if (newY >= this.terrainMinY + this.playerHeight) {
                this.camera.position.y = newY;
            } else {
                // Keep camera at minimum allowed height
                this.camera.position.y = this.terrainMinY + this.playerHeight;
            }
        }
        
        // (Camera position logging disabled now that starting point is set)
        if (false && moved) {
            console.log(`Camera Position: X=${this.camera.position.x.toFixed(2)}, Y=${this.camera.position.y.toFixed(2)}, Z=${this.camera.position.z.toFixed(2)}`);
        }
    }

    startRenderLoop() {
        // Main render loop
        this.engine.runRenderLoop(() => {
            // Update movement
            this.updateMovement();
            
            // Render scene
            this.scene.render();
        });
        
        // Handle browser resize
        window.addEventListener("resize", () => {
            this.engine.resize();
        });
        
        console.log("Render loop started");
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById("loadingScreen");
        if (loadingScreen) {
            loadingScreen.style.display = "none";
        }
    }

    showError(message) {
        const loadingScreen = document.getElementById("loadingScreen");
        if (loadingScreen) {
            loadingScreen.innerHTML = `<div style="color: red;">Error: ${message}</div>`;
        }
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    new FarmViewer();
});