const MV_TAGS = ['事件', '偏好', '性格', '关系', '设定', '其他'];

function openMemoryVault() {
    const c = contacts.find(x => x.id === currentContactId);
    if (!c) return;
    if (!c.memoryEntries) c.memoryEntries = [];
    mvMigrateOldMemory(c);
    mvRenderAll(c);
    document.getElementById('memory-vault-modal').classList.add('active');
}

function closeMemoryVault() {
    document.getElementById('memory-vault-modal').classList.remove('active');
}

function mvSaveAndClose() {
    const c = contacts.find(x => x.id === currentContactId);
    if (!c) return;
    mvSyncMemoryField(c);
    saveData();
    mvUpdateSettingsPreview(c);
    closeMemoryVault();
}

function mvMigrateOldMemory(c) {
    if (!c) return;
    if (c._memoryMigrated) return;
    if (c.memory && c.memory.trim() && (!c.memoryEntries || c.memoryEntries.length === 0)) {
        let oldText = c.memory.trim();
        let entries = [];
        let sections = oldText.split(/\n\n+/).filter(s => s.trim());
        if (sections.length <= 1) {
            entries.push({
                id: 'mv_mig_' + Date.now(),
                title: '历史记忆存档',
                content: oldText,
                tag: '其他',
                stars: 2,
                source: 'manual',
                keywords: '',
                createdAt: Date.now()
            });
        } else {
            sections.forEach((section, idx) => {
                let clean = section.replace(/^\[.*?\]\s*[:：]?\s*/g, '').trim();
                let titleText = clean.substring(0, 20).replace(/\n/g, ' ');
                if (titleText.length >= 20) titleText += '...';
                let isSummary = section.includes('历史摘要') || section.includes('总结');
                entries.push({
                    id: 'mv_mig_' + Date.now() + '_' + idx,
                    title: isSummary ? '对话摘要 (迁移)' : '记忆片段 #' + (idx + 1),
                    content: clean,
                    tag: isSummary ? '事件' : '其他',
                    stars: 2,
                    source: isSummary ? 'summary' : 'manual',
                    keywords: '',
                    createdAt: Date.now() - (sections.length - idx) * 1000
                });
            });
        }
        c.memoryEntries = entries;
        c._memoryMigrated = true;
        saveData();
    }
    if (!c.memoryEntries) {
        c.memoryEntries = [];
    }
    c._memoryMigrated = true;
}

function mvSyncMemoryField(c) {
    if (!c) return;
    mvMigrateOldMemory(c);
    if (!c.memoryEntries || c.memoryEntries.length === 0) {
        c.memory = '';
        return;
    }
    let sorted = [...c.memoryEntries].sort((a, b) => (b.stars || 0) - (a.stars || 0));
    let lines = sorted.map(e => {
        let prefix = e.stars >= 3 ? '[🚨 关键记忆]' : e.stars >= 2 ? '[重要记忆]' : '[一般记忆]';
        let tagStr = e.tag ? `[#${e.tag}]` : '';
        return `${prefix}${tagStr} ${e.title}: ${e.content}`;
    });
    c.memory = lines.join('\n\n');
    document.getElementById('cs-memory').value = c.memory;
}

function mvUpdateSettingsPreview(c) {
    if (!c) return;
    let entries = c.memoryEntries || [];
    let total = entries.length;
    let keyCount = entries.filter(e => e.stars >= 3).length;
    let aiCount = entries.filter(e => e.source === 'ai').length;
    let manualCount = entries.filter(e => e.source === 'manual' || e.source === 'summary').length;
    try {
        let el1 = document.getElementById('cs-memory-count');
        let el2 = document.getElementById('cs-memory-key-count');
        let el3 = document.getElementById('cs-memory-ai-count');
        let el4 = document.getElementById('cs-memory-manual-count');
        let el5 = document.getElementById('mv-stat-total');
        let el6 = document.getElementById('mv-stat-key');
        let el7 = document.getElementById('mv-stat-ai');
        if (el1) el1.innerText = total + ' 条记忆';
        if (el2) el2.innerText = keyCount;
        if (el3) el3.innerText = aiCount;
        if (el4) el4.innerText = manualCount;
        if (el5) el5.innerText = total;
        if (el6) el6.innerText = keyCount;
        if (el7) el7.innerText = aiCount;
    } catch(e) {}
}

let mvCurrentFilter = '全部';

function mvRenderAll(c) {
    mvRenderStats(c);
    mvRenderFilters();
    mvRenderList(c);
}

function mvRenderStats(c) {
    let entries = c.memoryEntries || [];
    document.getElementById('mv-stat-total').innerText = entries.length;
    document.getElementById('mv-stat-key').innerText = entries.filter(e => e.stars >= 3).length;
    document.getElementById('mv-stat-ai').innerText = entries.filter(e => e.source === 'ai').length;
}

function mvRenderFilters() {
    let bar = document.getElementById('mv-filter-bar');
    bar.innerHTML = '';
    let allTags = ['全部', ...MV_TAGS];
    allTags.forEach(tag => {
        let chip = document.createElement('div');
        chip.className = 'mv-filter-chip' + (mvCurrentFilter === tag ? ' active' : '');
        chip.innerText = tag;
        chip.onclick = () => {
            mvCurrentFilter = tag;
            let c = contacts.find(x => x.id === currentContactId);
            if (c) mvRenderAll(c);
        };
        bar.appendChild(chip);
    });
}

function mvRenderList(c) {
    let list = document.getElementById('mv-list');
    let entries = c.memoryEntries || [];

    if (mvCurrentFilter !== '全部') {
        entries = entries.filter(e => e.tag === mvCurrentFilter);
    }

    entries.sort((a, b) => (b.stars || 0) - (a.stars || 0) || (b.createdAt || 0) - (a.createdAt || 0));

    if (entries.length === 0) {
        list.innerHTML = `
            <div class="mv-empty">
                <div class="mv-empty-icon">✦</div>
                <div class="mv-empty-title">记忆库为空</div>
                <div class="mv-empty-desc">点击右上角 + 手动添加记忆<br>或使用 AI 智能提取</div>
            </div>`;
        let freeSection = mvBuildFreeTextSection(c);
        list.appendChild(freeSection);
        return;
    }

    list.innerHTML = '';

    entries.forEach(entry => {
        let card = document.createElement('div');
        card.className = 'mv-card';

        let starsHtml = '';
        for (let i = 1; i <= 3; i++) {
            starsHtml += `<div class="mv-star ${i <= (entry.stars || 1) ? 'filled' : ''}" onclick="mvSetStars('${entry.id}', ${i})">★</div>`;
        }

        let sourceClass = entry.source === 'ai' ? 'ai' : entry.source === 'summary' ? 'summary' : 'manual';
        let sourceLabel = entry.source === 'ai' ? '✧ AI提取' : entry.source === 'summary' ? '⟳ 总结' : '手动添加';

        let dateStr = '';
        if (entry.createdAt) {
            let d = new Date(entry.createdAt);
            dateStr = `${d.getFullYear()}.${(d.getMonth()+1).toString().padStart(2,'0')}.${d.getDate().toString().padStart(2,'0')}`;
        }

        let kwHtml = '';
        if (entry.keywords && entry.keywords.trim()) {
            let kws = entry.keywords.split(/[,，]/).map(k => k.trim()).filter(k => k);
            if (kws.length > 0) {
                kwHtml = `<div class="mv-card-keywords"><span class="mv-kw-label">TRIGGER:</span>${kws.map(k => `<span class="mv-kw-tag">${k}</span>`).join('')}</div>`;
            }
        }

        card.innerHTML = `
            <div class="mv-card-top">
                <div class="mv-card-title-row">
                    <span class="mv-card-pin">✦</span>
                    <span class="mv-card-title">${entry.title || '未命名记忆'}</span>
                </div>
                <div class="mv-card-stars">${starsHtml}</div>
            </div>
            <div class="mv-card-meta">
                <span class="mv-card-date">${dateStr}</span>
                <span class="mv-card-source ${sourceClass}">${sourceLabel}</span>
                ${entry.tag ? `<span class="mv-card-tag">#${entry.tag}</span>` : ''}
            </div>
            <div class="mv-card-content" onclick="this.classList.toggle('expanded')">${entry.content || ''}</div>
            ${kwHtml}
            <div class="mv-card-actions">
                <button class="mv-card-btn" onclick="mvEditEntry('${entry.id}')">编辑</button>
                <button class="mv-card-btn danger" onclick="mvDeleteEntry('${entry.id}')">删除</button>
            </div>`;

        list.appendChild(card);
    });

    let freeSection = mvBuildFreeTextSection(c);
    list.appendChild(freeSection);
}

function mvBuildFreeTextSection(c) {
    let section = document.createElement('div');
    section.className = 'mv-freetext-section';
    section.innerHTML = `
        <div class="mv-freetext-header">
            <div class="mv-freetext-title">自由备注区</div>
            <div class="mv-freetext-toggle" onclick="manualSummarize()">手动总结 ✧</div>
        </div>
        <textarea class="mv-freetext-area" id="mv-freetext" placeholder="在此自由书写任何补充信息...">${c.memoryFreeText || ''}</textarea>`;
    let textarea = section.querySelector('textarea');
    textarea.addEventListener('input', () => {
        c.memoryFreeText = textarea.value;
    });
    return section;
}

function mvSetStars(entryId, stars) {
    let c = contacts.find(x => x.id === currentContactId);
    if (!c || !c.memoryEntries) return;
    let entry = c.memoryEntries.find(e => e.id === entryId);
    if (!entry) return;
    entry.stars = (entry.stars === stars) ? stars - 1 : stars;
    if (entry.stars < 1) entry.stars = 1;
    saveData();
    mvRenderAll(c);
}

function mvOpenAddModal() {
    document.getElementById('mv-edit-id').value = '';
    document.getElementById('mv-edit-title').value = '';
    document.getElementById('mv-edit-content').value = '';
    document.getElementById('mv-edit-keywords').value = '';
    document.getElementById('mv-modal-title').innerText = '添加记忆';
    mvRenderTagSelector('');
    mvRenderStarSelector(2);
    document.getElementById('mv-edit-modal').classList.add('active');
}

function mvEditEntry(entryId) {
    let c = contacts.find(x => x.id === currentContactId);
    if (!c || !c.memoryEntries) return;
    let entry = c.memoryEntries.find(e => e.id === entryId);
    if (!entry) return;
    document.getElementById('mv-edit-id').value = entry.id;
    document.getElementById('mv-edit-title').value = entry.title || '';
    document.getElementById('mv-edit-content').value = entry.content || '';
    document.getElementById('mv-edit-keywords').value = entry.keywords || '';
    document.getElementById('mv-modal-title').innerText = '编辑记忆';
    mvRenderTagSelector(entry.tag || '');
    mvRenderStarSelector(entry.stars || 2);
    document.getElementById('mv-edit-modal').classList.add('active');
}

function mvCloseEditModal() {
    document.getElementById('mv-edit-modal').classList.remove('active');
}

function mvRenderTagSelector(activeTag) {
    let container = document.getElementById('mv-tag-selector');
    container.innerHTML = '';
    MV_TAGS.forEach(tag => {
        let el = document.createElement('div');
        el.className = 'mv-tag-option' + (activeTag === tag ? ' selected' : '');
        el.innerText = tag;
        el.onclick = () => {
            container.querySelectorAll('.mv-tag-option').forEach(x => x.classList.remove('selected'));
            el.classList.add('selected');
        };
        container.appendChild(el);
    });
}

function mvRenderStarSelector(activeStars) {
    let container = document.getElementById('mv-star-selector');
    container.innerHTML = '';
    for (let i = 1; i <= 3; i++) {
        let el = document.createElement('div');
        el.className = 'mv-star-select' + (i <= activeStars ? ' filled' : '');
        el.innerText = '★';
        el.onclick = () => {
            container.querySelectorAll('.mv-star-select').forEach((x, idx) => {
                x.classList.toggle('filled', idx < i);
            });
        };
        container.appendChild(el);
    }
}

function mvSaveEntry() {
    let c = contacts.find(x => x.id === currentContactId);
    if (!c) return;
    if (!c.memoryEntries) c.memoryEntries = [];

    let editId = document.getElementById('mv-edit-id').value;
    let title = document.getElementById('mv-edit-title').value.trim();
    let content = document.getElementById('mv-edit-content').value.trim();
    let keywords = document.getElementById('mv-edit-keywords').value.trim();

    if (!title && !content) return alert('请至少填写标题或内容');

    let selectedTag = '';
    let activeTagEl = document.querySelector('#mv-tag-selector .mv-tag-option.selected');
    if (activeTagEl) selectedTag = activeTagEl.innerText;

    let stars = document.querySelectorAll('#mv-star-selector .mv-star-select.filled').length;
    if (stars < 1) stars = 1;

    if (editId) {
        let entry = c.memoryEntries.find(e => e.id === editId);
        if (entry) {
            entry.title = title;
            entry.content = content;
            entry.tag = selectedTag;
            entry.stars = stars;
            entry.keywords = keywords;
        }
    } else {
        c.memoryEntries.push({
            id: 'mv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            title: title,
            content: content,
            tag: selectedTag,
            stars: stars,
            source: 'manual',
            keywords: keywords,
            createdAt: Date.now()
        });
    }

    mvSyncMemoryField(c);
    saveData();
    mvCloseEditModal();
    mvRenderAll(c);
}

function mvDeleteEntry(entryId) {
    if (!confirm('确定删除这条记忆？')) return;
    let c = contacts.find(x => x.id === currentContactId);
    if (!c || !c.memoryEntries) return;
    c.memoryEntries = c.memoryEntries.filter(e => e.id !== entryId);
    mvSyncMemoryField(c);
    saveData();
    mvRenderAll(c);
}

async function mvAIExtract() {
    let c = contacts.find(x => x.id === currentContactId);
    if (!c) return;
    if (!gConfig.apiUrl || !gConfig.apiKey) return alert('请先配置 API！');

    let recentMsgs = c.history.filter(m => m.role === 'user' || m.role === 'assistant').filter(m => !m.isRevoked && !m.isTheater).slice(-40);
    if (recentMsgs.length < 4) return alert('对话记录太少，至少需要几轮对话才能提取记忆。');

    let uName = gConfig.meName || '我';
    if (c.maskId) { let m = masks.find(x => x.id === c.maskId); if (m) uName = m.name; }
    let botName = c.chatRemark || c.name;

    let contextText = recentMsgs.map(m => {
        let clean = m.content.replace(/<[^>]+>/g, '').trim();
        return `${m.role === 'user' ? uName : botName}: ${clean}`;
    }).join('\n');

    let existingTitles = (c.memoryEntries || []).map(e => e.title).join('、');

    let btn = document.querySelector('.mv-btn-secondary');
    let origText = btn ? btn.innerText : '';
    if (btn) { btn.innerText = '✧ AI 正在分析对话...'; btn.disabled = true; }

    try {
        let response = await fetch(`${gConfig.apiUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${gConfig.apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: gConfig.model,
                messages: [
                    { role: 'system', content: `你是一个记忆提取专家。你的任务是从对话记录中提取关键记忆条目。

要求：
1. 提取 3-6 条最重要的记忆
2. 每条记忆必须是一个独立的知识点或事件
3. 分类标签只能从以下选择：事件、偏好、性格、关系、设定、其他
4. 重要度 1-3 星（3星=绝对关键）
5. 如果有关键词可以触发这条记忆，请提供

已有记忆（避免重复）：${existingTitles || '无'}

严格按照以下 JSON 格式输出，不要输出任何其他文字：
[
  {"title": "简短标题", "content": "详细内容", "tag": "分类", "stars": 2, "keywords": "关键词1,关键词2"},
  ...
]` },
                    { role: 'user', content: contextText }
                ],
                temperature: 0.3,
                stream: false
            })
        });

        if (!response.ok) throw new Error('API 请求失败');
        let data = await response.json();
        let raw = (data.choices?.[0]?.message?.content || '').trim();

        let jsonMatch = raw.match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error('AI 返回格式异常');

        let parsed = JSON.parse(jsonMatch[0]);
        if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('未提取到任何记忆');

        if (!c.memoryEntries) c.memoryEntries = [];

        let addedCount = 0;
        parsed.forEach(item => {
            if (!item.title && !item.content) return;
            let isDuplicate = c.memoryEntries.some(e => e.title === item.title);
            if (isDuplicate) return;

            c.memoryEntries.push({
                id: 'mv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                title: item.title || '未命名',
                content: item.content || '',
                tag: MV_TAGS.includes(item.tag) ? item.tag : '其他',
                stars: Math.min(3, Math.max(1, parseInt(item.stars) || 2)),
                source: 'ai',
                keywords: item.keywords || '',
                createdAt: Date.now()
            });
            addedCount++;
        });

        mvSyncMemoryField(c);
        saveData();
        mvRenderAll(c);
        alert(`成功提取 ${addedCount} 条新记忆！`);

    } catch (e) {
        alert('AI 提取失败: ' + e.message);
    } finally {
        if (btn) { btn.innerText = origText; btn.disabled = false; }
    }
}
