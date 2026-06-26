import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import {
  IconArrowLeft,
  IconFileInvoice,
  IconDownload,
  IconCheck,
  IconBan,
  IconPrinter
} from "@tabler/icons-react";
import toast from "react-hot-toast";

const InvoiceDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/invoices/${id}`);
      setInvoice(response.data.invoice);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load Invoice details");
      navigate("/invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceDetails();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    setActionLoading(true);
    try {
      await api.patch(`/invoices/${id}/status`, { status: newStatus });
      toast.success(`Invoice status updated to ${newStatus}`);
      fetchInvoiceDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update Invoice status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      toast.loading("Generating PDF...", { id: "pdf-download" });
      const response = await api.get(`/invoices/${id}/pdf`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${invoice.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("PDF Downloaded", { id: "pdf-download" });
    } catch (error) {
      toast.error("Failed to download PDF", { id: "pdf-download" });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="py-20 text-center flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!invoice) return null;

  const isOfficerOrAdmin = ["officer", "manager", "admin"].includes(user.role);

  return (
    <div className="space-y-6 print:space-y-4 print:p-0">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link to="/invoices" className="btn-outline p-2 rounded-lg">
            <IconArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-text-primary">{invoice.invoiceNumber}</h1>
              <span className={`badge-${
                invoice.status === "unpaid"
                  ? "closed"
                  : invoice.status === "paid"
                  ? "approved"
                  : "rejected"
              } capitalize text-xs`}>
                {invoice.status}
              </span>
            </div>
            <p className="text-text-muted text-xs">
              Issued on {new Date(invoice.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPdf}
            className="btn-outline border-primary text-primary hover:bg-primary-light flex items-center gap-1.5 font-semibold"
          >
            <IconDownload className="w-4 h-4" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={handlePrint}
            className="btn-outline flex items-center gap-1.5 font-semibold text-text-primary"
          >
            <IconPrinter className="w-4 h-4" />
            <span>Print Invoice</span>
          </button>

          {invoice.status === "unpaid" && isOfficerOrAdmin && (
            <div className="flex gap-2">
              <button
                onClick={() => handleStatusChange("paid")}
                disabled={actionLoading}
                className="btn-primary bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5 font-semibold text-white"
              >
                <IconCheck className="w-4 h-4" />
                <span>Mark Paid</span>
              </button>
              <button
                onClick={() => handleStatusChange("void")}
                disabled={actionLoading}
                className="btn-primary bg-red-600 hover:bg-red-700 flex items-center gap-1.5 font-semibold text-white"
              >
                <IconBan className="w-4 h-4" />
                <span>Void Invoice</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Visual Print Header (Only visible on paper print) */}
      <div className="hidden print:block border-b border-border pb-4 mb-4">
        <h1 className="text-2xl font-bold text-primary">VendorBridge ERP - Invoice</h1>
        <p className="text-xs text-text-muted">Invoice No: {invoice.invoiceNumber} | Issued: {new Date(invoice.createdAt).toLocaleDateString()}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice Details & Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h3 className="text-sm font-semibold text-text-primary mb-4 pb-2 border-b border-border flex items-center gap-2">
              <IconFileInvoice className="w-5 h-5 text-primary" />
              <span>Billing Line Items</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-2.5 text-xs font-semibold text-text-muted uppercase">Item Description</th>
                    <th className="py-2.5 text-xs font-semibold text-text-muted uppercase text-center">Qty</th>
                    <th className="py-2.5 text-xs font-semibold text-text-muted uppercase text-center">Unit</th>
                    <th className="py-2.5 text-xs font-semibold text-text-muted uppercase text-right">Price/Unit</th>
                    <th className="py-2.5 text-xs font-semibold text-text-muted uppercase text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {invoice.items.map((item, index) => (
                    <tr key={index}>
                      <td className="py-3 text-xs text-text-primary font-medium">{item.name}</td>
                      <td className="py-3 text-xs text-text-primary text-center">{item.quantity}</td>
                      <td className="py-3 text-xs text-text-muted text-center">{item.unit}</td>
                      <td className="py-3 text-xs text-text-primary text-right">${item.pricePerUnit?.toLocaleString()}</td>
                      <td className="py-3 text-xs font-semibold text-text-primary text-right">${item.totalPrice?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 pt-4 border-t border-border flex justify-end">
              <div className="w-72 space-y-2.5 text-xs">
                <div className="flex justify-between text-text-muted">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-text-primary">${invoice.subTotal?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span>GST Tax ({invoice.taxPercentage}%):</span>
                  <span className="font-semibold text-text-primary">${invoice.taxAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-text-primary pt-2.5 border-t border-border/80">
                  <span>Grand Total:</span>
                  <span className="text-primary">${invoice.grandTotal?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vendor Info & Timeline */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-sm font-semibold text-text-primary mb-4 pb-2 border-b border-border">
              Vendor Information
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="block font-semibold text-text-primary">Company Name</span>
                <span className="text-text-muted">{invoice.vendorId?.companyName || "N/A"}</span>
              </div>
              <div>
                <span className="block font-semibold text-text-primary">Contact Person</span>
                <span className="text-text-muted">{invoice.vendorId?.contactPerson || "N/A"}</span>
              </div>
              {invoice.vendorId?.phone && (
                <div>
                  <span className="block font-semibold text-text-primary">Phone</span>
                  <span className="text-text-muted">{invoice.vendorId.phone}</span>
                </div>
              )}
              {invoice.vendorId?.address && (
                <div>
                  <span className="block font-semibold text-text-primary">Address</span>
                  <span className="text-text-muted">
                    {invoice.vendorId.address.street}, {invoice.vendorId.address.city}, {invoice.vendorId.address.state} {invoice.vendorId.address.pincode}
                  </span>
                </div>
              )}
              {invoice.vendorId?.bankDetails && (
                <div>
                  <span className="block font-semibold text-text-primary">Bank Remittance Instructions</span>
                  <pre className="text-text-muted font-sans whitespace-pre-wrap leading-relaxed text-xs">
                    {`${invoice.vendorId.bankDetails.street || ""}, ${invoice.vendorId.bankDetails.city || ""}, ${invoice.vendorId.bankDetails.state || ""} ${invoice.vendorId.bankDetails.pincode || ""} ${invoice.vendorId.bankDetails.country || "India"}`}
                  </pre>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold text-text-primary mb-4 pb-2 border-b border-border">
              Metadata
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="block font-semibold text-text-primary">Associated Purchase Order</span>
                {invoice.poId ? (
                  <Link to={`/purchase-orders/${invoice.poId._id}`} className="text-primary hover:underline font-semibold">
                    {invoice.poId.poNumber}
                  </Link>
                ) : (
                  <span className="text-text-muted">N/A</span>
                )}
              </div>
              <div>
                <span className="block font-semibold text-text-primary font-medium text-danger">Due Date</span>
                <span className="font-semibold text-danger-dark">
                  {new Date(invoice.dueDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="block font-semibold text-text-primary">Created By</span>
                <span className="text-text-muted">
                  {invoice.createdBy?.name || "System"} ({invoice.createdBy?.email || ""})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetails;
