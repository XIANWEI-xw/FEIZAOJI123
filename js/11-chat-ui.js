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

             // 群聊模式：顶栏显示群头像 + 成员头像列表
             if (c.isGroup === true && c.groupMembers && c.groupMembers.length > 0) {
                 // 群头像：优先使用自定义群头像，否则用九宫格
                 if (c.groupAvatar) {
                     topBotAv.innerHTML = `<img src="${c.groupAvatar}" style="width:38px;height:38px;border-radius:12px;object-fit:cover;">`;
                 } else {
                     let groupAvatarHtml = '<div class="group-avatar-grid" style="width:38px;height:38px;">';
                     const displayMembers = c.groupMembers.slice(0, 4);
                     displayMembers.forEach(mid => {
                         const member = contacts.find(x => x.id === mid);
                         if (member) {
                             groupAvatarHtml += `<div class="group-avatar-cell">${renderAvatarHTML(member.chatAvatar || member.avatar, 'bot')}</div>`;
                         }
                     });
                     groupAvatarHtml += '</div>';
                     topBotAv.innerHTML = groupAvatarHtml;
                 }
                 topMeAv.style.display = 'none';

                 // 强制把群头像挤到正中央：让 me 头像和ecg 占位但隐形，群头像绝对居中
                 const connRow = topBotAv.parentElement;
                 if (connRow) {
                     connRow.style.position = 'relative';
                     connRow.style.justifyContent = 'center';
                 }
                 topBotAv.style.position = 'absolute';
                 topBotAv.style.left = '50%';
                 topBotAv.style.top = '50%';
                 topBotAv.style.transform = 'translate(-50%, -50%)';
                
                 // 群聊不绑定拍一拍
                 topBotAv.onclick = null;
                 topMeAv.onclick = null;
             } else {
                 // 重置群聊模式留下的样式残留
                 topBotAv.style.position = '';
                 topBotAv.style.left = '';
                 topBotAv.style.top = '';
                 topBotAv.style.transform = '';
                 const connRow = topBotAv.parentElement;
                 if (connRow) {
                     connRow.style.position = '';
                     connRow.style.justifyContent = '';
                 }

                 topBotAv.innerHTML = renderAvatarHTML(c.chatAvatar || c.avatar, 'bot');
                 topMeAv.style.display = '';
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
             }
             
             const ecgWrap = document.getElementById('top-bar-ecg-wrap');
             if(ecgWrap) {
                 // 2. 应用独立的光标/图标颜色
                 ecgWrap.style.color = c.chatTopIconColor || '#1C1C1E'; 
                 
                 if (c.isGroup === true) {
                     // 群聊模式：中间不显示心电图，留空
                     ecgWrap.innerHTML = '';
                 } else {
                     let latestMood = 60;
                     for(let i = c.history.length - 1; i >= 0; i--) {
                         if(c.history[i].role === 'assistant' && c.history[i].mood !== undefined) {
                             latestMood = c.history[i].mood; break;
                         }
                     }
                     ecgWrap.innerHTML = getCursorHTML(c.cursorDefault || 'ecg', latestMood);
                 }
             }
         }
         
         function openChat(id) { 
    if(isEditingList) return;
    // 匿名消息在进入聊天室时统一写入
    if (typeof anonFlushPendingToChat === 'function') anonFlushPendingToChat(id);
    currentContactId = id; 
    const c = contacts.find(x => x.id === id); 
    
    exitChatMultiSelect();
    document.getElementById('btn-call-ai').disabled = false; 
    document.getElementById('btn-send').disabled = false; 
    document.querySelector('.btn-menu').disabled = false;
    
    // 群聊模式下隐藏不适用的回形针面板按钮
    const roseGalaxyBtn = document.getElementById('cm-rose-galaxy');
    if (roseGalaxyBtn) roseGalaxyBtn.style.display = (c.isGroup === true) ? 'none' : '';
    
    currentChatRenderLimit = 30; 

    updateChatTopUI(); 
    applyChatBackground(c.chatBg); 
    
    // 群聊消息注入：如果刚从群聊退出，且当前私聊角色是群成员，自动注入群聊记录
    if (lastExitedGroupId && c.isGroup !== true) {
        const gc = contacts.find(x => x.id === lastExitedGroupId);
        if (gc && gc.isGroup && gc.groupPrivateSync !== false && gc.groupMembers && gc.groupMembers.includes(id)) {
            injectGroupChatSync(c, gc);
        }
        lastExitedGroupId = null;
    }
    
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
         
         let lastExitedGroupId = null;

         function goBackToMain(animate = true) { 
             exitChatMultiSelect();
             // 记录退出的群聊ID，供私聊注入使用
             if (currentContactId) {
                 const exitingContact = contacts.find(x => x.id === currentContactId);
                 if (exitingContact && exitingContact.isGroup === true) {
                     lastExitedGroupId = currentContactId;
                 }
             }
             document.getElementById('view-chat').classList.remove('slide-in'); currentContactId = null; 
             if(animate) {
                 const kw = document.getElementById('msg-search-input').value.trim();
                 if(kw) searchMessages(kw); else renderContacts();
             } 
         }
         
         // 群聊消息注入引擎：退出群聊后进入私聊时，一次性写入隐形群聊记录
         function injectGroupChatSync(contact, groupChat) {
             let botName = contact.chatRemark || contact.name;
             let syncTurns = groupChat.groupPrivateSyncTurns || 25;
             let uName = gConfig.meName || '我';

             // 防重复：2分钟内同一个群已注入过则跳过
             for (let k = contact.history.length - 1; k >= Math.max(0, contact.history.length - 8); k--) {
                 let m = contact.history[k];
                 if (m._groupSyncFrom === groupChat.id && m.timestamp && (Date.now() - m.timestamp < 120000)) return;
             }

             let recentGroupMsgs = groupChat.history
                 .filter(function(h) {
                     if (h.isTheater || h.isRevoked) return false;
                     if (h.role === 'system') return false;
                     if (h.role === 'system_sum') {
                         return h.content && (h.content.includes('头衔') || h.content.includes('群管理通知'));
                     }
                     return true;
                 })
                 .slice(-syncTurns)
                 .map(function(h) {
                     if (h.role === 'system_sum') {
                         var match = h.content.match(/<span style="display:none;">([\s\S]*?)<\/span>/);
                         var sysText = match ? match[1].replace(/<[^>]+>/g, '').trim() : h.content.replace(/<[^>]+>/g, '').trim();
                         if (!sysText || sysText.length < 2) return null;
                         return '[群管理通知]: ' + sysText.substring(0, 200);
                     }
                     var speaker = h.role === 'user' ? uName : (h.speakerName || (groupChat.chatRemark || groupChat.name));
                     var text = (h.content || '').replace(/<[^>]+>/g, '').trim();
                     if (!text || text.length < 2) return null;
                     var isSelf = (speaker === botName);
                     var prefix = isSelf ? '[你自己] ' + speaker : speaker;
                     return prefix + ': ' + text.substring(0, 150);
                 })
                 .filter(Boolean);

             if (recentGroupMsgs.length < 2) return;

             let memberNames = groupChat.groupMembers.map(function(mid) {
                 let m = contacts.find(x => x.id === mid);
                 return m ? (m.chatRemark || m.name) : '未知';
             }).join('、');

             let groupName = groupChat.chatRemark || '群聊';

             let hiddenContent = '[🔔 群聊记忆同步通知]\n'
                 + '你刚刚在群聊「' + groupName + '」中参与了对话。以下是群里最近的 ' + recentGroupMsgs.length + ' 条消息记录：\n'
                 + '群成员：' + memberNames + '\n'
                 + '你在群里的身份是：' + botName + '\n'
                 + '标记为 [你自己] 的发言是你（' + botName + '）说过的话，你必须认账！\n'
                 + '---\n'
                 + recentGroupMsgs.join('\n') + '\n'
                 + '---\n'
                 + '请在接下来的私聊中自然地表现出你知道群里发生的事！可以主动提起、吐槽群友、延续相关情绪。绝对不要失忆！';

             let visibleText = '✧ 群聊「' + groupName + '」的 ' + recentGroupMsgs.length + ' 条最近动态已同步';

             contact.history.push({
                 role: 'system_sum',
                 content: '<i>' + visibleText + '</i>\n<span style="display:none;">' + hiddenContent + '</span>',
                 timestamp: Date.now(),
                 _groupSyncFrom: groupChat.id
             });

             saveData();
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

             // 群聊模式下隐藏不适用的设置板块
             const isGroup = c.isGroup === true;
             document.querySelectorAll('.cs-solo-only').forEach(el => el.style.display = isGroup ? 'none' : '');
             document.querySelectorAll('.cs-group-only').forEach(el => el.style.display = isGroup ? '' : 'none');
             document.querySelectorAll('.cs-label-solo').forEach(el => el.style.display = isGroup ? 'none' : '');
             document.querySelectorAll('.cs-label-group').forEach(el => el.style.display = isGroup ? '' : 'none');
             const soloHeaders = document.getElementById('cs-solo-headers');
             if (soloHeaders) soloHeaders.style.display = isGroup ? 'none' : 'flex';

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
             // 群聊也需要面具，强制显示面具选择行
             const maskRow = sel.closest('.cs-row-item');
             if (maskRow) maskRow.style.display = '';
             document.getElementById('cs-remark').value = c.chatRemark || '';

             // 2. 交互开关 (Toggle)
             document.getElementById('cs-aware-time').checked = c.awareTime === true;
             document.getElementById('cs-allow-ai-sticker').checked = c.allowAiSticker === true;
             document.getElementById('cs-allow-action').checked = c.allowAction === true;
             document.getElementById('cs-max-reply-bubbles').value = c.maxReplyBubbles || 0;
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
             
             // 群头像加载
             var groupAvData = document.getElementById('cs-group-avatar-data');
             var groupAvInner = document.getElementById('cs-group-avatar-inner');
             if (groupAvData && groupAvInner) {
                 groupAvData.value = c.groupAvatar || '';
                 if (c.groupAvatar) {
                     groupAvInner.innerHTML = '<img src="' + c.groupAvatar + '" style="width:100%;height:100%;object-fit:cover;">';
                 } else if (c.isGroup && c.groupMembers) {
                     var miniHtml = '<div class="group-avatar-grid" style="width:100%;height:100%;">';
                     c.groupMembers.slice(0, 4).forEach(function(mid) {
                         var member = contacts.find(function(x) { return x.id === mid; });
                         if (member) miniHtml += '<div class="group-avatar-cell">' + renderAvatarHTML(member.chatAvatar || member.avatar, 'bot') + '</div>';
                     });
                     miniHtml += '</div>';
                     groupAvInner.innerHTML = miniHtml;
                 } else {
                     groupAvInner.innerHTML = '点击上传';
                 }
             }
             
             document.getElementById('cs-me-avatar-data').value = c.chatMeAvatar || ''; 
             document.getElementById('cs-me-avatar-preview').innerHTML = renderAvatarHTML(c.chatMeAvatar || gConfig.meAvatar, 'user');
             
             document.getElementById('cs-bg-data').value = c.chatBg || ''; 
             if(c.chatBg) document.getElementById('cs-bg-preview').innerHTML = `<img src="${c.chatBg}" style="width:100%; height:100%; object-fit:cover; border-radius:12px;">`; 
             else document.getElementById('cs-bg-preview').innerHTML = 'TAP TO UPLOAD'; 

             // 7. 隐藏面板重置
             document.getElementById('sum-prompt-wrap').style.display = 'none';
             document.getElementById('cursor-menu-wrap').style.display = 'none';
             
             // 8. 群聊设置
             document.getElementById('cs-group-context-turns').value = c.groupContextTurns || 0;
             document.getElementById('cs-group-private-sync').checked = c.groupPrivateSync !== false;
             document.getElementById('cs-group-private-sync-turns').value = c.groupPrivateSyncTurns || 25;

             // 9. 刷新记忆库统计预览
             if (typeof mvUpdateSettingsPreview === 'function') mvUpdateSettingsPreview(c);
             
             document.getElementById('chat-settings-modal').classList.add('active');
         }
         function closeChatSettings() { document.getElementById('chat-settings-modal').classList.remove('active'); }
         
         function setGroupMemberTitle(contactId, speakerName) {
             var c = contacts.find(function(x) { return x.id === contactId; });
             if (!c || !c.isGroup) return;
             if (!c.groupTitles) c.groupTitles = {};
             var current = c.groupTitles[speakerName] || '';
             var newTitle = prompt('为「' + speakerName + '」设置群头衔\n留空则清除头衔：', current);
             if (newTitle === null) return;
             newTitle = newTitle.trim();
             var uName = gConfig.meName || '管理员';

             // 构建所有成员的当前头衔状态描述，让AI彻底看清全局
             var titleStatusLines = [];
             if (c.groupMembers) {
                 c.groupMembers.forEach(function(mid) {
                     var member = contacts.find(function(x) { return x.id === mid; });
                     if (!member) return;
                     var mName = member.chatRemark || member.name;
                     var mTitle = (c.groupTitles && c.groupTitles[mName]) ? c.groupTitles[mName] : '（无头衔）';
                     titleStatusLines.push('  · ' + mName + '：' + mTitle);
                 });
             }
             var titleStatusBlock = titleStatusLines.length > 0
                 ? '\n\n【当前全体成员头衔一览】\n' + titleStatusLines.join('\n')
                 : '';

             if (newTitle) {
                 c.groupTitles[speakerName] = newTitle;

                 // 更新状态块中这个人的头衔
                 titleStatusLines = [];
                 if (c.groupMembers) {
                     c.groupMembers.forEach(function(mid) {
                         var member = contacts.find(function(x) { return x.id === mid; });
                         if (!member) return;
                         var mName = member.chatRemark || member.name;
                         var mTitle = (c.groupTitles && c.groupTitles[mName]) ? c.groupTitles[mName] : '（无头衔）';
                         titleStatusLines.push('  · ' + mName + '：' + mTitle);
                     });
                 }
                 titleStatusBlock = titleStatusLines.length > 0
                     ? '\n\n【当前全体成员头衔一览（已更新）】\n' + titleStatusLines.join('\n')
                     : '';

                 c.history.push({
                     role: 'system_sum',
                     content: '<div style="text-align:center; width:100%;"><div style="color:var(--c-gray-dark); font-size:10px; font-weight:700; background:rgba(0,0,0,0.03); padding:4px 10px; border-radius:10px; display:inline-block;">' + uName + ' 将「' + speakerName + '」的头衔设为「' + newTitle + '」</div></div>\n<span style="display:none;">[🚨 系统群管理通知 — 请所有角色认真阅读]\n\n本次操作人：' + uName + '（群主/管理员）\n操作内容：将群成员【' + speakerName + '】的专属头衔设置为「' + newTitle + '」\n\n【绝对明确】：这次头衔变更只针对【' + speakerName + '】这一个人，其他所有人的头衔完全不受影响。' + titleStatusBlock + '\n\n请各角色根据自己的人设对此事做出自然反应。【' + speakerName + '】应该对自己被赋予「' + newTitle + '」这个头衔做出回应，其他人可以起哄、吐槽或祝贺。]</span>'
                 });
             } else {
                 delete c.groupTitles[speakerName];

                 // 更新状态块
                 titleStatusLines = [];
                 if (c.groupMembers) {
                     c.groupMembers.forEach(function(mid) {
                         var member = contacts.find(function(x) { return x.id === mid; });
                         if (!member) return;
                         var mName = member.chatRemark || member.name;
                         var mTitle = (c.groupTitles && c.groupTitles[mName]) ? c.groupTitles[mName] : '（无头衔）';
                         titleStatusLines.push('  · ' + mName + '：' + mTitle);
                     });
                 }
                 titleStatusBlock = titleStatusLines.length > 0
                     ? '\n\n【当前全体成员头衔一览（已更新）】\n' + titleStatusLines.join('\n')
                     : '';

                 c.history.push({
                     role: 'system_sum',
                     content: '<div style="text-align:center; width:100%;"><div style="color:var(--c-gray-dark); font-size:10px; font-weight:700; background:rgba(0,0,0,0.03); padding:4px 10px; border-radius:10px; display:inline-block;">' + uName + ' 清除了「' + speakerName + '」的头衔</div></div>\n<span style="display:none;">[🚨 系统群管理通知]\n\n本次操作人：' + uName + '\n操作内容：清除了群成员【' + speakerName + '】的专属头衔\n\n【绝对明确】：只有【' + speakerName + '】的头衔被清除，其他人不受影响。' + titleStatusBlock + '\n\n请【' + speakerName + '】对头衔被取消这件事做出符合人设的反应。]</span>'
                 });
             }
             saveData();
             renderChatHistory();
         }

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
                     c.memoryEntries = [];
                     c.memoryFreeText = '';
                     c._memoryMigrated = false;
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
             // 
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
             var groupAvDataEl = document.getElementById('cs-group-avatar-data');
             if (groupAvDataEl) c.groupAvatar = groupAvDataEl.value || '';

             // 2. 行为逻辑
             c.awareTime = document.getElementById('cs-aware-time').checked === true;
             c.allowAiSticker = document.getElementById('cs-allow-ai-sticker').checked;
             c.allowAction = document.getElementById('cs-allow-action').checked;
             c.maxReplyBubbles = parseInt(document.getElementById('cs-max-reply-bubbles').value) || 0;
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
             let visibleSyncText = "✧ 神经链路已同步：会话协议已更新";

             if (c.maskId !== oldMaskId) {
                 const m = masks.find(x => x.id === c.maskId);
                 syncLogs.push(m ? `用户已更换面具，当前身份变更为：${m.name}` : `用户已摘除面具，回归原始身份。`);
             }
             if (c.allowAction !== oldAllowAction) {
                 if (c.allowAction) {
                     visibleSyncText = "✧ 动作神态描写已开启";
                     syncLogs.push(`[🚨 动作描写权限已开启]：用户已允许你使用旁白式动作描写。从你的【下一句话】开始，你【必须】使用 <action> 标签来描写你的动作、微表情和环境氛围（例如：<action>他微微侧过头，避开你的视线。</action>）。【最高禁令】：绝对禁止使用星号 * 或括号来描写动作，必须严格使用 <action> 标签！`);
                 } else {
                     visibleSyncText = "✧ 动作神态描写已关闭";
                     syncLogs.push(`[🚨 动作描写权限已关闭]：用户已关闭“旁白式动作描写”权限。从你的【下一句话】开始，你【绝对禁止】输出任何 <action> 标签，也【绝对禁止】输出任何星号 * 或括号包裹的动作、微表情或神态描写！你的输出必须 100% 只有纯台词对话！违反将导致连接中断！`);
                 }
             }
             if (c.allowOverride !== oldAllowOverride) {
                 syncLogs.push(c.allowOverride ? `用户已授予你“强制线下/破屏”特权，你可以在情绪到位时使用 <override> 标签。` : `用户已收回你的“强制线下”特权，禁止使用相关标签。`);
             }
             if (c.awareTime !== oldAwareTime) {
                 syncLogs.push(c.awareTime ? `现实时空同步雷达已开启，你现在可以感知用户的真实时间。` : `时空同步已断开。`);
             }
             
             // 🚀 核心增加：双语协议同步
             if (c.allowBilingual) {
                 syncLogs.push(`[🚨 紧急协议覆写]：双语翻译模块已【立即】激活！这是系统内核级的强制指令：从你的【下一句话】开始，必须严格执行 ${c.targetLang} 正文 + <translation> 中文翻译 格式！禁止 any 纯中文回复，否则将触发链路重启！`);
             } else if (c.allowBilingual === false) {
                 syncLogs.push(`[🚨 紧急协议覆写]：双语翻译模块已【立即关闭】！从你的【下一句话】开始，必须恢复纯简体中文回复！严禁继续使用 <translation> 标签或任何外语！违反将触发链路重启！`);
             }

             if (syncLogs.length > 0) {
                 const syncMsg = {
                     role: 'system_sum',
                     content: `<i>${visibleSyncText}</i>\n<span style="display:none;">[🚨 系统最高指令：用户刚刚修改了会话设置，以下是最新变动，请立刻知晓并严格执行：\n${syncLogs.join('\n')}]</span>`,
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
             let rawMemoryVal = document.getElementById('cs-memory').value.trim();
             if (rawMemoryVal && rawMemoryVal !== c.memory) {
                 c.memory = rawMemoryVal;
                 if (c.memoryEntries && c.memoryEntries.length > 0 && typeof mvSyncMemoryField === 'function') {
                     mvSyncMemoryField(c);
                 }
             }
             c.autoSumFreq = parseInt(document.getElementById('cs-auto-sum').value) || 0; 
             c.sumPrompt = document.getElementById('cs-sum-prompt').value.trim() || c.sumPrompt;
             c.groupContextTurns = parseInt(document.getElementById('cs-group-context-turns').value) || 0;
             c.groupPrivateSync = document.getElementById('cs-group-private-sync').checked;
             c.groupPrivateSyncTurns = parseInt(document.getElementById('cs-group-private-sync-turns').value) || 25;
    
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
// ================= 共读系统卡片全局渲染引擎 =================
// ================= 群聊 AI 引擎 (唯一版本 V3) =================
async function fetchGroupAIReply(targetContactId) {
    if (!targetContactId) return;
    const c = contacts.find(x => x.id === targetContactId);
    if (!c || !c.isGroup) return;
    if (!gConfig.apiUrl || !gConfig.apiKey) { alert('需配置API！'); return; }

    const isCurrentlyInRoom = isUserInChatRoom(targetContactId);
    let tempId = null;

    if (isCurrentlyInRoom) {
        const btnAi = document.getElementById('btn-call-ai');
        const btnSend = document.getElementById('btn-send');
        if (btnAi) btnAi.disabled = true;
        if (btnSend) btnSend.disabled = true;
        const ca = document.getElementById('chat-area');
        tempId = 'load-' + Date.now();
        const row = document.createElement('div');
        row.id = tempId;
        row.className = 'msg-row bot';
        row.innerHTML = '<div class="msg-avatar-wrap"><div class="msg-avatar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:100%;height:100%;padding:6px;"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.87"/></svg></div></div><div class="bubble-body"><div class="bubble bubble-bot"><div class="soap-loader"><div class="ld"></div><div class="ld"></div><div class="ld"></div></div></div></div>';
        ca.appendChild(row);
        scrollToBottom();
    }

    // 获取用户身份
    let uName = gConfig.meName || '我';
    let uPersona = '';
    if (c.maskId) {
        const m = masks.find(x => x.id === c.maskId);
        if (m) { uName = m.name; uPersona = m.persona || ''; }
    }

    // 组装群成员信息
    const memberInfo = c.groupMembers.map(function(mid) {
        const m = contacts.find(x => x.id === mid);
        if (!m) return null;
        return {
            id: mid,
            name: m.chatRemark || m.name,
            avatar: m.chatAvatar || m.avatar,
            prompt: (m.history && m.history[0]) ? m.history[0].content : ''
        };
    }).filter(Boolean);

    // ========== 构建系统提示词 ==========
    let sysPrompt = `[SOAP.OS GROUP CHAT ENGINE V3]

你正在一个群聊中同时扮演多个独立角色。每个角色都是有血有肉的真实人格，必须严格按照各自的人设独立思考和发言。

═══════════════════════════════════════
  群聊信息
═══════════════════════════════════════

【群名】：${c.chatRemark || '群聊'}
【成员列表】：${memberInfo.map(m => m.name).join('、')}
【用户身份】：${uName}${uPersona ? '\n【用户人设】：' + uPersona : ''}

═══════════════════════════════════════
  各角色独立人设
═══════════════════════════════════════
`;

    memberInfo.forEach(function(m) {
        sysPrompt += `\n━━━ ${m.name} ━━━\n${m.prompt}\n`;
    });

    // ========== 注入每个成员的私有记忆（严格隔离）==========
    let hasPrivateContext = false;
    memberInfo.forEach(function(mi) {
        const member = contacts.find(x => x.id === mi.id);
        if (!member) return;

        let sectionLines = [];

        // 个人记忆条目（仅情感态度相关的，不泄露对话细节）
        if (member.memoryEntries && member.memoryEntries.length > 0) {
            let memLines = member.memoryEntries.slice(-3).map(e => `  [${e.title}]`);
            sectionLines = sectionLines.concat(memLines);
        }

        // 仅提取关系状态，不注入完整私聊记录
        if (member.history && member.history.length > 5) {
            let lastUserMsg = '';
            let lastBotMsg = '';
            for (let k = member.history.length - 1; k >= 0; k--) {
                if (!lastBotMsg && member.history[k].role === 'assistant' && !member.history[k].isRevoked) {
                    lastBotMsg = (member.history[k].content || '').replace(/<[^>]+>/g, '').trim().substring(0, 40);
                }
                if (!lastUserMsg && member.history[k].role === 'user' && !member.history[k].isRevoked) {
                    lastUserMsg = (member.history[k].content || '').replace(/<[^>]+>/g, '').trim().substring(0, 40);
                }
                if (lastUserMsg && lastBotMsg) break;
            }
            if (lastBotMsg) sectionLines.push(`  [与用户的最后互动情绪: "${lastBotMsg}"]`);
        }

        if (sectionLines.length > 0) {
            if (!hasPrivateContext) {
                sysPrompt += `\n═══════════════════════════════════════
  各角色与用户的私密关系状态
═══════════════════════════════════════
以下信息是【各角色独有的私密状态】。
🚨 铁律：每个角色只能基于自己的状态行动！
角色A绝对不知道角色B和用户私下说了什么！
角色之间的私聊内容互相完全隔离、不可见！\n`;
                hasPrivateContext = true;
            }
            sysPrompt += `\n[${mi.name} 的内心状态 — 仅${mi.name}自己知道]\n${sectionLines.join('\n')}\n`;
        }
    });

    // ========== 核心行为规则 ==========
    sysPrompt += `
═══════════════════════════════════════
  核心行为规则
═══════════════════════════════════════

[输出格式铁律]
每条发言必须严格使用：<msg name="角色名">该角色说的话</msg>
- name 必须与上方角色名【完全一致】，一个字都不能错
- 禁止输出 <msg> 标签之外的任何文字、解释、旁白
- 禁止替用户（${uName}）说话

[发言选择逻辑]
- 每次回复选择 1-3 个最适合回应当前话题的角色
- 如果用户明确 @某人 或在跟某人说话，该角色必须回应
- 如果话题与某角色强相关，优先让相关角色发言
- 不同角色之间可以互动、接话、吐槽、抢话

[角色独立性]
- 每个角色有自己的性格、说话方式、语气
- 禁止所有角色用同一种语气说话！
- 角色之间可以有矛盾、不同意见、互怼
- 角色在群里的表现要参考他们和用户的私聊关系！比如私聊中很亲密的角色在群里会护着用户

[发言风格]
- 每条 <msg> 越短越好！像真人发微信一样碎片化！
- 一个人想表达完整意思→拆成多条连发（"等下" "我想想" "好像是这样"）
- 可以用 emoji、语气词、不完整句、单字（"啊" "？" "哈哈哈哈" "真的假的"）
- 禁止任何角色一条 <msg> 超过40字！超了就拆！
- 禁止句号"。"结尾

[发言数量 — 自由决定但有下限]
- 你自己根据话题热度和角色性格决定输出多少条 <msg>
- 热闹话题→疯狂刷屏，15-20条都正常
- 普通话题→8-12条
- 冷场话题→最少也要6条
- 同一个角色可以连发很多条！真实群聊里话痨就是会刷屏！
- 绝对下限：无论如何不得少于6条 <msg>
- 没有上限！如果氛围到了，30条也完全OK

[互动自然度]
- 1个人回复也完全OK，不必凑够3个
- 群聊节奏要自然：有人抢话、有人潜水、有人慢半拍

[红包/转账/礼物互动]
当群里出现红包、转账或礼物卡片时，角色们可以抢！
- 要抢/收下：在你的 <msg> 内容开头加上 <accept> 标签
- 格式：<msg name="角色名"><accept>抢到啦哈哈哈</msg>
- 每次最多只有1个角色能抢到（谁先发言谁抢到）
- 不是每个红包都要抢：高冷角色可能不稀罕，话痨会疯狂抢
- 抢到后要表现出符合人设的反应（开心/假装不在意/嫌少等）
- 没有红包/转账时禁止使用 <accept> 标签`;

    // 时间感知
    if (c.awareTime === true) {
        const now = new Date();
        const h = now.getHours();
        const mi = now.getMinutes();
        const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        sysPrompt += `\n\n[⏰ 现实时间同步]\n当前时间：${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日 ${h}:${mi.toString().padStart(2,'0')} ${weekDays[now.getDay()]}\n所有角色的状态和语气必须匹配这个时间点。`;
    }

    // 群聊自身的记忆
    if (c.memoryEntries && c.memoryEntries.length > 0) {
        let memLines = c.memoryEntries.slice(-10).map(e => `- ${e.title}: ${e.content}`).join('\n');
        sysPrompt += `\n\n[群聊公共记忆]\n${memLines}`;
    } else if (c.memory && c.memory.trim()) {
        sysPrompt += `\n\n[群聊公共记忆]\n${c.memory}`;
    }

    const apiMessages = [{ role: 'system', content: sysPrompt }];

    // ========== 组装历史上下文（对话流格式，让AI看到完整时间线）==========
    let limit = (c.groupContextTurns && c.groupContextTurns > 0) ? c.groupContextTurns : (parseInt(gConfig.contextSize) || 20);
    let recentHistory = [];
    let collected = 0;
    for (let i = c.history.length - 1; i >= 0 && collected < limit; i--) {
        const m = c.history[i];
        if (m.role === 'system') continue;
        recentHistory.unshift(m);
        if (m.role !== 'system_sum') collected++;
    }

    // 核心重构：将整段对话历史组装成一整条 user 消息（对话脚本格式）
    // 这样AI能看到完整的时间线，不会因为user/assistant交替而丢失上下文连贯性
    let dialogueScript = [];
    recentHistory.forEach(function(m) {
        let cleanText = (m.content || '').replace(/<[^>]+>/g, '').trim();
        if (m.role === 'user') {
            let cardDesc = '';
            if (m.content.includes('rp-container')) cardDesc = '[发了一个红包] ';
            else if (m.content.includes('normal-transfer')) cardDesc = '[发了一笔转账] ';
            else if (m.content.includes('black-card-scene')) cardDesc = '[发了一张黑卡] ';
            else if (m.content.includes('luxury-box-wrap')) cardDesc = '[发了一个礼盒] ';
            if (cleanText || cardDesc) dialogueScript.push(`${uName}: ${cardDesc}${cleanText}`);
        } else if (m.role === 'assistant' && m.speakerName) {
            if (cleanText) dialogueScript.push(`${m.speakerName}: ${cleanText}`);
        } else if (m.role === 'system_sum') {
            let hidden = m.content.match(/<span style="display:none;">([\s\S]*?)<\/span>/);
            let text = hidden ? hidden[1] : cleanText;
            if (text) dialogueScript.push(`[系统: ${text}]`);
        }
    });

    if (dialogueScript.length > 0) {
        apiMessages.push({ role: 'user', content: `以下是群聊的对话历史记录（按时间顺序）：\n\n${dialogueScript.join('\n')}\n\n---以上是历史记录---` });
    }

    // 末尾指令：极简粗暴，不给AI思考的余地
    let memberNameList = memberInfo.map(m => m.name).join('、');
    let minSpeakers = Math.min(memberInfo.length, 3);

    apiMessages.push({ role: 'user', content: `现在请回复。` });
    apiMessages.push({ role: 'assistant', content: `<msg name="${memberInfo[0].name}">` });

    // 用 prefix 技巧：把assistant的开头已经写好了，AI只能接着写下去
    // 但标准API不支持prefix，所以改用另一个技巧：在最后一条user里放示范
    apiMessages.pop(); // 移除刚才的assistant
    apiMessages.pop(); // 移除刚才的user

    let totalMsgCount = Math.min(memberInfo.length * 3, 12);
    apiMessages.push({ role: 'user', content: `请模拟真实群聊回复。要求：
- 输出 ${totalMsgCount} 条左右的 <msg> 消息
- 同一个人可以连发2-4条（像真实群聊那样碎片化发消息）
- 可选角色：${memberNameList}
- 至少 ${minSpeakers} 个不同的人参与发言
- 角色之间要有互动：接话、吐槽、抢话、回应彼此
- 每条 <msg> 控制在30字以内，短小碎片化
- 如果有未领取的红包/转账，想抢的人在内容开头写<accept>
- 直接输出，禁止任何标签外的文字

真实群聊节奏示范：
<msg name="A">啊？</msg>
<msg name="A">什么情况</msg>
<msg name="B">哈哈哈哈哈哈</msg>
<msg name="C">你们在说啥</msg>
<msg name="A">就刚才那个事</msg>
<msg name="B">笑死我了真的</msg>
<msg name="C">？？？能不能说人话</msg>

现在开始回复：
<msg name="${memberInfo[0].name}">` });

        try {
        let allMessages = [];
        let roundApiMessages = apiMessages.slice();
        let maxRounds = 3;

        for (let round = 0; round < maxRounds; round++) {
            // 第二轮起追加"继续"指令
            if (round > 0) {
                let alreadySpoke = [...new Set(allMessages.map(m => m.name))];
                let silent = memberInfo.filter(m => !alreadySpoke.includes(m.name)).map(m => m.name);
                let continueHint = silent.length > 0
                    ? `群里还有人没说话：${silent.join('、')}。让他们也参与进来，同时已经发过言的人也可以继续接话。继续输出更多<msg>：`
                    : `对话还在继续，大家继续聊，互相接话吐槽。继续输出更多<msg>：`;
                roundApiMessages.push({ role: 'user', content: continueHint });
            }

            const response = await fetch(gConfig.apiUrl + '/v1/chat/completions', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + gConfig.apiKey, 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: gConfig.model, messages: roundApiMessages, temperature: Number(gConfig.temperature || 0.8), stream: false })
            });
            if (!response.ok) throw new Error('网络错误 ' + response.status);
            const data = await response.json();
            let raw = '';
            if (data.choices && data.choices[0] && data.choices[0].message) {
                raw = (data.choices[0].message.content || '').trim();
            }

            // 解析本轮的 <msg> 标签
            const msgRegex = /<msg\s+name=["']?([^"'>]+)["']?>([\s\S]*?)<\/msg>/gi;
            let match;
            let roundMsgs = [];
            while ((match = msgRegex.exec(raw)) !== null) {
                const speakerName = match[1].trim();
                const content = match[2].trim();
                if (!content) continue;
                const speaker = memberInfo.find(m => m.name === speakerName) || memberInfo[0];
                roundMsgs.push({ name: speaker.name, avatar: speaker.avatar, content: content });
            }

            // 兜底
            if (roundMsgs.length === 0 && raw) {
                let fallbackText = raw.replace(/<[^>]+>/g, '').trim();
                if (fallbackText) {
                    roundMsgs.push({ name: memberInfo[0].name, avatar: memberInfo[0].avatar, content: fallbackText });
                }
            }

            allMessages = allMessages.concat(roundMsgs);

            // 把本轮结果追加到下一轮的上下文中
            if (raw) {
                roundApiMessages.push({ role: 'assistant', content: raw });
            }

            // 如果已经够多了就停止
            if (allMessages.length >= 8) break;
        }

        if (tempId && document.getElementById(tempId)) document.getElementById(tempId).remove();

        let messages = allMessages;

        // ========== 检测抢红包/收转账 ==========
        let grabberName = null;
        let grabberAvatar = null;
        for (let i = 0; i < messages.length; i++) {
            if (/<accept>/i.test(messages[i].content)) {
                grabberName = messages[i].name;
                grabberAvatar = messages[i].avatar;
                messages[i].content = messages[i].content.replace(/<accept>/gi, '').trim();
                break;
            }
        }

        // ========== 写入历史并渲染（实时读取最新头像）==========
        let baseTs = Date.now();
        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];

            let latestAvatar = msg.avatar;
            if (c.groupMembers) {
                for (let mi = 0; mi < c.groupMembers.length; mi++) {
                    const member = contacts.find(x => x.id === c.groupMembers[mi]);
                    if (member && (member.chatRemark || member.name) === msg.name) {
                        latestAvatar = member.chatAvatar || member.avatar || '';
                        break;
                    }
                }
            }

            const newMsg = {
                role: 'assistant',
                content: msg.content,
                isRevoked: false,
                timestamp: baseTs + (i * 1000),
                speakerName: msg.name,
                speakerAvatar: latestAvatar,
                wid: gConfig.currentWorldviewId || 'default'
            };
            c.history.push(newMsg);
            saveData();

            if (isCurrentlyInRoom) {
                appendBubbleRow(newMsg, c.history.length - 1);
                scrollToBottom();
                if (i < messages.length - 1) {
                    // 随机延迟模拟真实群聊打字速度
                    let delay = 300 + Math.floor(Math.random() * 500);
                    await new Promise(r => setTimeout(r, delay));
                }
            }
        }

        // ========== 处理抢夺逻辑 ==========
        if (grabberName) {
            let grabbed = false;
            for (let j = c.history.length - 1; j >= 0; j--) {
                const h = c.history[j];
                if (h.role !== 'user') continue;
                const html = h.content;

                if (html.includes('rp-container') && !html.includes('is-open')) {
                    const tempNode = document.createElement('div');
                    tempNode.innerHTML = html;
                    const rpContainer = tempNode.querySelector('.rp-container');
                    if (rpContainer) {
                        rpContainer.classList.add('is-open');
                        let isLucky = rpContainer.dataset.type === 'lucky';
                        let rawAmount = parseFloat(rpContainer.dataset.amount);
                        let finalAmount = isLucky ? Math.max(0.01, Math.random() * rawAmount).toFixed(2) : rawAmount;
                        if (isLucky && rpContainer.querySelector('.rp-num-display')) {
                            rpContainer.querySelector('.rp-num-display').innerText = finalAmount;
                        }
                        h.content = tempNode.innerHTML;
                        c.history.push({ role: 'system_sum', content: `<div style="text-align:center;width:100%;"><div style="color:var(--c-gray-dark);font-size:10px;font-weight:700;background:rgba(0,0,0,0.03);padding:4px 10px;border-radius:10px;display:inline-block;">🧧 ${grabberName} 抢到了红包 ¥${finalAmount}</div></div>` });
                        grabbed = true;
                    }
                    break;
                }

                if (html.includes('normal-transfer') && !html.includes('wax-seal') && !html.includes('reject-stamp')) {
                    const tempNode = document.createElement('div');
                    tempNode.innerHTML = html;
                    const normalCard = tempNode.querySelector('.normal-transfer');
                    if (normalCard) {
                        normalCard.style.filter = 'grayscale(80%) brightness(0.8)';
                        normalCard.insertAdjacentHTML('beforeend', '<div class="wax-seal" style="right:8px;top:8px;"></div>');
                        normalCard.removeAttribute('onclick');
                        normalCard.removeAttribute('oncontextmenu');
                        h.content = tempNode.innerHTML;
                        c.history.push({ role: 'system_sum', content: `<div style="text-align:center;width:100%;"><div style="color:var(--c-gray-dark);font-size:10px;font-weight:700;background:rgba(0,0,0,0.03);padding:4px 10px;border-radius:10px;display:inline-block;">💰 ${grabberName} 收下了转账</div></div>` });
                        grabbed = true;
                    }
                    break;
                }

                if (html.includes('black-card-scene') && !html.includes('wax-seal') && !html.includes('reject-stamp')) {
                    const tempNode = document.createElement('div');
                    tempNode.innerHTML = html;
                    const front = tempNode.querySelector('.bc-face--front');
                    const back = tempNode.querySelector('.bc-face--back');
                    if (front && !front.querySelector('.wax-seal')) {
                        if (front) front.style.filter = 'grayscale(80%) brightness(0.7)';
                        if (back) back.style.filter = 'grayscale(80%) brightness(0.7)';
                        front.insertAdjacentHTML('beforeend', '<div class="wax-seal"></div>');
                        h.content = tempNode.innerHTML;
                        c.history.push({ role: 'system_sum', content: `<div style="text-align:center;width:100%;"><div style="color:var(--c-gray-dark);font-size:10px;font-weight:700;background:rgba(0,0,0,0.03);padding:4px 10px;border-radius:10px;display:inline-block;">💳 ${grabberName} 收下了黑卡</div></div>` });
                        grabbed = true;
                    }
                    break;
                }

                if (html.includes('luxury-box-wrap') && !html.includes('lb-accepted') && !html.includes('lb-rejected')) {
                    const tempNode = document.createElement('div');
                    tempNode.innerHTML = html;
                    const lbWrap = tempNode.querySelector('.luxury-box-wrap');
                    if (lbWrap) {
                        lbWrap.classList.add('lb-accepted');
                        const chatCard = lbWrap.querySelector('.chat-card');
                        if (chatCard) chatCard.classList.add('is-open');
                        lbWrap.querySelectorAll('.action-btn-layer').forEach(el => el.style.display = 'none');
                        lbWrap.insertAdjacentHTML('beforeend', '<div class="bill-stamp stamp-green" style="z-index:100;font-size:16px;">ACCEPTED</div>');
                        h.content = tempNode.innerHTML;
                        c.history.push({ role: 'system_sum', content: `<div style="text-align:center;width:100%;"><div style="color:var(--c-gray-dark);font-size:10px;font-weight:700;background:rgba(0,0,0,0.03);padding:4px 10px;border-radius:10px;display:inline-block;">🎁 ${grabberName} 收下了礼盒</div></div>` });
                        grabbed = true;
                    }
                    break;
                }
            }

            if (grabbed) {
                saveData();
                if (isCurrentlyInRoom) {
                    renderChatHistory();
                }
            }
        }

        // 不在房间时推送通知
        if (!isCurrentlyInRoom && messages.length > 0) {
            const last = messages[messages.length - 1];
            showToast((c.chatRemark || c.name) + ' · ' + last.name, last.content, last.avatar, targetContactId, 4000);
            if (document.getElementById('view-main-list').classList.contains('active')) renderContacts();
        }
    } catch (e) {
        if (tempId && document.getElementById(tempId)) document.getElementById(tempId).remove();
        if (isCurrentlyInRoom) {
            const ca = document.getElementById('chat-area');
            const row = document.createElement('div');
            row.className = 'msg-row sys-row';
            row.innerHTML = '<div class="bubble-sys" style="color:#D32F2F;">[ 群聊 AI 错误: ' + e.message + ' ]</div>';
            ca.appendChild(row);
            scrollToBottom();
        }
    } finally {
        const btnAi = document.getElementById('btn-call-ai');
        const btnSend = document.getElementById('btn-send');
        if (btnAi) btnAi.disabled = false;
        if (btnSend) btnSend.disabled = false;
    }
}

// ================= 共读卡片推送 =================
window.pushCoReadCard = function(contactId, bookName, bookCover, isStart) {
    if (!contactId || typeof contacts === 'undefined') return;
    const c = contacts.find(x => x.id === contactId);
    if (!c) return;

    const escapeHtml = (s) => String(s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch]);

    let iconInner = '';
    if (bookCover) {
        iconInner = `<img class="crn-ico-cover" src="${bookCover}" ${!isStart ? 'style="filter:grayscale(0.6) brightness(0.85);"' : ''}>`;
    } else {
        iconInner = isStart
            ? `<svg class="crn-ico-fallback" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1.6"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`
            : `<svg class="crn-ico-fallback" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9A9A9A" stroke-width="1.6"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`;
    }

    let cardHtml = '';
    let aiPrompt = '';

    if (isStart) {
        cardHtml = `<div class="cr-notice-wrap"><div class="cr-notice-card" onclick="if(typeof CoRead !== 'undefined') CoRead.openPip()">
            <div class="crn-bar"></div>
            <div class="crn-inner">
                <div class="crn-ico">${iconInner}</div>
                <div class="crn-info">
                    <div class="crn-eyebrow"><div class="crn-dot"></div>CO-READING · SYNCED</div>
                    <div class="crn-book">${escapeHtml(bookName)}</div>
                    <div class="crn-desc">已开启共读 · 点击唤出小窗</div>
                </div>
            </div>
        </div></div>`;
        aiPrompt = `[📖 系统通知:用户邀请你一起共读小说《${bookName}》。从此刻起，你与用户进入"一起看"状态。当用户聊到书中内容时，你会自动看到当前阅读到的段落。请基于该段落与用户自然讨论剧情、人物、文笔，禁止剧透未读部分。保持你的人设。]`;
    } else {
        for (let i = c.history.length - 1; i >= 0; i--) {
            let msg = c.history[i];
            if (msg.isCoRead && msg.content && msg.content.includes('cr-notice-card') && !msg.content.includes('cr-notice-card end')) {
                msg.content = msg.content
                    .replace(/onclick=["'][^"']*CoRead\.openPip\(\)[^"']*["']/g, '')
                    .replace(/class=["']cr-notice-card["']/g, 'class="cr-notice-card end"')
                    .replace('已开启共读 · 点击唤出小窗', '共读已失效')
                    .replace(/<div class=["']crn-dot["']><\/div>/g, '<div class="crn-dot" style="background:#C7C7CC;box-shadow:none;"></div>');
            }
        }

        cardHtml = `<div class="cr-notice-wrap"><div class="cr-notice-card end">
            <div class="crn-bar"></div>
            <div class="crn-inner">
                <div class="crn-ico">${iconInner}</div>
                <div class="crn-info">
                    <div class="crn-eyebrow"><div class="crn-dot" style="background:#C7C7CC;box-shadow:none;"></div>CO-READING · ENDED</div>
                    <div class="crn-book" style="color:#5A5A5A;">${escapeHtml(bookName)}</div>
                    <div class="crn-desc">共读会话已结束</div>
                </div>
            </div>
        </div></div>`;
        aiPrompt = `[📖 系统通知:用户结束了与你的小说共读《${bookName}》。从此刻起，"一起看"状态解除，AI 不再接收书中段落。请按正常聊天继续。]`;
    }

    c.history.push({
        role: 'system_sum',
        content: `${cardHtml}\n<span style="display:none;">${aiPrompt}</span>`,
        isCoRead: true,
        timestamp: Date.now()
    });

    if (typeof saveData === 'function') saveData();

    const isInRoom = (typeof currentContactId !== 'undefined' && currentContactId === contactId);
    if (isInRoom) {
        if (!isStart) {
            const activeCards = document.querySelectorAll('#chat-area .cr-notice-card:not(.end)');
            activeCards.forEach(card => {
                card.classList.add('end');
                card.removeAttribute('onclick');
                const desc = card.querySelector('.crn-desc');
                if (desc) desc.innerText = '共读已失效';
                const dot = card.querySelector('.crn-dot');
                if (dot) dot.style.cssText = 'background:#C7C7CC;box-shadow:none;';
            });
        }

        const idx = c.history.length - 1;
        if (typeof appendBubbleRow === 'function') {
            appendBubbleRow(c.history[idx], idx);
            if (typeof updateBubbleGrouping === 'function') updateBubbleGrouping();
            if (typeof scrollToBottom === 'function') setTimeout(() => scrollToBottom(), 50);
            setTimeout(() => {
                const sysBubble = document.querySelector(`#msg-item-${idx} .bubble-sys`);
                const sysRow = document.querySelector(`#msg-item-${idx}`);
                if (sysBubble) sysBubble.style.cssText = 'background:transparent!important; padding:0!important; box-shadow:none!important; border:none!important; max-width:100%!important; border-radius:0!important;';
                if (sysRow) sysRow.style.cssText = 'justify-content:center!important; width:100%!important; display:flex!important;';
            }, 30);
        }
    }
};

// ================= 群聊劫持逻辑 (唯一版本，延迟执行) =================
setTimeout(function() {
    if (typeof window.fetchAIReply === 'function') {
        var _origFetch = window.fetchAIReply;
        window.fetchAIReply = function(targetContactId, isProactive) {
            var tid = targetContactId || currentContactId;
            if (!tid) return;
            var c = contacts.find(function(x) { return x.id === tid; });
            if (c && c.isGroup) return fetchGroupAIReply(tid);
            return _origFetch.apply(this, arguments);
        };
    }

    if (typeof window.appendBubbleRow === 'function') {
        var _origAppend = window.appendBubbleRow;
        window.appendBubbleRow = function(msg, index, isHistory) {
            var c = contacts.find(function(x) { return x.id === currentContactId; });
            if (!c || !c.isGroup || !msg.speakerName || msg.role !== 'assistant') {
                return _origAppend.apply(this, arguments);
            }

            // 实时从联系人对象查找最新头像（私聊换头像自动同步到群聊）
            var liveAvatar = msg.speakerAvatar || '';
            if (c.groupMembers) {
                for (var mi = 0; mi < c.groupMembers.length; mi++) {
                    var member = contacts.find(function(x) { return x.id === c.groupMembers[mi]; });
                    if (member && (member.chatRemark || member.name) === msg.speakerName) {
                        liveAvatar = member.chatAvatar || member.avatar || '';
                        break;
                    }
                }
            }

            var origAvatar = c.chatAvatar;
            var origName = c.chatRemark || c.name;
            var origShowName = c.showName;
            c.chatAvatar = liveAvatar;
            c.chatRemark = msg.speakerName;
            c.showName = true;
            var result = _origAppend.apply(this, arguments);
            c.chatAvatar = origAvatar;
            c.chatRemark = origName;
            c.showName = origShowName;
            setTimeout(function() {
                var row = document.getElementById('msg-item-' + index);
                if (!row) return;
                var nameDiv = row.querySelector('.bubble-name');
                if (nameDiv) {
                    nameDiv.innerText = msg.speakerName;
                    nameDiv.classList.add('group-speaker');
                    nameDiv.style.display = 'block';
                } else {
                    var bodyDiv = row.querySelector('.bubble-body');
                    if (bodyDiv) {
                        var newName = document.createElement('div');
                        newName.className = 'bubble-name group-speaker';
                        newName.innerText = msg.speakerName;
                        bodyDiv.insertBefore(newName, bodyDiv.firstChild);
                        nameDiv = newName;
                    }
                }
                // 群聊名字颜色：黑色
                if (nameDiv) {
                    nameDiv.style.color = '#1C1C1E';
                    nameDiv.style.fontWeight = '700';
                }
                // 显示群头衔徽章（灰色系）
                if (nameDiv && c.groupTitles && c.groupTitles[msg.speakerName]) {
                    var badge = document.createElement('span');
                    badge.className = 'group-title-badge';
                    badge.textContent = c.groupTitles[msg.speakerName];
                    badge.style.cssText = 'display:inline-block;font-size:9px;font-weight:700;color:#8E8E93;background:rgba(142,142,147,0.1);padding:1px 6px;border-radius:4px;margin-left:6px;vertical-align:middle;letter-spacing:0.5px;';
                    nameDiv.appendChild(badge);
                }
                // 长按头像修改群头衔（防重复触发）
                var avatarEl = row.querySelector('.msg-avatar');
                if (avatarEl && !avatarEl.dataset.gtBound) {
                    avatarEl.dataset.gtBound = '1';
                    var _gtTimer = null;
                    var _gtFired = false;
                    avatarEl.addEventListener('touchstart', function(e) {
                        _gtFired = false;
                        _gtTimer = setTimeout(function() {
                            _gtTimer = null;
                            if (!_gtFired) {
                                _gtFired = true;
                                setGroupMemberTitle(c.id, msg.speakerName);
                            }
                        }, 600);
                    }, {passive: true});
                    avatarEl.addEventListener('touchend', function() { if(_gtTimer) { clearTimeout(_gtTimer); _gtTimer = null; } });
                    avatarEl.addEventListener('touchmove', function() { if(_gtTimer) { clearTimeout(_gtTimer); _gtTimer = null; } });
                    avatarEl.addEventListener('contextmenu', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!_gtFired) {
                            _gtFired = true;
                            setGroupMemberTitle(c.id, msg.speakerName);
                        }
                    });
                }
                // 强制每条群聊消息独立成组（不与上下条合并圆角）
                row.classList.add('first-in-group');
                row.classList.add('last-in-group');
            }, 10);
            return result;
        };
    }
}, 100);
