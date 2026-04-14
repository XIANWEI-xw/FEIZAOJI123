// =========================================================================
// SOAP OS - 查手机 (Check Phone) 专属核心逻辑 (AI 生成版 V2)
// =========================================================================

let cpCurrentSoulIndex = 0;
let cpWrappers = [];
let cpScrollListenerAdded = false;
let cpIsGenerating = false;
let cpCurrentSoulId = null; // 当前正在查看的联系人ID

// ── 工具函数 ──
function cpGetMeConfig() {
    let meName = '我';
    let meAvatar = '';
    if (typeof gConfig !== 'undefined') {
        meName = gConfig.meName || '我';
        meAvatar = gConfig.meAvatar || '';
    }
    return { meName, meAvatar };
}

function cpGetMyAvatarForContact(contact) {
    const { meAvatar } = cpGetMeConfig();
    let avatar = meAvatar || '';
    if (contact.maskId && typeof masks !== 'undefined') {
        const m = masks.find(x => x.id === contact.maskId);
        if (m && m.avatar) avatar = m.avatar;
    }
    if (contact.chatMeAvatar) avatar = contact.chatMeAvatar;
    return avatar;
}

function cpGetBotAvatar(contact) {
    return contact.chatAvatar || contact.avatar || '';
}

function cpRenderAvatarHtml(avatarUrl, fallbackChar) {
    if (avatarUrl && (avatarUrl.startsWith('data:') || avatarUrl.startsWith('http') || avatarUrl.startsWith('blob:'))) {
        return `<img src="${avatarUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;">`;
    }
    return fallbackChar || '?';
}

// 全局退出按钮监听
document.addEventListener('click', (e) => {
    if (e.target.closest('.cp-exit-btn') || e.target.closest('.cp-exit-btn-home')) {
        const app = document.getElementById('app-checkphone');
        if (app) app.classList.remove('active');
        cpGoBackToSelection();
    }
});

// ══════════════════════════════════════════
// 1. 初始化档案选择界面
// ══════════════════════════════════════════
function cpInitSelection() {
    const container = document.getElementById('cp-scroll-container');
    if (!container) return;

    if (typeof contacts === 'undefined' || !contacts || contacts.length === 0) {
        container.innerHTML = '<div style="color:#888; text-align:center; margin-top:50px;">暂无档案数据</div>';
        return;
    }

    cpCurrentSoulIndex = 0;
    container.innerHTML = '';

    contacts.forEach((c, index) => {
        const initial = c.name.charAt(0);
        const botAvatar = cpGetBotAvatar(c);
        const avatarHtml = cpRenderAvatarHtml(botAvatar, initial);
        const avatarStyle = botAvatar ? `background: transparent; border: none;` : `background: linear-gradient(135deg, #FDFDFD 0%, #F4F3F0 100%);`;

        const html = `
            <div class="cp-dossier-wrapper ${index === 0 ? 'active' : ''}" onclick="cpClickToScroll(${index})">
                <div class="cp-dossier-card">
                    <div class="cp-dossier-top-meta cp-mono">
                        <span>ARCHIVE.${String(index + 1).padStart(3, '0')}</span>
                        <div class="cp-dossier-status ${c.cpCache ? 'online' : 'online'}"><span class="cp-status-dot" style="${c.cpCache ? 'background:#C3A772; box-shadow:0 0 6px rgba(195,167,114,0.4);' : ''}"></span> ${c.cpCache ? 'CACHED' : 'AVAILABLE'}</div>
                    </div>
                    <div class="cp-dossier-avatar cp-serif" style="${avatarStyle}">${avatarHtml}</div>
                    <div class="cp-dossier-name cp-serif">${c.chatRemark || c.name}</div>
                    <div class="cp-dossier-desc">"${c.prompt ? c.prompt.substring(0, 20) + '...' : 'Aesthetic exploration of self.'}"</div>
                </div>
            </div>
        `;
        container.innerHTML += html;
    });

    cpWrappers = document.querySelectorAll('#app-checkphone .cp-dossier-wrapper');

    if (!cpScrollListenerAdded) {
        container.addEventListener('scroll', () => {
            if (container.clientHeight === 0) return;
            const containerCenter = container.scrollTop + container.clientHeight / 2;
            let minDistance = Infinity;
            let activeIndex = 0;
            cpWrappers.forEach((wrapper, index) => {
                const wrapperCenter = wrapper.offsetTop + wrapper.clientHeight / 2;
                const distance = Math.abs(containerCenter - wrapperCenter);
                if (distance < minDistance) { minDistance = distance; activeIndex = index; }
            });
            if (cpCurrentSoulIndex !== activeIndex) cpUpdateSelection(activeIndex);
        });
        cpScrollListenerAdded = true;
    }

    cpUpdateButtonText();

    setTimeout(() => {
        if (cpWrappers.length > 0) cpClickToScroll(0, true);
    }, 450);
}

function cpUpdateSelection(index) {
    cpCurrentSoulIndex = index;
    cpWrappers.forEach((el, i) => {
        if (i === index) el.classList.add('active');
        else el.classList.remove('active');
    });
    cpUpdateButtonText();
}

function cpUpdateButtonText() {
    const btn = document.querySelector('#app-checkphone .cp-btn-black-capsule');
    if (!btn) return;
    if (cpCurrentSoulIndex >= 0 && cpCurrentSoulIndex < contacts.length) {
        const soul = contacts[cpCurrentSoulIndex];
        if (soul.cpCache) {
            // 有缓存：按钮变成重新调取样式
            btn.innerHTML = 'REGENERATE DATA';
            btn.style.background = 'transparent';
            btn.style.color = 'var(--c-black)';
            btn.style.border = '1.5px solid var(--c-black)';
        } else {
            // 无缓存：按钮是首次调取样式
            btn.innerHTML = 'AUTHORIZE LINK';
            btn.style.background = 'var(--c-black)';
            btn.style.color = 'var(--c-white)';
            btn.style.border = 'none';
        }
    }
}

function cpClickToScroll(index, isAutoScroll) {
    if (!cpWrappers[index]) return;

    // 只有用户手动点击（非自动滚动）、且点的是当前已选中的卡片、且有缓存时，才进入查看
    if (!isAutoScroll && index === cpCurrentSoulIndex && contacts[index] && contacts[index].cpCache) {
        cpCurrentSoulId = contacts[index].id;
        cpStartConnectionSequence(contacts[index], false);
        return;
    }

    const wrapper = cpWrappers[index];
    const scrollContainer = document.getElementById('cp-scroll-container');
    if (scrollContainer.clientHeight === 0) return;
    const scrollTop = wrapper.offsetTop - scrollContainer.clientHeight / 2 + wrapper.clientHeight / 2;
    scrollContainer.scrollTo({ top: scrollTop, behavior: 'smooth' });
}
// ══════════════════════════════════════════
// 2. 授权连接（核心入口）
// ══════════════════════════════════════════
function cpConnectSoul() {
    if (cpIsGenerating) return;
    if (cpCurrentSoulIndex < 0 || cpCurrentSoulIndex >= contacts.length) return;
    const soul = contacts[cpCurrentSoulIndex];
    cpCurrentSoulId = soul.id;

    // 按钮始终执行"调取/重新调取"操作
    // 无论有没有缓存，都清除旧数据并重新走AI生成流程
    soul.cpCache = null;
    saveData();
    cpStartConnectionSequence(soul, true);
}

function cpStartConnectionSequence(soul, needGenerate) {
    // 更新桌面UI
    document.getElementById('cp-dynamic-wallpaper').style.background = `linear-gradient(135deg, #FDFDFD 0%, #F4F3F0 100%)`;
    document.getElementById('cp-widget-name-text').textContent = soul.chatRemark || soul.name;

    const widgetAvatarEl = document.getElementById('cp-widget-avatar-text');
    const botAvatar = cpGetBotAvatar(soul);
    if (botAvatar) {
        widgetAvatarEl.innerHTML = cpRenderAvatarHtml(botAvatar, soul.name.charAt(0));
        widgetAvatarEl.style.background = 'transparent';
        widgetAvatarEl.style.border = 'none';
    } else {
        widgetAvatarEl.innerHTML = soul.name.charAt(0);
        widgetAvatarEl.style.background = 'var(--c-bg)';
        widgetAvatarEl.style.border = '2px solid var(--c-white)';
    }

    cpBuildChatList(soul);

    const selectionScreen = document.getElementById('cp-selection-screen');
    const loadingScreen = document.getElementById('cp-loading-screen');
    const homeScreen = document.getElementById('cp-home-screen');
    const globalStatusBar = document.getElementById('cp-global-status-bar');
    const dynamicIsland = document.getElementById('cp-dynamic-island');

    selectionScreen.style.transform = 'scale(1.1)';
    selectionScreen.style.opacity = '0';

    setTimeout(() => {
        selectionScreen.classList.remove('active');

        if (needGenerate) {
            loadingScreen.classList.add('active');
            cpRunAIGeneration(soul, () => {
                loadingScreen.classList.remove('active');
                homeScreen.classList.add('active');
                globalStatusBar.classList.add('show');
                dynamicIsland.classList.add('show');
                // 生成完成后重新构建通信列表（此时cpCache已有数据）
                cpApplyWallpaper(soul);
                cpBuildChatList(soul);
                if (soul.cpCache) cpApplyCacheToUI(soul);
                cpSyncToChat('enter', '');
            });
        } else {
            homeScreen.classList.add('active');
            globalStatusBar.classList.add('show');
            dynamicIsland.classList.add('show');
            // 直接进入时也确保通信列表用最新缓存构建
            cpApplyWallpaper(soul);
            cpBuildChatList(soul);
            if (soul.cpCache) cpApplyCacheToUI(soul);
        }
    }, 300);
}

function cpGoBackToSelection() {
    const selectionScreen = document.getElementById('cp-selection-screen');
    const homeScreen = document.getElementById('cp-home-screen');
    const appScreen = document.getElementById('cp-app-screen');
    const appChatScreen = document.getElementById('cp-app-chat-screen');

    homeScreen.classList.remove('active');
    if (appScreen) appScreen.classList.remove('active');
    if (appChatScreen) appChatScreen.classList.remove('active');
    document.getElementById('cp-chat-list-view').classList.remove('hidden-left');
    document.getElementById('cp-chat-detail-view').classList.remove('active');

    selectionScreen.classList.add('active');
    selectionScreen.style.transform = 'scale(1)';
    selectionScreen.style.opacity = '1';
    document.getElementById('cp-global-status-bar').classList.remove('show');
    document.getElementById('cp-dynamic-island').classList.remove('show');
    homeScreen.classList.remove('app-opened');

    cpCurrentSoulId = null;

    // 刷新选择界面的按钮和缓存状态
    cpInitSelection();
}
// ══════════════════════════════════════════
// 3. AI 生成引擎
// ══════════════════════════════════════════
async function cpRunAIGeneration(soul, onComplete) {
    if (!gConfig.apiUrl || !gConfig.apiKey || !gConfig.model) {
        alert('请先在 Settings 中配置 API 接口！');
        cpGoBackToSelection();
        return;
    }

    cpIsGenerating = true;
    let progress = 0;
    const progressEl = document.getElementById('cp-loading-progress-text');
    const msgEl = document.getElementById('cp-loading-status-msg');
    progressEl.textContent = '0%';
    msgEl.textContent = 'ESTABLISHING LINK';

    const progressInterval = setInterval(() => {
        if (progress < 88) {
            progress += Math.floor(Math.random() * 6) + 2;
            if (progress > 88) progress = 88;
            progressEl.textContent = progress + '%';
        }
        if (progress > 15 && progress < 35) msgEl.textContent = 'ANALYZING PERSONA';
        else if (progress >= 35 && progress < 55) msgEl.textContent = 'DECRYPTING HISTORY';
        else if (progress >= 55 && progress < 75) msgEl.textContent = 'RECONSTRUCTING DATA';
        else if (progress >= 75) msgEl.textContent = 'FINALIZING PROFILE';
    }, 350);

    try {
        const promptMessages = cpBuildPrompt(soul);

        const response = await fetch(`${gConfig.apiUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${gConfig.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: gConfig.model,
                messages: promptMessages,
                temperature: Number(gConfig.temperature || 0.85),
                stream: false
            })
        });

        if (!response.ok) {
            let errMsg = `HTTP ${response.status}`;
            try { const ej = await response.json(); errMsg += ` ${ej.error?.message || JSON.stringify(ej)}`; } catch (e) {}
            throw new Error(errMsg);
        }

        const data = await response.json();
        const rawReply = (data.choices?.[0]?.message?.content || '').trim();
        const parsed = cpParseAIResponse(rawReply);

        if (parsed) {
            soul.cpCache = parsed;
            saveData();
        } else {
            throw new Error('AI返回的数据格式无法解析');
        }

        clearInterval(progressInterval);
        progress = 100;
        progressEl.textContent = '100%';
        msgEl.textContent = 'LINK CONNECTED';

        setTimeout(() => {
            cpIsGenerating = false;
            if (onComplete) onComplete();
        }, 500);

    } catch (error) {
        clearInterval(progressInterval);
        cpIsGenerating = false;
        progressEl.textContent = 'ERROR';
        msgEl.textContent = (error.message || 'Unknown Error').substring(0, 50);
        setTimeout(() => {
            const loadingScreen = document.getElementById('cp-loading-screen');
            if (loadingScreen) loadingScreen.classList.remove('active');
            cpGoBackToSelection();
        }, 2500);
    }
}

function cpBuildPrompt(soul) {
    const { meName } = cpGetMeConfig();

    // 提取人设
    let personaPrompt = '';
    if (soul.history && soul.history[0] && soul.history[0].role === 'system') {
        personaPrompt = soul.history[0].content;
    }

    // 提取最近聊天记录摘要（最多40条有效对话）
    let chatSummary = '';
    if (soul.history && soul.history.length > 1) {
        const recentMsgs = soul.history
            .filter(m => (m.role === 'user' || m.role === 'assistant') && !m.isTheater && !m.isRevoked)
            .slice(-40);

        if (recentMsgs.length > 0) {
            chatSummary = recentMsgs.map(m => {
                let text = (m.content || '').replace(/<[^>]*>/g, '').trim();
                // 识别特殊卡片
                if ((m.content || '').includes('normal-transfer') || (m.content || '').includes('black-card-scene')) text = '[转账]';
                else if ((m.content || '').includes('rp-container')) text = '[红包]';
                else if ((m.content || '').includes('loc-card-shell')) text = '[位置分享]';
                else if ((m.content || '').includes('stamp-wrapper')) text = '[照片]';
                else if ((m.content || '').includes('luxury-box-wrap')) text = '[礼物]';
                if (text.length > 80) text = text.substring(0, 78) + '...';
                if (!text) return null;
                let speaker = (m.role === 'user') ? meName : (soul.chatRemark || soul.name);
                return `${speaker}: ${text}`;
            }).filter(Boolean).join('\n');
        }
    }

    // 提取世界书
    let worldbookContent = '';
    if (typeof worldbooks !== 'undefined' && worldbooks.length > 0) {
        const activeWbs = worldbooks.filter(w => w.isGlobal || (w.boundContacts && w.boundContacts.includes(soul.id)));
        if (activeWbs.length > 0) {
            worldbookContent = activeWbs.map(w => `[${w.title || '设定'}]: ${w.content}`).join('\n\n');
        }
    }

    // 提取核心记忆
    let memoryContent = soul.memory || '';

    // 提取线下剧场记忆
    let theaterSummary = '';
    if (soul.history) {
        const theaterMsgs = soul.history.filter(m => m.isTheater === true && m.role !== 'system').slice(-15);
        if (theaterMsgs.length > 1) {
            theaterSummary = theaterMsgs.map(m => {
                let text = (m.content || '').replace(/<[^>]+>/g, '').trim();
                if (!text) return null;
                let speaker = (m.role === 'assistant' || m.role === 'assistant_action') ? (soul.chatRemark || soul.name) : meName;
                return `${speaker}: ${text}`;
            }).filter(Boolean).join('\n');
        }
    }

    const charName = soul.chatRemark || soul.name;

        const systemPrompt = `你是一个角色扮演数据生成引擎。你需要完全化身为指定角色，以该角色的第一人称视角，生成TA手机中的私密数据。

【⚠️ 最高优先级身份校准 ⚠️】：
- 你现在化身的角色是「${charName}」，这是手机的主人。
- 「${meName}」是手机主人最在意的那个人（对话对象），不是手机主人自己！
- 在contacts联系人列表中，「${meName}」必须作为一个独立的联系人出现，代表的是"那个特别的人"，绝对不是手机主人自己！
- 在通信记录中，「${charName}」发出的消息是手机主人自己说的话，「${meName}」的消息是对方说的话。
- 在密信(secret)中，sent是「${charName}」自己发出去的，draft是「${charName}」自己打了又删的。
- 即使「${meName}」这个名字看起来像第一人称（比如叫"我"），它也绝对是另一个人的名字/代号，不是手机主人自己！
- 在通话记录(calls)中，transcript只能记录「${charName}」自己说的话！绝对禁止替「${meName}」编造台词！你无法知道对方在电话里说了什么，只能记录手机主人自己说的那句话。


【角色人设】：
${personaPrompt || '一个有着丰富内心世界的人'}

【角色名字】：${charName}
【对话对象（手机主人最在意的人）】：${meName}

${worldbookContent ? `【世界观设定】：\n${worldbookContent}\n` : ''}
${memoryContent ? `【核心记忆（已发生的重要事件）】：\n${memoryContent}\n` : ''}
${chatSummary ? `【最近的聊天记录（${charName}与${meName}的对话）】：\n${chatSummary}\n` : ''}
${theaterSummary ? `【线下见面记录】：\n${theaterSummary}\n` : ''}

【你的任务】：
以"${charName}"的第一人称视角，生成TA手机里的私密内容。所有内容必须完全符合角色人设、性格、说话方式和与${meName}的关系。
内容要有血有肉，暴露角色不为人知的一面。

你必须严格按照以下JSON格式输出，不要输出任何JSON以外的内容（不要加\`\`\`代码块标记）：

{
  "gallery": [
    {"id": "001", "desc": "照片场景的详细文字描述（角色视角，描述TA会拍什么照片、什么场景）", "caption": "角色给这张照片写的简短感想或配文"}
  ],
  "notes": [
    {"date": "2024.xx.xx", "title": "日记标题", "preview": "前两行预览", "full": "完整的日记内容（必须体现角色的内心世界、对${meName}的真实想法、最近发生的事的感受）"}
  ],
  "calls": [
    {"name": "通话对象名字", "type": "INCOMING LINK/OUTGOING/MISSED", "time": "xx:xx AM/PM", "duration": "00:xx:xx", "transcript_speaker": "说话人", "transcript_text": "通话中说的一句关键台词（体现关系和情感）"}
  ],
  "explore": [
    {"query": "角色偷偷搜索的内容（必须暴露角色的真实心理，比如偷偷搜和${meName}有关的事）", "time": "xx:xx AM/PM", "thought": "角色搜索这个时的内心独白（潜意识，写得像自言自语）"}
  ],
  "secret": [
    {"time": "TODAY // xx:xx PM", "sent": "角色实际发出去的消息（简短、克制、符合人设的表面表达）", "draft": "角色打了又删掉的草稿（暴露真心话，比发出去的版本更真实、更脆弱、更炽热）"}
  ],
  "contacts": [
    {"name": "联系人名字", "relation": "与角色的关系（如：同事/闺蜜/前任/暗恋对象/家人等）", "lastMsg": "最后一条聊天消息预览", "time": "xx:xx"}
  ],
  "groupChats": [
    {"groupName": "群聊名称", "members": ["成员1", "成员2", "成员3"], "messages": [
      {"sender": "发言人名字", "text": "消息内容"},
      {"sender": "另一个人", "text": "回复内容"}
    ]}
  ]
}

【生成规则】：
1. 每个分类的条目数量由你根据角色性格和聊天记录丰富度自行决定，但必须尽量丰富真实：
   - gallery: 3-6条
   - notes: 2-5条
   - calls: 3-6条
   - explore: 3-6条
   - secret: 2-5条
   - contacts: 4-8个联系人（必须包含${meName}，其余是角色生活中会有的人：家人、朋友、同事等）
   - groupChats: 1-3个群聊（每个群至少3条消息，消息要像真实群聊一样有来有回）
2. 所有内容必须用简体中文。
3. gallery的desc是客观场景描写，caption是角色主观感想。
4. notes的日记是核心灵魂，必须写得像真人日记，有情绪波动、有对${meName}的真实想法。
5. explore的搜索记录必须暴露角色不想让别人知道的一面。
6. secret的draft（删掉的草稿）是整个功能的灵魂高潮，必须写得让人心动或心疼，和sent形成强烈反差。
7. calls中至少有一条和${meName}相关的通话记录。通话记录中的transcript_speaker必须是${charName}自己说的话，transcript_text只写${charName}在电话里说的那句台词。绝对禁止替${meName}写台词！你不知道${meName}在电话里说了什么，你只能写${charName}自己说的部分。
8. contacts中「${meName}」必须排在第一位且是置顶的。注意：「${meName}」是手机主人心里最重要的那个人，不是手机主人自己！即使这个名字是"我"，它也代表另一个人！lastMsg要从聊天记录中提取真实内容。
9. groupChats的群名和成员要符合角色的社交圈。群聊消息要自然真实。注意：群成员中如果出现「${meName}」，代表的是那个特别的人在群里说话，不是手机主人自己！手机主人自己在群里的发言者名字应该是「${charName}」。
10. 如果聊天记录中有具体事件（吵架、告白、约会等），必须在notes和secret中有所体现。`;

    return [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: '请现在以角色的第一人称视角生成手机中的所有私密数据。直接输出纯JSON，不要加任何markdown标记或解释文字。' }
    ];
}

function cpParseAIResponse(raw) {
    try {
        let cleaned = raw.trim();
        // 移除markdown代码块
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

        // 尝试直接解析
        const parsed = JSON.parse(cleaned);
        if (!parsed.gallery) parsed.gallery = [];
        if (!parsed.notes) parsed.notes = [];
        if (!parsed.calls) parsed.calls = [];
        if (!parsed.explore) parsed.explore = [];
        if (!parsed.secret) parsed.secret = [];
        return parsed;
    } catch (e) {
        // 尝试从文本中提取JSON块
        let jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[0]);
                if (!parsed.gallery) parsed.gallery = [];
                if (!parsed.notes) parsed.notes = [];
                if (!parsed.calls) parsed.calls = [];
                if (!parsed.explore) parsed.explore = [];
                if (!parsed.secret) parsed.secret = [];
                return parsed;
            } catch (e2) {
                console.error('CP Parse: 二次解析失败', e2);
            }
        }
        console.error('CP Parse: 完全解析失败', e, raw.substring(0, 300));
        return null;
    }
}
// ══════════════════════════════════════════
// 4. 将缓存数据渲染到UI（外观完全不变）
// ══════════════════════════════════════════
function cpApplyCacheToUI(soul) {
    const cache = soul.cpCache;
    if (!cache) return;

    // ── 图库 ──
    const galleryGrid = document.querySelector('#cp-app-content-gallery .cp-gallery-grid');
    if (galleryGrid && cache.gallery && cache.gallery.length > 0) {
        galleryGrid.innerHTML = cache.gallery.map((item, i) => `
            <div class="cp-gallery-item" onclick="cpToggleFold(this)">
                <div class="cp-gallery-img-box" style="display:flex; justify-content:center; align-items:center; padding:15px; background: linear-gradient(135deg, #EAEAE8 0%, #DDDBD6 100%);">
                    <div style="font-size:11px; color:#6E6E73; text-align:center; line-height:1.5; font-weight:500; font-style:italic;">${item.desc || ''}</div>
                </div>
                <div class="cp-gallery-meta cp-mono">NO. ${String(i + 1).padStart(3, '0')} // ${(item.caption || '').substring(0, 8) || '记录'}</div>
                <div class="cp-fold-wrapper"><div class="cp-fold-inner"><div class="cp-gallery-desc cp-serif">"${item.caption || ''}"</div></div></div>
            </div>
        `).join('');
    }

    // ── 记录 ──
    const notesEl = document.getElementById('cp-app-content-notes');
    if (notesEl && cache.notes && cache.notes.length > 0) {
        notesEl.innerHTML = cache.notes.map(item => `
            <div class="cp-note-item" onclick="cpToggleFold(this)">
                <div class="cp-note-date cp-mono">${item.date || ''}</div>
                <div class="cp-note-title cp-serif">${item.title || ''}</div>
                <div class="cp-note-preview">${item.preview || (item.full || '').substring(0, 60)}</div>
                <div class="cp-fold-wrapper"><div class="cp-fold-inner"><div class="cp-note-full-content">${item.full || ''}</div></div></div>
            </div>
        `).join('');
    }

    // ── 呼叫 ──
    const callsEl = document.getElementById('cp-app-content-calls');
    if (callsEl && cache.calls && cache.calls.length > 0) {
        callsEl.innerHTML = cache.calls.map(item => {
            const initial = (item.name || '?').charAt(0);
            const isMissed = (item.type || '').toUpperCase().includes('MISSED');
            return `
            <div class="cp-call-item" onclick="cpToggleFold(this)">
                <div class="cp-call-main">
                    <div class="cp-call-avatar cp-serif">${initial}</div>
                    <div class="cp-call-info">
                        <div class="cp-call-name cp-serif ${isMissed ? 'missed' : ''}">${item.name || '未知'}</div>
                        <div class="cp-call-type cp-mono">${item.type || 'CALL'}</div>
                    </div>
                    <div class="cp-call-time cp-mono">${item.time || ''}</div>
                </div>
                <div class="cp-fold-wrapper"><div class="cp-fold-inner">
                    <div class="cp-call-detail cp-mono">
                        <div class="cp-cd-row"><span>DURATION</span><span>${item.duration || '00:00:00'}</span></div>
                    </div>
                    ${item.transcript_text ? `
                    <div class="cp-call-transcript">
                        <div class="cp-transcript-header cp-mono">AUDIO LOG // DECRYPTED</div>
                        <div class="cp-transcript-line">
                            <span class="cp-ts-speaker cp-mono">${item.transcript_speaker || item.name}:</span>
                            <span class="cp-ts-text cp-serif">${item.transcript_text}</span>
                        </div>
                    </div>` : ''}
                </div></div>
            </div>`;
        }).join('');
    }

    // ── 探索 ──
    const exploreEl = document.getElementById('cp-app-content-explore');
    if (exploreEl && cache.explore && cache.explore.length > 0) {
        exploreEl.innerHTML = cache.explore.map(item => `
            <div class="cp-history-item" onclick="cpToggleFold(this)">
                <div class="cp-hi-top">
                    <div class="cp-hi-icon"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
                    <div class="cp-hi-info">
                        <div class="cp-hi-query cp-serif">${item.query || ''}</div>
                        <div class="cp-hi-time cp-mono">${item.time || ''} // INCOGNITO</div>
                    </div>
                </div>
                <div class="cp-fold-wrapper"><div class="cp-fold-inner">
                    <div class="cp-hi-reply">
                        <div class="cp-reply-header cp-mono">THOUGHT LOG // 潜意识记录</div>
                        <div class="cp-reply-text cp-serif">${item.thought || ''}</div>
                    </div>
                </div></div>
            </div>
        `).join('');
    }

    // ── 密信 ──
    const secretEl = document.getElementById('cp-app-content-secret');
    if (secretEl && cache.secret && cache.secret.length > 0) {
        secretEl.innerHTML = cache.secret.map(item => `
            <div class="cp-secret-item" onclick="cpToggleFold(this)">
                <div class="cp-secret-time cp-mono">${item.time || ''}</div>
                <div class="cp-secret-sent-box">
                    <div class="cp-secret-label cp-mono">SENT</div>
                    <div class="cp-secret-sent-text cp-serif">${item.sent || ''}</div>
                </div>
                <div class="cp-fold-wrapper"><div class="cp-fold-inner">
                    <div class="cp-secret-draft-box">
                        <div class="cp-draft-label cp-mono">DELETED DRAFT // 拦截草稿</div>
                        <div class="cp-draft-text">${item.draft || ''}</div>
                    </div>
                </div></div>
            </div>
        `).join('');
    }
}

// ══════════════════════════════════════════
// 5. 通信APP（打通真实聊天记录 + AI生成的联系人和群聊）
// ══════════════════════════════════════════
function cpBuildChatList(soul) {
    const clList = document.getElementById('cp-cl-list');
    if (!clList) return;
    clList.innerHTML = '';

    const { meName } = cpGetMeConfig();
    const myAvatar = cpGetMyAvatarForContact(soul);
    const myAvatarHtml = cpRenderAvatarHtml(myAvatar, meName.charAt(0));
    const cache = soul.cpCache;

    // 提取与"我"的最后一条真实消息
    let lastMsg = '暂无消息';
    let lastTime = '刚刚';
    if (soul.history && soul.history.length > 0) {
        for (let i = soul.history.length - 1; i >= 0; i--) {
            const m = soul.history[i];
            if (m.role === 'system' || m.role === 'system_sum' || m.isTheater) continue;
            let rawContent = m.content || '';
            let text = rawContent.replace(/<[^>]*>/g, '').trim();
            if (rawContent.includes('normal-transfer') || rawContent.includes('black-card-scene')) text = '[转账]';
            else if (rawContent.includes('rp-container')) text = '[红包]';
            else if (rawContent.includes('loc-card-shell')) text = '[位置]';
            else if (rawContent.includes('stamp-wrapper')) text = '[照片]';
            else if (rawContent.includes('luxury-box-wrap')) text = '[礼物]';
            else if (rawContent.includes('sync-invite-wrap')) text = '[一起听]';
            if (text.length > 25) text = text.substring(0, 23) + '...';
            lastMsg = text || '...';
            if (m.timestamp) {
                const d = new Date(m.timestamp);
                const now = new Date();
                lastTime = d.toDateString() === now.toDateString()
                    ? d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0')
                    : (d.getMonth() + 1) + '/' + d.getDate();
            }
            break;
        }
    }

    // 置顶：与"我"的聊天
    let html = `
        <div class="cp-cl-item pinned" onclick="cpOpenChatDetail('${soul.id}', 'pinned')">
            <div class="cp-cl-avatar cp-serif" style="background: var(--c-bg); color: var(--c-black); overflow:hidden; border:none;">${myAvatarHtml}</div>
            <div class="cp-cl-content">
                <div class="cp-cl-name-row">
                    <div class="cp-cl-name cp-serif">${meName} <svg class="cp-pin-icon" viewBox="0 0 24 24"><path d="M16 12V4H17V2H7V4H8V12L6 14V16H11.2V22H12.8V16H18V14L16 12Z"/></svg></div>
                    <div class="cp-cl-time cp-mono">${lastTime}</div>
                </div>
                <div class="cp-cl-msg-row">
                    <div class="cp-cl-msg">${lastMsg}</div>
                    <div class="cp-cl-unread"></div>
                </div>
            </div>
        </div>
    `;

    // AI生成的联系人列表
    if (cache && cache.contacts && cache.contacts.length > 0) {
        cache.contacts.forEach(ct => {
            if (ct.name === meName) return;
            const initial = (ct.name || '?').charAt(0);
            const safeData = JSON.stringify(ct).replace(/'/g, "&#39;").replace(/"/g, "&quot;");
            html += `
                <div class="cp-cl-item" onclick="cpOpenAiContact(this)" data-cp-contact='${safeData}'>
                    <div class="cp-cl-avatar cp-serif" style="background: var(--c-bg); color: var(--c-black);">${initial}</div>
                    <div class="cp-cl-content">
                        <div class="cp-cl-name-row">
                            <div class="cp-cl-name cp-serif">${ct.name}</div>
                            <div class="cp-cl-time cp-mono">${ct.time || ''}</div>
                        </div>
                        <div class="cp-cl-msg-row">
                            <div class="cp-cl-msg">${ct.lastMsg || ''}</div>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    // AI生成的群聊列表
    if (cache && cache.groupChats && cache.groupChats.length > 0) {
        cache.groupChats.forEach((g, gi) => {
            const memberCount = g.members ? g.members.length : 0;
            const lastGroupMsg = g.messages && g.messages.length > 0 ? g.messages[g.messages.length - 1] : null;
            const previewText = lastGroupMsg ? `${lastGroupMsg.sender}: ${lastGroupMsg.text}` : '';
            const avatarMembers = (g.members || []).slice(0, 4);
            const gridHtml = avatarMembers.map(m =>
                `<div style="background:#fff; border-radius:4px; display:flex; justify-content:center; align-items:center; font-size:10px;">${(m || '?').charAt(0)}</div>`
            ).join('');
            const safeData = JSON.stringify(g).replace(/'/g, "&#39;").replace(/"/g, "&quot;");

            html += `
                <div class="cp-cl-item" onclick="cpOpenAiGroup(this)" data-cp-group='${safeData}'>
                    <div class="cp-cl-avatar cp-serif" style="background: #EAEAEA; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 2px; padding: 2px;">
                        ${gridHtml}
                    </div>
                    <div class="cp-cl-content">
                        <div class="cp-cl-name-row">
                            <div class="cp-cl-name cp-serif">${g.groupName || '群聊'} (${memberCount})</div>
                            <div class="cp-cl-time cp-mono"></div>
                        </div>
                        <div class="cp-cl-msg-row">
                            <div class="cp-cl-msg">${previewText}</div>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    clList.innerHTML = html;
}

// ── AI联系人点击入口 ──
function cpOpenAiContact(el) {
    let ct;
    try { ct = JSON.parse(el.dataset.cpContact.replace(/&quot;/g, '"').replace(/&#39;/g, "'")); } catch (e) { return; }

    const msgContainer = document.getElementById('cp-cd-messages');
    msgContainer.innerHTML = '';
    document.getElementById('cp-cd-title').textContent = ct.name || '联系人';

    let html = `<div class="cp-cd-time-divider cp-mono">PRIVATE CHANNEL</div>`;
    html += `
        <div class="cp-msg-row them">
            <div class="cp-msg-avatar cp-serif" style="background: var(--c-bg); color: var(--c-black);">${(ct.name || '?').charAt(0)}</div>
            <div class="cp-msg-body">
                <div class="cp-msg-bubble">${ct.lastMsg || '...'}</div>
            </div>
        </div>
    `;
    if (ct.relation) {
        html += `<div class="cp-cd-time-divider cp-mono" style="margin-top:20px; opacity:0.4; font-size:10px;">RELATION: ${ct.relation.toUpperCase()}</div>`;
    }

    msgContainer.innerHTML = html;
    document.getElementById('cp-chat-list-view').classList.add('hidden-left');
    document.getElementById('cp-chat-detail-view').classList.add('active');
}

// ── AI群聊点击入口 ──
function cpOpenAiGroup(el) {
    let g;
    try { g = JSON.parse(el.dataset.cpGroup.replace(/&quot;/g, '"').replace(/&#39;/g, "'")); } catch (e) { return; }

    const msgContainer = document.getElementById('cp-cd-messages');
    msgContainer.innerHTML = '';
    document.getElementById('cp-cd-title').textContent = g.groupName || '群聊';

    let html = `<div class="cp-cd-time-divider cp-mono">GROUP CHANNEL</div>`;

    if (g.messages && g.messages.length > 0) {
        const soul = cpCurrentSoulId ? contacts.find(x => x.id === cpCurrentSoulId) : null;
        const soulName = soul ? (soul.chatRemark || soul.name) : '';

        g.messages.forEach(msg => {
            const isMe = (msg.sender === soulName);
            const rowClass = isMe ? 'me' : 'them';
            const initial = (msg.sender || '?').charAt(0);

            let avatarHtml = '';
            if (!isMe) {
                avatarHtml = `<div class="cp-msg-avatar cp-serif" style="background: var(--c-bg); color: var(--c-black);">${initial}</div>`;
            }

            html += `
                <div class="cp-msg-row ${rowClass}">
                    ${avatarHtml}
                    <div class="cp-msg-body">
                        ${!isMe ? `<div style="font-size: 10px; color: var(--c-gray); margin-bottom: 4px; margin-left: 2px;">${msg.sender}</div>` : ''}
                        <div class="cp-msg-bubble">${msg.text || ''}</div>
                    </div>
                </div>
            `;
        });
    } else {
        html += `<div class="cp-cd-time-divider cp-mono" style="margin-top:50px;">NO MESSAGES FOUND</div>`;
    }

    msgContainer.innerHTML = html;
    document.getElementById('cp-chat-list-view').classList.add('hidden-left');
    document.getElementById('cp-chat-detail-view').classList.add('active');

    if (arguments[1] === 'pinned') {
        const c = contacts.find(x => x.id === contactId);
        if (c) cpSyncToChat('chat', cpGetMeConfig().meName);
    }

    setTimeout(() => { msgContainer.scrollTop = msgContainer.scrollHeight; }, 50);
}

// ══════════════════════════════════════════
// 6. 查阅真实聊天记录（视角反转渲染）
// ══════════════════════════════════════════
function cpOpenChatDetail(contactId, type) {
    const msgContainer = document.getElementById('cp-cd-messages');
    msgContainer.innerHTML = '';

    if (type === 'pinned') {
        const c = contacts.find(x => x.id === contactId);
        if (!c) return;

        const { meName } = cpGetMeConfig();
        document.getElementById('cp-cd-title').textContent = meName;

        const myAvatar = cpGetMyAvatarForContact(c);

        let html = `<div class="cp-cd-time-divider cp-mono">DECRYPTED LOGS</div>`;

        let visibleMsgs = [];
        for (let i = 0; i < c.history.length; i++) {
            const m = c.history[i];
            if (m.role === 'system' || m.isTheater) continue;
            if (m.role === 'system_sum') {
                let visibleText = (m.content || '').replace(/<span[^>]*style=["']display:\s*none;?["'][^>]*>[\s\S]*?<\/span>/gi, '').trim();
                if (!visibleText) continue;
                if ((m.content || '').includes('使用了贴纸')) continue;
            }
            visibleMsgs.push(m);
        }

        const recentMsgs = visibleMsgs.slice(-50);

        if (recentMsgs.length === 0) {
            html += `<div class="cp-cd-time-divider cp-mono" style="margin-top: 50px;">NO SECURE LOGS FOUND</div>`;
        }

        recentMsgs.forEach(msg => {
            const role = msg.role;

            if (role === 'system_sum') {
                let visibleText = (msg.content || '').replace(/<span[^>]*style=["']display:\s*none;?["'][^>]*>[\s\S]*?<\/span>/gi, '').trim();
                html += `<div class="cp-cd-time-divider cp-mono" style="opacity:0.6; text-transform:none; font-size:11px;">${visibleText}</div>`;
                return;
            }

            if (role === 'assistant_action') {
                html += `<div class="cp-cd-time-divider cp-mono" style="opacity:0.5; font-style:italic; font-size:12px;">✦ ${msg.content || ''}</div>`;
                return;
            }

            if (msg.isRevoked) {
                const isMe = (role === 'assistant' || role === 'bot');
                html += `<div class="cp-cd-time-divider cp-mono" style="opacity:0.4; font-size:11px;">${isMe ? 'TA' : '对方'}撤回了一条消息</div>`;
                return;
            }

            const isMe = (role === 'assistant' || role === 'bot');
            const rowClass = isMe ? 'me' : 'them';

            let avatarHtml = '';
            if (!isMe) {
                const myAvatarRendered = cpRenderAvatarHtml(myAvatar, meName.charAt(0));
                avatarHtml = `<div class="cp-msg-avatar cp-serif" style="background: var(--c-bg); color: var(--c-black); overflow:hidden; border:none;">${myAvatarRendered}</div>`;
            }

            let text = msg.content || '';

            if (text.includes('normal-transfer') || text.includes('black-card-scene')) {
                let amountMatch = text.match(/[\d,]+\.?\d*/);
                text = `<div style="background:rgba(0,0,0,0.04); padding:10px 14px; border-radius:12px; font-size:13px; color:var(--c-gray);">💸 [转账${amountMatch ? ' ¥' + amountMatch[0] : ''}]</div>`;
            } else if (text.includes('rp-container')) {
                text = `<div style="background:rgba(0,0,0,0.04); padding:10px 14px; border-radius:12px; font-size:13px; color:var(--c-gray);">🧧 [高定红包]</div>`;
            } else if (text.includes('loc-card-shell')) {
                let locMatch = text.match(/loc-name[^>]*>([^<]*)/);
                text = `<div style="background:rgba(0,0,0,0.04); padding:10px 14px; border-radius:12px; font-size:13px; color:var(--c-gray);">📍 [位置: ${locMatch ? locMatch[1] : '已分享'}]</div>`;
            } else if (text.includes('stamp-wrapper')) {
                text = `<div style="background:rgba(0,0,0,0.04); padding:10px 14px; border-radius:12px; font-size:13px; color:var(--c-gray);">📷 [照片]</div>`;
            } else if (text.includes('luxury-box-wrap')) {
                text = `<div style="background:rgba(0,0,0,0.04); padding:10px 14px; border-radius:12px; font-size:13px; color:var(--c-gray);">🎁 [礼物]</div>`;
            } else if (text.includes('sync-invite-wrap') || text.includes('tw-sync-card')) {
                text = `<div style="background:rgba(0,0,0,0.04); padding:10px 14px; border-radius:12px; font-size:13px; color:var(--c-gray);">🎵 [一起听邀请]</div>`;
            } else if (text.includes('<img')) {
                text = text.replace(/<img/g, '<img style="max-width:100%; border-radius:8px; max-height:200px; object-fit:cover;"');
            }

            let timeHtml = '';
            if (msg.timestamp) {
                const d = new Date(msg.timestamp);
                timeHtml = `<div style="font-size:10px; color:var(--c-gray); margin-top:4px; opacity:0.6;">${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}</div>`;
            }

            html += `
                <div class="cp-msg-row ${rowClass}">
                    ${avatarHtml}
                    <div class="cp-msg-body">
                        <div class="cp-msg-bubble">${text}</div>
                        ${timeHtml}
                    </div>
                </div>
            `;
        });

        msgContainer.innerHTML = html;
    }

    document.getElementById('cp-chat-list-view').classList.add('hidden-left');
    document.getElementById('cp-chat-detail-view').classList.add('active');

    setTimeout(() => { msgContainer.scrollTop = msgContainer.scrollHeight; }, 50);
}

function cpCloseChatDetail() {
    document.getElementById('cp-chat-list-view').classList.remove('hidden-left');
    document.getElementById('cp-chat-detail-view').classList.remove('active');
}

// ══════════════════════════════════════════
// 7. 内部应用路由
// ══════════════════════════════════════════
function cpOpenApp(appName) {
    const homeScreen = document.getElementById('cp-home-screen');
    const appScreen = document.getElementById('cp-app-screen');
    const appChatScreen = document.getElementById('cp-app-chat-screen');

    homeScreen.style.transform = 'scale(0.96)';
    homeScreen.classList.add('app-opened');

    if (appName === '通信') {
        void appChatScreen.offsetHeight;
        appChatScreen.classList.add('active');
        cpSyncToChat('app', '通信');
    } else {
        document.getElementById('cp-current-app-title').textContent = appName;

        const panels = ['default', 'gallery', 'notes', 'calls', 'explore', 'secret'];
        panels.forEach(p => {
            const el = document.getElementById('cp-app-content-' + p);
            if (el) el.style.display = 'none';
        });

        const mapName = { '图库': 'gallery', '记录': 'notes', '呼叫': 'calls', '探索': 'explore', '密信': 'secret' };
        const targetPanel = mapName[appName];

        if (targetPanel) {
            const el = document.getElementById('cp-app-content-' + targetPanel);
            if (el) el.style.display = 'flex';
        } else {
            const el = document.getElementById('cp-app-content-default');
            if (el) {
                el.style.display = 'block';
                document.getElementById('cp-app-content-name').textContent = appName;
            }
        }

        if (cpCurrentSoulId) {
            const soul = contacts.find(x => x.id === cpCurrentSoulId);
            if (soul && soul.cpCache) cpApplyCacheToUI(soul);
        }

        void appScreen.offsetHeight;
        appScreen.classList.add('active');
        cpSyncToChat('app', appName);
    }
}

function cpCloseApp() {
    const homeScreen = document.getElementById('cp-home-screen');
    const appScreen = document.getElementById('cp-app-screen');
    const appChatScreen = document.getElementById('cp-app-chat-screen');

    appScreen.classList.remove('active');
    appChatScreen.classList.remove('active');

    document.getElementById('cp-chat-list-view').classList.remove('hidden-left');
    document.getElementById('cp-chat-detail-view').classList.remove('active');

    document.querySelectorAll('#app-checkphone .cp-fold-wrapper').forEach(el => el.classList.remove('open'));

    homeScreen.style.transform = 'scale(1)';
    homeScreen.classList.remove('app-opened');
}

function cpToggleFold(element) {
    const wrapper = element.querySelector('.cp-fold-wrapper');
    if (wrapper) {
        wrapper.classList.toggle('open');
        // 展开时同步内容到聊天室
        if (wrapper.classList.contains('open')) {
            let detail = element.querySelector('.cp-note-title, .cp-hi-query, .cp-draft-text, .cp-gallery-desc, .cp-ts-text');
            if (detail) cpSyncToChat('content', detail.textContent.trim().substring(0, 100));
        }
    }
}

// 把查手机的行为同步到聊天室
function cpSyncToChat(action, detail) {
    if (!cpCurrentSoulId) return;
    var contact = contacts.find(c => c.id === cpCurrentSoulId);
    if (!contact || !contact.history) return;

    var charName = contact.chatRemark || contact.name;
    var meName = cpGetMeConfig().meName;
    var snoopMsg = '';

    if (action === 'enter') {
        // 进入手机时，把完整的缓存数据一起发给AI
        var cacheDetail = '';
        if (contact.cpCache) {
            var cache = contact.cpCache;
            if (cache.notes && cache.notes.length > 0) {
                cacheDetail += '\n\n【日记内容】：';
                cache.notes.forEach(function(n) {
                    cacheDetail += '\n- ' + (n.date || '') + ' ' + (n.title || '') + '：' + (n.full || n.preview || '');
                });
            }
            if (cache.secret && cache.secret.length > 0) {
                cacheDetail += '\n\n【密信（发出的vs删掉的草稿）】：';
                cache.secret.forEach(function(s) {
                    cacheDetail += '\n- 发出去的："' + (s.sent || '') + '" → 打了又删的草稿："' + (s.draft || '') + '"';
                });
            }
            if (cache.explore && cache.explore.length > 0) {
                cacheDetail += '\n\n【搜索记录】：';
                cache.explore.forEach(function(e) {
                    cacheDetail += '\n- 搜了"' + (e.query || '') + '"，内心独白："' + (e.thought || '') + '"';
                });
            }
            if (cache.calls && cache.calls.length > 0) {
                cacheDetail += '\n\n【通话记录】：';
                cache.calls.forEach(function(cl) {
                    cacheDetail += '\n- ' + (cl.name || '') + ' ' + (cl.type || '') + ' ' + (cl.time || '');
                    if (cl.transcript_text) cacheDetail += ' 通话内容："' + cl.transcript_text + '"';
                });
            }
        }
        snoopMsg = '[系统隐藏通知：' + meName + '刚刚偷偷打开了' + charName + '的手机，正在翻看隐私内容。以下是' + charName + '手机里的全部私密数据（这些都是' + charName + '自己写的、搜的、删掉的），' + meName + '现在全看到了：' + cacheDetail + '\n\n' + charName + '可以在之后的对话中自然地表现出察觉——可以生气、质问、害羞、心虚、或装作不知道。根据被看到的具体内容做出针对性反应。这条信息对' + meName + '不可见。]';
    } else if (action === 'app') {
        snoopMsg = '[系统隐藏通知：' + meName + '正在翻看' + charName + '手机里的「' + detail + '」应用。' + charName + '可以根据这个应用里的内容，在之后的对话中做出反应。这条信息对' + meName + '不可见。]';
    } else if (action === 'chat') {
        snoopMsg = '[系统隐藏通知：' + meName + '翻看了' + charName + '手机里和「' + detail + '」的聊天记录，看到了你们之间所有的对话内容。' + charName + '可以在之后的对话中对此做出反应。这条信息对' + meName + '不可见。]';
    } else if (action === 'content') {
        snoopMsg = '[系统隐藏通知：' + meName + '在' + charName + '的手机里具体看到了这条内容——"' + detail + '"。' + charName + '必须在之后的对话中针对这条被看到的内容做出具体反应，比如紧张地解释这条内容、心虚、反问为什么偷看等。这条信息对' + meName + '不可见。]';
    }

    if (snoopMsg) {
        contact.history.push({
            role: 'system_sum',
            content: '<span style="display:none;">' + snoopMsg + '</span>',
            isCpSnoop: true
        });
        saveData();
    }
}
// ══════════════════════════════════════════
// 9. 查手机专属壁纸系统
// ══════════════════════════════════════════
function cpToggleWallpaperBtn() {
    const btn = document.getElementById('cp-wallpaper-btn');
    if (!btn) return;
    if (btn.classList.contains('show')) {
        btn.classList.remove('show');
    } else {
        btn.classList.add('show');
        // 3秒后自动隐藏
        setTimeout(() => { btn.classList.remove('show'); }, 3000);
    }
}

function cpHandleWallpaperUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const dataUrl = e.target.result;

        // 应用壁纸到当前界面
        const wallpaperEl = document.getElementById('cp-dynamic-wallpaper');
        if (wallpaperEl) {
            wallpaperEl.style.backgroundImage = `url(${dataUrl})`;
            wallpaperEl.style.backgroundSize = 'cover';
            wallpaperEl.style.backgroundPosition = 'center';
            wallpaperEl.style.background = ''; // 清除渐变
            wallpaperEl.style.backgroundImage = `url(${dataUrl})`;
            wallpaperEl.style.backgroundSize = 'cover';
            wallpaperEl.style.backgroundPosition = 'center';
        }

        // 保存到当前联系人的独立壁纸字段
        if (cpCurrentSoulId) {
            const soul = contacts.find(x => x.id === cpCurrentSoulId);
            if (soul) {
                soul.cpWallpaper = dataUrl;
                saveData();
            }
        }

        // 隐藏按钮
        document.getElementById('cp-wallpaper-btn').classList.remove('show');
    };
    reader.readAsDataURL(file);

    // 清空input防止同一张图无法再次选择
    event.target.value = '';
}

function cpApplyWallpaper(soul) {
    const wallpaperEl = document.getElementById('cp-dynamic-wallpaper');
    if (!wallpaperEl) return;

    if (soul.cpWallpaper) {
        wallpaperEl.style.backgroundImage = `url(${soul.cpWallpaper})`;
        wallpaperEl.style.backgroundSize = 'cover';
        wallpaperEl.style.backgroundPosition = 'center';
    } else {
        wallpaperEl.style.backgroundImage = 'none';
        wallpaperEl.style.background = 'linear-gradient(135deg, #FDFDFD 0%, #F4F3F0 100%)';
    }
}
// ══════════════════════════════════════════
// 8. 实时时间更新
// ══════════════════════════════════════════
setInterval(() => {
    const now = new Date();
    let hours = now.getHours().toString().padStart(2, '0');
    let minutes = now.getMinutes().toString().padStart(2, '0');
    document.querySelectorAll('.cp-time-display').forEach(el => el.textContent = `${hours}:${minutes}`);
}, 1000);
