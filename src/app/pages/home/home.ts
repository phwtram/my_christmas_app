import { Component, OnInit, AfterViewInit, OnDestroy, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser, NgIf, NgFor, NgClass, UpperCasePipe } from '@angular/common';
import { ChristmasCard, CalendarDay, CollectionMilestone } from '../../models/christmas.model';
import { AudioService } from '../../services/audio.service';
import { EffectService } from '../../services/effect.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
  standalone: true,
  imports: [NgIf, NgFor, NgClass, UpperCasePipe]
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  // --- STATE QUẢN LÝ VIEW ---
  currentView: any = 'gifts';
  isBrowser: boolean;
  private isDestroyed = false;

  // --- LỊCH & ĐẾM NGƯỢC ---
  calendarDays: CalendarDay[] = [];
  weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  emptySlots: number[] = [];
  selectedCalendarItem: CalendarDay | null = null;
  showCalendarPopup = false;

  daysUntilChristmas = 0; hoursUntilChristmas = 0; minutesUntilChristmas = 0; secondsUntilChristmas = 0;

  // --- SƯU TẦM (COLLECTION) ---
  collectedCount: number = 0;
  milestones: CollectionMilestone[] = [];
  showRewardPopup: boolean = false;
  currentReward: CollectionMilestone | null = null;

  // --- HIỆU ỨNG & THIỆP ---
  showReindeerFly = false;
  showFireworks = false;
  showGifts = false;
  showCard = false;
  currentCard: ChristmasCard | null = null;
  typingText = '';
  showCursor = true;
  isOpening = false;
  isMusicPlaying = false;
  selectedGiftIndex = -1;

  private typingInterval?: any;
  private cursorInterval?: any;
  private countdownInterval?: any;

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

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef,
    private audioService: AudioService,
    private effectService: EffectService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    this.audioService.init(); // Khởi tạo âm thanh
    this.calculateCountdown();
    this.generateCalendarData();
    this.initMilestones();
    if (this.isBrowser) {
      this.loadProgress();
      this.restoreSessionState();
    }
  }

  ngAfterViewInit() {
    if (!this.isBrowser) return;

    if (this.isMusicPlaying) setTimeout(() => this.audioService.tryPlayMusic(), 500);
    this.startCountdown();
    this.startCursorBlink();

    setTimeout(() => {
      if (!this.isDestroyed) {
        this.effectService.destroy();

        this.effectService.createSnow(30);
        this.effectService.startSnowAnimation();
        this.cdr.detectChanges();
      }
    }, 200);
  }

  ngOnDestroy() {
    this.isDestroyed = true;
    [this.countdownInterval, this.typingInterval, this.cursorInterval].forEach(i => i && clearInterval(i));
    this.effectService.destroy();
    this.audioService.stopMusic();
  }

  // --- LOGIC MỐC SƯU TẦM ---

  initMilestones() {
    this.milestones = [
      { level: 5, icon: '🍪', name: 'Nhà Sưu Tầm Tập Sự', description: 'Bạn đã thu thập được 5 mảnh ghép mùa đông!', isUnlocked: false, isClaimed: false },
      { level: 10, icon: '🧦', name: 'Chiếc Tất May Mắn', description: 'Đã đi được 1/3 chặng đường rồi!', isUnlocked: false, isClaimed: false },
      { level: 15, icon: '🦌', name: 'Bạn Của Tuần Lộc', description: 'Sự kiên trì của bạn thật đáng nể.', isUnlocked: false, isClaimed: false },
      { level: 20, icon: '☃️', name: 'Người Tuyết Vui Vẻ', description: 'Chỉ còn một chút nữa thôi!', isUnlocked: false, isClaimed: false },
      { level: 25, icon: '👑', name: 'HUYỀN THOẠI GIÁNG SINH', description: 'Chúc mừng! Bạn đã hoàn thành bộ sưu tập tháng 12!', isUnlocked: false, isClaimed: false, specialEffect: true }
    ];
  }

  checkMilestonesProgress(isInteractive: boolean = false) {
    this.collectedCount = this.calendarDays.filter(d => d.isOpen).length;
    let hasChanges = false;
    this.milestones.forEach(m => {
      if (this.collectedCount >= m.level && !m.isUnlocked) {
        m.isUnlocked = true;
        hasChanges = true;
        if (isInteractive) {
          this.triggerRewardPopup(m);
        }
      }
    });
    if (hasChanges) {
      this.saveProgress();
      this.cdr.markForCheck();
    }
  }

  triggerRewardPopup(m: CollectionMilestone) {
    this.currentReward = m;
    this.showRewardPopup = true;
    this.audioService.playSFX('collected');
    this.effectService.createConfetti();
  }

  claimReward(m: CollectionMilestone) {
    if (!m.isUnlocked || m.isClaimed) return;

    this.audioService.playSFX('click');
    m.isClaimed = true;
    this.currentReward = m;
    this.showRewardPopup = true;
    this.saveProgress();

    if (m.specialEffect) {
      this.audioService.tryPlayMusic();
      this.effectService.triggerFireworks((name) => this.audioService.playSFX(name), { bursts: 15, duration: 8000, strong: true });
    } else {
      this.effectService.createConfetti();
      this.effectService.createSparkles();
      this.audioService.playSFX('collected');
    }
  }

  closeRewardPopup() {
    this.showRewardPopup = false;
    this.currentReward = null;
    this.audioService.playSFX('click');
  }

  loadProgress() {
    if (!this.isBrowser) return;
    try {
      const d = JSON.parse(localStorage.getItem('christmas_opened_days') || '[]');
      this.calendarDays.forEach(day => { if (d.includes(day.day)) day.isOpen = true; });
      const mSaved = JSON.parse(localStorage.getItem('christmas_milestones') || '[]');
      if (mSaved.length > 0) {
        this.milestones.forEach(milestone => {
          const saved = mSaved.find((x: any) => x.level === milestone.level);
          if (saved) milestone.isClaimed = saved.isClaimed;
        });
      }
      this.checkMilestonesProgress(false);
    } catch (e) { console.warn(e); }
  }

  saveProgress() {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem('christmas_opened_days', JSON.stringify(this.calendarDays.filter(d => d.isOpen).map(d => d.day)));
      const milestoneState = this.milestones.map(m => ({ level: m.level, isClaimed: m.isClaimed }));
      localStorage.setItem('christmas_milestones', JSON.stringify(milestoneState));
    } catch (e) { console.warn(e); }
  }

  openCalendarDoor(d: CalendarDay) {
    if (d.isLocked) {
      this.audioService.playSFX('locked');
      d.isShaking = true;
      setTimeout(() => { if (!this.isDestroyed) { d.isShaking = false; this.cdr.markForCheck(); } }, 500);
      return;
    }
    if (d.isOpen) {
      this.audioService.playSFX('click');
      this.selectedCalendarItem = d;
      this.showCalendarPopup = true;
      return;
    }

    this.audioService.playSFX('open');
    d.isOpen = true;
    this.selectedCalendarItem = d;
    this.showCalendarPopup = true;

    if (d.day === 24) {
      this.triggerReindeerFly();
      this.audioService.playSFX('bell');
    }
    else if (d.day === 25) {
      this.triggerReindeerFly();
      this.showFireworks = true;
      this.cdr.detectChanges();
      setTimeout(() => {
        if (!this.isDestroyed) {
          this.effectService.triggerFireworks(
            (name) => this.audioService.playSFX(name as any),
            { bursts: 12, duration: 10000, strong: true }
          );
        }
      }, 50);

      this.audioService.playSFX('santa');
      this.effectService.createSnow(60);

      // BƯỚC 3: Tự động tắt sau 10.5 giây
      setTimeout(() => {
        if (!this.isDestroyed) {
          this.showFireworks = false;
          this.cdr.markForCheck();
        }
      }, 10500);
    }
    else {
      this.effectService.createConfetti();
    }

    this.checkMilestonesProgress(true);
    this.saveProgress();
  }

  closeCalendarPopup() {
    this.audioService.playSFX('click');
    this.showCalendarPopup = false;
    this.selectedCalendarItem = null;
  }
  // --- CÁC HÀM TIỆN ÍCH KHÁC ---
  restoreSessionState() {
    if (!this.isBrowser) return;
    const v = localStorage.getItem('christmas_current_view');
    if (v === 'gifts' || v === 'calendar' || v === 'collection') {
      this.currentView = v;
    }

    const m = localStorage.getItem('christmas_music_on');
    this.isMusicPlaying = (m === 'true' || m === null);
    this.audioService.setMusicState(this.isMusicPlaying);
  }

  switchView(view: any) {
    this.audioService.playSFX('click');
    this.currentView = view;
    if (this.isBrowser) localStorage.setItem('christmas_current_view', view);
  }

  toggleMusic() {
    this.isMusicPlaying = this.audioService.toggleMusic();
  }

  generateCalendarData() {
    const items = [
      {t: "Chào Tháng 12", i: "❄️", m: "Gió lạnh về rồi, nhớ mặc thêm áo ấm khi ra đường nhé.", r: 'common'},
      {t: "Cốc Nước Ấm", i: "☕", m: "Thời tiết hanh khô, nhớ uống đủ nước để da dẻ luôn hồng hào.", r: 'common'},
      {t: "Giấc Ngủ Sớm", i: "🌙", m: "Đừng thức khuya chạy deadline quá, sức khỏe mới là món quà quý giá nhất.", r: 'epic'},
      {t: "Vitamin C", i: "🍊", m: "Ăn thêm chút hoa quả để tăng đề kháng, đừng để bị ốm nhé.", r: 'common'},
      {t: "Dọn Dẹp", i: "🧹", m: "F5 lại góc làm việc một chút, không gian thoáng đãng thì tâm trạng mới vui.", r: 'common'},
      {t: "Lời nhắc", i: "📞", m: "Bạn quan trọng lắm. Nhớ đối xử tử tế với chính mình.", r: 'epic'},
      {t: "Cuối Tuần", i: "🛌", m: "Bạn đã vất vả cả tuần rồi, hôm nay hãy cho phép bản thân ngủ nướng thêm xíu.", r: 'rare'},
      {t: "Quyển Sách Hay", i: "📖", m: "Tạm rời xa điện thoại, đọc vài trang sách để tâm hồn tĩnh lặng hơn.", r: 'epic'},
      {t: "Kem Dưỡng Da", i: "🧴", m: "Đừng để đôi tay bị nứt nẻ, nhớ thoa kem dưỡng ẩm nhé.", r: 'common'},
      {t: "Bản Nhạc", i: "🎷", m: "Hôm nay là ngày hoàn hảo để nghe một bài nhạc Giáng Sinh nè.", r: 'rare'},
      {t: "Món Ngon", i: "🍜", m: "Đừng ăn uống qua loa, hôm nay hãy tự thưởng cho mình một bữa thật ngon.", r: 'common'},
      {t: "Nụ Cười", i: "😊", m: "Mỉm cười trước gương nào! Bạn xinh đẹp nhất khi bạn vui vẻ.", r: 'common'},
      {t: "Cafe Sáng", i: "☕", m: "Một chút cafein cho ngày mới tỉnh táo, cố gắng lên nhé!", r: 'rare'},
      {t: "Sổ Tay", i: "✍️", m: "Viết ra những điều làm bạn lo lắng, rồi gạch bỏ nó đi. Mọi chuyện sẽ ổn thôi.", r: 'epic'},
      {t: "Đi Dạo", i: "👟", m: "Ra ngoài hít thở khí trời một chút, đừng ngồi lỳ trong phòng mãi thế.", r: 'legendary'},
      {t: "Tha Thứ", i: "🕊️", m: "Cuối năm rồi, chuyện buồn cũ hãy bỏ qua để đón những niềm vui mới.", r: 'common'},
      {t: "Tiết Kiệm", i: "🐷", m: "Mua sắm vừa đủ thôi, để dành một khoản nhỏ cho dự định năm sau nhé.", r: 'common'},
      {t: "Nến Thơm", i: "🕯️", m: "Đốt chút nến thơm, ánh sáng ấm áp sẽ làm dịu đi mọi âu lo.", r: 'epic'},
      {t: "Tấm Ảnh Cũ", i: "📸", m: "Xem lại vài tấm ảnh hồi bé, bạn đã trưởng thành rất ngoạn mục đấy.", r: 'common'},
      {t: "Cái Ôm", i: "🫂", m: "Nếu mệt quá, hãy tìm một bờ vai tin cậy để dựa vào. Bạn không cô đơn đâu.", r: 'rare'},
      {t: "Lời Cảm Ơn", i: "💌", m: "Gửi lời cảm ơn đến những người đã giúp đỡ bạn trong năm qua.", r: 'common'},
      {t: "Tự Thưởng", i: "🎁", m: "Mua tặng bản thân một món quà nhỏ, vì bạn xứng đáng được yêu thương.", r: 'epic'},
      {t: "Bình Yên", i: "✨", m: "Mong rằng mọi bão giông sẽ dừng sau cánh cửa, trả lại cho bạn sự bình yên.", r: 'epic'}
    ];
    this.emptySlots = [];
    const now = new Date(); const cm = now.getMonth() + 1; const cd = now.getDate();
    for (let i = 1; i <= 31; i++) {
      let d = items[(i - 1) % items.length], r = d.r as any;
      if (i === 24) {
        d = {
          t: "Đêm Thánh Vô Cùng",
          i: "🌙",
          m: "Đêm nay, khi tiếng chuông nhà thờ ngân vang giữa trời đông lạnh giá, hãy để mọi âu lo, muộn phiền của năm cũ lặng lẽ tan biến vào màn đêm. Nguyện cầu cho bạn tìm thấy một góc bình yên sâu thẳm trong tâm hồn, cảm nhận được hơi ấm từ những người thương yêu nhất. Hãy nhắm mắt lại, hít thật sâu và tin rằng: Ngày mai nắng sẽ lên, và những điều tốt đẹp nhất đang chờ bạn phía trước. Merry Christmas Eve!",
          r: 'legendary'
        };
        r = 'legendary';
      }

      if (i === 25) {
        d = {
          t: "MERRY CHRISTMAS!",
          i: "🎅",
          m: "Giáng sinh đã thực sự gõ cửa rồi! Cảm ơn bạn vì đã luôn kiên cường, nỗ lực và tử tế trong suốt một năm đầy biến động vừa qua. Bạn biết không, sự hiện diện của bạn chính là món quà tuyệt vời nhất của thế giới này. Chúc cuộc sống của bạn luôn rực rỡ như ánh đèn lễ hội, ngọt ngào như ly cacao nóng và ngập tràn tiếng cười hạnh phúc. Chúc mừng Giáng sinh an lành!",
          r: 'legendary'
        };
        r = 'legendary';
      }
      // const isLocked = (i === 24 || i === 25) ? false : (cm === 12 && i > cd);
      // this.calendarDays.push({ day: i, isOpen: false, isLocked: isLocked, isShaking: false, content: d.m, image: d.i, title: d.t, type: i === 25 ? 'gift' : 'message', rarity: r });
      this.calendarDays.push({ day: i, isOpen: false, isLocked: (cm === 12 && i > cd), isShaking: false, content: d.m, image: d.i, title: d.t, type: i === 25 ? 'gift' : 'message', rarity: r });
    }
  }

  triggerReindeerFly() {
    this.showReindeerFly = false;
    setTimeout(() => { if (!this.isDestroyed) { this.showReindeerFly = true; this.cdr.markForCheck(); } }, 30);
    setTimeout(() => { if (!this.isDestroyed) { this.showReindeerFly = false; this.cdr.markForCheck(); } }, 9000);
  }

  playClick() { this.audioService.playSFX('click'); }
  playHover() { /* opt */ }

  startCursorBlink() { if (this.isBrowser) this.cursorInterval = setInterval(() => { this.showCursor = !this.showCursor; this.cdr.markForCheck(); }, 500); }

  startTypingEffect(m: string) { this.typingText = ''; let i = 0; if (this.typingInterval) clearInterval(this.typingInterval); this.typingInterval = setInterval(() => { if (i < m.length) { this.typingText += m[i++]; this.cdr.markForCheck(); } else clearInterval(this.typingInterval); }, 40); }

  revealGifts() { this.playClick(); this.showGifts = true; this.audioService.tryPlayMusic(); }

  openCard(i: number) { this.playClick(); this.selectedGiftIndex = i; this.isOpening = true; this.currentCard = this.cards[Math.floor(Math.random()*this.cards.length)]; setTimeout(() => { if (!this.isDestroyed) { this.isOpening = false; this.showCard = true; setTimeout(() => { if (!this.isDestroyed) { if (this.currentCard) this.startTypingEffect(this.currentCard.message); this.effectService.createConfetti(); this.effectService.createSparkles(); } }, 100); } }, 800); }

  resetCard() { this.playClick(); this.showCard = false; this.showGifts = true; this.currentCard = null; this.typingText = ''; if (this.typingInterval) clearInterval(this.typingInterval); }

  startCountdown() { if (this.countdownInterval) clearInterval(this.countdownInterval); this.countdownInterval = setInterval(() => { this.calculateCountdown(); this.cdr.markForCheck(); }, 1000); }
  calculateCountdown() { const n = new Date(), cy = n.getFullYear(); let x = new Date(cy, 11, 25); if (n > x) x = new Date(cy+1, 11, 25); const d = x.getTime() - n.getTime(); this.daysUntilChristmas = Math.max(0, Math.floor(d/(1000*60*60*24))); this.hoursUntilChristmas = Math.max(0, Math.floor((d%(1000*60*60*24))/(1000*60*60))); this.minutesUntilChristmas = Math.max(0, Math.floor((d%(1000*60*60))/(1000*60))); this.secondsUntilChristmas = Math.max(0, Math.floor((d%(1000*60))/1000)); }
}
