export function setupRoomUI() {
  const viewLabel = document.getElementById('scene-view-label');
  const moodLabel = document.getElementById('scene-mood-label');
  const performanceLabel = document.getElementById('performance-label');
  const moreControls = document.getElementById('more-controls');

  function selectButton(selector, attribute, value) {
    document.querySelectorAll(selector).forEach((button) => {
      const selected = button.getAttribute(attribute) === value;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  }

  window.addEventListener('room-view-change', ({ detail }) => {
    selectButton('.cam-pill', 'data-cam', detail.view);
    if (viewLabel) viewLabel.textContent = {
      Isometric: 'Room view', 'Desk Setup': 'Desk view', 'Bed Corner': 'Bed view',
      'First Person': 'Walking', 'Top Down': 'Top view'
    }[detail.view] || detail.view;
  });

  window.addEventListener('room-lighting-change', ({ detail }) => {
    selectButton('.preset-pill', 'data-preset', detail.preset);
    if (moodLabel) moodLabel.textContent = {
      'Cyberpunk Night': 'Night', 'Sunset Studio': 'Sunset',
      'Clean Daylight': 'Daylight', 'Cozy Lo-Fi': 'Cozy', 'Weather Synced': 'Local weather'
    }[detail.preset] || detail.preset;
  });

  window.addEventListener('room-performance', ({ detail }) => {
    if (performanceLabel) {
      performanceLabel.textContent = Number.isFinite(detail.fps) && detail.fps > 0
        ? `${detail.label} · ${Math.round(detail.fps)} fps` : detail.label;
    }
  });

  window.addEventListener('rc-mode-change', ({ detail }) => {
    document.getElementById('btn-rc-drive')?.setAttribute('aria-pressed', String(detail.active));
  });

  document.addEventListener('pointerdown', (event) => {
    if (moreControls?.open && !moreControls.contains(event.target)) moreControls.open = false;
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && moreControls?.open) {
      moreControls.open = false;
      moreControls.querySelector('summary')?.focus();
    }
  });
  moreControls?.querySelectorAll('.menu-action').forEach((button) => {
    button.addEventListener('click', () => {
      moreControls.open = false;
      moreControls.querySelector('summary')?.focus();
    });
  });
}
