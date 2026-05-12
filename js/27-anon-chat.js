// =====================================================================
// 匿名聊天室模块 (Anonymous Chat)
// =====================================================================

const ANON_DEFAULT_AVATAR = 'https://nos.netease.com/youdata-netease/public-utilUpload-ikeCodhsoguHaZwot9fGZF.jpg';
const ANON_STORAGE_KEY = 'anon_chat_v1';

let anonCfg = {};
let anonContacts = [];
let anonSelectedMaskId = 'mystery';
let anonSelectedContactId = null;
let anonChatHistory = [];
window.anonAllHistories = {};

// ===== 读写存储 =====
function anonLoadStorage() {
    try {
        let raw = localStorage.getItem(ANON_STORAGE_KEY);
        if (raw) {
            let d = JSON.parse(raw);
            anonCfg = d.cfg || {};
            window.anonAllHistories = d.histories || {};
        } else {
            window.anonAllHistories = {};
        }
    } catch(e) {
        window.anonAllHistories = {};
    }
}

function anonSaveStorage() {
    localStorage.setItem(ANON_STORAGE_KEY, JSON.stringify({
        cfg: anonCfg,
        histories: window.anonAllHistories || {}
    }));
}

// ===== 从主系统同步联系人和配置 =====
function anonSyncFromMain() {
    if (typeof contacts !== 'undefined' && contacts.length > 0) {
        anonContacts = contacts.map(c => ({
            id: c.id,
            name: c.chatRemark || c.name,
            avatar: c.chatAvatar || c.avatar || '',
            prompt: c.prompt || (c.history && c.history[0] ? c.history[0].content : '') || ''
        }));
    }
    if (typeof gConfig !== 'undefined') {
        anonCfg.apiUrl = gConfig.apiUrl || '';
        anonCfg.apiKey = gConfig.apiKey || '';
        anonCfg.model = gConfig.model || '';
    }
}

// ===== 面具列表（不含匿名，只用自定义面具）=====
function anonGetMasks() {
    let result = [
        {
            id: 'mystery',
            name: '神秘访客',
            handle: '@mystery_∞',
            avatar: null,
            persona: '你是一个神秘的陌生访客，对方完全不认识你。请保持神秘感，不要透露任何真实身份信息。'
        }
    ];
    if (typeof masks !== 'undefined' && Array.isArray(masks)) {
        masks.forEach(m => {
            result.push({
                id: m.id,
                name: m.name || '面具',
                handle: '@' + (m.name || 'mask').toLowerCase().replace(/[^a-z0-9]/g, '_'),
                avatar: m.avatar || null,
                persona: m.persona || '你正在使用一个面具身份与对方私信。'
            });
        });
    }
    return result;
}

// ===== 打开匿名聊天室入口 =====
function openAnonChat() {
    anonLoadStorage();
    anonSyncFromMain();

    let modal = document.getElementById('anon-chat-modal');
    if (!modal) {
        anonBuildModal();
        modal = document.getElementById('anon-chat-modal');
    }

    modal.style.display = 'flex';
    anonSelectedContactId = null;
    anonSelectedMaskId = anonGetMasks()[0] ? anonGetMasks()[0].id : 'mystery';
    anonShowSelectPage();
}

function closeAnonChat() {
    let modal = document.getElementById('anon-chat-modal');
    if (modal) modal.style.display = 'none';
}

// ===== 构建弹窗 DOM =====
function anonBuildModal() {
    const div = document.createElement('div');
    div.id = 'anon-chat-modal';
    div.style.cssText = `
        position: fixed; inset: 0; z-index: 9999;
        background: #FAFAFA; display: none;
        flex-direction: column; overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;
    div.innerHTML = `
    <style>
    #anon-chat-modal * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    #anon-chat-modal .ac-header {
        padding: calc(env(safe-area-inset-top) + 14px) 20px 14px;
        background: #fff; border-bottom: 1px solid rgba(0,0,0,0.06);
        display: flex; align-items: center; gap: 12px; flex-shrink: 0;
    }
    #anon-chat-modal .ac-back {
        width: 36px; height: 36px; border-radius: 50%;
        background: #F4F4F6; display: flex; align-items: center; justify-content: center;
        cursor: pointer; flex-shrink: 0; border: none;
    }
    #anon-chat-modal .ac-back:active { transform: scale(0.9); }
    #anon-chat-modal .ac-back svg { width: 18px; height: 18px; stroke: #1C1C1E; fill: none; stroke-width: 2; stroke-linecap: round; }
    #anon-chat-modal .ac-title-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; }
    #anon-chat-modal .ac-title { font-size: 16px; font-weight: 800; color: #1C1C1E; }
    #anon-chat-modal .ac-sub { font-size: 9px; color: rgba(28,28,30,0.4); letter-spacing: 2px; margin-top: 2px; font-family: 'Courier New', monospace; text-transform: uppercase; }
    #anon-chat-modal .ac-signal { display: flex; align-items: center; gap: 5px; font-size: 9px; color: rgba(28,28,30,0.4); font-family: 'Courier New', monospace; }
    #anon-chat-modal .ac-signal-dot { width: 6px; height: 6px; border-radius: 50%; background: #34C759; box-shadow: 0 0 6px #34C759; animation: anonBlink 2s infinite; }
    @keyframes anonBlink { 0%,100%{opacity:1} 50%{opacity:0.3} }
    #anon-chat-modal .ac-page { flex: 1; overflow-y: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
    #anon-chat-modal .ac-page::-webkit-scrollbar { display: none; }
    #anon-chat-modal .ac-tip {
        margin: 16px 20px 0; padding: 12px 16px;
        background: #F4F4F6; border: 1px solid rgba(0,0,0,0.06); border-radius: 14px;
        font-size: 11px; line-height: 1.6; color: rgba(28,28,30,0.4);
        font-family: 'Courier New', monospace;
    }
    #anon-chat-modal .ac-tip strong { display: block; margin-bottom: 4px; font-size: 10px; letter-spacing: 2px; color: #1C1C1E; font-weight: 800; }
    #anon-chat-modal .ac-section-title {
        padding: 22px 20px 10px; font-size: 9px; font-weight: 800;
        letter-spacing: 3px; text-transform: uppercase; color: rgba(28,28,30,0.4);
        font-family: 'Courier New', monospace;
    }
    #anon-chat-modal .ac-mask-row {
        margin: 0 20px 16px; background: #fff;
        border: 1px solid rgba(0,0,0,0.06); border-radius: 16px; overflow: hidden;
        box-shadow: 0 2px 12px rgba(0,0,0,0.03);
    }
    #anon-chat-modal .ac-mask-label {
        padding: 12px 16px 8px; font-size: 9px; letter-spacing: 2px;
        color: rgba(28,28,30,0.4); font-family: 'Courier New', monospace;
        text-transform: uppercase; border-bottom: 1px solid rgba(0,0,0,0.06);
    }
    #anon-chat-modal .ac-mask-opt {
        display: flex; align-items: center; gap: 12px; padding: 14px 16px;
        cursor: pointer; border-top: 1px solid rgba(0,0,0,0.06); transition: 0.15s;
    }
    #anon-chat-modal .ac-mask-opt:first-of-type { border-top: none; }
    #anon-chat-modal .ac-mask-opt:active { background: #F4F4F6; }
    #anon-chat-modal .ac-mask-opt.selected { background: rgba(28,28,30,0.03); }
    #anon-chat-modal .ac-mask-ava {
        width: 40px; height: 40px; border-radius: 50%; overflow: hidden;
        background: #F4F4F6; flex-shrink: 0; border: 1px solid rgba(0,0,0,0.06);
        display: flex; align-items: center; justify-content: center;
    }
    #anon-chat-modal .ac-mask-ava img { width: 100%; height: 100%; object-fit: cover; }
    #anon-chat-modal .ac-mask-info { flex: 1; overflow: hidden; }
    #anon-chat-modal .ac-mask-name { font-size: 14px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    #anon-chat-modal .ac-mask-handle { font-size: 11px; color: rgba(28,28,30,0.4); margin-top: 2px; font-family: 'Courier New', monospace; }
    #anon-chat-modal .ac-mask-check {
        width: 22px; height: 22px; border-radius: 50%;
        border: 1.5px solid rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center;
        transition: 0.2s; background: transparent; flex-shrink: 0;
    }
    #anon-chat-modal .ac-mask-opt.selected .ac-mask-check { background: #1C1C1E; border-color: #1C1C1E; }
    #anon-chat-modal .ac-mask-check svg { width: 12px; height: 12px; stroke: #FFF; fill: none; stroke-width: 2.5; stroke-linecap: round; display: none; }
    #anon-chat-modal .ac-mask-opt.selected .ac-mask-check svg { display: block; }
    #anon-chat-modal .ac-contact-list { padding: 0 20px; display: flex; flex-direction: column; gap: 10px; }
    #anon-chat-modal .ac-contact-card {
        background: #fff; border: 1px solid rgba(0,0,0,0.06); border-radius: 18px;
        padding: 14px 16px; display: flex; align-items: center; gap: 14px;
        cursor: pointer; transition: 0.2s; box-shadow: 0 2px 12px rgba(0,0,0,0.03);
    }
    #anon-chat-modal .ac-contact-card:active { transform: scale(0.98); background: #F4F4F6; }
    #anon-chat-modal .ac-cc-ava {
        width: 46px; height: 46px; border-radius: 50%; overflow: hidden;
        background: #F4F4F6; flex-shrink: 0; border: 1px solid rgba(0,0,0,0.06);
    }
    #anon-chat-modal .ac-cc-ava img { width: 100%; height: 100%; object-fit: cover; }
    #anon-chat-modal .ac-cc-info { flex: 1; overflow: hidden; }
    #anon-chat-modal .ac-cc-name { font-size: 15px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    #anon-chat-modal .ac-cc-sub { font-size: 11px; color: rgba(28,28,30,0.4); margin-top: 3px; }
    #anon-chat-modal .ac-cc-arrow {
        width: 28px; height: 28px; border-radius: 50%; background: #F4F4F6;
        display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    #anon-chat-modal .ac-cc-arrow svg { width: 14px; height: 14px; stroke: rgba(28,28,30,0.4); fill: none; stroke-width: 2; stroke-linecap: round; }
    #anon-chat-modal .ac-chat-page { display: none; flex-direction: column; height: 100%; }
    #anon-chat-modal .ac-chat-page.active { display: flex; }
    #anon-chat-modal .ac-chat-topbar {
        padding: calc(env(safe-area-inset-top) + 12px) 16px 12px;
        background: #fff; border-bottom: 1px solid rgba(0,0,0,0.06);
        display: flex; align-items: center; gap: 12px; flex-shrink: 0;
    }
    #anon-chat-modal .ac-chat-identity { display: flex; align-items: center; gap: 10px; flex: 1; overflow: hidden; }
    #anon-chat-modal .ac-cti-mask { display: flex; flex-direction: column; overflow: hidden; }
    #anon-chat-modal .ac-cti-label { font-size: 8px; color: rgba(28,28,30,0.4); font-family: 'Courier New', monospace; letter-spacing: 2px; text-transform: uppercase; }
    #anon-chat-modal .ac-cti-val { font-size: 13px; font-weight: 800; color: #1C1C1E; }
    #anon-chat-modal .ac-cti-div { width: 1px; height: 24px; background: rgba(0,0,0,0.06); flex-shrink: 0; }
    #anon-chat-modal .ac-chat-area {
        flex: 1; overflow-y: auto; padding: 16px 16px 8px;
        display: flex; flex-direction: column; gap: 10px;
        -webkit-overflow-scrolling: touch; scrollbar-width: none; background: #FAFAFA;
    }
    #anon-chat-modal .ac-chat-area::-webkit-scrollbar { display: none; }
    #anon-chat-modal .ac-msg-row { display: flex; align-items: flex-end; gap: 8px; animation: anonMsgIn 0.3s cubic-bezier(0.16,1,0.3,1); }
    @keyframes anonMsgIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    #anon-chat-modal .ac-msg-row.user { flex-direction: row-reverse; }
    #anon-chat-modal .ac-msg-row.system-row { justify-content: center; }
    #anon-chat-modal .ac-ava-sm {
        width: 30px; height: 30px; border-radius: 50%; overflow: hidden;
        background: #F4F4F6; border: 1px solid rgba(0,0,0,0.06); flex-shrink: 0;
    }
    #anon-chat-modal .ac-ava-sm img { width: 100%; height: 100%; object-fit: cover; }
    #anon-chat-modal .ac-bubble {
        max-width: 72%; padding: 10px 14px; font-size: 14px;
        line-height: 1.55; word-break: break-word; white-space: pre-wrap; font-weight: 500;
    }
    #anon-chat-modal .ac-msg-row.user .ac-bubble {
        background: #1C1C1E; color: #fff;
        border-radius: 20px 20px 4px 20px;
    }
    #anon-chat-modal .ac-msg-row.bot .ac-bubble {
        background: #F0F0F2; color: #1C1C1E;
        border-radius: 20px 20px 20px 4px;
    }
    #anon-chat-modal .ac-msg-row.system-row .ac-bubble {
        background: transparent; color: rgba(28,28,30,0.4);
        font-size: 10px; font-family: 'Courier New', monospace;
        letter-spacing: 1px; text-align: center; padding: 4px 0; max-width: 90%; font-weight: 600;
    }
    #anon-chat-modal .ac-read-notify {
        display: flex; justify-content: center; margin: 2px 0;
        animation: anonMsgIn 0.4s ease;
    }
    #anon-chat-modal .ac-read-pill {
        display: inline-flex; align-items: center; gap: 5px;
        background: rgba(52,199,89,0.08); border: 1px solid rgba(52,199,89,0.2);
        border-radius: 100px; padding: 4px 12px;
        font-size: 10px; font-family: 'Courier New', monospace; color: #34C759; font-weight: 700; letter-spacing: 1px;
    }
    #anon-chat-modal .ac-read-pill::before { content: '✓'; }
    #anon-chat-modal .ac-typing span { display: inline-flex; gap: 4px; align-items: center; }
    #anon-chat-modal .ac-typing span i {
        width: 5px; height: 5px; border-radius: 50%; background: rgba(28,28,30,0.3);
        animation: anonTyping 1.2s infinite; font-style: normal; display: inline-block;
    }
    #anon-chat-modal .ac-typing span i:nth-child(2) { animation-delay: 0.2s; }
    #anon-chat-modal .ac-typing span i:nth-child(3) { animation-delay: 0.4s; }
    @keyframes anonTyping { 0%,80%,100%{transform:scale(1);opacity:0.4} 40%{transform:scale(1.3);opacity:1} }
    #anon-chat-modal .ac-input-area {
        background: #fff; border-top: 1px solid rgba(0,0,0,0.06);
        padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
        display: flex; align-items: flex-end; gap: 10px; flex-shrink: 0;
    }
    #anon-chat-modal .ac-input {
        flex: 1; background: #F4F4F6; border: 1px solid rgba(0,0,0,0.06);
        border-radius: 22px; padding: 10px 14px; color: #1C1C1E; font-size: 15px;
        font-family: inherit; resize: none; max-height: 100px; min-height: 40px;
        outline: none; line-height: 1.4; font-weight: 500; transition: border 0.2s;
    }
    #anon-chat-modal .ac-input:focus { border-color: rgba(28,28,30,0.2); }
    #anon-chat-modal .ac-input::placeholder { color: rgba(28,28,30,0.3); }
    #anon-chat-modal .ac-send-btn {
        width: 40px; height: 40px; border-radius: 50%; background: #1C1C1E;
        border: none; display: flex; align-items: center; justify-content: center;
        cursor: pointer; flex-shrink: 0; transition: 0.2s;
    }
    #anon-chat-modal .ac-send-btn:active { transform: scale(0.9); opacity: 0.8; }
    #anon-chat-modal .ac-send-btn svg { width: 16px; height: 16px; stroke: #fff; fill: none; stroke-width: 2.5; stroke-linecap: round; }
    #anon-chat-modal .ac-ai-btn {
        width: 40px; height: 40px; border-radius: 50%; background: #F4F4F6;
        border: 1px solid rgba(0,0,0,0.06); display: flex; align-items: center; justify-content: center;
        cursor: pointer; flex-shrink: 0; transition: 0.2s;
    }
    #anon-chat-modal .ac-ai-btn:active { transform: scale(0.9); }
    #anon-chat-modal .ac-ai-btn svg { width: 16px; height: 16px; stroke: rgba(28,28,30,0.4); fill: none; stroke-width: 2; stroke-linecap: round; }
    #anon-chat-modal .ac-divider { height: 1px; background: rgba(0,0,0,0.05); margin: 0 20px; }
    </style>

    <!-- 选择页顶栏 -->
    <div class="ac-header" id="anon-select-header">
        <button class="ac-back" onclick="closeAnonChat()">
            <svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div class="ac-title-wrap">
            <div class="ac-title">Anonymous</div>
            <div class="ac-sub">ENCRYPTED · ZERO TRACE</div>
        </div>
        <div class="ac-signal">
            <div class="ac-signal-dot"></div>
            <span>LIVE</span>
        </div>
    </div>

    <!-- 选择页内容 -->
    <div class="ac-page" id="anon-select-page">
        <div class="ac-tip">
            <strong>✦ ANONYMOUS MODE</strong>
            对方不知道你是谁。选择你的伪装身份，然后选择要私信的对象。
        </div>
        <div class="ac-section-title">选择伪装身份</div>
        <div class="ac-mask-row">
            <div class="ac-mask-label">MASK SELECTION</div>
            <div id="anon-mask-options"></div>
        </div>
        <div class="ac-divider"></div>
        <div class="ac-section-title">选择私信对象</div>
        <div class="ac-contact-list" id="anon-contact-list"></div>
        <div style="height: calc(env(safe-area-inset-bottom) + 20px);"></div>
    </div>

    <!-- 聊天页 -->
    <div class="ac-chat-page" id="anon-chat-page">
        <div class="ac-chat-topbar">
            <button class="ac-back" onclick="anonBackToSelect()">
                <svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <div class="ac-chat-identity">
                <div class="ac-cti-mask">
                    <div class="ac-cti-label">SENDING AS</div>
                    <div class="ac-cti-val" id="anon-cti-mask">—</div>
                </div>
                <div class="ac-cti-div"></div>
                <div class="ac-cti-mask">
                    <div class="ac-cti-label">TO</div>
                    <div class="ac-cti-val" id="anon-cti-target">—</div>
                </div>
            </div>
            <div onclick="anonEnterMultiSelect()" style="width:32px;height:32px;border-radius:50%;background:#F4F4F6;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;" title="多选消息">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" stroke-width="2" stroke-linecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        </div>
        </div>
        <div class="ac-chat-area" id="anon-chat-area"></div>
        <div id="anon-multi-bar" style="display:none;padding:10px 16px;background:rgba(250,250,252,0.95);backdrop-filter:blur(20px);border-top:1px solid rgba(0,0,0,0.06);align-items:center;justify-content:space-between;gap:10px;flex-shrink:0;">
            <div style="font-size:13px;font-weight:700;color:#1C1C1E;" id="anon-multi-count">已选 0 条</div>
            <div style="display:flex;gap:8px;">
                <div onclick="anonSelectAll()" style="font-size:12px;font-weight:700;color:#1C1C1E;padding:6px 14px;background:rgba(0,0,0,0.05);border-radius:100px;cursor:pointer;">全选</div>
                <div onclick="anonDeleteSelected()" style="font-size:12px;font-weight:700;color:#FF3B30;padding:6px 14px;background:rgba(255,59,48,0.08);border-radius:100px;cursor:pointer;">删除</div>
                <div onclick="anonExitMultiSelect()" style="font-size:12px;font-weight:700;color:rgba(28,28,30,0.5);padding:6px 14px;background:rgba(0,0,0,0.03);border-radius:100px;cursor:pointer;">取消</div>
            </div>
        </div>
        <div class="ac-input-area">
            <textarea class="ac-input" id="anon-input" placeholder="匿名说点什么..." rows="1"
                oninput="anonGrowInput(this)"
                onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();anonSendMsg();}"></textarea>
            <div class="ac-ai-btn" onclick="anonFetchAI()" title="AI 回复">
                <svg viewBox="0 0 24 24"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>
            </div>
            <div class="ac-send-btn" onclick="anonSendMsg()">
                <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </div>
        </div>
    </div>
    `;
    document.getElementById('main-frame').appendChild(div);
}

// ===== 显示选择页 =====
function anonShowSelectPage() {
    document.getElementById('anon-select-header').style.display = 'flex';
    document.getElementById('anon-select-page').style.display = 'block';
    document.getElementById('anon-chat-page').classList.remove('active');
    anonRenderMasks();
    anonRenderContacts();
}

// ===== 渲染面具 =====
function anonRenderMasks() {
    const el = document.getElementById('anon-mask-options');
    if (!el) return;
    el.innerHTML = '';
    const maskList = anonGetMasks();
    maskList.forEach(m => {
        const div = document.createElement('div');
        div.className = 'ac-mask-opt' + (anonSelectedMaskId === m.id ? ' selected' : '');
        div.onclick = () => { anonSelectedMaskId = m.id; anonRenderMasks(); };

        let avInner = '';
        if (m.avatar && (m.avatar.startsWith('data:') || m.avatar.startsWith('http'))) {
            avInner = `<img src="${m.avatar}" onerror="this.src='${ANON_DEFAULT_AVATAR}'">`;
        } else {
            avInner = `<img src="${ANON_DEFAULT_AVATAR}" style="filter:grayscale(1);opacity:0.4;">`;
        }

        div.innerHTML = `
            <div class="ac-mask-ava">${avInner}</div>
            <div class="ac-mask-info">
                <div class="ac-mask-name">${m.name}</div>
                <div class="ac-mask-handle">${m.handle}</div>
            </div>
            <div class="ac-mask-check">
                <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
        `;
        el.appendChild(div);
    });
}

// ===== 渲染联系人 =====
function anonRenderContacts() {
    const el = document.getElementById('anon-contact-list');
    if (!el) return;
    if (!anonContacts || anonContacts.length === 0) {
        el.innerHTML = `<div style="text-align:center;padding:40px 20px;color:rgba(28,28,30,0.4);font-size:13px;font-family:'Courier New',monospace;letter-spacing:1px;">NO CONTACTS FOUND</div>`;
        return;
    }
    el.innerHTML = '';
    anonContacts.forEach(c => {
        const div = document.createElement('div');
        div.className = 'ac-contact-card';
        div.onclick = () => anonOpenChat(c.id);
        let av = (c.avatar && (c.avatar.startsWith('data:') || c.avatar.startsWith('http'))) ? c.avatar : ANON_DEFAULT_AVATAR;
        div.innerHTML = `
            <div class="ac-cc-ava"><img src="${av}" onerror="this.src='${ANON_DEFAULT_AVATAR}'"></div>
            <div class="ac-cc-info">
                <div class="ac-cc-name">${c.name}</div>
                <div class="ac-cc-sub">点击开始匿名私信</div>
            </div>
            <div class="ac-cc-arrow"><svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg></div>
        `;
        el.appendChild(div);
    });
}

// ===== 打开聊天 =====
function anonOpenChat(contactId) {
    anonSelectedContactId = contactId;
    const contact = anonContacts.find(c => c.id === contactId);
    const maskList = anonGetMasks();
    const mask = maskList.find(m => m.id === anonSelectedMaskId) || maskList[0];
    if (!contact || !mask) return;

    if (!window.anonAllHistories) window.anonAllHistories = {};
    let histKey = anonSelectedMaskId + '_' + contactId;
    anonChatHistory = (window.anonAllHistories[histKey] || []).filter(m => m && m.role);
    // 给没有 _anonId 的旧数据补上 id
    anonChatHistory.forEach(m => {
        if (!m._anonId) m._anonId = 'ah_' + Date.now() + Math.random().toString(36).substr(2, 6);
    });

    document.getElementById('anon-cti-mask').textContent = mask.name;
    document.getElementById('anon-cti-target').textContent = contact.name;

    document.getElementById('anon-select-header').style.display = 'none';
    document.getElementById('anon-select-page').style.display = 'none';
    document.getElementById('anon-chat-page').classList.add('active');

    const area = document.getElementById('anon-chat-area');
    area.innerHTML = `<div class="ac-msg-row system-row"><div class="ac-bubble">ANONYMOUS · ${mask.name} → ${contact.name}</div></div>`;

    anonChatHistory.forEach(m => {
        if (!m) return;
        anonAppendBubble(m.role, m.content, m, false);
    });

    setTimeout(() => area.scrollTop = area.scrollHeight, 50);
}

function anonBackToSelect() {
    anonSelectedContactId = null;
    document.getElementById('anon-chat-page').classList.remove('active');
    document.getElementById('anon-select-header').style.display = 'flex';
    document.getElementById('anon-select-page').style.display = 'block';
}

// ===== 渲染气泡 =====
function anonAppendBubble(role, text, histItem, scroll = true) {
    const area = document.getElementById('anon-chat-area');
    if (!area) return;
    const contact = anonContacts.find(c => c.id === anonSelectedContactId);
    const row = document.createElement('div');
    row.className = 'ac-msg-row ' + (role === 'user' ? 'user' : role === 'system' ? 'system-row' : 'bot');
    let msgId = 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    row.dataset.anonMsgId = msgId;
    if (histItem && histItem._anonId) {
        row.dataset.anonHistId = histItem._anonId;
    }

    if (role === 'system') {
        row.innerHTML = `<div class="ac-bubble">${text}</div>`;
    } else if (role === 'bot') {
        let av = (contact && contact.avatar && (contact.avatar.startsWith('data:') || contact.avatar.startsWith('http'))) ? contact.avatar : ANON_DEFAULT_AVATAR;
        row.innerHTML = `<div class="ac-ava-sm"><img src="${av}" onerror="this.src='${ANON_DEFAULT_AVATAR}'"></div><div class="ac-bubble">${text}</div>`;
    } else {
        row.innerHTML = `<div class="ac-bubble">${text}</div>`;
    }

    area.appendChild(row);
    if (scroll) area.scrollTop = area.scrollHeight;
    return row;
}

function anonAppendReadNotify(scroll = true) {
    const area = document.getElementById('anon-chat-area');
    if (!area) return;
    const row = document.createElement('div');
    row.className = 'ac-read-notify';
    row.innerHTML = `<div class="ac-read-pill">你的匿名消息已被联系人读取</div>`;
    area.appendChild(row);
    if (scroll) area.scrollTop = area.scrollHeight;
}

function anonAppendTyping() {
    const area = document.getElementById('anon-chat-area');
    if (!area) return;
    const contact = anonContacts.find(c => c.id === anonSelectedContactId);
    const row = document.createElement('div');
    row.className = 'ac-msg-row bot';
    row.id = 'anon-typing-row';
    let av = (contact && contact.avatar && (contact.avatar.startsWith('data:') || contact.avatar.startsWith('http'))) ? contact.avatar : ANON_DEFAULT_AVATAR;
    row.innerHTML = `<div class="ac-ava-sm"><img src="${av}" onerror="this.src='${ANON_DEFAULT_AVATAR}'"></div><div class="ac-bubble ac-typing"><span><i></i><i></i><i></i></span></div>`;
    area.appendChild(row);
    area.scrollTop = area.scrollHeight;
}

function anonRemoveTyping() {
    let t = document.getElementById('anon-typing-row');
    if (t) t.remove();
}

// ===== 发送消息 =====
function anonSendMsg() {
    const input = document.getElementById('anon-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text || !anonSelectedContactId) return;
    input.value = '';
    input.style.height = '';

    let histItem = { role: 'user', content: text, _anonId: 'ah_' + Date.now() + Math.random().toString(36).substr(2,6) };
    anonChatHistory.push(histItem);
    anonSaveHistory();
    anonAppendBubble('user', text, histItem);
    anonWriteToMainSystem(text);
}

// ===== 写入主系统（让联系人知道收到了匿名消息）=====
// 暂存待发送的匿名消息队列，key 为 contactId
if (!window.anonPendingMsgs) window.anonPendingMsgs = {};

function anonWriteToMainSystem(text) {
    try {
        if (!anonSelectedContactId) return;
        // 只暂存，不立刻写入聊天室
        if (!window.anonPendingMsgs[anonSelectedContactId]) {
            window.anonPendingMsgs[anonSelectedContactId] = [];
        }
        const maskList = anonGetMasks();
        const mask = maskList.find(m => m.id === anonSelectedMaskId) || maskList[0];
        window.anonPendingMsgs[anonSelectedContactId].push({
            text: text,
            maskName: mask ? mask.name : '神秘访客',
            maskHandle: mask ? mask.handle : '@mystery_∞',
            time: new Date().toLocaleString()
        });
    } catch(e) {
        console.warn('anonWriteToMainSystem 失败:', e);
    }
}

function anonFlushPendingToChat(contactId) {
    try {
        if (typeof contacts === 'undefined' || typeof gConfig === 'undefined') return;
        if (!window.anonPendingMsgs || !window.anonPendingMsgs[contactId]) return;
        let pending = window.anonPendingMsgs[contactId];
        if (!pending || pending.length === 0) return;

        let c = contacts.find(x => x.id === contactId);
        if (!c) return;
        if (!c.twHistory) c.twHistory = [];
        if (!c.history) c.history = [];

        let wid = gConfig.currentWorldviewId || 'default';
        let twId = 'tw_anon_' + Date.now() + Math.random();

        // 把所有匿名消息合并成一条通知
        let allTexts = pending.map(item => `"${item.text}"`).join('、');
        let maskName = pending[0].maskName;
        let maskHandle = pending[0].maskHandle;
        let timeStr = pending[pending.length - 1].time;
        let count = pending.length;

        let aiDetail = pending.map(item =>
            `[匿名私信 - ${item.time}]：一个自称"${item.maskName}"(${item.maskHandle})的匿名账号私信了你，内容是："${item.text}"。你不知道这个人是谁，但你确实收到了这条消息并已读。`
        ).join('\n');

        // 同时告诉发送方（我）发送了什么
        let myDetail = pending.map(item =>
            `你以匿名身份"${item.maskName}"(${item.maskHandle})给对方发送了："${item.text}"`
        ).join('\n');

        let sysContent = `<i>✧ 对方已接收 ${count} 条匿名私信</i>\n<span style="display:none;">${aiDetail}\n\n【你发送的匿名内容回顾】：\n${myDetail}\n\n请在接下来的对话中自然地提及或回应这些内容，但不要主动暴露你知道发件人是谁。]</span>`;

        c.twHistory.push({
            role: 'system_sum',
            content: sysContent,
            isRevoked: false,
            timestamp: Date.now(),
            _twId: twId,
            wid: wid
        });

        c.history.push({
            role: 'system_sum',
            content: sysContent,
            wid: wid
        });

        if (typeof saveData === 'function') saveData();

        // 清空队列
        window.anonPendingMsgs[contactId] = [];
    } catch(e) {
        console.warn('anonFlushPendingToChat 失败:', e);
    }
}

// ===== AI 回复 =====
async function anonFetchAI() {
    if (!anonSelectedContactId) return;
    const contact = anonContacts.find(c => c.id === anonSelectedContactId);
    const maskList = anonGetMasks();
    const mask = maskList.find(m => m.id === anonSelectedMaskId) || maskList[0];
    if (!contact) return;

    let apiUrl = anonCfg.apiUrl || '';
    let apiKey = anonCfg.apiKey || '';
    let model = anonCfg.model || 'gpt-4o-mini';

    if (!apiUrl || !apiKey) {
        anonSyncFromMain();
        apiUrl = anonCfg.apiUrl || '';
        apiKey = anonCfg.apiKey || '';
        model = anonCfg.model || 'gpt-4o-mini';
    }
    if (!apiUrl || !apiKey) return;

    anonAppendTyping();

    const sysPrompt = `你是一个拥有独立灵魂的真实人物（名字：${contact.name}）。
【你的人设背景】：
${contact.prompt || '请根据名字自由发挥性格。'}

【🚨 最高级警告 - 身份隔离】：
当前和你私信的人使用了完全匿名的身份（伪装名：${mask ? mask.name : '神秘访客'}）。
你完全不知道这个匿名账号背后是谁。请像对待一个完全陌生的网友一样回应TA。
绝对不要表现出你认识对方！不要叫出任何真实名字！

【回复格式铁律】：
1. 极简口语化，符合私信聊天风格，贴合你的人设，有情绪和性格
2. 【分句机制】：如果你有多层情绪或想法，请用换行符把每一句话分开，系统会自动把每一行变成独立的气泡发送，制造真实的打字节奏感
3. 【🚨 绝对禁止引用】：禁止使用任何形式的引用格式，包括但不限于：> 引用、"对方说：xxx"、【引用：xxx】、重复对方说过的话。直接回复即可，不要重复对方的内容
4. 不要加任何动作描写、旁白、星号包裹的描述
5. 纯文本输出，不要任何 HTML 或 markdown 标记`;

    let messages = [{ role: 'system', content: sysPrompt }];
    anonChatHistory.slice(-15).forEach(m => {
        if (m.role === 'user' || m.role === 'assistant') {
            messages.push({ role: m.role, content: m.content });
        }
    });

    try {
        let url = apiUrl.replace(/\/+$/, '');
        if (!url.endsWith('/v1')) url = url + '/v1';

        const res = await fetch(`${url}/chat/completions`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, messages, temperature: 0.85 })
        });

        anonRemoveTyping();

        if (!res.ok) throw new Error('API Error ' + res.status);
        const data = await res.json();
        let reply = data.choices[0].message.content.trim();
        reply = reply.replace(/<[^>]+>/g, '').replace(/\*[^*]+\*/g, '').trim();
        if (!reply) reply = '……';

        let sentences = reply.split('\n').map(s => s.trim()).filter(s => s);
        if (sentences.length === 1 && sentences[0].length > 40) {
            sentences = sentences[0].match(/[^。？！…\n.?!]+[。？！…\n.?!]*/g) || [sentences[0]];
            sentences = sentences.map(s => s.trim()).filter(s => s);
        }

        let delay = 0;
        sentences.forEach(s => {
            setTimeout(() => {
                let histItem = { role: 'assistant', content: s, _anonId: 'ah_' + Date.now() + Math.random().toString(36).substr(2,6) };
                anonChatHistory.push(histItem);
                anonSaveHistory();
                anonAppendBubble('bot', s, histItem);
            }, delay);
            delay += 700 + s.length * 35;
        });

    } catch(e) {
        anonRemoveTyping();
        anonAppendBubble('bot', '[连接失败，请检查 API 配置]');
        console.error(e);
    }
}

// ===== 多选删除 =====
let anonMultiMode = false;
let anonSelectedIds = new Set();

function anonEnterMultiSelect() {
    anonMultiMode = true;
    anonSelectedIds.clear();
    let bar = document.getElementById('anon-multi-bar');
    if (bar) bar.style.display = 'flex';
    let countEl = document.getElementById('anon-multi-count');
    if (countEl) countEl.textContent = '已选 0 条';
    document.querySelectorAll('#anon-chat-area .ac-msg-row').forEach(row => {
        if (row.classList.contains('system-row')) return;
        let id = row.dataset.anonMsgId;
        if (!id) return;
        row.style.paddingLeft = '36px';
        row.style.position = 'relative';
        let cb = document.createElement('div');
        cb.className = 'anon-cb';
        cb.style.cssText = 'position:absolute;left:4px;top:50%;transform:translateY(-50%);width:22px;height:22px;border-radius:50%;border:1.5px solid rgba(0,0,0,0.15);background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:10;transition:0.2s;';
        cb.onclick = (e) => { e.stopPropagation(); anonToggleSelect(row, cb); };
        row.prepend(cb);
    });
}

function anonExitMultiSelect() {
    anonMultiMode = false;
    anonSelectedIds.clear();
    let bar = document.getElementById('anon-multi-bar');
    if (bar) bar.style.display = 'none';
    document.querySelectorAll('#anon-chat-area .ac-msg-row').forEach(row => {
        row.style.paddingLeft = '';
        let cb = row.querySelector('.anon-cb');
        if (cb) cb.remove();
    });
}

function anonToggleSelect(row, cb) {
    let id = row.dataset.anonMsgId;
    if (!id) return;
    if (anonSelectedIds.has(id)) {
        anonSelectedIds.delete(id);
        cb.style.background = '#fff';
        cb.style.borderColor = 'rgba(0,0,0,0.15)';
        cb.innerHTML = '';
    } else {
        anonSelectedIds.add(id);
        cb.style.background = '#1C1C1E';
        cb.style.borderColor = '#1C1C1E';
        cb.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>';
    }
    let countEl = document.getElementById('anon-multi-count');
    if (countEl) countEl.textContent = '已选 ' + anonSelectedIds.size + ' 条';
}

function anonSelectAll() {
    document.querySelectorAll('#anon-chat-area .ac-msg-row').forEach(row => {
        if (row.classList.contains('system-row')) return;
        let cb = row.querySelector('.anon-cb');
        if (!cb) return;
        let id = row.dataset.anonMsgId;
        if (!id) return;
        if (!anonSelectedIds.has(id)) {
            anonSelectedIds.add(id);
            cb.style.background = '#1C1C1E';
            cb.style.borderColor = '#1C1C1E';
            cb.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>';
        }
    });
    let countEl = document.getElementById('anon-multi-count');
    if (countEl) countEl.textContent = '已选 ' + anonSelectedIds.size + ' 条';
}

function anonDeleteSelected() {
    if (anonSelectedIds.size === 0) return;
    if (!confirm('确定删除选中的 ' + anonSelectedIds.size + ' 条消息吗？')) return;

    // 收集要删除的 historyId
    let toDeleteHistIds = new Set();
    anonSelectedIds.forEach(msgId => {
        let row = document.querySelector(`#anon-chat-area [data-anon-msg-id="${msgId}"]`);
        if (row) {
            let histId = row.dataset.anonHistId;
            if (histId) toDeleteHistIds.add(histId);
            row.remove();
        }
    });

    // 从 anonChatHistory 里删除对应条目
    anonChatHistory = anonChatHistory.filter(m => m && m._anonId && !toDeleteHistIds.has(m._anonId));

    // 立刻同步写回 storage，防止下次进入时从旧数据恢复
    if (!window.anonAllHistories) window.anonAllHistories = {};
    let histKey = anonSelectedMaskId + '_' + anonSelectedContactId;
    window.anonAllHistories[histKey] = anonChatHistory.slice();
    anonSaveStorage();

    anonExitMultiSelect();
}

// ===== 工具函数 =====
function anonSaveHistory() {
    if (!window.anonAllHistories) window.anonAllHistories = {};
    let histKey = anonSelectedMaskId + '_' + anonSelectedContactId;
    // 过滤掉空值再存
    window.anonAllHistories[histKey] = anonChatHistory.filter(m => m && m.role && m.content !== undefined);
    anonSaveStorage();
}

function anonGrowInput(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 100) + 'px';
}
