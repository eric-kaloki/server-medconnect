const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notifications/notificationController');

router.get('/:userId', notificationController.getNotifications);
router.post('/', notificationController.addNotification);
router.put('/:userId/read', notificationController.markAsRead);

module.exports = router;
