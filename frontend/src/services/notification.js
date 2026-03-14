export const notificationService = {
  requestPermission: async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notification');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  },

  showNotification: (title, options) => {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/icon-512.png',
        badge: '/icon-512.png',
        ...options
      });
    }
  }
};
