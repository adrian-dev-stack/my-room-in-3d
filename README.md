# 🌟 My Room in 3D (Isometric Web Experience)

An interactive, 3D isometric room inspired by Bruno Simon's iconic Three.js portfolio, customized to match your exact room layout, furniture, and workstation setup.

---

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

## 🛠️ Local Development

To run the project locally on your machine:

```bash
# 1. Navigate to the project directory
cd Desktop/my-room-in-3d

# 2. Start the local Vite development server
npm run dev
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
