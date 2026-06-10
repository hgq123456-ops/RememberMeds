# 记得要吃药（Remember Meds）— 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建适老化 PWA 服药提醒单页面应用——老人视图（今日待服药+吃药按钮）+ 子女管理视图（添加药品+历史记录）

**Architecture:** 单文件 SPA（index.html），纯 HTML/CSS/JS 无依赖。双视图通过 CSS class 切换。数据分两层：药品元数据+记录存 localStorage，药盒照片存 IndexedDB。PWA 通过 manifest.json + service-worker.js 实现离线可用和后台保活。

**Tech Stack:** HTML5 + CSS3 + Vanilla JS (ES6+)，IndexedDB API，Web Speech API，Service Worker API

**Files:**
- Create: `index.html` — 全部 UI + 逻辑
- Create: `manifest.json` — PWA 安装配置
- Create: `service-worker.js` — 离线缓存 + 后台保活

---

## File Structure Map

```
D:\Code\RememberMeds\
├── index.html           # 单页面应用（~800行）
│   ├── <head>           # Meta标签、manifest引用、全局CSS
│   ├── #elderly-view    # 老人视图（默认显示）
│   │   ├── .app-bar     # 顶栏 + ⚙️按钮
│   │   ├── #today-list  # 药品卡片列表
│   │   ├── #all-done    # 全部吃完提示
│   │   └── .family-hint # 底部"家人设置"入口
│   ├── #family-view     # 子女管理视图（默认隐藏）
│   │   ├── .mgmt-header # 返回按钮
│   │   ├── .mgmt-tabs   # 添加/记录标签
│   │   ├── #add-panel   # 添加药品表单
│   │   └── #history-panel # 历史记录
│   └── <script>         # 全部JS逻辑
│       ├── Storage class       # localStorage + IndexedDB
│       ├── Medication class    # 数据模型
│       ├── renderElderlyView() # 渲染老人视图
│       ├── renderHistory()     # 渲染历史记录
│       ├── stateMachine()      # 药品卡片状态判断
│       ├── voiceReminder()     # 语音播报逻辑
│       ├── timerLoop()         # 定时检查循环
│       └── pwaInit()           # PWA注册 + install事件
├── manifest.json        # PWA配置
└── service-worker.js    # 离线+后台
```

---

### Task 1: HTML 骨架 + 全局 CSS

**Files:**
- Create: `index.html`

**Scope:** 建立完整的 HTML 骨架、meta 标签、全局 CSS 变量和基础样式。两个视图的容器元素全部就位，内容留空由后续任务填充。

- [ ] **Step 1: 创建 index.html 骨架**

写入以下内容到 `D:\Code\RememberMeds\index.html`：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>记得要吃药</title>

<!-- PWA Meta (Task 11 完善) -->
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#165DFF">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="记得要吃药">
<link rel="apple-touch-icon" href="data:image/svg+xml,...">

<style>
/* ===== CSS Reset & Variables ===== */
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

:root {
  --primary: #165DFF;
  --bg: #FFFFFF;
  --text: #111111;
  --text-secondary: #666666;
  --text-muted: #999999;
  --border: #E0E0E0;
  --taken: #2DA02D;
  --taken-bg: #F6FAF6;
  --taken-border: #A8D5A8;
  --now: #FF6B35;
  --now-bg: #FFFBF8;
  --missed: #E03030;
  --missed-bg: #FFFBFB;
  --upcoming-bg: #F0F0F0;
  --font-xl: 28px;
  --font-lg: 22px;
  --font-md: 18px;
  --font-sm: 15px;
  --btn-height: 60px;
  --btn-height-sm: 48px;
  --radius-lg: 20px;
  --radius-md: 14px;
  --card-gap: 14px;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
  background: var(--bg);
  color: var(--text);
  font-size: var(--font-md);
  line-height: 1.5;
  -webkit-tap-highlight-color: transparent;
  -webkit-font-smoothing: antialiased;
  overscroll-behavior: none;
}

/* ===== Page Container ===== */
.page { display: none; flex-direction: column; min-height: 100vh; min-height: 100dvh; }
.page.active { display: flex; }
.page-body { flex: 1; overflow-y: auto; padding: 0 0 24px; }

/* ===== App Bar ===== */
.app-bar {
  background: var(--primary);
  color: #fff;
  padding: 16px 24px;
  text-align: center;
  font-size: var(--font-lg);
  font-weight: bold;
  letter-spacing: 2px;
  position: relative;
  flex-shrink: 0;
}
.app-bar .subtitle { font-size: 12px; font-weight: normal; opacity: 0.75; }
.app-bar .gear-btn {
  position: absolute;
  right: 14px; top: 50%;
  transform: translateY(-50%);
  font-size: 22px;
  background: none; border: none;
  color: #fff; opacity: 0.7;
  cursor: pointer; padding: 8px;
  line-height: 1;
}

/* ===== Section Head ===== */
.section-head {
  display: flex; align-items: center; gap: 8px;
  padding: 22px 20px 8px;
}
.section-head .title { font-size: var(--font-lg); font-weight: bold; color: var(--text); }
.section-head .date { margin-left: auto; font-size: var(--font-sm); color: var(--text-muted); }

/* ===== Drug Card ===== */
.drug-card {
  margin: 0 16px var(--card-gap);
  padding: 18px;
  border-radius: var(--radius-lg);
  border: 2.5px solid var(--border);
  background: #fff;
  transition: all 0.3s;
}
.drug-card .card-row { display: flex; gap: 14px; align-items: center; }
.drug-card .drug-photo {
  width: 80px; height: 80px;
  border-radius: 16px;
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 42px;
  overflow: hidden;
}
.drug-card .drug-photo img {
  width: 100%; height: 100%;
  object-fit: cover;
}
.drug-card .drug-info { flex: 1; min-width: 0; }
.drug-card .drug-name { font-size: 26px; font-weight: bold; color: var(--text); line-height: 1.3; }
.drug-card .drug-dose { font-size: 17px; color: var(--text-secondary); margin-top: 4px; }
.drug-card .time-tag {
  display: inline-block; margin-top: 8px;
  padding: 6px 18px; border-radius: 20px;
  font-size: 17px; font-weight: bold;
}
.drug-card .btn-eat {
  display: block; margin-top: 12px;
  width: 100%; height: var(--btn-height);
  border: none; border-radius: 18px;
  font-size: 24px; font-weight: bold;
  cursor: pointer; letter-spacing: 3px;
  transition: all 0.2s;
}
.drug-card .btn-eat:active { transform: scale(0.97); }

/* --- States --- */
.drug-card.state-taken { background: var(--taken-bg); border-color: var(--taken-border); opacity: 0.75; }
.drug-card.state-taken .drug-name { color: #5A8A5A; }
.drug-card.state-taken .time-tag { background: #E2F0E2; color: var(--taken); }
.drug-card.state-taken .btn-eat { background: #C8E6C8; color: var(--taken); font-size: 22px; pointer-events: none; }

.drug-card.state-now { border-color: var(--now); background: var(--now-bg); box-shadow: 0 0 0 5px rgba(255,107,53,0.1); }
.drug-card.state-now .time-tag { background: var(--now); color: #fff; animation: pulse-tag 2s infinite; }
.drug-card.state-now .btn-eat { background: var(--primary); color: #fff; }
.drug-card.state-now .drug-photo { animation: pulse-photo 2s infinite; }

.drug-card.state-upcoming .time-tag { background: var(--upcoming-bg); color: #aaa; }
.drug-card.state-upcoming .btn-eat { background: #E8E8E8; color: #bbb; pointer-events: none; }

.drug-card.state-missed { border-color: var(--missed); background: var(--missed-bg); }
.drug-card.state-missed .time-tag { background: #FFE8E8; color: var(--missed); }
.drug-card.state-missed .btn-eat { background: var(--missed); color: #fff; }

@keyframes pulse-tag {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255,107,53,0.4); }
  50% { box-shadow: 0 0 0 14px rgba(255,107,53,0); }
}
@keyframes pulse-photo {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

/* ===== All-done ===== */
.all-done {
  margin: 32px 20px; text-align: center;
  padding: 40px; border-radius: 24px;
  background: var(--taken-bg); border: 2px solid var(--taken-border);
}
.all-done .emoji { font-size: 56px; }
.all-done .text { font-size: 24px; color: var(--taken); font-weight: bold; margin-top: 8px; }
.all-done .sub { font-size: 16px; color: var(--text-secondary); margin-top: 4px; }

/* ===== Empty state ===== */
.empty-state {
  margin: 40px 20px; text-align: center; padding: 40px;
}
.empty-state .emoji { font-size: 48px; }
.empty-state .text { font-size: 20px; color: var(--text-muted); margin-top: 8px; }

/* ===== Family hint ===== */
.family-hint {
  margin: 20px 30px 12px; padding: 16px;
  border: 2px dashed #ddd; border-radius: var(--radius-md);
  text-align: center; font-size: var(--font-sm);
  color: #bbb; cursor: pointer;
}

/* ===== Family Management View ===== */
.mgmt-header {
  background: var(--primary); color: #fff;
  padding: 14px 20px; font-size: 20px; font-weight: bold;
  display: flex; align-items: center; gap: 10px;
  flex-shrink: 0;
}
.mgmt-header .back-btn {
  background: none; border: none;
  color: #fff; font-size: 24px;
  cursor: pointer; padding: 4px;
}

.mgmt-tabs { display: flex; border-bottom: 2px solid #eee; flex-shrink: 0; }
.mgmt-tab {
  flex: 1; text-align: center; padding: 14px 0;
  font-size: 17px; font-weight: bold; color: var(--text-muted);
  cursor: pointer; border-bottom: 3px solid transparent;
  transition: all 0.2s;
}
.mgmt-tab.active { color: var(--primary); border-bottom-color: var(--primary); }

.mgmt-content { flex: 1; overflow-y: auto; padding: 12px 0; }
.mgmt-panel { display: none; padding: 0 16px; }
.mgmt-panel.active { display: block; }

/* ===== Form ===== */
.form-group { margin-bottom: 16px; }
.form-label { font-size: 17px; font-weight: bold; color: #444; display: block; margin-bottom: 6px; }
.form-label .req { color: var(--missed); }

.input-big {
  width: 100%; height: 52px;
  font-size: 19px; padding: 0 14px;
  border: 2px solid #ddd; border-radius: var(--radius-md);
  background: #fff; color: var(--text);
}
.input-big:focus { border-color: var(--primary); outline: none; box-shadow: 0 0 0 3px rgba(22,93,255,0.1); }

.pill-row { display: flex; gap: 8px; }
.pill {
  flex: 1; height: 46px;
  border: 2px solid #ddd; border-radius: 12px;
  background: #fff; font-size: 16px; font-weight: bold;
  color: #888; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.pill.selected { border-color: var(--primary); background: #E8F0FF; color: var(--primary); }

.time-slot {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 8px; padding: 10px 14px;
  background: #F8FAFF; border-radius: 12px;
}
.time-slot .slot-num {
  width: 28px; height: 28px; background: var(--primary);
  color: #fff; border-radius: 50%;
  font-size: 14px; font-weight: bold;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.time-slot input[type="time"] {
  flex: 1; height: 44px; font-size: 18px;
  padding: 0 10px; border: 2px solid #ddd;
  border-radius: 10px; background: #fff;
}

.date-row { display: flex; align-items: center; gap: 8px; }
.date-row input[type="date"] {
  flex: 1; height: 46px; font-size: 15px;
  padding: 0 8px; border: 2px solid #ddd;
  border-radius: 10px; background: #fff;
}
.date-row .sep { color: var(--text-muted); font-size: 16px; }

.camera-btn {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  width: 100%; height: 80px; gap: 4px;
  border: 3px dashed var(--primary); border-radius: 18px;
  background: #F8FAFF; font-size: 18px;
  color: var(--primary); font-weight: bold;
  cursor: pointer; margin-bottom: 18px;
}
.camera-btn .cam-icon { font-size: 34px; }
.camera-btn.has-photo { border-style: solid; background: #E8F0FF; }

.btn-save {
  width: 100%; height: 58px;
  background: var(--primary); color: #fff;
  border: none; border-radius: 16px;
  font-size: 22px; font-weight: bold;
  cursor: pointer; margin-top: 4px;
}
.btn-save:active { transform: scale(0.97); }

/* ===== Existing meds list ===== */
.existing-meds { margin-top: 20px; }
.existing-meds .title { font-size: 17px; font-weight: bold; color: #444; margin-bottom: 10px; }
.med-item {
  display: flex; align-items: center; gap: 10px;
  padding: 12px; background: #f9f9f9;
  border-radius: 12px; margin-bottom: 8px;
  font-size: 16px;
}
.med-item .info { flex: 1; }
.med-item .del-btn {
  background: none; border: none;
  color: var(--missed); font-size: 20px;
  cursor: pointer; padding: 4px;
}

/* ===== History ===== */
.day-group {
  margin-bottom: 8px; border-radius: 12px;
  overflow: hidden; border: 1.5px solid #eee;
}
.day-header {
  padding: 14px 16px; background: #FAFAFA;
  font-size: 17px; font-weight: bold; color: #555;
  display: flex; justify-content: space-between;
  cursor: pointer;
}
.day-header .arrow { transition: transform 0.3s; font-size: 14px; color: #bbb; }
.day-group.open .arrow { transform: rotate(180deg); }
.day-body { display: none; }
.day-group.open .day-body { display: block; }
.day-record {
  padding: 12px 16px; border-top: 1px solid #f0f0f0;
  font-size: 16px; display: flex; justify-content: space-between; align-items: center;
}
.tag { font-size: 14px; padding: 3px 12px; border-radius: 10px; font-weight: bold; }
.tag.taken { background: #E2F0E2; color: var(--taken); }
.tag.missed { background: #FFE8E8; color: var(--missed); }

/* ===== Install banner ===== */
.install-banner {
  display: none; margin: 12px 16px; padding: 14px 18px;
  background: #E8F0FF; border-radius: var(--radius-md);
  align-items: center; gap: 10px;
}
.install-banner.show { display: flex; }
.install-banner .text { flex: 1; font-size: var(--font-sm); color: var(--primary); font-weight: bold; }
.install-banner .btn-install {
  background: var(--primary); color: #fff;
  border: none; border-radius: 10px;
  padding: 8px 16px; font-size: 15px; font-weight: bold;
  cursor: pointer; white-space: nowrap;
}
.install-banner .btn-close {
  background: none; border: none;
  color: #999; font-size: 18px;
  cursor: pointer; padding: 4px;
}
</style>
</head>
<body>

<!-- ==================== ELDERLY VIEW ==================== -->
<div class="page active" id="elderly-view">
  <div class="app-bar">
    💊 记得要吃药
    <button class="gear-btn" id="btn-open-family" title="家人设置">⚙️</button>
  </div>
  <div class="page-body">
    <div class="section-head">
      <span class="title">📋 今日待服药</span>
      <span class="date" id="today-date"></span>
    </div>

    <div id="today-list"></div>
    <div class="all-done" id="all-done" style="display:none;">
      <div class="emoji">🎉</div>
      <div class="text">今天全部吃完啦</div>
      <div class="sub">明天继续按时吃药哦</div>
    </div>
    <div class="empty-state" id="empty-today" style="display:none;">
      <div class="emoji">😊</div>
      <div class="text">今天没有需要吃的药</div>
    </div>

    <div class="install-banner" id="install-banner">
      <span class="text">📲 添加到桌面，提醒不遗漏</span>
      <button class="btn-install" id="btn-install">安装</button>
      <button class="btn-close" id="btn-close-banner">✕</button>
    </div>

    <div class="family-hint" id="btn-open-family-bottom">
      ⚙️ 家人设置 · 添加药品 · 查看记录
    </div>
  </div>
</div>

<!-- ==================== FAMILY VIEW ==================== -->
<div class="page" id="family-view">
  <div class="mgmt-header">
    <button class="back-btn" id="btn-back-elderly">←</button>
    <span>家人设置</span>
  </div>
  <div class="mgmt-tabs">
    <div class="mgmt-tab active" data-tab="add">➕ 添加药品</div>
    <div class="mgmt-tab" data-tab="history">📅 历史记录</div>
  </div>
  <div class="mgmt-content">
    <!-- Add panel -->
    <div class="mgmt-panel active" id="add-panel">
      <button class="camera-btn" id="camera-btn">
        <span class="cam-icon">📸</span>
        <span>点击拍药盒</span>
      </button>
      <input type="file" id="photo-input" accept="image/*" capture="environment" style="display:none;">

      <div class="form-group">
        <label class="form-label"><span class="req">*</span> 药品名称</label>
        <input class="input-big" type="text" id="input-name" placeholder="例如：降压药" maxlength="20">
      </div>

      <div style="display:flex;gap:8px;" class="form-group">
        <div style="flex:1;">
          <label class="form-label"><span class="req">*</span> 每次用量</label>
          <input class="input-big" type="number" id="input-dosage" value="1" min="1" max="99" style="text-align:center;">
        </div>
        <div style="flex:1;">
          <label class="form-label">单位</label>
          <div class="pill-row" id="unit-pills">
            <div class="pill selected" data-value="片">片</div>
            <div class="pill" data-value="粒">粒</div>
            <div class="pill" data-value="包">包</div>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label"><span class="req">*</span> 每天几次</label>
        <div class="pill-row" id="freq-pills">
          <div class="pill" data-value="1">1次</div>
          <div class="pill selected" data-value="2">2次</div>
          <div class="pill" data-value="3">3次</div>
        </div>
      </div>

      <div class="form-group" id="time-slots-container"></div>

      <div class="form-group">
        <label class="form-label">服用周期（可选）</label>
        <div class="date-row">
          <input type="date" id="input-date-start">
          <span class="sep">至</span>
          <input type="date" id="input-date-end">
        </div>
        <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">💡 不选默认从今天开始，长期服用</div>
      </div>

      <button class="btn-save" id="btn-save-med">✅ 保存提醒</button>

      <div class="existing-meds" id="existing-meds">
        <div class="title">📋 已设置的药品</div>
        <div id="existing-meds-list"></div>
      </div>
    </div>

    <!-- History panel -->
    <div class="mgmt-panel" id="history-panel">
      <div id="history-list"></div>
    </div>
  </div>
</div>

<script>
// ===== PLACEHOLDER: Data layer (Task 2) =====
// ===== PLACEHOLDER: Rendering (Task 3) =====
// ===== PLACEHOLDER: Interactions (Task 4) =====
// ===== PLACEHOLDER: Voice (Task 5) =====
// ===== PLACEHOLDER: Timer (Task 6) =====
// ===== PLACEHOLDER: Family view (Task 7) =====
// ===== PLACEHOLDER: History (Task 8) =====
// ===== PLACEHOLDER: PWA init (Task 11) =====
</script>

</body>
</html>
```

- [ ] **Step 2: 验证文件可打开**

在浏览器中打开 `index.html`，确认页面显示顶栏和两个 section 标题，无 JS 报错。

---

### Task 2: 数据层（localStorage + IndexedDB）

**Files:**
- Modify: `index.html`（替换 PLACEHOLDER Data layer）

**Scope:** 实现 Medication 和 Record 数据模型的 CRUD 操作。药品元数据存 localStorage，照片存 IndexedDB。提供统一的 Storage 对象供其他模块调用。

- [ ] **Step 1: 替换 Data layer placeholder，写入数据层代码**

将 `<script>` 中的 `// ===== PLACEHOLDER: Data layer (Task 2) =====` 替换为：

```javascript
// ===== Data Layer =====
const STORAGE_KEY_MEDS = 'rm_medications';
const STORAGE_KEY_RECORDS = 'rm_records';
const DB_NAME = 'RememberMedsDB';
const DB_VERSION = 1;
const PHOTO_STORE = 'photos';

// --- IndexedDB for photos ---
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(PHOTO_STORE)) {
        req.result.createObjectStore(PHOTO_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function savePhoto(id, base64) {
  const db = await openDB();
  const tx = db.transaction(PHOTO_STORE, 'readwrite');
  tx.objectStore(PHOTO_STORE).put(base64, id);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getPhoto(id) {
  const db = await openDB();
  const tx = db.transaction(PHOTO_STORE, 'readonly');
  const req = tx.objectStore(PHOTO_STORE).get(id);
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function deletePhoto(id) {
  const db = await openDB();
  const tx = db.transaction(PHOTO_STORE, 'readwrite');
  tx.objectStore(PHOTO_STORE).delete(id);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// --- localStorage for metadata ---
function loadMeds() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_MEDS) || '[]');
  } catch { return []; }
}

function saveMeds(meds) {
  localStorage.setItem(STORAGE_KEY_MEDS, JSON.stringify(meds));
}

function loadRecords() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_RECORDS) || '[]');
  } catch { return []; }
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
}

// --- Helpers ---
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function nowTimeStr() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function isDateInRange(dateStr, startStr, endStr) {
  if (!startStr) return true;
  if (dateStr < startStr) return false;
  if (endStr && dateStr > endStr) return false;
  return true;
}
```

- [ ] **Step 2: 验证数据层**

在浏览器控制台执行：
```javascript
saveMeds([{id:'test',name:'测试',dosage:'1',unit:'片',times:['08:00'],dateStart:todayStr(),dateEnd:null}]);
console.log(loadMeds()); // 应返回刚才保存的数组
```

---

### Task 3: 药品卡片渲染 + 状态判断

**Files:**
- Modify: `index.html`（替换 PLACEHOLDER Rendering，同时新增状态判断逻辑）

**Scope:** 实现 `getCardState()` 判断药品当前状态，`renderToday()` 渲染今日待服药列表，`renderPhoto()` 异步加载照片。

- [ ] **Step 1: 替换 Rendering placeholder，写入渲染逻辑**

将 `// ===== PLACEHOLDER: Rendering (Task 3) =====` 替换为：

```javascript
// ===== Drug Card State Machine =====
const STATE = { TAKEN: 'taken', NOW: 'now', UPCOMING: 'upcoming', MISSED: 'missed' };

function getCardState(med, timeSlot) {
  const today = todayStr();
  const records = loadRecords();
  const now = nowTimeStr();

  // Check if already taken today
  const takenRecord = records.find(r =>
    r.medId === med.id && r.date === today && r.time === timeSlot && r.status === 'taken'
  );
  if (takenRecord) return STATE.TAKEN;

  // Check if within active date range
  if (!isDateInRange(today, med.dateStart, med.dateEnd)) return null;

  // Compare time
  if (timeSlot <= now) {
    // Past or current → missed or now
    // Within 30 min window = "now", otherwise missed
    const [h, m] = timeSlot.split(':').map(Number);
    const [nh, nm] = now.split(':').map(Number);
    const slotMins = h * 60 + m;
    const nowMins = nh * 60 + nm;
    if (nowMins - slotMins < 30 && nowMins >= slotMins) return STATE.NOW;
    if (nowMins > slotMins) return STATE.MISSED;
    return STATE.UPCOMING;
  }
  return STATE.UPCOMING;
}

function getStateLabel(state, timeSlot) {
  switch (state) {
    case STATE.TAKEN: return `✅ ${timeSlot}`;
    case STATE.NOW: return `🔔 现在该吃了`;
    case STATE.MISSED: return `⚠️ 已过期 · ${timeSlot}`;
    case STATE.UPCOMING: return `⏰ ${timeSlot}`;
  }
}

function getStateButton(state) {
  switch (state) {
    case STATE.TAKEN: return { text: '✅ 已服用', disabled: true };
    case STATE.NOW: return { text: '✅ 我吃过了', disabled: false };
    case STATE.MISSED: return { text: '⚠️ 我忘记吃了', disabled: false };
    case STATE.UPCOMING: return { text: '⏰ 还没到时间', disabled: true };
  }
}

// ===== Rendering =====
async function renderPhoto(med, container) {
  if (!med.photo) {
    container.innerHTML = '💊';
    container.style.background = 'linear-gradient(135deg, #E3F2FD, #90CAF9)';
    return;
  }
  const photo = await getPhoto(med.id);
  if (photo) {
    container.innerHTML = `<img src="${photo}" alt="${med.name}">`;
    container.style.background = 'none';
  } else {
    container.innerHTML = '💊';
    container.style.background = 'linear-gradient(135deg, #E3F2FD, #90CAF9)';
  }
}

async function renderToday() {
  const meds = loadMeds();
  const today = todayStr();
  const container = document.getElementById('today-list');
  const allDone = document.getElementById('all-done');
  const emptyToday = document.getElementById('empty-today');

  // Filter meds active today
  const activeMeds = meds.filter(m => isDateInRange(today, m.dateStart, m.dateEnd));

  if (activeMeds.length === 0) {
    container.innerHTML = '';
    allDone.style.display = 'none';
    emptyToday.style.display = 'block';
    return;
  }

  // Build all cards: one per (med, timeSlot)
  let cards = [];
  activeMeds.forEach(med => {
    med.times.forEach(t => {
      const state = getCardState(med, t);
      if (state === null) return; // Not in range
      cards.push({ med, timeSlot: t, state });
    });
  });

  // Sort: NOW first, then MISSED, then UPCOMING, then TAKEN
  const order = { now: 0, missed: 1, upcoming: 2, taken: 3 };
  cards.sort((a, b) => order[a.state] - order[b.state]);

  if (cards.length === 0) {
    container.innerHTML = '';
    allDone.style.display = 'none';
    emptyToday.style.display = 'block';
    return;
  }

  emptyToday.style.display = 'none';

  // Check if all taken
  const allTaken = cards.every(c => c.state === STATE.TAKEN);
  allDone.style.display = allTaken ? 'block' : 'none';

  // Build HTML
  let html = '';
  cards.forEach(({ med, timeSlot, state }) => {
    const label = getStateLabel(state, timeSlot);
    const btn = getStateButton(state);
    html += `
      <div class="drug-card state-${state}" data-med-id="${med.id}" data-time="${timeSlot}">
        <div class="card-row">
          <div class="drug-photo" id="photo-${med.id}-${timeSlot.replace(':', '')}">💊</div>
          <div class="drug-info">
            <div class="drug-name">${escapeHtml(med.name)}</div>
            <div class="drug-dose">每次 ${med.dosage}${med.unit}${med.note ? ' · ' + med.note : ''}</div>
            <div class="time-tag">${label}</div>
          </div>
        </div>
        <button class="btn-eat" ${btn.disabled ? 'disabled' : ''}
                data-med-id="${med.id}" data-time="${timeSlot}" data-state="${state}">
          ${btn.text}
        </button>
      </div>`;
  });

  container.innerHTML = html;

  // Load photos asynchronously
  cards.forEach(({ med, timeSlot }) => {
    const photoEl = document.getElementById(`photo-${med.id}-${timeSlot.replace(':', '')}`);
    if (photoEl) renderPhoto(med, photoEl);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
```

- [ ] **Step 2: 更新 today-date 显示**

在数据层代码之后添加初始化调用（将在 Task 6 整合为完整的 init 函数）：

```javascript
// Update today date display
const td = new Date();
const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
document.getElementById('today-date').textContent =
  `${td.getMonth()+1}月${td.getDate()}日 周${weekdays[td.getDay()]}`;
```

- [ ] **Step 3: 页面加载时调用 renderToday**

在脚本末尾添加：

```javascript
// Initial render
renderToday();
```

- [ ] **Step 4: 创建测试数据验证渲染**

在浏览器控制台执行，创建几条测试药品，然后刷新页面确认卡片正确显示：

```javascript
const testMeds = [
  { id: 'm1', name: '阿司匹林', dosage: '1', unit: '片', times: ['08:00'], dateStart: todayStr(), dateEnd: null, note: '饭后服用' },
  { id: 'm2', name: '降压药', dosage: '1', unit: '粒', times: ['08:00', '20:00'], dateStart: todayStr(), dateEnd: null, note: '' },
  { id: 'm3', name: '钙片', dosage: '2', unit: '片', times: ['20:00'], dateStart: todayStr(), dateEnd: null, note: '' },
];
saveMeds(testMeds);
// 手动创建一些记录
saveRecords([
  { medId: 'm1', medName: '阿司匹林', date: todayStr(), time: '08:00', status: 'taken', recordedAt: new Date().toISOString() },
  { medId: 'm2', medName: '降压药', date: todayStr(), time: '08:00', status: 'taken', recordedAt: new Date().toISOString() },
]);
location.reload();
```

刷新后应看到：
- 降压药 08:00 已吃（绿色）
- 降压药 20:00 待服（灰色，如果时间未到）或 该吃（橙色，如果时间已到）
- 钙片 20:00 同上
- 阿司匹林 08:00 已吃（绿色）

---

### Task 4: "我吃过了" 交互逻辑

**Files:**
- Modify: `index.html`（替换 PLACEHOLDER Interactions）

**Scope:** 为"我吃过了"按钮绑定事件委托，点击后创建服药记录、更新 localStorage、重新渲染。

- [ ] **Step 1: 替换 Interactions placeholder**

将 `// ===== PLACEHOLDER: Interactions (Task 4) =====` 替换为：

```javascript
// ===== Drug Card Interactions =====
document.getElementById('today-list').addEventListener('click', (e) => {
  const btn = e.target.closest('.btn-eat');
  if (!btn || btn.disabled) return;

  const medId = btn.dataset.medId;
  const timeSlot = btn.dataset.time;
  const meds = loadMeds();
  const med = meds.find(m => m.id === medId);
  if (!med) return;

  // Save record
  const records = loadRecords();
  records.push({
    medId: med.id,
    medName: med.name,
    date: todayStr(),
    time: timeSlot,
    status: 'taken',
    recordedAt: new Date().toISOString()
  });
  saveRecords(records);

  // Stop voice for this med
  stopVoiceForMed(medId, timeSlot);

  // Re-render
  renderToday();
});
```

- [ ] **Step 2: 创建测试记录并验证**

在浏览器中点击"我吃过了"按钮，验证：
- 卡片变为绿色"已服用"状态
- 按钮变为禁用
- 控制台 `loadRecords()` 可以看到新增记录
- 刷新页面后状态保持

---

### Task 5: 语音播报系统

**Files:**
- Modify: `index.html`（替换 PLACEHOLDER Voice）

**Scope:** 实现语音播报功能。到时间自动播报，每 2 分钟重复直到点击"我吃过了"。使用浏览器 speechSynthesis API。

- [ ] **Step 1: 替换 Voice placeholder**

将 `// ===== PLACEHOLDER: Voice (Task 5) =====` 替换为：

```javascript
// ===== Voice Reminder =====
let activeVoices = {}; // { 'medId-time': intervalId }
let voiceEnabled = true;

function speakMedication(med, timeSlot) {
  if (!voiceEnabled || !window.speechSynthesis) return;

  // Cancel any existing speech first
  window.speechSynthesis.cancel();

  const msg = `${med.name}，该吃了，每次${med.dosage}${med.unit}`;
  const utterance = new SpeechSynthesisUtterance(msg);
  utterance.lang = 'zh-CN';
  utterance.rate = 0.75;
  utterance.volume = 1.0;
  utterance.pitch = 1.0;

  // Some browsers need a delay after cancel
  setTimeout(() => {
    window.speechSynthesis.speak(utterance);
  }, 200);
}

function stopVoiceForMed(medId, timeSlot) {
  const key = `${medId}-${timeSlot}`;
  if (activeVoices[key]) {
    clearInterval(activeVoices[key]);
    delete activeVoices[key];
  }
  // If no more active voices, cancel speech
  if (Object.keys(activeVoices).length === 0) {
    window.speechSynthesis.cancel();
  }
}

function startVoiceLoop(med, timeSlot) {
  const key = `${med.id}-${timeSlot}`;
  if (activeVoices[key]) return; // Already looping

  speakMedication(med, timeSlot);
  activeVoices[key] = setInterval(() => {
    speakMedication(med, timeSlot);
  }, 120000); // Every 2 minutes
}

function stopAllVoices() {
  Object.values(activeVoices).forEach(clearInterval);
  activeVoices = {};
  window.speechSynthesis.cancel();
}

// Check and trigger voice for NOW-state meds
function checkAndSpeak() {
  const meds = loadMeds();
  const today = todayStr();
  const records = loadRecords();

  meds.filter(m => isDateInRange(today, m.dateStart, m.dateEnd)).forEach(med => {
    med.times.forEach(timeSlot => {
      const state = getCardState(med, timeSlot);
      const key = `${med.id}-${timeSlot}`;

      if (state === STATE.NOW && !activeVoices[key]) {
        startVoiceLoop(med, timeSlot);
      } else if (state !== STATE.NOW && activeVoices[key]) {
        stopVoiceForMed(med.id, timeSlot);
      }
    });
  });
}
```

- [ ] **Step 2: 测试语音播报**

在浏览器控制台执行：
```javascript
// 必须由用户交互触发（浏览器限制）
document.addEventListener('click', function testVoice() {
  const m = { name: '降压药', dosage: '1', unit: '粒' };
  speakMedication(m, '08:00');
  document.removeEventListener('click', testVoice);
}, { once: true });
// 然后点击页面任意位置，应听到中文语音播报
```

---

### Task 6: 定时检查 + 跨天处理 + 初始化

**Files:**
- Modify: `index.html`（替换 PLACEHOLDER Timer，完善 init）

**Scope:** 实现 `setInterval` 每分钟检查，触发渲染刷新和语音播报。处理跨天重置。整合所有初始化逻辑。

- [ ] **Step 1: 替换 Timer placeholder 并完成 init**

将 `// ===== PLACEHOLDER: Timer (Task 6) =====` 替换为：

```javascript
// ===== Timer & Init =====
let lastDateCheck = todayStr();
let mainInterval = null;

function initApp() {
  // Set today date
  updateDateDisplay();
  // Initial render
  renderToday();
  // Start check loop
  startTimer();
}

function updateDateDisplay() {
  const td = new Date();
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  document.getElementById('today-date').textContent =
    `${td.getMonth()+1}月${td.getDate()}日 周${weekdays[td.getDay()]}`;
}

function startTimer() {
  if (mainInterval) clearInterval(mainInterval);
  mainInterval = setInterval(() => {
    const current = todayStr();

    // Cross-day reset
    if (current !== lastDateCheck) {
      lastDateCheck = current;
      stopAllVoices();
      updateDateDisplay();
    }

    // Re-render (state may have changed)
    renderToday();

    // Check voice
    checkAndSpeak();
  }, 30000); // Every 30 seconds
}

// Start the app
initApp();

// Handle page visibility change (wake from background)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    updateDateDisplay();
    renderToday();
    checkAndSpeak();
  }
});
```

- [ ] **Step 2: 删除之前散落的初始化代码**

删除 Task 3 Step 2 中添加的零散初始化代码（`updateDateDisplay` 调用和 `renderToday()` 调用），确保只保留 `initApp()` 一处入口。

- [ ] **Step 3: 验证定时检查**

打开页面后，在控制台观察 `setInterval` 是否在运行：
```javascript
// 应该看到周期性日志（可临时在 startTimer 中添加 console.log）
// 手动修改系统时间或等待 30 秒验证刷新
```

---

### Task 7: 子女管理视图 — 添加药品

**Files:**
- Modify: `index.html`（替换 PLACEHOLDER Family view）

**Scope:** 实现添加药品表单的全部交互——拍照、药丸选择、时间槽动态生成、保存、编辑已有药品列表。视图切换逻辑。

- [ ] **Step 1: 替换 Family view placeholder**

将 `// ===== PLACEHOLDER: Family view (Task 7) =====` 替换为：

```javascript
// ===== Family Management View =====

// --- View switching ---
function showElderlyView() {
  document.getElementById('elderly-view').classList.add('active');
  document.getElementById('family-view').classList.remove('active');
  renderToday();
}

function showFamilyView() {
  document.getElementById('elderly-view').classList.remove('active');
  document.getElementById('family-view').classList.add('active');
  setupTimeSlots();
  renderExistingMeds();
}

document.getElementById('btn-open-family').addEventListener('click', showFamilyView);
document.getElementById('btn-open-family-bottom').addEventListener('click', showFamilyView);
document.getElementById('btn-back-elderly').addEventListener('click', showElderlyView);

// --- Tab switching ---
document.querySelectorAll('.mgmt-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.mgmt-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.dataset.tab;
    document.getElementById('add-panel').classList.toggle('active', target === 'add');
    document.getElementById('history-panel').classList.toggle('active', target === 'history');
    if (target === 'history') renderHistory();
  });
});

// --- Pill selector ---
document.querySelectorAll('.pill-row').forEach(row => {
  row.addEventListener('click', (e) => {
    const pill = e.target.closest('.pill');
    if (!pill) return;
    row.querySelectorAll('.pill').forEach(p => p.classList.remove('selected'));
    pill.classList.add('selected');
    if (row.id === 'freq-pills') setupTimeSlots();
  });
});

// --- Time slots ---
function setupTimeSlots() {
  const count = parseInt(getSelectedValue('freq-pills'));
  const container = document.getElementById('time-slots-container');
  let html = '<label class="form-label">服药时间</label>';
  for (let i = 0; i < count; i++) {
    const defaultTime = i === 0 ? '08:00' : i === 1 ? '12:00' : '20:00';
    html += `
      <div class="time-slot">
        <span class="slot-num">${i + 1}</span>
        <input type="time" class="input-time-slot" value="${defaultTime}">
      </div>`;
  }
  container.innerHTML = html;
}

function getSelectedValue(rowId) {
  const row = document.getElementById(rowId);
  const sel = row.querySelector('.pill.selected');
  return sel ? sel.dataset.value : '1';
}

// --- Photo ---
let tempPhotoBase64 = null;

document.getElementById('camera-btn').addEventListener('click', () => {
  document.getElementById('photo-input').click();
});

document.getElementById('photo-input').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    tempPhotoBase64 = reader.result;
    const btn = document.getElementById('camera-btn');
    btn.classList.add('has-photo');
    btn.querySelector('span:last-child').textContent = '✅ 已拍照，点击重新拍';
  };
  reader.readAsDataURL(file);
});

// --- Save medication ---
document.getElementById('btn-save-med').addEventListener('click', async () => {
  const name = document.getElementById('input-name').value.trim();
  if (!name) { alert('请输入药品名称'); return; }

  const dosage = document.getElementById('input-dosage').value || '1';
  const unit = getSelectedValue('unit-pills');
  const dateStart = document.getElementById('input-date-start').value || todayStr();
  const dateEnd = document.getElementById('input-date-end').value || null;

  const timeInputs = document.querySelectorAll('.input-time-slot');
  const times = Array.from(timeInputs).map(t => t.value).filter(Boolean);

  if (times.length === 0) { alert('请设置服药时间'); return; }

  const med = {
    id: generateId(),
    name,
    dosage,
    unit,
    times,
    timesPerDay: times.length,
    dateStart,
    dateEnd,
    note: '',
    photo: tempPhotoBase64 ? true : false, // boolean flag, actual photo in IndexedDB
    createdAt: new Date().toISOString()
  };

  // Save photo to IndexedDB
  if (tempPhotoBase64) {
    await savePhoto(med.id, tempPhotoBase64);
  }

  // Save to localStorage
  const meds = loadMeds();
  meds.push(med);
  saveMeds(meds);

  // Reset form
  document.getElementById('input-name').value = '';
  document.getElementById('input-dosage').value = '1';
  document.getElementById('input-date-end').value = '';
  document.getElementById('input-date-start').value = todayStr();
  document.getElementById('photo-input').value = '';
  tempPhotoBase64 = null;
  const camBtn = document.getElementById('camera-btn');
  camBtn.classList.remove('has-photo');
  camBtn.querySelector('span:last-child').textContent = '点击拍药盒';

  // Refresh
  renderExistingMeds();
  renderToday();
});

// --- Existing meds ---
function renderExistingMeds() {
  const meds = loadMeds();
  const container = document.getElementById('existing-meds-list');
  if (meds.length === 0) {
    container.innerHTML = '<div style="font-size:15px;color:#bbb;text-align:center;padding:12px;">暂无药品</div>';
    return;
  }
  container.innerHTML = meds.map(m => `
    <div class="med-item">
      <span style="font-size:24px;">💊</span>
      <div class="info">
        <b>${escapeHtml(m.name)}</b>
        · ${m.dosage}${m.unit}
        · ${m.times.join(', ')}
      </div>
      <button class="del-btn" data-del-id="${m.id}">🗑️</button>
    </div>
  `).join('');

  // Delete handlers
  container.querySelectorAll('.del-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.delId;
      if (!confirm('确定删除这个药品吗？')) return;
      const meds = loadMeds().filter(m => m.id !== id);
      saveMeds(meds);
      // Also clean photo
      try { await deletePhoto(id); } catch {}
      renderExistingMeds();
      renderToday();
    });
  });
}
```

- [ ] **Step 2: 初始化 time slots**

在 `showFamilyView()` 中已调用 `setupTimeSlots()`，需要确认初始状态正确。同时设置默认日期：

在脚本末尾（`initApp()` 之前）添加：
```javascript
// Set default date for form
document.getElementById('input-date-start').value = todayStr();
```

- [ ] **Step 3: 测试添加流程**

在浏览器中：
1. 点 ⚙️ 进入家人设置
2. 选择"拍药盒"（可选）
3. 输入药品名称、用量、选择次数
4. 点击保存
5. 回到老人视图确认药品出现

---

### Task 8: 历史记录渲染

**Files:**
- Modify: `index.html`（替换 PLACEHOLDER History）

**Scope:** 实现按天分组的历史记录渲染，每天可展开/折叠。

- [ ] **Step 1: 替换 History placeholder**

将 `// ===== PLACEHOLDER: History (Task 8) =====` 替换为：

```javascript
// ===== History View =====
function renderHistory() {
  const records = loadRecords();
  const container = document.getElementById('history-list');

  if (records.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:40px;font-size:18px;color:#bbb;">暂无服药记录</div>';
    return;
  }

  // Group by date (newest first)
  const grouped = {};
  records.forEach(r => {
    if (!grouped[r.date]) grouped[r.date] = [];
    grouped[r.date].push(r);
  });

  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a)); // newest first
  const today = todayStr();

  container.innerHTML = dates.map(date => {
    const dayRecords = grouped[date];
    const dayLabel = date === today ? `${date}（今天）` : date;
    const isOpen = date === today; // Today open by default

    return `
      <div class="day-group ${isOpen ? 'open' : ''}">
        <div class="day-header" onclick="this.parentElement.classList.toggle('open')">
          <span>📅 ${dayLabel}</span>
          <span class="arrow">▼</span>
        </div>
        <div class="day-body">
          ${dayRecords.map(r => `
            <div class="day-record">
              <span>💊 ${escapeHtml(r.medName)} ${r.time}</span>
              <span class="tag ${r.status}">${r.status === 'taken' ? '已吃' : '未吃'}</span>
            </div>
          `).join('')}
        </div>
      </div>`;
  }).join('');
}
```

- [ ] **Step 2: 手动标记过期未吃**

在定时检查中，需要自动创建 missed 记录。在 `startTimer()` 的 `checkAndSpeak()` 调用前添加 missed 记录逻辑。

修改 `startTimer` 函数，在 `renderToday()` 和 `checkAndSpeak()` 之间插入：

```javascript
// Auto-record missed medications
function autoRecordMissed() {
  const meds = loadMeds();
  const today = todayStr();
  const records = loadRecords();
  const now = nowTimeStr();

  meds.filter(m => isDateInRange(today, m.dateStart, m.dateEnd)).forEach(med => {
    med.times.forEach(timeSlot => {
      // Skip if already recorded
      const existing = records.find(r =>
        r.medId === med.id && r.date === today && r.time === timeSlot
      );
      if (existing) return;

      // If time passed more than 30 min, auto-mark as missed
      const [h, m] = timeSlot.split(':').map(Number);
      const [nh, nm] = now.split(':').map(Number);
      if (nh * 60 + nm - (h * 60 + m) > 30) {
        records.push({
          medId: med.id,
          medName: med.name,
          date: today,
          time: timeSlot,
          status: 'missed',
          recordedAt: new Date().toISOString()
        });
      }
    });
  });
  saveRecords(records);
}
```

然后在 `startTimer` 中，`renderToday()` 之前调用 `autoRecordMissed()`。

---

### Task 9: manifest.json

**Files:**
- Create: `manifest.json`

**Scope:** 创建 PWA manifest 文件，配置全屏 standalone 模式、竖屏、主题色。包含 SVG 占位图标（后续可替换为真实图标）。

- [ ] **Step 1: 生成 SVG 图标**

创建一个简单的药丸 SVG 图标：

写入到 `D:\Code\RememberMeds\icon-192.png` 和 `D:\Code\RememberMeds\icon-512.png` 暂不处理（用 data URI 替代）。

- [ ] **Step 2: 创建 manifest.json**

写入到 `D:\Code\RememberMeds\manifest.json`：

```json
{
  "name": "记得要吃药",
  "short_name": "Remember Meds",
  "description": "适老化服药提醒工具，语音播报，拍照识别药盒",
  "start_url": "./index.html",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#FFFFFF",
  "theme_color": "#165DFF",
  "lang": "zh-CN",
  "icons": [
    {
      "src": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='192' height='192' viewBox='0 0 192 192'%3E%3Crect width='192' height='192' rx='40' fill='%23165DFF'/%3E%3Ctext x='96' y='120' font-size='100' text-anchor='middle' fill='white'%3E💊%3C/text%3E%3C/svg%3E",
      "sizes": "192x192",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    },
    {
      "src": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='512' height='512' viewBox='0 0 512 512'%3E%3Crect width='512' height='512' rx='100' fill='%23165DFF'/%3E%3Ctext x='256' y='320' font-size='280' text-anchor='middle' fill='white'%3E💊%3C/text%3E%3C/svg%3E",
      "sizes": "512x512",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ]
}
```

---

### Task 10: service-worker.js

**Files:**
- Create: `service-worker.js`

**Scope:** 实现 Service Worker，缓存静态资源实现离线可用。监听 periodic-sync 事件实现后台唤醒提醒。

- [ ] **Step 1: 创建 service-worker.js**

写入到 `D:\Code\RememberMeds\service-worker.js`：

```javascript
const CACHE_NAME = 'remember-meds-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// Install: cache all assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: stale-while-revalidate for navigation, cache-first for assets
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Navigation: network first, fallback to cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Other: cache first, network fallback
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        const cloned = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
        return response;
      });
    })
  );
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-meds') {
    event.waitUntil(checkAndNotify());
  }
});

// Push notification fallback
async function checkAndNotify() {
  const clients = await self.clients.matchAll({ type: 'window' });
  if (clients.length > 0) {
    // A window is open, let the main thread handle it
    clients.forEach((client) => {
      client.postMessage({ type: 'check-meds' });
    });
  }
}

// Listen for messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'skip-waiting') {
    self.skipWaiting();
  }
});
```

---

### Task 11: PWA 集成 — 注册 SW + beforeinstallprompt + meta 完善

**Files:**
- Modify: `index.html`（替换 PLACEHOLDER PWA init）

**Scope:** 在 index.html 中注册 service worker，处理 beforeinstallprompt 事件显示安装提示。

- [ ] **Step 1: 替换 PWA init placeholder**

将 `// ===== PLACEHOLDER: PWA init (Task 11) =====` 替换为：

```javascript
// ===== PWA Registration =====
let deferredPrompt = null;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then((reg) => {
        console.log('SW registered:', reg.scope);

        // Periodic background sync
        if ('periodicSync' in reg) {
          reg.periodicSync.register('check-meds', {
            minInterval: 5 * 60 * 1000 // 5 minutes
          }).catch(() => {
            // Periodic sync not available, fallback to setInterval handled in timer
          });
        }

        // Listen for messages from SW
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'check-meds') {
            renderToday();
            checkAndSpeak();
          }
        });
      })
      .catch((err) => console.log('SW registration failed:', err));
  });
}

// Install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById('install-banner').classList.add('show');
});

document.getElementById('btn-install').addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  console.log('Install outcome:', outcome);
  deferredPrompt = null;
  document.getElementById('install-banner').classList.remove('show');
});

document.getElementById('btn-close-banner').addEventListener('click', () => {
  document.getElementById('install-banner').classList.remove('show');
});

// Detect standalone mode
if (window.matchMedia('(display-mode: standalone)').matches) {
  document.getElementById('install-banner').classList.remove('show');
}
```

- [ ] **Step 2: 完善 Apple meta 标签**

在 `<head>` 中确认以下标签存在（Task 1 已添加，此步骤验证）：

```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="记得要吃药">
```

- [ ] **Step 3: 验证 PWA**

在 Chrome 中打开页面 → F12 → Application → Manifest，确认 manifest 正确加载。
在 Service Workers 面板确认 SW 已注册。

---

### Task 12: 边界情况处理 + 最终打磨

**Files:**
- Modify: `index.html`

**Scope:** 处理所有边界情况——空状态、照片失败、语音不支持、存储满、全部完成。

- [ ] **Step 1: 空状态和全完成状态**

已在 Task 3 的 `renderToday()` 中实现（`#empty-today` 和 `#all-done`）。确认：
- 无药品时显示"😊 今天没有需要吃的药"
- 全部吃完显示"🎉 今天全部吃完啦"

- [ ] **Step 2: 语音不支持降级**

在 `speakMedication` 函数开头已检查 `!window.speechSynthesis`，确认逻辑正确。

- [ ] **Step 3: 照片加载失败处理**

在 `renderPhoto` 函数中已有 fallback（显示 💊 emoji），确认逻辑正确。

- [ ] **Step 4: IndexedDB 不可用降级**

在 `openDB` 函数中添加 try-catch：

在 `openDB` 调用处包装：
```javascript
async function safeGetPhoto(id) {
  try { return await getPhoto(id); }
  catch { return null; }
}
```

并在 `renderPhoto` 中使用 `safeGetPhoto` 替代 `getPhoto`。

- [ ] **Step 5: 跨天自动重置状态**

已在 Task 6 的 `startTimer` 中实现 `lastDateCheck` 逻辑。

- [ ] **Step 6: 过期药品处理**

在 `renderToday` 中，`isDateInRange` 过滤已确保超出 dateEnd 的药品不显示。

- [ ] **Step 7: 最终完整测试清单**

在浏览器中完成以下测试：
1. ✅ 打开页面 → 看到今日待服药
2. ✅ 点击"我吃过了" → 卡片变绿
3. ✅ 到时间 → 语音播报（需用户交互触发）
4. ✅ 点 ⚙️ → 进入家人设置
5. ✅ 添加药品 → 保存 → 回老人视图确认出现
6. ✅ 拍照 → 照片显示在卡片上
7. ✅ 查看历史 → 按天分组
8. ✅ 删除药品 → 确认移除
9. ✅ 刷新页面 → 数据不丢失（localStorage）
10. ✅ Chrome DevTools → Application → Manifest 正确
11. ✅ Chrome DevTools → Application → Service Workers 已注册
12. ✅ 离线测试：断网 → 页面仍可打开
