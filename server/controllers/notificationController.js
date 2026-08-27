const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Helper function to create notifications programmatically from other controllers
 */
const createSystemNotification = async ({ userId, userIds, title, message, type = 'announcement', link = '' }) => {
  try {
    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      const docs = userIds.map((uid) => ({
        user: uid,
        title,
        message,
        type,
        link,
        read: false,
      }));
      return await Notification.insertMany(docs);
    } else if (userId) {
      return await Notification.create({
        user: userId,
        title,
        message,
        type,
        link,
        read: false,
      });
    }
  } catch (err) {
    console.error('System notification creation failed:', err);
  }
};

/**
 * GET /api/notifications
 * Fetch logged-in user's notifications
 */
const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { unreadOnly } = req.query;
    const query = { user: userId };
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({ user: userId, read: false });

    return res.status(200).json({
      notifications,
      unreadCount,
    });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return res.status(500).json({ message: 'Failed to load notifications' });
  }
};

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read
 */
const markAsRead = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid notification ID' });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const unreadCount = await Notification.countDocuments({ user: userId, read: false });

    return res.status(200).json({
      message: 'Notification marked as read',
      notification,
      unreadCount,
    });
  } catch (err) {
    console.error('Error marking notification as read:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * PATCH /api/notifications/read-all
 * Mark all user notifications as read
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await Notification.updateMany({ user: userId, read: false }, { read: true });

    return res.status(200).json({
      message: 'All notifications marked as read',
      unreadCount: 0,
    });
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /api/notifications
 * Admin broadcast or targeted notification creation
 */
const createAdminNotification = async (req, res) => {
  try {
    const { title, message, type = 'announcement', audience = 'all', studentId, link = '' } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    if (audience === 'specific') {
      if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({ message: 'A valid student ID is required for targeted notifications' });
      }

      const notif = await Notification.create({
        user: studentId,
        title,
        message,
        type,
        link,
        read: false,
      });

      return res.status(201).json({
        message: 'Notification sent successfully to selected student',
        count: 1,
        notification: notif,
      });
    } else {
      // Broadcast to all students
      const students = await User.find({ role: 'student' }).select('_id');
      if (!students || students.length === 0) {
        return res.status(200).json({ message: 'No students found to notify', count: 0 });
      }

      const docs = students.map((s) => ({
        user: s._id,
        title,
        message,
        type,
        link,
        read: false,
      }));

      await Notification.insertMany(docs);

      return res.status(201).json({
        message: `Notification broadcasted to ${students.length} students`,
        count: students.length,
      });
    }
  } catch (err) {
    console.error('Error creating admin notification:', err);
    return res.status(500).json({ message: 'Server error while sending notification' });
  }
};

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
const deleteNotification = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const userRole = req.user?.role;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid notification ID' });
    }

    const query = userRole === 'admin' ? { _id: id } : { _id: id, user: userId };
    const deleted = await Notification.findOneAndDelete(query);

    if (!deleted) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const unreadCount = await Notification.countDocuments({ user: userId, read: false });

    return res.status(200).json({
      message: 'Notification deleted successfully',
      unreadCount,
    });
  } catch (err) {
    console.error('Error deleting notification:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createSystemNotification,
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  createAdminNotification,
  deleteNotification,
};
