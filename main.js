import gsap from "gsap";
import * as THREE from "three";
import { XRButton } from "three/examples/jsm/Addons.js";

let scene, camera, renderer, controls;
let trees = [];
let data;
let currentData;
// let currentCountry;

// VR state management (independent of DOM)
let currentYear = 2000; // Default starting year
let minYear = 2000; // Minimum year
let maxYear = 2020; // Maximum year
let yearStep = 5; // Year increment/decrement step
let currentCountryIndex = 0; // Current country index

// let sceneContainer;
let controller1, controller2;
let prevButtonAState = false;
let prevButtonBState = false;
let joystickThreshold = 0.5; // Threshold for joystick movement detection
let lastJoystickTime = 0; // To prevent too frequent year changes
let joystickCooldown = 500; // Cooldown in milliseconds between joystick actions

let sceneContainer;

// Add a debug counter to track button presses
let buttonBPressCount = 0;
let lastButtonDebugTime = 0;
let buttonDebugInterval = 2000; // Log button state every 2 seconds

function setupControllers() {
  controller1 = renderer.xr.getController(0);
  controller2 = renderer.xr.getController(1);

  scene.add(controller1);
  scene.add(controller2);

  // Remove the selectstart event listeners as we'll check for specific buttons in the animation loop
  controller1.addEventListener("selectstart", () => {
    console.log("Controller 1 button pressed");
  });

  controller2.addEventListener("selectstart", () => {
    console.log("Controller 2 button pressed");
  });
}

function changeCountry() {
  console.log("=== CHANGE COUNTRY FUNCTION CALLED ===");

  if (!data || !Array.isArray(data) || data.length === 0) {
    console.error("Data is not available or empty!");
    return;
  }

  // Update our internal country index
  currentCountryIndex = (currentCountryIndex + 1) % data.length;
  console.log("New country index:", currentCountryIndex);

  // If we're not in VR mode, also update the select element
  const select = document.getElementById("countrySelect");
  if (select) {
    select.selectedIndex = currentCountryIndex;
  }

  // Clear existing trees
  console.log("Clearing existing trees, count:", trees.length);
  while (trees.length > 0) {
    const tree = trees.pop();
    sceneContainer.remove(tree);
  }

  // Update currentData with the new country's data
  currentData = data[currentCountryIndex];

  if (!currentData) {
    console.error(
      "Could not find country data for index:",
      currentCountryIndex
    );
    return;
  }

  console.log("Changed to country:", currentData.country);
  console.log("Current data:", currentData);

  // Reinitialize trees based on the new country's `basic` value
  console.log("Initializing trees with basic value:", currentData.basic);
  initializeTrees(currentData.basic);

  // Update visualization for the current period
  const period = getCurrentPeriod();
  console.log("Updating visualization for period:", period);
  updateVisualization(period);

  console.log("=== COUNTRY CHANGE COMPLETED ===");
}

// Function to change year by a specific amount (positive or negative)
function changeYearBy(amount) {
  console.log("=== CHANGE YEAR FUNCTION CALLED ===");
  console.log("Current year:", currentYear, "Change amount:", amount);

  // Calculate new year value, ensuring it stays within bounds
  let newValue = currentYear + amount;

  // Ensure the value stays within the valid range
  if (newValue > maxYear) {
    newValue = maxYear;
  } else if (newValue < minYear) {
    newValue = minYear;
  }

  // Update our internal year state
  currentYear = newValue;
  console.log("New year:", currentYear);

  // If we're not in VR mode, also update the slider
  const slider = document.getElementById("yearSlider");
  if (slider) {
    slider.value = currentYear;
  }

  // Update visualization for the new period
  const period = getCurrentPeriod();
  console.log("Updating visualization for period:", period);
  updateVisualization(period);

  console.log("=== YEAR CHANGE COMPLETED ===");
}

function changeYear() {
  changeYearBy(yearStep);
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
  try {
    const response = await fetch("test_data.json");
    data = await response.json(); // Assign to the global data variable

    // Set currentData to the first country's data
    if (data && data.length > 0) {
      currentData = data[0];
      console.log("Data loaded successfully:", data);
      console.log("Initial country data:", currentData);

      // Initialize min/max years based on data if available
      if (data[0] && data[0].years) {
        minYear = data[0].years.min || minYear;
        maxYear = data[0].years.max || maxYear;
        currentYear = minYear;
      }
    }

    setupUI(data);

    // Initialize trees for the first country
    if (currentData) {
      initializeTrees(currentData.basic);
      updateVisualization(getCurrentPeriod());
    }
  } catch (error) {
    console.error("Error loading data:", error);
  }
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

  // Check if in immersive XR mode
  if (renderer.xr && renderer.xr.isPresenting) {
    console.log(
      "Immersive mode detected: applying immediate visualization update."
    );
    // Apply gains immediately: create new trees with full scale
    for (let i = 0; i < gain; i++) {
      const tree = createTree();
      tree.position.set(Math.random() * 20 - 10, 0, Math.random() * 20 - 10);
      tree.scale.set(1, 1, 1); // full scale immediately
      sceneContainer.add(tree);
      trees.push(tree);
    }
    // Remove losses immediately: remove the last 'loss' trees if available
    for (let i = 0; i < loss && trees.length > 0; i++) {
      const tree = trees.pop();
      sceneContainer.remove(tree);
    }
  } else {
    // Non-immersive mode: animate growth
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
}

// 6. UI Controls
function setupUI(data) {
  const select = document.getElementById("countrySelect");
  const slider = document.getElementById("yearSlider");

  if (!select || !slider) {
    console.warn("UI elements not found, possibly in VR mode");
    return;
  }

  // Set slider min/max based on our internal state
  slider.min = minYear;
  slider.max = maxYear;
  slider.value = currentYear;

  // Populate country dropdown
  data.forEach((country) => {
    const option = document.createElement("option");
    option.value = country.iso;
    option.textContent = country.country;
    select.appendChild(option);
  });

  // Event listeners
  select.addEventListener("change", () => {
    currentCountryIndex = select.selectedIndex;
    currentData = data[currentCountryIndex];

    // Clear existing trees
    while (trees.length > 0) {
      const tree = trees.pop();
      sceneContainer.remove(tree);
    }

    initializeTrees(currentData.basic); // Initialize trees using `basic`
    updateVisualization(getCurrentPeriod());
  });

  slider.addEventListener("input", () => {
    currentYear = parseInt(slider.value);
    updateVisualization(getCurrentPeriod());
  });
}

function getCurrentPeriod() {
  // Use our internal year state instead of reading from DOM
  return `${currentYear}-${currentYear + yearStep}`;
}

// 7. WebXR Setup
function enableXR() {
  renderer.xr.enabled = true;

  // Set up the animation loop to handle rendering and joystick input
  renderer.setAnimationLoop(function () {
    // Check for joystick movement and button presses on controllers
    if (renderer.xr.isPresenting) {
      const session = renderer.xr.getSession();

      if (session) {
        // Periodically log controller state for debugging
        const currentTime = Date.now();
        const shouldLogDebug =
          currentTime - lastButtonDebugTime > buttonDebugInterval;

        if (shouldLogDebug) {
          lastButtonDebugTime = currentTime;
          console.log("=== CONTROLLER DEBUG INFO ===");
          console.log(
            "Session active, input sources count:",
            session.inputSources.length
          );
        }

        for (const source of session.inputSources) {
          if (!source) {
            if (shouldLogDebug)
              console.log("Input source is null or undefined");
            continue;
          }

          if (shouldLogDebug) {
            console.log("Input source handedness:", source.handedness);
            console.log("Has gamepad:", !!source.gamepad);
          }

          if (source.gamepad) {
            const gamepad = source.gamepad;
            const handedness = source.handedness; // 'left' or 'right'

            if (shouldLogDebug && handedness === "right") {
              console.log(
                "Right controller buttons:",
                gamepad.buttons ? gamepad.buttons.length : 0
              );
              if (gamepad.buttons && gamepad.buttons.length > 1) {
                console.log(
                  "Button B state:",
                  gamepad.buttons[1].pressed ? "PRESSED" : "not pressed"
                );
                console.log("Button B value:", gamepad.buttons[1].value);
                console.log("prevButtonBState:", prevButtonBState);
              }
            }

            // Check for button B press on Meta Quest controllers
            // Button 1 is typically button B on Meta Quest controllers
            if (gamepad.buttons && gamepad.buttons.length > 1) {
              const buttonB = gamepad.buttons[1];

              // Check if button B is pressed (and wasn't pressed in the previous frame)
              if (buttonB.pressed) {
                if (handedness === "right") {
                  if (!prevButtonBState) {
                    buttonBPressCount++;
                    console.log(
                      `Button B pressed on right controller (press #${buttonBPressCount})`
                    );
                    console.log("Button B value:", buttonB.value);
                    console.log("Button B touched:", buttonB.touched);

                    // Call changeCountry and track if it was successful
                    try {
                      changeCountry();
                      console.log("changeCountry() called successfully");
                    } catch (error) {
                      console.error("Error in changeCountry():", error);
                    }

                    prevButtonBState = true;
                  } else if (shouldLogDebug) {
                    console.log("Button B still pressed, ignoring (debounce)");
                  }
                }
              } else {
                if (
                  handedness === "right" &&
                  prevButtonBState &&
                  shouldLogDebug
                ) {
                  console.log("Button B released on right controller");
                  prevButtonBState = false;
                }
              }
            }

            // Check joystick movement on right controller
            if (handedness === "right") {
              // Check joystick/thumbstick movement; use axis[2] if available, otherwise fallback to axis[0]
              if (gamepad.axes && gamepad.axes.length >= 1) {
                const horizontalAxis =
                  gamepad.axes.length >= 3 ? gamepad.axes[2] : gamepad.axes[0];
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
                    changeYearBy(yearStep);
                  } else if (horizontalAxis < -joystickThreshold) {
                    // Move backward in time (left)
                    console.log("Joystick moved left");
                    changeYearBy(-yearStep);
                  }
                }
              }
            }
          }
        }

        if (shouldLogDebug) {
          console.log("=== END CONTROLLER DEBUG INFO ===");
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
