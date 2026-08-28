import * as THREE from 'three';
import gsap from 'gsap';
import { soundEngine } from '../utils/soundEngine.js';

export function setupInteractions(scene, camera, controls, lighting, furniture, pcSetup, deskSetup) {
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

  // Unlock audio on first user gesture anywhere
  const unlockAudio = () => {
    soundEngine.init();
    soundEngine.setFanState(true, 1.0);
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };
  window.addEventListener('pointerdown', unlockAudio);
  window.addEventListener('keydown', unlockAudio);

  // Screen mode toast notification
  const MODE_LABELS = {
    vscode: 'VS Code',
    terminal: 'Terminal',
    fivem: 'FiveM Dashboard',
    portfolio: 'Portfolio',
    discord: 'Discord',
    spotify: 'Spotify',
    'chat-log': 'Server Logs'
  };

  function showScreenToast(icon, mode) {
    const label = MODE_LABELS[mode] || mode;
    let toast = document.getElementById('screen-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'screen-toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `${icon} <strong>${label}</strong>`;
    toast.className = 'screen-toast show';
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 1500);
  }

  // 1. Main Monitor — Click to cycle screen modes
  const monitor = scene.getObjectByName('MainMonitor');
  if (monitor) {
    registerItem(monitor, 'Workstation Monitor — Click to switch', 'monitor', () => {
      soundEngine.playSwitchClick();
      if (deskSetup && deskSetup.screenManager) {
        const newMode = deskSetup.screenManager.cycleMainMode();
        showScreenToast('🖥️', newMode);
      }
    });
  }

  // 1b. Vertical Monitor — Click to cycle screen modes
  const vertMon = scene.getObjectByName('VerticalMonitor');
  if (vertMon) {
    registerItem(vertMon, 'Vertical Monitor — Click to switch', 'monitor', () => {
      soundEngine.playSwitchClick();
      if (deskSetup && deskSetup.screenManager) {
        const newMode = deskSetup.screenManager.cycleVertMode();
        showScreenToast('📱', newMode);
      }
    });
  }

  // 2. PC Case
  const pcRig = scene.getObjectByName('GamingPCRig');
  if (pcRig) {
    registerItem(pcRig, 'Gaming PC Rig', 'pc', () => {
      soundEngine.playSwitchClick();
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
        soundEngine.playSwitchClick();
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
      soundEngine.playSwitchClick();
      soundEngine.setFanState(running, 1.0);
      showQuickNotification(running ? '🌀 Fan turned ON' : '⏸️ Fan turned OFF');
    });
  }

  // 4. Digital Clock
  const clock = scene.getObjectByName('DigitalClock');
  if (clock) {
    registerItem(clock, 'Live Digital Clock', 'clock', () => {
      soundEngine.playNotificationPop();
      const timeStr = new Date().toLocaleTimeString();
      showQuickNotification(`🕒 Current Local Time: ${timeStr}`);
    });
  }

  // 5. Mechanical Keyboard Hotspot
  const kb = scene.getObjectByName('MechanicalKeyboard');
  if (kb) {
    registerItem(kb, 'Mechanical Keyboard (Click or Type on Keyboard)', 'keyboard', () => {
      soundEngine.playMechanicalKey('space');
      if (deskSetup && deskSetup.pressRandomKey) {
        deskSetup.pressRandomKey();
      }
      showQuickNotification('⌨️ Clicked Mechanical Switch! (Try typing on your real keyboard)');
    });
  }

  // 6. Studio Speakers Hotspots
  const spkLeft = scene.getObjectByName('StudioSpeakerLeft');
  const spkRight = scene.getObjectByName('StudioSpeakerRight');
  const onSpeakerClick = () => {
    soundEngine.playSwitchClick();
    const isPlaying = soundEngine.toggleMusic();
    const curChan = soundEngine.getCurrentChannel();
    updateRadioUI(isPlaying, curChan);
    showQuickNotification(isPlaying ? `🎵 Playing: ${curChan.name}` : '⏸️ Music Paused');
  };

  if (spkLeft) registerItem(spkLeft, 'Studio Speaker (Click to Toggle Lo-Fi Radio)', 'speaker', onSpeakerClick);
  if (spkRight) registerItem(spkRight, 'Studio Speaker (Click to Toggle Lo-Fi Radio)', 'speaker', onSpeakerClick);

  // Real-time physical keyboard typing listener
  window.addEventListener('keydown', (e) => {
    // Ignore input fields if user is typing in a form
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    let keyType = 'normal';
    if (e.code === 'Space') keyType = 'space';
    else if (e.code === 'Enter' || e.code === 'Backspace') keyType = 'enter';

    soundEngine.playMechanicalKey(keyType);

    if (deskSetup && deskSetup.pressRandomKey) {
      deskSetup.pressRandomKey();
    }
  });

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
    if (e.target.closest('.quick-bar') || e.target.closest('.lil-gui') || e.target.closest('.modal-card') || e.target.closest('.footer-credit') || e.target.closest('.radio-widget')) {
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

  // Radio Player Widget DOM elements
  const radioWidget = document.getElementById('radio-widget');
  const radioPlayBtn = document.getElementById('radio-play-btn');
  const radioNextBtn = document.getElementById('radio-next-btn');
  const radioChannelName = document.getElementById('radio-channel-name');
  const radioChannelIcon = document.getElementById('radio-channel-icon');
  const radioVolume = document.getElementById('radio-volume');
  const btnSoundMute = document.getElementById('btn-sound-mute');
  const radioEqualizer = document.getElementById('radio-equalizer');

  function updateRadioUI(isPlaying, channel) {
    if (!channel) channel = soundEngine.getCurrentChannel();
    if (radioPlayBtn) {
      radioPlayBtn.innerText = isPlaying ? '⏸️' : '▶️';
      radioPlayBtn.setAttribute('title', isPlaying ? 'Pause Lo-Fi Radio' : 'Play Lo-Fi Radio');
    }
    if (radioChannelName) radioChannelName.innerText = channel.name;
    if (radioChannelIcon) radioChannelIcon.innerText = channel.icon;
    if (radioEqualizer) {
      if (isPlaying) radioEqualizer.classList.add('playing');
      else radioEqualizer.classList.remove('playing');
    }
  }

  radioPlayBtn?.addEventListener('click', () => {
    soundEngine.playSwitchClick();
    const isPlaying = soundEngine.toggleMusic();
    updateRadioUI(isPlaying, soundEngine.getCurrentChannel());
  });

  radioNextBtn?.addEventListener('click', () => {
    soundEngine.playSwitchClick();
    const newChan = soundEngine.nextChannel();
    updateRadioUI(soundEngine.isPlayingMusic, newChan);
    showQuickNotification(`📻 Station: ${newChan.name}`);
  });

  radioVolume?.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    soundEngine.setVolume(val);
  });

  btnSoundMute?.addEventListener('click', () => {
    const muted = soundEngine.toggleMute();
    soundEngine.playSwitchClick();
    const iconSpan = btnSoundMute.querySelector('.btn-icon') || btnSoundMute;
    iconSpan.innerText = muted ? '🔇' : '🔊';
    btnSoundMute.setAttribute('title', muted ? 'Unmute Sound' : 'Mute Sound');
    showQuickNotification(muted ? '🔇 Sound Muted' : '🔊 Sound Enabled');
  });

  // Fullscreen Toggle
  const btnFullscreen = document.getElementById('btn-fullscreen');
  btnFullscreen?.addEventListener('click', () => {
    soundEngine.playSwitchClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      btnFullscreen.setAttribute('title', 'Exit Fullscreen');
    } else {
      document.exitFullscreen().catch(() => {});
      btnFullscreen.setAttribute('title', 'Enter Fullscreen');
    }
  });

  // Settings GUI Toggle
  const btnSettingsGui = document.getElementById('btn-settings-gui');
  btnSettingsGui?.addEventListener('click', () => {
    soundEngine.playSwitchClick();
    const guiRoot = document.querySelector('.lil-gui.root');
    if (guiRoot) {
      guiRoot.classList.toggle('gui-hidden');
    }
  });

  // Quick HUD Buttons (Legacy / Secondary compatibility)
  const btnTheme = document.getElementById('btn-theme');
  btnTheme?.addEventListener('click', () => {
    soundEngine.playSwitchClick();
    lighting.state.uNightMix = lighting.state.uNightMix > 0.5 ? 0.0 : 0.85;
    lighting.update();
    const isNight = lighting.state.uNightMix > 0.5;
    btnTheme.querySelector('.btn-icon').innerText = isNight ? '🌙' : '☀️';
    btnTheme.querySelector('.btn-text').innerText = isNight ? 'Night Mode' : 'Day Mode';
  });

  const btnFan = document.getElementById('btn-fan');
  btnFan?.addEventListener('click', () => {
    const running = furniture.toggleFan();
    soundEngine.playSwitchClick();
    soundEngine.setFanState(running, 1.0);
    btnFan.querySelector('.btn-text').innerText = running ? 'Fan: ON' : 'Fan: OFF';
  });

  const btnCamera = document.getElementById('btn-camera');
  btnCamera?.addEventListener('click', () => {
    soundEngine.playSwitchClick();
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
    soundEngine.playSwitchClick();
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

  return { setCameraPreset, resetCameraView, updateRadioUI };
}
