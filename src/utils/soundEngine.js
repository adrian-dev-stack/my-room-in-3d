/**
 * SoundEngine - Procedural Web Audio Engine
 * Zero external audio file dependencies.
 * Synthesizes mechanical keyboard clicks, switch clicks, ambient fan noise,
 * and generative lo-fi chill/synthwave chord progressions.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isMuted = false;
    this.volume = 0.7;

    // Ambient Fan Noise Nodes
    this.fanGain = null;
    this.fanFilter = null;
    this.fanOsc = null;
    this.fanNoiseSource = null;
    this.isFanPlaying = false;

    // Music & Analyser
    this.musicGain = null;
    this.analyser = null;
    this.freqData = null;
    this.isPlayingMusic = false;
    this.currentChannel = 0;
    this.musicTimer = null;

    this.channels = [
      {
        name: 'Lo-Fi Chill Beats',
        icon: '☕',
        chords: [
          [261.63, 329.63, 392.0, 493.88], // Cmaj7
          [220.0, 261.63, 329.63, 392.0],  // Am7
          [174.61, 220.0, 261.63, 329.63], // Fmaj7
          [196.0, 246.94, 293.66, 349.23]  // G7
        ],
        tempo: 4.2,
        waveform: 'triangle',
        filterFreq: 850
      },
      {
        name: 'Cyberpunk Synthwave',
        icon: '🌌',
        chords: [
          [146.83, 174.61, 220.0, 261.63], // Dm7
          [116.54, 146.83, 174.61, 220.0], // Bbmaj7
          [130.81, 164.81, 196.0, 246.94], // Cmaj7
          [110.0, 130.81, 164.81, 196.0]   // Am7
        ],
        tempo: 3.2,
        waveform: 'sawtooth',
        filterFreq: 1400
      },
      {
        name: 'Midnight Cozy Lo-Fi',
        icon: '🕯️',
        chords: [
          [196.0, 246.94, 293.66, 392.0],  // Gmaj7
          [164.81, 196.0, 246.94, 293.66], // Em7
          [146.83, 185.0, 220.0, 277.18],  // Dmaj7
          [174.61, 220.0, 261.63, 329.63]  // Fmaj7
        ],
        tempo: 5.0,
        waveform: 'sine',
        filterFreq: 600
      }
    ];

    this.chordStep = 0;
  }

  /**
   * Initialize and unlock AudioContext on first user gesture
   */
  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

    // Analyser Node for Visualizers & Speaker Pulsing
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 64;
    this.freqData = new Uint8Array(this.analyser.frequencyBinCount);

    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // Music Sub-gain
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
    this.musicGain.connect(this.masterGain);

    // Initialize procedural ambient fan chain
    this._initFanAmbiance();
  }

  /**
   * Setup pink noise buffer and continuous fan drone
   */
  _initFanAmbiance() {
    if (!this.ctx) return;

    // 1. Pink/White Noise Buffer for realistic wind airflow
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11; // normalise
      b6 = white * 0.115926;
    }

    this.fanNoiseSource = this.ctx.createBufferSource();
    this.fanNoiseSource.buffer = noiseBuffer;
    this.fanNoiseSource.loop = true;

    // Filter to simulate air through plastic cage
    this.fanFilter = this.ctx.createBiquadFilter();
    this.fanFilter.type = 'lowpass';
    this.fanFilter.frequency.setValueAtTime(280, this.ctx.currentTime);

    // Subtle Motor Hum (harmonic 60Hz hum)
    this.fanOsc = this.ctx.createOscillator();
    this.fanOsc.type = 'triangle';
    this.fanOsc.frequency.setValueAtTime(58, this.ctx.currentTime);

    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.018, this.ctx.currentTime);
    this.fanOsc.connect(oscGain);

    // Fan master gain
    this.fanGain = this.ctx.createGain();
    this.fanGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.fanNoiseSource.connect(this.fanFilter);
    this.fanFilter.connect(this.fanGain);
    oscGain.connect(this.fanGain);

    this.fanGain.connect(this.masterGain);

    this.fanNoiseSource.start();
    this.fanOsc.start();
  }

  /**
   * Toggle or set fan ambient sound
   */
  setFanState(isRunning, speed = 1.0) {
    this.init();
    if (!this.fanGain || !this.ctx) return;

    const t = this.ctx.currentTime;
    if (isRunning && !this.isMuted) {
      const targetGain = 0.04 * speed;
      this.fanGain.gain.cancelScheduledValues(t);
      this.fanGain.gain.linearRampToValueAtTime(targetGain, t + 0.6);

      if (this.fanFilter) {
        this.fanFilter.frequency.linearRampToValueAtTime(260 + speed * 120, t + 0.6);
      }
      if (this.fanOsc) {
        this.fanOsc.frequency.linearRampToValueAtTime(50 + speed * 18, t + 0.6);
      }
      this.isFanPlaying = true;
    } else {
      this.fanGain.gain.cancelScheduledValues(t);
      this.fanGain.gain.linearRampToValueAtTime(0.0001, t + 0.5);
      this.isFanPlaying = false;
    }
  }

  /**
   * Synthesize mechanical keyboard switch click (Cherry MX Blue / Box White profile)
   * Dual transient: primary downstroke click + bottom-out thock resonance
   */
  playMechanicalKey(keyType = 'normal') {
    this.init();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;

    // Base pitch variation for realism
    let baseFreq = 1800;
    let clickLength = 0.045;
    let thockFreq = 220;

    if (keyType === 'space') {
      baseFreq = 1200;
      thockFreq = 140;
      clickLength = 0.065;
    } else if (keyType === 'enter') {
      baseFreq = 1500;
      thockFreq = 180;
      clickLength = 0.055;
    }

    const pitchRand = (Math.random() - 0.5) * 160;
    baseFreq += pitchRand;

    // 1. High click transient (snappy mechanical leaf)
    const clickOsc = this.ctx.createOscillator();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(baseFreq * 1.5, t);
    clickOsc.frequency.exponentialRampToValueAtTime(320, t + 0.015);

    const clickFilter = this.ctx.createBiquadFilter();
    clickFilter.type = 'bandpass';
    clickFilter.frequency.setValueAtTime(baseFreq, t);
    clickFilter.Q.setValueAtTime(3.5, t);

    const clickGain = this.ctx.createGain();
    clickGain.gain.setValueAtTime(0.38, t);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.025);

    clickOsc.connect(clickFilter);
    clickFilter.connect(clickGain);
    clickGain.connect(this.masterGain);

    clickOsc.start(t);
    clickOsc.stop(t + 0.03);

    // 2. Low bottom-out "thock" (desk & keycap resonance)
    const thockOsc = this.ctx.createOscillator();
    thockOsc.type = 'sine';
    thockOsc.frequency.setValueAtTime(thockFreq + (Math.random() - 0.5) * 20, t + 0.004);
    thockOsc.frequency.exponentialRampToValueAtTime(80, t + clickLength);

    const thockGain = this.ctx.createGain();
    thockGain.gain.setValueAtTime(0.001, t);
    thockGain.gain.linearRampToValueAtTime(0.28, t + 0.006);
    thockGain.gain.exponentialRampToValueAtTime(0.0001, t + clickLength);

    thockOsc.connect(thockGain);
    thockGain.connect(this.masterGain);

    thockOsc.start(t + 0.003);
    thockOsc.stop(t + clickLength + 0.01);
  }

  /**
   * Crisp UI switch / preset toggle click
   */
  playSwitchClick() {
    this.init();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(240, t + 0.035);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.04);
  }

  /**
   * Soft notification pop sound
   */
  playNotificationPop() {
    this.init();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(1040, t + 0.08);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  /**
   * Generative Lo-Fi / Synth Radio Player
   */
  toggleMusic() {
    this.init();
    if (this.isPlayingMusic) {
      this.stopMusic();
    } else {
      this.playMusic();
    }
    return this.isPlayingMusic;
  }

  playMusic() {
    this.init();
    if (!this.ctx) return;
    this.isPlayingMusic = true;
    this.chordStep = 0;
    this._playNextChord();
  }

  stopMusic() {
    this.isPlayingMusic = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  nextChannel() {
    this.currentChannel = (this.currentChannel + 1) % this.channels.length;
    if (this.isPlayingMusic) {
      this.stopMusic();
      this.playMusic();
    }
    return this.channels[this.currentChannel];
  }

  getCurrentChannel() {
    return this.channels[this.currentChannel];
  }

  _playNextChord() {
    if (!this.isPlayingMusic || !this.ctx) return;

    const channel = this.channels[this.currentChannel];
    const chord = channel.chords[this.chordStep % channel.chords.length];
    this.chordStep++;

    const t = this.ctx.currentTime;
    const duration = channel.tempo;

    // Play each voice in the chord with gentle attack & tape decay
    chord.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = channel.waveform;

      // Slight detune for analog warmth / tape flutter
      const detune = (idx - 1.5) * 4 + Math.sin(t * 2) * 3;
      osc.frequency.setValueAtTime(freq + detune, t);

      // Low pass filter
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(channel.filterFreq, t);
      filter.Q.setValueAtTime(1.5, t);

      // Amplitude Envelope
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.8 / chord.length, t + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.4 / chord.length, t + duration * 0.7);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start(t);
      osc.stop(t + duration);
    });

    // Schedule next chord in progression
    this.musicTimer = setTimeout(() => {
      this._playNextChord();
    }, (duration - 0.2) * 1000);
  }

  /**
   * Returns current average audio energy (0.0 to 1.0) for visualizers
   */
  getAudioLevel() {
    if (!this.analyser || !this.freqData) return 0;
    this.analyser.getByteFrequencyData(this.freqData);

    let sum = 0;
    for (let i = 0; i < this.freqData.length; i++) {
      sum += this.freqData[i];
    }
    return sum / (this.freqData.length * 255);
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
    return this.isMuted;
  }
}

export const soundEngine = new SoundEngine();

