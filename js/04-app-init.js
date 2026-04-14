         window.onload = async () => {
             // 触发 PWA 动态安装引擎
             initSingleFilePWA();
         
             /* 强制默认不全屏：如果新玩家没缓存，直接焊死为 false */
             let savedFS = localStorage.getItem('g_fullscreen');
             if (savedFS === null) {
                 savedFS = 'false';
                 localStorage.setItem('g_fullscreen', 'false');
             }
             
             // 【核心绝杀】：探测如果是从桌面 PWA 启动的（iOS Standalone），无视设置，强行进入全屏融合模式！
             const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
             const isFullscreen = (savedFS === 'true') || isStandalone; 
             
             document.getElementById('setting-fullscreen').checked = isFullscreen; 
             if(isFullscreen) {
                 document.getElementById('main-frame').classList.add('fullscreen-mode');
                 // 将最底层 Body 背景颜色同化为系统主色，彻底消灭刘海和底部下拉的回弹黑条
                 document.body.style.backgroundColor = "var(--c-bg)"; 
             } else {
                 document.getElementById('main-frame').classList.remove('fullscreen-mode');
                 document.body.style.backgroundColor = "#000";
             }
             
             const sC = await LocalDB.getItem('soap_contacts_v28') || await LocalDB.getItem('soap_contacts_v27'); 
             contacts = sC ? JSON.parse(sC) : defaultContacts;
             
             // 🚀 核心修复：为所有没有推特 Handle 的联系人永久分配一个唯一的 Handle，防止重名导致推特错乱！
             let contactsChanged = false;
             contacts.forEach(c => {
                 if (!c.twHandle) {
                     let safeName = c.name.toLowerCase().replace(/[^a-z0-9_]/g, '');
                     let suffix = c.id.replace(/[^a-z0-9]/gi, '').substring(c.id.length - 4);
                     c.twHandle = '@' + (safeName ? safeName + '_' + suffix : 'user_' + suffix);
                     contactsChanged = true;
                 }
             });
             if (contactsChanged) saveData();
             
             const sM = await LocalDB.getItem('soap_masks_v28') || await LocalDB.getItem('soap_masks_v27'); 
             masks = sM ? JSON.parse(sM) : masks;
             
             const sG = await LocalDB.getItem('soap_global_v28') || await LocalDB.getItem('soap_global_v27'); 
             if(sG) {
                 const parsedG = JSON.parse(sG);
                 // 🚀 核心升级：如果内存中只有旧版 stickers 字段，自动迁移至新版档案馆
                 if (parsedG.stickers && !parsedG.stickerGroups) {
                     parsedG.stickerGroups = parsedG.stickers.map(oldG => ({
                         id: 'g' + Math.random().toString(36).substr(2, 9),
                         name: oldG.group || '默认组',
                         stickers: oldG.items || [],
                         access: []
                     }));
                 }
                 gConfig = { ...defaultGlobal, ...parsedG };
             }
             if(!gConfig.sumPrompts) gConfig.sumPrompts = defaultGlobal.sumPrompts;
             if(!gConfig.stickerGroups) gConfig.stickerGroups = defaultGlobal.stickerGroups; 
             
             // 核心修复：在这里判断如果用户关了锁屏，直接瞬间摧毁它！
if(gConfig.enableLockScreen === false) {
    const ls = document.getElementById('lock-screen');
    if(ls) ls.remove();
    // 未开启锁屏时，直接检查更新公告
    setTimeout(checkUpdateNotice, 1000);
} else {
                 // 只有开启时才加载锁屏动画
                 initLockScreen();
             }
             
             // 核心新增：初始化系统的默认英文分组数据
             if(!gConfig.contactGroups || gConfig.contactGroups.length === 0) {
                 gConfig.contactGroups = ['LOVERS', 'FRIENDS', 'FAMILY'];
             }
             renderFilterTabs(); // 启动时立即渲染顶部分组栏
         
             const sW = await LocalDB.getItem('soap_widget_v28') || await LocalDB.getItem('soap_widget_v27'); 
             if(sW) wgData = { ...defaultWidget, ...JSON.parse(sW) };
             
             // 读取艺术组件的独立数据
             const sArt = await LocalDB.getItem('soap_art_widget_v1');
             if(sArt) artWidgetData = { ...defaultArtWidget, ...JSON.parse(sArt) };
             
             // 核心修复：将音乐库的加载也移入异步 LocalDB 引擎，彻底解决大音频文件刷新后丢失的问题！
             const sMdb = await LocalDB.getItem('soap_music_db_v1') || localStorage.getItem('soap_music_db_v1');
    if(sMdb) {
        let parsed = JSON.parse(sMdb);
        if(parsed.daily && parsed.daily.length > 0) m_db.daily = parsed.daily;
        if(parsed.tracks) m_db.tracks = parsed.tracks;
    }

    // 读取推特数据
const sTwV2 = await LocalDB.getItem('soap_tw_data_v2') || localStorage.getItem('soap_tw_data_v2');
const sTwV1 = await LocalDB.getItem('soap_tw_data_v1') || localStorage.getItem('soap_tw_data_v1');
if (sTwV2) {
    twData = JSON.parse(sTwV2);
    renderTwFeed();
} else if (sTwV1) {
    let oldData = JSON.parse(sTwV1);
    twData = { worlds: { 'default': { posts: oldData.posts || [] } } };
    saveTwData();
    renderTwFeed();
}

// ================= 全新：动态分组渲染与管理引擎 =================
         function renderFilterTabs() {
             const area = document.getElementById('contact-filter-area');
             if(!area) return;
             area.innerHTML = '';
             
             const allTab = document.createElement('div');
             allTab.className = `f-tab ${window.currentContactFilter === 'ALL' ? 'active' : ''}`;
             allTab.innerText = 'ALL';
             allTab.onclick = () => switchFilter(allTab, 'ALL');
             area.appendChild(allTab);
         
             gConfig.contactGroups.forEach(g => {
                 const tab = document.createElement('div');
                 tab.className = `f-tab ${window.currentContactFilter === g ? 'active' : ''}`;
                 tab.innerText = g;
                 tab.onclick = () => switchFilter(tab, g);
                 
                 // 长按或右键触发删除
                 let pressTimer;
                 tab.addEventListener('touchstart', (e) => {
                     pressTimer = setTimeout(() => { deleteContactGroup(g); }, 600);
                 }, {passive: true});
                 tab.addEventListener('touchend', () => clearTimeout(pressTimer));
                 tab.addEventListener('touchmove', () => clearTimeout(pressTimer));
                 tab.oncontextmenu = (e) => { e.preventDefault(); deleteContactGroup(g); };
         
                 area.appendChild(tab);
             });
         
             const addBtn = document.createElement('div');
             addBtn.className = 'f-tab';
             addBtn.style.padding = '6px 10px';
             addBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
             addBtn.onclick = () => {
                 const newGroup = prompt("输入新分组名称 (推荐英文)：", "NEW_SECTOR");
                 if(newGroup && newGroup.trim()) {
                     let gName = newGroup.trim().toUpperCase();
                     if(gConfig.contactGroups.includes(gName)) return alert("该分组已存在！");
                     gConfig.contactGroups.push(gName);
                     saveGlobal();
                     renderFilterTabs();
                     renderContacts();
                 }
             };
             area.appendChild(addBtn);
         }
         
         function deleteContactGroup(gName) {
             if(['LOVERS', 'FRIENDS', 'FAMILY'].includes(gName)) {
                 if(!confirm(`【${gName}】是默认核心分组，确定要强行删除吗？\n(该组内的联系人数据完好，但会失去分组标签)`)) return;
             } else {
                 if(!confirm(`确定长按删除自定义分组【${gName}】吗？\n(该组内的联系人数据完好，但会失去分组标签)`)) return;
             }
             gConfig.contactGroups = gConfig.contactGroups.filter(g => g !== gName);
             if(window.currentContactFilter === gName) {
                 window.currentContactFilter = 'ALL';
             }
             saveGlobal();
             renderFilterTabs();
             renderContacts(); 
         }
         
             // 核心修复：双引擎兼容读取！先查本地新数据库，如果没有，去旧版 localStorage 里把老数据捞回来，绝不弄丢！
             const sWb = await LocalDB.getItem('soap_worldbooks_v28') || localStorage.getItem('soap_worldbooks_v28') || localStorage.getItem('soap_worldbooks_v27');
             worldbooks = sWb ? JSON.parse(sWb) : [];
             
             const sPl = await LocalDB.getItem('soap_phonelogs_v28') || localStorage.getItem('soap_phonelogs_v28');
phoneLogs = sPl ? JSON.parse(sPl) : [];

// 核心修复：从数据库恢复推特关注列表
const sFu = await LocalDB.getItem('soap_followed_users_v1') || localStorage.getItem('soap_followed_users_v1');
if (sFu) followedUsers = new Set(JSON.parse(sFu));

// 在启动时加入 updateArtWidgetUI() 渲染独立组件
             applyGlobalConfigToUI(); updateWidgetUI(); updateArtWidgetUI(); renderDesktopApps(); initDraggable(); renderContacts(); renderRoleList(); renderWbList();
             
             document.getElementById('msg-input').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendUserMessage(); } });
             
             // 核心修复：一旦输入框被点击(准备打字)或者发生输入，立刻收起所有我们自己做的底部面板，为手机系统软键盘让路！
             document.getElementById('msg-input').addEventListener('focus', closeChatMenu);
             document.getElementById('msg-input').addEventListener('input', closeChatMenu);
             
             // 激活滑动抽屉引擎
             initDrawerDrag();
         
             // ================= 融合新增：激活双页滑动小白点跟踪引擎 =================
             const swiper = document.getElementById('swiper-container');
             if (swiper) {
                 swiper.addEventListener('scroll', () => {
                     let ratio = swiper.scrollLeft / swiper.clientWidth;
                     let page = Math.round(ratio) + 1;
                     document.querySelectorAll('.page-dots .dot').forEach((d, index) => {
                         if (index + 1 === page) {
                             d.classList.add('active');
                         } else {
                             d.classList.remove('active');
                         }
                     });
                 }, { passive: true });
             }
         };
         
         // 【更新版：滑动抽屉的物理拖拽算法 (适配箭头在顶部的设计)】
         function initDrawerDrag() {
             const handle = document.getElementById('drawer-handle');
             const content = document.getElementById('drawer-content');
             const wrap = document.getElementById('action-drawer-wrap');
             if(!handle || !content || !wrap) return;
         
             let startY = 0;
             let startHeight = 0;
             let isDragging = false;
             let hasMoved = false;
             const MAX_HEIGHT = 110;
         
             // 手指按住提手时
             handle.addEventListener('touchstart', (e) => {
                 // 【新增优先权逻辑：只要用户想摸抽屉，直接强制收起底部的所有面板】
                 document.getElementById('sticker-panel').classList.remove('show');
                 document.getElementById('attachment-panel').classList.remove('show');
                 document.getElementById('input-row').style.paddingBottom = 'calc(12px + var(--safe-bottom))';
         
                 startY = e.touches[0].clientY;
                 startHeight = wrap.classList.contains('open') ? MAX_HEIGHT : 0;
                 isDragging = true;
                 hasMoved = false;
                 content.classList.add('dragging'); // 剥夺CSS动画，立刻跟手
                 content.style.height = startHeight + 'px';
             }, {passive: true});
         
             // 手指滑动时
             handle.addEventListener('touchmove', (e) => {
                 if(!isDragging) return;
                 let deltaY = startY - e.touches[0].clientY; // 往上拉时 deltaY 是正数
                 if (Math.abs(deltaY) > 5) hasMoved = true; 
                 
                 if (hasMoved) {
                     let newHeight = Math.max(0, Math.min(MAX_HEIGHT, startHeight + deltaY));
                     content.style.height = newHeight + 'px';
                     content.style.opacity = Math.max(0.1, newHeight / MAX_HEIGHT); 
                 }
             }, {passive: true}); 
         
             // 手指松开时
             handle.addEventListener('touchend', (e) => {
                 if(!isDragging) return;
                 isDragging = false;
                 content.classList.remove('dragging'); // 恢复CSS弹跳动画
                 content.style.height = ''; 
                 content.style.opacity = '';
         
                 if (hasMoved) {
                     let deltaY = startY - e.changedTouches[0].clientY;
                     let finalHeight = startHeight + deltaY;
                     if (finalHeight > MAX_HEIGHT / 2) {
                         wrap.classList.add('open'); // 给外壳加 open，控制内部高度和箭头旋转
                         // 【修复】：去掉多余的 display: none，交由 class 控制
                         // document.getElementById('sticker-panel').style.display = 'none'; 
                         document.getElementById('input-row').style.paddingBottom = 'calc(12px + var(--safe-bottom))';
                     } else {
                         wrap.classList.remove('open');
                     }
                 } else {
                     if (wrap.classList.contains('open')) {
                         wrap.classList.remove('open');
                     } else {
                         wrap.classList.add('open');
                         // 【修复】：去掉多余的 display: none，交由 class 控制
                         // document.getElementById('sticker-panel').style.display = 'none'; 
                         document.getElementById('input-row').style.paddingBottom = 'calc(12px + var(--safe-bottom))';
                     }
                 }
             });
         }
