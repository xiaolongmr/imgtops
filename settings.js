// 设置功能模块

// 版本检查功能
const VersionManager = {
    manifestUrl: 'https://xiaolongmr.github.io/imgtops/manifest.json',
    currentVersion: null, // 动态设置版本号
    
    // 设置当前版本（在插件初始化时调用）
    setCurrentVersion(version) {
        this.currentVersion = version;
    },
    
    // 获取当前版本
    getCurrentVersion() {
        // 如果已经设置过版本号，直接返回
        if (this.currentVersion) {
            return this.currentVersion;
        }
        
        // 直接从全局变量获取（由ui.js设置）
        if (window.pluginVersion) {
            this.currentVersion = window.pluginVersion;
            return this.currentVersion;
        }
        
        console.warn('无法获取版本号，请确保版本号已正确设置');
        return null;
    },
    
    // 检查更新
    async checkForUpdates() {
        try {
            const currentVersion = this.getCurrentVersion();
            console.log('当前版本:', currentVersion);
            
            // 如果无法获取当前版本，跳过检查
            if (!currentVersion) {
                console.warn('无法获取当前版本，跳过版本检查');
                return null;
            }
            
            const response = await fetch(this.manifestUrl);
            if (!response.ok) {
                throw new Error('网络请求失败');
            }
            
            const remoteManifest = await response.json();
            const remoteVersion = remoteManifest.version;
            console.log('云端版本:', remoteVersion);
            
            const result = this.compareVersions(currentVersion, remoteVersion);
            console.log('版本比较结果:', result);
            
            return result;
        } catch (error) {
            console.error('版本检查失败:', error);
            return null;
        }
    },
    
    // 版本比较
    compareVersions(current, remote) {
        const currentParts = current.split('.').map(Number);
        const remoteParts = remote.split('.').map(Number);
        
        for (let i = 0; i < Math.max(currentParts.length, remoteParts.length); i++) {
            const currentPart = currentParts[i] || 0;
            const remotePart = remoteParts[i] || 0;
            
            if (remotePart > currentPart) {
                return {
                    hasUpdate: true,
                    currentVersion: current,
                    latestVersion: remote
                };
            } else if (remotePart < currentPart) {
                break;
            }
        }
        
        return {
            hasUpdate: false,
            currentVersion: current,
            latestVersion: remote
        };
    },
    
    // 显示更新提示
    showUpdateNotification(updateInfo) {
        if (!updateInfo.hasUpdate) return;
        
        // 使用左上角消息提示模块，设置为永久显示
        if (window.notificationManager) {
            // 保存更新信息，用于后续检查
            this.currentUpdateInfo = updateInfo;
            
            // 显示永久通知（使用很大的超时时间）
            window.notificationManager.show(
                `🎉 发现新版本!  v${updateInfo.currentVersion} → v${updateInfo.latestVersion}`,
                'info',
                9999999999, // 很大的数字，几乎不会自动消失
                () => {
                    // 点击后显示公众号二维码弹窗
                    this.showUpdateModal(updateInfo);
                }
            );
        }
    },
    
    // 隐藏更新提示（当版本一致时调用）
    hideUpdateNotification() {
        if (window.notificationManager) {
            window.notificationManager.hide();
        }
        this.currentUpdateInfo = null;
    },
    
    // 显示更新弹窗
    showUpdateModal(updateInfo) {
        // 使用与关于我们相同的弹窗样式
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        modalOverlay.id = 'update-modal-overlay';
        modalOverlay.innerHTML = `
            <div class="modal-content">
                <div class="modal-inner">
                    <img src="https://wx.z-l.top/qrcode.png" alt="爱吃馍公众号二维码" class="qrcode-img">
                    <div class="modal-title">获取最新版本</div>
                    <div class="modal-desc">
                        发送关键词 【图片导导】
                        <br>
                        获取最新版本下载链接
                    </div>

                </div>
            </div>
        `;
        
        document.body.appendChild(modalOverlay);
        
        // 点击遮罩层关闭
        modalOverlay.onclick = (e) => {
            if (e.target === modalOverlay) {
                this.hideUpdateModal();
            }
        };
        
        // ESC键关闭
        document.addEventListener('keydown', this.handleEscapeKey);
        
        // 显示弹窗
        modalOverlay.style.display = 'flex';
    },
    
    // 隐藏更新弹窗
    hideUpdateModal() {
        const modalOverlay = document.getElementById('update-modal-overlay');
        if (modalOverlay) {
            modalOverlay.remove();
        }
        document.removeEventListener('keydown', this.handleEscapeKey);
    },
    
    // ESC键处理
    handleEscapeKey(e) {
        if (e.key === 'Escape') {
            VersionManager.hideUpdateModal();
        }
    },
    
    // 初始化版本检查
    async init() {
        console.log('开始版本检查...');
        
        // 测试阶段：暂时禁用每日检查限制
        // const lastCheck = localStorage.getItem('lastUpdateCheck');
        // const now = Date.now();
        // const oneDay = 24 * 60 * 60 * 1000;
        // 
        // if (lastCheck && (now - parseInt(lastCheck)) < oneDay) {
        //     console.log('今天已经检查过版本，跳过检查');
        //     return;
        // }
        // 
        // localStorage.setItem('lastUpdateCheck', now.toString());
        
        const updateInfo = await this.checkForUpdates();
        console.log('版本检查完成:', updateInfo);
        
        if (updateInfo && updateInfo.hasUpdate) {
            console.log('发现新版本，准备显示提示');
            setTimeout(() => {
                this.showUpdateNotification(updateInfo);
                // 启动定期检查，当版本一致时自动隐藏提示
                this.startPeriodicCheck();
            }, 2000); // 延迟2秒显示，确保界面加载完成
        } else {
            console.log('没有发现新版本或检查失败');
            // 如果没有更新，检查是否需要隐藏之前的提示
            if (this.currentUpdateInfo) {
                this.hideUpdateNotification();
            }
        }
    },
    
    // 启动定期版本检查
    startPeriodicCheck() {
        // 每5分钟检查一次版本
        this.periodicCheckInterval = setInterval(async () => {
            console.log('定期版本检查...');
            const updateInfo = await this.checkForUpdates();
            
            if (!updateInfo || !updateInfo.hasUpdate) {
                console.log('版本已一致，隐藏更新提示');
                this.hideUpdateNotification();
                clearInterval(this.periodicCheckInterval);
            }
        }, 5 * 60 * 1000); // 5分钟
    }
};

class SettingsManager {
    constructor() {
        this.settings = {
            autoStart: false,
            recognizeText: false,
            recognizeImage: false
        };
        this.loadSettings();
        this.init();
    }

    // 加载设置
    loadSettings() {
        try {
            const saved = localStorage.getItem('imgtops_settings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.warn('无法加载设置:', error);
        }
    }

    // 保存设置
    saveSettings() {
        try {
            localStorage.setItem('imgtops_settings', JSON.stringify(this.settings));
        } catch (error) {
            console.warn('无法保存设置:', error);
        }
    }

    // 初始化设置功能
    init() {
        const settingsBtn = document.getElementById('settings');
        if (settingsBtn) {
            settingsBtn.onclick = () => this.showSettingsModal();
        }

        // 如果设置了自动启动，自动开启监控
        if (this.settings.autoStart) {
            setTimeout(() => {
                const goBtn = document.getElementById('go');
                if (goBtn && !goBtn.classList.contains('active')) {
                    goBtn.click();
                }
            }, 1000);
        }
    }

    // 显示设置弹窗
    showSettingsModal() {
        // 创建设置弹窗
        const modal = document.createElement('div');
        modal.className = 'settings-modal-overlay';
        modal.innerHTML = `
            <div class="settings-modal-content">
                <div class="settings-body">
                    <div class="accordion">
                        <div class="accordion-item active">
                            <div class="accordion-header">
                                <span class="accordion-title">常规设置</span>
                                <span class="accordion-icon">▼</span>
                            </div>
                            <div class="accordion-content">
                                <div class="setting-item">
                                    <label class="setting-label">
                                        <input type="checkbox" id="autoStart" ${this.settings.autoStart ? 'checked' : ''}>
                                        <span class="setting-text">自动启动监控</span>
                                    </label>
                                    <p class="setting-description">打开PS时自动开启监控功能</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="accordion-item">
                            <div class="accordion-header">
                                <span class="accordion-title">附加功能</span>
                                <span class="accordion-icon">▼</span>
                            </div>
                            <div class="accordion-content">
                                <div class="setting-item">
                                    <label class="setting-label">
                                        <input type="checkbox" id="recognizeText" ${this.settings.recognizeText ? 'checked' : ''}>
                                        <span class="setting-text">识别复制文本</span>
                                    </label>
                                    <p class="setting-description">识别剪贴板文本，自动创建文字图层</p>
                                </div>
                                
                                <div class="setting-item">
                                    <label class="setting-label">
                                        <input type="checkbox" id="recognizeImage" ${this.settings.recognizeImage ? 'checked' : ''}>
                                        <span class="setting-text">识别复制图片</span>
                                    </label>
                                    <p class="setting-description">识别电脑复制的图片，自动导入到PS</p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 预留更多设置面板 -->
                        <div class="accordion-item">
                            <div class="accordion-header">
                                <span class="accordion-title">关于脚本</span>
                                <span class="accordion-icon">▼</span>
                            </div>
                            <div class="accordion-content">
                                <div class="setting-item">
                                    <div class="about-info">
                                        <p class="thanks">脚本免费分享，感谢使用，有问题请留言❤️</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="accordion-item">
                            <div class="accordion-header">
                                <span class="accordion-title">有用，赏</span>
                                <span class="accordion-icon">▼</span>
                            </div>
                            <div class="accordion-content">
                                <div class="setting-item">
                                    <div class="reward-layout">
                                        <div class="reward-image">
                                            <img src="assets/sanlian.jpg" alt="感谢支持" style="width: 60px; height: 60px; border-radius: 8px;">
                                        </div>
                                        <div class="reward-text">
                                            <p class="setting-description">不用打赏，如果有用给公众号文章三联就好~ 或者给公众号文章里点点广告~</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 添加样式
        this.addSettingsStyles();

        // 添加到页面
        document.body.appendChild(modal);

        // 显示弹窗
        setTimeout(() => {
            modal.style.display = 'flex';
        }, 10);

        // 绑定事件
        this.bindSettingsEvents(modal);
    }

    // 添加设置弹窗样式
    addSettingsStyles() {
        if (document.getElementById('settings-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'settings-styles';
        styles.textContent = `
            .settings-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 2000;
            }

            .settings-modal-content {
                background: #2a2a2a;
                border-radius: 8px;
                padding: 0;
                width: 320px;
                max-width: 90vw;
                max-height: 80vh;
                border: 1px solid #444;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                display: flex;
                flex-direction: column;
            }

            .settings-body {
                padding: 0;
                border-bottom: none;
                overflow: hidden !important;
                flex: 1;
                position: relative;
                cursor: grab;
            }

            .settings-body:active {
                cursor: grabbing;
            }

            .settings-content {
                padding: 20px;
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                transition: transform 0.1s ease-out;
                will-change: transform;
            }

            /* 折叠面板样式 */
            .accordion {
                border-radius: 6px;
                overflow: hidden;
            }

            .accordion-item {
                border-bottom: 1px solid #444;
            }

            .accordion-item:last-child {
                border-bottom: none;
            }

            .accordion-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px;
                cursor: pointer;
                transition: background-color 0.2s;
            }

            .accordion-header:hover {
                background-color: rgba(255, 255, 255, 0.05);
            }

            .accordion-title {
                color: #fff;
                font-size: 14px;
                font-weight: 600;
            }

            .accordion-icon {
                color: #999;
                font-size: 12px;
                transition: transform 0.3s;
            }

            .accordion-item.active .accordion-icon {
                transform: rotate(180deg);
            }

            .accordion-content {
                max-height: 0;
                overflow: hidden;
                transition: max-height 0.3s ease;
            }

            .accordion-item.active .accordion-content {
                max-height: 300px;
            }

            .setting-item {
                margin-bottom: 0;
                padding: 0 0 10px 0;
            }

            .setting-label {
                display: flex;
                align-items: center;
                cursor: pointer;
            }

            .setting-label input[type="checkbox"] {
                margin-right: 10px;
                width: 16px;
                height: 16px;
            }

            .setting-text {
                color: #fff!important;
                font-size: 12px;
                font-weight: 500;
            }

            .setting-description {
                color: #999;
                font-size: 12px;
                margin: 5px 0 0 26px;
                line-height: 1.4;
            }

            /* 关于脚本样式 */
            .about-info {
                color: #ccc;
                font-size: 12px;
                line-height: 1.6;
            }

            .about-info h4 {
                color: #fff;
                font-size: 14px;
                font-weight: 600;
                margin: 0 0 10px 0;
            }

            .about-info .version,
            .about-info .author,
            .about-info .description,
            .about-info .support {
                margin: 5px 0;
            }

            .about-info .features {
                margin: 10px 0;
                padding-left: 0;
            }

            .about-info .features span {
                display: inline-block;
                margin: 2px 0;
                color: #2da970;
            }

            .about-info .thanks {
                padding-left: 10px;
            }

            /* 打赏布局样式 */
            .reward-layout {
                display: flex;
                align-items: center;
                padding: 10px 0;
            }

            .reward-image {
                flex-shrink: 0;
                margin-right: 10px;
            }

            .reward-text {
                flex: 1;
            }

            .reward-text .setting-description {
                margin: 0;
            }

            .settings-body {
                padding: 10px;
                border-bottom: none;
            }

            /* 更新提示样式 */
            .update-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                background: #2a2a2a;
                border: 1px solid #2da970;
                border-radius: 8px;
                padding: 15px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                max-width: 300px;
                animation: slideInRight 0.3s ease-out;
            }

            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            .update-content {
                color: #fff;
            }

            .update-title {
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 8px;
                color: #2da970;
            }

            .update-info {
                font-size: 12px;
                margin-bottom: 12px;
                color: #ccc;
            }

            .update-actions {
                display: flex;
                gap: 8px;
            }

            .update-btn, .update-later-btn {
                padding: 6px 12px;
                border: none;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .update-btn {
                background: #2da970;
                color: white;
            }

            .update-btn:hover {
                background: #1e7a50;
            }

            .update-later-btn {
                background: #555;
                color: #ccc;
            }

            .update-later-btn:hover {
                background: #666;
            }


        `;

        document.head.appendChild(styles);
    }

    // 绑定设置弹窗事件
    bindSettingsEvents(modal) {
        const autoStartCheckbox = modal.querySelector('#autoStart');

        // 关闭弹窗函数
        const closeModal = () => {
            modal.style.display = 'none';
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300);
        };

        // 点击遮罩关闭
        modal.onclick = (e) => {
            if (e.target === modal) {
                closeModal();
            }
        };

        // ESC键关闭
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        // 折叠面板交互
        const accordionHeaders = modal.querySelectorAll('.accordion-header');
        accordionHeaders.forEach(header => {
            header.onclick = () => {
                const item = header.parentElement;
                const isActive = item.classList.contains('active');
                
                // 关闭所有面板
                modal.querySelectorAll('.accordion-item').forEach(accordionItem => {
                    accordionItem.classList.remove('active');
                });
                
                // 切换当前面板
                if (!isActive) {
                    item.classList.add('active');
                }
            };
        });

        // 获取所有复选框
        const recognizeTextCheckbox = modal.querySelector('#recognizeText');
        const recognizeImageCheckbox = modal.querySelector('#recognizeImage');

        // 保存设置函数
        const saveSetting = (settingKey, value) => {
            this.settings[settingKey] = value;
            this.saveSettings();
            this.showSaveSuccess();
            
            // 1秒后自动关闭弹窗
            setTimeout(() => {
                closeModal();
            }, 1000);
        };

        // 自动启动监控
        if (autoStartCheckbox) {
            autoStartCheckbox.onchange = () => {
                saveSetting('autoStart', autoStartCheckbox.checked);
            };
        }

        // 识别复制文本（Pro版功能）
        if (recognizeTextCheckbox) {
            recognizeTextCheckbox.onchange = () => {
                if (recognizeTextCheckbox.checked) {
                    // 显示Pro版提示
                    if (window.notificationManager) {
                        window.notificationManager.show('此功能仅限Pro版使用', 'info', 3000);
                    }
                    // 取消勾选
                    recognizeTextCheckbox.checked = false;
                }
            };
        }

        // 识别复制图片（Pro版功能）
        if (recognizeImageCheckbox) {
            recognizeImageCheckbox.onchange = () => {
                if (recognizeImageCheckbox.checked) {
                    // 显示Pro版提示
                    if (window.notificationManager) {
                        window.notificationManager.show('此功能仅限Pro版使用', 'info', 3000);
                    }
                    // 取消勾选
                    recognizeImageCheckbox.checked = false;
                }
            };
        }

        // 清理事件监听器
        modal.addEventListener('click', (e) => e.stopPropagation());
    }

    // 显示保存成功提示
    showSaveSuccess() {
        if (window.notificationManager) {
            window.notificationManager.show('设置已保存', 'success', 2000);
        } else {
            // 备用方案，如果全局工具未加载
            const successMsg = document.createElement('div');
            successMsg.textContent = '设置已保存';
            successMsg.className = 'notification-message';
            successMsg.style.cssText = `
                position: fixed;
                top: 5px;
                left: 5px;
                background: #3498db;
                color: white;
                padding: 6px 12px;
                border-radius: 3px;
                font-size: 11px;
                z-index: 3000;
                opacity: 0;
                transition: opacity 0.3s;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            `;

            document.body.appendChild(successMsg);

            // 淡入
            setTimeout(() => {
                successMsg.style.opacity = '1';
            }, 10);

            // 2秒后淡出并移除
            setTimeout(() => {
                successMsg.style.opacity = '0';
                setTimeout(() => {
                    if (successMsg.parentNode) {
                        successMsg.parentNode.removeChild(successMsg);
                    }
                }, 300);
            }, 2000);
        }
    }

    // 获取设置
    getSetting(key) {
        return this.settings[key];
    }

    // 更新设置
    updateSetting(key, value) {
        this.settings[key] = value;
        this.saveSettings();
    }
}

// 全局消息提示工具
class NotificationManager {
    static show(message, type = 'success', duration = 2000, onClick = null) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.className = 'notification-message';
        
        // 如果有点击回调，添加指针样式
        if (onClick) {
            notification.style.cursor = 'pointer';
        }
        
        // 基础样式
         notification.style.cssText = `
              position: fixed;
              top: 5px;
              left: 5px;
              color: white;
              padding: 6px 12px;
              border-radius: 3px;
              font-size: 11px;
              z-index: 3000;
              opacity: 0;
              transition: opacity 0.3s;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          `;
        
        // 根据类型设置背景色
         switch (type) {
             case 'success':
                 notification.style.background = '#3498db';
                 break;
             case 'error':
                 notification.style.background = '#e74c3c';
                 break;
             case 'warning':
                 notification.style.background = '#f39c12';
                 break;
             case 'info':
                 notification.style.background = '#3498db';
                 break;
             default:
                 notification.style.background = '#3498db';
         }

        document.body.appendChild(notification);

        // 点击事件处理
        if (onClick) {
            notification.onclick = () => {
                onClick();
                // 点击后不移除通知，保持显示
                // 通知会一直显示直到版本一致
            };
        }

        // 淡入
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 10);

        // 指定时间后淡出并移除（如果没有点击回调或者duration>0）
        if (duration > 0 && !onClick) {
            setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }, duration);
        }
    }
    
    // 隐藏所有通知
    static hide() {
        const notifications = document.querySelectorAll('.notification-message');
        notifications.forEach(notification => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    }
}

// 初始化设置管理器
document.addEventListener('DOMContentLoaded', () => {
    window.settingsManager = new SettingsManager();
    window.notificationManager = NotificationManager;
    
    // 初始化版本检查
    VersionManager.init();
});