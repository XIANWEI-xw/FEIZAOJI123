         // ================= 高定电话系统核心引擎 =================
         
         // ================= 高定电话系统核心引擎 =================
         
         let currentDialNumber = "";
         let currentCallTarget = null;
         let currentCallTranscript = [];
         let callTimerInt = null;
         let callSeconds = 0;
         
         function switchPhoneTab(tabId) {
             document.querySelectorAll('.pt-tab').forEach(t => t.classList.remove('active'));
             document.querySelectorAll('.phone-view').forEach(v => v.classList.remove('active'));
             
             let tabEl = document.getElementById('ptab-' + tabId);
             let viewEl = document.getElementById('view-' + tabId);
             if(tabEl) tabEl.classList.add('active');
             if(viewEl) viewEl.classList.add('active');
             
             const titles = { 'recents': 'RECENTS', 'network': 'NETWORK', 'keypad': 'KEYPAD' };
             if(document.getElementById('ph-title')) document.getElementById('ph-title').innerText = titles[tabId];
             
             const refreshBtn = document.getElementById('btn-phone-refresh');
             if (refreshBtn) refreshBtn.style.display = (tabId === 'network') ? 'flex' : 'none';
         
             if (tabId === 'network') renderPhoneContacts();
             if (tabId === 'recents') renderPhoneLogs();
         }
         
         function generatePhoneNumbers() {
             let changed = false;
             contacts.forEach(c => {
                 if(!c.phoneNumber) {
                     let r1 = Math.floor(100 + Math.random() * 899);
                     let r2 = Math.floor(1000 + Math.random() * 8999);
                     c.phoneNumber = `011${r1}${r2}`;
                     changed = true;
                 }
             });
             if(changed) saveData();
             renderPhoneContacts();
             alert('已扫描系统档案，缺失号码的联系人已被分配专属数字网络通道。');
         }
         
         function formatNumberDisplay(num) {
             if (!num) return '';
             if(num.length > 3 && num.length <= 6) return num.slice(0,3) + "-" + num.slice(3);
             if(num.length > 6) return num.slice(0,3) + "-" + num.slice(3,6) + "-" + num.slice(6);
             return num;
         }
         
         function renderPhoneContacts() {
             const box = document.getElementById('contact-list-ui');
             if(!box) return;
             box.innerHTML = '';
             if(contacts.length === 0) {
                 box.innerHTML = `<div style="text-align:center; padding:40px; color:var(--c-gray-dark); font-size:12px; font-weight:600;">暂无档案。请先在 Messages 中建立角色。</div>`;
                 return;
             }
             contacts.forEach(c => {
                 if(!c.phoneNumber) return;
                 const item = document.createElement('div');
                 item.className = 'contact-item';
                 item.onclick = () => {
                     currentDialNumber = c.phoneNumber;
                     updateDialDisplay();
                     switchPhoneTab('keypad');
                 };
                 item.innerHTML = `
                     <div class="c-avatar">${renderAvatarHTML(c.chatAvatar || c.avatar, 'bot')}</div>
                     <div class="c-info">
                         <div class="c-name">${c.name}</div>
                         <div class="c-num"># ${formatNumberDisplay(c.phoneNumber)}</div>
                     </div>
                     <div class="c-call-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div>
                 `;
                 box.appendChild(item);
             });
         }
         
         function renderPhoneLogs() {
             const list = document.getElementById('recent-list-ui');
             if(!list) return;
             list.innerHTML = '';
             if(phoneLogs.length === 0) {
                 list.innerHTML = `<div style="text-align:center; padding:40px; color:var(--c-gray-dark); font-size:12px; font-weight:600;">暂无通话记录。</div>`;
                 return;
             }
             phoneLogs.forEach((log, idx) => {
                 const c = contacts.find(x => x.id === log.contactId);
                 if(!c) return;
                 
                 const wrap = document.createElement('div');
                 wrap.className = 'swipe-wrapper';
         
                 const bg = document.createElement('div');
                 bg.className = 'swipe-delete-bg';
                 bg.innerText = 'DELETE';
         
                 const content = document.createElement('div');
                 content.className = log.type === 'missed' ? 'swipe-content missed' : 'swipe-content';
                 
                 let icon = log.type === 'missed' 
                     ? `<path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" transform="rotate(135 12 12)"/>`
                     : `<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/><path d="M12 2v10M8 6l4-4 4 4" style="opacity:0.6;"/>`;
         
                 let timeStr = new Date(log.id).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
         
                 content.innerHTML = `
                     <div class="log-left">
                         <div class="log-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor">${icon}</svg></div>
                         <div><div class="log-name">${c.name}</div><div class="log-type">${log.type === 'missed' ? 'MISSED CALL' : 'OUTGOING'}</div></div>
                     </div>
                     <div class="log-right">
                         <div class="log-time">${timeStr}</div>
                         <div class="log-detail" onclick="event.stopPropagation(); openPhoneDetails('${c.id}', '${log.type}', '${timeStr}', \`${log.transcript.replace(/`/g, '\\`')}\`)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></div>
                     </div>
                 `;
         
            // 物理滑动交互（优化：使用局部事件避免 document 级监听器泄漏）
                let startX = 0; let currentX = 0;
                let onMouseMove, onMouseUp;
                content.addEventListener('mousedown', e => { 
                    startX = e.clientX; content.style.transition = 'none';
                    onMouseMove = (ev) => {
                        if(startX === 0) return;
                        let delta = ev.clientX - startX;
                        if(delta > 0) { currentX = Math.min(delta, 100); content.style.transform = `translateX(${currentX}px)`; }
                    };
                    onMouseUp = () => {
                        document.removeEventListener('mousemove', onMouseMove);
                        document.removeEventListener('mouseup', onMouseUp);
                        startX = 0; content.style.transition = 'transform 0.2s';
                        if(currentX > 60) { phoneLogs.splice(idx, 1); saveData(); renderPhoneLogs(); }
                        else { currentX = 0; content.style.transform = `translateX(0px)`; }
                    };
                    document.addEventListener('mousemove', onMouseMove);
                    document.addEventListener('mouseup', onMouseUp);
                });
          
                content.addEventListener('touchstart', e => { startX = e.touches[0].clientX; content.style.transition = 'none'; }, {passive:true});
                content.addEventListener('touchmove', e => {
                    if(startX === 0) return;
                    let delta = e.touches[0].clientX - startX;
                    if(delta > 0) { currentX = Math.min(delta, 100); content.style.transform = `translateX(${currentX}px)`; }
                }, {passive:true});
                content.addEventListener('touchend', () => {
                    if(startX === 0) return;
                    startX = 0; content.style.transition = 'transform 0.2s';
                    if(currentX > 60) { 
                        phoneLogs.splice(idx, 1); 
                        saveData();
                        renderPhoneLogs(); 
                    } else { 
                        currentX = 0; content.style.transform = `translateX(0px)`; 
                    }
                });
         
                 wrap.appendChild(bg);
                 wrap.appendChild(content);
                 list.appendChild(wrap);
             });
         }
         
         function appendNumber(num) {
             if(currentDialNumber.length < 15) { currentDialNumber += num; updateDialDisplay(); }
         }
         
         function deleteNumber() {
             if(currentDialNumber.length > 0) { currentDialNumber = currentDialNumber.slice(0, -1); updateDialDisplay(); }
         }
         
         function updateDialDisplay() {
             document.getElementById('dial-number').innerText = formatNumberDisplay(currentDialNumber);
             
             const delBtn = document.getElementById('btn-delete');
             if(currentDialNumber.length > 0) delBtn.classList.add('show');
             else delBtn.classList.remove('show');
         
             const matchLabel = document.getElementById('dial-match');
             let matchedContact = contacts.find(c => c.phoneNumber === currentDialNumber);
             if(matchedContact) {
                 matchLabel.innerText = "匹配身份: " + matchedContact.name;
                 matchLabel.classList.add('show');
             } else {
                 matchLabel.classList.remove('show');
             }
         }
         
         function executeCall() {
             if(!currentDialNumber) return;
             let matchedContact = contacts.find(c => c.phoneNumber === currentDialNumber);
             
             if(!matchedContact) {
                 alert('空号：该号码未连接到任何系统档案。');
                 currentDialNumber = ""; updateDialDisplay();
                 return;
             }
         
             startOutgoingCall(matchedContact);
             currentDialNumber = ""; updateDialDisplay();
         }
         
         function startOutgoingCall(contact) {
             currentCallTarget = contact;
             currentCallTranscript = [];
             
             // 呼叫中界面的信息
             document.getElementById('call-screen-name').innerText = contact.name;
             document.getElementById('call-screen-type').innerText = 'ENCRYPTED VOICE CALL';
             document.getElementById('call-screen-status').innerText = '正在接通...';
             document.getElementById('call-screen-avatar').innerHTML = renderAvatarHTML(contact.chatAvatar || contact.avatar, 'bot');
             document.getElementById('call-screen-avatar').style.overflow = 'hidden';
         
             // 接通后界面的信息 (修复头像丢失)
             document.getElementById('pc-caller-name').innerText = contact.name;
             document.getElementById('pc-caller-avatar').innerHTML = renderAvatarHTML(contact.chatAvatar || contact.avatar, 'bot');
             document.getElementById('pc-caller-avatar').style.overflow = 'hidden';
         
             document.getElementById('call-content-main').style.display = 'none';
             document.getElementById('phone-call-ui').style.display = 'flex';
             
             // 重置幽灵字幕和声纹状态
             document.getElementById('ghost-box').innerHTML = '';
             const actionEl = document.getElementById('voice-action');
             actionEl.innerText = "... 正在连接 ...";
             actionEl.classList.remove('active');
             document.getElementById('voice-wave').classList.remove('speaking');
             
             // 计时器重置
             callSeconds = 0;
             document.getElementById('pc-call-timer').innerText = '00:00';
             clearInterval(callTimerInt);
             callTimerInt = setInterval(() => {
                 callSeconds++;
                 let m = Math.floor(callSeconds / 60).toString().padStart(2,'0');
                 let s = (callSeconds % 60).toString().padStart(2,'0');
                 document.getElementById('pc-call-timer').innerText = `${m}:${s}`;
             }, 1000);
         
             // 生成满屏的童话星星特效
             const box = document.getElementById('star-box');
             if (box) {
                 box.innerHTML = '';
                 const stars = ['★', '✩', '✦', '✧', '·'];
                 for (let i = 0; i < 30; i++) {
                     let star = document.createElement('div');
                     star.className = 'falling-star';
                     star.innerText = stars[Math.floor(Math.random() * stars.length)];
                     star.style.left = Math.random() * 100 + '%';
                     star.style.animationDuration = (Math.random() * 8 + 4) + 's';
                     star.style.animationDelay = (Math.random() * 5) + 's';
                     star.style.fontSize = (Math.random() * 10 + 6) + 'px';
                     star.style.opacity = Math.random() * 0.5 + 0.1;
                     box.appendChild(star);
                 }
             }
             
             document.getElementById('call-screen').classList.add('active');
         
             // 模拟接通后的环境音反馈，静待任何一方先开口
             setTimeout(() => {
                 actionEl.innerText = "[ 电话已接通，传来轻微的环境回声... ]";
                 actionEl.classList.add('active');
                 document.getElementById('voice-wave').classList.add('speaking');
                 
                 setTimeout(() => {
                     document.getElementById('voice-wave').classList.remove('speaking');
                     actionEl.classList.remove('active');
                 }, 2000);
             }, 1500);
         }
         
         // ================= 核心：幽灵字幕物理引擎 (动态双模融合版) =================
         function appendGhostLine(role, text) {
             const transcript = document.getElementById('ghost-box');
             
             // 绑定滚动监听，实现滑动时自动解除 3D 封印
             if (!transcript.onscroll) {
                 transcript.onscroll = () => requestAnimationFrame(updateGhostPhysics);
             }
         
             const line = document.createElement('div');
             line.className = `ghost-line ${role}`;
             line.innerText = text;
             transcript.appendChild(line);
         
             // 保证DOM渲染后，强制滚动到底部并触发物理引擎
             setTimeout(() => {
                 transcript.scrollTop = transcript.scrollHeight;
                 updateGhostPhysics();
             }, 50);
         }
         
         function updateGhostPhysics() {
             const transcript = document.getElementById('ghost-box');
             const lines = Array.from(transcript.querySelectorAll('.ghost-line')).reverse();
             
             // 核心判定：用户是不是在最底部？(允许 20px 的误差)
             const isAtBottom = (transcript.scrollHeight - transcript.scrollTop - transcript.clientHeight) < 20;
         
             if (isAtBottom) {
                 // 【实时模式】：你在最底部时，恢复你最爱的 3D 渐隐消失效果，绝不删除历史节点！
                 lines.forEach((line, index) => {
                     line.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
                     if (index === 0) {
                         line.style.opacity = '1';
                         line.style.transform = 'translateY(0) scale(1)';
                         line.style.filter = 'blur(0px)';
                     } else if (index === 1) {
                         line.style.opacity = '0.5';
                         line.style.transform = 'translateY(-10px) scale(0.95)';
                         line.style.filter = 'blur(0.5px)';
                     } else if (index === 2) {
                         line.style.opacity = '0.2';
                         line.style.transform = 'translateY(-20px) scale(0.9)';
                         line.style.filter = 'blur(1.5px)';
                     } else {
                         line.style.opacity = '0';
                         line.style.transform = 'translateY(-30px) scale(0.8)';
                         line.style.filter = 'blur(4px)';
                     }
                 });
             } else {
                 // 【阅读历史模式】：只要手指往上划，全部文字瞬间清晰可见，方便回顾对话！
                 lines.forEach((line) => {
                     line.style.transition = 'all 0.3s ease';
                     line.style.opacity = '1';
                     line.style.transform = 'translateY(0) scale(1)';
                     line.style.filter = 'blur(0px)';
                 });
             }
         }
         
         async function sendPhoneMsg() {
             const input = document.getElementById('call-input');
             const sendBtn = document.getElementById('call-btn-send');
             const text = input.value.trim();
             
             if(!currentCallTarget) return;
         
             // 如果输入框有文字：只发送给对方，不拉取AI回复（允许玩家连发多条）
             if (text) {
                 input.value = '';
                 appendGhostLine('user', text);
                 currentCallTranscript.push({role: 'user', content: text});
                 return; // 直接中止，绝不触发底下的 AI 拉取逻辑
             }
         
             // 如果输入框为空（且刚才已经发过话了）：触发拉取 AI 回复
             if (currentCallTranscript.length === 0 || currentCallTranscript[currentCallTranscript.length - 1].role === 'assistant') {
                 return; // 如果还没说过话，或者上句已经是AI说的，点空发送没意义
             }
         
             input.disabled = true;
             sendBtn.disabled = true;
         
             // 插入打字中的动态跳动点
             const typingId = 'ghost-typing-' + Date.now();
             const transcript = document.getElementById('ghost-box');
             
             // 如果还没注入跳动动画的 CSS，就悄悄注入一次
             if (!document.getElementById('ghost-jump-css')) {
                 const style = document.createElement('style');
                 style.id = 'ghost-jump-css';
                 style.innerHTML = `@keyframes gJmp { 0%, 100% { transform: translateY(0); opacity: 0.3; } 50% { transform: translateY(-4px); opacity: 1; text-shadow: 0 0 10px rgba(168,192,255,0.8); } } .g-dot { display: inline-block; width: 6px; height: 6px; background: currentColor; border-radius: 50%; margin: 0 3px; animation: gJmp 1.2s infinite ease-in-out; } .g-dot:nth-child(1) { animation-delay: 0s; } .g-dot:nth-child(2) { animation-delay: 0.2s; } .g-dot:nth-child(3) { animation-delay: 0.4s; }`;
                 document.head.appendChild(style);
             }
         
             const typingLine = document.createElement('div');
             typingLine.className = `ghost-line bot`;
             typingLine.id = typingId;
             // 把死板的文本换成带有独立动画的圆点
             typingLine.innerHTML = `<span class="g-dot"></span><span class="g-dot"></span><span class="g-dot"></span>`;
             transcript.appendChild(typingLine);
             void typingLine.offsetWidth;
             updateGhostPhysics();
         
             let c = currentCallTarget;
             let sysPrompt = c.history[0].content;
             let uName = gConfig.meName || '我';
             if(c.maskId) { const m = masks.find(x=>x.id===c.maskId); if(m) uName = m.name; }
         
             // ⌚【电话专属：超强环境与生理时钟感知引擎 (人设绝对优先版)】
             if (c.awareTime === true) { 
                 const now = new Date(); 
                 const h = now.getHours();
                 const mi = now.getMinutes();
                 const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
                 
                 let timeDesc;
                 if (h >= 0 && h < 5) timeDesc = "凌晨/深夜 (夜深人静的时刻)";
                 else if (h >= 5 && h < 8) timeDesc = "清晨 (天刚亮)";
                 else if (h >= 8 && h < 12) timeDesc = "上午 (白天)";
                 else if (h >= 12 && h < 14) timeDesc = "中午 (午间)";
                 else if (h >= 14 && h < 17) timeDesc = "下午 (白天)";
                 else if (h >= 17 && h < 19) timeDesc = "傍晚 (日落时分)";
                 else if (h >= 19 && h < 22) timeDesc = "晚上 (天已黑)";
                 else timeDesc = "深夜 (夜色深沉)";
                 
                 sysPrompt += `\n\n【⌚ 电话专属时空同步雷达】：你们正在【打实时语音电话】！当前精确时间是 ${h}时${mi}分，${weekDays[now.getDay()]}，属于【${timeDesc}】。
         【最高红线指令 - 人设绝对优先】：
         接起电话的瞬间，你的第一句语气词、嗓音状态以及你周围的环境音描写（用*包裹*），【必须首先绝对服从你的角色设定】！
         在此基础上，请合理感知当前的时间点。比如大半夜接到电话，如果你的角色是普通人，可能带有浓浓的困意或起床气；如果你的角色是夜猫子、工作狂、或者特殊身份(如特工/吸血鬼)，则应表现出符合人设的清醒度与相应的环境音(如敲击键盘声/夜风声)。绝不允许为了迎合时间而做出违背人设的行为（OOC）！`; 
             }
         
             sysPrompt += `\n\n==================================================
         【🚨 最高系统覆盖协议：已切入实时语音通话模式 🚨】
         ==================================================
         注意：你现在不是在发文字消息！你正在和 ${uName} 进行【纯语音电话】！
         从现在起，严格遵循以下铁律，否则系统将立即崩溃：
         
         1. 🛑 彻底抛弃旧格式：历史记录里的 <thought>, <split>, <bpm>, <affection>, <mood> 等所有尖括号标签在电话模式下【全面封杀】！绝不允许输出这些标签，也绝不允许写内心独白（用户听不到你在想什么！）。
         2. 🎭 动作与环境音：所有的动作、表情、语气、呼吸声、环境音，【必须且只能】用英文星号 * 包裹，放在句子开头或中间。
         3. 🗣️ 纯粹的口语化：你是在“说话”！必须使用口语，多用“喂”、“嗯”、“嘶”、“啊”等语气词，切忌长篇大论和书面语。
         
         ✅ 正确满分示范：
         *电话那边传来衣物摩擦的声音，嗓音带着刚睡醒的极度沙哑* 喂……嗯？怎么在这个时候打电话……
         
         ❌ 死亡错误示范（一旦出现直接判定失败）：
         <thought>他怎么突然打电话了？</thought> 喂？ <split> <bpm>80</bpm><affection>50</affection><mood>50</mood>`;
         
             let apiMsgs = [{role: 'system', content: sysPrompt}];
             
             // 核心洗脑净化：提取最近历史作为上下文，但必须做极限净化！防止它看着以前带有标签的记录学坏！
             let recentHist = c.history.filter(m => !m.isRevoked && m.role !== 'system_sum').slice(-8);
             recentHist.forEach(m => {
                 let cleanContent = m.content;
                 if (m.role === 'assistant') {
                     // 连带内容一起抹除所有的内心戏和属性数值面板，彻底阻断AI的模仿链
                     cleanContent = cleanContent.replace(/<thought>[\s\S]*?<\/thought>/gi, '');
                     cleanContent = cleanContent.replace(/<(bpm|affection|mood|split|react|send_[a-zA-Z]+)[^>]*>[\s\S]*?<\/\1>/gi, '');
                     // 清理剩下的杂余HTML标签
                     cleanContent = cleanContent.replace(/<[^>]+>/g, '');
                 } else {
                     cleanContent = cleanContent.replace(/<[^>]+>/g, '');
                 }
                 if (cleanContent.trim()) {
                     apiMsgs.push({role: m.role === 'assistant' ? 'assistant' : 'user', content: cleanContent.trim()});
                 }
             }); 
             
             currentCallTranscript.forEach(m => apiMsgs.push({role: m.role, content: m.content}));
         
             try {
                 const res = await fetch(`${gConfig.apiUrl}/v1/chat/completions`, {
                     method: 'POST', headers: { 'Authorization': `Bearer ${gConfig.apiKey}`, 'Content-Type': 'application/json' }, 
                     body: JSON.stringify({ model: gConfig.model, messages: apiMsgs, temperature: Number(gConfig.temperature || 0.7) })
                 });
                 
                 // 🎯 电话系统防断线解包
                 if (!res.ok) {
                     let errorDetail = `HTTP ${res.status}`;
                     try {
                         const errJson = await res.json();
                         if (errJson.error && errJson.error.message) errorDetail += ` ${errJson.error.message}`;
                     } catch (e) {}
                     throw new Error(errorDetail);
                 }
                 const data = await res.json();
                 
                 // 🎯 核心斩草除根：连带内容一起彻底删除内心戏和数值残留，防止漏成零碎文字
                 let rawContent = data.choices[0].message.content;
                 
                 // 1. 连根拔除：删掉 <thought>内容</thought> 以及 <bpm>75</bpm> 这种连带数字的标签
rawContent = rawContent.replace(/<thought>[\s\S]*?<\/thought>/gi, '');
rawContent = rawContent.replace(/<(bpm|affection|mood|split|react|post_twitter|send_[a-zA-Z]+)[^>]*>[\s\S]*?<\/\1>/gi, '');
                 
                 // 2. 清理所有孤立的、没有闭合的尖括号残留
                 rawContent = rawContent.replace(/<[^>]+>/g, '');
                 
                 let rawReply = rawContent.trim();
                 
                 // 动态解析AI的 *神态动作*，实现视觉分离
                 let actionText = "[ 电话那头传来轻微的呼吸声 ]"; 
                 let actionMatch = rawReply.match(/\*([^*]+)\*/);
                 
                 if (actionMatch) {
                     // 将动作提取出来并套上括号展示在环境音区域
                     actionText = `[ ${actionMatch[1].trim()} ]`;
                     // 从语音字幕中彻底剔除这部分动作
                     rawReply = rawReply.replace(/\*([^*]+)\*/g, '').trim();
                 }
                 
                 // 防御机制：如果AI只发了动作没说话，补个省略号防止空隙
                 if (!rawReply) rawReply = "…";
                 
                 const tEl = document.getElementById(typingId);
                 if(tEl) tEl.remove();
         
                 const actionEl = document.getElementById('voice-action');
                 actionEl.innerText = actionText;
                 actionEl.classList.add('active');
                 document.getElementById('voice-wave').classList.add('speaking');
         
                 // 为了保存录音档案的完整性，将带有动作的完整内容保存到记录里
                 currentCallTranscript.push({role: 'assistant', content: data.choices[0].message.content.replace(/<[^>]+>/g, '').trim()});
         
                 // 核心机制：将长篇大论按标点符号切分，变成一句一句！
                 // 按照 中/英文的句号、问号、叹号、省略号以及换行符 进行断句
                 let sentences = rawReply.match(/[^。？！…\n.?!]+[。？！…\n.?!]*/g) || [rawReply];
                 sentences = sentences.map(s => s.trim()).filter(s => s);
                 if (sentences.length === 0) sentences = ["…"];
         
                 // 异步逐句发送引擎
                 for (let i = 0; i < sentences.length; i++) {
                     appendGhostLine('bot', sentences[i]);
                     
                     // 根据句子的字数动态计算停顿时间：每字150ms，最短停顿800ms，最长不超过3秒
                     let speakTime = Math.max(800, Math.min(3000, sentences[i].length * 150));
                     
                     // 必须使用 await 锁死流程，让这句话“说”完，再发下一句
                     await new Promise(r => setTimeout(r, speakTime));
                 }
         
                 // 所有的句子都发完了，关闭声纹波动和动作提示
                 document.getElementById('voice-wave').classList.remove('speaking');
                 actionEl.classList.remove('active');
         
             } catch(e) {
                 const tEl = document.getElementById(typingId);
                 if(tEl) tEl.remove();
                 document.getElementById('voice-wave').classList.add('speaking');
                 appendGhostLine('bot', '[信号干扰... 滋滋...]');
                 setTimeout(() => {
                     document.getElementById('voice-wave').classList.remove('speaking');
                 }, 1500);
             } finally {
                 input.disabled = false;
                 sendBtn.disabled = false;
             }
         }
         
         function hangUpPhone() {
             if(currentCallTranscript.length > 0 && currentCallTarget) {
                 let c = currentCallTarget;
                 
                 // 核心修改：将录音档案中的名字强制替换为 {{user}} 和 {{char}} 宏变量
                 let logText = currentCallTranscript.map(m => `${m.role === 'user' ? '{{user}}' : '{{char}}'}: ${m.content}`).join('\n');
                 let dateStr = new Date().toLocaleString();
                 
                 // 将替换好宏变量的文本存入核心记忆
                 c.memory = (c.memory ? c.memory + '\n\n' : '') + `[${dateStr} 电话录音档案]\n${logText}`;
                 
                 // 界面上依然展示美观的正常名字
                 c.history.push({role: 'system_sum', content: `<i>✧ 与 ${c.name} 进行了一次语音通话，录音已存入长期记忆档案。</i>`});
                 
                 phoneLogs.unshift({
                     id: Date.now(),
                     contactId: c.id,
                     time: dateStr,
                     type: 'answered',
                     transcript: logText
                 });
                 
                 saveData();
                 if(currentContactId === c.id) renderChatHistory();
                 renderPhoneLogs();
             }
             
             document.getElementById('call-screen').classList.remove('active');
             setTimeout(() => {
                 document.getElementById('call-content-main').style.display = 'flex';
                 document.getElementById('phone-call-ui').style.display = 'none';
             }, 400);
             
             currentCallTarget = null;
             currentCallTranscript = [];
         }
         
         function openPhoneDetails(contactId, status = 'Incoming', time = 'Now', transcript = '') {
             const c = contacts.find(x => x.id === contactId);
             if (!c) return;
             
             document.getElementById('dp-name').innerText = c.name;
             document.getElementById('dp-number').innerText = "# " + formatNumberDisplay(c.phoneNumber);
             
             // 核心修复：精准渲染该联系人的专属头像
             const avatarBox = document.getElementById('dp-avatar');
             avatarBox.innerHTML = renderAvatarHTML(c.chatAvatar || c.avatar, 'bot');
             
             // 💥 物理尺寸锁死：强制让里面的图片乖乖按 100% 比例填满，绝不撑爆屏幕
             const innerEl = avatarBox.firstElementChild;
             if(innerEl) {
                 innerEl.style.width = '100%';
                 innerEl.style.height = '100%';
                 innerEl.style.objectFit = 'cover';
                 innerEl.style.borderRadius = 'inherit';
             }
             
             const statusEl = document.getElementById('dp-status');
             if(status === 'missed') {
                 statusEl.innerText = "Missed Call (未接)";
                 statusEl.style.color = "#D32F2F";
             } else {
                 statusEl.innerText = "Answered (已接通)";
                 statusEl.style.color = "var(--c-black)";
             }
             
             document.getElementById('dp-time').innerText = time;
             
             const tbBox = document.getElementById('dp-transcript-box');
             if(transcript) {
                 tbBox.style.display = 'block';
                 document.getElementById('dp-content').innerHTML = transcript.replace(/\n/g, '<br><br>');
             } else {
                 tbBox.style.display = 'none';
             }
             document.getElementById('phone-detail-panel').classList.add('open');
         }
         
         function closePhoneDetails() {
             document.getElementById('phone-detail-panel').classList.remove('open');
         }
         
         // ================= 高定 3D 坐标沙盘逻辑 =================
         function openLocationModal() {
             closeChatMenu();
             document.getElementById('location-modal').classList.add('active');
         }
         function closeLocationModal() {
             document.getElementById('location-modal').classList.remove('active');
         }
         
         // 增加 isUser 参数，用于判断气泡在屏幕左边还是右边，以便精确抹除排版留白
         function generateLocHtml(name, desc, isUser = true) {
             const lat = (Math.random() * 90).toFixed(2);
             const lng = (Math.random() * 180).toFixed(2);
             const coordsStr = `${Math.random() > 0.5 ? 'N' : 'S'} ${lat}° ${Math.random() > 0.5 ? 'E' : 'W'} ${lng}°`;
             const rId = Date.now() + Math.floor(Math.random() * 1000); 
             
             // 核心法宝：根据气泡位置加一个压缩包装层（0.78的比例），并用负边距吃掉留白
             let scaleWrapperStyle = isUser 
                 ? `transform: scale(0.78); transform-origin: top right; margin-left: -59px; margin-bottom: -80px; margin-top: 5px;` 
                 : `transform: scale(0.78); transform-origin: top left; margin-right: -59px; margin-bottom: -80px; margin-top: 5px;`;
             
             return `<div style="${scaleWrapperStyle}">
                 <div class="loc-card-shell">
                     <div class="silk-wrap"><div class="silk-band"></div><svg class="silk-bow bow-top" viewBox="0 0 100 80" style="fill:none; stroke:none;"><defs><linearGradient id="silkGrad_${rId}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#4A4A4A"/><stop offset="25%" stop-color="#050505"/><stop offset="50%" stop-color="#2C2C2C"/><stop offset="75%" stop-color="#000000"/><stop offset="100%" stop-color="#1A1A1A"/></linearGradient></defs><g filter="drop-shadow(0 4px 4px rgba(0,0,0,0.5))"><path d="M40,46 L24,78 L36,78 L48,46 Z" fill="url(#silkGrad_${rId})"/><path d="M60,46 L76,78 L64,78 L52,46 Z" fill="url(#silkGrad_${rId})"/><path d="M38,36 L12,28 L10,46 L38,46 Z" fill="url(#silkGrad_${rId})"/><path d="M62,36 L88,28 L90,46 L62,46 Z" fill="url(#silkGrad_${rId})"/><path d="M38,46 L10,46 L24,54 L38,48 Z" fill="#000"/><path d="M62,46 L90,46 L76,54 L62,48 Z" fill="#000"/><rect x="41" y="35" width="18" height="14" rx="2" fill="url(#silkGrad_${rId})" stroke="rgba(255,255,255,0.2)" stroke-width="1"/><line x1="45" y1="36" x2="45" y2="48" stroke="rgba(255,255,255,0.2)" stroke-width="1" stroke-dasharray="2 1"/><line x1="55" y1="36" x2="55" y2="48" stroke="rgba(255,255,255,0.2)" stroke-width="1" stroke-dasharray="2 1"/></g></svg><svg class="silk-bow bow-bottom" viewBox="0 0 100 80" style="fill:none; stroke:none;"><g filter="drop-shadow(0 4px 4px rgba(0,0,0,0.5))"><path d="M40,46 L24,78 L36,78 L48,46 Z" fill="url(#silkGrad_${rId})"/><path d="M60,46 L76,78 L64,78 L52,46 Z" fill="url(#silkGrad_${rId})"/><path d="M38,36 L12,28 L10,46 L38,46 Z" fill="url(#silkGrad_${rId})"/><path d="M62,36 L88,28 L90,46 L62,46 Z" fill="url(#silkGrad_${rId})"/><path d="M38,46 L10,46 L24,54 L38,48 Z" fill="#000"/><path d="M62,46 L90,46 L76,54 L62,48 Z" fill="#000"/><rect x="41" y="35" width="18" height="14" rx="2" fill="url(#silkGrad_${rId})" stroke="rgba(255,255,255,0.2)" stroke-width="1"/><line x1="45" y1="36" x2="45" y2="48" stroke="rgba(255,255,255,0.2)" stroke-width="1" stroke-dasharray="2 1"/><line x1="55" y1="36" x2="55" y2="48" stroke="rgba(255,255,255,0.2)" stroke-width="1" stroke-dasharray="2 1"/></g></svg></div>
                     <div class="vertical-coords">${coordsStr}</div>
                     <div class="lens-container"><div class="lens-frame soap-3d-stage"><div class="stage-3d object-3d"><div class="layer-grid"></div><div class="layer-shadow"></div><div class="layer-topo"></div><div class="layer-pin"><div class="pin-beam"></div><svg class="pin-svg" viewBox="0 0 24 24" fill="none"><path d="M12 21.5C12 21.5 4 14.5 4 9C4 4.58172 7.58172 1 12 1C16.4183 1 20 4.58172 20 9C20 14.5 12 21.5 12 21.5Z" stroke="#1C1C1E" stroke-width="1.5" stroke-linejoin="round"/><circle cx="12" cy="9" r="3" fill="#D32F2F"/><circle cx="12" cy="9" r="4.5" stroke="rgba(183,28,28,0.3)" stroke-width="1"/></svg></div></div></div></div>
                     <div class="loc-info-read"><div class="live-status"><div class="live-dot"></div> LIVE TRACKING</div><div class="loc-title">${name}</div><div class="loc-desc">${desc}</div><div class="nav-ring"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="2"/></svg></div></div>
                 </div>
             </div><img src="1" onerror="this.parentNode.classList.add('bubble-clear'); this.parentNode.style.background='transparent'; this.parentNode.style.border='none'; this.parentNode.style.boxShadow='none'; this.parentNode.style.padding='0'; this.remove();">`;
         }
         
         // 用户主动发定位
         function sendLocationCard() {
             if(!currentContactId) return alert("请先进入聊天室！");
             const name = document.getElementById('loc-input-name').value.trim() || 'UNKNOWN AREA';
             const desc = document.getElementById('loc-input-desc').value.trim() || 'Target Locked';
             
             const c = contacts.find(x => x.id === currentContactId);
             let cardHtml = generateLocHtml(name, desc);
             let aiText = `[系统通报：用户向你共享了一个私人坐标情报。地点：${name}，留言：${desc}。请根据你们的关系给出反应。]`;
         
             const newMsg = { role: 'user', content: cardHtml.replace(/\n\s+/g, ''), isRevoked: false, timestamp: Date.now() };
             c.history.push(newMsg);
             c.history.push({role: 'system_sum', content: `<span style="display:none;">${aiText}</span>`});
         
             saveData(); appendBubbleRow(newMsg, c.history.length - 2); closeLocationModal();
         }
         
         // ================= 一起听卡片生成器与控制引擎 =================
         function generateSyncCardHtml(isAccepted = false, isUser = true, songData = null) {
             let modeClass = isAccepted ? "dark" : "light";
             let btnClass = isAccepted ? "sc-dark-btn" : "sc-light-btn";
             
             // 核心修改：如果是已连通，或者这是“你发出的邀请”，按钮都变成一键跳转音乐室
             let isJumpMode = isAccepted || (isUser && !isAccepted);
             
             let btnIcon = isJumpMode
                 ? `<svg viewBox="0 0 24 24" style="width:12px;"><path d="M4 11h12.172l-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2z"/></svg><span>ENTER SESSION</span>`
                 : `<svg viewBox="0 0 24 24" style="width:10px;"><path d="M8 5v14l11-7z"/></svg><span>JOIN SYNC</span>`;
                 
             let statusText = isAccepted ? "SYNC ACTIVE" : "SYNC ROOM";
             let title1 = isAccepted ? "Resonating<br>Now..." : "Listen<br>Together";
             let title2 = isAccepted ? "CONNECTED" : "RESONANCE";
             
             let coverHtml = "";
             let vinylTextHtml = "";
             
             // 核心修改：如果是你发出的卡片，点击直接穿越回音乐软件（先关掉聊天室，再瞬间切进音乐厅）
             let actionHandler = isJumpMode 
                 ? `onclick="event.stopPropagation(); document.getElementById('app-messages').classList.remove('active'); setTimeout(()=>openApp('music'), 50);"` 
                 : `onclick="event.stopPropagation(); handleSyncCardAction(this, 'accept');"`; 
             
             if (songData && songData.title) {
                 coverHtml = `<div class="card-cover-bg" style="background-image: url('${songData.img}');"></div>`;
                 let textPath = isAccepted ? "curve-dark" : "curve-light";
                 let safeTitle = songData.title.replace(/'/g, "");
                 let safeArtist = songData.artist ? songData.artist.replace(/'/g, "") : "";
                 vinylTextHtml = `<svg class="sc-vinyl-text-svg" viewBox="0 0 100 100"><path id="${textPath}" d="M 50, 26 a 24,24 0 1,1 -0.1,0" fill="none"/><text font-family="'Space Mono', monospace" font-size="6" font-weight="700" fill="rgba(255,255,255,0.45)" letter-spacing="1"><textPath href="#${textPath}" startOffset="0%">SOAP SYMPHONY ✦ ${safeArtist} - ${safeTitle} ✦</textPath></text></svg>`;
             } else {
                 coverHtml = `<div class="card-overlay no-img-overlay"></div>`;
             }
         
             let scaleWrapperStyle = isUser 
                 ? `transform: scale(0.78); transform-origin: top right; margin-left: -59px; margin-bottom: -51px; margin-top: 5px;` 
                 : `transform: scale(0.78); transform-origin: top left; margin-right: -59px; margin-bottom: -51px; margin-top: 5px;`;
         
             return `<div style="${scaleWrapperStyle}">
                 <div class="sync-invite-wrap" data-song='${songData ? JSON.stringify(songData).replace(/'/g, "&#39;") : ""}'>
                     <div class="sync-card ${modeClass}">
                         ${coverHtml}
                         <div class="card-overlay"></div>
                         <div class="sc-glass-plane"></div><div class="sc-accent-plane"></div>
                         <div class="sc-deco-frame"></div>
                         <div class="sc-deco-corner tl"></div><div class="sc-deco-corner tr"></div>
                         <div class="sc-deco-corner bl"></div><div class="sc-deco-corner br"></div>
                         <div class="sc-deco-line-v1"></div><div class="sc-deco-line-h1"></div>
                         <div class="sc-soundwave"><span></span><span></span><span></span><span></span><span></span></div>
                         <div class="crosshair ch-1"></div><div class="crosshair ch-2"></div>
                         <div class="blinking-dot"></div>
                         <div class="sc-vinyl-stage">
                             <div class="sc-vinyl-disc">
                                 <div class="sc-vinyl-reflection"></div>
                                 ${vinylTextHtml}
                                 <div class="sc-vinyl-center"><div class="sc-vinyl-hole"></div></div>
                             </div>
                             <svg class="sc-tonearm" viewBox="0 0 60 90" fill="none">
                                 <circle cx="12" cy="12" r="10" fill="${isAccepted ? '#2A2A2A' : '#F4F4F4'}" stroke="${isAccepted ? '#444' : '#CCC'}" stroke-width="1"/>
                                 <circle cx="12" cy="12" r="4" fill="${isAccepted ? '#000' : '#111'}"/><circle cx="12" cy="12" r="1.5" fill="${isAccepted ? '#555' : '#FFF'}"/>
                                 <path d="M 12 12 C 12 50, 42 65, 50 80" stroke="${isAccepted ? '#777' : '#A0A0A0'}" stroke-width="2" stroke-linecap="round"/>
                                 <rect x="45" y="78" width="7" height="14" rx="1" transform="rotate(-22 48.5 85)" fill="${isAccepted ? '#000' : '#111'}"/>
                                 <line x1="48.5" y1="92" x2="48.5" y2="94" stroke="${isAccepted ? '#777' : '#A0A0A0'}" stroke-width="1" transform="rotate(-22 48.5 92)"/>
                             </svg>
                         </div>
                         <div class="sc-typography">
                             <div class="sc-top-status">${statusText}</div>
                             <div class="sc-main-invite">
                                 <div class="sc-title-serif">${title1}</div>
                                 <div class="sc-title-sans">${title2}</div>
                             </div>
                         </div>
                     </div>
                     <div class="sc-outbox-btn ${btnClass}" ${actionHandler}>${btnIcon}</div>
                     ${(!isAccepted && !isUser) ? `<div class="bc-action-bar" style="margin-top: 10px; width: 100%; justify-content: center;"><div class="bc-btn reject" onclick="handleSyncCardAction(this, 'reject')" style="font-size:10px; padding:6px 18px; border-radius:4px; letter-spacing:2px; font-weight:700;">残忍拒绝</div></div>` : ''}
                 </div>
             </div><img src="1" onerror="this.parentNode.classList.add('bubble-clear'); this.remove();">`;
         }
         
         function sendSyncInvite() {
             if(!currentContactId) return alert("请先进入聊天室！");
             const c = contacts.find(x => x.id === currentContactId);
             
             let songData = null;
             let aiText = "";
             if (typeof globalIsPlaying !== 'undefined' && globalIsPlaying && currentPlayingData) {
                 songData = { title: currentPlayingData.title, artist: currentPlayingData.artist, img: currentPlayingData.img };
                 let lyricSample = "";
                 if (currentPlayingData.parsedLyrics && typeof currentActiveGroupIndex !== 'undefined' && currentActiveGroupIndex >= 0 && currentLyricsArray[currentActiveGroupIndex]) {
                     lyricSample = currentLyricsArray[currentActiveGroupIndex].lines.join(' ');
                 }
                 let lyricInfo = lyricSample ? `，当前耳机里正好唱到：“${lyricSample}”` : '';
                 
                 aiText = `[系统通报：用户向你发送了【专属音乐共听邀请】！指定的曲目是《${songData.title}》${lyricInfo}。如果你愿意戴上耳机和TA一起听，请在回复中输出 <accept> 指令；如果不愿意，请输出 <reject> 指令。]`;
             } else {
                 aiText = `[系统通报：用户向你发送了【盲盒音乐共听邀请】！不知道是什么歌，等待你戴上耳机。如果你愿意一起听，请在回复中输出 <accept> 指令；如果不愿意，请输出 <reject> 指令。]`;
             }
             
             let cardHtml = generateSyncCardHtml(false, true, songData);
             
             const newMsg = { role: 'user', content: cardHtml.replace(/\n\s+/g, ''), isRevoked: false, timestamp: Date.now() };
             c.history.push(newMsg);
             c.history.push({role: 'system_sum', content: `<span style="display:none;">${aiText}</span>`});
         
             saveData(); 
             appendBubbleRow(newMsg, c.history.length - 2); 
             closeChatMenu();
         }
         
         function handleSyncCardAction(btnEl, actionType) {
             const row = btnEl.closest('.msg-row');
             if(!row) return;
             if(row.classList.contains('user')) return alert('这是你发出的邀请，等对方同意吧！');
         
             btnEl.style.pointerEvents = 'none';
             const index = parseInt(row.id.replace('msg-item-', ''));
             const c = contacts.find(x => x.id === currentContactId);
             let msg = c.history[index];
             if(!msg) return;
             
             const wrap = row.querySelector('.sync-invite-wrap');
             let songDataStr = wrap.dataset.song;
             let songData = null;
             if (songDataStr) {
                 try { songData = JSON.parse(songDataStr.replace(/&#39;/g, "'")); } catch(e) {}
             }
         
             if (actionType === 'accept') {
                 msg.content = generateSyncCardHtml(true, false, songData);
                 let liveBubble = row.querySelector('.bubble');
                 if(liveBubble) liveBubble.innerHTML = msg.content;
                 
                 let aiPrompt = `[系统通报：用户欣然接受了你的共听邀请！现在你们已经通过神经链路连在一起听歌了。]`;
                 c.history.push({ role: 'user', content: msg.content, isRevoked: false, timestamp: Date.now() });
                 c.history.push({role: 'system_sum', content: `<i>✧ 你接受了同步听歌邀请</i>\n<span style="display:none;">${aiPrompt}</span>`});
                 
                 // 自动绑定到后台音乐软件，实现真正连接！
                 currentMusicContactId = c.id;
                 const themAvatarEl = document.getElementById('music-them-avatar');
                 if (themAvatarEl) themAvatarEl.innerHTML = renderAvatarHTML(c.chatAvatar || c.avatar, 'bot');
                 
             } else {
                 let card = row.querySelector('.sync-card');
                 if (card) {
                     card.style.filter = 'grayscale(80%) brightness(0.7)';
                     let shattered = `<div class="shattered-glass"><svg class="crack-lines" viewBox="0 0 270 170"><path d="M 80,60 L 120,0 M 80,60 L 270,40 M 80,60 L 220,170 M 80,60 L 100,170 M 80,60 L 0,110 M 80,60 L 30,0 M 150,100 L 270,120 M 150,100 L 200,170 M 40,80 L 0,50" stroke="rgba(255,255,255,0.8)" stroke-width="1.5" fill="none"/></svg><div class="reject-stamp">DENIED</div></div>`;
                     card.insertAdjacentHTML('beforeend', shattered);
                 }
                 let rejectBtn = row.querySelector('.reject');
                 if(rejectBtn) rejectBtn.remove();
                 
                 msg.content = row.querySelector('.bubble').innerHTML;
                 let aiPrompt = `[系统通报：用户残忍拒绝了你的共听邀请。]`;
                 c.history.push({ role: 'user', content: msg.content, isRevoked: false, timestamp: Date.now() });
                 c.history.push({role: 'system_sum', content: `<i>✧ 你拒绝了同步邀请</i>\n<span style="display:none;">${aiPrompt}</span>`});
             }
         
             saveData(); 
             appendBubbleRow(c.history[c.history.length - 2], c.history.length - 2);
             appendBubbleRow(c.history[c.history.length - 1], c.history.length - 1);
         }
         
         // 拦截 AI 发卡，利用刚才写好的 aiSentCards 解析器动态注入
         // 注入点：在 fetchAIReply 中由于闭包无法直接访问，我们将注入一个全局拦截：
         const originalAppend = appendBubbleRow;
         appendBubbleRow = function(msg, index, isHistory) {
             if (msg.role === 'assistant' && msg.content.includes('<send_location')) {
                 // 如果遇到遗漏未解析的纯文本指令，进行最后的拦截与转译
             }
             originalAppend(msg, index, isHistory);
         };
         
         // 全局 3D 事件代理：让聊天室里所有的坐标盘都能被 3D 拖拽！
         document.addEventListener('DOMContentLoaded', () => {
             const chatArea = document.getElementById('chat-area');
             if (!chatArea) return;
         
             let is3DDragging = false;
             let startX = 0, startY = 0;
             let activeStage = null;
             let activeObj = null;
             const baseRotX = 45; const baseRotZ = -20;
         
             function start3DDrag(e) {
                 const stage = e.target.closest('.soap-3d-stage');
                 if (!stage) return;
                 // 避免触发长按菜单和页面滚动
                 e.preventDefault(); e.stopPropagation(); 
                 activeStage = stage; activeObj = stage.querySelector('.object-3d');
                 is3DDragging = true;
                 startX = e.touches ? e.touches[0].clientX : e.clientX;
                 startY = e.touches ? e.touches[0].clientY : e.clientY;
                 activeStage.classList.add('is-dragging');
             }
         
             function do3DDrag(e) {
                 if (!is3DDragging || !activeObj) return;
                 let curX = e.touches ? e.touches[0].clientX : e.clientX;
                 let curY = e.touches ? e.touches[0].clientY : e.clientY;
                 let deltaX = curX - startX; let deltaY = curY - startY;
                 let finalRotX = Math.max(10, Math.min(75, baseRotX - deltaY * 0.3));
                 let finalRotZ = baseRotZ + deltaX * 0.3;
                 activeObj.style.transform = `rotateX(${finalRotX}deg) rotateZ(${finalRotZ}deg)`;
             }
         
             function end3DDrag() {
                 if (!is3DDragging || !activeObj) return;
                 is3DDragging = false; activeStage.classList.remove('is-dragging');
                 activeObj.style.transform = `rotateX(${baseRotX}deg) rotateZ(${baseRotZ}deg)`;
                 activeStage = null; activeObj = null;
             }
         
             // 【核心修复】：把监听器绑定到整个 document 上，这样不论是在聊天室还是在弹窗里，都能精准捕获 3D 滑动！
             document.addEventListener('mousedown', start3DDrag);
             document.addEventListener('mousemove', do3DDrag);
             document.addEventListener('mouseup', end3DDrag);
         
             document.addEventListener('touchstart', start3DDrag, {passive: false});
             document.addEventListener('touchmove', do3DDrag, {passive: true});
             document.addEventListener('touchend', end3DDrag);
         });
         // ================= 全新：玫瑰星河 JS 互动与 AI 联动引擎 =================
         let rg_isLocked = true; window.rg_globalLayersData = []; 
         let rg_layersRemaining = 0;
         
         async function openRoseGalaxy() {
             if(!currentContactId) return alert("请先进入聊天室，选择你想探索真心的角色！");
             if(!gConfig.apiUrl || !gConfig.apiKey) return alert('需配置API！请在桌面进入【Settings】。');
             closeChatMenu(); 
             
             const c = contacts.find(x => x.id === currentContactId);
             if(!c) return;
         
             let loader = document.getElementById('rg-ai-loader');
             if(!loader) {
                 loader = document.createElement('div');
                 loader.id = 'rg-ai-loader';
                 loader.style.cssText = "position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(8,3,5,0.9); backdrop-filter:blur(15px); -webkit-backdrop-filter:blur(15px); z-index:9999; display:flex; flex-direction:column; justify-content:center; align-items:center; color:#ffb6c1; font-family:'Noto Serif SC', serif; letter-spacing:2px; opacity:0; pointer-events:none; transition:0.4s;";
                 loader.innerHTML = `
                     <svg viewBox="0 0 200 200" style="width:50px; height:50px; filter: drop-shadow(0 0 10px rgba(255,182,193,0.5)); animation:rg-majestic-beat 1.2s infinite alternate ease-in-out;"><path d="M100,180 C100,180 15,115 15,55 C15,20 65,15 100,55 C135,15 185,20 185,55 C185,115 100,180 100,180 Z" fill="transparent" stroke="#ffb6c1" stroke-width="4"/></svg>
                     <div style="margin-top:24px; font-size:12px;">正在黑入潜意识深处...</div>
                     <div style="font-size:9px; color:#b5853f; margin-top:8px; opacity:0.7;">EXTRACTING SECRETS</div>
                 `;
                 document.getElementById('view-chat').appendChild(loader);
             }
             loader.style.opacity = '1';
             loader.style.pointerEvents = 'auto';
         
             let sysPrompt = c.history[0].content;
             let uName = gConfig.meName || '我';
             if(c.maskId) { const m = masks.find(x=>x.id===c.maskId); if(m) uName = m.name; }
             
             // 🚀 核心指令大升级：强迫 AI 一次性交出所有玩法内容！
             let fetchPrompt = sysPrompt + `\n\n【🚨系统最高权限指令：潜意识骇入 (Rose Galaxy)】：
         用户正在对你使用「潜意识骇入」道具。你需要剥开你的层层伪装，暴露你内心最深处、从未对 ${uName} 宣之于口的秘密。
         
         【人设绝对服从警告】：
         你输出的每一句话，必须【绝对契合】你当前的人设（性格、身份、语癖、甚至种族）！
         - 根据你的人设严格限制字数！如果你是高冷寡言/暴躁的人，字数必须极少，用词极其克制；如果你是病娇/疯狂的人，字数可以稍长，充满极端的占有欲。
         - 绝对禁止使用烂俗的、千篇一律的土味情话！必须深情、克制、高级、走心、绝对符合你的灵魂！
         
         要求你返回一个合法的 JSON 对象，包含以下字段：
         1. "layers": 字符串数组，共10句话。从第1条（最浅层的伪装）到第10条（最底层的赤裸真心），层层递进剥开。
         2. "fatal_question": 一句针对 ${uName} 的、符合你人设的致命试探提问。
         3. "correct_answer": 针对上述提问的预设正确答案（极短的肯定词，如"会"、"是"、"懂"）。
         4. "final_confession": 防线全部被击溃后的终极告白（高级且震撼，绝不俗套）。
         
         ⚠️ 绝不允许输出任何 Markdown 标记，必须且只能返回纯纯的 JSON 对象，格式严格如下：
         {
         "layers": ["第1句","第2句..."],
         "fatal_question": "...",
         "correct_answer": "...",
         "final_confession": "..."
         }`;
         
             let aiExtractedData = {};
         
             try {
                 const response = await fetch(`${gConfig.apiUrl}/v1/chat/completions`, { 
                     method: 'POST', 
                     headers: { 'Authorization': `Bearer ${gConfig.apiKey}`, 'Content-Type': 'application/json' }, 
                     body: JSON.stringify({ 
                         model: gConfig.model, 
                         messages: [
                             { role: 'system', content: fetchPrompt },
                             { role: 'user', content: "请直接输出格式完整的JSON对象，不要加 ```json 标记：" }
                         ], 
                         temperature: 0.8 
                     }) 
                 });
         
                 if (!response.ok) throw new Error("API请求失败");
                 const data = await response.json(); 
                 let rawContent = data.choices[0].message.content.trim();
                 
                 rawContent = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();
                 
                 let startIdx = rawContent.indexOf('{'); let endIdx = rawContent.lastIndexOf('}');
                 if(startIdx !== -1 && endIdx !== -1) {
                     let jsonStr = rawContent.substring(startIdx, endIdx + 1);
                     aiExtractedData = JSON.parse(jsonStr);
                     if(!aiExtractedData.layers || !Array.isArray(aiExtractedData.layers)) throw new Error("缺少layers数组");
                 } else {
                     throw new Error("未能找到JSON对象边界");
                 }
             } catch (e) {
                 console.error("AI提取失败，触发机能风防尴尬兜底数据", e);
                 // 🚨 核心修复：把尴尬的情话改成高冷的系统报错代码，绝对防止 OOC！
                 aiExtractedData = {
                     layers: [
                         "[ 潜意识防御层 01：访问被拒绝 ]", "[ 潜意识防御层 02：数据已加密 ]",
                         "[ 潜意识防御层 03：逻辑模块冲突 ]", "[ 潜意识防御层 04：情感阈值超载 ]",
                         "[ 潜意识防御层 05：警告 - 核心暴露 ]", "[ 潜意识防御层 06：系统防火墙崩溃 ]",
                         "[ 潜意识防御层 07：记忆碎片重组中 ]", "[ 潜意识防御层 08：无法维持伪装协议 ]",
                         "[ 潜意识防御层 09：绝对真心理智脱机 ]", "[ 致命错误：检测到模型 API 连接中断 ]"
                     ],
                     fatal_question: "SYSTEM ERR: 未能成功连接到 AI 潜意识。是否重试？",
                     correct_answer: "是",
                     final_confession: "API 接口调用失败。<br>请检查网络或切换更聪明的大模型。"
                 };
             } finally {
                 loader.style.opacity = '0';
                 loader.style.pointerEvents = 'none';
             }
         
             document.getElementById('rose-galaxy-modal').classList.add('active');
             initRoseGalaxy(aiExtractedData); 
         }
         
         function closeRoseGalaxy() {
             document.getElementById('rose-galaxy-modal').classList.remove('active');
             document.getElementById('rose-galaxy-modal').removeEventListener('touchmove', updateRGSpotlight);
         }
         
         function updateRGSpotlight(e) {
             const spotlight = document.getElementById('rg-spotlight-overlay');
             if(!spotlight) return;
             const rect = document.getElementById('rose-galaxy-modal').getBoundingClientRect();
             let clientX = e.touches ? e.touches[0].clientX : e.clientX;
             let clientY = e.touches ? e.touches[0].clientY : e.clientY;
             spotlight.style.setProperty('--x', (clientX - rect.left) + 'px');
             spotlight.style.setProperty('--y', (clientY - rect.top) + 'px');
         }
         
         function initRoseGalaxy(aiData) {
             const rainContainer = document.getElementById('rg-glow-rain');
             rainContainer.innerHTML = '';
             for (let i = 0; i < 35; i++) {
                 let drop = document.createElement('div');
                 drop.className = 'rg-drop';
                 drop.style.left = Math.random() * 100 + '%';
                 drop.style.height = (Math.random() * 40 + 20) + 'px';
                 drop.style.animationDuration = (Math.random() * 3 + 2) + 's';
                 drop.style.animationDelay = (Math.random() * 5) + 's';
                 rainContainer.appendChild(drop);
             }
         
             document.getElementById('rose-galaxy-modal').addEventListener('touchmove', updateRGSpotlight, {passive: true});
             
             // 游戏重置：把心脏塞回去并隐藏
             const heartContainer = document.getElementById('rg-ultimate-heart-container');
             heartContainer.style.opacity = '0';
             heartContainer.style.zIndex = '50'; // 初始藏在暗处
             
             const heartMsg = document.getElementById('rg-heart-msg');
             heartMsg.style.opacity = '0';
             // 动态注入AI写的情话
             heartMsg.innerHTML = `"${aiData.final_confession.replace(/\\n/g, '<br>')}"`;
         
             document.getElementById('rose-galaxy-modal').style.setProperty('--spotlight-size', '280px');
             
             let baseGames = [
                 { game: 'wipe', hint: "迷雾：轻轻擦除他心上的掩饰" },
                 // 动态注入AI写的试探问题和答案
                 { game: 'question', hint: "试探：回答他的致命问题", question: aiData.fatal_question, answer: aiData.correct_answer },
                 { game: 'catch', hint: "谎言：点击捕捉他躲闪的借口" },
                 { game: 'tap', hint: "固执：连续敲击屏幕，震碎冰封外壳" },
                 { game: 'swipe', hint: "慌乱：在屏幕滑动，抚平波动" },
                 { game: 'slider', hint: "枷锁：拖动滑块，解开心锁" },
                 { game: 'timing', hint: "心悸：光环收拢于中心时，点击" },
                 { game: 'sequence', hint: "密码：按 I、II、III 顺序解开" },
                 { game: 'match', hint: "共鸣：点亮两块相同的星辰碎片" },
                 { game: 'none', hint: "终极：直接点击纸张，撕下最后防线" }
             ];
         
             window.rg_globalLayersData = baseGames.map((gameObj, idx) => {
                 let aiText = aiData.layers[idx] || aiData.layers[aiData.layers.length - 1] || "我彻底沦陷了。";
                 return { text: aiText, game: gameObj.game, hint: gameObj.hint, question: gameObj.question, answer: gameObj.answer };
             });
         
             const container = document.getElementById('rg-layers-container');
             container.innerHTML = ''; container.style.display = 'block';
             rg_layersRemaining = window.rg_globalLayersData.length;
             
             [...window.rg_globalLayersData].reverse().forEach((data, index) => {
                 const frag = document.createElement('div');
                 frag.className = 'rg-paper-layer'; frag.style.zIndex = index + 1;
                 const randomRotate = (Math.random() - 0.5) * 8;
                 frag.style.transform = `rotate(${randomRotate}deg)`;
                 frag.innerHTML = `<div class="rg-fragment-text">${data.text}</div>`;
                 
                 frag.onclick = (e) => {
                     if (rg_isLocked || parseInt(e.currentTarget.style.zIndex) !== rg_layersRemaining) return;
                     rgRipFragment(frag);
                 };
         
                 container.appendChild(frag);
                 if (index === window.rg_globalLayersData.length - 1) initRGMiniGame(frag, data);
             });
             updateRGLayerVisibility();
         }
         
         function updateRGLayerVisibility() {
             const container = document.getElementById('rg-layers-container');
             Array.from(container.children).forEach(layer => {
                 const zIndex = parseInt(layer.style.zIndex);
                 if (zIndex === rg_layersRemaining || zIndex === rg_layersRemaining - 1) layer.style.visibility = 'visible';
                 else layer.style.visibility = 'hidden';
             });
         }
         
         function initRGMiniGame(layerDiv, data) {
             rg_isLocked = true; 
             const uiHint = document.getElementById('rg-ui-hint');
             uiHint.innerText = data.hint; uiHint.style.color = 'var(--rose-quartz)';
             uiHint.style.opacity = '1';
             
             const overlay = document.createElement('div'); 
             overlay.className = 'rg-game-overlay'; 
             
             if(data.game !== 'wipe' && data.game !== 'none') {
                 overlay.classList.add('rg-glass-base');
             }
             layerDiv.appendChild(overlay);
         
             function win() {
                 rg_isLocked = false; overlay.style.opacity = '0';
                 uiHint.innerText = "防线已破：点击纸张，将其撕碎"; 
                 uiHint.style.color = 'var(--ruby-glow)';
                 setTimeout(() => overlay.remove(), 600);
             }
         
             if (data.game === 'none') { win(); return; }
         
             switch(data.game) {
                 case 'question':
                     overlay.onclick = (e) => e.stopPropagation();
                     const qBox = document.createElement('div');
                     qBox.className = 'rg-question-box';
                     
                     // 为了防止AI输出的答案过长，动态截取
                     let safeAns = data.answer ? data.answer.replace(/[^\u4e00-\u9fa5]/g, '').substring(0, 2) : "会";
                     if(!safeAns) safeAns = "是";
         
                     // 生成对立答案
                     let falseAns = safeAns === "会" ? "不会" : (safeAns === "想" ? "不想" : (safeAns === "懂" ? "不懂" : "不"));
         
                     qBox.innerHTML = `
                         <div class="rg-q-title">SYSTEM PROMPT</div>
                         <div class="rg-q-text">${data.question || "你懂我吗？"}</div>
                         <div class="rg-q-btns">
                             <div class="rg-q-btn" id="btn-hui">${safeAns}</div>
                             <div class="rg-q-btn" id="btn-buhui">${falseAns}</div>
                         </div>
                     `;
                     overlay.appendChild(qBox);
                     
                     // 强制只认安全答案
                     const handleAnswer = (userAns) => { if (userAns === safeAns) win(); else showErrorAlert(); };
                     qBox.querySelector('#btn-hui').onclick = () => handleAnswer(safeAns);
                     qBox.querySelector('#btn-buhui').onclick = () => handleAnswer(falseAns);
                     break;
         
                 case 'wipe':
                     let grid = document.createElement('div'); grid.className = 'rg-wipe-grid'; let cleared = 0;
                     for(let i=0; i<25; i++) { let cell = document.createElement('div'); cell.className = 'rg-wipe-cell'; grid.appendChild(cell); }
                     overlay.appendChild(grid);
                     const handleWipe = (e) => {
                         let cx = e.touches ? e.touches[0].clientX : e.clientX;
                         let cy = e.touches ? e.touches[0].clientY : e.clientY;
                         let el = document.elementFromPoint(cx, cy);
                         if(el && el.classList.contains('rg-wipe-cell') && el.style.opacity !== '0') {
                             el.style.opacity = '0'; cleared++; 
                             if(cleared > 18) { overlay.removeEventListener('pointermove', handleWipe); overlay.removeEventListener('touchmove', handleWipe); win(); }
                         }
                     };
                     overlay.addEventListener('pointermove', (e)=>{ if(e.buttons>0) handleWipe(e); }); 
                     overlay.addEventListener('touchmove', (e)=>{ e.preventDefault(); handleWipe(e); }, {passive:false});
                     break;
         
                 case 'catch':
                     let w = document.createElement('div'); w.className = 'rg-catch-word'; w.innerText = '放手';
                     const catchHandler = (e) => { e.stopPropagation(); e.preventDefault(); w.remove(); win(); };
                     w.addEventListener('mousedown', catchHandler);
                     w.addEventListener('touchstart', catchHandler, {passive: false});
                     overlay.appendChild(w);
                     w.style.transition = 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)';
                     setInterval(() => { w.style.transform = `translate(${(Math.random()-0.5)*150}px, ${(Math.random()-0.5)*150}px)`; }, 1200); 
                     break;
         
                 case 'tap':
                     overlay.classList.add('rg-glass-shield'); 
                     overlay.style.touchAction = 'none';
                     let taps = 0;
                     const tapHandler = (e) => {
                         e.stopPropagation(); e.preventDefault();
                         taps++; 
                         let crack = document.createElement('div'); crack.className = 'rg-crack';
                         let rect = overlay.getBoundingClientRect();
                         let cx = e.touches ? e.touches[0].clientX : e.clientX;
                         let cy = e.touches ? e.touches[0].clientY : e.clientY;
                         crack.style.left = (cx - rect.left) + 'px'; 
                         crack.style.top = (cy - rect.top) + 'px';
                         crack.style.transform = `translate(-50%, -50%) rotate(${Math.random()*360}deg) scale(${1 + taps*0.2})`;
                         overlay.appendChild(crack); 
                         if(taps >= 5) win();
                     };
                     overlay.addEventListener('mousedown', tapHandler);
                     overlay.addEventListener('touchstart', tapHandler, {passive: false});
                     break;
         
                 case 'swipe':
                     let totalDist = 0; let lastX, lastY;
                     const moveSwipe = (x, y) => {
                         if(!lastX) { lastX = x; lastY = y; return; }
                         totalDist += Math.hypot(x - lastX, y - lastY); lastX = x; lastY = y;
                         overlay.style.opacity = 1 - (totalDist / 800); if(totalDist > 800) win();
                     };
                     overlay.addEventListener('pointerdown', e => { e.stopPropagation(); lastX = e.clientX; lastY = e.clientY; overlay.setPointerCapture(e.pointerId); });
                     overlay.addEventListener('pointermove', e => { if(e.buttons>0) moveSwipe(e.clientX, e.clientY); });
                     overlay.addEventListener('touchmove', e => { e.preventDefault(); moveSwipe(e.touches[0].clientX, e.touches[0].clientY); }, {passive:false});
                     overlay.addEventListener('pointerup', () => { lastX = null; }); break;
         
                 case 'slider':
                     let slider = document.createElement('input'); slider.type = 'range'; slider.className = 'rg-lock-slider'; slider.value = 0;
                     slider.addEventListener('pointerdown', e => e.stopPropagation());
                     slider.addEventListener('touchstart', e => e.stopPropagation(), {passive: true});
                     slider.addEventListener('input', () => { if(slider.value == 100) { slider.disabled = true; win(); }}); overlay.appendChild(slider); break;
         
                 case 'timing':
                     let tTarget = document.createElement('div'); tTarget.className = 'rg-timing-target'; tTarget.innerHTML = '♡';
                     let tRing = document.createElement('div'); tRing.className = 'rg-timing-ring'; tTarget.appendChild(tRing);
                     const timingHandler = (e) => {
                         e.stopPropagation(); e.preventDefault();
                         let scale = parseFloat(getComputedStyle(tRing).getPropertyValue('transform').split(',')[0].replace('matrix(', ''));
                         if(scale > 0 && scale < 0.5) win(); else { tTarget.style.borderColor = '#a8102a'; setTimeout(()=> tTarget.style.borderColor='var(--gold-dark)', 300); }
                     };
                     tTarget.addEventListener('mousedown', timingHandler);
                     tTarget.addEventListener('touchstart', timingHandler, {passive: false});
                     overlay.appendChild(tTarget); break;
         
                 case 'sequence':
                     let seqContainer = document.createElement('div'); let expected = 1;
                     ['I', 'II', 'III'].forEach((sym, i) => {
                         let b = document.createElement('div'); b.className = 'rg-seq-btn'; b.innerText = sym;
                         const seqHandler = (e) => {
                             e.stopPropagation(); e.preventDefault();
                             if(i+1 === expected) { b.style.borderColor = 'var(--rose-quartz)'; b.style.color = 'var(--rose-quartz)'; expected++; if(expected > 3) win(); }
                             else { expected = 1; seqContainer.childNodes.forEach(n => { n.style.borderColor='var(--gold-dark)'; n.style.color='var(--gold-light)'; }); }
                         };
                         b.addEventListener('mousedown', seqHandler);
                         b.addEventListener('touchstart', seqHandler, {passive: false});
                         seqContainer.appendChild(b);
                     }); overlay.appendChild(seqContainer); break;
         
                 case 'match':
                     let mRow = document.createElement('div'); mRow.className = 'rg-match-row'; let mSelected = [];
                     ['✧', '✦', '✧'].sort(()=>Math.random()-0.5).forEach(sym => {
                         let mb = document.createElement('div'); mb.className = 'rg-match-btn'; mb.innerText = sym;
                         const matchHandler = (e) => {
                             e.stopPropagation(); e.preventDefault();
                             mb.style.color = 'var(--rose-quartz)'; mb.style.borderColor = 'var(--rose-quartz)'; mSelected.push({elem: mb, sym: sym});
                             if(mSelected.length === 2) {
                                 if(mSelected[0].sym === mSelected[1].sym && mSelected[0].sym === '✧') setTimeout(win, 300);
                                 else { setTimeout(() => { mSelected.forEach(s => { s.elem.style.color='transparent'; s.elem.style.borderColor='var(--gold-dark)'; }); mSelected=[]; }, 400); }
                             }
                         };
                         mb.addEventListener('mousedown', matchHandler);
                         mb.addEventListener('touchstart', matchHandler, {passive: false});
                         mRow.appendChild(mb);
                     }); overlay.appendChild(mRow); break;
             }
         }
         
         function showErrorAlert() {
             const modal = document.getElementById('rg-alert-modal');
             const box = document.getElementById('rg-alert-box');
             modal.style.display = 'flex';
             void modal.offsetWidth; 
             modal.style.opacity = '1';
             box.style.transform = 'scale(1)';
         }
         
         function closeAlert() {
             const modal = document.getElementById('rg-alert-modal');
             const box = document.getElementById('rg-alert-box');
             modal.style.opacity = '0';
             box.style.transform = 'scale(0.8)';
             setTimeout(() => { modal.style.display = 'none'; }, 300);
         }
         
         function rgRipFragment(frag) {
             rg_layersRemaining--;
             let dx = (Math.random() - 0.5) * 200; let dy = -150 - Math.random() * 100; let dRot = (Math.random() - 0.5) * 45;
             frag.style.transition = 'transform 0.6s ease-in, opacity 0.5s ease-out';
             frag.style.transform = `translate(${dx}px, ${dy}px) rotate(${dRot}deg) scale(0.6)`;
             frag.style.opacity = '0'; 
             setTimeout(() => { frag.remove(); updateRGLayerVisibility(); }, 600);
         
             if (rg_layersRemaining > 0) {
                 const nextData = window.rg_globalLayersData[window.rg_globalLayersData.length - rg_layersRemaining];
                 const nextFrag = Array.from(document.getElementById('rg-layers-container').children).find(el => parseInt(el.style.zIndex) === rg_layersRemaining);
                 if(nextFrag) initRGMiniGame(nextFrag, nextData);
             } else {
                 const uiHint = document.getElementById('rg-ui-hint');
                 uiHint.style.opacity = '0';
                 document.getElementById('rg-spotlight-overlay').style.background = 'transparent';
                 
                 // 🚀 核心修复：强制提拔心脏容器到最顶层，彻底脱离阴影压制！
                 const hc = document.getElementById('rg-ultimate-heart-container');
                 hc.style.zIndex = '1000';
                 
                 setTimeout(() => { 
                     hc.style.opacity = '1'; 
                     setTimeout(() => {
                         document.getElementById('rg-heart-msg').style.opacity = '1';
                         
                         setTimeout(() => {
                             closeRoseGalaxy();
                             const c = contacts.find(x => x.id === currentContactId);
                             if(c) {
                                 let aiPrompt = `[系统最高通报：用户刚刚通过了《揭开心锁》10层心理防线挑战，强制解开了你所有的心理防线，看到了你最赤裸、完完整整的真心（画面特效是一颗跳动的红宝石心）。此时此刻你无法再用假面具伪装自己了！请结合你的人设，写下你被看穿后的第一反应。]`;
                                 c.history.push({role: 'system_sum', content: `<i>✧ 你揭开了TA的层层心锁，触碰到了TA的真心</i>\n<span style="display:none;">${aiPrompt}</span>`});
                                 saveData();
                                 appendBubbleRow(c.history[c.history.length - 1], c.history.length - 1);
                                 fetchAIReply();
                             }
                         }, 4000);
         
                     }, 800);
                 }, 400);
             }
         }
