// js/29-push-notify.js
const SUPABASE_URL = 'https://ckemiquwgjzmnegnyulv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZW1pcXV3Z2p6bW5lZ255dWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2Njk3NTcsImV4cCI6MjA5NTI0NTc1N30.ta2uh5EUis53c-t2jvg1s6vNeO4tFJiurLPON9anMlw';

// VAPID公钥 - 后面我教你生成
const VAPID_PUBLIC_KEY = 'BAPbBneTDZfseDzCudtHRiLKTUDXdCiRv3qv1rN-bCdy96I_3GpF0DhKTYhSRvyR9msOY0X1r9eTwVM4Eb_JpZk';

// 生成唯一用户标识
function getPushUserToken() {
  let token = localStorage.getItem('push_user_token');
  if (!token) {
    token = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('push_user_token', token);
  }
  return token;
}

// 注册Service Worker并订阅推送
async function initPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('此浏览器不支持推送通知');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker 注册成功');

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('用户拒绝了通知权限');
      return;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    // 保存订阅到Supabase
    await saveSubscription(subscription);
    console.log('推送订阅成功');
  } catch (err) {
    console.error('推送注册失败:', err);
  }
}

// 保存订阅信息到数据库
async function saveSubscription(subscription) {
  const userToken = getPushUserToken();
  const response = await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify({
      user_token: userToken,
      subscription: subscription.toJSON(),
      last_active: new Date().toISOString()
    })
  });

  if (!response.ok) {
    console.error('保存订阅失败:', await response.text());
  }
}

// 更新活跃状态（每次打开页面时调用）
async function updateActiveStatus() {
  const userToken = getPushUserToken();
  
  await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?user_token=eq.${userToken}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    },
    body: JSON.stringify({
      last_active: new Date().toISOString()
    })
  });
}

// 工具函数：Base64转Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// 页面加载时自动初始化
document.addEventListener('DOMContentLoaded', function() {
  // 延迟5秒再请求权限，避免用户刚进来就弹窗
  setTimeout(() => {
    initPushNotifications();
    updateActiveStatus();
  }, 5000);
});

// 每5分钟更新一次活跃状态
setInterval(updateActiveStatus, 5 * 60 * 1000);
