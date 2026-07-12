import { Request, Response } from 'express';
import Notification from './notification.model';

// @desc    Get all notifications for logged-in user
// @route   GET /api/notifications
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50); // Fetch top 50 recent notifications
      
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching notifications' });
  }
};

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const notificationId = req.params.id;
    const userId = (req as any).user._id;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Server Error marking notification as read' });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;

    await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error marking all notifications as read' });
  }
};
