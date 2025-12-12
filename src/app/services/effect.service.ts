import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Snowflake } from '../models/christmas.model';

@Injectable({
  providedIn: 'root'
})
export class EffectService {
  private isBrowser: boolean;
  private isDestroyed = false;

  // Snow vars
  private snowflakes: Snowflake[] = [];
  private animationId?: number;
  private snowInterval?: any;

  // Fireworks vars
  private fwCanvas?: HTMLCanvasElement;
  private fwCtx?: CanvasRenderingContext2D | null;
  private fwAnimId?: number;
  private fwParticles: any[] = [];
  private fwActive = false;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  // --- CONFETTI ---
  createConfetti() {
    this.isDestroyed = false; // [FIX] Hồi sinh service
    if (!this.isBrowser) return;

    const clr = ['#ff6b6b', '#ffd700', '#4ecdc4', '#ff69b4', '#00ff00', '#00bfff'];
    for (let i = 0; i < 150; i++) {
      setTimeout(() => {
        if (this.isDestroyed) return;
        const c = document.createElement('div');
        c.className = 'confetti';
        c.style.cssText = `position:fixed;width:${Math.random() * 10 + 5}px;height:${Math.random() * 10 + 5}px;background-color:${clr[Math.random() * clr.length | 0]};left:${Math.random() * 100}vw;top:-20px;transform:rotate(${Math.random() * 360}deg);animation:confettiFall ${2 + Math.random() * 2}s ease-out forwards;pointer-events:none;z-index:99999;border-radius:${Math.random() > 0.5 ? '50%' : '0'};`;
        document.body.appendChild(c);
        setTimeout(() => c.remove(), 4000);
      }, i * 10);
    }
  }

  // --- SPARKLES ---
  createSparkles() {
    this.isDestroyed = false; // [FIX] Hồi sinh service
    if (!this.isBrowser) return;

    for (let i = 0; i < 30; i++) {
      setTimeout(() => {
        if (this.isDestroyed) return;
        const s = document.createElement('div');
        s.innerHTML = '✨';
        s.style.cssText = `position:fixed;left:${50 + (Math.random() - 0.5) * 30}%;top:${50 + (Math.random() - 0.5) * 30}%;font-size:${20 + Math.random() * 20}px;pointer-events:none;z-index:100000;animation:sparkleBurst 1.5s ease-out forwards;`;
        document.body.appendChild(s);
        setTimeout(() => s.remove(), 1500);
      }, i * 30);
    }
  }

  // --- SNOW ---
  createSnow(c: number) {
    this.isDestroyed = false; // [FIX] Hồi sinh service
    if (!this.isBrowser) return;

    const ct = document.getElementById('snow-container');
    if (!ct) return;

    const sh = ['❄️', '❅', '❆'];
    for (let i = 0; i < c; i++) {
      const d = document.createElement('div');
      d.className = 'snowflake';
      d.innerHTML = sh[Math.random() * sh.length | 0];
      const x = Math.random() * 100, y = -10 - Math.random() * 20;
      d.style.cssText = `position:absolute;left:${x}vw;top:${y}vh;font-size:${15 + Math.random() * 15}px;opacity:${0.6 + Math.random() * 0.4};color:white;pointer-events:none;z-index:9998;`;
      ct.appendChild(d);
      this.snowflakes.push({ element: d, x, y, speed: 0.3 + Math.random() * 0.6, rotation: Math.random() * 360, rotationSpeed: (Math.random() - 0.5) * 2 });
    }

    if (!this.snowInterval) {
      this.snowInterval = setInterval(() => {
        // Chỉ tạo thêm nếu chưa bị destroy
        if (!this.isDestroyed && this.snowflakes.length < 80) this.createSnow(3);
      }, 3500);
    }
  }

  startSnowAnimation() {
    this.isDestroyed = false; // [FIX] Hồi sinh service
    if (!this.isBrowser) return;

    const anim = () => {
      if (this.isDestroyed) return; // Nếu bị destroy thì dừng loop

      for (let i = this.snowflakes.length - 1; i >= 0; i--) {
        const s = this.snowflakes[i];
        s.y += s.speed;
        s.rotation += s.rotationSpeed;
        s.element.style.transform = `translate(${Math.sin(s.y * 0.085) * 2}px, ${s.y}vh) rotate(${s.rotation}deg)`;
        if (s.y > 120) {
          s.element.remove();
          this.snowflakes.splice(i, 1);
        }
      }
      this.animationId = requestAnimationFrame(anim);
    };
    anim();
  }

  // --- FIREWORKS ---
  triggerFireworks(playSfxCallback: (name: 'firework') => void, opts: { bursts?: number; duration?: number; strong?: boolean } = {}) {
    this.isDestroyed = false; // [FIX] Hồi sinh service
    if (!this.isBrowser) return;

    const canvasEl = document.getElementById('fireworks-canvas') as HTMLCanvasElement;
    if (!canvasEl) {
      console.warn('Không tìm thấy canvas pháo hoa!');
      return;
    }

    this.fwCanvas = canvasEl;
    this.fwCtx = canvasEl.getContext('2d');

    this.resizeCanvas();
    window.addEventListener('resize', this.resizeCanvasBound);

    this.startFireworks(playSfxCallback, opts.bursts ?? 8, opts.strong ?? false);

    setTimeout(() => {
      if (!this.isDestroyed) {
        this.stopFireworks();
      }
    }, (opts.duration ?? 6000) + 500);
  }

  private resizeCanvasBound = () => { this.resizeCanvas(); }

  private resizeCanvas() {
    if (!this.fwCanvas) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const r = window.devicePixelRatio || 1;
    this.fwCanvas.width = Math.floor(w * r);
    this.fwCanvas.height = Math.floor(h * r);
    this.fwCanvas.style.width = w + 'px';
    this.fwCanvas.style.height = h + 'px';
    if (this.fwCtx) this.fwCtx.setTransform(r, 0, 0, r, 0, 0);
  }

  private startFireworks(playSfxCallback: (name: 'firework') => void, bursts = 8, strong = false) {
    if (!this.fwCtx || !this.fwCanvas) return;
    this.fwActive = true;
    this.fwParticles = [];
    const width = window.innerWidth;
    const height = window.innerHeight;

    for (let b = 0; b < bursts; b++) {
      setTimeout(() => {
        if (!this.fwActive || this.isDestroyed) return;
        this.createBurst(
          Math.random() * width,
          Math.random() * height * 0.5 + height * 0.1,
          strong ? 120 : 80
        );
        playSfxCallback('firework');
      }, b * (strong ? 250 : 350));
    }

    const loop = () => {
      if (!this.fwCtx || !this.fwCanvas || !this.fwActive) return;
      const c = this.fwCtx;
      c.globalCompositeOperation = 'destination-out';
      c.fillStyle = 'rgba(0, 0, 0, 0.1)';
      c.fillRect(0, 0, this.fwCanvas.width, this.fwCanvas.height);
      c.globalCompositeOperation = 'lighter';

      for (let i = this.fwParticles.length - 1; i >= 0; i--) {
        const p = this.fwParticles[i];
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.life--;

        c.beginPath();
        c.fillStyle = `rgba(${p.r},${p.g},${p.b},${Math.max(0, p.life / p.maxLife)})`;
        c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        c.fill();

        if (p.life <= 0 || p.y > this.fwCanvas.height + 50) this.fwParticles.splice(i, 1);
      }
      this.fwAnimId = requestAnimationFrame(loop);
    };

    if (this.fwAnimId) cancelAnimationFrame(this.fwAnimId);
    this.fwAnimId = requestAnimationFrame(loop);
  }

  private createBurst(cx: number, cy: number, count = 80) {
    const pal = [[255, 200, 0], [255, 120, 120], [180, 120, 255], [120, 220, 255], [120, 255, 140], [255, 140, 220]];
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2, s = (Math.random() * 4 + 2) * (Math.random() > 0.85 ? 1.6 : 1);
      const rc = pal[Math.random() * pal.length | 0];
      this.fwParticles.push({
        x: cx, y: cy, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.7 - 2,
        gravity: 0.06 + Math.random() * 0.05, life: 60 + Math.random() * 40, maxLife: 100,
        size: 1 + Math.random() * 3, r: rc[0], g: rc[1], b: rc[2]
      });
    }
  }

  private stopFireworks() {
    this.fwActive = false;
    if (this.fwAnimId) cancelAnimationFrame(this.fwAnimId);
    this.fwAnimId = undefined;
    this.fwParticles = [];
    if (this.fwCtx && this.fwCanvas) this.fwCtx.clearRect(0, 0, this.fwCanvas.width, this.fwCanvas.height);
    if (this.isBrowser) window.removeEventListener('resize', this.resizeCanvasBound);

    // Reset canvas reference
    this.fwCanvas = undefined;
    this.fwCtx = null;
  }

  destroy() {
    this.isDestroyed = true; // Đánh dấu đã hủy
    if (this.animationId && this.isBrowser) cancelAnimationFrame(this.animationId);
    if (this.snowInterval) clearInterval(this.snowInterval);
    this.snowflakes = [];
    this.stopFireworks();
  }
}
