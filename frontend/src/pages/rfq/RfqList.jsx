import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { IconPlus, IconSearch, IconFilter, IconCalendarClock } from "@tabler/icons-react";
import toast from "react-hot-toast";

const RfqList = () => {
  const { user } = useAuth();
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const fetchRfqs = async () => {
    try {
      setLoading(true);
      const response = await api.get("/rfq");
      setRfqs(response.data.allRFQs || []);
    } catch (error) {
      toast.error("Failed to load RFQs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRfqs();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case "draft":
        return <span className="badge-closed capitalize">Draft</span>;
      case "published":
        return <span className="badge-open capitalize">Published</span>;
      case "closed":
        return <span className="badge-pending capitalize">Closed</span>;
      case "awarded":
        return <span className="badge-approved capitalize">Awarded</span>;
      case "cancelled":
        return <span className="badge-rejected capitalize">Cancelled</span>;
      default:
        return <span className="badge-closed capitalize">{status}</span>;
    }
  };

  const filteredRfqs = rfqs.filter((rfq) => {
    const matchesSearch = rfq.rfqNumber?.toLowerCase().includes(search.toLowerCase()) ||
      rfq.category?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? rfq.status === statusFilter : true;
    const matchesCategory = categoryFilter ? rfq.category === categoryFilter : true;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Requests for Quotation (RFQs)</h1>
          <p className="text-text-muted text-xs">Review requirements sheets, deadlines, budgets, and bid sheets.</p>
        </div>
        {user.role === "officer" && (
          <Link to="/rfqs/create" className="btn-primary flex items-center gap-1.5 shadow-sm font-semibold">
            <IconPlus className="w-4.5 h-4.5" />
            <span>Draft RFQ</span>
          </Link>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="card grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-hint">
            <IconSearch className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search by RFQ # or category..."
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
            <option value="published">Published</option>
            <option value="closed">Closed</option>
            <option value="awarded">Awarded</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input cursor-pointer"
          >
            <option value="">All Categories</option>
            <option value="IT">IT</option>
            <option value="Office Supplies">Office Supplies</option>
            <option value="Logistics">Logistics</option>
            <option value="Manufacturing">Manufacturing</option>
            <option value="Services">Services</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* RFQ Grid/List */}
      <div className="card">
        {loading ? (
          <div className="py-20 text-center flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredRfqs.length === 0 ? (
          <div className="py-20 text-center text-text-muted space-y-2">
            <IconCalendarClock className="w-10 h-10 mx-auto text-text-hint" />
            <p className="font-semibold text-sm">No RFQs Found</p>
            <p className="text-xs">Try modifying your filters or search terms.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">RFQ Number</th>
                  <th className="table-header">Category</th>
                  <th className="table-header">Budget</th>
                  <th className="table-header">Deadline</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Bids Count</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRfqs.map((rfq) => {
                  const submittedBidsCount = rfq.vendors?.filter((v) => v.status === "submitted").length || 0;
                  const daysRemaining = Math.ceil((new Date(rfq.deadline) - new Date()) / (1000 * 60 * 60 * 24));

                  return (
                    <tr key={rfq._id} className="hover:bg-bg-subtle/50 transition-colors">
                      <td className="table-cell font-semibold text-primary">
                        <Link to={`/rfqs/${rfq._id}`}>{rfq.rfqNumber}</Link>
                      </td>
                      <td className="table-cell text-xs">{rfq.category}</td>
                      <td className="table-cell text-xs font-medium">
                        {rfq.budget !== undefined && rfq.budget !== null ? `$${rfq.budget.toLocaleString()}` : "N/A"}
                      </td>
                      <td className="table-cell text-xs">
                        <div className="flex flex-col">
                          <span>{new Date(rfq.deadline).toLocaleDateString()}</span>
                          {rfq.status === "published" && (
                            <span className={`text-[10px] mt-0.5 ${
                              daysRemaining < 0
                                ? "text-danger-dark font-medium"
                                : daysRemaining <= 3
                                ? "text-warning-dark font-medium"
                                : "text-text-hint"
                            }`}>
                              {daysRemaining < 0
                                ? "Expired"
                                : daysRemaining === 0
                                ? "Due today"
                                : `${daysRemaining} days left`}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="table-cell text-xs">{getStatusBadge(rfq.status)}</td>
                      <td className="table-cell text-xs font-semibold text-text-primary">
                        {submittedBidsCount} / {rfq.vendors?.length || 0}
                      </td>
                      <td className="table-cell text-right">
                        <Link
                          to={`/rfqs/${rfq._id}`}
                          className="btn-outline px-3 py-1 text-xs shadow-sm"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RfqList;
