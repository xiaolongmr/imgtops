/* 图片导导 Lite - 一键安装脚本
 * 版本: 1.0.0
 * 描述: 为图片导导 UXP 插件提供一键安装、卸载功能
 * 要求: Photoshop 2022+ (version 23.0.0+)
 */

var PLUGIN_ID = "top.z-l.imgtops";
var PLUGIN_NAME = "图片导导 Lite";
var PLUGIN_FOLDER = "图片导导";
var OLD_PLUGIN_FOLDERS = ["ImgToPS v0.1.1", "ImgToPS"]; // 旧版本插件名称

/* 读取 manifest.json 获取插件版本 */
function getPluginVersion() {
    var scriptPath = File($.fileName).path;
    var manifestFile = new File(scriptPath + "/" + PLUGIN_FOLDER + "/manifest.json");
    
    if (!manifestFile.exists) {
        return "未知版本";
    }
    
    manifestFile.open("r");
    var content = manifestFile.read();
    manifestFile.close();
    
    // 简单解析 version 字段
    var versionMatch = content.match(/"version"\s*:\s*"([^"]+)"/);
    if (versionMatch) {
        return versionMatch[1];
    }
    
    return "未知版本";
}

/* 读取已安装插件的版本号 */
function getInstalledVersion(pluginsPath) {
    var manifestFile = new File(pluginsPath + PLUGIN_FOLDER + "/manifest.json");
    
    if (!manifestFile.exists) {
        return null;
    }
    
    manifestFile.open("r");
    var content = manifestFile.read();
    manifestFile.close();
    
    var versionMatch = content.match(/"version"\s*:\s*"([^"]+)"/);
    if (versionMatch) {
        return versionMatch[1];
    }
    
    return null;
}

/* 递归复制文件夹 */
function copyFolder(currentDir, targetDir) {
    var currentDirFolder = new Folder(currentDir);
    var targetDirFolder = new Folder(targetDir);
    
    if (!currentDirFolder.exists) {
        return -1;
    }
    
    if (!targetDirFolder.exists) {
        targetDirFolder.create();
    }
    
    /* 复制文件 */
    var files = currentDirFolder.getFiles(function(stuff) {
        return stuff instanceof File;
    });
    
    for (var i = 0; i < files.length; i++) {
        var f = new File(files[i]);
        if (f.exists) {
            var str = decodeURI(files[i]);
            var lastSlash = str.lastIndexOf("/") + 1;
            var fileName = str.substring(lastSlash);
            f.copy(targetDir + encodeURI(fileName));
        }
    }
    
    /* 复制子文件夹 */
    var subFolders = currentDirFolder.getFiles(function(stuff) {
        return stuff instanceof Folder;
    });
    
    for (var i = 0; i < subFolders.length; i++) {
        var str = decodeURI(subFolders[i]);
        var lastSlash = str.lastIndexOf("/");
        var folderName = str.substring(lastSlash);
        var newTargetDir = targetDir + encodeURI(folderName);
        var newFolder = new Folder(newTargetDir);
        
        if (!newFolder.exists) {
            newFolder.create();
        }
        
        copyFolder(subFolders[i], newTargetDir + "/");
    }
    
    return 1;
}

/* 打开文件夹 */
function openFolder(path) {
    var f = new Folder(path);
    f.execute();
}

/* 显示安装结束对话框 */
function showRestartDialog(installWin) {
    var dlg = new Window("dialog", "安装成功");
    dlg.spacing = 10;
    dlg.add("statictext", undefined, "安装成功！请重启 Photoshop 使用");
    dlg.add("statictext", undefined, "插件位置：增效工具 > 图片导导Lite");
    
    var btnClose = dlg.add("button", undefined, "完成安装");
    btnClose.size = [200, 35];
    btnClose.onClick = function() {
        dlg.close();
        installWin.close();
    }
    
    dlg.show();
}

/* 显示消息窗口 */
function showMessage(title, message) {
    var d = new Window("dialog", title);
    d.spacing = 2;
    
    var txt1 = d.add("statictext");
    txt1.text = message;
    
    d.add("statictext", undefined, "  ");
    
    var btnClose = d.add("Button { text: '关闭', properties: { name: 'Cancel' }}");
    btnClose.size = [200, 30];
    
    d.show();
}

/* 获取当前运行的 Photoshop 路径 */
function getCurrentPSPath() {
    try {
        // 直接获取当前 PS 的安装目录
        var psPath = Folder.appPackage;
        if (psPath) {
            var pluginsPath = psPath + "/Plug-ins/";
            var pluginsFolder = new Folder(pluginsPath);
            if (pluginsFolder.exists) {
                return pluginsPath;
            }
        }
    } catch (e) {
        // 失败
    }
    return null;
}

/* 修改注册表启用 UXP 插件权限 */
function enableUXPPlugins() {
    try {
        var wsh = new ActiveXObject("WScript.Shell");
        
        /* 启用 PlayerDebugMode */
        var psVersion = "190.0"; /* Photoshop 2022+ */
        wsh.RegWrite("HKCU\\Software\\Adobe\\Photoshop\\" + psVersion + "\\PlayerDebugMode", "1", "REG_SZ");
        
        /* 启用 DeveloperMode for UXP */
        wsh.RegWrite("HKCU\\Software\\Adobe\\CommonFiles\\UXP\\DeveloperMode", "1", "REG_SZ");
        
        return true;
    } catch (e) {
        /* 如果 ActiveX 不可用，尝试使用 .reg 文件 */
        return false;
    }
}

/* 检测是否已安装 */
function isPluginInstalled(pluginsPath) {
    // 检测新版插件
    var pluginPath = pluginsPath + PLUGIN_FOLDER + "/";
    var pluginFolder = new Folder(pluginPath);
    if (pluginFolder.exists) return true;
    
    // 检测旧版插件
    for (var i = 0; i < OLD_PLUGIN_FOLDERS.length; i++) {
        var oldPath = pluginsPath + OLD_PLUGIN_FOLDERS[i] + "/";
        var oldFolder = new Folder(oldPath);
        if (oldFolder.exists) return true;
    }
    
    return false;
}

/* 递归删除文件夹 */
function deleteFolder(folderPath) {
    var folder = new Folder(folderPath);
    if (!folder.exists) return true;
    
    // 删除所有文件
    var files = folder.getFiles(function(item) {
        return item instanceof File;
    });
    for (var i = 0; i < files.length; i++) {
        files[i].remove();
    }
    
    // 递归删除子文件夹
    var subFolders = folder.getFiles(function(item) {
        return item instanceof Folder;
    });
    for (var i = 0; i < subFolders.length; i++) {
        deleteFolder(subFolders[i].fsName + "/");
    }
    
    // 删除自身
    return folder.remove();
}

/* 卸载插件 */
function uninstallPlugin(pluginsPath) {
    var success = true;
    
    // 卸载新版插件
    var pluginPath = pluginsPath + PLUGIN_FOLDER + "/";
    if (!deleteFolder(pluginPath)) success = false;
    
    // 卸载旧版插件
    for (var i = 0; i < OLD_PLUGIN_FOLDERS.length; i++) {
        var oldPath = pluginsPath + OLD_PLUGIN_FOLDERS[i] + "/";
        if (!deleteFolder(oldPath)) success = false;
    }
    
    return success;
}

/* 主初始化函数 */
function init() {
    /* 检查 PS 版本 */
    var psVersion = parseInt(app.version);
    if (psVersion < 23) {
        showMessage("版本不支持", "不支持该 PS 版本\n支持 Photoshop 2022/2023/2024/2025 版本");
        return;
    }
    
    /* 创建安装窗口 - 加宽以容纳对联 */
    var win = new Window("dialog", "图片导导 - 安装程序");
    win.margins = [0, 10, 0, 10]; // 左右上下边距
    
    /* 创建主面板 - 使用行布局放置对联和内容 */
    var mainPanel = win.add("group");
    mainPanel.orientation = "row";
    mainPanel.spacing = 0;
    mainPanel.margins = 0;
    
    /* 获取脚本所在目录作为基准路径 */
    var scriptBasePath = File($.fileName).path;
    
    /* 左侧对联 - 带顶部偏移 */
    var leftWrapper = mainPanel.add("group");
    leftWrapper.orientation = "column";
    leftWrapper.margins = 0;
    
    var leftTopSpacer = leftWrapper.add("image");
    leftTopSpacer.size = [100, 70]; // 顶部偏移70px
    
    var leftImg = leftWrapper.add("image", undefined, scriptBasePath + "/install/left.png");
    
    /* 中间内容区 */
    var contentPanel = mainPanel.add("group");
    contentPanel.orientation = "column";
    contentPanel.spacing = 5;
    contentPanel.alignment = ["center", "top"];
    
    /* 顶部横幅图片 */
    var topBanner = contentPanel.add("image");
    var topFile = new File(scriptBasePath + "/install/top.png");
    if (topFile.exists) {
        topBanner.image = topFile;
    }
    
    /* 标题图片（使用 center.png） */
    var centerBanner = contentPanel.add("image");
    var centerFile = new File(scriptBasePath + "/install/center.png");
    if (centerFile.exists) {
        centerBanner.image = centerFile;
    }
    
    contentPanel.add("statictext", undefined, "  ");
    
    /* 按钮尺寸 */
    var btnSize = [280, 35];
    
    /* 获取插件版本号 */
    var pluginVersion = getPluginVersion();
    
    /* 一键安装按钮 */
    var btnInstall = contentPanel.add("button", undefined, "一键安装 v" + pluginVersion);
    btnInstall.size = btnSize;
    btnInstall.onClick = function() {
        btnInstall.text = "正在安装...";
        
        /* 获取当前 PS 的路径 */
        var pluginsPath = getCurrentPSPath();
        if (!pluginsPath) {
            // 如果自动获取失败，让用户手动选择
            var selectFolder = Folder.selectDialog("无法自动获取 PS 路径，请选择 Photoshop Plug-ins 目录");
            if (!selectFolder) {
                btnInstall.text = "一键安装 v" + pluginVersion;
                return;
            }
            pluginsPath = selectFolder.fsName + "/";
        }
        
        /* 获取当前脚本路径 */
        var scriptPath = File($.fileName).path;
        var sourceFolder = scriptPath + "/" + PLUGIN_FOLDER + "/";
        
        /* 检查源文件夹是否存在 */
        var source = new Folder(sourceFolder);
        if (!source.exists) {
            showMessage("安装失败", "安装文件缺失\n请检查 " + PLUGIN_FOLDER + " 文件夹是否存在");
            btnInstall.text = "一键安装 v" + pluginVersion;
            return;
        }
        
        /* 检查是否已安装新版 */
        var pluginPath = pluginsPath + PLUGIN_FOLDER + "/";
        var pluginFolder = new Folder(pluginPath);
        if (pluginFolder.exists) {
            var installedVer = getInstalledVersion(pluginsPath);
            var dlg = new Window("dialog", "提示");
            dlg.add("statictext", undefined, PLUGIN_NAME + " 已安装 (v" + installedVer + ")");
            dlg.add("statictext", undefined, "新版本: v" + pluginVersion);
            
            var btnGroup = dlg.add("group");
            btnGroup.orientation = "row";
            btnGroup.spacing = 5;
            
            var btnOpen = btnGroup.add("button", undefined, "打开目录");
            btnOpen.size = [75, 30];
            btnOpen.onClick = function() {
                openFolder(pluginsPath);
            }
            
            var btnOverwrite = btnGroup.add("button", undefined, "覆盖安装");
            btnOverwrite.size = [75, 30];
            btnOverwrite.onClick = function() {
                dlg.close();
                // 删除旧版本后继续安装
                uninstallPlugin(pluginsPath);
                btnInstall.text = "正在安装...";
                var scriptPath = File($.fileName).path;
                var sourceFolder = scriptPath + "/" + PLUGIN_FOLDER + "/";
                var targetPath = pluginsPath + PLUGIN_FOLDER + "/";
                var copyResult = copyFolder(sourceFolder, targetPath);
                if (copyResult === -1) {
                    showMessage("安装失败", "复制文件失败");
                    btnInstall.text = "一键安装 v" + pluginVersion;
                    return;
                }
                var regResult = enableUXPPlugins();
                if (!regResult) {
                    var regFile = new File(scriptPath + "/开启PS插件权限.reg");
                    if (regFile.exists) {
                        showMessage("提示", "无法自动修改注册表，请双击运行「开启PS插件权限.reg」");
                    }
                }
                showRestartDialog(win);
                btnInstall.text = "一键安装 v" + pluginVersion;
            }
            
            var btnClose = btnGroup.add("button", undefined, "关闭");
            btnClose.size = [75, 30];
            btnClose.onClick = function() {
                dlg.close();
            }
            
            dlg.show();
            btnInstall.text = "一键安装 v" + pluginVersion;
            return;
        }
        
        /* 检查并卸载旧版本插件 */
        var oldFolders = [];
        for (var i = 0; i < OLD_PLUGIN_FOLDERS.length; i++) {
            var oldPath = pluginsPath + OLD_PLUGIN_FOLDERS[i] + "/";
            var oldFolder = new Folder(oldPath);
            if (oldFolder.exists) {
                oldFolders.push(OLD_PLUGIN_FOLDERS[i]);
            }
        }
        if (oldFolders.length > 0) {
            var confirmDlg = new Window("dialog", "发现旧版本插件");
            confirmDlg.add("statictext", undefined, "将自动卸载旧版本: " + oldFolders.join(", "));
            
            var btnGroup = confirmDlg.add("group");
            btnGroup.orientation = "row";
            btnGroup.spacing = 10;
            
            var btnContinue = btnGroup.add("button", undefined, "继续");
            btnContinue.size = [80, 30];
            btnContinue.onClick = function() {
                confirmDlg.close();
            }
            
            var btnCancel = btnGroup.add("button", undefined, "取消");
            btnCancel.size = [80, 30];
            btnCancel.onClick = function() {
                confirmDlg.close();
                btnInstall.text = "一键安装 v" + pluginVersion;
                return;
            }
            
            confirmDlg.show();
            uninstallPlugin(pluginsPath);
        }
        
        /* 复制插件文件 */
        var targetPath = pluginsPath + PLUGIN_FOLDER + "/";
        
        try {
            var copyResult = copyFolder(sourceFolder, targetPath);
            
            if (copyResult === -1) {
                showMessage("安装失败", "复制文件失败");
                btnInstall.text = "一键安装 v" + pluginVersion;
                return;
            }
            
            /* 修改注册表 */
            var regResult = enableUXPPlugins();
            
            if (!regResult) {
                /* 如果修改注册表失败，提示用户手动运行 .reg 文件 */
                var regFile = new File(scriptPath + "/开启PS插件权限.reg");
                if (regFile.exists) {
                    showMessage("需要手动操作", "无法自动修改注册表\n请双击运行「开启PS插件权限.reg」文件");
                }
            }
            
            /* 安装完成 - 使用关闭并重启对话框 */
            showRestartDialog(win);
            
        } catch (e) {
            showMessage("安装失败", "安装过程中出现错误: " + e.message);
        }
        
        btnInstall.text = "一键安装 v" + pluginVersion;
    };
    
    /* 卸载按钮 */
    var btnUninstall = contentPanel.add("button", undefined, "卸载插件");
    btnUninstall.size = btnSize;
    btnUninstall.onClick = function() {
        /* 获取当前 PS 的路径 */
        var pluginsPath = getCurrentPSPath();
        if (!pluginsPath) {
            var selectFolder = Folder.selectDialog("无法自动获取 PS 路径，请选择 Photoshop Plug-ins 目录");
            if (!selectFolder) {
                return;
            }
            pluginsPath = selectFolder.fsName + "/";
        }
        
        if (!isPluginInstalled(pluginsPath)) {
            showMessage("卸载提示", "未找到已安装的插件");
            return;
        }
        
        /* 确认卸载 */
        var confirmDlg = new Window("dialog", "卸载确认");
        confirmDlg.spacing = 10;
        confirmDlg.add("statictext", undefined, "确定要卸载插件吗？").alignment = "center";
        
        var btnGroup = confirmDlg.add("group");
        btnGroup.orientation = "row";
        btnGroup.spacing = 10;
        
        var btnConfirm = btnGroup.add("button", undefined, "确认卸载");
        btnConfirm.size = [100, 30];
        btnConfirm.onClick = function() {
            confirmDlg.hide();
            /* 尝试卸载 */
            var uninstallResult = uninstallPlugin(pluginsPath);
            
            if (uninstallResult) {
                showMessage("卸载成功", "插件已成功卸载");
            } else {
                showMessage("卸载失败", "无法删除插件文件夹\n请手动删除: " + pluginsPath + PLUGIN_FOLDER);
                openFolder(pluginsPath);
            }
        }
        
        var btnCancel = btnGroup.add("button", undefined, "取消");
        btnCancel.size = [100, 30];
        btnCancel.onClick = function() {
            confirmDlg.close();
        }
        
        confirmDlg.show();
    };
    
    /* 退出按钮 */
    var btnExit = contentPanel.add("button", undefined, "退出安装");
    btnExit.size = btnSize;
    btnExit.onClick = function() {
        win.close();
    };
    
    /* 用户协议复选框 */
    var checkAgree = contentPanel.add("checkbox", undefined, "阅读并同意用户许可协议");
    checkAgree.value = true;
    checkAgree.onClick = function() {
        var dlg = new Window("dialog", "用户许可协议");
        dlg.alignChildren = ["left", "top"];
        dlg.orientation = "column";
        
        dlg.add("statictext", undefined, "本协议是您与版权所有人之间关于【图片导导 Lite】产品的法律协议");
        var panel1 = dlg.add("panel", undefined, "");
        panel1.size = [400, 1];
        dlg.add("statictext", undefined, "1. 本软件受中华人民共和国《计算机软件保护条例》保护");
        dlg.add("statictext", undefined, "2. 本软件版权归开发者所有");
        dlg.add("statictext", undefined, "3. 不得删除本软件上的版权信息");
        dlg.add("statictext", undefined, "4. 不得对软件进行反向工程");
        var panel2 = dlg.add("panel", undefined, "");
        panel2.size = [400, 1];
        
        var btnOK = dlg.add("Button { text: '我同意', properties: { name: 'OK' }}");
        btnOK.size = [400, 35];
        btnOK.alignment = "center";
        
        dlg.show();
    };
    
    /* 右侧对联 - 带顶部偏移 */
    var rightWrapper = mainPanel.add("group");
    rightWrapper.orientation = "column";
    rightWrapper.margins = 0;
    
    var rightTopSpacer = rightWrapper.add("image");
    rightTopSpacer.size = [100, 70]; // 顶部偏移70px
    
    var rightImg = rightWrapper.add("image", undefined, scriptBasePath + "/install/right.png");
    
    /* 显示窗口 */
    win.show();
}

/* 执行主函数 */
init();
