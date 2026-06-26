import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { IconPlus, IconUser, IconMail, IconKey, IconToggleLeft, IconToggleRight, IconCircleDot } from "@tabler/icons-react";
import toast from "react-hot-toast";

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("officer");
  const [formLoading, setFormLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/users");
      setUsers(response.data.staff || []);
    } catch (error) {
      toast.error("Failed to load staff directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (userId) => {
    try {
      const res = await api.patch(`/users/${userId}/status`);
      toast.success("User account status toggled");
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to toggle status");
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!name || !email || !role) {
      return toast.error("Please fill in all required fields");
    }

    setFormLoading(true);
    try {
      await api.post("/users", { name, email, role });
      toast.success("Account created! A welcome email containing password instructions has been issued.");
      setShowAddModal(false);
      setName("");
      setEmail("");
      setRole("officer");
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create user account");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Staff & User Directory</h1>
          <p className="text-text-muted text-xs">Register operational staff credentials (officers/managers/vendors) and toggle active login access states.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-1.5 shadow-sm font-semibold"
        >
          <IconPlus className="w-4.5 h-4.5" />
          <span>Create User Account</span>
        </button>
      </div>

      {/* Users table list */}
      <div className="card">
        {loading ? (
          <div className="py-20 text-center flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="py-20 text-center text-text-hint text-xs">No active staff users registered in the database.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Full Name</th>
                  <th className="table-header">Email Address</th>
                  <th className="table-header">System Role</th>
                  <th className="table-header">Forced PW Reset</th>
                  <th className="table-header">Login Allowed</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-bg-subtle/50 transition-colors">
                    <td className="table-cell font-semibold text-text-primary flex items-center gap-2">
                      <IconUser className="w-4 h-4 text-text-hint" />
                      <span>{u.name}</span>
                    </td>
                    <td className="table-cell text-text-muted">{u.email}</td>
                    <td className="table-cell capitalize">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        u.role === "admin"
                          ? "bg-danger-light text-danger-dark border-danger/20"
                          : u.role === "manager"
                          ? "bg-warning-light text-warning-dark border-warning/20"
                          : u.role === "officer"
                          ? "bg-primary-light text-primary border-primary/20"
                          : "bg-success-light text-success-dark border-success/20"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="table-cell">
                      {u.mustChangePassword ? (
                        <span className="text-warning font-medium flex items-center gap-1">
                          <IconCircleDot className="w-3.5 h-3.5 animate-pulse" />
                          <span>Pending Reset</span>
                        </span>
                      ) : (
                        <span className="text-text-hint">No</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        u.isActive ? "bg-success-light text-success-dark" : "bg-danger-light text-danger-dark"
                      }`}>
                        {u.isActive ? "ACTIVE" : "SUSPENDED"}
                      </span>
                    </td>
                    <td className="table-cell text-right">
                      <button
                        onClick={() => handleToggleStatus(u._id)}
                        className={`p-1.5 rounded transition-colors ${
                          u.isActive
                            ? "text-success hover:bg-success-light"
                            : "text-danger hover:bg-danger-light"
                        }`}
                        title={u.isActive ? "Suspend Account" : "Activate Account"}
                      >
                        {u.isActive ? (
                          <IconToggleRight className="w-6 h-6" />
                        ) : (
                          <IconToggleLeft className="w-6 h-6" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-card shadow-dropdown max-w-md w-full overflow-hidden border border-border">
            <div className="px-6 py-4 bg-bg-subtle border-b border-border">
              <h3 className="font-bold text-text-primary">Create User Account</h3>
              <p className="text-[10px] text-text-hint mt-0.5">Admin-only panel to spawn officer, manager, or vendor roles.</p>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-hint">
                    <IconUser className="w-4.5 h-4.5" />
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. Rachel Green"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input pl-9 text-sm"
                    required
                    disabled={formLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-hint">
                    <IconMail className="w-4.5 h-4.5" />
                  </span>
                  <input
                    type="email"
                    placeholder="rachel@vendorbridge.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input pl-9 text-sm"
                    required
                    disabled={formLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                  System Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="input cursor-pointer text-sm"
                  disabled={formLoading}
                  required
                >
                  <option value="officer">Officer (RFQ Creator)</option>
                  <option value="manager">Manager (Publisher & Award Decider)</option>
                  <option value="vendor">Vendor (Quotations Bidder)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 border-t border-border pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-ghost px-4 py-2 text-xs"
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-5 py-2 text-xs font-semibold shadow-sm"
                  disabled={formLoading}
                >
                  {formLoading ? "Generating..." : "Generate User Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;
