import gsap from "gsap";
import * as THREE from "three";
import { XRButton } from "three/examples/jsm/Addons.js";

let scene, camera, renderer, controls;
let trees = [];
let data;
let currentData;
// let currentCountry;

// let sceneContainer;
let controller1, controller2;
let prevButtonAState = false;
let prevButtonBState = false;
let joystickThreshold = 0.5; // Threshold for joystick movement detection
let lastJoystickTime = 0; // To prevent too frequent year changes
let joystickCooldown = 500; // Cooldown in milliseconds between joystick actions

let sceneContainer;

function setupControllers() {
  controller1 = renderer.xr.getController(0);
  controller2 = renderer.xr.getController(1);

  scene.add(controller1);
  scene.add(controller2);

  // Add button press event listeners for both controllers to change country
  controller1.addEventListener("selectstart", () => {
    console.log("Controller 1 button pressed");
    changeCountry();
  });

  controller2.addEventListener("selectstart", () => {
    console.log("Controller 2 button pressed");
    changeCountry();
  });
}

function changeCountry() {
  const select = document.getElementById("countrySelect");
  const options = select.options;
  const currentIndex = select.selectedIndex;

  // Move to the next country, or loop back to the first
  const nextIndex = (currentIndex + 1) % options.length;
  select.selectedIndex = nextIndex;

  // Update currentData with the new country's data
  currentData = data.find((d) => d.iso === select.value);

  // Reinitialize trees based on the new country's `basic` value
  initializeTrees(currentData.basic);

  // Update visualization for the current period
  updateVisualization(getCurrentPeriod());
}

// Function to change year by a specific amount (positive or negative)
function changeYearBy(amount) {
  const slider = document.getElementById("yearSlider");
  const currentValue = parseInt(slider.value);
  const minValue = parseInt(slider.min);
  const maxValue = parseInt(slider.max);

  // Calculate new year value, ensuring it stays within bounds
  let newValue = currentValue + amount;

  // Ensure the value stays within the slider's range
  if (newValue > maxValue) {
    newValue = maxValue;
  } else if (newValue < minValue) {
    newValue = minValue;
  }

  // Update slider value
  slider.value = newValue;

  // Update visualization for the new period
  updateVisualization(getCurrentPeriod());
}

function changeYear() {
  changeYearBy(5);
}

// 1. Initialize Scene here
function init() {
  // Scene setup
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);

  document.body.appendChild(renderer.domElement);
  document.body.appendChild(
    XRButton.createButton(
      renderer
      // sessionInit
    )
  );

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
  const response = await fetch("test_data.json");
  const data = await response.json();
  setupUI(data);
}

// 3. Create Tree Model
function createTree() {
  const tree = new THREE.Group();

  // Trunk
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 1),
    new THREE.MeshPhongMaterial({ color: 0x8b4513 })
  );

  // Leaves
  const leaves = new THREE.Mesh(
    new THREE.SphereGeometry(0.5),
    new THREE.MeshPhongMaterial({ color: 0x228b22 })
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
    tree.position.set(Math.random() * 20 - 10, 0, Math.random() * 20 - 10);
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
    tree.position.set(Math.random() * 20 - 10, 0, Math.random() * 20 - 10);
    tree.scale.set(0, 0, 0); // Start small
    sceneContainer.add(tree);
    trees.push(tree);

    // Animate growth
    gsap.to(tree.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 1,
      delay: i * 0.1, // Stagger animations
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
        onComplete: () => sceneContainer.remove(tree),
      });
    }
  });
}

// 6. UI Controls
function setupUI(data) {
  const select = document.getElementById("countrySelect");
  const slider = document.getElementById("yearSlider");

  // Populate country dropdown
  data.forEach((country) => {
    const option = document.createElement("option");
    option.value = country.iso;
    option.textContent = country.country;
    select.appendChild(option);
  });

  // Event listeners
  select.addEventListener("change", () => {
    currentData = data.find((d) => d.iso === select.value);
    initializeTrees(currentData.basic); // Initialize trees using `basic`
    updateVisualization(getCurrentPeriod());
  });

  slider.addEventListener("input", () => {
    updateVisualization(getCurrentPeriod());
  });
}

function getCurrentPeriod() {
  const year = parseInt(document.getElementById("yearSlider").value);
  return `${year}-${year + 5}`;
}

// 7. WebXR Setup
function enableXR() {
  renderer.xr.enabled = true;

  // Set up the animation loop to handle rendering and joystick input
  renderer.setAnimationLoop(function () {
    // Check for joystick movement on right controller (controller2)
    if (renderer.xr.isPresenting) {
      const session = renderer.xr.getSession();

      if (session) {
        for (const source of session.inputSources) {
          if (source && source.gamepad && source.handedness === "right") {
            const gamepad = source.gamepad;

            // Check joystick/thumbstick movement (axes[2] is typically horizontal movement)
            if (gamepad.axes && gamepad.axes.length >= 3) {
              const horizontalAxis = gamepad.axes[2];

              // Only process joystick movement if it exceeds threshold and cooldown has passed
              const currentTime = Date.now();
              if (
                Math.abs(horizontalAxis) > joystickThreshold &&
                currentTime - lastJoystickTime > joystickCooldown
              ) {
                lastJoystickTime = currentTime;

                if (horizontalAxis > joystickThreshold) {
                  // Move forward in time (right)
                  console.log("Joystick moved right");
                  changeYearBy(5);
                } else if (horizontalAxis < -joystickThreshold) {
                  // Move backward in time (left)
                  console.log("Joystick moved left");
                  changeYearBy(-5);
                }
              }
            }
          }
        }
      }
    }

    renderer.render(scene, camera);
  });

  console.log("WebXR session started");
}

// Initialize the app
init();
// Enable WebXR when ready (requires user gesture)
document.body.addEventListener("click", enableXR);
