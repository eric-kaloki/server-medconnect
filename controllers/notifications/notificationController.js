const notifications = {}; // In-memory storage for notifications (use a database in production)

// Fetch notifications for a user
exports.getNotifications = (req, res) => {
  const userId = req.params.userId;
  res.json(notifications[userId] || []);
};

// Add a new notification
exports.addNotification = (req, res) => {
  const { userId, title, body } = req.body;
  if (!notifications[userId]) notifications[userId] = [];
  notifications[userId].push({ title, body, isRead: false });
  res.status(201).json({ message: 'Notification added.' });
};

// Mark notifications as read
exports.markAsRead = (req, res) => {
  const userId = req.params.userId;
  if (notifications[userId]) {
    notifications[userId].forEach((n) => (n.isRead = true));
  }
  res.json({ message: 'Notifications marked as read.' });
};
