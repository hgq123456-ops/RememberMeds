# 记得要吃药 — 项目笔记

## 一、项目缘起

**问题**：爸妈老了，经常忘记吃药。市面上提醒 APP 太复杂，广告多，老人用不来。

**想法**：做一个老人真正能用的——打开就看到药、点一下就完事、到时间会叫。

## 二、设计过程

### 适老化设计的核心原则

- 超大字体 28px，按钮 60px 高
- 主色 #165DFF，高对比度白底
- 老人只看一页：今日药品 + "我吃过了"按钮
- 子女操作（添加药品、查看记录）藏在 ⚙️ 设置里

### 关键设计决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 布局 | 纵向滚动单列 | 零学习成本 |
| 药品展示 | 照片 + 大字 | 不识字老人也能认 |
| 语音播报 | 中文语音 + 蜂鸣兜底 | 华为等国产浏览器不支持 speechSynthesis |
| 按钮交互 | 只能"已吃"和"未吃"，无"补吃" | 医疗常识——药不能乱补 |
| 已错过 | 红色卡片 + 灰色按钮，不可操作 | 错过就是错过了 |
| 存储 | localStorage + IndexedDB | 数据只在手机，不上传 |

### 踩过的坑

1. **语音播报不响**：浏览器安全策略，`speechSynthesis` 必须用户先交互一次才能触发。加了静默解锁 + Web Audio API 蜂鸣兜底。

2. **华为浏览器不支持 PWA 安装**：`beforeinstallprompt` 事件不触发。最后用 PWABuilder 生成 APK 解决。

3. **苹果 Safari 安装**：没有自动弹出提示，加了 iOS 手动指引（分享 → 添加到主屏幕）。

4. **"我忘记吃了"按钮逻辑矛盾**：点了变"已吃"但文字说不通。最终设计——过期的药按钮置灰不可点，避免误导。

## 三、技术栈

- 纯 HTML + CSS + Vanilla JavaScript
- 零框架、零依赖、零服务器
- localStorage（药品数据）+ IndexedDB（药盒照片）
- Service Worker（离线缓存）
- Web Speech API（语音播报）
- Web Audio API（蜂鸣闹铃兜底）

## 四、项目结构

```
RememberMeds/
├── index.html          # 全部代码（HTML/CSS/JS 单文件，约1200行）
├── manifest.json       # PWA 配置
├── service-worker.js   # 离线缓存 + 后台
├── icon-192.png        # APP 图标
├── icon-512.png        # APP 图标
├── docs/               # 设计文档 + 计划
└── README.md
```

## 五、部署

1. GitHub Pages 托管（免费 HTTPS）
2. PWABuilder 一键生成 APK
3. Chrome/Safari 直接 PWA 安装到桌面
