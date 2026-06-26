import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import {
  IconUsers,
  IconBuildingStore,
  IconFileSpreadsheet,
  IconHistory,
  IconPlus,
  IconArrowUpRight
} from "@tabler/icons-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [additionalData, setAdditionalData] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        if (user.role === "admin") {
          const [usersRes, vendorsRes, logsRes] = await Promise.all([
            api.get("/users"),
            api.get("/vendors"),
            api.get("/audit-logs"),
          ]);
          setStats({
            usersCount: usersRes.data.staff?.length || 0,
            vendorsCount: vendorsRes.data?.length || 0,
            recentLogs: logsRes.data?.logs?.slice(0, 5) || [],
          });
        } else if (["officer", "manager"].includes(user.role)) {
          const [statusRes, perfRes, rfqRes] = await Promise.all([
            api.get("/dashboard/rfq-status"),
            api.get("/dashboard/vendor-performance"),
            api.get("/rfq"),
          ]);
          setStats({
            statusCounts: statusRes.data.statusCounts || {},
            performance: perfRes.data.vendorProfile || [],
            totalRfqs: rfqRes.data.allRFQs?.length || 0,
            recentRfqs: rfqRes.data.allRFQs?.slice(0, 5) || [],
          });
        } else if (user.role === "vendor") {
          // Vendors see RFQs they are invited to
          const rfqRes = await api.get("/rfq");
          const rfqs = rfqRes.data.allRFQs || [];
          // In the controller, getRFQById checks access.
          // Let's filter invited/submitted RFQs manually for dashboard statistics if needed, or query quotations
          // We can fetch vendor's profile to understand their status
          let vendorProfile = null;
          try {
            // Find vendor using me endpoint
            const meRes = await api.get("/auth/me");
            if (meRes.data.user?.vendorProfile) {
              const vendorRes = await api.get(`/vendors/${meRes.data.user.vendorProfile}`);
              vendorProfile = vendorRes.data.vendorDetails;
            }
          } catch (e) {
            console.error(e);
          }

          setStats({
            invitedCount: rfqs.length,
            submittedCount: rfqs.filter((r) =>
              r.vendors?.some((v) => v.vendor === vendorProfile?._id && v.status === "submitted")
            ).length,
            vendorProfile,
            invitedRfqs: rfqs.slice(0, 5),
          });
        }
      } catch (error) {
        console.error("Error loading dashboard details", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }
  if (!stats) {
    return (
      <div className="card text-center p-8 max-w-md mx-auto space-y-3 mt-10">
        <div className="w-12 h-12 bg-danger-light text-danger rounded-full flex items-center justify-center mx-auto">
          <IconHistory className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-text-primary text-base">Dashboard Error</h3>
        <p className="text-xs text-text-muted">
          Failed to load dashboard statistics. Please check your backend connection.
        </p>
        <button onClick={() => window.location.reload()} className="btn-outline px-4 py-2 mt-2 text-xs">
          Retry Connection
        </button>
      </div>
    );
  }

  // --- RENDERS ---

  // Admin Dashboard
  if (user.role === "admin") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">System Administrator Console</h1>
          <p className="text-text-muted text-xs">Manage system access, vendors, and view audit trails.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-text-muted uppercase">Staff Accounts</span>
              <h3 className="text-3xl font-bold text-text-primary mt-1">{stats.usersCount}</h3>
            </div>
            <div className="p-3 bg-primary-light text-primary rounded-xl">
              <IconUsers className="w-6 h-6" />
            </div>
          </div>

          <div className="card flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-text-muted uppercase">Registered Vendors</span>
              <h3 className="text-3xl font-bold text-text-primary mt-1">{stats.vendorsCount}</h3>
            </div>
            <div className="p-3 bg-success-light text-success-dark rounded-xl">
              <IconBuildingStore className="w-6 h-6" />
            </div>
          </div>

          <div className="card flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-text-muted uppercase">Audit Log Count</span>
              <h3 className="text-3xl font-bold text-text-primary mt-1">{stats.recentLogs.length}</h3>
            </div>
            <div className="p-3 bg-warning-light text-warning-dark rounded-xl">
              <IconHistory className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="card lg:col-span-1 space-y-4">
            <h3 className="font-semibold text-text-primary text-sm border-b border-border pb-2">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                to="/users"
                className="flex items-center justify-between p-3 bg-bg-subtle hover:bg-primary-light/35 rounded-lg text-sm text-text-primary font-medium transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <IconPlus className="w-4 h-4 text-primary" />
                  <span>Create Staff Account</span>
                </div>
                <IconArrowUpRight className="w-4 h-4 text-text-hint" />
              </Link>

              <Link
                to="/vendors"
                className="flex items-center justify-between p-3 bg-bg-subtle hover:bg-success-light/30 rounded-lg text-sm text-text-primary font-medium transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <IconPlus className="w-4 h-4 text-success" />
                  <span>Register New Vendor</span>
                </div>
                <IconArrowUpRight className="w-4 h-4 text-text-hint" />
              </Link>
            </div>
          </div>

          {/* Audit Logs */}
          <div className="card lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <h3 className="font-semibold text-text-primary text-sm">System Operations Log</h3>
              <Link to="/audit-logs" className="text-primary text-xs font-medium hover:underline">
                View all logs
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header text-[10px]">Actor</th>
                    <th className="table-header text-[10px]">Action</th>
                    <th className="table-header text-[10px]">Value Change</th>
                    <th className="table-header text-[10px]">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stats.recentLogs.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-4 text-text-muted text-xs">
                        No recent operations logs
                      </td>
                    </tr>
                  ) : (
                    stats.recentLogs.map((log) => (
                      <tr key={log._id}>
                        <td className="table-cell text-xs font-medium">
                          {log.performedBy?.name || "System"}{" "}
                          <span className="text-[10px] text-text-muted">({log.performedByRole})</span>
                        </td>
                        <td className="table-cell text-xs">{log.action}</td>
                        <td className="table-cell text-xs">
                          {log.oldValue && (
                            <span className="text-danger line-through mr-1.5">{log.oldValue}</span>
                          )}
                          <span className="text-success font-medium">{log.newValue}</span>
                        </td>
                        <td className="table-cell text-xs text-text-muted">
                          {new Date(log.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Officer / Manager Dashboard
  if (["officer", "manager"].includes(user.role)) {
    // Prep data for Recharts
    const chartData = stats.performance.map((vendor) => ({
      name: vendor.vendorInfo?.companyName || "Unknown",
      Total: vendor.totalQuotation,
      Awarded: vendor.acceptedCount,
    }));

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary capitalize">{user.role} Dashboard</h1>
            <p className="text-text-muted text-xs">RFQs management overview and vendor engagement stats.</p>
          </div>
          {user.role === "officer" && (
            <Link to="/rfqs" className="btn-primary flex items-center gap-1.5 shadow-sm font-semibold">
              <IconPlus className="w-4 h-4" />
              <span>Create RFQ</span>
            </Link>
          )}
        </div>

        {/* Counters */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="card p-4">
            <span className="text-[10px] font-semibold text-text-hint uppercase tracking-wider">Draft</span>
            <p className="text-2xl font-bold text-text-primary mt-1">{stats.statusCounts.draft || 0}</p>
          </div>
          <div className="card p-4">
            <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">Published</span>
            <p className="text-2xl font-bold text-primary mt-1">{stats.statusCounts.published || 0}</p>
          </div>
          <div className="card p-4">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Closed</span>
            <p className="text-2xl font-bold text-text-muted mt-1">{stats.statusCounts.closed || 0}</p>
          </div>
          <div className="card p-4">
            <span className="text-[10px] font-semibold text-success-dark uppercase tracking-wider">Awarded</span>
            <p className="text-2xl font-bold text-success-dark mt-1">{stats.statusCounts.awarded || 0}</p>
          </div>
          <div className="card p-4">
            <span className="text-[10px] font-semibold text-danger uppercase tracking-wider">Cancelled</span>
            <p className="text-2xl font-bold text-danger mt-1">{stats.statusCounts.cancelled || 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent RFQs */}
          <div className="card lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <h3 className="font-semibold text-text-primary text-sm">Recent Requests for Quotation (RFQs)</h3>
              <Link to="/rfqs" className="text-primary text-xs font-medium hover:underline">
                View all RFQs
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header text-[10px]">RFQ #</th>
                    <th className="table-header text-[10px]">Category</th>
                    <th className="table-header text-[10px]">Deadline</th>
                    <th className="table-header text-[10px]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stats.recentRfqs.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-4 text-text-muted text-xs">
                        No RFQs found
                      </td>
                    </tr>
                  ) : (
                    stats.recentRfqs.map((rfq) => (
                      <tr key={rfq._id}>
                        <td className="table-cell text-xs font-semibold text-primary">
                          <Link to={`/rfqs/${rfq._id}`}>{rfq.rfqNumber}</Link>
                        </td>
                        <td className="table-cell text-xs">{rfq.category}</td>
                        <td className="table-cell text-xs">
                          {new Date(rfq.deadline).toLocaleDateString()}
                        </td>
                        <td className="table-cell text-xs">
                          <span className={`badge-${rfq.status}`}>{rfq.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recharts chart */}
          <div className="card lg:col-span-1 space-y-4 flex flex-col justify-between">
            <h3 className="font-semibold text-text-primary text-sm border-b border-border pb-2">Vendor Bidding Ratios</h3>
            {chartData.length === 0 ? (
              <div className="text-center py-10 text-text-muted text-xs">No vendor bidding data yet.</div>
            ) : (
              <div className="w-full h-64 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    <Bar dataKey="Total" fill="#534AB7" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Awarded" fill="#1D9E75" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="flex gap-4 justify-center text-xs mt-2 border-t border-border pt-2 text-text-muted">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-primary rounded-sm"></div>
                <span>Total Quotations</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-success rounded-sm"></div>
                <span>Accepted (Awarded)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vendor Dashboard
  if (user.role === "vendor") {
    const profile = stats.vendorProfile;

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Welcome, {profile?.companyName || user.name}</h1>
          <p className="text-text-muted text-xs">Manage bidding requests, edit pricing sheets, and review invitation panels.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card flex items-center justify-between p-6">
            <div>
              <span className="text-xs font-semibold text-text-muted uppercase">Invited RFQs</span>
              <h3 className="text-3xl font-bold text-primary mt-1">{stats.invitedCount}</h3>
            </div>
            <div className="p-3 bg-primary-light text-primary rounded-xl">
              <IconFileSpreadsheet className="w-6 h-6" />
            </div>
          </div>

          <div className="card flex items-center justify-between p-6">
            <div>
              <span className="text-xs font-semibold text-text-muted uppercase">Quotations Submitted</span>
              <h3 className="text-3xl font-bold text-success-dark mt-1">{stats.submittedCount}</h3>
            </div>
            <div className="p-3 bg-success-light text-success-dark rounded-xl">
              <IconFileSpreadsheet className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Invited RFQs List */}
          <div className="card lg:col-span-2 space-y-4">
            <h3 className="font-semibold text-text-primary text-sm border-b border-border pb-2">
              Recent RFQ Invitations
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header text-[10px]">RFQ #</th>
                    <th className="table-header text-[10px]">Category</th>
                    <th className="table-header text-[10px]">Deadline</th>
                    <th className="table-header text-[10px]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stats.invitedRfqs.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-4 text-text-muted text-xs">
                        No invitations found
                      </td>
                    </tr>
                  ) : (
                    stats.invitedRfqs.map((rfq) => (
                      <tr key={rfq._id}>
                        <td className="table-cell text-xs font-semibold text-primary">
                          <Link to={`/rfqs/${rfq._id}`}>{rfq.rfqNumber}</Link>
                        </td>
                        <td className="table-cell text-xs">{rfq.category}</td>
                        <td className="table-cell text-xs">
                          {new Date(rfq.deadline).toLocaleDateString()}
                        </td>
                        <td className="table-cell text-xs">
                          <Link to={`/rfqs/${rfq._id}`} className="btn-outline px-2.5 py-1 text-xs">
                            View RFQ
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Profile Overview */}
          <div className="card lg:col-span-1 space-y-4">
            <h3 className="font-semibold text-text-primary text-sm border-b border-border pb-2">Company Status</h3>
            <div className="space-y-3">
              <div>
                <span className="text-[10px] text-text-muted block">Company Status</span>
                <span className={`inline-block mt-1 text-xs px-2.5 py-0.5 rounded font-semibold capitalize ${
                  profile?.status === "active"
                    ? "bg-success-light text-success-dark"
                    : profile?.status === "inactive"
                    ? "bg-warning-light text-warning-dark"
                    : "bg-danger-light text-danger-dark"
                }`}>
                  {profile?.status || "active"}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-text-muted block">GSTIN Register Number</span>
                <span className="text-xs font-medium text-text-primary">{profile?.gstin || "Not Uploaded"}</span>
              </div>

              <div>
                <span className="text-[10px] text-text-muted block">Contact Email</span>
                <span className="text-xs font-medium text-text-primary">{user.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Dashboard;
