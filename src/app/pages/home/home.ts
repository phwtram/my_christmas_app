import { Component, OnInit, AfterViewInit, OnDestroy, Inject, PLATFORM_ID, NgZone, ChangeDetectorRef, Renderer2 } from '@angular/core';
import { isPlatformBrowser, NgIf, NgFor, NgClass, UpperCasePipe } from '@angular/common';

interface Snowflake { element: HTMLDivElement; x: number; y: number; speed: number; rotation: number; rotationSpeed: number; }
interface ChristmasCard { id: number; theme: string; color: string; icon: string; title: string; message: string; decorations: string[]; }
interface CalendarDay { day: number; isOpen: boolean; isLocked: boolean; isShaking: boolean; content: string; image: string; title: string; type: 'gift'|'message'|'song'; rarity: 'common'|'rare'|'epic'|'legendary'; }

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
  standalone: true,
  imports: [NgIf, NgFor, NgClass, UpperCasePipe]
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  currentView: any = 'gifts'; isBrowser: boolean; private isDestroyed = false;
  calendarDays: CalendarDay[] = []; weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']; emptySlots: number[] = [];
  selectedCalendarItem: CalendarDay | null = null; showCalendarPopup = false; collectedCount = 0;
  showReindeerFly = false; showFireworks = false; showGifts = false; showCard = false;
  currentCard: ChristmasCard | null = null; typingText = ''; showCursor = true; isOpening = false; isMusicPlaying = false; selectedGiftIndex = -1;

  private snowflakes: Snowflake[] = []; private animationId?: number; private snowInterval?: any;
  private typingInterval?: any; private cursorInterval?: any; private countdownInterval?: any;
  private bgMusic?: HTMLAudioElement; private howlerMusic?: HTMLAudioElement;

  daysUntilChristmas = 0; hoursUntilChristmas = 0; minutesUntilChristmas = 0; secondsUntilChristmas = 0;
  private audioCtx: AudioContext | null = null;
  private SOUND_BELL = '/assets/sound/bell.wav'; private SOUND_SANTA = '/assets/sound/santa.mp3'; private BG_XMAS_MUSIC = '/assets/sound/christmas.mp3';
  private audioBuffers: { [k: string]: AudioBuffer | null } = { bell: null, boom: null, santa: null };

  public cards: ChristmasCard[] = [
    { id: 1, theme: 'santa', color: 'linear-gradient(135deg, #ff6b6b 0%, #c92a2a 100%)', icon: '🎅', title: 'Merry Christmas!', message: 'Chúc bạn có một mùa Giáng sinh ấm áp bên gia đình và người thân!', decorations: ['❄️', '🎄', '⭐', '🎁'] },
    { id: 2, theme: 'snowman', color: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)', icon: '⛄', title: 'Season\'s Greetings', message: 'Giáng sinh là thời gian để yêu thương và chia sẻ.', decorations: ['❄️', '☃️', '✨', '💝'] },
    { id: 3, theme: 'tree', color: 'linear-gradient(135deg, #38b000 0%, #2d8659 100%)', icon: '🎄', title: 'Joy to the World', message: 'Hy vọng Giáng sinh này sẽ mang đến cho bạn những kỷ niệm đẹp nhất!', decorations: ['🎄', '🌟', '🎀', '🔔'] },
    { id: 4, theme: 'gift', color: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)', icon: '🎁', title: 'Best Wishes', message: 'Mong rằng những điều kỳ diệu của Giáng sinh sẽ đến với bạn!', decorations: ['🎁', '🎊', '🎉', '✨'] },
    { id: 5, theme: 'reindeer', color: 'linear-gradient(135deg, #8e44ad 0%, #5e3370 100%)', icon: '🦌', title: 'Reindeer Blessing', message: 'Chúc bạn một mùa lễ tràn đầy tiếng cười và niềm vui hạnh phúc.', decorations: ['✨', '❄️', '🦌', '🎀'] },
    { id: 6, theme: 'candle', color: 'linear-gradient(135deg, #ff9a3c 0%, #ff6f3c 100%)', icon: '🕯️', title: 'Warm Light', message: 'Mong ánh nến Giáng sinh đem lại cho bạn sự bình yên.', decorations: ['🕯️', '✨', '💫', '🌟'] },
    { id: 7, theme: 'angel', color: 'linear-gradient(135deg, #74ebd5 0%, #9face6 100%)', icon: '👼', title: 'Angel Blessings', message: 'Chúc bạn được che chở bởi những thiên thần may mắn.', decorations: ['👼', '🌟', '✨', '☁️'] },
    { id: 8, theme: 'ginger', color: 'linear-gradient(135deg, #d35400 0%, #e67e22 100%)', icon: '🍪', title: 'Sweet Holiday', message: 'Hy vọng mùa Giáng sinh này sẽ ngọt ngào như chiếc bánh quy.', decorations: ['🍪', '✨', '🎄', '⭐'] },
    { id: 9, theme: 'bell', color: 'linear-gradient(135deg, #f1c40f 0%, #f39c12 100%)', icon: '🔔', title: 'Jingle Bells!', message: 'Mong rằng mỗi ngày trôi qua đều tặng bạn một lý do để mỉm cười và tin rằng điều đẹp đẽ vẫn luôn chờ phía trước.', decorations: ['🔔', '✨', '🎶', '🎄'] },
    { id: 10, theme: 'stars', color: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', icon: '🌠', title: 'Starry Night', message: 'Dưới bầu trời đầy sao, mong bạn tìm thấy những ước mơ đẹp nhất.', decorations: ['🌠', '⭐', '✨', '❄️'] },
    { id: 11, theme: 'candycane', color: 'linear-gradient(135deg, #ff4e50 0%, #f9d423 100%)', icon: '🍭', title: 'Sweet Wishes', message: 'Giáng sinh về mang theo ánh sáng dịu dàng, mong trái tim bạn cũng được thắp lên bởi niềm vui và hy vọng."', decorations: ['🍭', '🎀', '✨', '🎄'] },
    { id: 12, theme: 'lights', color: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)', icon: '💡', title: 'Bright Moments', message: 'Chúc ánh đèn Giáng sinh thắp sáng tương lai rực rỡ của bạn.', decorations: ['💡', '✨', '🌟', '🎄'] },
    { id: 13, theme: 'snowglobe', color: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)', icon: '🫙', title: 'Snowglobe Magic', message: 'Chúc bạn có một mùa Giáng sinh thật nhiệm màu.', decorations: ['❄️', '✨', '🫙', '🌟'] },
    { id: 14, theme: 'sock', color: 'linear-gradient(135deg, #e17055 0%, #d63031 100%)', icon: '🧦', title: 'Warm Socks', message: 'Ông già Noel sẽ đặt vào chiếc tất này thật nhiều may mắn dành cho bạn.', decorations: ['🧦', '🎁', '✨', '🎄'] },
    { id: 15, theme: 'bear', color: 'linear-gradient(135deg, #a8e6cf 0%, #3dccc7 100%)', icon: '🐻‍❄️', title: 'Polar Hugs', message: 'Chúc bạn luôn tìm thấy bình yên giữa bộn bề, và những khoảnh khắc yêu thương sẽ sưởi ấm cả mùa đông này.', decorations: ['❄️', '🐻‍❄️', '🧊', '✨'] },
    { id: 16, theme: 'ribbon', color: 'linear-gradient(135deg, #fd79a8 0%, #e84393 100%)', icon: '🎀', title: 'Beautiful You', message: 'Bạn chính là món quà đẹp nhất của thế giới này. Hãy luôn tỏa sáng nhé!', decorations: ['🎀', '💝', '✨', '💖'] },
    { id: 17, theme: 'calendar', color: 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)', icon: '📅', title: 'New Year', message: 'Sắp sang năm mới rồi, chúc bạn gác lại âu lo để đón chờ những khởi đầu mới.', decorations: ['📅', '🎆', '✨', '⏰'] },
    { id: 18, theme: 'home', color: 'linear-gradient(135deg, #fab1a0 0%, #e17055 100%)', icon: '🏠', title: 'Home Sweet Home', message: 'Không đâu bằng nhà. Chúc bạn có những giây phút bình yên bên mâm cơm gia đình.', decorations: ['🏠', '🍲', '❤️', '👨‍👩‍👧‍👦'] },
    { id: 19, theme: 'music', color: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)', icon: '🎶', title: 'Melody of Joy', message: 'Mong cuộc đời bạn luôn vang lên những giai điệu vui tươi như bài nhạc Giáng sinh.', decorations: ['🎶', '🎸', '🎹', '🎼'] },
    { id: 20, theme: 'love', color: 'linear-gradient(135deg, #ff7675 0%, #d63031 100%)', icon: '❤️', title: 'Love & Peace', message: 'Chúc trái tim bạn luôn đong đầy tình yêu thương và sự an yên.', decorations: ['❤️', '💌', '🌹', '✨'] }
  ];

  // Fireworks
  private fwCanvas?: HTMLCanvasElement; private fwCtx?: CanvasRenderingContext2D | null; private fwAnimId?: number; private fwParticles: any[] = []; private fwActive = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private ngZone: NgZone, private cdr: ChangeDetectorRef, private renderer: Renderer2) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    this.calculateCountdown(); this.generateCalendarData();
    if (this.isBrowser) { this.loadProgress(); this.restoreSessionState(); }
  }

  ngAfterViewInit() {
    if (!this.isBrowser) return;
    this.initAudioSystem();
    if (this.isMusicPlaying) setTimeout(() => this.tryPlayMusic(), 500);
    this.startCountdown(); this.startCursorBlink();
    setTimeout(() => { if (!this.isDestroyed) { this.createSnow(30); this.startSnowAnimation(); } }, 200);
  }

  ngOnDestroy() {
    this.isDestroyed = true;
    if (this.animationId && this.isBrowser) cancelAnimationFrame(this.animationId);
    [this.snowInterval, this.countdownInterval, this.typingInterval, this.cursorInterval].forEach(i => i && clearInterval(i));
    if (this.bgMusic) { this.bgMusic.pause(); this.bgMusic = undefined; }
    this.stopFireworks(); this.snowflakes = [];
  }

  restoreSessionState() {
    if (!this.isBrowser) return;
    const v = localStorage.getItem('christmas_current_view'), m = localStorage.getItem('christmas_music_on');
    if (v === 'gifts' || v === 'calendar') this.currentView = v;
    this.isMusicPlaying = (m === 'true' || m === null);
  }

  switchView(view: any) {
    this.playSFX('click'); this.currentView = view;
    if (this.isBrowser) localStorage.setItem('christmas_current_view', view);
  }

  saveProgress() {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem('christmas_opened_days', JSON.stringify(this.calendarDays.filter(d => d.isOpen).map(d => d.day)));
      this.updateCollectedCount();
    } catch (e) { console.warn(e); }
  }

  loadProgress() {
    if (!this.isBrowser) return;
    try {
      const d = JSON.parse(localStorage.getItem('christmas_opened_days') || '[]');
      this.calendarDays.forEach(day => { if (d.includes(day.day)) day.isOpen = true; });
      this.updateCollectedCount();
    } catch (e) { console.warn(e); }
  }

  updateCollectedCount() { this.collectedCount = this.calendarDays.filter(d => d.isOpen).length; }

  generateCalendarData() {
    const items = [
      {t: "Chào Tháng 12", i: "❄️", m: "Gió lạnh về rồi, nhớ mặc thêm áo ấm khi ra đường nhé.", r: 'common'},
      {t: "Cốc Nước Ấm", i: "☕", m: "Thời tiết hanh khô, nhớ uống đủ nước để da dẻ luôn hồng hào.", r: 'common'},
      {
        t: "Giấc Ngủ Sớm",
        i: "🌙",
        m: "Đừng thức khuya chạy deadline quá, sức khỏe mới là món quà quý giá nhất.",
        r: 'epic'
      },
      {t: "Vitamin C", i: "🍊", m: "Ăn thêm chút hoa quả để tăng đề kháng, đừng để bị ốm nhé.", r: 'common'},
      {
        t: "Dọn Dẹp",
        i: "🧹",
        m: "F5 lại góc làm việc một chút, không gian thoáng đãng thì tâm trạng mới vui.",
        r: 'common'
      },
      {t: "Lời nhắc", i: "📞", m: "Bạn quan trọng lắm. Nhớ đối xử tử tế với chính mình.", r: 'epic'},
      {
        t: "Cuối Tuần",
        i: "🛌",
        m: "Bạn đã vất vả cả tuần rồi, hôm nay hãy cho phép bản thân ngủ nướng thêm xíu.",
        r: 'rare'
      },
      {
        t: "Quyển Sách Hay",
        i: "📖",
        m: "Tạm rời xa điện thoại, đọc vài trang sách để tâm hồn tĩnh lặng hơn.",
        r: 'epic'
      },
      {t: "Kem Dưỡng Da", i: "🧴", m: "Đừng để đôi tay bị nứt nẻ, nhớ thoa kem dưỡng ẩm nhé.", r: 'common'},
      {t: "Bản Nhạc", i: "🎷", m: "Hôm nay là ngày hoàn hảo để nghe một bài nhạc Giáng Sinh nè.", r: 'rare'},
      {
        t: "Món Ngon",
        i: "🍜",
        m: "Đừng ăn uống qua loa, hôm nay hãy tự thưởng cho mình một bữa thật ngon.",
        r: 'common'
      },
      {t: "Nụ Cười", i: "😊", m: "Mỉm cười trước gương nào! Bạn xinh đẹp nhất khi bạn vui vẻ.", r: 'common'},
      {t: "Cafe Sáng", i: "☕", m: "Một chút cafein cho ngày mới tỉnh táo, cố gắng lên nhé!", r: 'rare'},
      {
        t: "Sổ Tay",
        i: "✍️",
        m: "Viết ra những điều làm bạn lo lắng, rồi gạch bỏ nó đi. Mọi chuyện sẽ ổn thôi.",
        r: 'epic'
      },
      {t: "Đi Dạo", i: "👟", m: "Ra ngoài hít thở khí trời một chút, đừng ngồi lỳ trong phòng mãi thế.", r: 'legendary'},
      {t: "Tha Thứ", i: "🕊️", m: "Cuối năm rồi, chuyện buồn cũ hãy bỏ qua để đón những niềm vui mới.", r: 'common'},
      {t: "Tiết Kiệm", i: "🐷", m: "Mua sắm vừa đủ thôi, để dành một khoản nhỏ cho dự định năm sau nhé.", r: 'common'},
      {t: "Nến Thơm", i: "🕯️", m: "Đốt chút nến thơm, ánh sáng ấm áp sẽ làm dịu đi mọi âu lo.", r: 'epic'},
      {t: "Tấm Ảnh Cũ", i: "📸", m: "Xem lại vài tấm ảnh hồi bé, bạn đã trưởng thành rất ngoạn mục đấy.", r: 'common'},
      {t: "Cái Ôm", i: "🫂", m: "Nếu mệt quá, hãy tìm một bờ vai tin cậy để dựa vào. Bạn không cô đơn đâu.", r: 'rare'},
      {t: "Lời Cảm Ơn", i: "💌", m: "Gửi lời cảm ơn đến những người đã giúp đỡ bạn trong năm qua.", r: 'common'},
      {t: "Tự Thưởng", i: "🎁", m: "Mua tặng bản thân một món quà nhỏ, vì bạn xứng đáng được yêu thương.", r: 'epic'},
      {
        t: "Bình Yên",
        i: "✨",
        m: "Mong rằng mọi bão giông sẽ dừng sau cánh cửa, trả lại cho bạn sự bình yên.",
        r: 'epic'
      }
    ];
    this.emptySlots = [];
    const now = new Date();
    const cm = now.getMonth() + 1;
    const cd = now.getDate();
    for (let i = 1; i <= 31; i++) {
      let d = items[(i - 1) % items.length], r = d.r as any;
      // --- LỜI CHÚC ĐẶC BIỆT ---
      if (i === 24) {
        d = {
          t: "Đêm Thánh Vô Cùng",
          i: "🌙",
          m: "Đêm nay,nguyện cầu cho bạn tìm thấy một góc bình yên sâu thẳm trong tâm hồn, cảm nhận được hơi ấm từ những người thương yêu nhất. Merry Christmas Eve!",
          r: 'legendary'
        };
        r = 'legendary';
      }

      if (i === 25) {
        d = {
          t: "MERRY CHRISTMAS!",
          i: "🎅",
          m: "Giáng sinh đã thực sự gõ cửa rồi! Cảm ơn bạn vì đã luôn kiên cường, nỗ lực và tử tế trong suốt một năm đầy biến động vừa qua.Sự hiện diện của bạn chính là món quà tuyệt vời nhất của thế giới này. Chúc cuộc sống của bạn luôn rực rỡ như ánh đèn lễ hội, ngọt ngào như ly cacao nóng và ngập tràn tiếng cười hạnh phúc. Chúc mừng Giáng sinh an lành!",
          r: 'legendary'
        };
        r = 'legendary';
      }
      this.calendarDays.push({
        day: i,
        isOpen: false,
        isLocked: (cm === 12 && i > cd),
        isShaking: false,
        content: d.m,
        image: d.i,
        title: d.t,
        type: i === 25 ? 'gift' : 'message',
        rarity: r
      });
      //   const testLocked = (i === 24 || i === 25) ? false : (cm === 12 && i > cd);
      //
      //   this.calendarDays.push({ day: i, isOpen: false, isLocked: testLocked, isShaking: false, content: d.m, image: d.i, title: d.t, type: i === 25 ? 'gift' : 'message', rarity: r });
      // }
    }
  }

  openCalendarDoor(d: CalendarDay) {
    if (d.isLocked) { this.playSFX('locked'); d.isShaking = true; setTimeout(() => { if (!this.isDestroyed) { d.isShaking = false; this.cdr.markForCheck(); } }, 500); return; }
    if (d.isOpen) { this.playSFX('click'); this.selectedCalendarItem = d; this.showCalendarPopup = true; return; }
    this.playSFX('open');
    if (d.day === 24) { this.triggerReindeerFly(); this.playSFX('bell'); }
    else if (d.day === 25) { this.triggerReindeerFly(); this.triggerFireworks({ bursts: 12, duration: 10000, strong: true }); this.playSFX('santa'); this.createSnow(60); }
    else { this.createConfetti(); }
    d.isOpen = true; this.selectedCalendarItem = d; this.showCalendarPopup = true; this.updateCollectedCount(); this.saveProgress();
  }

  closeCalendarPopup() { this.playSFX('click'); this.showCalendarPopup = false; this.selectedCalendarItem = null; }

  triggerReindeerFly() {
    this.showReindeerFly = false;
    setTimeout(() => { if (!this.isDestroyed) { this.showReindeerFly = true; this.cdr.markForCheck(); } }, 30);
    setTimeout(() => { if (!this.isDestroyed) { this.showReindeerFly = false; this.cdr.markForCheck(); } }, 9000);
  }

  triggerFireworks(opts: { bursts?: number; duration?: number; strong?: boolean } = {}) {
    if (!this.isBrowser) return;
    this.showFireworks = true; this.cdr.markForCheck();
    setTimeout(() => { if (!this.isDestroyed) { this.setupFireworksCanvas(); this.startFireworks(opts.bursts ?? 8, opts.strong ?? false); } }, 50);
    setTimeout(() => { if (!this.isDestroyed) { this.stopFireworks(); this.showFireworks = false; this.cdr.markForCheck(); } }, (opts.duration ?? 6000) + 500);
  }

  initAudioSystem() {
    if (!this.isBrowser) return;
    try { const A = window.AudioContext || (window as any).webkitAudioContext; if (A) this.audioCtx = new A(); } catch (e) { this.audioCtx = null; }
    this.howlerMusic = new Audio(this.BG_XMAS_MUSIC); this.howlerMusic.loop = true; this.howlerMusic.volume = 0.35;
    if (this.audioCtx) { this.loadAudioBuffer(this.SOUND_BELL, 'bell'); this.loadAudioBuffer(this.SOUND_SANTA, 'santa'); }
  }

  toggleMusic() {
    if (!this.isBrowser) return; if (!this.howlerMusic) this.initAudioSystem();
    if (this.isMusicPlaying) { this.howlerMusic?.pause(); this.isMusicPlaying = false; }
    else { this.howlerMusic?.play().catch(()=>{}); this.isMusicPlaying = true; }
    localStorage.setItem('christmas_music_on', String(this.isMusicPlaying));
  }

  async tryPlayMusic() {
    if (!this.isBrowser || !this.howlerMusic) return;
    try { await this.howlerMusic.play(); this.isMusicPlaying = true; this.cdr.markForCheck(); localStorage.setItem('christmas_music_on', 'true'); }
    catch (e) {
      console.log('Autoplay blocked');
      const rm = this.renderer.listen('document', 'click', () => {
        this.howlerMusic?.play().then(() => { this.isMusicPlaying = true; this.cdr.markForCheck(); localStorage.setItem('christmas_music_on', 'true'); });
        if (this.audioCtx?.state === 'suspended') this.audioCtx.resume(); rm();
      });
    }
  }

  private async loadAudioBuffer(url: string, k: 'bell' | 'boom' | 'santa') {
    if (!this.audioCtx) return;
    try { const r = await fetch(url), b = await this.audioCtx.decodeAudioData(await r.arrayBuffer()); this.audioBuffers[k] = b; } catch (e) { this.audioBuffers[k] = null; }
  }

  private playBuffer(k: 'bell'|'boom'|'santa', o: { gain?: number; playbackRate?: number } = {}) {
    if (!this.isBrowser) return;
    if (!this.audioCtx || !this.audioBuffers[k]) { const a = new Audio(k==='santa'?this.SOUND_SANTA:this.SOUND_BELL); if(k==='santa') a.volume=1; a.play().catch(()=>{}); return; }
    const s = this.audioCtx.createBufferSource(), g = this.audioCtx.createGain();
    s.buffer = this.audioBuffers[k]; if (o.playbackRate) s.playbackRate.value = o.playbackRate;
    g.gain.value = o.gain ?? (k === 'santa' ? 0.8 : 0.4); s.connect(g); g.connect(this.audioCtx.destination); s.start();
  }

  playSFX(t: string) {
    if (!this.isBrowser) return; if(!this.audioCtx) this.initAudioSystem();
    if (t === 'bell' || t === 'santa') { this.playBuffer(t as any, { gain: t==='santa'?1:0.5 }); return; }
    const c = this.audioCtx; if (!c) return; const n = c.currentTime;
    if (t === 'click') { const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(800, n); o.frequency.exponentialRampToValueAtTime(100, n+0.05); g.gain.setValueAtTime(0.3, n); g.gain.exponentialRampToValueAtTime(0.001, n+0.05); o.connect(g); g.connect(c.destination); o.start(); o.stop(n+0.05); }
    if (t==='locked') { const o = c.createOscillator(), g = c.createGain(); o.type='sawtooth'; o.frequency.value=160; g.gain.value=0.12; o.connect(g); g.connect(c.destination); o.start(); o.stop(n+0.16); }
    if (t==='open') { const o = c.createOscillator(), g = c.createGain(); o.type='sine'; o.frequency.value=400; g.gain.value=0.12; o.connect(g); g.connect(c.destination); o.start(); o.stop(n+0.28); }
    if (t === 'firework') { const o = c.createOscillator(), g = c.createGain(); o.type = 'square'; o.frequency.setValueAtTime(150, n); o.frequency.exponentialRampToValueAtTime(40, n+0.1); g.gain.setValueAtTime(0.1, n); g.gain.exponentialRampToValueAtTime(0.01, n+0.1); o.connect(g); g.connect(c.destination); o.start(); o.stop(n+0.15); }
  }

  playClick() { this.playSFX('click'); } playHover() { /* opt */ }
  startCursorBlink() { if (this.isBrowser) this.cursorInterval = setInterval(() => { this.showCursor = !this.showCursor; this.cdr.markForCheck(); }, 500); }
  startTypingEffect(m: string) { this.typingText = ''; let i = 0; if (this.typingInterval) clearInterval(this.typingInterval); this.typingInterval = setInterval(() => { if (i < m.length) { this.typingText += m[i++]; this.cdr.markForCheck(); } else clearInterval(this.typingInterval); }, 40); }
  revealGifts() { this.playClick(); this.showGifts = true; this.tryPlayMusic(); }
  openCard(i: number) { this.playClick(); this.selectedGiftIndex = i; this.isOpening = true; this.currentCard = this.cards[Math.floor(Math.random()*this.cards.length)]; setTimeout(() => { if (!this.isDestroyed) { this.isOpening = false; this.showCard = true; setTimeout(() => { if (!this.isDestroyed) { if (this.currentCard) this.startTypingEffect(this.currentCard.message); this.createConfetti(); this.createSparkles(); } }, 100); } }, 800); }
  resetCard() { this.playClick(); this.showCard = false; this.showGifts = true; this.currentCard = null; this.typingText = ''; if (this.typingInterval) clearInterval(this.typingInterval); }

  createConfetti() {
    if (!this.isBrowser) return; const clr = ['#ff6b6b', '#ffd700', '#4ecdc4', '#ff69b4', '#00ff00', '#00bfff'];
    for (let i = 0; i < 150; i++) setTimeout(() => { if (this.isDestroyed) return; const c = document.createElement('div'); c.className = 'confetti'; c.style.cssText = `position:fixed;width:${Math.random()*10+5}px;height:${Math.random()*10+5}px;background-color:${clr[Math.random()*clr.length|0]};left:${Math.random()*100}vw;top:-20px;transform:rotate(${Math.random()*360}deg);animation:confettiFall ${2+Math.random()*2}s ease-out forwards;pointer-events:none;z-index:99999;border-radius:${Math.random()>0.5?'50%':'0'};`; document.body.appendChild(c); setTimeout(() => c.remove(), 4000); }, i * 10);
  }
  createSparkles() { if (!this.isBrowser) return; for (let i = 0; i < 30; i++) setTimeout(() => { if (this.isDestroyed) return; const s = document.createElement('div'); s.innerHTML = '✨'; s.style.cssText = `position:fixed;left:${50+(Math.random()-0.5)*30}%;top:${50+(Math.random()-0.5)*30}%;font-size:${20+Math.random()*20}px;pointer-events:none;z-index:100000;animation:sparkleBurst 1.5s ease-out forwards;`; document.body.appendChild(s); setTimeout(() => s.remove(), 1500); }, i * 30); }
  createSnow(c: number) { if (!this.isBrowser) return; const ct = document.getElementById('snow-container'); if (!ct) return; const sh = ['❄️', '❅', '❆']; for (let i = 0; i < c; i++) { const d = document.createElement('div'); d.className = 'snowflake'; d.innerHTML = sh[Math.random()*sh.length|0]; const x = Math.random()*100, y = -10-Math.random()*20; d.style.cssText = `position:absolute;left:${x}vw;top:${y}vh;font-size:${15+Math.random()*15}px;opacity:${0.6+Math.random()*0.4};color:white;pointer-events:none;z-index:9998;`; ct.appendChild(d); this.snowflakes.push({ element: d, x, y, speed: 0.3+Math.random()*0.6, rotation: Math.random()*360, rotationSpeed: (Math.random()-0.5)*2 }); } if (!this.snowInterval) this.snowInterval = setInterval(() => { if (!this.isDestroyed && this.snowflakes.length < 80) this.createSnow(3); }, 3500); }
  startSnowAnimation() { if (!this.isBrowser) return; const anim = () => { if (this.isDestroyed) return; for (let i = this.snowflakes.length - 1; i >= 0; i--) { const s = this.snowflakes[i]; s.y += s.speed; s.rotation += s.rotationSpeed; s.element.style.transform = `translate(${Math.sin(s.y * 0.085) * 2}px, ${s.y}vh) rotate(${s.rotation}deg)`; if (s.y > 120) { s.element.remove(); this.snowflakes.splice(i, 1); } } this.animationId = requestAnimationFrame(anim); }; anim(); }

  private setupFireworksCanvas() { if (!this.isBrowser || (this.fwCanvas && this.fwCtx)) return; this.fwCanvas = document.getElementById('fireworks-canvas') as HTMLCanvasElement; if (!this.fwCanvas) return; this.fwCtx = this.fwCanvas.getContext('2d'); this.resizeCanvas(); window.addEventListener('resize', this.resizeCanvasBound); }
  private resizeCanvasBound = () => { this.resizeCanvas(); }
  private resizeCanvas() { if (!this.fwCanvas) return; const r = window.devicePixelRatio || 1, w = this.fwCanvas.clientWidth, h = this.fwCanvas.clientHeight; this.fwCanvas.width = Math.floor(w*r); this.fwCanvas.height = Math.floor(h*r); if (this.fwCtx) this.fwCtx.setTransform(r,0,0,r,0,0); }
  private startFireworks(bursts=8, strong=false) { if (!this.fwCtx || !this.fwCanvas) return; this.fwActive = true; this.fwParticles = []; const rect = this.fwCanvas.getBoundingClientRect(); for (let b = 0; b < bursts; b++) setTimeout(() => { if (!this.fwActive || this.isDestroyed) return; this.createBurst(Math.random()*rect.width, Math.random()*rect.height*0.6+rect.height*0.2, strong?120:80); this.playSFX('firework'); }, b*(strong?250:350)); const loop = () => { if (!this.fwCtx || !this.fwCanvas || !this.fwActive) return; const c = this.fwCtx; c.clearRect(0,0,this.fwCanvas.width,this.fwCanvas.height); c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(0,0,this.fwCanvas.width,this.fwCanvas.height); for (let i = this.fwParticles.length - 1; i >= 0; i--) { const p = this.fwParticles[i]; p.vy += p.gravity; p.x += p.vx; p.y += p.vy; p.life--; c.beginPath(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(${p.r},${p.g},${p.b},${Math.max(0, p.life/p.maxLife)})`; c.arc(p.x, p.y, p.size, 0, Math.PI*2); c.fill(); if (p.life<=0 || p.y>this.fwCanvas.height+50) this.fwParticles.splice(i,1); } this.fwAnimId = requestAnimationFrame(loop); }; this.fwAnimId = requestAnimationFrame(loop); }
  private createBurst(cx: number, cy: number, count=80) { const pal = [[255,200,0], [255,120,120], [180,120,255], [120,220,255], [120,255,140], [255,140,220]]; for (let i = 0; i < count; i++) { const a = Math.random()*Math.PI*2, s = (Math.random()*4+2)*(Math.random()>0.85?1.6:1), rc = pal[Math.random()*pal.length|0]; this.fwParticles.push({ x:cx, y:cy, vx:Math.cos(a)*s, vy:Math.sin(a)*s*0.7-2, gravity:0.06+Math.random()*0.05, life:60+Math.random()*40, maxLife:100, size:1+Math.random()*3, r:rc[0], g:rc[1], b:rc[2] }); } }
  private stopFireworks() { this.fwActive = false; if (this.fwAnimId) cancelAnimationFrame(this.fwAnimId); this.fwAnimId = undefined; this.fwParticles = []; if (this.fwCtx && this.fwCanvas) this.fwCtx.clearRect(0,0,this.fwCanvas.width,this.fwCanvas.height); if (this.isBrowser) window.removeEventListener('resize', this.resizeCanvasBound); }

  startCountdown() { if (this.countdownInterval) clearInterval(this.countdownInterval); this.countdownInterval = setInterval(() => { this.calculateCountdown(); this.cdr.markForCheck(); }, 1000); }
  calculateCountdown() { const n = new Date(), cy = n.getFullYear(); let x = new Date(cy, 11, 25); if (n > x) x = new Date(cy+1, 11, 25); const d = x.getTime() - n.getTime(); this.daysUntilChristmas = Math.max(0, Math.floor(d/(1000*60*60*24))); this.hoursUntilChristmas = Math.max(0, Math.floor((d%(1000*60*60*24))/(1000*60*60))); this.minutesUntilChristmas = Math.max(0, Math.floor((d%(1000*60*60))/(1000*60))); this.secondsUntilChristmas = Math.max(0, Math.floor((d%(1000*60))/1000)); }
}
