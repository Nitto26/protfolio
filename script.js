// Wait for the whole page to load
window.addEventListener('DOMContentLoaded', init);

// Global variables
let spotLight;
let isRevealing = false;

// Variables to store the avatar's body parts
let myAvatar = null;
let neckBone = null;
let spineBone = null;

function init() {

    // --- 1. Basic Scene Setup ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); 
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 8; 
    camera.position.y = 0; 

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding; 
    document.body.appendChild(renderer.domElement);

    // --- 2. Lighting ---
    spotLight = new THREE.SpotLight(0xffffff, 1); 
    spotLight.position.set(0, 10, 5); 
    spotLight.angle = Math.PI / 6; 
    spotLight.penumbra = 0.2; 
    spotLight.target.position.set(0, 0, 0); 
    spotLight.intensity = 0; 
    
    scene.add(spotLight);
    scene.add(spotLight.target);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambientLight);

    // --- 3. Load the GLB Model ---
    const loader = new THREE.GLTFLoader();
    loader.setPath('models/');
    
    loader.load('man.glb', (gltf) => {
        
        const object = gltf.scene;
        myAvatar = object; // Save for animation

        // 🛠️ FIX 1: FACING FRONT
        object.rotation.y = 1.7; 

        // 🛠️ FIX 2: POSE ADJUSTMENT
        const armAngle = 1.3; 

        object.traverse((node) => {
            if (node.isBone) {
                const name = node.name.toLowerCase();
                
                // --- Save bones for "Alive" animation ---
                if (name.includes('neck') || name.includes('head')) {
                    neckBone = node;
                }
                if (name.includes('spine') || name.includes('hips')) {
                    spineBone = node;
                }
                // ----------------------------------------

                // Fix Arms
                if (name === 'rightarm') {
                    node.rotation.set(0, 0, 0); 
                    node.rotation.x = armAngle; 
                }
                if (name === 'leftarm') {
                    node.rotation.set(0, 0, 0);
                    node.rotation.x = armAngle; 
                }
            }
        });

        // --- Auto-center and Auto-scale ---
        const box = new THREE.Box3().setFromObject(object);
        const center = new THREE.Vector3();
        box.getCenter(center);
        const size = new THREE.Vector3();
        box.getSize(size);
        
        const modelHeight = size.y;
        const scaleFactor = 5.5 / modelHeight; 
        
        object.scale.set(scaleFactor, scaleFactor, scaleFactor);
        object.position.sub(center.multiplyScalar(scaleFactor));
        object.position.y -= 0.5;
        object.position.x += 1.5; // Move side for text

        scene.add(object);
        
        startSequence();

    }, undefined, (error) => {
        console.error('An error happened loading the GLB:', error);
    });

    // --- 5. Animation Loop ---
    function animate() {
        requestAnimationFrame(animate);

        // 1. Spotlight Fade In
        if (isRevealing && spotLight.intensity < 1.5) {
            spotLight.intensity += 0.01; 
        }

        // 2. "ALIVE" Animation (Breathing & Swaying)
        if (myAvatar) {
            // Get current time in seconds
            const time = Date.now() * 0.001; 

            // A. Breathing (Move up and down slightly)
            // Math.sin creates a wave that goes -1 to 1
            myAvatar.position.y = -0.5 + (Math.sin(time * 2) * 0.005);

            // B. Neck Sway (Look around slightly)
            if (neckBone) {
                // Rotate neck left/right very slowly
                neckBone.rotation.y = Math.sin(time * 0.5) * 0.1; 
                // Nod head up/down very slightly
                neckBone.rotation.x = Math.sin(time * 0.3) * 0.05; 
            }

            // C. Spine Sway (Subtle body balance)
            if (spineBone) {
                spineBone.rotation.z = Math.sin(time * 1) * 0.02;
            }
        }

        renderer.render(scene, camera);
    }

    animate(); 

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// --- 6. Sequence Logic ---
function startSequence() {
    const helloAudio = document.getElementById('hello-sound');
    const helloText = document.getElementById('hello-text');
    
    if(helloText) helloText.classList.add('visible');

    const playPromise = helloAudio.play();
    
    if (playPromise !== undefined) {
        playPromise.then(() => {
            // Audio playing
        }).catch(error => {
            console.warn("Audio blocked. Using timer.");
            setTimeout(revealMan, 2000);
        });
    }

    helloAudio.onended = () => {
        revealMan();
    };
}

function revealMan() {
    const helloText = document.getElementById('hello-text');
    const content = document.getElementById('content');

    if(helloText) helloText.classList.remove('visible');
    if(content) content.classList.add('visible');

    isRevealing = true; 
}