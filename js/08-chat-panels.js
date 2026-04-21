          // ================= 底部双面板互斥交互逻辑 =================
          
          // 【完美修复：剥夺系统缓动，实现 100% 零延迟焊死托举】
          function syncScrollToBottomDuringAnim() {
              const ca = document.getElementById('chat-area');
              // 关键：动画期间强行关闭拖后腿的平滑滚动
              ca.style.scrollBehavior = 'auto'; 
              const startTime = Date.now();
              function step() {
                  ca.scrollTop = ca.scrollHeight;
                  if (Date.now() - startTime < 380) { 
                      requestAnimationFrame(step); 
                  } else {
                      // 动画结束，把平滑滚动还给系统
                      ca.style.scrollBehavior = 'smooth';
                  }
              }
              requestAnimationFrame(step);
          }
          
          function toggleStickerPanel() {
              const sPanel = document.getElementById('sticker-panel');
              const aPanel = document.getElementById('attachment-panel');
              const r = document.getElementById('input-row');
              const drawerWrap = document.getElementById('action-drawer-wrap');
              const drawerContent = document.getElementById('drawer-content');
              
              // 【新增修复】：强制清除可能被误加的内联隐藏样式，把控制权还给CSS！
              sPanel.style.display = ''; 
          
              if (!sPanel.classList.contains('show')) {
                  // 记录一下点之前附件面板是不是开着的
                  const wasAttachmentOpen = aPanel.classList.contains('show');
                  
                  // 谁最后点，谁就是爹！强杀附件面板和上方抽屉！
                  aPanel.classList.remove('show');
                  if (drawerWrap) drawerWrap.classList.remove('open');
                  if (drawerContent) drawerContent.classList.remove('open');
                  
                  sPanel.classList.add('show'); 
                  r.style.paddingBottom = '12px';
                  renderChatStickerPanel();
                  
                  // 只有当它是从底端"升起"时，才调用托举动画；如果是和附件面板平切，绝不调用，防止顶一下！
                  if (!wasAttachmentOpen) syncScrollToBottomDuringAnim(); 
              } else {
                  closeChatMenu();
              }
          }
          
          function toggleAttachmentPanel() {
              const sPanel = document.getElementById('sticker-panel');
              const aPanel = document.getElementById('attachment-panel');
              const r = document.getElementById('input-row');
              const drawerWrap = document.getElementById('action-drawer-wrap');
              const drawerContent = document.getElementById('drawer-content');
              
              // 【新增修复】：强制清除可能被误加的内联隐藏样式
              aPanel.style.display = ''; 
          
              if (!aPanel.classList.contains('show')) {
                  const wasStickerOpen = sPanel.classList.contains('show');
                  
                  // 强杀贴纸面板和上方抽屉！
                  sPanel.classList.remove('show');
                  if (drawerWrap) drawerWrap.classList.remove('open');
                  if (drawerContent) drawerContent.classList.remove('open');
                  
                  aPanel.classList.add('show'); 
                  r.style.paddingBottom = '12px';
                  
                  if (!wasStickerOpen) syncScrollToBottomDuringAnim(); 
              } else {
                  closeChatMenu();
              }
          }
          
          // 全局通用的关闭菜单函数
          function closeChatMenu() { 
              document.getElementById('sticker-panel').classList.remove('show');
              document.getElementById('attachment-panel').classList.remove('show');
              document.getElementById('input-row').style.paddingBottom = 'calc(12px + var(--safe-bottom))';
              const drawerWrap = document.getElementById('action-drawer-wrap');
              const drawerContent = document.getElementById('drawer-content');
              if (drawerWrap) drawerWrap.classList.remove('open');
              if (drawerContent) drawerContent.classList.remove('open');
          }
          
          let currentChatRenderLimit = 30;
let isHistoryLoading = false;

// 【新增】监听聊天区域，只要点击空白或者触摸滑动，就立刻收起所有面板，并监听下拉加载历史
document.addEventListener('DOMContentLoaded', () => {
    const chatArea = document.getElementById('chat-area');
    if (chatArea) {
        chatArea.addEventListener('mousedown', closeChatMenu);
        chatArea.addEventListener('touchstart', closeChatMenu, { passive: true });
        
        chatArea.addEventListener('scroll', function() {
            if (this.scrollTop < 80 && !isHistoryLoading && currentContactId) {
                const c = contacts.find(x => x.id === currentContactId);
                if (!c) return;
                let currentWid = gConfig.currentWorldviewId || 'default';
                let totalValid = c.history.filter(m => 
                    m.role !== 'system' && m.isTheater !== true &&
                    (!m.wid || m.wid === currentWid || currentWid === 'default')
                ).length;
                if (currentChatRenderLimit < totalValid) {
                    isHistoryLoading = true;
                    
                    let existingHint = document.getElementById('chat-load-more-hint');
                    if (existingHint) {
                        existingHint.innerHTML = '<div class="chl-spinner"></div><span>加载中...</span>';
                        existingHint.classList.add('is-loading');
                    }
                    
                    setTimeout(() => {
                        currentChatRenderLimit += 30;
                        renderChatHistory(true);
                    }, 150);
                }
            }
        }, { passive: true });
    }
});
          
          // ================= 面具系统抽屉式交互 =================
          function toggleMaskList() {
              const wrap = document.getElementById('mask-list-container');
              if(wrap.style.display === 'none' || wrap.style.display === '') {
                  wrap.style.display = 'block';
                  renderMaskList();
              } else {
                  wrap.style.display = 'none';
              }
          }
          
          // ================= 总结指令胶囊交互 =================
          function toggleSumPrompt() {
              const wrap = document.getElementById('sum-prompt-wrap');
              wrap.style.display = wrap.style.display === 'none' ? 'block' : 'none';
              if(wrap.style.display === 'block') renderSumPresets();
          }
          
          function renderSumPresets() {
              const cont = document.getElementById('sum-presets-container');
              if(!cont) return;
              cont.innerHTML = '';
              const currentVal = document.getElementById('cs-sum-prompt').value.trim();
              
              let presets = gConfig.sumPrompts || [];
              presets.forEach((p, idx) => {
                  const isActive = (p.text === currentVal);
                  const chip = document.createElement('div');
                  chip.className = `action-chip ${isActive ? 'active' : ''}`;
                  chip.innerText = p.label;
                  chip.onclick = () => setSumPrompt(p.text);
                  chip.oncontextmenu = (e) => { e.preventDefault(); if(confirm('删除此预设？')){ gConfig.sumPrompts.splice(idx,1); saveGlobal(); renderSumPresets(); }};
                  cont.appendChild(chip);
              });
          }
          
          function setSumPrompt(text) {
              document.getElementById('cs-sum-prompt').value = text;
              renderSumPresets();
          }
          
          function checkActiveSumPreset() {
              renderSumPresets();
          }
          
          function addSumPreset() {
              const text = document.getElementById('cs-sum-prompt').value.trim();
              if(!text) return alert('请先在下方输入框填写你想保存的指令！');
              if(gConfig.sumPrompts.find(p => p.text === text)) return alert('该指令已存在预设列表中！');
              
              const label = prompt('给这个预设指令起个短名称：', '新预设');
              if(label !== null && label.trim() !== '') {
                  gConfig.sumPrompts.push({ label: label.trim(), text: text });
                  saveGlobal();
                  renderSumPresets();
              }
          }
function toggleCustomLangInput(value) {
    const wrap = document.getElementById('custom-lang-input-wrap');
    if (value === 'custom') {
        wrap.style.display = 'block';
    } else {
        wrap.style.display = 'none';
    }
}

function mvRefreshSettingsPreview() {
    if (!currentContactId) return;
    let c = contacts.find(x => x.id === currentContactId);
    if (!c) return;
    if (typeof mvUpdateSettingsPreview === 'function') {
        mvUpdateSettingsPreview(c);
    }
}
          