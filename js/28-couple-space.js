// ===== Couple Space 情侣空间 =====
const CoupleSpace = (function(){

    let currentTarget = null; // 当前选中的联系人对象
    let currentPanel = 0;

    // ===== 工具函数 =====
    function csToast(msg){
        let t = document.querySelector('.cs-toast');
        if(!t){ t = document.createElement('div'); t.className = 'cs-toast'; document.body.appendChild(t); }
        t.textContent = msg;
        t.classList.add('show');
        setTimeout(()=> t.classList.remove('show'), 2500);
    }

    function getDateStr(){
        const d = new Date();
        return d.getFullYear()+'.'+(d.getMonth()+1).toString().padStart(2,'0')+'.'+d.getDate().toString().padStart(2,'0');
    }
    function getTimeStr(){
        const d = new Date();
        return d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0');
    }

    function ensureData(c){
        if(!c.coupleSpace) c.coupleSpace = {};
        if(!c.coupleSpace.wishes) c.coupleSpace.wishes = [];
        if(!c.coupleSpace.letters) c.coupleSpace.letters = [];
        if(!c.coupleSpace.moods) c.coupleSpace.moods = [];
        if(!c.coupleSpace.vow) c.coupleSpace.vow = '';
        if(!c.coupleSpace.startDate) c.coupleSpace.startDate = Date.now();
    }

    function getDaysTogether(c){
        ensureData(c);
        return Math.max(1, Math.floor((Date.now() - c.coupleSpace.startDate) / (1000*60*60*24)));
    }

    function getRecentMessages(c, count){
        if(!c || !c.history) return '';
        let msgs = [];
        for(let i = c.history.length - 1; i >= 0 && msgs.length < count; i--){
            const m = c.history[i];
            if(m.role === 'user' || m.role === 'assistant'){
                const who = m.role === 'user' ? '用户' : (c.chatRemark || c.name);
                const text = (m.content || '').replace(/<[^>]*>/g, '').substring(0, 200);
                if(text.trim()) msgs.unshift(`${who}: ${text}`);
            }
        }
        return msgs.join('\n');
    }

    function getPersona(c){
        if(!c || !c.history || !c.history[0]) return '';
        return (c.history[0].content || '').substring(0, 500);
    }

    // ===== AI 调用引擎 =====
    async function csCallAI(prompt){
        const url = (gConfig.apiUrl || '').replace(/\/+$/, '');
        const base = url.endsWith('/v1') ? url : url + '/v1';
        const key = gConfig.apiKey || '';
        const model = gConfig.model || '';
        if(!base || !key || !model){
            csToast('请先配置 API');
            return null;
        }
        try {
            const res = await fetch(base + '/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
                body: JSON.stringify({
                    model: model,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.9,
                    max_tokens: 1500
                })
            });
            const data = await res.json();
            return data.choices?.[0]?.message?.content?.trim() || null;
        } catch(e){
            console.error('CoupleSpace AI error:', e);
            csToast('AI 请求失败');
            return null;
        }
    }

    function buildContext(c){
        const name = c.chatRemark || c.name;
        const persona = getPersona(c);
        const recent = getRecentMessages(c, 10);
        return `联系人名字: ${name}\n联系人人设: ${persona}\n\n最近的聊天记录:\n${recent}`;
    }

    // ===== 选择页 =====
    function renderSelectionList(){
        const list = document.getElementById('cs-sel-list');
        if(!list || typeof contacts === 'undefined') return;
        list.innerHTML = '';
        contacts.forEach(c => {
            const avatar = c.chatAvatar || c.avatar || '';
            const name = c.chatRemark || c.name || '未命名';
            const days = getDaysTogether(c);
            const avHtml = avatar
                ? `<img src="${avatar}" alt="">`
                : `<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>`;

            const item = document.createElement('div');
            item.className = 'cs-sel-item';
            item.innerHTML = `
                <div class="cs-sel-av">${avHtml}</div>
                <div class="cs-sel-inf">
                    <div class="cs-sel-nm">${name}</div>
                    <div class="cs-sel-ht">互动 ${days} 天</div>
                </div>
                <div class="cs-sel-ar"><svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg></div>
            `;
            item.onclick = () => enterSpace(c);
            list.appendChild(item);
        });
    }

    // ===== 进入空间 =====
    function enterSpace(c){
        currentTarget = c;
        ensureData(c);

        document.getElementById('cs-sel-page').classList.add('hide');
        document.getElementById('cs-space-page').style.display = 'flex';

        const name = c.chatRemark || c.name;
        document.getElementById('cs-tp-name').textContent = name.toUpperCase();
        document.getElementById('cs-pf-ta-name').textContent = name;
        document.getElementById('cs-pf-days-num').textContent = getDaysTogether(c);

        // 头像
        const myAv = gConfig.meAvatar || '';
        const taAv = c.chatAvatar || c.avatar || '';
        const meEl = document.getElementById('cs-pf-me-av');
        const taEl = document.getElementById('cs-pf-ta-av');
        meEl.innerHTML = myAv ? `<img src="${myAv}">` : `<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>`;
        taEl.innerHTML = taAv ? `<img src="${taAv}">` : `<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>`;

        // 我的名字
        document.getElementById('cs-pf-me-name').textContent = gConfig.meName || '我';

        switchPanel(0);
        renderWishes();
        renderLetters();
        renderVow();

        // 恢复上次调取的记录，没有则显示默认
        ensureData(c);
        const saved = c.coupleSpace.dailyCache;
        const ids = ['cs-daily-quote','cs-daily-fortune','cs-daily-date-plan','cs-daily-flirt','cs-daily-advice','cs-daily-sync'];
        const defaults = ['点击「调取」让 AI 生成专属内容','等待 AI 生成...','等待 AI 生成...','等待 AI 生成...','等待 AI 生成...','等待 AI 生成...'];
        ids.forEach((id, i) => {
            document.getElementById(id).textContent = (saved && saved[i]) ? saved[i] : defaults[i];
        });
    }

    function backToSel(){
        document.getElementById('cs-sel-page').classList.remove('hide');
        document.getElementById('cs-space-page').style.display = 'none';
        currentTarget = null;
    }

    // ===== 面板切换 =====
    function switchPanel(idx, btnEl){
        currentPanel = idx;
        document.querySelectorAll('.cs-pnl').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.cs-dk-item').forEach(d => d.classList.remove('active'));
        const pnl = document.getElementById('cs-pnl-' + idx);
        if(pnl) pnl.classList.add('active');
        if(btnEl) btnEl.classList.add('active');
        else {
            const allDk = document.querySelectorAll('.cs-dk-item');
            // 映射: 0->0, 1->1, 2->3, 3->4, 4->5 (中间是center按钮)
            const map = [0, 1, 3, 4, 5];
            if(allDk[map[idx]]) allDk[map[idx]].classList.add('active');
        }
        const scroll = document.querySelector('.cs-main-scroll');
        if(scroll) scroll.scrollTop = 0;
    }

    // ===== AI 调取：今日频率全调取 =====
    async function fetchAllDaily(){
        if(!currentTarget) return;
        const c = currentTarget;
        const ctx = buildContext(c);
        const name = c.chatRemark || c.name;

        // 显示加载状态
        const loadingHtml = '<span class="cs-loading"><span class="cs-loading-dot"><span></span><span></span><span></span></span> AI 正在生成...</span>';
        document.getElementById('cs-daily-quote').innerHTML = loadingHtml;
        document.getElementById('cs-daily-fortune').innerHTML = loadingHtml;
        document.getElementById('cs-daily-date-plan').innerHTML = loadingHtml;
        document.getElementById('cs-daily-flirt').innerHTML = loadingHtml;
        document.getElementById('cs-daily-advice').innerHTML = loadingHtml;
        document.getElementById('cs-daily-sync').innerHTML = loadingHtml;

        const SEP = '§§§';
        const prompt = `你现在就是「${name}」。用你自己的方式给对象生成一份今日报告。必须100%符合你的人设性格和说话习惯。禁止提第三者，只有你们俩。

${ctx}

严格按以下格式输出6段，每段用 ${SEP} 分隔，不要加编号标题：

第1段：用你的方式对对象说一句今天想说的话（20字以内）
${SEP}
第2段：今天的恋爱运势，用★表示1-5颗，加建议（60字以内）
${SEP}
第3段：两个约会方案，【宅家】xxx→xxx→xxx【出门】xxx→xxx→xxx
${SEP}
第4段：用你的语气说三句不同感觉的话
${SEP}
第5段：一条相处建议（50字以内）
${SEP}
第6段：默契值xx%加一句短评（30字以内）

直接说第一句：`;

        const result = await csCallAI(prompt);
        if(!result) return;

        // 清洗
        const cleaned = result.replace(/```[\s\S]*?```/g, '').replace(/\*\*/g, '').trim();
        
        // 优先用分隔符拆
        let parts = [];
        if(cleaned.includes(SEP)){
            parts = cleaned.split(SEP).map(s => s.replace(/^[\s\n\r:：]+/, '').replace(/第[\d一二三四五六]+段[：:.]?\s*/g, '').trim());
        } else {
            // 降级：按换行 + 关键词拆分
            const all = cleaned.split(/\n+/).map(l => l.replace(/^[\d\.\-\*·•]+[\.\、\)\）\:：]?\s*/, '').replace(/^(心语|运势|约会|情话|建议|默契)[：:.\s]*/i, '').trim()).filter(l => l.length >= 2);
            // 合并短行
            let merged = [];
            let buf = '';
            all.forEach(l => {
                if(buf && (l.startsWith('★') || l.startsWith('【') || l.startsWith('「') || l.match(/^\d+%/) || merged.length >= 5)){
                    merged.push(buf); buf = l;
                } else {
                    buf = buf ? buf + ' ' + l : l;
                }
            });
            if(buf) merged.push(buf);
            parts = merged;
        }

        // 填入6个区域
        const ids = ['cs-daily-quote','cs-daily-fortune','cs-daily-date-plan','cs-daily-flirt','cs-daily-advice','cs-daily-sync'];
        const cache = [];
        ids.forEach((id, i) => {
            const el = document.getElementById(id);
            if(!el) return;
            let text = (parts[i] || '').replace(/["""]/g, '').trim();
            if(i === 0 && text) text = '"' + text + '"';
            el.textContent = text || (i === 0 ? '"等待生成..."' : '等待生成...');
            cache.push(el.textContent);
        });
        // 保存到联系人数据，下次进入时恢复
        ensureData(c);
        c.coupleSpace.dailyCache = cache;
        if(typeof saveData === 'function') saveData();
    }

    // ===== 打包发送卡片到聊天室 =====
    function packAndSend(){
        if(!currentTarget){ csToast('请先选择联系人'); return; }
        const c = currentTarget;
        const name = c.chatRemark || c.name;

        const quote = document.getElementById('cs-daily-quote').textContent;
        const fortune = document.getElementById('cs-daily-fortune').textContent;
        const datePlan = document.getElementById('cs-daily-date-plan').textContent;
        const flirt = document.getElementById('cs-daily-flirt').textContent;
        const advice = document.getElementById('cs-daily-advice').textContent;
        const sync = document.getElementById('cs-daily-sync').textContent;

        if(quote.includes('等待') || quote.includes('点击')){
            csToast('请先调取 AI 生成内容');
            return;
        }

        const timeStr = getTimeStr();

        // 折叠卡片 HTML - 用纯 JS 控制展开，不依赖 CSS class
        const cardHtml = `<div onclick="event.stopPropagation();var b=this.querySelector('.cs-pack-body');if(!b)return;var isOpen=b.style.maxHeight!=='0px'&&b.style.maxHeight;b.style.maxHeight=isOpen?'0px':'2000px';var arrow=this.querySelector('.cs-pack-arrow');if(arrow)arrow.style.transform=isOpen?'':'rotate(180deg)';" style="max-width:320px;font-family:-apple-system,sans-serif;background:#fff;border-radius:18px;box-shadow:0 4px 16px rgba(0,0,0,0.04);border:0.5px solid rgba(0,0,0,0.04);overflow:hidden;cursor:pointer;">
<div style="padding:14px 16px;display:flex;align-items:center;justify-content:space-between;">
<div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;">
<div style="width:36px;height:36px;border-radius:10px;background:#1C1C1E;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
</div>
<div><div style="font-size:13px;font-weight:800;line-height:1.3;">今日频率报告</div><div style="font-size:9px;color:#8E8E93;font-weight:600;margin-top:1px;">COUPLE SPACE · 6项 AI 生成</div></div>
</div>
<svg class="cs-pack-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#AEAEB2" stroke-width="2" style="transition:transform 0.3s;flex-shrink:0;"><path d="M6 9l6 6 6-6"/></svg>
</div>
<div class="cs-pack-body" style="max-height:0px;overflow:hidden;transition:max-height 0.4s cubic-bezier(0.16,1,0.3,1);">
<div style="padding:0 16px 16px;border-top:0.5px solid rgba(0,0,0,0.04);">
<div style="background:#F5F5F5;border-radius:10px;padding:11px 13px;margin-top:8px;">
<div style="font-size:8px;font-weight:800;letter-spacing:1.5px;color:#AEAEB2;font-family:monospace;margin-bottom:5px;">✦ 今日心语</div>
<div style="font-size:11.5px;line-height:1.7;color:#444;">${quote || '...'}</div>
</div>
<div style="background:#F5F5F5;border-radius:10px;padding:11px 13px;margin-top:8px;">
<div style="font-size:8px;font-weight:800;letter-spacing:1.5px;color:#AEAEB2;font-family:monospace;margin-bottom:5px;">★ 今日运势</div>
<div style="font-size:11.5px;line-height:1.7;color:#444;">${fortune || '...'}</div>
</div>
<div style="background:#F5F5F5;border-radius:10px;padding:11px 13px;margin-top:8px;">
<div style="font-size:8px;font-weight:800;letter-spacing:1.5px;color:#AEAEB2;font-family:monospace;margin-bottom:5px;">📍 约会企划</div>
<div style="font-size:11.5px;line-height:1.7;color:#444;white-space:pre-line;">${datePlan || '暂未生成'}</div>
</div>
<div style="background:#F5F5F5;border-radius:10px;padding:11px 13px;margin-top:8px;">
<div style="font-size:8px;font-weight:800;letter-spacing:1.5px;color:#AEAEB2;font-family:monospace;margin-bottom:5px;">💬 情话弹药库</div>
<div style="font-size:11.5px;line-height:1.7;color:#444;white-space:pre-line;">${flirt || '...'}</div>
</div>
<div style="background:#F5F5F5;border-radius:10px;padding:11px 13px;margin-top:8px;">
<div style="font-size:8px;font-weight:800;letter-spacing:1.5px;color:#AEAEB2;font-family:monospace;margin-bottom:5px;">💡 关系建议</div>
<div style="font-size:11.5px;line-height:1.7;color:#444;white-space:pre-line;">${advice || '...'}</div>
</div>
<div style="background:#F5F5F5;border-radius:10px;padding:11px 13px;margin-top:8px;">
<div style="font-size:8px;font-weight:800;letter-spacing:1.5px;color:#AEAEB2;font-family:monospace;margin-bottom:5px;">🔗 默契指数</div>
<div style="font-size:11.5px;line-height:1.7;color:#444;white-space:pre-line;">${sync || '...'}</div>
</div>
<div style="text-align:center;padding-top:10px;margin-top:10px;border-top:0.5px solid rgba(0,0,0,0.04);">
<div style="font-size:8px;color:#AEAEB2;font-weight:700;letter-spacing:2px;font-family:monospace;">SENT AT ${timeStr} · COUPLE SPACE</div>
<div style="margin-top:3px;color:#AEAEB2;font-size:8px;letter-spacing:6px;">✦ ✦ ✦</div>
<div onclick="event.stopPropagation();if(confirm('删除这张卡片？')){var r=this.closest('.msg-row')||this.closest('.bubble-sys');if(r){var idx=r.getAttribute('data-index');if(idx!==null&&typeof currentContactId!=='undefined'){var cc=contacts.find(function(x){return x.id===currentContactId});if(cc){cc.history.splice(parseInt(idx),1);saveData();renderChatHistory()}}else{r.remove()}}}" style="margin-top:8px;font-size:9px;color:#FF3B30;font-weight:700;cursor:pointer;padding:4px 12px;border-radius:10px;background:rgba(255,59,48,0.06);display:inline-block;">删除卡片</div>
</div>
</div>
</div>
</div>`;

        const aiHint = `[系统通知：以下是你（${name}）在情侣空间里生成的今日频率报告，里面所有内容都是以你的口吻写的。用户刚把这张卡片发到了聊天室里。

卡片内容摘要：
- 你对TA说的话：${quote}
- 你预测的运势：${fortune}
- 你规划的约会：${datePlan}
- 你说的情话：${flirt}
- 你给的建议：${advice}
- 默契指数：${sync}

这些都是你说的，不要当成别人写的。用户发这个卡片是在跟你互动，请自然地回应，可以对自己说过的某句话补充、害羞、或者追问用户想选哪个约会方案。]`;

        c.history.push({
            role: 'system_sum',
            content: `<div style="display:flex;justify-content:center;width:100%;">${cardHtml}</div>\n<span style="display:none;">${aiHint}</span>`,
            timestamp: Date.now(),
            isCoupleCard: true
        });

        if(typeof saveData === 'function') saveData();

        // 如果在聊天室里就渲染
        if(typeof currentContactId !== 'undefined' && currentContactId === c.id){
            if(typeof renderChatHistory === 'function') renderChatHistory();
        }

        csToast('✓ 已打包发送给 ' + name);
    }

    // ===== 情绪胶囊 =====
    function pickMood(btnEl){
        document.querySelectorAll('.cs-mood-btn').forEach(b => b.classList.remove('selected'));
        btnEl.classList.add('selected');
        if(!currentTarget) return;
        const c = currentTarget;
        ensureData(c);
        const mood = btnEl.getAttribute('data-mood');
        c.coupleSpace.moods.push({ mood: mood, time: Date.now() });
        if(typeof saveData === 'function') saveData();
    }

    async function fetchMoodAnalysis(){
        if(!currentTarget) return;
        const c = currentTarget;
        ensureData(c);
        const ctx = buildContext(c);
        const moods = (c.coupleSpace.moods || []).slice(-20).map(m => m.mood).join(', ');

        const el = document.getElementById('cs-mood-report');
        el.innerHTML = '<span class="cs-loading"><span class="cs-loading-dot"><span></span><span></span><span></span></span> AI 正在分析情绪曲线...</span>';

        // 展开手风琴
        const ac = el.closest('.cs-ac');
        if(ac) ac.classList.add('open');

        const name = c.chatRemark || c.name;
        const prompt = `你是只服务于「${name}」和TA恋人这两个人的关系分析师。禁止提及任何第三者。请根据以下信息生成一份只属于你们两人的"情绪洞察报告"。

${ctx}

用户最近记录的情绪胶囊（按时间顺序）：${moods || '暂无记录'}

请输出（只围绕这两个人）：
1. 近期情绪曲线（用→连接情绪变化趋势）
2. 你们两人的同频指数（0-100%）
3. 只针对你们两人的建议（80字以内，具体可执行）

直接输出文字即可，不要用JSON格式。`;

        const result = await csCallAI(prompt);
        el.textContent = result || '分析失败，请重试';
    }

    // ===== 许愿池 =====
    function renderWishes(){
        const c = currentTarget;
        if(!c) return;
        ensureData(c);
        const list = document.getElementById('cs-wish-list');
        list.innerHTML = '';
        c.coupleSpace.wishes.forEach((w, i) => {
            const item = document.createElement('div');
            item.className = 'cs-wish-item' + (w.done ? ' done' : '');
            item.innerHTML = `
                <div class="cs-wish-ck ${w.done ? 'on' : ''}" onclick="event.stopPropagation();CoupleSpace.toggleWish(${i})"></div>
                <div class="cs-wish-text">${w.text}</div>
                <div class="cs-wish-who">${w.who}</div>
                <div class="cs-del-btn" style="display:none;width:24px;height:24px;border-radius:50%;background:rgba(255,59,48,0.1);color:#FF3B30;font-size:12px;font-weight:900;cursor:pointer;flex-shrink:0;align-items:center;justify-content:center;" onclick="event.stopPropagation();CoupleSpace.deleteWish(${i})">✕</div>
            `;
            item.onclick = () => {
                const del = item.querySelector('.cs-del-btn');
                // 切换显示删除按钮
                const isShown = del.style.display === 'flex';
                // 先隐藏所有其他的删除按钮
                list.querySelectorAll('.cs-del-btn').forEach(d => d.style.display = 'none');
                del.style.display = isShown ? 'none' : 'flex';
            };
            list.appendChild(item);
        });
    }

    function addWish(){
        if(!currentTarget) return;
        const inp = document.getElementById('cs-wish-input');
        const text = inp.value.trim();
        if(!text) return;
        const c = currentTarget;
        ensureData(c);
        c.coupleSpace.wishes.unshift({ text: text, who: gConfig.meName || '我', done: false });
        if(typeof saveData === 'function') saveData();
        inp.value = '';
        renderWishes();
    }

    function toggleWish(idx){
        if(!currentTarget) return;
        const c = currentTarget;
        ensureData(c);
        if(c.coupleSpace.wishes[idx]) c.coupleSpace.wishes[idx].done = !c.coupleSpace.wishes[idx].done;
        if(typeof saveData === 'function') saveData();
        renderWishes();
    }

    async function fetchWishAI(){
        if(!currentTarget) return;
        const c = currentTarget;
        const ctx = buildContext(c);
        const name = c.chatRemark || c.name;
        ensureData(c);

        // 收集已有的愿望，避免重复
        const existing = c.coupleSpace.wishes.map(w => w.text).join('、') || '暂无';

        csToast(name + ' 正在想和你做的事...');

        const prompt = `你现在就是「${name}」。列出5件你想和对象一起做的事，必须用你自己的说话方式和性格来表达。禁止提第三者。

要求：
- 每条15字以内
- 100%符合你的人设性格
- 结合你们最近聊过的话题
- 别重复已有的

已有的（别重复）：${existing}

${ctx}

每行一条，不要编号，直接说：`;

        const result = await csCallAI(prompt);
        if(!result){ csToast('AI 无返回'); return; }

        // 强力正则清洗：支持各种AI可能输出的格式
        let lines = result
            .replace(/```[\s\S]*?```/g, '')           // 去掉代码块
            .replace(/\*\*/g, '')                       // 去掉加粗
            .split(/[\n\r]+/)                           // 按换行拆
            .map(l => l
                .replace(/^[\d]+[\.\、\)\）\:：]\s*/g, '') // 去掉 1. 2、3) 4：
                .replace(/^[\-\*·•▪▸►→]+\s*/g, '')     // 去掉 - * · • → 
                .replace(/^(想和你|带你|我们|和你)/,'$1')  // 保留关键开头
                .replace(/["""「」『』【】\[\]]/g, '')    // 去掉各种引号括号
                .trim()
            )
            .filter(l => l.length >= 2 && !/^(以下|好的|当然|这是|根据)/i.test(l)) // 过滤AI废话
            .map(l => l.length > 25 ? l.substring(0, 23) + '...' : l);
        
        if(lines.length === 0){
            // 终极降级：用句号/逗号拆分
            lines = result.replace(/["""]/g,'').split(/[。，！；、\.\,\!]/)
                .map(s => s.trim()).filter(s => s.length >= 2 && s.length <= 25);
        }
        if(lines.length === 0){
            lines.push(result.substring(0, 20));
        }

        let addedCount = 0;
        lines.forEach(text => {
            const isDuplicate = c.coupleSpace.wishes.some(w => w.text === text);
            if(!isDuplicate){
                c.coupleSpace.wishes.unshift({ text: text, who: name, done: false });
                addedCount++;
            }
        });

        if(typeof saveData === 'function') saveData();
        
        // 强制恢复 currentTarget 并用标准渲染函数
        currentTarget = c;
        renderWishes();
        csToast(`✓ ${name} 想了 ${addedCount} 件事`);
    }

    // ===== 情书匣子 =====
    function renderLetters(){
        const c = currentTarget;
        if(!c) return;
        ensureData(c);
        const list = document.getElementById('cs-letter-list');
        list.innerHTML = '';
        c.coupleSpace.letters.forEach((l, i) => {
            const item = document.createElement('div');
            item.className = 'cs-letter-item';
            const isLong = l.text.length > 60;
            item.innerHTML = `
                <div class="cs-letter-hd">
                    <div class="cs-letter-from">FROM: ${l.from}</div>
                    <div style="display:flex;align-items:center;gap:6px;">
                        <div class="cs-letter-date">${l.date}</div>
                        <div class="cs-del-btn" style="display:none;width:20px;height:20px;border-radius:50%;background:rgba(255,59,48,0.1);color:#FF3B30;font-size:10px;font-weight:900;cursor:pointer;align-items:center;justify-content:center;" onclick="event.stopPropagation();CoupleSpace.deleteLetter(${i})">✕</div>
                    </div>
                </div>
                <div class="cs-letter-pv" style="${isLong ? 'display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;max-height:4.5em;transition:max-height 0.3s ease;' : ''}">${l.text}</div>
                ${isLong ? '<div class="cs-letter-expand" style="font-family:monospace;font-size:9px;font-weight:800;color:rgba(0,0,0,0.25);letter-spacing:1px;margin-top:6px;cursor:pointer;text-align:right;padding:2px 0;-webkit-tap-highlight-color:transparent;" onclick="event.stopPropagation();var pv=this.previousElementSibling;var isOpen=pv.style.maxHeight===\'none\';pv.style.webkitLineClamp=isOpen?\'3\':\'unset\';pv.style.maxHeight=isOpen?\'4.5em\':\'none\';pv.style.overflow=isOpen?\'hidden\':\'visible\';pv.style.display=isOpen?\'-webkit-box\':\'block\';this.textContent=isOpen?\'展开全文 ▾\':\'收起 ▴\';">展开全文 ▾</div>' : ''}
            `;
            item.onclick = (e) => {
                if(e.target.classList.contains('cs-letter-expand')) return;
                const del = item.querySelector('.cs-del-btn');
                const isShown = del.style.display === 'flex';
                list.querySelectorAll('.cs-del-btn').forEach(d => d.style.display = 'none');
                del.style.display = isShown ? 'none' : 'flex';
            };
            list.appendChild(item);
        });
    }

    async function fetchLetterAI(){
        if(!currentTarget) return;
        const c = currentTarget;
        const name = c.chatRemark || c.name;
        const ctx = buildContext(c);
        ensureData(c);

        const existing = c.coupleSpace.letters.map(l => l.text.substring(0, 20)).join('、') || '暂无';

        csToast(name + ' 正在给你写情书...');

        const SEP = '§§§';
        const prompt = `你现在就是「${name}」。给你对象发4条私密消息，用你自己的方式表达感情。必须100%符合你的人设性格——你平时怎么说话就怎么写。禁止提第三者。用"你"称呼对象。

要求：
- 每条30-60字，像平时发消息一样自然
- 4条要有不同的情绪和语气，但都必须是你这个角色会说的话
- 可以用口语、语气词、但是禁止使用emoji、可以使用省略号
- 别用书信格式，就正常说话
- 每条之间用 ${SEP} 分隔
- 不要加编号标题

已有的（别重复）：${existing}

${ctx}

直接说：`;

        const result = await csCallAI(prompt);
        if(!result) return;

        const cleaned = result.replace(/```[\s\S]*?```/g, '').replace(/\*\*/g, '').trim();
        let parts = [];
        if(cleaned.includes(SEP)){
            parts = cleaned.split(SEP).map(s => s.replace(/^[\s\n\r:：]+/, '').replace(/^(深情|俏皮|文艺|霸道)[款风格\s：:]*[：:]?\s*/gi, '').trim()).filter(s => s.length >= 5);
        } else {
            parts = cleaned.split(/\n{2,}/).map(s => s.replace(/^[\d\.\-\*·•]+[\.\、\)\）\:：]?\s*/, '').replace(/^(深情|俏皮|文艺|霸道)[款风格\s：:]*[：:]?\s*/gi, '').trim()).filter(s => s.length >= 5);
        }
        if(parts.length === 0) parts.push(cleaned);

        let addedCount = 0;
        const date = getDateStr();
        parts.forEach(text => {
            const clean = text.replace(/["""]/g, '').trim();
            if(clean.length >= 5){
                c.coupleSpace.letters.unshift({ from: name, date: date, text: clean });
                addedCount++;
            }
        });

        if(typeof saveData === 'function') saveData();
        currentTarget = c;
        // 强制直接操作DOM
        const list = document.getElementById('cs-letter-list');
        if(list){
            currentTarget = c;
            renderLetters();
        }
        csToast('✓ ' + name + ' 写了 ' + addedCount + ' 封情书');
    }

    // ===== 誓言墙 =====
    function renderVow(){
        const c = currentTarget;
        if(!c) return;
        ensureData(c);
        if(!c.coupleSpace.vows) c.coupleSpace.vows = [];
        // 兼容旧数据：如果有旧的 vow 字段，迁移到 vows 数组
        if(c.coupleSpace.vow && c.coupleSpace.vows.length === 0){
            c.coupleSpace.vows.push({ text: c.coupleSpace.vow, date: c.coupleSpace.vowDate || getDateStr() });
            delete c.coupleSpace.vow;
            delete c.coupleSpace.vowDate;
        }
        if(typeof c.coupleSpace.vowIndex !== 'number') c.coupleSpace.vowIndex = 0;

        const el = document.getElementById('cs-vow-text');
        const sig = document.getElementById('cs-vow-sig');
        const vows = c.coupleSpace.vows;
        const total = vows.length;

        // 删除旧的切换栏再重建
        let navWrap = document.getElementById('cs-vow-nav');
        if(navWrap) navWrap.remove();

        if(total === 0){
            el.textContent = '尚未刻录誓言，点击「AI誓词」生成';
            sig.textContent = '';
            return;
        }

        let idx = c.coupleSpace.vowIndex;
        if(idx < 0) idx = 0;
        if(idx >= total) idx = total - 1;
        c.coupleSpace.vowIndex = idx;

        const cur = vows[idx];
        el.innerHTML = cur.text.replace(/\n/g, '<br>');
        sig.textContent = '— 刻录于 ' + cur.date + ' ✦ （' + (idx + 1) + ' / ' + total + '）';

        // 创建切换栏（只要有誓言就显示，哪怕只剩一条也能删）
        if(total >= 1){
            navWrap = document.createElement('div');
            navWrap.id = 'cs-vow-nav';
            navWrap.style.cssText = 'display:flex;justify-content:center;align-items:center;gap:16px;padding:8px 0 16px;';

            const btnPrev = document.createElement('div');
            btnPrev.style.cssText = 'width:32px;height:32px;border-radius:50%;background:' + (idx > 0 ? '#1C1C1E' : 'rgba(0,0,0,0.06)') + ';display:flex;align-items:center;justify-content:center;cursor:pointer;';
            btnPrev.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="' + (idx > 0 ? '#fff' : '#AEAEB2') + '" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>';
            if(idx > 0) btnPrev.onclick = () => { c.coupleSpace.vowIndex--; renderVow(); };

            const dots = document.createElement('div');
            dots.style.cssText = 'display:flex;gap:5px;align-items:center;';
            for(let i = 0; i < total; i++){
                const dot = document.createElement('div');
                dot.style.cssText = 'width:' + (i === idx ? '16px' : '5px') + ';height:5px;border-radius:3px;background:' + (i === idx ? '#1C1C1E' : 'rgba(0,0,0,0.1)') + ';transition:all 0.2s;cursor:pointer;';
                dot.onclick = ((ii) => () => { c.coupleSpace.vowIndex = ii; renderVow(); })(i);
                dots.appendChild(dot);
            }

            const btnNext = document.createElement('div');
            btnNext.style.cssText = 'width:32px;height:32px;border-radius:50%;background:' + (idx < total - 1 ? '#1C1C1E' : 'rgba(0,0,0,0.06)') + ';display:flex;align-items:center;justify-content:center;cursor:pointer;';
            btnNext.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="' + (idx < total - 1 ? '#fff' : '#AEAEB2') + '" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>';
            if(idx < total - 1) btnNext.onclick = () => { c.coupleSpace.vowIndex++; renderVow(); };

            // 删除当前这条
            const btnDel = document.createElement('div');
            btnDel.style.cssText = 'width:32px;height:32px;border-radius:50%;background:rgba(255,59,48,0.08);display:flex;align-items:center;justify-content:center;cursor:pointer;margin-left:8px;';
            btnDel.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
            btnDel.onclick = () => {
                c.coupleSpace.vows.splice(idx, 1);
                if(c.coupleSpace.vowIndex >= c.coupleSpace.vows.length) c.coupleSpace.vowIndex = Math.max(0, c.coupleSpace.vows.length - 1);
                if(typeof saveData === 'function') saveData();
                renderVow();
            };

            navWrap.appendChild(btnPrev);
            navWrap.appendChild(dots);
            navWrap.appendChild(btnNext);
            navWrap.appendChild(btnDel);

            sig.parentNode.insertBefore(navWrap, sig.nextSibling);
        }
    }

    async function fetchVowAI(){
        if(!currentTarget) return;
        const c = currentTarget;
        const name = c.chatRemark || c.name;
        const ctx = buildContext(c);
        ensureData(c);
        if(!c.coupleSpace.vows) c.coupleSpace.vows = [];

        csToast(name + ' 正在刻录誓言...');

        const SEP = '§§§';
        const prompt = `你现在就是「${name}」。用你自己的方式，对你对象说5段承诺。必须100%符合你的人设性格——如果你高冷就高冷地承诺，如果你话多就絮絮叨叨地说，如果你毒舌就用毒舌的方式表达。禁止提第三者。用"你"称呼对象。

要求：
- 每段2-3句，用你平时说话的方式
- 5段要有不同的情绪场景，但语气都是你的
- 可以用口语、语气词、禁止使用emoji
- 不要搞得像婚礼致辞，就像私下对对象说的
- 每段之间用 ${SEP} 分隔
- 不要加编号标题

${ctx}

直接说：`;

        const result = await csCallAI(prompt);
        if(!result) return;

        const cleaned = result.replace(/```[\s\S]*?```/g, '').replace(/\*\*/g, '').trim();
        let parts = [];
        if(cleaned.includes(SEP)){
            parts = cleaned.split(SEP)
                .map(s => s.replace(/["""]/g, '').trim())
                .filter(s => s.length >= 5);
        } else {
            // 不用双换行拆，改用编号或明显的段落标记拆分
            const numSplit = cleaned.split(/(?:^|\n)(?=\d[\.\、\)\）]|\-\s|·\s|\*\s)/);
            if(numSplit.length >= 3){
                parts = numSplit.map(s => s.replace(/^[\d\.\-\*·•]+[\.\、\)\）\:：]?\s*/, '').replace(/["""]/g, '').trim()).filter(s => s.length >= 5);
            } else {
                // 终极降级：整段当一条
                parts = [cleaned.replace(/["""]/g, '')];
            }
        }
        if(parts.length === 0) parts.push(cleaned.replace(/["""]/g, ''));

        const date = getDateStr();
        parts.forEach(text => {
            c.coupleSpace.vows.push({ text: text, date: date });
        });
        c.coupleSpace.vowIndex = c.coupleSpace.vows.length - parts.length; // 指向第一条新的

        if(typeof saveData === 'function') saveData();
        // 强制恢复引用，然后渲染
        currentTarget = c;
        // 直接写DOM兜底
        const el = document.getElementById('cs-vow-text');
        if(el && c.coupleSpace.vows.length > 0){
            const idx = c.coupleSpace.vowIndex;
            const cur = c.coupleSpace.vows[idx];
            el.innerHTML = cur.text.replace(/\n/g, '<br>');
            const sig = document.getElementById('cs-vow-sig');
            if(sig) sig.textContent = '— 刻录于 ' + cur.date + ' ✦ （' + (idx+1) + ' / ' + c.coupleSpace.vows.length + '）';
        }
        // 再走一遍完整渲染（含切换按钮）
        renderVow();
        csToast('✓ ' + name + ' 刻录了 ' + parts.length + ' 段誓言');
    }

    // ===== HUD =====
    function openHUD(){ document.getElementById('cs-hud-panel').classList.add('active'); }
    function closeHUD(){ document.getElementById('cs-hud-panel').classList.remove('active'); }

    // ===== 打开 App =====
    function open(){
        // 重置状态：每次打开都回到选择页
        currentTarget = null;
        document.getElementById('cs-sel-page').classList.remove('hide');
        document.getElementById('cs-space-page').style.display = 'none';
        renderSelectionList();
        openApp('couple-space');
    }

    // ===== 删除功能 =====
    function deleteWish(idx){
        if(!currentTarget) return;
        const c = currentTarget;
        ensureData(c);
        c.coupleSpace.wishes.splice(idx, 1);
        if(typeof saveData === 'function') saveData();
        renderWishes();
    }

    function deleteLetter(idx){
        if(!currentTarget) return;
        const c = currentTarget;
        ensureData(c);
        c.coupleSpace.letters.splice(idx, 1);
        if(typeof saveData === 'function') saveData();
        renderLetters();
    }

    function deleteMood(idx){
        if(!currentTarget) return;
        const c = currentTarget;
        ensureData(c);
        c.coupleSpace.moods.splice(idx, 1);
        if(typeof saveData === 'function') saveData();
        renderMoodHistory();
    }

    function renderMoodHistory(){
        // 情绪胶囊没有独立的列表DOM，暂不需要额外渲染
    }

    // ===== 公共 API =====
    return {
        open,
        backToSel,
        switchPanel,
        fetchAllDaily,
        packAndSend,
        pickMood,
        fetchMoodAnalysis,
        addWish,
        toggleWish,
        deleteWish,
        deleteLetter,
        deleteMood,
        fetchWishAI,
        fetchLetterAI,
        fetchVowAI,
        openHUD,
        closeHUD,
        renderSelectionList
    };
})();
