import * as THREE from 'three';
import { XRButton } from 'three/examples/jsm/Addons.js';
import gsap from 'gsap';

let scene, camera, renderer, controls;
let trees = [];
let data;
let currentData;
// let currentCountry;

// let sceneContainer;
let controller1, controller2;
let prevButtonAState = false;
let prevButtonBState = false;

let sceneContainer;

function setupControllers() {
    controller1 = renderer.xr.getController(0);
    controller2 = renderer.xr.getController(1);

    // controller1.addEventListener('selectstart', onSelectStart);
    // controller1.addEventListener('selectend', onSelectEnd);
    // controller2.addEventListener('selectstart', onSelectStart);
    // controller2.addEventListener('selectend', onSelectEnd);

    scene.add(controller1);
    scene.add(controller2);

    controller1.addEventListener('selectstart', () => {
        console.log("Controller 1 selectstart");
        changeCountry();
    });

    // Listen for button events on Controller 2 (e.g., trigger for changing year)
    controller2.addEventListener('selectstart', () => {
        console.log("Controller 2 selectstart");
        changeYear();
    });
}

function changeCountry() {
    const select = document.getElementById('countrySelect');
    const options = select.options;
    const currentIndex = select.selectedIndex;

    // Move to the next country, or loop back to the first
    const nextIndex = (currentIndex + 1) % options.length;
    select.selectedIndex = nextIndex;

    // Update currentData with the new country's data
    currentData = data.find(d => d.iso === select.value);

    // Reinitialize trees based on the new country's `basic` value
    initializeTrees(currentData.basic);

    // Update visualization for the current period
    updateVisualization(getCurrentPeriod());
}


function changeYear() {
    const slider = document.getElementById('yearSlider');
    const currentValue = parseInt(slider.value);
    const maxValue = parseInt(slider.max);

    // Increment the year, or loop back to the minimum
    const nextValue = (currentValue + 5) > maxValue ? parseInt(slider.min) : currentValue + 5;
    slider.value = nextValue;

    // Update visualization for the new period
    updateVisualization(getCurrentPeriod());
}

// 1. Initialize Scene here
function init() {
    // Scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    document.body.appendChild(renderer.domElement);
    document.body.appendChild( XRButton.createButton(
        renderer
        // sessionInit
    ) );
    

    // Lighting
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5);
    scene.add(light);

    // Camera position
    camera.position.set(0, 10, 20);
    camera.lookAt(0, 0, 0);

    sceneContainer = new THREE.Group();
    scene.add(sceneContainer);

    // Load data
    loadData();
    setupControllers();
}

// 2. Load Data
async function loadData() {
    const response = await fetch('test_data.json');
    const data = await response.json();
    setupUI(data);
}

// 3. Create Tree Model
function createTree() {
    const tree = new THREE.Group();

    // Trunk
    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 1),
        new THREE.MeshPhongMaterial({ color: 0x8B4513 })
    );

    // Leaves
    const leaves = new THREE.Mesh(
        new THREE.SphereGeometry(0.5),
        new THREE.MeshPhongMaterial({ color: 0x228B22 })
    );
    leaves.position.y = 0.8;

    tree.add(trunk, leaves);
    return tree;
}

// 4. Initialize Trees Using `basic`
function initializeTrees(basic) {
    // Scale: 1 tree = 1000 ha
    const initialTrees = Math.floor(basic / 1000);
    for (let i = 0; i < initialTrees; i++) {
        const tree = createTree();
        tree.position.set(
            Math.random() * 20 - 10,
            0,
            Math.random() * 20 - 10
        );
        sceneContainer.add(tree);
        trees.push(tree);
    }
}

// 5. Update Visualization
function updateVisualization(period) {
    // Calculate tree counts (example: 1 tree = 1000 ha)
    const gain = currentData[`${period} umd_tree_cover_gain__ha`] / 1000;
    const loss = currentData[`${period}_cover_loss`] / 1000;

    // Animate growth first
    for (let i = 0; i < gain; i++) {
        const tree = createTree();
        tree.position.set(
            Math.random() * 20 - 10,
            0,
            Math.random() * 20 - 10
        );
        tree.scale.set(0, 0, 0); // Start small
        sceneContainer.add(tree);
        trees.push(tree);

        // Animate growth
        gsap.to(tree.scale, {
            x: 1,
            y: 1,
            z: 1,
            duration: 1,
            delay: i * 0.1 // Stagger animations
        });
    }

    // Animate loss after growth
    gsap.delayedCall(gain * 0.1 + 1, () => {
        for (let i = 0; i < loss && trees.length > 0; i++) {
            const tree = trees.pop();
            gsap.to(tree.scale, {
                x: 0,
                y: 0,
                z: 0,
                duration: 1,
                onComplete: () => sceneContainer.remove(tree)
            });
        }
    });
}

// 6. UI Controls
function setupUI(data) {
    const select = document.getElementById('countrySelect');
    const slider = document.getElementById('yearSlider');

    // Populate country dropdown
    data.forEach(country => {
        const option = document.createElement('option');
        option.value = country.iso;
        option.textContent = country.country;
        select.appendChild(option);
    });

    // Event listeners
    select.addEventListener('change', () => {
        currentData = data.find(d => d.iso === select.value);
        initializeTrees(currentData.basic); // Initialize trees using `basic`
        updateVisualization(getCurrentPeriod());
    });

    slider.addEventListener('input', () => {
        updateVisualization(getCurrentPeriod());
    });
}

function getCurrentPeriod() {
    const year = parseInt(document.getElementById('yearSlider').value);
    return `${year}-${year + 5}`;
}

// 7. WebXR Setup
function enableXR() {
    renderer.xr.enabled = true;
    renderer.setAnimationLoop(() => {
        renderer.render(scene, camera);
    });
    // console.log("WebXR session started");
}


// Initialize the app
init();
// Enable WebXR when ready (requires user gesture)
document.body.addEventListener('click', enableXR);