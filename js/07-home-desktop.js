         function enterDragMode() { closeCurrentApps(); isDragMode = true; document.getElementById('drag-save-bar').style.display = 'flex'; }
         function exitDragMode() { isDragMode = false; document.getElementById('drag-save-bar').style.display = 'none'; saveGlobal(); }
         function initDraggable() {
         const grid = document.getElementById('desktop-grid'); let dragApp = null; let oX = 0, oY = 0;
         let dragOrigCol = 0, dragOrigRow = 0;
         function startDrag(e) { 
             if (!isDragMode) return; const t = e.target.closest('.draggable-app'); if(!t) return; e.preventDefault(); dragApp = t; dragApp.style.transition = 'none'; 
             const rRect = dragApp.getBoundingClientRect(); const cx = e.touches ? e.touches[0].clientX : e.clientX; const cy = e.touches ? e.touches[0].clientY : e.clientY; 
             oX = cx - rRect.left; oY = cy - rRect.top; 
             let l = parseFloat(dragApp.style.left) || 5; let top = parseFloat(dragApp.style.top) || 5;
             dragOrigCol = Math.round((l - 5) / 24); dragOrigRow = Math.round((top - 5) / 28);
         }
         function doDrag(e) { 
             if (!dragApp || !isDragMode) return; e.preventDefault(); const cRect = grid.getBoundingClientRect(); const cx = e.touches ? e.touches[0].clientX : e.clientX; const cy = e.touches ? e.touches[0].clientY : e.clientY; 
             let x = cx - cRect.left - oX; let y = cy - cRect.top - oY; let px = (x / cRect.width) * 100; let py = (y / cRect.height) * 100; 
             dragApp.style.left = px + '%'; dragApp.style.top = py + '%'; 
         }
         function endDrag(e) { 
             if (!dragApp || !isDragMode) return; 
             let l = parseFloat(dragApp.style.left) || 0; let t = parseFloat(dragApp.style.top) || 0;
             let col = Math.round((l - 5) / 24); let row = Math.round((t - 5) / 28);
             
             col = Math.max(0, Math.min(col, 3)); row = Math.max(0, Math.min(row, 2)); 
             
             // 🛡️ 绝对领域：神圣组件占据了第2行的中间两列 (row: 1, col: 1 和 2)
             if (row === 1 && (col === 1 || col === 2)) {
                 col = dragOrigCol; row = dragOrigRow; // 撞墙，强行弹回原位
             }
         
             // 🔄 图标互换引擎：检测目标位置是否已有其他图标
             const allAppIds = ['app-g1','app-g2','app-twitter-icon','app-g3'];
             let swapApp = null;
             for (let id of allAppIds) {
                 if (id === dragApp.id) continue;
                 let el = document.getElementById(id);
                 if (!el) continue;
                 let elCol = Math.round((parseFloat(el.style.left) - 5) / 24);
                 let elRow = Math.round((parseFloat(el.style.top) - 5) / 28);
                 if (elCol === col && elRow === row) { swapApp = el; break; }
             }
         
             if (swapApp) {
                 // 将被撞的图标瞬间移到拖拽起点的空位，实现完美互换
                 let targetL = (5 + dragOrigCol * 24) + '%'; let targetT = (5 + dragOrigRow * 28) + '%';
                 swapApp.style.transition = 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), left 0.3s, top 0.3s';
                 swapApp.style.left = targetL; swapApp.style.top = targetT;
                 gConfig.appPos[swapApp.id] = { l: targetL, t: targetT };
             }
             
             // 落下当前拖拽的图标
             let myL = (5 + col * 24) + '%'; let myT = (5 + row * 28) + '%';
             dragApp.style.transition = 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), left 0.3s, top 0.3s'; 
             dragApp.style.left = myL; dragApp.style.top = myT;
             gConfig.appPos[dragApp.id] = { l: myL, t: myT }; 
             
             saveData(); dragApp = null; 
         }
         grid.addEventListener('touchstart', startDrag, {passive:false}); grid.addEventListener('touchmove', doDrag, {passive:false}); grid.addEventListener('touchend', endDrag); grid.addEventListener('mousedown', startDrag); document.addEventListener('mousemove', doDrag); document.addEventListener('mouseup', endDrag);
         }
         
         function alignApps() { 
         // 智能对齐模式：读取当前图标位置，就近吸附到标准网格上
         let occupied = {}; // 记录已被占用的网格
         ['app-g1','app-g2','app-twitter-icon','app-g3'].forEach((id) => { 
             const el = document.getElementById(id); 
             if(el) { 
                 let l = parseFloat(el.style.left) || 0;
                 let t = parseFloat(el.style.top) || 0;
                 let col = Math.round((l - 5) / 24);
                 let row = Math.round((t - 5) / 28);
                 col = Math.max(0, Math.min(col, 3));
                 row = Math.max(0, Math.min(row, 2)); 
                 
                 // 防御神圣组件禁区
                 if (row === 1 && (col === 1 || col === 2)) {
                     col = 0; row = 2; // 默认挤到左下角空位
                 }
                 
                 // 简单防重叠：如果格子被占了，往右挪
                 while(occupied[`${col}-${row}`]) {
                     col++; if(col > 3) { col = 0; row++; }
                     if(row > 2) row = 0;
                     if (row === 1 && (col === 1 || col === 2)) col = 3;
                 }
                 occupied[`${col}-${row}`] = true;
         
                 let targetL = (5 + col * 24) + '%';
                 let targetT = (5 + row * 28) + '%';
                 
                 el.style.transition = 'left 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), top 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)'; 
                 el.style.left = targetL; 
                 el.style.top = targetT; 
                 gConfig.appPos[id] = { l: targetL, t: targetT }; 
                 setTimeout(() => el.style.transition = 'transform 0.2s', 400); 
             } 
         }); 
         saveData(); 
         }
         
         function handleAppClick(appId) { 
         if(isDragMode) return; 
         if(appId === 'settings') openApp('settings'); 
         else if (appId === 'g1') openApp('worldbook');
         else if (appId === 'store') openApp('store');
         else if (appId === 'twitter') openApp('twitter');
         else alert('功能开发中'); 
         }
         
         function openApp(appId) { 
         if(isDragMode) return; 
         document.getElementById(`app-${appId}`).classList.add('active'); 
         if (appId === 'messages') { switchMainTab('list'); renderContacts(); document.getElementById('msg-search-input').value=''; } 
         if (appId === 'settings') { switchSettingsTab('api'); } 
         if (appId === 'worldbook') { renderWbList(); }
         if (appId === 'phone') { switchPhoneTab('keypad'); } 
         if (appId === 'store') { initStoreApp(); }
         if (appId === 'twitter') { 
document.getElementById('app-twitter').classList.add('active');
renderTwitterContacts();

// 🚀 核心修复：推特独立数据源，彻底与朋友圈/主系统隔断！
const myName = twData.meName || '我';
const myHandle = twData.meHandle || '@soap_user';

const sidebarName = document.getElementById('sidebar-name');
if(sidebarName) sidebarName.innerText = myName;
const navProfileName = document.getElementById('nav-profile-name');
if(navProfileName) navProfileName.innerText = myName;
const sidebarHandle = document.getElementById('sidebar-handle');
if(sidebarHandle) sidebarHandle.innerText = myHandle;
const navProfileHandle = document.getElementById('nav-profile-handle');
if(navProfileHandle) navProfileHandle.innerText = myHandle;

// 🚀 核心修复：每次打开推特时，瞬间同步全站所有角落属于“我”的头像！
const myAvatarSrc = twData.meAvatar || 'https://api.dicebear.com/7.x/notionists/svg?seed=Zero';
document.querySelectorAll('#app-twitter img[data-avatar="user"]').forEach(img => {
    img.src = myAvatarSrc;
});
    var starBg = document.getElementById('star-bg');
    if(starBg) starBg.classList.remove('frozen');
}
         if (appId === 'music') { 
             initMusicApp(); 
             // 进入音乐软件时，隐藏悬浮窗，并重置用户关闭标签（代表用户又回来听歌了，允许悬浮窗下次出现）
             document.getElementById('soapFloatPlayer').classList.remove('show');
             window.isFloatingPlayerDismissed = false;
         }
         }
         function closeCurrentApps() { 
         document.getElementById('app-messages').classList.remove('active'); 
         document.getElementById('app-settings').classList.remove('active'); 
         document.getElementById('app-worldbook').classList.remove('active');
         document.getElementById('app-phone').classList.remove('active'); 
         const storeApp = document.getElementById('app-store');
         if(storeApp) storeApp.classList.remove('active');
         const musicApp = document.getElementById('app-music');
         if(musicApp) musicApp.classList.remove('active');
         const twitterApp = document.getElementById('app-twitter');
if(twitterApp) {
    if (typeof flushTwSyncToMainChat === 'function') flushTwSyncToMainChat();
    twitterApp.classList.remove('active');
}
    var starBg = document.getElementById('star-bg');
    if(starBg) starBg.classList.add('frozen');
setTimeout(()=>goBackToMain(false),300); 
             
             // 核心修复：只有在有记录、且用户【没有手动关掉悬浮窗】的情况下，才允许它回到桌面时呼出！
             if (currentPlayingData && !window.isFloatingPlayerDismissed && !document.getElementById('app-music').classList.contains('active')) {
                 updateFloatingPlayerUI();
                 document.getElementById('soapFloatPlayer').classList.add('show');
             }
         }
         function switchMainTab(tab) { 
             ['list', 'create', 'moments', 'mask'].forEach(t => { 
                 document.getElementById(`tab-${t}`).classList.remove('active'); 
                 let view = document.getElementById(`view-main-${t}`);
                 view.classList.remove('active'); 
                 // 针对朋友圈特殊处理
                 if(t === 'moments') view.style.display = 'none';
             }); 
             document.getElementById(`tab-${tab}`).classList.add('active'); 
             let activeView = document.getElementById(`view-main-${tab}`);
             activeView.classList.add('active'); 
             
             if(tab === 'create') renderRoleList(); 
             if(tab === 'mask') toggleMaskList(); 
             if(tab === 'list') { document.getElementById('msg-search-input').value=''; renderContacts(); } 
             if(tab === 'moments') {
                 activeView.style.display = 'flex';
                  initMomentsSystem(); // 初始化并渲染朋友圈
              }
          }
          function switchSettingsTab(tab) { document.getElementById('stab-api').classList.remove('active'); document.getElementById('stab-ui').classList.remove('active'); document.getElementById('set-tab-api').style.display = 'none'; document.getElementById('set-tab-ui').style.display = 'none'; document.getElementById(`stab-${tab}`).classList.add('active'); document.getElementById(`set-tab-${tab}`).style.display = 'block'; document.getElementById('settings-title').innerText = tab === 'api' ? 'API 接口' : '视觉与桌面'; }
function renderIconHTML(src, fallback) {
    if (src && (src.startsWith('data:') || src.startsWith('http'))) {
        return `<img src="${src}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;">`;
    }
    return fallback || '';
}

function renderDesktopApps() { 
    ['g1','g2','g3','twitter','d1','d2','d3','checkphone','gallery','chronos','couple','cycle','receipt','couple2'].forEach(k => { const el = document.getElementById(`icon-${k}`); if(el) { if(gConfig.apps[k] && (gConfig.apps[k].startsWith('data:') || gConfig.apps[k].startsWith('http'))) el.classList.add('has-img'); else el.classList.remove('has-img'); } });
    document.getElementById('icon-g1').innerHTML = renderIconHTML(gConfig.apps.g1, SVG_BOOK); 
    document.getElementById('icon-g2').innerHTML = renderIconHTML(gConfig.apps.g2, SVG_PHOTO); 
    document.getElementById('icon-g3').innerHTML = renderIconHTML(gConfig.apps.g3, SVG_SET); if(gConfig.apps.g3) { document.getElementById('icon-g3').classList.remove('dark'); } 
    document.getElementById('icon-twitter').innerHTML = renderIconHTML(gConfig.apps.twitter, '<i class="fa-brands fa-twitter" style="font-size:30px;"></i>');
    document.getElementById('icon-d1').innerHTML = renderIconHTML(gConfig.apps.d1, SVG_PHONE); 
    document.getElementById('icon-d2').innerHTML = renderIconHTML(gConfig.apps.d2, SVG_MSG); if(gConfig.apps.d2) document.getElementById('icon-d2').classList.remove('dark'); 
    document.getElementById('icon-d3').innerHTML = renderIconHTML(gConfig.apps.d3, SVG_MUSIC); 
    const cpIcon = document.getElementById('icon-checkphone');
    if(cpIcon) {
        cpIcon.innerHTML = renderIconHTML(gConfig.apps.checkphone, '<i class="fa-solid fa-mobile-screen" style="font-size:24px;"></i>');
        if(gConfig.apps.checkphone) cpIcon.classList.remove('dark');
    }
    const galIcon = document.getElementById('icon-gallery');
    if(galIcon) {
        galIcon.innerHTML = renderIconHTML(gConfig.apps.gallery, '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/><path d="M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" fill="currentColor"/><path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/><path d="M14 14.5l1.086-1.086a2 2 0 0 1 2.828 0L21 16.5"/></svg>');
    }
    const chrIcon = document.getElementById('icon-chronos');
    if(chrIcon) {
        chrIcon.innerHTML = renderIconHTML(gConfig.apps.chronos, '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/></svg>');
    }
    const coupleIcon = document.getElementById('icon-couple');
    if(coupleIcon) {
        coupleIcon.innerHTML = renderIconHTML(gConfig.apps.couple, '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>');
    }
    const cycleIcon = document.getElementById('icon-cycle');
    if(cycleIcon) {
        cycleIcon.innerHTML = renderIconHTML(gConfig.apps.cycle, '<svg style="position:absolute;top:3px;right:3px;opacity:0.25;" width="8" height="8" viewBox="0 0 24 24" fill="#C06070"><path d="M12 2 L13.8 9.2 L21 12 L13.8 14.8 L12 22 L10.2 14.8 L3 12 L10.2 9.2 Z"/></svg><svg style="position:absolute;bottom:4px;left:4px;opacity:0.15;" width="6" height="6" viewBox="0 0 24 24" fill="#C3A772"><path d="M12 2 L13.8 9.2 L21 12 L13.8 14.8 L12 22 L10.2 14.8 L3 12 L10.2 9.2 Z"/></svg><svg width="26" height="26" viewBox="0 0 32 32" fill="none"><path d="M20 6 C14 6 10 10 10 16 C10 22 14 26 20 26 C16 24 14 21 14 16 C14 11 16 8 20 6 Z" fill="rgba(181,98,110,0.6)" stroke="rgba(181,98,110,0.9)" stroke-width="0.8"/><path d="M22 10 C22 10 18 16 18 19 C18 21.2 19.8 23 22 23 C24.2 23 26 21.2 26 19 C26 16 22 10 22 10 Z" fill="rgba(192,96,112,0.85)" stroke="#C06070" stroke-width="0.5"/><ellipse cx="21" cy="17" rx="1.2" ry="2" fill="rgba(255,255,255,0.25)" transform="rotate(-15 21 17)"/><path d="M12 8 L12.5 9.5 L14 10 L12.5 10.5 L12 12 L11.5 10.5 L10 10 L11.5 9.5 Z" fill="rgba(195,167,114,0.7)"/></svg>');
    }
    const receiptIcon = document.getElementById('icon-receipt');
    if(receiptIcon) {
        receiptIcon.innerHTML = renderIconHTML(gConfig.apps.receipt, '<i class="fa-solid fa-receipt" style="font-size:24px;"></i>');
    }
    const couple2Icon = document.getElementById('icon-couple2');
    if(couple2Icon) {
        couple2Icon.innerHTML = renderIconHTML(gConfig.apps.couple2, '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>');
    }
}

// 覆盖设置文件中的图标编辑器逻辑
window.openAppIconEditor = function() {
    ['g1','g2','g3','twitter','d1','d2','d3','checkphone','gallery','chronos','couple','cycle','receipt','couple2'].forEach(k => {
        const dataEl = document.getElementById(`ic-${k}-data`);
        const prevEl = document.getElementById(`ic-${k}-prev`);
        if(dataEl && prevEl) {
            dataEl.value = gConfig.apps[k] || '';
            prevEl.innerHTML = renderIconHTML(gConfig.apps[k], '');
            if(gConfig.apps[k]) prevEl.classList.add('has-img');
            else prevEl.classList.remove('has-img');
        }
    });
    document.getElementById('app-icons-modal').classList.add('active');
};

window.saveAppIcons = function() {
    ['g1','g2','g3','twitter','d1','d2','d3','checkphone','gallery','chronos','couple','cycle','receipt','couple2'].forEach(k => {
        const dataEl = document.getElementById(`ic-${k}-data`);
        if(dataEl) gConfig.apps[k] = dataEl.value;
    });
    saveData();
    renderDesktopApps();
    document.getElementById('app-icons-modal').classList.remove('active');
};

window.resetAppIcons = function() {
    ['g1','g2','g3','twitter','d1','d2','d3','checkphone','gallery','chronos','couple','cycle','receipt','couple2'].forEach(k => {
        const dataEl = document.getElementById(`ic-${k}-data`);
        const prevEl = document.getElementById(`ic-${k}-prev`);
        if(dataEl && prevEl) {
            dataEl.value = '';
            prevEl.innerHTML = '';
            prevEl.classList.remove('has-img');
            gConfig.apps[k] = '';
        }
    });
    saveData();
    renderDesktopApps();
    document.getElementById('app-icons-modal').classList.remove('active');
};
