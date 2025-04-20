# AR/VR Global Deforestation & CO2 Visualization

An immersive AR/VR application that visualizes deforestation and CO2 emissions by country over time, enabling users to interactively explore environmental changes through a physical map interface and virtual interactions.

## 🌍 Project Overview

This project visualizes deforestation trends and CO2 emissions using 3D tree models in an immersive VR environment. Users can select countries and time periods (2000–2020) to see how forest areas and emissions have changed.

- Developed with [Three.js](https://threejs.org/) and WebXR.
- Data overlays triggered through controller input or UI.
- Visuals respond to real data: new trees for reforestation, tree removal for deforestation.
- Used in-class testing to explore learning outcomes.

## 🌐 Features

- ✅ WebXR support for immersive VR experiences
- ✨ Interactive data visualization of tree cover changes (gain/loss)
- 🌳 Dynamic 3D trees mapped to real-world data
- ⏱ Time slider (2000-2020) and country selector UI
- 🌍 Physical map trigger support (for AR)
- ⚖️ 2D/3D visual comparison and experimental feedback loop

## 📈 Data Source

All environmental data is sourced from:

> [Global Forest Watch](https://www.globalforestwatch.org)

Including:
- Tree cover gain/loss in hectares
- Country-wise data from 2000 to 2020

## ⚖️ Technologies Used

- **Three.js**: Core 3D rendering and scene management
- **WebXR**: Enables immersive VR experience
- **GSAP**: Animations for smooth tree growth/loss
- **HTML/CSS/JavaScript**: Interface and logic

## 🛠️ How to Run Locally

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/deforestation-vr-visualization.git
   cd deforestation-vr-visualization
   ```
2. Add your data file:
   - Place `test_data.json` (matching the format expected in `loadData()`) into the root folder.

3. Serve the project with a local server (for module support):
   ```bash
   npx http-server .
   ```
4. Open the project in a WebXR-compatible browser (e.g. Chrome) and click the canvas to enter VR mode.

## 🎓 Educational Context

This project is designed as a learning tool for:
- Teaching climate change with data-driven visuals
- Engaging students through spatial interaction
- Supporting discussions about environmental policy using simulations

## 🔄 Planned Improvements
- [ ] AR image marker detection using AR.js or 8thWall
- [ ] Real-time CO2 overlay in future updates
- [ ] Integration with Google Earth Engine for more dynamic datasets

## 🚀 Credits
- Built by: Yanmi Yu
- Data: Global Forest Watch
- Frameworks: Three.js, WebXR, GSAP

## ✉️ License
MIT License. Feel free to fork, adapt, or build upon this for educational or research purposes.

