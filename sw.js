// sw.js - 放在项目根目录
self.addEventListener('push', function(event) {
  let data = { title: '新消息', body: '你有一条新消息' };
  
  try {
    data = event.data.json();
  } catch(e) {
    data.body = event.data ? event.data.text() : '你有一条新消息';
  }

  const options = {
    body: data.body,
    icon: 'https://nos.netease.com/ysf/547542b6a49930315c352e6a326bb876.png',
    badge: 'https://nos.netease.com/ysf/547542b6a49930315c352e6a326bb876.png',
    vibrate: [100, 50, 100],
    data: { url: self.location.origin },
    actions: [
      { action: 'open', title: '打开' },
      { action: 'dismiss', title: '忽略' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(clientList) {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow(event.notification.data.url || '/');
    })
  );
});
