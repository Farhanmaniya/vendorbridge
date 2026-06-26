import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { IconBell, IconPower, IconUserCircle, IconCircle } from "@tabler/icons-react";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const response = await api.get("/notifications");
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error("Failed to load notifications", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 30s
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case "admin":
        return "bg-danger-light text-danger-dark border border-danger/20";
      case "manager":
        return "bg-warning-light text-warning-dark border border-warning/20";
      case "officer":
        return "bg-primary-light text-primary border border-primary/20";
      default:
        return "bg-success-light text-success-dark border border-success/20";
    }
  };

  return (
    <nav className="h-16 bg-white border-b border-border px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg shadow-sm">
            V
          </span>
          <span className="font-semibold text-lg tracking-tight text-text-primary hidden sm:inline">
            Vendor<span className="text-primary">Bridge</span>
          </span>
        </Link>
      </div>

      {user && (
        <div className="flex items-center gap-4">
          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="p-2 text-text-muted hover:bg-bg-subtle hover:text-text-primary rounded-full transition-colors relative"
            >
              <IconBell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-danger text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-border rounded-lg shadow-dropdown overflow-hidden z-50">
                <div className="px-4 py-2.5 border-b border-border flex items-center justify-between bg-bg-subtle">
                  <span className="font-semibold text-xs text-text-primary">Notifications</span>
                  <Link
                    to="/notifications"
                    onClick={() => setShowNotifDropdown(false)}
                    className="text-primary hover:underline text-xs font-medium"
                  >
                    View all
                  </Link>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-border">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-text-muted text-xs">No notifications</div>
                  ) : (
                    notifications.slice(0, 5).map((notif) => (
                      <div
                        key={notif._id}
                        onClick={() => {
                          if (!notif.isRead) markRead(notif._id);
                          setShowNotifDropdown(false);
                          navigate(
                            notif.relatedModel === "RFQ"
                              ? `/rfqs/${notif.relatedId?._id || notif.relatedId}`
                              : `/rfqs/${notif.relatedId?.rfqId?._id || notif.relatedId?.rfqId || notif.relatedId}`
                          );
                        }}
                        className={`p-3 text-xs cursor-pointer hover:bg-bg-subtle transition-colors flex gap-2.5 ${
                          !notif.isRead ? "bg-primary-light/20 font-medium" : ""
                        }`}
                      >
                        <div className="mt-0.5">
                          {!notif.isRead ? (
                            <IconCircle className="w-2 h-2 text-primary fill-primary" />
                          ) : (
                            <div className="w-2 h-2" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-text-primary leading-snug">{notif.message}</p>
                          <span className="text-[10px] text-text-hint mt-1 block">
                            {new Date(notif.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-border hidden sm:block"></div>

          {/* User Info & Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="font-medium text-sm text-text-primary">{user.name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold capitalize ${getRoleBadgeClass(user.role)}`}>
                {user.role}
              </span>
            </div>
            <div className="text-text-muted">
              <IconUserCircle className="w-8 h-8" />
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-text-muted hover:text-danger hover:bg-danger-light rounded-full transition-colors"
              title="Logout"
            >
              <IconPower className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
