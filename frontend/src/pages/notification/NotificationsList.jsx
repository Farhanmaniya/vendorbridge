import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { IconBell, IconMailOpened, IconMail, IconArrowRight, IconTrash } from "@tabler/icons-react";
import toast from "react-hot-toast";

const NotificationsList = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get("/notifications");
      setNotifications(response.data.notifications || []);
    } catch (error) {
      toast.error("Failed to load notifications history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      toast.success("Marked as read");
    } catch (error) {
      toast.error("Failed to update notification");
    }
  };

  const handleNotifClick = async (notif) => {
    if (!notif.isRead) {
      await handleMarkAsRead(notif._id);
    }

    const rfqId = notif.relatedModel === "RFQ"
      ? notif.relatedId?._id || notif.relatedId
      : notif.relatedId?.rfqId?._id || notif.relatedId?.rfqId || notif.relatedId;

    if (rfqId) {
      navigate(`/rfqs/${rfqId}`);
    } else {
      toast.error("Resource details are not accessible");
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Notifications Inbox</h1>
          <p className="text-text-muted text-xs">Stay updated on RFQ publication events, bids reviews, and awarding announcements.</p>
        </div>
      </div>

      <div className="card space-y-4">
        {loading ? (
          <div className="py-20 text-center flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-20 text-center text-text-hint text-xs space-y-2">
            <IconBell className="w-10 h-10 mx-auto text-text-hint animate-bounce" />
            <p className="font-semibold">No Notifications</p>
            <p className="text-[10px]">Your inbox is completely clear!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((n) => (
              <div
                key={n._id}
                className={`py-4 flex items-start gap-4 transition-all rounded-lg px-3 ${
                  !n.isRead ? "bg-primary-light/10" : "hover:bg-bg-subtle/40"
                }`}
              >
                <div className="mt-1">
                  {!n.isRead ? (
                    <IconMail className="w-5 h-5 text-primary" />
                  ) : (
                    <IconMailOpened className="w-5 h-5 text-text-hint" />
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <p className={`text-xs ${!n.isRead ? "font-bold text-text-primary" : "text-text-muted"}`}>
                    {n.message}
                  </p>
                  <span className="text-[10px] text-text-hint block">
                    {new Date(n.createdAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>

                <div className="flex gap-2">
                  {!n.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(n._id)}
                      className="text-[10px] text-primary font-bold hover:underline"
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    onClick={() => handleNotifClick(n)}
                    className="p-1 text-text-muted hover:text-primary rounded hover:bg-white transition-colors"
                    title="View details"
                  >
                    <IconArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsList;
