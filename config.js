/**
 * 唯一配置入口：改这里即可调整布局、动效与监听范围。
 * 在 index.html 中需先于 main.js 引入。
 */
window.APP_CONFIG = {
  page: {
    title: "3D圆内跟随鼠标",
  },

  /**
   * Three.js 3D场景配置
   */
  threejs: {
    /** 渲染器设置 */
    renderer: {
      antialias: true,
      alpha: true,
      pixelRatio: window.devicePixelRatio || 1,
    },
    /** 相机设置 */
    camera: {
      fov: 60,
      near: 0.1,
      far: 1000,
      z: 8,
    },
    /** 大球体设置 */
    bigSphere: {
      radius: 3,
      segments: 64,
      color: 0x1a1f2e,
      emissive: 0x0a0d14,
      metalness: 0.7,
      roughness: 0.3,
      wireframe: false,
    },
    /** 跟随小球设置 */
    follower: {
      radius: 0.66,
      segments: 32,
      color: 0xf59e0b,
      emissive: 0xb45309,
      emissiveIntensity: 0.3,
      metalness: 0.5,
      roughness: 0.4,
    },
    /** 光照设置 */
    lighting: {
      ambient: {
        intensity: 0.4,
        color: 0x404040,
      },
      directional: {
        intensity: 1.2,
        color: 0xffffff,
        position: { x: 5, y: 5, z: 5 },
      },
      point: {
        enabled: true,
        intensity: 0.8,
        color: 0xfbbf24,
        distance: 15,
        decay: 2,
      },
    },
    /** 粒子系统设置 */
    particles: {
      enabled: true,
      count: 200,
      size: 0.05,
      color: 0xfde68a,
      speed: 0.02,
      spread: 5,
    },
    /** 拖尾效果 */
    trail: {
      enabled: true,
      maxPoints: 50,
      width: 0.15,
      color: 0xfbbf24,
      opacity: 0.6,
      fadeSpeed: 0.02,
    },
  },

  /** 对应 HTML 里的 id */
  dom: {
    /** 外层占位，用于测量中心（不受大圆视差 transform 影响） */
    bigWrapId: "bigWrap",
    bigId: "big",
    followerId: "follower",
    /** 可选：设置后会覆盖 HTML 里 img 的 src */
    followerSrc: null,
  },

  /**
   * 输入方式
   * - "auto"：有精细指针（鼠标）→ 跟鼠标；否则触控设备 → 重力感应（不可用则跟触控）
   * - "pointer"：始终跟指针（鼠标/手指在页面上的位置）
   * - "gravity"：始终尝试重力；失败则按 gravity.fallbackToPointerOnBig 回退
   */
  responsive: {
    inputMode: "pointer",  // 强制使用指针模式，确保鼠标交互正常
  },

  /**
   * 指针监听范围（pointer / 重力失败后的触控回退时同样生效）
   * - "window"：整页跟手；移出浏览器窗口时是否回中见 resetOnLeave
   * - "big"：仅在大圆区域内跟手，移出大圆可回中
   */
  pointer: {
    moveTarget: "window",
    resetOnLeave: true,
    reset: { x: 0, y: 0 },
    passive: true,
  },

  motion: {
    /** 越大越贴目标，越小跟得越慢、越「飘」 */
    smooth: 0.11,
    /** 认为已到达目标、停止 raf 的距离阈值（px） */
    settleEpsilon: 0.05,
  },

  /**
   * GSAP 视觉：拖尾 + 可选粒子（需加载 gsap，见 index.html）
   */
  effects: {
    /**
     * 大圆整体微微跟向 target（与小球同向、幅度更小），用平滑避免晃眼
     */
    bigParallax: {
      enabled: true,
      /** 相对小球 target 位移的比例，越小越含蓄 */
      factor: 0.1,
      /** 大圆最大平移（px） */
      maxPx: 14,
      /** 趋向目标位移的平滑，越大跟得越紧 */
      smooth: 0.14,
    },
    /**
     * 彗尾拖尾（单条渐变光带，沿运动方向在球后延伸；已去掉多段圆形残影）
     */
    trail: {
      enabled: true,
      /** 速度向量低通，越大方向越稳、拖尾越「整」 */
      velocitySmooth: 0.24,
      /** 低于该速度（px/帧）时拖尾快速衰减 */
      minSpeed: 0.28,
      /** 速度衰减系数（几乎静止时） */
      idleDecay: 0.82,
      /** 彗尾最大长度 = 大圆直径 × 该比例 */
      maxLengthRatio: 0.52,
      /** 彗尾粗细 = 大圆直径 × 该比例 */
      widthRatio: 0.1,
      /** 长度额外放大：length ≈ speed × lengthPerSpeed（再受 max 限制） */
      lengthPerSpeed: 10,
      /** 最大彗尾长度（px，防止过快时过长） */
      lengthCapPx: 200,
      /** 峰值不透明度 */
      maxOpacity: 0.92,
      /** 渐变：左侧远端透明 → 右侧靠球更亮（与运动方向一致） */
      gradient:
        "linear-gradient(90deg, rgba(251, 191, 36, 0) 0%, rgba(253, 224, 71, 0.25) 35%, rgba(254, 243, 199, 0.75) 72%, rgba(255, 255, 255, 0.92) 100%)",
      boxShadow: "0 0 18px rgba(251, 191, 36, 0.45), 0 0 36px rgba(249, 115, 22, 0.22)",
      blurPx: 5,
    },
    /**
     * 焰火：中心闪光 + 全周径向爆发 + 可选第二波碎星 + 轻微下落
     */
    particles: {
      enabled: true,
      /** 单帧位移超过该值（px）才触发 */
      speedThreshold: 1.8,
      /** 两次焰火最小间隔（ms） */
      minIntervalMs: 55,
      /** 主环火花数量 */
      sparks: 36,
      /** 主环爆炸半径（px） */
      radiusMin: 36,
      radiusMax: 56,
      /** 每条火花方向随机抖动（弧度，约 0.12 ≈ 7°） */
      angleJitter: 0.14,
      /** 火花尺寸范围（px） */
      sparkSizeMin: 2,
      sparkSizeMax: 5,
      /** 飞行时间（s），越大越「慢放」 */
      duration: 0.72,
      /** 结束时额外向下的偏移（px），模拟轻微重力 */
      gravityY: 18,
      /** 每条火花最大随机延迟（s），让爆发更碎、更自然 */
      staggerMax: 0.05,
      ease: "power3.out",
      /** 中心闪光 */
      flash: true,
      flashDuration: 0.16,
      /** 第二波较小碎星数量，0 则关闭 */
      secondarySparks: 14,
      /** 第二波相对主环的半径比例 */
      secondaryRadiusScale: 0.62,
      /** 第二波延迟（s） */
      secondaryDelay: 0.07,
      colors: [
        "#fffef8",
        "#fef3c7",
        "#fde68a",
        "#fbbf24",
        "#f59e0b",
        "#fb923c",
        "#f97316",
      ],
    },
  },

  /**
   * 重力模式（移动端）：用加速度计在屏幕平面上的投影，把球推向「低处」，
   * 再用与大圆相同的几何约束限制位移。
   *
   * 注意：除 localhost 外，多数浏览器要求 HTTPS 才能使用设备运动传感器。
   */
  gravity: {
    /** 重力模式下的平滑（可与 motion.smooth 分开调；越小球跟得越慢） */
    smooth: 0.15,
    /** 与 9.8 的比值，低于此视为「放平」，目标回中心 */
    deadZone: 0.12,
    /** 整体灵敏度乘在最大可偏移量上 */
    sensitivity: 1,
    /** 传感器低通系数 0~1，越大越跟手、噪声越大 */
    lowPass: 0.18,
    /** 设备坐标 y 与 CSS（向下为正）是否取反，机型不对时改这里 */
    invertX: false,
    invertY: true,
    /**
     * 无 accelerationIncludingGravity 时是否用 deviceorientation 的 beta/gamma 兜底
     */
    useOrientationFallback: true,
    orientationFallback: {
      /** 倾斜到多少度时贴大圆边缘 */
      maxTiltDeg: 42,
    },
    /** iOS 13+ 需用户手势授权；为 false 则不调 API（重力不可用） */
    requestSensorPermission: true,
    permissionButtonText: "启用重力感应",
    /** 授权失败或设备无运动时，是否改为在大圆上跟手（手指位置） */
    fallbackToPointerOnBig: true,
  },

  /** 写入 :root 的 CSS 变量，对应 styles.css */
  style: {
    body: {
      background: "#0f1115",
      color: "#e8eaed",
      fontFamily: "system-ui, sans-serif",
    },
    stage: {
      padding: "max(1.25rem, env(safe-area-inset-top, 0px))",
    },
    bigCircle: {
      /** min( vmin%, maxPx ) 里的两项 */
      widthMinVmin: 72,
      widthMaxPx: 420,
      borderRadius: "50%",
      overflow: "hidden",
      background:
        "radial-gradient(circle at 35% 30%, #2a3140, #141820 65%)",
      boxShadow:
        "inset 0 0 0 1px rgba(255, 255, 255, 0.06), 0 24px 80px rgba(0, 0, 0, 0.45)",
    },
    follower: {
      widthPercent: "22%",
      aspectRatio: "1",
      borderRadius: "50%",
      objectFit: "cover",
      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.35)",
    },
  },
};
