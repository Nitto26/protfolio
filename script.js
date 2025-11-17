// Wait for the whole page to load
window.addEventListener('DOMContentLoaded', init);

// Global variables
let spotLight;
let isRevealing = false;

// Avatar parts
let myAvatar = null;
let neckBone = null;
let spineBone = null;

// Mouse Tracking Variables
let mouseX = 0;
let mouseY = 0;
let targetNeckX = 0;
let targetNeckY = 0;

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

    // --- Capture Mouse Movement ---
    document.addEventListener('mousemove', (event) => {
        const windowHalfX = window.innerWidth / 2;
        const windowHalfY = window.innerHeight / 2;
        mouseX = (event.clientX - windowHalfX) / windowHalfX;
        mouseY = (event.clientY - windowHalfY) / windowHalfY;
    });

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
        myAvatar = object;

        // Facing Front
        object.rotation.y = 1.7; 

        // Arms Down
        const armAngle = 1.3; 

        object.traverse((node) => {
            if (node.isBone) {
                const name = node.name.toLowerCase();

                if (name.includes('neck') || name.includes('head')) {
                    neckBone = node;
                }
                if (name.includes('spine')) {
                    spineBone = node;
                }
                
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

        // Auto-center
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
        object.position.x += 1.5; 

        scene.add(object);
        startSequence();

    }, undefined, (error) => {
        console.error('An error happened loading the GLB:', error);
    });

    // --- 5. Animation Loop ---
    function animate() {
        requestAnimationFrame(animate);

        if (isRevealing && spotLight.intensity < 1.5) {
            spotLight.intensity += 0.01; 
        }

        if (myAvatar) {
            const time = Date.now() * 0.001; 

            // Breathing
            myAvatar.position.y = -0.5 + (Math.sin(time * 2) * 0.005);
            
            // Spine Sway
            if (spineBone) {
                spineBone.rotation.z = Math.sin(time * 1) * 0.02;
            }

            // --- MOUSE TRACKING (FIXED UP/DOWN) ---
            if (neckBone) {
                
                targetNeckY = mouseX * 0.6;   
                
                // 🛠️ FIX IS HERE: Changed -mouseY to +mouseY
                targetNeckX = mouseY * 0.4;  

                neckBone.rotation.y = THREE.MathUtils.lerp(neckBone.rotation.y, targetNeckY, 0.1);
                neckBone.rotation.x = THREE.MathUtils.lerp(neckBone.rotation.x, targetNeckX, 0.1);
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