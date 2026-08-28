import * as THREE from 'three';
import gsap from 'gsap';

export function setupInteractions(scene, camera, controls, lighting, furniture, pcSetup) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const tooltip = document.getElementById('tooltip');
  const tooltipText = document.getElementById('tooltip-text');
  const modalBackdrop = document.getElementById('modal-backdrop');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalCloseX = document.getElementById('modal-close-x');

  // Interactive objects list
  const interactables = [];

  // Register interactive items
  function registerItem(mesh, name, type, action) {
    mesh.traverse((child) => {
      if (child.isMesh) {
        child.userData = { name, type, action };
        interactables.push(child);
      }
    });
  }

  // 1. Main Monitor
  const monitor = scene.getObjectByName('MainMonitor');
  if (monitor) {
    registerItem(monitor, 'Workstation Monitor', 'monitor', () => {
      openModal('💻 Developer Workstation', `
        <div class="terminal-header">&gt; developer.info()</div>
        <p style="margin-bottom: 12px; line-height: 1.6;">
          Welcome to my interactive 3D room! I'm a developer building web applications, game servers (FiveM), and immersive 3D web experiences.
        </p>
        <div style="margin-bottom: 16px;">
          <span class="terminal-badge">JavaScript</span>
          <span class="terminal-badge">Three.js</span>
          <span class="terminal-badge">FiveM / Lua</span>
          <span class="terminal-badge">React</span>
          <span class="terminal-badge">Node.js</span>
        </div>
        <div class="terminal-header">&gt; current_setup.view()</div>
        <ul style="margin-left: 20px; line-height: 1.7; font-size: 13px;">
          <li><strong>Display:</strong> Dual Monitor Setup (Main with LED light bar + Vertical Discord)</li>
          <li><strong>Audio:</strong> Logitech G435 Wireless Headset</li>
          <li><strong>Mouse:</strong> Logitech G304 Lightspeed</li>
          <li><strong>Keyboard:</strong> Mechanical RGB Backlit</li>
        </ul>
        <div class="terminal-links">
          <a href="https://github.com" target="_blank" class="modal-btn">Visit GitHub</a>
          <button class="modal-btn secondary" id="modal-theme-toggle">Toggle Room Lights</button>
        </div>
      `);
      document.getElementById('modal-theme-toggle')?.addEventListener('click', () => {
        lighting.state.uNightMix = lighting.state.uNightMix > 0.5 ? 0.0 : 0.85;
        lighting.update();
      });
    });
  }

  // 2. PC Case
  const pcRig = scene.getObjectByName('GamingPCRig');
  if (pcRig) {
    registerItem(pcRig, 'Gaming PC Rig', 'pc', () => {
      openModal('⚡ Custom Gaming Rig', `
        <div class="terminal-header">&gt; system.specs()</div>
        <ul style="margin-left: 20px; line-height: 1.8; font-size: 13px;">
          <li><strong>Chassis:</strong> Tempered Glass Airflow Tower</li>
          <li><strong>Cooling:</strong> 3x Addressable Front RGB Ring Fans</li>
          <li><strong>Clock:</strong> Synchronized Live Digital LED Clock</li>
          <li><strong>Status:</strong> Active & Running Smoothly</li>
        </ul>
        <div class="terminal-links">
          <button class="modal-btn" id="pc-rgb-cycle">Cycle RGB Colors</button>
        </div>
      `);
      document.getElementById('pc-rgb-cycle')?.addEventListener('click', () => {
        const colors = ['#0082ff', '#ff115e', '#10b981', '#f59e0b', '#a855f7'];
        const nextColor = colors[Math.floor(Math.random() * colors.length)];
        lighting.state.pcColor = nextColor;
        lighting.update();
        pcSetup.fanLedMat.color.set(nextColor);
      });
    });
  }

  // 3. Standing Fan
  const fan = scene.getObjectByName('StandingFan');
  if (fan) {
    registerItem(fan, 'Standing Fan (Click to Toggle)', 'fan', () => {
      const running = furniture.toggleFan();
      showQuickNotification(running ? '🌀 Fan turned ON' : '⏸️ Fan turned OFF');
    });
  }

  // 4. Digital Clock
  const clock = scene.getObjectByName('DigitalClock');
  if (clock) {
    registerItem(clock, 'Live Digital Clock', 'clock', () => {
      const timeStr = new Date().toLocaleTimeString();
      showQuickNotification(`🕒 Current Local Time: ${timeStr}`);
    });
  }

  // Modal helpers
  function openModal(title, htmlContent) {
    modalTitle.innerText = title;
    modalBody.innerHTML = htmlContent;
    modalBackdrop.classList.remove('hidden');
  }

  function closeModal() {
    modalBackdrop.classList.add('hidden');
  }

  modalCloseBtn.addEventListener('click', closeModal);
  modalCloseX.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeModal();
  });

  // Quick notification
  function showQuickNotification(msg) {
    tooltipText.innerText = msg;
    tooltip.classList.add('visible');
    setTimeout(() => {
      tooltip.classList.remove('visible');
    }, 2000);
  }

  // Mouse Move Raycasting for hover tooltip
  window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    tooltip.style.left = `${e.clientX}px`;
    tooltip.style.top = `${e.clientY}px`;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactables, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object.userData;
      if (hit && hit.name) {
        document.body.style.cursor = 'pointer';
        tooltipText.innerText = hit.name;
        tooltip.classList.add('visible');
        return;
      }
    }

    document.body.style.cursor = 'default';
    tooltip.classList.remove('visible');
  });

  // Click Handler
  window.addEventListener('click', (e) => {
    if (e.target.closest('.quick-bar') || e.target.closest('.lil-gui') || e.target.closest('.modal-card') || e.target.closest('.footer-credit')) {
      return;
    }

    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactables, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object.userData;
      if (hit && hit.action) {
        hit.action();
      }
    }
  });

  // Quick HUD Buttons
  const btnTheme = document.getElementById('btn-theme');
  btnTheme?.addEventListener('click', () => {
    lighting.state.uNightMix = lighting.state.uNightMix > 0.5 ? 0.0 : 0.85;
    lighting.update();
    const isNight = lighting.state.uNightMix > 0.5;
    btnTheme.querySelector('.btn-icon').innerText = isNight ? '🌙' : '☀️';
    btnTheme.querySelector('.btn-text').innerText = isNight ? 'Night Mode' : 'Day Mode';
  });

  const btnFan = document.getElementById('btn-fan');
  btnFan?.addEventListener('click', () => {
    const running = furniture.toggleFan();
    btnFan.querySelector('.btn-text').innerText = running ? 'Fan: ON' : 'Fan: OFF';
  });

  const btnCamera = document.getElementById('btn-camera');
  btnCamera?.addEventListener('click', () => {
    resetCameraView();
  });

  function resetCameraView() {
    gsap.to(camera.position, {
      x: 7.8,
      y: 6.8,
      z: 7.8,
      duration: 1.5,
      ease: 'power2.inOut',
      onUpdate: () => controls.update()
    });
    gsap.to(controls.target, {
      x: 0,
      y: 1.2,
      z: 0,
      duration: 1.5,
      ease: 'power2.inOut'
    });
  }

  // Camera presets
  function setCameraPreset(viewName) {
    if (viewName === 'Isometric') {
      resetCameraView();
    } else if (viewName === 'Desk Setup') {
      gsap.to(camera.position, { x: 0.6, y: 2.1, z: -0.6, duration: 1.4, ease: 'power2.inOut' });
      gsap.to(controls.target, { x: -0.2, y: 1.4, z: -2.6, duration: 1.4, ease: 'power2.inOut' });
    } else if (viewName === 'Bed Corner') {
      gsap.to(camera.position, { x: 1.4, y: 2.5, z: 3.8, duration: 1.4, ease: 'power2.inOut' });
      gsap.to(controls.target, { x: -1.0, y: 0.8, z: 1.8, duration: 1.4, ease: 'power2.inOut' });
    } else if (viewName === 'Top Down') {
      gsap.to(camera.position, { x: 0.1, y: 10.5, z: 0.1, duration: 1.4, ease: 'power2.inOut' });
      gsap.to(controls.target, { x: 0, y: 0, z: 0, duration: 1.4, ease: 'power2.inOut' });
    }
  }

  return { setCameraPreset, resetCameraView };
}
