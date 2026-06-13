# 3D圆内跟随鼠标

使用 Three.js 实现的3D版本,小球在透明大球体内跟随鼠标/重力感应运动。

## ✨ 新特性

### 3D场景
- **真实3D球体**: 使用PBR材质的大球体和跟随小球
- **动态光照**: 环境光 + 方向光 + 跟随小球的点光源
- **粒子系统**: 200个漂浮粒子营造空间感
- **拖尾效果**: 小球运动时留下发光轨迹

### 交互方式
- **鼠标跟随**: PC端移动鼠标控制小球位置
- **触摸跟随**: 移动端手指滑动控制
- **重力感应**: 倾斜设备让小球"滚落"(需HTTPS)
- **智能切换**: 自动检测设备类型选择最佳输入方式

### 视觉效果
- **平滑动画**: Lerp插值实现流畅跟随
- **边界约束**: 小球始终在大球体内部运动
- **自转效果**: 大球体缓慢旋转增加立体感
- **发光材质**: 小球自带emissive发光效果

## 🎮 配置说明

所有参数都在 [config.js](file:///Users/apple/Desktop/animate/config.js) 中调整:

### Three.js 配置 (`threejs`)
```javascript
threejs: {
  camera: { fov, z },           // 相机视角和距离
  bigSphere: { radius, color }, // 大球体半径、颜色
  follower: { radius, color },  // 小球半径、颜色
  lighting: { ... },            // 光照强度和颜色
  particles: { count, size },   // 粒子数量和大小
  trail: { maxPoints, width }   // 拖尾点数和宽度
}
```

### 运动配置 (`motion`)
```javascript
motion: {
  smooth: 0.11,        // 平滑度(0-1),越小越慢
  settleEpsilon: 0.05  // 停止阈值
}
```

### 重力感应配置 (`gravity`)
```javascript
gravity: {
  smooth: 0.15,         // 重力模式平滑度
  sensitivity: 1,       // 灵敏度
  deadZone: 0.12,       // 死区阈值
  invertX/Y: false/true // 坐标反转
}
```

## 🚀 运行

直接在浏览器打开 `index.html` 即可,无需构建工具。

需要本地服务器?使用:
```bash
npx serve
# 或
python -m http.server 8080
```

## 📱 移动端重力感应

iOS 13+ 需要用户授权才能访问传感器,代码已包含权限请求逻辑。

**注意**: 除 localhost 外,必须使用 HTTPS 才能启用重力感应。

## 🎨 自定义建议

1. **改变颜色**: 修改 `threejs.bigSphere.color` 和 `threejs.follower.color`
2. **调整大小**: 修改 `threejs.bigSphere.radius` 和 `threejs.follower.radius`
3. **增强特效**: 增加 `threejs.particles.count` 或 `threejs.trail.maxPoints`
4. **更快响应**: 增大 `motion.smooth` 值(接近1)
5. **更换材质**: 在 `createBigSphere()` 和 `createFollower()` 中调整 metalness/roughness

## 🔧 技术栈

- **Three.js r160**: 3D渲染引擎
- **WebGL**: GPU加速渲染
- **原生JavaScript**: 无框架依赖
- **CSS Variables**: 主题配置

## 📄 文件结构

```
animate/
├── index.html      # HTML入口,引入Three.js
├── config.js       # 唯一配置入口
├── main.js         # Three.js场景逻辑
└── styles.css      # 基础样式
```

---

享受3D交互体验!🎉
