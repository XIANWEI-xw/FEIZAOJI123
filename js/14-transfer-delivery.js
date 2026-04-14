         // ================= 转账核心逻辑 =================
         function openTransferModal() {
             closeChatMenu(); 
             switchTfMode('normal'); 
             document.getElementById('transfer-modal').classList.add('active'); 
         }
         
         function closeTransferModal() {
             document.getElementById('transfer-modal').classList.remove('active');
         }
         
         function switchTfMode(mode) {
             document.getElementById('tf-mode').value = mode;
             document.getElementById('tab-tf-normal').classList.remove('active');
             document.getElementById('tab-tf-black').classList.remove('active');
             document.getElementById('tab-tf-' + mode).classList.add('active');
             if (mode === 'black') {
                 document.getElementById('wrap-tf-sign').style.display = 'block';
                 document.getElementById('label-tf-amount').innerText = '黑卡额度 (例如: 9,999,999)';
                 document.getElementById('tf-amount').value = '9,999,999';
                 document.getElementById('tf-memo').value = '拿去随便刷，密码你生日。';
             } else {
                 document.getElementById('wrap-tf-sign').style.display = 'none';
                 document.getElementById('label-tf-amount').innerText = '转账金额 (例如: 520.00)';
                 document.getElementById('tf-amount').value = '520.00';
                 document.getElementById('tf-memo').value = '拿去喝奶茶。';
             }
         }
         
         function toggleBlackCard(el) { el.classList.toggle('is-flipped'); }
         
         function sendTransfer() {
             const mode = document.getElementById('tf-mode').value;
             const amount = document.getElementById('tf-amount').value.trim();
             const memo = document.getElementById('tf-memo').value.trim();
             const sign = document.getElementById('tf-sign').value.trim();
         
             if(!currentContactId) return alert("请先进入聊天室！");
             const c = contacts.find(x => x.id === currentContactId);
             
             let uAvatar = gConfig.meAvatar || ''; 
             if(c.maskId) { const m = masks.find(x=>x.id===c.maskId); if(m) uAvatar = m.avatar; }
             let avatarHtml = renderAvatarHTML(uAvatar, 'user');
             const dateStr = new Date().getFullYear() + ' / ' + (new Date().getMonth() + 1).toString().padStart(2, '0') + ' / ' + new Date().getDate().toString().padStart(2, '0');
             
             let cardHtml = '';
             let aiText = '';
         
             if (mode === 'black') {
                 cardHtml = `<div style="transform:scale(0.7); transform-origin:top right; margin-left:-81px; margin-bottom:-51px; margin-top:5px; margin-right:5px;"><div class="black-card-scene" onclick="toggleBlackCard(this)"><div class="black-card-wrapper"><div class="bc-face bc-face--front"><div class="bc-watermark"><div class="bc-star bc-ws-1 bc-gold-text">★</div><div class="bc-star bc-ws-2 bc-gold-text">★</div><div class="bc-star bc-ws-3 bc-gold-text">✩</div><div class="bc-star bc-ws-4 bc-gold-text">★</div><div class="bc-star bc-ws-5 bc-gold-text">✩</div></div><div class="bc-front-stars"><div class="bc-star bc-fs-1 bc-gold-text">✦</div><div class="bc-star bc-fs-2 bc-gold-text">✧</div><div class="bc-star bc-fs-3 bc-gold-text">✦</div><div class="bc-star bc-fs-4 bc-gold-text">✧</div><div class="bc-star bc-fs-5 bc-gold-text">✦</div><div class="bc-star bc-fs-6 bc-gold-text">✦</div><div class="bc-star bc-fs-7 bc-gold-text">✧</div></div><div class="bc-pendant-group"><div class="bc-pendant bc-p-1"><div class="bc-p-line"></div><div class="bc-p-star">✦</div></div><div class="bc-pendant bc-p-2"><div class="bc-p-line"></div><div class="bc-p-star">✦</div></div><div class="bc-pendant bc-p-3"><div class="bc-p-line"></div><div class="bc-p-star">✧</div></div></div><div class="bc-frame"><div class="bc-ornament bc-orn-tl">✥</div><div class="bc-ornament bc-orn-tr">✥</div><div class="bc-ornament bc-orn-bl">✥</div><div class="bc-ornament bc-orn-br">✥</div></div><div class="bc-title bc-gold-text">TRANSFER TO YOU</div><div class="bc-avatar"><span class="bc-as bc-as-1">✦</span><span class="bc-as bc-as-2">✧</span><span class="bc-as bc-as-3">✦</span>${avatarHtml}</div><div class="bc-num bc-num-l bc-gold-text">5201</div><div class="bc-num bc-num-r bc-gold-text">8888</div><div class="bc-bank-f bc-gold-text">Shop Bank</div><div class="bc-date bc-gold-text">${dateStr}</div></div><div class="bc-face bc-face--back"><div class="bc-watermark"><div class="bc-star bc-ws-1 bc-gold-text">★</div><div class="bc-star bc-ws-2 bc-gold-text">✩</div><div class="bc-star bc-ws-4 bc-gold-text">★</div></div><div class="bc-back-stars"><div class="bc-star bc-bs-1 bc-gold-text">✦</div><div class="bc-star bc-bs-2 bc-gold-text">✧</div><div class="bc-star bc-bs-3 bc-gold-text">✦</div><div class="bc-star bc-bs-4 bc-gold-text">✧</div></div><div class="bc-bank-b bc-gold-text">SOAP BANK</div><div class="bc-stripe"></div><div class="bc-amt bc-gold-text">$ ${amount}</div><div class="bc-sig-bg"></div><div class="bc-sig bc-gold-text">${sign}</div><div class="bc-memo bc-gold-text" onclick="event.stopPropagation()" ontouchstart="event.stopPropagation()" ontouchmove="event.stopPropagation()">- "${memo}"</div><div class="bc-bstar bc-gold-text">✦</div></div></div></div></div><img src="1" onerror="this.parentNode.classList.add('bubble-clear'); this.remove();">`;
                 aiText = `[系统通报：用户向你甩了一张白金星尘黑卡，转账 $ ${amount}，签名 ${sign}，附带留言：${memo}。请结合人设给出反应！如果是开心收下请附带 <accept> 标签，如果是生气/驳回请附带 <reject> 标签。]`;
             } else {
                 let formattedAmount = isNaN(parseFloat(amount)) ? amount : parseFloat(amount).toFixed(2);
                 // 加入了点击(收款)和长按(退回)的手势绑定
                 cardHtml = `<div class="normal-transfer" onclick="handleNormalCardTap(event, this)">
             <div class="nt-watermark-text">PLATINUM</div><div class="nt-black-tag"></div><div class="nt-chip"></div>
             <div class="nt-star nt-star-lg-1">✩</div><div class="nt-star nt-star-lg-2">★</div><div class="nt-star nt-star-lg-3">✩</div><div class="nt-star nt-star-lg-4">★</div><div class="nt-star nt-star-lg-5">★</div>
             <div class="nt-star nt-star-1">✩</div><div class="nt-star nt-star-2">★</div><div class="nt-star nt-star-4">★</div><div class="nt-star nt-star-5">★</div><div class="nt-star nt-star-6">✩</div><div class="nt-star nt-star-7">★</div><div class="nt-star nt-star-8">✩</div><div class="nt-star nt-star-9">✩</div><div class="nt-star nt-star-10">★</div><div class="nt-star nt-star-12">★</div><div class="nt-star nt-star-13">★</div>
             <div class="nt-inner-frame"><div class="fs-star" style="top: 0; left: 15%; font-size: 6px;">★</div><div class="fs-star" style="top: 0; left: 85%; font-size: 5px;">✩</div><div class="fs-star" style="top: 100%; left: 35%; font-size: 7px;">★</div><div class="fs-star" style="top: 100%; left: 75%; font-size: 5px;">✩</div><div class="fs-star" style="top: 25%; left: 0; font-size: 5px;">★</div><div class="fs-star" style="top: 80%; left: 0; font-size: 6px;">✩</div><div class="fs-star" style="top: 85%; left: 100%; font-size: 5px;">★</div></div>
             <div class="nt-top"><div class="nt-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div><div class="nt-divider"></div><div class="nt-info"><div class="nt-amt">¥ ${formattedAmount}</div><div class="nt-memo" onclick="event.stopPropagation()" ontouchstart="event.stopPropagation()" ontouchmove="event.stopPropagation()">${memo}</div></div></div>
             <div class="nt-bottom"><span>SOAP TRANSFER</span></div>
             <div class="luxury-strap-wrap"><div class="luxury-strap"></div><div class="luxury-bow"><div class="bow-tail left"></div><div class="bow-tail right"></div><div class="bow-loop left"></div><div class="bow-loop right"></div><div class="bow-knot"><svg class="metal-star-buckle" viewBox="0 0 100 100" fill="none"><defs><linearGradient id="starMetal" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="25%" stop-color="#A8A196"/><stop offset="50%" stop-color="#FCFBFA"/><stop offset="75%" stop-color="#8C857D"/><stop offset="100%" stop-color="#EAE5DC"/></linearGradient><filter id="starShadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="rgba(0,0,0,0.8)"/></filter></defs><path d="M50 5 L63 34 L95 34 L69 53 L79 84 L50 65 L21 84 L31 53 L5 34 L37 34 Z" fill="url(#starMetal)" filter="url(#starShadow)" stroke="rgba(255,255,255,0.7)" stroke-width="1.5" stroke-linejoin="round"/><circle cx="50" cy="40" r="7" fill="#111111"/><circle cx="50" cy="60" r="7" fill="#111111"/><circle cx="50" cy="40" r="7" fill="none" stroke="rgba(0,0,0,0.7)" stroke-width="2"/><circle cx="50" cy="60" r="7" fill="none" stroke="rgba(0,0,0,0.7)" stroke-width="2"/><circle cx="50" cy="40" r="6" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="1"/><circle cx="50" cy="60" r="6" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="1"/><path d="M47 40 L47 60 M50 40 L50 60 M53 40 L53 60" stroke="rgba(210, 210, 210, 0.85)" stroke-width="2" stroke-linecap="round" filter="drop-shadow(0 2px 2px rgba(0,0,0,0.8))"/></svg></div></div></div>
         </div><img src="1" onerror="this.parentNode.classList.add('bubble-clear'); this.remove();">`;
                 
                 aiText = `[系统通报：用户向你发送了一笔日常转账，金额为 ¥ ${formattedAmount}，备注留言：${memo}。请结合人设给出对应反应。如果是开心收下请附带 <accept> 标签，如果是生气/驳回请附带 <reject> 标签。]`;
             }
         
             const newMsg = { role: 'user', content: cardHtml, isRevoked: false, timestamp: Date.now() };
             c.history.push(newMsg);
             c.history.push({role: 'system_sum', content: `<span style="display:none;">${aiText}</span>`});
         
             saveData(); 
             // 🚀 核心修复：发送卡片后，先判断是否在房间，再决定是否渲染 DOM
             if (isUserInChatRoom()) {
                 appendBubbleRow(newMsg, c.history.length - 2); 
             }
             closeTransferModal();
             
             // 🚀 核心修复：发送卡片后强制触发 AI 回复，并确保它能读取到刚发的卡片
             setTimeout(() => fetchAIReply(currentContactId), 500);
         }
         
         // 处理 AI 给你发卡后，你点击按钮的特效
             // ================= 统一处理黑卡被收下/拒收的视觉与逻辑 =================
         function handleCardAction(btnEl, actionType) {
             const row = btnEl.closest('.msg-row');
             if(!row) return;
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
                         <svg style="position:absolute; width:0; height:0;"><defs><linearGradient id="lb-foil-gold-1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fff5ba" /><stop offset="40%" stop-color="#e1b333" /><stop offset="100%" stop-color="#996515" /></linearGradient><linearGradient id="lb-foil-gold-2" x1="100%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#e1b333" /><stop offset="60%" stop-color="#b8860b" /><stop offset="100%" stop-color="#6b4c1a" /></linearGradient><linearGradient id="lb-foil-gold-3" x1="0%" y1="50%" x2="100%" y2="50%"><stop offset="0%" stop-color="#ffffff" /><stop offset="50%" stop-color="#fff5ba" /><stop offset="100%" stop-color="#d4af37" /></linearGradient></defs></svg>
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
                 aiPrompt = `[系统记录]：用户(User) 刚才收下了你送出的高定礼盒（${title}）。请结合人设给出自然的反应（如：宠溺、得意或期待TA打开后的样子）。`;
                 
                 let timeStr = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
                 c.memory = (c.memory ? c.memory + "\n\n" : "") + `[朋友圈/互动事件]：用户收下了你送出的高定礼盒（${title}）。`;
             } else {
                 lbWrap.classList.add('lb-rejected');
                 card.style.filter = 'grayscale(80%) brightness(0.7)';
                 let shattered = `<div class="shattered-glass" style="z-index:100;"><svg class="crack-lines" viewBox="0 0 270 170"><path d="M 80,60 L 120,0 M 80,60 L 270,40 M 80,60 L 220,170 M 80,60 L 100,170 M 80,60 L 0,110 M 80,60 L 30,0 M 150,100 L 270,120 M 150,100 L 200,170 M 40,80 L 0,50" stroke="rgba(255,255,255,0.8)" stroke-width="1.5" fill="none"/></svg><div class="reject-stamp">DENIED</div></div>`;
                 lbWrap.insertAdjacentHTML('beforeend', shattered);
                 uiText = "✧ 你退回了黑金高定礼盒";
                 aiPrompt = `[系统记录]：用户(User) 刚才无情退回了你送出的高定礼盒（${title}）。请结合人设给出自然的反应（如：失落、生气、或强行要求TA收下）。`;
             }
         
             msg.content = row.querySelector('.bubble').innerHTML;
         
             c.history.push({ role: 'user', content: msg.content, isRevoked: false, timestamp: Date.now() });
             c.history.push({role: 'system_sum', content: `<i>${uiText}</i>\n<span style="display:none;">${aiPrompt}</span>`});
             
             saveData(); 
             appendBubbleRow(c.history[c.history.length - 2], c.history.length - 2);
             appendBubbleRow(c.history[c.history.length - 1], c.history.length - 1);
         }
         
         // ================= 一起听卡片生成器与控制引擎 =================
         function generateSyncCardHtml(isAccepted = false, isUser = true, songData = null) {
             let modeClass = isAccepted ? "dark" : "light";
             let btnClass = isAccepted ? "sc-dark-btn" : "sc-light-btn";
             
             // 核心修改：如果是已连通，或者是你主动发出的邀请（不论有没有歌），全部变成一键穿越键！
             let isJumpMode = isAccepted || isUser;
             
             let btnIcon = isJumpMode
                 ? `<svg viewBox="0 0 24 24" style="width:12px;"><path d="M4 11h12.172l-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2z"/></svg><span>ENTER SESSION</span>`
                 : `<svg viewBox="0 0 24 24" style="width:10px;"><path d="M8 5v14l11-7z"/></svg><span>JOIN SYNC</span>`;
                 
             let statusText = isAccepted ? "SYNC ACTIVE" : "SYNC ROOM";
             let title1 = isAccepted ? "Resonating<br>Now..." : "Listen<br>Together";
             let title2 = isAccepted ? "CONNECTED" : "RESONANCE";
             
             let coverHtml = "";
             let vinylTextHtml = "";
             
             // 核心修改：如果是你发出的卡片，点击直接穿越回音乐软件
             let actionHandler = isJumpMode ? `onclick="openApp('music')"` : `onclick="handleSyncCardAction(this, 'accept')"`; 
             
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
                 aiText = `[系统通报：用户向你发送了【专属音乐共听邀请】！指定的曲目是《${songData.title}》。如果你愿意戴上耳机和TA一起听，请附带 <accept> 标签；如果不愿意，请附带 <reject> 标签。]`;
             } else {
                 aiText = `[系统通报：用户向你发送了【盲盒音乐共听邀请】！不知道是什么歌，等待你戴上耳机。如果你愿意一起听，请附带 <accept> 标签；如果不愿意，请附带 <reject> 标签。]`;
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
                 
                 // 🎵 核心新增：如果卡片带了歌曲数据（AI选的），直接强行点播这首歌！
                 if (songData && typeof executePlay === 'function') {
                     let foundSong = m_db.daily.find(t => t.title === songData.title);
                     if (!foundSong) {
                         for (let cat in m_db.tracks) {
                             foundSong = m_db.tracks[cat].find(t => t.title === songData.title);
                             if (foundSong) break;
                         }
                     }
                     if (foundSong) executePlay(foundSong);
                 }
                 
                 // 切换头像
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
             
             // 绝对防御：自己不能收退自己发出去的钱！
             if(row.classList.contains('user')) {
                 alert('这是你发出的卡片，只能由对方决定是否收取哦！');
                 return;
             }
         
             // 绝对防御：点击的瞬间，让按钮立刻失效，防止玩家疯狂连点！
             btnEl.parentNode.style.pointerEvents = 'none'; 
             btnEl.parentNode.style.opacity = '0';
             const index = parseInt(row.id.replace('msg-item-', ''));
             const c = contacts.find(x => x.id === currentContactId);
             let msg = c.history[index];
             if(!msg) return;
             
             let html = msg.content;
         
                     // 1. 直接在页面真实的 DOM 上操作，彻底杜绝全量重绘带来的动画卡顿
             const realActionBar = row.querySelector('.bc-action-bar');
             if (!realActionBar) return;
             realActionBar.remove(); // 连根拔除操作栏
         
             // 2. 覆盖特效（直接向页面注入 HTML，让 CSS 动画瞬间丝滑触发）
             const realFront = row.querySelector('.bc-face--front');
             const realBack = row.querySelector('.bc-face--back');
             if (actionType === 'accept') {
                 if(realFront && !realFront.querySelector('.wax-seal')) { 
                     // 正反两面独立变灰，保住 3D 渲染引擎
                     if(realFront) realFront.style.filter = 'grayscale(80%) brightness(0.7)';
                     if(realBack) realBack.style.filter = 'grayscale(80%) brightness(0.7)';
                     realFront.insertAdjacentHTML('beforeend', '<div class="wax-seal"></div>');
                 }
             } else {
                 if(realFront && !realFront.querySelector('.shattered-glass')) { 
                     // 正反两面独立变灰，印章只插入正面
                     if(realFront) realFront.style.filter = 'grayscale(80%) brightness(0.7)';
                     if(realBack) realBack.style.filter = 'grayscale(80%) brightness(0.7)';
                     let shattered = `<div class="shattered-glass"><svg class="crack-lines" viewBox="0 0 270 170"><path d="M 80,60 L 120,0 M 80,60 L 270,40 M 80,60 L 220,170 M 80,60 L 100,170 M 80,60 L 0,110 M 80,60 L 30,0 M 150,100 L 270,120 M 150,100 L 200,170 M 40,80 L 0,50" stroke="rgba(255,255,255,0.8)" stroke-width="1.5" fill="none"/></svg><div class="reject-stamp">DENIED</div></div>`;
                     realFront.insertAdjacentHTML('beforeend', shattered);
                 }
             }
             
             // 将带有特效的真实 DOM 结构反向保存回数据中，以后刷新也会保留
             msg.content = row.querySelector('.bubble').innerHTML;
         
             // 3. 通知 AI 并发消息 (去除了带有强烈主观感情色彩的描述，改为客观事实汇报，让AI纯凭你设置的性格自由发挥)
             let aiPrompt = actionType === 'accept' 
                 ? `[系统动作：用户收下了你给的黑卡。请根据人设给出自然的反应。]`
                 : `[系统动作：用户拒收了你的黑卡，并将卡片退回。请根据人设给出自然的反应。]`;
             
             let uiText = actionType === 'accept' ? '✧ 你收下了专属黑卡' : '✧ 你拒收了黑卡';
         
             // 【新增】：我方也发一个盖好章的回执卡片
             c.history.push({ role: 'user', content: msg.content, isRevoked: false, timestamp: Date.now() });
             c.history.push({role: 'system_sum', content: `<i>${uiText}</i>\n<span style="display:none;">${aiPrompt}</span>`});
             
             saveData(); 
             
             // 依次渲染新发的卡片和系统提示
             appendBubbleRow(c.history[c.history.length - 2], c.history.length - 2);
             appendBubbleRow(c.history[c.history.length - 1], c.history.length - 1);
             // fetchAIReply(); // 已彻底切断自动回复！
         }
         
         // ================= 全新：普通转账的【单击收款 / 双击退回】双引擎 =================
         function handleNormalCardTap(e, el) {
             e.preventDefault(); e.stopPropagation();
             
             const row = el.closest('.msg-row');
             if(!row) return;
             
             // 防御1：多选模式下直接接管为选中操作
             if (document.getElementById('chat-area').classList.contains('multi-select-mode')) {
                 const cb = row.querySelector('.msg-check-box');
                 if(cb) { cb.classList.toggle('checked'); updateMultiSelectCount(); }
                 return;
             }
         
             // 防御2：自己不能处理自己发出的转账
             if(row.classList.contains('user')) return alert('这是你发出的转账，只能由对方处理！');
             
             // 防御3：已处理过的卡片锁死
             if (el.style.filter.includes('grayscale') || el.querySelector('.wax-seal') || el.querySelector('.reject-stamp')) return;
         
             // 【核心：双击判定计时器 (250毫秒窗口)】
             let now = Date.now();
             let lastTap = parseInt(el.dataset.lastTap) || 0;
             let tapTimer = el.dataset.tapTimer;
         
             if (now - lastTap < 250) {
                 // 在 250ms 内点下了第二下，判定为【双击：拒收】
                 clearTimeout(tapTimer);
                 el.dataset.lastTap = 0;
                 executeNormalCardAction(row, el, 'reject');
             } else {
                 // 点了第一下，开启 250ms 等待期，如果没等来第二下，则判定为【单击：收款】
                 el.dataset.lastTap = now;
                 el.dataset.tapTimer = setTimeout(() => {
                     el.dataset.lastTap = 0;
                     executeNormalCardAction(row, el, 'accept');
                 }, 250);
             }
         }
         
         // 执行特效、修改数据并通知 AI
         function executeNormalCardAction(row, el, actionType) {
             const index = parseInt(row.id.replace('msg-item-', ''));
             const c = contacts.find(x => x.id === currentContactId);
             let msg = c.history[index];
             if(!msg) return;
         
             el.style.filter = 'grayscale(80%) brightness(0.8)';
             
             if (actionType === 'accept') {
                 el.insertAdjacentHTML('beforeend', '<div class="wax-seal" style="right: 8px; top: 8px;"></div>');
             } else {
                 el.insertAdjacentHTML('beforeend', '<div class="reject-stamp" style="font-size: 18px; padding: 4px 8px; z-index: 20;">DENIED</div>');
             }
         
             el.removeAttribute('onclick'); // 卸载点击事件锁死
         
             msg.content = row.querySelector('.bubble').innerHTML;
         
             let aiPrompt = actionType === 'accept' 
                 ? `[系统动作：用户【单击】确认收下了转账。请根据人设给出自然的反应。]`
                 : `[系统动作：用户【双击】无情退回了这笔转账。请根据人设给出自然的反应。]`;
             
             let uiText = actionType === 'accept' ? '✧ 转账已被收款' : '✧ 转账已被退回';
             
             // 我方发回执
             c.history.push({ role: 'user', content: msg.content, isRevoked: false, timestamp: Date.now() });
             c.history.push({role: 'system_sum', content: `<i>${uiText}</i>\n<span style="display:none;">${aiPrompt}</span>`});
             
             saveData(); 
             appendBubbleRow(c.history[c.history.length - 2], c.history.length - 2);
             appendBubbleRow(c.history[c.history.length - 1], c.history.length - 1);
             // fetchAIReply(); // 已彻底切断自动回复！
         }
             // ================= 高定红包：用户发送交互逻辑 =================
         function openRpModal() {
             closeChatMenu(); 
             switchRpMode('normal'); 
             document.getElementById('rp-modal').classList.add('active'); 
         }
         
         function closeRpModal() {
             document.getElementById('rp-modal').classList.remove('active');
         }
         
         function switchRpMode(mode) {
             document.getElementById('rp-mode').value = mode;
             document.getElementById('tab-rp-normal').classList.remove('active');
             document.getElementById('tab-rp-lucky').classList.remove('active');
             document.getElementById('tab-rp-' + mode).classList.add('active');
             if (mode === 'lucky') {
                 document.getElementById('label-rp-amount').innerText = '拼手气最高上限金额 (例如: 888.88)';
                 document.getElementById('rp-text').value = 'Try Your Luck';
             } else {
                 document.getElementById('label-rp-amount').innerText = '红包金额 (例如: 520.00)';
                 document.getElementById('rp-text').value = 'Exclusive Reward';
             }
         }
         
         function sendRedPacket() {
             if(!currentContactId) return alert("请先进入聊天室！");
             const mode = document.getElementById('rp-mode').value;
             const amount = document.getElementById('rp-amount').value.trim();
             const text = document.getElementById('rp-text').value.trim();
         
             const c = contacts.find(x => x.id === currentContactId);
             
             let isLucky = mode === 'lucky';
             let theme = isLucky ? 'theme-lucky' : 'theme-red';
             let topBadge = isLucky ? `<div class="lucky-badge">LUCKY</div>` : '';
             let cardTitle = isLucky ? 'Lucky Draw' : 'Asset Unlocked';
             let cardTag = isLucky ? '👑 BEST LUCK' : 'AUTHORIZED';
             let coinText = isLucky ? 'DRAW' : 'OPEN';
             let displayAmount = isLucky ? '??.??' : amount;
             
             // 既然是用户发给 AI 的，那么里面抽出卡片的头像必须是 AI 的！
             let botAvatarHtmlForCard = renderAvatarHTML(c.chatAvatar || c.avatar, 'bot');
         
             // 发送时的形态
             let rpCardHtml = `
             <div class="rp-container ${theme}" data-type="${mode}" data-amount="${amount}" id="temp-user-rp-${Date.now()}">
                 ${topBadge}
                 <div class="rp-back"></div>
                 <div class="rp-card">
                     <div class="card-avatar">${botAvatarHtmlForCard}</div>
                     <div class="card-title">${cardTitle}</div>
                     <div class="card-amount"><span>$</span><span class="rp-num-display">${displayAmount}</span></div>
                     <div class="card-tag">${cardTag}</div>
                 </div>
                 <div class="rp-front">
                     <div class="rp-star s1">★</div><div class="rp-star s2">☆</div><div class="rp-star s3">★</div><div class="rp-star s4">☆</div><div class="rp-star s5">★</div>
                     <div class="rp-texts">
                         <div class="rp-title-main">SOAP.OS</div>
                         <div class="rp-sub">${text}</div>
                     </div>
                 </div>
                 <div class="rp-flap">
                     <div class="rp-flap-arcs"></div>
                     <div class="rp-star f-s1">★</div><div class="rp-star f-s2">☆</div>
                     <div class="rp-coin">${coinText}</div>
                 </div>
             </div><img src="1" onerror="this.parentNode.classList.add('bubble-clear'); this.remove();">`;
         
             // 生成到界面上
             const newMsg = { role: 'user', content: rpCardHtml.replace(/\n\s+/g, ''), isRevoked: false, timestamp: Date.now() };
             c.history.push(newMsg);
             appendBubbleRow(newMsg, c.history.length - 1);
             
             // 核心修改：不再自动计算金额和秒抢红包！交由系统暗中提示 AI
             let aiPrompt = `[系统动作：用户给你发了一个${isLucky ? '拼手气' : '普通'}红包，封面写着“${text}”。如果你想立刻拆开它，请在回复中输出 <accept> 指令；如果想高冷地晾着，则不要输出指令。]`;
             
             c.history.push({role: 'system_sum', content: `<span style="display:none;">${aiPrompt}</span>`});
             saveData();
             closeRpModal();
         }
         
         // ================= 高定红包互动逻辑与物理引擎 =================
         function handleRedPacketOpen(container) {
             if (container.classList.contains('is-open')) return;
             
             const row = container.closest('.msg-row');
             if (row && document.getElementById('chat-area').classList.contains('multi-select-mode')) {
                 const cb = row.querySelector('.msg-check-box');
                 if(cb) { cb.classList.toggle('checked'); updateMultiSelectCount(); }
                 return;
             }
         
             // 防御：如果是用户自己发的红包（拦截自抢并弹出优雅提示）
             if (row && row.classList.contains('user')) {
                 alert('这是你发给对方的心意，耐心等TA拆开吧~');
                 return;
             }
         
             container.classList.add('is-open');
             const type = container.dataset.type;
             const rawAmount = parseFloat(container.dataset.amount);
             let finalAmount = rawAmount;
         
             if (type === 'lucky') {
                 finalAmount = Math.max(0.01, Math.random() * rawAmount).toFixed(2);
                 container.querySelector('.rp-num-display').innerText = finalAmount;
             }
         
             setTimeout(() => { 
                 shootCoins(container, type === 'lucky'); 
             }, 300);
         
             if (!row || !currentContactId) return;
             const index = parseInt(row.id.replace('msg-item-', ''));
             const c = contacts.find(x => x.id === currentContactId);
             let msg = c.history[index];
             if(!msg) return;
         
             container.removeAttribute('onclick');
             msg.content = row.querySelector('.bubble').innerHTML;
         
             let uiText = type === 'lucky' ? `✧ 你抢到了盲盒红包，金额为 $${finalAmount}` : `✧ 你领取了红包，金额为 $${finalAmount}`;
             let aiPrompt = `[系统动作：用户兴奋地拆开了你发的红包！里面金额是 $${finalAmount}。请结合人设给出回应（如果是拼手气红包，你可以根据金额大小嘲笑或恭喜用户）。]`;
             
             // 核心修复：删除了之前错误地 push 一条 user 消息的代码，只推系统隐形消息
             c.history.push({role: 'system_sum', content: `<i>${uiText}</i>\n<span style="display:none;">${aiPrompt}</span>`});
             
             saveData(); 
             appendBubbleRow(c.history[c.history.length - 1], c.history.length - 1);
             
             // setTimeout(() => fetchAIReply(), 1000); // 已彻底切断自动回复！
         }
         
         // 爆金币物理引擎
         function shootCoins(container, isLucky) {
             const particleCount = 35;
             const burstWrap = document.createElement('div');
             burstWrap.style.position = 'absolute';
             burstWrap.style.top = '25%'; burstWrap.style.left = '50%';
             burstWrap.style.width = '0'; burstWrap.style.height = '0';
             burstWrap.style.zIndex = '9999';
             container.appendChild(burstWrap);
         
             for (let i = 0; i < particleCount; i++) {
                 const particle = document.createElement('div');
                 if (isLucky) {
                     particle.className = 'burst-particle';
                     particle.style.background = 'radial-gradient(circle, #FAD6C9 0%, #D89F8B 80%)';
                     particle.style.boxShadow = '0 4px 8px rgba(0,0,0,0.6), inset 0 2px 2px rgba(255,255,255,0.8)';
                 } else {
                     particle.className = 'burst-particle';
                 }
                 burstWrap.appendChild(particle);
         
                 let angle = Math.random() * Math.PI * 2;
                 if (Math.random() > 0.2) angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.2;
                 let velocity = 6 + Math.random() * 12;
                 let vx = Math.cos(angle) * velocity;
                 let vy = Math.sin(angle) * velocity - 4;
                 let gravity = 0.5;
                 let x = -7; let y = -7;
                 let rot = Math.random() * 360;
                 let rotSpeed = (Math.random() - 0.5) * 30;
                 let scale = 0.5 + Math.random() * 0.7;
                 let frame = 0;
         
                 function animate() {
                     vy += gravity; x += vx; y += vy; rot += rotSpeed; frame++;
                     let opacity = frame > 35 ? 1 - (frame - 35) / 25 : 1;
                     particle.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg) scale(${scale})`;
                     particle.style.opacity = opacity;
                     if (frame < 60) requestAnimationFrame(animate);
                     else particle.remove();
                 }
                 requestAnimationFrame(animate);
             }
             setTimeout(() => burstWrap.remove(), 2000);
         }
             // ================= 全新：外卖系统核心 JS =================
         let dl_totalAmt = 0; let dl_totalCount = 0; let dl_orderItems = [];
         let dl_payer = 'me'; let dl_receiver = 'me'; let dl_currentStore = '';
         
         // 从缓存读取定制私藏，没有的话给个初始值
         let savedCollectionStr = localStorage.getItem('soap_delivery_custom_v1');
         let dl_customCollection = savedCollectionStr ? JSON.parse(savedCollectionStr) : [
             { id: 1, store: '米其林三星私厨', name: '澳洲 M9 和牛', price: 1999 },
             { id: 2, store: '解忧杂货铺', name: '一罐好心情', price: 0 }
         ];
         
         function openDelivery() {
             closeChatMenu(); // 关掉聊天底栏菜单
             document.getElementById('delivery-modal').classList.add('open');
             dl_totalAmt = 0; dl_totalCount = 0; dl_orderItems = []; dl_currentStore = '';
             document.getElementById('order-memo').value = '';
             document.getElementById('checkout-bar').classList.remove('show', 'expanded');
             document.getElementById('btn-next').style.display = 'block';
             switchCat('cafe', 'SOAP. CAFE'); 
             updateCartUI(); renderSavedList();
         }
         
         function closeDelivery() {
             document.getElementById('delivery-modal').classList.remove('open');
             setTimeout(() => {
                 document.getElementById('checkout-bar').classList.remove('expanded');
                 document.getElementById('btn-next').style.display = 'block';
             }, 400);
         }
         
         function triggerAIGenerate() {
             alert("【开发中】\n发送指令让AI根据时间/心情随机为你搭配一单外卖，并自动填入购物车！");
         }
         
         function updateStoreName() {
             const val = document.getElementById('custom-store').value.trim() || 'SOAP. CAFE';
             document.getElementById('header-store-name').innerText = val;
         }
         
         function switchCat(type, defaultStoreName) {
             document.querySelectorAll('.cat-tab, .cat-tab-plus').forEach(t => t.classList.remove('active'));
             document.getElementById('tab-' + type).classList.add('active');
             
             document.querySelectorAll('.menu-list, .custom-view').forEach(v => v.style.display = 'none');
             document.getElementById('view-' + type).style.display = 'block';
         
             if(type !== 'custom') {
                 document.getElementById('header-store-name').innerText = defaultStoreName;
                 document.getElementById('custom-store').value = defaultStoreName; 
             } else {
                 updateStoreName();
             }
         }
         
         function addToCart(price, name, storeName) {
             // 🚨 终极解锁：不再限制只能点一家的东西，想点几家就点几家！
             // 如果点的东西不在当前的标题店铺下，就将标题切换为【尊享跨店专送】模式
             if (dl_currentStore && dl_currentStore !== storeName && dl_currentStore !== 'SOAP. MAISON (MIXED)') {
                 dl_currentStore = 'SOAP. MAISON (MIXED)';
                 document.getElementById('header-store-name').innerText = '尊享跨店专送';
             } else if (!dl_currentStore) {
                 // 如果购物车是空的，记录第一家店的名字
                 dl_currentStore = storeName;
                 document.getElementById('header-store-name').innerText = storeName;
             }
             
             dl_totalAmt += parseFloat(price);
             dl_totalCount += 1;
             // 把物品和它所属的独立店名一起存进去，方便后续生成更详细的高定账单
             dl_orderItems.push({ name: name, price: parseFloat(price), store: storeName });
             updateCartUI();
         }
         
         function saveCustomItem() {
             const store = document.getElementById('custom-store').value.trim();
             const name = document.getElementById('custom-name').value.trim();
             const price = document.getElementById('custom-price').value;
             if(!store || !name || price === '') return alert("店名、菜名、价格必填！");
             
             dl_customCollection.unshift({ id: Date.now(), store: store, name: name, price: parseFloat(price) });
             localStorage.setItem('soap_delivery_custom_v1', JSON.stringify(dl_customCollection));
             document.getElementById('custom-name').value = ''; document.getElementById('custom-price').value = '';
             renderSavedList();
         }
         
         function deleteCustomItem(id) {
             dl_customCollection = dl_customCollection.filter(item => item.id !== id);
             localStorage.setItem('soap_delivery_custom_v1', JSON.stringify(dl_customCollection));
             renderSavedList();
         }
         
         function renderSavedList() {
             const listDiv = document.getElementById('saved-list'); listDiv.innerHTML = '';
             if (dl_customCollection.length === 0) { listDiv.innerHTML = '<div style="font-size:11px; color:#A8A39D; text-align:center; padding:10px;">暂无私藏，快去上方定制吧</div>'; return; }
             dl_customCollection.forEach(item => {
                 const row = document.createElement('div'); row.className = 'saved-item';
                 row.innerHTML = `<div class="saved-info"><div class="saved-store">${item.store}</div><div class="saved-name">${item.name}</div><div class="saved-price">¥ ${item.price}</div></div><div class="saved-actions"><div class="s-action-btn" onclick="deleteCustomItem(${item.id})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></div><div class="s-action-btn add" onclick="addToCart(${item.price}, '${item.name}', '${item.store}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div></div>`;
                 listDiv.appendChild(row);
             });
         }
         
         function updateCartUI() {
             const bar = document.getElementById('checkout-bar');
             if (dl_totalCount > 0) bar.classList.add('show'); else bar.classList.remove('show');
             document.getElementById('cart-total').innerText = `¥ ${dl_totalAmt.toFixed(2)}`;
             document.getElementById('cart-count').innerText = `已选 ${dl_totalCount} 件商品`;
         }
         
         function expandCheckout() {
             document.getElementById('checkout-bar').classList.add('expanded');
             document.getElementById('btn-next').style.display = 'none';
         }
         
         function setOption(category, value) {
             if (category === 'pay') { dl_payer = value; document.getElementById('pay-me').classList.remove('active'); document.getElementById('pay-them').classList.remove('active'); document.getElementById('pay-' + value).classList.add('active'); }
             else { dl_receiver = value; document.getElementById('rec-me').classList.remove('active'); document.getElementById('rec-them').classList.remove('active'); document.getElementById('rec-' + value).classList.add('active'); }
         }
         
         function generateFinalBill() {
             if(!currentContactId) return alert("请先进入聊天室！");
             const c = contacts.find(x => x.id === currentContactId);
             
             const storeName = dl_currentStore || document.getElementById('header-store-name').innerText;
             const memo = document.getElementById('order-memo').value.trim();
             const dateStr = new Date().getFullYear() + '/' + (new Date().getMonth() + 1).toString().padStart(2, '0') + '/' + new Date().getDate().toString().padStart(2, '0') + ' ' + new Date().getHours().toString().padStart(2,'0') + ':' + new Date().getMinutes().toString().padStart(2,'0');
         
             // 🚨 核心修复：提取购物车里的具体菜名和总价，一并告诉AI！
             let itemNames = dl_orderItems.map(i => i.name).join('、');
             let totalStr = `¥${dl_totalAmt.toFixed(2)}`;
         
             let promptText = ""; 
             let memoText = memo ? `\n用户留言/备注：${memo}` : '';
             let isUnpaid = (dl_payer === 'them'); 
         
             // 生成高定物流标签内容 & 纯净客观旁白 Prompt (绝不带刻板引导，全凭AI人设发挥)
             let routeHtml = '';
             if(dl_payer === 'me' && dl_receiver === 'them') {
                 promptText = `[系统动作通报：用户为你点了一份外卖（已全额付款 ${totalStr}）。\n包含商品：${itemNames}。${memoText}\n请根据你的人设自然回应这份心意。]`;
                 routeHtml = `<div class="route-line"><span class="route-label">SENDER.</span> 我 (已付款)</div><div class="route-line"><span class="route-label">DELIVER TO.</span> 你</div>`;
             } else if (dl_payer === 'them' && dl_receiver === 'me') {
                 promptText = `[系统动作通报：用户给自己挑了一份外卖（总价 ${totalStr}），包含商品：${itemNames}。但TA并未付款，而是将账单发给你请求“代付”。${memoText}\n请结合人设给出反应！如果你愿意替TA买单请输出 <accept>，如果拒绝请输出 <reject>。]`;
                 routeHtml = `<div class="route-line"><span class="route-label">SENDER.</span> 你 (请求代付)</div><div class="route-line"><span class="route-label">DELIVER TO.</span> 我</div>`;
             } else if (dl_payer === 'me' && dl_receiver === 'me') {
                 promptText = `[系统动作通报：用户给自己点了一份外卖（已付款 ${totalStr}），包含商品：${itemNames}。TA把这张账单发到了聊天里。${memoText}\n请结合人设自然聊聊这个话题。]`;
                 routeHtml = `<div class="route-line"><span class="route-label">SENDER.</span> 我 (已付款)</div><div class="route-line"><span class="route-label">DELIVER TO.</span> 我</div>`;
             } else {
                 promptText = `[系统动作通报：用户替你挑了一份外卖（总价 ${totalStr}），包含商品：${itemNames}。但TA把未付款的账单发给了你，让你自己付钱。${memoText}\n请结合人设给出反应！如果你愿意掏钱买下请输出 <accept>，如果拒收请输出 <reject>。]`;
                 routeHtml = `<div class="route-line"><span class="route-label">SENDER.</span> 你 (请求代付)</div><div class="route-line"><span class="route-label">DELIVER TO.</span> 你</div>`;
             }
         
             // 如果触发了跨店模式，顶部品牌名字变成管家配送
             const isMixed = storeName === 'SOAP. MAISON (MIXED)';
             const displayBrandName = isMixed ? 'SOAP. CONCIERGE' : storeName;
             const displayOrderType = isMixed ? 'MIXED CART' : 'DELIVERY';
         
             let itemsHtml = '';
             dl_orderItems.forEach(item => {
                 // 核心修改：如果是跨店模式，或者带有店铺信息，把店名用小字标注在商品名下方
                 let storeSub = (isMixed && item.store) ? `<div class="bill-item-store" style="font-size: 7px; color: #A8A39D; font-style: normal; margin-left: 8px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; margin-top: 2px;">[ ${item.store} ]</div>` : '';
                 
                 itemsHtml += `<div class="bill-row" style="margin-bottom: 8px;"><div class="bill-item-info" style="display: flex; flex-direction: column; max-width: 68%;"><span class="bill-item-name">${item.name}</span>${storeSub}</div><span class="bill-dots"></span><span class="bill-item-price">¥${item.price.toFixed(2)}</span></div>`;
             });
             
             if(memo) itemsHtml += `<div class="bill-row" style="color: #8E8E93; margin-top: 10px;"><span class="bill-item-name" style="font-style:normal; white-space:normal;">备注：${memo}</span></div>`;
         
             let btnHtml = isUnpaid 
                 ? `<button class="bill-btn btn-pay" onclick="handleBillAction(this)" style="width:100%; height:36px; display:flex; justify-content:center; align-items:center; gap:6px; background:#1C1C1E; color:#FFF; border-radius:8px; border:none; font-size:11px; font-weight:700; cursor:pointer;"><svg style="width:14px; height:14px; stroke-width:2;" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> 指纹支付代付</button>` 
                 : `<button class="bill-btn btn-disabled" style="width:100%; height:36px; display:flex; justify-content:center; align-items:center; gap:6px; background:#F2F2F7; color:#A8A39D; border-radius:8px; border:none; font-size:11px; font-weight:700; pointer-events:none;"><svg style="width:14px; height:14px; stroke-width:2;" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6L9 17l-5-5"/></svg> 订单已由发件人支付</button>`;
         
             let billHtml = `
             <div class="soap-bill-wrapper">
                 <div class="soap-bill-content">
                     ${isUnpaid ? '<div class="bill-stamp stamp-red">UNPAID</div>' : '<div class="bill-stamp stamp-green">PAID</div>'}
                     <div class="bill-header"><div class="bill-brand">${displayBrandName}</div><div class="bill-sub">ORDER #${Math.floor(Math.random()*9000)+1000} • ${displayOrderType}</div><div class="bill-sub">${dateStr}</div></div>
                     <div class="route-box">${routeHtml}</div>
                     <div class="bill-divider"></div>
                     ${itemsHtml}
                     <div class="bill-divider"></div>
                     <div class="bill-row bill-total-row"><span class="bill-item-name">TOTAL</span><span class="bill-dots"></span><span class="bill-item-price">¥${dl_totalAmt.toFixed(2)}</span></div>
                     <div class="bill-barcode"></div>
                     ${btnHtml}
                 </div>
             </div><img src="1" onerror="this.parentNode.classList.add('bubble-clear'); this.parentNode.style.background='transparent'; this.parentNode.style.border='none'; this.parentNode.style.boxShadow='none'; this.parentNode.style.padding='0'; this.remove();">`;
         
             const newMsg = { role: 'user', content: billHtml.replace(/\n\s+/g, ''), isRevoked: false, timestamp: Date.now() };
             c.history.push(newMsg);
             c.history.push({role: 'system_sum', content: `<span style="display:none;">${promptText}</span>`});
             saveData(); appendBubbleRow(newMsg, c.history.length - 2); 
             closeDelivery(); 
             // fetchAIReply(); // 已彻底切断自动回复！
         }
         
         // 小票支付互动引擎
         function handleBillAction(btnEl) {
             const row = btnEl.closest('.msg-row');
             if(!row) return;
             
             if(row.classList.contains('user')) return alert('这是你发出的账单，等对方处理吧！');
         
             btnEl.className = 'bill-btn btn-disabled';
             btnEl.style.cssText = 'width:100%; height:36px; display:flex; justify-content:center; align-items:center; gap:6px; background:#F2F2F7; color:#A8A39D; border-radius:8px; border:none; font-size:11px; font-weight:700; pointer-events:none;';
             btnEl.innerHTML = `<svg style="width:14px; height:14px; stroke-width:2;" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6L9 17l-5-5"/></svg> 支付成功`;
             
             const contentBox = row.querySelector('.soap-bill-content');
             const oldStamp = contentBox.querySelector('.bill-stamp');
             if(oldStamp) oldStamp.remove();
             contentBox.insertAdjacentHTML('afterbegin', `<div class="bill-stamp stamp-green">PAID</div>`);
             
             const routeLine = contentBox.querySelector('.route-box .route-line:first-child');
             if(routeLine && routeLine.innerHTML.includes('请求代付')) {
                 routeLine.innerHTML = `<span class="route-label">SENDER.</span> 你 (已由我代付)`;
             }
             
             const index = parseInt(row.id.replace('msg-item-', ''));
             const c = contacts.find(x => x.id === currentContactId);
             c.history[index].content = row.querySelector('.bubble').innerHTML;
         
             c.history.push({role: 'system_sum', content: `<i>✧ 你通过指纹支付代付了该账单</i>\n<span style="display:none;">[系统旁白：用户乖乖帮你支付了外卖账单。]</span>`});
             saveData(); 
             appendBubbleRow(c.history[c.history.length - 1], c.history.length - 1);
             // fetchAIReply(); // 已彻底切断自动回复！
         }
         // ================= 全新：手动同意高定商店的代付请求 =================
         function handleMaisonAction(btnEl) {
             const row = btnEl.closest('.msg-row');
             if(!row) return;
             
             if(row.classList.contains('user')) return alert('这是你发出的代付请求，只能等对方付钱！');
         
             const card = row.querySelector('.maison-proxy-card');
             if(!card) return;
         
             // 改变 UI 为 PAID
             btnEl.style.background = 'transparent';
             btnEl.style.color = '#34C759';
             btnEl.style.border = '1px dashed rgba(52,199,89,0.4)';
             btnEl.innerHTML = 'PAID IN FULL';
             btnEl.style.pointerEvents = 'none';
             
             const badge = card.querySelector('.mp-badge-status');
             if(badge) {
                 badge.innerText = 'PAID';
                 badge.style.color = '#34C759';
                 badge.style.borderColor = '#34C759';
             }
             const titleText = card.querySelector('.mp-title-text');
             if(titleText) titleText.innerText = 'ORDER RECEIPT // 订单明细';
         
             const index = parseInt(row.id.replace('msg-item-', ''));
             const c = contacts.find(x => x.id === currentContactId);
             c.history[index].content = row.querySelector('.bubble').innerHTML;
         
             c.history.push({role: 'system_sum', content: `<i>✧ 你通过指纹验证，替对方买下了这些奢华资产！物流已启动。</i>`});
             
             // 提取数据生成真实订单并启动物流
             try {
                 let itemsData = JSON.parse(card.dataset.items.replace(/&#39;/g, "'").replace(/&quot;/g, '"'));
                 let total = parseFloat(card.dataset.total);
                 
                 storeCurrentOrderId = 'SP-' + Math.floor(Math.random() * 90000 + 10000) + 'X';
                 storeOrderHistory.unshift({ id: storeCurrentOrderId, date: new Date().toLocaleString(), total: total, items: itemsData });
                 if(storeOrderHistory.length > 20) storeOrderHistory.pop(); 
                 localStorage.setItem('soap_boutique_history', JSON.stringify(storeOrderHistory));
                 
                 storePendingDeliveryInfo = { contactId: currentContactId, items: itemsData.map(i=>i.name).join('、') };
                 storeStartLogisticsEngine();
                 document.getElementById('store-logistics-dot').classList.add('active'); // 亮起商店小红点
             } catch(e) { console.error("手动代付数据提取失败", e); }
         
             saveData(); 
             appendBubbleRow(c.history[c.history.length - 1], c.history.length - 1);
         }
         // ================= 全新：处理 AI 发送的礼物卡片点击 =================
         function handleGiftAction(btnEl, actionType) {
             const row = btnEl.closest('.msg-row');
             if(!row) return;
             
             if(row.classList.contains('user')) return alert('这是你发出的礼物，等对方处理吧！');
         
             const card = row.querySelector('.maison-gift-card');
             if(!card) return;
         
             const actionBar = card.querySelector('.mg-action-bar');
             const badge = card.querySelector('.mg-badge-status');
         
             const index = parseInt(row.id.replace('msg-item-', ''));
             const c = contacts.find(x => x.id === currentContactId);
             
             let aiPrompt = "";
             let uiText = "";
         
             if (actionType === 'accept') {
                 actionBar.innerHTML = '<button style="width:100%; background:transparent; color:#34C759; border:1px dashed rgba(52,199,89,0.4); padding:10px 0; border-radius:6px; font-family:\'Courier New\',monospace; font-size:10px; font-weight:800; pointer-events:none;">ACCEPTED & DELIVERED</button>';
                 if(badge) { badge.innerText = 'ACCEPTED'; badge.style.color = '#34C759'; badge.style.borderColor = '#34C759'; }
                 
                 // 提取数据进入物流并直接瞬间送达
                 try {
                     let itemStore = card.dataset.store;
                     let itemsData = JSON.parse(card.dataset.items.replace(/&#39;/g, "'").replace(/&quot;/g, '"'));
                     let total = parseFloat(card.dataset.total);
                     
                     itemsData = itemsData.map(it => ({ name: it.name, price: it.price, store: itemStore }));
         
                     storeCurrentOrderId = 'GF-' + Math.floor(Math.random() * 90000 + 10000) + 'X';
                     storeOrderHistory.unshift({ id: storeCurrentOrderId, date: new Date().toLocaleString(), total: total, items: itemsData });
                     if(storeOrderHistory.length > 20) storeOrderHistory.pop(); 
                     localStorage.setItem('soap_boutique_history', JSON.stringify(storeOrderHistory));
                     
                     let itemNames = itemsData.map(i => i.name).join('、');
                     
                     // 核心修改：不再等待漫长的物流倒计时，直接瞬间送达，并强制暴力写入核心记忆！
                     let timeStr = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
                     let memoryStr = `[系统最高指令：收到专属礼物]：现实时间 ${timeStr}，你赠送给用户的礼物（包含：${itemNames}）用户已欣然收下，并且物品已瞬间送达用户身边！如果是衣服首饰美妆等，用户现在可能已经穿戴在身上了；如果是摆件，已经摆在房间里了。\n【必须执行】：请在接下来的对话中，找机会极其自然地表现出你看到用户收到/使用这些礼物时的反应！`;
                     c.memory = (c.memory ? c.memory + "\n\n" : "") + memoryStr;
         
                 } catch(e) { console.error("礼物物流提取失败", e); }
         
                 uiText = "✧ 你开心地收下了这份礼物，物品已瞬间送到你身边！";
                 aiPrompt = `[系统旁白：用户欣然接受了你送的礼物，并且礼物已经瞬间送达TA手边了！请立刻结合人设给出回应（比如打量TA穿戴上/使用时的样子，或表示宠溺和开心）。]`;
         
             } else {
                 card.style.filter = 'grayscale(80%)';
                 actionBar.innerHTML = '<button style="width:100%; background:transparent; color:#888; border:1px dashed #555; padding:10px 0; border-radius:6px; font-family:\'Courier New\',monospace; font-size:10px; font-weight:800; pointer-events:none;">DENIED</button>';
                 if(badge) { badge.innerText = 'DENIED'; badge.style.color = '#888'; badge.style.borderColor = '#888'; }
                 
                 uiText = "✧ 你无情地拒收了这份礼物。";
                 aiPrompt = `[系统旁白：用户残忍拒绝了你送的礼物，订单已被取消。请结合人设给出回应（如失落、生气、强装镇定或霸道）。]`;
             }
         
             c.history[index].content = row.querySelector('.bubble').innerHTML;
             c.history.push({role: 'system_sum', content: `<i>${uiText}</i>\n<span style="display:none;">${aiPrompt}</span>`});
             
             saveData(); 
             appendBubbleRow(c.history[c.history.length - 1], c.history.length - 1);
         }
         // ================= 全新：催促出餐与电话系统 =================
         
         // 拦截外卖单上的【催促出餐】按钮点击
         function triggerDeliveryCall(btnEl) {
             const row = btnEl.closest('.msg-row');
             if(!row) return;
         
             // 按钮置灰防连点
             btnEl.innerHTML = `正在联系骑手...`;
             btnEl.style.pointerEvents = 'none';
         
             // 生成满屏的童话星星
             const box = document.getElementById('star-box');
             box.innerHTML = '';
             const stars = ['★', '✩', '✦', '✧'];
             for (let i = 0; i < 40; i++) {
                 let star = document.createElement('div');
                 star.className = 'falling-star';
                 star.innerText = stars[Math.floor(Math.random() * stars.length)];
                 star.style.left = Math.random() * 100 + '%';
                 star.style.animationDuration = (Math.random() * 6 + 4) + 's';
                 star.style.animationDelay = (Math.random() * 5) + 's';
                 star.style.fontSize = (Math.random() * 12 + 8) + 'px';
                 star.style.opacity = Math.random() * 0.7 + 0.1;
                 box.appendChild(star);
             }
         
             // 提取店铺名字，判断来电人的称呼
             const contentBox = row.querySelector('.soap-bill-content');
             const storeName = contentBox.querySelector('.bill-brand').innerText;
             let callerName = '外卖专送骑手';
             
             if (storeName.includes('PHARMACY')) callerName = '夜之城执行官';
             else if (storeName.includes('BISTRO')) callerName = '酒馆跑腿小哥';
             else if (storeName.includes('CAFE') || storeName.includes('BAKERY')) callerName = '庄园私人管家';
             else {
                 // 自定义店铺：随机分配奇葩骑手
                 const randomRiders = ['迷路的外卖员', '超时狂飙骑手', '神秘快递员', '同城代送小哥', '实习跑腿大叔'];
                 callerName = randomRiders[Math.floor(Math.random() * randomRiders.length)];
             }
         
             document.getElementById('call-screen-name').innerText = callerName;
             // 记录当前触发店名，方便后续挂断反馈时判定
             document.getElementById('call-screen').dataset.store = storeName;
         
             // 延迟 1.5 秒后，强行弹出全屏电话
             setTimeout(() => {
                 document.getElementById('call-screen').classList.add('active');
                 // 按钮恢复原状，以便下次还能点
                 btnEl.innerHTML = `<svg style="width:14px; height:14px; stroke-width:2;" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> 催促出餐`;
                 btnEl.style.pointerEvents = 'auto';
             }, 1500);
         }
         
         // 电话被挂断或接听后的反馈处理
         function handleCallAction(action) {
             document.getElementById('call-screen').classList.remove('active');
             
             if(!currentContactId) return;
             const c = contacts.find(x => x.id === currentContactId);
             const storeName = document.getElementById('call-screen').dataset.store || '';
             
             let feedbackHtml = '';
             let promptText = '';
         
             if (action === 'accept') {
                 // 接听电话
                 feedbackHtml = `<div class="system-log-wrapper" style="display:flex; align-items:center; justify-content:center; gap:10px; width:100%; opacity:0.8; margin:15px 0;"><div class="log-line" style="height:1px; flex:1; background:repeating-linear-gradient(to right, #A8A39D, #A8A39D 2px, transparent 2px, transparent 4px);"></div><div class="log-text" style="font-family:'Courier New', monospace; font-size:9px; font-weight:800; color:#8E8E93; letter-spacing:2px;">CALL ACCEPTED • DELIVERED</div><div class="log-line" style="height:1px; flex:1; background:repeating-linear-gradient(to right, #A8A39D, #A8A39D 2px, transparent 2px, transparent 4px);"></div></div><img src="1" onerror="this.parentNode.classList.add('bubble-clear'); this.parentNode.style.cssText='background:transparent!important; border:none!important; box-shadow:none!important; padding:0!important;'; this.remove();">`;
                 promptText = `[系统旁白：外卖已由骑手送达。用户接听了电话并顺利拿到了餐品。]`;
             } else if (action === 'reject') {
                 // 拒绝接听：根据店铺类型触发高定卡片
                 if (storeName.includes('PHARMACY')) {
                     // 药房 -> 红色警报
                     feedbackHtml = `<div class="override-protocol-card"><div class="op-text-wrap"><div class="op-title">PROTOCOL 0x99 INITIATED</div><div class="op-sub">警告：用户拒接电话。外卖已执行强制滞留程序。</div></div><div class="op-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div></div><img src="1" onerror="this.parentNode.classList.add('bubble-clear'); this.parentNode.style.cssText='background:transparent!important; border:none!important; box-shadow:none!important; padding:0!important;'; this.remove();">`;
                     promptText = `[系统旁白：情绪药房系统通报：用户强行挂断了执行官的电话，包裹现已被强制滞留在门外。]`;
                 } else if (storeName.includes('CAFE') || storeName.includes('BAKERY')) {
                     // 咖啡/烘焙 -> 随机三选一
                     let r = Math.random();
                     if(r < 0.33) {
                         feedbackHtml = `<div class="vm-airy-card"><div class="vm-airy-player"><div class="vm-airy-play"><svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg></div><div class="vm-airy-wave"><div class="vw-bar-light" style="height:6px;"></div><div class="vw-bar-light" style="height:10px;"></div><div class="vw-bar-light" style="height:16px;"></div><div class="vw-bar-light" style="height:8px;"></div><div class="vw-bar-light" style="height:12px;"></div><div class="vw-bar-light" style="height:4px;"></div><div class="vw-bar-light" style="height:14px;"></div><div class="vw-bar-light" style="height:10px;"></div><div class="vw-bar-light" style="height:6px;"></div></div><div class="vm-airy-time">00:06</div></div><div class="vm-airy-text">"嘟... 您好，您的餐品已放至前台，以免打扰您。祝用餐愉快。"</div></div><img src="1" onerror="this.parentNode.classList.add('bubble-clear'); this.parentNode.style.cssText='background:transparent!important; border:none!important; box-shadow:none!important; padding:0!important;'; this.remove();">`;
                     } else if(r < 0.66) {
                         feedbackHtml = `<div class="concierge-card"><div class="concierge-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></div><div class="concierge-title">SILENT DELIVERY</div><div class="concierge-text">为尊重您的隐私，包裹已静默送达。</div></div><img src="1" onerror="this.parentNode.classList.add('bubble-clear'); this.parentNode.style.cssText='background:transparent!important; border:none!important; box-shadow:none!important; padding:0!important;'; this.remove();">`;
                     } else {
                         feedbackHtml = `<div class="barista-note-wrapper"><div class="tape"></div><div class="barista-note"><div class="note-text">没接电话，估计在忙。<br>餐放桌子上了，记得趁早吃哦~ <br>— 送餐员留</div></div></div><img src="1" onerror="this.parentNode.classList.add('bubble-clear'); this.parentNode.style.cssText='background:transparent!important; border:none!important; box-shadow:none!important; padding:0!important;'; this.remove();">`;
                     }
                     promptText = `[系统旁白：用户未接听电话，外卖小哥并未生气，而是极其绅士地留下餐品，静默送达。]`;
                 } else {
                     // 自定义或酒馆 -> 暴躁短信
                     let h = Math.floor(Math.random()*12)+12 + ':' + Math.floor(Math.random()*50)+10;
                     feedbackHtml = `<div class="urgent-courier-card"><div class="uc-header"><div class="uc-sender">FROM: DISPATCHER</div><div class="uc-timestamp">${h} PM</div></div><div class="uc-body">挂我电话？外卖已存放至 <span class="uc-highlight">门外消防栓</span> 顶部。<br>自行提取，勿再拒接。</div></div><img src="1" onerror="this.parentNode.classList.add('bubble-clear'); this.parentNode.style.cssText='background:transparent!important; border:none!important; box-shadow:none!important; padding:0!important;'; this.remove();">`;
                     promptText = `[系统旁白：用户无情挂断了骑手的电话。骑手发来暴躁留言，表示已把外卖扔到了门外消防栓上。]`;
                 }
             }
         
             const newMsg = { role: 'user', content: feedbackHtml.replace(/\n\s+/g, ''), isRevoked: false, timestamp: Date.now() };
             c.history.push(newMsg);
             c.history.push({role: 'system_sum', content: `<span style="display:none;">${promptText}</span>`});
             saveData(); 
             appendBubbleRow(newMsg, c.history.length - 2);
         }
