// ==========================================
// 心事小票 (Soul Receipt) 核心逻辑
// ==========================================

window.rcUSER = { id: 'user', name: '我', title: '心事主人', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Me', isUser: true };
window.rcRoles = [
    { id:'self', name:'我的',  title:'我的小票',    avatar:'https://api.dicebear.com/7.x/notionists/svg?seed=Me' }
];
window.rcContacts = [];
window.rcDB = { self: [] };
window.rcCurrentRole = 'self';
window.rcCurrentReceipt = null;
window.rcSelectedContact = '';

window.rcInit = function() {
    // 动态同步系统中的真实联系人数据
    if (typeof contacts !== 'undefined' && contacts.length > 0) {
        window.rcContacts = contacts.map(c => ({
            id: c.id, name: c.chatRemark || c.name, title: 'Network AI', avatar: c.chatAvatar || c.avatar, style: 'Resonance',
            tpl: ['我有时候也会这样。"{e}"——这句话戳到我了。', '读完停了很久。"{e}" 值得被好好保存。', '"{e}" 我把这句话抄下来了。谢谢你愿意打印成这张小票。']
        }));
        window.rcRoles = [{ id:'self', name:'我的', title:'我的小票', avatar: (typeof gConfig !== 'undefined' ? gConfig.meAvatar : window.rcUSER.avatar) }];
        window.rcContacts.forEach(c => {
            window.rcRoles.push({ id: c.id, name: c.name, title: 'AI Persona', avatar: c.avatar });
            if (!window.rcDB[c.id]) window.rcDB[c.id] = [];
        });
        if (window.rcContacts.length > 0) window.rcSelectedContact = window.rcContacts[0].id;
    }
    // 异步加载存储（兼容 IndexedDB + localStorage）
    rcLoadData().then(() => {
        rcRenderTabs();
        rcRenderMain();
    });

    // 同步降级：先尝试 localStorage 快速显示
    try {
        const stored = localStorage.getItem('rcDataDB');
        if (stored) {
            const parsed = JSON.parse(stored);
            Object.keys(parsed).forEach(k => { window.rcDB[k] = parsed[k]; });
        }
    } catch(e) {}
    
    if (!document.getElementById('rc-exit-btn-bl')) {
        const exitBtn = document.createElement('div');
        exitBtn.id = 'rc-exit-btn-bl';
        exitBtn.style.cssText = 'position:absolute; left:22px; bottom:calc(var(--safe-bottom) + 30px); width:44px; height:44px; background:rgba(0,0,0,0.05); color:var(--rc-ink); border-radius:50%; display:flex; justify-content:center; align-items:center; cursor:pointer; z-index:9999; backdrop-filter:blur(10px); transition:0.2s;';
        exitBtn.onmousedown = () => exitBtn.style.transform = 'scale(0.9)';
        exitBtn.onmouseup = () => exitBtn.style.transform = 'scale(1)';
        exitBtn.onclick = () => { 
            const app = document.getElementById('app-receipt');
            if(app) app.classList.remove('active');
            if(typeof closeCurrentApps === 'function') closeCurrentApps(); 
        };
        exitBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';
        const appContainer = document.getElementById('app-receipt');
        if (appContainer) appContainer.appendChild(exitBtn);
    }

    rcRenderTabs();
    rcRenderMain();
};

// IndexedDB 存储引擎 - 容量无上限，数据永久保留
let _rcIDB = null;
function rcGetIDB() {
    return new Promise((resolve, reject) => {
        if(_rcIDB) { resolve(_rcIDB); return; }
        const req = indexedDB.open('SoapReceiptDB', 1);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if(!db.objectStoreNames.contains('receipts')) {
                db.createObjectStore('receipts');
            }
        };
        req.onsuccess = (e) => { _rcIDB = e.target.result; resolve(_rcIDB); };
        req.onerror = () => reject(req.error);
    });
}

function rcSaveData() {
    // 优先存 IndexedDB
    rcGetIDB().then(db => {
        const tx = db.transaction('receipts', 'readwrite');
        tx.objectStore('receipts').put(JSON.parse(JSON.stringify(window.rcDB)), 'rcData');
    }).catch(() => {
        // IndexedDB 不可用则降级 localStorage
        try {
            localStorage.setItem('rcDataDB', JSON.stringify(window.rcDB));
        } catch(e) {
            if(e.name === 'QuotaExceededError') {
                if(typeof window.rcShowToast === 'function') window.rcShowToast('存储空间不足，请前往设置导出备份后清理');
            }
        }
    });
}

function rcLoadData() {
    return new Promise(resolve => {
        rcGetIDB().then(db => {
            const tx = db.transaction('receipts', 'readonly');
            const req = tx.objectStore('receipts').get('rcData');
            req.onsuccess = () => {
                if(req.result) {
                    Object.keys(req.result).forEach(k => { window.rcDB[k] = req.result[k]; });
                    // 迁移成功后清理 localStorage 旧数据释放空间
                    localStorage.removeItem('rcDataDB');
                }
                resolve();
            };
            req.onerror = () => resolve();
        }).catch(() => {
            // IndexedDB 不可用，走 localStorage
            try {
                const stored = localStorage.getItem('rcDataDB');
                if(stored) {
                    const parsed = JSON.parse(stored);
                    Object.keys(parsed).forEach(k => { window.rcDB[k] = parsed[k]; });
                }
            } catch(e) {}
            resolve();
        });
    });
}

function rcGetNow() {
    const n = new Date(); return n.getHours().toString().padStart(2,'0')+':'+n.getMinutes().toString().padStart(2,'0');
}
function rcCountWords(s) { return s.replace(/\s/g,'').length; }

function rcRenderTabs() {
    const bar = document.getElementById('rc-role-tabbar');
    if(!bar) return;
    bar.innerHTML = '';
    window.rcRoles.forEach(r => {
        const list = window.rcDB[r.id] || [];
        const tab = document.createElement('div');
        tab.className = 'rc-role-tab' + (r.id === window.rcCurrentRole ? ' active' : '');
        tab.onclick = () => { window.rcCurrentRole = r.id; rcRenderTabs(); rcRenderMain(); };
        tab.innerHTML = `
            <div class="rc-role-tab-ava"><img src="${r.avatar}" loading="lazy"></div>
            <div class="rc-role-tab-name rc-mono">${r.name}</div>
            <div class="rc-role-tab-badge rc-mono ${list.length ? 'show' : ''}">${list.length}</div>`;
        bar.appendChild(tab);
    });
}

function rcDeleteReceipt(id) {
    if (!confirm('确定要销毁这篇心事吗？')) return;
    if (window.rcDB[window.rcCurrentRole]) {
        window.rcDB[window.rcCurrentRole] = window.rcDB[window.rcCurrentRole].filter(r => r.id !== id);
        rcSaveData();
        rcRenderTabs();
        rcRenderMain();
        rcShowToast('已销毁');
    }
}

window.rcDeleteComment = function(roleId, receiptId, commentTime) {
    if (!confirm('确定要删除这条评论吗？')) return;
    if (window.rcDB[roleId]) {
        const r = window.rcDB[roleId].find(x => x.id === receiptId);
        if (r && r.comments) {
            r.comments = r.comments.filter(c => c.time !== commentTime);
            rcSaveData();
            rcRenderMain();
            if (window.rcCurrentReceipt && window.rcCurrentReceipt.id === receiptId) {
                rcOpenDetail(r);
            }
            const contactView = document.getElementById('rc-contact-view');
            if (contactView && contactView.classList.contains('on') && typeof window.rcOpenContactView === 'function') {
                window.rcOpenContactView();
            }
            rcShowToast('评论已删除');
        }
    }
};

function rcRenderMain() {
    const el = document.getElementById('rc-main-list');
    if(!el) return;
    el.innerHTML = '';
    const list = window.rcDB[window.rcCurrentRole] || [];
    const role = window.rcRoles.find(r => r.id === window.rcCurrentRole) || window.rcRoles[0];

    if (!list.length) {
        el.innerHTML = `<div class="rc-empty-state"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.2; margin:0 auto 14px; display:block;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg><p class="rc-mono">${role.name} 暂无心事记录</p><p class="rc-mono" style="font-size:10px;margin-top:6px;opacity:.6;">右下角撰写 · 右上角调取</p></div>`;
        return;
    }

    let lastDate = '';
    list.forEach(r => {
        if (r.date !== lastDate) {
            //🔧 用 createElement 代替 innerHTML +=，避免破坏前面卡片的 onclick 绑定
            const dateLabel = document.createElement('div');
            dateLabel.className = 'rc-date-label rc-mono';
            dateLabel.textContent = r.date.replace(/-/g, ' / ');
            el.appendChild(dateLabel);
            lastDate = r.date;
        }
        const wrap = document.createElement('div');
        wrap.className = 'rc-receipt-wrap';
        const uBadge = r.isUserPost ? `<span class="rc-user-badge rc-mono"><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> USER</span>` : '';
        
        const card = document.createElement('div');
        card.className = 'rc-ticket';
        card.onclick = () => rcOpenDetail(r);
        card.innerHTML = `
            <div class="rc-t-meta">
                <div class="rc-t-meta-left">
                    <div class="rc-t-author-ava"><img src="${r.author.avatar}" loading="lazy"></div>
                    <div class="rc-t-author-info">
                        <div class="rc-t-author-name rc-mono">${r.author.name}${uBadge}</div>
                        <div class="rc-t-author-role rc-mono">${r.author.title}</div>
                    </div>
                </div>
                <div class="rc-t-meta-right">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <div class="rc-t-txn rc-mono">${r.id}</div>
                        <div onclick="event.stopPropagation(); rcDeleteReceipt('${r.id}')" style="cursor:pointer; color:var(--rc-sub); padding:4px;" title="删除">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </div>
                    </div>
                    <div class="rc-t-time rc-mono">${r.time}</div>
                </div>
            </div>
            <div class="rc-t-title rc-serif">${r.title}</div>
            <div class="rc-t-body rc-serif">${r.body}</div>
            <div class="rc-t-foot rc-mono">
                <div style="display:flex; align-items:center; gap:10px;">
                    <div class="rc-barcode-mini"></div>
                    <span>WORDS: ${rcCountWords(r.body)}</span>
                </div>
                <div onclick="event.stopPropagation(); rcDeleteReceipt('${r.id}')" style="color:#D32F2F; cursor:pointer; padding:4px 8px; border-radius:6px; background:rgba(211,47,47,0.05); display:flex; align-items:center; gap:4px; font-weight:800; font-size:9px; letter-spacing:1px; transition:0.2s;" onmousedown="this.style.background='rgba(211,47,47,0.1)'" onmouseup="this.style.background='rgba(211,47,47,0.05)'">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    DELETE
                </div>
            </div>`;
        wrap.appendChild(card);

        if (r.comments && r.comments.length) {
            const ca = document.createElement('div');
            ca.className = 'rc-comments-area'; ca.style.marginTop = '12px';
            r.comments.forEach(c => ca.appendChild(rcMakeBubble(c, r.id, window.rcCurrentRole)));
            wrap.appendChild(ca);
        }
        el.appendChild(wrap);
    });
}

function rcMakeBubble(c, receiptId, roleId) {
    const el = document.createElement('div'); el.className = 'rc-comment-bubble';
    el.style.position = 'relative';
    let delBtn = '';
    if (receiptId && roleId) {
        delBtn = `<div onclick="event.stopPropagation(); window.rcDeleteComment('${roleId}', '${receiptId}', '${c.time}')" style="position:absolute; top:4px; right:4px; padding:4px; cursor:pointer; color:var(--rc-sub); opacity:0.5; transition:0.2s;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.5"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg></div>`;
    }
    el.innerHTML = `<div class="rc-cb-avatar"><img src="${c.avatar}" loading="lazy"></div><div class="rc-cb-right"><div class="rc-cb-name rc-mono">${c.name} · ${c.style}</div><div class="rc-cb-text rc-serif">${c.text.replace(/\n/g,'<br>')}</div><div class="rc-cb-time rc-mono">${c.time}</div></div>${delBtn}`;
    return el;
}

const rcAiPool = [
    { title:'突如其来的崩塌', body:'刚刚那一瞬间，突然觉得所有的努力都没有意义。像是一座堆了很久的沙堡，被一阵微风轻易吹散。' },
    { title:'未发送的草稿',   body:'对话框里写了删，删了又写。最后还是按下了返回键。有些心事，只适合打印在这张只有自己能看见的小票上。' },
    { title:'三点钟的窗外',   body:'失眠的时候城市并不安静，只是把喧嚣换成了另一种频率。路灯把影子拉得很长。' }
];

window.rcFetchAI = async function() {
    if (window.rcCurrentRole === 'self') {
        return window.rcShowToast('自己的心事请手动撰写');
    }

    if (!gConfig.apiUrl || !gConfig.apiKey) {
        return window.rcShowToast('请先在设置中配置 API');
    }

    const c = contacts.find(x => x.id === window.rcCurrentRole);
    if (!c) return window.rcShowToast('找不到该角色数据');

    const el = document.getElementById('rc-main-list');
    
    // 1. 创建流式渲染的临时占位卡片
    const role = window.rcRoles.find(r => r.id === window.rcCurrentRole) || window.rcRoles[0];
    const tempId = '#AI-' + Math.floor(Math.random()*9000+1000);
    const tempTime = rcGetNow();
    
    const wrap = document.createElement('div');
    wrap.className = 'rc-receipt-wrap';
    wrap.id = 'live-receipt-wrap';
    wrap.innerHTML = `
        <div class="rc-ticket">
            <div class="rc-t-meta">
                <div class="rc-t-meta-left">
                    <div class="rc-t-author-ava"><img src="${role.avatar}"></div>
                    <div class="rc-t-author-info">
                        <div class="rc-t-author-name rc-mono">${role.name}</div>
                        <div class="rc-t-author-role rc-mono">${role.title}</div>
                    </div>
                </div>
                <div class="rc-t-meta-right"><div class="rc-t-txn rc-mono">${tempId}</div><div class="rc-t-time rc-mono">${tempTime}</div></div>
            </div>
            <div class="rc-t-title rc-serif" id="live-rc-title" style="color:var(--rc-sub);">正在感知神经链路...</div>
            <div class="rc-t-body rc-serif" id="live-rc-body"><div class="rc-typing-dots"><span></span><span></span><span></span></div></div>
            <div class="rc-t-foot rc-mono"><div class="rc-barcode-mini"></div><span id="live-rc-words">WORDS: 0</span></div>
        </div>`;
    el.prepend(wrap);

    let recentHistory = c.history.filter(m => m.role !== 'system' && m.role !== 'system_sum' && !m.isRevoked).slice(-30);
    let historyText = recentHistory.map(m => `${m.role === 'user' ? '用户' : c.name}: ${m.content.replace(/<[^>]+>/g, '')}`).join('\n');
    if (!historyText) historyText = "暂无聊天记录。";

    const sysPrompt = `你现在是 ${c.name}。请根据你的人设和最近的聊天记录，写 2 到 3 篇内心的长篇随笔/心事账单。
要求：
1. 必须生成 2 到 3 篇独立的心事，每篇字数在 200 - 300 字左右，且字数长短不一。
2. 完全符合你的人设口吻，第一人称，不要提及自己是AI。
3. 情感要细腻、深入，分段排版。
4. 绝对格式铁律：每篇心事之间【必须】单独使用 ===RECEIPT=== 作为一行分隔符。
每篇心事内部：第一行【必须】是标题（15字以内，不要加任何标点符号或括号）。从第二行开始全部是正文内容。
5. 不要输出任何其他多余的解释、不要加粗、不要输出 markdown 标记。

你的人设：
${c.history[0] ? c.history[0].content : c.prompt}`;

    try {
        const response = await fetch(`${gConfig.apiUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${gConfig.apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: gConfig.model,
                messages: [
                    { role: 'system', content: sysPrompt },
                    { role: 'user', content: `最近的聊天记录：\n${historyText}\n\n请直接开始书写你的长篇心事（多篇之间用 ===RECEIPT=== 隔开）：` }
                ],
                temperature: 0.8,
                stream: true
            })
        });

        if (!response.ok) throw new Error("API 请求失败");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let rawReply = '';
        let titleEl = document.getElementById('live-rc-title');
        let bodyEl = document.getElementById('live-rc-body');
        let wordsEl = document.getElementById('live-rc-words');
        let streamBuffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            streamBuffer += decoder.decode(value, { stream: true });
            let lines = streamBuffer.split('\n');
            streamBuffer = lines.pop(); // 保留最后一行不完整的
            
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.startsWith('data: ')) continue;
                const jsonStr = trimmed.replace('data: ', '').trim();
                if (jsonStr === '[DONE]') continue;
                
                try {
                    const parsed = JSON.parse(jsonStr);
                    const delta = parsed.choices?.[0]?.delta?.content || '';
                    rawReply += delta;
                    
                    // 实时解析标题和正文（取最后一篇正在生成的）
                    let currentReceiptText = rawReply.split('===RECEIPT===').pop().trim();
                    let parts = currentReceiptText.split('\n');
                    let liveTitle = parts[0] || '正在记录...';
                    let liveBody = parts.slice(1).join('\n').trim();
                    
                    titleEl.innerText = liveTitle;
                    titleEl.style.color = 'var(--rc-ink)';
                    
                    if (liveBody) {
                        bodyEl.innerHTML = liveBody.replace(/\n/g, '<br>');
                    } else {
                        bodyEl.innerHTML = '<div class="rc-typing-dots"><span></span><span></span><span></span></div>';
                    }
                    wordsEl.innerText = 'WORDS: ' + rcCountWords(liveBody);
                    
                } catch(e) {}
            }
        }

        // 流结束，先移除临时占位卡片，避免遮挡正式卡片导致点击无响应
        const liveWrap = document.getElementById('live-receipt-wrap');
        if (liveWrap) liveWrap.remove();

        // 解析并保存数据
        let receiptsTexts = rawReply.split('===RECEIPT===').map(s => s.trim()).filter(s => s.length > 20);
        
        if (!window.rcDB[window.rcCurrentRole]) window.rcDB[window.rcCurrentRole] = [];
        
        // 倒序插入，确保第一篇在最下面，最新的一篇在最上面
        receiptsTexts.reverse().forEach((rt, idx) => {
            let parts = rt.split('\n');
            let finalTitle = parts[0].trim() || '无题';
            let finalBody = parts.slice(1).join('\n').trim() || '...';
            // 用时间戳确保 ID 唯一，避免和已有小票冲突
            const uniqueId = '#AI-' + Date.now().toString().slice(-6) + '-' + idx;
            
            window.rcDB[window.rcCurrentRole].unshift({
                id: uniqueId, time: tempTime, date: new Date().toISOString().split('T')[0],
                author: { id: role.id, name: role.name, title: role.title, avatar: role.avatar }, isUserPost: false,
                title: finalTitle, body: finalBody, comments: []
            });
        });
        
        rcSaveData(); 
        rcRenderTabs();
        rcRenderMain(); // 重新渲染以绑定完整事件
        window.rcShowToast(`成功调取 ${receiptsTexts.length} 篇心事`);

    } catch (e) {
        console.error(e);
        wrap.remove();
        
        // 降级使用静态库
        const tpl = rcAiPool[Math.floor(Math.random()*rcAiPool.length)];
        if (!window.rcDB[window.rcCurrentRole]) window.rcDB[window.rcCurrentRole] = [];
        window.rcDB[window.rcCurrentRole].unshift({
            id: tempId, time: tempTime, date: new Date().toISOString().split('T')[0],
            author: { id: role.id, name: role.name, title: role.title, avatar: role.avatar }, isUserPost: false,
            title: '【调取】' + tpl.title, body: tpl.body, comments: []
        });
        rcSaveData(); rcRenderTabs(); rcRenderMain();
        window.rcShowToast('API 调用失败，已降级为离线预设');
    }
};

window.rcOpenDetail = function(r) {
    window.rcCurrentReceipt = r;
    document.getElementById('rc-dv-author-ava').src = r.author.avatar;
    document.getElementById('rc-dv-author-name').textContent = r.author.name + (r.isUserPost ? '  [USER]' : '');
    document.getElementById('rc-dv-author-role').textContent = r.author.title;
    document.getElementById('rc-dv-author-meta').textContent = r.author.name;
    document.getElementById('rc-dv-id').textContent = r.id;
    document.getElementById('rc-dv-date').textContent = r.date + '  ' + r.time;
    document.getElementById('rc-dv-title').textContent = r.title;
    document.getElementById('rc-dv-words').textContent = rcCountWords(r.body);
    const bodyEl = document.getElementById('rc-dv-body'); bodyEl.innerHTML = '';
    r.body.split('\n').forEach(t => { if(t.trim()){ const p=document.createElement('p'); p.textContent=t.trim(); bodyEl.appendChild(p); } });
    
    const wrap = document.getElementById('rc-dv-comments-wrap');
    const area = document.getElementById('rc-dv-comments-area'); area.innerHTML = '';
    if (r.comments && r.comments.length) { wrap.style.display = 'block'; r.comments.forEach(c => area.appendChild(rcMakeBubble(c, r.id, window.rcCurrentRole))); } else { wrap.style.display = 'none'; }
    document.getElementById('rc-detail-view').classList.add('on');
};

window.rcCloseDetail = function() { 
    document.getElementById('rc-detail-view').classList.remove('on'); 
    window.rcCurrentReceipt = null; 
};

window.rcComposeAuthorId = 'self';
window.rcOpenCompose = function() {
    window.rcComposeAuthorId = window.rcCurrentRole === 'self' ? 'self' : window.rcCurrentRole;
    document.getElementById('rc-cv-t').value = '';
    document.getElementById('rc-cv-b').value = '';
    document.getElementById('rc-cv-b').style.height = 'auto';

    const composeView = document.getElementById('rc-compose-view');
    composeView.classList.add('on');

    const authorPick = composeView.querySelector('.rc-cv-author-pick');
    if(authorPick) {
        authorPick.style.cssText = 'display:flex;align-items:center;gap:10px;padding:14px 20px;position:relative;z-index:9999;';
        authorPick.innerHTML = '';

        const label = document.createElement('div');
        label.textContent = 'FROM:';
        label.className = 'rc-cv-author-pick-label rc-mono';
        label.style.cssText = 'font-family:monospace;font-size:10px;font-weight:800;color:rgba(0,0,0,0.3);letter-spacing:2px;flex-shrink:0;';
        authorPick.appendChild(label);

        const sel = document.createElement('select');
        sel.id = 'rc-author-select';
        sel.style.cssText = 'flex:1;height:44px;border-radius:12px;border:1.5px solid rgba(0,0,0,0.1);background:#fff;padding:0 14px;font-family:monospace;font-size:12px;font-weight:800;color:#1C1C1E;letter-spacing:0.5px;outline:none;appearance:auto;-webkit-appearance:menulist;cursor:pointer;';
        window.rcRoles.forEach(r => {
            const opt = document.createElement('option');
            opt.value = r.id;
            opt.textContent = r.name;
            if(r.id === window.rcComposeAuthorId) opt.selected = true;
            sel.appendChild(opt);
        });
        sel.onchange = function() {
            window.rcComposeAuthorId = this.value;
        };
        authorPick.appendChild(sel);
    }
};

window.rcCloseCompose = function() { 
    document.getElementById('rc-compose-view').classList.remove('on'); 
};

window.rcSubmitReceipt = function() {
    const title = document.getElementById('rc-cv-t').value.trim() || 'Untitled';
    const body  = document.getElementById('rc-cv-b').value.trim();
    if (!body) return window.rcShowToast('内容不能为空');
    if (!window.rcDB[window.rcComposeAuthorId]) window.rcDB[window.rcComposeAuthorId] = [];
    window.rcDB[window.rcComposeAuthorId].unshift({
        id: '#USR-' + Math.floor(Math.random()*9000+1000), time: rcGetNow(), date: new Date().toISOString().split('T')[0],
        author: { id:'user', name: (typeof gConfig !== 'undefined' ? gConfig.meName : '我'), title: '心事主人', avatar: (typeof gConfig !== 'undefined' ? gConfig.meAvatar : window.rcUSER.avatar) },
        isUserPost: true, title, body, comments: []
    });
    window.rcCurrentRole = window.rcComposeAuthorId;
    rcSaveData(); window.rcCloseCompose(); rcRenderTabs(); rcRenderMain();
};

window.rcOpenShareSheet = function() {
    if (!window.rcCurrentReceipt) return;
    document.getElementById('rc-pc-t').textContent = window.rcCurrentReceipt.title; document.getElementById('rc-pc-b').textContent = window.rcCurrentReceipt.body; document.getElementById('rc-pc-d').textContent = window.rcCurrentReceipt.date; document.getElementById('rc-pc-n').textContent = window.rcCurrentReceipt.author.name;
    const el = document.getElementById('rc-sheet-contacts'); el.innerHTML = '';
    window.rcContacts.forEach(c => {
        const item = document.createElement('div'); item.className = `rc-c-item ${c.id === window.rcSelectedContact ? 'sel' : ''}`;
        item.onclick = () => { document.querySelectorAll('.rc-c-item').forEach(n => n.classList.remove('sel')); item.classList.add('sel'); window.rcSelectedContact = c.id; };
        item.innerHTML = `<div class="rc-c-ava"><img src="${c.avatar}" loading="lazy"></div><div class="rc-c-name rc-mono">${c.name}</div>`; el.appendChild(item);
    });
    document.getElementById('rc-share-sheet').classList.add('on');
};

window.rcCloseShareSheet = function() { 
    document.getElementById('rc-share-sheet').classList.remove('on'); 
};

window.rcDoSend = function() {
    const c = window.rcContacts.find(x => x.id === window.rcSelectedContact); 
    window.rcCloseShareSheet();
    if(!c || !window.rcCurrentReceipt) return;
    
    const r = window.rcCurrentReceipt;
    const contactData = typeof contacts !== 'undefined' ? contacts.find(x => x.id === c.id) : null;
    if (!contactData) return;

    // 🚀 核心更新：大幅压缩卡片高度，减少 padding 和行数限制
    const _bodyText = r.body.replace(/<[^>]+>/g,'').slice(0, 36);
    const _titleText = r.title.slice(0, 16);
    const cardHtml = `<div style="display:inline-block;vertical-align:top;width:190px;position:relative;margin:2px 0;">
<svg xmlns="http://www.w3.org/2000/svg" width="190" height="110" viewBox="0 0 190 110">
  <defs>
    <clipPath id="rcp${r.id.replace(/[^a-z0-9]/gi,'_')}">
      <path d="M0,6 Q5,0 10,6 Q15,0 20,6 Q25,0 30,6 Q35,0 40,6 Q45,0 50,6 Q55,0 60,6 Q65,0 70,6 Q75,0 80,6 Q85,0 90,6 Q95,0 100,6 Q105,0 110,6 Q115,0 120,6 Q125,0 130,6 Q135,0 140,6 Q145,0 150,6 Q155,0 160,6 Q165,0 170,6 Q175,0 180,6 Q185,0 190,6 L190,104 Q185,110 180,104 Q175,110 170,104 Q165,110 160,104 Q155,110 150,104 Q145,110 140,104 Q135,110 130,104 Q125,110 120,104 Q115,110 110,104 Q105,110 100,104 Q95,110 90,104 Q85,110 80,104 Q75,110 70,104 Q65,110 60,104 Q55,110 50,104 Q45,110 40,104 Q35,110 30,104 Q25,110 20,104 Q15,110 10,104 Q5,110 0,104 Z"/>
    </clipPath>
  </defs>
  <g clip-path="url(#rcp${r.id.replace(/[^a-z0-9]/gi,'_')})">
    <rect width="190" height="110" fill="#1A1A1A"/>
    <line x1="0" y1="30" x2="190" y2="30" stroke="rgba(255,255,255,0.08)" stroke-width="1" stroke-dasharray="3,3"/>
    <line x1="0" y1="82" x2="190" y2="82" stroke="rgba(255,255,255,0.08)" stroke-width="1" stroke-dasharray="3,3"/>
    <image href="${r.author.avatar}" x="12" y="9" width="12" height="12" style="border-radius:3px;"/>
    <text x="28" y="19" font-family="Courier New,monospace" font-size="8" font-weight="900" fill="#CCCCCC" letter-spacing="0.5">${r.author.name.slice(0,12)}</text>
    <text x="178" y="19" font-family="Courier New,monospace" font-size="7" fill="rgba(255,255,255,0.3)" text-anchor="end">${r.date}</text>
    <text x="12" y="50" font-family="serif" font-size="13" font-weight="900" fill="#FFFFFF" letter-spacing="0.3">${_titleText}</text>
    <text x="12" y="66" font-family="serif" font-size="9.5" fill="rgba(255,255,255,0.4)">${_bodyText}</text>
    <rect x="12" y="88" width="44" height="8" fill="none"/>
    <line x1="12" y1="88" x2="12" y2="96" stroke="rgba(255,255,255,0.5)" stroke-width="1.5"/>
    <line x1="15" y1="88" x2="15" y2="96" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
    <line x1="17" y1="88" x2="17" y2="96" stroke="rgba(255,255,255,0.5)" stroke-width="2"/>
    <line x1="20" y1="88" x2="20" y2="96" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
    <line x1="23" y1="88" x2="23" y2="96" stroke="rgba(255,255,255,0.5)" stroke-width="1.5"/>
    <line x1="25" y1="88" x2="25" y2="96" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
    <line x1="28" y1="88" x2="28" y2="96" stroke="rgba(255,255,255,0.5)" stroke-width="2"/>
    <line x1="31" y1="88" x2="31" y2="96" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
    <line x1="33" y1="88" x2="33" y2="96" stroke="rgba(255,255,255,0.5)" stroke-width="1.5"/>
    <line x1="36" y1="88" x2="36" y2="96" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
    <line x1="38" y1="88" x2="38" y2="96" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
    <line x1="41" y1="88" x2="41" y2="96" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
    <line x1="44" y1="88" x2="44" y2="96" stroke="rgba(255,255,255,0.5)" stroke-width="1.5"/>
    <line x1="47" y1="88" x2="47" y2="96" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
    <line x1="50" y1="88" x2="50" y2="96" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
    <line x1="53" y1="88" x2="53" y2="96" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
    <text x="178" y="95" font-family="Courier New,monospace" font-size="7" font-weight="900" fill="rgba(255,255,255,0.2)" text-anchor="end" letter-spacing="2">SOUL RECEIPT</text>
  </g>
</svg>
</div><img src="1" onerror="this.parentNode.classList.add('bubble-clear'); this.remove();">`;

    const fullBody = r.body.replace(/<[^>]+>/g, '');
    let aiPrompt = "";
    if (r.author.id === 'user') {
        aiPrompt = `[系统提示：用户刚刚向你分享了一篇TA自己写的心事。请认真阅读以下全部内容，并给予真诚的关心、回应或探讨，不要只是泛泛而谈，要结合具体内容。\n\n标题：${r.title}\n内容：${fullBody}]`;
    } else if (r.author.id === c.id) {
        aiPrompt = `[系统提示：用户刚刚向你分享了一篇【你自己曾经写下的心事】！请认真阅读以下全部内容，表现出"这是我写的"的认知，结合具体文字解释当时的心境，或对用户特意分享这篇心事的行为做出反应。\n\n标题：${r.title}\n内容：${fullBody}]`;
    } else {
        aiPrompt = `[系统提示：用户刚刚向你分享了一篇其他人（${r.author.name}）写的心事。请认真阅读以下全部内容，结合具体文字与用户讨论你的看法和感受，不要只是笼统评价。\n\n标题：${r.title}\n内容：${fullBody}]`;
    }

    contactData.history.push({
        role: 'user',
        content: cardHtml + `<span style="display:none;">${aiPrompt}</span>`,
        isRevoked: false,
        timestamp: Date.now()
    });

    if (typeof saveData === 'function') saveData();

    if (typeof currentContactId !== 'undefined' && currentContactId === c.id && document.getElementById('view-chat').classList.contains('slide-in')) {
        if (typeof appendBubbleRow === 'function') {
            appendBubbleRow(contactData.history[contactData.history.length - 2], contactData.history.length - 2);
            setTimeout(() => { if (typeof scrollToBottom === 'function') scrollToBottom(); }, 50);
        }
    }

    setTimeout(() => window.rcShowToast(`已分享给 ${c.name}`), 300);
};

window.rcShowToast = function(msg) {
    const el = document.getElementById('rc-toast'); 
    el.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> ${msg}`; 
    el.classList.add('on');
    clearTimeout(el._t); 
    el._t = setTimeout(() => el.classList.remove('on'), 2500);
};

window.rcOpenContactView = function() {
    const view = document.getElementById('rc-contact-view');
    if (!view) return;
    const list = document.getElementById('rc-contact-big-list');
    if (list) {
        list.innerHTML = '';
        if (window.rcContacts.length === 0) {
            list.innerHTML = '<div class="rc-mono" style="text-align:center; padding:40px 20px; font-size:11px; color:var(--rc-sub); opacity:0.6;">暂无联系人</div>';
        } else {
            window.rcContacts.forEach(c => {
                const item = document.createElement('div');
                item.className = 'rc-cv2-contact-item';
                item.dataset.contactId = c.id;
                item.dataset.expanded = 'false';

                const receiptsForContact = [];
                Object.keys(window.rcDB).forEach(roleId => {
                    (window.rcDB[roleId] || []).forEach(r => {
                        receiptsForContact.push({ r, roleId });
                    });
                });

                item.innerHTML = `
                    <div class="rc-cv2-capsule" onclick="rcToggleContactExpand('${c.id}')">
                        <div class="rc-cv2-cap-left">
                            <div class="rc-cv2-cap-ava"><img src="${c.avatar}" loading="lazy"></div>
                            <div class="rc-cv2-cap-info">
                                <div class="rc-mono rc-cv2-cap-name">${c.name}</div>
                                <div class="rc-mono rc-cv2-cap-sub">${receiptsForContact.length} 篇可评论</div>
                            </div>
                        </div>
                        <div class="rc-cv2-cap-arrow rc-mono">▸</div>
                    </div>
                    <div class="rc-cv2-receipt-list" id="rc-cv2-rl-${c.id}" style="display:none;"></div>`;
                list.appendChild(item);
            });
        }
    }
    view.classList.add('on');
};

window.rcToggleContactExpand = function(contactId) {
    const item = document.querySelector(`[data-contact-id="${contactId}"]`);
    if (!item) return;
    const rl = document.getElementById(`rc-cv2-rl-${contactId}`);
    const arrow = item.querySelector('.rc-cv2-cap-arrow');
    const expanded = item.dataset.expanded === 'true';

    document.querySelectorAll('.rc-cv2-contact-item').forEach(el => {
        if (el.dataset.contactId !== contactId) {
            el.dataset.expanded = 'false';
            const otherRl = el.querySelector('.rc-cv2-receipt-list');
            const otherArrow = el.querySelector('.rc-cv2-cap-arrow');
            if (otherRl) otherRl.style.display = 'none';
            if (otherArrow) otherArrow.style.transform = 'rotate(0deg)';
        }
    });

    if (expanded) {
        item.dataset.expanded = 'false';
        rl.style.display = 'none';
        arrow.style.transform = 'rotate(0deg)';
    } else {
        item.dataset.expanded = 'true';
        arrow.style.transform = 'rotate(90deg)';
        rl.style.display = 'block';
        rl.innerHTML = '';

        const allReceipts = [];
        Object.keys(window.rcDB).forEach(roleId => {
            (window.rcDB[roleId] || []).forEach(r => {
                allReceipts.push({ r, roleId });
            });
        });

        if (allReceipts.length === 0) {
            rl.innerHTML = '<div class="rc-mono" style="padding:12px 16px; font-size:10px; color:var(--rc-sub); opacity:0.6;">暂无小票</div>';
            return;
        }

        allReceipts.forEach(({ r, roleId }) => {
            const card = document.createElement('div');
            card.className = 'rc-cv2-mini-ticket';
            card.innerHTML = `
                <div class="rc-cv2-mt-info">
                    <div class="rc-mono rc-cv2-mt-title">${r.title}</div>
                    <div class="rc-mono rc-cv2-mt-meta">${r.date} · ${rcCountWords(r.body)} 字</div>
                </div>
                <div class="rc-mono rc-cv2-mt-btn" onclick="rcRequestComment('${contactId}', '${roleId}', '${r.id}')">评论</div>`;
            rl.appendChild(card);
        });
    }
};

window.rcCloseContactView = function() {
    const view = document.getElementById('rc-contact-view');
    if (view) view.classList.remove('on');
};

window.rcRequestComment = async function(contactId, roleId, receiptId) {
    const c = typeof contacts !== 'undefined' ? contacts.find(x => x.id === contactId) : null;
    if (!c) return window.rcShowToast('找不到联系人');
    if (!gConfig.apiUrl || !gConfig.apiKey) return window.rcShowToast('请先配置 API');

    const receipt = (window.rcDB[roleId] || []).find(x => x.id === receiptId);
    if (!receipt) return window.rcShowToast('找不到该小票');

    const role = window.rcContacts.find(x => x.id === contactId);
    if (!role) return;

    window.rcShowToast('正在调取评论...');

    const sysPrompt = c.history[0] ? c.history[0].content : (c.prompt || '');
    const excerpt = receipt.body.replace(/<[^>]+>/g, '').slice(0, 100);
    const tpl = role.tpl || ['"{e}" 这句话让我停了很久。'];
    const randomTpl = tpl[Math.floor(Math.random() * tpl.length)].replace('{e}', excerpt.slice(0, 30));

    try {
        const response = await fetch(`${gConfig.apiUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${gConfig.apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: gConfig.model,
                messages: [
                    { role: 'system', content: sysPrompt },
                    { role: 'user', content: `请你以自己的口吻，对这篇心事写一段简短的评论（50-80字）。参考风格："${randomTpl}"。\n\n心事标题：${receipt.title}\n心事内容：${receipt.body.replace(/<[^>]+>/g,'').slice(0,200)}` }
                ],
                temperature: 0.85
            })
        });
        if (!response.ok) throw new Error('API 失败');
        const data = await response.json();
        const commentText = data.choices?.[0]?.message?.content?.trim() || '';
        if (!commentText) throw new Error('空回复');

        if (!receipt.comments) receipt.comments = [];
        receipt.comments.push({
            name: role.name,
            avatar: role.avatar,
            style: role.style || 'Resonance',
            text: commentText,
            time: rcGetNow()
        });
        rcSaveData();
        rcRenderMain();
        window.rcShowToast(`${role.name} 评论了这篇心事`);

        const btn = document.querySelector(`[data-contact-id="${contactId}"] .rc-cv2-mt-btn`);
        if (btn) { btn.textContent = '✓'; btn.style.color = 'var(--rc-sub)'; btn.style.pointerEvents = 'none'; }

    } catch(e) {
        console.error(e);
        window.rcShowToast('评论调取失败');
    }
};
