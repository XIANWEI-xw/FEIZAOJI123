// ===== Gallery App =====
var GAL_DB_NAME = 'GalleryDB';
var GAL_STORE = 'GalleryStore';

function galInitDB() {
    return new Promise(function(resolve, reject) {
        var req = indexedDB.open(GAL_DB_NAME, 1);
        req.onupgradeneeded = function(e) { e.target.result.createObjectStore(GAL_STORE); };
        req.onsuccess = function() { resolve(req.result); };
        req.onerror = function() { reject(req.error); };
    });
}
async function galDbSet(key, val) {
    var db = await galInitDB();
    return new Promise(function(resolve, reject) {
        var tx = db.transaction(GAL_STORE, 'readwrite');
        tx.objectStore(GAL_STORE).put(val, key);
        tx.oncomplete = resolve; tx.onerror = function() { reject(tx.error); };
    });
}
async function galDbGet(key) {
    var db = await galInitDB();
    return new Promise(function(resolve, reject) {
        var tx = db.transaction(GAL_STORE, 'readonly');
        var r = tx.objectStore(GAL_STORE).get(key);
        r.onsuccess = function() { resolve(r.result); };
        r.onerror = function() { reject(r.error); };
    });
}

function openGallery() {
    var app = document.getElementById('galleryApp');
    if (app) {
        app.classList.add('active');
        renderGalAvatars();
        renderGalAvatarsFull();
        renderGalWalls();
        renderGalChars();
        renderGalVisionLog();
    }
}
function closeGallery() {
    var app = document.getElementById('galleryApp');
    if (app) app.classList.remove('active');
}
function switchGalTab(idx, el) {
    document.querySelectorAll('.gal-tab').forEach(function(t) { t.classList.remove('active'); });
    el.classList.add('active');
    document.querySelectorAll('.gal-view').forEach(function(v, i) { v.classList.toggle('active', i === idx); });
}


// ===== 头像库（All 视图预览）=====
function renderGalAvatars() {
    var grid = document.getElementById('galAvatarGrid');
    if (!grid) return;
    grid.innerHTML = '';
    var contacts = (typeof wcContacts !== 'undefined') ? wcContacts : [];
    contacts.forEach(function(c) {
        var div = document.createElement('div');
        div.className = 'gal-avatar-item';
        if (c.avatar) {
            div.innerHTML = '<img src="' + c.avatar + '"><div class="gal-avatar-name">' + c.name + '</div>';
        } else {
            div.innerHTML = '<div class="gal-avatar-placeholder">' + c.name.charAt(0) + '</div><div class="gal-avatar-name">' + c.name + '</div>';
        }
        grid.appendChild(div);
    });
    var numEl = document.getElementById('galStatAvatars');
    if (numEl) numEl.textContent = contacts.length;
}

// ===== 头像库完整版（含自定义上传 + 长按删除）=====
async function renderGalAvatarsFull() {
    var grid = document.getElementById('galAvatarGridFull');
    if (!grid) return;
    grid.innerHTML = '';

    var contacts = (typeof wcContacts !== 'undefined') ? wcContacts : [];
    contacts.forEach(function(c) {
        var div = document.createElement('div');
        div.className = 'gal-avatar-item';
        if (c.avatar) {
            div.innerHTML = '<img src="' + c.avatar + '"><div class="gal-avatar-name">' + c.name + '</div>';
        } else {
            div.innerHTML = '<div class="gal-avatar-placeholder">' + c.name.charAt(0) + '</div><div class="gal-avatar-name">' + c.name + '</div>';
        }
        grid.appendChild(div);
    });

    var custom = (await galDbGet('galAvatars')) || [];
    custom.forEach(function(av, i) {
        var div = document.createElement('div');
        div.className = 'gal-avatar-item';
        div.style.position = 'relative';
        div.innerHTML = '<img src="' + av.data + '"><div class="gal-avatar-name">' + av.name + '</div>' +
            '<div class="gal-del-btn" onclick="event.stopPropagation(); galDeleteAvatar(' + i + ')" style="position:absolute;top:2px;right:2px;width:18px;height:18px;border-radius:50%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:2;">' +
            '<svg viewBox="0 0 24 24" width="10" height="10" stroke="#fff" fill="none" stroke-width="3"><path d="M18 6L6 18M6 6l12 12"/></svg></div>';
        grid.appendChild(div);
    });

    var countEl = document.getElementById('galAvatarCount');
    if (countEl) countEl.textContent = (contacts.length + custom.length) + ' SAVED';
}

// ===== 头像上传 =====
function galHandleAvatarUpload(event) {
    var file = event.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = async function(e) {
        var name = prompt('Name this avatar:', file.name.replace(/\.[^.]+$/, ''));
        if (!name) return;
        var avatars = (await galDbGet('galAvatars')) || [];
        avatars.push({ name: name, data: e.target.result, time: Date.now() });
        await galDbSet('galAvatars', avatars);
        renderGalAvatars();
        renderGalAvatarsFull();
        galToast('AVATAR ADDED', 'green');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
}

// ===== 壁纸上传 =====
function galHandleWallUpload(event) {
    var file = event.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = async function(e) {
        var name = prompt('Name this wallpaper:', file.name.replace(/\.[^.]+$/, ''));
        if (!name) return;
        var walls = (await galDbGet('galWalls')) || [];
        walls.push({ name: name, data: e.target.result, time: Date.now() });
        await galDbSet('galWalls', walls);
        renderGalWalls();
        galToast('WALLPAPER ADDED', 'green');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
}

// ===== 渲染壁纸库（长按删除）=====
async function renderGalWalls() {
    var list = document.getElementById('galWallList');
    var countEl = document.getElementById('galWallCount');
    if (!list) return;
    list.innerHTML = '';

    var walls = (await galDbGet('galWalls')) || [];
    if (countEl) countEl.textContent = walls.length + ' SAVED';

    walls.forEach(function(w, i) {
        var card = document.createElement('div');
        card.className = 'gal-wall-card';
        card.style.cssText = 'width:100%;height:180px;';
        card.innerHTML = '<img src="' + w.data + '" style="width:100%;height:100%;object-fit:cover;filter:grayscale(20%) sepia(8%)">' +
            '<div class="gal-wall-tag"><span class="gal-wall-tag-name">' + w.name + '</span><span class="gal-wall-tag-size">Custom</span></div>' +
            '<div onclick="event.stopPropagation(); galDeleteWall(' + i + ')" style="position:absolute;top:8px;right:8px;width:28px;height:28px;border-radius:50%;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:2;">' +
            '<svg viewBox="0 0 24 24" width="12" height="12" stroke="#fff" fill="none" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg></div>';
        list.appendChild(card);
    });
}

// ===== Vision 角色列表 =====
function renderGalChars() {
    var list = document.getElementById('galVCharList');
    if (!list) return;
    list.innerHTML = '';
    var contacts = (typeof wcContacts !== 'undefined') ? wcContacts : [];
    var saved = JSON.parse(localStorage.getItem('galVisionChars') || '{}');

    contacts.forEach(function(c, idx) {
        var charData = saved[c.name] || { h: 6, m: 0, isGlobal: true };
        var visionResults = JSON.parse(localStorage.getItem('galVisionResults') || '{}');
        var lastScan = visionResults[c.name];
        var scanMeta = lastScan ? 'Scanned: ' + new Date(lastScan.time).toLocaleString() : (charData.isGlobal ? 'Follows global' : 'Custom: ' + charData.h + 'h ' + charData.m + 'm');
        var avHtml = c.avatar
            ? '<img src="' + c.avatar + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%">'
            : '<div class="gal-v-char-av-inner">' + c.name.charAt(0) + '</div>';
        var hmClass = charData.isGlobal ? 'gal-v-char-hm global' : 'gal-v-char-hm';
        var hmLabel = charData.isGlobal ? 'GLB' : 'H:M';
        var html = '<div class="gal-v-char-row" data-char-name="' + c.name + '">' +
            '<div class="gal-v-char-av">' + avHtml + '</div>' +
            '<div class="gal-v-char-info"><div class="gal-v-char-name">' + c.name + '</div><div class="gal-v-char-meta">' + scanMeta + '</div></div>' +
            '<div class="gal-v-char-right">' +
                '<div class="' + hmClass + '">' +
                    '<input type="number" class="gal-v-char-hm-input" value="' + charData.h + '" min="0" max="999" onchange="galSaveCharTime(this)">' +
                    '<div class="gal-v-char-hm-sep">:</div>' +
                    '<input type="number" class="gal-v-char-hm-input" value="' + charData.m + '" min="0" max="59" onchange="galSaveCharTime(this)">' +
                    '<div class="gal-v-char-hm-label" onclick="galToggleCharGlobal(this)" style="cursor:pointer">' + hmLabel + '</div>' +
                '</div>' +
                '<div class="gal-v-char-timer-bar"><div class="gal-v-char-timer-fill green" style="width:100%"></div></div>' +
                '<div class="gal-v-char-timer-text">Waiting</div>' +
            '</div></div>';
        list.insertAdjacentHTML('beforeend', html);
    });
}

// 保存角色单独时长
function galSaveCharTime(inputEl) {
    var row = inputEl.closest('.gal-v-char-row');
    if (!row) return;
    var name = row.getAttribute('data-char-name');
    if (!name) return;
    var inputs = row.querySelectorAll('.gal-v-char-hm-input');
    var h = parseInt(inputs[0].value) || 0;
    var m = parseInt(inputs[1].value) || 0;
    var label = row.querySelector('.gal-v-char-hm-label');
    var hmWrap = row.querySelector('[class*="gal-v-char-hm"]');

    var saved = JSON.parse(localStorage.getItem('galVisionChars') || '{}');
    var existing = saved[name] || {};
    existing.h = h;
    existing.m = m;
    existing.isGlobal = false;
    saved[name] = existing;
    localStorage.setItem('galVisionChars', JSON.stringify(saved));

    // 重置该角色计时器
    var newTotal = (h * 60 + m) * 60;
    if (newTotal > 0) {
        galCharTimers[name] = { total: newTotal, left: newTotal };
    }

    // 切换为自定义样式
    if (hmWrap) hmWrap.classList.remove('global');
    if (label) label.textContent = 'H:M';
    var meta = row.querySelector('.gal-v-char-meta');
    if (meta) meta.textContent = 'Custom: ' + h + 'h ' + m + 'm';
}

// 切换 GLB / 自定义
function galToggleCharGlobal(labelEl) {
    var row = labelEl.closest('.gal-v-char-row');
    if (!row) return;
    var name = row.getAttribute('data-char-name');
    var hmWrap = row.querySelector('.gal-v-char-hm');
    var inputs = row.querySelectorAll('.gal-v-char-hm-input');
    var meta = row.querySelector('.gal-v-char-meta');

    var saved = JSON.parse(localStorage.getItem('galVisionChars') || '{}');
    var charData = saved[name] || { h: 6, m: 0, isGlobal: true };

    charData.isGlobal = !charData.isGlobal;
    saved[name] = charData;
    localStorage.setItem('galVisionChars', JSON.stringify(saved));

    if (charData.isGlobal) {
        hmWrap.classList.add('global');
        labelEl.textContent = 'GLB';
        if (meta) meta.textContent = 'Follows global';
    } else {
        hmWrap.classList.remove('global');
        labelEl.textContent = 'H:M';
        var h = parseInt(inputs[0].value) || 0;
        var m = parseInt(inputs[1].value) || 0;
        if (meta) meta.textContent = 'Custom: ' + h + 'h ' + m + 'm';
    }
}

// ===== Vision 全局时间控制 =====
function galAdjVGlobal(delta) {
    var h = document.getElementById('galVH'), m = document.getElementById('galVM');
    if (!h || !m) return;
    var total = (parseInt(h.value) || 0) * 60 + (parseInt(m.value) || 0);
    total = Math.max(5, total + delta * 30);
    h.value = Math.floor(total / 60);
    m.value = total % 60;
    galUpdVPresets(total);
    galVTotal = total * 60;
    galVLeft = galVTotal;
    localStorage.setItem('galVisionGlobal', JSON.stringify({ h: Math.floor(total/60), m: total%60 }));
}
function galSetVGlobal(h, m, el) {
    document.getElementById('galVH').value = h;
    document.getElementById('galVM').value = m;
    document.querySelectorAll('.gal-v-preset').forEach(function(p) { p.classList.remove('active'); });
    el.classList.add('active');
    galVTotal = (h * 60 + m) * 60;
    galVLeft = galVTotal;
    localStorage.setItem('galVisionGlobal', JSON.stringify({ h: h, m: m }));
}
function galUpdVPresets(t) {
    var map = {'30M':30,'1H':60,'3H':180,'6H':360,'12H':720,'24H':1440};
    document.querySelectorAll('.gal-v-preset').forEach(function(p) {
        p.classList.toggle('active', map[p.textContent] === t);
    });
}

// ===== Vision 计时器（页面加载即启动）=====
var galVSaved = JSON.parse(localStorage.getItem('galVisionGlobal') || '{}');
var galVTotal = ((galVSaved.h || 6) * 60 + (galVSaved.m || 0)) * 60;
var galVLeft = galVTotal;
var galVCirc = 2 * Math.PI * 15;

// 加载时同步输入框
document.addEventListener('DOMContentLoaded', function() {
    var hEl = document.getElementById('galVH');
    var mEl = document.getElementById('galVM');
    if (hEl) hEl.value = galVSaved.h || 6;
    if (mEl) mEl.value = galVSaved.m || 0;
    galUpdVPresets(((galVSaved.h || 6) * 60) + (galVSaved.m || 0));

    galDbGet('wcMyAvatar').then(function(data) {
        if (data) {
            window.wcMyAvatar = data;
            window.myAvatar = data;
            document.querySelectorAll('.wc-msg-row.user .wc-msg-avatar img').forEach(function(img) {
                img.src = data;
            });
            document.querySelectorAll('.wc-msg-row.user .wc-msg-avatar').forEach(function(av) {
                if (!av.querySelector('img')) {
                    av.innerHTML = '<img src="' + data + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%">';
                }
            });
        }
    });

    var sysNoticeCSS = document.createElement('style');
    sysNoticeCSS.textContent = '' +
        '.wc-sys-notice-row{display:flex;justify-content:center;padding:8px 16px;animation:galNoticeFadeIn 0.6s ease;}' +
        '@keyframes galNoticeFadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}' +
        '.gal-sys-notice{display:flex;flex-direction:column;align-items:center;padding:16px 28px;max-width:220px;' +
            'background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.06);border-radius:16px;' +
            'backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);position:relative;overflow:hidden;}' +
        '.gal-sys-notice::before{content:"";position:absolute;top:0;left:50%;transform:translateX(-50%);' +
            'width:40px;height:1.5px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent);}' +
        '.gal-sys-notice-icon{width:32px;height:32px;border-radius:50%;' +
            'background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);' +
            'display:flex;align-items:center;justify-content:center;margin-bottom:10px;color:rgba(255,255,255,0.3);}' +
        '.gal-sys-notice-title{font-size:9px;font-weight:600;letter-spacing:2px;' +
            'color:rgba(255,255,255,0.35);text-transform:uppercase;margin-bottom:12px;}' +
        '.gal-sys-notice-avatars{display:flex;align-items:center;gap:10px;margin-bottom:12px;}' +
        '.gal-sys-notice-av{width:38px;height:38px;border-radius:50%;overflow:hidden;' +
            'border:1.5px solid rgba(255,255,255,0.1);box-shadow:0 2px 8px rgba(0,0,0,0.3);}' +
        '.gal-sys-notice-av img{width:100%;height:100%;object-fit:cover;}' +
        '.gal-sys-notice-heart{font-size:13px;opacity:0.35;line-height:1;}' +
        '.gal-sys-notice-name{font-size:11px;color:rgba(255,255,255,0.3);font-style:italic;margin-bottom:4px;}' +
        '.gal-sys-notice-time{font-size:8px;color:rgba(255,255,255,0.12);letter-spacing:1.5px;margin-top:2px;}' +
        '.gal-sys-notice-line{display:flex;align-items:center;gap:6px;margin-top:10px;width:100%;}' +
        '.gal-sys-notice-line::before,.gal-sys-notice-line::after{content:"";flex:1;height:0.5px;' +
            'background:rgba(255,255,255,0.06);}' +
        '.gal-sys-notice-line-dot{width:3px;height:3px;border-radius:50%;background:rgba(255,255,255,0.1);}';
    document.head.appendChild(sysNoticeCSS);
});

// Vision 扫描：从头像库选合适的头像推荐给用户换
async function galVisionScan(charName) {
    console.log('[Vision] Scan triggered:', charName || 'ALL');

    var targets = [];
    if (charName) {
        var c = (typeof wcContacts !== 'undefined') ? wcContacts.find(function(x) { return x.name === charName; }) : null;
        if (c) targets.push(c);
    } else {
        if (typeof wcContacts !== 'undefined') {
            wcContacts.forEach(function(c) { targets.push(c); });
        }
    }

    if (targets.length === 0) return;

    // 收集头像库所有图片
    var allAvatars = [];
    if (typeof wcContacts !== 'undefined') {
        wcContacts.forEach(function(c) {
            if (c.avatar && c.avatar.length > 10) {
                allAvatars.push({ name: c.name, data: c.avatar, source: 'contact' });
            }
        });
    }
    try {
        var custom = (await galDbGet('galAvatars')) || [];
        custom.forEach(function(av) {
            if (av.data && av.data.length > 10) {
                allAvatars.push({ name: av.name, data: av.data, source: 'gallery' });
            }
        });
    } catch(e) {}

    if (allAvatars.length < 2) {
        console.log('[Vision] Not enough avatars:', allAvatars.length);
        return;
    }

    var settings = JSON.parse(localStorage.getItem('systemSettings') || '{}');
    var apiUrl = (settings.apiUrl || '').replace(/\/+$/, '');
    var apiToken = settings.apiToken || '';
    var model = settings.apiModel || '';

    for (var t = 0; t < targets.length; t++) {
        var contact = targets[t];

        if (!apiUrl || !apiToken || !model) {
            // 无 API，随机推荐
            galBuildAvatarPickCard(contact, allAvatars, null);
            continue;
        }

        galToast('VISION: Scanning ' + contact.name + '...', 'green');

        var toSend = allAvatars.slice(0, 8);
        var imageList = '';
        toSend.forEach(function(av, idx) { imageList += '[Image ' + idx + '] "' + av.name + '"\n'; });

        var msgs = (typeof chatMessages !== 'undefined' && chatMessages[contact.name]) ? chatMessages[contact.name] : [];
        var recentTexts = msgs.slice(-6).filter(function(m) { return !m.isCoupleCard && !m.isVisionScan; }).map(function(m) {
            var txt = m.text || '';
            if (txt.includes('<')) txt = '[media]';
            return m.role + ': ' + (txt.length > 60 ? txt.substring(0, 60) + '...' : txt);
        }).join('\n');

        var userContent = [];
        userContent.push({
            type: 'text',
            text: 'You are "' + contact.name + '". Persona: ' + (contact.persona || 'An AI character') + '\n\n' +
                'Here are avatar images from the library:\n' + imageList + '\n' +
                'Recent conversation:\n' + (recentTexts || '(no recent chat)') + '\n\n' +
                'TASK: Look at all images. Pick 3 that best fit as YOUR avatar based on your persona and current mood from the conversation.\n\n' +
                'Respond ONLY in JSON:\n' +
                '{"message":"用你的角色语气说一句话，解释为什么想换这些头像","picks":[{"idx":0,"name":"给这个头像起个名","reason":"为什么选这个"},{"idx":2,"name":"名字","reason":"原因"},{"idx":1,"name":"名字","reason":"原因"}]}\n' +
                'idx = image index 0-' + (toSend.length - 1)
        });
        toSend.forEach(function(av) {
            userContent.push({ type: 'image_url', image_url: { url: av.data } });
        });

        try {
            var response = await fetch(apiUrl + '/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiToken },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: 'system', content: 'Respond ONLY with valid JSON.' },
                        { role: 'user', content: userContent }
                    ],
                    temperature: 0.8
                })
            });

            if (!response.ok) {
                galBuildAvatarPickCard(contact, allAvatars, null);
                continue;
            }

            var data = await response.json();
            var raw = (data.choices && data.choices[0] && data.choices[0].message) ? data.choices[0].message.content : '';
            var jsonMatch = raw.match(/\{[\s\S]*\}/);

            if (!jsonMatch) {
                galBuildAvatarPickCard(contact, allAvatars, null);
                continue;
            }

            var parsed = JSON.parse(jsonMatch[0]);
            var picks = (parsed.picks || []).map(function(p) {
                var i = parseInt(p.idx);
                return {
                    img: toSend[i] ? toSend[i].data : null,
                    avatarName: toSend[i] ? toSend[i].name : '?',
                    pickName: p.name || '',
                    reason: p.reason || ''
                };
            }).filter(function(p) { return p.img; });

            if (picks.length === 0) {
                galBuildAvatarPickCard(contact, allAvatars, null);
                continue;
            }

            galBuildAvatarPickCard(contact, allAvatars, { message: parsed.message || '', picks: picks });

        } catch(e) {
            console.error('[Vision] Error:', e);
            galBuildAvatarPickCard(contact, allAvatars, null);
        }

        if (targets.length > 1 && t < targets.length - 1) {
            await new Promise(function(r) { setTimeout(r, 1000); });
        }
    }
}

// 构建头像选择卡片
async function galBuildAvatarPickCard(contact, allAvatars, apiResult) {
    var picks;
    var aiMessage;

    if (apiResult && apiResult.picks && apiResult.picks.length > 0) {
        picks = apiResult.picks;
        aiMessage = apiResult.message;
    } else {
        // 随机选3个
        var shuffled = allAvatars.slice().sort(function() { return 0.5 - Math.random(); });
        picks = shuffled.slice(0, 3).map(function(av, i) {
            return { img: av.data, avatarName: av.name, pickName: 'Option ' + (i+1), reason: 'Random pick' };
        });
        aiMessage = '"随便选了几个，你看着换吧。"';
    }

    var picksHtml = '';
    picks.forEach(function(p, i) {
        picksHtml += '<div class="gal-av-pick" onclick="galSelectAvatarPick(this)" data-idx="' + i + '">' +
            '<div class="gal-av-pick-check"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg></div>' +
            '<div class="gal-av-pick-img"><img src="' + p.img + '"></div>' +
            '<div class="gal-av-pick-info">' +
                '<div class="gal-av-pick-name">' + (p.pickName || p.avatarName) + '</div>' +
                '<div class="gal-av-pick-reason">' + (p.reason || '') + '</div>' +
            '</div>' +
        '</div>';
    });

    var escapedName = contact.name.replace(/'/g, "\\'");
    var cardHtml = '<div class="gal-avatar-pick-card" data-contact="' + escapedName + '">' +
        '<div class="gal-apc-header">' +
            '<div class="gal-apc-icon"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#fff" stroke-width="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></div>' +
            '<span class="gal-apc-label">AVATAR RECOMMENDATION</span>' +
        '</div>' +
        '<div class="gal-apc-text">' + (aiMessage || '') + '</div>' +
        '<div class="gal-apc-current">' +
            '<span class="gal-apc-current-label">Current:</span>' +
            '<div class="gal-apc-current-av">' + (contact.avatar ? '<img src="' + contact.avatar + '">' : contact.name.charAt(0)) + '</div>' +
        '</div>' +
        '<div class="gal-apc-picks">' + picksHtml + '</div>' +
        '<div class="gal-apc-btns">' +
            '<button class="gal-apc-btn gal-apc-skip" onclick="this.closest(\'.gal-avatar-pick-card\').style.opacity=\'0.3\';this.closest(\'.gal-avatar-pick-card\').style.pointerEvents=\'none\'">Keep Current</button>' +
            '<button class="gal-apc-btn gal-apc-apply" onclick="galApplyAvatarPick(this)" disabled>Change Avatar</button>' +
        '</div>' +
    '</div>';

    var timeStr = (typeof getCurrentTime === 'function') ? getCurrentTime() : galGetTime();
    var newMsg = { role: 'bot', text: cardHtml, time: timeStr, isVisionScan: true };

    if (typeof chatMessages !== 'undefined') {
        if (!chatMessages[contact.name]) chatMessages[contact.name] = [];
        chatMessages[contact.name].push(newMsg);
        if (typeof saveWeChatData === 'function') saveWeChatData();
    }

    if (typeof currentChatContact !== 'undefined' && currentChatContact && currentChatContact.name === contact.name) {
        if (typeof appendChatMessageToDOM === 'function') appendChatMessageToDOM(newMsg);
    }

    if (typeof pushHcNotification === 'function') {
        pushHcNotification(contact, '👁 I found some avatars that suit me. Come take a look?');
    }

    // 更新 Vision 列表 meta
    var visionData = JSON.parse(localStorage.getItem('galVisionResults') || '{}');
    visionData[contact.name] = { time: new Date().toISOString() };
    localStorage.setItem('galVisionResults', JSON.stringify(visionData));

    var row = document.querySelector('.gal-v-char-row[data-char-name="' + contact.name + '"]');
    if (row) {
        var meta = row.querySelector('.gal-v-char-meta');
        if (meta) meta.textContent = 'Scanned: ' + new Date().toLocaleTimeString();
    }

    // 存入 Vision 扫描记录
    var visionLog = (await galDbGet('galVisionLog')) || [];
    visionLog.unshift({
        contactName: contact.name,
        contactAvatar: contact.avatar || '',
        time: new Date().toISOString(),
        type: 'avatar',
        picksCount: (apiResult && apiResult.picks) ? apiResult.picks.length : 3,
        aiMessage: (apiResult && apiResult.message) ? apiResult.message : '"随机推荐"'
    });
    if (visionLog.length > 50) visionLog = visionLog.slice(0, 50);
    await galDbSet('galVisionLog', visionLog);
    renderGalVisionLog();
}

// 选择头像
function galSelectAvatarPick(el) {
    var card = el.closest('.gal-avatar-pick-card');
    card.querySelectorAll('.gal-av-pick').forEach(function(p) { p.classList.remove('picked'); });
    el.classList.add('picked');
    var btn = card.querySelector('.gal-apc-apply');
    if (btn) btn.disabled = false;
}

// 应用选中的头像
function galApplyAvatarPick(btn) {
    var card = btn.closest('.gal-avatar-pick-card');
    var picked = card.querySelector('.gal-av-pick.picked');
    if (!picked) return;

    var img = picked.querySelector('.gal-av-pick-img img');
    if (!img) return;
    var newAvatarData = img.src;
    var contactName = card.getAttribute('data-contact');

    // 找到联系人并换头像
    if (typeof wcContacts !== 'undefined') {
        var contact = wcContacts.find(function(c) { return c.name === contactName; });
        if (contact) {
            contact.avatar = newAvatarData;
            if (typeof saveWeChatData === 'function') saveWeChatData();
            if (typeof renderContacts === 'function') renderContacts();
            if (typeof renderChats === 'function') renderChats();

            // 如果当前聊天就是这个角色，刷新头部头像
            if (typeof currentChatContact !== 'undefined' && currentChatContact && currentChatContact.name === contactName) {
                currentChatContact.avatar = newAvatarData;
                var avatarEl = document.getElementById('wcChatAvatar');
                if (avatarEl) avatarEl.innerHTML = '<img src="' + newAvatarData + '" style="width:100%;height:100%;object-fit:cover;">';
                if (typeof renderChatMessages === 'function') renderChatMessages();
            }
        }
    }

    card.style.opacity = '0.3';
    card.style.pointerEvents = 'none';
    galToast('AVATAR CHANGED!', 'green');
}

// 角色独立计时器数据
var galCharTimers = {};

function galGetCharTotal(name) {
    var saved = JSON.parse(localStorage.getItem('galVisionChars') || '{}');
    var charData = saved[name];
    if (!charData || charData.isGlobal) return galVTotal;
    return (charData.h * 60 + charData.m) * 60 || galVTotal;
}

function galInitCharTimer(name) {
    if (!galCharTimers[name]) {
        var total = galGetCharTotal(name);
        galCharTimers[name] = { total: total, left: total };
    }
}

setInterval(function() {
    // 全局倒计时
    galVLeft--;
    if (galVLeft <= 0) {
        galVLeft = galVTotal;
        galToast('COUPLE SCAN TRIGGERED', 'green');
        // 给所有角色发情头卡片
        if (typeof wcContacts !== 'undefined') {
            wcContacts.forEach(function(c) {
                setTimeout(function() { galSendCoupleCard(c.name); }, 500);
            });
        }
    }

    var ringEl = document.getElementById('galVRing');
    var textEl = document.getElementById('galVRT');
    var nextEl = document.getElementById('galVNT');

    if (ringEl) {
        ringEl.style.strokeDashoffset = galVCirc * (1 - galVLeft / galVTotal);
    }
    if (textEl) {
        var h = Math.floor(galVLeft / 3600);
        var m = Math.floor((galVLeft % 3600) / 60);
        textEl.textContent = h + ':' + String(m).padStart(2, '0');
    }
    if (nextEl) {
        var now = new Date();
        var nx = new Date(now.getTime() + galVLeft * 1000);
        nextEl.textContent = 'Next: ' + String(nx.getHours()).padStart(2, '0') + ':' + String(nx.getMinutes()).padStart(2, '0') + ':' + String(nx.getSeconds()).padStart(2, '0');
    }

    // 角色独立倒计时
    var saved = JSON.parse(localStorage.getItem('galVisionChars') || '{}');
    document.querySelectorAll('.gal-v-char-row').forEach(function(row) {
        var name = row.getAttribute('data-char-name');
        if (!name) return;
        var fill = row.querySelector('.gal-v-char-timer-fill');
        var text = row.querySelector('.gal-v-char-timer-text');
        if (!fill || !text) return;

        var charData = saved[name];
        var isGlobal = !charData || charData.isGlobal;

        if (isGlobal) {
            // 跟随全局
            var pct = (galVLeft / galVTotal) * 100;
            fill.style.width = pct + '%';
            fill.className = 'gal-v-char-timer-fill ' + (pct > 50 ? 'green' : pct > 15 ? 'amber' : 'red');
            var ch = Math.floor(galVLeft / 3600);
            var cm = Math.floor((galVLeft % 3600) / 60);
            var cs = galVLeft % 60;
            text.textContent = ch + ':' + String(cm).padStart(2, '0') + ':' + String(cs).padStart(2, '0');
        } else {
            // 独立计时
            var charTotal = (charData.h * 60 + charData.m) * 60;
            if (charTotal <= 0) charTotal = galVTotal;

            galInitCharTimer(name);
            // 如果 total 变了就重置
            if (galCharTimers[name].total !== charTotal) {
                galCharTimers[name].total = charTotal;
                galCharTimers[name].left = charTotal;
            }

            galCharTimers[name].left--;
            if (galCharTimers[name].left <= 0) {
                galCharTimers[name].left = galCharTimers[name].total;
                galToast('COUPLE: ' + name, 'green');
                galSendCoupleCard(name); // 发情头卡片
            }

            var cLeft = galCharTimers[name].left;
            var cTotal = galCharTimers[name].total;
            var pct2 = (cLeft / cTotal) * 100;
            fill.style.width = pct2 + '%';
            fill.className = 'gal-v-char-timer-fill ' + (pct2 > 50 ? 'green' : pct2 > 15 ? 'amber' : 'red');
            var ch2 = Math.floor(cLeft / 3600);
            var cm2 = Math.floor((cLeft % 3600) / 60);
            var cs2 = cLeft % 60;
            text.textContent = ch2 + ':' + String(cm2).padStart(2, '0') + ':' + String(cs2).padStart(2, '0');
        }
    });
}, 1000);

// ===== 删除头像 =====
async function galDeleteAvatar(index) {
    if (!confirm('Delete this avatar?')) return;
    var avatars = (await galDbGet('galAvatars')) || [];
    avatars.splice(index, 1);
    await galDbSet('galAvatars', avatars);
    renderGalAvatarsFull();
    renderGalAvatars();
    galToast('DELETED');
}

// ===== 删除壁纸 =====
async function galDeleteWall(index) {
    if (!confirm('Delete this wallpaper?')) return;
    var walls = (await galDbGet('galWalls')) || [];
    walls.splice(index, 1);
    await galDbSet('galWalls', walls);
    renderGalWalls();
    galToast('DELETED');
}

// ===== Vision 扫描记录 =====
function renderGalVisionLog() {
    var container = document.getElementById('galVisionLog');
    if (!container) { return; }

    var log = [];
    try { log = JSON.parse(localStorage.getItem('galVisionLog') || '[]'); } catch(e) { log = []; }

    var countEl = document.getElementById('galVisionLogCount');

    if (log.length === 0) {
        container.innerHTML = '<div class="gal-vlog-empty">' +
            '<div class="gal-vlog-empty-icon">' +
                '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="rgba(30,27,23,0.1)" stroke-width="1.5">' +
                    '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>' +
                '</svg>' +
            '</div>' +
            '<div class="gal-vlog-empty-title">No scans yet</div>' +
            '<div class="gal-vlog-empty-desc">Vision scans will appear here</div>' +
        '</div>';
        if (countEl) { countEl.textContent = '0 SCANS'; }
        return;
    }

    var html = '';

    for (var i = 0; i < log.length; i++) {
        var item = log[i];
        var timeStr = '';

        try {
            var d = new Date(item.time);
            var now = new Date();
            var diff = Math.floor((now - d) / 1000);
            if (diff < 60) { timeStr = diff + 's ago'; }
            else if (diff < 3600) { timeStr = Math.floor(diff / 60) + 'm ago'; }
            else if (diff < 86400) { timeStr = Math.floor(diff / 3600) + 'h ago'; }
            else { timeStr = Math.floor(diff / 86400) + 'd ago'; }
        } catch(e2) { timeStr = ''; }

        var eyeSvg = '<svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle;margin-right:4px;margin-top:-2px"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
        var typeLabel = item.type === 'couple' ? '💑 Couple' : eyeSvg + 'Avatar';
        var typeBg = item.type === 'couple' ? 'rgba(217,122,141,0.08)' : 'rgba(122,154,122,0.08)';
        var typeColor = item.type === 'couple' ? '#d97a8d' : '#7a9a7a';

        var avHtml = '';
        if (item.contactAvatar && item.contactAvatar.length > 10) {
            avHtml = '<img src="' + item.contactAvatar + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%">';
        } else {
            var initial = item.contactName ? item.contactName.charAt(0) : '?';
            avHtml = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-family:\'Cormorant Garamond\',serif;font-size:16px;font-style:italic;color:rgba(30,27,23,0.2)">' + initial + '</div>';
        }

        var contactName = item.contactName || 'Unknown';
        var aiMsg = item.aiMessage || '';
        var picksCount = item.picksCount || 0;

        html += '<div class="gal-vlog-item" style="background:#fff; border:1px solid rgba(30,27,23,0.06); box-shadow:0 2px 6px rgba(30,27,23,0.02);">';
        html += '<div class="gal-vlog-av">' + avHtml + '</div>';
        html += '<div class="gal-vlog-info">';
        html += '<div class="gal-vlog-name">' + contactName + '</div>';
        html += '<div class="gal-vlog-msg">' + aiMsg + '</div>';
        html += '<div class="gal-vlog-meta">';
        html += '<span class="gal-vlog-type" style="background:' + typeBg + ';color:' + typeColor + '">' + typeLabel + ' · ' + picksCount + ' picks</span>';
        html += '<span class="gal-vlog-time">' + timeStr + '</span>';
        html += '</div>';
        html += '</div>';
        html += '<div class="gal-vlog-del" onclick="galDeleteVisionLog(' + i + ')">';
        html += '<svg viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" fill="none" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>';
        html += '</div>';
        html += '</div>';
    }

    container.innerHTML = html;

    if (countEl) { countEl.textContent = log.length + ' SCANS'; }
}

function galDeleteVisionLog(index) {
    var log = JSON.parse(localStorage.getItem('galVisionLog') || '[]');
    log.splice(index, 1);
    localStorage.setItem('galVisionLog', JSON.stringify(log));
    renderGalVisionLog();
}

function openGallery() {
    var app = document.getElementById('galleryApp');
    if (app) {
        app.classList.add('active');
        renderGalAvatars();
        renderGalAvatarsFull();
        renderGalWalls();
        renderGalChars();
        renderGalVisionLog();
    }
}

function galToast(text, type) {
    var t = document.getElementById('galToast');
    if (!t) return;
    t.textContent = text;
    t.className = 'gal-toast show' + (type ? ' ' + type : '');
    setTimeout(function() { t.className = 'gal-toast'; }, 2500);
}
// ===== 情头卡片系统 =====
function galGetTime() {
    var now = new Date();
    return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
}

function galTriggerCouple() {
    console.log('[Gallery] galTriggerCouple called');
    if (typeof currentChatContact === 'undefined' || !currentChatContact) {
        galToast('No chat open');
        console.log('[Gallery] No currentChatContact');
        return;
    }
    var name = currentChatContact.name;
    console.log('[Gallery] Triggering couple for:', name);
    var settingsPanel = document.getElementById('wcChatSettings');
    if (settingsPanel) settingsPanel.classList.remove('active');
    setTimeout(function() { galSendCoupleCard(name); }, 500);
}

// 收集所有可用头像
async function galCollectAvatars() {
    var all = [];

    // 从微信联系人
    if (typeof wcContacts !== 'undefined') {
        wcContacts.forEach(function(c) {
            if (c.avatar && c.avatar.length > 10) {
                all.push({ name: c.name, data: c.avatar, source: 'contact' });
            }
        });
    }

    // 从 Gallery 上传
    try {
        var custom = (await galDbGet('galAvatars')) || [];
        custom.forEach(function(av) {
            if (av.data && av.data.length > 10) {
                all.push({ name: av.name, data: av.data, source: 'gallery' });
            }
        });
    } catch(e) {
        console.error('[Gallery] Failed to read gallery avatars:', e);
    }

    console.log('[Gallery] Total avatars collected:', all.length);
    return all;
}

async function galSendCoupleCard(contactName) {
    console.log('[Gallery] galSendCoupleCard:', contactName);
    if (!contactName) { galToast('No contact name'); return; }

    var contact = null;
    if (typeof wcContacts !== 'undefined') {
        for (var i = 0; i < wcContacts.length; i++) {
            if (wcContacts[i].name === contactName) { contact = wcContacts[i]; break; }
        }
    }
    if (!contact) { galToast('Contact not found: ' + contactName); return; }

    // 收集头像
    var allAvatars = await galCollectAvatars();
    console.log('[Gallery] Avatars found:', allAvatars.length);

    if (allAvatars.length < 2) {
        galToast('Need 2+ avatars in library (' + allAvatars.length + ' found)');
        return;
    }

    galToast('SCANNING GALLERY...');

    var settings = JSON.parse(localStorage.getItem('systemSettings') || '{}');
    var apiUrl = (settings.apiUrl || '').replace(/\/+$/, '');
    var apiToken = settings.apiToken || '';
    var model = settings.apiModel || '';

    console.log('[Gallery] API config:', { url: apiUrl ? 'set' : 'empty', token: apiToken ? 'set' : 'empty', model: model });

    if (!apiUrl || !apiToken || !model) {
        console.log('[Gallery] No API config, using offline');
        galBuildOfflineCard(contactName, contact, allAvatars);
        return;
    }

    // 最多8张图
    var toSend = allAvatars.slice(0, 8);
    var imageList = '';
    toSend.forEach(function(av, idx) { imageList += '[Image ' + idx + '] "' + av.name + '"\n'; });

    // 聊天上下文
    var msgs = (typeof chatMessages !== 'undefined' && chatMessages[contactName]) ? chatMessages[contactName] : [];
    var recentTexts = msgs.slice(-8).filter(function(m) { return !m.isCoupleCard; }).map(function(m) {
        var t = m.text || '';
        if (t.includes('<')) t = '[media]';
        return m.role + ': ' + (t.length > 80 ? t.substring(0, 80) + '...' : t);
    }).join('\n');

    // Vision API
    var userContent = [];
    userContent.push({
        type: 'text',
        text: 'You are "' + contactName + '". Persona: ' + (contact.persona || 'An AI character') + '\n\n' +
            'Avatar images in library:\n' + imageList + '\nRecent chat:\n' + recentTexts + '\n\n' +
            'Pick 3 PAIRS as couple avatars (one for you, one for user). Match the relationship mood.\n\n' +
            'JSON ONLY:\n{"message":"用角色语气说一句话","reason":"English summary","pairs":[{"name":"名","desc":"why","his":0,"hers":1},{"name":"名2","desc":"why","his":2,"hers":3},{"name":"名3","desc":"why","his":0,"hers":2}]}\nhis/hers = image index 0-' + (toSend.length - 1)
    });
    toSend.forEach(function(av) {
        userContent.push({ type: 'image_url', image_url: { url: av.data } });
    });

    console.log('[Gallery] Sending Vision API with', toSend.length, 'images');

    try {
        var response = await fetch(apiUrl + '/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiToken },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'system', content: 'Respond ONLY with valid JSON. No markdown, no explanation.' },
                    { role: 'user', content: userContent }
                ],
                temperature: 0.9
            })
        });

        console.log('[Gallery] API response status:', response.status);

        if (!response.ok) {
            var errText = await response.text();
            console.error('[Gallery] API error:', errText.substring(0, 200));
            galToast('API ' + response.status + ', using random');
            galBuildOfflineCard(contactName, contact, allAvatars);
            return;
        }

        var data = await response.json();
        var raw = (data.choices && data.choices[0] && data.choices[0].message) ? data.choices[0].message.content : '';
        console.log('[Gallery] API raw:', raw.substring(0, 300));

        var jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('[Gallery] No JSON found in response');
            galBuildOfflineCard(contactName, contact, allAvatars);
            return;
        }

        var parsed = JSON.parse(jsonMatch[0]);
        var pairs = (parsed.pairs || []).map(function(p) {
            var hi = parseInt(p.his), he = parseInt(p.hers);
            return {
                name: p.name || 'Pair', desc: p.desc || '',
                hisImg: toSend[hi] ? toSend[hi].data : null, hisName: toSend[hi] ? toSend[hi].name : '?',
                hersImg: toSend[he] ? toSend[he].data : null, hersName: toSend[he] ? toSend[he].name : '?'
            };
        }).filter(function(p) { return p.hisImg && p.hersImg; });

        console.log('[Gallery] Parsed pairs:', pairs.length);

        if (pairs.length === 0) {
            galBuildOfflineCard(contactName, contact, allAvatars);
            return;
        }

        galBuildCard(contactName, contact, parsed.message || '', parsed.reason || '', pairs);

    } catch (e) {
        console.error('[Gallery] Couple API error:', e);
        galToast('Error: ' + e.message);
        galBuildOfflineCard(contactName, contact, allAvatars);
    }
}

// 离线随机配对
function galBuildOfflineCard(contactName, contact, allAvatars) {
    console.log('[Gallery] Building offline card with', allAvatars.length, 'avatars');
    if (!allAvatars || allAvatars.length < 2) { galToast('Need more avatars'); return; }
    var shuffled = allAvatars.slice().sort(function() { return 0.5 - Math.random(); });
    var pairs = [];
    var quotes = ['"随便选了几组。"', '"这几个还行吧。"', '"给你挑了几个。"'];
    for (var i = 0; i < Math.min(3, Math.floor(shuffled.length / 2)); i++) {
        pairs.push({
            name: 'Pair ' + (i + 1), desc: shuffled[i*2].name + ' & ' + shuffled[i*2+1].name,
            hisImg: shuffled[i*2].data, hisName: shuffled[i*2].name,
            hersImg: shuffled[i*2+1].data, hersName: shuffled[i*2+1].name
        });
    }
    galBuildCard(contactName, contact, quotes[Math.floor(Math.random() * quotes.length)], 'Random from gallery', pairs);
}

// 构建卡片HTML并注入聊天
async function galBuildCard(contactName, contact, aiMessage, reason, pairs) {
    console.log('[Gallery] Building card with', pairs.length, 'pairs');

    var pairsHtml = '';
    pairs.forEach(function(p, i) {
        var hisHtml, hersHtml;
        if (p.hisImg) {
            hisHtml = '<img src="' + p.hisImg + '"><div class="gal-ccc-who">' + (p.hisName || 'Him') + '</div>';
        } else {
            hisHtml = '<div class="gal-ccc-ph" style="background:#1a1a1a;color:#fff;">' + (p.his || '❓') + '</div><div class="gal-ccc-who">Him</div>';
        }
        if (p.hersImg) {
            hersHtml = '<img src="' + p.hersImg + '"><div class="gal-ccc-who">' + (p.hersName || 'You') + '</div>';
        } else {
            hersHtml = '<div class="gal-ccc-ph" style="background:#e8e6e1;color:#111;">' + (p.hers || '❓') + '</div><div class="gal-ccc-who">You</div>';
        }

        pairsHtml += '<div class="gal-ccc-opt" onclick="galPickChatCpOpt(this)" data-idx="' + i + '">' +
            '<div class="gal-ccc-ck"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg></div>' +
            '<div class="gal-ccc-opt-body">' +
                '<div class="gal-ccc-imgs">' +
                    '<div class="gal-ccc-half">' + hisHtml + '</div>' +
                    '<div class="gal-ccc-half">' + hersHtml + '</div>' +
                '</div>' +
            '</div>' +
            '<div class="gal-ccc-tag"><div class="gal-ccc-tag-name">' + (p.name || 'Pair') + '</div></div>' +
        '</div>';
    });

    var escapedName = contactName.replace(/'/g, "\\'");
    var cardHtml = '<div class="gal-couple-chat-card" data-contact="' + escapedName + '">' +
        '<div class="gal-ccc-topline"></div>' +
        '<div class="gal-ccc-bg">' +
            '<svg viewBox="0 0 300 480" fill="none">' +
                '<line x1="20" y1="0" x2="20" y2="480" stroke="#111" stroke-width="0.5"/>' +
                '<line x1="280" y1="0" x2="280" y2="480" stroke="#111" stroke-width="0.5"/>' +
                '<line x1="0" y1="40" x2="300" y2="40" stroke="#111" stroke-width="0.5"/>' +
                '<line x1="0" y1="440" x2="300" y2="440" stroke="#111" stroke-width="0.5"/>' +
            '</svg>' +
        '</div>' +
        '<div class="gal-ccc-label-wrap">' +
            '<div class="gal-ccc-label-line"></div>' +
            '<div class="gal-ccc-label-text">Couple Avatar</div>' +
            '<div class="gal-ccc-label-line"></div>' +
        '</div>' +
        '<div class="gal-ccc-msg">' +
            '<div class="gal-ccc-msg-text">' + (aiMessage || '') + '</div>' +
        '</div>' +
        '<div class="gal-ccc-orn">' +
            '<div class="gal-ccc-orn-l"></div>' +
            '<svg viewBox="0 0 24 24"><rect x="10" y="10" width="4" height="4" transform="rotate(45 12 12)"/></svg>' +
            '<div class="gal-ccc-orn-r"></div>' +
        '</div>' +
        '<div class="gal-ccc-fan">' + pairsHtml + '</div>' +
        (reason ? '<div class="gal-ccc-reason"><div class="gal-ccc-reason-text">' + reason + '</div></div>' : '') +
        '<div class="gal-ccc-btns">' +
            '<button class="gal-ccc-btn gal-ccc-regen" onclick="galRegenCoupleCard(\'' + escapedName + '\')">Regen</button>' +
            '<button class="gal-ccc-btn gal-ccc-skip" onclick="this.closest(\'.gal-couple-chat-card\').style.opacity=\'0.3\';this.closest(\'.gal-couple-chat-card\').style.pointerEvents=\'none\'">Skip</button>' +
            '<button class="gal-ccc-btn gal-ccc-apply" onclick="galApplyCoupleFromChat(this)" disabled>Apply</button>' +
        '</div>' +
        '<div class="gal-ccc-foot"><div class="gal-ccc-foot-text">Studio Zero · Vision</div></div>' +
    '</div>';

    // 存入聊天
    var timeStr = (typeof getCurrentTime === 'function') ? getCurrentTime() : galGetTime();
    var newMsg = { role: 'bot', text: cardHtml, time: timeStr, isCoupleCard: true };

    if (typeof chatMessages !== 'undefined') {
        if (!chatMessages[contactName]) chatMessages[contactName] = [];
        chatMessages[contactName].push(newMsg);
        if (typeof saveWeChatData === 'function') saveWeChatData();
    }

    // 追加到 DOM
    if (typeof currentChatContact !== 'undefined' && currentChatContact && currentChatContact.name === contactName) {
        if (typeof appendChatMessageToDOM === 'function') {
            appendChatMessageToDOM(newMsg);
        } else {
            var container = document.getElementById('wcChatMessages');
            if (container) {
                var avHtml = (contact && contact.avatar)
                    ? '<div class="wc-msg-avatar"><img src="' + contact.avatar + '"></div>'
                    : '<div class="wc-msg-avatar">🤖</div>';
                container.insertAdjacentHTML('beforeend',
                    '<div class="wc-msg-row bot animate-pop">' + avHtml +
                    '<div class="wc-bubble-body"><div class="wc-bubble-bot" style="background:transparent;padding:0;box-shadow:none;">' + cardHtml + '</div></div></div>');
                container.scrollTop = container.scrollHeight;
            }
        }
        galToast('COUPLE CARD SENT');
    } else {
        galToast('Card saved in chat');
    }

    if (typeof pushHcNotification === 'function') {
        pushHcNotification(contact, '💑 给你挑了几组情侣头像，快来看看？');
    }

    // 存入 Vision 扫描记录
    var visionLog = (await galDbGet('galVisionLog')) || [];
    visionLog.unshift({
        contactName: contactName,
        contactAvatar: contact ? (contact.avatar || '') : '',
        time: new Date().toISOString(),
        type: 'couple',
        picksCount: pairs.length,
        aiMessage: aiMessage || ''
    });
    if (visionLog.length > 50) visionLog = visionLog.slice(0, 50);
    await galDbSet('galVisionLog', visionLog);
    renderGalVisionLog();

    console.log('[Gallery] Card injected successfully');
}

function galPickChatCpOpt(el) {
    var card = el.closest('.gal-couple-chat-card');
    if (card.classList.contains('gal-applied')) return;
    card.querySelectorAll('.gal-ccc-opt').forEach(function(o) { o.classList.remove('picked'); });
    el.classList.add('picked');
    var btn = card.querySelector('.gal-ccc-apply');
    if (btn) btn.disabled = false;
}

function galApplyCoupleFromChat(btn) {
    var card = btn.closest('.gal-couple-chat-card');
    if (!card) return;
    if (card.classList.contains('gal-applied')) return;

    var picked = card.querySelector('.gal-ccc-opt.picked');
    if (!picked) return;

    var name = picked.querySelector('.gal-ccc-tag-name').textContent;
    var halves = picked.querySelectorAll('.gal-ccc-half');
    var hisImgEl = halves[0] ? halves[0].querySelector('img') : null;
    var hersImgEl = halves[1] ? halves[1].querySelector('img') : null;

    if (!hisImgEl || !hersImgEl) {
        galToast('Missing image data');
        return;
    }

    var hisData = hisImgEl.getAttribute('src');
    var hersData = hersImgEl.getAttribute('src');

    var contactName = card.getAttribute('data-contact') || '';
    if (!contactName && typeof currentChatContact !== 'undefined' && currentChatContact) {
        contactName = currentChatContact.name;
    }
    if (!contactName) { galToast('Cannot identify contact'); return; }

    var contact = null;
    if (typeof wcContacts !== 'undefined') {
        for (var i = 0; i < wcContacts.length; i++) {
            if (wcContacts[i].name === contactName) {
                wcContacts[i].avatar = hisData;
                contact = wcContacts[i];
                break;
            }
        }
    }

    if (typeof currentChatContact !== 'undefined' && currentChatContact && currentChatContact.name === contactName) {
        currentChatContact.avatar = hisData;
    }

    window.wcMyAvatar = hersData;
    window.myAvatar = hersData;
    galDbSet('wcMyAvatar', hersData);

    if (typeof currentChatContact !== 'undefined' && currentChatContact) {
        currentChatContact.userAvatar = hersData;
    }
    if (typeof wcContacts !== 'undefined') {
        for (var ci = 0; ci < wcContacts.length; ci++) {
            if (wcContacts[ci].name === contactName) {
                wcContacts[ci].userAvatar = hersData;
                break;
            }
        }
    }

    document.querySelectorAll('.wc-msg-row.user .wc-msg-avatar img').forEach(function(img) {
        img.src = hersData;
    });
    document.querySelectorAll('.wc-msg-row.user .wc-msg-avatar').forEach(function(av) {
        if (!av.querySelector('img')) {
            av.innerHTML = '<img src="' + hersData + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%">';
        }
    });

    if (typeof saveWeChatData === 'function') saveWeChatData();

    var avatarEl = document.getElementById('wcChatAvatar');
    if (avatarEl) avatarEl.innerHTML = '<img src="' + hisData + '" style="width:100%;height:100%;object-fit:cover;">';

    if (typeof renderChats === 'function') renderChats();
    if (typeof renderContacts === 'function') renderContacts();
    if (typeof renderChatMessages === 'function') renderChatMessages();

    var timeStr = (typeof getCurrentTime === 'function') ? getCurrentTime() : galGetTime();

    var sysPromptText = '[系统提示：用户刚刚选择了情侣头像"' + name + '"。你（' + contactName + '）和用户现在都换上了配套的情侣头像。你应该注意到这件事，可以在之后的对话中自然地提及或回应。]';
    if (typeof chatMessages !== 'undefined') {
        if (!chatMessages[contactName]) chatMessages[contactName] = [];
        chatMessages[contactName].push({
            role: 'system',
            text: sysPromptText,
            time: timeStr,
            isCoupleCard: true,
            hidden: true
        });
        if (typeof saveWeChatData === 'function') saveWeChatData();
    }

    var noticeHtml = '<div class="gal-sys-notice">' +
        '<div class="gal-sys-notice-icon">' +
            '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5">' +
                '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>' +
                '<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>' +
            '</svg>' +
        '</div>' +
        '<div class="gal-sys-notice-title">COUPLE LINKED</div>' +
        '<div class="gal-sys-notice-avatars">' +
            '<div class="gal-sys-notice-av"><img src="' + hisData + '"></div>' +
            '<div class="gal-sys-notice-heart">' +
                '<svg viewBox="0 0 24 24" width="14" height="14" fill="#d97a8d"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>' +
            '</div>' +
            '<div class="gal-sys-notice-av"><img src="' + hersData + '"></div>' +
        '</div>' +
        '<div class="gal-sys-notice-name">"' + name + '"</div>' +
        '<div class="gal-sys-notice-time">' + timeStr + '</div>' +
        '<div class="gal-sys-notice-line">' +
            '<div class="gal-sys-notice-line-dot"></div>' +
        '</div>' +
    '</div>';

    var noticeMsg = {
        role: 'notice',
        text: '<div class="wc-sys-notice-row">' + noticeHtml + '</div>',
        time: timeStr,
        isNotice: true
    };

    if (typeof chatMessages !== 'undefined') {
        if (!chatMessages[contactName]) chatMessages[contactName] = [];
        chatMessages[contactName].push(noticeMsg);
        if (typeof saveWeChatData === 'function') saveWeChatData();
    }

    if (typeof currentChatContact !== 'undefined' && currentChatContact && currentChatContact.name === contactName) {
        if (typeof appendChatMessageToDOM === 'function') {
            appendChatMessageToDOM(noticeMsg);
        }
    }

    card.classList.add('gal-applied');
    card.style.opacity = '0.45';
    card.style.pointerEvents = 'none';

    btn.textContent = '✓ Applied';
    btn.disabled = true;
    btn.style.background = '#2d5a2d';
    btn.style.color = '#7cfc7c';

    var regenBtn = card.querySelector('.gal-ccc-regen');
    var skipBtn = card.querySelector('.gal-ccc-skip');
    if (regenBtn) { regenBtn.disabled = true; regenBtn.style.opacity = '0.3'; }
    if (skipBtn) { skipBtn.disabled = true; skipBtn.style.opacity = '0.3'; }

    galToast('COUPLE APPLIED: ' + name, 'green');
}

function galRegenCoupleCard(contactName) {
    galToast('REGENERATING...');
    galSendCoupleCard(contactName);
}

// ===== Vision 扫描记录 (使用 IndexedDB 解决 QuotaExceededError) =====
async function renderGalVisionLog() {
    var container = document.getElementById('galVisionLog');
    if (!container) { return; }

    var log = (await galDbGet('galVisionLog')) || [];
    var countEl = document.getElementById('galVisionLogCount');
    var eyeSvg = '<svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle;margin-right:4px;margin-top:-2px"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
    var heartSvg = '<svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle;margin-right:4px;margin-top:-2px"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';

    if (log.length === 0) {
        container.innerHTML = '<div class="gal-vlog-empty">' +
            '<div class="gal-vlog-empty-icon" style="opacity:0.1;margin-bottom:12px;">' +
                '<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' +
            '</div>' +
            '<div class="gal-vlog-empty-title">No scans yet</div>' +
            '<div class="gal-vlog-empty-desc">Vision scans will appear here</div>' +
        '</div>';
        if (countEl) { countEl.textContent = '0 SCANS'; }
        return;
    }

    var html = '';

    for (var i = 0; i < log.length; i++) {
        var item = log[i];
        var timeStr = '';

        try {
            var d = new Date(item.time);
            var now = new Date();
            var diff = Math.floor((now - d) / 1000);
            if (diff < 60) { timeStr = diff + 'S AGO'; }
            else if (diff < 3600) { timeStr = Math.floor(diff / 60) + 'M AGO'; }
            else if (diff < 86400) { timeStr = Math.floor(diff / 3600) + 'H AGO'; }
            else { timeStr = Math.floor(diff / 86400) + 'D AGO'; }
        } catch(e2) { timeStr = ''; }

        var typeLabel = item.type === 'couple' ? heartSvg + 'COUPLE' : eyeSvg + 'AVATAR';
        var typeBg = item.type === 'couple' ? 'rgba(217,122,141,0.08)' : 'rgba(122,154,122,0.08)';
        var typeColor = item.type === 'couple' ? '#d97a8d' : '#7a9a7a';

        var avHtml = '';
        if (item.contactAvatar && item.contactAvatar.length > 10) {
            avHtml = '<img src="' + item.contactAvatar + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%">';
        } else {
            var initial = item.contactName ? item.contactName.charAt(0) : '?';
            avHtml = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-family:\'Cormorant Garamond\',serif;font-size:16px;font-style:italic;color:rgba(30,27,23,0.2)">' + initial + '</div>';
        }

        html += '<div class="gal-vlog-item" style="background:#fff; border:1px solid rgba(30,27,23,0.06); box-shadow:0 2px 6px rgba(30,27,23,0.02); margin-bottom:10px; padding:12px; border-radius:12px; display:flex; gap:12px; position:relative;">';
        html += '<div class="gal-vlog-av" style="width:40px; height:40px; border-radius:50%; flex-shrink:0; background:linear-gradient(145deg,#f0ede6,#e8e4dc); border:2px solid #fff; box-shadow:0 1px 4px rgba(30,27,23,0.06); overflow:hidden;">' + avHtml + '</div>';
        html += '<div class="gal-vlog-info" style="flex:1; min-width:0;">';
        html += '<div class="gal-vlog-name" style="font-family:\'Cormorant Garamond\',serif; font-size:14px; font-weight:600; font-style:italic; color:#1a1816;">' + (item.contactName || 'Unknown') + '</div>';
        html += '<div class="gal-vlog-msg" style="font-family:\'Cormorant Garamond\',serif; font-size:11px; color:#8a8179; font-style:italic; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + (item.aiMessage || '') + '</div>';
        html += '<div class="gal-vlog-meta" style="display:flex; align-items:center; gap:8px; margin-top:6px;">';
        html += '<span class="gal-vlog-type" style="font-family:\'Space Mono\',monospace; font-size:7px; font-weight:700; padding:3px 8px; border-radius:8px; background:' + typeBg + '; color:' + typeColor + '; display:flex; align-items:center;">' + typeLabel + ' · ' + item.picksCount + ' PICKS</span>';
        html += '<span class="gal-vlog-time" style="font-family:\'Space Mono\',monospace; font-size:7px; color:rgba(30,27,23,0.2);">' + timeStr + '</span>';
        html += '</div>';
        html += '</div>';
        html += '<div class="gal-vlog-del" onclick="galDeleteVisionLog(' + i + ')" style="width:24px; height:24px; border-radius:50%; background:rgba(30,27,23,0.04); display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; color:rgba(30,27,23,0.2);">';
        html += '<svg viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" fill="none" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>';
        html += '</div>';
        html += '</div>';
    }

    container.innerHTML = html;

    if (countEl) { countEl.textContent = log.length + ' SCANS'; }
}

async function galDeleteVisionLog(index) {
    var log = (await galDbGet('galVisionLog')) || [];
    log.splice(index, 1);
    await galDbSet('galVisionLog', log);
    renderGalVisionLog();
}

function galToast(text, type) {
    var t = document.getElementById('galToast');
    if (!t) return;
    t.textContent = text;
    t.className = 'gal-toast show' + (type ? ' ' + type : '');
    setTimeout(function() { t.className = 'gal-toast'; }, 2500);
}
