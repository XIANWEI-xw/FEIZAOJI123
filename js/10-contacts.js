          function openSelectChat() { const list = document.getElementById('select-chat-list'); list.innerHTML = ''; if(contacts.length === 0) { list.innerHTML = `<div style="text-align:center; padding:20px; color:var(--c-gray-dark); font-size:12px; font-weight:600;">暂无人格，请先到 Contacts 创建。</div>`; } contacts.forEach(c => { const item = document.createElement('div'); item.className = 'contact-item'; item.onclick = () => { closeSelectChat(); openChat(c.id); }; 
              item.innerHTML = `<div class="c-avatar-wrap" style="width:44px;height:44px;margin-right:15px;">${renderAvatarHTML(c.chatAvatar || c.avatar, 'bot')}</div><div class="c-info"><div class="c-name" style="font-size:15px; margin:0;">${c.name}</div></div>`; list.appendChild(item); }); document.getElementById('select-chat-sheet').classList.add('active'); }
          function closeSelectChat() { document.getElementById('select-chat-sheet').classList.remove('active'); }
          
          function renderMaskList() { const list = document.getElementById('mask-list'); list.innerHTML = ''; masks.forEach(m => { const div = document.createElement('div'); div.className = 'contact-item'; div.onclick = () => openMaskForm(m.id); div.innerHTML = `<div class="c-avatar-wrap">${renderAvatarHTML(m.avatar, 'user')}</div><div class="c-info"><div class="c-name">${m.name}</div><div class="c-preview">点击修改独立人设</div></div><button class="delete-btn" style="display:block; padding: 6px 12px;" onclick="deleteMask('${m.id}', event)">删除</button>`; list.appendChild(div); }); }
          
          function openMaskForm(id=null) { 
              document.getElementById('mask-modal').classList.add('active'); 
              if(id) { 
                  document.getElementById('mask-form-title').innerText = "修改面具"; const m = masks.find(x => x.id === id); 
                  document.getElementById('mask-id').value = m.id; document.getElementById('mask-name').value = m.name; 
                  document.getElementById('mask-persona').value = m.persona; document.getElementById('mask-avatar-data').value = m.avatar || ''; 
                  document.getElementById('mask-avatar-preview').innerHTML = renderAvatarHTML(m.avatar, 'user'); 
              } else { 
                  document.getElementById('mask-form-title').innerText = "新建面具"; 
                  ['mask-id','mask-name','mask-persona','mask-avatar-data'].forEach(x => document.getElementById(x).value=''); 
                  document.getElementById('mask-avatar-preview').innerHTML = SVG_USER; 
              } 
          }
          function closeMaskForm() { document.getElementById('mask-modal').classList.remove('active'); }
          function saveMaskForm() { const id = document.getElementById('mask-id').value; const name = document.getElementById('mask-name').value.trim(); const persona = document.getElementById('mask-persona').value.trim(); const avatar = document.getElementById('mask-avatar-data').value; if(!name) return alert("面具名称必填"); if(id) { const m = masks.find(x=>x.id===id); m.name=name; m.persona=persona; m.avatar=avatar; } else { masks.push({ id: 'm_'+Date.now(), name, persona, avatar }); } saveData(); closeMaskForm(); renderMaskList(); }
          function deleteMask(id, e) { e.stopPropagation(); if(confirm('删除此面具？')) { masks = masks.filter(m => m.id !== id); saveData(); renderMaskList(); } }
          
          function renderRoleList() { 
              const list = document.getElementById('role-list'); 
              list.innerHTML = ''; 
              if(contacts.length === 0) { 
                  list.innerHTML = `<div style="text-align:center; padding:50px 20px; color:var(--c-gray-dark); font-size:13px; font-weight:600;">暂无联系人。<br>点击右上角 + 新建人格。</div>`; 
                  return; 
              }
              
              contacts.forEach(c => { 
                  // 1. 创建滑动防溢出外壳
                  const wrap = document.createElement('div');
                  wrap.style.cssText = "position:relative; overflow:hidden;";
                  
                  // 2. 创建底部的红色删除按钮
                  const delBtn = document.createElement('div');
                  delBtn.style.cssText = "position:absolute; right:0; top:0; bottom:0; width:80px; background:#FF3B30; color:white; display:flex; justify-content:center; align-items:center; font-weight:700; font-size:14px; cursor:pointer;";
                  delBtn.innerText = "删除";
                  delBtn.onclick = (e) => { e.stopPropagation(); deleteRole(c.id); };
                  
                  // 3. 原本的列表内容（增加底层背景色遮挡红色按钮）
                  const item = document.createElement('div'); 
                  item.className = 'contact-item'; 
                  item.style.cssText = "position:relative; z-index:1; background:var(--c-bg); transition:transform 0.2s cubic-bezier(0.2,0.8,0.2,1); margin-bottom:0;";
                  
                  // 提取所属分组，并生成一个极简机能风的标签
                  let groupName = c.group || 'FRIENDS';
                  let groupTag = `<span style="font-family: 'Courier New', monospace; font-size: 8px; font-weight: 800; color: #A8A39D; background: rgba(0,0,0,0.03); padding: 2px 6px; border-radius: 4px; margin-left: 8px; letter-spacing: 1px; vertical-align: middle;">${groupName}</span>`;
          
                  // 强行把标签融合在名字后面
                  item.innerHTML = `<div class="c-avatar-wrap">${renderAvatarHTML(c.avatar, 'bot')}</div><div class="c-info"><div class="c-name" style="display:flex; align-items:center;"><span>${c.name}</span>${groupTag}</div><div class="c-preview">向左滑动删除 / 点击修改设定</div></div>`; 
                  
                  // 4. 添加纯手工丝滑物理滑动代码
                  let startX = 0; let currentX = 0; let isSwiping = false;
                  
                  item.addEventListener('touchstart', (e) => { 
                      startX = e.touches[0].clientX; 
                      isSwiping = false; 
                      item.style.transition = 'none'; // 滑动时取消动画，实现跟手
                  }, {passive:true});
                  
                  item.addEventListener('touchmove', (e) => { 
                      let delta = e.touches[0].clientX - startX; 
                      if (Math.abs(delta) > 10) isSwiping = true; // 判定为滑动而不是点击
                      if (delta < 0) { 
                          currentX = Math.max(delta, -90); // 最多往左滑 90px (带有一定阻尼弹性)
                          item.style.transform = `translateX(${currentX}px)`; 
                      } else if (currentX < 0) { 
                          currentX = Math.min(0, currentX + delta); // 从左边滑回右边
                          item.style.transform = `translateX(${currentX}px)`; 
                      }
                  }, {passive:true});
                  
                  item.addEventListener('touchend', (e) => { 
                      item.style.transition = 'transform 0.2s cubic-bezier(0.2,0.8,0.2,1)'; // 松手时恢复动画
                      if (currentX < -40) { 
                          currentX = -80; // 滑动过半，自动吸附到 -80px 展开按钮
                          item.style.transform = `translateX(-80px)`; 
                      } else { 
                          currentX = 0; // 滑动不足，弹回原位
                          item.style.transform = `translateX(0px)`; 
                      }
                  });
                  
                  // 5. 点击事件：如果按钮是展开的，点击就收回；否则打开编辑
                  item.onclick = (e) => { 
                      if (currentX < 0) { 
                          currentX = 0; item.style.transform = `translateX(0px)`; 
                      } else if (!isSwiping) { 
                          openRoleForm(c.id); 
                      }
                  };
                  
                  wrap.appendChild(delBtn);
                  wrap.appendChild(item);
                  list.appendChild(wrap); 
              }); 
          }
          
          // 附带新增加的删除角色逻辑函数
          function deleteRole(id) {
              if(!confirm("确定要删除这个联系人吗？与其相关的所有聊天记录也会一并永久消失！")) return;
              contacts = contacts.filter(c => c.id !== id);
              saveData();
              renderRoleList();    // 刷新联系人列表
              renderContacts();    // 同步刷新聊天界面列表
          }
          
          function openRoleForm(id = null) { 
              document.getElementById('role-modal').classList.add('active'); 
              // 动态加载分组选项
              const groupSelect = document.getElementById('role-group');
              groupSelect.innerHTML = '';
              gConfig.contactGroups.forEach(g => { groupSelect.innerHTML += `<option value="${g}">${g}</option>`; });
          
              if (id) { 
                  document.getElementById('role-form-title').innerText = "修改人格"; const c = contacts.find(x => x.id === id); 
                  document.getElementById('role-id').value = c.id; document.getElementById('role-name').value = c.name; 
                  document.getElementById('role-prompt').value = c.history[0].content; document.getElementById('role-avatar-data').value = c.avatar || ''; 
                  groupSelect.value = c.group || 'FRIENDS';
                  document.getElementById('role-avatar-preview').innerHTML = renderAvatarHTML(c.avatar, 'bot'); 
              } else { 
                  document.getElementById('role-form-title').innerText = "新建人格"; 
                  ['role-id','role-name','role-prompt','role-avatar-data'].forEach(elId => document.getElementById(elId).value=''); 
                  document.getElementById('role-avatar-preview').innerHTML = SVG_BOT; 
                  if(gConfig.contactGroups.length > 0) groupSelect.value = gConfig.contactGroups[0];
              } 
          }
          function closeRoleForm() { document.getElementById('role-modal').classList.remove('active'); }
          function saveRoleForm() { const id = document.getElementById('role-id').value; const name = document.getElementById('role-name').value.trim(); const avatar = document.getElementById('role-avatar-data').value; const prompt = document.getElementById('role-prompt').value.trim(); const group = document.getElementById('role-group').value; if(!name || !prompt) return alert("昵称和指令必填！"); if (id) { const c = contacts.find(x => x.id === id); c.name = name; c.avatar = avatar; c.group = group; c.history[0].content = prompt; } else { let newId = 'c_' + Date.now(); let safeName = name.toLowerCase().replace(/[^a-z0-9_]/g, ''); let suffix = newId.substring(newId.length - 4); let newTwHandle = '@' + (safeName ? safeName + '_' + suffix : 'user_' + suffix); const newC = { id: newId, name, avatar, group, chatAvatar: '', chatRemark: '', chatBg: '', maskId: '', chatFontSize: '', memory: '', autoSumFreq: 0, sumPrompt: '以第三人称详细总结上述对话核心。', lastSumIndex: 0, allowAiSticker: false, showName: false, twHandle: newTwHandle, history: [{ role: 'system', content: prompt }] }; contacts.unshift(newC); } saveData(); closeRoleForm(); renderRoleList(); renderContacts(); }
          
          function toggleEditList() { 
              isEditingList = !isEditingList; 
              const btn = document.getElementById('edit-btn');
              if(isEditingList) {
                  btn.style.color = '#FF3B30';
              } else {
                  btn.style.color = 'var(--c-black)';
              }
              document.getElementById('contact-list').className = isEditingList ? 'list-wrap is-editing' : 'list-wrap'; 
          }
          function deleteChatHistory(id, e) { e.stopPropagation(); if(confirm('清空此人的聊天记录？')) { const c = contacts.find(x => x.id === id); if(c) { c.history = c.history.filter(m => m.role === 'system'); c.memory = ''; c.lastSumIndex = 0; } saveData(); renderContacts(); } }
          
          function searchMessages(keyword) {
              const kw = keyword.toLowerCase().trim();
              if (!kw) { renderContacts(); return; }
              const list = document.getElementById('contact-list'); list.innerHTML = '';
              let found = false;
          
              contacts.forEach(c => {
                  c.history.forEach((msg, index) => {
                      if (msg.role !== 'system' && msg.content.toLowerCase().includes(kw)) {
                          found = true;
                          const item = document.createElement('div'); item.className = 'msg-card search-result'; 
                          item.onclick = () => openChatAndScroll(c.id, index);
                          
                          const regex = new RegExp(`(${kw})`, "gi");
                          const plainText = msg.content.replace(/<[^>]*>?/gm, '');
                          const snippet = plainText.replace(regex, `<span style="color:var(--c-black); font-weight:800;">$1</span>`);
          
                          item.innerHTML = `
                              <div style="display:flex; align-items:center; width:100%; border-bottom:0.5px solid rgba(0,0,0,0.05); padding-bottom:10px; margin-bottom:8px;">
                                  <div class="c-avatar-wrap" style="width:28px; height:28px; margin-right:12px; border-radius:8px;">${renderAvatarHTML(c.chatAvatar || c.avatar, 'bot')}</div>
                                  <div class="c-name" style="font-size:14px; margin:0;">${c.chatRemark || c.name}</div>
                                  <div style="margin-left:auto; font-size:11px; color:var(--c-gray-dark); font-weight:600;">${msg.role === 'user' ? '我' : '对方'}</div>
                              </div>
                              <div class="c-preview" style="white-space:normal; font-size:13px; line-height:1.4;">${snippet}</div>
                          `;
                          list.appendChild(item);
                      }
                  });
              });
          
              if (!found) { list.innerHTML = `<div style="text-align:center; padding:40px 20px; color:var(--c-gray-dark); font-size:13px; font-weight:600;">未搜索到相关的聊天记录。</div>`; }
          }
          
          function openChatAndScroll(contactId, targetIndex) {
              openChat(contactId);
              setTimeout(() => {
                  const targetEl = document.getElementById(`msg-item-${targetIndex}`);
                  if (targetEl) {
                      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      targetEl.classList.add('highlight-msg');
                      
                      const arrow = document.createElement('div');
                      arrow.className = 'jump-arrow';
                      if(targetEl.classList.contains('user')) {
                          arrow.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
                      } else {
                          arrow.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>`;
                      }
                      targetEl.querySelector('.bubble-body').appendChild(arrow);
                      
                      setTimeout(() => {
                          targetEl.classList.remove('highlight-msg');
                          if(arrow.parentNode) arrow.remove();
                      }, 2500);
                  }
              }, 400); 
          }
          
          // 【新增：点击系统消息，瞬间平滑滚动到目标气泡，并显示蓝色指示箭头】
          function jumpToMessage(targetIndex) {
              const targetEl = document.getElementById(`msg-item-${targetIndex}`);
              if (!targetEl) return alert("该消息可能已被删除或处于不可见状态~");
          
              // 丝滑滚动到目标气泡的正中央
              targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              
              // 防抖：如果已经有箭头了，就不重复添加
              if(targetEl.querySelector('.jump-arrow')) return;
          
              // 生成搜索同款的动态蓝色箭头
              const arrow = document.createElement('div');
              arrow.className = 'jump-arrow';
              if(targetEl.classList.contains('user')) {
                  // 我的气泡，箭头在左边指着右边
                  arrow.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
              } else {
                  // 对方的气泡，箭头在右边指着左边
                  arrow.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>`;
              }
              
              // 把箭头挂载到气泡上
              targetEl.querySelector('.bubble-body').appendChild(arrow);
              
              // 2.5秒后自动让箭头消散
              setTimeout(() => {
                  if(arrow.parentNode) arrow.remove();
              }, 2500);
          }
          
          function renderContacts() {
              const list = document.getElementById('contact-list'); list.innerHTML = ''; let hasMsg = false;
              const starSVG1 = `<svg class="list-star ls-1" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
              const starSVG2 = `<svg class="list-star ls-2" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
              const starSVG3 = `<svg class="list-star ls-3" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
          
              // 完全基于全局设定的顺序建立卡槽池
              let groupedContacts = {};
              gConfig.contactGroups.forEach(g => { groupedContacts[g] = []; });
              groupedContacts['UNASSIGNED'] = []; // 专门用来接住那些分组被删除了的可怜角色
              
              contacts.forEach((c, idx) => {
                  const displayMsgs = c.history.filter(m => m.role !== 'system');
                  if (displayMsgs.length === 0) return; 
                  hasMsg = true;
                  
                  // 老数据过渡：如果没有分组，默认归属 FRIENDS
                  let g = c.group || 'FRIENDS';
                  
                  // 如果所在的分组存在，放入正常分组；如果该分组被玩家删除了，掉入兜底列表
                  if(groupedContacts[g]) {
                      groupedContacts[g].push(c);
                  } else {
                      groupedContacts['UNASSIGNED'].push(c);
                  }
              });
          
              if(!hasMsg) { list.innerHTML = `<div style="text-align:center; padding:50px 20px; color:var(--c-gray-dark); font-size:11px; font-weight:600; line-height:1.8;">收件箱为空。<br>点击下方 ➕ 开始新的对话。</div>`; return; }
          
              let cardCounter = 1;
              for (let groupName in groupedContacts) {
                  if (groupedContacts[groupName].length === 0) continue;
                  
                  // 1. 生成机能风断层墙 (Divider)
                  const divider = document.createElement('div');
                  divider.className = 'group-divider';
                  if (window.currentContactFilter && window.currentContactFilter !== 'ALL' && window.currentContactFilter !== groupName) {
                      divider.classList.add('hidden');
                  }
                  divider.setAttribute('data-group', groupName);
                  divider.innerText = `// ${groupName} SECTOR`;
                  list.appendChild(divider);
          
                  // 2. 生成组内联系人卡片
                  groupedContacts[groupName].forEach((c, idx) => {
                      const displayMsgs = c.history.filter(m => m.role !== 'system');
                      let lastMsg = displayMsgs[displayMsgs.length - 1].content.split('\\n')[0].replace(/<[^>]*>?/gm, '');
                      if(lastMsg.startsWith('[系统提示：')) lastMsg = "[特殊动作]";
                      if(!lastMsg) lastMsg = "[特殊元素]";
          
                      // 动态生成编号 ID
                      let cardId = String(cardCounter++).padStart(2, '0');
          
                      const item = document.createElement('div'); 
                      item.className = 'msg-card'; 
                      // 结合 JS 隐藏逻辑
                      if (window.currentContactFilter && window.currentContactFilter !== 'ALL' && window.currentContactFilter !== groupName) {
                          item.classList.add('hidden');
                      }
                      item.setAttribute('data-id', cardId);
                      item.setAttribute('data-group', groupName);
                      item.onclick = () => openChat(c.id);
                      
                      // 呼吸灯装饰逻辑 (偶数在线，奇数离线)
                      let statusClass = (idx % 2 === 0) ? 'status-dot' : 'status-dot offline';
          
                      item.innerHTML = `
                          <div class="star-dust"><div class="sd-1">★</div><div class="sd-2">✧</div></div>
                          <div class="card-seal-line" data-id="${cardId}"></div><div class="crosshair"></div>
                          <div class="list-avatar-box">
                              <div class="list-avatar-inner">${renderAvatarHTML(c.chatAvatar || c.avatar, 'bot')}</div>
                              ${starSVG1}${starSVG2}${starSVG3}
                          </div>
                          <div class="c-info">
                              <div class="c-name-wrap">
                                  <div class="${statusClass}"></div>
                                  <div class="c-name" data-group="${groupName}">${c.chatRemark || c.name}</div>
                              </div>
                              <div class="c-preview">${lastMsg}</div>
                          </div>
                          <button class="delete-btn" onclick="deleteChatHistory('${c.id}', event)" style="position:relative; z-index:10;">清空</button>
                      `;
                      list.appendChild(item);
                  });
              }
          }