             function getCursorHTML(id, currentMood = 60) {
             if (!cursorDict[id]) return cursorDict['ecg'].html;
             let html = cursorDict[id].html;
             
             // 如果是情绪流体，把计算出的颜色变成 CSS 变量，直接塞进容器的 style 里！
             if (id === 'orb') {
                 // 心情值(0~100) 映射到色相 220(冰蓝) ~ 350(绯红)
                 let hue = 220 + (currentMood / 100) * 130;
                 let solidColor = `hsl(${hue}, 80%, 65%)`;
                 let transColor = `hsla(${hue}, 80%, 65%, 0.5)`;
                 
                 // 找到包裹层，强行注入颜色变量
                 html = html.replace('<div class="cw-fluid-orb">', `<div class="cw-fluid-orb" style="--orb-solid: ${solidColor}; --orb-trans: ${transColor};">`);
             }
             return html;
         }
         
         function toggleCursorMenu() {
             const wrap = document.getElementById('cursor-menu-wrap');
             if (wrap.style.display === 'none') {
                 wrap.style.display = 'flex';
                 renderCursorMenu();
             } else {
                 wrap.style.display = 'none';
             }
         }
         
         function renderCursorMenu() {
             const wrap = document.getElementById('cursor-menu-wrap');
             wrap.innerHTML = '';
             const c = contacts.find(x => x.id === currentContactId);
             if (!c) return;
         
             let defCursor = c.cursorDefault || 'ecg';
             let typCursor = c.cursorTyping || 'heart';
         
             Object.keys(cursorDict).forEach(key => {
                 const isDef = (defCursor === key);
                 const isTyp = (typCursor === key);
                 const data = cursorDict[key];
         
                 const row = document.createElement('div');
                 row.style.cssText = "display:flex; align-items:center; justify-content:space-between; padding: 10px; border-bottom: 0.5px solid rgba(0,0,0,0.05); background: #fff; border-radius: 12px;";
                 
                 row.innerHTML = `
                     <div style="width: 40px; height: 30px; display:flex; justify-content:center; align-items:center; color: var(--c-black);">
                         ${data.html}
                     </div>
                     <div style="flex:1; font-size:12px; font-weight:700; margin-left:10px; color: var(--c-black);">${data.name}</div>
                     <div style="display:flex; gap: 6px;">
                         <button class="action-chip ${isDef ? 'active' : ''}" style="padding: 4px 10px; font-size:10px;" onclick="setCursorSetting('${key}', 'def')">默认</button>
                         <button class="action-chip ${isTyp ? 'active' : ''}" style="padding: 4px 10px; font-size:10px;" onclick="setCursorSetting('${key}', 'typ')">打字中</button>
                     </div>
                 `;
                 wrap.appendChild(row);
             });
         }
         
         function setCursorSetting(cursorId, mode) {
             const c = contacts.find(x => x.id === currentContactId);
             if (!c) return;
             if (mode === 'def') c.cursorDefault = cursorId;
             if (mode === 'typ') c.cursorTyping = cursorId;
             saveData();
             renderCursorMenu(); // 刷新高亮状态
             updateChatTopUI();  // 实时把顶部的光标刷新出来让你看看效果
         }
