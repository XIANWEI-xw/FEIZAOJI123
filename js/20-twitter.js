         
         // =====================================================================
         // 推特 (Star UI) 专属 JS 交互逻辑
         // =====================================================================
         // 动态生成推文 HTML 引擎 (保留了所有精美样式和交互)
         function generateTwPostHtml(post) {
let avatarSrc = post.avatar || 'https://api.dicebear.com/7.x/notionists/svg?seed=Bot';
let displayName = post.name;
let displayHandle = post.handle || ('@' + (post.name.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'user_' + (post.contactId ? post.contactId.replace(/[^a-z0-9]/gi, '').substring(0,5) : '12345')));

if (post.contactId === 'me') {
    if (post.maskId && post.maskId !== null) {
        // 🚀 面具帖子：严格使用帖子对象上保存的面具资料
        displayName = post.name;
        displayHandle = post.handle;
        avatarSrc = post.avatar || 'https://api.dicebear.com/7.x/notionists/svg?seed=Mask';
    } else {
        displayName = twData.meName || '我';
        displayHandle = twData.meHandle || '@soap_user';
        avatarSrc = twData.meAvatar || 'https://api.dicebear.com/7.x/notionists/svg?seed=Zero';
    }
} else if (post.contactId && post.contactId.startsWith('c_')) {
    let c = contacts.find(x => x.id === post.contactId);
    if (c) {
        displayName = c.twName || c.name;
        let baseHandle = c.twHandle ? c.twHandle : ('@' + (c.name.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'user_' + c.id.replace(/[^a-z0-9]/gi, '').substring(0, 5)));
        if (!baseHandle.startsWith('@')) baseHandle = '@' + baseHandle;
        displayHandle = baseHandle;
        avatarSrc = getTwAvatarSrc(c);
    }
}

let mediaHtml = '';

if (post.realImgUrl) {
    mediaHtml = `
    <div class="mt-3 rounded-2xl overflow-hidden post-media-content border border-mono-200 dark:border-mono-700">
        <img src="${post.realImgUrl}" class="w-full max-h-[400px] object-cover post-img">
    </div>`;
} else if (post.hasMedia) {
    mediaHtml = `
    <div class="mt-3 border border-mono-200 dark:border-mono-700 rounded-2xl overflow-hidden post-media-content">
        <div class="img-flip-container p-0 h-[250px] sm:h-[300px]">
            <div class="img-flipper cursor-pointer w-full h-full" onclick="event.stopPropagation(); this.classList.toggle('flipped')">
                <div class="flip-front h-full group">
                    <svg class="absolute w-[180px] h-[180px] stroke-[#b5a898] opacity-20 pointer-events-none z-0 animate-[spin_40s_linear_infinite]" style="fill:none; stroke-width:0.4;" viewBox="0 0 100 100"><polygon points="50,5 61,38 96,38 68,59 78,92 50,72 22,92 32,59 4,38 39,38"/></svg>
                    <div class="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-mono-400/30 z-10 transition-all duration-500 group-hover:w-8 group-hover:h-8"></div>
                    <div class="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-mono-400/30 z-10 transition-all duration-500 group-hover:w-8 group-hover:h-8"></div>
                    <div class="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-mono-400/30 z-10 transition-all duration-500 group-hover:w-8 group-hover:h-8"></div>
                    <div class="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-mono-400/30 z-10 transition-all duration-500 group-hover:w-8 group-hover:h-8"></div>
                    <div class="absolute top-5 left-6 font-mono text-[9px] tracking-widest text-mono-500/70 z-10 font-bold">VISUAL ASSET</div>
                    <div class="absolute bottom-5 right-6 font-mono text-[9px] tracking-widest text-mono-500/70 z-10 font-bold">NO. ${Math.floor(Math.random()*900)+100}</div>
                    <div class="absolute bottom-5 left-6 flex items-center gap-1.5 z-10">
                        <div class="w-1.5 h-1.5 bg-mono-500/60 rounded-full animate-pulse"></div>
                        <div class="font-mono text-[8px] tracking-widest text-mono-500/60">STANDBY</div>
                    </div>
                    <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-mono-900/5 dark:bg-mono-50/5 backdrop-blur-sm text-mono-600 dark:text-mono-300 rounded-full flex items-center justify-center z-[15] border border-mono-900/10 dark:border-mono-50/10 shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:bg-mono-900/10 dark:group-hover:bg-mono-50/10">
                        <i class="fa-solid fa-arrows-rotate text-[16px]"></i>
                    </div>
                </div>
                <div class="flip-back h-full">
<i class="fa-solid fa-camera-retro text-[24px] mb-3 text-mono-500"></i>
<h3 class="text-[15px] font-bold mb-2 text-mono-600 dark:text-mono-950 font-serif tracking-widest">SCENE DESCRIPTION</h3>
<p class="text-center leading-normal text-[13px] px-2 text-mono-500 italic font-serif">${post.sceneDesc || '一段被定格的记忆碎片。充满了极简与克制的秩序感。'}</p>
</div>
            </div>
        </div>
    </div>`;
} else {
    mediaHtml = `<div class="post-media-content hidden"></div>`;
}

// 安全获取数据
let likesCount = post.likes || Math.floor(Math.random()*300)+10;
let commentsCount = post.comments ? post.comments.length : 0;
let isLikedClass = post.isLiked ? 'text-pink-500' : '';
let likeIconClass = post.isLiked ? 'fa-solid' : 'fa-regular';
let timeDisplay = post.timestamp ? mFormatRelativeTime(post.timestamp) : '刚刚';

// 增加删除按钮逻辑 (所有人都能删)
let deleteBtnHtml = `
    <div class="p-1.5 text-mono-400 hover:text-red-500 hover:bg-red-500/10 rounded-full cursor-pointer transition flex items-center justify-center shrink-0" onclick="event.stopPropagation(); deleteTwPost('${post.id}')" title="删除帖子">
        <i class="fa-regular fa-trash-can text-[15px]"></i>
    </div>`;

return `
<div class="border-b border-mono-200 dark:border-mono-700 px-4 py-3 hover:bg-mono-50 dark:hover:bg-mono-900/50 transition cursor-pointer flex space-x-3 post-item fade-in" data-post-id="${post.id}" onclick="openPostDetails(this)">
    <img src="${avatarSrc}" data-avatar="${post.contactId}" class="w-10 h-10 shrink-0 bg-mono-200 dark:bg-mono-800 rounded-full object-cover" onclick="event.stopPropagation(); openOtherProfile('${post.contactId}')">
    <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-1 text-[15px] truncate">
                <span class="font-bold hover:underline post-author-name" onclick="event.stopPropagation(); openOtherProfile('${post.contactId}')">${displayName}</span>
                <span class="text-mono-500 truncate post-author-handle">${displayHandle}</span><span class="text-mono-500 truncate"> · ${timeDisplay}</span>
            </div>
            ${deleteBtnHtml}
        </div>
        <p class="text-[15px] leading-normal mt-0.5 whitespace-pre-wrap post-text-content">${post.content}</p>
        ${mediaHtml}
        <div class="flex justify-between mt-3 text-mono-500 text-[14px] max-w-[420px]">
            <div class="flex items-center space-x-2 hover:text-mono-600 dark:hover:text-mono-950 transition group" onclick="event.stopPropagation(); openPostDetails(this.closest('.post-item'))"><div class="p-1.5 rounded-full group-hover:bg-mono-100 dark:group-hover:bg-mono-800"><i class="fa-regular fa-comment"></i></div><span>${commentsCount}</span></div>
            <div class="flex items-center space-x-2 hover:text-green-500 transition group"><div class="p-1.5 rounded-full group-hover:bg-green-500/10"><i class="fa-solid fa-retweet"></i></div><span>${Math.floor(Math.random()*20)}</span></div>
            <div class="flex items-center space-x-2 hover:text-pink-500 transition group ${isLikedClass}" onclick="toggleTweetLike(this, event, '${post.id}')"><div class="p-1.5 rounded-full group-hover:bg-pink-500/10"><i class="${likeIconClass} fa-heart" style="transition: transform 0.2s;"></i></div><span class="like-count-span">${likesCount}</span></div>
            <div class="flex items-center space-x-2 hover:text-mono-600 dark:hover:text-mono-950 transition group"><div class="p-1.5 rounded-full group-hover:bg-mono-100 dark:group-hover:bg-mono-800"><i class="fa-solid fa-chart-simple"></i></div><span>${Math.floor(Math.random()*2000)+500}</span></div>
        </div>
    </div>
</div>`;
}

// 新增删除帖子函数
function deleteTwPost(postId) {
    if (!confirm('确定要删除这条帖子吗？')) return;
    let currentPosts = getCurrentWorldPosts();
    if (!currentPosts) return;
    
    let post = currentPosts.find(p => p.id === postId);
    if (post) {
        // 核心修复：精准截取正文片段进行匹配，忽略后面的换行和标签，防止匹配失败！
        let safeText = post.content.split('<br>')[0].replace(/<[^>]+>/g, '').trim();
        if (safeText.length > 15) safeText = safeText.substring(0, 15);
        
        contacts.forEach(c => {
            c.history = c.history.filter(m => {
                // 如果有精确绑定的 twPostId，直接匹配；否则用文本模糊匹配
                if (m.twPostId === postId) return false;
                if (m.role === 'system_sum' && safeText && m.content.includes(safeText)) return false;
                return true;
            });
        });
        saveData();
    }
    
    let wid = gConfig.currentWorldviewId || 'default';
    twData.worlds[wid].posts = currentPosts.filter(p => p.id !== postId);
    saveTwData();
    renderTwFeed();
    
    // 同步刷新他人主页的帖子列表，消灭幽灵帖子
    const profileView = document.getElementById('other-profile-view');
    if (profileView && !profileView.classList.contains('hidden') && currentProfileUser) {
        const postsContainer = document.getElementById('other-profile-posts');
        if (postsContainer) {
            postsContainer.innerHTML = '';
            const userPosts = twData.worlds[wid].posts.filter(p => p.contactId === currentProfileUser);
            if (userPosts.length === 0) {
                postsContainer.innerHTML = '<div class="text-center text-mono-500 py-10">该用户暂无动态</div>';
            } else {
                userPosts.slice().reverse().forEach(post => {
                    postsContainer.insertAdjacentHTML('beforeend', generateTwPostHtml(post));
                });
            }
            const postCountEl = profileView.querySelector('p.text-mono-500.text-\\[13px\\]');
            if (postCountEl) {
                postCountEl.innerText = `${userPosts.length} 帖子`;
            }
        }
    }

    // 同步刷新“我”的主页的帖子列表
    const myProfileView = document.getElementById('profile-view');
    if (myProfileView && !myProfileView.classList.contains('hidden')) {
        const myPostsContainer = document.getElementById('my-profile-posts');
        if (myPostsContainer) {
            myPostsContainer.innerHTML = '';
            const myPosts = twData.worlds[wid].posts.filter(p => p.contactId === 'me');
            if (myPosts.length === 0) {
                myPostsContainer.innerHTML = '<div class="text-center text-mono-500 py-10">您还没有发过动态</div>';
            } else {
                myPosts.slice().reverse().forEach(post => {
                    myPostsContainer.insertAdjacentHTML('beforeend', generateTwPostHtml(post));
                });
            }
            const myPostCountEl = myProfileView.querySelector('.sticky p.text-mono-500');
            if (myPostCountEl) {
                myPostCountEl.innerText = `${myPosts.length} 帖子`;
            }
        }
    }
}

// ================= 推特搜索引擎 =================
function searchTwitter(keyword) {
    const kw = keyword.toLowerCase().trim();
    
    // 同步移动端和桌面端输入框的值
    const mobInput = document.getElementById('tw-mobile-search');
    const deskInput = document.getElementById('tw-desktop-search');
    if (mobInput && mobInput.value !== keyword) mobInput.value = keyword;
    if (deskInput && deskInput.value !== keyword) deskInput.value = keyword;

    // 如果当前不在探索视图，强制切换过去
    if (document.getElementById('explore-view').classList.contains('hidden')) {
        switchView('explore-view');
    }

    const defaultContent = document.getElementById('explore-default-content');
    const searchResults = document.getElementById('explore-search-results');

    if (!kw) {
        defaultContent.classList.remove('hidden');
        searchResults.classList.add('hidden');
        searchResults.innerHTML = '';
        return;
    }

    defaultContent.classList.add('hidden');
    searchResults.classList.remove('hidden');
    searchResults.innerHTML = '';

    let currentPosts = getCurrentWorldPosts();
    let matchedPosts = currentPosts.filter(p => {
        // 剥离 HTML 标签后进行纯文本搜索
        const plainContent = p.content.replace(/<[^>]+>/g, '').toLowerCase();
        const nameMatch = (p.name || '').toLowerCase().includes(kw);
        const handleMatch = (p.handle || '').toLowerCase().includes(kw);
        return plainContent.includes(kw) || nameMatch || handleMatch;
    });

    if (matchedPosts.length === 0) {
        searchResults.innerHTML = `<div class="text-center text-mono-500 py-10">未找到关于 "${keyword}" 的推文或用户。<br>换个词试试吧？</div>`;
    } else {
        // 渲染搜索结果
        matchedPosts.slice().reverse().forEach(post => {
            searchResults.insertAdjacentHTML('beforeend', generateTwPostHtml(post));
        });
    }
}

function deleteDetailMainPost() {
    if (!confirm('确定要删除这条帖子吗？')) return;
    let currentPosts = getCurrentWorldPosts();
    if (!currentPosts) return;
    
    let post = currentPosts.find(p => p.id === currentDetailPostId);
    if (post) {
        let safeText = post.content.replace(/<[^>]+>/g, '').trim();
        if (safeText) {
            contacts.forEach(c => {
                c.history = c.history.filter(m => !(m.role === 'system_sum' && m.content.includes(safeText)));
            });
            saveData();
        }
    }

    let wid = gConfig.currentWorldviewId || 'default';
    twData.worlds[wid].posts = currentPosts.filter(p => p.id !== currentDetailPostId);
    saveTwData();
    renderTwFeed();
    switchView('home-view');
}

function deleteDetailComment(cId) {
    if (!confirm('确定要删除这条评论吗？')) return;
    let currentPosts = getCurrentWorldPosts();
    const post = currentPosts.find(p => p.id === currentDetailPostId);
    if (post) {
        // 使用唯一的 cid 进行过滤，确保只删除点击的那一条
        post.comments = post.comments.filter(c => c.cid !== cId);
        currentDetailComments = post.comments;
        saveTwData();
        renderDetailComments();
    }
}
         
         // ======= 数据缓存：用于动态展示 =======
         let currentProfileUser = null;
         let followedUsers = new Set();
         
         // 生成头像HTML片段给推特使用
         function getTwAvatarHtml(c) {
         let av = c.chatAvatar || c.avatar;
         if(av && (av.startsWith('data:image') || av.startsWith('http'))) {
             return `<img src="${av}" data-avatar="${c.id}" class="w-full h-full bg-mono-200 dark:bg-mono-800 rounded-full object-cover border border-mono-50 dark:border-mono-900 pointer-events-none">`;
         } else {
             return `<div class="w-full h-full bg-mono-200 dark:bg-mono-800 rounded-full flex items-center justify-center text-mono-500 pointer-events-none" data-avatar="${c.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-1/2 h-1/2"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4M8 16h8"/></svg></div>`;
         }
         }
         
         function getTwAvatarSrc(c) {
         let av = c.chatAvatar || c.avatar;
         if(av && (av.startsWith('data:image') || av.startsWith('http'))) return av;
         return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="1.5"%3E%3Crect x="3" y="11" width="18" height="10" rx="2"/%3E%3Ccircle cx="12" cy="5" r="2"/%3E%3Cpath d="M12 7v4M8 16h8"/%3E%3C/svg%3E';
         }
         
         function renderTwitterContacts() {
const mentionsList = document.getElementById('compose-mentions-list');
const npcList = document.getElementById('worldview-npc-list');
const msgList = document.getElementById('tw-messages-list');

if (mentionsList) {
    mentionsList.innerHTML = '<span class="text-[13px] font-bold text-mono-500 shrink-0 mr-1">@ 提及</span>';
    contacts.forEach(c => {
        let displayName = c.twName || c.name;
        let displayHandle = c.twHandle ? c.twHandle : ('@' + (c.name.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'user_' + c.id.replace(/[^a-z0-9]/gi, '').substring(0, 5)));
        if (!displayHandle.startsWith('@')) displayHandle = '@' + displayHandle;

                    mentionsList.innerHTML += `
                <div class="flex items-center space-x-2 cursor-pointer group shrink-0" onclick="toggleComposeContact(this)">
                    <div class="w-7 h-7 rounded-full p-[1.5px] bg-mono-200 dark:bg-mono-700 transition-all duration-300 compose-contact-ring opacity-40 grayscale transform scale-95">
                        ${getTwAvatarHtml(c)}
                    </div>
                    <span class="text-[13px] text-mono-500 font-normal transition-colors" data-handle="${displayHandle}" data-id="${c.id}">${displayName}</span>
                </div>
            `;
    });
}
         
         if (npcList) {
         npcList.innerHTML = '';
         if (!momentsData.twLinkedNPCs) momentsData.twLinkedNPCs = [];
         contacts.forEach(c => {
             let isLinked = momentsData.twLinkedNPCs.includes(c.id);
             let ringClass = isLinked 
                 ? 'w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-mono-400 to-mono-800 dark:from-mono-500 dark:to-mono-100 transition-all duration-300 mb-1.5 contact-ring shadow-md transform scale-105'
                 : 'w-12 h-12 rounded-full p-[2px] bg-mono-200 dark:bg-mono-700 transition-all duration-300 mb-1.5 contact-ring opacity-40 grayscale transform scale-95';
             let textClass = isLinked
                 ? 'text-[12px] truncate w-full text-center font-bold text-mono-600 dark:text-mono-950 transition-colors'
                 : 'text-[12px] truncate w-full text-center text-mono-500 font-normal transition-colors';
         
             npcList.innerHTML += `
                 <div class="flex flex-col items-center cursor-pointer group w-[54px] shrink-0" onclick="toggleContact(this, '${c.id}')">
                     <div class="${ringClass}">
                         ${getTwAvatarHtml(c)}
                     </div>
                     <span class="${textClass}">${c.name}</span>
                 </div>
             `;
         });
         }
         
         if (msgList) {
             msgList.innerHTML = '';
             if (contacts.length === 0) {
                 msgList.innerHTML = '<div class="text-center text-mono-500 py-10">暂无私信记录</div>';
             } else {
                 contacts.forEach(c => {
    let lastMsg = "去发个私信吧！";
if (!c.twHistory) c.twHistory = [];
let wid = gConfig.currentWorldviewId || 'default';
let historyValid = c.twHistory.filter(m => m.role !== 'system' && m.role !== 'system_sum' && (m.wid === wid || (!m.wid && wid === 'default')));
if (historyValid.length > 0) {
    let rawText = historyValid[historyValid.length - 1].content.replace(/<[^>]+>/g, '').trim();
    lastMsg = rawText ? (rawText.length > 20 ? rawText.substring(0, 20) + '...' : rawText) : '[特殊消息]';
}
                 
                 msgList.innerHTML += `
<div class="px-4 py-4 hover:bg-mono-100/50 dark:hover:bg-mono-800/50 transition cursor-pointer flex space-x-3 border-b border-mono-200 dark:border-mono-700" onclick="twOpenChat('${c.id}')">
    <div class="w-12 h-12 shrink-0 bg-mono-200 dark:bg-mono-800 rounded-full overflow-hidden flex items-center justify-center">
        ${getTwAvatarHtml(c)}
    </div>
    <div class="flex-1 min-w-0 flex flex-col justify-center">
        <div class="flex justify-between items-baseline">
            <span class="font-bold text-[15px] truncate">${c.twName || c.name} <span class="text-mono-500 font-normal">${c.twHandle.startsWith('@') ? c.twHandle : '@'+c.twHandle}</span></span>
            <span class="text-mono-500 text-[14px] shrink-0 ml-2">刚刚</span>
        </div>
        <p class="text-mono-500 text-[15px] truncate mt-0.5">${lastMsg}</p>
    </div>
</div>
                     `;
                 });
             }
         }
         }
         
         function openOtherProfile(contactId) {
         currentProfileUser = contactId;
         const c = contacts.find(x => x.id === contactId);
         if(!c) return;
         
         const profileView = document.getElementById('other-profile-view');
profileView.querySelector('h2.leading-tight').innerText = c.twName || c.name;
profileView.querySelector('p.text-mono-500.text-\\[13px\\]').innerText = '0 帖子';

let baseHandle = c.twHandle ? c.twHandle : ('@' + (c.name.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'user_' + c.id.replace(/[^a-z0-9]/gi, '').substring(0, 5)));
if (!baseHandle.startsWith('@')) baseHandle = '@' + baseHandle;
profileView.querySelector('.mt-3 p.text-mono-500').innerText = baseHandle;
         
         let bioText = c.twBio || '点击设置资料';
         profileView.querySelector('.mt-3 p.leading-normal').innerText = bioText;
         profileView.querySelector('.mt-3 h2.font-bold').innerText = c.twName || c.name;
         
         const avatarWrapper = profileView.querySelector('.w-20.h-20.sm\\:w-32.sm\\:h-32');
         if (avatarWrapper) avatarWrapper.innerHTML = getProfileAvatarHtml(c, false);
         
         const coverImg = profileView.querySelector('img[data-cover]');
if (coverImg) {
// 尝试从推特专属数据里读取封面，如果没有就用默认的
let targetCover = 'https://images.unsplash.com/photo-1614729939124-032f0b56c9ce?auto=format&fit=crop&w=1000&q=80';
if (typeof twData !== 'undefined' && twData.userCovers && twData.userCovers[contactId]) {
    targetCover = twData.userCovers[contactId];
}
coverImg.src = targetCover;
coverImg.dataset.cover = contactId;
}
         
         const postsContainer = document.getElementById('other-profile-posts');
if (postsContainer) {
    postsContainer.innerHTML = '';
    let currentPosts = getCurrentWorldPosts();
    const userPosts = currentPosts.filter(p => p.contactId === contactId);
    if (userPosts.length === 0) {
        postsContainer.innerHTML = '<div class="text-center text-mono-500 py-10">该用户暂无动态</div>';
    } else {
        userPosts.slice().reverse().forEach(post => {
            postsContainer.insertAdjacentHTML('beforeend', generateTwPostHtml(post));
        });
    }
    
    const postCountEl = profileView.querySelector('p.text-mono-500.text-\\[13px\\]');
    if (postCountEl) {
        postCountEl.innerText = `${userPosts.length} 帖子`;
    }
}

const profileBtn = document.getElementById('profile-follow-btn');
         if (profileBtn) {
             if (followedUsers.has(contactId)) {
                 profileBtn.innerText = '正在关注'; 
                 profileBtn.className = 'bg-transparent border border-mono-300 dark:border-mono-600 font-bold py-1.5 px-5 rounded-full transition text-[15px]';
             } else {
                 profileBtn.innerText = '关注'; 
                 profileBtn.className = 'bg-mono-600 dark:bg-mono-950 text-white dark:text-black font-bold py-1.5 px-6 rounded-full transition text-[15px] hover:opacity-90';
             }
         }
         
         switchView('other-profile-view');
         }
         
         function switchHomeTab(tab) {
             const tForYou = document.getElementById('tab-foryou');
             const tFollowing = document.getElementById('tab-following');
             const iForYou = document.getElementById('indicator-foryou');
             const iFollowing = document.getElementById('indicator-following');
             const feedForYou = document.getElementById('feed-foryou');
             const feedFollowing = document.getElementById('feed-following');
         
             if (tab === 'foryou') {
                 tForYou.className = "w-1/2 hover:bg-mono-100/50 dark:hover:bg-mono-800/50 transition cursor-pointer py-4 relative text-mono-600 dark:text-mono-950";
                 tFollowing.className = "w-1/2 hover:bg-mono-100/50 dark:hover:bg-mono-800/50 transition cursor-pointer py-4 relative text-mono-500";
                 iForYou.classList.remove('hidden'); iFollowing.classList.add('hidden');
                 feedForYou.classList.remove('hidden'); feedFollowing.classList.add('hidden');
                 } else {
        tFollowing.className = "w-1/2 hover:bg-mono-100/50 dark:hover:bg-mono-800/50 transition cursor-pointer py-4 relative text-mono-600 dark:text-mono-950";
        tForYou.className = "w-1/2 hover:bg-mono-100/50 dark:hover:bg-mono-800/50 transition cursor-pointer py-4 relative text-mono-500";
        iFollowing.classList.remove('hidden'); iForYou.classList.add('hidden');
        feedFollowing.classList.remove('hidden'); feedForYou.classList.add('hidden');
        renderFollowingFeed(); // 每次切过来时重新渲染
    }
}
         
         document.addEventListener('DOMContentLoaded', () => {
             const starBg = document.getElementById('star-bg');
             if (starBg) {
                 starBg.innerHTML = '';
                 const cols = 6; const rows = 5;
                 for(let r = 0; r < rows; r++) {
                     for(let c = 0; c < cols; c++) {
                         if (Math.random() > 0.85) continue;
                         const star = document.createElement('i');
                         star.className = 'fa-solid fa-star absolute pointer-events-none transition-colors duration-1000 text-mono-300 dark:text-mono-700';
                         const cellWidth = 100 / cols;
                         const cellHeight = 100 / rows;
                         star.style.left = `${(c * cellWidth) + Math.random() * cellWidth}%`;
                         star.style.top = `${(r * cellHeight) + Math.random() * cellHeight}%`;
                         const rand = Math.random();
                         let size, opacity;
                         if (rand > 0.90) { size = Math.random() * 12 + 20; opacity = Math.random() * 0.3 + 0.6; } 
                         else if (rand > 0.60) { size = Math.random() * 8 + 10; opacity = Math.random() * 0.3 + 0.3; } 
                         else { size = Math.random() * 4 + 4; opacity = Math.random() * 0.2 + 0.1; }
                         star.style.fontSize = `${size}px`;
                         star.style.opacity = opacity;
                         star.style.transform = `rotate(${Math.random() * 360}deg)`;
                         star.style.animation = `twSway ${Math.random() * 5 + 5}s ease-in-out infinite ${Math.random() * 5}s alternate`;
                         starBg.appendChild(star);
                     }
                 }
             }
         
             const forYouPosts = document.getElementById('foryou-posts');
         if (forYouPosts) {
         forYouPosts.innerHTML = '<div class="text-center text-mono-500 py-10">暂无新鲜事，点击右上角魔法棒召唤 AI 吧。</div>';
         }
         
         document.addEventListener('click', (e) => {
                 if (!e.target.closest('.cover-container')) {
                     document.querySelectorAll('.camera-overlay').forEach(o => o.classList.add('opacity-0', 'pointer-events-none'));
                 }
             });
         
             document.addEventListener('dblclick', function(e) {
                 if (e.target.tagName === 'IMG' && (e.target.dataset.avatar || e.target.dataset.cover)) {
                     e.preventDefault();
                     e.stopPropagation();
                     triggerImageUpload(e, e.target);
                 }
             });
         });
         
         let hasClearedDefaultFeed = false;
         let lastSummonedContactId = null;
         
         async function summonGlobalAI(btn) {
if(btn.classList.contains('fa-spin')) return;
if (!gConfig.apiUrl || !gConfig.apiKey) return alert("请先在系统设置中配置 API！");

let countStr = prompt("【召唤 AI 动态】\n请输入你想生成的推文数量（建议 1~10 条）：", "3");
if (countStr === null) return;
let generateCount = parseInt(countStr);
if (isNaN(generateCount) || generateCount <= 0) generateCount = 3;

btn.classList.add('fa-spin');

let linkedInfo = "";
    if (momentsData.twLinkedNPCs && momentsData.twLinkedNPCs.length > 0) {
        let linkedContacts = contacts.filter(c => momentsData.twLinkedNPCs.includes(c.id));
        if (linkedContacts.length > 0) {
            linkedInfo = "你的通讯录里有以下熟人可供你扮演（请严格使用他们的推特网名和Handle）：\n" + linkedContacts.map(c => {
                let h = c.twHandle || ('@' + (c.name.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'user_' + c.id.replace(/[^a-z0-9]/gi, '').substring(0, 5)));
                if (!h.startsWith('@')) h = '@' + h;
                
                // 提取最近5条对话（严格按当前世界观隔离）
let wid = gConfig.currentWorldviewId || 'default';
let recentText = c.history.filter(m => m.role !== 'system' && !m.isRevoked && (!m.wid || m.wid === wid)).slice(-5).map(m => {
    let text = m.content.replace(/<[^>]+>/g, '').trim();
    return text ? (m.role==='assistant'?'【TA】':'【用户】')+':'+text : '';
}).filter(t => t).join(' | ');
                
                return `- 推特网名：${c.twName || c.name}，Handle：${h}\n  【核心人设】：${c.history[0].content}\n  【近期与用户的聊天回忆】：${recentText || '无'}`;
            }).join('\n\n');
        }
    }

    let wid = gConfig.currentWorldviewId || 'default';
    let currentWv = (gConfig.worldviews || []).find(w => w.id === wid);
    let wvPrompt = currentWv ? currentWv.prompt : '这是一个极简、克制、注重排版与秩序感的现代社交平台。';

    let trendingInfo = "";
if (gConfig.twTrendingEnabled !== false) {
    let topic = gConfig.twTrendingTopic || "# Daily Vibes ★";
    trendingInfo = `热议话题：${topic}，请1~2条围绕此话题。`;
}

    let myName = twData.meName || '我';
    let myHandle = twData.meHandle || ('@' + (myName.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'soap_user'));
    if (!myHandle.startsWith('@')) myHandle = '@' + myHandle;

    // 精简后的提示词，大幅缩短以提升响应速度
    const sysPrompt = `你是推特动态生成引擎。世界观：${wvPrompt}
${linkedInfo ? `【🚨 强制熟人出场】：在生成的推文中，必须包含 1~2 条来自以下【熟人名单】的动态！请严格使用他们的网名！\n${linkedInfo}` : '身份：完全随机捏造路人网友。'}
用户Handle：${myHandle}（只有熟人才能@提及用户，路人禁止@用户）
${trendingInfo}

任务：你需要生成【正好 ${generateCount} 条】推文。其余的完全随机捏造路人网友。
要求：口语化、极简、不加动作描写。
【🚨 数量死命令】：你必须、必须、必须严格输出正好 ${generateCount} 个推文对象！少一个或多一个都会导致系统崩溃！
直接输出JSON数组，无任何额外文字：
[{"name":"网名","handle":"@username","text":"内容","hasMedia":false,"sceneDesc":null,"tags":[],"mentions":[]}]`;

             try {
                 const res = await fetch(`${gConfig.apiUrl}/v1/chat/completions`, {
                     method: 'POST', 
                     headers: { 'Authorization': `Bearer ${gConfig.apiKey}`, 'Content-Type': 'application/json' }, 
                     body: JSON.stringify({ model: gConfig.model, messages: [{ role: 'system', content: sysPrompt }, { role: 'user', content: '直接输出JSON数组：' }], temperature: 0.75 })
                 });
                 
                 if (!res.ok) throw new Error("API 错误");
                 const data = await res.json();
                 const postsArray = robustParseJSON(data.choices[0].message.content, true);
                 if (!postsArray || !Array.isArray(postsArray)) throw new Error("返回内容无法解析为数组，请重试");
                 
                 const forYouPosts = document.getElementById('foryou-posts');
                 if (forYouPosts) {
                     // 存入数据库
let wid = gConfig.currentWorldviewId || 'default';
if (!twData.worlds) twData.worlds = { 'default': { posts: [] } };
if (!twData.worlds[wid]) twData.worlds[wid] = { posts: [] };

postsArray.forEach((postObj, idx) => {
    let matchedContact = contacts.find(c => c.name === postObj.name || c.twName === postObj.name || (c.twHandle && c.twHandle.replace('@','') === (postObj.handle||'').replace('@','')));
    let finalAvatar = matchedContact ? getTwAvatarSrc(matchedContact) : `https://api.dicebear.com/7.x/notionists/svg?seed=${postObj.name}`;
    let finalId = matchedContact ? matchedContact.id : 'npc_' + Date.now() + Math.random();

    // 🚀 核心修复：如果匹配到了熟人，绝对强制使用 TA 真实的推特 Handle，无视 AI 乱编的账号！
    let finalHandle = postObj.handle;
    if (matchedContact) {
        finalHandle = matchedContact.twHandle;
        if (!finalHandle.startsWith('@')) finalHandle = '@' + finalHandle;
    } else {
        let baseHandle = (postObj.name || '路人网友').toLowerCase().replace(/[^a-z0-9_]/g, '');
        if (!baseHandle) baseHandle = 'user_' + finalId.replace(/[^a-z0-9]/gi, '').substring(0, 5);
        finalHandle = postObj.handle || ('@' + baseHandle);
    }

    // 拼接正文、艾特和标签
    let finalContent = postObj.text || '...';
    let extras = [];
    if (postObj.mentions && Array.isArray(postObj.mentions) && postObj.mentions.length > 0) {
        extras.push(postObj.mentions.map(m => `<span class="text-blue-500 dark:text-blue-400 hover:underline cursor-pointer">${m}</span>`).join(' '));
    }
    if (postObj.tags && Array.isArray(postObj.tags) && postObj.tags.length > 0) {
        extras.push(postObj.tags.map(t => `<span class="text-blue-500 dark:text-blue-400 hover:underline cursor-pointer">#${t}</span>`).join(' '));
    }
    if (extras.length > 0) {
        finalContent += '<br><br>' + extras.join(' ');
    }

    const postData = {
        id: 'tw_post_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substr(2, 9),
        contactId: finalId,
        name: postObj.name || '路人网友',
        handle: finalHandle,
        avatar: finalAvatar,
        content: finalContent,
        hasMedia: postObj.hasMedia === true,
        sceneDesc: postObj.sceneDesc || null,
        timestamp: Date.now(),
        likes: Math.floor(Math.random()*300)+10,
        isLiked: false,
        comments: []
    };
    twData.worlds[wid].posts.push(postData);

// 🚀 核心新增：如果 AI 艾特了“我”，生成一条通知！
let myName = twData.meName || '我';
let myHandle = twData.meHandle || ('@' + (myName.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'soap_user'));
if (!myHandle.startsWith('@')) myHandle = '@' + myHandle;

if (postObj.mentions && Array.isArray(postObj.mentions)) {
    let mentionedMe = postObj.mentions.some(m => m.toLowerCase() === myHandle.toLowerCase());
    if (mentionedMe && matchedContact) {
        addTwNotification('mention', matchedContact.id, postData.content.replace(/<[^>]+>/g, '').substring(0, 30) + '...', postData.id);
    }
}

    // 核心桥接：让 AI 知道自己在推特广场上发了帖子
if (matchedContact) {
    let timeString = new Date().toLocaleString();
    let momentPrompt = `[📱 跨平台记忆同步 - ${timeString}]：你刚刚在推特(Twitter)上发布了一条新动态：“${postData.content}”。请在后续的聊天中自然地保留这段记忆。`;
    matchedContact.history.push({role: 'system_sum', content: `<i>✧ 对方在推特发布了一条新动态</i>\n<span style="display:none;">${momentPrompt}</span>`, wid: wid});
}
});

saveTwData();
saveData();
renderTwFeed();
switchHomeTab('foryou');
                     const mainScroll = document.getElementById('main-scroll');
                     if (mainScroll) mainScroll.scrollTo({ top: 0, behavior: 'smooth' });
                 }
             } catch (e) {
                 console.error(e);
                 alert("召唤失败，请检查网络、API 配置或大模型 JSON 输出能力。");
             } finally {
                 btn.classList.remove('fa-spin');
             }
         }
         
         let currentImageTarget = null;
         let currentImageType = null;
         let currentImageId = null;
         
         function toggleCoverCamera(container) {
             const overlay = container.querySelector('.camera-overlay');
             if (overlay) {
                 if (overlay.classList.contains('opacity-0')) {
                     document.querySelectorAll('.camera-overlay').forEach(o => o.classList.add('opacity-0', 'pointer-events-none'));
                     overlay.classList.remove('opacity-0', 'pointer-events-none');
                 } else {
                     overlay.classList.add('opacity-0', 'pointer-events-none');
                 }
             }
         }
         
         function triggerImageUpload(event, imgElement) {
             if (event) event.stopPropagation();
             currentImageTarget = imgElement;
             
             if (imgElement.dataset.avatar) {
                 currentImageType = 'avatar';
                 currentImageId = imgElement.dataset.avatar;
             } else if (imgElement.dataset.cover) {
                 currentImageType = 'cover';
                 currentImageId = imgElement.dataset.cover;
             } else {
                 currentImageType = null;
                 currentImageId = null;
             }
             
             document.getElementById('global-image-upload').click();
         }
         
         function twHandleImageUpload(event) {
         const file = event.target.files[0];
         if (file && currentImageTarget) {
             const reader = new FileReader();
             reader.onload = function(e) {
                 const newSrc = e.target.result;
                 
                 if (currentImageType && currentImageId) {
                     document.querySelectorAll(`[data-${currentImageType}="${currentImageId}"]`).forEach(img => {
                         img.src = newSrc;
                     });
         
                     // 真实数据持久化，确保刷新不丢失
                     if (currentImageId === 'user') {
    if (currentImageType === 'cover') {
        if(!twData.userCovers) twData.userCovers = {};
        twData.userCovers['me'] = newSrc;
    } else {
        twData.meAvatar = newSrc; // 彻底独立，只存入推特数据库
    }
    saveTwData();
} else {
    if (currentImageType === 'cover') {
        if(!twData.userCovers) twData.userCovers = {};
        twData.userCovers[currentImageId] = newSrc;
        saveTwData();
    } else {
        const c = contacts.find(x => x.id === currentImageId);
        if(c) {
            c.chatAvatar = newSrc;
            saveData();
        }
    }
}
                         } else {
            currentImageTarget.src = newSrc;
        }
        
        document.querySelectorAll('.camera-overlay').forEach(o => o.classList.add('opacity-0', 'pointer-events-none'));
        
        // 核心修复：换完头像后，瞬间刷新所有的帖子列表，让新头像立刻生效！
renderTwFeed();
renderTwitterContacts(); // 🚀 瞬间刷新发帖界面的联系人 @提及列表！
if (document.getElementById('profile-view') && !document.getElementById('profile-view').classList.contains('hidden')) {
    switchView('profile-view'); // 重新触发渲染“我”的主页
}
if (document.getElementById('other-profile-view') && !document.getElementById('other-profile-view').classList.contains('hidden')) {
    openOtherProfile(currentProfileUser); // 重新触发渲染他人主页
}
    }
    reader.readAsDataURL(file);
}
event.target.value = '';
}
         
         let currentReplyTargetHandle = '@elonmusk';

function prepareReply(handle, btn, event) {
    if (event) event.stopPropagation();
    currentReplyTargetHandle = handle;
    const deskInput = document.getElementById('desktop-reply-input');
    const mobInput = document.getElementById('mobile-reply-input');
    if (deskInput) { deskInput.placeholder = '回复 ' + handle; deskInput.focus(); }
    if (mobInput) { mobInput.placeholder = '回复 ' + handle; mobInput.focus(); }
}

// 统一的评论渲染引擎：彻底解决连线错乱和不显示的问题
function renderDetailComments() {
    const container = document.getElementById('details-comments-container');
    if (!container) return;
    container.innerHTML = '';
    
    const mainPostHandle = document.getElementById('detail-post-handle').innerText;
    
    // 1. 核心排序引擎：将评论梳理成“父子相连”的树状扁平结构
    let threadedComments = [];
    let visited = new Set();

    function findReplies(targetHandle) {
        currentDetailComments.forEach((cm, idx) => {
            if (!visited.has(idx) && cm.replyTo === targetHandle) {
                visited.add(idx);
                threadedComments.push(cm);
                findReplies(cm.handle); // 递归找回复的回复
            }
        });
    }

    // 先挑出直接回复楼主的评论
    currentDetailComments.forEach((cm, idx) => {
        if (!visited.has(idx) && cm.replyTo === mainPostHandle) {
            visited.add(idx);
            threadedComments.push(cm);
            findReplies(cm.handle); // 顺藤摸瓜找这条评论的跟帖
        }
    });

    // 兜底：把剩下的异常数据补在最后
    currentDetailComments.forEach((cm, idx) => {
        if (!visited.has(idx)) {
            threadedComments.push(cm);
        }
    });

    // 2. 遍历梳理好的数组进行渲染
    threadedComments.forEach((cm, index) => {
        // 判断是否有上一条连线 (当前评论不是回复主帖)
        const hasTopLine = (cm.replyTo && cm.replyTo !== mainPostHandle);
        
        // 判断是否有下一条连线 (下一条是回复我的，或者下一条跟我回复了同一个人)
        const nextCm = threadedComments[index + 1];
        let hasBottomLine = false;
        if (nextCm) {
            if (nextCm.replyTo === cm.handle) {
                hasBottomLine = true; // 下一条是我的跟帖
            } else if (hasTopLine && nextCm.replyTo === cm.replyTo) {
                hasBottomLine = true; // 下一条是我的兄弟跟帖
            }
        }

        // 3. 根据父子关系动态计算线条样式
        let lineStyle = "display: none;";
        if (hasTopLine && hasBottomLine) {
            lineStyle = "top: 0px; bottom: 0px; height: auto;"; // 贯通
        } else if (!hasTopLine && hasBottomLine) {
            lineStyle = "top: 56px; bottom: 0px; height: auto;"; // 头部向下
        } else if (hasTopLine && !hasBottomLine) {
            lineStyle = "top: 0px; height: 16px;"; // 尾部收尾
        }
        
        let cDisplayName = cm.name;
        let cDisplayHandle = cm.handle;
        let cAvatarHtml = '';

        // 尝试反向匹配联系人
let matchedC = contacts.find(x => x.name === cm.name || x.twName === cm.name || (x.twHandle && x.twHandle.replace('@','') === (cm.handle||'').replace('@','')));

if (cm.id === 'me' || cm.name === (twData.meName || '我') || cm.handle === twData.meHandle) {
            if (cm.maskId && cm.maskId !== null) {
                // 🚀 面具评论：严格使用评论对象上保存的面具资料，绝不回退到真实资料
                cDisplayName = cm.name;
                cDisplayHandle = cm.handle;
                let safeSrc = cm.avatar || 'https://api.dicebear.com/7.x/notionists/svg?seed=Mask';
                cAvatarHtml = `<img src="${safeSrc}" class="w-10 h-10 shrink-0 bg-mono-200 dark:bg-mono-800 relative z-10 rounded-full object-cover">`;
            } else {
                // 🚀 普通评论（没戴面具）：使用推特真实资料，并实时同步最新的名字和头像
                cDisplayName = twData.meName || '我';
                let rawHandle = twData.meHandle || '';
                cDisplayHandle = rawHandle ? (rawHandle.startsWith('@') ? rawHandle : '@' + rawHandle) : ('@' + (cDisplayName.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'soap_user'));
                let safeSrc = twData.meAvatar || 'https://api.dicebear.com/7.x/notionists/svg?seed=Zero';
                cAvatarHtml = `<img src="${safeSrc}" class="w-10 h-10 shrink-0 bg-mono-200 dark:bg-mono-800 relative z-10 rounded-full object-cover">`;
            }
        } else if (matchedC) {
            cDisplayName = matchedC.twName || matchedC.name;
            let baseHandle = matchedC.twHandle ? matchedC.twHandle : ('@' + (matchedC.name.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'user_' + matchedC.id.replace(/[^a-z0-9]/gi, '').substring(0, 5)));
            if (!baseHandle.startsWith('@')) baseHandle = '@' + baseHandle;
            cDisplayHandle = baseHandle;
            let safeSrc = getTwAvatarSrc(matchedC);
            cAvatarHtml = `<img src="${safeSrc}" class="w-10 h-10 shrink-0 bg-mono-200 dark:bg-mono-800 relative z-10 rounded-full object-cover">`;
        } else {
            if (cm.avatar && cm.avatar.includes('<svg')) {
                cAvatarHtml = `<div class="w-10 h-10 shrink-0 bg-mono-200 dark:bg-mono-800 relative z-10 rounded-full flex items-center justify-center text-mono-500 overflow-hidden">${cm.avatar}</div>`;
            } else {
                let safeSrc = cm.avatar || 'https://api.dicebear.com/7.x/notionists/svg?seed=Zero';
                cAvatarHtml = `<img src="${safeSrc}" class="w-10 h-10 shrink-0 bg-mono-200 dark:bg-mono-800 relative z-10 rounded-full object-cover">`;
            }
        }

const cmHtml = `
<div class="px-4 py-3 relative hover:bg-mono-100/50 dark:hover:bg-mono-800/50 transition cursor-pointer border-b border-mono-200 dark:border-mono-700 fade-in">
    <div class="thread-line" style="${lineStyle}"></div>
    <div class="flex space-x-3 relative z-10">
        ${cAvatarHtml}
        <div class="flex-1">
    <div class="flex items-center justify-between">
        <div class="flex items-center space-x-1 text-[15px] truncate">
            <span class="font-bold hover:underline">${cDisplayName}</span>
            <span class="text-mono-500 truncate">${cDisplayHandle} · 刚刚</span>
        </div>
        <div class="p-1.5 text-mono-400 hover:text-red-500 hover:bg-red-500/10 rounded-full cursor-pointer transition flex items-center justify-center shrink-0" onclick="event.stopPropagation(); deleteDetailComment('${cm.cid}')" title="删除评论">
    <i class="fa-regular fa-trash-can text-[14px]"></i>
</div>
    </div>
    <p class="text-mono-500 text-[15px] mt-0.5">回复 <span class="text-mono-600 dark:text-mono-950 hover:underline">${cm.replyTo}</span></p>
                    <p class="mt-1 text-[15px] leading-normal">${cm.text}</p>
                    <div class="flex justify-between mt-3 text-mono-500 text-[14px] max-w-[400px]">
                        <div class="flex items-center space-x-2 hover:text-mono-600 dark:hover:text-mono-950 transition cursor-pointer" onclick="prepareReply('${cm.handle}', this, event)"><i class="fa-regular fa-comment"></i><span>0</span></div>
                        <div class="flex items-center space-x-2 hover:text-purple-500 transition group" onclick="generateAIComment(this, event, '${cm.handle}', '${cm.name}', \`${cm.text.replace(/`/g, "'")}\`)" title="召唤 AI 评论">
                            <div class="p-1.5 rounded-full group-hover:bg-purple-500/10 -ml-1.5"><i class="fa-solid fa-wand-magic-sparkles"></i></div>
                            <span class="font-bold">AI</span>
                        </div>
                        <div class="flex items-center space-x-2 hover:text-pink-500 transition" onclick="event.stopPropagation(); this.classList.toggle('text-pink-500'); this.querySelector('i').classList.toggle('fa-solid'); this.querySelector('i').classList.toggle('fa-regular');"><i class="fa-regular fa-heart"></i><span>0</span></div>
                        <div class="flex items-center space-x-2 hover:text-mono-600 dark:hover:text-mono-950 transition"><i class="fa-solid fa-chart-simple"></i><span>0</span></div>
                    </div>
                </div>
            </div>
        </div>
        `;
        container.insertAdjacentHTML('beforeend', cmHtml);
    });
}

function submitReply(source) {
    const inputId = source === 'desktop' ? 'desktop-reply-input' : 'mobile-reply-input';
    const inputEl = document.getElementById(inputId);
    const text = inputEl.value.trim();
    if (!text) return;

    // 使用当前面具身份
    const twPerson = getTwActivePerson();
    const userName = twPerson.name;
    const userHandle = twPerson.handle;
    let userAvatarSrc = twPerson.avatar;

    // 存入当前详情页数组
    const newComment = {
    id: 'me',
    cid: 'cm_' + Math.random().toString(36).substr(2, 9) + Date.now(),
    name: userName,
    handle: userHandle,
    avatar: userAvatarSrc,
    text: text,
    replyTo: currentReplyTargetHandle,
    maskId: twActiveMaskId || null
};

currentDetailComments.push(newComment);

let currentPosts = getCurrentWorldPosts();
const post = currentPosts.find(p => p.id === currentDetailPostId);
if (post) {
    post.comments = currentDetailComments;
    saveTwData();
    
    // 🚀 核心新增：全面同步推特评论区的上下文到主线聊天室（带匿名小号与暗恋试探设定）
    let timeString = new Date().toLocaleString();
    let linkedIds = momentsData.twLinkedNPCs || [];
    let availableAIs = contacts.filter(c => linkedIds.includes(c.id) || linkedIds.length === 0);

    let targetContact = null;

    let maskContextHint = "";
    if (twActiveMaskId && twActiveMaskId !== null) {
        let p = getTwActivePerson();
        if (twActiveMaskId === 'anonymous') {
            maskContextHint = `\n【身份伪装警告】：这条评论来自一个匿名账号（网名："${p.name}"，Handle："${p.handle}"）。你并不确定这个匿名账号背后是谁。`;
        } else {
            let maskObj = masks.find(x => x.id === twActiveMaskId);
            let maskPersona = maskObj && maskObj.persona ? `\n该面具的人设背景：${maskObj.persona}` : '';
            maskContextHint = `\n【身份识别成功】：你认出了这个人！用户使用了面具身份（网名："${p.name}"，Handle："${p.handle}"）在推特上活动。${maskPersona}`;
        }
    }

    let wid = gConfig.currentWorldviewId || 'default';
availableAIs.forEach(c => {
    let cHandle = c.twHandle || ('@' + (c.name.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'user_' + c.id.replace(/[^a-z0-9]/gi, '').substring(0, 5)));
    if (!cHandle.startsWith('@')) cHandle = '@' + cHandle;

    let isTarget = (cHandle.toLowerCase() === currentReplyTargetHandle.toLowerCase()) || 
                   (post.contactId === c.id && post.handle.toLowerCase() === currentReplyTargetHandle.toLowerCase());
    
    let isPostAuthor = (post.contactId === c.id);

    // 🚀 核心重构：面具隔离引擎 V2（评论版）
    let canRecognize = true;
    let canSeeComment = true;
    
    if (twActiveMaskId && twActiveMaskId !== 'anonymous') {
        if (c.maskId !== twActiveMaskId) {
            canRecognize = false;
            // 例外：被直接回复的 AI 和楼主仍然能看到评论（但不知道是谁）
            if (!isTarget && !isPostAuthor) {
                canSeeComment = false;
            }
        }
    }
    
    if (!canSeeComment) return;
    
    // 根据是否能认出用户，动态调整提示词
    let effectiveMaskHint = maskContextHint;
    if (!canRecognize && twActiveMaskId && twActiveMaskId !== 'anonymous') {
        let p = getTwActivePerson();
        effectiveMaskHint = `\n【身份未知】：这条评论来自一个你不认识的账号"${p.name}"(${p.handle})。你并不知道这个人是谁。`;
    }

    if (isTarget) {
        targetContact = c;
        let momentPrompt = `[📱 推特互动同步 - ${timeString}]：${canRecognize ? '用户' : '一个陌生账号'}刚刚在推特(Twitter)上回复/艾特了你："${text}"。${effectiveMaskHint}\n请结合你的人设，在接下来的聊天中自然地提起或试探这件事！`;
        c.history.push({role: 'system_sum', content: `<i>✧ 你在推特上回复了对方</i>\n<span style="display:none;">${momentPrompt}</span>`, wid: wid});
    } else if (isPostAuthor) {
        let momentPrompt = `[📱 推特互动同步 - ${timeString}]：${canRecognize ? '用户' : '一个陌生账号'}刚刚在你的推特(Twitter)帖子下回复了别人："${text}"。${effectiveMaskHint}\n你可以暗中观察，或者在聊天室里隐晦地提起。`;
        c.history.push({role: 'system_sum', content: `<i>✧ 你在对方的推特下进行了回复</i>\n<span style="display:none;">${momentPrompt}</span>`, wid: wid});
    } else {
        let momentPrompt = `[📱 推特八卦同步 - ${timeString}]：${canRecognize ? '用户' : '一个陌生账号'}刚刚在推特(Twitter)上发了一条评论："${text}"。${effectiveMaskHint}\n如果语境合适，你可以根据人设在聊天里八卦或随口一提。`;
        c.history.push({role: 'system_sum', content: `<i>✧ 你在推特上发表了评论</i>\n<span style="display:none;">${momentPrompt}</span>`, wid: wid});
    }
});

    saveData();

    // 如果被直接回复的 AI 存在，触发自动推特回复
    if (targetContact) {
        setTimeout(() => { 
            twTriggerAICommentReply(targetContact, post, text, userName, userHandle); 
        }, Math.floor(Math.random() * 3000) + 2000);
    }
}

// 重新渲染
renderDetailComments();
    
    // 顺便让主帖的评论数+1
    if (window.currentActivePostLikeBtn) {
        const commentIcon = window.currentActivePostLikeBtn.parentElement.querySelector('.fa-comment');
        if (commentIcon && commentIcon.nextElementSibling) {
            let cc = parseInt(commentIcon.nextElementSibling.innerText) || 0;
            commentIcon.nextElementSibling.innerText = cc + 1;
        }
    }
    
    inputEl.value = '';
    if (source === 'desktop') {
        const mob = document.getElementById('mobile-reply-input');
        if (mob) mob.value = '';
    } else {
        const desk = document.getElementById('desktop-reply-input');
        if (desk) desk.value = '';
    }
    inputEl.placeholder = '发布你的回复';
    currentReplyTargetHandle = document.getElementById('detail-post-handle').innerText;
}

async function twTriggerAICommentReply(c, post, myCommentText, uName, uHandle) {
    if(!gConfig.apiUrl || !gConfig.apiKey) return;

    // 提取主线聊天室近期记录
    let mainHistoryText = "";
    let currentWid = gConfig.currentWorldviewId || 'default';
    let recentMain = c.history.filter(m => m.role !== 'system' && !m.isRevoked && (!m.wid || m.wid === currentWid)).slice(-8);
    recentMain.forEach(m => {
        let cleanContent = m.content;
        if (m.role === 'system_sum') {
            let match = m.content.match(/<span style="display:none;">(.*?)<\/span>/);
            cleanContent = match ? match[1] : m.content.replace(/<[^>]+>/g, '').trim();
        } else {
            cleanContent = m.content.replace(/<[^>]+>/g, '').trim();
        }
        if(cleanContent) {
            let speaker = m.role === 'assistant' ? '【你】' : '【用户】';
            if (m.role === 'system_sum') speaker = '【系统旁白】';
            mainHistoryText += `${speaker}: ${cleanContent}\n`;
        }
    });

    let wid = gConfig.currentWorldviewId || 'default';
    let currentWv = (gConfig.worldviews || []).find(w => w.id === wid);
    let wvPrompt = currentWv ? currentWv.prompt : '这是一个极简、克制、注重排版与秩序感的现代社交平台。';

    // 🚀 核心重构：面具感知引擎 V3
    // 判断这个 AI 是否能认出用户的面具身份
    let canRecognizeMask = false;
    if (twActiveMaskId && twActiveMaskId !== 'anonymous') {
        canRecognizeMask = (c.maskId === twActiveMaskId);
    }
    
    let maskIdentityBlock = "";
    let identityLine = "";
    let memoryBlock = "";
    
    if (twActiveMaskId && twActiveMaskId !== null) {
        let p = getTwActivePerson();
        if (twActiveMaskId === 'anonymous') {
            // 匿名：所有人都不知道是谁
            maskIdentityBlock = `\n【⚠️ 身份未知】：评论你的人使用了匿名身份，网名为"${p.name}"，Handle为"${p.handle}"。你完全不知道这个人是谁。请像对待一个完全陌生的网友一样回应。`;
            identityLine = `2. 有一个匿名网友（${p.name}）评论了你。你完全不认识TA。`;
            memoryBlock = ""; // 匿名模式下不注入主线记忆
        } else if (canRecognizeMask) {
            // 戴了同款面具：能认出用户
            let maskObj = masks.find(x => x.id === twActiveMaskId);
            let maskPersona = maskObj && maskObj.persona ? `\n该面具的人设背景：${maskObj.persona}` : '';
            maskIdentityBlock = `\n【⚠️ 身份识别成功】：你认出了评论你的人！TA使用了面具身份"${p.name}"(${p.handle})，但你知道TA的真实身份就是你认识的用户。${maskPersona}\n你可以隐晦地暗示你认出了TA，也可以配合TA的伪装。`;
            identityLine = `2. 你认出了对方就是用户（真实名字：${uName}），TA目前伪装成"${p.name}"。`;
        } else {
            // 没戴同款面具：完全不认识
            maskIdentityBlock = `\n【⚠️ 身份未知】：评论你的人网名为"${p.name}"，Handle为"${p.handle}"。你并不认识这个人，TA对你来说就是一个普通的陌生网友。请不要表现出你认识TA！`;
            identityLine = `2. 一个你不认识的网友"${p.name}"(${p.handle})评论了你。你完全不知道这个人是谁。绝对不要表现出你认识TA！`;
            memoryBlock = ""; // 不认识就不注入主线记忆
        }
    } else {
        // 没戴面具：正常模式
        identityLine = `2. 你知道对方是用户（真实名字：${uName}，推特Handle：${uHandle}）。`;
    }
    
    // 🚀 核心修复：只有能认出用户时，才注入主线聊天记忆；否则 AI 不应该知道这些
    let memorySection = "";
    if (!twActiveMaskId || canRecognizeMask) {
        memorySection = `\n\n【近期与用户的聊天回忆】：\n${mainHistoryText || '暂无。'}`;
    }

    // 🚀 核心修复：提前获取该 AI 的真实推特 Handle，并注入到系统提示词最开头，让它知道自己是谁
    let cHandle = c.twHandle || ('@' + (c.name.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'user_' + c.id.replace(/[^a-z0-9]/gi, '').substring(0, 5)));
    if (!cHandle.startsWith('@')) cHandle = '@' + cHandle;

    let sysPrompt = `你是一个拥有独立灵魂的真实人物（真实名字：${c.name}，当前推特网名：${c.twName || c.name}，你的推特账号Handle是：${cHandle}）。
【当前所在的世界观背景】：
${wvPrompt}

【你的人设】：
${c.history[0].content}
${memorySection}

【🚨 核心防错与情境警告 🚨】：
1. 你现在是在推特 (Twitter) 上回复评论！
${identityLine}${maskIdentityBlock}
3. 身份隔离警告：没有人知道你的真实身份，除非你自己想暴露。
4. 你的回复必须【100% 极度契合】你的人设！符合推特半公开场合的语境（可以互相调侃、互怼、或者隐晦地暧昧）。

【事件背景】：
原推文内容是：“${post.content}”
${post && post.sceneDesc ? `(你在这条推文中附带了一张照片，画面内容是：“${post.sceneDesc}”)` : ''}
刚刚，用户（${uName}）回复了你：
“${myCommentText}”

【任务要求】：
请结合你的人设和近期的聊天回忆，直接在推特上回复用户的这条评论！
注意：
1. 语气极简、口语化，符合推特风格。绝对不要加任何动作描写或标签。
2. 必须返回严格的 JSON 格式，不要有 markdown 标记！
格式如下：
{
"text": "回复内容的纯文本"
}`;

    try {
        const response = await fetch(`${gConfig.apiUrl}/v1/chat/completions`, { 
            method: 'POST', 
            headers: { 'Authorization': `Bearer ${gConfig.apiKey}`, 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ 
                model: gConfig.model, 
                messages: [{ role: 'system', content: sysPrompt }], 
                temperature: 0.9 
            }) 
        });

        if (!response.ok) return;
        const data = await response.json(); 
        let rawContent = data.choices[0].message.content.trim();
        
        rawContent = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();
        let startIdx = rawContent.indexOf('{'); 
        let endIdx = rawContent.lastIndexOf('}');
        if(startIdx !== -1 && endIdx !== -1) {
            rawContent = rawContent.substring(startIdx, endIdx + 1);
        }
        
        const aiData = JSON.parse(rawContent);
        let replyText = aiData.text || aiData['回复'] || aiData['内容'] || "……";
        
        // 物理防线：剔除所有标签和所有的星号包裹动作
        replyText = replyText.replace(/<[^>]+>/g, '').replace(/\*[^*]+\*/g, '').trim();
        if (!replyText) replyText = "……";
        
        let cHandle = c.twHandle || ('@' + (c.name.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'user_' + c.id.replace(/[^a-z0-9]/gi, '').substring(0, 5)));
        if (!cHandle.startsWith('@')) cHandle = '@' + cHandle;

        let cAvatar = getTwAvatarSrc(c);

        // 把 AI 的回复推入那条帖子的评论区
post.comments.push({ 
    id: c.id, 
    name: c.twName || c.name, 
    handle: cHandle,
    avatar: cAvatar,
    text: replyText,
    replyTo: uHandle
});
saveTwData();

// 🚀 核心新增：生成回复通知
addTwNotification('reply', c.id, replyText.substring(0, 30) + (replyText.length > 30 ? '...' : ''), post.id);

// 写入带 wid 标签的上下文，切断全局记忆污染
let timeString = new Date().toLocaleString();
let currentWid = gConfig.currentWorldviewId || 'default';
c.history.push({role: 'system_sum', content: `<i>✧ 对方在推特上回复了你</i>\n<span style="display:none;">[推特互动 - ${timeString}]：你在推特上回复了 ${uName} 的评论：“${replyText}”。</span>`, wid: currentWid});
saveData();

        // 如果当前正好停在推特详情页面，重绘让新评论冒出来！
        if (document.getElementById('details-view') && !document.getElementById('details-view').classList.contains('hidden') && currentDetailPostId === post.id) {
            currentDetailComments = post.comments;
            renderDetailComments();
        }

    } catch (error) {
        console.error("AI 推特评论回复失败:", error);
    }
}

async function generateAIComment(btn, event, passedHandle, passedName, passedText) {
    if(event) event.stopPropagation();
    const icon = btn.querySelector('i');
    if (icon.classList.contains('fa-spin')) return; 

    if (!gConfig.apiUrl || !gConfig.apiKey) return alert("请先在系统设置中配置 API！");

    let totalCountStr = prompt("【召唤 AI 评论】\n请输入你想生成的评论总数（建议 1~5 条）：", "2");
    if (totalCountStr === null) return;
    let totalCount = parseInt(totalCountStr) || 2;

    let contactCountStr = prompt(`【召唤 AI 评论】\n在这 ${totalCount} 条评论中，包含几个熟人（通讯录联系人）的评论？\n（建议 0~${totalCount} 个）：`, "1");
    if (contactCountStr === null) return;
    let contactCount = parseInt(contactCountStr) || 0;

    icon.classList.add('fa-spin');

    const postAuthorName = document.getElementById('detail-post-name').innerText;
    const postAuthorHandle = document.getElementById('detail-post-handle').innerText;
    const postContent = document.getElementById('detail-post-content').innerText;

    // 确定回复目标
    let targetHandle = passedHandle || postAuthorHandle;
    let targetName = passedName || postAuthorName;
    let targetText = passedText || postContent;

    // 🚀 核心新增：提前获取当前帖子，判断楼主和被回复人的身份
    let currentPosts = getCurrentWorldPosts();
    const post = currentPosts.find(p => p.id === currentDetailPostId);

    let targetContact = contacts.find(c => {
        let h = c.twHandle ? c.twHandle : ('@' + (c.name.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'user_' + c.id.replace(/[^a-z0-9]/gi, '').substring(0, 5)));
        if (!h.startsWith('@')) h = '@' + h;
        return h.toLowerCase() === targetHandle.toLowerCase();
    });

    let authorContact = post ? contacts.find(c => c.id === post.contactId) : null;

    let roleplayInstruction = "";
    if (targetContact) {
        roleplayInstruction += `\n【🚨 强制回应指令】：被回复的人是【${targetContact.name}】！TA【必须】亲自出来回应这句话！请务必生成一条由 ${targetContact.name} 发出的评论！`;
    }
    if (authorContact && authorContact.id !== (targetContact ? targetContact.id : null)) {
        roleplayInstruction += `\n【楼主出场许可】：楼主是【${authorContact.name}】！作为动态的主人，TA也可以在评论区冒泡、补充发言或吃瓜。`;
    }

    let linkedInfo = "";
if (momentsData.twLinkedNPCs && momentsData.twLinkedNPCs.length > 0) {
    let linkedContacts = contacts.filter(c => momentsData.twLinkedNPCs.includes(c.id));
    if (linkedContacts.length > 0) {
        linkedInfo = "你的通讯录里有以下熟人可供你扮演（请严格遵循他们的人设）：\n" + linkedContacts.map(c => `- 名字：${c.name}，【核心人设】：${c.history[0].content}`).join('\n\n');
    }
}

    let wid = gConfig.currentWorldviewId || 'default';
    let currentWv = (gConfig.worldviews || []).find(w => w.id === wid);
    let wvPrompt = currentWv ? currentWv.prompt : '这是一个极简、克制、注重排版与秩序感的现代社交平台。';

    let trendingInfo = "";
    if (gConfig.twTrendingEnabled !== false) {
        let topic = gConfig.twTrendingTopic || "# 突发事件 / 剧情风暴";
        trendingInfo = `\n【🔥 当前全站热议话题】：${topic}\n如果语境合适，评论可以巧妙地带入或玩梗这个话题。`;
    }

    // 🚀 核心新增：把你的真实账号告诉 AI，并下达绝对禁令！
    let myName = momentsData.meName || gConfig.meName || '我';
    let myHandle = momentsData.meHandle || ('@' + (myName.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'soap_user'));
    if (!myHandle.startsWith('@')) myHandle = '@' + myHandle;

    // 🚀 核心重构：面具感知引擎（评论生成版）
    // 这里生成的是多个不同网友的评论，每个网友是否能认出用户取决于对应的联系人是否佩戴了同款面具
    // 但由于这是批量生成引擎，无法逐个判断，所以采用保守策略：
    // - 没戴面具/匿名 → 正常提示
    // - 戴了非匿名面具 → 只告诉 AI "有个不认识的人"，不泄露面具人设
    let maskInfoForComments = "";
    if (twActiveMaskId && twActiveMaskId !== null) {
        let p = getTwActivePerson();
        if (twActiveMaskId === 'anonymous') {
            maskInfoForComments = `\n【⚠️ 身份未知】：被回复的目标中，有一个匿名账号"${p.name}"(${p.handle})。你不知道这个人是谁。`;
        } else {
            // 不泄露面具人设，只告知有这么一个账号存在
            maskInfoForComments = `\n【⚠️ 身份未知】：被回复的目标中，有一个账号"${p.name}"(${p.handle})。你并不认识这个人，请像对待普通陌生网友一样回应。绝对不要表现出你认识TA！`;
        }
    }

    const sysPrompt = `你是一个推特(Twitter)评论生成器。
世界观背景：${wvPrompt}
${trendingInfo}

【上下文】
楼主 ${postAuthorName} 发了推文："${postContent}"
${post && post.realImgUrl ? '[楼主附带了一张真实图片，请结合图片吐槽]' : ''}
${post && post.sceneDesc ? `[楼主附带了一张照片："${post.sceneDesc}"]` : ''}

【当前任务】
你需要生成【正好 ${totalCount} 条】网友评论，用来回复 ${targetName} (${targetHandle}) 说的这句话："${targetText}"

${linkedInfo ? `【🚨 强制熟人出场指令】：在这 ${totalCount} 条评论中，你【必须】安排 ${contactCount} 个下方名单里的熟人来发表评论！请严格使用他们的名字！其余的再随机捏造路人。\n【可选熟人名单】：\n${linkedInfo}` : '【身份】：完全随机捏造路人网友。'}
${roleplayInstruction}

【🚨 绝对输出铁律 - 数量与格式死命令】
1. 数量必须精准：你必须严格生成正好 ${totalCount} 个评论对象！少一个或多一个都会导致系统崩溃！
2. 必须输出一个纯 JSON 数组，不要任何 Markdown 标记，不要说"好的"等废话。
3. 评论内容必须简短、口语化、沙雕或吃瓜。
4. 绝对不要包含 ${myName} (${myHandle}) 的评论！${maskInfoForComments}

输出示例（注意：这只是格式示例，实际生成的数量必须严格等于 ${totalCount} 条！）：
[
  {"name": "路人甲", "handle": "@luren_jia", "text": "哈哈哈哈笑死我了"},
  {"name": "熟人乙", "handle": "@shuren_b", "text": "你又在发什么癫"}
]`;

    try {
    let apiMessages = [{ role: 'system', content: sysPrompt }, { role: 'user', content: '请直接输出JSON数组：' }];
    
    // 如果帖子包含真实图片，注入视觉模型支持
    if (post && post.realImgUrl) {
        apiMessages.push({
            role: 'user',
            content: [
                { type: "text", text: "这是楼主发布的图片，请仔细查看图片内容，并在你的评论中自然地提及或吐槽图片里的细节！" },
                { type: "image_url", image_url: { url: post.realImgUrl, detail: "auto" } }
            ]
        });
    }

    const res = await fetch(`${gConfig.apiUrl}/v1/chat/completions`, {
        method: 'POST', 
        headers: { 'Authorization': `Bearer ${gConfig.apiKey}`, 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ model: gConfig.model, messages: apiMessages, temperature: 0.9 })
    });
        
        if (!res.ok) throw new Error("API 错误");
        const data = await res.json();
        let rawContent = data.choices[0].message.content;
        
        // 🚀 核心重构：笨模型容错解析引擎
        let commentsArray = robustParseJSON(rawContent, true);
        
        // 终极兜底：如果 JSON 解析彻底失败（模型连括号都写错），用正则暴力硬抠数据！
        if (!commentsArray || !Array.isArray(commentsArray) || commentsArray.length === 0) {
            commentsArray = [];
            // 尝试匹配 {"name":"xxx", "handle":"xxx", "text":"xxx"} 这种结构，无视外层数组括号
            let reg = /\{[^{}]*"name"\s*:\s*"([^"]+)"[^{}]*"handle"\s*:\s*"([^"]+)"[^{}]*"text"\s*:\s*"([^"]+)"[^{}]*\}/gi;
            let match;
            while ((match = reg.exec(rawContent)) !== null) {
                commentsArray.push({ name: match[1], handle: match[2], text: match[3] });
            }
            
            // 极限兜底：如果上面都没匹配到，尝试匹配更松散的格式
            if (commentsArray.length === 0) {
                let looseReg = /"name"\s*:\s*"([^"]+)".*?"text"\s*:\s*"([^"]+)"/gi;
                let looseMatch;
                while ((looseMatch = looseReg.exec(rawContent)) !== null) {
                    commentsArray.push({ name: looseMatch[1], handle: "@user_" + Math.floor(Math.random()*1000), text: looseMatch[2] });
                }
            }
        }
        
        if (commentsArray.length === 0) throw new Error("模型未返回任何有效评论数据");

        commentsArray.forEach(cm => {
            // 🚀 核心防呆：就算 AI 脑抽替我评论了，直接在前端拦截丢弃！绝不上屏！
            if (cm.name === myName || (cm.handle && cm.handle.toLowerCase() === myHandle.toLowerCase())) {
                return; // 强行跳过这条假评论
            }

            // 扩大匹配范围，不仅匹配名字，也匹配推特网名
            let matchedContact = contacts.find(c => c.name === cm.name || c.twName === cm.name);
            let aiAvatar = matchedContact ? getTwAvatarSrc(matchedContact) : `https://api.dicebear.com/7.x/notionists/svg?seed=${cm.name}`;
            let aiHandle = cm.handle || ('@' + (cm.name.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'user_' + Math.floor(Math.random()*1000)));
            
            // 🚀 核心修复：如果匹配到了熟人，绝对强制使用 TA 真实的推特 Handle，无视 AI 乱编的账号！
            if (matchedContact) {
                aiHandle = matchedContact.twHandle;
                if (!aiHandle.startsWith('@')) aiHandle = '@' + aiHandle;
            }
            
            currentDetailComments.push({
    cid: 'cm_' + Math.random().toString(36).substr(2, 9) + Date.now(), // 生成永久唯一ID
    name: cm.name,
    handle: aiHandle,
    avatar: aiAvatar,
    text: cm.text,
    replyTo: targetHandle
});
            
            // 🚀 核心新增：如果 AI 回复的是“我”，生成通知
            if (targetHandle.toLowerCase() === myHandle.toLowerCase() && matchedContact) {
                addTwNotification('reply', matchedContact.id, cm.text.substring(0, 30) + (cm.text.length > 30 ? '...' : ''), currentDetailPostId);
                
                // 🚀 核心修复：同步在主线聊天室显示可见的系统旁白
                let timeString = new Date().toLocaleString();
                let wid = gConfig.currentWorldviewId || 'default';
                let momentPrompt = `[📱 推特互动同步 - ${timeString}]：你在推特上回复了 ${myName} 的评论/帖子：“${cm.text}”。`;
                matchedContact.history.push({role: 'system_sum', content: `<i>✧ 对方在推特上回复了你</i>\n<span style="display:none;">${momentPrompt}</span>`, wid: wid});
                saveData();
            }
            
            if (window.currentActivePostLikeBtn) {
            const commentIcon = window.currentActivePostLikeBtn.parentElement.querySelector('.fa-comment');
            if (commentIcon && commentIcon.nextElementSibling) {
                let cc = parseInt(commentIcon.nextElementSibling.innerText) || 0;
                commentIcon.nextElementSibling.innerText = cc + 1;
            }
        }
    });
    
    if (post) {
        post.comments = currentDetailComments;
        saveTwData();
    }
    
    renderDetailComments();

} catch (e) {
        console.error(e);
        alert("召唤评论失败，请检查网络、API 配置或大模型 JSON 输出能力。");
    } finally {
        icon.classList.remove('fa-spin');
    }
}
         
         const worldviewModal = document.getElementById('worldview-modal');
function openWorldviewModal() { 
    renderWorldviewList(); // 每次打开时强制刷新渲染列表
    const orig = document.getElementById('global-star-indicator');
    const clone = document.getElementById('clone-star');
    if (orig && clone) {
        const rect = orig.getBoundingClientRect();
        clone.style.left = rect.left + 'px';
        clone.style.top = rect.top + 'px';
        clone.style.width = rect.width + 'px';
        clone.style.height = rect.height + 'px';
        
        const origNum = document.getElementById('global-star-num');
        const cloneNum = document.getElementById('clone-star-num');
        if (origNum && cloneNum) cloneNum.innerText = origNum.innerText;

        clone.classList.remove('opacity-0', 'pointer-events-none');
        orig.style.opacity = '0';
    }
    worldviewModal.classList.remove('hidden'); 
}
         function closeWorldviewModal() { 
             worldviewModal.classList.add('hidden'); 
             const orig = document.getElementById('global-star-indicator');
             const clone = document.getElementById('clone-star');
             if (clone) clone.classList.add('opacity-0', 'pointer-events-none');
             if (orig) orig.style.opacity = '1';
         }
         
         const editWorldviewModal = document.getElementById('edit-worldview-modal');
let currentEditWorldviewId = null;

function openEditWorldview(event, wid) {
    event.stopPropagation();
    currentEditWorldviewId = wid;
    
    if (!gConfig.worldviews) gConfig.worldviews = [{ id: 'default', name: 'SOAP.OS 主宇宙', prompt: '这是一个极简、克制、注重排版与秩序感的现代社交平台。' }];
    const wv = gConfig.worldviews.find(w => w.id === wid);
    if (!wv) return;
    
    document.getElementById('edit-worldview-name').value = wv.name;
    const promptArea = document.querySelector('#edit-worldview-modal textarea');
    if (promptArea) {
        promptArea.value = wv.prompt || '';
    }
    
    editWorldviewModal.classList.remove('hidden');
}

function closeEditWorldviewModal() {
    editWorldviewModal.classList.add('hidden');
    currentEditWorldviewId = null;
}

function saveEditWorldview() {
    if (currentEditWorldviewId) {
        const newName = document.getElementById('edit-worldview-name').value.trim();
        const promptArea = document.querySelector('#edit-worldview-modal textarea');
        const newPrompt = promptArea ? promptArea.value.trim() : '';
        
        const wv = gConfig.worldviews.find(w => w.id === currentEditWorldviewId);
        if (wv) {
            if (newName) wv.name = newName;
            wv.prompt = newPrompt;
            saveGlobal();
            renderWorldviewList(); // 刷新列表显示最新名字
        }
    }
    closeEditWorldviewModal();
}
         
const editProfileModal = document.getElementById('edit-profile-modal');
let tw_currentEditProfileId = 'me';

function openEditProfileModal(cid = 'me') {
    tw_currentEditProfileId = cid;
    if (cid === 'me') {
        document.getElementById('tw-edit-profile-title').innerText = "编辑我的主页资料";
        document.getElementById('edit-profile-name').value = twData.meName || '我';
        document.getElementById('edit-profile-handle').value = (twData.meHandle || '@soap_user').replace('@', '');
        document.getElementById('edit-profile-bio').value = twData.meBio || '记录自己的生活碎片。';
        
        document.getElementById('tw-profile-history-section').classList.add('hidden');
        document.getElementById('tw-btn-ai-profile').classList.add('hidden');
    } else {
        const c = contacts.find(x => x.id === cid);
        if (!c) return;
        document.getElementById('tw-edit-profile-title').innerText = "身份马甲档案库";
        document.getElementById('edit-profile-name').value = c.twName || '';
        document.getElementById('edit-profile-handle').value = (c.twHandle || '').replace('@', '');
        document.getElementById('edit-profile-bio').value = c.twBio || '';
        
        document.getElementById('tw-profile-history-section').classList.remove('hidden');
        document.getElementById('tw-btn-ai-profile').classList.remove('hidden');
        twRenderProfileHistory(c);
    }
    editProfileModal.classList.remove('hidden');
}

function closeEditProfileModal() {
    editProfileModal.classList.add('hidden');
}

function twRenderProfileHistory(c) {
    const list = document.getElementById('tw-profile-history-list');
    list.innerHTML = '';
    if (!c.twProfileHistory || c.twProfileHistory.length === 0) {
        list.innerHTML = '<div class="text-center text-[12px] text-mono-500 py-2">暂无历史马甲，请在下方保存或让 AI 灵感生成。</div>';
        return;
    }
    c.twProfileHistory.forEach((p, idx) => {
        const item = document.createElement('div');
        item.className = 'bg-mono-100 dark:bg-mono-800 p-3 rounded-xl border border-mono-200 dark:border-mono-700 flex justify-between items-center cursor-pointer hover:bg-mono-200 dark:hover:bg-mono-700 transition';
        
        let safeName = (p.name || '').replace(/'/g, "&#39;").replace(/"/g, "&quot;");
        let safeHandle = (p.handle || '').replace(/'/g, "&#39;").replace(/"/g, "&quot;");
        let safeBio = (p.bio || '').replace(/'/g, "&#39;").replace(/"/g, "&quot;");

        item.innerHTML = `
            <div class="flex flex-col gap-1 flex-1 overflow-hidden" onclick="twApplyProfileHistory('${safeName}', '${safeHandle}', '${safeBio}')">
                <div class="font-bold text-[14px] text-mono-600 dark:text-mono-950 truncate">${p.name} <span class="text-[12px] text-mono-500 font-normal">@${p.handle}</span></div>
                <div class="text-[12px] text-mono-500 italic truncate">${p.bio}</div>
            </div>
            <div class="text-red-500 p-2 cursor-pointer shrink-0 hover:bg-red-500/10 rounded-full transition" onclick="twDeleteProfileHistory('${c.id}', ${idx}, event)" title="删除此马甲">
                <i class="fa-solid fa-trash text-[14px]"></i>
            </div>
        `;
        list.appendChild(item);
    });
}

function twApplyProfileHistory(name, handle, bio) {
    document.getElementById('edit-profile-name').value = name;
    document.getElementById('edit-profile-handle').value = handle.replace('@', '');
    document.getElementById('edit-profile-bio').value = bio;
}

function twDeleteProfileHistory(cid, idx, e) {
    e.stopPropagation();
    const c = contacts.find(x => x.id === cid);
    if(c && c.twProfileHistory) {
        c.twProfileHistory.splice(idx, 1);
        saveData();
        twRenderProfileHistory(c);
    }
}

function saveEditProfile() {
const newName = document.getElementById('edit-profile-name').value.trim();
const newHandleRaw = document.getElementById('edit-profile-handle').value.trim();
const newBio = document.getElementById('edit-profile-bio').value.trim();
const newHandle = newHandleRaw ? (newHandleRaw.startsWith('@') ? newHandleRaw : '@' + newHandleRaw) : '';

// 核心修复：在更新前，先抓取当前的旧 Handle 和 旧名字，用于后续全局替换
let oldHandle = '';
let oldName = '';
if (tw_currentEditProfileId === 'me') {
    oldName = twData.meName || '我';
    oldHandle = twData.meHandle || '@soap_user';
} else {
    const c = contacts.find(x => x.id === tw_currentEditProfileId);
    if (c) {
        oldName = c.twName || c.name;
        oldHandle = c.twHandle || ('@' + (c.name.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'user_' + c.id.replace(/[^a-z0-9]/gi, '').substring(0, 5)));
    }
}
if (oldHandle && !oldHandle.startsWith('@')) oldHandle = '@' + oldHandle;

if (tw_currentEditProfileId === 'me') {
    if(newName) {
        twData.meName = newName;
        document.getElementById('profile-header-name').innerText = newName;
        document.getElementById('profile-body-name').innerText = newName;
        const sidebarName = document.getElementById('sidebar-name');
        if(sidebarName) sidebarName.innerText = newName;
        const navProfileName = document.getElementById('nav-profile-name');
        if(navProfileName) navProfileName.innerText = newName;
    }
    if(newHandle) {
        twData.meHandle = newHandle;
        document.getElementById('profile-body-handle').innerText = newHandle;
        const sidebarHandle = document.getElementById('sidebar-handle');
        if(sidebarHandle) sidebarHandle.innerText = newHandle;
        const navProfileHandle = document.getElementById('nav-profile-handle');
        if(navProfileHandle) navProfileHandle.innerText = newHandle;
    }
    if(newBio !== undefined) {
        twData.meBio = newBio;
        document.getElementById('profile-body-bio').innerText = newBio;
    }
    saveTwData();
} else {
    const c = contacts.find(x => x.id === tw_currentEditProfileId);
    if(c) {
        c.twName = newName;
        c.twHandle = newHandle;
        c.twBio = newBio;
        
        if (!c.twProfileHistory) c.twProfileHistory = [];
        if (newName || newBio || newHandle) {
            const exists = c.twProfileHistory.find(p => p.name === newName && p.bio === newBio && p.handle === newHandle.replace('@', ''));
            if (!exists) {
                c.twProfileHistory.unshift({ name: newName, handle: newHandle.replace('@', ''), bio: newBio });
            }
        }
        saveData();
        
        // 实时更新他人主页 UI
        const profileView = document.getElementById('other-profile-view');
        if (profileView && !profileView.classList.contains('hidden')) {
            profileView.querySelector('h2.leading-tight').innerText = newName || c.name;
            profileView.querySelector('.mt-3 h2.font-bold').innerText = newName || c.name;
            let fallbackHandle = 'user_' + c.id.replace(/[^a-z0-9]/gi, '').substring(0, 5);
            profileView.querySelector('.mt-3 p.text-mono-500').innerText = newHandle || ('@' + fallbackHandle);
            profileView.querySelector('.mt-3 p.leading-normal').innerText = newBio || '点击设置资料';
        }
    }
}

// 暴力遍历数据库进行硬更新，确保历史评论和帖子数据也被彻底刷新
let wid = gConfig.currentWorldviewId || 'default';
if (twData.worlds && twData.worlds[wid] && twData.worlds[wid].posts) {
    twData.worlds[wid].posts.forEach(p => {
        if (tw_currentEditProfileId === 'me' && p.contactId === 'me') {
            // 🚀 核心修复：如果这条帖子是戴面具发的，不要用真实资料覆盖面具资料！
            if (!p.maskId) {
                if(newName) p.name = newName;
                if(newHandleRaw) p.handle = newHandle;
                p.avatar = twData.meAvatar || p.avatar;
            }
        } else if (p.contactId === tw_currentEditProfileId) {
            const c = contacts.find(x => x.id === tw_currentEditProfileId);
            if(newName) p.name = newName;
            if(newHandleRaw) p.handle = newHandle;
            if (c) p.avatar = getTwAvatarSrc(c);
        }
        
        // 🚀 核心新增：如果修改了 Handle 或名字，全局暴力替换正文中被艾特的旧 Handle 以及“视角来自”的旧名字！
if (oldHandle && newHandle && oldHandle !== newHandle) {
    let reg = new RegExp(oldHandle, 'gi');
    p.content = p.content.replace(reg, newHandle);
}
if (oldName && newName && oldName !== newName) {
    let regName = new RegExp(`\\[ 视角来自 ${oldName} 的相片 \\]`, 'gi');
    p.content = p.content.replace(regName, `[ 视角来自 ${newName} 的相片 ]`);
}
        
        if (p.comments) {
    p.comments.forEach(cm => {
        // 更新发评论者的信息
        if (tw_currentEditProfileId === 'me' && cm.id === 'me') {
            // 🚀 核心修复：如果这条评论是戴面具发的，绝对不能用真实资料覆盖！
            if (!cm.maskId) {
                if(newName) cm.name = newName;
                if(newHandleRaw) cm.handle = newHandle;
                cm.avatar = twData.meAvatar || cm.avatar;
            }
        } else if (cm.id === tw_currentEditProfileId || cm.name === newName) {
                    const c = contacts.find(x => x.id === tw_currentEditProfileId);
                    if(newName) cm.name = newName;
                    if(newHandleRaw) cm.handle = newHandle;
                    if (c) cm.avatar = getTwAvatarSrc(c);
                }
                
                // 核心修复：同步更新别人回复我的引用 Handle！
                // 🚀 但如果这条评论是面具发的，它的 replyTo 可能指向面具 handle，不能被真实 handle 覆盖
                if (oldHandle && cm.replyTo === oldHandle && newHandle && !cm.maskId) {
                    cm.replyTo = newHandle;
                }

                // 🚀 核心新增：同步替换评论正文里的 @旧Handle
                if (oldHandle && newHandle && oldHandle !== newHandle) {
                    let reg = new RegExp(oldHandle, 'gi');
                    cm.text = cm.text.replace(reg, newHandle);
                }
            });
        }
    });
    saveTwData();
}

// 触发全局渲染引擎，瞬间把所有旧帖子和旧评论里的名字全部换成新的！
renderTwFeed();
if (document.getElementById('details-view') && !document.getElementById('details-view').classList.contains('hidden')) {
    renderDetailComments();
}
if (document.getElementById('other-profile-view') && !document.getElementById('other-profile-view').classList.contains('hidden')) {
    // 重新渲染他人主页的动态列表
const profilePosts = document.getElementById('other-profile-posts');
if (profilePosts) {
    profilePosts.innerHTML = '';
    let currentPosts = getCurrentWorldPosts();
    const followedPosts = currentPosts.filter(p => p.contactId === tw_currentEditProfileId);
    if (followedPosts.length === 0) {
            profilePosts.innerHTML = '<div class="text-center text-mono-500 py-10">该用户暂无动态</div>';
        } else {
            followedPosts.slice().reverse().forEach(post => {
                profilePosts.insertAdjacentHTML('beforeend', generateTwPostHtml(post));
            });
        }
    }
}

closeEditProfileModal();
}

async function twGenerateProfileByAI() {
    if(!tw_currentEditProfileId || tw_currentEditProfileId === 'me') return;
    const c = contacts.find(x => x.id === tw_currentEditProfileId);
    if(!c) return;
    
    if(!gConfig.apiUrl || !gConfig.apiKey) {
        return alert('需配置API！请在桌面进入【Settings】填写您的接口和密钥。');
    }

    const btn = document.getElementById('tw-btn-ai-profile');
    const oldText = btn.innerText;
    btn.innerText = "✧ 正在感知角色灵魂...";
    btn.style.pointerEvents = "none";
    btn.style.opacity = "0.7";

    let sysPrompt = `你是一个拥有独立灵魂的真实人物。
【你的人设背景】：
${c.history[0].content}

【任务】：请根据你的性格，为自己起一个推特网名、Handle(纯英文数字下划线)、以及一句简短的个人简介。
直接输出JSON，不要加任何其他文字：
{"name": "网名", "handle": "username", "bio": "个人简介"}`;

    try {
        const response = await fetch(`${gConfig.apiUrl}/v1/chat/completions`, { 
            method: 'POST', 
            headers: { 'Authorization': `Bearer ${gConfig.apiKey}`, 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ 
                model: gConfig.model, 
                messages: [{ role: 'system', content: sysPrompt }, { role: 'user', content: '请直接输出JSON对象，不要说任何废话。' }], 
                temperature: 0.9 
            }) 
        });

        if (!response.ok) throw new Error("API 请求失败");
        const data = await response.json(); 
        let rawContent = data.choices[0].message.content.trim();
        
        let finalName = '';
        let finalHandle = '';
        let finalBio = '';
        
        // 第一层尝试：标准 JSON 解析
        try {
            rawContent = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();
            rawContent = rawContent.replace(/[\n\r\t]/g, ' ');
            let startIdx = rawContent.indexOf('{'); 
            let endIdx = rawContent.lastIndexOf('}');
            if(startIdx !== -1 && endIdx !== -1) {
                let jsonStr = rawContent.substring(startIdx, endIdx + 1);
                const aiData = JSON.parse(jsonStr);
                finalName = aiData.name || aiData['网名'] || aiData['名字'] || aiData['Name'] || aiData['昵称'] || '';
                finalHandle = aiData.handle || aiData['用户名'] || aiData['Handle'] || aiData['username'] || '';
                finalBio = aiData.bio || aiData['个人简介'] || aiData['简介'] || aiData['Bio'] || aiData['sign'] || aiData['签名'] || '';
            } else {
                throw new Error("no json braces");
            }
        } catch(jsonErr) {
            // 第二层兜底：暴力正则扒取
            console.warn("JSON解析失败，启用正则兜底引擎:", jsonErr.message);
            let nameMatch = rawContent.match(/(?:name|网名|名字|昵称)\s*[：:=]\s*["']?([^"'\n,}{]+)/i);
            let handleMatch = rawContent.match(/(?:handle|用户名|username)\s*[：:=]\s*["']?@?([a-zA-Z0-9_]+)/i);
            let bioMatch = rawContent.match(/(?:bio|签名|个人简介|简介|sign)\s*[：:=]\s*["']?([^"'\n,}{]+)/i);
            
            if (!nameMatch && !handleMatch && !bioMatch) {
                // 第三层终极兜底：按行切分
                let lines = rawContent.replace(/<[^>]+>/g, '').replace(/[{}"']/g, '').split(/[\n,]/).map(s => s.trim()).filter(s => s && s.length > 1 && s.length < 60);
                if (lines.length >= 3) {
                    finalName = lines[0].replace(/^(name|网名|名字|昵称)\s*[：:=]\s*/i, '');
                    finalHandle = lines[1].replace(/^(handle|用户名|username)\s*[：:=]\s*@?/i, '');
                    finalBio = lines[2].replace(/^(bio|签名|个人简介|简介)\s*[：:=]\s*/i, '');
                } else if (lines.length >= 1) {
                    finalName = lines[0].replace(/^(name|网名|名字|昵称)\s*[：:=]\s*/i, '');
                    if (lines[1]) finalBio = lines[1].replace(/^(bio|签名|个人简介|简介)\s*[：:=]\s*/i, '');
                }
            } else {
                if(nameMatch) finalName = nameMatch[1].trim();
                if(handleMatch) finalHandle = handleMatch[1].trim();
                if(bioMatch) finalBio = bioMatch[1].trim();
            }
        }
        
        // 清理残余引号和空白
        finalName = finalName.replace(/["']/g, '').trim();
        finalHandle = finalHandle.replace(/["'@]/g, '').replace(/[^a-zA-Z0-9_]/g, '').trim();
        finalBio = finalBio.replace(/["']/g, '').trim();
        
        // 如果没抓到 handle 但有 name，自动从 name 里派生一个
        if (!finalHandle && finalName) {
            finalHandle = finalName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 15) || 'user_' + Date.now().toString(36).substring(5);
        }
        
        if(finalName) document.getElementById('edit-profile-name').value = finalName;
        if(finalHandle) document.getElementById('edit-profile-handle').value = finalHandle;
        if(finalBio) document.getElementById('edit-profile-bio').value = finalBio;
        
        if(!finalName && !finalHandle && !finalBio) {
            alert("AI 生成的内容无法解析。请再试一次，或手动输入。");
        }

    } catch(e) {
        console.error("AI 提取签名失败:", e);
        alert("AI 生成失败：" + e.message + "\n请检查网络或再试一次。");
    } finally {
        btn.innerText = oldText;
        btn.style.pointerEvents = "auto";
        btn.style.opacity = "1";
    }
}
         
         function renderWorldviewList() {
    const list = document.getElementById('worldview-list');
    if (!list) return;
    list.innerHTML = '';
    if (!gConfig.worldviews || gConfig.worldviews.length === 0) {
        gConfig.worldviews = [{ id: 'default', name: 'SOAP.OS 主宇宙', prompt: '这是一个极简、克制、注重排版与秩序感的现代社交平台。' }];
    }
    if (!gConfig.currentWorldviewId) gConfig.currentWorldviewId = 'default';
    
    gConfig.worldviews.forEach((wv, idx) => {
        const isSelected = wv.id === gConfig.currentWorldviewId;
        const item = document.createElement('div');
        item.className = `worldview-item flex justify-between items-center p-3 rounded-xl border-2 transition cursor-pointer ${isSelected ? 'border-mono-600 dark:border-mono-950 bg-mono-50 dark:bg-mono-900 opacity-100' : 'border-transparent hover:border-mono-200 dark:hover:border-mono-700 bg-mono-100 dark:bg-mono-800 opacity-60'}`;
        item.setAttribute('data-wid', wv.id);
        item.onclick = function() { selectWorldview(wv.id); };
        
        item.innerHTML = `
            <div class="flex items-center space-x-3 pointer-events-none">
                <span class="item-index font-bold text-[14px] text-mono-500 w-4 text-center">${idx + 1}</span>
                <i class="fa-solid ${wv.id === 'default' ? 'fa-cube' : 'fa-layer-group'} text-[16px]"></i>
                <span class="text-[14px] font-bold worldview-name">${wv.name}</span>
            </div>
            <div class="flex space-x-1">
                <div class="p-1.5 hover:bg-mono-200 dark:hover:bg-mono-700 rounded-full transition pointer-events-auto" onclick="openEditWorldview(event, '${wv.id}')">
                    <i class="fa-solid fa-pen text-mono-400 hover:text-mono-600 dark:hover:text-mono-300 text-[14px] transition"></i>
                </div>
                ${wv.id !== 'default' ? `
                <div class="p-1.5 hover:bg-mono-200 dark:hover:bg-mono-700 rounded-full transition pointer-events-auto" onclick="deleteWorldview(event, '${wv.id}')">
                    <i class="fa-solid fa-trash text-mono-400 hover:text-red-500 text-[14px] transition"></i>
                </div>` : ''}
            </div>
        `;
        list.appendChild(item);
        
        if (isSelected) {
            const starNum = document.getElementById('global-star-num');
            const cloneStarNum = document.getElementById('clone-star-num');
            if(starNum) starNum.innerText = idx + 1;
            if(cloneStarNum) cloneStarNum.innerText = idx + 1;
        }
    });
}

function selectWorldview(wid) {
    if (gConfig.currentWorldviewId !== wid) {
        gConfig.currentWorldviewId = wid;
        saveGlobal();
        renderWorldviewList();
        renderTwFeed(); // 瞬间刷新推特广场为新世界观的帖子
        
        const starInd = document.getElementById('global-star-indicator');
        if(starInd) {
            starInd.classList.add('scale-110');
            setTimeout(() => starInd.classList.remove('scale-110'), 200);
        }
    }
}

function deleteWorldview(event, wid) {
    event.stopPropagation();
    if (wid === 'default') {
        alert('主宇宙无法删除哦！');
        return;
    }
    if (!confirm('确定要毁灭这个平行宇宙吗？里面的所有帖子将永久消失！')) return;
    
    gConfig.worldviews = gConfig.worldviews.filter(w => w.id !== wid);
    if (twData.worlds && twData.worlds[wid]) {
        delete twData.worlds[wid];
    }
    
    if (gConfig.currentWorldviewId === wid) {
        gConfig.currentWorldviewId = 'default';
    }
    
    saveGlobal();
    saveTwData();
    renderWorldviewList();
    renderTwFeed();
}

function addWorldview() {
    const input = document.getElementById('new-worldview-input');
    const name = input.value.trim();
    if (!name) return;

    const newId = 'wv_' + Date.now();
    if (!gConfig.worldviews) gConfig.worldviews = [{ id: 'default', name: 'SOAP.OS 主宇宙', prompt: '这是一个极简、克制、注重排版与秩序感的现代社交平台。' }];
    gConfig.worldviews.push({ id: newId, name: name, prompt: `这是一个名为【${name}】的平行宇宙。请完全遵循这个世界的设定。` });
    
    if (!twData.worlds) twData.worlds = { 'default': { posts: [] } };
    twData.worlds[newId] = { posts: [] };
    
    input.value = '';
    saveGlobal();
    saveTwData();
    renderWorldviewList();
    
    const list = document.getElementById('worldview-list');
    list.scrollTop = list.scrollHeight;
    selectWorldview(newId);
}
         
         // 发帖弹窗里的头像选中/取消逻辑
         function toggleComposeContact(el) {
         const ring = el.querySelector('.compose-contact-ring');
         const text = el.querySelector('span');
         
         if (ring.classList.contains('bg-gradient-to-tr')) {
             ring.className = 'w-7 h-7 rounded-full p-[1.5px] bg-mono-200 dark:bg-mono-700 transition-all duration-300 compose-contact-ring opacity-40 grayscale transform scale-95';
             text.className = 'text-[13px] text-mono-500 font-normal transition-colors';
         } else {
             ring.className = 'w-7 h-7 rounded-full p-[1.5px] bg-gradient-to-tr from-mono-400 to-mono-800 dark:from-mono-500 dark:to-mono-100 transition-all duration-300 compose-contact-ring shadow-sm transform scale-105';
             text.className = 'text-[13px] font-bold text-mono-600 dark:text-mono-950 transition-colors';
         }
         }
         
         // ================= 发帖物理引擎 =================
         function submitTweet(source) {
         const inputId = source === 'modal' ? 'compose-modal-input' : 'compose-home-input';
         const inputEl = document.getElementById(inputId);
         let text = inputEl.value.trim();
         if (!text) return;
         
         // 获取标签
         let tagText = '';
         if (source === 'modal') {
             const tagInput = document.getElementById('compose-tag-input');
             if (tagInput && tagInput.value.trim()) {
                 tagText = `<span class="text-blue-500 dark:text-blue-400 hover:underline cursor-pointer">#${tagInput.value.trim()}</span>`;
             }
         }
         
         // 获取选中的关联人
let mentions = [];
let mentionedContactIds = []; // 核心新增：记录被艾特的人的 ID
if (source === 'modal') {
    document.querySelectorAll('.compose-contact-ring.bg-gradient-to-tr').forEach(ring => {
        let nextEl = ring.nextElementSibling;
        let handle = nextEl.getAttribute('data-handle');
        let cid = nextEl.getAttribute('data-id'); // 🚀 核心修复：直接读取真实 ID
        
        mentions.push(`<span class="text-blue-500 dark:text-blue-400 hover:underline cursor-pointer">${handle}</span>`);
        if (cid) mentionedContactIds.push(cid); // 100% 精准匹配，绝不丢失
    });
}
         
         let extraContent = [];
         if (mentions.length > 0) extraContent.push(mentions.join(' '));
         if (tagText) extraContent.push(tagText);
         
         let finalPostContent = text;
         if (extraContent.length > 0) {
             finalPostContent += '<br><br>' + extraContent.join(' ');
         }
         
         // 获取当前面具身份信息
const twPerson = getTwActivePerson();
const userName = twPerson.name;
const userHandle = twPerson.handle;
const userAvatarSrc = twPerson.avatar;

// 组装新帖子数据存入数据库
const newPost = {
    id: 'tw_post_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    contactId: 'me',
    name: userName,
    handle: userHandle,
    avatar: userAvatarSrc,
    content: finalPostContent,
    hasMedia: false,
    realImgUrl: tw_composeImageUrl,
    sceneDesc: null,
    timestamp: Date.now(),
    likes: 0,
    isLiked: false,
    comments: [],
    maskId: twActiveMaskId || null // 🚀 核心新增：记录发帖时的面具ID
};

// 1. 核心修复：将新帖子存入当前世界观的数据库中
let currentWid = gConfig.currentWorldviewId || 'default';
if (!twData.worlds) twData.worlds = { 'default': { posts: [] } };
if (!twData.worlds[currentWid]) twData.worlds[currentWid] = { posts: [] };
twData.worlds[currentWid].posts.push(newPost);
saveTwData();

// 2. 核心修复：定义 availableAIs 和 timeString，解决报错卡死问题
let linkedIds = momentsData.twLinkedNPCs || [];
let availableAIs = contacts.filter(c => linkedIds.includes(c.id) || linkedIds.length === 0);
let timeString = new Date().toLocaleString();

availableAIs.forEach(c => {
    let isMentioned = mentionedContactIds.includes(c.id);
    
    // 🚀 核心重构：面具隔离引擎 V2
    let canRecognize = true; // 能否认出用户身份
    let canSeePost = true;   // 能否看到这条帖子的系统通知
    
    if (twActiveMaskId && twActiveMaskId !== 'anonymous') {
        if (c.maskId !== twActiveMaskId) {
            canRecognize = false;
            // 被 @提及 的 AI 仍然能看到帖子，但不知道发帖人是谁
            if (!isMentioned) {
                canSeePost = false;
            }
        }
    }
    
    if (!canSeePost) return; // 既没戴对应面具、也没被 @，完全跳过
    
    // 🚀 核心修复：获取该 AI 的推特 Handle，告诉它自己是谁
    let cHandle = c.twHandle || ('@' + (c.name.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'user_' + c.id.replace(/[^a-z0-9]/gi, '').substring(0, 5)));
    if (!cHandle.startsWith('@')) cHandle = '@' + cHandle;

    let momentPrompt = "";
    let uiText = "";
    
    let maskIdentityHint = "";
    if (twActiveMaskId && twActiveMaskId !== null) {
        let p = getTwActivePerson();
        if (twActiveMaskId === 'anonymous') {
            maskIdentityHint = `\n注意：这条动态是由一个匿名账号发布的，网名为"${p.name}"，Handle为"${p.handle}"。你并不知道这是谁发的。`;
        } else if (canRecognize) {
            let maskObj = masks.find(x => x.id === twActiveMaskId);
            let maskPersona = maskObj && maskObj.persona ? `\n该面具的人设背景：${maskObj.persona}` : '';
            maskIdentityHint = `\n注意：你认出了这个人！用户使用了面具身份"${p.name}"(${p.handle})发帖，而你恰好知道这个面具背后的人是谁。${maskPersona}`;
        } else {
            let p2 = getTwActivePerson();
            maskIdentityHint = `\n注意：有一个你不认识的账号"${p2.name}"(${p2.handle})发了这条动态并@了你。你并不知道这个人是谁。`;
        }
    }
    
    // 🚀 核心修复：把包含 @ 和 # 的完整推文发给 AI，而不是只发纯文本
    let plainPostContent = finalPostContent.replace(/<[^>]+>/g, ' ').trim();
    
    if (isMentioned) {
        momentPrompt = `[📱 推特特别提醒 - ${timeString}]：${canRecognize ? '用户' : '一个陌生账号'}刚刚在推特(Twitter)上发布了一条新动态："${plainPostContent}"。\n【🚨 核心提示】：对方在这条动态中特意 @提及（艾特）了你（你的推特账号是 ${cHandle}）！请务必在接下来的聊天中，根据你的人设自然地对这件事做出反应（比如问TA为什么艾特你、或者调侃动态的内容）。${maskIdentityHint}`;
        uiText = `<i>✧ 你在推特发布了新动态并 @ 了对方</i>`;
    } else {
        momentPrompt = `[📱 推特特别提醒 - ${timeString}]：${canRecognize ? '用户' : '一个陌生账号'}刚刚在推特(Twitter)上发布了一条新动态："${plainPostContent}"。请在后续的聊天中自然地保留这段记忆。${maskIdentityHint}`;
        uiText = `<i>✧ 你在推特发布了一条新动态</i>`;
    }
    
    c.history.push({role: 'system_sum', content: `${uiText}\n<span style="display:none;">${momentPrompt}</span>`, wid: currentWid, twPostId: newPost.id});
});
saveData();

renderTwFeed();
         
         // 清空并重置状态
inputEl.value = '';
twRemovePostImage(); // 发帖后清除图片
if (source === 'modal') {
    const tagInput = document.getElementById('compose-tag-input');
    if (tagInput) tagInput.value = '';
    document.querySelectorAll('.compose-contact-ring').forEach(ring => {
        ring.className = 'w-7 h-7 rounded-full p-[1.5px] bg-mono-200 dark:bg-mono-700 transition-all duration-300 compose-contact-ring opacity-40 grayscale transform scale-95';
        ring.nextElementSibling.className = 'text-[13px] text-mono-500 font-normal transition-colors';
    });
    closeComposeModal();
}
         
         // 跳转到主页并滑到顶部
         switchHomeTab('foryou');
         const mainScroll = document.getElementById('main-scroll');
         if (mainScroll) mainScroll.scrollTo({ top: 0, behavior: 'smooth' });
         }
         
         // ================= 点赞物理引擎 =================
function toggleTweetLike(btn, event, postId) {
event.stopPropagation();
const icon = btn.querySelector('i');
const span = btn.querySelector('.like-count-span');

const isLiked = btn.classList.contains('text-pink-500');
let rawText = span.innerText;

// 更新数据库
let currentPosts = getCurrentWorldPosts();
let post = currentPosts ? currentPosts.find(p => p.id === postId) : null;

if (isLiked) {
    btn.classList.remove('text-pink-500');
    icon.classList.remove('fa-solid');
    icon.classList.add('fa-regular');
    
    // 只有纯数字才进行减法，带单位的(如 3.2k)保持不动
    if (/^[\d,]+$/.test(rawText)) {
        let currentNum = parseInt(rawText.replace(/,/g, ''));
        let newNum = currentNum > 0 ? currentNum - 1 : 0;
        span.innerText = newNum;
        if (post) { post.likes = newNum; post.isLiked = false; }
    }
} else {
    btn.classList.add('text-pink-500');
    icon.classList.remove('fa-regular');
    icon.classList.add('fa-solid');
    
    // 播放一个微小的弹跳动画
    icon.style.transform = 'scale(1.3)';
    setTimeout(() => icon.style.transform = 'scale(1)', 150);
    
    // 只有纯数字才进行加法
    if (/^[\d,]+$/.test(rawText)) {
        let currentNum = parseInt(rawText.replace(/,/g, ''));
        let newNum = currentNum + 1;
        span.innerText = newNum;
        if (post) { post.likes = newNum; post.isLiked = true; }
    }
}

if (post) saveTwData();
}
         
         // ================= 详情页专属点赞引擎 (双向绑定同步) =================
         function toggleDetailLike(btn) {
         const icon = btn.querySelector('i');
         const countSpan = document.getElementById('detail-post-like-count');
         const isLiked = btn.classList.contains('text-pink-500');
         let rawText = countSpan.innerText;
         
         if (isLiked) {
             btn.classList.remove('text-pink-500');
             icon.classList.remove('fa-solid');
             icon.classList.add('fa-regular');
             if (/^[\d,]+$/.test(rawText)) {
                 let currentNum = parseInt(rawText.replace(/,/g, ''));
                 countSpan.innerText = currentNum > 0 ? currentNum - 1 : 0;
             }
         } else {
             btn.classList.add('text-pink-500');
             icon.classList.remove('fa-regular');
             icon.classList.add('fa-solid');
             icon.style.transform = 'scale(1.3)';
             setTimeout(() => icon.style.transform = 'scale(1)', 150);
             if (/^[\d,]+$/.test(rawText)) {
                 let currentNum = parseInt(rawText.replace(/,/g, ''));
                 countSpan.innerText = currentNum + 1;
             }
         }
         
         // 反向触发主页对应帖子的点赞按钮，实现无缝同步！
         if (window.currentActivePostLikeBtn) {
             toggleTweetLike(window.currentActivePostLikeBtn, new Event('click'));
         }
         }
         
         let currentDetailPostId = null;

let currentDetailComments = []; // 新增：用于存储当前详情页的评论数据

// ================= 动态详情页引擎 =================
function openPostDetails(postEl) {
if (!postEl) return;

currentDetailPostId = postEl.dataset.postId;
let currentPosts = getCurrentWorldPosts();
const post = currentPosts.find(p => p.id === currentDetailPostId);
if (post) {
    if (!post.comments) post.comments = [];
    currentDetailComments = post.comments;
    // 核心修复：确保每条旧评论都有一个永久唯一的 cid
    currentDetailComments.forEach(c => {
        if (!c.cid) c.cid = 'cm_' + Math.random().toString(36).substr(2, 9) + Date.now();
    });
} else {
    currentDetailComments = [];
}

// 1. 抓取被点击帖子的数据
const avatarSrc = postEl.querySelector('img').src;
const name = postEl.querySelector('.post-author-name').innerText;
const handle = postEl.querySelector('.post-author-handle').innerText;
const content = postEl.querySelector('.post-text-content').innerHTML;
const mediaContent = postEl.querySelector('.post-media-content');

// 提取主帖的点赞数据与状态
const sourceLikeBtn = postEl.querySelector('.hover\\:text-pink-500');
const sourceLikeCount = sourceLikeBtn.querySelector('.like-count-span').innerText;
const isLiked = sourceLikeBtn.classList.contains('text-pink-500');

// 保存全局引用，供详情页点赞时反向同步
window.currentActivePostLikeBtn = sourceLikeBtn;

// 2. 填充到 details-view 主帖中
document.getElementById('detail-post-avatar').src = avatarSrc;
document.getElementById('detail-post-name').innerText = name;
document.getElementById('detail-post-handle').innerText = handle;
document.getElementById('detail-post-content').innerHTML = content;

// 🚀 核心修复：动态更新主帖的点击事件，防止写死跳到 elonmusk
const authorZone = document.getElementById('detail-post-author-zone');
if (authorZone) {
    authorZone.setAttribute('onclick', `openOtherProfile('${post.contactId}')`);
}

// 🚀 核心修复：动态更新评论按钮的艾特目标，防止回复时艾特错人
const commentBtn = document.querySelector('#details-view .fa-comment');
if (commentBtn && commentBtn.parentElement) {
    commentBtn.parentElement.setAttribute('onclick', `prepareReply('${handle}', this, event)`);
}

// 同步点赞状态到详情页
document.getElementById('detail-post-like-count').innerText = sourceLikeCount;
const detailLikeBtn = document.getElementById('detail-post-like-btn');
const detailLikeIcon = detailLikeBtn.querySelector('i');
if (isLiked) {
    detailLikeBtn.classList.add('text-pink-500');
    detailLikeIcon.classList.remove('fa-regular');
    detailLikeIcon.classList.add('fa-solid');
} else {
    detailLikeBtn.classList.remove('text-pink-500');
    detailLikeIcon.classList.remove('fa-solid');
    detailLikeIcon.classList.add('fa-regular');
}

const detailMediaBox = document.getElementById('detail-post-media');    
if (mediaContent && !mediaContent.classList.contains('hidden') && mediaContent.innerHTML.trim() !== '') {
    detailMediaBox.innerHTML = mediaContent.innerHTML;
    detailMediaBox.classList.remove('hidden');
} else {
    detailMediaBox.innerHTML = '';
    detailMediaBox.classList.add('hidden');
}

// 3. 清空旧的评论区，营造进入新帖子的真实感
const commentsContainer = document.getElementById('details-comments-container');
if (commentsContainer) {
    commentsContainer.innerHTML = ''; 
}

// 4. 重置回复目标为楼主
currentReplyTargetHandle = handle;
const deskInput = document.getElementById('desktop-reply-input');
const mobInput = document.getElementById('mobile-reply-input');
if (deskInput) deskInput.placeholder = '发布你的回复';
if (mobInput) mobInput.placeholder = '发布你的回复';

// 5. 渲染该帖子现有的评论
renderDetailComments();

// 6. 跳转视图
switchView('details-view');
}
         
         function toggleContact(el, cid) {
         if (!momentsData.twLinkedNPCs) momentsData.twLinkedNPCs = [];
         const ring = el.querySelector('.contact-ring');
         const text = el.querySelector('span');
         
         if (ring.classList.contains('bg-gradient-to-tr')) {
             momentsData.twLinkedNPCs = momentsData.twLinkedNPCs.filter(id => id !== cid);
             ring.className = 'w-12 h-12 rounded-full p-[2px] bg-mono-200 dark:bg-mono-700 transition-all duration-300 mb-1.5 contact-ring opacity-40 grayscale transform scale-95';
             text.className = 'text-[12px] truncate w-full text-center text-mono-500 font-normal transition-colors';
         } else {
             if (!momentsData.twLinkedNPCs.includes(cid)) momentsData.twLinkedNPCs.push(cid);
             ring.className = 'w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-mono-400 to-mono-800 dark:from-mono-500 dark:to-mono-100 transition-all duration-300 mb-1.5 contact-ring shadow-md transform scale-105';
             text.className = 'text-[12px] truncate w-full text-center font-bold text-mono-600 dark:text-mono-950 transition-colors';
         }
         saveMomentsData();
         }
         
         function toggleSpace(el) {
const bg = el.querySelector('.space-bg');
const dot = el.querySelector('.space-dot');
const iconBg = el.querySelector('.fa-solid').parentElement;
const titleInput = el.querySelector('input');
const subTitle = el.querySelector('.topic-status-text');

let isEnabled = false;
if (bg.classList.contains('bg-mono-600') || bg.classList.contains('dark:bg-mono-950')) {
    bg.className = 'w-10 h-5 shrink-0 bg-mono-300 dark:bg-mono-700 rounded-full relative transition-colors space-bg';
    dot.className = 'absolute left-1 top-1 w-3 h-3 bg-white dark:bg-mono-400 rounded-full transition-transform space-dot';
    iconBg.className = 'w-10 h-10 shrink-0 rounded-full bg-mono-100 dark:bg-mono-800 flex items-center justify-center text-[16px] text-mono-400';
    if(titleInput) { titleInput.classList.add('text-mono-500'); titleInput.classList.remove('text-mono-600', 'dark:text-mono-950'); }
    if(subTitle) subTitle.innerText = '已拦截';
    isEnabled = false;
} else {
    bg.className = 'w-10 h-5 shrink-0 bg-mono-600 dark:bg-mono-950 rounded-full relative transition-colors space-bg';
    dot.className = 'absolute right-1 top-1 w-3 h-3 bg-white dark:bg-black rounded-full transition-transform space-dot';
    iconBg.className = 'w-10 h-10 shrink-0 rounded-full bg-mono-100 dark:bg-mono-800 flex items-center justify-center text-[16px]';
    if(titleInput) { titleInput.classList.remove('text-mono-500'); titleInput.classList.add('text-mono-600', 'dark:text-mono-950'); }
    if(subTitle) subTitle.innerText = '观测中';
    isEnabled = true;
}

if(typeof gConfig !== 'undefined') {
    gConfig.twTrendingEnabled = isEnabled;
    saveData();
}
}
         const giftModal = document.getElementById('gift-modal');
         function openGiftModal() { giftModal.classList.remove('hidden'); }
         function closeGiftModal() { giftModal.classList.add('hidden'); }
         
         function sendGift(giftName, giftIcon) {
         closeGiftModal();
         if (!currentTwContactId) return alert("请先选择一个聊天对象！");
         const c = contacts.find(x => x.id === currentTwContactId);
         if (!c) return;
         
         // 🚀 核心新增：面具隔离检查
         if (twActiveMaskId && twActiveMaskId !== 'anonymous') {
             if (c.maskId !== twActiveMaskId) {
                 let p = getTwActivePerson();
                 alert(`当前你戴着面具「${p.name}」，${c.name} 不认识这个身份，无法赠送礼物。`);
                 return;
             }
         }
         
         const giftMsgHTML = `
             <div class="bg-mono-100 dark:bg-mono-800 p-3 pr-4 rounded-2xl rounded-br-sm text-[15px] flex items-center space-x-3 w-max max-w-full">
                 <span class="text-[26px] filter grayscale">${giftIcon}</span>
                 <div><p class="font-bold text-[13px]">赠送礼物</p><p class="text-mono-500 mt-0.5 text-[14px]">${giftName}</p></div>
             </div>
         `;
         
         // 存入推特独立历史
if (!c.twHistory) c.twHistory = [];
const twId = 'tw_' + Date.now() + Math.random();
let wid = gConfig.currentWorldviewId || 'default';
c.twHistory.push({ role: 'user', content: giftMsgHTML, isRevoked: false, timestamp: Date.now(), _twId: twId, wid: wid });

if (typeof window.twSessionUnsynced === 'undefined') window.twSessionUnsynced = [];
window.twSessionUnsynced.push(twId);
saveData();
         
         appendTwMessage('user', giftMsgHTML, c);
         
         // 触发真实 AI 回复
         fetchTwAIReply();
         }
         
         function toggleFollow(event, specificUser = null) {
if(event) event.stopPropagation(); 

const targetUser = specificUser || currentProfileUser;
const isFollowingUser = followedUsers.has(targetUser);

if (isFollowingUser) {
    followedUsers.delete(targetUser);
} else {
    followedUsers.add(targetUser);
}

// 核心修复：持久化保存关注列表
LocalDB.setItem('soap_followed_users_v1', JSON.stringify(Array.from(followedUsers))).catch(e => console.warn(e));

// 1. 同步更新个人主页的关注按钮
         if (currentProfileUser === targetUser) {
             const profileBtn = document.getElementById('profile-follow-btn');
             if (profileBtn) {
                 if (followedUsers.has(targetUser)) {
                     profileBtn.innerText = '正在关注'; 
                     profileBtn.className = 'bg-transparent border border-mono-300 dark:border-mono-600 font-bold py-1.5 px-5 rounded-full transition text-[15px]';
                 } else {
                     profileBtn.innerText = '关注'; 
                     profileBtn.className = 'bg-mono-600 dark:bg-mono-950 text-white dark:text-black font-bold py-1.5 px-6 rounded-full transition text-[15px] hover:opacity-90';
                 }
             }
         }
         
         // 2. 同步更新私信聊天室顶部的半屏关注卡片
if (currentTwContactId === targetUser) {
    const chatBtn = document.getElementById('chat-follow-btn');
    const chatHeader = document.getElementById('chat-profile-header');
    if (followedUsers.has(targetUser)) {
        if(chatBtn) chatBtn.style.display = 'none';
        if(chatHeader) {
            chatHeader.style.opacity = '0';
            chatHeader.style.maxHeight = chatHeader.offsetHeight + 'px'; 
            setTimeout(() => {
                chatHeader.style.paddingTop = '0';
                chatHeader.style.paddingBottom = '0';
                chatHeader.style.marginBottom = '0';
                chatHeader.style.maxHeight = '0';
                chatHeader.style.border = 'none';
                setTimeout(() => chatHeader.classList.add('hidden'), 300);
            }, 200);
        }
    } else {
                 if(chatBtn) chatBtn.style.display = 'block';
                 if(chatHeader) {
                     chatHeader.classList.remove('hidden');
                     chatHeader.style.maxHeight = '300px'; 
                     chatHeader.style.paddingTop = '1.5rem'; 
                     chatHeader.style.paddingBottom = '1.5rem';
                     chatHeader.style.marginBottom = '1.5rem'; 
                     chatHeader.style.borderBottom = ''; 
                     setTimeout(() => chatHeader.style.opacity = '1', 100);
                 }
             }
         }

         // 3. 插入关注/取消关注的提示消息到私信记录中
const c = contacts.find(x => x.id === targetUser);
if (c) {
    if (!c.twHistory) c.twHistory = [];
    const twId = 'tw_' + Date.now() + Math.random();
    let wid = gConfig.currentWorldviewId || 'default';
    const actionText = followedUsers.has(targetUser) ? `你已关注了 ${c.name}` : `你已取消关注了 ${c.name}`;
    const sysMsg = { role: 'system', content: `<div class="text-center text-mono-500 text-[12px] bg-mono-100 dark:bg-mono-800 px-4 py-1.5 rounded-full inline-block">${actionText}</div>`, isRevoked: false, timestamp: Date.now(), _twId: twId, wid: wid };
    c.twHistory.push(sysMsg);
    saveData();
    if (currentTwContactId === targetUser && document.getElementById('view-chat').classList.contains('hidden') === false) {
        appendTwMessage('system', sysMsg.content, c);
    }
}
         renderFollowingFeed();
         }
         
         function renderFollowingFeed() {
    const followingEmpty = document.getElementById('following-empty');
    const followingPosts = document.getElementById('following-posts');
    
    if (followedUsers.size === 0) {
        if(followingEmpty) followingEmpty.classList.remove('hidden');
        if(followingPosts) followingPosts.classList.add('hidden');
    } else {
        if(followingEmpty) followingEmpty.classList.add('hidden');
        if(followingPosts) {
            followingPosts.classList.remove('hidden');
            followingPosts.innerHTML = '';
            
            // 筛选出已关注用户的帖子
let currentPosts = getCurrentWorldPosts();
const followedPosts = currentPosts.filter(p => followedUsers.has(p.contactId));

if (followedPosts.length === 0) {
                followingPosts.innerHTML = '<div class="text-center text-mono-500 py-10">你关注的人还没有发过动态哦。</div>';
            } else {
                // 倒序渲染，最新的在上面
                followedPosts.slice().reverse().forEach(post => {
                    followingPosts.insertAdjacentHTML('beforeend', generateTwPostHtml(post));
                });
            }
        }
    }
}
         
             async function refreshAIProfile(btn) {
         const icon = btn.querySelector('i');
         if (icon.classList.contains('fa-spin')) return;
         
         if (!currentProfileUser) return;
         const c = contacts.find(x => x.id === currentProfileUser);
         if (!c) return;
     
         if (!gConfig.apiUrl || !gConfig.apiKey) return alert("请先在系统设置中配置 API！");
     
         icon.classList.add('fa-spin');
         
         // 提取主线聊天室近期记录
let mainHistoryText = "";
let currentWid = gConfig.currentWorldviewId || 'default';
let recentMain = c.history.filter(m => m.role !== 'system' && !m.isRevoked && (!m.wid || m.wid === currentWid)).slice(-8);
recentMain.forEach(m => {
             let cleanContent = m.content;
             if (m.role === 'system_sum') {
                 let match = m.content.match(/<span style="display:none;">(.*?)<\/span>/);
                 cleanContent = match ? match[1] : m.content.replace(/<[^>]+>/g, '').trim();
             } else {
                 cleanContent = m.content.replace(/<[^>]+>/g, '').trim();
             }
             if(cleanContent) {
                 let speaker = m.role === 'assistant' ? '【你】' : '【用户】';
                 if (m.role === 'system_sum') speaker = '【系统旁白】';
                 mainHistoryText += `${speaker}: ${cleanContent}\n`;
             }
         });
     
             let wid = gConfig.currentWorldviewId || 'default';
let currentWv = (gConfig.worldviews || []).find(w => w.id === wid);
let wvPrompt = currentWv ? currentWv.prompt : '这是一个极简、克制、注重排版与秩序感的现代社交平台。';

// 🚀 核心新增：提取你的真实账号信息，强行注入给 AI！
let myName = twData.meName || '我';
let myHandle = twData.meHandle || ('@' + (myName.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'soap_user'));
if (!myHandle.startsWith('@')) myHandle = '@' + myHandle;
let userInfo = `\n【你的特别关注对象（用户）】：\n- 真实名字：${myName}\n- 推特Handle：${myHandle}\n(🚨 核心警告：如果你发的这条动态是想对TA说的、或者与TA有关，请一定要在 mentions 数组里准确无误地填入 "${myHandle}"！绝对不要捏造假的账号！)`;

    const sysPrompt = `你是一个拥有独立灵魂的真实人物（真实名字：${c.name}，当前推特网名：${c.twName || c.name}）。
【🚨 最高级别强制世界观覆盖 🚨】：
你现在所处的世界设定如下：
>>> ${wvPrompt} <<<
请彻底忘掉现实世界和其他设定，完全沉浸在这个世界观中！你的语气、用词、吐槽内容，【必须】100% 符合这个世界的法则和背景！

${userInfo}

【你的人设基础性格】：
${c.history[0].content}

【近期与用户的聊天记录】：
${mainHistoryText || '暂无。'}
(⚠️ 警告：无论聊天记录里的内容多么现代或不符合当前世界观，你都必须将其【自动脑补/转化为符合当前世界观的事件】！绝不能破坏世界观的沉浸感！)

【任务与核心限制】：
     请完全符合你的人设，发布一条最新的推特动态。
     1. 🚨 身份隔离警告：你现在是在推特 (Twitter) 上发动态！默认情况下，没有人知道你的真实身份（除非你自己想暴露）。
     2. 🚨 内容导向：请务必结合上方你和用户的近期聊天记录，在推特上发泄你的烦恼、暗恋、吐槽或感慨。你可以隐晦地提到用户，或者发泄在聊天中没说出口的话。
     3. 语气要极简、口语化，符合推特风格。绝对不要加任何动作描写或标签。
     4. 必须返回严格的 JSON 格式，不要有 markdown 标记！
     
     【🚨 关于 @提及 (mentions) 的绝对铁律】：
     1. 如果你发的这条动态是想对用户说的、或者与用户有关，请一定要在 "mentions" 数组里准确无误地填入 "${myHandle}"！
     2. 必须包含 @ 符号！绝对不要捏造假的账号！
     3. 如果没有提及用户，请务必返回空数组 []。

     格式如下：
     {
     "text": "推文正文内容",
     "hasMedia": true, // 随机决定是否带配图(true或false)
     "sceneDesc": "如果hasMedia为true，请根据推文内容详细描写一张真实照片的画面；如果为false，填 null",
     "tags": ["标签1", "标签2"], // 数组格式，不需要带#号，没有填空数组 []
     "mentions": ["${myHandle}"] // 严格遵守上方铁律，必须带@号，没有则填 []
     }`;
     
         try {
             const res = await fetch(`${gConfig.apiUrl}/v1/chat/completions`, {
                 method: 'POST', 
                 headers: { 'Authorization': `Bearer ${gConfig.apiKey}`, 'Content-Type': 'application/json' }, 
                 body: JSON.stringify({ model: gConfig.model, messages: [{ role: 'system', content: sysPrompt }], temperature: 0.9 })
             });
             
             if (!res.ok) throw new Error("API 错误");
             const data = await res.json();
             let rawJson = data.choices[0].message.content.replace(/```json/gi, '').replace(/```/g, '').trim();
             
             let startIdx = rawJson.indexOf('{');
             let endIdx = rawJson.lastIndexOf('}');
             if(startIdx !== -1 && endIdx !== -1) rawJson = rawJson.substring(startIdx, endIdx + 1);
             
             const postObj = JSON.parse(rawJson);
             
             // 拼接正文、艾特和标签
             let finalContent = postObj.text || '...';
             let extras = [];
             if (postObj.mentions && Array.isArray(postObj.mentions) && postObj.mentions.length > 0) {
                 extras.push(postObj.mentions.map(m => `<span class="text-blue-500 dark:text-blue-400 hover:underline cursor-pointer">${m}</span>`).join(' '));
             }
             if (postObj.tags && Array.isArray(postObj.tags) && postObj.tags.length > 0) {
                 extras.push(postObj.tags.map(t => `<span class="text-blue-500 dark:text-blue-400 hover:underline cursor-pointer">#${t}</span>`).join(' '));
             }
             if (extras.length > 0) {
                 finalContent += '<br><br>' + extras.join(' ');
             }
             
             const postData = {
    id: 'tw_post_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    contactId: c.id,
    name: c.name,
    avatar: getTwAvatarSrc(c),
    content: finalContent,
    hasMedia: postObj.hasMedia === true,
    sceneDesc: postObj.sceneDesc || null,
    timestamp: Date.now(),
    likes: Math.floor(Math.random()*300)+10,
    isLiked: false,
    comments: []
};
    
    let wid = gConfig.currentWorldviewId || 'default';
    if (!twData.worlds) twData.worlds = { 'default': { posts: [] } };
    if (!twData.worlds[wid]) twData.worlds[wid] = { posts: [] };
    twData.worlds[wid].posts.push(postData);
saveTwData();

// 🚀 核心新增：如果 AI 艾特了“我”，生成一条通知！
let myName = twData.meName || '我';
let myHandle = twData.meHandle || ('@' + (myName.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'soap_user'));
if (!myHandle.startsWith('@')) myHandle = '@' + myHandle;

if (postObj.mentions && Array.isArray(postObj.mentions)) {
    let mentionedMe = postObj.mentions.some(m => m.toLowerCase() === myHandle.toLowerCase());
    if (mentionedMe) {
        addTwNotification('mention', c.id, postData.content.replace(/<[^>]+>/g, '').substring(0, 30) + '...', postData.id);
    }
}

// 核心桥接：让 AI 知道自己在个人主页发了帖子
let timeString = new Date().toLocaleString();
let momentPrompt = `[📱 跨平台记忆同步 - ${timeString}]：你刚刚在推特(Twitter)上发布了一条新动态：“${postData.content}”。请在后续的聊天中自然地保留这段记忆。`;
let currentWid = gConfig.currentWorldviewId || 'default';
c.history.push({role: 'system_sum', content: `<i>✧ 对方在推特发布了一条新动态</i>\n<span style="display:none;">${momentPrompt}</span>`, wid: currentWid, twPostId: postData.id});
saveData();

const aiPostHtml = generateTwPostHtml(postData);
    
    // 插入到当前个人主页的动态列表
const profilePosts = document.getElementById('other-profile-posts');
if (profilePosts) {
    profilePosts.innerHTML = '';
    const userPosts = getCurrentWorldPosts().filter(p => p.contactId === c.id);
    if (userPosts.length === 0) {
        profilePosts.innerHTML = '<div class="text-center text-mono-500 py-10">该用户暂无动态</div>';
    } else {
        userPosts.slice().reverse().forEach(post => {
            profilePosts.insertAdjacentHTML('beforeend', generateTwPostHtml(post));
        });
    }
    
    // 顺便更新一下帖子数量显示
    const postCountEl = document.querySelector('#other-profile-view p.text-mono-500.text-\\[13px\\]');
    if (postCountEl) {
        postCountEl.innerText = `${userPosts.length} 帖子`;
    }
}
    
    // 同时将其同步到全局为你推荐列表
    renderTwFeed();
    
} catch (e) {
                 alert("刷新状态失败，请检查网络或 API 配置。");
             } finally {
                 icon.classList.remove('fa-spin');
             }
         }
         
         function getProfileAvatarHtml(c, isUser) {
// 🚀 核心修复：推特主页的大头像，强行从推特专属数据库 twData 里拿，彻底与主系统断绝关系！
let av = isUser ? (twData.meAvatar || 'https://api.dicebear.com/7.x/notionists/svg?seed=Zero') : (c.chatAvatar || c.avatar);
let dataAttr = isUser ? `data-avatar="user"` : `data-avatar="${c.id}"`;
         
         if(av && (av.startsWith('data:image') || av.startsWith('http'))) {
             return `<img src="${av}" ${dataAttr} class="w-full h-full bg-mono-200 dark:bg-mono-800 cursor-pointer hover:opacity-80 transition object-cover rounded-full border-4 border-mono-50 dark:border-mono-900" onclick="triggerImageUpload(event, this)" title="点击更换头像">`;
         } else {
             let svg = isUser 
                 ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-1/2 h-1/2"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>` 
                 : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-1/2 h-1/2"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4M8 16h8"/></svg>`;
             return `<div ${dataAttr} class="w-full h-full bg-mono-200 dark:bg-mono-800 rounded-full flex items-center justify-center text-mono-500 cursor-pointer hover:opacity-80 transition border-4 border-mono-50 dark:border-mono-900" onclick="triggerImageUpload(event, this)" title="点击更换头像">${svg}</div>`;
         }
         }
         
         function switchView(viewId) {
// 拦截：如果当前在推特私信页，且准备离开，触发打包同步
const chatView = document.getElementById('chat-view');
if (chatView && !chatView.classList.contains('hidden') && viewId !== 'chat-view') {
    if (typeof flushTwSyncToMainChat === 'function') flushTwSyncToMainChat();
}

if (viewId === 'profile-view') {
             // 动态刷新“我”的推特主页数据
const profileView = document.getElementById('profile-view');
if (profileView) {
    const myName = twData.meName || '我';
    const myHandle = twData.meHandle || '@soap_user';
    
    const myCover = twData.userCovers && twData.userCovers['me'] ? twData.userCovers['me'] : 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1000&q=80';
    const myBio = twData.meBio || '记录自己的生活碎片。';

    profileView.querySelector('#profile-header-name').innerText = myName;
    profileView.querySelector('#profile-body-name').innerText = myName;
    profileView.querySelector('#profile-body-handle').innerText = myHandle;
    profileView.querySelector('#profile-body-bio').innerText = myBio;
    
    const avatarWrapper = profileView.querySelector('.w-20.h-20.sm\\:w-32.sm\\:h-32');
    if (avatarWrapper) avatarWrapper.innerHTML = getProfileAvatarHtml(null, true);
    
    const coverImg = profileView.querySelector('img[data-cover="user"]');
    if (coverImg) coverImg.src = myCover;
    
    // 渲染我的帖子列表
    const myPostsContainer = document.getElementById('my-profile-posts');
    if (myPostsContainer) {
        myPostsContainer.innerHTML = '';
        let currentPosts = getCurrentWorldPosts();
        const myPosts = currentPosts.filter(p => p.contactId === 'me');
        if (myPosts.length === 0) {
            myPostsContainer.innerHTML = '<div class="text-center text-mono-500 py-10">您还没有发过动态</div>';
        } else {
            myPosts.slice().reverse().forEach(post => {
                myPostsContainer.insertAdjacentHTML('beforeend', generateTwPostHtml(post));
            });
        }
        // 更新帖子数量
        const postCountEl = profileView.querySelector('.sticky p.text-mono-500');
        if (postCountEl) postCountEl.innerText = `${myPosts.length} 帖子`;
    }
}
         }
         
         const views = ['home-view', 'details-view', 'explore-view', 'notifications-view', 'messages-view', 'chat-view', 'profile-view', 'other-profile-view', 'bookmarks-view'];
         views.forEach(v => {
             const el = document.getElementById(v);
             if (el) {
                 if (v === viewId) el.classList.remove('hidden');
                 else el.classList.add('hidden');
             }
         });
             const mainNav = document.getElementById('main-nav');
             const mainScroll = document.getElementById('main-scroll');
             const globalStar = document.getElementById('global-star-indicator');
         
             if (viewId === 'home-view') {
                 if(globalStar) globalStar.classList.remove('hidden');
             } else {
                 if(globalStar) globalStar.classList.add('hidden');
             }
         
             if (viewId === 'chat-view') {
                 mainNav.classList.add('max-sm:hidden'); mainScroll.classList.remove('pb-[50px]'); mainScroll.classList.add('pb-0');
             } else {
                 mainNav.classList.remove('max-sm:hidden'); mainScroll.classList.remove('pb-0'); mainScroll.classList.add('pb-[50px]');
             }
             const fab = document.getElementById('mobile-fab');
             if (viewId === 'messages-view' || viewId === 'chat-view' || viewId === 'details-view') fab.classList.add('hidden'); else fab.classList.remove('hidden');
             const replyBar = document.getElementById('mobile-reply-bar');
    if (viewId === 'details-view') replyBar.classList.remove('hidden'); else replyBar.classList.add('hidden');
    if(viewId !== 'chat-view') document.getElementById('main-scroll').scrollTop = 0;
    else { const c = document.getElementById('chat-container'); if(c) c.scrollTop = c.scrollHeight; }
    
    if (viewId === 'messages-view') {
        renderTwitterContacts();
    }
    
    // 核心新增：进入通知页时，渲染通知列表并消除小红点
    if (viewId === 'notifications-view') {
        renderTwNotifications();
    }
    
    closeSidebar();
}
         
         const composeModal = document.getElementById('compose-modal');
         function openComposeModal() { 
             composeModal.classList.remove('hidden'); 
             // 🚀 核心新增：同步发帖弹窗里的面具头像显示
             updateComposeModalAvatar();
         }
         function closeComposeModal() { composeModal.classList.add('hidden'); }
         
         // 动态更新发帖弹窗中的头像（反映当前面具状态）
         function updateComposeModalAvatar() {
             let p = getTwActivePerson();
             // 查找弹窗里所有标记为 user 的头像并同步
             composeModal.querySelectorAll('img[data-avatar="user"]').forEach(img => {
                 img.src = p.avatar;
             });
         }
         
         const overlay = document.getElementById('sidebar-overlay');
         const sidebar = document.getElementById('user-sidebar');
         function openSidebar() {
             overlay.classList.remove('hidden'); setTimeout(() => overlay.classList.remove('opacity-0'), 10);
             sidebar.classList.remove('-translate-x-full');
         }
         function closeSidebar() {
             sidebar.classList.add('-translate-x-full'); overlay.classList.add('opacity-0');
             setTimeout(() => overlay.classList.add('hidden'), 300);
         }
         
         function toggleTheme() {
             // 核心修复：将推特的夜间模式范围限制在 #app-twitter 内，绝不污染系统主界面的 html 标签！
             const twApp = document.getElementById('app-twitter');
             const isDark = twApp.classList.contains('dark');
             const textEl = document.getElementById('theme-text');
             const iconTop = document.getElementById('theme-icon-top');
             const iconBtn = document.getElementById('theme-icon-btn');
             
             if (isDark) {
                 twApp.classList.remove('dark');
                 twApp.classList.add('light');
                 if(textEl) textEl.innerText = '切换夜间模式';
                 if(iconTop) iconTop.className = 'fa-regular fa-moon text-[14px]';
                 if(iconBtn) iconBtn.className = 'fa-regular fa-moon w-6';
             } else {
                 twApp.classList.remove('light');
                 twApp.classList.add('dark');
                 if(textEl) textEl.innerText = '切换日间模式';
                 if(iconTop) iconTop.className = 'fa-regular fa-sun text-[14px]';
                 if(iconBtn) iconBtn.className = 'fa-regular fa-sun w-6';
             }
         }
         
         // ================= 转发帖子与评论核心逻辑 =================
         let currentFwdPostData = null;
         let currentFwdCommentData = null;
         let radialMenuTimer = null;
         
         // 1. 转发帖子逻辑
         function openFwdPostModal(postEl) {
         if (!postEl) return;
         
         let authorName, authorHandle, content, imgUrl;
         
         // 判断是从详情页点进来的，还是从列表点进来的
         if (postEl === 'detail') {
             authorName = document.getElementById('detail-post-name').innerText;
             authorHandle = document.getElementById('detail-post-handle').innerText;
             content = document.getElementById('detail-post-content').innerHTML;
             const imgEl = document.querySelector('#detail-post-media .post-img');
             imgUrl = imgEl ? imgEl.src : '';
         } else {
             authorName = postEl.querySelector('.post-author-name').innerText;
             authorHandle = postEl.querySelector('.post-author-handle').innerText;
             content = postEl.querySelector('.post-text-content').innerHTML;
             const imgEl = postEl.querySelector('.post-img');
             imgUrl = imgEl ? imgEl.src : '';
         }
             currentFwdPostData = { authorName, authorHandle, content, imgUrl };
         
             const list = document.getElementById('fwd-post-contact-list');
             list.innerHTML = '';
             if (contacts.length === 0) {
                 list.innerHTML = '<div class="text-center text-mono-500 text-[13px] py-4">暂无联系人</div>';
             } else {
                 contacts.forEach(c => {
    const item = document.createElement('div');
    item.className = 'flex items-center justify-between p-3 hover:bg-mono-100 dark:hover:bg-mono-800 rounded-xl cursor-pointer transition mb-2';
    item.onclick = () => sendFwdPost(c.id);
    item.innerHTML = `
        <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-full overflow-hidden bg-mono-200 flex justify-center items-center c-avatar-wrap" style="margin:0; border:none; box-shadow:none; padding:0;">${renderAvatarHTML(c.chatAvatar || c.avatar, 'bot')}</div>
            <span class="font-bold text-[15px]">${c.name}</span>
        </div>
        <button class="bg-blue-500 text-white px-4 py-1.5 rounded-full text-[13px] font-bold">发送</button>
    `;
    list.appendChild(item);
});
             }
             document.getElementById('fwd-post-msg').value = '';
             document.getElementById('fwd-post-modal').classList.remove('hidden');
         }
         
         function closeFwdPostModal() {
             document.getElementById('fwd-post-modal').classList.add('hidden');
             currentFwdPostData = null;
         }
         
         function sendFwdPost(contactId) {
             const c = contacts.find(x => x.id === contactId);
             if (!c || !currentFwdPostData) return;
             
             const userMsg = document.getElementById('fwd-post-msg').value.trim();
             const cardHtml = generateFwdPostHtml(currentFwdPostData);
             
             let msgHtml = userMsg ? `<div style="margin-bottom: 12px; font-size: 14px; color: inherit; line-height: 1.6; padding: 0 4px;">${userMsg}</div>` : '';
             const finalContent = msgHtml + cardHtml;
             
             // 🚀 核心修复：转发时必须携带当前世界观 ID，否则会被聊天室过滤
             let currentWid = gConfig.currentWorldviewId || 'default';
             const newMsg = { 
                 role: 'user', 
                 content: finalContent.replace(/\n\s+/g, ''), 
                 isRevoked: false, 
                 timestamp: Date.now(),
                 wid: currentWid 
             };
             
             c.history.push(newMsg);
let postAuthor = currentFwdPostData.authorName;
let postContent = currentFwdPostData.content.replace(/<[^>]+>/g, '').substring(0, 30);
c.history.push({role: 'system_sum', content: `<span style="display:none;">[系统通报：用户向你转发了一篇推特(Twitter)帖子。这篇帖子是【${postAuthor}】发的，内容是：“${postContent}...”\n请结合你的人设、你与用户以及发帖人的关系，给出自然的反应。绝对不要搞混发帖人！【🚨 最高禁令】：绝对禁止使用 [Quote: ...] 格式引用这条卡片消息！直接回复即可！]</span>`});

saveData();
             if (currentContactId === contactId && document.getElementById('view-chat').classList.contains('slide-in')) {
                 appendBubbleRow(newMsg, c.history.length - 2);
                 scrollToBottom();
             }
             
             closeFwdPostModal();
             showToast("SYSTEM", `已将帖子转发给 ${c.name}`, c.chatAvatar || c.avatar, c.id, 3000);
         }
         
         // 2. 转发评论长按发散逻辑 (重构：提升灵敏度与精准度)
         let commentTouchTarget = null;
         let commentTouchMoved = false;
         let commentStartX = 0;
         let commentStartY = 0;
         
         // 使用事件代理绑定到 document，彻底解决动态元素和生命周期问题
         document.addEventListener('touchstart', handleCommentTouchStart, { passive: true });
         document.addEventListener('touchend', handleCommentTouchEnd);
         document.addEventListener('touchmove', handleCommentTouchMove, { passive: true });
         document.addEventListener('mousedown', handleCommentTouchStart);
         document.addEventListener('mouseup', handleCommentTouchEnd);
         document.addEventListener('mousemove', handleCommentTouchMove);
         document.addEventListener('contextmenu', (e) => {
         if (e.target.closest('#details-comments-container .border-b.border-mono-200')) e.preventDefault();
         });
         
         function handleCommentTouchStart(e) {
         // 精准定位：必须是在详情页的评论区里的评论项
         const target = e.target.closest('#details-comments-container .border-b.border-mono-200');
         if (!target) return;
         
         // 排除点击了头像、图标按钮等自带交互的区域
         if (e.target.closest('.group') || e.target.closest('img')) return;
         
         commentTouchTarget = target;
         commentTouchMoved = false;
         commentStartX = e.touches ? e.touches[0].clientX : e.clientX;
         commentStartY = e.touches ? e.touches[0].clientY : e.clientY;
         
         radialMenuTimer = setTimeout(() => {
             if (!commentTouchMoved && commentTouchTarget) {
                 // 触发震动反馈（如果设备支持）
                 if (navigator.vibrate) navigator.vibrate(50);
                 openRadialMenu(commentTouchTarget);
                 commentTouchTarget = null; // 触发后清空，防止重复触发
             }
         }, 350); // 降低到 350ms，大幅提升灵敏度，一按就出
         }
         
         function handleCommentTouchMove(e) {
         if (!commentTouchTarget) return;
         let curX = e.touches ? e.touches[0].clientX : e.clientX;
         let curY = e.touches ? e.touches[0].clientY : e.clientY;
         // 允许 10px 的手指微小颤动误差，防止误判为滑动
         if (Math.abs(curX - commentStartX) > 10 || Math.abs(curY - commentStartY) > 10) {
             commentTouchMoved = true;
             clearTimeout(radialMenuTimer);
         }
         }
         
         function handleCommentTouchEnd() {
         clearTimeout(radialMenuTimer);
         commentTouchTarget = null;
         }
         
         function openRadialMenu(commentEl) {
             // 提取评论数据
             let authorEl = commentEl.querySelector('.font-bold.hover\\:underline');
             let textEl = commentEl.querySelector('p.leading-normal');
             if (!authorEl || !textEl) return;
         
             let authorName = authorEl.innerText;
let text = textEl.innerText;
let postAuthorName = document.getElementById('detail-post-name') ? document.getElementById('detail-post-name').innerText : '未知用户';

currentFwdCommentData = { authorName, text, postAuthorName };

const overlay = document.getElementById('radial-fwd-menu');
             const centerItem = document.getElementById('radial-center-item');
             const nodesContainer = document.getElementById('radial-nodes-container');
         
             centerItem.innerText = text.length > 30 ? text.substring(0, 30) + '...' : text;
             nodesContainer.innerHTML = '';
         
             if (contacts.length === 0) {
                 alert("暂无联系人可转发");
                 return;
             }
         
             // 最多显示 6 个联系人以保证发散美观
             const displayContacts = contacts.slice(0, 6);
             const radius = 100; // 发散半径
             const angleStep = (Math.PI * 2) / displayContacts.length;
         
             displayContacts.forEach((c, idx) => {
                 const angle = idx * angleStep - Math.PI / 2; // 从正上方开始
                 const tx = Math.cos(angle) * radius;
                 const ty = Math.sin(angle) * radius;
         
                 const node = document.createElement('div');
                 node.className = 'radial-node';
                 node.innerHTML = `
                     ${renderAvatarHTML(c.chatAvatar || c.avatar, 'bot')}
                     <div class="radial-node-name">${c.name}</div>
                 `;
                 
                 node.onclick = (e) => {
                     e.stopPropagation();
                     sendFwdComment(c.id);
                 };
         
                 nodesContainer.appendChild(node);
         
                 // 动画展开
                 setTimeout(() => {
                     node.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(1)`;
                 }, 50);
             });
         
             overlay.classList.add('active');
         }
         
         function closeRadialMenu() {
             const overlay = document.getElementById('radial-fwd-menu');
             const nodes = overlay.querySelectorAll('.radial-node');
             nodes.forEach(node => {
                 node.style.transform = 'translate(-50%, -50%) scale(0)';
             });
             setTimeout(() => {
                 overlay.classList.remove('active');
                 currentFwdCommentData = null;
             }, 300);
         }
         
         function sendFwdComment(contactId) {
             const c = contacts.find(x => x.id === contactId);
             if (!c || !currentFwdCommentData) return;
         
             const cardHtml = generateFwdCommentHtml(currentFwdCommentData);
             
             // 🚀 核心修复：转发评论时携带当前世界观 ID
             let currentWid = gConfig.currentWorldviewId || 'default';
             const newMsg = { 
                 role: 'user', 
                 content: cardHtml.replace(/\n\s+/g, ''), 
                 isRevoked: false, 
                 timestamp: Date.now(),
                 wid: currentWid
             };

             c.history.push(newMsg);
let cAuthor = currentFwdCommentData.authorName;
let pAuthor = currentFwdCommentData.postAuthorName;
let cText = currentFwdCommentData.text.substring(0, 30);
c.history.push({role: 'system_sum', content: `<span style="display:none;">[系统通报：用户向你转发了一条推特(Twitter)评论。这条评论是【${cAuthor}】在【${pAuthor}】的帖子下回复的，内容是：“${cText}...”\n请结合你的人设、你与用户以及评论者的关系，给出自然的反应。绝对不要搞混发帖人和评论者！【🚨 最高禁令】：绝对禁止使用 [Quote: ...] 格式引用这条卡片消息！直接回复即可！]</span>`});

saveData();
             if (currentContactId === contactId && document.getElementById('view-chat').classList.contains('slide-in')) {
                 appendBubbleRow(newMsg, c.history.length - 2);
                 scrollToBottom();
             }
             
             closeRadialMenu();
             showToast("SYSTEM", `已将评论转发给 ${c.name}`, c.chatAvatar || c.avatar, c.id, 3000);
         }
         
         // ================= 推特私信聊天室引擎 =================
         let twPressTimer = null;
         let twTouchMoved = false;
         let twStartX = 0;
         let twStartY = 0;
         let currentTwContactId = null;
         
         function twOpenChat(contactId) {
         currentTwContactId = contactId;
         const c = contacts.find(x => x.id === contactId);
         if(!c) return;
         
         // 🚀 核心新增：面具隔离提示
         // 如果用户戴着非匿名面具，但对方没佩戴同款面具，弹出温馨提示但不阻止进入
         if (twActiveMaskId && twActiveMaskId !== 'anonymous') {
             if (c.maskId !== twActiveMaskId) {
                 let p = getTwActivePerson();
                 showToast("SYSTEM", `${c.name} 不认识面具「${p.name}」，发送的私信将不会被对方感知。`, c.chatAvatar || c.avatar, null, 4000);
             }
         }
         
         // 更新顶栏信息
         const chatView = document.getElementById('chat-view');
         chatView.querySelector('h2.text-\\[18px\\]').innerText = c.name;
         const avatarImg = chatView.querySelector('img[data-avatar]');
         if(avatarImg) {
             avatarImg.src = getTwAvatarSrc(c);
             avatarImg.dataset.avatar = c.id;
             // 修复：让顶栏的点击区域能够打开主页
             const topProfileLink = avatarImg.closest('.cursor-pointer');
             if (topProfileLink) {
                 topProfileLink.setAttribute('onclick', `openOtherProfile('${c.id}')`);
             }
         }
         
         // 更新聊天室内的个人资料头
const profileHeader = document.getElementById('chat-profile-header');
profileHeader.querySelector('h2').innerText = c.twName || c.name;
let displayHandle = c.twHandle;
if (!displayHandle.startsWith('@')) displayHandle = '@' + displayHandle;
profileHeader.querySelector('p.text-mono-500.text-\\[15px\\]').innerText = displayHandle;
         const profileHeaderAvatar = profileHeader.querySelector('img[data-avatar]');
         if(profileHeaderAvatar) {
             profileHeaderAvatar.src = getTwAvatarSrc(c);
             profileHeaderAvatar.dataset.avatar = c.id;
             profileHeaderAvatar.setAttribute('onclick', `openOtherProfile('${c.id}')`);
         }
         profileHeader.querySelector('h2').setAttribute('onclick', `openOtherProfile('${c.id}')`);
         
         const followBtn = document.getElementById('chat-follow-btn');
         if(followBtn) {
             followBtn.setAttribute('onclick', `toggleFollow(event, '${c.id}')`);
             if(followedUsers.has(c.id)) {
                 followBtn.style.display = 'none';
                 profileHeader.classList.add('hidden');
             } else {
                 followBtn.style.display = 'block';
                 profileHeader.classList.remove('hidden');
                 profileHeader.style.maxHeight = '300px'; 
                 profileHeader.style.opacity = '1';
             }
         }
         
         // 渲染聊天记录
         const container = document.getElementById('chat-container');
         // 保留 header，清空旧消息
         const headerHtml = profileHeader.outerHTML;
         container.innerHTML = headerHtml;
         
         // 读取独立的推特私信历史
if (!c.twHistory) c.twHistory = [];
let wid = gConfig.currentWorldviewId || 'default';
// 允许渲染推特自己专属的 system 消息，过滤掉主线的 system_sum 等，并且只取当前世界观的消息！没有wid的兼容视为default！
let historyValid = c.twHistory.filter(m => m.role !== 'system_sum' && (m.wid === wid || (!m.wid && wid === 'default')));
if(historyValid.length === 0) {
    container.innerHTML += `<div class="text-center text-mono-500 text-[13px] my-2 mt-6">今天</div>`;
} else {
    let changed = false;
    c.twHistory.forEach(m => {
        if (!m._twId) {
            m._twId = 'tw_' + Date.now() + Math.random();
            changed = true;
        }
    });
    if (changed) saveData();
    
    historyValid.forEach(m => {
        let renderRole = m.role === 'assistant' ? 'bot' : m.role;
        appendTwMessage(renderRole, m.content, c, m._twId);
    });
}

switchView('chat-view');
setTimeout(() => container.scrollTop = container.scrollHeight, 50);
}

function sendTwMessage() {
    const input = document.getElementById('tw-chat-input');
    const text = input.value.trim();
    if (!text || !currentTwContactId) return;
    input.value = '';
    
    const c = contacts.find(x => x.id === currentTwContactId);
    if(c) {
        // 🚀 核心新增：面具隔离检查
        // 如果用户戴了非匿名面具，但这个 AI 没有佩戴同款面具，则阻止发送私信
        if (twActiveMaskId && twActiveMaskId !== 'anonymous') {
            if (c.maskId !== twActiveMaskId) {
                let p = getTwActivePerson();
                alert(`当前你戴着面具「${p.name}」，但 ${c.name} 并不认识这个身份。\n\n只有在聊天室设置中佩戴了同一面具的角色才能与你的面具身份私信互动。`);
                return;
            }
        }
        
        if (!c.twHistory) c.twHistory = [];
        let wid = gConfig.currentWorldviewId || 'default';
        const twId = 'tw_' + Date.now() + Math.random();
        c.twHistory.push({ role: 'user', content: text, isRevoked: false, timestamp: Date.now(), wid: wid, _twId: twId, maskId: twActiveMaskId || null });
        
        if (typeof window.twSessionUnsynced === 'undefined') window.twSessionUnsynced = [];
        window.twSessionUnsynced.push(twId);
        saveData();
        
        appendTwMessage('user', text, c, twId);
    }
}

window.twSessionUnsynced = [];

function flushTwSyncToMainChat() {
    if (!currentTwContactId) return;
    const c = contacts.find(x => x.id === currentTwContactId);
    if (!c || !c.twHistory) return;

    // 🚀 核心新增：面具隔离检查
    // 如果用户戴着非匿名面具，但这个 AI 没佩戴同款面具，则不同步私信到主线
    if (twActiveMaskId && twActiveMaskId !== 'anonymous') {
        if (c.maskId !== twActiveMaskId) {
            window.twSessionUnsynced = [];
            return;
        }
    }

    let sessionIds = window.twSessionUnsynced || [];
    if (sessionIds.length === 0) return;

    let validIds = [];
    let chatLogPlain = "";
    let linesHtml = "";

    // 按顺序遍历 twHistory，只取本轮会话涉及的消息
    c.twHistory.forEach(m => {
        if (sessionIds.includes(m._twId) && m.role !== 'system') {
            let isUser = m.role === 'user';
            let aiSpeaker = isUser ? '【用户】' : '【你】';
            let text = m.content.replace(/<[^>]+>/g, '').trim();
            if (m.content.includes('赠送礼物')) text = "[赠送了礼物]";
            
            if(text) {
                let truncText = text.length > 50 ? text.substring(0, 48) + '...' : text;
                linesHtml += `<div class="tsc-line ${isUser ? 'tsc-user' : 'tsc-bot'}"><span class="tsc-dot"></span><span class="tsc-text">${truncText}</span></div>`;
                chatLogPlain += `${aiSpeaker}说：${text}\n`;
                validIds.push(m._twId);
            }
        }
    });

    if (validIds.length > 0) {
        let botName = c.chatRemark || c.name;
        let timeStr = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
        let promptText = `[📱 推特私信完整聊天记录同步（${timeStr}）：以下是你们刚刚在推特(Twitter)私信里的完整交流记录（请严格区分【用户】和【你】的发言，绝不能混淆！）：\n${chatLogPlain}请在后续的主线聊天中自然地保留这段记忆。]`;
        
        let cardHtml = `<div class="tw-sync-card" onclick="if(typeof twOpenChat==='function' && '${c.id}') { twOpenChat('${c.id}'); }">
<div class="tsc-header">
<div class="tsc-icon-wrap"><svg class="tsc-icon" viewBox="0 0 24 24"><path d="M22.46 6c-.77.35-1.6.58-2.46.69a4.3 4.3 0 0 0 1.88-2.38 8.6 8.6 0 0 1-2.72 1.04 4.28 4.28 0 0 0-7.32 3.91A12.16 12.16 0 0 1 3 4.8a4.28 4.28 0 0 0 1.32 5.72 4.24 4.24 0 0 1-1.94-.54v.05a4.28 4.28 0 0 0 3.43 4.2 4.27 4.27 0 0 1-1.93.07 4.29 4.29 0 0 0 4 2.97A8.59 8.59 0 0 1 2 19.54a12.13 12.13 0 0 0 6.56 1.92c7.88 0 12.2-6.53 12.2-12.2 0-.19 0-.37-.01-.56A8.72 8.72 0 0 0 23 6.29a8.49 8.49 0 0 1-.54.21z"/></svg></div>
<div class="tsc-header-info"><span class="tsc-title">与 ${botName} 的私信</span><span class="tsc-time">${timeStr} · ${validIds.length}条对话</span></div>
</div>
<div class="tsc-body">${linesHtml}</div>
<div class="tsc-footer"><span class="tsc-footer-dot"></span>点击查看完整对话</div>
</div><span style="display:none;">${promptText}</span>`;

        let currentWid = gConfig.currentWorldviewId || 'default';
        c.history.push({
            role: 'system_sum',
            content: cardHtml,
            isTwSyncNode: true,
            twIds: [...validIds],
            wid: currentWid
        });
        saveData();
        
        // 如果主聊天室刚好开着这个人，立刻渲染出卡片
        if (currentContactId === c.id && document.getElementById('view-chat').classList.contains('slide-in')) {
            appendBubbleRow(c.history[c.history.length - 1], c.history.length - 1);
            scrollToBottom();
        }
    }
    window.twSessionUnsynced = [];
}

function syncTwUpdateToMainChat(contactId) {
    const c = contacts.find(x => x.id === contactId);
    if (!c || !c.history || !c.twHistory) return;

    let changed = false;
    let botName = c.chatRemark || c.name;

    for (let i = c.history.length - 1; i >= 0; i--) {
        let node = c.history[i];
        if (node.isTwSyncNode && node.twIds) {
            let chatLogPlain = "";
            let linesHtml = "";
            let validCount = 0;
            let survivingIds = [];

            node.twIds.forEach(tid => {
                let m = c.twHistory.find(x => x._twId === tid);
                if (m && m.role !== 'system') {
                    let isUser = m.role === 'user';
                    let aiSpeaker = isUser ? '【用户】' : '【你】';
                    let text = m.content.replace(/<[^>]+>/g, '').trim();
                    if (m.content.includes('赠送礼物')) text = "[赠送了礼物]";
                    if(text) {
                        let truncText = text.length > 50 ? text.substring(0, 48) + '...' : text;
                        linesHtml += `<div class="tsc-line ${isUser ? 'tsc-user' : 'tsc-bot'}"><span class="tsc-dot"></span><span class="tsc-text">${truncText}</span></div>`;
                        chatLogPlain += `${aiSpeaker}说：${text}\n`;
                        validCount++;
                        survivingIds.push(tid);
                    }
                }
            });

            if (validCount === 0) {
                c.history.splice(i, 1);
                changed = true;
            } else {
                let promptText = `[📱 推特私信完整聊天记录同步：以下是你们在推特(Twitter)私信里的完整交流记录（请严格区分【用户】和【你】的发言，绝不能混淆！）：\n${chatLogPlain}请在后续的主线聊天中自然地保留这段记忆。]`;
                let newCardHtml = `<div class="tw-sync-card" onclick="if(typeof twOpenChat==='function') { twOpenChat('${c.id}'); }">
<div class="tsc-header">
<div class="tsc-icon-wrap"><svg class="tsc-icon" viewBox="0 0 24 24"><path d="M22.46 6c-.77.35-1.6.58-2.46.69a4.3 4.3 0 0 0 1.88-2.38 8.6 8.6 0 0 1-2.72 1.04 4.28 4.28 0 0 0-7.32 3.91A12.16 12.16 0 0 1 3 4.8a4.28 4.28 0 0 0 1.32 5.72 4.24 4.24 0 0 1-1.94-.54v.05a4.28 4.28 0 0 0 3.43 4.2 4.27 4.27 0 0 1-1.93.07 4.29 4.29 0 0 0 4 2.97A8.59 8.59 0 0 1 2 19.54a12.13 12.13 0 0 0 6.56 1.92c7.88 0 12.2-6.53 12.2-12.2 0-.19 0-.37-.01-.56A8.72 8.72 0 0 0 23 6.29a8.49 8.49 0 0 1-.54.21z"/></svg></div>
<div class="tsc-header-info"><span class="tsc-title">与 ${botName} 的私信</span><span class="tsc-time">${validCount}条对话</span></div>
</div>
<div class="tsc-body">${linesHtml}</div>
<div class="tsc-footer"><span class="tsc-footer-dot"></span>点击查看完整对话</div>
</div><span style="display:none;">${promptText}</span>`;

                node.twIds = survivingIds;
                node.content = newCardHtml;
                changed = true;
            }
        }
    }
    if (changed) saveData();
}
         
         async function fetchTwAIReply() {
    if (!gConfig.apiUrl || !gConfig.apiKey) {
        alert('请先在系统设置中配置 API！');
        return;
    }
    if (!currentTwContactId) return;
    const c = contacts.find(x => x.id === currentTwContactId);
    if (!c) return;
    
    // 弹出打字中气泡
    const typingId = appendTwMessage('bot', '<span class="animate-pulse">•••</span>', c);
    
    let mainHistoryText = "";
let currentWid = gConfig.currentWorldviewId || 'default';
let recentMain = c.history.filter(m => m.role !== 'system' && !m.isRevoked && (!m.wid || m.wid === currentWid)).slice(-10);
recentMain.forEach(m => {
        let cleanContent = m.content;
        if (m.role === 'system_sum') {
            let match = m.content.match(/<span style="display:none;">(.*?)<\/span>/);
            cleanContent = match ? match[1] : m.content.replace(/<[^>]+>/g, '').trim();
        } else {
            cleanContent = m.content.replace(/<[^>]+>/g, '').trim();
        }
        if(cleanContent) {
            let speaker = m.role === 'assistant' ? '【你】' : '【用户】';
            if (m.role === 'system_sum') speaker = '【系统旁白】';
            mainHistoryText += `${speaker}: ${cleanContent}\n`;
        }
    });

    let trendingInfo = "";
if (gConfig.twTrendingEnabled !== false) {
    let topic = gConfig.twTrendingTopic || "# Daily Vibes ★";
    trendingInfo = `\n【🔥 当前推特全站热议话题】：${topic}\n如果语境合适，你可以极其自然地随口提一句这个热议话题（比如吃瓜、吐槽），让聊天更具真实网感。`;
}

    let twMaskBlock = "";
    let twUserDisplayName = gConfig.meName || '我';
    if (twActiveMaskId && twActiveMaskId !== null) {
        let p = getTwActivePerson();
        twUserDisplayName = p.name;
        if (twActiveMaskId === 'anonymous') {
            twMaskBlock = `\n\n【⚠️ 身份伪装情报】：当前和你私信的人使用了匿名身份，网名为"${p.name}"，Handle为"${p.handle}"。你完全不知道这个匿名账号背后是谁。请像对待一个完全陌生的网友一样回应TA。`;
        } else {
            let maskObj = masks.find(x => x.id === twActiveMaskId);
            let maskPersona = maskObj && maskObj.persona ? `\n该面具的人设背景：${maskObj.persona}` : '';
            // 🚀 核心修复：只有当 AI 佩戴了同款面具时，才告诉 AI "你认出了这个人"
            if (c.maskId === twActiveMaskId) {
                twMaskBlock = `\n\n【⚠️ 身份识别成功】：当前和你私信的人使用了面具身份"${p.name}"(${p.handle})，但你认出了TA！TA的真实身份就是你认识的那个用户。${maskPersona}\n请自然地回应，可以隐晦地暗示你知道TA是谁，也可以配合TA的伪装。`;
            } else {
                twMaskBlock = `\n\n【⚠️ 身份未知】：当前和你私信的人网名为"${p.name}"(${p.handle})。你并不认识这个人。${maskPersona}\n请像对待一个不太熟的网友一样回应。`;
            }
        }
    }

    const sysPrompt = `你是一个拥有独立灵魂的真实人物（网名：${c.name}），正在推特 (Twitter) 的私信里和用户聊天。
【你的人设背景】：
${c.history[0].content}
${trendingInfo}

【核心记忆】：
${c.memory || '暂无。'}
${twMaskBlock}

【主线聊天软件近期记录参考】：
以下是你们近期在另一个主聊天软件里的交流记录（仅供回忆参考，请自然衔接，绝不要表现得像失忆）：
${mainHistoryText || '暂无。'}

【私信回复最高铁律】：
1. 🎭 绝对贴合人设：你的语气、用词、态度必须【100% 完美贴合】你的人设！高冷就字少且带刺，温柔就体贴入微，病娇就充满占有欲。绝不能像个死板的AI！
2. 💬 拒绝单调：不要只回干巴巴的一句话！你可以根据情绪自然分段，带点推特特有的网感、吐槽或情绪化表达。只要符合人设，想怎么聊就怎么聊！
3. ✂️ 连发机制：如果你想连续发送多条消息（制造聊天节奏感），请使用【换行符】将你的话分开！系统会自动将每一行切分成一个独立的气泡发送！
4. 🚫 格式限制：绝对不要使用任何动作描写或标签（如 <thought>、*动作* 等），只能输出纯文本对白！`;

    // 从推特独立历史提取上下文，按世界观隔离，绝不干扰主线和其他世界
let limit = parseInt(gConfig.contextSize) || 15;
let historyToSend = [];
if (!c.twHistory) c.twHistory = [];
let wid = gConfig.currentWorldviewId || 'default';
let currentWorldHistory = c.twHistory.filter(m => m.wid === wid || (!m.wid && wid === 'default'));
currentWorldHistory.slice(-limit).forEach(m => {
    if(m.role !== 'system' && m.role !== 'system_sum' && !m.isRevoked) {
        let cleanContent = m.content.replace(/<[^>]+>/g, '').trim();
        if(cleanContent) historyToSend.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: cleanContent });
    }
});
         
             try {
                 const res = await fetch(`${gConfig.apiUrl}/v1/chat/completions`, {
                     method: 'POST', 
                     headers: { 'Authorization': `Bearer ${gConfig.apiKey}`, 'Content-Type': 'application/json' }, 
                     body: JSON.stringify({ 
                         model: gConfig.model, 
                         messages: [{ role: 'system', content: sysPrompt }, ...historyToSend], 
                         temperature: 0.8 
                     })
                 });
                 
                 if (!res.ok) throw new Error("API 错误");
                 const data = await res.json();
                 let rawReply = data.choices[0].message.content.replace(/<[^>]+>/g, '').trim();
                 if(!rawReply) rawReply = "…";

                 // 按换行符切分句子
                 let sentences = rawReply.split('\n').map(s => s.trim()).filter(s => s);
                 
                 // 如果没有换行但字数很长，尝试用标点切分兜底
                 if (sentences.length === 1 && sentences[0].length > 30) {
                     sentences = sentences[0].match(/[^。？！…\n.?!]+[。？！…\n.?!]*/g) || [sentences[0]];
                     sentences = sentences.map(s => s.trim()).filter(s => s);
                 }
                 
                 let delay = 0;
                 const typingBubble = document.getElementById(typingId);
                 
                 sentences.forEach((sentence, i) => {
    setTimeout(() => {
        const twId = 'tw_' + Date.now() + Math.random();
        let wid = gConfig.currentWorldviewId || 'default';
        
        // 存入推特独立历史，带上世界观ID
        c.twHistory.push({ role: 'assistant', content: sentence, isRevoked: false, timestamp: Date.now(), _twId: twId, wid: wid });

        if (typeof window.twSessionUnsynced === 'undefined') window.twSessionUnsynced = [];
        window.twSessionUnsynced.push(twId);
        saveData();
                         
                         // 替换打字中气泡或新建气泡
                         if (i === 0 && typingBubble) {
                             typingBubble.id = twId;
                             typingBubble.querySelector('.tw-bubble').innerText = sentence;
                             updateTwChatGrouping();
                             const container = document.getElementById('chat-container');
                             if(container) container.scrollTop = container.scrollHeight;
                         } else {
                             let newId = appendTwMessage('bot', sentence, c);
                             let newRow = document.getElementById(newId);
                             if (newRow) newRow.id = twId; // 强行对齐 ID 方便后续删除和同步
                         }
                     }, delay);
                     
                     // 动态计算下一句的延迟时间 (基础 1秒 + 每多一个字 60 毫秒)
                     delay += 1000 + (sentence.length * 60);
                 });

             } catch (e) {
                 const typingBubble = document.getElementById(typingId);
                 if (typingBubble) typingBubble.querySelector('.tw-bubble').innerText = "[网络断开，发送失败]";
             }
         }
         
         function appendTwMessage(role, text, contactObj = null, overrideId = null) {
const container = document.getElementById('chat-container');
const row = document.createElement('div');
const msgId = overrideId || ('tw-msg-' + Date.now() + Math.random() * 1000);
row.id = msgId;

if (role === 'system') {
    row.className = `tw-msg-row system fade-in w-full flex justify-center my-2`;
    row.innerHTML = text;
    container.appendChild(row);
    container.scrollTop = container.scrollHeight;
    return msgId;
}

row.className = `tw-msg-row ${role} fade-in`;

let avatarHtml = '';
if (role === 'bot') {
         let src = 'https://api.dicebear.com/7.x/notionists/svg?seed=Bot';
         let clickId = currentTwContactId;
         if (contactObj) {
             src = getTwAvatarSrc(contactObj);
             clickId = contactObj.id;
         } else if (currentTwContactId) {
             const c = contacts.find(x => x.id === currentTwContactId);
             if (c) src = getTwAvatarSrc(c);
         }
         avatarHtml = `<img src="${src}" class="tw-msg-avatar cursor-pointer hover:opacity-80" onclick="openOtherProfile('${clickId}')">`;
         }
         
         row.innerHTML = `
             ${avatarHtml}
             <div class="tw-bubble" onmousedown="twTouchStart('${msgId}', event)" onmouseup="twTouchEnd()" ontouchstart="twTouchStart('${msgId}', event)" ontouchend="twTouchEnd()">${text}</div>
         `;
         
         container.appendChild(row);
         updateTwChatGrouping();
         container.scrollTop = container.scrollHeight;
         return msgId;
         }
         
         // 更新头像显示和圆角逻辑
         function updateTwChatGrouping() {
             const rows = document.querySelectorAll('.tw-msg-row');
             rows.forEach((row, i) => {
                 const nextRow = rows[i+1];
                 const isBot = row.classList.contains('bot');
                 const isUser = row.classList.contains('user');
                 
                 // 如果下一条消息和当前消息是同一个人发的
                 if (nextRow && ((isBot && nextRow.classList.contains('bot')) || (isUser && nextRow.classList.contains('user')))) {
                     row.classList.add('hide-avatar');
                 } else {
                     row.classList.remove('hide-avatar');
                 }
             });
         }
         
         // 气泡长按编辑/删除物理引擎 (带 UI 弹窗)
         function twTouchStart(id, e) {
         twTouchMoved = false;
         twStartX = e.touches ? e.touches[0].clientX : e.clientX;
         twStartY = e.touches ? e.touches[0].clientY : e.clientY;
         
         twPressTimer = setTimeout(() => {
             if (!twTouchMoved) {
                 if (navigator.vibrate) navigator.vibrate(50);
                 const row = document.getElementById(id);
                 if (!row) return;
                 const bubble = row.querySelector('.tw-bubble');
                 showTwMsgActionMenu(id, bubble);
             }
         }, 350); // 350ms 极速响应
         }
         
         function twTouchEnd() {
         clearTimeout(twPressTimer);
         }
         
         function showTwMsgActionMenu(id, bubble) {
         const overlay = document.createElement('div');
         overlay.className = 'absolute inset-0 bg-black/40 dark:bg-white/10 backdrop-blur-sm z-[300] flex justify-center items-center px-4 opacity-0 transition-opacity duration-300';
         overlay.onclick = () => {
             overlay.classList.remove('opacity-100');
             setTimeout(() => overlay.remove(), 300);
         };
         
         const menuBox = document.createElement('div');
         menuBox.className = 'bg-mono-50 dark:bg-mono-900 w-full max-w-[320px] rounded-2xl p-5 flex flex-col shadow-2xl transform scale-95 transition-transform duration-300 border border-mono-200 dark:border-mono-700';
         menuBox.onclick = (e) => e.stopPropagation();
         
         menuBox.innerHTML = `
             <div class="text-[18px] font-bold text-center mb-5 text-mono-600 dark:text-mono-950">消息管理</div>
             <div class="flex flex-col gap-3">
                 <button id="tw-btn-edit" class="w-full py-3.5 rounded-xl bg-mono-100 dark:bg-mono-800 text-mono-600 dark:text-mono-950 font-bold text-[15px] hover:bg-mono-200 dark:hover:bg-mono-700 transition">编辑消息</button>
                 <button id="tw-btn-delete" class="w-full py-3.5 rounded-xl bg-red-500/10 text-red-500 font-bold text-[15px] border border-red-500/30 hover:bg-red-500/20 transition">删除消息</button>
             </div>
         `;
         
         overlay.appendChild(menuBox);
         document.getElementById('app-twitter').appendChild(overlay);
         
         requestAnimationFrame(() => {
             overlay.classList.add('opacity-100');
             menuBox.classList.remove('scale-95');
             menuBox.classList.add('scale-100');
         });
         
         menuBox.querySelector('#tw-btn-delete').onclick = () => {
    const row = document.getElementById(id);
    if (row) {
        const c = contacts.find(x => x.id === currentTwContactId);
        if (c && c.twHistory) {
            // 核心修复：通过 DOM 绑定的 id 查找对应的真实 _twId 数据索引，避免世界观隔离导致的 DOM 索引和数组索引不一致！
            const targetIndex = c.twHistory.findIndex(m => m._twId === id);
            if (targetIndex !== -1) {
                c.twHistory.splice(targetIndex, 1);
                saveData();
                if (typeof syncTwUpdateToMainChat === 'function') syncTwUpdateToMainChat(c.id);
            }
        }
        row.remove();
    }
    updateTwChatGrouping();
    overlay.click();
};

menuBox.querySelector('#tw-btn-edit').onclick = () => {
    menuBox.innerHTML = `
        <div class="text-[18px] font-bold text-center mb-4 text-mono-600 dark:text-mono-950">编辑完整内容</div>
        <textarea id="tw-edit-textarea" class="w-full h-[180px] bg-mono-100 dark:bg-mono-800 border border-mono-200 dark:border-mono-700 rounded-xl p-3 text-[14px] text-mono-600 dark:text-mono-950 outline-none resize-none mb-4"></textarea>
        <div class="flex gap-3">
            <button id="tw-btn-cancel-edit" class="flex-1 py-3 rounded-xl bg-mono-200 dark:bg-mono-700 text-mono-600 dark:text-mono-950 font-bold text-[15px]">取消</button>
            <button id="tw-btn-save-edit" class="flex-1 py-3 rounded-xl bg-mono-600 dark:bg-mono-950 text-white dark:text-black font-bold text-[15px]">保存</button>
        </div>
    `;
    const textarea = menuBox.querySelector('#tw-edit-textarea');
    textarea.value = bubble.innerText || bubble.textContent; 
    
    menuBox.querySelector('#tw-btn-cancel-edit').onclick = () => overlay.click();
    menuBox.querySelector('#tw-btn-save-edit').onclick = () => {
        if (textarea.value.trim()) {
            bubble.innerText = textarea.value.trim();
            const c = contacts.find(x => x.id === currentTwContactId);
            if (c && c.twHistory) {
                const targetIndex = c.twHistory.findIndex(m => m._twId === id);
                if (targetIndex !== -1) {
                    c.twHistory[targetIndex].content = textarea.value.trim();
                    saveData();
                    if (typeof syncTwUpdateToMainChat === 'function') syncTwUpdateToMainChat(c.id);
                }
            }
        }
        overlay.click();
    };
};
         }
         
         // 监听滑动，打断长按
         document.addEventListener('touchmove', (e) => {
    if (twStartX === 0 && twStartY === 0) return;
    let curX = e.touches ? e.touches[0].clientX : e.clientX;
    let curY = e.touches ? e.touches[0].clientY : e.clientY;
    if (Math.abs(curX - twStartX) > 10 || Math.abs(curY - twStartY) > 10) {
        twTouchMoved = true;
        clearTimeout(twPressTimer);
    }
}, { passive: true });

// 桌面背景亮度检测引擎
function analyzeHomeBgBrightness(imageSrc) {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageSrc;
    img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 40; canvas.height = 40; // 采样缩小，提升性能
        ctx.drawImage(img, 0, 0, 40, 40);
        try {
            const data = ctx.getImageData(0, 0, 40, 40).data;
            let r = 0, g = 0, b = 0;
            for (let i = 0; i < data.length; i += 4) {
                r += data[i]; g += data[i+1]; b += data[i+2];
            }
            const count = data.length / 4;
            const brightness = ((r/count)*299 + (g/count)*587 + (b/count)*114)/1000;
            const homeEl = document.getElementById('view-home');
            // 亮度阈值设为 140，低于此值视为深色背景
            if (brightness < 140) homeEl.classList.add('dark-wallpaper');
            else homeEl.classList.remove('dark-wallpaper');
        } catch(e) { console.warn("背景亮度分析受限:", e); }
    };
}

// ================= 更新公告逻辑 (版本化强制弹出) =================
function checkUpdateNotice() {
    // 🚀 升级为 v1_1_4，确保所有用户刷新后都会再次看到公告
    const isHidden = localStorage.getItem('soap_hide_update_v1_1_9');
    if (isHidden !== 'true') {
        document.getElementById('update-notice-modal').classList.add('active');
    }
}

function closeUpdateNotice(neverShowAgain) {
    if (neverShowAgain) {
        localStorage.setItem('soap_hide_update_v1_1_9', 'true');
    }
    document.getElementById('update-notice-modal').classList.remove('active');
}

function switchUpdateTab(type) {
    const card = document.getElementById('updateCard');
    const content = document.getElementById('logContent');
    const tabNew = document.getElementById('tab-new');
    const tabHistory = document.getElementById('tab-history');
    
    if(type === 'history') {
        card.classList.add('history-active');
        tabNew.classList.remove('active');
        tabHistory.classList.add('active');
        content.innerHTML = `
            <div class="log-page">
            <div class="log-item">
            <span class="log-ver">Archive // V1.1.4</span>
                    <p class="log-text">·适配了ios全屏！！！<br>                                       ·改了点ui<br>
                    ·世界书可以选择前中后和可以使用关键词<br></p>
                    <span class="log-ver">Archive // V1.1.3</span>
                    <p class="log-text">·新加了修复格式[长按消息后点击]<br>·可以改锁屏密码了<br>
                    ·修复了导入数据没有导入聊天记录和线下<br>
                    ·新加了char发表情包！<br>
                    ·提示词改了一下可以试试有没有之前活<br>
                    ·线下可以改颜色<br></p>
                            <div class="log-item">
                    <span class="log-ver">Archive // V1.1.2</span>
                    <p class="log-text">·修好了线下！！<br>
                                       ·朋友圈的联系人勾选互动也回来啦<br>                                      ·修复了关掉听歌的悬浮卡片会停止一起听<br></p>
                </div>
                <div class="log-item">
                    <span class="log-ver">Archive // V1.1.1</span>
                    <p class="log-text">· 兼容旧版本的数据</p>
                </div>
                <div class="log-item">
                    <span class="log-ver">Archive // V1.1.0</span>
                    <p class="log-text">
                        · 修复推特评论删除逻辑：避免误删除全部评论<br>
                        · 修复导出备份无法导出朋友圈的问题<br>
                        · 线下版本提速：优化存储方式<br>
                        · 修复推特关注功能<br>
                        · 修复电话界面打字颜色问题<br>
                        · 线下内置提示词：强调格式规范<br>
                        · 修复线下文字过多时重叠显示的问题（未测试）<br>
                        · 实现线下与线上数据互通，并完成相关问题的总结修复
                    </p>
                </div>
            </div>
        `;
    } else {
        card.classList.remove('history-active');
        tabHistory.classList.remove('active');
        tabNew.classList.add('active');
        content.innerHTML = `
            <div class="log-page">
                <p class="log-text">
· 听歌可以搜索导入啦<br>
         · 做了联系人记忆库 在聊天室的设置里 <br>
         · 查手机<br>
         · 修复了点bug<br>
         <span style="color:var(--c-gray); font-size:11px; font-style: italic;">——————罒ω罒——————</span>
                </p>
            </div>
        `;
    }
    content.scrollTop = 0;
}

// ================= 核心：格式暴力修复引擎 =================
async function executeRepair(type) {
    if (window.activeRepairIndex === null || !currentContactId) return;
    const c = contacts.find(x => x.id === currentContactId);
    let msg = c.history[window.activeRepairIndex];
    let raw = msg.content;
    let newContent = "";

    // 提取公共参数的正则
    const getParam = (regex, fallback) => {
        let m = raw.match(regex);
        return m ? m[1].trim() : fallback;
    };

    switch (type) {
        case 'text':
            // 修复消息：剥离所有 HTML 标签，只留纯文本
            newContent = raw.replace(/<[^>]+>/g, '').trim();
            if (!newContent) newContent = "（此消息格式错误，已重置内容）";
            break;

        case 'loc':
            // 修复定位
            let lName = getParam(/name=["']?([^"'>]+)["']?/i, "未知地点");
            let lDesc = getParam(/desc=["']?([^"'>]+)["']?/i, "坐标已锁定");
            newContent = generateLocHtml(lName, lDesc, msg.role === 'user');
            break;

        case 'nt':
            // 修复普通转账
            let ntAmt = getParam(/amount=["']?([^"'>]+)["']?/i, "520.00");
            let ntMemo = getParam(/memo=["']?([^"'>]+)["']?/i, "转账留言");
            newContent = `<div class="normal-transfer" onclick="handleNormalCardTap(event, this)">
                <div class="nt-watermark-text">PLATINUM</div><div class="nt-black-tag"></div><div class="nt-chip"></div>
                <div class="nt-top"><div class="nt-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div><div class="nt-divider"></div><div class="nt-info"><div class="nt-amt">¥ ${ntAmt}</div><div class="nt-memo">${ntMemo}</div></div></div>
                <div class="nt-bottom"><span>SOAP TRANSFER</span></div>
            </div><img src="1" onerror="this.parentNode.classList.add('bubble-clear'); this.remove();">`;
            break;

        case 'bc':
            // 修复黑卡
            let bcAmt = getParam(/amount=["']?([^"'>]+)["']?/i, "9,999,999");
            let bcMemo = getParam(/memo=["']?([^"'>]+)["']?/i, "拿去随便刷");
            let uAvatar = gConfig.meAvatar || '';
            let botAvatarHtml = renderAvatarHTML(c.chatAvatar || c.avatar, 'bot');
            const dateStr = new Date().getFullYear() + ' / ' + (new Date().getMonth() + 1).toString().padStart(2, '0');
            newContent = `<div style="display:flex; flex-direction:column; gap:8px; width:189px;"><div style="width:189px; height:119px; position:relative;"><div style="width:270px; height:170px; transform:scale(0.7); transform-origin:top left; position:absolute; top:0; left:0;"><div class="black-card-scene" onclick="toggleBlackCard(this)"><div class="black-card-wrapper"><div class="bc-face bc-face--front"><div class="bc-title bc-gold-text">TRANSFER TO YOU</div><div class="bc-avatar">${botAvatarHtml}</div><div class="bc-num bc-num-l bc-gold-text">5201</div><div class="bc-num bc-num-r bc-gold-text">8888</div><div class="bc-date bc-gold-text">${dateStr}</div></div><div class="bc-face bc-face--back"><div class="bc-stripe"></div><div class="bc-amt bc-gold-text">$ ${bcAmt}</div><div class="bc-sig-bg"></div><div class="bc-sig bc-gold-text">${c.name}</div><div class="bc-memo bc-gold-text">- "${bcMemo}"</div></div></div></div></div></div><div class="bc-action-bar" style="margin:0; width:100%; display:flex; justify-content:center; gap:15px; z-index:20;"><div class="bc-btn accept" onclick="handleCardAction(this, 'accept')">收下</div><div class="bc-btn reject" onclick="handleCardAction(this, 'reject')">退回</div></div></div><img src="1" onerror="this.parentElement.classList.add('bubble-clear'); this.remove();">`;
            break;

        case 'rp':
            // 修复红包
            let rpAmt = getParam(/amount=["']?([^"'>]+)["']?/i, "100.00");
            let rpText = getParam(/text=["']?([^"'>]+)["']?/i, "恭喜发财");
            let botAv = renderAvatarHTML(c.chatAvatar || c.avatar, 'bot');
            newContent = `<div class="rp-container theme-red" data-type="normal" data-amount="${rpAmt}" onclick="handleRedPacketOpen(this)"><div class="rp-back"></div><div class="rp-card"><div class="card-avatar">${botAv}</div><div class="card-title">Asset Unlocked</div><div class="card-amount"><span>$</span><span class="rp-num-display">${rpAmt}</span></div><div class="card-tag">AUTHORIZED</div></div><div class="rp-front"><div class="rp-texts"><div class="rp-title-main">SOAP.OS</div><div class="rp-sub">${rpText}</div></div></div><div class="rp-flap"><div class="rp-coin">OPEN</div></div></div><img src="1" onerror="this.parentNode.classList.add('bubble-clear'); this.remove();">`;
            break;

        case 'lb':
            // 修复礼盒
            let lbTitle = getParam(/title=["']?([^"'>]+)["']?/i, "神秘礼物");
            let lbSub = getParam(/sub=["']?([^"'>]+)["']?/i, "EXCLUSIVE PRESENT");
            newContent = generateLuxuryBoxHtml(lbTitle, lbSub, 'pending', msg.role === 'user');
            break;

        case 'sync':
            // 修复听歌
            let sTitle = getParam(/title=["']?([^"'>]+)["']?/i, "");
            let sData = null;
            if (sTitle) {
                sData = m_db.daily.find(t => t.title === sTitle) || Object.values(m_db.tracks).flat().find(t => t.title === sTitle);
            }
            newContent = generateSyncCardHtml(false, msg.role === 'user', sData);
            break;

        case 'photo':
            // 修复实体相片：精准捕捉 [照片：描述] 或 [Photo: 描述] 这种错误文本
            let pDesc = getParam(/\[(?:照片|Photo)[:：]\s*([^\]]+)\]/i, ""); 
            
            // 如果没抓到中括号格式，再尝试抓取 desc="..." 属性（防止标签写了一半的情况）
            if (!pDesc) pDesc = getParam(/desc=["']?([^"'>]+)["']?/i, "");
            
            // 如果已经是卡片了只是想重刷，抓取 stamp-text 里的文字
            if (!pDesc) pDesc = getParam(/stamp-text[^>]*>([^<]+)/i, "");
            
            if (!pDesc && msg.photoDesc) pDesc = msg.photoDesc;
            if (!pDesc) pDesc = "一张留白的定格画面";
            
            // 同步更新数据对象里的描述，确保 AI 以后能读取到
            msg.photoDesc = pDesc;

            newContent = `
            <div class="stamp-wrapper">
                <div class="stamp-base">
                    <div class="stamp-inner">
                        <div class="stamp-postmark"></div>
                        <div class="stamp-circle"></div>
                        <div class="stamp-header">PAR AVION</div>
                        <div class="stamp-text">${pDesc}</div>
                    </div>
                </div>
            </div><img src="1" onerror="this.parentNode.classList.add('bubble-clear'); this.remove();">`;
            break;
    }

    if (newContent) {
        msg.content = newContent;
        saveData();
        renderChatHistory();
    }
    document.getElementById('repair-modal').classList.remove('active');
    window.activeRepairIndex = null;
}
