// ================= 世界书逻辑 (增强分类版) =================
let wbCategories = JSON.parse(localStorage.getItem('wbCategories') || '["默认", "设定", "人物", "物品"]');
let currentWbFilter = '全部';

function renderWbList() {
    const list = document.getElementById('wb-list'); 
    if(!list) return;
    list.innerHTML = '';
    
    // 渲染顶部分类栏
    renderWbCategoryBar();

    // 过滤数据
    const filteredWb = worldbooks.filter(wb => {
        if (currentWbFilter === '全部') return true;
        return (wb.category || "默认") === currentWbFilter;
    });

    if(filteredWb.length === 0) {
        list.innerHTML = `
           <div style="text-align:center; padding:100px 40px; color:#A8A196;">
               <div style="font-size: 40px; margin-bottom: 20px; opacity: 0.2;">✦</div>
               <div style="font-family: 'Playfair Display', serif; font-size: 14px; font-weight: 900; letter-spacing: 2px;">EMPTY ARCHIVE</div>
               <div style="font-size: 10px; margin-top: 8px; font-weight: 700; opacity: 0.6;">该分组下暂无世界规则</div>
           </div>`;
        return;
    }

    filteredWb.forEach((wb, idx) => {
        const card = document.createElement('div');
        card.style.cssText = "background: #FFFFFF; border-radius: 24px; padding: 20px; margin-bottom: 16px; border: 0.5px solid rgba(0,0,0,0.04); box-shadow: 0 10px 30px rgba(0,0,0,0.02); position: relative; overflow: hidden; animation: slideUpQ 0.4s ease-out both; animation-delay: " + (idx * 0.05) + "s;";
        card.onclick = () => openWbForm(wb.id);

        let scopeLabel = wb.isGlobal ? 'GLOBAL' : 'BOUND';
        let posLabel = (wb.position || 'TOP').toUpperCase();
        let catLabel = (wb.category || '默认').toUpperCase();

        card.innerHTML = `
           <div style="position: absolute; top: 0; right: 0; padding: 12px 15px; font-family: 'Courier New', monospace; font-size: 8px; font-weight: 900; color: #C3A772; opacity: 0.4;">NO.${String(idx+1).padStart(3, '0')}</div>
           <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
               <span style="background: #1C1C1E; color: #FFF; font-size: 8px; font-weight: 800; padding: 3px 8px; border-radius: 4px; letter-spacing: 1px;">${scopeLabel}</span>
               <span style="background: #F4F3F0; color: #1C1C1E; font-size: 8px; font-weight: 800; padding: 3px 8px; border-radius: 4px; letter-spacing: 1px;">${posLabel}</span>
               <span style="display: inline-flex; align-items: center; background: #FAFAFA; border: 0.5px solid rgba(0,0,0,0.08); padding: 2px 8px; border-radius: 6px; height: 16px; box-sizing: border-box;"><i style="display: block; width: 2.5px; height: 2.5px; background: #C3A772; border-radius: 50%; margin-right: 4px; opacity: 0.7;"></i><span style="font-family: 'Courier New', monospace; font-size: 7px; font-weight: 800; color: #A8A196; letter-spacing: 0.8px; line-height: 1;">${catLabel}</span></span>
           </div>
           <div style="font-family: 'Playfair Display', serif; font-size: 17px; font-weight: 900; color: #1C1C1E; margin-bottom: 6px;">${wb.title}</div>
           <div style="font-size: 12px; color: #8E8E93; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 15px;">${wb.content}</div>
           <div style="display: flex; justify-content: space-between; align-items: center; border-top: 0.5px solid rgba(0,0,0,0.05); padding-top: 12px;">
               <div style="font-size: 9px; font-weight: 800; color: #A8A196; letter-spacing: 1px;">${wb.keywords ? 'KEYWORDS: ' + wb.keywords : 'ALWAYS ACTIVE'}</div>
               <div onclick="deleteWb('${wb.id}', event)" style="color: #D32F2F; font-size: 10px; font-weight: 800; cursor: pointer; padding: 5px;">ERASE</div>
           </div>
        `;
        list.appendChild(card);
    });
}

function renderWbCategoryBar() {
    const filterBar = document.getElementById('wb-category-filter');
    if (!filterBar) return;
    
    let html = `<div class="cs-chip ${currentWbFilter === '全部' ? 'active' : ''}" onclick="filterWbByCategory('全部')" style="padding: 6px 14px; font-size: 11px; font-weight: 800; border-radius: 100px; background: ${currentWbFilter === '全部' ? '#1C1C1E' : '#F4F3F0'}; color: ${currentWbFilter === '全部' ? '#FFF' : '#A8A196'}; transition: 0.3s; cursor: pointer; flex-shrink: 0;">全部</div>`;
    
    wbCategories.forEach(cat => {
        html += `<div class="cs-chip ${currentWbFilter === cat ? 'active' : ''}" onclick="filterWbByCategory('${cat}')" style="padding: 6px 14px; font-size: 11px; font-weight: 800; border-radius: 100px; background: ${currentWbFilter === cat ? '#1C1C1E' : '#F4F3F0'}; color: ${currentWbFilter === cat ? '#FFF' : '#A8A196'}; transition: 0.3s; cursor: pointer; flex-shrink: 0;">${cat}</div>`;
    });
    filterBar.innerHTML = html;
}

function filterWbByCategory(cat) {
    currentWbFilter = cat;
    renderWbList();
}

function openWbCatManager() {
    document.getElementById('wb-cat-modal').classList.add('active');
    renderWbCatManageList();
}

function closeWbCatManager() {
    document.getElementById('wb-cat-modal').classList.remove('active');
}

function renderWbCatManageList() {
    const list = document.getElementById('wb-cat-manage-list');
    let html = '';
    wbCategories.forEach((cat, index) => {
        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #F4F3F0; border-radius: 14px; margin-bottom: 10px;">
                <span style="font-size: 13px; font-weight: 800; color: #1C1C1E;">${cat}</span>
                <div onclick="deleteWbCategory(${index})" style="color: #FF3B30; cursor: pointer; padding: 4px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </div>
            </div>`;
    });
    list.innerHTML = html;
}

function addWbCategory() {
    const input = document.getElementById('wb-new-cat-input');
    const val = input.value.trim();
    if (val && !wbCategories.includes(val)) {
        wbCategories.push(val);
        localStorage.setItem('wbCategories', JSON.stringify(wbCategories));
        input.value = '';
        renderWbCatManageList();
        updateWbCategorySelect();
    }
}

function deleteWbCategory(index) {
    if (wbCategories.length <= 1) return alert('请至少保留一个分组');
    if (confirm(`确定要删除分组 "${wbCategories[index]}" 吗？`)) {
        wbCategories.splice(index, 1);
        localStorage.setItem('wbCategories', JSON.stringify(wbCategories));
        currentWbFilter = '全部';
        renderWbCatManageList();
        updateWbCategorySelect();
        renderWbList();
    }
}

function updateWbCategorySelect() {
    const select = document.getElementById('wb-category-select');
    if (!select) return;
    select.innerHTML = wbCategories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
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
    updateWbCategorySelect();
    
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
        document.getElementById('wb-category-select').value = wb.category || "默认";
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
        document.getElementById('wb-category-select').value = currentWbFilter === '全部' ? "默认" : currentWbFilter;
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
    const category = document.getElementById('wb-category-select').value;
    
    if (!title || !content) return alert("名称和内容必填！");

    const boundContacts = [];
    if (!isGlobal) {
        document.querySelectorAll('.wb-contact-ck:checked').forEach(ck => boundContacts.push(ck.value));
    }

    if (id) {
        const wb = worldbooks.find(x => x.id === id);
        wb.title = title; wb.content = content; wb.isGlobal = isGlobal; 
        wb.boundContacts = boundContacts; wb.keywords = keywords; 
        wb.position = position; wb.category = category;
    } else {
        worldbooks.unshift({ 
            id: 'wb_' + Date.now(), 
            title, content, isGlobal, boundContacts, keywords, position, category 
        });
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
