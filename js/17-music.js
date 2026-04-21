
         
         async function syncTheaterToMemory() {
             if(!currentContactId) return;
             const c = contacts.find(x => x.id === currentContactId);
             
             // 核心修改：从统一历史中提取未总结的线下消息
             let startIndex = c.lastTheaterSumIndex || 0;
             let newHistory = c.history.slice(startIndex).filter(m => m.isTheater === true && m.role !== 'system');
         
             if (newHistory.length === 0) {
                 return alert("当前没有新的未刻录剧情，无需重复总结。");
             }
         
             let uName = gConfig.meName || '我';
             if(c.maskId) { const m = masks.find(x=>x.id===c.maskId); if(m) uName = m.name; }
         
             // 只把新的聊天内容拼起来
             let contextText = newHistory.map(m => `${m.role === 'user' ? uName : c.name}: ${m.content}`).join('\n');
             
             let sumPrompt = `请以第三人称，极其客观、精简地总结以下发生在线下模式中的最新剧情片段。只需提取核心事件和双方感情进展，作为主线备忘录。
         【剧情内容】：
         ${contextText}`;
         
             const btnSync = document.getElementById('btnSyncMemory');
             const syncMainText = document.getElementById('syncMainText');
             const syncSubText = document.getElementById('syncSubText');
         
             try {
                 syncMainText.textContent = "Syncing Neural Pathways...";
                 syncSubText.textContent = "正在提取上下文并写入核心记忆...";
                 btnSync.style.borderColor = "var(--th-gold-text)";
                 
                 const res = await fetch(`${gConfig.apiUrl}/v1/chat/completions`, {
                     method: 'POST', headers: { 'Authorization': `Bearer ${gConfig.apiKey}`, 'Content-Type': 'application/json' }, 
                     body: JSON.stringify({ model: gConfig.model, messages: [{role:'user', content:sumPrompt}], temperature: 0.5 })
                 });
                 const data = await res.json();
                 let summary = data.choices[0].message.content.trim();
                 
                 const dateStr = new Date().toLocaleString();
                 c.memory = (c.memory ? c.memory + "\n\n" : "") + `[${dateStr} 线下事件备忘录]: ${summary}`;
                 c.history.push({role: 'system_sum', content: `<i>✧ [系统志] 经历了一段线下特殊剧情，已将回忆刻录进灵魂深处。</i>`});
                 
                 // 🌟 新增：标记当前的进度，下次从这里开始往后总结！
                 c.lastTheaterSumIndex = c.theaterHistory.length; 
                 
                 saveData();
                 renderChatHistory(); 
         
                 syncMainText.textContent = "Memory Engraved";
                 syncSubText.textContent = "已成功铭刻至核心长期记忆库";
                 btnSync.style.background = "rgba(195, 167, 114, 0.15)";
                 
                 setTimeout(() => {
                     syncMainText.textContent = "Summarize & Save Memory";
                     syncSubText.textContent = "立刻总结当前剧场，并刻录至主线记忆";
                     btnSync.style.background = "";
                     btnSync.style.borderColor = "";
                 }, 3000);
                 
             } catch(e) {
                 alert('记忆刻录失败。');
                 syncMainText.textContent = "Summarize & Save Memory";
                 syncSubText.textContent = "网络错误，重试";
             }
         }
             // =====================================================================
         // SOAP BOUTIQUE 高定商店 JS 核心引擎
         // =====================================================================
         let storeGlobalAiDB = {};
         let storeAiCache = {};
         let storeCustomDB = [];
         let storeOrderHistory = [];
         let storeCartSet = new Set();
         let storeActiveOrderItems = [];
         let storeCurrentOrderId = 'STANDBY';
         let storePayMode = 'self'; let storeNotifyMode = 'no'; let storeRecipientMode = 'self';
         let storeTimelineTimeouts = [];
         let storeIsAwaitingSync = true;
         let storeCurrentMainCat = 'BOUTIQUE'; let storeCurrentSubCat = 'ALL';
         
         const storeSubCategories = {
             'BOUTIQUE': [ { id: 'ALL', name: 'ALL', cn: '全部' }, { id: 'CLOTHING', name: 'CLOTHING', cn: '服装' }, { id: 'BEAUTY', name: 'BEAUTY', cn: '美妆' }, { id: 'INTIMATE', name: 'INTIMATE', cn: '情趣' }, { id: 'CUSTOM', name: 'CUSTOM', cn: '定制' } ],
             'GALLERY': [ { id: 'ALL', name: 'ALL', cn: '全部' }, { id: 'FURNITURE', name: 'FURNITURE', cn: '家具' }, { id: 'DECOR', name: 'DECOR', cn: '摆件' }, { id: 'SCENT', name: 'SCENT', cn: '香氛' }, { id: 'CUSTOM', name: 'CUSTOM', cn: '定制' } ]
         };
         
         // ================= SOAP. SYMPHONY 音乐系统核心数据与API逻辑 =================
         const default_m_db = {
             daily: [
                 { 
                     title: "和你", 
                     artist: "余佳运", 
                     img: "https://images.unsplash.com/photo-1493225457124-a1a2a5f5f9af?q=80&w=400&auto=format&fit=crop", 
                     audio: "https://nos.netease.com/ysf/113cc58bccc41c6487de660911652c6e.mp3", 
                     lyric: `[00:00.00] 制作人 : 余佳运\n[00:01.00] 作词 : 余佳运\n[00:02.00] 作曲 : 余佳运\n[00:14.04]许多回忆 藏在心底\n[00:20.31]总来不及 都告诉你\n[00:26.56]和你一起 爬过山顶 入过海里\n[00:33.07]难免粗心 时而大意\n[00:39.51]难过开心 你都参与\n[00:45.86]笑到抽筋 哭到决堤\n[00:52.21]和你一起 想去东京 飞到巴黎\n[00:58.36]那些事情 全因为你\n[01:03.30]我想和你 赏最美的风景\n[01:07.99]看最长的电影 听动人的旋律\n[01:14.40]是因为你和我\n[01:16.75]会陪你到下个世纪\n[01:22.90]那是多么的幸运\n[01:30.46]可爱的你 爱哭的你\n[01:36.75]善良的你 美好的你\n[01:43.30]和你一起 聊着过去 说起曾经\n[01:48.93]那些画面都 是你\n[02:20.50]我想和你 赏最美的风景\n[02:25.01]看最长的电影 听动人的旋律\n[02:31.56]是因为你和我\n[02:33.68]会陪你到下个世纪\n[02:40.07]那是多么的幸运\n[02:45.61]我要和你 赏最美的风景\n[02:50.45]看最长的电影 听动人的旋律\n[02:57.20]是因为你和我\n[02:59.28]和你最珍贵的记忆\n[03:05.72]那是多么的幸运\n[03:12.23]我是多么的幸运`
                 },
                 { title: "Silence", artist: "Curation Selection", img: "https://images.unsplash.com/photo-1514119412350-e172290920f1?q=80&w=400&auto=format&fit=crop", audio: "", lyric: "" },
                 { title: "Echoes", artist: "Curation Selection", img: "https://images.unsplash.com/photo-1458560871784-56d23406c091?q=80&w=400&auto=format&fit=crop", audio: "", lyric: "" }
             ],
             tracks: {
                 "CLASSICAL": [
                     { title: "Nocturne Op. 9 No. 2", artist: "Frédéric Chopin", img: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?q=80&w=150&auto=format&fit=crop", audio: "", lyric: "" },
                     { title: "Clair de Lune", artist: "Claude Debussy", img: "https://images.unsplash.com/photo-1514119412350-e172290920f1?q=80&w=150&auto=format&fit=crop", audio: "", lyric: "" }
                 ],
                 "AMBIENT": [
                     { title: "Weightless", artist: "Marconi Union", img: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=150&auto=format&fit=crop", audio: "", lyric: "" }
                 ],
                 "ELECTRONIC": [
                     { title: "Nightcall", artist: "Kavinsky", img: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=150&auto=format&fit=crop", audio: "", lyric: "" }
                 ]
             }
         };
         
         let m_db = JSON.parse(JSON.stringify(default_m_db));
         
         // 核心修复：升级为无限容量的异步 LocalDB，歌曲多大都不会丢！
         async function saveMusicDB() {
             try { await LocalDB.setItem('soap_music_db_v1', JSON.stringify(m_db)); } 
             catch(e) { alert("提示：本地存储空间发生异常，请确保设备剩余容量充足！"); }
         }
         
         let currentCategory = 'CLASSICAL'; let isCuratorMode = false; let editTarget = null; let tempLocalBlobs = {}; let tempParsedLyrics = null; 
         let isLongPressing = false; let globalIsPlaying = false; let currentPlayingData = null;
         let playlist = []; let currentPlaylistIndex = -1; let isBgPinned = false; let pinnedBgUrl = "";
         
         // 音乐界面连麦 AI 参数
         let currentMusicContactId = null;
         let musicChatHistory = []; // 用于保存音乐界面的独立短上下文
         
         function initMusicApp() {
             // 读取面具和我的头像
             let uAvatar = gConfig.meAvatar || '';
             if (currentMusicContactId) {
                 const c = contacts.find(x => x.id === currentMusicContactId);
                 if (c && c.maskId) { const m = masks.find(x => x.id === c.maskId); if (m) uAvatar = m.avatar; }
             }
             document.getElementById('music-me-avatar').innerHTML = renderAvatarHTML(uAvatar, 'user');
         
             // 强制重新渲染，确保动态更新不丢失
             renderDailyPicks(); 
             renderTrackList(currentCategory);
             
             // 核心修复：初始化时如果没有播放歌曲，立刻启动悬浮诗意歌词
             if (!currentPlayingData && !document.getElementById('lyrics-container').innerHTML) {
                 startLyricsSync(document.getElementById('sys-audio'), null);
             }
         }
         
         // 调出联系人列表供音乐软件选择
         function openMusicContactSelect() {
             const list = document.getElementById('select-chat-list'); 
             list.innerHTML = ''; 
             if(contacts.length === 0) { 
                 list.innerHTML = `<div style="text-align:center; padding:20px; color:var(--c-gray-dark); font-size:12px; font-weight:600;">暂无人格，请先到 Contacts 创建。</div>`; 
             } 
             contacts.forEach(c => { 
                 const item = document.createElement('div'); item.className = 'contact-item'; 
                 item.onclick = () => { 
                     closeSelectChat(); 
                     
                     // 1. 获取当前音乐情报，并生成带有上下文和歌词的邀请
                     let songData = null;
                     let aiText = "";
                     if (typeof globalIsPlaying !== 'undefined' && globalIsPlaying && currentPlayingData) {
                         songData = { title: currentPlayingData.title, artist: currentPlayingData.artist, img: currentPlayingData.img };
                         let lyricSample = "";
                         if (currentPlayingData.parsedLyrics && typeof currentActiveGroupIndex !== 'undefined' && currentActiveGroupIndex >= 0 && currentLyricsArray[currentActiveGroupIndex]) {
                             lyricSample = currentLyricsArray[currentActiveGroupIndex].lines.join(' ');
                         }
                         let lyricInfo = lyricSample ? `，当前耳机里正好唱到：“${lyricSample}”` : '';
                         aiText = `[系统通报：用户在音乐频道里向你发送了【专属音乐共听邀请】！指定的曲目是《${songData.title}》${lyricInfo}。如果你愿意戴上耳机和TA一起听，请在回复中输出 <accept> 指令；如果不愿意，请输出 <reject> 指令。]`;
                     } else {
                         aiText = `[系统通报：用户在音乐频道里向你发送了【盲盒音乐共听邀请】！不知道是什么歌，等待你戴上耳机。如果你愿意一起听，请在回复中输出 <accept> 指令；如果不愿意，请输出 <reject> 指令。]`;
                     }
                     
                     // 2. 生成邀请卡片并写入该角色的聊天历史
                     let cardHtml = generateSyncCardHtml(false, true, songData);
                     const newMsg = { role: 'user', content: cardHtml.replace(/\n\s+/g, ''), isRevoked: false, timestamp: Date.now() };
                     c.history.push(newMsg);
                     c.history.push({role: 'system_sum', content: `<span style="display:none;">${aiText}</span>`});
                     saveData();
         
                     // 3. UI 反馈
                     showToast("SOAP. SYMPHONY", `已向 ${c.name} 发送共听邀请，等待对方接受...`, c.avatar, c.id);
         
                     // 如果主线聊天室刚好在后台开着，同步渲染出来
                     if (typeof appendBubbleRow === 'function' && document.getElementById('view-chat').classList.contains('slide-in') && currentContactId === c.id) {
                         appendBubbleRow(newMsg, c.history.length - 2);
                         const ca = document.getElementById('chat-area');
                         if(ca) ca.scrollTop = ca.scrollHeight;
                     }
                     
                     // 🎵 核心新增：发送邀请后，自动调取 AI 接口等待对方的接受/拒绝响应！
                     fetchAIReply(c.id);
                 }; 
                 item.innerHTML = `<div class="c-avatar-wrap" style="width:44px;height:44px;margin-right:15px;">${renderAvatarHTML(c.chatAvatar || c.avatar, 'bot')}</div><div class="c-info"><div class="c-name" style="font-size:15px; margin:0;">${c.name}</div></div>`; 
                 list.appendChild(item); 
             }); 
             document.getElementById('select-chat-sheet').classList.add('active');
         }
         
         /* ========================================================
            旧版无删减固定随机话术代码：
            function sendSymMsg() {
                const input = document.getElementById('sym-input'); const text = input.value.trim();
                if (!text) return; input.value = ''; spawnHeadBubble('user', text);
            }
            function fetchSymAI() {
                const replies = ["我也在听这首歌。", "你的心跳，我听见了。", "今晚的月色很美。", "不要挂断，就这样静静地听。", "我在。"];
                spawnHeadBubble('bot', "•••");
                setTimeout(() => { const b = document.querySelectorAll('.head-bubble-wrap.bot:not(.fade-out) .head-bubble'); if(b.length) b[b.length-1].innerText = replies[Math.floor(Math.random() * replies.length)]; }, 1500);
            }
            ======================================================== */
         
         // ⬇️ 改之后的完整 API 上下文连接代码 (主线聊天室记忆贯通版) ⬇️
         async function sendSymMsg() {
             const input = document.getElementById('sym-input'); 
             const text = input.value.trim();
             if (!text) return; 
             input.value = ''; 
             
             // 1. 在音乐界面弹出你自己的浮空气泡
             spawnHeadBubble('user', text);
             
             // 2. 将消息作为后台记忆写入主聊天室！不污染正规聊天气泡！
             if (currentMusicContactId) {
                 const c = contacts.find(x => x.id === currentMusicContactId);
                 if (c) {
                     const newMsg = { 
                         role: 'system_sum', 
                         content: `<span style="color:var(--c-gray-dark); font-size:9px; font-weight:800; font-style:normal; letter-spacing:2px;">🎵 伴随旋律，你轻声说：</span><br><span style="color:var(--c-black); font-size:13px; font-weight:600; font-style:normal; line-height:2;">“${text}”</span>\n<span style="display:none;">[用户在听歌时对你说]：${text}</span>`
                     };
                     c.history.push(newMsg);
                     if (typeof appendBubbleRow === 'function') {
                         appendBubbleRow(newMsg, c.history.length - 1);
                     }
                     saveData(); 
                 }
             }
             
             // 注释掉了自动调取，现在你需要手动点击旁边的同步按钮才会拉取 AI 回复！
             // await fetchSymAI(); 
         }
         
         async function fetchSymAI() {
             if (!currentMusicContactId) {
                 spawnHeadBubble('bot', "请先点击左侧的“+”号选择陪听联系人。");
                 return;
             }
             if (!gConfig.apiUrl || !gConfig.apiKey) {
                 spawnHeadBubble('bot', "未配置 API，无法共鸣。");
                 return;
             }
         
             const c = contacts.find(x => x.id === currentMusicContactId);
             if (!c) return;
         
             // 1. 发送请求前，立刻在界面弹出带有 ••• 的气泡！
             const botBubbleWrap = spawnHeadBubble('bot', "•••");
             const botBubbleText = botBubbleWrap.querySelector('.head-bubble');
         
             let uName = gConfig.meName || '我';
             if(c.maskId) { const m = masks.find(x=>x.id===c.maskId); if(m) uName = m.name; }
         
             let currentSong = currentPlayingData ? currentPlayingData.title : "一首宁静的歌";
             let currentArtist = currentPlayingData ? currentPlayingData.artist : "未知艺术家";
         
             let actionRule = c.allowAction 
                 ? "4. 你可以使用星号 *动作* 来描写你听歌时的微表情或小动作。"
                 : "4. 【最高红线】：绝对禁止包含任何动作、神态、心理描写！绝对禁止使用星号 *、括号 () 或 []！你只能输出纯粹的对话台词！";
         
             let sysPrompt = c.history[0].content;
             
             // ⌚【音乐界面的超级时间感知】
             if (c.awareTime) {
                 const now = new Date(); const h = now.getHours();
                 let timeDesc = h >= 0 && h < 5 ? "凌晨/深夜" : h >= 5 && h < 9 ? "清晨/早晨" : h >= 9 && h < 12 ? "上午" : h >= 12 && h < 14 ? "中午" : h >= 14 && h < 18 ? "下午" : h >= 18 && h < 20 ? "傍晚" : "夜晚";
                 sysPrompt += `\n\n【⌚ 当前现实时间】：${now.toLocaleString()} (${timeDesc})。请务必让你听歌时的情绪、困倦度完美符合这个时间点！`;
             }
         
             sysPrompt += `\n\n==================================================
         【🚨 场景覆盖协议：音乐共听模式 (SOAP. SYMPHONY) 🚨】
         当前场景：你正在和 ${uName} 一起跨时空同步听歌。
         耳机播放：${currentSong} (歌手: ${currentArtist})。
         【严格要求】：
         1. 畅所欲言！你可以自由地表达你的感受、对歌曲的看法或者对 ${uName} 说的话。
         2. 【最高排版警告】：绝对禁止发一大段长篇大论！你必须像发微信一样，把你的话拆分成多个极其简短的气泡！你可以使用 <split> 标签或直接换行来分隔每条消息。
         3. 绝对禁止输出 <thought>, <bpm>, <affection>, <mood> 等数值标签！绝对禁止使用 [Quote: ...] 格式引用我的话！
         4. 语气完美符合人设，根据歌名随口聊聊氛围或直接回应 ${uName}。
         ${actionRule}
         ==================================================`;
         
             let apiMsgs = [{ role: 'system', content: sysPrompt }];
             if (c.memory) apiMsgs.push({ role: 'system', content: `【核心记忆】：\n${c.memory}` });
             
             // 链接聊天软件的上下文：读取主聊天室最近的真实聊天记录（包含你在听歌时发出的旁白记忆）
             let limit = parseInt(gConfig.contextSize) || 15;
             c.history.slice(-limit).forEach(m => {
                 if(m.role !== 'system' && !m.isRevoked) {
                     if (m.role === 'system_sum') {
                         // 抓取隐藏在旁白底层的真实对话发给 AI 听
                         let match = m.content.match(/<span style="display:none;">(.*?)<\/span>/);
                         let hiddenText = match ? match[1] : m.content.replace(/<[^>]+>/g, '').trim();
                         if(hiddenText) apiMsgs.push({ role: 'system', content: hiddenText });
                     } else {
                         let cleanContent = m.content.replace(/<[^>]+>/g, '').trim();
                         if(cleanContent) apiMsgs.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: cleanContent });
                     }
                 }
             });
         
             try {
                 const res = await fetch(`${gConfig.apiUrl}/v1/chat/completions`, {
                     method: 'POST', headers: { 'Authorization': `Bearer ${gConfig.apiKey}`, 'Content-Type': 'application/json' }, 
                     body: JSON.stringify({ model: gConfig.model, messages: apiMsgs, temperature: Number(gConfig.temperature || 0.7) })
                 });
                 
                 if (!res.ok) throw new Error("API Request Failed");
                 const data = await res.json();
                 let rawReply = data.choices[0].message.content.trim();
                 
                 // 🗡️ 终极清洗：无情切除 [Quote: xxx] 和 [引用: xxx]
                 rawReply = rawReply.replace(/\[(?:Quote|引用)[:：\s]*[^\]】]+[\]】]/gi, '');
                 
                 // 🛑 动作隔离墙：如果没有开启“允许动作描写”，直接物理删掉所有星号和括号里的内容
         if (!c.allowAction) {
         rawReply = rawReply.replace(/\*[^*]+\*/g, ''); // 删掉 *...*
         rawReply = rawReply.replace(/（[^）]+）/g, ''); // 删掉 （...）
         rawReply = rawReply.replace(/\([^)]+\)/g, ''); // 删掉 (...)
         }
         
         // 🛑 核心修复：保护切分标记！先把 <split> 统一换成换行符 \n
         rawReply = rawReply.replace(/<\/?split>/gi, '\n');
         
         // 🛑 清理其他无关 HTML 标签，但【绝对保留】换行符 \n
         rawReply = rawReply.replace(/<[^>]+>/g, '').trim();
         if(!rawReply) rawReply = "…";
         
         // 2. 拿到回复后，按换行符切分气泡，确保一句一句发！
         let sentences = rawReply.split('\n');
         sentences = sentences.map(s => s.trim()).filter(s => s);
         
         // 如果切分后依然只有一句，且字数太长，再尝试用标点符号强制切碎兜底
         if (sentences.length === 1 && sentences[0].length > 25) {
         sentences = sentences[0].match(/[^。？！…\n.?!]+[。？！…\n.?!]*/g) || [sentences[0]];
         sentences = sentences.map(s => s.trim()).filter(s => s);
         }
                 
                 let delay = 0;
                 sentences.forEach((sentence, i) => {
                     setTimeout(() => {
                         let wrap;
                         // 停留时间变短：最少停留 2.5 秒，字多的话稍微长一点点
                         let readTime = Math.max(2500, sentence.length * 150); 
                         if (i === 0 && botBubbleWrap.parentNode) {
                             botBubbleText.innerText = sentence;
                             wrap = botBubbleWrap;
                         } else {
                             wrap = spawnHeadBubble('bot', sentence);
                         }
                         clearTimeout(wrap.fadeTimer);
                         wrap.fadeTimer = setTimeout(() => {
                             if(wrap.parentNode) {
                                 wrap.classList.add('fade-out');
                                 setTimeout(() => { if(wrap.parentNode) wrap.remove(); }, 800);
                             }
                         }, readTime);
                     }, delay);
                     // 出下一句的速度大幅加快：基础 1.2 秒 + 每多一个字多等 80 毫秒
                     delay += 1200 + (sentence.length * 80); 
                 });
         
                 // 3. 将 AI 的回应作为后台记忆存入主聊天室！不污染正规聊天气泡！
                 let speakerName = c.chatRemark || c.name;
                 const aiMsg = { 
                     role: 'system_sum', 
                     content: `<span style="color:var(--c-gray-dark); font-size:9px; font-weight:800; font-style:normal; letter-spacing:2px;">🎵 ${speakerName} 在旋律中回应：</span><br><span style="color:var(--c-black); font-size:13px; font-weight:600; font-style:normal; line-height:2;">“${rawReply}”</span>\n<span style="display:none;">[你在听歌时回应了用户]：${rawReply}</span>`
                 };
                 c.history.push(aiMsg);
                 if (typeof appendBubbleRow === 'function') {
                     appendBubbleRow(aiMsg, c.history.length - 1);
                 }
                 saveData();
         
             } catch(e) {
                 if (botBubbleWrap.parentNode) botBubbleText.innerText = "信号干扰...";
                 else spawnHeadBubble('bot', "信号干扰...");
             }
         }
         
         function spawnHeadBubble(role, text) {
             const track = document.getElementById('shared-track');
             const wrap = document.createElement('div'); wrap.className = `head-bubble-wrap ${role}`;
             const bubble = document.createElement('div'); bubble.className = 'head-bubble'; bubble.innerText = text;
             wrap.appendChild(bubble); track.appendChild(wrap);
             // 把 timer 绑在元素上，这样随时可以重置倒计时
             wrap.fadeTimer = setTimeout(() => { if(wrap.parentNode) { wrap.classList.add('fade-out'); setTimeout(() => { if(wrap.parentNode) wrap.remove(); }, 800); } }, 15000);
             return wrap;
         }
         
         // 退出音乐共听模式，写入系统旁白并恢复 UI
         function exitMusicSync() {
             if (currentMusicContactId) {
                 const c = contacts.find(x => x.id === currentMusicContactId);
                 if (c) {
                     // 1. 生成一条灰色旁白写入主聊天室历史
                     const newMsg = { 
                         role: 'system_sum', 
                         content: `<i>✧ 你们结束了跨时空同步听歌，退出了音乐频道。</i>\n<span style="display:none;">[系统旁白：用户退出了音乐软件，你们结束了这次一起听歌的时光。]</span>`
                     };
                     c.history.push(newMsg);
                     
                     // 2. 如果主聊天室在后台刚好是打开状态，把它渲染出来
                     if (typeof appendBubbleRow === 'function' && document.getElementById('view-chat').classList.contains('slide-in') && currentContactId === currentMusicContactId) {
                         appendBubbleRow(newMsg, c.history.length - 1);
                     }
                     saveData();
                 }
             }
             
             // 3. 彻底清空陪听联系人绑定，并将音乐界面的头像恢复成初始的 ➕ 号
             currentMusicContactId = null; 
             const themAvatarEl = document.getElementById('music-them-avatar');
             if (themAvatarEl) {
                 themAvatarEl.innerHTML = '<div style="font-size:24px; color:var(--c-dyn-text); font-weight: 300;">+</div>';
             }
             
             // 最后，执行退出动作回到桌面
             closeCurrentApps(); 
         }
         
         // --- 播放器原生核心逻辑 ---
         function parseRawLyrics(lrcString) {
             if (!lrcString) return null;
             const lines = lrcString.split('\n');
             const timeReg = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g; 
             const parsedLines = [];
             lines.forEach(line => {
                 const text = line.replace(/\[.*?\]/g, '').trim();
                 if (text) {
                     let match;
                     while ((match = timeReg.exec(line)) !== null) {
                         const time = parseInt(match[1]) * 60 + parseInt(match[2]) + parseInt(match[3].length === 2 ? match[3] + '0' : match[3]) / 1000;
                         parsedLines.push({ time, text });
                     }
                 }
             });
             if (parsedLines.length > 0) {
                 parsedLines.sort((a,b) => a.time - b.time);
                 const groups = [];
                 parsedLines.forEach(line => {
                     if(groups.length === 0) groups.push({ time: line.time, lines: [line.text] });
                     else {
                         const last = groups[groups.length - 1];
                         if (Math.abs(last.time - line.time) < 0.1) last.lines.push(line.text);
                         else groups.push({ time: line.time, lines: [line.text] });
                     }
                 });
                 return groups;
             }
             return null;
         }
         
         function handleContextMenu(e, el) { e.preventDefault(); if (isCuratorMode) return; isLongPressing = true; setTimeout(() => isLongPressing = false, 500); document.querySelectorAll('#app-music .show-actions').forEach(n => { if (n !== el) n.classList.remove('show-actions'); }); el.classList.add('show-actions'); }
         function handleItemClick(e, cat, index, el) { if (isLongPressing) { e.preventDefault(); e.stopPropagation(); return; } if(e.target.closest('.capsule-import')) { e.stopPropagation(); return; } if(e.target.closest('.cap-add-btn') || e.target.closest('.sq-add-btn')) { e.stopPropagation(); addToPlaylist(cat, index, e.target.closest('.cap-add-btn') || e.target.closest('.sq-add-btn')); return; } if (isCuratorMode) openConfigModal(cat, index); else playFromMenu(cat, index); }
         
         function toggleCuratorMode() { isCuratorMode = !isCuratorMode; const menu = document.getElementById('master-menu'); if (isCuratorMode) menu.classList.add('is-curator'); else menu.classList.remove('is-curator'); renderDailyPicks(); renderTrackList(currentCategory); }
         function renderDailyPicks() { const container = document.getElementById('daily-gallery'); container.innerHTML = ''; m_db.daily.forEach((item, index) => { container.innerHTML += `<div class="sq-card" onclick="handleItemClick(event, 'daily', ${index}, this)" oncontextmenu="handleContextMenu(event, this)"><img src="${item.img}"><div class="sq-title">${item.title}</div><div class="sq-add-btn"><svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div></div>`; }); }
         function switchCategory(cat) { currentCategory = cat; document.querySelectorAll('#app-music .cat-item').forEach(el => el.classList.remove('active')); document.getElementById(`cat-${cat}`).classList.add('active'); const container = document.getElementById('track-list-container'); container.style.animation = 'none'; container.offsetHeight; container.style.animation = null; renderTrackList(cat); }
         function renderTrackList(cat) { const container = document.getElementById('track-list-container'); let html = ''; m_db.tracks[cat].forEach((item, index) => { const btnText = isCuratorMode ? 'EDIT ✎' : 'PLAY ↗'; html += `<div class="capsule-item" onclick="handleItemClick(event, '${cat}', ${index}, this)" oncontextmenu="handleContextMenu(event, this)"><div class="cap-cover"><img src="${item.img}"></div><div class="cap-meta"><div class="cap-title">${item.title}</div><div class="cap-artist">${item.artist}</div></div><div class="cap-actions"><div class="cap-add-btn"><svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div><div class="cap-play-btn">${btnText}</div></div></div>`; }); html += `<div class="capsule-item capsule-import" onclick="openMusicImport()"><div class="cap-title">☁ CLOUD IMPORT</div></div>`; html += `<div class="capsule-item capsule-import" onclick="openCreateModal()"><div class="cap-title">+ LOCAL AUDIO</div></div>`; container.innerHTML = html; }
         
         function addToPlaylist(cat, index, btnEl) { const track = cat === 'daily' ? m_db.daily[index] : m_db.tracks[cat][index]; playlist.push(track); const originalHTML = btnEl.innerHTML; btnEl.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" stroke="currentColor" stroke-width="2" fill="none"/></svg>'; setTimeout(() => btnEl.innerHTML = originalHTML, 1000); renderPlaylistSidebar(); }
         function removeFromPlaylist(e, index) { e.stopPropagation(); playlist.splice(index, 1); if (currentPlaylistIndex === index) currentPlaylistIndex = -1; else if (currentPlaylistIndex > index) currentPlaylistIndex--; renderPlaylistSidebar(); }
         function togglePlaylist() { document.getElementById('playlist-sidebar').classList.toggle('show'); renderPlaylistSidebar(); }
         function renderPlaylistSidebar() { const container = document.getElementById('pl-list-container'); if (playlist.length === 0) { container.innerHTML = '<div style="opacity:0.3; font-size:10px; font-family:var(--font-mono); letter-spacing:2px; text-align:center; margin-top:20px;">LIST IS EMPTY.</div>'; return; } let html = ''; playlist.forEach((item, index) => { const isActive = (currentPlaylistIndex === index) ? 'active' : ''; html += `<div class="pl-item ${isActive}" onclick="playFromPlaylist(${index})"><img class="pl-cover" src="${item.img}"><div class="pl-info"><div class="pl-title">${item.title}</div><div class="pl-artist">${item.artist}</div></div><div class="pl-remove-btn" onclick="removeFromPlaylist(event, ${index})" title="Remove"><svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"></line></svg></div></div>`; }); container.innerHTML = html; }
         
         async function executePlay(track) {
             currentPlayingData = track;
             document.getElementById('player-title').innerText = track.title; document.getElementById('player-artist').innerText = track.artist;
             if (!isBgPinned) { document.getElementById('bg-image-layer').style.backgroundImage = `url(${track.img})`; analyzeBgBrightness(track.img); }
             const audio = document.getElementById('sys-audio'); const btn = document.getElementById('main-play-btn');
             document.getElementById('audio-progress-circle').style.strokeDashoffset = 226;
             if (!track.parsedLyrics && track.lyric) track.parsedLyrics = parseRawLyrics(track.lyric);
             globalIsPlaying = true;

             let audioSrc = track.audio;
             if (!audioSrc && track.ncmId && typeof miGetSongUrl === 'function') {
                 document.getElementById('player-artist').innerText = track.artist + ' (加载中...)';
                 audioSrc = await miGetSongUrl(track.ncmId);
                 if (audioSrc) document.getElementById('player-artist').innerText = track.artist;
                 else document.getElementById('player-artist').innerText = track.artist + ' (无源)';
             }

             if (audioSrc) { audio.src = audioSrc; audio.play().then(() => { btn.innerText = '||'; updateMiniCapsuleState(true); }).catch(e => { globalIsPlaying = false; btn.innerText = '▶'; updateMiniCapsuleState(false); }); } else { audio.pause(); audio.removeAttribute('src'); btn.innerText = '||'; updateMiniCapsuleState(true); }
             startLyricsSync(audio, track.parsedLyrics); renderPlaylistSidebar();
             
             if (document.getElementById('soapFloatPlayer').classList.contains('show')) {
                 updateFloatingPlayerUI();
             }
         }
         
         // 核心修复：补回丢失的切歌引擎
         function playNextSong(direction) {
             if (!currentPlayingData) return;
         
             // 如果当前正在播放列表 (Playlist) 中的歌
             if (playlist.length > 0 && currentPlaylistIndex !== -1) {
                 currentPlaylistIndex += direction;
                 if (currentPlaylistIndex >= playlist.length) currentPlaylistIndex = 0;
                 if (currentPlaylistIndex < 0) currentPlaylistIndex = playlist.length - 1;
                 executePlay(playlist[currentPlaylistIndex]);
             } else {
                 // 如果没加入列表，直接在当前分类里切歌
                 let listToSearch = [];
                 if (m_db.daily.find(t => t.title === currentPlayingData.title)) listToSearch = m_db.daily;
                 else if (currentCategory && m_db.tracks[currentCategory]) listToSearch = m_db.tracks[currentCategory];
                 
                 if (listToSearch.length > 0) {
                     let idx = listToSearch.findIndex(t => t.title === currentPlayingData.title);
                     idx += direction;
                     if (idx >= listToSearch.length) idx = 0;
                     if (idx < 0) idx = listToSearch.length - 1;
                     executePlay(listToSearch[idx]);
                 }
             }
         }
         
         function playFromMenu(catOrType, index) { const track = catOrType === 'daily' ? m_db.daily[index] : m_db.tracks[catOrType][index]; let pIndex = playlist.findIndex(t => t === track); if (pIndex === -1) { playlist.push(track); pIndex = playlist.length - 1; } currentPlaylistIndex = pIndex; executePlay(track); enterPlayer(); }
         function playFromPlaylist(index) { currentPlaylistIndex = index; executePlay(playlist[index]); }
         function toggleGlobalPlay() { 
             const audio = document.getElementById('sys-audio'); const btn = document.getElementById('main-play-btn'); 
             globalIsPlaying = !globalIsPlaying; 
             if (audio.src && audio.src !== window.location.href) { if (globalIsPlaying) audio.play(); else audio.pause(); } 
             btn.innerText = globalIsPlaying ? '||' : '▶'; updateMiniCapsuleState(globalIsPlaying); 
             
             // 同步悬浮窗播放状态
             const fp = document.getElementById('soapFloatPlayer');
             if(globalIsPlaying) {
                 fp.classList.add('is-playing');
                 document.getElementById('icon-play').style.display = 'none';
                 document.getElementById('icon-pause').style.display = 'block';
             } else {
                 fp.classList.remove('is-playing');
                 document.getElementById('icon-play').style.display = 'block';
                 document.getElementById('icon-pause').style.display = 'none';
             }
         }
         
         // === 🎵 播放模式切换与自动切歌引擎 ===
         let playMode = 'playlist'; // 默认列表循环：'playlist' 或 'single'
         
         function togglePlayMode() {
             const btn = document.getElementById('btn-play-mode');
             const iconList = btn.querySelector('.icon-loop-list');
             const iconSingle = btn.querySelector('.icon-loop-single');
             
             if (playMode === 'playlist') {
                 playMode = 'single';
                 btn.title = "单曲循环";
                 iconList.style.display = 'none';
                 iconSingle.style.display = 'block';
             } else {
                 playMode = 'playlist';
                 btn.title = "列表循环";
                 iconList.style.display = 'block';
                 iconSingle.style.display = 'none';
             }
         }
         
         // 监听音乐播放结束事件，实现自动循环，并通知聊天室
         document.addEventListener('DOMContentLoaded', () => {
             const audio = document.getElementById('sys-audio');
             if (audio) {
                 audio.addEventListener('ended', function() {
                     // 先预判下一首歌是什么
                     let nextSongData = currentPlayingData;
                     if (playMode === 'playlist' && playlist.length > 0) {
                         let nextIndex = currentPlaylistIndex + 1;
                         if (nextIndex >= playlist.length) nextIndex = 0;
                         nextSongData = playlist[nextIndex];
                     }
         
                     // 向主聊天室推送切歌/循环的隐藏信息
                     if (typeof currentMusicContactId !== 'undefined' && currentMusicContactId) {
                         const c = contacts.find(x => x.id === currentMusicContactId);
                         if (c && typeof currentPlayingData !== 'undefined' && currentPlayingData) {
                             let modeStr = "";
                             if (playMode === 'single') {
                                 modeStr = `一遍又一遍地为您单曲循环着《${currentPlayingData.title}》`;
                             } else {
                                 if (playlist.length <= 1) {
                                     modeStr = `列表里只有一首歌，所以继续为您播放《${currentPlayingData.title}》`;
                                 } else {
                                     modeStr = `自动切换到了下一首：《${nextSongData.title}》 (歌手: ${nextSongData.artist})`;
                                 }
                             }
                             
                             let aiPrompt = `[系统旁白：刚才那首歌播放结束了。播放器当前设置为${playMode === 'single' ? '单曲循环' : '列表循环'}，${modeStr}。如果有感觉，你可以顺理成章地感慨一句刚才的歌，或者自然地带入到新歌的氛围中。]`;
                             
                             const newMsg = {
                                 role: 'system_sum',
                                 content: `<i>✧ 一曲终了。播放器${modeStr}。</i>\n<span style="display:none;">${aiPrompt}</span>`
                             };
                             c.history.push(newMsg);
                             saveData();
                             
                             // 同步渲染聊天室UI
                             if (typeof appendBubbleRow === 'function' && document.getElementById('view-chat').classList.contains('slide-in') && currentContactId === currentMusicContactId) {
                                 appendBubbleRow(newMsg, c.history.length - 1);
                             }
                         }
                     }
         
                     // 物理执行切歌操作
                     if (playMode === 'single' || playlist.length <= 1) {
                         // 如果是单曲循环，或者列表只有一首歌，直接拉回进度条重播，无缝衔接
                         this.currentTime = 0;
                         this.play();
                     } else {
                         // 列表有两首以上才真正去切歌
                         playNextSong(1); 
                     }
                 });
             }
         });
         
         function openCreateModal() { editTarget = { type: 'create' }; tempLocalBlobs = {}; tempParsedLyrics = null; document.getElementById('cm-title').innerText = 'NEW TRACK CONFIG'; document.getElementById('cfg-btn-delete').style.display = 'none'; document.getElementById('cfg-title').value = ''; document.getElementById('cfg-artist').value = ''; document.getElementById('cfg-img').value = ''; document.getElementById('cfg-audio').value = ''; document.getElementById('cfg-lyric').value = ''; document.getElementById('config-modal').classList.add('show'); }
         function handleLocalUpload(event, targetInputId) { 
             const file = event.target.files[0]; 
             if(file) { 
                 const inputEl = document.getElementById(targetInputId); 
                 inputEl.value = `[LOCAL] ${file.name}`; 
                 inputEl.style.color = "#D63031"; 
                 setTimeout(() => inputEl.style.color = "", 1000); 
                 
                 const reader = new FileReader();
                 if (targetInputId === 'cfg-lyric') { 
                     reader.onload = function(e) { 
                         tempLocalBlobs[targetInputId] = e.target.result;
                         tempParsedLyrics = parseRawLyrics(e.target.result); 
                     }; 
                     reader.readAsText(file); 
                 } else {
                     reader.onload = function(e) {
                         tempLocalBlobs[targetInputId] = e.target.result;
                     };
                     // 将封面和音频读取为 Base64 并保存下来，这样下次刷新就不会丢了
                     reader.readAsDataURL(file);
                 }
             } 
         }
         function openConfigModal(type, index) { 
             editTarget = { type, index }; tempLocalBlobs = {}; tempParsedLyrics = null; 
             const modal = document.getElementById('config-modal'); 
             let data = type === 'daily' ? m_db.daily[index] : m_db.tracks[currentCategory][index]; 
             document.getElementById('cm-title').innerText = type === 'daily' ? 'CURATION CONFIG' : 'TRACK CONFIG'; 
             
             const delBtn = document.getElementById('cfg-btn-delete');
             if (type === 'daily') {
                 delBtn.style.display = 'block';
                 delBtn.innerText = 'RESET';
             } else if (type === 'create') {
                 delBtn.style.display = 'none';
             } else {
                 delBtn.style.display = 'block';
                 delBtn.innerText = 'DELETE';
             }
         
             document.getElementById('cfg-title').value = data.title || ""; 
             document.getElementById('cfg-artist').value = data.artist || ""; 
             document.getElementById('cfg-img').value = (data.img && data.img.startsWith('data:image')) ? '[LOCAL IMAGE BUFFER]' : (data.img || ""); 
             document.getElementById('cfg-audio').value = (data.audio && data.audio.startsWith('data:audio')) ? '[LOCAL AUDIO BUFFER]' : (data.audio || ""); 
             document.getElementById('cfg-lyric').value = (data.lyric && data.lyric.length > 200 && !data.lyric.startsWith('http')) ? '[LOCAL LYRIC BUFFER]' : (data.lyric || ""); 
             modal.classList.add('show'); 
         }
         
         function closeConfigModal() { document.getElementById('config-modal').classList.remove('show'); editTarget = null; }
         
         function deleteConfig() {
             if (!editTarget || editTarget.type === 'create') return;
             if (editTarget.type === 'daily') {
                 if (confirm("确定要将此推荐位恢复为系统默认曲目吗？")) {
                     m_db.daily[editTarget.index] = JSON.parse(JSON.stringify(default_m_db.daily[editTarget.index]));
                     saveMusicDB();
                     renderDailyPicks();
                     closeConfigModal();
                 }
             } else {
                 if (confirm("确定要永久删除这首曲目吗？")) {
                     m_db.tracks[currentCategory].splice(editTarget.index, 1);
                     saveMusicDB();
                     renderTrackList(currentCategory);
                     closeConfigModal();
                 }
             }
         }
         
         function saveConfig() { 
             if (!editTarget) return; 
             const titleInput = document.getElementById('cfg-title').value.trim(); 
             const imgInput = document.getElementById('cfg-img').value.trim(); 
             const artistInput = document.getElementById('cfg-artist').value.trim(); 
             const audioInput = document.getElementById('cfg-audio').value.trim(); 
             const lyricInput = document.getElementById('cfg-lyric').value.trim(); 
             if (editTarget.type === 'create') { 
                 const newTrack = { 
                     title: titleInput || "Untitled Track", 
                     artist: artistInput || "Unknown Artist", 
                     img: tempLocalBlobs['cfg-img'] || imgInput || "https://images.unsplash.com/photo-1614113489855-66422ad300a4?q=80&w=150&auto=format&fit=crop", 
                     audio: tempLocalBlobs['cfg-audio'] || audioInput || "", 
                     lyric: tempLocalBlobs['cfg-lyric'] || lyricInput || "" 
                 }; 
                 if (tempParsedLyrics) newTrack.parsedLyrics = tempParsedLyrics; 
                 m_db.tracks[currentCategory].push(newTrack); 
                 renderTrackList(currentCategory); 
                 closeConfigModal(); 
                 saveMusicDB();
                 setTimeout(() => document.getElementById('master-menu').scrollTo({ top: 9999, behavior: 'smooth' }), 50); 
                 return; 
             } 
             let targetRef = editTarget.type === 'daily' ? m_db.daily[editTarget.index] : m_db.tracks[currentCategory][editTarget.index]; 
             if (titleInput) targetRef.title = titleInput; 
             if (artistInput) targetRef.artist = artistInput; 
             if (imgInput !== '[LOCAL IMAGE BUFFER]') targetRef.img = tempLocalBlobs['cfg-img'] || imgInput || targetRef.img; 
             if (audioInput !== '[LOCAL AUDIO BUFFER]') targetRef.audio = tempLocalBlobs['cfg-audio'] || audioInput || targetRef.audio; 
             if (lyricInput !== '[LOCAL LYRIC BUFFER]') targetRef.lyric = tempLocalBlobs['cfg-lyric'] || lyricInput || targetRef.lyric; 
             if (tempParsedLyrics) targetRef.parsedLyrics = tempParsedLyrics; 
             if (editTarget.type === 'daily') renderDailyPicks(); else renderTrackList(currentCategory); 
             saveMusicDB();
             closeConfigModal(); 
         }
         
         function enterPlayer() { document.getElementById('master-menu').classList.add('hidden'); document.getElementById('mini-player-capsule').classList.remove('show'); let miOverlay = document.getElementById('mi-overlay'); if (miOverlay) miOverlay.style.display = 'none'; }
         function exitPlayer() { document.getElementById('master-menu').classList.remove('hidden'); document.getElementById('playlist-sidebar').classList.remove('show'); if (currentPlayingData) { const cap = document.getElementById('mini-player-capsule'); document.getElementById('mini-cap-img').src = currentPlayingData.img; document.getElementById('mini-cap-title').innerText = currentPlayingData.title; document.getElementById('mini-cap-artist').innerText = currentPlayingData.artist || 'Curation Selection'; cap.classList.add('show'); updateMiniCapsuleState(globalIsPlaying); } }
         function updateMiniCapsuleState(isPlaying) { const eq = document.getElementById('mini-eq'); if(isPlaying) eq.classList.remove('paused'); else eq.classList.add('paused'); }
         
         function analyzeBgBrightness(imageSrc) { const img = new Image(); img.crossOrigin = "Anonymous"; img.src = imageSrc; img.onload = function() { const tempCanvas = document.createElement('canvas'); const ctx = tempCanvas.getContext('2d'); tempCanvas.width = 100; tempCanvas.height = 100; ctx.drawImage(img, 0, 0, 100, 100); try { const data = ctx.getImageData(0, 0, 100, 100).data; let r = 0, g = 0, b = 0; for (let i = 0; i < data.length; i += 4) { r += data[i]; g += data[i+1]; b += data[i+2]; } const count = data.length / 4; const brightness = ((r/count)*299 + (g/count)*587 + (b/count)*114)/1000; if (brightness < 145) document.getElementById('app-music').classList.add('dark-mode'); else document.getElementById('app-music').classList.remove('dark-mode'); } catch(e) {} }; }
         function uploadBackground(event) { const file = event.target.files[0]; if(file) { const reader = new FileReader(); reader.onload = function(e) { const bgLayer = document.getElementById('bg-image-layer'); bgLayer.style.backgroundImage = `url(${e.target.result})`; analyzeBgBrightness(e.target.result); if (!isBgPinned) { toggleBgLock(); } else { pinnedBgUrl = e.target.result; } }; reader.readAsDataURL(file); } }
         function toggleBgLock() { isBgPinned = !isBgPinned; const btn = document.getElementById('btn-lock-bg'); if (isBgPinned) { btn.classList.add('active-lock'); btn.title = "解除壁纸锁定"; const bgLayer = document.getElementById('bg-image-layer'); let currentBg = bgLayer.style.backgroundImage; pinnedBgUrl = currentBg.replace(/^url\(["']?/, '').replace(/["']?\)$/, ''); } else { btn.classList.remove('active-lock'); btn.title = "固定当前壁纸"; pinnedBgUrl = ""; if (currentPlayingData && currentPlayingData.img) { document.getElementById('bg-image-layer').style.backgroundImage = `url(${currentPlayingData.img})`; analyzeBgBrightness(currentPlayingData.img); } } }
         
         let isDraggingProgress = false; let dragCurrentPct = 0;
         function getAnglePct(e) { const progressSvg = document.getElementById('progress-svg'); const rect = progressSvg.getBoundingClientRect(); const cx = rect.left + rect.width / 2; const cy = rect.top + rect.height / 2; let clientX = e.touches ? e.touches[0].clientX : e.clientX; let clientY = e.touches ? e.touches[0].clientY : e.clientY; let dx = clientX - cx; let dy = clientY - cy; let angle = Math.atan2(dy, dx) * (180 / Math.PI); angle += 90; if (angle < 0) angle += 360; return angle / 360; }
         function updateProgressUI(pct) { pct = Math.max(0, Math.min(1, pct)); const offset = 226 - (pct * 226); document.getElementById('audio-progress-circle').style.strokeDashoffset = offset; }
         function bindProgressEvents() { const progressSvg = document.getElementById('progress-svg'); const playWrapper = document.getElementById('play-wrapper'); const audioEl = document.getElementById('sys-audio'); progressSvg.addEventListener('mousedown', onDragStart); progressSvg.addEventListener('touchstart', onDragStart, { passive: false }); window.addEventListener('mousemove', onDragMove); window.addEventListener('touchmove', onDragMove, { passive: false }); window.addEventListener('mouseup', onDragEnd); window.addEventListener('touchend', onDragEnd); function onDragStart(e) { if(e.type === "mousedown" && e.button !== 0) return; if(e.target.closest('#main-play-btn')) return; e.preventDefault(); isDraggingProgress = true; playWrapper.classList.add('is-dragging-progress'); dragCurrentPct = getAnglePct(e); updateProgressUI(dragCurrentPct); } function onDragMove(e) { if (!isDraggingProgress) return; e.preventDefault(); dragCurrentPct = getAnglePct(e); updateProgressUI(dragCurrentPct); } function onDragEnd(e) { if (!isDraggingProgress) return; isDraggingProgress = false; playWrapper.classList.remove('is-dragging-progress'); if (audioEl.duration && !isNaN(audioEl.duration)) { audioEl.currentTime = dragCurrentPct * audioEl.duration; if (currentLyricsArray) { let ct = audioEl.currentTime; let targetIndex = -1; for(let i=0; i<currentLyricsArray.length; i++) { if(ct >= currentLyricsArray[i].time) targetIndex = i; else break; } if(targetIndex !== -1 && targetIndex !== currentActiveGroupIndex) { currentActiveGroupIndex = targetIndex; renderLyricsGroup(currentLyricsArray, targetIndex, false); } } } } }
         bindProgressEvents();
         
         let currentLyricsArray = null; let currentActiveGroupIndex = -1; let fallbackTimer = null;
         function toggleLyricMode() { const container = document.getElementById('lyrics-container'); container.classList.toggle('center-mode'); if(currentLyricsArray && currentActiveGroupIndex !== -1) { renderLyricsGroup(currentLyricsArray, currentActiveGroupIndex, !document.getElementById('sys-audio').src); } }
         function startLyricsSync(audioEl, parsedLyrics) { clearInterval(fallbackTimer); currentActiveGroupIndex = -1; const circle = document.getElementById('audio-progress-circle'); const fpFill = document.getElementById('fpProgressFill'); if (parsedLyrics && parsedLyrics.length > 0) { currentLyricsArray = parsedLyrics; audioEl.ontimeupdate = () => { if(audioEl.duration && !isDraggingProgress) { const pct = audioEl.currentTime / audioEl.duration; circle.style.strokeDashoffset = isNaN(pct) ? 226 : 226 - (pct * 226); if(fpFill) fpFill.style.width = (isNaN(pct) ? 0 : pct * 100) + '%'; } const ct = audioEl.currentTime; let targetIndex = -1; for(let i=0; i<parsedLyrics.length; i++) { if(ct >= parsedLyrics[i].time) targetIndex = i; else break; } if(targetIndex !== -1 && targetIndex !== currentActiveGroupIndex) { currentActiveGroupIndex = targetIndex; renderLyricsGroup(parsedLyrics, targetIndex, false); } }; } else { audioEl.ontimeupdate = () => { if(audioEl.duration && !isDraggingProgress) { const pct = audioEl.currentTime / audioEl.duration; circle.style.strokeDashoffset = 226 - (pct * 226); if(fpFill) fpFill.style.width = (pct * 100) + '%'; } }; const defaultLyrics = [ { time: 0, lines: ["“黑白琴键之间，", "藏着我的呼吸。”"] }, { time: 7, lines: ["“不越界，", "却在同一个和弦里共振。”"] }, { time: 14, lines: ["“不需要语言。”"] }, { time: 21, lines: ["“耳机里流淌的，", "是我们共有的潜意识。”"] } ]; currentLyricsArray = defaultLyrics; currentActiveGroupIndex = 0; renderLyricsGroup(defaultLyrics, 0, true); fallbackTimer = setInterval(() => { currentActiveGroupIndex = (currentActiveGroupIndex + 1) % defaultLyrics.length; renderLyricsGroup(defaultLyrics, currentActiveGroupIndex, true); }, 7000); } }
         function renderLyricsGroup(lyricsArray, index, isLooping = false) { const container = document.getElementById('lyrics-container'); const isCenter = container.classList.contains('center-mode'); container.innerHTML = ''; const group = lyricsArray[index]; if(!group) return; const nextIndex = index + 1; let nextGroup = null; if (nextIndex < lyricsArray.length) nextGroup = lyricsArray[nextIndex]; else if (isLooping) nextGroup = lyricsArray[0]; let timeSpan = 3; if (nextGroup && nextGroup.time !== undefined && group.time !== undefined) { timeSpan = nextGroup.time - group.time; if (timeSpan <= 0) timeSpan = 3; } else if (isLooping) { timeSpan = 7; } let totalTokens = 0; const processedLines = []; group.lines.forEach(line => { let tokens = line.match(/[\u4e00-\u9fa5]|[^ \u4e00-\u9fa5]+|\s+/g) || []; if (isCenter && line.length > 12 && tokens.length > 5) { const mid = Math.ceil(tokens.length / 2); totalTokens += tokens.length; processedLines.push(tokens.slice(0, mid)); processedLines.push(tokens.slice(mid)); } else { totalTokens += tokens.length; processedLines.push(tokens); } }); const wrapper = document.createElement('div'); wrapper.className = 'lyric-wrapper'; const activeDiv = document.createElement('div'); activeDiv.className = 'lyric-active'; if (isCenter && processedLines.length > 1) activeDiv.classList.add('staggered-layout'); const activeDuration = Math.max(timeSpan * 0.75, 0.5); const interval = totalTokens > 1 ? activeDuration / totalTokens : 0; let delayCounter = 0; processedLines.forEach((tokens) => { const lineDiv = document.createElement('div'); lineDiv.className = 'lyric-line'; tokens.forEach((token) => { const span = document.createElement('span'); if (!token.trim()) { span.innerHTML = '&nbsp;'; } else { span.className = 'lyric-word'; span.innerText = token; span.style.animationDuration = `1.5s`; span.style.animationDelay = `${delayCounter}s`; delayCounter += interval; } lineDiv.appendChild(span); }); activeDiv.appendChild(lineDiv); }); wrapper.appendChild(activeDiv); if (nextGroup) { const nextDiv = document.createElement('div'); nextDiv.className = 'lyric-next'; let nextText = nextGroup.lines.join(" "); if(isCenter) if (nextText.length > 20) nextText = nextText.substring(0, 18) + '...'; nextDiv.innerText = `/. ${nextText}`; wrapper.appendChild(nextDiv); } container.appendChild(wrapper); 
             
             // 把歌词同步推给悬浮窗
             if(group && group.lines.length > 0) {
                 document.getElementById('fp-lyric-cn').innerText = `“${group.lines[0]}”`;
                 if(group.lines.length > 1) document.getElementById('fp-lyric-en').innerText = group.lines[1];
                 else document.getElementById('fp-lyric-en').innerText = "...";
             }
         }
         
         // ================= 悬浮播放器物理引擎 =================
         function updateFloatingPlayerUI() {
             if(!currentPlayingData) return;
             document.getElementById('fp-title').innerText = currentPlayingData.title;
             document.getElementById('fp-artist').innerText = currentPlayingData.artist || 'Curation Selection';
             document.getElementById('fp-vinyl-img').style.backgroundImage = `url(${currentPlayingData.img})`;
             document.getElementById('fp-vinyl-img').style.backgroundSize = 'cover';
             document.getElementById('fp-vinyl-img').style.color = 'transparent';
             if(globalIsPlaying) {
                 document.getElementById('soapFloatPlayer').classList.add('is-playing');
                 document.getElementById('icon-play').style.display = 'none';
                 document.getElementById('icon-pause').style.display = 'block';
             } else {
                 document.getElementById('soapFloatPlayer').classList.remove('is-playing');
                 document.getElementById('icon-play').style.display = 'block';
                 document.getElementById('icon-pause').style.display = 'none';
             }
         }
         
         function toggleFloatLyrics() {
             const fp = document.getElementById('soapFloatPlayer');
             const btnSvg = document.querySelector('#fpExpandBtn svg');
             fp.classList.toggle('is-expanded');
             if (fp.classList.contains('is-expanded')) btnSvg.style.transform = 'rotate(180deg)';
             else btnSvg.style.transform = 'rotate(0deg)';
         }
         
         // 🚀 修复：手动收起悬浮播放器，仅隐藏 UI，不再停止音乐或结束同步
         function closeFloatingPlayer(e) {
             if(e) e.stopPropagation();
             document.getElementById('soapFloatPlayer').classList.remove('show');
             // 仅标记 UI 已关闭，不触发 toggleGlobalPlay()，让音乐和同步在后台继续
             window.isFloatingPlayerDismissed = true; 
         }
         
         document.addEventListener('DOMContentLoaded', () => {
             const player = document.getElementById('soapFloatPlayer');
             const dragHandle = document.getElementById('fpDragHandle');
             if(!player || !dragHandle) return;
         
             let isDragging = false;
             let currentX = 0, currentY = 0;
             let initialX = 0, initialY = 0;
             let xOffset = 0, yOffset = 0;
         
             // 🚀 优化：扩大拖拽范围。现在点击整个卡片（排除按钮、进度条、展开区域）均可拖拽
             const handleDragInitiation = (e) => {
                 // 如果点击的是按钮、进度条、或已经展开的歌词区域，则不触发拖拽
                 if (e.target.closest('button') || e.target.closest('#fpProgressWrap') || e.target.closest('.fp-lyrics-area')) {
                     return;
                 }
                 dragStart(e);
             };

             player.addEventListener('mousedown', handleDragInitiation);
             player.addEventListener('touchstart', handleDragInitiation, { passive: false });
         
             window.addEventListener('mousemove', dragMove);
             window.addEventListener('touchmove', dragMove, { passive: false });
             window.addEventListener('mouseup', dragEnd);
             window.addEventListener('touchend', dragEnd);
         
             function dragStart(e) {
                 if (e.type === "mousedown" && e.button !== 0) return;
                 if (e.type === "touchstart") { initialX = e.touches[0].clientX - xOffset; initialY = e.touches[0].clientY - yOffset;
                 } else { initialX = e.clientX - xOffset; initialY = e.clientY - yOffset; }
                 isDragging = true;
                 player.style.transition = "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)";
                 player.style.transform = `translate3d(calc(-50% + ${xOffset}px), ${yOffset}px, 0) scale(1.03)`;
             }
         
             function dragMove(e) {
                 if (!isDragging) return;
                 e.preventDefault(); 
                 if (e.type === "touchmove") { currentX = e.touches[0].clientX - initialX; currentY = e.touches[0].clientY - initialY;
                 } else { currentX = e.clientX - initialX; currentY = e.clientY - initialY; }
                 xOffset = currentX; yOffset = currentY;
                 player.style.transition = "none";
                 player.style.transform = `translate3d(calc(-50% + ${currentX}px), ${currentY}px, 0) scale(1.03)`;
             }
         
             function dragEnd(e) {
                 if (!isDragging) return;
                 isDragging = false;
                 player.style.transition = "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)";
                 player.style.transform = `translate3d(calc(-50% + ${currentX}px), ${currentY}px, 0) scale(1)`;
             }
         
             // --- 悬浮窗进度条控制逻辑 ---
             const fpProgressWrap = document.getElementById('fpProgressWrap');
             const audioEl = document.getElementById('sys-audio');
             let isFpDraggingProgress = false;
         
             function updateAudioFromFp(e) {
                 if (!audioEl.duration || isNaN(audioEl.duration)) return;
                 const rect = fpProgressWrap.getBoundingClientRect();
                 
                 let clientX;
                 if (e.type.includes('touch')) {
                     // 修复 touchend 时 e.touches 为空的报错问题
                     let touch = e.touches.length > 0 ? e.touches[0] : e.changedTouches[0];
                     if (!touch) return;
                     clientX = touch.clientX;
                 } else {
                     clientX = e.clientX;
                 }
                 
                 let clickX = clientX - rect.left;
                 let pct = Math.max(0, Math.min(1, clickX / rect.width));
                 
                 // 实时更新UI
                 const fpFill = document.getElementById('fpProgressFill');
                 if (fpFill) {
                     fpFill.style.transition = isFpDraggingProgress ? 'none' : 'width 0.1s linear'; // 拖动时绝对跟手，取消缓动
                     fpFill.style.width = (pct * 100) + '%';
                 }
                 
                 // 如果拖拽结束，才真正去改音乐进度，防止卡顿
                 if (!isFpDraggingProgress) {
                     audioEl.currentTime = pct * audioEl.duration;
                 }
             }
         
             fpProgressWrap.addEventListener('mousedown', (e) => {
                 e.stopPropagation();
                 isFpDraggingProgress = true;
                 isDraggingProgress = true; // 借用全局变量锁死音频原有的 ontimeupdate 冲突
                 updateAudioFromFp(e);
             });
             fpProgressWrap.addEventListener('touchstart', (e) => {
                 e.stopPropagation();
                 isFpDraggingProgress = true;
                 isDraggingProgress = true;
                 updateAudioFromFp(e);
             }, { passive: false }); // 必须是 false 才能在需要时 preventDefault
         
             window.addEventListener('mousemove', (e) => {
                 if (isFpDraggingProgress) updateAudioFromFp(e);
             });
             window.addEventListener('touchmove', (e) => {
                 if (isFpDraggingProgress) {
                     e.preventDefault(); // 阻止页面跟随滚动，保证丝滑拖拽
                     updateAudioFromFp(e);
                 }
             }, { passive: false });
         
             window.addEventListener('mouseup', (e) => {
                 if (isFpDraggingProgress) {
                     isFpDraggingProgress = false;
                     updateAudioFromFp(e);
                     setTimeout(() => isDraggingProgress = false, 50);
                 }
             });
             window.addEventListener('touchend', (e) => {
                 if (isFpDraggingProgress) {
                     isFpDraggingProgress = false;
                     updateAudioFromFp(e);
                     setTimeout(() => isDraggingProgress = false, 50);
                 }
             });
         });
         // ======================================================
         
