// Babylon.js Farm Terrain Viewer
// Main application file with scene setup, mesh loading, and first-person controls

class FarmViewer {
    constructor() {
        this.canvas = null;
        this.engine = null;
        this.scene = null;
        this.camera = null;
        this.farmMesh = null;
        this.groundPlane = null;
        this.keys = {};
        this.isPointerLocked = false;
        
        // Movement settings
        this.moveSpeed = 0.3;
        this.mouseSensitivity = 0.002;
        this.gravity = -0.02;
        this.jumpHeight = 0.5;
        this.playerHeight = 1.8;
        
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
            
            // Load farm mesh
            await this.loadFarmMesh();
            
            // Switch to first-person camera
            this.setupFirstPersonCamera();
            
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
        
        // Enable physics (using Cannon.js physics engine if available, fallback to basic collision)
        this.scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), new BABYLON.CannonJSPlugin());
        
        // Enable collisions
        this.scene.collisionsEnabled = true;
        
        // Performance optimizations
        this.scene.skipPointerMovePicking = true;
        this.scene.autoClear = false;
        this.scene.autoClearDepthAndStencil = false;
        
        console.log("Scene created with physics and collision detection");
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
        
        // Attach camera controls to canvas
        this.camera.attachToCanvas(this.canvas, true);
        
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
        groundMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.6, 0.2); // Green
        groundMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        this.groundPlane.material = groundMaterial;
        
        // Enable collisions for ground plane
        this.groundPlane.checkCollisions = true;
        
        console.log("Ground plane created as safety net");
    }

    async loadFarmMesh() {
        return new Promise((resolve, reject) => {
            // Import OBJ mesh with MTL materials
            BABYLON.SceneLoader.ImportMesh(
                "",
                "./assets/",
                "farm.obj",
                this.scene,
                (meshes, particleSystems, skeletons) => {
                    if (meshes.length > 0) {
                        console.log(`Loaded ${meshes.length} mesh(es) from farm.obj`);
                        
                        // Store reference to the main farm mesh
                        this.farmMesh = meshes[0];
                        
                        // Process all loaded meshes
                        meshes.forEach((mesh, index) => {
                            // Enable collisions for each mesh
                            mesh.checkCollisions = true;
                            
                            // Performance optimizations
                            if (mesh.material) {
                                mesh.material.backFaceCulling = true;
                            }
                            
                            // Freeze world matrix for static meshes (performance)
                            mesh.freezeWorldMatrix();
                            
                            console.log(`Processed mesh ${index}: ${mesh.name}`);
                        });
                        
                        // Position camera to view the farm
                        if (this.farmMesh.getBoundingInfo) {
                            const boundingBox = this.farmMesh.getBoundingInfo().boundingBox;
                            const center = boundingBox.center;
                            const size = boundingBox.maximum.subtract(boundingBox.minimum);
                            
                            // Position ArcRotate camera to view the entire farm
                            this.camera.setTarget(center);
                            this.camera.radius = Math.max(size.x, size.z) * 1.5;
                            
                            console.log(`Farm mesh bounds - Center: ${center.toString()}, Size: ${size.toString()}`);
                        }
                        
                        resolve();
                    } else {
                        reject(new Error("No meshes found in farm.obj"));
                    }
                },
                (progress) => {
                    // Loading progress callback
                    console.log(`Loading progress: ${progress.loaded}/${progress.total}`);
                },
                (error) => {
                    console.warn("Could not load farm.obj, creating placeholder mesh instead");
                    this.createPlaceholderFarm();
                    resolve();
                }
            );
        });
    }

    createPlaceholderFarm() {
        // Create a simple placeholder farm mesh if OBJ loading fails
        const box = BABYLON.MeshBuilder.CreateBox("placeholderFarm", { size: 10 }, this.scene);
        box.position.y = 5;
        
        // Create material
        const material = new BABYLON.StandardMaterial("placeholderMaterial", this.scene);
        material.diffuseColor = new BABYLON.Color3(0.8, 0.6, 0.4);
        box.material = material;
        
        // Enable collisions
        box.checkCollisions = true;
        
        this.farmMesh = box;
        
        console.log("Created placeholder farm mesh");
    }

    setupFirstPersonCamera() {
        // Dispose of the ArcRotate camera
        this.camera.dispose();
        
        // Create UniversalCamera for first-person view
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
        this.camera.applyGravity = true;
        this.camera.ellipsoid = new BABYLON.Vector3(0.5, this.playerHeight / 2, 0.5);
        this.camera.ellipsoidOffset = new BABYLON.Vector3(0, this.playerHeight / 2, 0);
        
        // Disable default camera controls (we'll handle them manually)
        this.camera.detachControls();
        
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
        
        // WASD movement
        if (this.keys['w']) {
            movement = movement.add(forward.scale(this.moveSpeed));
        }
        if (this.keys['s']) {
            movement = movement.add(forward.scale(-this.moveSpeed));
        }
        if (this.keys['a']) {
            movement = movement.add(right.scale(-this.moveSpeed));
        }
        if (this.keys['d']) {
            movement = movement.add(right.scale(this.moveSpeed));
        }
        
        // Apply movement (Y component handled by gravity/collisions)
        if (movement.length() > 0) {
            movement.y = 0; // Don't interfere with gravity
            this.camera.position = this.camera.position.add(movement);
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