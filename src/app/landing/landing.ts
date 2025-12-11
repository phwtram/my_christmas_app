import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject, AfterViewInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-landing',
  standalone: true,
  templateUrl: 'landing.html',
  imports: [RouterLink],
  styleUrls: ['./landing.css']
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.addButtonSoundEffects();
    }
  }

  ngOnDestroy(): void {}

  // ============================================
  // 🔊 SOUND EFFECTS
  // ============================================
  playClickSound(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 900;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  }

  playHoverSound(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 500;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.12, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.08);
  }

  addButtonSoundEffects(): void {
    const button = document.querySelector('.landing-btn');

    if (button) {
      button.addEventListener('mouseenter', () => {
        this.playHoverSound();
      });

      button.addEventListener('click', () => {
        this.playClickSound();
      });
    }
  }

  // ============================================
  // 🎨 NAVIGATION
  // ============================================
  goToCountdown(): void {
    this.playClickSound();
    setTimeout(() => {
      this.router.navigate(['/home']);
    }, 200);
  }
}
