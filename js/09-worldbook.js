          // ================= 世界书逻辑 =================
          function renderWbList() {
              const list = document.getElementById('wb-list'); 
              if(!list) return;
              list.innerHTML = '';
              
              if(worldbooks.length === 0) {
                  list.innerHTML = `
                     <div style="text-align:center; padding:100px 40px; color:#A8A196;">
                         <div style="font-size: 40px; margin-bottom: 20px; opacity: 0.2;">✦</div>
                         <div style="font-family: 'Playfair Display', serif; font-size: 14px; font-weight: 900; letter-spacing: 2px;">EMPTY ARCHIVE</div>
                         <div style="font-size: 10px; margin-top: 8px; font-weight: 700; opacity: 0.6;">点击右上角创建新的世界规则</div>
                     </div>`;
                  return;
              }

              worldbooks.forEach((wb, idx) => {
                  const card = document.createElement('div');
                  card.style.cssText = "background: #FFFFFF; border-radius: 24px; padding: 20px; margin-bottom: 16px; border: 0.5px solid rgba(0,0,0,0.04); box-shadow: 0 10px 30px rgba(0,0,0,0.02); position: relative; overflow: hidden; animation: slideUpQ 0.4s ease-out both; animation-delay: " + (idx * 0.05) + "s;";
                  card.onclick = () => openWbForm(wb.id);

                  let scopeLabel = wb.isGlobal ? 'GLOBAL' : 'BOUND';
                  let posLabel = (wb.position || 'TOP').toUpperCase();

                  card.innerHTML = `
                     <div style="position: absolute; top: 0; right: 0; padding: 12px 15px; font-family: 'Courier New', monospace; font-size: 8px; font-weight: 900; color: #C3A772; opacity: 0.4;">NO.${String(idx+1).padStart(3, '0')}</div>
                     <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                         <span style="background: #1C1C1E; color: #FFF; font-size: 8px; font-weight: 800; padding: 3px 8px; border-radius: 4px; letter-spacing: 1px;">${scopeLabel}</span>
                         <span style="background: #F4F3F0; color: #1C1C1E; font-size: 8px; font-weight: 800; padding: 3px 8px; border-radius: 4px; letter-spacing: 1px;">${posLabel}</span>
                     </div>
                     <div style="font-family: 'Playfair Display', serif; font-size: 17px; font-weight: 900; color: #1C1C1E; margin-bottom: 6px;">${wb.title}</div>
                     <div style="font-size: 12px; color: #8E8E93; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 15px;">${wb.content}</div>
                     <div style="display: flex; justify-content: space-between; align-items: center; border-top: 0.5px solid rgba(0,0,0,0.05); pt: 12px; padding-top: 12px;">
                         <div style="font-size: 9px; font-weight: 800; color: #A8A196; letter-spacing: 1px;">${wb.keywords ? 'KEYWORDS: ' + wb.keywords : 'ALWAYS ACTIVE'}</div>
                         <div onclick="deleteWb('${wb.id}', event)" style="color: #D32F2F; font-size: 10px; font-weight: 800; cursor: pointer; padding: 5px;">ERASE</div>
                     </div>
                  `;
                  list.appendChild(card);
              });
          }
          
          function setWbPos(pos) {
              document.getElementById('wb-position').value = pos;
              document.querySelectorAll('#wb-modal .cs-chip').forEach(btn => {
                  btn.classList.remove('active');
              });
              const activeBtn = document.getElementById('wb-pos-' + pos);
              if(activeBtn) activeBtn.classList.add('active');
          }

          function openWbForm(id = null) {
              document.getElementById('wb-modal').classList.add('active');
              const grid = document.getElementById('wb-contact-grid');
              grid.innerHTML = '';
              
              contacts.forEach(c => {
                  const ckId = 'wb-ck-' + c.id;
                  grid.innerHTML += `
                     <label for="${ckId}" style="background: #F9F9F7; padding: 12px; border-radius: 12px; display: flex; align-items: center; gap: 10px; cursor: pointer;">
                         <div class="cs-toggle" style="transform: scale(0.8);">
                             <input type="checkbox" id="${ckId}" value="${c.id}" class="wb-contact-ck cs-toggle-input">
                             <label for="${ckId}"></label>
                         </div>
                         <span style="font-size: 12px; font-weight: 700; color: #1C1C1E;">${c.name}</span>
                     </label>`;
              });

              if (id) {
                  document.getElementById('wb-form-title').innerText = "EDIT ENTRY";
                  const wb = worldbooks.find(x => x.id === id);
                  document.getElementById('wb-id').value = wb.id;
                  document.getElementById('wb-title').value = wb.title;
                  document.getElementById('wb-content').value = wb.content;
                  document.getElementById('wb-is-global').checked = wb.isGlobal;
                  document.getElementById('wb-keywords').value = wb.keywords || '';
                  setWbPos(wb.position || 'top');
                  
                  const cks = document.querySelectorAll('.wb-contact-ck');
                  cks.forEach(ck => {
                      if (wb.boundContacts && wb.boundContacts.includes(ck.value)) ck.checked = true;
                  });
              } else {
                  document.getElementById('wb-form-title').innerText = "NEW ENTRY";
                  document.getElementById('wb-id').value = '';
                  document.getElementById('wb-title').value = '';
                  document.getElementById('wb-content').value = '';
                  document.getElementById('wb-keywords').value = '';
                  document.getElementById('wb-is-global').checked = true;
                  setWbPos('top');
              }
              toggleWbContacts();
          }
          
          function toggleWbContacts() {
              const isGlobal = document.getElementById('wb-is-global').checked;
              document.getElementById('wb-contacts-area').style.display = isGlobal ? 'none' : 'block';
          }
          
          function closeWbForm() { document.getElementById('wb-modal').classList.remove('active'); }
          
          function saveWbForm() {
     const id = document.getElementById('wb-id').value;
     const title = document.getElementById('wb-title').value.trim();
     const content = document.getElementById('wb-content').value.trim();
     const isGlobal = document.getElementById('wb-is-global').checked;
     const keywords = document.getElementById('wb-keywords').value.trim();
     const position = document.getElementById('wb-position').value;
     
     if (!title || !content) return alert("名称和内容必填！");

     const boundContacts = [];
     if (!isGlobal) {
         document.querySelectorAll('.wb-contact-ck:checked').forEach(ck => boundContacts.push(ck.value));
     }

     if (id) {
         const wb = worldbooks.find(x => x.id === id);
         wb.title = title; wb.content = content; wb.isGlobal = isGlobal; 
         wb.boundContacts = boundContacts; wb.keywords = keywords; wb.position = position;
     } else {
         worldbooks.unshift({ id: 'wb_' + Date.now(), title, content, isGlobal, boundContacts, keywords, position });
     }
     saveData(); closeWbForm(); renderWbList();
}
          
          function deleteWb(id, e) {
              e.stopPropagation();
              if(confirm('删除这条世界书设定？')) {
                  worldbooks = worldbooks.filter(w => w.id !== id);
                  saveData(); renderWbList();
              }
          }