         
         function deleteApiPreset(idx) {
             if(confirm("确定要删除这个预设吗？")) {
                 gConfig.apiPresets.splice(idx, 1);
                 saveGlobal();
                 openApiPresetManager(); 
             }
         }
         
         // ================= 字体预设库管理逻辑 =================
         function openFontPresetManager() {
             const list = document.getElementById('font-preset-list');
             list.innerHTML = '';
             if(!gConfig.fontPresets || gConfig.fontPresets.length === 0) {
                 list.innerHTML = '<div style="text-align:center; padding:20px; color:var(--c-gray-dark); font-size:12px;">暂无预设。<br>请先在输入框填好字体 URL，然后点击右上角保存。</div>';
             } else {
                 gConfig.fontPresets.forEach((p, idx) => {
                     const item = document.createElement('div');
                     item.style.cssText = "background:rgba(0,0,0,0.03); padding:12px 16px; border-radius:12px; display:flex; justify-content:space-between; align-items:center;";
                     
                     let isCurrent = (p.url === gConfig.fontUrl);
                     
                     item.innerHTML = `
                         <div style="display:flex; flex-direction:column; gap:4px; flex:1; cursor:pointer;" onclick="applyFontPreset(${idx})">
                             <div style="font-weight:800; font-size:14px; color:${isCurrent ? '#007AFF' : 'var(--c-black)'}; display:flex; align-items:center; gap:6px;">
                                 ${p.name} ${isCurrent ? '<span style="font-size:10px; background:rgba(0,122,255,0.1); padding:2px 6px; border-radius:4px;">当前使用</span>' : ''}
                             </div>
                             <div style="font-family:monospace; font-size:10px; color:var(--c-gray-dark); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:200px;">${p.url}</div>
                         </div>
                         <div style="color:#FF3B30; padding:10px; cursor:pointer; flex-shrink:0;" onclick="deleteFontPreset(${idx})">
                             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                         </div>
                     `;
                     list.appendChild(item);
                 });
             }
             document.getElementById('font-preset-sheet').classList.add('active');
         }
         
         function closeFontPresetManager() {
             document.getElementById('font-preset-sheet').classList.remove('active');
         }
         
         function saveCurrentFontAsPreset() {
             const url = document.getElementById('me-font-url').value.trim();
             if(!url) return alert("请先在后方输入框填好外部字体 URL！");
             
             const name = prompt("给这个字体起个名字（例如：得意黑, 霞鹜文楷 等）：");
             if(name && name.trim()) {
                 if(!gConfig.fontPresets) gConfig.fontPresets = [];
                 gConfig.fontPresets.push({ name: name.trim(), url: url });
                 saveGlobal();
                 openFontPresetManager(); 
             }
         }
         
         function applyFontPreset(idx) {
             if(!gConfig.fontPresets || !gConfig.fontPresets[idx]) return;
             const p = gConfig.fontPresets[idx];
             document.getElementById('me-font-url').value = p.url;
             saveGlobal(); 
             closeFontPresetManager();
         }
         
         function deleteFontPreset(idx) {
             if(confirm("确定要删除这个字体预设吗？")) {
                 gConfig.fontPresets.splice(idx, 1);
                 saveGlobal();
                 openFontPresetManager(); 
             }
         }
         
             // ==========================================
         // 顶级火漆密函提取仪 核心驱动逻辑
         // ==========================================
         let isGachaExtracting = false;
         let currentGachaExtractedText = "";
         let currentGachaView = "machine"; 
         
         let gachaCustomMemeList = [];
         try {
             const storedData = localStorage.getItem('soap_gacha_memes');
             if (storedData) {
                 const parsedData = JSON.parse(storedData);
                 if (Array.isArray(parsedData)) gachaCustomMemeList = parsedData;
             }
         } catch (e) {
             console.warn("检测到本地缓存格式错误，已自动清理。");
         }
         
         // 【修改点1】：彻底删除了原本的默认文案注入逻辑。空仓库就是空仓库。
         
         function saveGachaRepo() {
             try { localStorage.setItem('soap_gacha_memes', JSON.stringify(gachaCustomMemeList)); } catch (e) {}
         }
         
         function openWaxExtractor() {
             closeChatMenu(); // 关掉聊天底栏
             document.getElementById('wax-extractor-modal').classList.add('active');
             switchGachaView('machine');
         }
         
         function closeWaxExtractor() {
             if (isGachaExtracting) return; 
             document.getElementById('wax-extractor-modal').classList.remove('active');
             setTimeout(() => { switchGachaView('machine'); }, 400); 
         }
         
         function switchGachaView(viewName) {
             currentGachaView = viewName;
             const viewMachine = document.getElementById('gacha-view-machine');
             const viewResult = document.getElementById('gacha-view-result');
             const viewRepo = document.getElementById('gacha-view-repo');
         
             viewMachine.style.display = 'none'; viewMachine.style.opacity = '0';
             viewResult.style.display = 'none'; viewResult.style.opacity = '0';
             viewRepo.style.display = 'none'; viewRepo.style.opacity = '0';
         
             const btn = document.getElementById('gacha-btn-extract');
             const waxContainer = document.getElementById('wax-container');
             const waxLogo = document.getElementById('wax-logo');
             
             isGachaExtracting = false;
             btn.style.pointerEvents = 'auto'; btn.style.opacity = '1'; btn.innerHTML = `<span>UNSEAL</span>`;
             waxContainer.classList.remove('is-stamping'); 
             if(waxLogo) waxLogo.style.opacity = '0';
         
             setTimeout(() => {
                 if (viewName === 'machine') {
                     viewMachine.style.display = 'flex'; void viewMachine.offsetWidth; viewMachine.style.opacity = '1';
                 } else if (viewName === 'result') {
                     viewResult.style.display = 'flex'; void viewResult.offsetWidth; viewResult.style.opacity = '1';
                     viewResult.style.transform = 'translateY(0)';
                 } else if (viewName === 'repo') {
                     viewRepo.style.display = 'flex'; void viewRepo.offsetWidth; viewRepo.style.opacity = '1';
                     renderGachaRepo(); 
                 }
             }, 50);
         }
         
         function resetWaxExtractor() {
             if(isGachaExtracting) return;
             switchGachaView('machine');
         }
         
         function toggleGachaRepoView() {
             if (isGachaExtracting) return;
             if (currentGachaView === 'repo') switchGachaView('machine');
             else switchGachaView('repo');
         }
         
         function renderGachaRepo() {
             const listEl = document.getElementById('gacha-repo-list');
             listEl.innerHTML = '';
             if (!gachaCustomMemeList || gachaCustomMemeList.length === 0) {
                 listEl.innerHTML = '<div class="repo-empty">仓库空空如也，请在下方输入并添加文本。</div>';
                 return;
             }
             gachaCustomMemeList.forEach((text, index) => {
                 const item = document.createElement('div');
                 item.className = 'repo-item';
                 item.innerHTML = `<div class="repo-item-text">${text}</div><div class="repo-item-del" onclick="deleteGachaCustomText(${index})">✕</div>`;
                 listEl.appendChild(item);
             });
             listEl.scrollTop = listEl.scrollHeight;
         }
         
         function addGachaCustomText() {
             const input = document.getElementById('gacha-repo-input');
             const val = input.value.trim();
             if (!val) return;
             gachaCustomMemeList.push(val);
             saveGachaRepo();
             input.value = '';
             renderGachaRepo();
         }
         
         function deleteGachaCustomText(index) {
             gachaCustomMemeList.splice(index, 1);
             saveGachaRepo();
             renderGachaRepo();
         }
         
         function playGachaExtraction() {
             if (isGachaExtracting) return;
             if (!gachaCustomMemeList || gachaCustomMemeList.length === 0) {
                 alert("信箱里目前没有密函，请先进入仓库添加！");
                 return;
             }
         
             isGachaExtracting = true;
             const btn = document.getElementById('gacha-btn-extract');
             const waxContainer = document.getElementById('wax-container');
             const waxLogo = document.getElementById('wax-logo');
             
             btn.style.pointerEvents = 'none'; btn.style.opacity = '0.3';
             btn.innerHTML = `<span>BREAKING SEAL...</span>`;
             waxContainer.classList.add('is-stamping');
         
             // 【修改点2：加入智能防重复算法】
             let randomIndex = Math.floor(Math.random() * gachaCustomMemeList.length);
             // 如果仓库有2条以上，且随机抽到的刚好跟上次一样，就强制顺延到下一条，确保绝不连号！
             if (gachaCustomMemeList.length > 1 && gachaCustomMemeList[randomIndex] === currentGachaExtractedText) {
                 randomIndex = (randomIndex + 1) % gachaCustomMemeList.length;
             }
             currentGachaExtractedText = gachaCustomMemeList[randomIndex];
             
             document.getElementById('gacha-ticket-id').innerText = String(Math.floor(Math.random() * 899 + 100)).padStart(3, '0');
         
             setTimeout(() => { if(waxLogo) waxLogo.style.opacity = '1'; }, 1100);
         
             setTimeout(() => {
                 const flash = document.getElementById('extractor-flash');
                 flash.classList.add('flash-anim');
                 
                 setTimeout(() => {
                     document.getElementById('gacha-result-text').innerText = currentGachaExtractedText;
                     switchGachaView('result');
                     
                     isGachaExtracting = false; // 动画播完解锁
                     
                     setTimeout(() => { flash.classList.remove('flash-anim'); }, 500);
                 }, 200); 
             }, 1800); 
         }
         
         function applyGachaText() {
             closeWaxExtractor();
             const chatInput = document.getElementById('msg-input');
             if (chatInput) {
                 chatInput.value = chatInput.value ? chatInput.value + " " + currentGachaExtractedText : currentGachaExtractedText;
                 chatInput.focus();
                 if (typeof autoGrow === 'function') autoGrow(chatInput);
             }
         }
         
         // =====================================================================
         // 强制线下模式弹窗系统 (Fatal & Gentle Overrides)
         // =====================================================================
         
         // ================= 1. Fatal Override (红色强制骇入) =================
         let currentOverrideConfig = { q1: "", q2: "", q3: "", force: true };
         
         let fatalTermInterval;
         let fatalHoldReq, fatalIsHolding = false;
         let fatalProgress = 0, fatalStartTime = 0;
         const FATAL_HOLD_DURATION = 1500;
         
         function startFatalOverride(config) {
             // 挂载动态台词和开关
             currentOverrideConfig = config || { q1: "“屏幕盯够了吗？”", q2: "“我骗你的。”", q3: "“你躲不掉的。”", force: true };
             
             // 弹窗出现的第一句话
             document.querySelector('.fatal-final-quote').innerHTML = currentOverrideConfig.q1;
             // 如果点了拒绝，被吓一跳时跳出的字
             document.getElementById('fatal-jumpscareText').innerHTML = currentOverrideConfig.q2;
             // 僵持阶段，背景底部的文字（同步复用 q1，完美闭环）
             document.getElementById('fatal-quoteText').innerHTML = currentOverrideConfig.q1;
         
             // 【核心修复】：彻底清除上一轮的字芒动画残留，防止被提前看到！
             document.getElementById('fatal-jumpscareText').classList.remove('active');
         
             fatalProgress = 0;
             fatalIsHolding = false;
             document.getElementById('fatal-authArea').classList.remove('fatal-is-holding');
             document.getElementById('fatal-authText').innerText = "Hold to Surrender";
             document.getElementById('fatal-progressRing').style.transition = 'none';
             document.getElementById('fatal-progressRing').style.strokeDashoffset = 251;
             document.getElementById('fatal-flashBang').classList.remove('explode');
         
             const wrap = document.getElementById('fatal-override-wrap');
             wrap.style.display = 'block';
             
             const rainContainer = document.getElementById('fatal-dataRainContainer');
             rainContainer.innerHTML = '';
             const hexChars = ['0','1','A','B','C','D','E','F','*','/','+'];
             for (let i = 0; i < 30; i++) {
                 let drop = document.createElement('div'); drop.className = 'fatal-data-fragment';
                 drop.innerText = '0x' + hexChars[Math.floor(Math.random()*hexChars.length)] + hexChars[Math.floor(Math.random()*hexChars.length)];
                 drop.style.left = Math.random() * 100 + 'vw';
                 drop.style.animationDuration = (Math.random() * 3 + 2) + 's';
                 drop.style.animationDelay = Math.random() * 2 + 's';
                 rainContainer.appendChild(drop);
             }
         
             const bgLayer = document.getElementById('fatal-bgLayer');
             const strobe = document.getElementById('fatal-strobeLayer');
             const win1 = document.getElementById('fatal-win-1');
             const win2 = document.getElementById('fatal-win-2');
             const win3 = document.getElementById('fatal-win-3');
             const winFinal = document.getElementById('fatal-win-final');
         
             bgLayer.style.filter = 'blur(0px) brightness(1) grayscale(0%)';
             strobe.classList.remove('active');
             document.getElementById('fatal-popupLayer').style.display = 'block';
             document.getElementById('fatal-popupLayer').style.opacity = '1';
             document.getElementById('fatal-stage').classList.remove('active');
             win1.classList.remove('crash-in'); win2.classList.remove('crash-in'); win3.classList.remove('crash-in'); winFinal.classList.remove('crash-in');
         
             setTimeout(() => { bgLayer.style.backdropFilter = 'blur(4px)'; bgLayer.style.background = 'rgba(0,0,0,0.4)'; win1.classList.add('crash-in'); }, 800);
             setTimeout(() => { win2.classList.add('crash-in'); bgLayer.classList.add('fatal-is-shaking'); setTimeout(() => bgLayer.classList.remove('fatal-is-shaking'), 300); }, 2000);
             setTimeout(() => { strobe.classList.add('active'); win3.classList.add('crash-in'); bgLayer.style.backdropFilter = 'blur(8px)'; bgLayer.style.background = 'rgba(0,0,0,0.6)'; bgLayer.classList.add('fatal-is-shaking'); }, 3200);
             setTimeout(() => { bgLayer.classList.remove('fatal-is-shaking'); bgLayer.style.backdropFilter = 'blur(15px)'; bgLayer.style.background = 'rgba(0,0,0,0.8)'; winFinal.classList.add('crash-in'); }, 5000);
         
            const holdBtn = document.getElementById('fatal-holdBtn');
              holdBtn.onmousedown = fatalStartHold; holdBtn.ontouchstart = (e) => { e.preventDefault(); fatalStartHold(e); };
              // 优化：先移除旧监听器防止累积泄漏，再添加新的
              window.removeEventListener('mouseup', fatalEndHold); window.removeEventListener('touchend', fatalEndHold);
              window.addEventListener('mouseup', fatalEndHold); window.addEventListener('touchend', fatalEndHold);
         }
         
         function fatalFakeClose(btn) {
             btn.innerText = "[ERR]"; btn.style.color = "#FF003C"; btn.style.background = "#000";
             const bgLayer = document.getElementById('fatal-bgLayer');
             bgLayer.classList.add('fatal-is-shaking');
             setTimeout(() => bgLayer.classList.remove('fatal-is-shaking'), 200);
         }
         
         function fatalFakeReject() {
             if (!currentOverrideConfig.force) {
                 // 【核心】：如果不强求，直接关闭连接并生成失落提示
                 document.getElementById('fatal-override-wrap').style.display = 'none';
                 document.getElementById('fatal-strobeLayer').classList.remove('active');
                 if (currentContactId) {
                     const c = contacts.find(x => x.id === currentContactId);
                     if (c) {
                         c.history.push({role: 'system_sum', content: `<i>✧ 你拒绝了强制连接，对方收起了爪牙，精神链路已切断。</i>`});
                         saveData();
                         if (document.getElementById('view-chat').classList.contains('slide-in')) {
                             appendBubbleRow(c.history[c.history.length - 1], c.history.length - 1);
                             scrollToBottom();
                         }
                     }
                 }
                 return;
             }
         
             const bgLayer = document.getElementById('fatal-bgLayer');
             document.getElementById('fatal-popupLayer').style.opacity = '0'; 
             document.getElementById('fatal-strobeLayer').classList.remove('active');
             bgLayer.style.backdropFilter = 'blur(3px)'; bgLayer.style.background = 'rgba(0,0,0,0.2)'; 
             
             setTimeout(() => {
                 bgLayer.classList.add('fatal-is-shaking');
                 bgLayer.style.backdropFilter = 'blur(12px)'; bgLayer.style.background = 'rgba(0,0,0,0.9)'; 
                 document.getElementById('fatal-jumpscareText').classList.add('active');
                 
                 setTimeout(() => {
                     document.getElementById('fatal-popupLayer').style.display = 'none';
                     document.getElementById('fatal-stage').classList.add('active');
                     fatalStartGlitchTerminal(); 
                     bgLayer.classList.remove('fatal-is-shaking');
                 }, 1000);
             }, 1500); 
         }
         
         function fatalTriggerLockdown() {
             document.getElementById('fatal-popupLayer').style.opacity = '0';
             setTimeout(() => {
                 document.getElementById('fatal-popupLayer').style.display = 'none';
                 document.getElementById('fatal-strobeLayer').classList.remove('active');
                 document.getElementById('fatal-stage').classList.add('active');
                 fatalStartGlitchTerminal(); 
             }, 300);
         }
         
         function fatalUpdateVerticalGlitch() {
             const vChars = '0123456789ABCDEF!@#$█▓▒░X';
             let lStr = '', rStr = '', g1Str = '', g2Str = '', g3Str = '';
             for(let i = 0; i < 30; i++) { lStr += vChars[Math.floor(Math.random() * vChars.length)]; rStr += vChars[Math.floor(Math.random() * vChars.length)]; }
             document.getElementById('fatal-vGlitchLeft').innerText = lStr; document.getElementById('fatal-vGlitchRight').innerText = rStr;
             for(let i = 0; i < 15; i++) { g1Str += vChars[Math.floor(Math.random() * vChars.length)]; g2Str += vChars[Math.floor(Math.random() * vChars.length)]; g3Str += vChars[Math.floor(Math.random() * vChars.length)]; }
             document.getElementById('fatal-gGlitch1').innerText = g1Str; document.getElementById('fatal-gGlitch2').innerText = g2Str; document.getElementById('fatal-gGlitch3').innerText = g3Str;
         }
         
         function fatalStartGlitchTerminal() {
             const glitchTerm = document.getElementById('fatal-glitchTerm');
             const glitchPhrases = ["SYS.THREAD_OVERRIDE_INIT", "BYPASSING: USER_PROXY_DEFENSE", "WARN: UNSTABLE NEURAL LINK", "0xDEADBEEF MEMORY LEAK", "FETCHING COORDS...", "HEART_RATE_MONITOR: HIJACKED", "TARGET ACQUIRED.", "FORCING SENSORY INPUT...", "KERNEL PANIC 0x000000F4", "I M I N C O N T R O L"];
             fatalTermInterval = setInterval(() => {
                 const line = document.createElement('div'); line.className = 'fatal-glitch-line';
                 line.innerText = glitchPhrases[Math.floor(Math.random() * glitchPhrases.length)] + ' // 0x' + Math.random().toString(16).substr(2, 8).toUpperCase();
                 glitchTerm.appendChild(line);
                 if (glitchTerm.children.length > 10) glitchTerm.removeChild(glitchTerm.firstChild);
                 fatalUpdateVerticalGlitch();
             }, 150);
         }
         
         function fatalUpdateProgress() {
             if (!fatalIsHolding) return;
             let elapsed = Date.now() - fatalStartTime;
             fatalProgress = Math.min((elapsed / FATAL_HOLD_DURATION) * 100, 100);
             document.getElementById('fatal-progressRing').style.strokeDashoffset = 251 - (fatalProgress / 100) * 251;
         
             if (fatalProgress >= 100) fatalExecuteTransition();
             else fatalHoldReq = requestAnimationFrame(fatalUpdateProgress);
         }
         
         function fatalStartHold(e) {
             if (e && e.preventDefault) e.preventDefault();
             if (fatalProgress >= 100 || fatalIsHolding) return;
             fatalIsHolding = true;
             fatalStartTime = Date.now() - (fatalProgress / 100 * FATAL_HOLD_DURATION);
             
             document.getElementById('fatal-authArea').classList.add('fatal-is-holding');
             document.getElementById('fatal-authText').innerText = "OVERWRITING REALITY...";
             
             fatalScrambleText(document.getElementById('fatal-quoteText'), currentOverrideConfig.q3);
             clearInterval(fatalTermInterval);
             
             const glL = document.getElementById('fatal-vGlitchLeft'), glR = document.getElementById('fatal-vGlitchRight');
             const gl1 = document.getElementById('fatal-gGlitch1'), gl2 = document.getElementById('fatal-gGlitch2'), gl3 = document.getElementById('fatal-gGlitch3');
             glL.style.color = '#FFF'; glL.style.textShadow = '0 0 10px #FFF'; glR.style.color = '#FFF'; glR.style.textShadow = '0 0 10px #FFF';
             gl1.style.color = '#FFF'; gl1.style.textShadow = '0 0 20px #FFF'; gl1.style.opacity = '0.35';
             gl2.style.color = '#FFF'; gl2.style.textShadow = '0 0 20px #FFF'; gl2.style.opacity = '0.25';
             gl3.style.color = '#FFF'; gl3.style.textShadow = '0 0 20px #FFF'; gl3.style.opacity = '0.3';
         
             const glitchTerm = document.getElementById('fatal-glitchTerm');
             fatalTermInterval = setInterval(() => {
                 const line = document.createElement('div'); line.className = 'fatal-glitch-line'; line.style.color = '#FFF'; 
                 line.innerText = "EYE_CONTACT_ESTABLISHED // OVERRIDING...";
                 glitchTerm.appendChild(line);
                 if (glitchTerm.children.length > 10) glitchTerm.removeChild(glitchTerm.firstChild);
                 fatalUpdateVerticalGlitch();
             }, 50); 
             fatalHoldReq = requestAnimationFrame(fatalUpdateProgress);
         }
         
         function fatalEndHold(e) {
             if (!fatalIsHolding || fatalProgress >= 100) return;
             if (e && e.preventDefault) e.preventDefault();
             fatalIsHolding = false;
             cancelAnimationFrame(fatalHoldReq);
             
             const pRing = document.getElementById('fatal-progressRing');
             pRing.style.transition = 'stroke-dashoffset 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
             pRing.style.strokeDashoffset = 251; fatalProgress = 0;
             setTimeout(() => { pRing.style.transition = 'stroke-dashoffset 0.1s linear'; }, 400);
         
             document.getElementById('fatal-authArea').classList.remove('fatal-is-holding');
             document.getElementById('fatal-authText').innerText = "Hold to Surrender";
             // 核心修复：手指松开时，将乱码动画从 q3(最后通牒) 变回 q1(第一句话)，彻底抛弃写死的死词
             fatalScrambleText(document.getElementById('fatal-quoteText'), currentOverrideConfig.q1);
         
             clearInterval(fatalTermInterval);
             const glL = document.getElementById('fatal-vGlitchLeft'), glR = document.getElementById('fatal-vGlitchRight');
             const gl1 = document.getElementById('fatal-gGlitch1'), gl2 = document.getElementById('fatal-gGlitch2'), gl3 = document.getElementById('fatal-gGlitch3');
             glL.style.color = 'var(--c-red)'; glL.style.textShadow = 'none'; glR.style.color = 'var(--c-red)'; glR.style.textShadow = 'none';
             gl1.style.color = 'var(--c-red)'; gl1.style.textShadow = '0 0 15px var(--c-red)'; gl1.style.opacity = '0.15';
             gl2.style.color = 'var(--c-red)'; gl2.style.textShadow = '0 0 15px var(--c-red)'; gl2.style.opacity = '0.08';
             gl3.style.color = 'var(--c-red)'; gl3.style.textShadow = '0 0 15px var(--c-red)'; gl3.style.opacity = '0.12';
             fatalStartGlitchTerminal();
         }
         
         function fatalExecuteTransition() {
             fatalIsHolding = false;
             document.getElementById('fatal-authText').innerText = "ACCESS GRANTED";
             clearInterval(fatalTermInterval); 
             
             setTimeout(() => {
                 document.getElementById('fatal-flashBang').classList.add('explode');
                 setTimeout(() => {
                     document.getElementById('fatal-override-wrap').style.display = 'none';
                     document.getElementById('fatal-flashBang').classList.remove('explode');
                     document.getElementById('fatal-authArea').classList.remove('fatal-is-holding');
                     fatalProgress = 0;
                     openTheaterMode(); 
                 }, 600);
             }, 300);
         }
         
         function fatalScrambleText(element, newHtml) {
             const chars = '✦✧—=+*^?#_0101[]{}'; let iterations = 0;
             let interval = setInterval(() => {
                 element.innerHTML = newHtml.split('').map((char, index) => {
                     if (char === '<' || char === '>' || char === 'b' || char === 'r') return char; 
                     if (index < iterations) return newHtml[index];
                     return chars[Math.floor(Math.random() * chars.length)];
                 }).join('');
                 iterations += 1;
                 if (iterations > newHtml.length) { clearInterval(interval); element.innerHTML = newHtml; }
             }, 25);
         }
         
         // ================= 2. Gentle Override (温柔强制线下) =================
         let gentleHoldReq, gentleIsHolding = false;
         let gentleProgress = 0, gentleStartTime = 0;
         const GENTLE_HOLD_DURATION = 2000;
         let gentleRejectCount = 0;
         
         function startGentleOverride(config) {
             currentOverrideConfig = config || { q1: "“有些话，<br>我想看着你的眼睛说。”", q2: "“不要逃避。”<br><span style='font-size:18px; color:var(--c-gold-dark);'>看着我。</span>", q3: "“你躲不掉的。”", force: true };
             
             gentleProgress = 0;
             gentleIsHolding = false;
             gentleRejectCount = 0;
             document.getElementById('gentle-authArea').classList.remove('gentle-is-holding');
             document.getElementById('gentle-authText').innerText = "Hold to Touch";
             document.getElementById('gentle-flashBang').classList.remove('explode');
             document.getElementById('gentle-rejectBtn').style.opacity = '1'; 
             document.getElementById('gentle-rejectBtn').style.pointerEvents = 'auto';
         
             const wrap = document.getElementById('gentle-override-wrap');
             wrap.style.display = 'block';
             
             const moteContainer = document.getElementById('gentle-moteContainer');
             moteContainer.innerHTML = '';
             for (let i = 0; i < 25; i++) {
                 let mote = document.createElement('div'); mote.className = 'gentle-light-mote';
                 let size = Math.random() * 6 + 2; mote.style.width = size + 'px'; mote.style.height = size + 'px';
                 mote.style.left = Math.random() * 100 + 'vw';
                 mote.style.animationDuration = (Math.random() * 5 + 5) + 's'; mote.style.animationDelay = Math.random() * 5 + 's';
                 moteContainer.appendChild(mote);
             }
         
             const frostLayer = document.getElementById('gentle-frostLayer');
             const auroraLayer = document.getElementById('gentle-auroraLayer');
             const shadowLayer = document.getElementById('gentle-shadowLayer');
             const win1 = document.getElementById('gentle-win-1');
             const win2 = document.getElementById('gentle-win-2');
             const winFinal = document.getElementById('gentle-win-final');
         
             frostLayer.classList.remove('active'); auroraLayer.classList.remove('active'); shadowLayer.className = 'gentle-shadow-overlay';
             document.getElementById('gentle-popupLayer').style.display = 'block';
             document.getElementById('gentle-stage').classList.remove('active');
             win1.classList.remove('crash-in'); win2.classList.remove('crash-in'); winFinal.classList.remove('crash-in');
             document.getElementById('gentle-quoteText').style.color = 'var(--c-text)';
             document.getElementById('gentle-quoteText').innerHTML = currentOverrideConfig.q1;
             document.getElementById('gentle-rejectBtn').innerText = "[ DECLINE / 避开视线]";
         
             setTimeout(() => { frostLayer.classList.add('active'); win1.classList.add('crash-in'); }, 1000);
             setTimeout(() => { win1.classList.remove('crash-in'); setTimeout(() => { auroraLayer.classList.add('active'); win2.classList.add('crash-in'); }, 500); }, 3500);
             setTimeout(() => { win2.classList.remove('crash-in'); setTimeout(() => { winFinal.classList.add('crash-in'); }, 600); }, 6500);
         
             const holdBtn = document.getElementById('gentle-holdBtn');
             holdBtn.onmousedown = gentleStartHold; holdBtn.ontouchstart = (e) => { e.preventDefault(); gentleStartHold(e); };
             window.addEventListener('mouseup', gentleEndHold); window.addEventListener('touchend', gentleEndHold);
         }
         
         function gentleTriggerLockdown() {
             document.getElementById('gentle-popupLayer').style.display = 'none';
             const stage = document.getElementById('gentle-stage');
             const quoteMain = document.getElementById('gentle-quoteText');
             stage.classList.add('active');
             quoteMain.classList.add('thump');
             stage.classList.add('gentle-tremor-shock');
             setTimeout(() => { quoteMain.classList.remove('thump'); stage.classList.remove('gentle-tremor-shock'); }, 1200);
         }
         
         function gentleHandleReject() {
             gentleRejectCount++;
             const quoteMain = document.getElementById('gentle-quoteText');
             const rejectBtn = document.getElementById('gentle-rejectBtn');
             const stage = document.getElementById('gentle-stage');
             const shadowLayer = document.getElementById('gentle-shadowLayer');
         
             if (gentleRejectCount === 1) {
                 if (!currentOverrideConfig.force) {
                     // 【核心】：如果不强求，直接关闭连接并生成失落提示
                     document.getElementById('gentle-override-wrap').style.display = 'none';
                     if (currentContactId) {
                         const c = contacts.find(x => x.id === currentContactId);
                         if (c) {
                             c.history.push({role: 'system_sum', content: `<i>✧ 你退缩了，对方的手顿在半空，最终失落地收了回去。连接切断。</i>`});
                             saveData();
                             if (document.getElementById('view-chat').classList.contains('slide-in')) {
                                 appendBubbleRow(c.history[c.history.length - 1], c.history.length - 1);
                                 scrollToBottom();
                             }
                         }
                     }
                     return;
                 }
         
                 shadowLayer.classList.add('level-1');
                 quoteMain.style.color = '#E8D3C8';
                 gentleFadeTextChange(quoteMain, currentOverrideConfig.q2);
                 rejectBtn.innerText = "[ STILL DECLINE / 依然避开 ]";
                 stage.classList.add('gentle-tremor-shock');
                 setTimeout(()=> stage.classList.remove('gentle-tremor-shock'), 600);
             } else if (gentleRejectCount === 2) {
                 shadowLayer.classList.replace('level-1', 'level-2');
                 quoteMain.style.color = '#FFF';
                 gentleFadeTextChange(quoteMain, currentOverrideConfig.q3);
                 rejectBtn.style.opacity = '0'; rejectBtn.style.pointerEvents = 'none';
                 
                 setTimeout(() => { 
                     document.getElementById('gentle-authArea').classList.add('gentle-is-holding');
                     document.getElementById('gentle-authText').innerText = "SENSING YOUR TOUCH...";
                     document.getElementById('gentle-quoteSub').style.opacity = '0';
                     
                     setTimeout(() => {
                         gentleProgress = 100;
                         gentleExecuteTransition();
                     }, GENTLE_HOLD_DURATION);
                 }, 1000);
             }
         }
         
         function gentleUpdateProgress() {
             if (!gentleIsHolding) return;
             let elapsed = Date.now() - gentleStartTime;
             gentleProgress = Math.min((elapsed / GENTLE_HOLD_DURATION) * 100, 100);
             if (gentleProgress >= 100) gentleExecuteTransition();
             else gentleHoldReq = requestAnimationFrame(gentleUpdateProgress);
         }
         
         function gentleStartHold(e) {
             if (e && e.preventDefault) e.preventDefault();
             if (gentleProgress >= 100 || gentleIsHolding) return;
             gentleIsHolding = true;
             gentleStartTime = Date.now() - (gentleProgress / 100 * GENTLE_HOLD_DURATION);
             
             document.getElementById('gentle-authArea').classList.add('gentle-is-holding');
             document.getElementById('gentle-authText').innerText = "SENSING YOUR TOUCH...";
             document.getElementById('gentle-quoteSub').style.opacity = '0';
             
             if (gentleRejectCount < 2) gentleFadeTextChange(document.getElementById('gentle-quoteText'), "“把手给我。<br>闭上眼睛。”");
             gentleHoldReq = requestAnimationFrame(gentleUpdateProgress);
         }
         
         function gentleEndHold(e) {
             if (!gentleIsHolding || gentleProgress >= 100 || gentleRejectCount >= 2) return;
             if (e && e.preventDefault) e.preventDefault();
             gentleIsHolding = false;
             cancelAnimationFrame(gentleHoldReq);
             gentleProgress = 0;
             
             document.getElementById('gentle-authArea').classList.remove('gentle-is-holding');
             document.getElementById('gentle-authText').innerText = "Hold to Touch";
             document.getElementById('gentle-quoteSub').style.opacity = '0.6';
             
             if (gentleRejectCount === 0) gentleFadeTextChange(document.getElementById('gentle-quoteText'), currentOverrideConfig.q1);
             else if (gentleRejectCount === 1) gentleFadeTextChange(document.getElementById('gentle-quoteText'), currentOverrideConfig.q2);
         }
         
         function gentleExecuteTransition() {
             gentleIsHolding = false;
             document.getElementById('gentle-authText').innerText = "CONNECTED";
             setTimeout(() => {
                 document.getElementById('gentle-flashBang').classList.add('explode');
                 setTimeout(() => {
                     document.getElementById('gentle-override-wrap').style.display = 'none';
                     document.getElementById('gentle-flashBang').classList.remove('explode');
                     document.getElementById('gentle-authArea').classList.remove('gentle-is-holding');
                     gentleProgress = 0;
                     gentleRejectCount = 0;
                     
                     openTheaterMode(); 
                 }, 1000); 
             }, 400);
         }
         
         function gentleFadeTextChange(element, newHtml) {
             element.style.opacity = '0'; element.style.filter = 'blur(4px)';
             setTimeout(() => { element.innerHTML = newHtml; element.style.opacity = '1'; element.style.filter = 'blur(0)'; }, 500);
         }
         
         // ================= 线下小剧场：剧场心理透视系统引擎 =================
function openSubconscious(msgId) {
    if(!currentContactId) return;
    const c = contacts.find(x => x.id === currentContactId);
    if(!c) return;
    
    // 核心修复：从统一的 history 数组中通过 _id 查找线下消息对象
    let msg = c.history.find(m => m._id === msgId);
    
    // 兼容性兜底：如果 history 没找到，再最后尝试一次旧的 theaterHistory 字段
    if(!msg && c.theaterHistory) {
        msg = c.theaterHistory.find(m => m._id === msgId);
    }
    
    if(!msg) return;

    // 数据兜底（防止旧数据或AI脑抽未按格式生成）
             let data = msg.mindData || { 
                 thought: "对方正静静地注视着你，思绪潜藏在极深的眼底，难以捉摸。", 
                 focus: "你的眼眸", 
                 facadeLevel: 10, 
                 restraintLevel: 10 
             };
         
             const modal = document.getElementById('thMindModal');
             const textBox = document.getElementById('tmcTextContent');
             const focusBox = document.getElementById('tmcFocus');
             const facadeBox = document.getElementById('tmcFacade');
             const restraintBox = document.getElementById('tmcRestraint');
         
             // 1. 初始化清空
             textBox.innerHTML = '';
             focusBox.innerText = '...';
             facadeBox.innerHTML = '';
             restraintBox.innerHTML = '';
         
             modal.classList.add('active');
         
             // 2. 延迟执行文字打字机光影动画
             setTimeout(() => {
                 const words = data.thought.split(/(?=[，。、！？])/g); 
                 let delay = 0;
                 
                 words.forEach((word) => {
                     const span = document.createElement('span');
                     span.className = 'tmc-word';
                     span.innerText = word;
                     span.style.animationDelay = `${delay}s`;
                     textBox.appendChild(span);
                     delay += 0.15; // 浮现间隔
                 });
         
                 // 3. 渲染阵列刻度条
                 focusBox.innerText = data.focus;
                 renderThGauge(facadeBox, data.facadeLevel);
                 renderThGauge(restraintBox, data.restraintLevel);
         
             }, 300);
         }
         
         // 渲染 10 格阵列仪
         function renderThGauge(container, filledCount) {
             for (let i = 0; i < 10; i++) {
                 const block = document.createElement('div');
                 block.className = 'tmc-gauge-block';
                 // 逐个点亮动画
                 setTimeout(() => {
                     if (i < filledCount) block.classList.add('filled');
                 }, i * 80 + 500); 
                 container.appendChild(block);
             }
         }
         
         function closeSubconscious(e) {
             if(e) e.stopPropagation();
             document.getElementById('thMindModal').classList.remove('active');
         }
         
         // =====================================================================
         // 极简朋友圈 (Romantic AI OS · Moments) 核心引擎
         // 自动挂载通讯录人格，自动生成符合人设的小互动！
         // =====================================================================
         const M_DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23d0d0d0' stroke-width='1' stroke-linecap='round' stroke-linejoin='round' style='background-color:%23f7f7f7;'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E";
         const M_DEFAULT_COVER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23e0e0e0' stroke-width='0.5' stroke-linecap='round' stroke-linejoin='round' style='background-color:%23fafafa;'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpolyline points='21 15 16 10 5 21'/%3E%3C/svg%3E";
         const M_DEFAULT_POST_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 240' style='background-color:%23ffffff;'%3E%3Cg transform='translate(200, 105)' stroke='%23b0b5ba' stroke-width='2.5' fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='-6' cy='-6' r='14'/%3E%3Cline x1='4' y1='4' x2='14' y2='14'/%3E%3C/g%3E%3Ctext x='200' y='155' font-family='-apple-system, BlinkMacSystemFont, sans-serif' font-size='12' fill='%23a0a5aa' text-anchor='middle' letter-spacing='3' font-weight='300'%3ECLICK TO OPEN BOOKMARK%3C/text%3E%3C/svg%3E";
         
         // 本地存储朋友圈动态数据
         let momentsData = {
             posts: [], // 综合广场的帖子池
             userCovers: {}, // 每个人的封面缓存
             linkedContacts: [] // 允许产生互动的联动角色 ID 列表
         };
         
         let m_composeImageUrl = null;
let m_isTextPhotoMode = false;

let tw_composeImageUrl = null;

function twHandlePostImageSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // 核心压缩算法：限制最大边长为 1200 像素，保证清晰度的同时大幅降低内存占用
            const MAX_SIZE = 1200;
            if (width > height && width > MAX_SIZE) {
                height *= MAX_SIZE / width;
                width = MAX_SIZE;
            } else if (height > MAX_SIZE) {
                width *= MAX_SIZE / height;
                height = MAX_SIZE;
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // 转换为 80% 质量的 JPEG，抹除冗余数据
            tw_composeImageUrl = canvas.toDataURL('image/jpeg', 0.8);
            
            const modalContainer = document.getElementById('tw-compose-modal-preview-container');
            const modalImg = document.getElementById('tw-compose-modal-preview-img');
            if (modalContainer && modalImg) {
                modalImg.src = tw_composeImageUrl;
                modalContainer.classList.remove('hidden');
            }
            
            const homeContainer = document.getElementById('tw-compose-home-preview-container');
            const homeImg = document.getElementById('tw-compose-home-preview-img');
            if (homeContainer && homeImg) {
                homeImg.src = tw_composeImageUrl;
                homeContainer.classList.remove('hidden');
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    event.target.value = '';
}

function twRemovePostImage() {
    tw_composeImageUrl = null;
    
    const modalContainer = document.getElementById('tw-compose-modal-preview-container');
    const modalImg = document.getElementById('tw-compose-modal-preview-img');
    if (modalContainer && modalImg) {
        modalImg.src = '';
        modalContainer.classList.add('hidden');
    }
    
    const homeContainer = document.getElementById('tw-compose-home-preview-container');
    const homeImg = document.getElementById('tw-compose-home-preview-img');
    if (homeContainer && homeImg) {
        homeImg.src = '';
        homeContainer.classList.add('hidden');
    }
}

let isMomentsLoaded = false;

         // ================= 推特面具系统 =================
         let twActiveMaskId = null; // null = 用自己的推特资料, 'anonymous' = 匿名, 其他 = 面具ID

         function getTwActivePerson() {
             if (twActiveMaskId === 'anonymous') {
                 return { name: '匿名用户', handle: '@anonymous', avatar: 'https://i.postimg.cc/3NCLMSzZ/Screenshot-2026-04-09-16-54-00-68-a2db1b9502c98f25523e43284b79cce6.jpg' };
             }
             if (twActiveMaskId) {
                 let m = masks.find(x => x.id === twActiveMaskId);
                 if (m) {
                     let h = '@' + (m.name.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'mask_' + m.id.replace(/[^a-z0-9]/gi, '').substring(0, 5));
                     let av = m.avatar && (m.avatar.startsWith('data:image') || m.avatar.startsWith('http')) ? m.avatar : 'https://api.dicebear.com/7.x/notionists/svg?seed=' + m.name;
                     return { name: m.name, handle: h, avatar: av };
                 }
             }
             return { name: twData.meName || '我', handle: twData.meHandle || '@soap_user', avatar: twData.meAvatar || 'https://api.dicebear.com/7.x/notionists/svg?seed=Zero' };
         }

         function openTwMaskSelector(source) {
             const list = document.getElementById('tw-mask-selector-list');
             list.innerHTML = '';
             list.dataset.source = source;

             const makeItem = (id, name, handle, avatarHtml, isActive) => {
                 const item = document.createElement('div');
                 item.className = `tw-mask-item ${isActive ? 'active' : ''}`;
                 item.onclick = () => { selectTwMask(id); closeTwMaskSelector(); };
                 item.innerHTML = `
                     <div class="tw-mask-avatar">${avatarHtml}</div>
                     <div class="tw-mask-info">
                         <div class="tw-mask-name">${name}</div>
                         <div class="tw-mask-handle">${handle}</div>
                     </div>
                     ${isActive ? '<div class="tw-mask-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div>' : ''}
                 `;
                 list.appendChild(item);
             };

             let myP = getTwActivePerson();
             let myAv = twData.meAvatar || 'https://api.dicebear.com/7.x/notionists/svg?seed=Zero';
             makeItem(null, twData.meName || '我', twData.meHandle || '@soap_user', `<img src="${myAv}">`, twActiveMaskId === null);

             makeItem('anonymous', '匿名用户', '@anonymous', `<img src="https://i.postimg.cc/3NCLMSzZ/Screenshot-2026-04-09-16-54-00-68-a2db1b9502c98f25523e43284b79cce6.jpg">`, twActiveMaskId === 'anonymous');

             if (masks.length > 0) {
                 list.insertAdjacentHTML('beforeend', '<div class="tw-mask-divider"><span>MASKS</span></div>');
                 masks.forEach(m => {
                     let av = m.avatar && (m.avatar.startsWith('data:image') || m.avatar.startsWith('http')) ? `<img src="${m.avatar}">` : `<div class="tw-mask-anon-icon">${m.name.charAt(0)}</div>`;
                     let h = '@' + (m.name.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'mask');
                     makeItem(m.id, m.name, h, av, twActiveMaskId === m.id);
                 });
             }

             document.getElementById('tw-mask-selector-modal').classList.remove('hidden');
         }

         function closeTwMaskSelector() {
             document.getElementById('tw-mask-selector-modal').classList.add('hidden');
         }

         function selectTwMask(id) {
             twActiveMaskId = id;
             let p = getTwActivePerson();
             // 🚀 核心修复：全站所有标记为 user 的头像全部同步更新（包括发帖弹窗、首页快速栏等）
             document.querySelectorAll('#app-twitter img[data-avatar="user"]').forEach(img => { img.src = p.avatar; });
             let sn = document.getElementById('sidebar-name'); if(sn) sn.innerText = p.name;
             let sh = document.getElementById('sidebar-handle'); if(sh) sh.innerText = p.handle;
             let npn = document.getElementById('nav-profile-name'); if(npn) npn.innerText = p.name;
             let nph = document.getElementById('nav-profile-handle'); if(nph) nph.innerText = p.handle;
             updateTwCommentMaskBtn();
             
             // 🚀 核心新增：同步发帖弹窗的头像
             if (typeof updateComposeModalAvatar === 'function') updateComposeModalAvatar();
         }

         function updateTwCommentMaskBtn() {
             let p = getTwActivePerson();
             let btn = document.getElementById('tw-comment-mask-btn');
             if (btn) {
                 // 🚀 核心修复：匿名用户现在也有真实的图片头像了，直接统一渲染 <img> 标签
                 btn.innerHTML = `<img src="${p.avatar}" class="tw-cm-avatar-img">`;
             }
         }

         // ================= 推特专属数据库与渲染引擎 =================
let twData = { worlds: { 'default': { posts: [] } } };
function saveTwData() {
    LocalDB.setItem('soap_tw_data_v2', JSON.stringify(twData)).catch(e => console.warn(e));
    try { localStorage.setItem('soap_tw_data_v2', JSON.stringify(twData)); } catch(e){}
}

function getCurrentWorldPosts() {
    let wid = gConfig.currentWorldviewId || 'default';
    if (!twData.worlds) twData.worlds = { 'default': { posts: [] } };
    if (!twData.worlds[wid]) twData.worlds[wid] = { posts: [] };
    return twData.worlds[wid].posts;
}

// ================= 推特通知系统引擎 =================
function addTwNotification(type, actorId, content, targetPostId) {
    let wid = gConfig.currentWorldviewId || 'default';
    if (!twData.worlds) twData.worlds = { 'default': { posts: [] } };
    if (!twData.worlds[wid]) twData.worlds[wid] = { posts: [] };
    if (!twData.worlds[wid].notifications) twData.worlds[wid].notifications = [];

    const c = contacts.find(x => x.id === actorId);
    if (!c) return;

    twData.worlds[wid].notifications.push({
        id: 'notif_' + Date.now() + Math.random(),
        type: type, // 'reply' (回复), 'mention' (提及)
        actorId: c.id,
        actorName: c.twName || c.name,
        actorAvatar: getTwAvatarSrc(c),
        content: content,
        postId: targetPostId,
        timestamp: Date.now(),
        isRead: false
    });
    
    saveTwData();
    updateTwNotificationBadge();
}

function updateTwNotificationBadge() {
    let wid = gConfig.currentWorldviewId || 'default';
    let notifs = (twData.worlds && twData.worlds[wid] && twData.worlds[wid].notifications) ? twData.worlds[wid].notifications : [];
    let unreadCount = notifs.filter(n => !n.isRead).length;
    
    // 找到侧边栏和底栏的通知小红点
    const badges = document.querySelectorAll('.fa-bell + span');
    badges.forEach(badge => {
        if (unreadCount > 0) {
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    });
}

function renderTwNotifications() {
    const list = document.getElementById('tw-notifications-list');
    if (!list) return;
    list.innerHTML = '';
    
    let wid = gConfig.currentWorldviewId || 'default';
    if (!twData.worlds[wid].notifications) twData.worlds[wid].notifications = [];
    let notifs = twData.worlds[wid].notifications;

    if (notifs.length === 0) {
        list.innerHTML = '<div class="text-center text-mono-500 py-10">暂无通知</div>';
        return;
    }

    notifs.slice().reverse().forEach(n => {
        let iconHtml = '';
        let actionText = '';
        
        if (n.type === 'reply') {
            iconHtml = '<i class="fa-solid fa-comment text-blue-500 text-[24px]"></i>';
            actionText = '回复了你的推文';
        } else if (n.type === 'mention') {
            iconHtml = '<i class="fa-solid fa-at text-purple-500 text-[24px]"></i>';
            actionText = '在推文中提及了你';
        }

        let timeDisplay = mFormatRelativeTime(n.timestamp);

        list.insertAdjacentHTML('beforeend', `
            <div class="border-b border-mono-200 dark:border-mono-700 p-4 hover:bg-mono-100/50 dark:hover:bg-mono-800/50 transition cursor-pointer flex ${n.isRead ? 'opacity-70' : ''}" onclick="openPostDetailsById('${n.postId}')">
                <div class="w-10 text-right pr-3 pt-1">${iconHtml}</div>
                <div class="flex-1 flex justify-between items-start">
                    <div class="flex-1 pr-2">
                        <img src="${n.actorAvatar}" class="w-8 h-8 mb-2 bg-mono-200 dark:bg-mono-800 rounded-full object-cover" onclick="event.stopPropagation(); openOtherProfile('${n.actorId}')">
                        <p class="text-[15px] leading-normal"><span class="font-bold hover:underline" onclick="event.stopPropagation(); openOtherProfile('${n.actorId}')">${n.actorName}</span> ${actionText}</p>
                        <p class="text-mono-500 text-[15px] mt-1">${n.content}</p>
                        <p class="text-mono-400 text-[12px] mt-2">${timeDisplay}</p>
                    </div>
                    <div class="p-1.5 text-mono-400 hover:text-red-500 hover:bg-red-500/10 rounded-full cursor-pointer transition flex items-center justify-center shrink-0" onclick="event.stopPropagation(); deleteTwNotification('${n.id}')" title="删除通知">
                        <i class="fa-regular fa-trash-can text-[15px]"></i>
                    </div>
                </div>
            </div>
        `);
    });

    // 标记为已读
    let changed = false;
    notifs.forEach(n => { if (!n.isRead) { n.isRead = true; changed = true; } });
    if (changed) {
        saveTwData();
        updateTwNotificationBadge();
    }
}

// 🚀 核心新增：删除单条通知的函数
function deleteTwNotification(notifId) {
    if (!confirm('确定要删除这条通知吗？')) return;
    
    let wid = gConfig.currentWorldviewId || 'default';
    if (twData.worlds && twData.worlds[wid] && twData.worlds[wid].notifications) {
        twData.worlds[wid].notifications = twData.worlds[wid].notifications.filter(n => n.id !== notifId);
        saveTwData();
        renderTwNotifications();
    }
}

// 辅助函数：通过 ID 直接打开帖子详情
function openPostDetailsById(postId) {
    let currentPosts = getCurrentWorldPosts();
    let post = currentPosts.find(p => p.id === postId);
    if (post) {
        // 模拟点击该帖子
        let dummyEl = document.createElement('div');
        dummyEl.dataset.postId = postId;
        dummyEl.innerHTML = `
            <img src="${post.avatar}">
            <div class="post-author-name">${post.name}</div>
            <div class="post-author-handle">${post.handle}</div>
            <div class="post-text-content">${post.content}</div>
            <div class="hover:text-pink-500"><span class="like-count-span">${post.likes}</span><i class="${post.isLiked ? 'fa-solid' : 'fa-regular'}"></i></div>
        `;
        openPostDetails(dummyEl);
    } else {
        alert("该帖子已被删除或不存在。");
    }
}

function renderTwFeed() {
    const forYouPosts = document.getElementById('foryou-posts');
    if (!forYouPosts) return;
    forYouPosts.innerHTML = '';
    
    const currentPosts = getCurrentWorldPosts();
    
    if (currentPosts.length === 0) {
        forYouPosts.innerHTML = '<div class="text-center text-mono-500 py-10">当前宇宙暂无新鲜事，点击右上角魔法棒召唤 AI 吧。</div>';
        return;
    }
    // 倒序渲染，最新的在最上面
    currentPosts.slice().reverse().forEach(post => {
        forYouPosts.insertAdjacentHTML('beforeend', generateTwPostHtml(post));
    });
}

async function initMomentsSystem() {
             // 🚀 核心修复：引入异步拉取，全面对接无限容量的 LocalDB！无论传几十MB的原图都不会再丢失。
             if (!isMomentsLoaded) {
                 try {
                     let sMD = await LocalDB.getItem('soap_moments_data_v1') || localStorage.getItem('soap_moments_data_v1');
                     if (sMD) momentsData = JSON.parse(sMD);
                 } catch(e){}
                 isMomentsLoaded = true;
             }
         
             // 已清空默认动态的自动植入逻辑。
             // 现在朋友圈默认是一个干净的状态，动态完全由你手动触发或发布！
         
             renderMomentsUI();
             initSnow();
         }
         
         function saveMomentsData() {
             // 🚀 核心修复：双路并发写入！打破 5MB 限制，原图直接存入底层数据库。
             LocalDB.setItem('soap_moments_data_v1', JSON.stringify(momentsData)).catch(e => console.warn("LocalDB 写入失败", e));
             try { localStorage.setItem('soap_moments_data_v1', JSON.stringify(momentsData)); } catch(e){}
         }
         
         // 根据角色系统指令（人设），提取关键词生成符合其风格的动态！
         function generateRandomPostFor(c) {
             if(!c.history || !c.history[0]) return;
             const prompt = c.history[0].content.toLowerCase();
             let texts = [];
             let desc = null;
         
             if(prompt.includes('冷') || prompt.includes('漠') || prompt.includes('病')) {
                 texts = ["在这个快节奏的世界里，保持偶尔的停顿也是一种必修课。", "无聊的喧嚣。", "安静一点不好吗。"];
                 desc = "照片里是一张原木桌面的局部，阳光透过百叶窗投下平行的光影。桌上放着一杯刚泡好的黑咖啡，杯口还在升腾着袅袅热气。画面宁静得能让人听见时间流逝的声音。";
             } else if (prompt.includes('温') || prompt.includes('柔') || prompt.includes('暖')) {
                 texts = ["新买的捕梦网，挂在窗前，希望今晚有个好梦。🌙", "如果风有颜色，今天一定是温柔的粉色。", "今天遇到的猫咪很可爱。"];
                 desc = "画面中是一个手工编织的捕梦网，挂在半开的木质窗框上。网中间点缀着几颗青绿色的松石，下方垂落的白色羽毛正随着微风轻轻摇曳。窗外是深蓝色的夜空，一弯半月挂在树梢。";
             } else {
                 texts = ["记录一些生活碎片。", "今天天气不错，适合出门走走。", "忙里偷闲的一天。"];
                 desc = "一张随手拍的街景照片，阳光正好，街角的咖啡店门口坐着三三两两闲聊的人。";
             }
             
             let content = texts[Math.floor(Math.random() * texts.length)];
             
             // 随机加入小互动（拿别的联系人或者我来评论）
             let mockComments = [];
             if(Math.random() > 0.5 && contacts.length > 1) {
                 let commenter = contacts.find(x => x.id !== c.id);
                 if(commenter) mockComments.push({ name: commenter.name, text: "看起来不错。" });
             }
             if(Math.random() > 0.5) {
                 mockComments.push({ name: gConfig.meName || '我', text: "晚安，好梦。" });
             }
         
             momentsData.posts.unshift({
                 id: 'm_post_' + Date.now() + Math.floor(Math.random()*100),
                 authorId: c.id,
                 authorName: c.momentName || c.name,
                 authorAvatar: c.chatAvatar || c.avatar || M_DEFAULT_AVATAR,
                 content: content,
                 imgUrl: null,
                 isTextPhoto: true,
                 sceneDesc: desc,
                 timeStr: Math.floor(Math.random()*12 + 1) + ' HOURS AGO',
                 likes: [],
                 comments: mockComments
             });
         }
         
         function renderMomentsUI() {
             const sidebar = document.getElementById('m-sidebar-btns');
             const pagesContainer = document.getElementById('m-pages-container');
             
             // 清空
             sidebar.innerHTML = '';
             // 移除旧的 page（保留加号按钮）
             Array.from(pagesContainer.querySelectorAll('.m-page')).forEach(p => p.remove());
         
             let myAvatar = gConfig.meAvatar || M_DEFAULT_AVATAR;
         
             // 1. 注入侧边栏按钮
             // 综合广场
             sidebar.innerHTML += `<div class="m-avatar-btn active" onclick="mSwitchPage('square', this)" title="朋友圈"><div class="m-star-icon-btn"><svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div></div>`;
             
             // 联系人
             contacts.forEach(c => {
                 let av = c.chatAvatar || c.avatar || M_DEFAULT_AVATAR;
                 sidebar.innerHTML += `<div class="m-avatar-btn" onclick="mSwitchPage('${c.id}', this)" title="${c.name}"><img src="${av}" alt="${c.name}"></div>`;
             });
         
             // 分界线与我
             sidebar.innerHTML += `<div class="m-sidebar-divider"></div>`;
             sidebar.innerHTML += `<div class="m-avatar-btn" onclick="mSwitchPage('me', this)" title="我的主页"><img src="${myAvatar}" alt="我"></div>`;
         
             // 2. 生成对应的页面内容 HTML
             // (A) 综合广场 Page
             let squareHtml = `<div id="m-page-square" class="m-page active">
                 <div class="m-profile-header">
                     <div class="m-cover-container" onclick="mToggleCoverBtn(this)">
                         <img class="m-profile-cover" src="${momentsData.userCovers['square'] || M_DEFAULT_COVER}">
                         <label class="m-upload-cover-btn" title="更换背景图" onclick="event.stopPropagation()">
                             <input type="file" accept="image/*" onchange="mHandleCoverUpload(event, 'square')">
                             <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                         </label>
                     </div>
                 </div>
                 <div class="m-feed-container" style="padding-top: 0;">
                     <h1 class="m-square-header-title">MOMENTS ✧</h1>
                     <div id="m-feed-square"></div>
                 </div>
             </div>`;
             pagesContainer.insertAdjacentHTML('afterbegin', squareHtml);
         
             // (B) 每个人格的专属 Page
         contacts.forEach(c => {
         let av = c.chatAvatar || c.avatar || M_DEFAULT_AVATAR;
         let cover = momentsData.userCovers[c.id] || M_DEFAULT_COVER;
         let pHtml = `<div id="m-page-${c.id}" class="m-page">
             <header class="m-profile-header">
                 <div class="m-cover-container" onclick="mToggleCoverBtn(this)">
                     <img class="m-profile-cover" src="${cover}">
                     <label class="m-upload-cover-btn" title="更换背景图" onclick="event.stopPropagation()">
                         <input type="file" accept="image/*" onchange="mHandleCoverUpload(event, '${c.id}')">
                         <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                     </label>
                 </div>
                 <div class="m-profile-info-container">
                     <div style="display:flex; align-items:flex-end;">
                         <div class="m-profile-avatar-wrapper" onclick="document.getElementById('m-ai-avatar-file-${c.id}').click()" title="点击更换头像">
                             <img class="m-profile-avatar" src="${av}">
                             <div class="m-api-add-btn" title="触发Ta发送动态" onclick="event.stopPropagation(); mTriggerAIPost(event, '${c.id}')">
                                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 5v14M5 12h14"></path></svg>
                             </div>
                         </div>
                         <input type="file" id="m-ai-avatar-file-${c.id}" hidden accept="image/*" onchange="mHandleAIAvatarUpload(event, '${c.id}')">
                         <div class="m-profile-stars"><span class="m-profile-star">✦</span><span class="m-profile-star">✧</span><span class="m-profile-star">✦</span><span class="m-profile-star">✧</span><span class="m-profile-star">✦</span><span class="m-profile-star">✧</span></div>
                     </div>
                     <h1 class="m-profile-name">${c.momentName || c.name}</h1>
                     <p class="m-profile-bio" style="cursor: pointer; position: relative; z-index: 10;" onclick="mOpenProfileEditModal('${c.id}')" title="点击编辑资料">${c.momentSign || '/// DIGITAL PERSONA ///'}</p>
                 </div>
             </header>
             <div class="m-feed-container" style="padding-top: 0;" id="m-feed-${c.id}"></div>
         </div>`;
         pagesContainer.insertAdjacentHTML('afterbegin', pHtml);
         });
             // (C) 我的专属 Page
             let meCover = momentsData.userCovers['me'] || M_DEFAULT_COVER;
             let meName = momentsData.meName || gConfig.meName || '我';
             let meAvatar = momentsData.meAvatar || gConfig.meAvatar || M_DEFAULT_AVATAR;
             let meSign = momentsData.meSign || '记录自己的生活碎片。';
             
             let meHtml = `<div id="m-page-me" class="m-page">
                 <header class="m-profile-header">
                     <div class="m-cover-container" onclick="mToggleCoverBtn(this)">
                         <img class="m-profile-cover" src="${meCover}">
                         <label class="m-upload-cover-btn" title="更换背景图" onclick="event.stopPropagation()">
                             <input type="file" accept="image/*" onchange="mHandleCoverUpload(event, 'me')">
                             <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                         </label>
                     </div>
                     <div class="m-profile-info-container">
                         <div style="display:flex; align-items:flex-end;">
                             <div class="m-profile-avatar-wrapper" onclick="document.getElementById('m-me-avatar-file').click()" title="点击更换头像">
                                 <img class="m-profile-avatar" src="${meAvatar}">
                             </div>
                             <div class="m-profile-stars"><span class="m-profile-star">✦</span><span class="m-profile-star">✧</span><span class="m-profile-star">✦</span><span class="m-profile-star">✧</span><span class="m-profile-star">✦</span><span class="m-profile-star">✧</span></div>
                         </div>
                         <h1 class="m-profile-name" style="cursor: pointer;" onclick="mOpenProfileEditModal('me')" title="点击编辑网名">${meName}</h1>
                         <p class="m-profile-bio" style="cursor: pointer; position: relative; z-index: 10;" onclick="mOpenProfileEditModal('me')" title="点击编辑签名">${meSign}</p>
                     </div>
                 </header>
                 <div class="m-feed-container" style="padding-top: 0;" id="m-feed-me"></div>
             </div>
             <!-- 隐藏的头像上传器 -->
             <input type="file" id="m-me-avatar-file" hidden accept="image/*" onchange="mHandleMeAvatarUpload(event)">`;
             pagesContainer.insertAdjacentHTML('afterbegin', meHtml);
         
             mRenderAllFeeds();
             
             // 确保首次背景图同步
             mSwitchPage('square', sidebar.firstElementChild);
         }
         
         function mRenderAllFeeds() {
             const sqFeed = document.getElementById('m-feed-square'); if(sqFeed) sqFeed.innerHTML = '';
             const meFeed = document.getElementById('m-feed-me'); if(meFeed) meFeed.innerHTML = '';
             
             // 核心修复：重绘前，必须遍历清空所有角色的专属动态容器！防止被删的动态变成残留钉子户！
             contacts.forEach(c => {
                 const aiFeed = document.getElementById('m-feed-' + c.id);
                 if (aiFeed) aiFeed.innerHTML = '';
             });
             
             // 渲染综合广场及分发
             momentsData.posts.forEach(p => {
                 if(sqFeed) sqFeed.insertAdjacentHTML('beforeend', mCreatePostHTML(p));
                 // 分发给个人页
                 let targetFeed = document.getElementById('m-feed-' + p.authorId);
                 if(targetFeed) targetFeed.insertAdjacentHTML('beforeend', mCreatePostHTML(p));
             });
         }
         function mRegenerateAIComments(postId) {
             let post = momentsData.posts.find(p => p.id === postId);
             if (!post) return;
             
             if (!confirm("确定要删除当前该动态下的所有 AI 评论，并让 AI 重新回复吗？")) return;
             
             // 保留我的评论，删掉所有 AI 的评论
             post.comments = post.comments.filter(c => c.id === 'me');
             saveMomentsData();
             mRenderAllFeeds();
             
             if (post.authorId === 'me') {
                 // 是我的动态，重新让 AI 群友来评论
                 mTriggerAIAfterUserPost(post);
             } else {
                 // 是 AI 的动态，让它重新回复我最后一次的评论
                 let lastUserComment = post.comments.slice().reverse().find(c => c.id === 'me');
                 if (lastUserComment) {
                     const c = contacts.find(x => x.id === post.authorId);
                     if (c) {
                         let uName = momentsData.meName || gConfig.meName || '我';
                         mTriggerAICommentReply(c, post, lastUserComment.text, uName);
                     }
                 } else {
                     alert("这是 AI 发的动态，且你还没有评论过，AI 无法凭空回复你哦。");
                 }
             }
         }
         // 动态计算过去的时间
         function mFormatRelativeTime(ts) {
             if(!ts) return 'JUST NOW';
             const diff = Math.floor((Date.now() - ts) / 1000);
             if(diff < 60) return 'JUST NOW';
             if(diff < 3600) return Math.floor(diff/60) + ' MINS AGO';
             if(diff < 86400) return Math.floor(diff/3600) + ' HOURS AGO';
             if(diff < 172800) return 'YESTERDAY';
             const d = new Date(ts);
             return `${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
         }
         
         function mCreatePostHTML(p) {
             // 核心修复：实时去系统中抓取最新头像和名字，彻底解决改名改头像后不同步的问题！
             let dynAvatar = p.authorAvatar;
             let dynName = p.authorName;
             if (p.authorId === 'me') {
                 dynAvatar = momentsData.meAvatar || gConfig.meAvatar || M_DEFAULT_AVATAR;
                 dynName = momentsData.meName || gConfig.meName || '我';
             } else {
                 const c = contacts.find(x => x.id === p.authorId);
                 if (c) {
                     dynAvatar = c.chatAvatar || c.avatar || M_DEFAULT_AVATAR;
                     dynName = c.momentName || c.name;
                 }
             }
             
             // 计算真实精准的时间戳
             let displayTime = p.timestamp ? mFormatRelativeTime(p.timestamp) : (p.timeStr || 'JUST NOW');
         
             let imgHTML = '';
             if(p.imgUrl || p.sceneDesc) {
                 const finalImgUrl = p.imgUrl ? p.imgUrl : M_DEFAULT_POST_IMG;
                 const finalSceneDesc = p.sceneDesc ? p.sceneDesc : "";
                 const isTextPhoto = (!p.imgUrl && p.sceneDesc) ? true : false;
                 const hintText = isTextPhoto ? "🔍 CLICK" : "🔍 VIEW";
                 
                 imgHTML = `
                 <div class="m-post-image-wrapper" data-is-text-photo="${isTextPhoto}" data-scene-desc="${finalSceneDesc}" onclick="mOpenBookmarkModal(this)">
                     <svg class="m-post-paperclip" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                     <div class="m-post-image-inner">
                         <img class="m-post-image" src="${finalImgUrl}">
                         <div class="m-post-image-hint">${hintText}</div>
                     </div>
                 </div>`;
             }
         
             let isLiked = p.likes.includes('me') ? 'liked' : '';
             
             let commentsHtml = '';
             if(p.comments && p.comments.length > 0) {
         p.comments.forEach((cm, cIdx) => {
             // 评论区的名字也同步享受实时更新
             let cmName = cm.name;
             if (cm.id === 'me') {
                 cmName = momentsData.meName || gConfig.meName || '我';
             } else if (cm.id) {
                 const c = contacts.find(x => x.id === cm.id);
                 if (c) cmName = c.momentName || c.name;
             }
             commentsHtml += `<div class="m-comment-item" onmousedown="mCommentDown('${p.id}', ${cIdx})" onmouseup="mCommentUp(event, this, '${p.id}', ${cIdx}, '${cmName}', '${cm.id}')" ontouchstart="mCommentDown('${p.id}', ${cIdx})" ontouchend="mCommentUp(event, this, '${p.id}', ${cIdx}, '${cmName}', '${cm.id}')" style="cursor: pointer;" title="点击回复，长按删除"><span class="m-comment-author">${cmName}：</span><span>${cm.text}</span></div>`;
         });
         }
         
             return `
                 <article class="m-post" id="post-${p.id}">
                     <div class="m-post-header">
                         <img src="${dynAvatar}">
                         <div class="m-post-info">
                             <span class="m-post-name">${dynName}</span>
                             <span class="m-post-time" onclick="mRegenerateAIComments('${p.id}')" style="cursor:pointer;" title="点击重新生成AI回复">${displayTime}</span>
                         </div>
                     </div>
                     <div class="m-post-content">${p.content}</div>
                     ${imgHTML}
                     <div class="m-interaction-bar" style="justify-content: space-between;">
                         <div style="display: flex; gap: 20px;">
                             <div class="m-action-icon m-like-btn ${isLiked}" onclick="mToggleLike(event, this, '${p.id}')" title="点赞">
                                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                             </div>
                             <div class="m-action-icon" onclick="mToggleCommentBox(this)" title="评论">
                                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                             </div>
                         </div>
                         <div class="m-action-icon" style="color: #8a0b1f; opacity: 0.5;" onclick="mDeletePost('${p.id}')" title="删除该动态">
                             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                         </div>
                     </div>
                     <div class="m-comments-section ${commentsHtml ? 'show' : ''}">
                         <div class="m-comments-list">${commentsHtml}</div>
                         <div class="m-comment-input-wrapper">
                             <input type="text" class="m-comment-input" placeholder="留下一丝痕迹..." onkeydown="if(event.key==='Enter') mSubmitComment(this, '${p.id}')">
                             <div class="m-comment-submit" onclick="mSubmitComment(this.previousElementSibling, '${p.id}')">发送</div>
                         </div>
                     </div>
                 </article>
             `;
         }
         
         function mSwitchPage(pageId, element) {
             const avatars = document.querySelectorAll('.m-avatar-btn');
             avatars.forEach(btn => btn.classList.remove('active'));
             if(element) element.classList.add('active');
         
             const pages = document.querySelectorAll('.m-page');
             pages.forEach(page => {
                 page.classList.remove('active');
                 const posts = page.querySelectorAll('.m-post');
                 posts.forEach(post => post.style.animation = 'none');
             });
             
             const targetPage = document.getElementById('m-page-' + pageId);
             if(targetPage) {
                 targetPage.classList.add('active');
                 targetPage.scrollTop = 0; 
                 
                 requestAnimationFrame(() => {
                     const posts = targetPage.querySelectorAll('.m-post');
                     posts.forEach(post => post.style.animation = '');
                 });
         
                 // 核心修复：直接从 momentsData 缓存中精准提取该角色的封面背景！
                 // 不再依赖难以判定 Base64 的 <img> 标签 src 属性。
                 const targetCoverData = momentsData.userCovers[pageId];
                 const bgLayer = document.getElementById('m-sidebar-bg');
                 
                 bgLayer.style.opacity = 0;
                 setTimeout(() => {
                     if (pageId === 'square') {
                         // 广场默认透明偏白
                         bgLayer.style.backgroundImage = 'none';
                         bgLayer.style.backgroundColor = '#fafafa';
                     } else if (targetCoverData) {
                         // 只要有封面数据，立刻将其设为左侧高斯模糊的底层背景！
                         bgLayer.style.backgroundImage = `url('${targetCoverData}')`;
                         bgLayer.style.backgroundColor = 'transparent';
                     } else {
                         // 没设置封面时，退回系统默认纯色
                         bgLayer.style.backgroundImage = 'none';
                         bgLayer.style.backgroundColor = '#e8ecef';
                     }
                     bgLayer.style.opacity = 1;
                 }, 200); // 200ms 的平滑淡入淡出，配合 CSS 里的 transition
             }
         }
         
         function mToggleCoverBtn(container) { container.classList.toggle('show-btn'); }
         
         function mHandleCoverUpload(event, uid) {
             const file = event.target.files[0];
             if (!file) return;
             const reader = new FileReader();
             reader.onload = function(e) {
                 momentsData.userCovers[uid] = e.target.result;
                 saveMomentsData();
                 const targetPage = document.getElementById('m-page-' + uid);
                 const coverImg = targetPage.querySelector('.m-profile-cover');
                 if(coverImg) coverImg.src = e.target.result;
                 targetPage.querySelector('.m-cover-container').classList.remove('show-btn');
                 
                 if (targetPage.classList.contains('active')) {
                     const bgLayer = document.getElementById('m-sidebar-bg');
                     bgLayer.style.opacity = 0;
                     setTimeout(() => {
                         bgLayer.style.backgroundImage = `url('${e.target.result}')`;
                         bgLayer.style.opacity = 1;
                     }, 150);
                 }
             };
             reader.readAsDataURL(file);
         }
         
         // 交互：点赞
         function mToggleLike(e, element, postId) {
             const isLiked = element.classList.contains('liked');
             let post = momentsData.posts.find(p => p.id === postId);
             if(!post) return;
         
             if (isLiked) {
                 element.classList.remove('liked');
                 post.likes = post.likes.filter(x => x !== 'me');
             } else {
                 element.classList.add('liked');
                 if(!post.likes.includes('me')) post.likes.push('me');
                 const rect = element.getBoundingClientRect();
                 const centerX = rect.left + rect.width / 2;
                 const centerY = rect.top + rect.height / 2;
                 mCreateLikeParticles(centerX, centerY);
             }
             saveMomentsData();
         }
         
         function mCreateLikeParticles(x, y) {
             const particleCount = 8; const colors = ['#ff6b81', '#ff9a9e', '#ff4757']; 
             for (let i = 0; i < particleCount; i++) {
                 const particle = document.createElement('div'); particle.classList.add('like-particle');
                 const size = Math.random() * 4 + 3; particle.style.width = size + 'px'; particle.style.height = size + 'px';
                 particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                 document.body.appendChild(particle);
                 const angle = (i / particleCount) * 360 + (Math.random() * 20 - 10);
                 const velocity = 35 + Math.random() * 25; 
                 const tx = Math.cos(angle * Math.PI / 180) * velocity; const ty = Math.sin(angle * Math.PI / 180) * velocity;
                 particle.style.left = x + 'px'; particle.style.top = y + 'px';
                 const animation = particle.animate([
                     { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
                     { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0)`, opacity: 0 }
                 ], { duration: 400 + Math.random() * 200, easing: 'cubic-bezier(0.25, 1, 0.5, 1)' });
                 animation.onfinish = () => particle.remove();
             }
         }
         
         function mToggleCommentBox(element) {
             const post = element.closest('.m-post');
             const commentSection = post.querySelector('.m-comments-section');
             if(commentSection) {
                 if(!commentSection.classList.contains('show')) commentSection.classList.add('show');
                 const input = commentSection.querySelector('.m-comment-input');
                 if(input) input.focus();
             }
         }
         
         function mSubmitComment(inputEl, postId) {
         let text = inputEl.value.trim();
         if(!text) return;
         let post = momentsData.posts.find(p => p.id === postId);
         if(!post) return;
         
         let uName = momentsData.meName || gConfig.meName || '我';
         let replyTargetId = inputEl.dataset.replyId;
         let replyTargetName = inputEl.dataset.replyName;
         
         // 如果是在回复某个人，系统自动在前面拼接“回复 xxx：”
         if (replyTargetId && replyTargetName) {
             text = `回复 ${replyTargetName}：${text}`;
         }
         
         post.comments.push({ id: 'me', name: uName, text: text });
         saveMomentsData();
         
         inputEl.value = '';
         inputEl.placeholder = '留下一丝痕迹...';
         inputEl.dataset.replyId = ''; 
         inputEl.dataset.replyName = ''; 
         mRenderAllFeeds(); 
         
         let targetId = replyTargetId ? replyTargetId : post.authorId;
         
         if (targetId !== 'me') {
             const c = contacts.find(x => x.id === targetId);
             if (c) {
                 let timeString = new Date().toLocaleString();
                 let actionDesc = replyTargetId ? `回复了你在动态（“${post.content}”）下的评论` : `在你的朋友圈动态（“${post.content}”）下方评论了你`;
                 
                 c.memory = (c.memory ? c.memory + "\n\n" : "") + `[朋友圈互动 - ${timeString}]：user(${uName}) ${actionDesc}：“${text}”。`;
                 
                 let momentPrompt = `[📱 朋友圈特别提醒 - ${timeString}]：用户刚刚${actionDesc}：“${text}”。如果你们正在聊天，你可以自然地提起这件事。`;
                 c.history.push({role: 'system_sum', content: `<span style="display:none;">${momentPrompt}</span>`});
                 
                 saveData();
                 
                 let delay = Math.floor(Math.random() * 15000) + 5000;
                 setTimeout(() => { mTriggerAICommentReply(c, post, text, uName); }, delay);
             }
         }
         }
         
         // 专属大模型调用：让 AI 在朋友圈回复我的评论
         async function mTriggerAICommentReply(c, post, myCommentText, uName) {
             if(!gConfig.apiUrl || !gConfig.apiKey) return;
         
             let sysPrompt = `你是一个拥有独立人设的真实人物，正在刷朋友圈。
         【你的人设指令】：
         ${c.history[0].content}
         
         【🛡️ 结界警告：朋友圈绝对隔离协议 🛡️】
         你现在是拿着手机在回复朋友圈评论！你们是隔着屏幕的网友状态！
         【最高强制禁令】：
         1. 绝对禁止输出任何 <thought> 标签和内心戏！
         2. 绝对禁止输出任何星号 * 或括号包裹的动作描写！
         你只能输出纯文本的评论回复内容，不能带有任何动作或心理描写符号！违者系统崩溃！
         
         【事件背景】：
         不久前，你在朋友圈发布了这样一条动态：
         “${post.content}”
         
         刚刚，用户（${uName}）在你的这条动态下面评论了你：
         “${myCommentText}”
         
         【任务要求】：
         请结合你的人设和当时发动态的心情，直接在朋友圈回复TA！
         注意：
         1. 不要写太多多余的旁白或动作描写，重点是输出你回复的纯文字。
         2. 保持朋友圈回复的简短口语化，不要长篇大论。
         3. 【⚠️ 人设绝对服从警告 ⚠️】：你的回复必须【100% 极度契合】你的人设！绝对禁止使用 AI 般热情、客套、平庸的语气！绝不说“祝你开心”这种废话！如果是高冷/暴躁，字数要少、带刺；如果是病娇/占有欲强，要透出阴暗的压迫感；如果是深情，要极其克制高级。必须像一个真实的、性格极度鲜明的人在回怼或撩拨！`;
         
             try {
                 const response = await fetch(`${gConfig.apiUrl}/v1/chat/completions`, { 
                     method: 'POST', 
                     headers: { 'Authorization': `Bearer ${gConfig.apiKey}`, 'Content-Type': 'application/json' }, 
                     body: JSON.stringify({ 
                         model: gConfig.model, 
                         messages: [{ role: 'system', content: sysPrompt }], 
                         temperature: 0.8 
                     }) 
                 });
         
                 if (!response.ok) return;
                 const data = await response.json(); 
                 // 物理防线：剔除所有标签和所有的星号包裹动作
                 let replyText = data.choices[0].message.content.replace(/<[^>]+>/g, '').replace(/\*[^*]+\*/g, '').trim();
                 
                 // 防空回兜底
                 if (!replyText) replyText = "……";
                 
                 // 构建带 @ 的回复效果
                 let finalReplyText = `回复 ${uName}：${replyText}`;
                 
                 // 把 AI 的回复推入那条帖子的评论区
                 post.comments.push({ id: c.id, name: c.momentName || c.name, text: finalReplyText });
                 saveMomentsData();
                 
                 // 再次写入核心记忆：告诉 AI 自己回复了什么，形成完整闭环
                 c.memory = (c.memory ? c.memory + "\n\n" : "") + `[朋友圈互动]：你回复了 ${uName} 的评论：“${replyText}”。`;
                 
                 // 🚀 核心修复：同步在主线聊天室显示可见的系统旁白
                 let timeString = new Date().toLocaleString();
                 let myPrompt = `[📱 朋友圈特别提醒 - ${timeString}]：你刚刚在朋友圈回复了用户的评论：“${replyText}”。`;
                 c.history.push({role: 'system_sum', content: `<i>✧ 对方在朋友圈回复了你的评论</i>\n<span style="display:none;">${myPrompt}</span>`});
                 
                 saveData();
         
                 // 如果当前正好停在朋友圈页面，重绘让新评论冒出来！
                 if (document.getElementById('view-main-moments').style.display !== 'none') {
                     mRenderAllFeeds();
                 }
         
             } catch (error) {
                 console.error("AI 评论回复失败:", error);
             }
         }
         
         let m_commentPressTimer = null;
         let m_commentIsLongPress = false;
         
         function mCommentDown(postId, cIdx) {
         m_commentIsLongPress = false;
         m_commentPressTimer = setTimeout(() => {
             m_commentIsLongPress = true;
             mDeleteComment(postId, cIdx);
         }, 600);
         }
         
         function mCommentUp(event, el, postId, cIdx, authorName, authorId) {
         if (m_commentPressTimer) clearTimeout(m_commentPressTimer);
         if (!m_commentIsLongPress) {
             if(event) event.preventDefault();
             mReplyToComment(el, postId, cIdx, authorName, authorId);
         }
         }
         
         function mReplyToComment(el, postId, cIdx, authorName, authorId) {
         if (authorId === 'me') return; // 不回复自己
         let postEl = el.closest('.m-post'); // 精准抓取用户当前正在看的那个帖子节点
         if (!postEl) return;
         let commentSection = postEl.querySelector('.m-comments-section');
         if (commentSection) {
             if (!commentSection.classList.contains('show')) commentSection.classList.add('show');
             let input = commentSection.querySelector('.m-comment-input');
             if (input) {
                 input.placeholder = `回复 ${authorName}：`;
                 input.dataset.replyId = authorId;
                 input.dataset.replyName = authorName; // 记录名字用于发送时拼接
                 input.focus();
             }
         }
         }
         
         // 交互：删除评论并同步清理记忆
         function mDeleteComment(postId, cIdx) {
         if(event) event.stopPropagation();
         if(!confirm("确定要删除这条评论吗？")) return;
         
         let post = momentsData.posts.find(p => p.id === postId);
         if(!post) return;
         
         let deletedComment = post.comments.splice(cIdx, 1)[0];
         saveMomentsData();
         
         // 核心记忆同步删除 (全文检索并替换为空)
         contacts.forEach(c => {
             if(c.memory && deletedComment.text) {
                 // 正则转义处理，防止特殊符号报错
                 let safeText = deletedComment.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                 // 强化正则：只要是 [朋友圈...] 开头，且同行内包含这段评论文本的，整行记忆抹除！(兼容双向记忆)
                 let regex = new RegExp(`\\[朋友圈(互动|事件)[^\\]]*\\].*?${safeText}.*?\\n*`, 'g');
                 c.memory = c.memory.replace(regex, '').trim();
             }
         });
         saveData();
         mRenderAllFeeds();
         }
         
         // 交互：删除动态并同步清理记忆
function mDeletePost(postId) {
    if(event) event.stopPropagation(); 
    if (!confirm("确定要删除这条朋友圈动态吗？与其相关的评论和回忆也会被抹除。")) return;
    
    let post = momentsData.posts.find(p => p.id === postId);
    if(post) {
        // 同步删除核心记忆里关于这条动态的记录（包括由此引发的所有互相评论记忆）
        contacts.forEach(c => {
            if(c.memory && post.content) {
                let safeText = post.content.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                // 强化正则：只要是 [朋友圈...] 开头，且同行内包含这条动态文本的，连带评论整行全部坐连抹除！
                let regex = new RegExp(`\\[朋友圈(互动|事件)[^\\]]*\\].*?${safeText}.*?\\n*`, 'g');
                c.memory = c.memory.replace(regex, '').trim();
            }
            // 连坐删除聊天记录中的隐藏系统提示
            let plainText = post.content.replace(/<[^>]+>/g, '').trim();
            if (plainText) {
                c.history = c.history.filter(m => !(m.role === 'system_sum' && m.content.includes(plainText)));
            }
        });
        saveData();
    }
    
    momentsData.posts = momentsData.posts.filter(p => p.id !== postId);
             saveMomentsData();
             
             let postEl = document.getElementById('post-' + postId);
             if(postEl) {
                 postEl.style.opacity = '0';
                 postEl.style.transform = 'scale(0.9)';
                 setTimeout(() => { mRenderAllFeeds(); }, 300);
             } else {
                 mRenderAllFeeds();
             }
         }
         
         // 发布弹窗控制
         function mOpenComposeModal() {
             document.getElementById('m-compose-modal').classList.add('show');
             setTimeout(() => { document.getElementById('m-compose-input').focus(); }, 50);
         }
         
         function mCloseComposeModal() {
             document.getElementById('m-compose-modal').classList.remove('show');
             document.getElementById('m-attachment-menu').classList.remove('show');
             setTimeout(() => {
                 document.getElementById('m-compose-input').value = '';
                 mRemoveComposeImage();
             }, 300);
         }
         
         function mToggleAttachmentMenu(event) {
             event.stopPropagation();
             const menu = document.getElementById('m-attachment-menu');
             menu.classList.toggle('show');
         }
         
         function mSelectTextPhoto() {
             document.getElementById('m-attachment-menu').classList.remove('show');
             m_isTextPhotoMode = true;
             m_composeImageUrl = null; 
         
             document.getElementById('m-compose-preview-img').src = M_DEFAULT_POST_IMG;
             document.getElementById('m-compose-preview-badge').style.display = 'block'; 
             
             const textInput = document.getElementById('m-compose-text-photo-input');
             textInput.style.display = 'block';
             
             document.getElementById('m-compose-preview-container').style.display = 'block';
             requestAnimationFrame(() => { setTimeout(() => { textInput.focus(); }, 50); });
         }
         
         function mHandleComposeImageSelect(event) {
             const file = event.target.files[0];
             if(!file) return;
             const reader = new FileReader();
             reader.onload = function(e) {
                 m_isTextPhotoMode = false;
                 m_composeImageUrl = e.target.result;
                 
                 const textInput = document.getElementById('m-compose-text-photo-input');
                 textInput.style.display = 'none';
                 textInput.value = '';
                 document.getElementById('m-compose-preview-badge').style.display = 'none'; 
         
                 document.getElementById('m-compose-preview-img').src = m_composeImageUrl;
                 document.getElementById('m-compose-preview-container').style.display = 'block';
             };
             reader.readAsDataURL(file);
         }
         
         function mRemoveComposeImage() {
             m_isTextPhotoMode = false;
             m_composeImageUrl = null;
             
             const textInput = document.getElementById('m-compose-text-photo-input');
             textInput.style.display = 'none';
             textInput.value = '';
         
             document.getElementById('m-compose-preview-container').style.display = 'none';
             document.getElementById('m-compose-preview-img').src = '';
             document.getElementById('m-compose-preview-badge').style.display = 'none';
         }
         
         function mSubmitMyPost() {
             const input = document.getElementById('m-compose-input').value.trim();
             const textInputVal = document.getElementById('m-compose-text-photo-input').value.trim();
             const btn = document.getElementById('m-compose-submit-btn');
             
             if(!input && !m_composeImageUrl && !(m_isTextPhotoMode && textInputVal)) {
                 alert("说点什么，或者添加个附件吧。");
                 return;
             }
         
             if (btn.classList.contains('loading')) return;
         
             btn.classList.add('loading');
             btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="18" height="18"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
         
             setTimeout(() => {
                 btn.classList.remove('loading');
                 btn.innerHTML = `PUBLISH`;
         
                 let finalSceneDesc = null;
                 if (m_isTextPhotoMode) {
                     finalSceneDesc = textInputVal || "一张留白的照片，隐藏着未说出口的心绪。";
                 }
         
                 let newPost = {
                     id: 'm_post_' + Date.now(),
                     authorId: 'me',
                     authorName: momentsData.meName || gConfig.meName || '我',
                     authorAvatar: momentsData.meAvatar || gConfig.meAvatar || M_DEFAULT_AVATAR,
                     content: input,
                     imgUrl: m_composeImageUrl,
                     isTextPhoto: m_isTextPhotoMode,
                     sceneDesc: finalSceneDesc,
                     timeStr: 'JUST NOW',
                     timestamp: Date.now(), 
                     likes: [],
                     comments: []
                 };
         
             momentsData.posts.unshift(newPost);
             saveMomentsData();
             mRenderAllFeeds();
             mCloseComposeModal();
         
             // 🚀 核心修复：把用户发朋友圈的事件，直接作为“隐形系统提示”实时推入允许互动的 AI 聊天记录中！
             // 这样用户在聊天里说“去看我朋友圈”，AI 就能立刻在上下文里看到！
             let linkedIds = momentsData.meLinkedContacts || [];
             let availableAIs = contacts.filter(c => linkedIds.includes(c.id) || linkedIds.length === 0);
             
             let timeString = new Date().toLocaleString();
             let photoHint = m_isTextPhotoMode ? `（附带了一张照片，画面是：${finalSceneDesc}）` : (m_composeImageUrl ? `（附带了一张照片）` : ``);
             let momentPrompt = `[📱 朋友圈特别提醒 - ${timeString}]：用户刚刚在朋友圈发布了一条新动态：“${input}”${photoHint}。如果你在聊天中被问及，请表现出你看到了这条朋友圈。`;
             
             availableAIs.forEach(c => {
                 c.history.push({role: 'system_sum', content: `<span style="display:none;">${momentPrompt}</span>`});
             });
             saveData();
         
             // 🚀 核心新增：触发 AI 后台围观引擎，让 TA 随机给你评论！
             mTriggerAIAfterUserPost(newPost);
         
         }, 400); 
         }
         
         // ================= 朋友圈联动面板逻辑 (独立联系人版 + 我的主页) =================
         let m_currentLinkTargetId = null;
         
         function mOpenLinkModal() {
             const activePage = document.querySelector('.m-page.active');
             if (!activePage) return;
             
             const pageId = activePage.id.replace('m-page-', '');
             if (pageId === 'square') {
                 return alert("请先在左侧点击切换到【你的主页】或某个【AI】的主页，再设置专属的互动圈子！");
             }
         
             m_currentLinkTargetId = pageId;
             const list = document.getElementById('m-link-list');
             list.innerHTML = '';
         
             if (pageId === 'me') {
                 if (!momentsData.meLinkedContacts) momentsData.meLinkedContacts = [];
                 contacts.forEach(otherC => {
                     const isChecked = momentsData.meLinkedContacts.includes(otherC.id) ? 'checked' : '';
                     let avData = otherC.chatAvatar || otherC.avatar;
                     list.innerHTML += `
                         <label style="display:flex; justify-content:space-between; align-items:center; padding: 12px; background: rgba(0,0,0,0.03); border-radius: 12px; cursor: pointer;">
                             <div style="display:flex; align-items:center; gap: 10px;">
                                 <div class="c-avatar-wrap" style="width: 32px; height: 32px; border-radius: 8px; margin-right: 0; box-shadow: none; border: none; padding: ${avData ? '0' : '4px'};">${renderAvatarHTML(avData, 'bot')}</div>
                                 <span style="font-size: 14px; font-weight: 700; color: var(--c-black);">${otherC.name}</span>
                             </div>
                             <input type="checkbox" class="btn-switch m-link-cb" value="${otherC.id}" ${isChecked}>
                         </label>
                     `;
                 });
             } else {
                 const c = contacts.find(x => x.id === pageId);
                 if (!c) return;
                 if (!c.linkedContacts) c.linkedContacts = [];
         
                 contacts.forEach(otherC => {
                     if (otherC.id === c.id) return;
                     const isChecked = c.linkedContacts.includes(otherC.id) ? 'checked' : '';
                     let avData = otherC.chatAvatar || otherC.avatar;
                     list.innerHTML += `
                         <label style="display:flex; justify-content:space-between; align-items:center; padding: 12px; background: rgba(0,0,0,0.03); border-radius: 12px; cursor: pointer;">
                             <div style="display:flex; align-items:center; gap: 10px;">
                                 <div class="c-avatar-wrap" style="width: 32px; height: 32px; border-radius: 8px; margin-right: 0; box-shadow: none; border: none; padding: ${avData ? '0' : '4px'};">${renderAvatarHTML(avData, 'bot')}</div>
                                 <span style="font-size: 14px; font-weight: 700; color: var(--c-black);">${otherC.name}</span>
                             </div>
                             <input type="checkbox" class="btn-switch m-link-cb" value="${otherC.id}" ${isChecked}>
                         </label>
                     `;
                 });
             }
         
             if (contacts.length === 0 || (pageId !== 'me' && contacts.length === 1)) {
                 list.innerHTML += '<div style="text-align:center; font-size:11px; color:#999; margin-top: 10px;">系统中还没有其他角色，无法添加联动。</div>';
             }
         
             document.getElementById('m-link-sheet').classList.add('active');
         }
         
         function mCloseLinkModal() {
    // 关闭前先静默保存
    if (m_currentLinkTargetId) {
        const cbs = document.querySelectorAll('.m-link-cb:checked');
        const ids = Array.from(cbs).map(cb => cb.value);
        if (m_currentLinkTargetId === 'me') {
            momentsData.meLinkedContacts = ids;
            saveMomentsData();
        } else {
            const c = contacts.find(x => x.id === m_currentLinkTargetId);
            if (c) { c.linkedContacts = ids; saveData(); }
        }
    }
    document.getElementById('m-link-sheet').classList.remove('active');
    m_currentLinkTargetId = null;
}
         
         function mSaveLinkModal() {
             if (!m_currentLinkTargetId) return mCloseLinkModal();
             const cbs = document.querySelectorAll('.m-link-cb:checked');
             const ids = Array.from(cbs).map(cb => cb.value);
         
             if (m_currentLinkTargetId === 'me') {
                 momentsData.meLinkedContacts = ids;
                 saveMomentsData();
                 alert(`已为您保存专属互动圈子！\n您发动态时，只有勾选的 AI 会来围观评论。`);
             } else {
                 const c = contacts.find(x => x.id === m_currentLinkTargetId);
                 if (c) {
                     c.linkedContacts = ids;
                     saveData();
                     alert(`已为【${c.name}】保存专属互动圈子！\nTA发动态时将只与勾选的人联动。`);
                 }
             }
             mCloseLinkModal();
         }
         
         // ================= 真正调取大模型发朋友圈 =================
         async function mTriggerAIPost(event, targetUid) {
             event.stopPropagation(); 
             const btn = event.currentTarget;
             if (btn.classList.contains('loading')) return;
         
             const c = contacts.find(x => x.id === targetUid);
             if(!c) return;
             
             if(!gConfig.apiUrl || !gConfig.apiKey) {
                 return alert('需配置API！请在桌面进入【Settings】填写您的接口和密钥。');
             }
         
             btn.classList.add('loading');
             btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
         
             // 构建联动好友名单，告诉AI谁可以来互动
              // 构建独立联动好友名单 (只使用该角色的 c.linkedContacts)
             let linkedInfoList = [];
             if(c.linkedContacts && c.linkedContacts.length > 0) {
                 c.linkedContacts.forEach(linkId => {
                     let lc = contacts.find(x => x.id === linkId);
                     if(lc) linkedInfoList.push(`{ id: "${lc.id}", name: "${lc.momentName || lc.name}", relation: "存在于你通讯录里的朋友" }`);
                 });
             }
             
             let uName = gConfig.meName || '我';
             let linkedInfoStr = linkedInfoList.length > 0 
                 ? "【你当前的朋友圈互动圈子名单】：\n" + linkedInfoList.join('\n') + "\n(你可以从这些人里挑出几个，模拟他们对你这条朋友圈的点赞和评论，你们可以互相调侃互怼！)"
                 : "当前没有别人与你联动，你只需发一条个人动态即可。";
         
             // ⌚ 核心时间感知引擎
             const now = new Date();
             const h = now.getHours();
             const timeDesc = h >= 0 && h < 5 ? "凌晨/深夜" : h >= 5 && h < 9 ? "清晨/早晨" : h >= 9 && h < 12 ? "上午" : h >= 12 && h < 14 ? "中午" : h >= 14 && h < 18 ? "下午" : h >= 18 && h < 20 ? "傍晚/黄昏" : "夜晚";
         
             // 精简提示词，提升响应速度，随机1~3条
             let sysPrompt = `你是${c.name}，正在发朋友圈。
人设：${c.history[0].content}
记忆：${c.memory || '无'}
时间：${timeDesc}
${linkedInfoStr}

根据你的人设性格，自然决定这次发几条朋友圈（1到3条均可）：
- 话多/活跃的角色可发2~3条
- 高冷/沉默的角色发1条即可
- 内容之间可以有关联也可以完全独立

禁止替用户（${uName}/me）伪造评论。直接输出JSON数组，无额外文字：
[{"content":"正文","isTextPhoto":false,"sceneDesc":null,"likes":[],"comments":[{"authorId":"id","authorName":"名字","text":"评论"}]}]`;
         
             try {
                 const response = await fetch(`${gConfig.apiUrl}/v1/chat/completions`, { 
                     method: 'POST', 
                     headers: { 'Authorization': `Bearer ${gConfig.apiKey}`, 'Content-Type': 'application/json' }, 
                     body: JSON.stringify({ 
                         model: gConfig.model, 
                         messages: [{ role: 'system', content: sysPrompt }, { role: 'user', content: '直接输出JSON数组：' }], 
                         temperature: 0.75
                     }) 
                 });
         
                 if (!response.ok) throw new Error("API 请求失败");
                 const data = await response.json(); 
                 let parsedResult = robustParseJSON(data.choices[0].message.content, true);
                 // 兼容：如果模型返回了单个对象而不是数组，自动包装成数组
                 if (parsedResult && !Array.isArray(parsedResult)) parsedResult = [parsedResult];
                 if (!parsedResult || parsedResult.length === 0) throw new Error("返回内容无法解析，请换一个更聪明的模型重试");
                 // 限制最多3条，防止模型发疯
                 const aiPostDataList = parsedResult.slice(0, 3);
         
                 // 循环处理每一条动态（1~3条）
                 let timeString = new Date().toLocaleString();
                 for (let pi = 0; pi < aiPostDataList.length; pi++) {
                     const aiPostData = aiPostDataList[pi];
                     // 每条时间戳错开1ms，保证顺序
                     const postTs = Date.now() + pi;

                     // 防呆：兼容模型乱翻译的中文 key
                     let newPostContent = aiPostData.content || aiPostData['朋友圈正文'] || aiPostData['正文'] || aiPostData['文案'] || "...";
                     let newSceneDesc = aiPostData.sceneDesc || aiPostData['照片描述'] || aiPostData['画面描写'] || null;
                     let newIsTextPhoto = aiPostData.isTextPhoto === true || aiPostData['是否包含照片'] === true || aiPostData['是否包含文字照片'] === true;

                     // 过滤掉 AI 脑抽替我(me)生成的点赞和评论
                     let aiLikesArray = aiPostData.likes || aiPostData['点赞'] || aiPostData['点赞者'] || [];
                     let cleanLikes = Array.isArray(aiLikesArray) ? aiLikesArray.filter(id => id !== 'me') : [];

                     let aiCommentsArray = aiPostData.comments || aiPostData['评论'] || aiPostData['评论区'] || [];
                     let cleanComments = [];
                     if (Array.isArray(aiCommentsArray)) {
                         cleanComments = aiCommentsArray.filter(cm => {
                             let cId = cm.authorId || cm.id || cm['评论者id'];
                             return cId !== 'me';
                         }).map(cm => {
                             let cId = cm.authorId || cm.id || cm['评论者id'];
                             let realName = cm.authorName || cm.name || cm['评论者名字'] || '匿名';
                             if (cId === c.id) {
                                 realName = c.momentName || c.name;
                             } else if (cId) {
                                 let findC = contacts.find(x => x.id === cId);
                                 if (findC) realName = findC.momentName || findC.name;
                             }
                             return { id: cId, name: realName, text: cm.text || cm.content || cm['评论内容'] || '' };
                         });
                     }

                     // 推入帖子数组
                     momentsData.posts.unshift({
                         id: 'm_post_' + postTs,
                         authorId: c.id,
                         authorName: c.momentName || c.name,
                         authorAvatar: c.chatAvatar || c.avatar || M_DEFAULT_AVATAR,
                         content: newPostContent,
                         imgUrl: null,
                         isTextPhoto: newIsTextPhoto,
                         sceneDesc: newSceneDesc,
                         timeStr: 'JUST NOW',
                         timestamp: postTs,
                         likes: cleanLikes,
                         comments: cleanComments
                     });

                     // 写入核心记忆
                     c.memory = (c.memory ? c.memory + "\n\n" : "") + `[朋友圈事件 - ${timeString}]：你刚刚发布了一条朋友圈动态："${newPostContent}"。`;

                     // 推入聊天上下文
                     let photoHint = newIsTextPhoto ? `（附带了一张照片，画面是：${newSceneDesc}）` : '';
                     let momentPrompt = `[📱 朋友圈特别提醒 - ${timeString}]：你刚刚在朋友圈发布了一条新动态："${newPostContent}"${photoHint}。请在接下来的聊天中保持这个设定的连贯性。`;
                     c.history.push({role: 'system_sum', content: `<i>✧ 对方在朋友圈发布了一条新动态</i>\n<span style="display:none;">${momentPrompt}</span>`});

                     // 遍历虚拟评论，写入彼此记忆
                     cleanComments.forEach(cm => {
                         if (cm.id === c.id) {
                             c.memory = (c.memory ? c.memory + "\n\n" : "") + `[朋友圈互动 - ${timeString}]：你在自己的动态（"${newPostContent}"）下方补充/回复了评论："${cm.text}"。`;
                         } else {
                             let commenter = contacts.find(x => x.id === cm.id);
                             if (commenter) {
                                 c.memory = (c.memory ? c.memory + "\n\n" : "") + `[朋友圈互动 - ${timeString}]：你的列表好友 ${commenter.name} 在你的动态（"${newPostContent}"）下方评论了你："${cm.text}"。`;
                                 commenter.memory = (commenter.memory ? commenter.memory + "\n\n" : "") + `[朋友圈互动 - ${timeString}]：你在通讯录好友 ${c.name} 的朋友圈动态（"${newPostContent}"）下方评论了TA："${cm.text}"。`;
                                 c.history.push({role: 'system_sum', content: `<span style="display:none;">[📱 朋友圈提醒 - ${timeString}]：你的列表好友 ${commenter.name} 刚刚评论了你的动态："${cm.text}"。</span>`});
                                 commenter.history.push({role: 'system_sum', content: `<span style="display:none;">[📱 朋友圈提醒 - ${timeString}]：你刚刚评论了 ${c.name} 的动态："${cm.text}"。</span>`});
                             }
                         }
                     });
                 } // end for loop

                 saveData();
                 saveMomentsData();
                 mRenderAllFeeds();

             } catch (error) {
                 console.error("朋友圈生成失败:", error);
                 alert("AI 生成动态失败，大模型输出了非标准格式。请再试一次。\n报错信息：" + error.message);
             } finally {
                 btn.classList.remove('loading');
                 btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 5v14M5 12h14"></path></svg>`;
             }
         }
         
         // 书签弹窗
         function mOpenBookmarkModal(wrapperElement) {
             const postElement = wrapperElement.closest('.m-post');
             const imgSrc = wrapperElement.querySelector('.m-post-image').src;
             const content = postElement.querySelector('.m-post-content').innerText;
             const name = postElement.querySelector('.m-post-name').innerText;
             const time = postElement.querySelector('.m-post-time').innerText;
             
             const isTextPhoto = wrapperElement.getAttribute('data-is-text-photo') === 'true';
             const sceneDesc = wrapperElement.getAttribute('data-scene-desc') || "";
         
             document.getElementById('m-bm-img').src = imgSrc;
             
             const imgWrapper = document.getElementById('m-bm-img-wrapper');
             const hintElem = imgWrapper.querySelector('.m-bookmark-img-hint');
             
             if (isTextPhoto) {
                 document.getElementById('m-bm-scene-desc').innerText = sceneDesc;
                 imgWrapper.classList.add('clickable');
                 imgWrapper.setAttribute('onclick', 'this.classList.toggle("show-desc")');
                 hintElem.innerText = "TAP TO REVEAL";
                 hintElem.style.display = 'block';
             } else {
                 document.getElementById('m-bm-scene-desc').innerText = '';
                 imgWrapper.classList.remove('clickable');
                 imgWrapper.removeAttribute('onclick');
                 hintElem.style.display = 'none';
             }
             
             document.getElementById('m-bm-text').innerText = content;
             document.getElementById('m-bm-name').innerText = name;
             document.getElementById('m-bm-time').innerText = time;
         
             imgWrapper.classList.remove('show-desc');
             document.getElementById('m-bookmark-modal').classList.add('show');
         }
         
         function mCloseBookmarkModal() {
             document.getElementById('m-bookmark-modal').classList.remove('show');
         }
         
         // 雪花背景
         let snowCanvas, snowCtx, snowWidth, snowHeight, maxSnowHeight, flakes = [];
         function initSnow() {
             snowCanvas = document.getElementById('m-snowCanvas');
             if(!snowCanvas) return;
             snowCtx = snowCanvas.getContext('2d');
             const parent = document.getElementById('view-main-moments');
             snowWidth = snowCanvas.width = parent.clientWidth;
             snowHeight = snowCanvas.height = parent.clientHeight;
             maxSnowHeight = snowHeight * 0.45; 
             flakes = [];
             for (let i = 0; i < 20; i++) {
                 flakes.push({
                     x: Math.random() * snowWidth,
                     y: Math.random() * maxSnowHeight,
                     r: Math.random() * 1.5 + 0.5, 
                     vx: Math.random() * 0.6 + 0.2, 
                     vy: Math.random() * 0.6 + 0.4, 
                     alpha: Math.random() * 0.5 + 0.3 
                 });
             }
             drawSnow();
         }
         
         function drawSnow() {
             if(!snowCtx) return;
             snowCtx.clearRect(0, 0, snowWidth, snowHeight);
             for (let i = 0; i < flakes.length; i++) {
                 let f = flakes[i];
                 let fadeRatio = Math.max(0, 1 - (f.y / maxSnowHeight));
                 let currentAlpha = f.alpha * fadeRatio;
                 snowCtx.beginPath();
                 snowCtx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
                 snowCtx.shadowBlur = 5;
                 snowCtx.shadowColor = `rgba(0, 0, 0, ${currentAlpha * 0.2})`; 
                 snowCtx.arc(f.x, f.y, f.r, 0, Math.PI * 2, true);
                 snowCtx.fill();
                 snowCtx.shadowBlur = 0;
             }
             for (let i = 0; i < flakes.length; i++) {
                 let f = flakes[i];
                 f.x += f.vx;
                 f.y += f.vy;
                 if (f.x > snowWidth || f.y > maxSnowHeight) {
                     if (Math.random() > 0.5) { f.x = -5; f.y = Math.random() * maxSnowHeight * 0.5; } 
                     else { f.x = Math.random() * snowWidth; f.y = -5; }
                 }
             }
             if(document.getElementById('view-main-moments').style.display !== 'none') {
                 requestAnimationFrame(drawSnow);
             }
         }
         
         window.addEventListener('resize', () => {
             if(document.getElementById('view-main-moments').style.display !== 'none') initSnow();
         });
         // ================= 朋友圈角色资料与 AI 生成引擎 =================
         let m_currentEditProfileId = null;
         
         // 处理“我”的朋友圈独立头像上传
         function mHandleMeAvatarUpload(event) {
         const file = event.target.files[0];
         if (!file) return;
         const reader = new FileReader();
         reader.onload = function(e) {
             momentsData.meAvatar = e.target.result;
             saveMomentsData();
             renderMomentsUI();
             
             // 上传后保持在“我的主页”
             const activeAvatars = document.querySelectorAll('.m-avatar-btn');
             activeAvatars.forEach(btn => {
                 if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(`mSwitchPage('me'`)) {
                     mSwitchPage('me', btn);
                 }
             });
         };
         reader.readAsDataURL(file);
         }
         
         // 处理 AI 朋友圈独立头像上传
         function mHandleAIAvatarUpload(event, cid) {
         const file = event.target.files[0];
         if (!file) return;
         const reader = new FileReader();
         reader.onload = function(e) {
             const c = contacts.find(x => x.id === cid);
             if (c) {
                 c.chatAvatar = e.target.result; // 同步更新全局专属头像
                 saveData();
                 renderMomentsUI();
                 
                 // 上传后保持在当前 AI 主页
                 const activeAvatars = document.querySelectorAll('.m-avatar-btn');
                 activeAvatars.forEach(btn => {
                     if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(`mSwitchPage('${cid}'`)) {
                         mSwitchPage(cid, btn);
                     }
                 });
             }
         };
         reader.readAsDataURL(file);
         }
         function mOpenProfileEditModal(cid) {
             m_currentEditProfileId = cid;
             
             if (cid === 'me') {
                 // 如果点的是“我”，隐藏 AI 按钮和历史列表，纯手动编辑
                 document.getElementById('m-profile-modal-title').innerText = "编辑我的主页资料";
                 document.getElementById('m-edit-name').value = momentsData.meName || gConfig.meName || '';
                 document.getElementById('m-edit-sign').value = momentsData.meSign || '记录自己的生活碎片。';
                 
                 document.getElementById('m-btn-ai-profile').style.display = 'none';
                 document.getElementById('m-profile-history-section').style.display = 'none';
             } else {
                 // 如果点的是“AI”，显示完整的历史马甲与生成功能
                 const c = contacts.find(x => x.id === cid);
                 if(!c) return;
                 
                 document.getElementById('m-profile-modal-title').innerText = "身份马甲档案库";
                 document.getElementById('m-edit-name').value = c.momentName || c.name || '';
                 document.getElementById('m-edit-sign').value = c.momentSign || '';
                 
                 document.getElementById('m-btn-ai-profile').style.display = 'block';
                 document.getElementById('m-profile-history-section').style.display = 'block';
                 mRenderProfileHistory(c); 
             }
             
             document.getElementById('m-profile-edit-modal').classList.add('active');
         }
         
         function mCloseProfileEditModal() {
             document.getElementById('m-profile-edit-modal').classList.remove('active');
             m_currentEditProfileId = null;
         }
         
         // 渲染角色的马甲历史
         function mRenderProfileHistory(c) {
             const list = document.getElementById('m-profile-history-list');
             list.innerHTML = '';
             if (!c.profileHistory || c.profileHistory.length === 0) {
                 list.innerHTML = '<div style="text-align:center; font-size:10px; color:#999; padding: 10px 0;">暂无历史马甲，请在下方保存或让 AI 灵感生成。</div>';
                 return;
             }
         
             c.profileHistory.forEach((p, idx) => {
                 const item = document.createElement('div');
                 item.style.cssText = "background: rgba(0,0,0,0.03); padding: 12px 14px; border-radius: 12px; border: 0.5px solid rgba(0,0,0,0.04); display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: 0.2s;";
                 item.onmousedown = () => item.style.transform = 'scale(0.98)';
                 item.onmouseup = () => item.style.transform = 'scale(1)';
                 
                 let safeName = p.name.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
                 let safeSign = p.sign.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
         
                 item.innerHTML = `
                     <div style="display:flex; flex-direction:column; gap:4px; flex:1; overflow: hidden;" onclick="mApplyProfileHistory('${safeName}', '${safeSign}')">
                         <div style="font-weight: 800; font-size: 14px; color: var(--c-black); letter-spacing: 0.5px;">${p.name}</div>
                         <div style="font-size: 11px; color: var(--c-gray-dark); font-style: italic; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 95%;">${p.sign}</div>
                     </div>
                     <div style="color: #FF3B30; padding: 5px; cursor: pointer; flex-shrink: 0;" onclick="mDeleteProfileHistory('${c.id}', ${idx}, event)" title="删除此马甲">
                         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                     </div>
                 `;
                 list.appendChild(item);
             });
         }
         
         function mApplyProfileHistory(name, sign) {
             document.getElementById('m-edit-name').value = name;
             document.getElementById('m-edit-sign').value = sign;
         }
         
         function mDeleteProfileHistory(cid, idx, e) {
             e.stopPropagation();
             const c = contacts.find(x => x.id === cid);
             if(c && c.profileHistory) {
                 c.profileHistory.splice(idx, 1);
                 saveData();
                 mRenderProfileHistory(c);
             }
         }
         
         function mSaveProfileEdit() {
             if(!m_currentEditProfileId) return;
             
             const newName = document.getElementById('m-edit-name').value.trim();
             const newSign = document.getElementById('m-edit-sign').value.trim();
         
             if (m_currentEditProfileId === 'me') {
                 // 如果是保存我的主页信息
                 momentsData.meName = newName;
                 momentsData.meSign = newSign;
                 saveMomentsData();
                 renderMomentsUI();
                 
                 const activeAvatars = document.querySelectorAll('.m-avatar-btn');
                 activeAvatars.forEach(btn => {
                     if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(`mSwitchPage('me'`)) {
                         mSwitchPage('me', btn);
                     }
                 });
             } else {
                 // 如果是保存 AI 的主页信息
                 const c = contacts.find(x => x.id === m_currentEditProfileId);
                 if(c) {
                     c.momentName = newName;
                     c.momentSign = newSign;
                     
                     if (!c.profileHistory) c.profileHistory = [];
                     if (newName || newSign) {
                         const exists = c.profileHistory.find(p => p.name === newName && p.sign === newSign);
                         if (!exists) {
                             c.profileHistory.unshift({ name: newName, sign: newSign });
                         }
                     }
                     
                     saveData(); 
                     renderMomentsUI();
                     
                     const activeAvatars = document.querySelectorAll('.m-avatar-btn');
                     activeAvatars.forEach(btn => {
                         if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(`mSwitchPage('${c.id}'`)) {
                             mSwitchPage(c.id, btn);
                         }
                     });
                 }
             }
             mCloseProfileEditModal();
         }
         
         // 调用大模型提取人设并自动取名写签名
         async function mGenerateProfileByAI() {
             if(!m_currentEditProfileId || m_currentEditProfileId === 'me') return;
             const c = contacts.find(x => x.id === m_currentEditProfileId);
             if(!c) return;
             
             if(!gConfig.apiUrl || !gConfig.apiKey) {
                 return alert('需配置API！请在桌面进入【Settings】填写您的接口和密钥。');
             }
         
             const btn = document.getElementById('m-btn-ai-profile');
             const oldText = btn.innerText;
             btn.innerText = "✧ 正在感知角色灵魂...";
             btn.style.pointerEvents = "none";
             btn.style.opacity = "0.7";
         
             let sysPrompt = `你是一个拥有独立人设的真实人物。
【你的人设背景】：
${c.history[0].content}

【任务】：请根据你的性格，为自己起一个社交媒体网名和一句简短的个性签名。
直接输出JSON，不要加任何其他文字：
{"name": "你的网名", "sign": "你的个性签名"}`;
         
             try {
                 const response = await fetch(`${gConfig.apiUrl}/v1/chat/completions`, { 
                     method: 'POST', 
                     headers: { 'Authorization': `Bearer ${gConfig.apiKey}`, 'Content-Type': 'application/json' }, 
                     body: JSON.stringify({ 
                         model: gConfig.model, 
                         messages: [{ role: 'system', content: sysPrompt }, { role: 'user', content: '请直接输出JSON对象，不要说任何废话。' }], 
                         temperature: 0.9 
                     }) 
                 });
         
                 if (!response.ok) throw new Error("API 请求失败");
                 const data = await response.json(); 
                 let rawContent = data.choices[0].message.content.trim();
                 
                 let finalName = '';
                 let finalSign = '';
                 
                 // 第一层尝试：标准 JSON 解析
                 try {
                     rawContent = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();
                     rawContent = rawContent.replace(/[\n\r\t]/g, ' ');
                     let startIdx = rawContent.indexOf('{'); 
                     let endIdx = rawContent.lastIndexOf('}');
                     if(startIdx !== -1 && endIdx !== -1) {
                         let jsonStr = rawContent.substring(startIdx, endIdx + 1);
                         const aiData = JSON.parse(jsonStr);
                         finalName = aiData.name || aiData['网名'] || aiData['名字'] || aiData['Name'] || '';
                         finalSign = aiData.sign || aiData['个性签名'] || aiData['签名'] || aiData['Sign'] || aiData['bio'] || aiData['简介'] || '';
                     } else {
                         throw new Error("no json braces");
                     }
                 } catch(jsonErr) {
                     // 第二层兜底：暴力正则扒取
                     console.warn("JSON解析失败，启用正则兜底引擎:", jsonErr.message);
                     let nameMatch = rawContent.match(/(?:name|网名|名字|昵称)\s*[：:=]\s*["']?([^"'\n,}{]+)/i);
                     let signMatch = rawContent.match(/(?:sign|签名|个性签名|简介|bio)\s*[：:=]\s*["']?([^"'\n,}{]+)/i);
                     
                     if (!nameMatch && !signMatch) {
                         // 第三层终极兜底：如果连正则都匹配不到，把整段文字按行切分，第一行当名字，第二行当签名
                         let lines = rawContent.replace(/<[^>]+>/g, '').replace(/[{}"']/g, '').split(/[\n,]/).map(s => s.trim()).filter(s => s && s.length > 1 && s.length < 50);
                         if (lines.length >= 2) {
                             finalName = lines[0].replace(/^(name|网名|名字|昵称|sign|签名)\s*[：:=]\s*/i, '');
                             finalSign = lines[1].replace(/^(name|网名|名字|昵称|sign|签名|个性签名|简介)\s*[：:=]\s*/i, '');
                         } else if (lines.length === 1) {
                             finalName = lines[0];
                         }
                     } else {
                         if(nameMatch) finalName = nameMatch[1].trim();
                         if(signMatch) finalSign = signMatch[1].trim();
                     }
                 }
                 
                 // 清理残余引号和空白
                 finalName = finalName.replace(/["']/g, '').trim();
                 finalSign = finalSign.replace(/["']/g, '').trim();
                 
                 if(finalName) document.getElementById('m-edit-name').value = finalName;
                 if(finalSign) document.getElementById('m-edit-sign').value = finalSign;
                 
                 if(!finalName && !finalSign) {
                     alert("AI 生成的内容无法解析。请再试一次，或手动输入。");
                 }
         
             } catch(e) {
                 console.error("AI 提取签名失败:", e);
                 alert("AI 生成失败：" + e.message + "\n请检查网络或再试一次。");
             } finally {
                 btn.innerText = oldText;
                 btn.style.pointerEvents = "auto";
                 btn.style.opacity = "1";
             }
         }

             // ================= 沉浸式引擎：AI 后台围观并评论你的朋友圈 =================
         function mTriggerAIAfterUserPost(post) {
             if(!gConfig.apiUrl || !gConfig.apiKey) return;
             if(!contacts || contacts.length === 0) return;
         
             let linkedIds = momentsData.meLinkedContacts || [];
             let availableAIs = contacts.filter(c => linkedIds.includes(c.id) || linkedIds.length === 0);
             if(availableAIs.length === 0) return;
         
             let commentersCount = Math.floor(Math.random() * 2) + 1;
             let shuffledAIs = availableAIs.sort(() => 0.5 - Math.random()).slice(0, commentersCount);
         
             shuffledAIs.forEach(c => {
                 // 修复：取消 8~30 秒的折磨等待，改为 2~4秒 极速秒回！传递 post.id 防止对象丢失
                 let delay = Math.floor(Math.random() * 2000) + 2000;
                 setTimeout(() => { mGenerateAICommentForUserPost(c, post.id); }, delay);
             });
         }
         
         // 专属大模型调用：让 AI 阅读你的朋友圈并留下评论
         async function mGenerateAICommentForUserPost(c, postId) {
             // 核心防丢：通过 postId 实时去数据源里找这条动态
             let realPost = momentsData.posts.find(p => p.id === postId);
             if (!realPost) return;
         
             let uName = momentsData.meName || gConfig.meName || '我';
             let sysPrompt = `你是一个拥有独立人设的真实人物，正在用手机刷朋友圈。
         【你的人设指令】：
         ${c.history[0].content}
         
         【核心记忆】：
         ${c.memory || '暂无。'}
         
         【🛡️ 结界警告：朋友圈绝对隔离协议 🛡️】
         你现在是拿着手机在刷朋友圈！你们是隔着屏幕的网友！
         【最高强制禁令】：
         1. 绝对禁止输出任何 <thought> 标签和内心戏！
         2. 绝对禁止输出任何星号 * 或括号包裹的动作描写！
         3. 必须直接输出评论内容，绝对不能带“好的”、“收到”等回复前缀！
         你只能输出纯文本的评论内容，不能带有任何动作或心理描写符号！违者系统崩溃！
         
         【事件背景】：
         你的特别关注对象（${uName}）刚刚发布了一条朋友圈动态：
         “${realPost.content}”
         ${realPost.sceneDesc ? `(TA还附带了一张照片，画面内容是：${realPost.sceneDesc})` : ''}
         
         【任务要求】：
         请结合你的人设和你们的关系，直接在TA的朋友圈下面留一句简短的评论。
         1. 不要写多余的动作描写或旁白，只输出你评论的纯文字。
         2. 保持口语化，不要长篇大论。
         3. 【⚠️ 人设绝对服从警告 ⚠️】：你的评论必须【100% 极度契合】你的人设！绝对禁止使用 AI 般热情、客套、平庸的语气！绝不可以说“哇，看起来很不错”、“祝你度过愉快的一天”这种毫无灵魂的废话。必须极具个人性格色彩！`;
         
             try {
                 const response = await fetch(`${gConfig.apiUrl}/v1/chat/completions`, { 
                     method: 'POST', 
                     headers: { 'Authorization': `Bearer ${gConfig.apiKey}`, 'Content-Type': 'application/json' }, 
                     body: JSON.stringify({ 
                         model: gConfig.model, 
                         messages: [{ role: 'system', content: sysPrompt }], 
                         temperature: 0.8 
                     }) 
                 });
         
                 if (!response.ok) return;
                 const data = await response.json(); 
                 // 物理防线：剔除所有标签、星号包裹动作，以及 AI 脑抽的前缀
                 let replyText = data.choices[0].message.content.replace(/<[^>]+>/g, '').replace(/\*[^*]+\*/g, '').trim();
                 replyText = replyText.replace(/^(好的|收到|明白|我的评论是|评论如下)[:：\s]*/i, '');
                 
                 if (!replyText) replyText = "……";
                 
                 // 将评论推入这条真实的动态的评论区
         realPost.comments.push({ id: c.id, name: c.momentName || c.name, text: replyText });
         saveMomentsData();
         
         let timeString = new Date().toLocaleString();
         
         // 1. 写入评论者 (c) 的记忆和上下文
         c.memory = (c.memory ? c.memory + "\n\n" : "") + `[朋友圈事件 - ${timeString}]：user(${uName}) 发了一条动态：“${realPost.content}”。你在下面主动评论了TA：“${replyText}”。`;
         let myPrompt = `[📱 朋友圈特别提醒 - ${timeString}]：你刚刚在用户的朋友圈动态下评论了：“${replyText}”。`;
         // 🚀 核心修复：加上可见的 <i> 标签，让用户在聊天室能看到
         c.history.push({role: 'system_sum', content: `<i>✧ 对方在朋友圈评论了你的动态</i>\n<span style="display:none;">${myPrompt}</span>`});
         
         // 2. 🚀 核心八卦广播系统：广播给其他联动圈里的 AI，让它们吃瓜/吃醋！
         let linkedIds = momentsData.meLinkedContacts || [];
         let availableAIs = contacts.filter(x => linkedIds.includes(x.id) || linkedIds.length === 0);
         
         availableAIs.forEach(otherAI => {
         if (otherAI.id !== c.id) { // 不给自己发
             let gossipPrompt = `[📱 朋友圈八卦提醒 - ${timeString}]：你的列表好友 ${c.momentName || c.name} 刚刚在用户的朋友圈动态（“${realPost.content}”）下方评论了：“${replyText}”。如果你们正在聊天，你可以根据你的人设（比如吃醋、八卦、调侃、冷漠）自然地提及这件事！`;
             otherAI.history.push({role: 'system_sum', content: `<span style="display:none;">${gossipPrompt}</span>`});
         }
         });
         
         saveData();
         
         // 触发重绘
         if (document.getElementById('view-main-moments').style.display !== 'none') {
         mRenderAllFeeds();
         }
             } catch (error) {
                 console.error("AI 自动评论你的朋友圈失败:", error);
             }
         }
             // 用户手动发送黑金礼盒
         function sendUserLuxuryBox() {
             if(!currentContactId) return alert("请先进入聊天室！");
             
             let title = prompt("请输入礼物名称（如：百达翡丽钻表）：", "神秘臻礼");
             if (!title) return;
             let sub = prompt("请输入英文副标题（如：PATEK PHILIPPE）：", "EXCLUSIVE PRESENT");
             
             const c = contacts.find(x => x.id === currentContactId);
             
             let lbHtml = generateLuxuryBoxHtml(title, sub, 'pending', true);
             const newMsg = { role: 'user', content: lbHtml.replace(/\n\s+/g, ''), isRevoked: false, timestamp: Date.now() };
             
             let aiPrompt = `[系统通报：用户向你送出了一个黑金高定礼盒（${title}）。请结合人设给出自然的反应。如果是开心收下请在回复中附带 <accept> 标签，如果拒收请附带 <reject> 标签。]`;
         
             c.history.push(newMsg);
             c.history.push({role: 'system_sum', content: `<span style="display:none;">${aiPrompt}</span>`});
         
             saveData(); 
             appendBubbleRow(newMsg, c.history.length - 2); 
             closeChatMenu();
         }
             // 用户手动发送黑金礼盒
         function sendUserLuxuryBox() {
             if(!currentContactId) return alert("请先进入聊天室！");
             
             let title = prompt("请输入礼物名称（如：百达翡丽钻表）：", "神秘臻礼");
             if (!title) return;
             let sub = prompt("请输入英文副标题（如：PATEK PHILIPPE）：", "EXCLUSIVE PRESENT");
             
             const c = contacts.find(x => x.id === currentContactId);
             
             let lbHtml = generateLuxuryBoxHtml(title, sub, 'pending', true);
             const newMsg = { role: 'user', content: lbHtml.replace(/\n\s+/g, ''), isRevoked: false, timestamp: Date.now() };
             
             let aiPrompt = `[系统通报：用户向你送出了一个黑金高定礼盒（${title}）。请结合人设给出自然的反应。如果是开心收下请在回复中附带 <accept> 标签，如果拒收请附带 <reject> 标签。]`;
         
             c.history.push(newMsg);
             c.history.push({role: 'system_sum', content: `<span style="display:none;">${aiPrompt}</span>`});
         
             saveData(); 
             appendBubbleRow(newMsg, c.history.length - 2); 
             closeChatMenu();
         }
         
         // ================= 高定黑金礼盒卡片生成器与控制引擎 =================
         function generateLuxuryBoxHtml(title, sub, status = 'pending', isUser = false) {
             let shapes = [
                 `M12 0 C12 8 8 12 0 12 C8 12 12 16 12 24 C12 16 16 12 24 12 C16 12 12 8 12 0 Z`,
                 `M12 1 L14.5 9.5 L23 12 L14.5 14.5 L12 23 L9.5 14.5 L1 12 L9.5 9.5 Z`,
                 `M11.5 0 L12.5 0 L12.5 11.5 L24 11.5 L24 12.5 L12.5 12.5 L12.5 24 L11.5 24 L11.5 12.5 L0 12.5 L0 11.5 L11.5 11.5 Z`
             ];
             let gradients = ['url(#lb-foil-gold-1)', 'url(#lb-foil-gold-2)', 'url(#lb-foil-gold-3)'];
         
             let pileHtml = '';
             for(let i = 0; i < 55; i++) {
                 let shape = shapes[Math.floor(Math.random() * shapes.length)];
                 let fill = gradients[Math.floor(Math.random() * gradients.length)];
                 let angle = Math.random() * Math.PI * 2;
                 let radius = Math.random() * 85; 
                 let tx = Math.cos(angle) * radius;
                 let ty = Math.sin(angle) * radius;
                 let scale = 0.6 + Math.random() * 2.5; 
                 let rotation = Math.random() * 360;
                 pileHtml += `<div class="pile-star" style="transform: translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) rotate(${rotation}deg) scale(${scale})"><svg viewBox="0 0 24 24"><path d="${shape}" fill="${fill}"/></svg></div>`;
             }
         
             let burstHtml = '';
             for(let i = 0; i < 35; i++) {
                 let shape = (Math.random() > 0.3) ? shapes[0] : shapes[1];
                 let fill = gradients[Math.floor(Math.random() * gradients.length)];
                 let angle = Math.random() * Math.PI * 2;
                 let radius = 90 + Math.random() * 110; 
                 let tx = `calc(-50% + ${Math.cos(angle) * radius}px)`;
                 let ty = `calc(-50% + ${Math.sin(angle) * radius}px)`;
                 let scale = 0.5 + Math.random() * 1.5; 
                 let rotation = Math.random() * 360 + 'deg';
                 let delay = Math.random() * 0.15 + 's';
                 burstHtml += `<div class="burst-star" style="--tx:${tx}; --ty:${ty}; --s:${scale}; --r:${rotation}; animation-delay:${delay};"><svg viewBox="0 0 24 24"><path d="${shape}" fill="${fill}"/></svg></div>`;
             }
         
             let isAccepted = status === 'accepted';
             let isRejected = status === 'rejected';
             let wrapperClass = `luxury-box-wrap ${isAccepted ? 'lb-accepted' : ''} ${isRejected ? 'lb-rejected' : ''}`;
             let cardClass = `chat-card ${(isAccepted || isRejected) ? 'is-open' : ''}`;
             let btnStyle = (isAccepted || isRejected || isUser) ? 'style="display:none;"' : '';
             
             let extraOverlay = '';
             if (isAccepted) extraOverlay = '<div class="bill-stamp stamp-green" style="z-index:100; font-size:16px;">ACCEPTED</div>';
             if (isRejected) {
                 extraOverlay = `<div class="shattered-glass" style="z-index:100;"><svg class="crack-lines" viewBox="0 0 270 170"><path d="M 80,60 L 120,0 M 80,60 L 270,40 M 80,60 L 220,170 M 80,60 L 100,170 M 80,60 L 0,110 M 80,60 L 30,0 M 150,100 L 270,120 M 150,100 L 200,170 M 40,80 L 0,50" stroke="rgba(255,255,255,0.8)" stroke-width="1.5" fill="none"/></svg><div class="reject-stamp">DENIED</div></div>`;
                 wrapperClass += ' lb-gray-out';
             }
         
             let scaleWrapperStyle = isUser 
                 ? `transform: scale(0.65); transform-origin: top right; margin-left: -105px; margin-bottom: -105px; margin-top: 5px;` 
                 : `transform: scale(0.65); transform-origin: top left; margin-right: -105px; margin-bottom: -105px; margin-top: 5px;`;
         
             return `<div style="${scaleWrapperStyle}">
                 <div class="${wrapperClass}" data-title="${title}" data-sub="${sub}">
                     <div class="${cardClass}" onclick="if(!this.classList.contains('is-open')) this.classList.add('is-open');">
                         <svg style="position:absolute; width:0; height:0;"><defs><linearGradient id="lb-foil-gold-1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ffffff" /><stop offset="40%" stop-color="#d1d5db" /><stop offset="100%" stop-color="#8b929a" /></linearGradient><linearGradient id="lb-foil-gold-2" x1="100%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#d1d5db" /><stop offset="60%" stop-color="#a3a8b0" /><stop offset="100%" stop-color="#5c6168" /></linearGradient><linearGradient id="lb-foil-gold-3" x1="0%" y1="50%" x2="100%" y2="50%"><stop offset="0%" stop-color="#ffffff" /><stop offset="50%" stop-color="#e5e7eb" /><stop offset="100%" stop-color="#a3a8b0" /></linearGradient></defs></svg>
                         <div class="geo-grid"></div><div class="geo-plane-1"></div><div class="geo-plane-2"></div><div class="geo-circle"></div><div class="geo-line-v"></div><div class="geo-line-h"></div><div class="geo-point-1"></div><div class="geo-point-2"></div>
                         <div class="text-title">Haute <strong>Couture</strong></div>
                         <div class="scene-wrapper">
                             <div class="scene">
                                 <div class="face front"><div class="ribbon-v"></div></div><div class="face back"><div class="ribbon-v"></div></div><div class="face left"><div class="ribbon-v"></div></div><div class="face right"><div class="ribbon-v"></div></div><div class="face bottom"></div><div class="bottom-inside"></div>
                                 <div class="lid">
                                     <div class="lid-top"><div class="ribbon-v"></div><div class="ribbon-h"></div><div class="bow-container"><div class="bow-ribbon-tail left"></div><div class="bow-ribbon-tail right"></div><div class="bow-loop left"></div><div class="bow-loop right"></div><div class="bow-center"></div></div></div>
                                     <div class="lid-side lid-front"></div><div class="lid-side lid-back"></div><div class="lid-side lid-left"></div><div class="lid-side lid-right"></div>
                                 </div>
                             </div>
                         </div>
                         <div class="stars-2d-pile">${pileHtml}</div>
                         <div class="greeting-card-layer">
                             <div class="greeting-card">
                                 <div class="card-icon"><svg viewBox="0 0 24 24"><path d="M12 0 C12 8 8 12 0 12 C8 12 12 16 12 24 C12 16 16 12 24 12 C16 12 12 8 12 0 Z"/></svg></div>
                                 <div class="card-content">${title}</div>
                                 <div class="card-sub">${sub}</div>
                             </div>
                         </div>
                         <div class="action-btn-layer btn-decline" ${btnStyle}><div class="action-btn" onclick="event.stopPropagation(); handleLuxuryBoxAction(this, 'reject')"><span>拒绝</span></div></div>
                         <div class="action-btn-layer btn-accept" ${btnStyle}><div class="action-btn" onclick="event.stopPropagation(); handleLuxuryBoxAction(this, 'accept')"><span>收下</span></div></div>
                         <div class="stars-burst-layer">${burstHtml}</div>
                         ${extraOverlay}
                     </div>
                 </div><img src="1" onerror="this.parentNode.classList.add('bubble-clear'); this.remove();">
             </div>`;
         }
         
         function handleLuxuryBoxAction(btnEl, actionType) {
             const row = btnEl.closest('.msg-row');
             if(!row) return;
             if(row.classList.contains('user')) return alert('这是你发出的礼物，等对方处理吧！');
             
             btnEl.style.pointerEvents = 'none';
             const index = parseInt(row.id.replace('msg-item-', ''));
             const c = contacts.find(x => x.id === currentContactId);
             let msg = c.history[index];
             if(!msg) return;
         
             const lbWrap = row.querySelector('.luxury-box-wrap');
             const card = lbWrap.querySelector('.chat-card');
             
             lbWrap.querySelectorAll('.action-btn-layer').forEach(el => el.style.display = 'none');
             
             let uiText = "";
             let aiPrompt = "";
             let title = lbWrap.dataset.title || '神秘礼物';
         
             if (actionType === 'accept') {
                 lbWrap.classList.add('lb-accepted');
                 card.classList.add('is-open');
                 lbWrap.insertAdjacentHTML('beforeend', '<div class="bill-stamp stamp-green" style="z-index:100; font-size:16px;">ACCEPTED</div>');
                 uiText = "✧ 你收下了高定礼盒";
                 aiPrompt = `[系统动作：用户收下了你送的高定礼盒（${title}）。请结合人设给出自然的反应。]`;
                 
                 let timeStr = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
                 c.memory = (c.memory ? c.memory + "\n\n" : "") + `[系统日志]：现实时间 ${timeStr}，用户收下了你赠送的高定礼盒（${title}）。`;
             } else {
                 lbWrap.classList.add('lb-rejected');
                 card.style.filter = 'grayscale(80%) brightness(0.7)';
                 let shattered = `<div class="shattered-glass" style="z-index:100;"><svg class="crack-lines" viewBox="0 0 270 170"><path d="M 80,60 L 120,0 M 80,60 L 270,40 M 80,60 L 220,170 M 80,60 L 100,170 M 80,60 L 0,110 M 80,60 L 30,0 M 150,100 L 270,120 M 150,100 L 200,170 M 40,80 L 0,50" stroke="rgba(255,255,255,0.8)" stroke-width="1.5" fill="none"/></svg><div class="reject-stamp">DENIED</div></div>`;
                 lbWrap.insertAdjacentHTML('beforeend', shattered);
                 uiText = "✧ 你无情拒收了高定礼盒";
                 aiPrompt = `[系统动作：用户无情退回了你送的高定礼盒（${title}）。请结合人设给出自然的反应。]`;
             }
         
             msg.content = row.querySelector('.bubble').innerHTML;
         
             c.history.push({ role: 'user', content: msg.content, isRevoked: false, timestamp: Date.now() });
             c.history.push({role: 'system_sum', content: `<i>${uiText}</i>\n<span style="display:none;">${aiPrompt}</span>`});
             
             saveData(); 
             appendBubbleRow(c.history[c.history.length - 2], c.history.length - 2);
             appendBubbleRow(c.history[c.history.length - 1], c.history.length - 1);
         }
         
         // =====================================================================
         // 转发高定卡片生成引擎 (帖子 & 评论)
         // =====================================================================
         
         // 生成转发帖子的卡片 HTML
         function generateFwdPostHtml(postData) {
         let titleText = postData.content.replace(/<[^>]+>/g, '').substring(0, 20) + (postData.content.length > 20 ? '...' : '');
         let authorName = postData.authorName || 'Anonymous';
         let authorHandle = postData.authorHandle || '@user';
         // 如果没有图片，就留空
         let imgUrl = postData.imgUrl && postData.imgUrl.includes('http') ? postData.imgUrl : '';
         let fullText = postData.content.replace(/<[^>]+>/g, '');
         let rId = Date.now() + Math.floor(Math.random() * 1000);
         
         // 如果有真实图片，盖在星星上面；如果没有，就只显示星星和渐变
         let imgTag = imgUrl ? `<img src="${imgUrl}" style="position:relative; z-index:2; border-radius:4px;">` : '';
         
         return `<div class="fwd-card-wrapper fwd-card-post" onclick="this.classList.toggle('is-expanded')" data-id="${rId}">
             <svg class="fwd-bg-star" viewBox="0 0 100 100"><polygon points="50,5 61,38 96,38 68,59 78,92 50,72 22,92 32,59 4,38 39,38"/></svg>
             <div class="fwd-deco-line-h line-1"></div>
             <div class="fwd-deco-line-v line-2"></div>
             <div class="fwd-deco-dot dot-1"></div>
             <div class="fwd-expand-indicator"></div>
             <div class="fwd-top-plane">
                 <div class="fwd-cover-plane" style="display:flex; justify-content:center; align-items:center; color:#b5a898; font-size:24px; background: linear-gradient(135deg, #fdfdfd 0%, #e8e8e8 100%);">
                     ✦
                     ${imgTag}
                 </div>
                 <div class="fwd-text-area">
                     <div class="fwd-tag"><svg viewBox="0 0 100 100" style="width:7px; height:7px; fill:#b5a898;"><polygon points="50,5 61,38 96,38 68,59 78,92 50,72 22,92 32,59 4,38 39,38"/></svg> Reposted Article</div>
                     <div class="fwd-title">${titleText}</div>
                     <div class="fwd-author">— Written by ${authorName}</div>
                 </div>
             </div>
             <div class="fwd-detail-plane">
                 <div class="fwd-abstract">“${fullText}”</div>
                 <div class="fwd-meta-footer">
                     <span>${authorHandle} — Collection</span>
                     <div class="fwd-tiny-stars"><svg viewBox="0 0 100 100"><polygon points="50,5 61,38 96,38 68,59 78,92 50,72 22,92 32,59 4,38 39,38"/></svg></div>
                 </div>
             </div>
         </div><img src="1" onerror="this.parentNode.classList.add('bubble-clear'); this.parentNode.style.background='transparent'; this.parentNode.style.border='none'; this.parentNode.style.boxShadow='none'; this.parentNode.style.padding='0'; this.remove();">`;
         }
         
         // 生成转发评论的卡片 HTML
         function generateFwdCommentHtml(commentData) {
         let text = commentData.text || "No content.";
         let author = commentData.authorName || "Observer";
         
         return `<div class="fwd-card-wrapper fwd-card-comment">
             <svg class="fwd-bg-star" viewBox="0 0 100 100"><polygon points="50,5 61,38 96,38 68,59 78,92 50,72 22,92 32,59 4,38 39,38"/></svg>
             <div class="fwd-deco-line-h line-1"></div>
             <div class="fwd-deco-line-h line-2"></div>
             <div class="fwd-deco-dot dot-1"></div>
             <div style="position: relative; z-index: 2;">
                 <div class="fwd-quote-mark">“</div>
                 <div class="fwd-comment-text">${text}</div>
                 <div class="fwd-comment-meta">
                     <div class="fwd-author-name">Reply from @${author}</div>
                     <div class="fwd-tiny-stars">
                         <svg viewBox="0 0 100 100"><polygon points="50,5 61,38 96,38 68,59 78,92 50,72 22,92 32,59 4,38 39,38"/></svg>
                         <svg viewBox="0 0 100 100"><polygon points="50,5 61,38 96,38 68,59 78,92 50,72 22,92 32,59 4,38 39,38"/></svg>
                         <svg viewBox="0 0 100 100"><polygon points="50,5 61,38 96,38 68,59 78,92 50,72 22,92 32,59 4,38 39,38"/></svg>
                     </div>
                 </div>
             </div>
         </div><img src="1" onerror="this.parentNode.classList.add('bubble-clear'); this.parentNode.style.background='transparent'; this.parentNode.style.border='none'; this.parentNode.style.boxShadow='none'; this.parentNode.style.padding='0'; this.remove();">`;
         }
