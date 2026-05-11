// ============================================================
// SOAP.OS — CHRONOS 日程引擎 (Routine Engine)
// ============================================================

window.Chronos = {
    currentId: null,
    focusMode: 'me', // 'me' 或 'work'

    init() {
        this.injectStyles();
        this.injectHTML();
    },

    injectStyles() {
        if (document.getElementById('chronos-style')) return;
        const s = document.createElement('style');
        s.id = 'chronos-style';
        s.innerHTML = `
            #app-chronos { background: transparent; display: none; flex-direction: column; position: absolute; inset: 0; z-index: 1000; overflow: hidden; transform: translateY(100%); transition: transform 0.4s cubic-bezier(0.4,0,0.2,1); }
            #app-chronos.active { transform: translateY(0); }
            
            .chr-ambient { position: absolute; inset: 0; pointer-events: none; z-index: 0; background-color: #F8F8F6; background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 20 l6.2 19 h20 l-16.1 11.7 6.2 19 L50 58 l-16.2 11.7 6.2-19 L23.9 39 h20 Z' fill='none' stroke='rgba(26,26,26,0.025)' stroke-width='1'/%3E%3C/svg%3E"); background-size: 100px 100px; }
            
            .chr-top { position: relative; z-index: 10; padding: calc(var(--safe-top, 0px) + 20px) 24px 16px; border-bottom: 0.5px solid rgba(26,26,26,0.08); display: flex; align-items: center; justify-content: space-between; }
            .chr-nav-btn { width: 36px; height: 36px; border-radius: 50%; background: #FFF; border: 1px solid rgba(26,26,26,0.08); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; color: #1C1C1E; box-shadow: 0 2px 8px rgba(0,0,0,0.02); flex-shrink: 0; }
            .chr-nav-btn:active { transform: scale(0.92); }
            .chr-title { text-align: center; }
            .chr-title h1 { font: 800 16px/1 'Playfair Display', Georgia, serif; color: #1C1C1E; letter-spacing: 1px; margin: 0; }
            .chr-title p { font: 700 8px/1 'Courier New', monospace; color: #9A9A9A; letter-spacing: 2px; margin-top: 4px; text-transform: uppercase; margin-bottom: 0; }
            
            .chr-avatars { position: relative; z-index: 10; padding: 16px 24px 8px; display: flex; gap: 14px; overflow-x: auto; scrollbar-width: none; }
            .chr-avatars::-webkit-scrollbar { display: none; }
            .chr-av-item { display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; transition: 0.2s; opacity: 0.5; flex-shrink: 0; }
            .chr-av-item.active { opacity: 1; }
            .chr-av-item.active .chr-av-box { border-color: #1C1C1E; transform: scale(1.05); }
            .chr-av-box { width: 48px; height: 48px; border-radius: 14px; background: #E5E5E5; border: 2px solid transparent; display: flex; align-items: center; justify-content: center; overflow: hidden; transition: 0.2s; font-family: 'Playfair Display', Georgia, serif; font-weight: 900; font-size: 20px; color: #1C1C1E; }
            .chr-av-box img { width: 100%; height: 100%; object-fit: cover; }
            .chr-av-name { font: 700 9px/1 'Courier New', monospace; color: #1C1C1E; letter-spacing: 0.5px; }
            
            .chr-main { flex: 1; overflow-y: auto; padding: 0 24px calc(var(--safe-bottom, 0px) + 110px); position: relative; z-index: 5; }
            .chr-main::-webkit-scrollbar { display: none; }
            
            .chr-card { background: #1C1C1E; color: #FFF; border-radius: 20px; padding: 18px 20px; margin: 10px 0 24px; position: relative; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.15); }
            .chr-card::before { content: 'NOW'; position: absolute; right: -10px; top: -10px; font: 900 80px/1 'Playfair Display', Georgia, serif; color: rgba(255,255,255,0.03); pointer-events: none; }
            .chr-c-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; position: relative; z-index: 2; }
            .chr-time { font: 800 24px/1 'Courier New', monospace; letter-spacing: -1px; display: flex; align-items: center; gap: 8px; }
            .chr-dot { width: 6px; height: 6px; background: #34C759; border-radius: 50%; box-shadow: 0 0 0 2px rgba(52,199,89,0.2); animation: chrPulse 2s infinite; }
            @keyframes chrPulse { 0%,100% {opacity:1;} 50%{opacity:0.3;} }
            .chr-badge { font: 700 8px/1 'Courier New', monospace; letter-spacing: 1px; padding: 4px 8px; border-radius: 6px; background: rgba(255,255,255,0.1); text-transform: uppercase; }
            .chr-c-title { font: 800 16px/1.3 'Playfair Display', Georgia, serif; margin-bottom: 6px; position: relative; z-index: 2; }
            .chr-c-desc { font: 400 11px/1.5 'Courier New', monospace; color: rgba(255,255,255,0.6); position: relative; z-index: 2; }
            
            .chr-tl-head { font: 700 9px/1 'Courier New', monospace; color: #9A9A9A; letter-spacing: 3px; text-transform: uppercase; display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
            .chr-tl-head::after { content: ''; flex: 1; height: 0.5px; background: rgba(26,26,26,0.08); }
            
            .chr-tl { position: relative; padding-left: 20px; }
            .chr-tl::before { content: ''; position: absolute; left: 3px; top: 8px; bottom: 0; width: 1px; background: repeating-linear-gradient(to bottom, rgba(26,26,26,0.08) 0, rgba(26,26,26,0.08) 4px, transparent 4px, transparent 8px); }
            .chr-item { position: relative; margin-bottom: 20px; }
            .chr-item:last-child { margin-bottom: 0; }
            .chr-node { position: absolute; left: -20px; top: 12px; width: 7px; height: 7px; border-radius: 50%; background: #F8F8F6; border: 1.5px solid #9A9A9A; transform: translateX(-50%); }
            .chr-item.active .chr-node { border-color: #1C1C1E; background: #1C1C1E; }
            .chr-item.active .chr-node::before { content: '✦'; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); font-size: 8px; color: #F8F8F6; }
            
            .chr-t-card { background: #FFF; border-radius: 16px; padding: 14px 16px; border: 0.5px solid rgba(26,26,26,0.08); box-shadow: 0 4px 20px rgba(0,0,0,0.02); transition: 0.2s; cursor: pointer; }
            .chr-t-card:active { transform: scale(0.98); }
            .chr-item.active .chr-t-card { border-color: #1C1C1E; box-shadow: 0 6px 20px rgba(0,0,0,0.06); }
            .chr-item.passed .chr-t-card { opacity: 0.6; filter: grayscale(1); }
            
            .chr-tr { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
            .chr-t-time { font: 800 12px/1 'Courier New', monospace; color: #5A5A5A; }
            .chr-item.active .chr-t-time { color: #1C1C1E; }
            .chr-tag { font: 700 8px/1 'Courier New', monospace; padding: 3px 6px; border-radius: 4px; background: #F0F0F0; color: #9A9A9A; }
            .chr-tag.DND { background: rgba(255,59,48,0.1); color: #FF3B30; }
            .chr-tag.FREE { background: rgba(52,199,89,0.1); color: #34C759; }
            .chr-tag.PRIVATE { background: rgba(195,167,114,0.1); color: #C3A772; }
            
            .chr-t-title { font: 800 14px/1.3 'Playfair Display', Georgia, serif; color: #1C1C1E; margin-bottom: 4px; }
            .chr-t-desc { font: 400 11px/1.5 'Courier New', monospace; color: #9A9A9A; }
            
            .chr-bot { position: absolute; bottom: 0; left: 0; right: 0; z-index: 20; padding: 16px 24px calc(var(--safe-bottom, 0px) + 24px); background: linear-gradient(to top, #F8F8F6 60%, transparent); display: flex; gap: 12px; }
            .chr-btn-p { flex: 1; background: #1C1C1E; color: #FFF; border-radius: 16px; padding: 16px; display: flex; justify-content: center; align-items: center; gap: 8px; font: 800 12px/1 'Courier New', monospace; letter-spacing: 1px; cursor: pointer; transition: 0.2s; border: none; }
            .chr-btn-p:active { transform: scale(0.96); }
            .chr-btn-p:disabled { opacity: 0.5; pointer-events: none; }
            
            .chr-btn-s { width: 48px; height: 48px; border-radius: 16px; background: #FFF; border: 1px solid rgba(26,26,26,0.08); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; color: #1C1C1E; flex-shrink: 0; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
            .chr-btn-s:active { transform: scale(0.92); }
            .chr-spin { animation: chrSpin 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
            @keyframes chrSpin { 100% { transform: rotate(360deg); } }
            
            /* 设置面板 Overlay */
            .chr-set-over { position: absolute; inset: 0; z-index: 100; background: rgba(0,0,0,0.45); backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px); display: flex; flex-direction: column; justify-content: flex-end; opacity: 0; pointer-events: none; transition: opacity 0.3s; }
            .chr-set-over.active { opacity: 1; pointer-events: auto; }
            .chr-set-sheet { background: #FFF; border-radius: 28px 28px 0 0; padding: 0 0 calc(var(--safe-bottom, 0px) + 20px); transform: translateY(100%); transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 -10px 40px rgba(0,0,0,0.1); }
            .chr-set-over.active .chr-set-sheet { transform: translateY(0); }
            .chr-set-handle { width: 40px; height: 4px; background: rgba(0,0,0,0.1); border-radius: 2px; margin: 16px auto; }
            .chr-set-head { padding: 0 28px 16px; }
            .chr-set-title { font: 900 20px/1 'Playfair Display', Georgia, serif; color: #1C1C1E; letter-spacing: -0.5px; margin:0; }
            .chr-set-sub { font: 700 9px/1 'Courier New', monospace; color: #9A9A9A; letter-spacing: 2px; margin-top: 6px; text-transform: uppercase; }
            .chr-set-sec { padding: 20px 28px; border-top: 0.5px solid rgba(26,26,26,0.08); }
            .chr-sec-title { font: 800 13px/1 'Courier New', monospace; color: #1C1C1E; margin-bottom: 6px; }
            .chr-sec-desc { font: 400 11px/1.5 'Courier New', monospace; color: #9A9A9A; margin-bottom: 16px; }
            .chr-seg { display: flex; gap: 6px; background: #F4F4F4; border: 1px solid rgba(0,0,0,0.05); border-radius: 14px; padding: 5px; }
            .chr-seg-btn { flex: 1; text-align: center; padding: 14px 0; border-radius: 10px; font: 800 13px/1 'Courier New', monospace; color: #9A9A9A; cursor: pointer; transition: 0.25s; letter-spacing: 1px; }
            .chr-seg-btn.active { background: #1C1C1E; color: #FFF; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
            .chr-set-close { margin: 20px 28px 0; background: #F4F4F4; color: #1C1C1E; padding: 16px; border-radius: 16px; font: 800 13px/1 'Courier New', monospace; letter-spacing: 2px; text-align: center; cursor: pointer; transition: 0.2s; }
            .chr-set-close:active { background: #E5E5E5; transform: scale(0.97); }
            
            .chr-empty { text-align:center; padding:60px 0; font-family:'Courier New',monospace; font-size:11px; color:#9A9A9A; letter-spacing:1px; line-height: 1.6; }
        `;
        document.head.appendChild(s);
    },

    injectHTML() {
        if (document.getElementById('app-chronos')) return;
        const html = `
        <div class="app-window" id="app-chronos" style="display:none; padding:0; background:transparent;">
            <div class="chr-ambient"></div>
            <div class="chr-top">
                <div class="nav-deco-stars" style="position:absolute; inset:0; pointer-events:none; z-index:1; color:#1C1C1E;">
                    <div style="position:absolute; top:15px; left:18%; font-size:24px; opacity:0.06; transform:rotate(15deg);">★</div>
                    <div style="position:absolute; top:35px; left:30%; font-size:10px; opacity:0.25; transform:rotate(-20deg);">✦</div>
                    <div style="position:absolute; top:48px; left:12%; font-size:14px; opacity:0.15; transform:rotate(45deg);">✧</div>
                    <div style="position:absolute; top:12px; right:25%; font-size:18px; opacity:0.08; transform:rotate(-10deg);">★</div>
                    <div style="position:absolute; top:42px; right:35%; font-size:8px; opacity:0.4; transform:rotate(30deg);">✩</div>
                    <div style="position:absolute; top:22px; right:10%; font-size:16px; opacity:0.12; transform:rotate(60deg);">✦</div>
                </div>
                <div class="chr-nav-btn" onclick="Chronos.close()" style="position:relative; z-index:2;"><i class="fa-solid fa-arrow-left text-[14px]"></i></div>
                <div class="chr-title" style="position:relative; z-index:2;">
                    <h1>CHRONOS</h1>
                    <p>ROUTINE ENGINE</p>
                </div>
                <div style="display:flex; gap:10px; position:relative; z-index:2;">
                    <div class="chr-nav-btn" onclick="Chronos.clearRoutine()" style="color:#FF3B30;"><i class="fa-regular fa-trash-can text-[13px]"></i></div>
                    <div class="chr-nav-btn" onclick="Chronos.openSettings()"><i class="fa-solid fa-sliders text-[13px]"></i></div>
                </div>
            </div>
            
            <div class="chr-avatars" id="chr-avatars"></div>
            <div class="chr-main" id="chr-main"></div>
            
            <div class="chr-bot">
                <div class="chr-btn-s" onclick="alert('该功能即将开放：手动编辑作息段')" title="手动添加"><i class="fa-solid fa-plus text-[16px]"></i></div>
                <button class="chr-btn-p" id="chr-gen-btn" onclick="Chronos.generate()">
                    <i class="fa-solid fa-wand-magic-sparkles"></i> AI 智能推演
                </button>
                <div class="chr-btn-s" onclick="Chronos.regenerate(this)" title="重新调取"><i class="fa-solid fa-arrows-rotate text-[16px]"></i></div>
            </div>
            
            <div class="chr-set-over" id="chr-settings" onclick="Chronos.closeSettings(event)">
                <div class="chr-set-sheet" onclick="event.stopPropagation()">
                    <div class="chr-set-handle"></div>
                    <div class="chr-set-head">
                        <h2 class="chr-set-title">日程引擎设定</h2>
                        <div class="chr-set-sub">CHRONOS SETTINGS</div>
                    </div>
                    <div class="chr-set-sec">
                        <div class="chr-sec-title">推演核心焦点 (AI FOCUS)</div>
                        <div class="chr-sec-desc">决定大模型在推演角色作息时，侧重于事业独立性还是情感陪伴感。</div>
                        <div class="chr-seg">
                            <div class="chr-seg-btn active" id="chr-seg-me" onclick="Chronos.switchFocus('me')">围绕我</div>
                            <div class="chr-seg-btn" id="chr-seg-work" onclick="Chronos.switchFocus('work')">人设驱动</div>
                        </div>
                        <div id="chr-focus-desc" style="font-size:10px; color:#9A9A9A; margin-top:12px; line-height:1.5; font-family:'Courier New',monospace;">
                            <span style="color:#1C1C1E; font-weight:700;">[ USER CENTRIC ]</span><br>
                            在严格贴合人设的基础上，让角色在力所能及时优先顾及与你的互动。ta 不会因为"在忙"就完全消失，而是会在间隙抽空回一句。适合喜欢被惦记感的体验。
                        </div>
                    </div>
                    <div class="chr-set-close" onclick="Chronos.closeSettings()">DONE / 完成</div>
                </div>
            </div>
        </div>`;
        const frame = document.getElementById('main-frame') || document.body;
        frame.insertAdjacentHTML('beforeend', html);
    },

    open() {
        if (!contacts || contacts.length === 0) {
            alert("请先在主界面添加联系人角色");
            return;
        }
        if (!this.currentId) {
            this.currentId = typeof currentContactId !== 'undefined' && currentContactId ? currentContactId : contacts[0].id;
        }
        const app = document.getElementById('app-chronos');
        app.style.display = 'flex';
        setTimeout(() => app.classList.add('active'), 10);
        this.renderAvatars();
        this.renderMain();
    },

    close() {
        const app = document.getElementById('app-chronos');
        app.classList.remove('active');
        setTimeout(() => app.style.display = 'none', 400);
    },

    switchContact(id) {
        this.currentId = id;
        this.renderAvatars();
        this.renderMain();
    },

    renderAvatars() {
        const wrap = document.getElementById('chr-avatars');
        if (!wrap) return;
        let html = '';
        contacts.forEach(c => {
            const isActive = c.id === this.currentId;
            let avatarContent = '';
            let rawAv = c.chatAvatar || c.avatar;
            if (rawAv && (rawAv.startsWith('data:image') || rawAv.startsWith('http'))) {
                avatarContent = `<img src="${rawAv}">`;
            } else {
                avatarContent = c.name.charAt(0).toUpperCase();
            }
            html += `
                <div class="chr-av-item ${isActive ? 'active' : ''}" onclick="Chronos.switchContact('${c.id}')">
                    <div class="chr-av-box" ${!isActive ? 'style="background:#F2F2F2;"' : ''}>${avatarContent}</div>
                    <div class="chr-av-name">${(c.chatRemark || c.name).substring(0,4)}</div>
                </div>`;
        });
        wrap.innerHTML = html;
    },

    renderMain() {
        const main = document.getElementById('chr-main');
        if (!main) return;
        const c = contacts.find(x => x.id === this.currentId);
        if (!c) return;

        // 同步当前角色的 focusMode
        this.focusMode = c.routineFocus || 'me';
        this.updateSettingsUI();

        if (!c.routine || c.routine.length === 0) {
            main.innerHTML = `<div class="chr-empty">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" stroke-width="1" style="margin:0 auto 10px; opacity:0.3;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                暂无作息数据<br>请点击下方按钮由 AI 智能推演
            </div>`;
            return;
        }

        const now = new Date();
        const curMins = now.getHours() * 60 + now.getMinutes();

        let activeItem = null;
        let timelineHtml = '';

        c.routine.forEach(item => {
            const [sh, sm] = item.start.split(':').map(Number);
            const [eh, em] = item.end.split(':').map(Number);
            const sMins = sh * 60 + sm;
            let eMins = eh * 60 + em;
            if (eMins <= sMins) eMins += 24 * 60; 

            let checkMins = curMins;
            if (curMins < sMins && sMins > 12 * 60 && curMins < 12 * 60) checkMins += 24 * 60; 

            let statusClass = '';
            if (checkMins >= sMins && checkMins < eMins) {
                statusClass = 'active';
                activeItem = item;
            } else if (checkMins >= eMins) {
                statusClass = 'passed';
            }

            let tagClass = item.tag === 'DND' ? 'DND' : (item.tag === 'FREE' ? 'FREE' : (item.tag === 'PRIVATE' ? 'PRIVATE' : ''));
            
            timelineHtml += `
                <div class="chr-item ${statusClass}">
                    <div class="chr-node"></div>
                    <div class="chr-t-card">
                        <div class="chr-tr">
                            <div class="chr-t-time">${item.start} - ${item.end}</div>
                            <div class="chr-tag ${tagClass}">${item.tag}</div>
                        </div>
                        <div class="chr-t-title">${item.title}</div>
                        <div class="chr-t-desc">${item.desc}</div>
                    </div>
                </div>`;
        });

        let currentHtml = '';
        if (activeItem) {
            let timeStr = now.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'});
            let replySpeed = activeItem.tag === 'DND' ? 'REPLY: SLOW' : (activeItem.tag === 'FREE' ? 'REPLY: FAST' : 'REPLY: NORMAL');
            currentHtml = `
                <div class="chr-card">
                    <div class="chr-c-head">
                        <div class="chr-time"><div class="chr-dot"></div>${timeStr}</div>
                        <div class="chr-badge">${replySpeed}</div>
                    </div>
                    <div class="chr-c-title">${activeItem.title}</div>
                    <div class="chr-c-desc">${activeItem.desc}</div>
                </div>`;
        }

        main.innerHTML = `
            ${currentHtml}
            <div class="chr-tl-head">FULL SCHEDULE · 全天作息</div>
            <div class="chr-tl">${timelineHtml}</div>
        `;
    },

    async generate() {
        const c = contacts.find(x => x.id === this.currentId);
        if (!c) return;
        if (!gConfig.apiUrl || !gConfig.apiKey) return alert("请先在主设置中配置大模型 API 和 Key！");

        const btn = document.getElementById('chr-gen-btn');
        const icon = btn.querySelector('i');
        icon.classList.remove('fa-wand-magic-sparkles');
        icon.classList.add('fa-spinner', 'fa-spin');
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> 神经演算中...`;

        let persona = c.history && c.history[0] ? c.history[0].content : c.prompt;
        let uName = gConfig.meName || '我';
        if(c.maskId) { const m = masks.find(x=>x.id===c.maskId); if(m) uName = m.name; }

        let focusPrompt = this.focusMode === 'me' 
            ? `【焦点偏好：围绕用户(恋爱/陪伴导向)】。请大量预留出可以与 "${uName}" 互动、空闲聊天的 "FREE" 和 "PRIVATE" 碎片时间，减少深度的 "DND" 工作块。展现出一个无论多忙都把你放在心上、随时准备回消息的状态。`
            : `【焦点偏好：围绕工作(事业/独立导向)】。请严格符合其社会身份，排满真实、硬核的工作/学习安排。必须包含大段的 "DND" (勿扰模式) 专注时间。展现出一个有独立生活、回复频率较低的写实状态。`;

        const sysPrompt = `你是一个精准的角色日程引擎。你的核心任务是：严格基于下方提供的【角色人设档案】，深度挖掘该角色的职业、性格、生活习惯、作息偏好等一切细节，推理出一份高度贴合其身份与性格的【全天作息时间表 (00:00 - 23:59)】。

【第一步：深度解析角色人设】
在生成日程之前，你必须先在内心完成以下分析（不要输出这部分分析）：
1. 该角色的职业/身份是什么？对应的上班/上课/工作时间是几点到几点？
2. 该角色的性格特征是什么？（例如：内向/外向、早起/熬夜、自律/随性）
3. 该角色有哪些明确提及的日常习惯、爱好或特殊癖好？
4. 该角色的生活节奏快慢？是高压打工人、悠闲学生、还是自由职业者？
5. 结合以上，推断该角色最可能的起床时间、睡觉时间、吃饭时间。

【第二步：严格按人设生成日程】
生成的每一个时间段都必须能在人设档案中找到对应依据，严禁使用与角色身份明显矛盾的安排。

【严格输出格式】：
你必须输出一个纯净的 JSON 数组，包含若干个对象。不要输出任何解释文字或 Markdown 代码块标记（如 \`\`\`json ）。
必须涵盖完整的 24 小时，时间段必须首尾相连，不能有空白或重叠。

每个对象的字段要求：
- "start": "HH:MM" (例如 "08:00")
- "end": "HH:MM" (例如 "09:30")
- "tag": 必须且只能从以下 4 个标签中选 1 个：
    1. "ROUTINE" (日常洗漱/通勤/吃饭等固定流程)
    2. "DND" (Do Not Disturb, 专注工作/学习/会议，回复极慢)
    3. "FREE" (空闲摸鱼，可随时聊天，秒回)
    4. "PRIVATE" (夜间独处/休息/深夜emo，防备心低，适合情感交流)
- "title": 事项简短标题，必须高度贴合角色身份（【语言必须大白话，严禁文艺】，例如：程序员角色写"撸代码/改bug"，学生角色写"上高数课"，厨师角色写"备菜开工"）
- "desc": 以第一人称视角，详细描述该角色此时的真实状态和心理，以及如果 ${uName} 发消息过来，ta 会怎么反应。必须体现角色的性格口吻。描写工作/学习状态时，严禁使用"正在疯狂赶进度""烦得很""已读不回"等套话，必须结合角色的具体职业场景写出细节（例如：设计师可能在反复调色值调到头秃、程序员可能在对着报错发呆、销售可能在陪客户喝酒说违心话）。不同性格的角色面对消息的反应也应有差异（例如：温柔型会抱歉地回一句"在忙哦稍等"、傲娇型可能根本不回但其实有看、话多型可能忍不住还是发了条语音）。(【语言必须极其口语化、接地气，要有角色自己的说话风格，禁止写诗或矫情，禁止套话】)

${focusPrompt}

【⚠️ 关键警告】：
- 严禁生成与角色职业/身份相矛盾的日程（例如：夜班护士不能早上九点上班，高中生不能下午两点还在睡觉）
- 严禁使用套话和通用模板，每一条 desc 都必须有角色自己的个性
- title 和 desc 必须让人一眼就能感受到这是"这个角色"而不是"任意一个人"

【角色人设档案】（请将此档案视为最高优先级的事实依据）：
${persona}`;

        try {
            const response = await fetch(`${gConfig.apiUrl}/v1/chat/completions`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${gConfig.apiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: gConfig.model,
                    messages: [{ role: 'user', content: sysPrompt }],
                    temperature: 0.7,
                    stream: false
                })
            });

            if (!response.ok) throw new Error("API 请求失败，请检查配置");
            const data = await response.json();
            let rawContent = data.choices[0].message.content.trim();
            
            // 剥离可能存在的 markdown
            rawContent = rawContent.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
            
            const routineData = JSON.parse(rawContent);
            if (!Array.isArray(routineData)) throw new Error("返回格式非数组");

            c.routine = routineData;
            if (typeof saveData === 'function') saveData();
            
            this.renderMain();

        } catch (e) {
            alert(`推演失败：\n${e.message}\n请重试，或更换更聪明的模型。`);
        } finally {
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> AI 智能推演全天作息`;
        }
    },

    regenerate(btn) {
        const icon = btn.querySelector('i');
        icon.classList.remove('chr-spin');
        void icon.offsetWidth;
        icon.classList.add('chr-spin');
        this.generate();
    },

    clearRoutine() {
        const c = contacts.find(x => x.id === this.currentId);
        if (!c) return;
        if (!c.routine || c.routine.length === 0) return alert("当前角色没有日程数据可清空！");
        
        if (confirm(`确定要清空 ${c.name} 的全天日程吗？\n清空后将不会再对 AI 聊天产生作息影响。`)) {
            c.routine = [];
            if (typeof saveData === 'function') saveData();
            this.renderMain();
        }
    },

    openSettings() {
        document.getElementById('chr-settings').classList.add('active');
    },
    
    closeSettings(e) {
        if (!e || e.target.id === 'chr-settings' || !e.target) {
            document.getElementById('chr-settings').classList.remove('active');
        }
    },

    switchFocus(type) {
        document.getElementById('chr-seg-me').classList.remove('active');
        document.getElementById('chr-seg-work').classList.remove('active');
        
        const descBox = document.getElementById('chr-focus-desc');
        this.focusMode = type;
        
        if (type === 'me') {
            document.getElementById('chr-seg-me').classList.add('active');
            descBox.innerHTML = `<span style="color:#1C1C1E; font-weight:700;">[ USER CENTRIC ]</span><br>在严格贴合人设的基础上，让角色在力所能及时优先顾及与你的互动。ta 不会因为"在忙"就完全消失，而是会在间隙抽空回一句。适合喜欢被惦记感的体验。`;
        } else {
            document.getElementById('chr-seg-work').classList.add('active');
            descBox.innerHTML = `<span style="color:#1C1C1E; font-weight:700;">[ PERSONA DRIVEN ]</span><br>完全由人设驱动，角色会做人设里该做的事，该忙的时候真的顾不上消息，该摸鱼的时候才有空搭理你。回复节奏完全取决于 ta 现在在干什么。`;
        }

        const c = contacts.find(x => x.id === this.currentId);
        if (c) {
            c.routineFocus = type;
            if (typeof saveData === 'function') saveData();
        }
    },

    updateSettingsUI() {
        if (this.focusMode === 'me') {
            document.getElementById('chr-seg-me').classList.add('active');
            document.getElementById('chr-seg-work').classList.remove('active');
            document.getElementById('chr-focus-desc').innerHTML = `<span style="color:#1C1C1E; font-weight:700;">[ USER CENTRIC ]</span><br>在严格贴合人设的基础上，让角色在力所能及时优先顾及与你的互动。ta 不会因为"在忙"就完全消失，而是会在间隙抽空回一句。适合喜欢被惦记感的体验。`;
        } else {
            document.getElementById('chr-seg-work').classList.add('active');
            document.getElementById('chr-seg-me').classList.remove('active');
            document.getElementById('chr-focus-desc').innerHTML = `<span style="color:#1C1C1E; font-weight:700;">[ PERSONA DRIVEN ]</span><br>完全由人设驱动，角色会做人设里该做的事，该忙的时候真的顾不上消息，该摸鱼的时候才有空搭理你。回复节奏完全取决于 ta 现在在干什么。`;
        }
    },

    /* ---------- 给 12-ai-engine.js 调用的接口 ---------- */
    getCurrentRoutinePrompt(contactId) {
        if (typeof contacts === 'undefined') return "";
        const c = contacts.find(x => x.id === contactId);
        if (!c || !c.routine || c.routine.length === 0) return "";
        
        const now = new Date();
        const curMins = now.getHours() * 60 + now.getMinutes();

        let activeItem = null;
        for (let item of c.routine) {
            if (!item.start || !item.end) continue;
            const [sh, sm] = item.start.split(':').map(Number);
            const [eh, em] = item.end.split(':').map(Number);
            const sMins = sh * 60 + sm;
            let eMins = eh * 60 + em;
            if (eMins <= sMins) eMins += 24 * 60; // 处理跨夜

            let checkMins = curMins;
            // 如果当前时间是凌晨，且该作息也是跨夜到凌晨的
            if (curMins < sMins && sMins > 12 * 60 && curMins < 12 * 60) checkMins += 24 * 60; 

            if (checkMins >= sMins && checkMins < eMins) {
                activeItem = item;
                break;
            }
        }

        if (activeItem) {
            return `\n\n【🗓️ 当前作息状态锚定 (CHRONOS ENGINE)】
[根据你的日程表，你现在的状态是]：${activeItem.title} (${activeItem.start}-${activeItem.end})
[状态标识]：${activeItem.tag}
[状态详情]：${activeItem.desc}
🚨 【强制指令】：你在接下来的回复中，必须严格表现出上述的状态！
- 如果你处于 DND (勿扰/工作) 状态：请表现得心不在焉、非常敷衍、回复极短，或者直接说明你正在忙。
- 如果你处于 FREE (空闲) 状态：你可以秒回，语气轻松。
- 如果你处于 PRIVATE (休息/独处) 状态：请表现出防备心降低的疲惫感或暧昧感。`;
        }
        return "";
    }
};

(function () {
    function bootChronos() {
        try { window.Chronos.init(); } catch (e) { console.error('[Chronos] init failed:', e); }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootChronos);
    } else {
        bootChronos();
    }
})();
