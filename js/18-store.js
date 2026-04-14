         async function initStoreApp() {
             // 🚀 核心修复：同样将商店引擎升级为无限容量读取
             try {
                 let savedCustom = await LocalDB.getItem('soap_boutique_custom') || localStorage.getItem('soap_boutique_custom');
                 if (savedCustom) storeCustomDB = JSON.parse(savedCustom);
                 let savedHistory = await LocalDB.getItem('soap_boutique_history') || localStorage.getItem('soap_boutique_history');
                 if(savedHistory) storeOrderHistory = JSON.parse(savedHistory);
             } catch (e) {
                 storeCustomDB = []; storeOrderHistory = [];
             }
             
             const firstItem = document.querySelector('#app-store .cat-item');
             if (firstItem) selectStoreMainCategory(firstItem, 'BOUTIQUE', '');
             renderStoreContacts();
         }
         
         // 联动系统原有的 Contacts 数组
         function renderStoreContacts() {
             const picker = document.getElementById('store-contact-picker');
             picker.innerHTML = '';
             if(!contacts || contacts.length === 0) return;
             contacts.forEach((c, idx) => {
                 const item = document.createElement('div');
                 item.className = `cp-item ${idx === 0 ? 'active' : ''}`;
                 item.dataset.id = c.id;
                 item.onclick = function() {
                     document.querySelectorAll('#store-contact-picker .cp-item').forEach(i => i.classList.remove('active'));
                     this.classList.add('active');
                 };
                 item.innerHTML = `<div class="cp-avatar">${renderAvatarHTML(c.chatAvatar || c.avatar, 'bot')}</div><div class="cp-name">${c.name}</div>`;
                 picker.appendChild(item);
             });
         }
         
         function selectStoreMainCategory(el, categoryName, themeClass) {
             document.querySelectorAll('#app-store .cat-item').forEach(i => i.classList.remove('active')); el.classList.add('active');
             document.getElementById('store-cat-indicator').style.top = (el.offsetTop + (el.offsetHeight / 2) - 13) + 'px';
             document.getElementById('app-store').className = 'app-window active ' + themeClass;
             document.getElementById('store-bg-title-sub').innerText = categoryName + ".";
             
             storeCurrentMainCat = categoryName; storeCurrentSubCat = 'ALL'; 
             storeIsAwaitingSync = true;
             renderStoreSubFilters(); storeRenderProducts();
         }
         
         function renderStoreSubFilters() {
             const bar = document.getElementById('store-sub-filter-bar'); bar.innerHTML = ''; 
             if(storeCurrentMainCat === 'WORKSHOP') { bar.style.display = 'none'; return; }
             bar.style.display = 'flex';
             const subs = storeSubCategories[storeCurrentMainCat] || [];
             subs.forEach(sub => {
                 const btn = document.createElement('div'); btn.className = `sub-btn ${sub.id === storeCurrentSubCat ? 'active' : ''}`;
                 btn.innerHTML = `${sub.name}<span class="cn">${sub.cn}</span>`;
                 btn.onclick = () => { 
                     storeCurrentSubCat = sub.id; 
                     storeIsAwaitingSync = true;
                     renderStoreSubFilters(); storeRenderProducts(); 
                 };
                 bar.appendChild(btn);
             });
         }
         
         async function triggerStoreAILoading() {
             if (storeCurrentMainCat === 'WORKSHOP' || storeCurrentSubCat === 'CUSTOM') return;
         
             // --- 新增：拦截刷新，询问风格提示词 ---
             let customStyle = prompt("【高定店面上新】\n请输入你期望的商品风格或特定元素（例如：暗黑哥特风、赛博朋克、千禧复古风...）。\n\n注：当前分类不会改变。留空则由 AI 自由发挥：", "");
             if (customStyle === null) return; // 用户点击取消，中止刷新操作
         
             const grid = document.getElementById('store-product-grid');
             document.getElementById('store-scroll-area').scrollTop = 0;
             grid.innerHTML = `<div class="ai-loading"><div class="spinner"></div><div class="ai-loading-text">Curating Beautiful Items...</div></div>`;
         
             let list = [];
             let validSubs = storeSubCategories[storeCurrentMainCat].map(s => s.id).filter(id => id !== 'ALL' && id !== 'CUSTOM');
             
             let apiSuccess = false;
             if (gConfig.apiUrl && gConfig.apiKey) {
                 try {
                     let subNameMap = {
                         'CLOTHING': '高质感的日常服饰、有设计感的上衣、外套或下装',
                         'BEAUTY': '精致的美妆护肤、香氛或个人护理单品',
                         'INTIMATE': '舒适且有设计感的贴身衣物、居家服或内衣',
                         'FURNITURE': '温馨且有设计感的实用小家具、舒适座椅、氛围灯',
                         'DECOR': '提升空间品味的漂亮摆件、高级感餐具、艺术挂画',
                         'SCENT': '好闻的沙龙香水、助眠香薰蜡烛、空间喷雾'
                     };
         
                     let targetItems = "";
                     if (storeCurrentSubCat !== 'ALL' && subNameMap[storeCurrentSubCat]) {
                         targetItems = subNameMap[storeCurrentSubCat];
                     } else {
                         targetItems = storeCurrentMainCat === 'BOUTIQUE'
                             ? '高质感的服饰、精致美妆护肤、舒适居家衣物'
                             : '温馨有设计感的家具、提升空间颜值的摆件、好闻的香薰';
                     }
         
                     // --- 新增：将风格要求注入给 AI，并赋予最高优先级 ---
                     let styleRequirement = customStyle.trim() ? `\n【🚨 顾客私人定制最高指令】：${customStyle.trim()}。\n(警告：用户的定制要求拥有绝对的最高优先级！如果用户指定了性别（如男装）、特定款式或风格，请你彻底抛弃上方默认的基础类别刻板印象，100% 完全按照用户的定制要求来挑选商品！)` : '';
         
                     let sysPrompt = `你是一个品味极佳的独立设计师品牌买手。
         当前默认上新的商品基础类别是：${targetItems}。${styleRequirement}
         请发挥你的审美，为客人挑选 6 到 8 件商品。
         【最高警告】：
         1. 绝对不要输出任何 markdown 标记 (不要加 \`\`\`json 等标记)！
         2. 绝对不要说任何废话，只能输出一个纯净的 JSON 数组！
         3. 价格必须是纯数字（整数）。
         严格按照以下格式输出：
         [
         {"name": "简短商品名", "desc": "材质、颜色、使用感受描述", "price": 999},
         {"name": "另一件商品", "desc": "绝美描述", "price": 520}
         ]`;
         
                     // 核心防死锁：引入 AbortController，45秒没获取完强行掐断
                     const controller = new AbortController();
                     const timeoutId = setTimeout(() => controller.abort(), 45000);
         
                     const res = await fetch(`${gConfig.apiUrl}/v1/chat/completions`, {
                         method: 'POST', headers: { 'Authorization': `Bearer ${gConfig.apiKey}`, 'Content-Type': 'application/json' },
                         body: JSON.stringify({ 
                             model: gConfig.model, 
                             messages: [
                                 { role: 'system', content: sysPrompt },
                                 { role: 'user', content: '请直接输出符合要求的 JSON 数组。' }
                             ], 
                             temperature: 0.8 
                         }),
                         signal: controller.signal
                     });
                     
                     clearTimeout(timeoutId);
                     
                     // 智能报错反馈 1：API 层面报错
                     if (!res.ok) {
                         let errTxt = await res.text();
                         throw new Error(`API接口报错 (${res.status}): ${errTxt.substring(0, 80)}...`);
                     }
                     
                     const data = await res.json();
                     if (!data.choices || data.choices.length === 0) throw new Error("大模型未返回有效内容");
                     
                     let rawStr = data.choices[0].message.content.trim();
                     
                     // 暴力正则解析引擎：无视 AI 的废话，强行扣出中括号里的数组
                     let startIdx = rawStr.indexOf('[');
                     let endIdx = rawStr.lastIndexOf(']');
                     if(startIdx !== -1 && endIdx !== -1) {
                         rawStr = rawStr.substring(startIdx, endIdx + 1);
                     } else {
                         throw new Error("大模型智商掉线，未能输出规范的 JSON 数组结构");
                     }
                     
                     let aiItems;
                     try {
                         aiItems = JSON.parse(rawStr);
                     } catch(parseErr) {
                         throw new Error("大模型吐出的 JSON 格式存在标点或引号错误，无法解析！");
                     }
                     
                     // 放宽容错：只要解析出来的商品大于 0 个，就算成功（哪怕它只吐了 4 个）
                     if(Array.isArray(aiItems) && aiItems.length > 0) {
                         aiItems.slice(0, 8).forEach((item, i) => {
                             let targetSub = storeCurrentSubCat === 'ALL' ? validSubs[Math.floor(Math.random() * validSubs.length)] : storeCurrentSubCat;
                             let newItem = {
                                 id: `ai_${Date.now()}_${i}`, cat: storeCurrentMainCat, subCat: targetSub,
                                 type: i % 3 === 0 ? 'capsule' : 'frame',
                                 name: item.name || `Item 0${i+1}`,
                                 desc: `【单品详情】\n${item.desc || '一件充满设计感的绝美单品。'}`,
                                 // 强制转化为纯数字，防止低智 AI 加上了“元”字导致报错
                                 price: parseInt(item.price) || Math.floor(Math.random() * 2000 + 100), 
                                 img: ''
                             };
                             list.push(newItem); storeGlobalAiDB[newItem.id] = newItem;
                         });
                         apiSuccess = true;
                     } else {
                         throw new Error("成功拉取，但大模型没有在数组里放入任何商品。");
                     }
                     
                 } catch (e) { 
                     console.error("AI商品生成失败:", e); 
                     // 智能报错反馈 2：弹窗通知用户真实死因
                     alert(`商品策展失败！\n\n[报错原因]：${e.message}\n\n[排查建议]：\n1. 如果是 API 接口报错，请检查 Base URL、Key 或网络环境。\n2. 如果是 JSON 格式报错，说明当前大模型的逻辑不够聪明，建议切换到更强的高智商大模型 \n\n(将自动为您加载断网备用商品)`);
                 }
             }
         
             if (!apiSuccess) {
                 await new Promise(r => setTimeout(r, 1000));
                 let prefix = storeCurrentMainCat === 'BOUTIQUE' ? 'Chic ' : 'Cozy ';
                 for(let i=0; i<8; i++) {
                     let targetSub = storeCurrentSubCat === 'ALL' ? validSubs[Math.floor(Math.random() * validSubs.length)] : storeCurrentSubCat;
                     let newItem = {
                         id: `ai_${Date.now()}_${i}`, cat: storeCurrentMainCat, subCat: targetSub, type: i % 3 === 0 ? 'capsule' : 'frame',
                         name: `${prefix} Item 0${i+1}`,
                         desc: `【网络未连接】\n一件非常有设计感的漂亮单品，穿上/使用后心情会变好。请配置有效的 API 密钥并选择聪明的大模型获取真实商品信息。`,
                         price: Math.floor(Math.random() * 1500 + 100), img: '' 
                     };
                     list.push(newItem); storeGlobalAiDB[newItem.id] = newItem; 
                 }
             }
             
             let cacheKey = `${storeCurrentMainCat}_${storeCurrentSubCat}`;
             storeAiCache[cacheKey] = list;
             storeIsAwaitingSync = false;
             storeRenderProducts();
         }
         
         function showStoreProductDesc(name, desc) {
             document.getElementById('store-desc-title').innerText = name.toUpperCase();
             document.getElementById('store-desc-text').innerHTML = desc;
             document.getElementById('store-desc-modal').classList.add('active');
         }
         function closeStoreProductDesc() { document.getElementById('store-desc-modal').classList.remove('active'); }
         
         function toggleStoreCartItem(event, itemId) {
             event.stopPropagation(); const btn = event.currentTarget;
             if (storeCartSet.has(itemId)) {
                 storeCartSet.delete(itemId); btn.classList.remove('in-cart');
                 btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
             } else {
                 storeCartSet.add(itemId); btn.classList.add('in-cart');
                 btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"/></svg>`;
             }
             const dot = document.getElementById('store-cart-dot'); dot.innerText = storeCartSet.size;
             if(storeCartSet.size > 0) dot.classList.add('show'); else dot.classList.remove('show');
         }
         
         function storeRenderProducts(isCustomView = false) {
             const grid = document.getElementById('store-product-grid'); grid.innerHTML = '';
             if(!isCustomView) document.getElementById('store-scroll-area').scrollTop = 0;
         
             if (storeCurrentMainCat === 'WORKSHOP') {
                 grid.innerHTML = `<div class="workshop-terminal" style="margin-top: 50px;"><div class="ws-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></div><div style="font-family: monospace; font-size: 16px; font-weight: 800; color: var(--c-text); margin-bottom: 10px;">DEV_WORKSHOP</div><div style="font-size: 11px; color: var(--c-sub); line-height: 1.6;">System sandbox unlocked.<br>此区域留给您的自定义组件接入。</div></div>`;
                 return;
             }
         
             if (storeCurrentSubCat === 'CUSTOM') {
                 const addCardWrap = document.createElement('div'); addCardWrap.className = 'item-container';
                 addCardWrap.innerHTML = `<div class="add-custom-card" onclick="openStoreForgeModal()" style="transform: translateX(-15px) rotate(-2deg);"><svg fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg><span>FORGE ITEM</span></div>`;
                 grid.appendChild(addCardWrap);
                 
                 const cItems = storeCustomDB.filter(p => p.cat === storeCurrentMainCat);
                 if (cItems.length === 0) {
                     grid.innerHTML += `<div style="color:var(--c-sub); font-size:11px; margin-top:50px; letter-spacing:2px;">[ NO CUSTOM ASSETS ]</div>`;
                     return;
                 }
                 storeRenderItemsToGrid(cItems, 1);
             } else {
                 let cacheKey = `${storeCurrentMainCat}_${storeCurrentSubCat}`;
                 let cachedItems = storeAiCache[cacheKey];
         
                 if (cachedItems && cachedItems.length > 0) {
                     storeRenderItemsToGrid(cachedItems, 0);
                 } else {
                     grid.innerHTML = `<div style="color:var(--c-sub); font-family:monospace; font-size:11px; margin-top:100px; letter-spacing:2px; animation: pulseGreen 2s infinite alternate;">[ AWAITING NEURAL SYNC - TAP REFRESH ]</div>`;
                 }
             }
         }
         
         function storeRenderItemsToGrid(items, offsetBase) {
             const grid = document.getElementById('store-product-grid');
             items.forEach((p, i) => {
                 let index = i + offsetBase;
                 let rot = index % 2 === 0 ? '-2deg' : '2deg'; let tx = index % 2 === 0 ? '-15px' : '15px';
                 let isSelected = storeCartSet.has(p.id);
                 let btnClass = isSelected ? 'add-btn in-cart' : 'add-btn';
                 let iconSvg = isSelected ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"/></svg>` : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
         
                 const wrapper = document.createElement('div'); wrapper.className = 'item-container';
                 wrapper.style.cssText = `animation-delay: ${Math.min(i * 0.05, 0.8)}s;`;
                 
                 let imgTag = ''; let clickHandler = '';
                 if (p.type === 'frame') {
                     if (p.img) { imgTag = `<img src="${p.img}">`; } 
                     else {
                         imgTag = `<div class="ph-star-wrap"><div class="ph-star">✦</div><div class="ph-text">TAP FOR DESC</div></div><div class="ph-desc-layer" onclick="event.stopPropagation(); this.parentElement.classList.remove('show-desc')">${p.desc.replace(/\n/g, '<br>')}</div>`;
                         clickHandler = `onclick="this.classList.toggle('show-desc')"`;
                     }
                 } else {
                     if (p.img) { imgTag = `<img src="${p.img}">`; } 
                     else {
                         imgTag = `<div style="width:100%; height:100%; display:flex; justify-content:center; align-items:center; color:var(--c-gold); font-size:24px; opacity:0.6;">✦</div>`;
                         clickHandler = `onclick="showStoreProductDesc('${p.name.replace(/'/g, "\\'")}', '${p.desc.replace(/\n/g, '<br>').replace(/'/g, "\\'")}')"`;
                     }
                 }
         
                 let decorations = `<div class="dec-cross">+</div><div class="dec-sku">NO.${String(index + 1).padStart(3, '0')}</div><div class="dec-edge"></div><div class="dec-barcode">||| | || ||</div>`;
         
                 if (p.type === 'frame') {
                     wrapper.innerHTML = `
                         <div class="shape-frame" style="transform: translateX(${tx}) rotate(${rot});">
                             ${decorations}
                             <div class="s-image-box" ${clickHandler}>${imgTag}</div>
                             <div class="s-title">${p.name} <span>// ${p.subCat}</span></div>
                             <div class="s-desc" style="opacity: ${p.img ? 1 : 0}; height: ${p.img ? 'auto' : '0'}; margin:0;">${p.desc}</div>
                             <div class="s-price">¥ ${p.price.toLocaleString()}</div>
                             <div class="${btnClass}" onclick="toggleStoreCartItem(event, '${p.id}')">${iconSvg}</div>
                         </div>`;
                 } else {
                     wrapper.innerHTML = `
                         <div class="shape-capsule" style="transform: translateX(${tx});">
                             <div class="cap-img" ${clickHandler}>${imgTag}</div>
                             <div class="cap-info">
                                 <div class="cap-title">${p.name} <span>// ${p.subCat}</span></div>
                                 <div class="cap-price">¥ ${p.price.toLocaleString()}</div>
                             </div>
                             <div class="${btnClass}" onclick="toggleStoreCartItem(event, '${p.id}')">${iconSvg}</div>
                         </div>`;
                 }
                 grid.appendChild(wrapper);
             });
         }
         
         let storeTempCustomImg = '';
         function openStoreForgeModal() {
             storeTempCustomImg = '';
             document.getElementById('store-cf-preview-box').innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:8px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg> UPLOAD ASSET`;
             document.getElementById('store-cf-name').value = ''; document.getElementById('store-cf-desc').value = ''; document.getElementById('store-cf-price').value = '';
             document.getElementById('store-forge-modal').classList.add('active');
         }
         function closeStoreForgeModal() { document.getElementById('store-forge-modal').classList.remove('active'); }
         function readStoreCustomImg(input) {
             if(input.files && input.files[0]) {
                 let reader = new FileReader();
                 reader.onload = e => { 
                     // 🚀 核心修复：彻底废除 canvas 压缩裁剪逻辑，直接获取原图 Base64！
                     storeTempCustomImg = e.target.result; 
                     document.getElementById('store-cf-preview-box').innerHTML = `<img src="${storeTempCustomImg}" style="width:100%;height:100%;object-fit:cover;">`;
                 }
                 reader.readAsDataURL(input.files[0]);
             }
         }
         function createStoreCustomItem() {
             const name = document.getElementById('store-cf-name').value.trim(); const price = document.getElementById('store-cf-price').value.trim();
             if(!name || !price || !storeTempCustomImg) return alert("Image, Name and Price are required.");
             storeCustomDB.unshift({ id: 'custom_' + Date.now(), cat: storeCurrentMainCat, subCat: 'CUSTOM', type: 'frame', name: name, desc: document.getElementById('store-cf-desc').value.trim(), price: parseFloat(price), img: storeTempCustomImg });
             // 🚀 核心修复：接入 LocalDB 无限容量数据库，就算传几十MB原图也不会报“缓存满”错误了！
             LocalDB.setItem('soap_boutique_custom', JSON.stringify(storeCustomDB)).catch(e=>console.warn(e));
             try { localStorage.setItem('soap_boutique_custom', JSON.stringify(storeCustomDB)); } catch(e) {} 
             closeStoreForgeModal(); storeRenderProducts(true);
         }
         
         function openStoreCart() {
             closeStoreLogistics(); 
             const modal = document.getElementById('store-cart-modal'); const gallery = document.getElementById('store-cart-gallery'); gallery.innerHTML = '';
             
             // 重置赠送选项 UI
             storeRecipientMode = 'self';
             const rSelf = document.getElementById('store-recip-self');
             const rOther = document.getElementById('store-recip-other');
             if(rSelf) rSelf.classList.add('active');
             if(rOther) rOther.classList.remove('active');

             if (storeCartSet.size === 0) {
                 gallery.innerHTML = `<div style="width:100%; text-align:center; color:var(--c-sub); font-family:monospace; font-size:10px; margin-top:20px;">[ CART IS EMPTY ]</div>`;
                 document.getElementById('store-cart-total-price').innerText = '0';
                 document.getElementById('store-btn-pay').style.opacity = '0.3'; document.getElementById('store-btn-pay').style.pointerEvents = 'none';
             } else {
                 let total = 0; 
                 document.getElementById('store-btn-pay').style.opacity = '1'; document.getElementById('store-btn-pay').style.pointerEvents = 'auto'; document.getElementById('store-btn-pay').innerText = 'AUTHORIZE & PAY';
                 storeCartSet.forEach(itemId => {
                     let itemData = storeGlobalAiDB[itemId] || storeCustomDB.find(p => p.id === itemId);
                     if (itemData) {
                         total += itemData.price;
                         let imgTag = itemData.img ? `<img src="${itemData.img}">` : `<div style="width:100%; height:100%; display:flex; justify-content:center; align-items:center; color:var(--c-gold); font-size:24px;">✦</div>`;
                         gallery.innerHTML += `<div class="cart-item-card"><div class="cart-item-img">${imgTag}</div><div class="cart-item-name">${itemData.name}</div><div class="cart-item-price">¥ ${itemData.price.toLocaleString()}</div></div>`;
                     }
                 });
                 document.getElementById('store-cart-total-price').innerText = total.toLocaleString();
             }
             modal.classList.add('active');
         }
         function closeStoreCart() { document.getElementById('store-cart-modal').classList.remove('active'); }
         
         function setStoreOption(type, val) {
             if(type === 'pay') {
                 storePayMode = val; 
                 document.getElementById('store-pay-self').classList.remove('active'); 
                 document.getElementById('store-pay-proxy').classList.remove('active'); 
                 document.getElementById('store-pay-' + val).classList.add('active');
             } else if(type === 'notify') {
                 storeNotifyMode = val; 
                 document.getElementById('store-notify-no').classList.remove('active'); 
                 document.getElementById('store-notify-yes').classList.remove('active'); 
                 document.getElementById('store-notify-' + val).classList.add('active');
             } else if(type === 'recipient') {
                 storeRecipientMode = val;
                 document.getElementById('store-recip-self').classList.remove('active');
                 document.getElementById('store-recip-other').classList.remove('active');
                 document.getElementById('store-recip-' + val).classList.add('active');
             }
             // 只要是代付、通知、或者赠送，都需要显示联系人选择器
             const needsContact = (storePayMode === 'proxy' || storeNotifyMode === 'yes' || storeRecipientMode === 'other');
             document.getElementById('store-contact-row').style.display = needsContact ? 'flex' : 'none';
         }
         
         // 新增：用于记录等待送达的订单和关联联系人
         let storePendingDeliveryInfo = null; 
         
         function storePayOrder() {
             const btn = document.getElementById('store-btn-pay');
             btn.innerText = 'PROCESSING...'; btn.style.pointerEvents = 'none';
             
             setTimeout(() => {
                 let purchasedItems = []; let totalAmt = 0;
                 storeActiveOrderItems = Array.from(storeCartSet);
                 storeActiveOrderItems.forEach(itemId => {
                     let p = storeGlobalAiDB[itemId] || storeCustomDB.find(x => x.id === itemId);
                     if(p) { purchasedItems.push({ name: p.name, img: p.img, price: p.price }); totalAmt += p.price; }
                 });
         
                 let targetContactId = null;
                 if (storePayMode === 'proxy' || storeNotifyMode === 'yes') {
                     const activeCp = document.querySelector('#store-contact-picker .cp-item.active');
                     if (activeCp && activeCp.dataset.id) targetContactId = activeCp.dataset.id;
                 }
         
                 let itemsHtml = '';
                 purchasedItems.forEach(item => {
                     itemsHtml += `<div style="display:flex; justify-content:space-between; align-items:baseline; font-size:11px;"><span style="color:#EAE6DE; max-width:65%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.name}</span><span style="flex:1; border-bottom:1px dotted rgba(195,167,114,0.3); margin:0 8px; position:relative; top:-3px;"></span><span style="font-family:'Courier New',monospace; color:#858078;">¥ ${item.price.toLocaleString()}</span></div>`;
                 });
                 let safeItems = JSON.stringify(purchasedItems).replace(/'/g, "&#39;").replace(/"/g, "&quot;");
         
                 // ============ 分支 1：请求代付 (PROXY) ============
                 if (storePayMode === 'proxy' && targetContactId) {
                     let targetContact = contacts.find(c => c.id === targetContactId);
                     let itemNames = purchasedItems.map(i => i.name).join('、');
                     
                     let cardHtml = `
                     <div class="maison-proxy-card" data-items="${safeItems}" data-total="${totalAmt}" style="width:240px; background:linear-gradient(135deg, #111 0%, #1A1A1D 100%); border:0.5px solid rgba(195,167,114,0.3); border-radius:12px; box-shadow:0 15px 30px rgba(0,0,0,0.5); position:relative; overflow:hidden; display:flex; flex-direction:column; color:#EAE6DE; margin:5px 0;">
                         <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%) rotate(-15deg); font-family:'Didot',serif; font-size:40px; font-weight:900; font-style:italic; color:rgba(195,167,114,0.03); z-index:1; pointer-events:none;">MAISON</div>
                         <div style="position:relative; z-index:2; padding:20px 15px;">
                             <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:15px;">
                                 <div style="font-family:'Didot',serif; font-size:14px; font-weight:900; letter-spacing:1px; color:#C3A772;">SOAP MAISON</div>
                                 <div class="mp-badge-status" style="font-family:'Courier New',monospace; font-size:8px; font-weight:800; padding:2px 4px; border:1px solid #D32F2F; color:#D32F2F; border-radius:4px;">UNPAID</div>
                             </div>
                             <div class="mp-title-text" style="font-size:9px; color:#858078; font-weight:700; letter-spacing:1px; margin-bottom:10px;">PROXY REQUEST // 代付请求</div>
                             <div style="display:flex; flex-direction:column; gap:6px;">${itemsHtml}</div>
                             <div style="width:100%; height:1px; background:repeating-linear-gradient(to right, rgba(195,167,114,0.2) 0, rgba(195,167,114,0.2) 4px, transparent 4px, transparent 8px); margin:12px 0;"></div>
                             <div style="display:flex; justify-content:space-between; align-items:flex-end;">
                                 <span style="font-family:'Courier New',monospace; font-size:9px; color:#C3A772; font-weight:800;">TOTAL</span>
                                 <span style="font-family:'Didot',serif; font-size:20px; font-weight:900; color:#C3A772;">¥ ${totalAmt.toLocaleString()}</span>
                             </div>
                         </div>
                         <div style="background:rgba(0,0,0,0.4); border-top:1px solid rgba(195,167,114,0.1); padding:12px 15px; position:relative; z-index:2;">
                             <button class="mp-btn-action" onclick="handleMaisonAction(this)" style="width:100%; background:#C3A772; color:#000; border:none; padding:10px 0; border-radius:6px; font-family:'Courier New',monospace; font-size:10px; font-weight:800; cursor:pointer; display:flex; justify-content:center; align-items:center; gap:6px;"><svg style="width:14px; height:14px; stroke-width:2.5;" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> AUTHORIZE & PAY</button>
                         </div>
                     </div><img src="1" onerror="this.parentNode.classList.add('bubble-clear'); this.remove();">`;
         
                     let aiPrompt = `[系统通报：用户在 SOAP MAISON 高定商店选购了 ${itemNames}（总价 ¥${totalAmt.toLocaleString()}），并将未支付的账单发给你请求代付。请结合人设给出反应！如果是霸气代付或宠溺同意，请附带 <accept> 标签；如果是嫌贵/生气/驳回，请附带 <reject> 标签。]`;
         
                     targetContact.history.push({ role: 'user', content: cardHtml.replace(/\n\s+/g, ''), isRevoked: false, timestamp: Date.now() });
                     targetContact.history.push({ role: 'system_sum', content: `<i>✧ 你向 ${targetContact.name} 发送了一份代付请求。</i>\n<span style="display:none;">${aiPrompt}</span>`});
                     
                     saveData();
                     storeCartSet.clear(); document.getElementById('store-cart-dot').classList.remove('show');
                     storeRenderProducts(storeCurrentSubCat === 'CUSTOM'); 
                     closeStoreCart();
                     
                     // 跳转！瞬间切回聊天界面
                     openApp('messages');
                     setTimeout(() => { openChat(targetContactId); }, 100);
         
                 // ============ 分支 2：自己付款 (SELF) ============
                 } else {
                     storeCurrentOrderId = 'SP-' + Math.floor(Math.random() * 90000 + 10000) + 'X';
                     document.getElementById('store-rand-order').innerText = storeCurrentOrderId;
                     
                     // 记录订单历史
                     storeOrderHistory.unshift({ id: storeCurrentOrderId, date: new Date().toLocaleString(), total: totalAmt, items: purchasedItems });
                     if(storeOrderHistory.length > 20) storeOrderHistory.pop(); 
                     try { localStorage.setItem('soap_boutique_history', JSON.stringify(storeOrderHistory)); } catch(e){}
         
                     // --- 新增：赠送逻辑 ---
                     if (storeRecipientMode === 'other' && targetContactId) {
                         let targetContact = contacts.find(c => c.id === targetContactId);
                         let itemNames = purchasedItems.map(i => i.name).join('、');
                         let storeName = storeCurrentMainCat || "SOAP MAISON";

                         let giftHtml = `
                         <div class="maison-gift-card" data-store="${storeName}" data-items="${safeItems}" data-total="${totalAmt}" style="width:240px; background:linear-gradient(135deg, #111 0%, #1A1A1D 100%); border:0.5px solid rgba(195,167,114,0.3); border-radius:12px; box-shadow:0 15px 30px rgba(0,0,0,0.5); position:relative; overflow:hidden; display:flex; flex-direction:column; color:#EAE6DE; margin:5px 0;">
                             <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%) rotate(-15deg); font-family:'Didot',serif; font-size:40px; font-weight:900; font-style:italic; color:rgba(195,167,114,0.03); z-index:1; pointer-events:none;">GIFT</div>
                             <div style="position:relative; z-index:2; padding:20px 15px;">
                                 <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:15px;">
                                     <div style="font-family:'Didot',serif; font-size:14px; font-weight:900; letter-spacing:1px; color:#C3A772;">${storeName}</div>
                                     <div class="mg-badge-status" style="font-family:'Courier New',monospace; font-size:8px; font-weight:800; padding:2px 4px; border:1px solid #C3A772; color:#C3A772; border-radius:4px;">GIFT</div>
                                 </div>
                                 <div class="mp-title-text" style="font-size:9px; color:#858078; font-weight:700; letter-spacing:1px; margin-bottom:10px;">GIFT FROM USER // 专属礼物</div>
                                 <div style="display:flex; flex-direction:column; gap:6px;">${itemsHtml}</div>
                                 <div style="width:100%; height:1px; background:repeating-linear-gradient(to right, rgba(195,167,114,0.2) 0, rgba(195,167,114,0.2) 4px, transparent 4px, transparent 8px); margin:12px 0;"></div>
                                 <div style="display:flex; justify-content:space-between; align-items:flex-end;">
                                     <span style="font-family:'Courier New',monospace; font-size:9px; color:#C3A772; font-weight:800;">TOTAL</span>
                                     <span style="font-family:'Didot',serif; font-size:20px; font-weight:900; color:#C3A772;">¥ ${totalAmt.toLocaleString()}</span>
                                 </div>
                             </div>
                             <div class="mg-action-bar" style="background:rgba(0,0,0,0.4); border-top:1px solid rgba(195,167,114,0.1); padding:12px 15px; position:relative; z-index:2; display:flex; gap:10px;">
                                 <button class="mg-btn-accept" onclick="handleGiftAction(this, 'accept')" style="flex:1; background:#C3A772; color:#000; border:none; padding:10px 0; border-radius:6px; font-family:'Courier New',monospace; font-size:10px; font-weight:800; cursor:pointer;">ACCEPT</button>
                                 <button class="mg-btn-reject" onclick="handleGiftAction(this, 'reject')" style="flex:1; background:transparent; color:#858078; border:1px solid #858078; padding:10px 0; border-radius:6px; font-family:'Courier New',monospace; font-size:10px; font-weight:800; cursor:pointer;">DECLINE</button>
                             </div>
                         </div><img src="1" onerror="this.parentNode.classList.add('bubble-clear'); this.remove();">`;

                         let aiPrompt = `[系统通报：用户在 SOAP MAISON 购买了 ${itemNames} 作为礼物送给你（已全额付款）。请结合人设给出反应！如果是开心收下请附带 <accept> 标签；如果是拒绝，请附带 <reject> 标签。]`;

                         targetContact.history.push({ role: 'user', content: giftHtml.replace(/\n\s+/g, ''), isRevoked: false, timestamp: Date.now() });
                         targetContact.history.push({ role: 'system_sum', content: `<i>✧ 你为 ${targetContact.name} 购买了一份惊喜礼物。</i>\n<span style="display:none;">${aiPrompt}</span>`});
                         
                         saveData();
                         storeCartSet.clear(); document.getElementById('store-cart-dot').classList.remove('show');
                         storeRenderProducts(storeCurrentSubCat === 'CUSTOM'); 
                         closeStoreCart();
                         openApp('messages');
                         setTimeout(() => { openChat(targetContactId); }, 100);
                         return; // 结束执行，不再走下方的物流逻辑
                     }

                     if (storeNotifyMode === 'yes' && targetContactId) {
                         let targetContact = contacts.find(c => c.id === targetContactId);
                         let itemNames = purchasedItems.map(i => i.name).join('、');
                         
                         let cardHtml = `
                         <div class="maison-proxy-card" style="width:240px; background:linear-gradient(135deg, #111 0%, #1A1A1D 100%); border:0.5px solid rgba(195,167,114,0.3); border-radius:12px; box-shadow:0 15px 30px rgba(0,0,0,0.5); position:relative; overflow:hidden; display:flex; flex-direction:column; color:#EAE6DE; margin:5px 0;">
                             <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%) rotate(-15deg); font-family:'Didot',serif; font-size:40px; font-weight:900; font-style:italic; color:rgba(195,167,114,0.03); z-index:1; pointer-events:none;">MAISON</div>
                             <div style="position:relative; z-index:2; padding:20px 15px;">
                                 <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:15px;">
                                     <div style="font-family:'Didot',serif; font-size:14px; font-weight:900; letter-spacing:1px; color:#C3A772;">SOAP MAISON</div>
                                     <div class="mp-badge-status" style="font-family:'Courier New',monospace; font-size:8px; font-weight:800; padding:2px 4px; border:1px solid #34C759; color:#34C759; border-radius:4px;">PAID</div>
                                 </div>
                                 <div class="mp-title-text" style="font-size:9px; color:#858078; font-weight:700; letter-spacing:1px; margin-bottom:10px;">ORDER RECEIPT // 订单明细</div>
                                 <div style="display:flex; flex-direction:column; gap:6px;">${itemsHtml}</div>
                                 <div style="width:100%; height:1px; background:repeating-linear-gradient(to right, rgba(195,167,114,0.2) 0, rgba(195,167,114,0.2) 4px, transparent 4px, transparent 8px); margin:12px 0;"></div>
                                 <div style="display:flex; justify-content:space-between; align-items:flex-end;">
                                     <span style="font-family:'Courier New',monospace; font-size:9px; color:#C3A772; font-weight:800;">TOTAL</span>
                                     <span style="font-family:'Didot',serif; font-size:20px; font-weight:900; color:#C3A772;">¥ ${totalAmt.toLocaleString()}</span>
                                 </div>
                             </div>
                             <div style="background:rgba(0,0,0,0.4); border-top:1px solid rgba(195,167,114,0.1); padding:12px 15px; position:relative; z-index:2;">
                                 <button style="width:100%; background:transparent; color:#C3A772; border:1px dashed rgba(195,167,114,0.4); padding:10px 0; border-radius:6px; font-family:'Courier New',monospace; font-size:10px; font-weight:800; pointer-events:none;">ASSETS SECURED</button>
                             </div>
                         </div><img src="1" onerror="this.parentNode.classList.add('bubble-clear'); this.remove();">`;
         
                         let aiPrompt = `[系统通报：用户在 SOAP MAISON 高定商店自己付钱购买了 ${itemNames}（总价 ¥${totalAmt.toLocaleString()}），并将已支付的账单发给你看。请结合人设自然地聊起这个话题，例如夸赞品味或询问买来干嘛。]`;
                         
                         targetContact.history.push({ role: 'user', content: cardHtml.replace(/\n\s+/g, ''), isRevoked: false, timestamp: Date.now() });
                         targetContact.history.push({ role: 'system_sum', content: `<i>✧ 你向 ${targetContact.name} 展示了你的新资产。</i>\n<span style="display:none;">${aiPrompt}</span>`});
                         
                         storePendingDeliveryInfo = { contactId: targetContactId, items: itemNames };
                         saveData();
                     } else if (purchasedItems.length > 0) {
                         let itemNames = purchasedItems.map(i => i.name).join('、');
                         storePendingDeliveryInfo = { contactId: 'me', items: itemNames };
                     }
         
                     storeCartSet.clear(); document.getElementById('store-cart-dot').classList.remove('show');
                     storeRenderProducts(storeCurrentSubCat === 'CUSTOM'); 
                     closeStoreCart();
                     document.getElementById('store-logistics-dot').classList.add('active');
                     storeStartLogisticsEngine();
                     setTimeout(() => { openStoreLogistics(); }, 400);
                 }
             }, 800);
         }
         
         function openStoreLogistics() { closeStoreCart(); document.getElementById('store-logistics-modal').classList.add('active'); switchStoreTrackerTab('current'); }
         function closeStoreLogistics() { document.getElementById('store-logistics-modal').classList.remove('active'); }
         
         function switchStoreTrackerTab(tab) {
             document.getElementById('store-tab-current').classList.remove('active'); document.getElementById('store-tab-archive').classList.remove('active');
             document.getElementById('store-tab-' + tab).classList.add('active');
             if (tab === 'current') {
                 document.getElementById('store-tracker-current-view').style.display = 'flex'; document.getElementById('store-tracker-archive-view').style.display = 'none';
                 renderStoreCurrentLogistics();
             } else {
                 document.getElementById('store-tracker-current-view').style.display = 'none'; document.getElementById('store-tracker-archive-view').style.display = 'block';
                 renderStoreArchiveLogs();
             }
         }
         
         function renderStoreCurrentLogistics() {
             const gallery = document.getElementById('store-logistics-gallery'); gallery.innerHTML = '';
             if (storeActiveOrderItems.length === 0) {
                 gallery.innerHTML = `<div style="width:100%; text-align:center; color:var(--c-sub); font-family:monospace; font-size:10px; margin-top:20px;">[ NO ACTIVE DISPATCH ]</div>`;
                 document.getElementById('store-btn-instant').style.display = 'none'; document.getElementById('store-tracking-area').style.display = 'none'; document.getElementById('store-rand-order').innerText = 'STANDBY';
             } else {
                 document.getElementById('store-rand-order').innerText = storeCurrentOrderId; document.getElementById('store-tracking-area').style.display = 'flex';
                 storeActiveOrderItems.forEach(itemId => {
                     const itemData = storeGlobalAiDB[itemId] || storeCustomDB.find(p => p.id === itemId);
                     if (itemData) {
                         let imgTag = itemData.img ? `<img src="${itemData.img}">` : `<div style="width:100%; height:100%; display:flex; justify-content:center; align-items:center; color:var(--c-gold); font-size:24px;">✦</div>`;
                         gallery.innerHTML += `<div class="cart-item-card"><div class="cart-item-img">${imgTag}</div><div class="cart-item-name">${itemData.name}</div><div class="cart-item-price">¥ ${itemData.price.toLocaleString()}</div></div>`;
                     }
                 });
                 if (document.getElementById('store-tl-3').classList.contains('active') === false) document.getElementById('store-btn-instant').style.display = 'block';
             }
         }
         
         function renderStoreArchiveLogs() {
             const list = document.getElementById('store-archive-list'); list.innerHTML = '';
             if (storeOrderHistory.length === 0) { list.innerHTML = `<div style="text-align:center; color:var(--c-sub); font-family:monospace; font-size:10px; margin-top:40px;">[ NO ARCHIVE FOUND ]</div>`; return; }
             storeOrderHistory.forEach(order => {
                 let imgsHtml = '';
                 let detailsHtml = '';
                 
                 // 同时生成顶部的缩略图画廊，和底部的文字清单
                 order.items.forEach(item => { 
                     let imgContent = item.img ? `<img src="${item.img}">` : '✦';
                     imgsHtml += `<div class="ac-img">${imgContent}</div>`; 
                     detailsHtml += `<div class="ac-detail-item"><div class="ac-di-img">${imgContent}</div><div class="ac-di-name">${item.name}</div><div class="ac-di-price">¥ ${item.price.toLocaleString()}</div></div>`;
                 });
                 
                 // 绑定点击事件，通过切换 class 来实现顺滑展开
                 list.innerHTML += `
                 <div class="archive-card" onclick="this.classList.toggle('expanded')">
                     <div class="ac-header"><span>${order.date}</span><span>${order.id}</span></div>
                     <div class="ac-gallery">${imgsHtml}</div>
                     <div class="ac-footer">
                         <span class="ac-expand-icon">▼ DETAILS</span>
                         ¥ ${order.total.toLocaleString()}
                     </div>
                     <div class="ac-details">${detailsHtml}</div>
                 </div>`;
             });
         }
         
         // 终极送达：将物品写入 AI 核心记忆并强制小剧场互动
         function onStoreDeliveryComplete() {
             if (storePendingDeliveryInfo && storePendingDeliveryInfo.contactId) {
                 let timeStr = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
                 let itemStr = storePendingDeliveryInfo.items;
         
                 if (storePendingDeliveryInfo.contactId === 'me') {
                     // 🌟 核心拦截：自己买给自己的，绝不惊动AI，只弹出手机系统的顶部横幅通知
                     showToast("SOAP MAISON", `您选购的 [${itemStr}] 已成功送达，请查收。`, "", null, 8000);
                 } else {
                     let c = contacts.find(x => x.id === storePendingDeliveryInfo.contactId);
                     if (c) {
                         // 1. 在聊天室发送送达回执
                         c.history.push({role: 'system_sum', content: `<i>✧ [物流通报] 选购的精品资产 (${itemStr}) 已于 ${timeStr} 成功送达。</i>`});
                         
                         // 2. 暴力植入核心记忆！
                         // 加入绝对的强制要求，AI 在线下小剧场模式时，一定会把目光落在你买的这件东西上！
                         let memoryStr = `[系统最高指令：物品送达事件]：现实时间 ${timeStr}，名为 "${itemStr}" 的物品已送达给用户。如果是衣服首饰美妆，用户现在可能已经换上/涂上了；如果是家具摆件，已经摆在房间里了。\n【必须执行】：在后续的对话，特别是“线下小剧场”中，请找一个极其自然的切入点（例如你的目光扫过、眼神打量、动作互动等），主动提一嘴这个新到的物品（比如夸赞颜色、质感，或者询问感受），让用户感受到你真切地注意到了它！`;
                         
                         c.memory = (c.memory ? c.memory + "\n\n" : "") + memoryStr;
                         saveData();
                         
                         // 如果当前正好停在这个角色的聊天界面，立刻刷新
                         if (currentContactId === c.id) renderChatHistory();
                     }
                 }
             }
             // 处理完后清空任务
             storePendingDeliveryInfo = null; 
         }
         
         function storeStartLogisticsEngine() {
             storeTimelineTimeouts.forEach(clearTimeout); storeTimelineTimeouts = []; const now = new Date();
             const t1 = document.getElementById('store-tl-1'); const t2 = document.getElementById('store-tl-2'); const t3 = document.getElementById('store-tl-3');
             t1.className = 'timeline-row active current'; t2.className = 'timeline-row'; t3.className = 'timeline-row';
             document.getElementById('store-time-1').innerText = now.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
             document.getElementById('store-time-2').innerText = ''; document.getElementById('store-time-3').innerText = '';
             
             let to1 = setTimeout(() => {
                 t1.classList.remove('current'); t2.classList.add('active', 'current');
                 document.getElementById('store-time-2').innerText = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
             }, 5 * 60 * 1000); 
         
             let to2 = setTimeout(() => {
                 t2.classList.remove('current'); t3.classList.add('active');
                 document.getElementById('store-time-3').innerText = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
                 document.getElementById('store-btn-instant').style.display = 'none'; document.getElementById('store-logistics-dot').classList.remove('active'); 
                 
                 // 物流真正到达，触发记忆植入
                 onStoreDeliveryComplete();
             }, 15 * 60 * 1000); 
             storeTimelineTimeouts.push(to1, to2);
         }
         
         function storeInstantDelivery() {
             if(storeActiveOrderItems.length === 0) return;
             storeTimelineTimeouts.forEach(clearTimeout); storeTimelineTimeouts = []; const now = new Date();
             document.getElementById('store-tl-1').className = 'timeline-row active'; document.getElementById('store-tl-2').className = 'timeline-row active'; document.getElementById('store-tl-3').className = 'timeline-row active';
             document.getElementById('store-time-1').innerText = now.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
             document.getElementById('store-time-2').innerText = new Date(now.getTime() + 5*60000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
             document.getElementById('store-time-3').innerText = new Date(now.getTime() + 15*60000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
             document.getElementById('store-btn-instant').style.display = 'none'; document.getElementById('store-logistics-dot').classList.remove('active'); 
             
             // 瞬间到达，触发记忆植入
             onStoreDeliveryComplete();
         }
             // ================= API 预设库管理逻辑 =================
         function openApiPresetManager() {
             const list = document.getElementById('api-preset-list');
             list.innerHTML = '';
             if(!gConfig.apiPresets || gConfig.apiPresets.length === 0) {
                 list.innerHTML = '<div style="text-align:center; padding:20px; color:var(--c-gray-dark); font-size:12px;">暂无预设。<br>请先在后方填好 URL 和 Key，然后点击右上角保存。</div>';
             } else {
                 gConfig.apiPresets.forEach((p, idx) => {
                     const item = document.createElement('div');
                     item.style.cssText = "background:rgba(0,0,0,0.03); padding:12px 16px; border-radius:12px; display:flex; justify-content:space-between; align-items:center;";
                     
                     let isCurrent = (p.url === gConfig.apiUrl && p.key === gConfig.apiKey);
                     
                     item.innerHTML = `
                         <div style="display:flex; flex-direction:column; gap:4px; flex:1; cursor:pointer;" onclick="applyApiPreset(${idx})">
                             <div style="font-weight:800; font-size:14px; color:${isCurrent ? '#007AFF' : 'var(--c-black)'}; display:flex; align-items:center; gap:6px;">
                                 ${p.name} ${isCurrent ? '<span style="font-size:10px; background:rgba(0,122,255,0.1); padding:2px 6px; border-radius:4px;">当前使用</span>' : ''}
                             </div>
                             <div style="font-family:monospace; font-size:10px; color:var(--c-gray-dark); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:200px;">${p.url}</div>
                         </div>
                         <div style="color:#FF3B30; padding:10px; cursor:pointer; flex-shrink:0;" onclick="deleteApiPreset(${idx})">
                             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                         </div>
                     `;
                     list.appendChild(item);
                 });
             }
             document.getElementById('api-preset-sheet').classList.add('active');
         }
         
         function closeApiPresetManager() {
             document.getElementById('api-preset-sheet').classList.remove('active');
         }
         
         function saveCurrentApiAsPreset() {
             const url = document.getElementById('api-url').value.trim();
             const key = document.getElementById('api-key').value.trim();
             if(!url || !key) return alert("请先在后方输入框填好 Base URL 和 API Key！");
             
             const name = prompt("给这个 API 预设起个名字（例如：DeepSeek, 硅基流动等）：");
             if(name && name.trim()) {
                 if(!gConfig.apiPresets) gConfig.apiPresets = [];
                 gConfig.apiPresets.push({ name: name.trim(), url: url, key: key });
                 saveGlobal();
                 openApiPresetManager(); 
             }
         }
         
         function applyApiPreset(idx) {
             if(!gConfig.apiPresets || !gConfig.apiPresets[idx]) return;
             const p = gConfig.apiPresets[idx];
             document.getElementById('api-url').value = p.url;
             document.getElementById('api-key').value = p.key;
             saveGlobal(); 
             closeApiPresetManager();
             
             // 自动拉取模型列表，行云流水
             setTimeout(() => { fetchModels(); }, 300);
         }
