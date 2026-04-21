let currentMusicApi = 'primary';
let miSelectedItems = new Map();
let miPreviewPlaying = false;
let miSearchResults = [];
let miTargetCat = 'CLASSICAL';
let ncmLoginCookie = localStorage.getItem('ncm_login_cookie') || '';
let ncmLoginTimer = null;
let ncmUserProfile = JSON.parse(localStorage.getItem('ncm_user_profile') || 'null');

const MI_API_SOURCES = [
    { id: 'primary', name: '主线路', url: 'https://zm.armoe.cn' },
    { id: 'secondary', name: '备用 A', url: 'https://ncmapi.btwoa.com' },
    { id: 'tertiary', name: '备用 B', url: 'https://ncm.zhenxin.me' },
    { id: 'api4', name: '线路 4', url: 'http://110.42.255.106:3000' },
    { id: 'api5', name: '线路 5', url: 'https://www.musicapi.cn' }
];

function getMusicApiBase() {
    let source = MI_API_SOURCES.find(s => s.id === currentMusicApi);
    return source ? source.url : MI_API_SOURCES[0].url;
}

function ncmFetch(path) {
    let base = getMusicApiBase();
    let url = `${base}${path}`;
    if (url.includes('?')) url += '&timestamp=' + Date.now();
    else url += '?timestamp=' + Date.now();
    let opts = { credentials: 'include' };
    if (ncmLoginCookie) {
        url += '&cookie=' + encodeURIComponent(ncmLoginCookie);
    }
    return fetch(url, opts);
}

function openMusicImport() {
    try {
        miSelectedItems.clear();
        miSearchResults = [];
        miPreviewPlaying = false;

        miRenderApiBar();
        miRenderTargetChips();
        miRenderLoginStatus();

        let searchInput = document.getElementById('mi-search-input');
        if (searchInput) searchInput.value = '';

        let resultsEl = document.getElementById('mi-results');
        if (resultsEl) resultsEl.innerHTML = `
            <div class="mi-empty">
                <div class="mi-empty-icon">♪</div>
                <div class="mi-empty-title">SEARCH TO IMPORT</div>
                <div class="mi-empty-desc">输入歌名或歌手名称<br>从云端曲库中检索并导入</div>
            </div>`;

        let previewBar = document.getElementById('mi-preview-bar');
        if (previewBar) previewBar.classList.remove('show');

        miUpdateSelectCount();

        let overlay = document.getElementById('mi-overlay');
        if (overlay) overlay.style.display = 'flex';
    } catch(e) {}
}

function closeMusicImport() {
    let overlay = document.getElementById('mi-overlay');
    if (overlay) overlay.style.display = 'none';
    let audio = document.getElementById('mi-preview-audio');
    if (audio) { audio.pause(); audio.removeAttribute('src'); }
    miPreviewPlaying = false;
    if (ncmLoginTimer) { clearInterval(ncmLoginTimer); ncmLoginTimer = null; }
    let qrModal = document.getElementById('mi-qr-modal');
    if (qrModal) qrModal.style.display = 'none';
}

function miRenderApiBar() {
    let bar = document.getElementById('mi-api-bar');
    if (!bar) return;
    bar.innerHTML = '';
    MI_API_SOURCES.forEach(source => {
        let chip = document.createElement('div');
        chip.className = 'mi-api-chip' + (currentMusicApi === source.id ? ' active' : '');
        chip.innerText = source.name;
        chip.onclick = () => {
            currentMusicApi = source.id;
            miRenderApiBar();
            miRenderLoginStatus();
        };
        bar.appendChild(chip);
    });
}

function miRenderTargetChips() {
    let container = document.getElementById('mi-target-chips');
    if (!container) return;
    container.innerHTML = '';
    let targets = ['DAILY', ...Object.keys(m_db.tracks)];
    targets.forEach(cat => {
        let chip = document.createElement('div');
        chip.className = 'mi-target-chip' + (miTargetCat === cat ? ' active' : '');
        chip.innerText = cat;
        chip.onclick = () => {
            miTargetCat = cat;
            miRenderTargetChips();
        };
        container.appendChild(chip);
    });
}

function miRenderLoginStatus() {
    let container = document.getElementById('mi-login-status');
    if (!container) return;
    if (ncmUserProfile && ncmLoginCookie) {
        container.innerHTML = `
            <div class="mi-login-info">
                <img class="mi-login-avatar" src="${ncmUserProfile.avatarUrl || ''}" onerror="this.style.display='none'">
                <span class="mi-login-name">${ncmUserProfile.nickname || '已登录'}</span>
                <span class="mi-login-vip">${ncmUserProfile.vipType > 0 ? '👑 VIP' : ''}</span>
                <span class="mi-login-logout" onclick="ncmLogout()">退出</span>
            </div>`;
    } else {
        container.innerHTML = `
            <div class="mi-login-info">
                <span class="mi-login-name" style="color:#666;">未登录</span>
                <span class="mi-login-btn" onclick="ncmStartQRLogin()">扫码登录 ›</span>
            </div>`;
    }
}

async function ncmStartQRLogin() {
    let qrModal = document.getElementById('mi-qr-modal');
    let qrImg = document.getElementById('mi-qr-img');
    let qrStatus = document.getElementById('mi-qr-status');
    if (!qrModal || !qrImg || !qrStatus) return;

    qrModal.style.display = 'flex';
    qrStatus.innerText = '正在生成二维码...';
    qrImg.src = '';

    let base = getMusicApiBase();

    try {
        let keyRes = await fetch(`${base}/login/qr/key?timestamp=${Date.now()}`);
        let keyData = await keyRes.json();
        let unikey = keyData.data ? keyData.data.unikey : null;
        if (!unikey) throw new Error('获取key失败');

        let createRes = await fetch(`${base}/login/qr/create?key=${unikey}&qrimg=true&timestamp=${Date.now()}`);
        let createData = await createRes.json();
        let qrImgUrl = createData.data ? createData.data.qrimg : null;
        if (!qrImgUrl) throw new Error('生成二维码失败');

        qrImg.src = qrImgUrl;
        qrStatus.innerText = '请用网易云音乐APP扫描';

        if (ncmLoginTimer) clearInterval(ncmLoginTimer);
        ncmLoginTimer = setInterval(async () => {
            try {
                let checkRes = await fetch(`${base}/login/qr/check?key=${unikey}&timestamp=${Date.now()}`);
                let checkData = await checkRes.json();
                let code = checkData.code;

                if (code === 800) {
                    qrStatus.innerText = '二维码已过期，请重新生成';
                    clearInterval(ncmLoginTimer);
                    ncmLoginTimer = null;
                } else if (code === 801) {
                    qrStatus.innerText = '等待扫码...';
                } else if (code === 802) {
                    qrStatus.innerText = '已扫码，请在手机上确认';
                } else if (code === 803) {
                    clearInterval(ncmLoginTimer);
                    ncmLoginTimer = null;
                    qrStatus.innerText = '登录成功！';

                    if (checkData.cookie) {
                        ncmLoginCookie = checkData.cookie;
                        localStorage.setItem('ncm_login_cookie', ncmLoginCookie);
                    }

                    try {
                        let profileRes = await ncmFetch('/user/account');
                        let profileData = await profileRes.json();
                        if (profileData.profile) {
                            ncmUserProfile = {
                                nickname: profileData.profile.nickname,
                                avatarUrl: profileData.profile.avatarUrl,
                                vipType: profileData.profile.vipType || 0,
                                userId: profileData.profile.userId
                            };
                            localStorage.setItem('ncm_user_profile', JSON.stringify(ncmUserProfile));
                        }
                    } catch(e) {}

                    setTimeout(() => {
                        qrModal.style.display = 'none';
                        miRenderLoginStatus();
                    }, 1000);
                }
            } catch(e) {
                qrStatus.innerText = '检测状态失败，重试中...';
            }
        }, 2000);

    } catch(e) {
        qrStatus.innerText = '生成失败: ' + e.message;
    }
}

function ncmLogout() {
    ncmLoginCookie = '';
    ncmUserProfile = null;
    localStorage.removeItem('ncm_login_cookie');
    localStorage.removeItem('ncm_user_profile');
    miRenderLoginStatus();
}

async function miDoSearch() {
    let keyword = document.getElementById('mi-search-input').value.trim();
    if (!keyword) return;

    let results = document.getElementById('mi-results');
    results.innerHTML = `<div class="mi-loading"><div class="mi-spinner"></div><div class="mi-loading-text">SEARCHING...</div></div>`;
    miSelectedItems.clear();
    miUpdateSelectCount();

    try {
        let res = await ncmFetch(`/search?keywords=${encodeURIComponent(keyword)}&limit=20`);
        if (!res.ok) throw new Error('API ' + res.status);
        let data = await res.json();

        let songs = data.result && data.result.songs ? data.result.songs : [];
        if (songs.length === 0) {
            results.innerHTML = `
                <div class="mi-empty">
                    <div class="mi-empty-icon">✕</div>
                    <div class="mi-empty-title">NO RESULTS</div>
                    <div class="mi-empty-desc">未找到相关歌曲<br>尝试换个关键词或切换API源</div>
                </div>`;
            return;
        }

        miSearchResults = songs.map(s => ({
            id: s.id,
            title: s.name || 'Untitled',
            artist: s.artists ? s.artists.map(a => a.name).join(' / ') : 'Unknown',
            album: s.album ? s.album.name : '',
            cover: 'https://images.unsplash.com/photo-1614113489855-66422ad300a4?w=100&h=100&fit=crop',
            albumId: s.album ? s.album.id : null
        }));

        let coverPromises = miSearchResults.map(async (song) => {
            try {
                let detailRes = await ncmFetch(`/song/detail?ids=${song.id}`);
                if (detailRes.ok) {
                    let detailData = await detailRes.json();
                    if (detailData.songs && detailData.songs[0] && detailData.songs[0].al && detailData.songs[0].al.picUrl) {
                        song.cover = detailData.songs[0].al.picUrl + '?param=200y200';
                    }
                }
            } catch(e) {}
        });

        await Promise.allSettled(coverPromises);
        miRenderResults();

    } catch(e) {
        results.innerHTML = `
            <div class="mi-empty">
                <div class="mi-empty-icon">⚠</div>
                <div class="mi-empty-title">CONNECTION FAILED</div>
                <div class="mi-empty-desc">${e.message}<br>尝试切换其他API源</div>
            </div>`;
    }
}

function miRenderResults() {
    let results = document.getElementById('mi-results');
    results.innerHTML = '';

    miSearchResults.forEach(song => {
        let item = document.createElement('div');
        item.className = 'mi-result-item' + (miSelectedItems.has(song.id) ? ' selected' : '');
        item.dataset.id = song.id;
        item.innerHTML = `
            <img class="mi-result-cover" src="${song.cover}" onerror="this.src='https://images.unsplash.com/photo-1614113489855-66422ad300a4?w=100&h=100&fit=crop'">
            <div class="mi-result-info">
                <div class="mi-result-title">${song.title}</div>
                <div class="mi-result-artist">${song.artist}</div>
                <div class="mi-result-album">${song.album}</div>
            </div>
            <div class="mi-result-check"><i class="fa-solid fa-check"></i></div>`;

        item.querySelector('.mi-result-check').onclick = (e) => {
            e.stopPropagation();
            miToggleSelect(song, item);
        };

        item.onclick = () => miShowPreview(song);

        results.appendChild(item);
    });
}

function miToggleSelect(song, itemEl) {
    if (miSelectedItems.has(song.id)) {
        miSelectedItems.delete(song.id);
        itemEl.classList.remove('selected');
    } else {
        miSelectedItems.set(song.id, song);
        itemEl.classList.add('selected');
    }
    miUpdateSelectCount();
}

function miUpdateSelectCount() {
    let el = document.getElementById('mi-select-count');
    let btn = document.getElementById('mi-import-btn');
    if (!el || !btn) return;
    let count = miSelectedItems.size;
    el.innerText = `已选 ${count} 首`;
    btn.disabled = count === 0;
}

async function miShowPreview(song) {
    document.getElementById('mi-pv-cover').src = song.cover;
    document.getElementById('mi-pv-title').innerText = song.title;
    document.getElementById('mi-pv-artist').innerText = '加载中...';
    document.getElementById('mi-preview-bar').classList.add('show');

    let audio = document.getElementById('mi-preview-audio');
    audio.pause();
    audio.removeAttribute('src');
    miPreviewPlaying = false;
    document.getElementById('mi-pv-btn').innerHTML = '<i class="fa-solid fa-play"></i>';

    try {
        let urlRes = await ncmFetch(`/song/url/v1?id=${song.id}&level=exhigh`);
        if (!urlRes.ok) throw new Error('API错误');
        let urlData = await urlRes.json();
        let audioUrl = urlData.data && urlData.data[0] ? urlData.data[0].url : null;

        if (!audioUrl) {
            document.getElementById('mi-pv-artist').innerText = song.artist + ' (VIP/无源)';
            return;
        }

        audio.src = audioUrl;
        audio.onerror = function() {
            document.getElementById('mi-pv-artist').innerText = song.artist + ' (无法播放)';
            document.getElementById('mi-pv-btn').innerHTML = '<i class="fa-solid fa-ban"></i>';
            miPreviewPlaying = false;
        };
        audio.play().then(() => {
            miPreviewPlaying = true;
            document.getElementById('mi-pv-artist').innerText = song.artist;
            document.getElementById('mi-pv-btn').innerHTML = '<i class="fa-solid fa-pause"></i>';
        }).catch(() => {
            document.getElementById('mi-pv-artist').innerText = song.artist + ' (播放失败)';
        });
    } catch(e) {
        document.getElementById('mi-pv-artist').innerText = song.artist + ' (网络错误)';
    }
}

function miTogglePreview() {
    let audio = document.getElementById('mi-preview-audio');
    let btn = document.getElementById('mi-pv-btn');
    if (miPreviewPlaying) {
        audio.pause();
        miPreviewPlaying = false;
        btn.innerHTML = '<i class="fa-solid fa-play"></i>';
    } else {
        if (audio.src) {
            audio.play().then(() => {
                miPreviewPlaying = true;
                btn.innerHTML = '<i class="fa-solid fa-pause"></i>';
            }).catch(() => {});
        }
    }
}

function miClosePreview() {
    let audio = document.getElementById('mi-preview-audio');
    audio.pause();
    audio.removeAttribute('src');
    miPreviewPlaying = false;
    document.getElementById('mi-pv-btn').innerHTML = '<i class="fa-solid fa-play"></i>';
    document.getElementById('mi-preview-bar').classList.remove('show');
}

async function miGetSongUrl(songId) {
    try {
        let urlRes = await ncmFetch(`/song/url/v1?id=${songId}&level=exhigh`);
        if (urlRes.ok) {
            let urlData = await urlRes.json();
            if (urlData.data && urlData.data[0] && urlData.data[0].url) {
                return urlData.data[0].url;
            }
        }
    } catch(e) {}
    return '';
}

async function miImportSelected() {
    if (miSelectedItems.size === 0) return;

    let btn = document.getElementById('mi-import-btn');
    btn.innerText = 'IMPORTING...';
    btn.disabled = true;

    let importedCount = 0;

    for (let [id, song] of miSelectedItems) {
        try {
            let lyricText = '';

            try {
                let lyricRes = await ncmFetch(`/lyric?id=${id}`);
                if (lyricRes.ok) {
                    let lyricData = await lyricRes.json();
                    if (lyricData.lrc && lyricData.lrc.lyric) {
                        lyricText = lyricData.lrc.lyric;
                    }
                }
            } catch(e) {}

            let coverUrl = song.cover || '';
            if (coverUrl.includes('?param=')) {
                coverUrl = coverUrl.replace(/\?param=\d+y\d+/, '?param=400y400');
            }

            let newTrack = {
                title: song.title,
                artist: song.artist,
                img: coverUrl,
                audio: '',
                lyric: lyricText,
                ncmId: id
            };

            if (lyricText) {
                newTrack.parsedLyrics = parseRawLyrics(lyricText);
            }

            if (miTargetCat === 'DAILY') {
                m_db.daily.push(newTrack);
            } else {
                if (!m_db.tracks[miTargetCat]) {
                    m_db.tracks[miTargetCat] = [];
                }
                m_db.tracks[miTargetCat].push(newTrack);
            }

            importedCount++;
        } catch(e) {
            console.error('导入失败:', song.title, e);
        }
    }

    await saveMusicDB();

    if (miTargetCat === 'DAILY') {
        renderDailyPicks();
    } else {
        if (currentCategory === miTargetCat) {
            renderTrackList(currentCategory);
        }
    }

    miSelectedItems.clear();
    miUpdateSelectCount();

    btn.innerText = `DONE (${importedCount})`;
    setTimeout(() => {
        btn.innerText = 'IMPORT';
        btn.disabled = true;
    }, 2000);

    if (importedCount > 0) {
        miClosePreview();
        document.getElementById('mi-results').innerHTML = `
            <div class="mi-empty">
                <div class="mi-empty-icon">✓</div>
                <div class="mi-empty-title">IMPORT COMPLETE</div>
                <div class="mi-empty-desc">成功导入 ${importedCount} 首歌曲至 ${miTargetCat}<br>播放时将实时获取音频地址</div>
            </div>`;
    }
}
