import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { IconHistory, IconSearch, IconUser } from "@tabler/icons-react";
import toast from "react-hot-toast";

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get("/audit-logs");
      setLogs(response.data.logs || []);
    } catch (error) {
      toast.error("Failed to load audit trails");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const term = search.toLowerCase();
    return (
      log.action?.toLowerCase().includes(term) ||
      log.performedBy?.name?.toLowerCase().includes(term) ||
      log.performedByRole?.toLowerCase().includes(term) ||
      log.relatedModel?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">System Audit Trail</h1>
          <p className="text-text-muted text-xs">Observe all corporate changes, role overrides, vendor status changes, and RFQ awards.</p>
        </div>
      </div>

      {/* Toolbar Search */}
      <div className="card max-w-md">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-hint">
            <IconSearch className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search logs by actor, action or resource..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="card">
        {loading ? (
          <div className="py-20 text-center flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-20 text-center text-text-hint text-xs">No audit logs match search parameters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Date & Time</th>
                  <th className="table-header">System Actor</th>
                  <th className="table-header">Action Executed</th>
                  <th className="table-header">Resource</th>
                  <th className="table-header">Old Value</th>
                  <th className="table-header">New Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {filteredLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-bg-subtle/50 transition-colors">
                    <td className="table-cell text-text-muted font-mono leading-relaxed">
                      {new Date(log.createdAt).toLocaleDateString()}
                      <br />
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </td>
                    <td className="table-cell">
                      <div className="flex flex-col">
                        <span className="font-semibold text-text-primary flex items-center gap-1">
                          <IconUser className="w-3.5 h-3.5 text-text-hint" />
                          {log.performedBy?.name || "System"}
                        </span>
                        <span className="text-[9px] text-text-muted capitalize">Role: {log.performedByRole}</span>
                      </div>
                    </td>
                    <td className="table-cell font-medium text-text-primary">{log.action}</td>
                    <td className="table-cell font-mono text-[10px] text-text-muted">
                      {log.relatedModel}
                      <br />
                      <span className="text-[9px] text-text-hint">{log.relatedId?.rfqNumber || log.relatedId?.companyName || log.relatedId?._id || log.relatedId}</span>
                    </td>
                    <td className="table-cell text-danger font-medium line-through">
                      {log.oldValue !== undefined && log.oldValue !== null ? String(log.oldValue) : "-"}
                    </td>
                    <td className="table-cell text-success font-bold">
                      {log.newValue !== undefined && log.newValue !== null ? String(log.newValue) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
