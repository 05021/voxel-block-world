/**
 * 像素方块世界 - 昼夜循环系统
 * 控制：天空颜色渐变、太阳/月亮方向光、环境光强度、星空
 * 纯程序化实现，无任何素材文件
 */
import * as THREE from 'three';

/** 一整个昼夜循环的现实秒数 */
const DAY_LENGTH = 300;
/** 起始时刻：0.3 ≈ 早晨 7:12 */
const START_TIME = 0.3;

export class DayNightCycle {
  /**
   * @param {THREE.Scene} scene
   * @param {object} lights { ambientLight, sunLight, hemiLight }
   */
  constructor(scene, { ambientLight, sunLight, hemiLight }) {
    this.scene = scene;
    this.ambientLight = ambientLight;
    this.sunLight = sunLight;
    this.hemiLight = hemiLight;

    this.time = START_TIME;      // 0~1，0=午夜，0.5=正午
    this.dayLength = DAY_LENGTH;
    this.daylight = 1;           // 当前日照系数 0~1（供外部读取）

    // 天空颜色（直接复用 Color 对象避免每帧分配）
    this._skyColor = new THREE.Color(0x87CEEB);
    scene.background = this._skyColor;

    this._daySky = new THREE.Color(0x87CEEB);
    this._nightSky = new THREE.Color(0x0b1026);
    this._duskSky = new THREE.Color(0xf2984f);

    this._daySun = new THREE.Color(0xffffff);
    this._duskSun = new THREE.Color(0xffb36b);
    this._moonSun = new THREE.Color(0x8fa5ff);

    this._stars = this._createStars();
    scene.add(this._stars);
  }

  /** 创建星空：上半球随机分布的点云 */
  _createStars() {
    const count = 400;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // 均匀取上半球方向
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.95);        // 偏向天顶
      const r = 180;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi) + 10;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.6,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0,
      fog: false,            // 星星不受雾影响
      depthWrite: false,
    });
    return new THREE.Points(geo, mat);
  }

  /** 每帧更新（dt 秒） */
  update(dt) {
    this.time = (this.time + dt / this.dayLength) % 1;

    // 太阳高度：-1（午夜）~ 1（正午）
    const sunHeight = Math.sin((this.time - 0.25) * Math.PI * 2);
    // 日照系数：地平线附近平滑过渡
    this.daylight = THREE.MathUtils.smoothstep(sunHeight, -0.15, 0.25);

    this._updateSky(sunHeight);
    this._updateLights(sunHeight);
    this._updateStars();
  }

  _updateSky(sunHeight) {
    // 夜空 → 白昼天空
    this._skyColor.copy(this._nightSky).lerp(this._daySky, this.daylight);

    // 日出/日落时向暖橙色调偏移
    const dusk = (1 - Math.min(1, Math.abs(sunHeight) / 0.3)) * 0.75;
    if (dusk > 0) this._skyColor.lerp(this._duskSky, dusk);

    // 雾随天空同步变色，保持地平线融合
    if (this.scene.fog) this.scene.fog.color.copy(this._skyColor);
  }

  _updateLights(sunHeight) {
    // 太阳与月亮共用方向光：谁在天上就照向谁的反方向
    const angle = (this.time - 0.25) * Math.PI * 2;
    const isDay = sunHeight >= 0;
    const r = 100;
    if (isDay) {
      this.sunLight.position.set(Math.cos(angle) * r, Math.sin(angle) * r, 30);
      // 正午白光，接近日出日落时偏暖
      const warm = 1 - Math.min(1, sunHeight / 0.35);
      this.sunLight.color.copy(this._daySun).lerp(this._duskSun, warm * 0.8);
      this.sunLight.intensity = 0.15 + 0.75 * this.daylight;
    } else {
      // 月亮在太阳对侧
      this.sunLight.position.set(-Math.cos(angle) * r, -Math.sin(angle) * r, 30);
      this.sunLight.color.copy(this._moonSun);
      this.sunLight.intensity = 0.12;
    }

    // 环境光与半球光随日照衰减，夜晚保留微光
    this.ambientLight.intensity = 0.22 + 0.48 * this.daylight;
    this.hemiLight.intensity = 0.06 + 0.24 * this.daylight;
  }

  _updateStars() {
    const mat = this._stars.material;
    mat.opacity = Math.pow(1 - this.daylight, 2) * 0.9;   // 平方衰减，黄昏时星星隐得更快
    this._stars.rotation.y += 0.00002;   // 极缓慢旋转
    this._stars.visible = mat.opacity > 0.02;
  }

  /** 当前游戏内时刻字符串，如 "07:12" */
  getTimeString() {
    const totalMin = Math.floor(this.time * 24 * 60);
    const h = String(Math.floor(totalMin / 60)).padStart(2, '0');
    const m = String(totalMin % 60).padStart(2, '0');
    return `${h}:${m}`;
  }
}
