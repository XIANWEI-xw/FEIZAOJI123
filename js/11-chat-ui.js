// 全局通用：检测用户是否在指定聊天室（默认为当前聊天室）
function isUserInChatRoom(targetContactId) {
    if (!targetContactId) targetContactId = currentContactId;
    const messagesApp = document.getElementById('app-messages');
    const chatView = document.getElementById('view-chat');
    const theaterModal = document.getElementById('theater-modal');
    return currentContactId === targetContactId &&
           messagesApp && messagesApp.classList.contains('active') &&
           chatView && chatView.classList.contains('slide-in') &&
           !(theaterModal && theaterModal.classList.contains('active'));
}

             function updateChatTopUI() {
             if(!currentContactId) return;
             const c = contacts.find(x => x.id === currentContactId);
             
             // 核心修复：优先级顺序为 专属头像 > 面具头像 > 全局头像
             let uAvatar = gConfig.meAvatar || ''; 
             if(c.maskId) { const m = masks.find(x=>x.id===c.maskId); if(m) uAvatar = m.avatar; }
             if(c.chatMeAvatar) uAvatar = c.chatMeAvatar; // 专属头像最高优先级！
             
             const remarkEl = document.getElementById('chat-title-remark');
             remarkEl.innerText = `★ ${c.chatRemark || c.name} ★`; 
             // 1. 应用独立的备注文字颜色
             remarkEl.style.color = c.chatTopTextColor || '#1C1C1E'; 
             
             const topBotAv = document.getElementById('chat-top-bot-avatar');
             const topMeAv = document.getElementById('chat-top-me-avatar');
             topBotAv.innerHTML = renderAvatarHTML(c.chatAvatar || c.avatar, 'bot');
             topMeAv.innerHTML = renderAvatarHTML(uAvatar, 'user');
             
             const setupDoubleTapNudge = (el, isMe) => {
                 el.onclick = () => {
                     let now = Date.now();
                     let lastTap = parseInt(el.dataset.lastTap) || 0;
                     if (now - lastTap < 300) {
                         triggerNudge(isMe, el);
                         el.dataset.lastTap = 0;
                     } else {
                         el.dataset.lastTap = now;
                     }
                 };
             };
             setupDoubleTapNudge(topBotAv, false);
             setupDoubleTapNudge(topMeAv, true);
             
             const ecgWrap = document.getElementById('top-bar-ecg-wrap');
             if(ecgWrap) {
                 // 2. 应用独立的光标/图标颜色
                 ecgWrap.style.color = c.chatTopIconColor || '#1C1C1E'; 
                 
                 let latestMood = 60;
                 for(let i = c.history.length - 1; i >= 0; i--) {
                     if(c.history[i].role === 'assistant' && c.history[i].mood !== undefined) {
                         latestMood = c.history[i].mood; break;
                     }
                 }
                 ecgWrap.innerHTML = getCursorHTML(c.cursorDefault || 'ecg', latestMood);
             }
         }
         
         function openChat(id) { 
    if(isEditingList) return; 
    currentContactId = id; 
    const c = contacts.find(x => x.id === id); 
    
    exitChatMultiSelect();
    document.getElementById('btn-call-ai').disabled = false; 
    document.getElementById('btn-send').disabled = false; 
    document.querySelector('.btn-menu').disabled = false;
    
    currentChatRenderLimit = 30; 

    updateChatTopUI(); 
    applyChatBackground(c.chatBg); 
    
    // 🚀 核心修复：进入聊天室时，强制重置渲染状态并执行全量渲染
    // 确保在后台期间 history 增加的所有内容都能被画出来
    renderChatHistory(); 
    
    // 🚀 核心修复：极致保底扫描
    // 针对流式传输中可能存在的 DOM 挂载延迟进行二次补齐
    setTimeout(() => {
        const ca = document.getElementById('chat-area');
        if (!ca) return;
        let needsAppend = false;
        const startIdx = Math.max(0, c.history.length - currentChatRenderLimit);
        for (let idx = startIdx; idx < c.history.length; idx++) {
            const m = c.history[idx];
            // 只要是该显示但没在 DOM 里的，全部强制补上
            if (m.role !== 'system' && !m.isTheater && !document.getElementById(`msg-item-${idx}`)) {
                appendBubbleRow(m, idx);
                needsAppend = true;
            }
        }
        if (needsAppend) {
            updateBubbleGrouping();
            scrollToBottom();
        }
    }, 100);

    document.getElementById('view-chat').classList.add('slide-in'); 
}
         
         function goBackToMain(animate = true) { 
             exitChatMultiSelect();
             document.getElementById('view-chat').classList.remove('slide-in'); currentContactId = null; 
             if(animate) {
                 const kw = document.getElementById('msg-search-input').value.trim();
                 if(kw) searchMessages(kw); else renderContacts();
             } 
         }
         
         /* 修复壁纸乱动 Bug：将壁纸绑定到绝对不会改变尺寸的父级外壳 view-chat 上 */
         function applyChatBackground(bgData) { 
             const vc = document.getElementById('view-chat'); 
             if(bgData) { 
                 vc.style.backgroundImage = `url(${bgData})`; 
                 vc.style.backgroundSize = 'cover'; 
                 vc.style.backgroundPosition = 'center'; 
             } else { 
                 vc.style.backgroundImage = 'none'; 
                 vc.style.backgroundColor = 'var(--c-bg)'; 
             } 
         }
         
         // 概率滑块交互逻辑
         function toggleOverrideProb() {
             const wrap = document.getElementById('wrap-override-prob');
             const btn = document.getElementById('btn-override-prob');
             if (wrap.style.display === 'none') {
                 wrap.style.display = 'block'; btn.innerText = '收起 ▲';
             } else {
                 wrap.style.display = 'none'; btn.innerText = '概率设置 ▼';
             }
         }
         function updateOverrideProbVal(val) {
             const labels = ['极低', '偏低', '正常', '偏高', '极高'];
             document.getElementById('override-prob-val').innerText = labels[val - 1];
         }
         
         // 新增：风格选择 UI 控制
         function setOverrideModePref(val) {
             document.getElementById('cs-override-mode-pref').value = val;
             document.querySelectorAll('.override-mode-btn').forEach(btn => {
                 if(btn.getAttribute('data-val') === val) btn.classList.add('active');
                 else btn.classList.remove('active');
             });
         }
         
         // 全局主动消息计时器池
         let proactiveTimers = {};

         function resetProactiveTimer(contactId) {
             if (proactiveTimers[contactId]) {
                 clearTimeout(proactiveTimers[contactId]);
                 delete proactiveTimers[contactId];
             }
             
             const c = contacts.find(x => x.id === contactId);
             if (!c || !c.allowProactive || !c.proactiveInterval || c.proactiveInterval <= 0) return;

             const ms = c.proactiveInterval * 60 * 1000;
             proactiveTimers[contactId] = setTimeout(() => {
                 // 触发主动消息
                 fetchAIReply(contactId, true);
             }, ms);
         }

         function openChatSettings() {
             const c = contacts.find(x => x.id === currentContactId); 
             if(!c) return;

             // 1. 基础信息与面具
             const sel = document.getElementById('cs-mask-select'); 
             sel.innerHTML = '<option value="">不佩戴 (全局默认)</option>';
             masks.forEach(m => { 
                 const opt = document.createElement('option'); 
                 opt.value = m.id; 
                 opt.innerText = m.name; 
                 sel.appendChild(opt); 
             }); 
             sel.value = c.maskId || ''; 
             document.getElementById('cs-remark').value = c.chatRemark || '';

             // 2. 交互开关 (Toggle)
             document.getElementById('cs-aware-time').checked = c.awareTime === true;
             document.getElementById('cs-allow-ai-sticker').checked = c.allowAiSticker === true;
             document.getElementById('cs-allow-action').checked = c.allowAction === true;
             document.getElementById('cs-allow-override').checked = c.allowOverride !== false;
             document.getElementById('cs-allow-proactive').checked = c.allowProactive === true;
             document.getElementById('cs-proactive-interval').value = c.proactiveInterval || 10;
             document.getElementById('cs-allow-bilingual').checked = c.allowBilingual === true;
const targetLang = c.targetLang || 'English';
const presetLangs = ['English', 'Japanese', 'Korean', 'French'];
if (presetLangs.includes(targetLang)) {
    document.getElementById('cs-target-lang').value = targetLang;
    document.getElementById('custom-lang-input-wrap').style.display = 'none';
} else {
    document.getElementById('cs-target-lang').value = 'custom';
    document.getElementById('cs-custom-lang').value = targetLang;
    document.getElementById('custom-lang-input-wrap').style.display = 'block';
}
             
             // 3. 强制线下参数
             document.getElementById('cs-override-prob').value = c.overrideProb || 3;
             updateOverrideProbVal(c.overrideProb || 3);
             setOverrideModePref(c.overrideModePref || 'auto');

             // 4. 视觉美学
             document.getElementById('cs-timestamp-mode').value = c.chatTimestampMode || 'none';
             document.getElementById('cs-top-icon-color').value = c.chatTopIconColor || '#1C1C1E';
             document.getElementById('cs-top-text-color').value = c.chatTopTextColor || '#1C1C1E';
             document.getElementById('cs-font-size').value = c.chatFontSize || '';
             document.getElementById('cs-me-bubble-css').value = c.bubbleCss || '';
             
             // 5. 灵魂与记忆
             document.getElementById('cs-prompt').value = c.history[0].content; 
             document.getElementById('cs-memory').value = c.memory || ''; 
             document.getElementById('cs-auto-sum').value = c.autoSumFreq || 0; 
             document.getElementById('cs-sum-prompt').value = c.sumPrompt || '以第三人称详细总结上述对话核心，保留人物情感。'; 

             // 6. 资源预览 (头像与壁纸)
             document.getElementById('cs-avatar-data').value = c.chatAvatar || ''; 
             document.getElementById('cs-avatar-preview').innerHTML = renderAvatarHTML(c.chatAvatar || c.avatar, 'bot');
             
             document.getElementById('cs-me-avatar-data').value = c.chatMeAvatar || ''; 
             document.getElementById('cs-me-avatar-preview').innerHTML = renderAvatarHTML(c.chatMeAvatar || gConfig.meAvatar, 'user');
             
             document.getElementById('cs-bg-data').value = c.chatBg || ''; 
             if(c.chatBg) document.getElementById('cs-bg-preview').innerHTML = `<img src="${c.chatBg}" style="width:100%; height:100%; object-fit:cover; border-radius:12px;">`; 
             else document.getElementById('cs-bg-preview').innerHTML = 'TAP TO UPLOAD'; 

             // 7. 隐藏面板重置
             document.getElementById('sum-prompt-wrap').style.display = 'none';
             document.getElementById('cursor-menu-wrap').style.display = 'none';
             
             document.getElementById('chat-settings-modal').classList.add('active');
         }
         function closeChatSettings() { document.getElementById('chat-settings-modal').classList.remove('active'); }
         
         function openClearChatHistoryModal() {
             document.getElementById('clear-history-modal').classList.add('active');
         }
         
         function executeClearChatHistory(keepMemory) {
             if(!currentContactId) return;
             const c = contacts.find(x => x.id === currentContactId);
             let targetAvatar = "";
             
             if(c) {
                 targetAvatar = c.chatAvatar || c.avatar; 
                 
                 // 无论如何，聊天记录数组强制只保留最初的第 0 条系统人设
                 if (c.history.length > 0) {
                     c.history = [c.history[0]];
                 }
                 
                 if(!keepMemory) {
                     // 【彻底失忆】：毁灭性清理一切可能导致幻觉的外部状态
                     c.memory = ''; 
                     c.theaterHistory = [];
                     c.lastTheaterSumIndex = 0;
                 }
                 
                 // 🚀 核心防崩引擎：强行打入“时空重置断点”！
                 // 作用1：防止联系人因为 history 被清空而从列表消失。
                 // 作用2：用最强硬的 system 提示挡在最前面，彻底切断 AI 去翻找线下记忆的念头！
                 c.history.push({
                     role: 'system_sum', 
                     content: `<i>✧ 对话已重置</i>\n<span style="display:none;">[最高指令覆写：用户已清空屏幕记录，开启了一段全新的平行对话。请忽略之前的任何环境或线下剧情！立刻以符合你人设的第一句话开场，主动寻找新话题与用户破冰！]</span>`
                 });
                 
                 c.lastSumIndex = 0; 
                 
                 saveData();
                 renderChatHistory(); 
                 
                 const memoryTextarea = document.getElementById('cs-memory');
                 if(memoryTextarea) {
                     memoryTextarea.value = c.memory || '';
                 }
             }
             
             document.getElementById('clear-history-modal').classList.remove('active');
             closeChatSettings(); 
             
             showToast("SYSTEM", keepMemory ? "已清屏，上下文状态保留。" : "已彻底清屏并重置所有记忆。", targetAvatar, currentContactId, 1000);
         }
         
         function clearChatBg() { document.getElementById('cs-bg-data').value = ''; document.getElementById('cs-bg-preview').innerHTML = '已清除'; }
         function clearChatAvatar() { document.getElementById('cs-avatar-data').value = ''; document.getElementById('cs-avatar-preview').innerHTML = SVG_BOT; }
         function clearMyChatAvatar() { document.getElementById('cs-me-avatar-data').value = ''; document.getElementById('cs-me-avatar-preview').innerHTML = SVG_USER; }
         
         function openNudgeSettings() {
             if(!currentContactId) return;
             const c = contacts.find(x => x.id === currentContactId);
             let myNudge = prompt("设置别人拍你时的完整互动文案 (例如: 捏了捏我的脸，狠狠敲了敲我的头)\\n留空则恢复默认 [拍了拍我]：", c.myNudgeText || "拍了拍我");
             if(myNudge !== null) {
                 c.myNudgeText = myNudge.trim();
                 saveData();
                 let botName = c.chatRemark || c.name;
                 alert("设置成功！\\n对方点你头像会显示：\"「" + botName + "」" + (c.myNudgeText || "拍了拍我") + "\"\\n你点自己头像会显示：\"我" + (c.myNudgeText ? c.myNudgeText.replace(/我/g, '自己') : "拍了拍自己") + "\"");
             }
         }
         
         function triggerNudge(isMyAvatar, avatarEl) {
             if(!currentContactId) return;
             const c = contacts.find(x => x.id === currentContactId);
             
             avatarEl.classList.remove('avatar-shake');
             void avatarEl.offsetWidth; 
             avatarEl.classList.add('avatar-shake');
         
             let uName = gConfig.meName || '我';
             if(c.maskId) { const m = masks.find(x=>x.id===c.maskId); if(m) uName = m.name; }
             let botName = c.chatRemark || c.name;
         
             let content = '';
             let aiPrompt = '';
             let hintExt = (!c.myNudgeText && !c.botNudgeText) ? " (提示: 可以在右上角设置图标内更换拍一拍动作)" : "";
         
             if(isMyAvatar) {
                 let myAction = c.myNudgeText || "拍了拍我";
                 let selfAction = myAction.replace(/我/g, '自己'); // 自动把“我”替换成“自己”
                 content = `我${selfAction}${hintExt}`;
                 aiPrompt = `[系统动作通报：这是聊天软件自带的线上互动玩法！用户刚刚在界面上双击了TA自己的头像，屏幕上显示“我${selfAction}”。这只是一个线上小互动，并非现实中的真实动作！请完全基于你的人设性格给出自然的回复或吐槽，绝不加入刻板情绪。如果想回拍用户，可在回复中输出 <nudge> 标签。]`;
             } else {
                 let botAction = c.botNudgeText || `拍了拍「${botName}」`;
                 
                 // 核心修复：清理历史遗留的错误代词，防止出现“我捏了捏你的后颈”这种主客体混淆的文案
                 botAction = botAction.replace(/你|我/g, `「${botName}」`);
                 
                 content = `我${botAction}${hintExt}`;
        aiPrompt = `[系统动作通报：用户刚才点击了你的头像，屏幕显示“我${botAction}”。
注意：这只是一个线上的虚拟互动，并非现实中的真实动作。
【互动最高指令】：
1. 请针对“用户刚才点击了你”这个动作给出符合人设的自然聊天反应。
2. 如果你也想在线上回拍用户，请在回复中直接输出 <nudge> 标签。
3. 【修改特权】：如果你不喜欢这个动作，可以输出 <set_nudge text="新文案"> 来修改【以后用户点击你时显示的默认文案】。
【🚨 核心警告】：输出 <set_nudge> 只是在修改“系统显示规则”，并不会改变“用户刚才已经点击了你”这个事实。请针对刚才那个动作给出反应，而不是针对你还没生效的新文案给出反应。
【语法死命令】：text属性文案【必须】以“动词+了+宾语”开头，宾语【必须】是你的名字「${botName}」。
✅正确示范：<set_nudge text="狠狠捏了捏「${botName}」的脸">
❌错误示范：<set_nudge text="捏了捏我的脸">（禁止用第一人称代词，禁止使用“你/我”）]`;
             }
         
             const newMsg = { role: 'system_sum', content: `<div style="text-align:center; width:100%;"><div style="color:var(--c-gray-dark); font-size:10px; font-weight:700; background:rgba(0,0,0,0.03); padding:4px 10px; border-radius:10px; display:inline-block;">${content}</div></div>\n<span style="display:none;">${aiPrompt}</span>` };
             c.history.push(newMsg);
             saveData();
             appendBubbleRow(newMsg, c.history.length - 1);
             scrollToBottom();
             
             // 核心改动：注释掉自动调用 AI 回复，把主动权交还给用户！
             // setTimeout(() => fetchAIReply(currentContactId), 500);
         }
         
         function saveChatSettings() { 
             const c = contacts.find(x => x.id === currentContactId); 
             if(!c) return;

             // 🚀 核心增加：记录修改前的状态，用于生成 AI 提示词
             const oldMaskId = c.maskId;
             const oldAllowAction = c.allowAction;
             const oldAllowOverride = c.allowOverride;
             const oldAwareTime = c.awareTime;

             // 1. 身份与面具
             c.maskId = document.getElementById('cs-mask-select').value; 
             c.chatRemark = document.getElementById('cs-remark').value.trim(); 
             c.chatAvatar = document.getElementById('cs-avatar-data').value;
             c.chatMeAvatar = document.getElementById('cs-me-avatar-data').value;

             // 2. 行为逻辑
             c.awareTime = document.getElementById('cs-aware-time').checked === true;
             c.allowAiSticker = document.getElementById('cs-allow-ai-sticker').checked;
             c.allowAction = document.getElementById('cs-allow-action').checked;
             c.allowOverride = document.getElementById('cs-allow-override').checked;
             c.allowProactive = document.getElementById('cs-allow-proactive').checked;
             c.proactiveInterval = parseInt(document.getElementById('cs-proactive-interval').value) || 0;
             c.allowBilingual = document.getElementById('cs-allow-bilingual').checked;
const selectedLang = document.getElementById('cs-target-lang').value;
if (selectedLang === 'custom') {
    const customLang = document.getElementById('cs-custom-lang').value.trim();
    c.targetLang = customLang || 'English';
} else {
    c.targetLang = selectedLang;
}
             c.overrideProb = parseInt(document.getElementById('cs-override-prob').value) || 3; 
             c.overrideModePref = document.getElementById('cs-override-mode-pref').value; 

             // 修改设置后重置计时器
             resetProactiveTimer(c.id);

             // 🚀 核心增加：神经链路同步引擎 (瞬间让 AI 反应过来)
             let syncLogs = [];
             if (c.maskId !== oldMaskId) {
                 const m = masks.find(x => x.id === c.maskId);
                 syncLogs.push(m ? `用户已更换面具，当前身份变更为：${m.name}` : `用户已摘除面2，回归原始身份。`);
             }
             if (c.allowAction !== oldAllowAction) {
                 syncLogs.push(c.allowAction ? `用户已开启“旁白式动作描写”权限，请开始使用 <action> 标签进行细腻描写。` : `用户已关闭动作描写权限，禁止输出任何动作。`);
             }
             if (c.allowOverride !== oldAllowOverride) {
                 syncLogs.push(c.allowOverride ? `用户已授予你“强制线下/破屏”特权，你可以在情绪到位时使用 <override> 标签。` : `用户已收回你的“强制线下”特权，禁止使用相关标签。`);
             }
             if (c.awareTime !== oldAwareTime) {
                 syncLogs.push(c.awareTime ? `现实时空同步雷达已开启，你现在可以感知用户的真实时间。` : `时空同步已断开。`);
             }
             
             // 🚀 核心增加：双语协议同步
             if (c.allowBilingual) {
                 syncLogs.push(`[🚨 紧急协议覆写]：双语翻译模块已【立即】激活！这是系统内核级的强制指令：从你的【下一句话】开始，必须严格执行 {中文} <translation> {${c.targetLang}} 格式！禁止任何纯中文回复，否则将触发链路重启！`);
             }

             if (syncLogs.length > 0) {
                 const syncMsg = {
                     role: 'system_sum',
                     content: `<i>✧ 神经链路已同步：会话协议已更新</i>\n<span style="display:none;">[🚨 系统最高指令：用户刚刚修改了会话设置，以下是最新变动，请立刻知晓并严格执行：\n${syncLogs.join('\n')}]</span>`,
                     wid: gConfig.currentWorldviewId || 'default'
                 };
                 c.history.push(syncMsg);
             }
             
             // 3. 视觉美学
             c.chatTimestampMode = document.getElementById('cs-timestamp-mode').value;
             c.chatTopIconColor = document.getElementById('cs-top-icon-color').value;
             c.chatTopTextColor = document.getElementById('cs-top-text-color').value;
             c.chatFontSize = document.getElementById('cs-font-size').value.trim(); 
             c.bubbleCss = document.getElementById('cs-me-bubble-css').value;
             c.chatBg = document.getElementById('cs-bg-data').value; 

             // 4. 灵魂与记忆
             let newPrompt = document.getElementById('cs-prompt').value.trim() || c.history[0].content;
if (newPrompt !== c.history[0].content && c.cpCache) { delete c.cpCache; }
c.history[0].content = newPrompt;
             c.memory = document.getElementById('cs-memory').value.trim(); 
             c.autoSumFreq = parseInt(document.getElementById('cs-auto-sum').value) || 0; 
             c.sumPrompt = document.getElementById('cs-sum-prompt').value.trim() || c.sumPrompt; 
    
             // 5. 应用与保存
             updateChatTopUI(); 
             applyChatBackground(c.chatBg); 
             renderChatHistory(); 
             saveData(); 
             closeChatSettings(); 
             renderRoleList(); 
             
             if (typeof renderTwitterContacts === 'function') renderTwitterContacts();
             if (typeof renderTwFeed === 'function') renderTwFeed();
         }
         
         function renderChatHistory(preserveScroll = false) { 
    const ca = document.getElementById('chat-area'); 
    
    let oldScrollHeight = ca.scrollHeight;
    let oldScrollTop = ca.scrollTop;

    ca.style.display = 'none'; 
    ca.innerHTML = ''; 
    
    const c = contacts.find(x => x.id === currentContactId); 
    let cSize = c.chatFontSize || 14; 
    let customCss = c.bubbleCss || '';
    
    // 🚀 自由度提升：将当前联系人 ID 注入容器，支持 #chat-area[data-contact="xxx"] 这种顶级选择器
    ca.setAttribute('data-contact', c.id);
    
    // 🚀 自由度提升：默认字号不再强制 !important，给自定义 CSS 留出覆盖空间
    document.getElementById('dynamic-chat-style').innerHTML = `
        #view-chat .bubble { font-size: ${cSize}px; }
        /* --- 用户自定义区域 --- */
        ${customCss}
    `;
    
        // 🚨 核心性能修复 3：加入视口截取！
    let validMsgs = [];
    let currentWid = gConfig.currentWorldviewId || 'default';
    
    for (let i = c.history.length - 1; i >= 0; i--) {
        const m = c.history[i];
        // 核心过滤：
        // 1. 排除 role 为 system 的原始人设
        // 2. 排除 isTheater 为 true 的线下消息
        // 3. 兼容性显示：如果消息没有 wid，或者 wid 匹配当前世界观，则显示
        if (m.role !== 'system' && m.isTheater !== true) {
            if (!m.wid || m.wid === currentWid || currentWid === 'default') {
                validMsgs.unshift({ msg: m, index: i });
            }
        }
        if (validMsgs.length >= currentChatRenderLimit) break;
    }

    // 传入 true 告诉底层这是批量加载
    validMsgs.forEach(item => {
        appendBubbleRow(item.msg, item.index, true);
    });
    
    // 🚨 核心性能修复 4：全部塞入 DOM 后，在最后统一进行【唯一一次】的气泡分组扫描！
    updateBubbleGrouping();

    // 顶部加载提示：如果还有更多历史消息可以加载，显示上滑提示
    let currentWid_hint = gConfig.currentWorldviewId || 'default';
    let totalValidForHint = c.history.filter(m => 
        m.role !== 'system' && m.isTheater !== true &&
        (!m.wid || m.wid === currentWid_hint || currentWid_hint === 'default')
    ).length;
    
    if (currentChatRenderLimit < totalValidForHint) {
        let hint = document.createElement('div');
        hint.className = 'chat-load-more-hint';
        hint.id = 'chat-load-more-hint';
        hint.innerHTML = '<span>↑ 上滑加载更早的消息</span>';
        ca.prepend(hint);
    } else if (validMsgs.length > 0 && totalValidForHint > 30) {
        let hint = document.createElement('div');
        hint.className = 'chat-load-more-hint all-loaded';
        hint.id = 'chat-load-more-hint';
        hint.innerHTML = '<span>— 已加载全部消息 —</span>';
        ca.prepend(hint);
    }

    // 恢复渲染流显示
    ca.style.display = 'flex';

    // 关闭平滑动画，瞬间调整位置
    ca.style.scrollBehavior = 'auto';
    
    if (preserveScroll) {
        // 如果是往上翻加载历史，保持原来的视觉位置不跳跃
        ca.scrollTop = ca.scrollHeight - oldScrollHeight + oldScrollTop;
    } else {
        // 正常进入聊天室，直接拉到底部
        ca.scrollTop = ca.scrollHeight;
    }
    
    setTimeout(() => { 
        ca.style.scrollBehavior = 'smooth'; 
        isHistoryLoading = false; // 解除加载锁
    }, 50);
}
         
         // 接收 isHistory 参数，默认为 false
         function appendBubbleRow(msg, index = null, isHistory = false) {
             const role = msg.role; const text = msg.content;
             const ca = document.getElementById('chat-area'); const c = contacts.find(x => x.id === currentContactId);
             if (!isHistory && (role === 'assistant' || role === 'bot') && navigator.vibrate) navigator.vibrate(8);
             
             // 核心修复：AI的消息角色存的是 assistant，不是 bot！
             const isUser = (role === 'user');
             const isBot = (role === 'bot' || role === 'assistant');
         
             // ⏱️ 核心：30分钟断层时间戳显示 (仅在开启时间感知时生效)
             if (c.awareTime === true && index !== null && index > 0 && msg.timestamp && role !== 'system') {
                 let prevMsg = null;
                 // 往回找最近的一条带有真实时间戳的、肉眼可见的用户或AI消息
                 for(let k = index - 1; k >= 0; k--) {
                     if(c.history[k].timestamp && c.history[k].role !== 'system' && c.history[k].role !== 'system_sum') {
                         prevMsg = c.history[k];
                         break;
                     }
                 }
                 // 如果与上一条消息的差距超过 30 分钟 (30 * 60 * 1000 毫秒)
                 if (prevMsg && prevMsg.timestamp && (msg.timestamp - prevMsg.timestamp > 30 * 60 * 1000)) {
                     const timeRow = document.createElement('div'); 
                     timeRow.className = 'msg-row sys-row time-divider-row';
                     timeRow.style.cssText = "display: flex; justify-content: center; width: 100%; margin-bottom: 12px; z-index: 1;";
                     const d = new Date(msg.timestamp);
                     const tStr = (d.getMonth()+1).toString().padStart(2,'0') + '/' + d.getDate().toString().padStart(2,'0') + ' ' + d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
                     
                     // 渲染出带有毛玻璃底色的极简胶囊时间戳
                     timeRow.innerHTML = `<span style="font-family: 'Courier New', monospace; font-size: 10px; color: var(--c-gray-dark); font-weight: 800; letter-spacing: 1px; background: rgba(0,0,0,0.04); padding: 4px 14px; border-radius: 12px; backdrop-filter: blur(5px); box-shadow: 0 2px 8px rgba(0,0,0,0.02);">${tStr}</span>`;
                     ca.appendChild(timeRow);
                 }
             }
         
             const row = document.createElement('div'); 
             row.className = `msg-row ${isUser ? 'user' : 'bot'}`;
             // 🚀 自由度提升：增加角色和索引锚点，方便 CSS 精准勾勒
             row.setAttribute('data-role', role);
             if(index !== null) {
                 row.id = `msg-item-${index}`;
                 row.setAttribute('data-index', index);
             }
         
             const checkBox = document.createElement('div');
             checkBox.className = 'msg-check-box';
         
             // 核心修复：多选模式下，点击整行任意位置直接选中，大幅提升手感！
             row.onclick = (e) => {
                 if (ca.classList.contains('multi-select-mode')) {
                     e.preventDefault(); e.stopPropagation();
                     const cb = row.querySelector('.msg-check-box');
                     if(cb) { cb.classList.toggle('checked'); updateMultiSelectCount(); }
                 }
             };
         
             if (msg.isRevoked) {
                 row.classList.add('sys-row');
                 let safeContent = encodeURIComponent(msg.content);
                 row.innerHTML = `<div class="msg-check-box"></div><div class="bubble-sys" onclick="if(!document.getElementById('chat-area').classList.contains('multi-select-mode')) showRevokedContent(decodeURIComponent('${safeContent}'))">${isUser ? '你' : '对方'}撤回了一条消息</div>`; 
                 ca.appendChild(row); 
                 return; 
             }

             // 🚀 新增：渲染旁白式动作描写
             if (role === 'assistant_action') {
                 row.className = 'msg-row action-row';
                 if(index !== null) {
                     row.id = `msg-item-${index}`;
                     row.setAttribute('data-index', index);
                     
                     // 🚀 核心修复：让旁白行也支持长按呼出菜单（删除/编辑）
                     const handleLongPress = (e) => { 
                         if(isChatMultiSelect) return; e.preventDefault(); clearTimeout(pressTimer); 
                         const bubbleAction = row.querySelector('.bubble-action');
                         openScatterMenu(index, bubbleAction, row, false); 
                     };
                     row.addEventListener('touchstart', (e) => { if(!isChatMultiSelect) pressTimer = setTimeout(() => handleLongPress(e), 450); }, {passive:true});
                     row.addEventListener('touchend', () => clearTimeout(pressTimer));
                     row.addEventListener('contextmenu', handleLongPress);
                 }
                 row.innerHTML = `<div class="msg-check-box"></div><div class="bubble-action"><span class="star">✦</span>${text}</div>`;
                 ca.appendChild(row);
                 return;
             }
         
             if (role === 'system_sum') { 
    if(text.includes('使用了贴纸')) return; // 隐形提示不渲染气泡
    if(msg.isCpSnoop) return; // 查手机的隐藏提示不渲染
    
    // 🚀 核心修复：如果这段文本只有隐藏标签，剥离后没有任何可见文字，就绝对不要渲染它，彻底消灭聊天室里的空白占位！
    let visibleText = text.replace(/<span[^>]*style=["']display:\s*none;?["'][^>]*>[\s\S]*?<\/span>/gi, '').trim();
    if (!visibleText) return;

    row.classList.add('sys-row');
    
    let jumpHtml = '';
    let idMatch = text.match(/\(消息ID:\s*(\d+)\)/);
    if (idMatch && text.includes('✧')) {
        jumpHtml = ` onclick="if(!document.getElementById('chat-area').classList.contains('multi-select-mode')) jumpToMessage(${idMatch[1]})"`;
    }
    
    row.innerHTML = `<div class="msg-check-box"></div><div class="bubble-sys"${jumpHtml}>${text}</div>`; 
    ca.appendChild(row); 
    return; 
}
         
             // 完美修复：确保AI的消息也有复选框！
             if(isBot) row.appendChild(checkBox);
         
             // 核心修复：保证气泡渲染也能读取到最高优先级的专属头像
             let uAvatar = gConfig.meAvatar || ''; let uName = gConfig.meName || '我';
             if(c.maskId) { const m = masks.find(x=>x.id===c.maskId); if(m){ uAvatar=m.avatar; uName=m.name; } }
             if(c.chatMeAvatar) uAvatar = c.chatMeAvatar; // 专属头像最高优先级！
             
             const avatarWrap = document.createElement('div'); avatarWrap.className = 'msg-avatar-wrap';
             avatarWrap.style.display = 'flex'; avatarWrap.style.flexDirection = 'column'; avatarWrap.style.alignItems = 'center'; avatarWrap.style.gap = '4px'; avatarWrap.style.zIndex = '2';
             
             const avatarDiv = document.createElement('div'); avatarDiv.className = 'msg-avatar'; 
             avatarDiv.innerHTML = isUser ? renderAvatarHTML(uAvatar, 'user') : renderAvatarHTML(c.chatAvatar || c.avatar, 'bot');
             
             avatarDiv.onclick = (e) => {
                 e.stopPropagation();
                 let now = Date.now();
                 let lastTap = parseInt(avatarDiv.dataset.lastTap) || 0;
                 if (now - lastTap < 300) {
                     // 🚀 核心修复：300ms内再次点击，判定为双击触发拍一拍
                     triggerNudge(isUser, avatarDiv);
                     avatarDiv.dataset.lastTap = 0;
                 } else {
                     avatarDiv.dataset.lastTap = now;
                 }
             };
             
             avatarWrap.appendChild(avatarDiv);
         
             if (c.chatTimestampMode === 'avatar' && msg.timestamp) {
                 const tDiv = document.createElement('div'); tDiv.className = 'ts-avatar'; tDiv.innerText = formatTime(msg.timestamp);
                 avatarWrap.appendChild(tDiv);
             }
         
             const bodyDiv = document.createElement('div'); bodyDiv.className = 'bubble-body';
             
             if(c.showName !== false) {
                 const nameDiv = document.createElement('div'); nameDiv.className = 'bubble-name'; nameDiv.innerText = isUser ? uName : (c.chatRemark || c.name);
                 bodyDiv.appendChild(nameDiv);
             }
             
             const bubbleDiv = document.createElement('div'); 
             bubbleDiv.className = `bubble ${isUser ? 'bubble-user' : 'bubble-bot'}`; 
             
             // 【核心修复】：在底层引擎直接判定，只要内容里包含特殊卡片，强制加上剥离气泡外壳的样式，永不反弹！
             if (text && (text.includes('normal-transfer') || text.includes('black-card-scene') || text.includes('rp-container') || text.includes('stamp-wrapper') || text.includes('loc-card-shell') || text.includes('luxury-box-wrap') || text.includes('tw-sync-card'))) {
                 bubbleDiv.classList.add('bubble-clear');
             }
         
             if (text) { 
                 // 🚀 核心解析：双语翻译引擎 (增强版正则匹配)
                 const transRegex = /<translation\s*>/i;
                 if (transRegex.test(text)) {
                     const parts = text.split(transRegex);
                     const mainText = parts[0].trim();
                     const transText = parts[1].trim();
                     
                     // 渲染主文本
                     bubbleDiv.innerHTML = `<div>${mainText}</div>`;
                     
                     // 创建隐藏的翻译层
                     const transDiv = document.createElement('div');
                     transDiv.className = 'bubble-translation';
                     transDiv.style.cssText = `display:none; margin-top:8px; padding-top:8px; border-top:0.5px solid ${isUser ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}; font-family:'Courier New', monospace; font-size:11px; color:${isUser ? 'rgba(255,255,255,0.5)' : '#A8A196'}; line-height:1.3;`;
                     transDiv.innerHTML = `<span style="opacity:0.5; margin-right:4px;">›</span> ${transText}`;
                     bubbleDiv.appendChild(transDiv);
                     
                     // 绑定点击切换逻辑 (仅当非多选模式时)
                     bubbleDiv.addEventListener('click', (e) => {
                         if (!document.getElementById('chat-area').classList.contains('multi-select-mode')) {
                             e.stopPropagation();
                             const isHidden = transDiv.style.display === 'none';
                             transDiv.style.display = isHidden ? 'block' : 'none';
                         }
                     });
                 } else {
                     bubbleDiv.innerHTML = text; 
                 }
             }
         
             if (c.chatTimestampMode === 'bubble' && msg.timestamp) {
                 const tSpan = document.createElement('span'); tSpan.className = 'ts-bubble'; tSpan.innerText = formatTime(msg.timestamp);
                 bubbleDiv.appendChild(tSpan);
             }
         
             if (msg.stickerTop) { const stTop = document.createElement('div'); stTop.className = 'bubble-sticker st-top'; stTop.innerText = msg.stickerTop; bubbleDiv.appendChild(stTop); }
             if (msg.stickerBottom) { const stBot = document.createElement('div'); stBot.className = 'bubble-sticker st-bottom'; stBot.innerText = msg.stickerBottom; bubbleDiv.appendChild(stBot); }
         
             if(index !== null) {
                 const handleLongPress = (e) => { 
                     if(isChatMultiSelect) return; e.preventDefault(); clearTimeout(pressTimer); openScatterMenu(index, bubbleDiv, row, isUser); 
                 };
                 bubbleDiv.addEventListener('touchstart', (e) => { 
                     // 已经去除了手势免疫，现在长按卡片也会正常呼出系统菜单
                     if(!isChatMultiSelect) pressTimer = setTimeout(() => handleLongPress(e), 450); 
                 }); 
                 bubbleDiv.addEventListener('touchend', () => clearTimeout(pressTimer)); 
                 bubbleDiv.addEventListener('touchmove', () => clearTimeout(pressTimer)); 
                 bubbleDiv.addEventListener('contextmenu', handleLongPress);
                 
                 // 确保多选模式下，点击气泡也会触发勾选
                 bubbleDiv.addEventListener('click', (e) => {
                     if (ca.classList.contains('multi-select-mode')) {
                         e.preventDefault(); e.stopPropagation();
                         const cb = row.querySelector('.msg-check-box');
                         if(cb) { cb.classList.toggle('checked'); updateMultiSelectCount(); }
                     }
                 });
             }
             
             bodyDiv.appendChild(bubbleDiv); row.appendChild(avatarWrap); row.appendChild(bodyDiv); 
             if(isUser) row.appendChild(checkBox);
             ca.appendChild(row); 
             
             // 🚨 核心性能修复 1：如果是批量加载历史，绝对禁止每加一条就全盘扫描一次！防止 O(N²) 卡死浏览器
             if (!isHistory) {
                 updateBubbleGrouping(); // 只有平时单发消息时，才需要实时扫描圆角
                 scrollToBottom();
             }
         }
         
         // 自动扫描聊天室，把连续发言的消息打包分组，忽略隐形的系统提示
         function updateBubbleGrouping() {
             const ca = document.getElementById('chat-area');
             if(!ca) return;
             const rows = Array.from(ca.querySelectorAll('.msg-row:not(.sys-row)'));
             rows.forEach((row, i) => {
                 let isUser = row.classList.contains('user');
                 let prevRow = i > 0 ? rows[i-1] : null;
                 let nextRow = i < rows.length - 1 ? rows[i+1] : null;
                 
                 // 如果上一条不是我发的，那我就是这组的“头”
                 if (!prevRow || prevRow.classList.contains('user') !== isUser) row.classList.add('first-in-group');
                 else row.classList.remove('first-in-group');
                 
                 // 如果下一条不是我发的，那我就是这组的“尾”
                 if (!nextRow || nextRow.classList.contains('user') !== isUser) row.classList.add('last-in-group');
                 else row.classList.remove('last-in-group');
             });
         }
         
         function enterChatMultiSelect() {
             closeChatMenu();
             isChatMultiSelect = true;
             document.getElementById('chat-area').classList.add('multi-select-mode');
             document.getElementById('multi-select-bar').classList.add('active');
             document.getElementById('chat-input-wrap').style.display = 'none';
             updateMultiSelectCount();
         }
         
         function exitChatMultiSelect() {
             isChatMultiSelect = false;
             document.getElementById('chat-area').classList.remove('multi-select-mode');
             document.getElementById('multi-select-bar').classList.remove('active');
             document.getElementById('chat-input-wrap').style.display = 'flex';
             document.querySelectorAll('.msg-check-box.checked').forEach(el => el.classList.remove('checked'));
         }
         
         function updateMultiSelectCount() {
             const count = document.querySelectorAll('.msg-check-box.checked').length;
             document.getElementById('cms-count').innerText = `已选 ${count} 项`;
         }
         
         function deleteSelectedMessages() {
             const checkedBoxes = document.querySelectorAll('.msg-check-box.checked');
             if(checkedBoxes.length === 0) return;
             if(!confirm(`确定删除这 ${checkedBoxes.length} 条消息吗？`)) return;
         
             const c = contacts.find(x => x.id === currentContactId);
             
             const indexesToDelete = [];
             checkedBoxes.forEach(cb => {
                 const row = cb.closest('.msg-row');
                 // 🚀 核心修复：优先从 data-index 属性获取索引，这是最稳妥的办法
                 let idxAttr = row.getAttribute('data-index');
                 if (idxAttr !== null) {
                     let idx = parseInt(idxAttr);
                     indexesToDelete.push(idx);
                     // 【连坐销毁】：顺藤摸瓜，把紧跟在它后面的隐形系统提示一并删掉！
                     let offset = 1;
                     while (c.history[idx + offset] && c.history[idx + offset].role === 'system_sum' && c.history[idx + offset].content.includes('<span style="display:none;">')) {
                         if (!indexesToDelete.includes(idx + offset)) indexesToDelete.push(idx + offset);
                         offset++;
                     }
                 }
             });
             
             indexesToDelete.sort((a,b) => b - a);
             indexesToDelete.forEach(idx => {
                 c.history.splice(idx, 1);
             });
         
             saveData();
             exitChatMultiSelect();
             renderChatHistory();
         }
         
         function openScatterMenu(index, bubbleEl, rowEl, isUser) {
             if(activeScatterIndex !== null) closeScatterMenu();
             activeScatterIndex = index;
             const c = contacts.find(x => x.id === currentContactId);
             if (!c) return;

             // 动态注入双层星轨专属 CSS（仅执行一次）
             if (!document.getElementById('dual-arc-menu-style')) {
                 const style = document.createElement('style');
                 style.id = 'dual-arc-menu-style';
                 style.innerHTML = `
                     /* 遮罩层变为完全透明，仅用于拦截点击 */
                     .scatter-overlay { position:fixed; top:0; left:0; width:100vw; height:100vh; background:transparent; z-index:999; display:none; }
                     .scatter-overlay.active { display:block; }
                     
                     /* 精准模糊其他气泡 */
                     #chat-area.focus-mode .msg-row { transition: filter 0.3s ease, opacity 0.3s ease, transform 0.3s ease; }
                     #chat-area.focus-mode .msg-row:not(.focused) { filter: blur(2px); opacity: 0.5; pointer-events: none; }
                     
                     .scatter-menu-container { position:absolute; width:0; height:0; z-index:1001; }
                     
                     /* 🚀 审美升级：黑银质感中心锚点 */
                     .scatter-center { position:absolute; top:0; left:0; transform:translate(-50%,-50%); width:8px; height:8px; background:var(--c-black, #1C1C1E); border-radius:50%; box-shadow:0 0 10px rgba(0,0,0,0.3); opacity:0; transition:0.3s; }
                     .scatter-menu-container.active .scatter-center { opacity:1; }
                     
                     .scatter-item { position:absolute; top:0; left:0; width:44px; height:44px; border-radius:50%; background:#fff; border:1px solid rgba(0,0,0,0.05); display:flex; justify-content:center; align-items:center; color:var(--c-black, #1C1C1E); box-shadow:0 8px 25px rgba(0,0,0,0.15); cursor:pointer; opacity:0; transform:translate(-50%,-50%) scale(0) rotate(-90deg); transition:all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
                     .scatter-item.show { opacity:1; transform:translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(1) rotate(0deg); }
                     .scatter-item:hover, .scatter-item:active { background:var(--c-black, #1C1C1E); color:#fff; transform:translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(1.1) rotate(0deg); }
                     .scatter-item.danger:hover, .scatter-item.danger:active { background:var(--c-red, #D32F2F); color:#fff; border-color:var(--c-red, #D32F2F); }
                     .scatter-item svg { width:18px; height:18px; }
                     .si-label { position:absolute; top:calc(100% + 6px); left:50%; transform:translateX(-50%); font-size:11px; font-weight:800; letter-spacing:1px; color:var(--c-black, #1C1C1E); white-space:nowrap; pointer-events:none; text-shadow:0 1px 4px rgba(255,255,255,0.9), 0 -1px 4px rgba(255,255,255,0.9); }
                     .scatter-item.danger .si-label { color:var(--c-red, #D32F2F); }
                     
                     /* 🚀 审美升级：极简淡灰渐变星轨连线 */
                     .scatter-line { position:absolute; top:0; left:0; height:1px; background:linear-gradient(90deg, rgba(0,0,0,0.15) 0%, transparent 100%); transform-origin:0 0; opacity:0; transition:0.4s ease-out; }
                     .scatter-menu-container.active .scatter-line { opacity:1; }
                     
                     /* 🚀 审美升级：目标气泡高亮，去除突兀实线，改为悬浮阴影与极细银边 */
                     .msg-row.focused { position:relative; z-index:1000; }
                     .msg-row.focused .bubble { transform:scale(1.02); }
                     .msg-row.focused.bot .bubble { box-shadow:0 12px 35px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05); }
                     .msg-row.focused.user .bubble { box-shadow:0 12px 35px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1); }
                 `;
                 document.head.appendChild(style);
             }

             document.getElementById('chat-area').classList.add('focus-mode');
             rowEl.classList.add('focused');
             
             const overlay = document.createElement('div');
             overlay.className = 'scatter-overlay';
             overlay.id = 'scatter-overlay';
             overlay.onclick = closeScatterMenu;
             document.getElementById('view-chat').appendChild(overlay);
             
             const menu = document.createElement('div');
             menu.className = 'scatter-menu-container';
             menu.id = 'scatter-menu-container';
             
             const rect = bubbleEl.getBoundingClientRect();
             let cx = isUser ? rect.left : rect.right;
             let cy = rect.top + rect.height / 2;
         
             // 智能边缘防撞引擎
             const screenH = window.innerHeight;
             const screenW = window.innerWidth;
             const safeMarginYTop = 180; 
             const safeMarginYBottom = 200; 
             const safeMarginX = 160; 
     
             let outerStart, outerEnd, innerStart, innerEnd;
     
             if (isUser) {
                 if (cy < safeMarginYTop) { 
                     outerStart = 90; outerEnd = 210;
                     innerStart = 110; innerEnd = 190;
                 } else if (cy > screenH - safeMarginYBottom) { 
                     outerStart = 150; outerEnd = 270;
                     innerStart = 170; innerEnd = 250;
                 } else { 
                     outerStart = 90; outerEnd = 270;
                     innerStart = 130; innerEnd = 230;
                 }
                 if (cx < safeMarginX) cx = safeMarginX;
             } else {
                 if (cy < safeMarginYTop) { 
                     outerStart = -30; outerEnd = 90;
                     innerStart = -10; innerEnd = 70;
                 } else if (cy > screenH - safeMarginYBottom) { 
                     outerStart = -90; outerEnd = 30;
                     innerStart = -70; innerEnd = 10;
                 } else { 
                     outerStart = -90; outerEnd = 90;
                     innerStart = -50; innerEnd = 50;
                 }
                 if (cx > screenW - safeMarginX) cx = screenW - safeMarginX;
             }
             
             menu.style.left = cx + 'px';
             menu.style.top = cy + 'px';
             
             const svgTop = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>`;
             const svgBot = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>`;
             const svgRevoke = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/></svg>`;
             const svgDel = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
             const svgEdit = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
             const svgQuote = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>`;
             const svgRepair = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`;
             const svgRewind = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`;
         
             const innerActions = [
                 { id:'quote', icon: svgQuote, label:'引用' },
                 { id:'edit', icon: svgEdit, label:'编辑' },
                 { id:'repair', icon: svgRepair, label:'修复' }
             ];
             
             const outerActions = [
                 { id:'sticker_top', icon: svgTop, label:'顶贴' },
                 { id:'sticker_bottom', icon: svgBot, label:'底贴' }
             ];
             if(isUser) outerActions.push({ id:'revoke', icon: svgRevoke, label:'撤回' });
             outerActions.push({ id:'rewind', icon: svgRewind, label:'回溯', danger: true });
             outerActions.push({ id:'delete', icon: svgDel, label:'删除', danger: true });
         
             let html = `<div class="scatter-center"></div>`;
             
             // 渲染内圈
             const innerRadius = 75;
             innerActions.forEach((a, i) => {
                 let angle = innerStart + i * ((innerEnd - innerStart) / (innerActions.length - 1));
                 let rad = angle * (Math.PI / 180);
                 let tx = Math.cos(rad) * innerRadius;
                 let ty = Math.sin(rad) * innerRadius;
                 html += `<div class="scatter-line" style="width:${innerRadius}px; transform: rotate(${angle}deg);"></div>`;
                 html += `<div class="scatter-item" style="--tx:${tx}px; --ty:${ty}px; transition-delay: ${i * 0.05}s;" onclick="handleScatterAction(event, ${index}, '${a.id}')"><span style="display:flex;">${a.icon}</span><div class="si-label">${a.label}</div></div>`;
             });
     
             // 渲染外圈
             const outerRadius = 140;
             outerActions.forEach((a, i) => {
                 let angle = outerStart + i * ((outerEnd - outerStart) / (outerActions.length - 1));
                 let rad = angle * (Math.PI / 180);
                 let tx = Math.cos(rad) * outerRadius;
                 let ty = Math.sin(rad) * outerRadius;
                 let extraClass = a.danger ? ' danger' : '';
                 html += `<div class="scatter-line" style="width:${outerRadius}px; transform: rotate(${angle}deg); opacity: 0.4;"></div>`;
                 html += `<div class="scatter-item${extraClass}" style="--tx:${tx}px; --ty:${ty}px; transition-delay: ${0.1 + i * 0.05}s;" onclick="handleScatterAction(event, ${index}, '${a.id}')"><span style="display:flex;">${a.icon}</span><div class="si-label">${a.label}</div></div>`;
             });
             
             menu.innerHTML = html;
             document.getElementById('view-chat').appendChild(menu);
             
             requestAnimationFrame(() => {
                 overlay.classList.add('active');
                 menu.classList.add('active');
                 menu.querySelectorAll('.scatter-item').forEach(el => el.classList.add('show'));
             });
         }
         
         function closeScatterMenu() {
             document.getElementById('chat-area').classList.remove('focus-mode');
             const focused = document.querySelector('.msg-row.focused');
             if(focused) focused.classList.remove('focused');
             
             const overlay = document.getElementById('scatter-overlay');
             const menu = document.getElementById('scatter-menu-container');
             
             if(menu) {
                 menu.classList.remove('active');
                 menu.querySelectorAll('.scatter-item').forEach(el => el.classList.remove('show'));
             }
             if(overlay) overlay.classList.remove('active');
             
             setTimeout(() => {
                 if(menu) menu.remove();
                 if(overlay) overlay.remove();
             }, 300);
             activeScatterIndex = null;
         }
         
         function showFloatingSticker(emoji) {
             const ca = document.getElementById('view-chat');
             const bubble = document.createElement('div');
             bubble.className = 'floating-sticker';
             bubble.innerText = emoji;
             // 随机在视口内生成，避开顶部和底部
             const left = 20 + Math.random() * 60;
             const bottom = 25 + Math.random() * 40;
             bubble.style.left = left + '%';
             bubble.style.bottom = bottom + '%';
             bubble.style.zIndex = '9999';
             ca.appendChild(bubble);
             setTimeout(() => {
                 if(bubble.parentNode) bubble.remove();
             }, 2500);
         }
         
         function handleScatterAction(e, index, action) { 
             e.stopPropagation();
             closeScatterMenu();
             if(index === null || !currentContactId) return; 
             const c = contacts.find(x => x.id === currentContactId); 
             
             if (action === 'revoke') { 
                 c.history[index].isRevoked = true;
                 delete c.history[index].stickerTop; delete c.history[index].stickerBottom; 
             } 
             else if (action === 'delete') { 
                 // 【连坐销毁】：算出后面到底跟了多少条隐形提示，一锅端
                 let delCount = 1;
                 while(c.history[index + delCount] && c.history[index + delCount].role === 'system_sum' && c.history[index + delCount].content.includes('<span style="display:none;">')) {
                     delCount++;
                 }
                 c.history.splice(index, delCount); 
             } 
             else if (action === 'rewind') {
                 // 🚀 核心修复：时空回溯，保留当前消息，删除其后面的所有记录
                 if (confirm('🚨 确定要回溯到此节点吗？\n当前消息【之后】的所有对话将被永久抹除！')) {
                     c.history.splice(index + 1); // 从 index + 1 开始切断数组，保留 index 本身
                 } else {
                     return; // 取消回溯，不执行后续保存
                 }
             }
             else if (action === 'edit') {
                 let curText = c.history[index].content || "";
                 const newText = prompt("编辑此消息内容 (完美支持输入 HTML 标签)：", curText);
                 if(newText !== null && newText.trim() !== "") {
                     c.history[index].content = newText.trim();
                 }
             }
             else if (action === 'repair') {
                 window.activeRepairIndex = index;
                 document.getElementById('repair-modal').classList.add('active');
                 return;
             }
             else if (action === 'quote') {
                 let html = c.history[index].content || "";
                 let rawText = "";
                 // 智能识别提取系统卡片内容，防止抽风乱码
                 if (html.includes('black-card-scene') || html.includes('normal-transfer')) rawText = "[一张转账/黑卡]";
                 else if (html.includes('rp-container')) rawText = "[一个红包]";
                 else if (html.includes('stamp-wrapper')) rawText = "[一张实体相片]";
                 else if (html.includes('loc-card-shell')) rawText = "[一份位置情报]";
                 else rawText = html.replace(/<[^>]*>?/gm, '').trim();
                 
                 if(rawText.length > 60) rawText = rawText.substring(0, 58) + '...';
                 
                 let isUserMsg = c.history[index].role === 'user';
                 let uName = gConfig.meName || '我';
                 if(c.maskId) { const m = masks.find(x=>x.id===c.maskId); if(m) uName = m.name; }
                 let speakerName = isUserMsg ? uName : (c.chatRemark || c.name);
         
                 currentQuoteData = {
                     role: isUserMsg ? 'user' : 'assistant',
                     name: speakerName,
                     text: rawText
                 };
         
                 document.getElementById('quote-preview-name').innerText = isUserMsg ? '引用我的消息' : `引用 ${speakerName} 的消息`;
                 document.getElementById('quote-preview-text').innerText = rawText;
                 document.getElementById('quote-preview-bar').style.display = 'block';
                 
                 setTimeout(() => { document.getElementById('msg-input').focus(); }, 100);
                 return; // 引用操作不需要重新渲染记录，直接退出
             }
             else if (action === 'sticker_top') {
                 let cur = c.history[index].stickerTop || "";
                 const emoji = prompt("输入顶部贴纸 (最多2个Emoji，留空则删除)：", cur);
                 if(emoji !== null) {
                     if (emoji.trim() === "") delete c.history[index].stickerTop;
                     else {
                         c.history[index].stickerTop = Array.from(emoji.trim()).slice(0, 2).join('');
                         // 双轨制：屏幕显示优雅英文，隐形span塞给AI看
                         let isSelf = c.history[index].role === 'user';
                         let uiText = isSelf ? `✧ You left "${c.history[index].stickerTop}" for yourself` : `✧ You reacted with "${c.history[index].stickerTop}"`;
                         let aiText = `[系统动作通报：用户刚刚给 ${isSelf ? '用户自己' : '你'} 的(消息ID: ${index}) 顶部贴上了贴纸 "${c.history[index].stickerTop}"]`;
                         c.history.push({role: 'system_sum', content: `${uiText}\n<span style="display:none;">${aiText}</span>`});
                     }
                     saveData(); 
                     updateBubbleStickerDOM(index, 'top', c.history[index].stickerTop); 
                     if(emoji.trim() !== "") { appendBubbleRow(c.history[c.history.length - 1], c.history.length - 1); scrollToBottom(); }
                     return;
                 }
             }
             else if (action === 'sticker_bottom') {
                 let cur = c.history[index].stickerBottom || "";
                 const emoji = prompt("输入底部贴纸 (最多2个Emoji，留空则删除)：", cur);
                 if(emoji !== null) {
                     if (emoji.trim() === "") delete c.history[index].stickerBottom;
                     else {
                         c.history[index].stickerBottom = Array.from(emoji.trim()).slice(0, 2).join('');
                         let isSelf = c.history[index].role === 'user';
                         let uiText = isSelf ? `✧ You left "${c.history[index].stickerBottom}" for yourself` : `✧ You reacted with "${c.history[index].stickerBottom}"`;
                         let aiText = `[系统动作通报：用户刚刚给 ${isSelf ? '用户自己' : '你'} 的(消息ID: ${index}) 底部贴上了贴纸 "${c.history[index].stickerBottom}"]`;
                         c.history.push({role: 'system_sum', content: `${uiText}\n<span style="display:none;">${aiText}</span>`});
                     }
                     saveData(); 
                     updateBubbleStickerDOM(index, 'bottom', c.history[index].stickerBottom); 
                     if(emoji.trim() !== "") { appendBubbleRow(c.history[c.history.length - 1], c.history.length - 1); scrollToBottom(); }
                     return;
                 }
             }
             
             if (action !== 'sticker_top' && action !== 'sticker_bottom') {
                 saveData(); renderChatHistory(); 
             }
         }
