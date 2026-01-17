// 弹窗交互功能
function showModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) {
        modalOverlay.style.display = 'flex';
    }
}

function hideModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) {
        modalOverlay.style.display = 'none';
    }
}

// 初始化弹窗功能
function initModal() {
    const infoIcon = document.getElementById('info-icon');
    const modalOverlay = document.getElementById('modal-overlay');
    
    if (infoIcon) {
        infoIcon.onclick = showModal;
    }
    
    if (modalOverlay) {
        modalOverlay.onclick = function(e) {
            if (e.target === modalOverlay) {
                hideModal();
            }
        };
    }
    
    // ESC键支持
    document.onkeydown = function(e) {
        if (e.key === 'Escape') {
            hideModal();
        }
    };
}

// 延迟初始化，确保DOM加载完成
setTimeout(initModal, 100);