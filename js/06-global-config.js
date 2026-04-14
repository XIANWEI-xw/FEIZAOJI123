         function applyGlobalConfigToUI() {
     document.getElementById('api-url').value = gConfig.apiUrl || ''; document.getElementById('api-key').value = gConfig.apiKey || ''; 
     
     // 🚀 核心修复：确保 UI 界面能正确回显已保存的颜色
     const bColor = gConfig.chatBottomBarColor || '';
     document.getElementById('me-bottom-bar-color').value = bColor; 
     document.getElementById('me-bottom-bar-color-picker').value = bColor.startsWith('#') ? bColor : '#1c1c1e'; 
     
     const tColor = gConfig.chatBottomTextColor || '';
     document.getElementById('me-bottom-text-color').value = tColor; 
     document.getElementById('me-bottom-text-color-picker').value = tColor.startsWith('#') ? tColor : '#ffffff'; 
     
     const iColor = gConfig.chatBottomIconColor || '';
     document.getElementById('me-bottom-icon-color').value = iColor; 
     document.getElementById('me-bottom-icon-color-picker').value = iColor.startsWith('#') ? iColor : '#ffffff'; 
             
             document.getElementById('me-font-url').value = gConfig.fontUrl; document.getElementById('me-font').value = gConfig.font; document.getElementById('global-font-size').value = gConfig.globalFontSize || 10; document.getElementById('app-label-font-size').value = gConfig.appLabelFontSize || 11; document.getElementById('me-home-bg-data').value = gConfig.homeBg;
             
             let sel = document.getElementById('model-select');
             if(gConfig.model && !Array.from(sel.options).find(o => o.value === gConfig.model)) {
                 sel.innerHTML += `<option value="${gConfig.model}">${gConfig.model}</option>`;
             }
             sel.value = gConfig.model;
             
             document.getElementById('api-context').value = gConfig.contextSize || 0;
             document.getElementById('api-temp').value = gConfig.temperature !== undefined ? gConfig.temperature : 0.7;
             if(document.getElementById('temp-val')) document.getElementById('temp-val').innerText = gConfig.temperature !== undefined ? gConfig.temperature : 0.7;
             
             if(document.getElementById('me-bubble-css')) document.getElementById('me-bubble-css').value = gConfig.bubbleCss;
             // 🚀 核心修复：不再在全局初始化时覆盖联系人设置页的 CSS 框，保持独立性
         
             if(gConfig.showBubbleName === false) document.body.classList.add('hide-bubble-names'); else document.body.classList.remove('hide-bubble-names');
             
             document.getElementById('me-nav-rounded').checked = gConfig.chatNavRounded === true;
if(gConfig.chatNavRounded) {
    document.body.classList.add('nav-rounded-mode');
} else {
    document.body.classList.remove('nav-rounded-mode');
}

// 恢复热议话题状态
if (gConfig.twTrendingTopic !== undefined) {
    const tInput = document.getElementById('tw-trending-topic');
    if (tInput) tInput.value = gConfig.twTrendingTopic;
}
if (gConfig.twTrendingEnabled === false) {
    const tInput = document.getElementById('tw-trending-topic');
    if (tInput) {
        const el = tInput.closest('.cursor-pointer');
        if (el) {
            const bg = el.querySelector('.space-bg');
            const dot = el.querySelector('.space-dot');
            const iconBg = el.querySelector('.fa-solid').parentElement;
            const subTitle = el.querySelector('.topic-status-text');
            if(bg && dot && iconBg) {
                bg.className = 'w-10 h-5 shrink-0 bg-mono-300 dark:bg-mono-700 rounded-full relative transition-colors space-bg';
                dot.className = 'absolute left-1 top-1 w-3 h-3 bg-white dark:bg-mono-400 rounded-full transition-transform space-dot';
                iconBg.className = 'w-10 h-10 shrink-0 rounded-full bg-mono-100 dark:bg-mono-800 flex items-center justify-center text-[16px] text-mono-400';
                tInput.classList.add('text-mono-500'); tInput.classList.remove('text-mono-600', 'dark:text-mono-950');
                if(subTitle) subTitle.innerText = '已拦截';
            }
        }
    }
}

// 读取并应用锁屏开关状态 (默认开启)
const isLockEnabled = gConfig.enableLockScreen !== false;
document.getElementById('setting-lockscreen').checked = isLockEnabled;
document.getElementById('lock-code-row').style.display = isLockEnabled ? 'block' : 'none';
document.getElementById('setting-lockcode').value = gConfig.lockScreenCode || '0101';
document.getElementById('setting-stream').checked = gConfig.enableStream === true;
         
             if(gConfig.homeBg) document.getElementById('me-home-bg-preview').innerHTML = `<img src="${gConfig.homeBg}">`;
         if(gConfig.swPhoto) { document.getElementById('sw-photo-data').value = gConfig.swPhoto; document.getElementById('sw-photo-preview').innerHTML = `<img src="${gConfig.swPhoto}">`; }
             document.getElementById('me-hero-name').value = gConfig.meName; document.getElementById('me-hero-data').value = gConfig.meAvatar; document.getElementById('me-hero-preview').innerHTML = renderAvatarHTML(gConfig.meAvatar, 'user');
             
             // 【已删除】：以前这串把全局头像同步到艺术组件的代码被删除了，防止互相污染。
         
             const homeEl = document.getElementById('view-home'); 
if(gConfig.homeBg) { 
    homeEl.style.backgroundImage = `url(${gConfig.homeBg})`; 
    homeEl.style.backgroundSize = 'cover'; 
    homeEl.style.backgroundPosition = 'center'; 
    // 核心：触发亮度检测，适配图标文字颜色
    analyzeHomeBgBrightness(gConfig.homeBg);
} else { 
    homeEl.style.backgroundImage = 'none'; 
    homeEl.style.backgroundColor = 'var(--c-bg)'; 
    homeEl.classList.remove('dark-wallpaper');
}
         
             let styleContent = ''; 
             let fFam = gConfig.font && gConfig.font !== 'inherit' ? gConfig.font : ''; 
             if(gConfig.fontUrl) { 
                 styleContent += `@font-face { font-family: 'UserFont'; src: url('${gConfig.fontUrl}'); }\n`; 
                 fFam = fFam ? `'UserFont', ${fFam}` : `'UserFont'`; 
             }
             // 剥除 inherit 的非法拼接，强制退回原生字体族进行保底
             fFam = fFam ? `${fFam}, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif` : `-apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif`;
         
             let fSize = gConfig.globalFontSize || 10;
             let appLabelSize = gConfig.appLabelFontSize || 11;
             
             // 核心修复：建立全系统等比例缩放矩阵
             styleContent += `
                 /* 0. 独立控制：桌面图标名字字号 */
                 .app-label { font-size: ${appLabelSize}px !important; }
                 
                 /* 1. 核心正文字号：移除 .bubble 的强制字号，由专属 style 标签控制，增加自由度 */
                 body, .iphone-frame, .iphone-frame textarea:not(#theater-modal textarea), .iphone-frame input:not(#theater-modal input), .iphone-frame select:not(#theater-modal select), .iphone-frame button:not(#theater-modal button), .c-name, .input-box:not(#theater-modal .input-box), .switch-container label, .me-row-label, .wb-ck-item { 
                     font-family: ${fFam} !important; 
                     font-size: ${fSize}px !important;
                 }
                 /* 气泡字号单独列出，不加 !important，允许被联系人专属 CSS 覆盖 */
                 .bubble { font-size: ${fSize}px; }
                 
                 /* 2. 次级辅助字号 (缩小2px，比如"系统整体全局字号"这些提示标签) */
                 .c-preview, .settings-item label, .form-group label, .toast-msg, .ic-label, .me-island-title, .widget-sign { 
                     font-size: ${Math.max(8, fSize - 2)}px !important; 
                 }
                 /* 3. 极小修饰字号 (缩小3-4px，比如底栏文字、抽屉文字、回形针文字) */
                 .b-text, .ts-bubble, .ts-avatar, .bubble-name, .title-remark-text, .w-block, .action-drawer .cm-text, .chat-menu-panel .cm-text { 
                     font-size: ${Math.max(7, fSize - 3)}px !important; 
                 }
                 /* 4. 标题字号 (放大3-4px) */
                 .nav-header, .nav-title-center, .brand-title, .toast-title, .modal-title, .widget-name { 
                     font-size: ${fSize + 4}px !important; 
                 }
                 
                 /* 5. 朋友圈(Moments) 专属字号挂载 */
                 .m-post-name, .m-profile-name { font-size: ${Math.max(13, fSize + 5)}px !important; font-weight: 800 !important; }
                 .m-post-content, .m-bookmark-content { font-size: ${Math.max(11, fSize + 2)}px !important; line-height: 1.6 !important; color: #4A4A4A !important; }
                 .m-comment-author { font-size: ${Math.max(11, fSize + 3)}px !important; font-weight: 700 !important; }
                 .m-comment-item span, .m-post-time, .m-comment-input { font-size: ${Math.max(10, fSize + 1)}px !important; }
                 .m-square-header-title { font-size: ${fSize + 12}px !important; color: #90959c !important; }
             `; 
             
             // 🚀 核心修复：将底栏背景、文字颜色、图标颜色真正注入到全局 CSS 中
if(gConfig.chatBottomBarColor) {
    styleContent += `\n.bottom-tabs-dark { background: ${gConfig.chatBottomBarColor} !important; border-color: rgba(255,255,255,0.1) !important; }`;
}
if(gConfig.chatBottomTextColor) {
    styleContent += `\n.b-tab .b-text { color: ${gConfig.chatBottomTextColor} !important; opacity: 0.5; }`;
    styleContent += `\n.b-tab.active .b-text { color: ${gConfig.chatBottomTextColor} !important; opacity: 1; }`;
}
if(gConfig.chatBottomIconColor) {
    styleContent += `\n.b-tab .b-icon { color: ${gConfig.chatBottomIconColor} !important; opacity: 0.5; }`;
    styleContent += `\n.b-tab.active .b-icon { color: ${gConfig.chatBottomIconColor} !important; opacity: 1; }`;
}
         
             // 纯净状态：直接将用户复制的完整 CSS 注入，不再强加外壳限制！
             if(gConfig.bubbleCss) styleContent += `\n${gConfig.bubbleCss}`; 
         
         document.getElementById('dynamic-user-style').innerHTML = styleContent; 
         if(gConfig.appPos) { ['app-g1','app-g2','app-twitter-icon','app-g3'].forEach(id => { const el = document.getElementById(id); if(el && gConfig.appPos[id]) { el.style.left = gConfig.appPos[id].l; el.style.top = gConfig.appPos[id].t; } }); }
         }
         
         function saveGlobal() { 
         gConfig.enableLockScreen = document.getElementById('setting-lockscreen').checked;
gConfig.enableStream = document.getElementById('setting-stream').checked;
         gConfig.lockScreenCode = document.getElementById('setting-lockcode').value.trim() || '0101';
         gConfig.chatNavRounded = document.getElementById('me-nav-rounded').checked;
         gConfig.apiUrl = document.getElementById('api-url').value.trim(); 
         gConfig.apiKey = document.getElementById('api-key').value.trim(); 
         gConfig.model = document.getElementById('model-select').value; 
         gConfig.contextSize = parseInt(document.getElementById('api-context').value) || 0;
         gConfig.temperature = parseFloat(document.getElementById('api-temp').value);
         if(isNaN(gConfig.temperature)) gConfig.temperature = 0.7;
         if(document.getElementById('me-bubble-css')) gConfig.bubbleCss = document.getElementById('me-bubble-css').value; 
         gConfig.chatBottomBarColor = document.getElementById('me-bottom-bar-color').value.trim(); gConfig.chatBottomTextColor = document.getElementById('me-bottom-text-color').value.trim(); gConfig.chatBottomIconColor = document.getElementById('me-bottom-icon-color').value.trim(); gConfig.fontUrl = document.getElementById('me-font-url').value.trim(); gConfig.font = document.getElementById('me-font').value; gConfig.globalFontSize = parseInt(document.getElementById('global-font-size').value) || 10; gConfig.appLabelFontSize = parseInt(document.getElementById('app-label-font-size').value) || 11; gConfig.homeBg = document.getElementById('me-home-bg-data').value; gConfig.swPhoto = document.getElementById('sw-photo-data') ? document.getElementById('sw-photo-data').value : ''; saveData(); applyGlobalConfigToUI(); if(currentContactId) renderChatHistory(); }
         
         function saveGlobalApi() { saveGlobal(); alert("API 配置已保存！"); }
         
         function saveGlobalFromCS() { if(!currentContactId) return; const c = contacts.find(x => x.id === currentContactId); c.bubbleCss = document.getElementById('cs-me-bubble-css').value; saveData(); renderChatHistory(); }
         function saveGlobalMe() { gConfig.meName = document.getElementById('me-hero-name').value.trim() || '我'; gConfig.meAvatar = document.getElementById('me-hero-data').value; saveData(); applyGlobalConfigToUI(); if(currentContactId) { updateChatTopUI(); renderChatHistory(); } }
         
         async function fetchModels() { saveGlobal(); if(!gConfig.apiUrl || !gConfig.apiKey) return alert("请填写接口和Key"); const btn = document.getElementById('btn-fetch'); btn.innerText = '拉取中...'; btn.disabled = true; try { const res = await fetch(`${gConfig.apiUrl}/v1/models`, { headers: { 'Authorization': `Bearer ${gConfig.apiKey}` } }); if(!res.ok) throw new Error("拒绝访问"); const data = await res.json(); const sel = document.getElementById('model-select'); sel.innerHTML = ''; if(data.data && data.data.length > 0) { data.data.forEach(m => { const opt = document.createElement('option'); opt.value = m.id; opt.innerText = m.id; sel.appendChild(opt); }); sel.value = gConfig.model; alert("成功！"); saveGlobal(); } } catch(e) { alert("失败:"+e.message); } finally { btn.innerText='拉取可用模型'; btn.disabled=false; } }
         
         function updateWidgetUI() { 
             document.getElementById('wg-name').innerText = wgData.name || '我'; 
             document.getElementById('wg-sign').innerText = wgData.sign || '⭑𓏴 □肥皂机🦷丨⛓️𓏴⭒'; 
             document.getElementById('wg-avatar').innerHTML = renderAvatarHTML(wgData.avatar, 'user'); 
             
             // 【已删除】：以前这串把长卡片签名同步给艺术组件的代码被删除了
         
             const avatarEl = document.getElementById('wg-avatar');
             if(avatarEl) avatarEl.style.transform = `scale(${(wgData.avatarSize || 100) / 100})`;
         
             let isPolaroid = wgData.wgStyle === 'polaroid';
             const wg = document.querySelector('.home-widget'); 
             if(isPolaroid) wg.classList.add('is-polaroid'); else wg.classList.remove('is-polaroid');
         
             // 双层拍立得渲染
             const pBox1 = document.getElementById('p-img-box-1'); const pBox2 = document.getElementById('p-img-box-2');
             pBox1.innerHTML = wgData.pImg1 ? `<img src="${wgData.pImg1}">` : '';
             pBox2.innerHTML = wgData.pImg2 ? `<img src="${wgData.pImg2}">` : '';
             document.getElementById('p-sign-1').innerText = wgData.sign || '⭑𓏴 □肥皂机🦷丨⛓️𓏴⭒';
             document.getElementById('p-sign-2').innerText = wgData.sign || '⭑𓏴 □肥皂机🦷丨⛓️𓏴⭒';
         
             const polaroidWrap = document.getElementById('polaroid-wrap');
             if(isPolaroidSwapped) polaroidWrap.classList.add('swapped'); else polaroidWrap.classList.remove('swapped');
         
             // 重新构建底部锚定逻辑，双重阴影保障深色清晰度，精确卡点拍立得
             let cSize = wgData.clipSize !== undefined ? wgData.clipSize : 55;
             let scaleVal = cSize / 55; // 基础尺寸设为55px进行缩放
             const clipBack = document.getElementById('wg-paperclip-back');
             const clipFront = document.getElementById('wg-paperclip-front');
             const clipLine = document.getElementById('wg-clip-line');
         
             // 让灰线在拍立得模式下依然显示，并跟随缩放和位置变化
             if (clipLine) {
                 clipLine.style.display = cSize <= 0 ? 'none' : 'block';
                 clipLine.style.transform = `scale(${scaleVal})`;
                 clipLine.style.transformOrigin = 'center';
                 clipLine.style.left = isPolaroid ? 'calc(50% - 20px)' : '24px';
                 clipLine.style.top = isPolaroid ? 'calc(50% - 120px)' : '38px';
                 clipLine.style.width = '40px';
             }
         
             if (clipBack) { 
                 clipBack.style.width = '55px'; clipBack.style.height = '55px'; 
                 clipBack.style.transformOrigin = 'bottom center';
                 clipBack.style.transform = `scale(${scaleVal})`; 
                 clipBack.style.color = wgData.clipColor || '#1C1C1E'; 
                 clipBack.style.display = cSize <= 0 ? 'none' : 'flex'; 
                 clipBack.style.left = isPolaroid ? 'calc(50% - 28px)' : '32px';
                 clipBack.style.top = isPolaroid ? 'calc(50% - 146px)' : '-16px';
             }
             if (clipFront) { 
                 clipFront.style.width = '55px'; clipFront.style.height = '55px'; 
                 clipFront.style.transformOrigin = 'bottom center';
                 clipFront.style.color = wgData.clipColor || '#1C1C1E'; 
                 clipFront.style.display = cSize <= 0 ? 'none' : 'flex'; 
                 clipFront.style.filter = `drop-shadow(0px 4px 6px rgba(0,0,0,0.3)) drop-shadow(0px 1px 1px rgba(255,255,255,0.15))`;
                 clipFront.style.left = isPolaroid ? 'calc(50% - 8px)' : '52px';
                 clipFront.style.top = isPolaroid ? 'calc(50% - 138px)' : '-8px';
                 
                 // 当拍立得翻转时，让前面的回旋针跟着微微倾斜，质感拉满
                 if(isPolaroid) {
                     let rot = isPolaroidSwapped ? 'rotate(3deg)' : 'rotate(-3deg)';
                     clipFront.style.transform = `scale(${scaleVal}) ${rot}`;
                 } else {
                     clipFront.style.transform = `scale(${scaleVal})`;
                 }
             }
         
             const bgImg = document.getElementById('wg-img-bg'); 
         
             if (wgData.bgMode === 'transparent') { 
                 wg.style.background = 'transparent'; wg.style.border = 'none'; wg.style.boxShadow = 'none'; wg.style.backdropFilter = 'none'; 
                 bgImg.style.maskImage = 'none'; bgImg.style.webkitMaskImage = 'none';
                 bgImg.innerHTML = ''; 
             } else if (wgData.bgMode === 'solid') { 
                 wg.style.background = '#fff'; wg.style.border = '0.5px solid rgba(0,0,0,0.05)'; wg.style.boxShadow = '0 16px 40px rgba(0,0,0,0.04)'; wg.style.backdropFilter = 'none'; 
                 bgImg.style.maskImage = 'none'; bgImg.style.webkitMaskImage = 'none';
                 bgImg.innerHTML = wgData.bg ? `<img src="${wgData.bg}" style="opacity:1; width:100%; height:100%; object-fit:cover;">` : ''; 
             } else {
                 wg.style.background = 'transparent'; 
                 wg.style.border = 'none'; 
                 wg.style.boxShadow = 'none'; 
                 wg.style.backdropFilter = 'none'; 
                 let dir = wgData.bgGradDir || 'to right';
                 let maskCss = dir === 'radial' ? 'radial-gradient(circle at center, rgba(0,0,0,1) 33%, rgba(0,0,0,0) 100%)' : `linear-gradient(${dir}, rgba(0,0,0,1) 66%, rgba(0,0,0,0) 100%)`;
                 bgImg.style.maskImage = maskCss; 
                 bgImg.style.webkitMaskImage = maskCss;
                 bgImg.innerHTML = wgData.bg ? `<img src="${wgData.bg}" style="opacity:1; width:100%; height:100%; object-fit:cover;">` : ''; 
             } 
             
             const b1 = document.getElementById('wg-b1'); const b2 = document.getElementById('wg-b2'); const b3 = document.getElementById('wg-b3'); 
             b1.innerText = wgData.b1; b1.style.display = wgData.b1 ? 'block' : 'none'; 
             b2.innerText = wgData.b2; b2.style.display = wgData.b2 ? 'block' : 'none'; 
             b3.innerText = wgData.b3; b3.style.display = wgData.b3 ? 'block' : 'none'; 
         }
         
         function togglePolaroidFlip(e) {
             if(isDragMode) return;
             e.stopPropagation();
             isPolaroidSwapped = !isPolaroidSwapped;
             updateWidgetUI();
         }
         
         function switchFolderTab(tab) {
             document.getElementById('wg-style-data').value = tab;
             document.getElementById('ftab-normal').classList.remove('active');
             document.getElementById('ftab-polaroid').classList.remove('active');
             document.getElementById('ftab-' + tab).classList.add('active');
             document.getElementById('fcontent-normal').style.display = tab === 'normal' ? 'block' : 'none';
             document.getElementById('fcontent-polaroid').style.display = tab === 'polaroid' ? 'block' : 'none';
         }
         
         function setWgBgMode(mode) { 
             document.getElementById('wg-bg-mode').value = mode; 
             document.getElementById('btn-bg-solid').classList.remove('active'); document.getElementById('btn-bg-grad').classList.remove('active'); document.getElementById('btn-bg-trans').classList.remove('active'); 
             if(mode==='solid') document.getElementById('btn-bg-solid').classList.add('active'); if(mode==='gradient') document.getElementById('btn-bg-grad').classList.add('active'); if(mode==='transparent') document.getElementById('btn-bg-trans').classList.add('active'); 
             const dirBox = document.getElementById('wg-grad-dir-container');
             if(dirBox) dirBox.style.display = mode === 'gradient' ? 'block' : 'none';
         }
         
         function setWgGradDir(dir) {
             document.getElementById('wg-bg-grad-dir').value = dir;
             ['right', 'left', 'bottom', 'top', 'radial'].forEach(d => { const el = document.getElementById('dir-' + d); if(el) el.classList.remove('active'); });
             const activeId = dir === 'to right' ? 'right' : dir === 'to left' ? 'left' : dir === 'to bottom' ? 'bottom' : dir === 'to top' ? 'top' : 'radial';
             if(document.getElementById('dir-' + activeId)) document.getElementById('dir-' + activeId).classList.add('active');
         }
         
         // ================= 全新：艺术组件独立控制引擎 =================
         function updateArtWidgetUI() {
             const artName = document.getElementById('art-widget-name');
             if (artName) artName.innerText = (artWidgetData.name || 'EUPHORIA').toUpperCase();
             
             const artSign = document.getElementById('art-widget-sign');
             if (artSign) artSign.innerText = artWidgetData.sign || 'An aesthetic exploration of self.';
         
             const artAvatar = document.getElementById('art-widget-avatar');
             if (artAvatar) {
                 if (artWidgetData.avatar && (artWidgetData.avatar.startsWith('data:image') || artWidgetData.avatar.startsWith('http'))) {
                     artAvatar.innerHTML = `<img src="${artWidgetData.avatar}" style="width:100%; height:100%; object-fit:cover; display:block; filter:contrast(1.1) brightness(0.95);">`;
                 } else {
                     artAvatar.innerHTML = ''; 
                 }
             }
         }
         
         function openArtWidgetEdit() {
             if(isDragMode) return;
             document.getElementById('art-wg-name').value = artWidgetData.name || '';
             document.getElementById('art-wg-sign').value = artWidgetData.sign || '';
             document.getElementById('art-wg-data').value = artWidgetData.avatar || '';
             
             const preview = document.getElementById('art-wg-preview');
             if (artWidgetData.avatar) {
                 preview.innerHTML = `<img src="${artWidgetData.avatar}" style="width:100%; height:100%; object-fit:cover;">`;
             } else {
                 preview.innerHTML = '点击上传';
             }
             
             document.getElementById('art-widget-modal').classList.add('active');
         }
         
         function closeArtWidgetEdit() {
             document.getElementById('art-widget-modal').classList.remove('active');
         }
         
         function saveArtWidget() {
             artWidgetData.name = document.getElementById('art-wg-name').value.trim();
             artWidgetData.sign = document.getElementById('art-wg-sign').value.trim();
             artWidgetData.avatar = document.getElementById('art-wg-data').value;
             saveData();
             updateArtWidgetUI();
             closeArtWidgetEdit();
         }
         // ================================================================
         
         function openWidgetEdit() { 
             if(isDragMode) return; 
             document.getElementById('wg-form-name').value = wgData.name; 
             document.getElementById('wg-form-sign').value = wgData.sign; 
             
             // 普通模式数据
             document.getElementById('wg-form-data').value = wgData.avatar; 
             document.getElementById('wg-form-preview').innerHTML = renderAvatarHTML(wgData.avatar, 'user'); 
             document.getElementById('wg-bg-data').value = wgData.bg === 'transparent' ? '' : wgData.bg; 
             document.getElementById('wg-bg-preview').innerHTML = wgData.bg && wgData.bg !== 'transparent' ? `<img src="${wgData.bg}">` : '背景图'; 
             document.getElementById('wg-b1-input').value = wgData.b1; 
             document.getElementById('wg-b2-input').value = wgData.b2; 
             document.getElementById('wg-b3-input').value = wgData.b3; 
             document.getElementById('wg-avatar-size').value = wgData.avatarSize !== undefined ? wgData.avatarSize : 100; 
             
             // 拍立得模式数据
             document.getElementById('wg-p1-data').value = wgData.pImg1 || '';
             document.getElementById('wg-p1-preview').innerHTML = wgData.pImg1 ? `<img src="${wgData.pImg1}">` : '照片一';
             document.getElementById('wg-p2-data').value = wgData.pImg2 || '';
             document.getElementById('wg-p2-preview').innerHTML = wgData.pImg2 ? `<img src="${wgData.pImg2}">` : '照片二';
         
             // 通用数据
             document.getElementById('wg-clip-size').value = wgData.clipSize !== undefined ? wgData.clipSize : 55; 
             document.getElementById('wg-clip-color').value = wgData.clipColor || '#1C1C1E'; 
             
             setWgBgMode(wgData.bgMode || 'gradient'); 
             setWgGradDir(wgData.bgGradDir || 'to right'); 
             switchFolderTab(wgData.wgStyle || 'normal'); 
             document.getElementById('widget-modal').classList.add('active'); 
         }
         
         function saveWidget() { 
             wgData.name = document.getElementById('wg-form-name').value.trim(); 
             wgData.sign = document.getElementById('wg-form-sign').value; 
             wgData.avatar = document.getElementById('wg-form-data').value; 
             wgData.bg = document.getElementById('wg-bg-data').value; 
             wgData.bgMode = document.getElementById('wg-bg-mode').value; 
             wgData.bgGradDir = document.getElementById('wg-bg-grad-dir').value; 
             wgData.wgStyle = document.getElementById('wg-style-data').value; 
             wgData.b1 = document.getElementById('wg-b1-input').value.trim(); 
             wgData.b2 = document.getElementById('wg-b2-input').value.trim(); 
             wgData.b3 = document.getElementById('wg-b3-input').value.trim(); 
             wgData.avatarSize = parseInt(document.getElementById('wg-avatar-size').value) || 100; 
             wgData.clipSize = parseInt(document.getElementById('wg-clip-size').value) || 0; 
             wgData.clipColor = document.getElementById('wg-clip-color').value; 
             wgData.pImg1 = document.getElementById('wg-p1-data').value;
             wgData.pImg2 = document.getElementById('wg-p2-data').value;
         
             saveData(); 
             updateWidgetUI(); 
             document.getElementById('widget-modal').classList.remove('active'); 
         }
         
         function renderDesktopApps() { 
    ['g1','g2','g3','twitter','d1','d2','d3'].forEach(k => { const el = document.getElementById(`icon-${k}`); if(el) { if(gConfig.apps[k] && (gConfig.apps[k].startsWith('data:') || gConfig.apps[k].startsWith('http'))) el.classList.add('has-img'); else el.classList.remove('has-img'); } });
    document.getElementById('icon-g1').innerHTML = renderIconHTML(gConfig.apps.g1, SVG_BOOK); 
    document.getElementById('icon-g2').innerHTML = renderIconHTML(gConfig.apps.g2, SVG_PHOTO); 
    document.getElementById('icon-g3').innerHTML = renderIconHTML(gConfig.apps.g3, SVG_SET); if(gConfig.apps.g3) { document.getElementById('icon-g3').classList.remove('dark'); document.getElementById('icon-g3').style.border='none'; } 
    document.getElementById('icon-twitter').innerHTML = renderIconHTML(gConfig.apps.twitter, '<i class="fa-brands fa-twitter" style="font-size:30px;"></i>');
    document.getElementById('icon-d1').innerHTML = renderIconHTML(gConfig.apps.d1, SVG_PHONE); 
    document.getElementById('icon-d2').innerHTML = renderIconHTML(gConfig.apps.d2, SVG_MSG); if(gConfig.apps.d2) document.getElementById('icon-d2').classList.remove('dark'); 
    document.getElementById('icon-d3').innerHTML = renderIconHTML(gConfig.apps.d3, SVG_MUSIC); 
}
function openAppIconEditor() { ['g1','g2','g3','twitter','d1','d2','d3'].forEach(k => { document.getElementById(`ic-${k}-data`).value = gConfig.apps[k] || ''; document.getElementById(`ic-${k}-prev`).innerHTML = renderIconHTML(gConfig.apps[k], '选择'); }); document.getElementById('app-icons-modal').classList.add('active'); }
function saveAppIcons() { ['g1','g2','g3','twitter','d1','d2','d3'].forEach(k => { gConfig.apps[k] = document.getElementById(`ic-${k}-data`).value || gConfig.apps[k]; }); saveData(); renderDesktopApps(); document.getElementById('app-icons-modal').classList.remove('active'); }
function resetAppIcons() { if(!confirm('确定恢复所有应用默认图标吗？')) return; gConfig.apps = { g1:'', g2:'', g3:'', twitter:'', d1:'', d2:'', d3:'' }; saveData(); renderDesktopApps(); document.getElementById('app-icons-modal').classList.remove('active'); }
