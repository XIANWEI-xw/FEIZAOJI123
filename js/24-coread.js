// ============================================================
// SOAP.OS — 共读小说系统 (Co-Reading Module)
// ============================================================

window.CoRead = {
    books: [],
    currentBookId: null,
    pipContactId: null,
    currentPage: 0,
    wordsPerPage: 200,
    fontSize: 13,

    /* ---------- 初始化 ---------- */
    init() {
        try {
            const s = localStorage.getItem('soap_coread_books_v1');
            if (s) this.books = JSON.parse(s);
        } catch (e) { this.books = []; }
        this.injectStyles();
        this.injectLibrary();
    },

    saveBooks() {
        localStorage.setItem('soap_coread_books_v1', JSON.stringify(this.books));
    },

    /* ---------- 样式注入 ---------- */
    injectStyles() {
        if (document.getElementById('coread-style')) return;
        const s = document.createElement('style');
        s.id = 'coread-style';
        s.innerHTML = `
/* ===== 书库全屏页 ===== */
.coread-lib {
    position:absolute; inset:0; z-index:550;
    background:#F9F9F7;
    display:flex; flex-direction:column;
    transform:translateY(100%);
    transition:transform .4s cubic-bezier(.4,0,.2,1);
}
.coread-lib.active { transform:translateY(0); }

.coread-lib-ambient { position:absolute; inset:0; pointer-events:none; z-index:0; }

.coread-lib-head {
    position:relative; z-index:2;
    padding:calc(var(--safe-top, 0px) + 24px) 28px 16px;
    background:transparent;
    display:flex; justify-content:space-between; align-items:flex-start;
}
.coread-lib-head-l { flex:1; }
.coread-lib-eyebrow {
    font:700 8px/1 'Courier New',monospace;
    letter-spacing:4px; color:#5A5A5A;
    text-transform:uppercase; margin-bottom:10px;
    display:flex; align-items:center; gap:8px;
}
.coread-lib-eyebrow::after { content:''; flex:1; height:.5px; background:#5A5A5A; opacity:.3; max-width:60px; }
.coread-lib-title { font:900 30px/1 Georgia,'Times New Roman',serif; color:#1A1A1A; letter-spacing:-1px; }
.coread-lib-title em { font-style:italic; color:#5A5A5A; }
.coread-lib-sub { font:400 11px/1 'Courier New',monospace; color:#9A9A9A; letter-spacing:1px; margin-top:6px; }

.coread-lib-close {
    width:34px; height:34px; border-radius:50%;
    background:rgba(0,0,0,0.05);
    display:flex; align-items:center; justify-content:center;
    cursor:pointer; transition:.15s; flex-shrink:0; margin-top:24px;
}
.coread-lib-close:hover { background:rgba(0,0,0,0.1); }

.coread-lib-import {
    position:relative; z-index:2;
    margin:14px 28px 0;
    border:1px dashed rgba(26,26,26,0.14);
    border-radius:14px;
    padding:13px 18px;
    display:flex; align-items:center; gap:12px;
    cursor:pointer; background:#fff; transition:.18s;
    box-shadow:0 1px 10px rgba(0,0,0,0.04);
}
.coread-lib-import:active { transform:scale(.98); }
.coread-lib-iico {
    width:32px; height:32px; border-radius:9px;
    background:#1A1A1A;
    display:flex; align-items:center; justify-content:center; flex-shrink:0;
}
.coread-lib-it { font-size:13px; font-weight:800; color:#1A1A1A; }
.coread-lib-is { font:700 9px/1 'Courier New',monospace; color:#9A9A9A; letter-spacing:1.5px; margin-top:3px; }

.coread-lib-section {
    position:relative; z-index:2;
    padding:18px 28px 10px;
    display:flex; align-items:center; gap:10px;
}
.coread-lib-section-line { flex:1; height:.5px; background:rgba(26,26,26,0.08); }
.coread-lib-section-label {
    font:700 8px/1 'Courier New',monospace;
    letter-spacing:3px; color:#9A9A9A;
    text-transform:uppercase; white-space:nowrap;
}

.coread-lib-list {
    flex:1; overflow-y:auto;
    padding:0 28px calc(var(--safe-bottom, 0px) + 40px);
    position:relative; z-index:2;
}
.coread-lib-list::-webkit-scrollbar { display:none; }

.coread-lib-empty {
    text-align:center; padding:60px 0 30px;
    color:#9A9A9A; font:700 10px/1.8 'Courier New',monospace; letter-spacing:2px;
}
.coread-lib-empty svg { margin:0 auto 14px; display:block; opacity:.25; }

.coread-bk {
    background:#fff; border-radius:16px;
    padding:14px 16px; margin-bottom:11px;
    display:flex; align-items:center; gap:13px;
    cursor:pointer; transition:.18s;
    box-shadow:0 1px 0 rgba(26,26,26,0.07), 0 3px 14px rgba(0,0,0,0.04);
    position:relative;
}
.coread-bk:active { transform:scale(.975); }
.coread-bk-cover {
    width:42px; height:56px; border-radius:5px;
    background:#1A1A1A; flex-shrink:0;
    position:relative; overflow:hidden;
    display:flex; align-items:center; justify-content:center;
    cursor:pointer;
    transition:.15s;
}
.coread-bk-cover:active { transform:scale(.92); }
.coread-bk-cover img {
    width:100%; height:100%; object-fit:cover;
    position:absolute; inset:0; z-index:1;
}
.coread-bk-cover .coread-bk-cover-mask {
    position:absolute; inset:0; z-index:2;
    background:rgba(0,0,0,0); transition:.15s;
    display:flex; align-items:center; justify-content:center;
    opacity:0;
}
.coread-bk-cover:hover .coread-bk-cover-mask { opacity:1; background:rgba(0,0,0,0.4); }
.coread-bk-spine { position:absolute; left:0; top:0; bottom:0; width:3px; background:rgba(255,255,255,0.06); z-index:3; pointer-events:none; }
.coread-bk-info { flex:1; min-width:0; }
.coread-bk-name { font:800 14px/1.2 Georgia,'Times New Roman',serif; color:#1A1A1A; letter-spacing:-.2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.coread-bk-meta { font:400 10px/1 'Courier New',monospace; color:#9A9A9A; margin-top:5px; letter-spacing:.5px; }
.coread-bk-prog { display:flex; align-items:center; gap:7px; margin-top:8px; }
.coread-bk-pt { flex:1; height:1.5px; background:rgba(0,0,0,0.07); border-radius:2px; overflow:hidden; }
.coread-bk-pf { height:100%; background:#5A5A5A; border-radius:2px; }
.coread-bk-px { font:700 9px/1 'Courier New',monospace; color:#9A9A9A; flex-shrink:0; }
.coread-bk-del { padding:6px; cursor:pointer; color:rgba(0,0,0,0.18); transition:.15s; flex-shrink:0; }
.coread-bk-del:hover { color:#FF3B30; }

/* ===== 悬浮小窗 ===== */
.coread-pip {
    position:absolute; top:106px; right:14px; width:216px;
    border-radius:10px; background:#FFFFFF;
    box-shadow:0 2px 0 rgba(0,0,0,.06),0 20px 50px rgba(0,0,0,.12),0 0 0 .5px rgba(0,0,0,.07);
    display:none; flex-direction:column; overflow:visible; z-index:600;
}
.coread-pip.show { display:flex; }
.coread-pip-wm { position:absolute; inset:0; pointer-events:none; z-index:0; display:flex; align-items:center; justify-content:center; overflow:hidden; border-radius:10px; }
.coread-pip-head { padding:11px 12px 9px; border-bottom:.5px solid rgba(0,0,0,.07); cursor:grab; display:flex; align-items:flex-start; justify-content:space-between; position:relative; z-index:6; background:#FFFFFF; flex-shrink:0; border-radius:10px 10px 0 0; }
.coread-pip-head:active { cursor:grabbing; }
.coread-pip-title { font:800 13px/1.2 Georgia,'Times New Roman',serif; color:#1A1A1A; max-width:140px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.coread-pip-author { font:700 8px/1 'Courier New',monospace; color:#5A5A5A; letter-spacing:1px; margin-top:3px; }
.coread-pip-cfg { width:22px; height:22px; border-radius:5px; background:rgba(0,0,0,.04); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:.15s; flex-shrink:0; }
.coread-pip-cfg:hover { background:rgba(0,0,0,.08); }
.coread-pip-cfg.active { background:#1A1A1A; }
.coread-pip-cfg.active svg { stroke:#fff!important; }
.coread-pip-x { width:11px; height:11px; border-radius:50%; background:#FF3B30; cursor:pointer; flex-shrink:0; transition:.15s; display:flex; align-items:center; justify-content:center; color:rgba(0,0,0,0); font-size:9px; font-weight:900; line-height:1; }
.coread-pip-x:hover { color:rgba(0,0,0,0.45); }
.coread-pip-body { overflow-y:auto; padding:12px 13px 10px; height:200px; font-family:Georgia,'Times New Roman',serif; line-height:1.85; color:#2A2A2A; text-align:justify; position:relative; z-index:2; transition:opacity .18s; }
.coread-pip-body::-webkit-scrollbar { display:none; }
.coread-pip-foot { border-top:.5px solid rgba(0,0,0,.07); padding:8px 12px; display:flex; align-items:center; justify-content:space-between; position:relative; z-index:2; background:#FFFFFF; flex-shrink:0; border-radius:0 0 10px 10px; }
.coread-pip-pg { display:flex; align-items:center; gap:4px; font:700 8px/1 'Courier New',monospace; color:#5A5A5A; cursor:pointer; padding:5px 7px; border-radius:6px; letter-spacing:1px; transition:.12s; }
.coread-pip-pg:hover { color:#1A1A1A; background:rgba(0,0,0,.04); }
.coread-pip-pg:active { transform:scale(.9); }
.coread-pip-num { font:700 9px/1 'Courier New',monospace; color:#5A5A5A; letter-spacing:1px; }
.coread-pip-settings { position:absolute; top:100%; left:0; right:0; background:#fff; border-radius:0 0 10px 10px; border-top:.5px solid rgba(0,0,0,.07); overflow:hidden; max-height:0; transition:max-height .28s cubic-bezier(.4,0,.2,1), box-shadow .28s; z-index:5; box-shadow:none; }
.coread-pip-settings.open { max-height:260px; box-shadow:0 16px 30px rgba(0,0,0,.1); }
.coread-pip-sin { padding:14px 13px 13px; }
.coread-pip-st { font:700 8px/1 'Courier New',monospace; letter-spacing:2px; color:#5A5A5A; text-transform:uppercase; margin-bottom:12px; }
.coread-pip-sr { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
.coread-pip-sl { font:700 9px/1 'Courier New',monospace; color:#5A5A5A; letter-spacing:1px; }
.coread-pip-step { display:flex; align-items:center; background:#F5F5F3; border-radius:7px; overflow:hidden; }
.coread-pip-sb { width:26px; height:24px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:15px; font-weight:700; color:#1A1A1A; user-select:none; transition:.12s; }
.coread-pip-sb:active { background:rgba(0,0,0,.08); }
.coread-pip-sv { font:700 11px/1 'Courier New',monospace; padding:0 5px; min-width:28px; text-align:center; color:#1A1A1A; }
.coread-pip-wi { width:62px; height:26px; border:.5px solid rgba(0,0,0,.12); border-radius:7px; background:#F8F8F6; font:700 12px/1 'Courier New',monospace; color:#1A1A1A; padding:0 6px; text-align:center; outline:none; letter-spacing:.5px; -moz-appearance:textfield; }
.coread-pip-wi::-webkit-outer-spin-button, .coread-pip-wi::-webkit-inner-spin-button { -webkit-appearance:none; margin:0; }
.coread-pip-wi:focus { border-color:#5A5A5A; background:#fff; }
/* 书库列表:正在共读的书卡高亮与结束按钮 */
.coread-bk.is-reading {
    background: #FFFFFF;
    border: 1px solid rgba(52,199,89,0.3);
    box-shadow: 0 4px 16px rgba(52,199,89,0.08);
}
.coread-bk-reading-badge {
    display:inline-flex; align-items:center; gap:5px;
    font:700 8px/1 'Courier New',monospace;
    letter-spacing:2px; color:#34C759;
    margin-bottom:6px;
}
.coread-bk-reading-badge .cb-dot {
    width:5px; height:5px; border-radius:50%;
    background:#34C759;
    box-shadow:0 0 0 2px rgba(52,199,89,0.2);
    animation:crDot 1.6s ease-in-out infinite;
}
@keyframes crDot { 0%,100% { opacity:1; } 50% { opacity:0.45; } }
.coread-bk-end-btn {
    flex-shrink:0;
    padding:7px 12px;
    background:rgba(255,59,48,0.12);
    color:#FF3B30;
    border:none; border-radius:8px;
    font:700 9px/1 'Courier New',monospace;
    letter-spacing:1.5px;
    cursor:pointer; transition:.15s;
}
.coread-bk-end-btn:hover { background:rgba(255,59,48,0.22); }
.coread-bk-end-btn:active { transform:scale(.92); }

/* ===== 聊天室里的共读通知卡片 ===== */
/* 强制重置 bubble-sys 容器，让卡片完整显示且居中 */
.msg-row.sys-row:has(.cr-notice-card) {
    justify-content:center !important;
    width:100% !important;
}
.bubble-sys:has(.cr-notice-card) {
    background:transparent !important;
    padding:0 !important;
    box-shadow:none !important;
    border:none !important;
    max-width:100% !important;
    width:auto !important;
    border-radius:0 !important;
}
.cr-notice-wrap {
    width:100%;
    display:flex;
    justify-content:center;
    align-items:center;
    padding:4px 0;
}
.cr-notice-card {
    background:#FFFFFF;
    border-radius:14px;
    padding:0;
    width:240px;
    max-width:80%;
    overflow:hidden;
    box-shadow:0 8px 24px rgba(0,0,0,0.08), 0 0 0 .5px rgba(0,0,0,0.05);
    cursor:pointer;
    transition:.18s;
    position:relative;
    display:inline-block;
    margin:0 auto;
}
.cr-notice-card .crn-ico-cover {
    position:absolute; inset:0;
    width:100%; height:100%; object-fit:cover;
    z-index:1;
}
.cr-notice-card .crn-ico-fallback {
    position:relative; z-index:2;
}
.cr-notice-card:active { transform:scale(.97); }
.cr-notice-card .crn-bar {
    height:3px;
    background:linear-gradient(90deg, #1A1A1A 0%, #5A5A5A 50%, #1A1A1A 100%);
}
.cr-notice-card.end .crn-bar {
    background:linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.15) 50%, transparent 100%);
}
.cr-notice-card .crn-inner {
    padding:13px 15px 14px;
    display:flex; align-items:center; gap:12px;
}
.cr-notice-card .crn-ico {
    width:36px; height:48px; border-radius:5px;
    background:#1A1A1A;
    display:flex; align-items:center; justify-content:center;
    flex-shrink:0; position:relative; overflow:hidden;
}
.cr-notice-card.end .crn-ico {
    background:#F2F2F0;
}
.cr-notice-card .crn-ico::before {
    content:'';
    position:absolute; left:0; top:0; bottom:0; width:3px;
    background:rgba(255,255,255,0.08);
}
.cr-notice-card.end .crn-ico::before {
    background:rgba(0,0,0,0.05);
}
.cr-notice-card .crn-info { flex:1; min-width:0; }
.cr-notice-card .crn-eyebrow {
    font:700 8px/1 'Courier New',monospace;
    letter-spacing:2.5px;
    color:#1A1A1A;
    margin-bottom:4px;
    display:flex; align-items:center; gap:6px;
}
.cr-notice-card.end .crn-eyebrow { color:#9A9A9A; }
.cr-notice-card .crn-dot {
    width:5px; height:5px; border-radius:50%;
    background:#34C759;
    box-shadow:0 0 0 2px rgba(52,199,89,0.15);
}
.cr-notice-card.end .crn-dot {
    background:#C7C7CC;
    box-shadow:none;
}
.cr-notice-card .crn-book {
    font:800 13px/1.2 Georgia,'Times New Roman',serif;
    color:#1A1A1A;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
    margin-bottom:3px;
}
.cr-notice-card.end .crn-book { color:#5A5A5A; }
.cr-notice-card .crn-desc {
    font:700 8px/1 'Courier New',monospace;
    color:#9A9A9A;
    letter-spacing:1px;
}
        `;
        document.head.appendChild(s);
    },

    /* ---------- 书库注入 ---------- */
    injectLibrary() {
        if (document.getElementById('coread-library')) return;
        const modal = document.createElement('div');
        modal.id = 'coread-library';
        modal.className = 'coread-lib';
        modal.innerHTML = `
            <div class="coread-lib-ambient">
                <svg width="100%" height="100%" viewBox="0 0 430 932" preserveAspectRatio="xMidYMid slice">
                    <path d="M368 55l8.5 26.1h27.5l-22.2 16.1 8.5 26.1L368 107.6l-22.3 15.7 8.5-26.1L332 81.2h27.5Z" fill="none" stroke="rgba(26,26,26,0.055)" stroke-width="1.2"/>
                    <path d="M42 420l4.2 12.9h13.5l-10.9 7.9 4.2 12.9L42 445.4l-11 7.4 4.2-12.9L24.3 432.9h13.5Z" fill="none" stroke="rgba(26,26,26,0.045)" stroke-width="1"/>
                    <path d="M390 780l5.8 17.8h18.7l-15.1 11 5.8 17.8L390 814.4l-15.2 10.2 5.8-17.8L371.1 797.8h18.7Z" fill="none" stroke="rgba(26,26,26,0.04)" stroke-width="1"/>
                </svg>
            </div>
            <div class="coread-lib-head">
                <div class="coread-lib-head-l">
                    <div class="coread-lib-eyebrow">SOAP · BIBLIOTHECA</div>
                    <div class="coread-lib-title">书<em>库</em></div>
                    <div class="coread-lib-sub">CO-READING LIBRARY</div>
                </div>
                <div class="coread-lib-close" onclick="CoRead.closeLibrary()">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </div>
            </div>
            <label class="coread-lib-import">
                <div class="coread-lib-iico">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
                </div>
                <div style="flex:1;">
                    <div class="coread-lib-it">导入新书</div>
                    <div class="coread-lib-is">TXT / EPUB · 自动识别编码</div>
                </div>
                <input type="file" accept=".txt,.epub,text/plain,application/epub+zip" hidden onchange="CoRead.handleFileUpload(event)">
            </label>
            <div class="coread-lib-section">
                <div class="coread-lib-section-label">已收录 · ARCHIVE</div>
                <div class="coread-lib-section-line"></div>
            </div>
            <div class="coread-lib-list" id="coread-lib-list"></div>
        `;
        const frame = document.getElementById('main-frame') || document.body;
        frame.appendChild(modal);
    },

    openLibrary() {
        if (typeof closeChatMenu === 'function') closeChatMenu();
        this.renderLibrary();
        document.getElementById('coread-library').classList.add('active');
    },

    closeLibrary() {
        const modal = document.getElementById('coread-library');
        if (modal) modal.classList.remove('active');
    },

    /* ---------- 文件上传 ---------- */
    handleFileUpload(e) {
        const file = e.target.files[0];
        e.target.value = '';
        if (!file) return;

        // EPUB 文件走专用解析流程
        if (file.name.toLowerCase().endsWith('.epub')) {
            this.handleEpubUpload(file);
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            let content = ev.target.result;
            const garbleCount = (content.match(/\uFFFD/g) || []).length;
            if (garbleCount > 5) {
                if (confirm('检测到文件可能不是 UTF-8 编码。\n是否尝试用 GBK 编码重新读取？')) {
                    this.readAsGBK(file);
                    return;
                }
            }
            this.addBook(file.name.replace(/\.[^/.]+$/, ''), content);
        };
        reader.onerror = () => alert('读取文件失败');
        reader.readAsText(file, 'UTF-8');
    },

    /* ---------- EPUB 解析引擎 ---------- */
    async handleEpubUpload(file) {
        try {
            if (typeof JSZip === 'undefined') {
                // 动态加载 JSZip
                await new Promise((resolve, reject) => {
                    const s = document.createElement('script');
                    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
                    s.onload = resolve;
                    s.onerror = () => reject(new Error('JSZip 加载失败'));
                    document.head.appendChild(s);
                });
            }

            const arrayBuffer = await file.arrayBuffer();
            const zip = await JSZip.loadAsync(arrayBuffer);

            // 1. 解析 META-INF/container.xml 找到 rootfile
            const containerXml = await zip.file('META-INF/container.xml').async('string');
            const containerDoc = new DOMParser().parseFromString(containerXml, 'application/xml');
            const rootfilePath = containerDoc.querySelector('rootfile').getAttribute('full-path');
            const rootDir = rootfilePath.includes('/') ? rootfilePath.substring(0, rootfilePath.lastIndexOf('/') + 1) : '';

            // 2. 解析 OPF 文件，获取 spine顺序和 manifest
            const opfXml = await zip.file(rootfilePath).async('string');
            const opfDoc = new DOMParser().parseFromString(opfXml, 'application/xml');

            // 获取书名
            const titleEl = opfDoc.querySelector('metadata title');
            const bookName = titleEl ? titleEl.textContent.trim() : file.name.replace(/\.[^/.]+$/, '');

            // 构建 manifest map: id -> href
            const manifest = {};
            opfDoc.querySelectorAll('manifest item').forEach(item => {
                manifest[item.getAttribute('id')] = item.getAttribute('href');
            });

            // 获取 spine 顺序
            const spineItems = [];
            opfDoc.querySelectorAll('spine itemref').forEach(ref => {
                const idref = ref.getAttribute('idref');
                if (manifest[idref]) spineItems.push(manifest[idref]);
            });

            // 3. 按顺序读取每个章节的XHTML，提取纯文本
            let fullText = '';
            for (const href of spineItems) {
                const filePath = rootDir + href;
                const zipEntry = zip.file(filePath);
                if (!zipEntry) continue;
                const html = await zipEntry.async('string');
                const doc = new DOMParser().parseFromString(html, 'application/xhtml+xml');
                const body = doc.querySelector('body');
                if (!body) continue;
                // 提取文本，保留段落换行
                const paragraphs = body.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6');
                if (paragraphs.length > 0) {
                    paragraphs.forEach(p => {
                        const t = p.textContent.trim();
                        if (t) fullText += t + '\n\n';
                    });
                } else {
                    const t = body.textContent.trim();
                    if (t) fullText += t + '\n\n';
                }
            }

            if (!fullText.trim()) {
                alert('EPUB 解析完成但未提取到文本内容，请检查文件是否有效。');
                return;
            }

            // 4. 尝试提取封面图片
            let coverData = null;
            const coverMeta = opfDoc.querySelector('metadata meta[name="cover"]');
            const coverId = coverMeta ? coverMeta.getAttribute('content') : null;
            if (coverId && manifest[coverId]) {
                const coverPath = rootDir + manifest[coverId];
                const coverEntry = zip.file(coverPath);
                if (coverEntry) {
                    try {
                        const blob = await coverEntry.async('blob');
                        if (blob.size < 2* 1024 * 1024) {
                            coverData = await new Promise(resolve => {
                                const r = new FileReader();
                                r.onload = () => resolve(r.result);
                                r.onerror = () => resolve(null);
                                r.readAsDataURL(blob);
                            });
                        }
                    } catch (err) { /* ignore cover extraction errors */ }
                }
            }

            const book = {
                id: 'book_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                name: bookName,
                content: fullText.trim(),
                cover: coverData,
                progress: 0,
                createdAt: Date.now()
            };
            this.books.unshift(book);
            this.saveBooks();
            this.renderLibrary();} catch (err) {
            console.error('[CoRead EPUB]', err);
            alert('EPUB 解析失败：' + err.message + '\n\n请确保文件是有效的 .epub 格式。');
        }
    },

    readAsGBK(file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            this.addBook(file.name.replace(/\.[^/.]+$/, ''), ev.target.result);
        };
        reader.readAsText(file, 'GBK');
    },

    addBook(name, content) {
        if (!content || !content.trim()) {
            alert('文件内容为空');
            return;
        }
        const book = {
            id: 'book_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name: name || '未命名',
            content: content,
            progress: 0,
            createdAt: Date.now()
        };
        this.books.unshift(book);
        this.saveBooks();
        this.renderLibrary();
    },

    deleteBook(id) {
        if (!confirm('确定从书库中删除这本书吗？')) return;
        this.books = this.books.filter(b => b.id !== id);
        this.saveBooks();
        this.renderLibrary();
    },

    /* ---------- 书库渲染 ---------- */
    renderLibrary() {
        const list = document.getElementById('coread-lib-list');
        if (!list) return;
        if (this.books.length === 0) {
            list.innerHTML = `
                <div class="coread-lib-empty">
                    <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="1.2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                    书库为空<br><span style="font-size:9px; opacity:.6;">点击上方"导入新书"开始收藏</span>
                </div>`;
            return;
        }
        // 找出当前联系人正在共读的书 ID
        let activeBookId = null;
        if (typeof currentContactId !== 'undefined' && currentContactId && typeof contacts !== 'undefined') {
            const curC = contacts.find(x => x.id === currentContactId);
            if (curC && curC.coReadingBook) activeBookId = curC.coReadingBook;
        }

        list.innerHTML = this.books.map(b => {
            const total = Math.max(1, Math.ceil(b.content.length / this.wordsPerPage));
            const pct = Math.min(100, Math.round((b.progress + 1) / total * 100));
            const isReading = (activeBookId === b.id);

            const coverHtml = b.cover
                ? `<img src="${b.cover}"><div class="coread-bk-cover-mask"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>`
                : `<svg width="22" height="22" viewBox="0 0 60 60" fill="none">
                        <path d="M30 9l5.7 17.5H54L39.7 37.2l5.7 17.5L30 44l-15.4 10.7 5.7-17.5L5.9 26.5H24.3Z" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="1.2"/>
                        <path d="M30 17l3.5 10.8H44.4L35.7 34l3.5 10.8L30 39.2l-9.2 5.6 3.5-10.8L15.6 27.8H26.5Z" fill="rgba(255,255,255,.07)" stroke="rgba(255,255,255,.3)" stroke-width="1"/>
                    </svg>
                    <div class="coread-bk-cover-mask"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>`;

            const readingBadge = isReading ? `<div class="coread-bk-reading-badge"><span class="cb-dot"></span>CO-READING · ACTIVE</div>` : '';
            const clickAction = isReading ? `CoRead.openPip()` : `CoRead.startCoReading('${b.id}')`;
            const rightSide = isReading
                ? `<button class="coread-bk-end-btn" onclick="event.stopPropagation(); CoRead.endCoReading()">END</button>`
                : `<div class="coread-bk-del" onclick="event.stopPropagation(); CoRead.deleteBook('${b.id}')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </div>`;

            return `
                <div class="coread-bk ${isReading ? 'is-reading' : ''}">
                    <div class="coread-bk-cover" onclick="event.stopPropagation(); CoRead.triggerCoverUpload('${b.id}')">
                        <div class="coread-bk-spine"></div>
                        ${coverHtml}
                    </div>
                    <div class="coread-bk-info" onclick="${clickAction}">
                        ${readingBadge}
                        <div class="coread-bk-name">${this.escapeHtml(b.name)}</div>
                        <div class="coread-bk-meta">${b.content.length.toLocaleString()} 字</div>
                        <div class="coread-bk-prog">
                            <div class="coread-bk-pt"><div class="coread-bk-pf" style="width:${pct}%"></div></div>
                            <div class="coread-bk-px">${pct}%</div>
                        </div>
                    </div>
                    ${rightSide}
                </div>
            `;
        }).join('');
    },

    /* ---------- 封面上传 ---------- */
    triggerCoverUpload(bookId) {
        let input = document.getElementById('coread-cover-upload-input');
        if (!input) {
            input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.id = 'coread-cover-upload-input';
            input.style.display = 'none';
            document.body.appendChild(input);
        }
        input.value = '';
        input.onchange = (e) => this.handleCoverUpload(e, bookId);
        input.click();
    },

    handleCoverUpload(e, bookId) {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            alert('请选择图片文件');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('图片过大（请控制在 5MB 以内）');
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            const book = this.books.find(b => b.id === bookId);
            if (!book) return;
            book.cover = ev.target.result;
            this.saveBooks();
            this.renderLibrary();
        };
        reader.readAsDataURL(file);
    },

    escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch]);
    },

    /* ---------- 开启共读 ---------- */
    startCoReading(bookId) {
        if (typeof currentContactId === 'undefined' || !currentContactId) {
            alert('请先打开一个聊天，再发起共读');
            return;
        }
        const book = this.books.find(b => b.id === bookId);
        if (!book) return;
        const c = contacts.find(x => x.id === currentContactId);
        if (!c) return;

        this.currentBookId = bookId;
        this.pipContactId = currentContactId;
        this.currentPage = book.progress || 0;
        c.coReadingBook = bookId;

        // 呼叫 11-chat-ui.js 的全局引擎，绝对不会卡壳！
        if (typeof window.pushCoReadCard === 'function') {
            window.pushCoReadCard(c.id, book.name, book.cover, true);
        }

        this.closeLibrary();
        this.openPip();
    },

    /* ---------- 结束共读 ---------- */
    endCoReading() {
        let targetContactId = this.pipContactId;
        if (!targetContactId && typeof contacts !== 'undefined') {
            const reading = contacts.find(x => x.coReadingBook);
            if (reading) targetContactId = reading.id;
        }
        if (!targetContactId && typeof currentContactId !== 'undefined' && currentContactId) {
            targetContactId = currentContactId;
        }
        if (!targetContactId) {
            this.closePip();
            return;
        }

        const c = contacts.find(x => x.id === targetContactId);
        if (!c) {
            this.closePip();
            this.pipContactId = null;
            this.currentBookId = null;
            return;
        }

        let book = null;
        if (c.coReadingBook) book = this.books.find(b => b.id === c.coReadingBook);
        if (!book && this.currentBookId) book = this.books.find(b => b.id === this.currentBookId);
        const bookName = book ? book.name : '小说';
        const bookCover = book ? book.cover : null;

        delete c.coReadingBook;

        // 呼叫 11-chat-ui.js 的全局引擎，绝对不会卡壳！
        if (typeof window.pushCoReadCard === 'function') {
            window.pushCoReadCard(c.id, bookName, bookCover, false);
        }

        // 不在聊天室时刷新联系人列表预览
        if (typeof currentContactId === 'undefined' || currentContactId !== targetContactId) {
            if (typeof renderContacts === 'function') renderContacts();
        }

        this.closePip();
        this.pipContactId = null;
        this.currentBookId = null;
        
        // 强制刷新全屏书单列表，消除 "正在共读" 状态的高亮和结束按钮
        this.renderLibrary();
    },

    /* ---------- 悬浮小窗 ---------- */
    openPip() {
        let pip = document.getElementById('coread-pip');
        if (!pip) {
            this.createPip();
            pip = document.getElementById('coread-pip');
        }
        if (!this.currentBookId && this.pipContactId) {
            const c = contacts.find(x => x.id === this.pipContactId);
            if (c && c.coReadingBook) this.currentBookId = c.coReadingBook;
        } else if (!this.currentBookId && typeof currentContactId !== 'undefined') {
            const c = contacts.find(x => x.id === currentContactId);
            if (c && c.coReadingBook) {
                this.currentBookId = c.coReadingBook;
                this.pipContactId = currentContactId;
                const book = this.books.find(b => b.id === this.currentBookId);
                if (book) this.currentPage = book.progress || 0;
            }
        }
        pip.classList.add('show');
        this.renderPipContent();
    },

    closePip() {
        const pip = document.getElementById('coread-pip');
        if (pip) pip.classList.remove('show');
        const panel = document.getElementById('coread-pip-settings');
        const cfg = document.getElementById('coread-pip-cfg');
        if (panel) panel.classList.remove('open');
        if (cfg) cfg.classList.remove('active');
    },

    createPip() {
        const pip = document.createElement('div');
        pip.id = 'coread-pip';
        pip.className = 'coread-pip';
        pip.innerHTML = `
            <div class="coread-pip-wm">
                <svg width="150" height="150" viewBox="0 0 160 160" fill="none">
                    <path d="M80 24l10.8 33.2H127L97.3 76.5l10.8 33.2L80 90.4 51.9 109.7l10.8-33.2L32.9 57.2H69.2Z" stroke="rgba(90,90,90,0.07)" stroke-width="1.5" fill="rgba(90,90,90,0.018)"/>
                    <circle cx="80" cy="80" r="50" stroke="rgba(90,90,90,0.04)" stroke-width="1" fill="none" stroke-dasharray="3 5"/>
                </svg>
            </div>
            <div class="coread-pip-head" id="coread-pip-head">
                <div>
                    <div class="coread-pip-title" id="coread-pip-title">书名</div>
                    <div class="coread-pip-author" id="coread-pip-author">CO-READING</div>
                </div>
                <div style="display:flex; align-items:center; gap:6px;">
                    <div class="coread-pip-cfg" id="coread-pip-cfg" onclick="CoRead.toggleSettings(event)">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#5A5A5A" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="2.8"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-2.82-1.17l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.17-2.82H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                    </div>
                    <div class="coread-pip-x" title="结束共读" onclick="CoRead.endCoReading()">×</div>
                </div>
            </div>
            <div class="coread-pip-settings" id="coread-pip-settings">
                <div class="coread-pip-sin">
                    <div class="coread-pip-st">小窗设置 · SETTINGS</div>
                    <div class="coread-pip-sr">
                        <div class="coread-pip-sl">观看字号</div>
                        <div class="coread-pip-step">
                            <div class="coread-pip-sb" onclick="CoRead.adjFontSize(-1)">−</div>
                            <div class="coread-pip-sv" id="coread-pip-fs">13</div>
                            <div class="coread-pip-sb" onclick="CoRead.adjFontSize(1)">+</div>
                        </div>
                    </div>
                    <div class="coread-pip-sr" style="align-items:flex-start; flex-direction:column; gap:8px;">
                        <div class="coread-pip-sl">观看字数 · AI调取字数 (同步)</div>
                        <div style="display:flex; align-items:center; gap:6px;">
                            <input class="coread-pip-wi" type="number" id="coread-pip-wi" value="200" min="50" max="5000" step="50">
                            <div style="font:700 9px/1 'Courier New',monospace; color:#9A9A9A;">字</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="coread-pip-body" id="coread-pip-body">加载中...</div>
            <div class="coread-pip-foot">
                <div class="coread-pip-pg" onclick="CoRead.flip(-1)">
                    <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>
                    PREV
                </div>
                <div class="coread-pip-num" id="coread-pip-num">P.01</div>
                <div class="coread-pip-pg" onclick="CoRead.flip(1)">
                    NEXT
                    <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>
                </div>
            </div>
        `;
        const viewChat = document.getElementById('view-chat');
        if (viewChat) viewChat.appendChild(pip);
        else (document.getElementById('main-frame') || document.body).appendChild(pip);

        const wi = document.getElementById('coread-pip-wi');
        wi.value = this.wordsPerPage;
        wi.addEventListener('input', () => {
            let v = parseInt(wi.value);
            if (!isNaN(v) && v >= 50 && v <= 5000) {
                this.wordsPerPage = v;
                this.renderPipContent();
            }
        });
        wi.addEventListener('blur', () => {
            let v = parseInt(wi.value) || 200;
            v = Math.max(50, Math.min(5000, v));
            wi.value = v;
            this.wordsPerPage = v;
            this.renderPipContent();
        });

        this.initPipDrag();
    },

    renderPipContent() {
        if (!this.currentBookId) return;
        const book = this.books.find(b => b.id === this.currentBookId);
        if (!book) return;
        const total = Math.max(1, Math.ceil(book.content.length / this.wordsPerPage));
        if (this.currentPage >= total) this.currentPage = total - 1;
        if (this.currentPage < 0) this.currentPage = 0;
        const start = this.currentPage * this.wordsPerPage;
        const segment = book.content.substring(start, start + this.wordsPerPage);

        const body = document.getElementById('coread-pip-body');
        const num = document.getElementById('coread-pip-num');
        const title = document.getElementById('coread-pip-title');
        const author = document.getElementById('coread-pip-author');
        if (body) {
            body.style.opacity = '0';
            body.style.fontSize = this.fontSize + 'px';
            setTimeout(() => {
                body.innerHTML = this.escapeHtml(segment).replace(/\n/g, '<br>');
                body.style.opacity = '1';
            }, 150);
        }
        if (num) num.textContent = `P.${String(this.currentPage + 1).padStart(2, '0')} / ${total}`;
        if (title) title.textContent = book.name;
        if (author) {
            const pct = Math.round((this.currentPage + 1) / total * 100);
            author.textContent = `CO-READING · ${pct}%`;
        }
        book.progress = this.currentPage;
        this.saveBooks();
    },

    flip(d) {
        if (!this.currentBookId) return;
        const book = this.books.find(b => b.id === this.currentBookId);
        if (!book) return;
        const total = Math.max(1, Math.ceil(book.content.length / this.wordsPerPage));
        this.currentPage = Math.max(0, Math.min(total - 1, this.currentPage + d));
        this.renderPipContent();
    },

    toggleSettings(e) {
        if (e) e.stopPropagation();
        const panel = document.getElementById('coread-pip-settings');
        const cfg = document.getElementById('coread-pip-cfg');
        if (panel) panel.classList.toggle('open');
        if (cfg) cfg.classList.toggle('active');
    },

    adjFontSize(d) {
        this.fontSize = Math.max(10, Math.min(20, this.fontSize + d));
        const fsEl = document.getElementById('coread-pip-fs');
        const body = document.getElementById('coread-pip-body');
        if (fsEl) fsEl.textContent = this.fontSize;
        if (body) body.style.fontSize = this.fontSize + 'px';
    },

    initPipDrag() {
        const pip = document.getElementById('coread-pip');
        const head = document.getElementById('coread-pip-head');
        if (!pip || !head || head._dragInit) return;
        head._dragInit = true;
        let drag = false, ix = 0, iy = 0, ox = 0, oy = 0;
        const ds = (e) => {
            if (e.target.closest('.coread-pip-cfg') || e.target.closest('.coread-pip-x')) return;
            const c = e.touches ? e.touches[0] : e;
            ix = c.clientX - ox; iy = c.clientY - oy; drag = true;
        };
        const dm = (e) => {
            if (!drag) return;
            e.preventDefault();
            const c = e.touches ? e.touches[0] : e;
            ox = c.clientX - ix; oy = c.clientY - iy;
            pip.style.transform = `translate3d(${ox}px,${oy}px,0)`;
        };
        const de = () => { drag = false; };
        head.addEventListener('mousedown', ds);
        head.addEventListener('touchstart', ds, { passive: false });
        document.addEventListener('mousemove', dm);
        document.addEventListener('touchmove', dm, { passive: false });
        document.addEventListener('mouseup', de);
        document.addEventListener('touchend', de);
    },

    /* ---------- 给 AI 引擎用 ---------- */
    getPromptForContact(contactId) {
        if (typeof contacts === 'undefined') return '';
        const c = contacts.find(x => x.id === contactId);
        if (!c || !c.coReadingBook) return '';
        const book = this.books.find(b => b.id === c.coReadingBook);
        if (!book) return '';
        let page = this.currentPage;
        if (this.pipContactId !== contactId) page = book.progress || 0;
        const total = Math.max(1, Math.ceil(book.content.length / this.wordsPerPage));
        const start = page * this.wordsPerPage;
        const segment = book.content.substring(start, start + this.wordsPerPage);
        const pct = Math.round((page + 1) / total * 100);

        return `\n\n【📖 当前共读状态 · CO-READING ACTIVE】
你和用户正在一起阅读小说：《${book.name}》
当前进度：第 ${page + 1} / ${total} 页（约 ${pct}%）

【你与用户当前正在看的这一段原文】：
"""
${segment}
"""

【共读互动指令 · 严格执行】：
1. 你"看到"了上面这一段内容，可以与用户自然讨论这一段的剧情、人物动机、文笔特色
2. 当用户聊起书的内容时，必须基于上面这段原文进行回应，不要凭空编造
3. 严禁剧透用户还未读到的后续章节
4. 保持你的人设语气，用你独有的方式表达对这段文字的感受、评价或共鸣
5. 如果用户没有主动聊书，不要刻意拉回到书的话题，让共读成为自然的氛围背景`;
    }
};

(function () {
    function bootCoRead() {
        try { CoRead.init(); } catch (e) { console.error('[CoRead] init failed:', e); }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootCoRead);
    } else {
        bootCoRead();
    }
})();
