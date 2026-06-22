const Notification = require("../models/Notification.model");
const User = require("../models/User.model");

const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .populate("relatedId")
      .sort({ createdAt: -1 });

    return res.status(200).json({ notifications });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const markAsRead = async (req, res) => {
    try {
        // 1. extract id from req.params
        const id = req.params.id;
        const notification = await Notification.findById(id);
        if (!notification) {
            return res.status(404).json({ message: 'Notification Not Found' });
        }

        if (notification.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access Denied' });
        }

        const updatedNotification = await Notification.findByIdAndUpdate(id, { isRead: true}, { new: true});

        return res.status(200).json({ updatedNotification });
    } catch (error) {
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = { getMyNotifications, markAsRead };
