import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { IconSearch, IconFileInvoice, IconCreditCard } from "@tabler/icons-react";
import toast from "react-hot-toast";

const InvoiceList = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await api.get("/invoices");
      setInvoices(response.data.invoices || []);
    } catch (error) {
      toast.error("Failed to load Invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case "unpaid":
        return <span className="badge-closed capitalize">Unpaid</span>;
      case "paid":
        return <span className="badge-approved capitalize">Paid</span>;
      case "void":
        return <span className="badge-rejected capitalize">Voided</span>;
      default:
        return <span className="badge-closed capitalize">{status}</span>;
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      inv.poId?.poNumber?.toLowerCase().includes(search.toLowerCase()) ||
      inv.vendorId?.companyName?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? inv.status === statusFilter : true;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Invoices</h1>
          <p className="text-text-muted text-xs">
            {user.role === "vendor"
              ? "View and download tax invoices issued to your organization."
              : "Review vendor billing, GST calculations, and remit payments."}
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
            placeholder="Search by Invoice #, PO #, or Vendor..."
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
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
            <option value="void">Void</option>
          </select>
        </div>
      </div>

      {/* Invoice List Table */}
      <div className="card">
        {loading ? (
          <div className="py-20 text-center flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="py-20 text-center text-text-muted space-y-2">
            <IconFileInvoice className="w-10 h-10 mx-auto text-text-hint" />
            <p className="font-semibold text-sm">No Invoices Found</p>
            <p className="text-xs">Try modifying your filters or search terms.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Invoice Number</th>
                  <th className="table-header">PO Ref</th>
                  {user.role !== "vendor" && <th className="table-header">Vendor</th>}
                  <th className="table-header">Tax (18% GST)</th>
                  <th className="table-header">Grand Total</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Due Date</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredInvoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-bg-subtle/50 transition-colors">
                    <td className="table-cell font-semibold text-primary">
                      <Link to={`/invoices/${inv._id}`}>{inv.invoiceNumber}</Link>
                    </td>
                    <td className="table-cell text-xs font-medium">
                      {inv.poId ? (
                        <Link to={`/purchase-orders/${inv.poId._id}`} className="hover:underline text-text-primary">
                          {inv.poId.poNumber}
                        </Link>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    {user.role !== "vendor" && (
                      <td className="table-cell text-xs font-medium">
                        {inv.vendorId?.companyName || "N/A"}
                      </td>
                    )}
                    <td className="table-cell text-xs text-text-muted">
                      ${inv.taxAmount?.toLocaleString()}
                    </td>
                    <td className="table-cell text-xs font-semibold text-text-primary">
                      ${inv.grandTotal?.toLocaleString()}
                    </td>
                    <td className="table-cell text-xs">{getStatusBadge(inv.status)}</td>
                    <td className="table-cell text-xs text-text-muted">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td className="table-cell text-right">
                      <Link
                        to={`/invoices/${inv._id}`}
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

export default InvoiceList;
