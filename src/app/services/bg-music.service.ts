import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class BgMusicService {
  private bgMusic: HTMLAudioElement | null = null;
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  initMusic() {
    if (!this.isBrowser) return;

    if (!this.bgMusic) {
      this.bgMusic = new Audio('/assets/sound/christmas.mp3');
      this.bgMusic.loop = true;
      this.bgMusic.volume = 0.5;
    }
  }

  play() {
    if (this.bgMusic) {
      this.bgMusic.play().catch(err => {
        console.warn('Autoplay blocked:', err);
      });
    }
  }
}
