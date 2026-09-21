import * as THREE from 'three';
import gsap from 'gsap';
import { soundEngine } from '../utils/soundEngine.js';

export function setupInteractions(scene, camera, controls, lighting, furniture, pcSetup, deskSetup, rcCar, fpsController, roomPet) {
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

  // 1. Main Monitor — Click to open interactive terminal & arcade launcher
  const monitor = scene.getObjectByName('MainMonitor');
  if (monitor) {
    registerItem(monitor, 'Workstation Monitor (Click to Play or Open Terminal)', 'monitor', () => {
      soundEngine.playSwitchClick();
      openModal('🖥️ Workstation OS v2.0', `
        <div class="terminal-header">&gt; system.interactive_shell()</div>
        <p style="font-size: 13px; color: #94a3b8; margin: 8px 0 14px;">Launch the live Cyber Runner arcade game or Rhythm Beat directly on the 3D monitor, or run terminal commands below.</p>
        <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 16px;">
          <button class="modal-btn highlight-btn" id="btn-play-arcade">🎮 Play Cyber Runner</button>
          <button class="modal-btn highlight-btn" id="btn-play-rhythm" style="background: linear-gradient(135deg,#7c3aed,#a855f7);">🎵 Rhythm Beat</button>
          <button class="modal-btn" id="btn-cycle-screen">🔄 Cycle Screen Mode</button>
        </div>
        <div class="terminal-cli-container">
          <div class="cli-output-log" id="cli-output-log">
            <div class="cli-line info">Type <span class="cli-cmd">help</span> for commands, or <span class="cli-cmd">game</span> / <span class="cli-cmd">rhythm</span> to play.</div>
          </div>
          <div class="cli-input-row">
            <span class="cli-prompt">guest@room:~$</span>
            <input type="text" id="terminal-cli-input" class="terminal-cli-input" placeholder="type a command..." autocomplete="off" />
          </div>
        </div>
      `);

      // Wire Play Arcade button
      document.getElementById('btn-play-arcade')?.addEventListener('click', () => {
        closeModal();
        startArcadeMode();
      });

      // Wire Play Rhythm Beat button
      document.getElementById('btn-play-rhythm')?.addEventListener('click', () => {
        closeModal();
        startRhythmMode();
      });

      // Wire Cycle Screen Mode button
      document.getElementById('btn-cycle-screen')?.addEventListener('click', () => {
        soundEngine.playSwitchClick();
        if (deskSetup && deskSetup.screenManager) {
          deskSetup.screenManager.setArcadeMode(false);
          const newMode = deskSetup.screenManager.cycleMainMode();
          showScreenToast('🖥️', newMode);
        }
      });

      // Wire CLI Input
      const cliInput = document.getElementById('terminal-cli-input');
      const cliLog = document.getElementById('cli-output-log');
      cliInput?.focus();

      cliInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const cmd = cliInput.value.trim().toLowerCase();
          cliInput.value = '';
          handleCliCommand(cmd, cliLog);
        }
      });
    });
  }

  // Helper to start arcade mode
  function startArcadeMode() {
    if (deskSetup && deskSetup.screenManager) {
      deskSetup.screenManager.setArcadeMode(true);
      setCameraPreset('Desk Setup');
      showArcadeHud(true);
      showQuickNotification('🎮 Cyber Runner Started! Press Space to Play, Esc to Exit.');
    }
  }

  // Helper to start rhythm mode
  function startRhythmMode() {
    if (deskSetup && deskSetup.screenManager) {
      deskSetup.screenManager.setRhythmMode(true);
      setCameraPreset('Desk Setup');
      showRhythmHud(true);
      showQuickNotification('🎵 Rhythm Beat! Press [A][S][D][F] to hit notes, Esc to Exit.');
    }
  }

  // CLI Command processor
  function handleCliCommand(cmd, logEl) {
    if (!logEl) return;
    soundEngine.playMechanicalKey('enter');

    const append = (html) => {
      const line = document.createElement('div');
      line.className = 'cli-line';
      line.innerHTML = html;
      logEl.appendChild(line);
      logEl.scrollTop = logEl.scrollHeight;
    };

    append(`<span class="cli-prompt-hist">guest@room:~$</span> ${cmd}`);

    if (cmd === 'help') {
      append(`Available commands:
        <br>• <span class="cli-cmd">skills</span> — View engineering stack
        <br>• <span class="cli-cmd">projects</span> — View portfolio projects
        <br>• <span class="cli-cmd">game</span> — Play Cyber Runner on 3D monitor
        <br>• <span class="cli-cmd">rhythm</span> — Play Rhythm Beat (A/S/D/F lanes)
        <br>• <span class="cli-cmd">weather</span> — Sync current local weather
        <br>• <span class="cli-cmd">music</span> — Toggle Lo-Fi Radio
        <br>• <span class="cli-cmd">matrix</span> — Digital green rain test
        <br>• <span class="cli-cmd">clear</span> — Clear terminal window`);
    } else if (cmd === 'skills') {
      append(`Engineering Skills:
        <br>• <strong>Core:</strong> JavaScript (ESNext), TypeScript, Three.js, WebGL, HTML5 Canvas
        <br>• <strong>Styling:</strong> Vanilla CSS3, Glassmorphism, Responsive UI, Post-Processing Bloom
        <br>• <strong>Audio:</strong> Web Audio API (Generative synths, chord progressions)
        <br>• <strong>Testing:</strong> Vitest, CI/CD GitHub Actions`);
    } else if (cmd === 'projects') {
      append(`Featured Projects:
        <br>• <strong>My Room in 3D:</strong> Isometric interactive portfolio with Bruno Simon inspiration
        <br>• <strong>FiveM Framework:</strong> Custom low-latency server scripts & roleplay dashboards
        <br>• <strong>Procedural Lo-Fi Synthesizer:</strong> Zero-dependency Web Audio chord generator`);
    } else if (cmd === 'game') {
      closeModal();
      startArcadeMode();
    } else if (cmd === 'rhythm') {
      closeModal();
      startRhythmMode();
    } else if (cmd === 'weather') {
      append(`Weather Status: Connected & synchronized in real-time with local time.`);
    } else if (cmd === 'music') {
      soundEngine.toggleMusic();
      const cur = soundEngine.getCurrentChannel();
      append(`Radio: ${soundEngine.isPlayingMusic ? 'Playing ' + cur.name : 'Paused'}`);
    } else if (cmd === 'matrix') {
      append(`<span style="color: #22c55e;">Wake up, Neo... The Matrix has you. Follow the white rabbit. 🐇</span>`);
    } else if (cmd === 'clear') {
      logEl.innerHTML = '';
    } else if (cmd) {
      append(`<span style="color: #f87171;">Command not found: "${cmd}". Type <span class="cli-cmd">help</span> for a list.</span>`);
    }
  }

  // Arcade HUD
  let arcadeHud = document.getElementById('arcade-hud');
  if (!arcadeHud && typeof document !== 'undefined') {
    arcadeHud = document.createElement('div');
    arcadeHud.id = 'arcade-hud';
    arcadeHud.className = 'arcade-hud hidden';
    arcadeHud.innerHTML = `
      <div class="arcade-hud-pill">
        <span class="arcade-hud-icon">🕹️</span>
        <span class="arcade-hud-title">CYBER RUNNER</span>
        <div class="arcade-hud-keys">
          <span class="hud-key">W/A/S/D</span> Move
          <span class="hud-key">Space</span> Start / Restart
        </div>
        <button class="arcade-hud-exit" id="arcade-exit-btn" title="Exit Game (Esc)">✕ Exit</button>
      </div>
    `;
    document.body.appendChild(arcadeHud);

    document.getElementById('arcade-exit-btn')?.addEventListener('click', () => {
      showArcadeHud(false);
      if (deskSetup?.screenManager) deskSetup.screenManager.setArcadeMode(false);
      resetCameraView();
    });
  }

  function showArcadeHud(visible) {
    if (!arcadeHud) return;
    if (visible) arcadeHud.classList.remove('hidden');
    else arcadeHud.classList.add('hidden');
  }

  // Rhythm HUD
  let rhythmHud = document.getElementById('rhythm-hud');
  if (!rhythmHud && typeof document !== 'undefined') {
    rhythmHud = document.createElement('div');
    rhythmHud.id = 'rhythm-hud';
    rhythmHud.className = 'arcade-hud hidden';
    rhythmHud.innerHTML = `
      <div class="arcade-hud-pill" style="border-color: #a855f7; box-shadow: 0 0 20px rgba(168,85,247,0.4);">
        <span class="arcade-hud-icon">🎵</span>
        <span class="arcade-hud-title" style="color: #a855f7;">RHYTHM BEAT</span>
        <div class="arcade-hud-keys">
          <span class="hud-key">A</span>
          <span class="hud-key">S</span>
          <span class="hud-key">D</span>
          <span class="hud-key">F</span>
          Hit Lanes
        </div>
        <button class="arcade-hud-exit" id="rhythm-exit-btn" title="Exit Game (Esc)">✕ Exit</button>
      </div>
    `;
    document.body.appendChild(rhythmHud);

    document.getElementById('rhythm-exit-btn')?.addEventListener('click', () => {
      showRhythmHud(false);
      if (deskSetup?.screenManager) deskSetup.screenManager.setRhythmMode(false);
      resetCameraView();
    });
  }

  function showRhythmHud(visible) {
    if (!rhythmHud) return;
    if (visible) rhythmHud.classList.remove('hidden');
    else rhythmHud.classList.add('hidden');
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

  // 7. RC Cyber Rover Interactive Hotspot
  if (rcCar && rcCar.group) {
    registerItem(rcCar.group, '🏎️ RC Cyber Rover (Click to Drive)', 'rc-car', () => {
      soundEngine.playSwitchClick();
      rcCar.setActive(true);
      showQuickNotification('🏎️ Drive RC Rover with [W/A/S/D] or [Arrows]!');
    });
  }

  // 8. Cyber Cat Companion Interactive Hotspot
  if (roomPet && roomPet.group) {
    registerItem(roomPet.group, '🐱 Cyber Cat (Click to Pet)', 'pet', () => {
      roomPet.pet();
      showQuickNotification('😻 Pet the Cyber Cat! *purrrrr*');
    });
  }

  // Real-time physical keyboard typing listener
  window.addEventListener('keydown', (e) => {
    // If rhythm mode is running, route inputs to rhythm game
    if (deskSetup && deskSetup.screenManager && deskSetup.screenManager.isRhythmMode) {
      if (e.code === 'Escape') {
        deskSetup.screenManager.setRhythmMode(false);
        showRhythmHud(false);
        resetCameraView();
        return;
      }
      deskSetup.screenManager.handleRhythmKey(e.code);
      if (['KeyA', 'KeyS', 'KeyD', 'KeyF', 'Space', 'Enter'].includes(e.code)) {
        e.preventDefault();
      }
      return;
    }

    // If arcade mode is running, route inputs directly to arcade game
    if (deskSetup && deskSetup.screenManager && deskSetup.screenManager.isArcadeMode) {
      if (e.code === 'Escape') {
        deskSetup.screenManager.setArcadeMode(false);
        showArcadeHud(false);
        resetCameraView();
        return;
      }
      deskSetup.screenManager.handleArcadeKey(e.code);
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      return;
    }

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

  // Modal helpers with DOM sanitization
  function openModal(title, htmlContent) {
    modalTitle.textContent = title;

    // Safely parse and sanitize HTML before inserting
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    // Remove any potential script, iframe, or embed elements
    doc.querySelectorAll('script, iframe, object, embed').forEach((el) => el.remove());

    // Ensure all external links enforce security attributes
    doc.querySelectorAll('a').forEach((a) => {
      a.setAttribute('rel', 'noopener noreferrer');
      a.setAttribute('target', '_blank');
    });

    modalBody.innerHTML = '';
    while (doc.body.firstChild) {
      modalBody.appendChild(doc.body.firstChild);
    }

    modalBackdrop.classList.remove('hidden');
    modalBackdrop.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    modalBackdrop.classList.add('hidden');
    modalBackdrop.setAttribute('aria-hidden', 'true');
  }

  // Accessibility live region announcer
  function announceToA11y(msg) {
    const announcer = document.getElementById('a11y-announcer');
    if (announcer) {
      announcer.textContent = msg;
    }
  }

  modalCloseBtn.addEventListener('click', closeModal);
  modalCloseBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      closeModal();
    }
  });
  modalCloseX.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeModal();
  });

  // Close modal on Escape key press
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modalBackdrop.classList.contains('hidden')) {
      closeModal();
    }
  });

  // Quick notification
  function showQuickNotification(msg) {
    tooltipText.innerText = msg;
    tooltip.classList.add('visible');
    announceToA11y(msg);
    setTimeout(() => {
      tooltip.classList.remove('visible');
    }, 2000);
  }

  // Pointer position tracking to differentiate orbit drag from click
  let pointerDownPos = { x: 0, y: 0 };
  window.addEventListener('pointerdown', (e) => {
    pointerDownPos = { x: e.clientX, y: e.clientY };
  });

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

  // Click Handler with drag delta threshold
  window.addEventListener('click', (e) => {
    // If pointer moved more than 8px between down and up, it was an orbit/pan drag, not a click
    const dragDistance = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
    if (dragDistance > 8) {
      return;
    }

    if (
      e.target.closest('.bottom-dock-wrapper') ||
      e.target.closest('.top-nav-bar') ||
      e.target.closest('.quick-bar') ||
      e.target.closest('.lil-gui') ||
      e.target.closest('.modal-card') ||
      e.target.closest('.footer-credit') ||
      e.target.closest('.radio-widget')
    ) {
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

    if (fpsController && fpsController.active && viewName !== 'First Person') {
      fpsController.disable();
    }

    if (viewName === 'First Person') {
      if (fpsController) {
        fpsController.enable();
        showQuickNotification('🚶 Click to look around. WASD to walk, Shift to sprint, Esc to exit.');
      }
      return;
    }

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
