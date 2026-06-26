import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { IconSearch, IconReceipt, IconClipboardCheck } from "@tabler/icons-react";
import toast from "react-hot-toast";

const PoList = () => {
  const { user } = useAuth();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchPOs = async () => {
    try {
      setLoading(true);
      const response = await api.get("/purchase-orders");
      setPurchaseOrders(response.data.purchaseOrders || []);
    } catch (error) {
      toast.error("Failed to load Purchase Orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPOs();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case "draft":
        return <span className="badge-closed capitalize">Draft</span>;
      case "sent":
        return <span className="badge-open capitalize">Sent</span>;
      case "confirmed":
        return <span className="badge-approved capitalize">Confirmed</span>;
      case "delivered":
        return <span className="badge-pending capitalize">Delivered</span>;
      default:
        return <span className="badge-closed capitalize">{status}</span>;
    }
  };

  const filteredPOs = purchaseOrders.filter((po) => {
    const matchesSearch =
      po.poNumber?.toLowerCase().includes(search.toLowerCase()) ||
      po.rfqId?.rfqNumber?.toLowerCase().includes(search.toLowerCase()) ||
      po.vendorId?.companyName?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? po.status === statusFilter : true;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Purchase Orders (PO)</h1>
          <p className="text-text-muted text-xs">
            {user.role === "vendor"
              ? "Track, confirm, and manage purchase orders issued to your company."
              : "Generate, dispatch, and track orders from accepted quotations."}
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-hint">
            <IconSearch className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search by PO #, RFQ #, or Vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="confirmed">Confirmed</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>
      </div>

      {/* PO Grid/List */}
      <div className="card">
        {loading ? (
          <div className="py-20 text-center flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredPOs.length === 0 ? (
          <div className="py-20 text-center text-text-muted space-y-2">
            <IconReceipt className="w-10 h-10 mx-auto text-text-hint" />
            <p className="font-semibold text-sm">No Purchase Orders Found</p>
            <p className="text-xs">Try modifying your filters or search terms.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">PO Number</th>
                  <th className="table-header">RFQ Ref</th>
                  {user.role !== "vendor" && <th className="table-header">Vendor</th>}
                  <th className="table-header">Grand Total</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Date Issued</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPOs.map((po) => (
                  <tr key={po._id} className="hover:bg-bg-subtle/50 transition-colors">
                    <td className="table-cell font-semibold text-primary">
                      <Link to={`/purchase-orders/${po._id}`}>{po.poNumber}</Link>
                    </td>
                    <td className="table-cell text-xs font-medium">
                      {po.rfqId ? (
                        <Link to={`/rfqs/${po.rfqId._id}`} className="hover:underline text-text-primary">
                          {po.rfqId.rfqNumber}
                        </Link>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    {user.role !== "vendor" && (
                      <td className="table-cell text-xs font-medium">
                        {po.vendorId?.companyName || "N/A"}
                      </td>
                    )}
                    <td className="table-cell text-xs font-semibold">
                      ${po.grandTotal?.toLocaleString()}
                    </td>
                    <td className="table-cell text-xs">{getStatusBadge(po.status)}</td>
                    <td className="table-cell text-xs text-text-muted">
                      {new Date(po.createdAt).toLocaleDateString()}
                    </td>
                    <td className="table-cell text-right">
                      <Link
                        to={`/purchase-orders/${po._id}`}
                        className="btn-outline px-3 py-1 text-xs shadow-sm"
                      >
                        Details
                      </Link>
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

export default PoList;
