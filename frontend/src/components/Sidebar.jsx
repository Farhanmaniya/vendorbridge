import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  IconLayoutDashboard,
  IconFileSpreadsheet,
  IconUsers,
  IconBuildingStore,
  IconHistory,
  IconBell,
  IconReceipt,
  IconFileInvoice
} from "@tabler/icons-react";

const Sidebar = () => {
  const { user } = useAuth();

  if (!user) return null;

  const menuItems = [
    {
      path: "/",
      label: "Dashboard",
      icon: <IconLayoutDashboard className="w-5 h-5" />,
      roles: ["admin", "officer", "manager", "vendor"],
    },
    {
      path: "/rfqs",
      label: user.role === "vendor" ? "My Bids" : "RFQs",
      icon: <IconFileSpreadsheet className="w-5 h-5" />,
      roles: ["officer", "manager", "vendor"],
    },
    {
      path: "/purchase-orders",
      label: "Purchase Orders",
      icon: <IconReceipt className="w-5 h-5" />,
      roles: ["admin", "officer", "manager", "vendor"],
    },
    {
      path: "/invoices",
      label: "Invoices",
      icon: <IconFileInvoice className="w-5 h-5" />,
      roles: ["admin", "officer", "manager", "vendor"],
    },
    {
      path: "/users",
      label: "User Management",
      icon: <IconUsers className="w-5 h-5" />,
      roles: ["admin"],
    },
    {
      path: "/vendors",
      label: "Vendors",
      icon: <IconBuildingStore className="w-5 h-5" />,
      roles: ["admin"],
    },
    {
      path: "/vendor-profile",
      label: "Company Profile",
      icon: <IconBuildingStore className="w-5 h-5" />,
      roles: ["vendor"],
    },
    {
      path: "/audit-logs",
      label: "Audit Logs",
      icon: <IconHistory className="w-5 h-5" />,
      roles: ["admin"],
    },
    {
      path: "/notifications",
      label: "Notifications",
      icon: <IconBell className="w-5 h-5" />,
      roles: ["admin", "officer", "manager", "vendor"],
    },
  ];

  const filteredItems = menuItems.filter((item) => item.roles.includes(user.role));

  return (
    <aside className="w-64 bg-white border-r border-border min-h-[calc(100vh-64px)] hidden md:block flex-shrink-0">
      <div className="p-4">
        <nav className="space-y-1">
          {filteredItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary-light text-primary"
                    : "text-text-muted hover:bg-bg-subtle hover:text-text-primary"
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="absolute bottom-4 left-4 text-xs text-text-hint">
        VendorBridge v1.0.0
      </div>
    </aside>
  );
};

export default Sidebar;
