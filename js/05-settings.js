function saveData() { 
    debouncedSave(); 
}
         
async function exportData(type = 'all') {
    const btnCard = event.currentTarget;
    const originalHtml = btnCard.innerHTML;
    try {
        btnCard.style.pointerEvents = 'none';
        btnCard.innerHTML = '<div class="db-icon"><i class="fa-solid fa-spinner fa-spin"></i></div><div class="db-info"><span class="db-main">内存脱水...</span><span class="db-sub">Processing</span></div>';

        // 🚀 核心优化：使用 BlobParts 数组分段存储，避免产生巨大的中间字符串
        const blobParts = ['{"_isSoapBackup":true,"exportTime":' + Date.now() + ',"exportType":"' + type + '"'];
        let fileNamePrefix = 'SOAP_Full_Backup';

        if (type === 'all') {
            blobParts.push(',"fullDB":{');
            const db = await new Promise(res => { const req = indexedDB.open('SoapOS__DB', 1); req.onsuccess = e => res(e.target.result); });
            const tx = db.transaction('kv', 'readonly');
            const store = tx.objectStore('kv');
            const allKeys = await new Promise(res => { const req = store.getAllKeys(); req.onsuccess = () => res(req.result); });
            
            for (let i = 0; i < allKeys.length; i++) {
                const key = allKeys[i];
                let val = await LocalDB.getItem(key);
                // 🚀 关键：如果 val 已经是字符串（存储时已 JSON.stringify），直接拼接，不重复序列化
                const entry = `"${key}":${(typeof val === 'string' && val.startsWith('{')) ? val : JSON.stringify(val)}${i === allKeys.length - 1 ? '' : ','}`;
                blobParts.push(entry);
                val = null; // 立即释放内存
                if (i % 5 === 0) await new Promise(r => setTimeout(r, 10)); // 每5个条目喘息一次
            }
            db.close();
            blobParts.push(',"wbCategories":' + (localStorage.getItem('wbCategories') || '["默认","设定","人物","物品"]'));
            blobParts.push('},"localStorage":' + JSON.stringify(localStorage));
        } else {
            // 局部导出也采用分段法
            blobParts.push(',"data":');
            let partialData = {};
            if (type === 'chat') { partialData = { contacts, masks, worldbooks, phoneLogs, wbCategories: JSON.parse(localStorage.getItem('wbCategories') || '[]') }; fileNamePrefix = 'SOAP_Chat_Backup'; }
            else if (type === 'social') { partialData = { twData, momentsData, followedUsers: Array.from(followedUsers) }; fileNamePrefix = 'SOAP_Social_Backup'; }
            else if (type === 'sys') { partialData = { gConfig, wgData, artWidgetData }; fileNamePrefix = 'SOAP_Sys_Backup'; }
            blobParts.push(JSON.stringify(partialData));
            partialData = null;
        }
        
        blobParts.push('}');

        // 🚀 终极内存释放：直接将零件数组转为 Blob，浏览器会自动处理内存映射
        const blob = new Blob(blobParts, { type: 'application/json' });
        blobParts.length = 0; // 清空数组引用

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileNamePrefix}_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        alert(`✅ 导出成功！\n文件已保存至下载列表 (${(blob.size/1024/1024).toFixed(2)}MB)`);
    } catch (e) {
        console.error("Export Error:", e);
        alert("❌ 导出失败: " + e.message);
    } finally {
        btnCard.style.pointerEvents = 'auto';
        btnCard.innerHTML = originalHtml;
    }
}
         
async function importData(e) {
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = async function(evt) {
        try {
            const parsed = JSON.parse(evt.target.result);
            console.log("📥 开始解析备份文件...", parsed);
            
            // 1. 定义核心迁移助手
            const migrateContacts = (arr) => {
                if (!Array.isArray(arr)) return arr;
                return arr.map(c => {
                    if (c.theaterHistory && Array.isArray(c.theaterHistory)) {
                        const hasTheater = c.history && c.history.some(m => m.isTheater);
                        if (!hasTheater) {
                            c.theaterHistory.forEach(tm => {
                                tm.isTheater = true;
                                if(!tm._id) tm._id = 'mig_' + Math.random().toString(36).substr(2, 5);
                                if(!c.history) c.history = [];
                                c.history.push(tm);
                            });
                            c.history.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
                        }
                    }
                    return c;
                });
            };

            const migrateStickers = (obj) => {
                if (!obj) return obj;
                if (obj.stickers && !obj.stickerGroups) {
                    obj.stickerGroups = obj.stickers.map(oldG => ({
                        id: 'g' + Math.random().toString(36).substr(2, 5),
                        name: oldG.group || '导入分组',
                        stickers: oldG.items || [],
                        access: []
                    }));
                    delete obj.stickers;
                }
                return obj;
            };

            // 2. 建立全版本键名映射表
            const legacyMap = {
                'contacts': 'soap_contacts_v28', 'soap_contacts_v27': 'soap_contacts_v28',
                'masks': 'soap_masks_v28', 'soap_masks_v27': 'soap_masks_v28',
                'worldbooks': 'soap_worldbooks_v28', 'soap_worldbooks_v27': 'soap_worldbooks_v28',
                'gConfig': 'soap_global_v28', 'soap_global_v27': 'soap_global_v28',
                'wgData': 'soap_widget_v28', 'soap_widget_v27': 'soap_widget_v28',
                'artWidgetData': 'soap_art_widget_v1',
                'twData': 'soap_tw_data_v2', 'soap_tw_data_v1': 'soap_tw_data_v2',
                'momentsData': 'soap_moments_data_v1',
                'followedUsers': 'soap_followed_users_v1',
                'phoneLogs': 'soap_phonelogs_v28',
                'm_db': 'soap_music_db_v1', 'soap_music_db_v1': 'soap_music_db_v1'
            };

            // 3. 提取真实数据源
            let dataPool = {};
            if (parsed.fullDB) {
                dataPool = parsed.fullDB;
            } else if (parsed.data) {
                dataPool = parsed.data;
            } else {
                dataPool = parsed;
            }

            // 4. 执行异步导入循环
            for (let sourceKey in dataPool) {
                if (['_isSoapBackup', 'exportTime', 'exportType', 'localStorage'].includes(sourceKey)) continue;
                
                // 世界书分类数据直接写入 localStorage，不进 IndexedDB
                if (sourceKey === 'wbCategories') {
                    let catData = dataPool[sourceKey];
                    if (typeof catData === 'string') {
                        localStorage.setItem('wbCategories', catData);
                    } else if (Array.isArray(catData)) {
                        localStorage.setItem('wbCategories', JSON.stringify(catData));
                    }
                    continue;
                }

                let targetKey = legacyMap[sourceKey] || sourceKey;
                let rawValue = dataPool[sourceKey];
                let finalData = rawValue;

                // 尝试解析字符串化的 JSON
                if (typeof rawValue === 'string' && (rawValue.startsWith('[') || rawValue.startsWith('{'))) {
                    try { finalData = JSON.parse(rawValue); } catch(e) {}
                }

                // 执行特定迁移
                if (targetKey === 'soap_contacts_v28') finalData = migrateContacts(finalData);
                if (targetKey === 'soap_global_v28') finalData = migrateStickers(finalData);

                // 写入 IndexedDB
                await LocalDB.setItem(targetKey, (typeof finalData === 'object') ? JSON.stringify(finalData) : finalData);
            }

            // 5. 恢复 LocalStorage 辅助数据
            if (parsed.localStorage) {
                for (let lk in parsed.localStorage) {
                    localStorage.setItem(lk, parsed.localStorage[lk]);
                }
            }

            alert("✅ 数据导入成功！已兼容旧版表情包、聊天记录与设定。\n系统即将自动重启。"); 
            window.location.reload();
        } catch(error) { 
            console.error("Import Error:", error);
            alert("❌ 导入失败：文件解析出错。\n" + error.message); 
        }
    };
    reader.readAsText(file);
}


// 🚨 终极毁灭引擎：清除所有系统数据
async function clearAllSystemData() {
    if (!confirm("🚨 警告：确定要清除所有系统数据并恢复出厂设置吗？\n所有聊天记录、人设、图片和推特数据都将永久丢失！此操作不可逆！")) return;
    if (!confirm("再次确认：真的要全部清空吗？建议先使用上方的导出功能备份数据！")) return;

    localStorage.clear();

    try {
        // 核心修复：使用原生 IndexedDB 接口删除名为 SoapOS__DB 的数据库
        const req = indexedDB.deleteDatabase('SoapOS__DB');
        req.onsuccess = () => {
            alert("系统已重置，所有本地缓存已清空。即将重启。");
            window.location.reload();
        };
        req.onerror = () => {
            console.error("数据库删除受阻");
            window.location.reload();
        };
    } catch(e) {
        window.location.reload();
    }
}
         
         // ================= 数据防清理免死金牌引擎 =================
         async function requestPersistentStorage(btn) {
             if (navigator.storage && navigator.storage.persist) {
                 try {
                     // 检查是否已经获得了持久化授权
                     let isPersisted = await navigator.storage.persisted();
                     if (!isPersisted) {
                         // 如果没有，向浏览器申请
                         isPersisted = await navigator.storage.persist();
                     }
                     
                     if (isPersisted) {
                         btn.innerHTML = '✅ 防清理保护已激活';
                         btn.style.color = '#34C759'; // 变绿
                         btn.style.background = 'rgba(52, 199, 89, 0.1)';
                         alert("保护开启成功！\n浏览器已将此网页的数据标记为【永久存储】。除非你手动清理浏览器缓存或卸载重装，否则系统不会再自动清空你的数据了！");
                     } else {
                         btn.innerHTML = '⚠️ 浏览器拒绝了保护请求';
                         btn.style.color = '#FF3B30';
                         alert("开启失败！\n部分浏览器（或无痕模式）禁止网页锁定存储。建议：\n1. 将此网页【添加到主屏幕】变成独立App后再试。\n2. 不要使用无痕模式。\n3. 定期使用下方的导出功能备份数据！");
                     }
                 } catch (error) {
                     console.error("持久化请求失败:", error);
                 }
             } else {
                 alert("你当前的浏览器太老了，不支持防清理协议，请定期手动备份！");
             }
         }
         
         function toggleFullscreen() { const isChecked = document.getElementById('setting-fullscreen').checked; localStorage.setItem('g_fullscreen', isChecked); if(isChecked) document.getElementById('main-frame').classList.add('fullscreen-mode'); else document.getElementById('main-frame').classList.remove('fullscreen-mode'); }
         
         function initLockScreen() {
             const lockScreen = document.getElementById('lock-screen');
             if (!lockScreen) return;
         
             // 🌟 动态生成呼吸星尘
             const layer = document.getElementById('ls-stardust-layer');
             if (layer) {
                 for(let i = 0; i < 35; i++) {
                     let dot = document.createElement('div');
                     dot.className = 'ls-dust-dot';
                     let size = Math.random() * 1.5 + 0.5;
                     dot.style.width = size + 'px'; dot.style.height = size + 'px';
                     dot.style.left = Math.random() * 100 + '%'; dot.style.top = Math.random() * 100 + '%';
                     dot.style.animation = `twinkle ${Math.random() * 3 + 2}s infinite alternate ${Math.random() * 2}s`;
                     layer.appendChild(dot);
                 }
                 for(let i = 0; i < 10; i++) {
                     let star = document.createElement('div');
                     star.className = 'ls-dust-star'; star.innerText = '✦';
                     star.style.fontSize = Math.random() * 6 + 4 + 'px';
                     star.style.left = Math.random() * 100 + '%'; star.style.top = Math.random() * 100 + '%';
                     star.style.animation = `twinkle ${Math.random() * 4 + 2}s infinite alternate ${Math.random() * 2}s`;
                     layer.appendChild(star);
                 }
             }
         
             // ================= 核心解锁逻辑 =================
function triggerUnlock() {
    document.getElementById('ls-auth-input').blur();
    lockScreen.classList.add('unlocking');
    setTimeout(() => { 
        lockScreen.classList.add('fade-out');
        // 核心：在锁屏完全消失后，检查是否需要弹出更新公告
        setTimeout(checkUpdateNotice, 500);
    }, 800);
}
         
             // --- 隐藏星象密码 (2-1-2) ---
             const cNodes = document.querySelectorAll('.ls-c-node');
             const cZone = document.getElementById('ls-const-zone');
             const path12 = document.getElementById('ls-path-1-2');
             const path23 = document.getElementById('ls-path-2-3');
             let cCode = [];
             
             const starTypes = ['☆', '★'];
             cNodes.forEach(node => {
                 node.innerText = starTypes[Math.floor(Math.random() * starTypes.length)];
                 node.addEventListener('click', (e) => {
                     e.stopPropagation();
                     node.classList.add('glow');
                     cCode.push(node.dataset.val);
         
                     let len = cCode.length;
                     if (len >= 2) {
                         let lastTwo = cCode[len-2] + cCode[len-1];
                         if (lastTwo === "12" || lastTwo === "21") path12.classList.add('active');
                         if (lastTwo === "23" || lastTwo === "32") path23.classList.add('active');
                     }
         
                     if (cCode.length === 3) {
                         if (cCode.join('') === "212") triggerUnlock();
                         else {
                             cZone.classList.add('error');
                             setTimeout(() => {
                                 cZone.classList.remove('error');
                                 cNodes.forEach(n => n.classList.remove('glow'));
                                 path12.classList.remove('active');
                                 path23.classList.remove('active');
                                 cCode = [];
                             }, 400);
                         }
                     }
                 });
             });
         
             // --- 散落几何密码 (0111) ---
             const inputField = document.getElementById('ls-auth-input');
             const slots = document.querySelectorAll('.ls-slot');
             const matrix = document.getElementById('ls-auth-matrix');
             const mLinks = [document.getElementById('ls-mlink-1'), document.getElementById('ls-mlink-2'), document.getElementById('ls-mlink-3')];
             const hintMsg = document.getElementById('ls-auth-hint');
         
             lockScreen.addEventListener('click', (e) => {
                 if (!e.target.closest('.ls-const')) inputField.focus();
             });
         
             inputField.addEventListener('input', (e) => {
                 let val = e.target.value;
                 matrix.classList.remove('error');
                 hintMsg.style.opacity = '0';
         
                 slots.forEach((slot, index) => {
                     if (index < val.length) slot.classList.add('active');
                     else slot.classList.remove('active');
                 });
         
                 mLinks.forEach((link, index) => {
                     if (index < val.length - 1) link.classList.add('active');
                     else link.classList.remove('active');
                 });
         
                 if (val.length === 4) {
                     const correctCode = gConfig.lockScreenCode || '0101';
                     if (val === correctCode) triggerUnlock();
                     else {
                         inputField.blur();
                         matrix.classList.add('error');
                         setTimeout(() => {
                             inputField.value = ''; inputField.focus();
                             slots.forEach(s => s.classList.remove('active'));
                             mLinks.forEach(l => l.classList.remove('active'));
                             matrix.classList.remove('error');
                             hintMsg.style.opacity = '1';
                         }, 500);
                     }
                 }
             });
         
             // 🤫 长按隐藏后门：长按底部文字直接强行解锁！
             const sysDataText = document.querySelector('.ls-sysdata');
             let bypassTimer;
             sysDataText.style.pointerEvents = 'auto'; // 允许点击
             sysDataText.style.cursor = 'pointer';
             sysDataText.addEventListener('touchstart', () => {
                 bypassTimer = setTimeout(triggerUnlock, 800); // 按住 0.8 秒解开
             }, {passive: true});
             sysDataText.addEventListener('touchend', () => clearTimeout(bypassTimer));
             sysDataText.addEventListener('mousedown', () => {
                 bypassTimer = setTimeout(triggerUnlock, 800);
             });
             sysDataText.addEventListener('mouseup', () => clearTimeout(bypassTimer));
             sysDataText.addEventListener('mouseleave', () => clearTimeout(bypassTimer));
         }
         
         function renderAvatarHTML(avatarData, type = 'user') { if(avatarData && (avatarData.startsWith('data:image') || avatarData.startsWith('http'))) return `<img src="${avatarData}">`; if(avatarData && avatarData.length < 5) return `<div style="font-size:24px;">${avatarData}</div>`; return type === 'bot' ? SVG_BOT : SVG_USER; }
         function renderIconHTML(data, svgFallback) { if(data && (data.startsWith('data:image') || data.startsWith('http'))) return `<img src="${data}">`; return svgFallback; }
         
         /* 彻底移除压缩逻辑，保留原图极致清晰度 */
         function handleImageUpload(e, pId, dId, cb = null, isBg = false) { 
             const file = e.target.files[0]; if(!file) return; 
             const reader = new FileReader(); 
             reader.onload = function(evt) { 
                 const b64 = evt.target.result; 
                 document.getElementById(dId).value = b64; 
                 if(isBg) document.getElementById(pId).innerHTML = `<img src="${b64}">`; 
                 else document.getElementById(pId).innerHTML = renderAvatarHTML(b64); 
                 if(cb) cb(); 
             }; 
             reader.readAsDataURL(file); 
         }
         
         function clearHomeBg() { document.getElementById('me-home-bg-data').value = ''; document.getElementById('me-home-bg-preview').innerHTML = '点击上传'; saveGlobal(); }
