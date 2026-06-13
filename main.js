const C = window.APP_CONFIG;
if (!C) {
  throw new Error("缺少 config.js:请在 main.js 之前引入 config.js");
}

document.title = C.page.title;

// Three.js 全局变量
let scene, camera, renderer;
let bigSphere, followerSphere;
let particles, particlePositions, particleVelocities;
let trailLine, trailPoints = [];
let pointLight;

// 运动状态
let cur = { x: 0, y: 0 };
let target = { x: 0, y: 0 };
let activeSmooth = C.motion.smooth;

// 鼠标/触摸位置
let mouse = { x: 0, y: 0 };

/**
 * 初始化 Three.js 场景
 */
function initThreeJS() {
  const cfg = C.threejs;
  
  // 检查 Three.js 是否加载
  if (typeof THREE === 'undefined') {
    console.error('Three.js not loaded!');
    alert('Three.js 加载失败，请检查网络连接');
    return;
  }
  
  console.log('Three.js loaded successfully, version:', THREE.REVISION);

  // 创建场景
  scene = new THREE.Scene();
  console.log('Scene created');

  // 创建相机
  camera = new THREE.PerspectiveCamera(
    cfg.camera.fov,
    window.innerWidth / window.innerHeight,
    cfg.camera.near,
    cfg.camera.far
  );
  camera.position.z = cfg.camera.z;

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({
    antialias: cfg.renderer.antialias,
    alpha: cfg.renderer.alpha,
  });
  renderer.setPixelRatio(cfg.renderer.pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  // 将 canvas 添加到 body
  document.body.appendChild(renderer.domElement);
  renderer.domElement.style.position = 'fixed';
  renderer.domElement.style.top = '0';
  renderer.domElement.style.left = '0';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.zIndex = '0';
  renderer.domElement.style.display = 'block';
  
  console.log('Canvas created and appended to body');
  console.log('Canvas size:', renderer.domElement.width, 'x', renderer.domElement.height);

  // 添加光照
  setupLighting();

  // 创建大球体
  createBigSphere();

  // 创建跟随小球
  createFollower();
  console.log('Follower sphere created at position:', followerSphere.position);

  // 创建粒子系统
  if (cfg.particles.enabled) {
    createParticles();
    console.log('Particles created');
  }

  // 创建拖尾
  if (cfg.trail.enabled) {
    createTrail();
    console.log('Trail created');
  }

  // 窗口大小调整
  window.addEventListener('resize', onWindowResize, false);
}

/**
 * 设置光照
 */
function setupLighting() {
  const cfg = C.threejs.lighting;

  // 环境光
  const ambientLight = new THREE.AmbientLight(
    cfg.ambient.color,
    cfg.ambient.intensity
  );
  scene.add(ambientLight);

  // 方向光
  const dirLight = new THREE.DirectionalLight(
    cfg.directional.color,
    cfg.directional.intensity
  );
  dirLight.position.set(
    cfg.directional.position.x,
    cfg.directional.position.y,
    cfg.directional.position.z
  );
  scene.add(dirLight);

  // 点光源(跟随小球)
  if (cfg.point.enabled) {
    pointLight = new THREE.PointLight(
      cfg.point.color,
      cfg.point.intensity,
      cfg.point.distance,
      cfg.point.decay
    );
    scene.add(pointLight);
  }
}

/**
 * 创建大球体
 */
function createBigSphere() {
  const cfg = C.threejs.bigSphere;

  const geometry = new THREE.SphereGeometry(
    cfg.radius,
    cfg.segments,
    cfg.segments
  );

  // 创建网格纹理
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  // 背景色
  ctx.fillStyle = '#1a1f2e';
  ctx.fillRect(0, 0, 512, 512);
  
  // 绘制网格线
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 2;
  
  // 经线
  for (let i = 0; i <= 12; i++) {
    const x = (i / 12) * 512;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  
  // 纬线
  for (let i = 0; i <= 12; i++) {
    const y = (i / 12) * 512;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }
  
  // 添加一些装饰性圆点
  ctx.fillStyle = 'rgba(251, 191, 36, 0.3)';
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const radius = 5 + Math.random() * 15;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // 创建纹理
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  const material = new THREE.MeshStandardMaterial({
    map: texture,
    color: cfg.color,
    emissive: cfg.emissive,
    metalness: cfg.metalness,
    roughness: cfg.roughness,
    wireframe: cfg.wireframe,
  });

  bigSphere = new THREE.Mesh(geometry, material);
  scene.add(bigSphere);
  
  console.log('Big sphere created with grid texture');
}

/**
 * 创建跟随小球
 */
function createFollower() {
  const cfg = C.threejs.follower;

  const geometry = new THREE.SphereGeometry(
    cfg.radius,
    cfg.segments,
    cfg.segments
  );

  // 创建小球的纹理（笑脸图案）
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  
  // 背景 - 金黄色
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, '#fbbf24');
  gradient.addColorStop(1, '#f59e0b');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  
  // 眼睛
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(90, 100, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(166, 100, 18, 0, Math.PI * 2);
  ctx.fill();
  
  // 微笑
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(128, 140, 50, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();
  
  // 创建纹理
  const texture = new THREE.CanvasTexture(canvas);

  const material = new THREE.MeshStandardMaterial({
    map: texture,
    color: cfg.color,
    emissive: cfg.emissive,
    emissiveIntensity: cfg.emissiveIntensity,
    metalness: cfg.metalness,
    roughness: cfg.roughness,
  });

  followerSphere = new THREE.Mesh(geometry, material);
  scene.add(followerSphere);
  console.log('Follower sphere created with smiley texture');
}

/**
 * 创建粒子系统
 */
function createParticles() {
  const cfg = C.threejs.particles;
  const count = cfg.count;

  const geometry = new THREE.BufferGeometry();
  particlePositions = new Float32Array(count * 3);
  particleVelocities = [];

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    particlePositions[i3] = (Math.random() - 0.5) * cfg.spread;
    particlePositions[i3 + 1] = (Math.random() - 0.5) * cfg.spread;
    particlePositions[i3 + 2] = (Math.random() - 0.5) * cfg.spread;

    particleVelocities.push({
      x: (Math.random() - 0.5) * cfg.speed,
      y: (Math.random() - 0.5) * cfg.speed,
      z: (Math.random() - 0.5) * cfg.speed,
    });
  }

  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(particlePositions, 3)
  );

  const material = new THREE.PointsMaterial({
    size: cfg.size,
    color: cfg.color,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
  });

  particles = new THREE.Points(geometry, material);
  scene.add(particles);
}

/**
 * 创建拖尾效果
 */
function createTrail() {
  const cfg = C.threejs.trail;

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(cfg.maxPoints * 3);
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.LineBasicMaterial({
    color: cfg.color,
    transparent: true,
    opacity: cfg.opacity,
    linewidth: 2,
  });

  trailLine = new THREE.Line(geometry, material);
  trailLine.frustumCulled = false;
  scene.add(trailLine);
}

/**
 * 更新拖尾
 */
function updateTrail() {
  if (!trailLine || !followerSphere) return;

  const cfg = C.threejs.trail;
  const pos = followerSphere.position;

  // 添加新点到轨迹
  trailPoints.unshift({ x: pos.x, y: pos.y, z: pos.z });

  // 限制点数
  if (trailPoints.length > cfg.maxPoints) {
    trailPoints.pop();
  }

  // 更新几何体
  const positions = trailLine.geometry.attributes.position.array;
  for (let i = 0; i < trailPoints.length; i++) {
    positions[i * 3] = trailPoints[i].x;
    positions[i * 3 + 1] = trailPoints[i].y;
    positions[i * 3 + 2] = trailPoints[i].z;
  }

  // 清空剩余点
  for (let i = trailPoints.length; i < cfg.maxPoints; i++) {
    positions[i * 3] = 0;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = 0;
  }

  trailLine.geometry.attributes.position.needsUpdate = true;
}

/**
 * 更新粒子
 */
function updateParticles() {
  if (!particles) return;

  const cfg = C.threejs.particles;
  const positions = particles.geometry.attributes.position.array;

  for (let i = 0; i < particleVelocities.length; i++) {
    const i3 = i * 3;
    positions[i3] += particleVelocities[i].x;
    positions[i3 + 1] += particleVelocities[i].y;
    positions[i3 + 2] += particleVelocities[i].z;

    // 边界检查,循环
    const limit = cfg.spread / 2;
    if (Math.abs(positions[i3]) > limit) positions[i3] *= -1;
    if (Math.abs(positions[i3 + 1]) > limit) positions[i3 + 1] *= -1;
    if (Math.abs(positions[i3 + 2]) > limit) positions[i3 + 2] *= -1;
  }

  particles.geometry.attributes.position.needsUpdate = true;
}

/**
 * 将屏幕坐标转换为3D世界坐标（简化版）
 */
function screenToWorld(screenX, screenY) {
  // 归一化设备坐标 (-1 到 +1)
  const ndcX = (screenX / window.innerWidth) * 2 - 1;
  const ndcY = -(screenY / window.innerHeight) * 2 + 1;
  
  // 根据相机距离和FOV计算实际世界坐标
  const distance = Math.abs(camera.position.z);
  const fov = camera.fov * (Math.PI / 180);
  const visibleHeight = 2 * Math.tan(fov / 2) * distance;
  const visibleWidth = visibleHeight * camera.aspect;
  
  const x = ndcX * (visibleWidth / 2);
  const y = ndcY * (visibleHeight / 2);
  
  return { x, y };
}

/**
 * 约束小球在大球体内
 */
function clampToFollowerOffset(x, y, z) {
  const bigRadius = C.threejs.bigSphere.radius;
  const smallRadius = C.threejs.follower.radius;
  const maxDist = bigRadius - smallRadius;

  const dist = Math.sqrt(x * x + y * y + z * z);
  if (dist <= maxDist) {
    return { x, y, z };
  }

  const scale = maxDist / dist;
  return {
    x: x * scale,
    y: y * scale,
    z: z * scale,
  };
}

/**
 * 动画循环
 */
function animate() {
  requestAnimationFrame(animate);

  // 平滑插值
  cur.x += (target.x - cur.x) * activeSmooth;
  cur.y += (target.y - cur.y) * activeSmooth;

  // 更新小球位置
  if (followerSphere) {
    const clamped = clampToFollowerOffset(cur.x, cur.y, 0);
    followerSphere.position.set(clamped.x, clamped.y, 0);

    // 更新点光源位置
    if (pointLight) {
      pointLight.position.copy(followerSphere.position);
    }
  }

  // 更新拖尾
  if (C.threejs.trail.enabled) {
    updateTrail();
  }

  // 更新粒子
  if (C.threejs.particles.enabled) {
    updateParticles();
  }

  // 大球体轻微旋转
  if (bigSphere) {
    bigSphere.rotation.y += 0.005;  // 加快旋转速度
    bigSphere.rotation.x += 0.002;
  }

  // 渲染
  renderer.render(scene, camera);
}

// 每秒输出一次调试信息
let debugCounter = 0;
setInterval(() => {
  if (followerSphere) {
    console.log('Frame', debugCounter++, '| Target:', target.x.toFixed(2), target.y.toFixed(2), '| Current:', cur.x.toFixed(2), cur.y.toFixed(2), '| Follower:', followerSphere.position.x.toFixed(2), followerSphere.position.y.toFixed(2));
  }
}, 1000);

/**
 * 窗口大小调整
 */
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * 鼠标移动事件
 */
function onMouseMove(event) {
  const worldPos = screenToWorld(event.clientX, event.clientY);
  target.x = worldPos.x;
  target.y = worldPos.y;
}

/**
 * 触摸移动事件
 */
function onTouchMove(event) {
  event.preventDefault();
  const touch = event.touches[0];
  const worldPos = screenToWorld(touch.clientX, touch.clientY);
  target.x = worldPos.x;
  target.y = worldPos.y;
}

/**
 * 重力感应(移动端)
 */
let gravLp = { x: 0, y: 0 };

function onDeviceMotion(event) {
  const acc = event.accelerationIncludingGravity;
  if (!acc || acc.x == null || acc.y == null) return;

  const Gcfg = C.gravity || {};
  const lp = Gcfg.lowPass ?? 0.18;
  gravLp.x = gravLp.x * (1 - lp) + acc.x * lp;
  gravLp.y = gravLp.y * (1 - lp) + acc.y * lp;

  const len = Math.hypot(gravLp.x, gravLp.y);
  const dead = (Gcfg.deadZone ?? 0.12) * 9.8;
  const maxOff = C.threejs.bigSphere.radius - C.threejs.follower.radius;

  if (len < dead) {
    target = { x: 0, y: 0 };
    return;
  }

  const dirX = len > 0.001 ? gravLp.x / len : 0;
  const dirY = len > 0.001 ? gravLp.y / len : 0;
  const t = Math.min(len / 9.8, 1);
  const sens = Gcfg.sensitivity ?? 1;
  let rawX = dirX * t * maxOff * sens;
  let rawY = dirY * t * maxOff * sens;

  if (Gcfg.invertX) rawX *= -1;
  if (Gcfg.invertY) rawY *= -1;

  const clamped = clampToFollowerOffset(rawX, rawY, 0);
  target.x = clamped.x;
  target.y = clamped.y;
}

/**
 * 初始化输入监听
 */
function initInputListeners() {
  const mode = C.responsive?.inputMode ?? "auto";
  
  console.log('Input mode:', mode);
  console.log('Pointer fine:', window.matchMedia("(pointer: fine)").matches);

  if (mode === "gravity" || (mode === "auto" && !window.matchMedia("(pointer: fine)").matches)) {
    // 重力感应模式
    console.log('Using gravity mode');
    activeSmooth = C.gravity?.smooth ?? C.motion.smooth;
    gravLp = { x: 0, y: 0 };

    if (typeof DeviceMotionEvent !== "undefined") {
      window.addEventListener("devicemotion", onDeviceMotion, false);
      console.log('Device motion listener added');
    }
  } else {
    // 鼠标/触摸模式
    console.log('Using pointer mode');
    window.addEventListener("mousemove", onMouseMove, false);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    console.log('Mouse and touch listeners added');
  }
}

// 初始化
console.log('Initializing 3D scene...');
console.log('Three.js version:', THREE.REVISION);
initThreeJS();
console.log('Three.js scene created');
initInputListeners();
console.log('Input listeners initialized');
animate();
console.log('Animation loop started');
