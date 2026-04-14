         // ================= 表情包中央档案馆 V3 核心引擎 =================
         function openStickerManager() {
             document.getElementById('sticker-manager-modal').classList.add('active');
             
             // 🚀 核心修复：强制数据结构完整
             if(!gConfig.stickerGroups || gConfig.stickerGroups.length === 0) {
                 gConfig.stickerGroups = [{id: 'default', name: '全部资源', stickers: [], access: []}];
             } else if (!gConfig.stickerGroups.find(g => g.id === 'default')) {
                 gConfig.stickerGroups.unshift({id: 'default', name: '全部资源', stickers: [], access: []});
             }
             
             // 🚀 核心修复：强制每次打开都锁定“全部资源”组，并重置选中状态
             currentSmGroupId = 'default'; 
             selectedStickers.clear();
             updateBatchBtn();
             
             renderSmTabs();
             renderSmStickers();
             
             // 物理重置滚动条
             const tabs = document.getElementById('sm-tabs-container');
             if(tabs) tabs.scrollLeft = 0;
         }


         function closeStickerManager() {
             document.getElementById('sticker-manager-modal').classList.remove('active');
             saveGlobal();
         }

         function renderSmTabs() {
             const container = document.getElementById('sm-tabs-container');
             if(!container) return;
             container.innerHTML = gConfig.stickerGroups.map(g => {
                 let isDefault = g.id === 'default';
                 return `
                 <div class="sm-tab ${g.id === currentSmGroupId ? 'active' : ''}" 
                      onclick="switchSmGroup('${g.id}')" 
                      oncontextmenu="event.preventDefault(); if(!${isDefault}) deleteStickerGroup('${g.id}')">
                     ${g.name}
                 </div>`;
             }).join('');
         }

         function switchSmGroup(id) {
             currentSmGroupId = id;
             selectedStickers.clear();
             updateBatchBtn();
             renderSmTabs();
             renderSmStickers();
         }

         function renderSmStickers() {
             const grid = document.getElementById('sm-grid-main');
             if(!grid) return;
             grid.innerHTML = '';

             let displayList = [];
             // 🚀 核心逻辑：当处于“全部资源”时，展示全库资产聚合
             if (currentSmGroupId === 'default') {
                 gConfig.stickerGroups.forEach(g => {
                     // 遍历每一个组（包括 default 组自己）
                     if (g.stickers) {
                         g.stickers.forEach((s, idx) => {
                             displayList.push({ ...s, gId: g.id, gIdx: idx });
                         });
                     }
                 });
             } else {
                 // 处于特定分组时，只展示该组资产
                 const group = gConfig.stickerGroups.find(g => g.id === currentSmGroupId);
                 if (group && group.stickers) {
                     displayList = group.stickers.map((s, idx) => ({ ...s, gId: group.id, gIdx: idx }));
                 }
             }

             grid.innerHTML = displayList.map(s => {
                 const uniqueKey = `${s.gId}|${s.gIdx}`;
                 return `
                 <div class="sm-sticker-card">
                     <div class="sm-img-wrap">
                         <img src="${s.url}">
                     </div>
                     <input type="text" class="sm-name-input" value="${s.name}" onchange="updateStickerName('${s.gId}', ${s.gIdx}, this.value)">
                     <div class="sm-select-row">
                         <span class="sm-select-label">SELECT</span>
                         <div class="sm-checkbox ${selectedStickers.has(uniqueKey) ? 'checked' : ''}" onclick="toggleStickerSelect('${uniqueKey}', this)"></div>
                     </div>
                 </div>
             `}).join('');
         }

         function updateStickerName(gId, gIdx, newVal) {
             const group = gConfig.stickerGroups.find(g => g.id === gId);
             if(group && group.stickers[gIdx]) {
                 group.stickers[gIdx].name = newVal;
                 saveData();
             }
         }

         function toggleStickerSelect(uniqueKey, el) {
             if(selectedStickers.has(uniqueKey)) selectedStickers.delete(uniqueKey);
             else selectedStickers.add(uniqueKey);
             el.classList.toggle('checked');
             updateBatchBtn();
         }

         function updateBatchBtn() {
             const btn = document.getElementById('sm-batch-btn');
             if(btn) btn.innerText = `批量管理 (${selectedStickers.size})`;
         }

         function mExecuteBatchAction() {
             if(selectedStickers.size === 0) return showToast("SYSTEM", "请先勾选需要管理的表情", "", null, 2000);
             
             // 1. 更新弹窗内的统计文字
             document.getElementById('sm-batch-count-text').innerText = `已选中 ${selectedStickers.size} 个表情资产`;
             
             // 2. 动态填充移动分组的选择框
             const select = document.getElementById('sm-batch-move-select');
             select.innerHTML = '';
             gConfig.stickerGroups.forEach(g => {
                 // 核心修复：如果是在“全部资源”视图，允许移动到任何一个具体分组
                 // 如果是在特定分组视图，则排除当前组
                 if(currentSmGroupId === 'default' || g.id !== currentSmGroupId) {
                     const opt = document.createElement('option');
                     opt.value = g.id;
                     opt.innerText = g.name;
                     select.appendChild(opt);
                 }
             });
             
             if(select.options.length === 0) {
                 select.innerHTML = '<option value="">暂无有效目标分组</option>';
                 select.disabled = true;
             } else {
                 select.disabled = false;
             }
             
             // 3. 呼出弹窗
             openSmModal('sm-batch-modal');
         }

         function mConfirmBatchMove() {
             const targetGroupId = document.getElementById('sm-batch-move-select').value;
             if(!targetGroupId) return;
             const targetGroup = gConfig.stickerGroups.find(g => g.id === targetGroupId);
             if(!targetGroup) return;

             // 🚀 核心逻辑：解析“组ID|索引”这种复合Key，实现跨组批量移动
             const moveTasks = {}; // 格式: { 源组ID: [索引1, 索引2...] }
             
             selectedStickers.forEach(key => {
                 const [gId, gIdx] = key.split('|');
                 if(!moveTasks[gId]) moveTasks[gId] = [];
                 moveTasks[gId].push(parseInt(gIdx));
             });

             let totalMoved = 0;
             for (let srcGId in moveTasks) {
                 const srcGroup = gConfig.stickerGroups.find(g => g.id === srcGId);
                 if(!srcGroup || srcGId === targetGroupId) continue; // 禁止移动到自身

                 // 必须倒序排列索引，否则 splice 会导致后面的元素索引错乱
                 const sortedIndices = moveTasks[srcGId].sort((a, b) => b - a);
                 sortedIndices.forEach(idx => {
                     const item = srcGroup.stickers.splice(idx, 1)[0];
                     if(item) {
                         targetGroup.stickers.push(item);
                         totalMoved++;
                     }
                 });
             }

             selectedStickers.clear();
             updateBatchBtn();
             renderSmStickers();
             saveData();
             closeSmModal('sm-batch-modal');
             showToast("SYSTEM", `已成功调配 ${totalMoved} 个资产至 [${targetGroup.name}]`, "", null, 2000);
         }

         function mConfirmBatchDelete() {
             if(!confirm(`🚨 最终警告：确定要永久删除选中的 ${selectedStickers.size} 个表情吗？此操作不可撤销！`)) return;
             
             const deleteTasks = {};
             selectedStickers.forEach(key => {
                 const [gId, gIdx] = key.split('|');
                 if(!deleteTasks[gId]) deleteTasks[gId] = [];
                 deleteTasks[gId].push(parseInt(gIdx));
             });

             let totalDeleted = 0;
             for (let srcGId in deleteTasks) {
                 const srcGroup = gConfig.stickerGroups.find(g => g.id === srcGId);
                 if(srcGroup) {
                     const sortedIndices = deleteTasks[srcGId].sort((a, b) => b - a);
                     sortedIndices.forEach(idx => {
                         srcGroup.stickers.splice(idx, 1);
                         totalDeleted++;
                     });
                 }
             }

             selectedStickers.clear();
             updateBatchBtn();
             renderSmStickers();
             saveData();
             closeSmModal('sm-batch-modal');
             showToast("SYSTEM", `已从档案馆彻底抹除 ${totalDeleted} 项资产`, "", null, 2000);
         }

         function openSmModal(id) { 
             document.getElementById(id).classList.add('active'); 
             if(id === 'sm-access-modal') renderSmAccessList(); 
         }
         
         function closeSmModal(id) { document.getElementById(id).classList.remove('active'); }

         function switchSmImportTab(mode) {
             document.getElementById('sm-tabFile').classList.toggle('active', mode === 'file');
             document.getElementById('sm-tabUrl').classList.toggle('active', mode === 'url');
             document.getElementById('sm-viewFile').style.display = mode === 'file' ? 'block' : 'none';
             document.getElementById('sm-viewUrl').style.display = mode === 'url' ? 'block' : 'none';
         }

         function handleSmFileSelect(e) {
             const file = e.target.files[0];
             if(!file) return;
             const reader = new FileReader();
             reader.onload = (evt) => {
                 // 🚀 核心：抓取本地图片的 Base64 数据
                 const b64 = evt.target.result;
                 const previewImg = document.getElementById('sm-tempPreview');
                 const hint = document.getElementById('sm-cameraHint');
                 if(previewImg && hint) {
                     previewImg.src = b64;
                     previewImg.style.display = 'block';
                     hint.style.display = 'none';
                 }
             };
             reader.readAsDataURL(file);
         }

         function confirmSmImport() {
             // 🚀 核心修复：即使在“全部资源”视图下导入，也会存入 ID 为 default 的对象中
             const group = gConfig.stickerGroups.find(g => g.id === currentSmGroupId);
             if(!group) return alert("分组状态异常，请刷新页面");
             
             const isUrlMode = document.getElementById('sm-tabUrl').classList.contains('active');
             
             if(isUrlMode) {
                 const urlInput = document.getElementById('sm-urlInput');
                 const lines = urlInput.value.split('\n');
                 lines.forEach(line => {
                     const parts = line.split(/[:：]/);
                     if(parts.length >= 2) {
                         group.stickers.push({ name: parts[0].trim(), url: parts.slice(1).join(':').trim() });
                     } else if(line.trim()) {
                         group.stickers.push({ name: '未命名', url: line.trim() });
                     }
                 });
             } else {
                 const previewImg = document.getElementById('sm-tempPreview');
                 const nameInput = document.getElementById('sm-newName');
                 const b64 = previewImg.src;
                 const name = nameInput.value.trim() || '未命名表情';
                 
                 if(!b64 || b64.length < 100) return alert("请先选择本地照片！");
                 
                 // 🚀 核心：将本地照片数据存入当前分组
                 group.stickers.push({ name: name, url: b64 });
             }
             
             saveData();
             renderSmStickers();
             closeSmModal('sm-import-modal');
             
             // 彻底重置导入框状态
             document.getElementById('sm-tempPreview').src = '';
             document.getElementById('sm-tempPreview').style.display = 'none';
             document.getElementById('sm-cameraHint').style.display = 'flex';
             document.getElementById('sm-newName').value = '';
             document.getElementById('sm-urlInput').value = '';
         }

         function renderSmAccessList() {
    const list = document.getElementById('sm-access-list');
    const group = gConfig.stickerGroups.find(g => g.id === currentSmGroupId);
    if(!list || !group) return;
    list.innerHTML = contacts.map(r => {
        // 🚀 核心修复：使用 sm-avatar-box 配合 CSS 强制缩放图片
        let avatarHtml = renderAvatarHTML(r.chatAvatar || r.avatar, 'bot');
        return `
        <div class="sm-contact-item">
            <div class="flex items-center gap-3">
                <div class="sm-avatar-box">
                    ${avatarHtml}
                </div>
                <span class="text-sm font-bold text-[#1C1C1E]">${r.name}</span>
            </div>
            <input type="checkbox" class="accent-black w-4 h-4 sm-access-ck" ${group.access && group.access.includes(r.id) ? 'checked' : ''} data-id="${r.id}">
        </div>
        `;
    }).join('');
}

         function saveSmAccessSettings() {
             const group = gConfig.stickerGroups.find(g => g.id === currentSmGroupId);
             const checks = document.querySelectorAll('.sm-access-ck:checked');
             group.access = Array.from(checks).map(c => c.dataset.id);
             saveData();
             closeSmModal('sm-access-modal');
             showToast("SYSTEM", "授权设置已同步至 AI 认知层", "", null, 2000);
         }

         function createNewStickerGroup() {
             const name = prompt("请输入新分组名称:");
             if(!name) return;
             const newGroup = { id: 'g' + Date.now(), name: name, stickers: [], access: [] };
             gConfig.stickerGroups.push(newGroup);
             saveData();
             renderSmTabs();
         }

         function deleteStickerGroup(id) {
             if(!confirm("确定要删除这个表情分组吗？内部表情将一并消失。")) return;
             gConfig.stickerGroups = gConfig.stickerGroups.filter(g => g.id !== id);
             if(currentSmGroupId === id) currentSmGroupId = 'default';
             saveData();
             renderSmTabs();
             renderSmStickers();
         }

         function renderChatStickerPanel() {
             const tabsWrap = document.getElementById('chat-st-tabs');
             const grid = document.getElementById('chat-st-grid');
             if(!tabsWrap || !grid || !gConfig.stickerGroups) return;
             
             if(!gConfig.stickerGroups.find(s => s.id === currentChatStGroupId)) currentChatStGroupId = 'default';

             tabsWrap.innerHTML = gConfig.stickerGroups.map(g => `
                 <div class="sm-tab ${g.id === currentChatStGroupId ? 'active' : ''}" 
                      style="padding: 6px 14px; font-size: 11px;"
                      onclick="currentChatStGroupId='${g.id}'; renderChatStickerPanel();">
                     ${g.name}
                 </div>
             `).join('');

             const group = gConfig.stickerGroups.find(g => g.id === currentChatStGroupId);
             if(!group || group.stickers.length === 0) {
                 grid.innerHTML = '<div style="grid-column: span 4; text-align:center; padding:20px; color:var(--c-gray-dark); font-size:11px;">该组暂无表情。</div>';
                 return;
             }

             grid.innerHTML = group.stickers.map(s => `
                 <div class="sm-sticker-card" style="cursor:pointer; border-radius:12px; padding:6px;" onclick="sendRealSticker('${s.name}', '${s.url}')">
                     <div class="sm-img-wrap" style="margin-bottom:4px; border-radius:8px;">
                         <img src="${s.url}">
                     </div>
                     <div style="font-size:8px; text-align:center; color:var(--c-gray-dark); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${s.name}</div>
                 </div>
             `).join('');
         }

         function sendRealSticker(name, url) {
             if(!currentContactId) return;
             const c = contacts.find(x => x.id === currentContactId); 
             const stickerImgHtml = `<img src="${url}" style="width:120px; height:120px; object-fit:cover; background:transparent; border-radius:12px; display:block;">`;
             
             const newMsg = { 
                 role: 'user', 
                 content: stickerImgHtml, 
                 isRevoked: false, 
                 timestamp: Date.now(),
                 isRealSticker: true,
                 stickerDesc: name,
                 realStickerUrl: url 
             };
             
             c.history.push(newMsg); 
             appendBubbleRow(newMsg, c.history.length - 1); 
             saveData();
         }
         
         function sendChatImage(e) {
             const file = e.target.files[0];
             if (!file) return;
             const reader = new FileReader();
             reader.onload = function(evt) {
                 const b64 = evt.target.result;
                 if (!currentContactId) return;
                 const c = contacts.find(x => x.id === currentContactId);
                 
                 // 为了保证气泡样式不崩，设定最高宽度，并保留圆角
                 const imgHtml = `<img src="${b64}" style="max-width: 180px; border-radius: 8px; display: block; margin-top: 4px;">`;
                 
                 const newMsg = { 
                     role: 'user', 
                     content: imgHtml, 
                     isRevoked: false, 
                     timestamp: Date.now(),
                     imageData: b64 // 妥善保管原始数据，专供 AI Vision 模型解析
                 };
                 
                 c.history.push(newMsg); 
                 appendBubbleRow(newMsg, c.history.length - 1); 
                 saveData();
                 closeChatMenu(); // 自动收起回形针面板
                 
                 // 清空 input，避免玩家重选同一张图片时不触发 onchange
                 e.target.value = '';
                 
                 // 核心：严格遵循指令！只上屏展示，绝对不触发 fetchAIReply()，将控制权交给你手动点击。
             };
             reader.readAsDataURL(file);
         }
         
         function sendDescribedPhoto() {
             const desc = prompt("【虚拟拍摄】\n请用文字描述你要定格的画面：\n（它将化作一枚绝美的邮票发给对方）");
             if (!desc || !desc.trim()) return;
             
             if (!currentContactId) return;
             const c = contacts.find(x => x.id === currentContactId);
             
             // 生成法式高定邮票卡片
             const imgHtml = `
             <div class="stamp-wrapper">
                 <div class="stamp-base">
                     <div class="stamp-inner">
                         <div class="stamp-postmark"></div>
                         <div class="stamp-circle"></div>
                         <div class="stamp-header">PAR AVION</div>
                         <div class="stamp-text">${desc.trim()}</div>
                     </div>
                 </div>
             </div><img src="1" onerror="this.parentNode.classList.add('bubble-clear'); this.remove();">`;
             
             const newMsg = { 
                 role: 'user', 
                 content: imgHtml.replace(/\n\s+/g, ''), 
                 isRevoked: false, 
                 timestamp: Date.now(),
                 photoDesc: desc.trim() // 将原始描述安全保管，供拦截器发给AI
             };
             
             c.history.push(newMsg); 
             appendBubbleRow(newMsg, c.history.length - 1); 
             saveData();
             closeChatMenu();
             
             // 核心：同样严格遵循指令，绝不触发 fetchAIReply()
         }
         
         // ================= 美化工坊 Studio 核心算法 =================
         function openStudio() {
             document.getElementById('studio-modal').classList.add('active');
             document.getElementById('studio-name').value = '';
             document.getElementById('studio-css').value = '';
             if(!gConfig.bubblePresets) gConfig.bubblePresets = [];
             updateStudioPreview();
             renderStudioPresets();
         }
         
         function closeStudio() {
    document.getElementById('studio-modal').classList.remove('active');
    const previewStyle = document.getElementById('studio-preview-style');
    if (previewStyle) {
        previewStyle.remove();
    }
}
         
         function updateStudioPreview() {
             const cssText = document.getElementById('studio-css').value;
             // 寻找是否已经创建了专门用来预览的 style 标签
             let previewStyle = document.getElementById('studio-preview-style');
             if (!previewStyle) {
                 previewStyle = document.createElement('style');
                 previewStyle.id = 'studio-preview-style';
                 document.head.appendChild(previewStyle);
             }
             // 将用户粘贴的完整 CSS 直接注入其中，实现全域实时预览！
             previewStyle.innerHTML = cssText;
         }
         
         function saveStudioPreset() {
             const name = document.getElementById('studio-name').value.trim();
             const css = document.getElementById('studio-css').value.trim();
             if(!name || !css) return alert("名称和 CSS 代码都必须填写！");
             
             gConfig.bubblePresets.push({ id: 'p_' + Date.now(), name: name, css: css });
             saveGlobal();
             document.getElementById('studio-name').value = '';
             document.getElementById('studio-css').value = '';
             updateStudioPreview();
             renderStudioPresets();
         }
         
         function renderStudioPresets() {
             const list = document.getElementById('studio-preset-list');
             list.innerHTML = '';
             if(!gConfig.bubblePresets || gConfig.bubblePresets.length === 0) {
                 list.innerHTML = '<div style="text-align:center; padding:20px; color:var(--c-gray-dark); font-size:12px;">暂无预设，请在上方编写保存。</div>';
                 return;
             }
             gConfig.bubblePresets.forEach((p, idx) => {
                 const item = document.createElement('div');
                 item.style.cssText = "background:var(--c-card); padding:15px; border-radius:16px; border:1px solid rgba(0,0,0,0.05); display:flex; justify-content:space-between; align-items:center;";
                 item.innerHTML = `
                     <div style="font-size:14px; font-weight:700; color:var(--c-black);">${p.name}</div>
                     <button class="action-chip" style="color:#FF3B30; background:rgba(255,59,48,0.1);" onclick="deletePreset(${idx})">删除</button>
                 `;
                 list.appendChild(item);
             });
         }
         
         function deletePreset(idx) {
             if(confirm("确定要删除这个气泡预设吗？")) {
                 gConfig.bubblePresets.splice(idx, 1);
                 // 🚀 核心修复：先刷新列表 UI，再执行防抖保存，确保数据一致性
                 renderStudioPresets();
                 saveGlobal(); 
             }
         }
         
         // ================= 聊天室内部调用预设算法 =================
         function openPresetSelector() {
             const list = document.getElementById('preset-selector-list');
             list.innerHTML = '';

             // 内置预设
             const builtinPresets = [
                 {
                     name: '🔘 隐藏尖角（圆润气泡）',
                     css: `.bubble-user { border-radius: 20px !important; }
.bubble-bot { border-radius: 20px !important; }`
                 },
                 {
                     name: '⬜ 方形气泡',
                     css: `.bubble-user { border-radius: 8px !important; }
.bubble-bot { border-radius: 8px !important; }`
                 },
                 {
                     name: '🫧 加边框',
                     css: `.bubble-user { border: 1.5px solid rgba(255,255,255,0.3) !important; }
.bubble-bot { border: 1.5px solid rgba(0,0,0,0.12) !important; }`
                 },
                 {
                     name: '🔄 恢复默认',
                     css: ``
                 }
             ];

             builtinPresets.forEach(p => {
                 const item = document.createElement('div');
                 item.style.cssText = "background:rgba(0,122,255,0.06); border:1px solid rgba(0,122,255,0.15); padding:14px 16px; border-radius:12px; font-weight:700; font-size:14px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;";
                 item.innerHTML = `<span>${p.name}</span><span style="font-size:10px; color:#007AFF; font-weight:800; letter-spacing:1px;">内置</span>`;
                 item.onclick = () => { applyPresetToCS(p.css); };
                 list.appendChild(item);
             });

             // 分割线
             if(gConfig.bubblePresets && gConfig.bubblePresets.length > 0) {
                 const divider = document.createElement('div');
                 divider.style.cssText = "font-size:10px; font-weight:800; color:var(--c-gray-dark); letter-spacing:1px; margin:12px 0 8px; text-align:center; opacity:0.5;";
                 divider.innerText = "— 我的工坊预设 —";
                 list.appendChild(divider);

                 gConfig.bubblePresets.forEach(p => {
                     const item = document.createElement('div');
                     item.style.cssText = "background:rgba(0,0,0,0.03); padding:14px 16px; border-radius:12px; font-weight:700; font-size:14px; cursor:pointer; margin-bottom:8px;";
                     item.innerText = p.name;
                     item.onclick = () => { applyPresetToCS(p.css); };
                     list.appendChild(item);
                 });
             }

             document.getElementById('preset-selector-sheet').classList.add('active');
         }
         
         function closePresetSelector() {
             document.getElementById('preset-selector-sheet').classList.remove('active');
         }
         
         function applyPresetToCS(css) {
             const cssInput = document.getElementById('cs-me-bubble-css');
             if (cssInput) cssInput.value = css;
             
             // 🚀 核心修复：立即同步到当前联系人对象并重绘样式
             if(currentContactId) {
                 const c = contacts.find(x => x.id === currentContactId);
                 if(c) {
                     c.bubbleCss = css;
                     // 瞬间重绘样式表
                     document.getElementById('dynamic-chat-style').innerHTML = css;
                 }
             }
             
             saveGlobalFromCS();
             closePresetSelector();
         }
