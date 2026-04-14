         const SVG_BOOK = `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`;
         const SVG_USER = `<svg class="avatar-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>`;
         const SVG_BOT = `<svg class="avatar-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4M8 16h8"/></svg>`;
         const SVG_WEB = `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;
         const SVG_PHOTO = `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0"/></svg>`;
         const SVG_SET = `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
         const SVG_PHONE = `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;
         const SVG_MSG = `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
         const SVG_MUSIC = `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
         
         const defaultGlobal = { apiUrl: '', apiKey: '', model: '', bubbleCss: '', chatBottomBarColor: '', fontUrl: '', font: 'inherit', globalFontSize: 10, homeBg: '', swPhoto: '', meName: '我', meAvatar: '', showBubbleName: false, chatNavRounded: false, lockScreenCode: '0101', apps: { g1: '', g2: '', g3: '', twitter: '', d1: '', d2: '', d3: '' }, appPos: { 'app-g1': {l:'5%',t:'5%'}, 'app-g2': {l:'29%',t:'5%'}, 'app-twitter-icon': {l:'53%',t:'5%'}, 'app-g3': {l:'77%',t:'5%'} }, sumPrompts: [ { label: '情感总结', text: '以第三人称详细总结上述对话核心，保留人物情感。' }, { label: '核心事件', text: '提取关键事件和设定，忽略无关闲聊。' }, { label: '极简客观', text: '客观记录对话重点。' } ], stickerGroups: [{id: 'default', name: '全部资源', stickers: [], access: []}], bubblePresets: [], apiPresets: [], thPresets: [], worldviews: [{ id: 'default', name: 'SOAP.OS 主宇宙', prompt: '这是一个极简、克制、注重排版与秩序感的现代社交平台。' }], currentWorldviewId: 'default' };
let gConfig = { ...defaultGlobal };
         let currentSmGroupId = 'default'; 
         let currentChatStGroupId = 'default'; 
         let selectedStickers = new Set();
         
         // ================= 新增：全局分类变量与过滤函数 =================
         window.currentContactFilter = 'ALL';
         function switchFilter(btn, targetGroup) {
             document.querySelectorAll('.f-tab').forEach(tab => tab.classList.remove('active'));
             btn.classList.add('active');
             
             // 核心修复：安全锁定局部横向滚动，绝对不拉扯外部主屏幕
             const scrollArea = btn.parentElement;
             const scrollLeftTarget = btn.offsetLeft - (scrollArea.offsetWidth / 2) + (btn.offsetWidth / 2);
             scrollArea.scrollTo({ left: scrollLeftTarget, behavior: 'smooth' });
         
             window.currentContactFilter = targetGroup;
             
             // 触发列表重新渲染以应用过滤状态
             renderContacts();
         }
         const defaultWidget = { name: '我', sign: '⭑𓏴 □肥皂机🦷丨⛓️𓏴⭒', avatar: '', bg: '', bgMode: 'gradient', bgGradDir: 'to right', b1: '情绪稳定', b2: '边界感', b3: '自由', clipColor: '#1C1C1E', clipSize: 55, avatarSize: 100, wgStyle: 'normal', pImg1: '', pImg2: '' };
         let wgData = { ...defaultWidget }; 
         
         // 新增：高定艺术组件的独立数据
         const defaultArtWidget = { name: 'EUPHORIA', sign: 'An aesthetic exploration of self.', avatar: '' };
         let artWidgetData = { ...defaultArtWidget };
         
         let masks = []; /* 彻底清空默认面具 */
         let isPolaroidSwapped = false; // 控制拍立得前后翻转状态
         const defaultContacts = []; /* 彻底清空默认联系人 */
         
         let contacts = []; let worldbooks = []; let phoneLogs = [];
         let currentContactId = null; let isEditingList = false; let activeScatterIndex = null; let pressTimer = null; let isDragMode = false;
         let pendingToastContactId = null; let toastTimeout = null;
         let isChatMultiSelect = false;
         
         // ================= 全新：光标字典与渲染引擎 =================
         const cursorDict = {
             'ecg': { name: '经典心电图', html: `<div class="cursor-icon-box"><svg viewBox="0 0 80 30" width="100%" height="100%"><path d="M0,15 L15,15 L18,5 L22,25 L25,15 C20,5 32,-5 40,10 C48,-5 60,5 55,15 L40,28 L25,15 L30,25 L35,5 L38,15 L80,15" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" style="stroke-dasharray: 120; stroke-dashoffset: 120; animation: ecgBeat 2.2s linear infinite;"/></svg></div>` },
             'heart': { name: '跳动爱心', html: `<div class="cursor-icon-box"><div class="gap-heart-container" style="width:22px; height:22px;"><svg class="heart-ghost" viewBox="0 0 24 24" style="width:100%; height:100%; position:absolute; stroke:currentColor; fill:none; stroke-width:1.5;"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3c1.18 0 2.27.38 3.15 1.02 M21.9 6.8C21.96 7.34 22 7.9 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35"/></svg><svg class="heart-main" viewBox="0 0 24 24" style="width:100%; height:100%; stroke:currentColor; fill:none; stroke-width:1.5;"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3c1.18 0 2.27.38 3.15 1.02 M21.9 6.8C21.96 7.34 22 7.9 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35"/></svg></div></div>` },
             'waveform': { name: '灵魂声纹', html: `<div class="cursor-icon-box"><div class="cw-waveform"><div class="cw-wave-bar"></div><div class="cw-wave-bar"></div><div class="cw-wave-bar"></div><div class="cw-wave-bar"></div></div></div>` },
             'astrolabe': { name: '宿命星轨', html: `<div class="cursor-icon-box"><div class="cw-astrolabe"><div class="cw-astro-ring"></div><div class="cw-astro-star cw-astro-s1">✦</div><div class="cw-astro-star cw-astro-s2">✧</div><div class="cw-astro-center">★</div></div></div>` },
             'gears': { name: '齿轮推演', html: `<div class="cursor-icon-box"><div class="cw-gears"><svg class="cw-gear-svg cw-gear-1" viewBox="0 0 24 24"><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" stroke-linecap="round"/><circle cx="12" cy="12" r="6" stroke-dasharray="2 2"/></svg><svg class="cw-gear-svg cw-gear-2" viewBox="0 0 24 24"><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" stroke-linecap="round"/><circle cx="12" cy="12" r="5"/></svg></div></div>` },
             'decoding': { name: '潜意识解码', html: `<div class="cursor-icon-box"><div class="cw-cyber-term"><span style="opacity:0.4;">[</span><span class="cw-cyber-spinner"></span><span style="opacity:0.4;">]</span></div></div>` },
             'orb': { name: '情绪流体', html: `<div class="cursor-icon-box"><div class="cw-fluid-orb"><div class="cw-fluid-wave"></div></div></div>` },
             'hesitant': { name: '欲言又止', html: `<div class="cursor-icon-box"><div class="cw-typing-hesitant">...</div></div>` },
             'typewriter': { name: '老式打字机', html: `<div class="cursor-icon-box"><div class="cw-typewriter"><div class="cw-hammer cw-h1"></div><div class="cw-hammer cw-h2"></div><div class="cw-hammer cw-h3"></div></div></div>` },
             'pen': { name: '提笔晕墨', html: `<div class="cursor-icon-box"><div class="cw-pen-wrap"><div class="cw-ink-trail"></div><svg class="cw-pen-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg></div></div>` },
             'scribble': { name: '灵感涂鸦', html: `<div class="cursor-icon-box"><div class="cw-scribble-box"><svg viewBox="0 0 24 24" width="100%" height="100%"><path class="cw-scribble-line" d="M3,12 Q6,2 9,12 T15,12 T21,12"/></svg></div></div>` },
             'platinum': { name: '白金星尘', html: `<div class="cursor-icon-box"><div class="cw-luxury-dots"><div class="cw-l-star">✦</div><div class="cw-l-star">✧</div><div class="cw-l-star">✦</div></div></div>` }
         };
