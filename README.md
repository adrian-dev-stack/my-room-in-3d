# 🌟 My Room in 3D (Isometric Web Experience)

An interactive, 3D isometric room inspired by Bruno Simon's iconic Three.js portfolio, customized to match your exact room layout, furniture, and workstation setup.

---

## Your downloadable room model

The furnished room is exported to `public/models/my-room.glb`. It uses the
website's own room geometry, furniture, and generated textures. No stock room
model is used. The website and exporter share `src/components/RoomModel.js`,
including the PC's placement on the cabinet.

Regenerate the file after editing your room:

```bash
npm run export:model
npm run build
```

The export includes the floor and cutaway walls, window blinds, desk and both
monitors, keyboard, mouse, headset, speakers, PC and clock, bed and pillows,
cabinet, shelves, sofa, chair, standing fan, and the default neon sign. It uses
the website's default walnut floor and slate walls. Browser-saved customizer
choices are not read by the exporter.

The GLB contains its textures and retains separate named groups for editing.
Displays and fan blades are static snapshots. Website games, the RC car, pet,
particles, audio, weather, camera controls, and postprocessing remain website
features. Room dimensions are the website's authored units, not a measured
survey of your physical room. Screen and sign typography uses fonts installed
on the computer running the exporter.

The room uses physically based wood, woven fabric, and painted-wall materials
with aligned color, normal, and roughness maps. Bedding and cushions have
modeled folds and piping; the glass PC case has visible internal components.
The website adds studio reflections and contact shading, with room and detail
camera distances adapted to the viewport.

The exporter embeds the material maps and MikkTSpace tangents, and validates
the GLB before saving it. External viewers supply their own lighting and may
render the materials differently.

## 🚀 Features Included

- 📐 **Isometric Cutaway 3D Room:** Full 3D modeled room with wood plank floor, diagonal barn door, zebra blinds window, ceiling trim, and surface Ethernet wiring.
- 🖥️ **Workstation Setup:**
  - Main monitor with mounted LED light bar & code editor screen.
  - Vertical secondary monitor with Discord UI chat.
  - Mechanical RGB keyboard with backlit key matrix.
  - Gaming mouse + mousepad.
  - White gaming headset (Logitech G435 style).
- ⚡ **RGB Gaming PC Rig:**
  - Tempered glass side-panel case with glowing RGB ring fans.
  - **Live Digital LED Clock:** Synced in real-time with your local computer time.
- 🛏️ **Room Furniture & Decor:**
  - Bed with black sheet and gingham plaid & pastel pillows.
  - White 3-drawer storage cabinet holding the PC tower.
  - 3-tier floating wall shelves with Logitech G304 and G435 boxes.
  - Low sofa bench and modern white desk chair.
  - **Animated Pedestal Fan:** Realistic rotating blades that can be toggled on/off.
- 🎛️ **Interactive Controls Panel (`lil-gui`):**
  - Smooth `uNightMix` Day ☀️ / Night 🌙 lighting slider.
  - Real-time color pickers for PC LED fans, desk light bar, and screen glow.
  - Light intensity sliders.
  - Camera view presets (Isometric, Desk Setup, Bed Corner, Top-down).
- 🖱️ **Raycasting & Click Interactions:**
  - Click on the workstation monitor to view developer portfolio & info.
  - Click on the PC case to cycle RGB lighting colors.
  - Click the standing fan to toggle fan rotation.
  - Hover tooltips for interactive objects.

---

## 🛠️ Local Development & Testing

To run the project locally on your machine:

```bash
# 1. Install dependencies
npm install

# 2. Start the local Vite development server
npm run dev

# 3. Run automated unit test suite (Vitest)
npm test

# 4. Build optimized production assets
npm run build
```

Open your browser at `http://localhost:5173`.

---

## 🌐 How to Deploy to Vercel (Free & Instant)

### Option 1: Deploy via GitHub (Recommended)

1. Create a new repository on [GitHub](https://github.com/new) (e.g. `my-room-in-3d`).
2. Push your project to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of 3D room"
   git branch -M main
   git remote add origin https://github.com/<your-username>/my-room-in-3d.git
   git push -u origin main
   ```
3. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
4. Select your `my-room-in-3d` repository.
5. Vercel will automatically detect **Vite** — click **"Deploy"**!

### Option 2: Deploy directly with Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Deploy directly from your terminal
vercel
```

---

## 🎨 Customization Guide

- **Change Your Name in the Footer:** Edit the author name in `index.html` (line 64).
- **Edit Modal Links & Portfolio Text:** Modify `src/components/Interactions.js` to add your real GitHub, Discord, or portfolio links.
- **Adjust Colors & Lighting:** Tweak default colors in `src/components/Lighting.js` and `src/components/GUI.js`.
