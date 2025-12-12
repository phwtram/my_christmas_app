import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private isBrowser: boolean;
  private audioCtx: AudioContext | null = null;
  private audioBuffers: { [k: string]: AudioBuffer | null } = { bell: null, santa: null, collected: null };
  private howlerMusic?: HTMLAudioElement;
  private isMusicPlaying = false;

  private readonly SOUND_BELL = '/assets/sound/bell.wav';
  private readonly SOUND_SANTA = '/assets/sound/santa.mp3';
  private readonly SOUND_COLLECTED = '/assets/sound/collected.wav';
  private readonly BG_XMAS_MUSIC = '/assets/sound/christmas.mp3';

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  init() {
    if (!this.isBrowser) return;
    if (this.howlerMusic) {
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.audioCtx = new AudioCtx();
    } catch (e) {
      this.audioCtx = null;
    }

    this.howlerMusic = new Audio(this.BG_XMAS_MUSIC);
    this.howlerMusic.loop = true;
    this.howlerMusic.volume = 0.35;

    if (this.audioCtx) {
      this.loadAudioBuffer(this.SOUND_BELL, 'bell');
      this.loadAudioBuffer(this.SOUND_SANTA, 'santa');
      this.loadAudioBuffer(this.SOUND_COLLECTED, 'collected');
    }
  }

  stopMusic() {
    if (this.howlerMusic) {
      this.howlerMusic.pause();
      this.howlerMusic.currentTime = 0; // Tua về đầu
      this.isMusicPlaying = false;
    }
  }

  private async loadAudioBuffer(url: string, k: 'bell' | 'santa' | 'collected') {
    if (!this.audioCtx) return;
    try {
      const r = await fetch(url);
      const b = await this.audioCtx.decodeAudioData(await r.arrayBuffer());
      this.audioBuffers[k] = b;
    } catch (e) { this.audioBuffers[k] = null; }
  }

  toggleMusic(): boolean {
    if (!this.isBrowser) return false;
    if (!this.howlerMusic) this.init();

    if (this.isMusicPlaying) {
      this.howlerMusic?.pause();
      this.isMusicPlaying = false;
    } else {
      this.howlerMusic?.play().catch(() => {});
      this.isMusicPlaying = true;
    }

    localStorage.setItem('christmas_music_on', String(this.isMusicPlaying));
    return this.isMusicPlaying;
  }

  setMusicState(isPlaying: boolean) {
    this.isMusicPlaying = isPlaying;
  }

  async tryPlayMusic() {
    if (!this.isBrowser || !this.howlerMusic) return;

    // Nếu nhạc đang chạy thì không cần làm gì
    if (!this.howlerMusic.paused) {
      this.isMusicPlaying = true;
      return;
    }

    try {
      await this.howlerMusic.play();
      this.isMusicPlaying = true;
      localStorage.setItem('christmas_music_on', 'true');
    } catch (e) {
      document.addEventListener('click', () => {
        this.howlerMusic?.play().then(() => {
          this.isMusicPlaying = true;
          localStorage.setItem('christmas_music_on', 'true');
        });
        if (this.audioCtx?.state === 'suspended') this.audioCtx.resume();
      }, { once: true });
    }
  }

  playSFX(key: 'bell' | 'santa' | 'collected' | 'click' | 'open' | 'locked' | 'firework') {
    if (!this.isBrowser) return;
    if (!this.audioCtx) this.init();

    if (key === 'bell' || key === 'santa' || key === 'collected') {
      this.playBuffer(key);
      return;
    }

    const ctx = this.audioCtx;
    if (!ctx) return;
    const t = ctx.currentTime;

    if (key === 'click') {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(800, t);
      o.frequency.exponentialRampToValueAtTime(100, t + 0.05);
      g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      o.connect(g); g.connect(ctx.destination); o.start(); o.stop(t + 0.05);
    }
    else if (key === 'locked') {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = 160;
      g.gain.value = 0.12; o.connect(g); g.connect(ctx.destination);
      o.start(); o.stop(t + 0.16);
    }
    else if (key === 'open') {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = 400;
      g.gain.value = 0.12; o.connect(g); g.connect(ctx.destination);
      o.start(); o.stop(t + 0.28);
    }
    else if (key === 'firework') {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'square'; o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(40, t + 0.1);
      g.gain.setValueAtTime(0.1, t); g.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
      o.connect(g); g.connect(ctx.destination); o.start(); o.stop(t + 0.15);
    }
  }

  private playBuffer(k: 'bell' | 'santa' | 'collected') {
    if (!this.isBrowser || !this.audioCtx) return;

    // Fallback nếu chưa load buffer kịp
    if (!this.audioBuffers[k]) {
      const a = new Audio(k === 'santa' ? this.SOUND_SANTA : (k === 'collected' ? this.SOUND_COLLECTED : this.SOUND_BELL));
      if (k === 'santa') a.volume = 1;
      a.play().catch(() => {});
      return;
    }

    const s = this.audioCtx.createBufferSource();
    const g = this.audioCtx.createGain();
    s.buffer = this.audioBuffers[k];

    let vol = 0.4;
    if (k === 'santa') vol = 1;
    if (k === 'collected') vol = 0.6;

    g.gain.value = vol;
    s.connect(g);
    g.connect(this.audioCtx.destination);
    s.start();
  }
}
