// ui.js - 负责界面渲染、多语言静态文本、动画效果

// 1. 引入语言包
const i18nUI = require("./locales/index.js"); // 改个名，防止和 main.js 冲突

// ==========================================
// 1. 初始化静态多语言文字
// ==========================================
function initLocalization() {
    const setTxt = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    };

    setTxt("txt-title", i18nUI.title);
    setTxt("txt-subtitle", i18nUI.subtitle);
    setTxt("txt-footer", i18nUI.footer);
    
    // 初始按钮状态文字
    const st = document.getElementById("st");
    const go = document.getElementById("go");
    
    if (st && st.innerText === "Waiting...") {
        st.innerText = i18nUI.wait;
    }
    if (go && go.innerText === "Start Monitoring") {
        go.innerText = i18nUI.start;
    }
}

// ==========================================
// 2. 暴露给 main.js 调用的 UI 更新函数
//    (替代不支持的 MutationObserver)
// ==========================================
window.updateUIState = function(isRunning) {
    const goBtn = document.getElementById('go');
    const radar = document.getElementById('radar');
    
    if (!goBtn || !radar) return;

    if (isRunning) {
        // 激活状态：加类名、移除内联背景让CSS接管
        goBtn.classList.add('active');
        radar.classList.add('active');
        goBtn.style.background = ""; 
    } else {
        // 停止状态 (如果有停止逻辑的话)
        goBtn.classList.remove('active');
        radar.classList.remove('active');
    }
};

// ==========================================
// 3. 设置当前版本号
// ==========================================
function setCurrentVersion() {
    let currentVersion = null;
    
    // 方法1: 使用manifest.json中的版本信息
    try {
        const manifest = require('./manifest.json');
        currentVersion = manifest.version;
        console.log('从manifest.json获取版本号:', currentVersion);
    } catch (error) {
        console.warn('无法从manifest.json获取版本号:', error);
        currentVersion = '0.1.4';
    }
    
    // 设置到VersionManager（如果存在）
    if (window.VersionManager && window.VersionManager.setCurrentVersion) {
        window.VersionManager.setCurrentVersion(currentVersion);
    }
    
    // 同时设置到全局变量，供其他模块使用
    window.pluginVersion = currentVersion;
    
    // 更新界面上的版本号显示
    const versionElement = document.getElementById('version-number');
    if (versionElement) {
        versionElement.textContent = currentVersion;
    }
    
    console.log('当前插件版本已设置为:', currentVersion);
}

// ==========================================
// 4. 执行初始化
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    try {
        initLocalization();
        setCurrentVersion();
        console.log("UI Initialized");
    } catch (e) {
        console.error("UI Init Error:", e);
    }
});