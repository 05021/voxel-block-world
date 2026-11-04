# 像素方块世界 (Voxel Block World)

基于 Three.js 的 3D 像素风格方块世界探索游戏。纯原生 HTML + CSS + ES Module JavaScript 构建，**零依赖、零构建步骤**，克隆即可运行。

![技术栈](https://img.shields.io/badge/Three.js-r160-blue) ![License](https://img.shields.io/badge/License-MIT-green)

## 特性

- 🌍 **程序化世界生成**：Simplex 噪声 + FBM 生成自然起伏的地形、树木与水域
- 🤖 **AI 机器人**：ScoutBot（快速侦察）与 HeavyBot（重型独行）两种体素机器人，带状态机 AI
- 🖥️ **双端适配**：桌面端键鼠操作 + 移动端虚拟摇杆触控，自动检测设备
- ⚡ **性能优化**：面剔除、区块合并网格、空区块跳过、脏标记按需重建、雾效隐藏加载边界
- 📦 **完全离线**：Three.js 已本地化，无任何 CDN 依赖

## 快速开始

由于使用了 ES Module，需要通过 HTTP 服务器访问（不能直接双击打开 HTML）：

```bash
# 方式一：Python
python -m http.server 5000

# 方式二：Node.js
npx serve -p 5000
```

然后浏览器访问 `http://localhost:5000`。

手机在同一局域网下访问 `http://<电脑IP>:5000` 可体验移动端触控操作。

## 操作说明

### 桌面端

| 按键 | 功能 |
|------|------|
| W / A / S / D | 前后左右移动 |
| 鼠标移动 | 视角旋转 |
| 空格 | 跳跃 |
| 左键 | 放置方块 |
| 右键 | 破坏方块 |
| 1-6 / 滚轮 | 切换方块类型 |
| ESC | 暂停 |

### 移动端

| 操作 | 功能 |
|------|------|
| 左下摇杆拖动 | 移动 |
| 右侧滑动 | 视角旋转 |
| 跳 / 放 / 拆按钮 | 跳跃 / 放置 / 破坏 |
| 底部物品栏 | 切换方块类型 |

## 项目结构

```
index.html          # 入口页面（importmap、桌面端/移动端 UI）
styles/main.css     # 界面样式（HUD、开始画面、触控 UI）
libs/three.module.js # Three.js r160（本地化，支持离线）
js/noise.js         # Simplex 2D 噪声生成器
js/voxel.js         # 核心引擎：方块定义、纹理图集、区块管理、世界生成
js/animals.js       # 机器人实体系统与 AI 行为
js/game.js          # 玩家控制、触控系统、物理、游戏循环
```

## 技术要点

- **区块系统**：16×48×16 区块，每区块一个合并网格（单次 draw call），仅渲染暴露面
- **纹理图集**：Canvas 程序化绘制 16×16 像素纹理，NearestFilter 保持像素风格
- **物理**：AABB 碰撞检测 + 重力，DDA 射线检测实现方块选取
- **移动端优化**：DPR 限制、低功耗渲染模式、增量加载让步

## License

[MIT](./LICENSE)
