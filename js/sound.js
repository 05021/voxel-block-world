/**
 * 像素方块世界 - 音效系统
 * 基于 WebAudio API 程序化合成音效，无需任何音频素材文件
 * 包含：放置、破坏、跳跃、落地、脚步音效 + 静音控制
 */

export class SoundManager {
  constructor() {
    this.ctx = null;          // AudioContext（须在用户手势后创建/恢复）
    this.master = null;       // 主音量节点
    this.noiseBuffer = null;  // 白噪声缓冲（各类音效的原料）
    this.muted = false;
  }

  /** 初始化音频上下文（须由用户手势触发调用） */
  init() {
    if (this.ctx) {
      this._resume();
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.35;
      this.master.connect(this.ctx.destination);

      // 预生成 1 秒白噪声缓冲
      const len = this.ctx.sampleRate;
      this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < len; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    } catch (e) {
      console.warn('音频初始化失败', e);
      this.ctx = null;
    }
  }

  /** 恢复被浏览器自动挂起的音频上下文 */
  _resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setMuted(muted) {
    this.muted = muted;
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  /**
   * 播放一段滤波噪声
   * @param {number} dur 时长（秒）
   * @param {BiquadFilterType} filterType 滤波器类型
   * @param {number} freq 滤波频率
   * @param {number} vol 音量（0-1）
   * @param {number} [rate] 播放速率（影响音高）
   */
  _noise(dur, filterType, freq, vol, rate = 1) {
    if (!this.ctx || this.muted) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.playbackRate.value = rate;

    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = freq;
    filter.Q.value = 0.8;

    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(t);
    src.stop(t + dur);
  }

  /**
   * 播放一个滑音振荡器
   * @param {OscillatorType} type 波形
   * @param {number} f0 起始频率
   * @param {number} f1 结束频率
   * @param {number} dur 时长（秒）
   * @param {number} vol 音量（0-1）
   */
  _tone(type, f0, f1, dur, vol) {
    if (!this.ctx || this.muted) return;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    const t = this.ctx.currentTime;
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + dur);
  }

  /** 放置方块：短促"嗒"声（低频敲击 + 高频点缀） */
  place() {
    this._tone('square', 320, 140, 0.08, 0.18);
    this._noise(0.05, 'lowpass', 1200, 0.12, 1.4);
  }

  /** 破坏方块：碎裂"咔嚓"声（带随机音高变化） */
  break_() {
    const pitch = 0.85 + Math.random() * 0.3;
    this._noise(0.16, 'bandpass', 900 * pitch, 0.25, pitch);
    this._noise(0.1, 'lowpass', 500 * pitch, 0.18, pitch);
    this._tone('triangle', 200 * pitch, 90, 0.1, 0.12);
  }

  /** 跳跃：短促上升音 */
  jump() {
    this._tone('sine', 260, 480, 0.12, 0.1);
  }

  /** 落地：低沉"咚"声（下落速度越快音量越大） */
  land(fallSpeed = 10) {
    const vol = Math.min(0.3, 0.1 + Math.abs(fallSpeed) * 0.012);
    this._tone('sine', 150, 60, 0.16, vol);
    this._noise(0.08, 'lowpass', 400, vol * 0.7, 0.8);
  }

  /** 脚步：轻微沙沙声（随机音高避免机械感） */
  step() {
    const pitch = 0.9 + Math.random() * 0.25;
    this._noise(0.05, 'lowpass', 700 * pitch, 0.07, pitch);
  }
}
