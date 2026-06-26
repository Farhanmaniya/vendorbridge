import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import {
  IconArrowLeft,
  IconReceipt,
  IconTruckDelivery,
  IconCheck,
  IconSend,
  IconFileInvoice
} from "@tabler/icons-react";
import toast from "react-hot-toast";

const PoDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPoDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/purchase-orders/${id}`);
      setPo(response.data.po);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load Purchase Order details");
      navigate("/purchase-orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoDetails();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    setActionLoading(true);
    try {
      await api.patch(`/purchase-orders/${id}/status`, { status: newStatus });
      toast.success(`Purchase Order status updated to ${newStatus}`);
      fetchPoDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update Purchase Order status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateInvoice = async () => {
    setActionLoading(true);
    try {
      const response = await api.post("/invoices", { poId: po._id });
      toast.success("Invoice generated successfully and emailed to Vendor!");
      navigate(`/invoices/${response.data.invoice._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to generate Invoice");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!po) return null;

  const isOfficerOrAdmin = ["officer", "admin"].includes(user.role);
  const isVendor = user.role === "vendor";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Link to="/purchase-orders" className="btn-outline p-2 rounded-lg">
            <IconArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-text-primary">{po.poNumber}</h1>
              <span className={`badge-${
                po.status === "draft"
                  ? "closed"
                  : po.status === "sent"
                  ? "open"
                  : po.status === "confirmed"
                  ? "approved"
                  : "pending"
              } capitalize text-xs`}>
                {po.status}
              </span>
            </div>
            <p className="text-text-muted text-xs">
              Issued on {new Date(po.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {po.status === "draft" && isOfficerOrAdmin && (
            <button
              onClick={() => handleStatusChange("sent")}
              disabled={actionLoading}
              className="btn-primary flex items-center gap-1.5 font-semibold"
            >
              <IconSend className="w-4 h-4" />
              <span>Send PO to Vendor</span>
            </button>
          )}

          {po.status === "sent" && isVendor && (
            <button
              onClick={() => handleStatusChange("confirmed")}
              disabled={actionLoading}
              className="btn-primary bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5 font-semibold text-white"
            >
              <IconCheck className="w-4 h-4" />
              <span>Confirm Purchase Order</span>
            </button>
          )}

          {po.status === "confirmed" && isOfficerOrAdmin && (
            <div className="flex gap-2">
              <button
                onClick={() => handleStatusChange("delivered")}
                disabled={actionLoading}
                className="btn-primary bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1.5 font-semibold text-white"
              >
                <IconTruckDelivery className="w-4 h-4" />
                <span>Mark as Delivered</span>
              </button>
              <button
                onClick={handleGenerateInvoice}
                disabled={actionLoading}
                className="btn-outline border-primary text-primary hover:bg-primary-light flex items-center gap-1.5 font-semibold"
              >
                <IconFileInvoice className="w-4 h-4" />
                <span>Generate & Email Invoice</span>
              </button>
            </div>
          )}

          {po.status === "delivered" && isOfficerOrAdmin && (
            <button
              onClick={handleGenerateInvoice}
              disabled={actionLoading}
              className="btn-primary flex items-center gap-1.5 font-semibold"
            >
              <IconFileInvoice className="w-4 h-4" />
              <span>Generate & Email Invoice</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PO Details & Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h3 className="text-sm font-semibold text-text-primary mb-4 pb-2 border-b border-border flex items-center gap-2">
              <IconReceipt className="w-5 h-5 text-primary" />
              <span>Order Details</span>
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
                  {po.items.map((item, index) => (
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
              <div className="w-64 space-y-2 text-xs">
                <div className="flex justify-between font-bold text-sm text-text-primary pt-2 border-t border-border/80">
                  <span>Grand Total:</span>
                  <span className="text-primary">${po.grandTotal?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vendor & Metadata */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-sm font-semibold text-text-primary mb-4 pb-2 border-b border-border">
              Vendor Information
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="block font-semibold text-text-primary">Company Name</span>
                <span className="text-text-muted">{po.vendorId?.companyName || "N/A"}</span>
              </div>
              <div>
                <span className="block font-semibold text-text-primary">Contact Person</span>
                <span className="text-text-muted">{po.vendorId?.contactPerson || "N/A"}</span>
              </div>
              {po.vendorId?.phone && (
                <div>
                  <span className="block font-semibold text-text-primary">Phone</span>
                  <span className="text-text-muted">{po.vendorId.phone}</span>
                </div>
              )}
              {po.vendorId?.address && (
                <div>
                  <span className="block font-semibold text-text-primary">Address</span>
                  <span className="text-text-muted">
                    {po.vendorId.address.street || ""}, {po.vendorId.address.city || ""}, {po.vendorId.address.state || ""} {po.vendorId.address.pincode || ""}
                  </span>
                </div>
              )}
              {po.vendorId?.bankDetails && (
                <div>
                  <span className="block font-semibold text-text-primary">Bank Details</span>
                  <pre className="text-text-muted font-sans whitespace-pre-wrap leading-relaxed text-xs">
                    {`${po.vendorId.bankDetails.street || ""}, ${po.vendorId.bankDetails.city || ""}, ${po.vendorId.bankDetails.state || ""} ${po.vendorId.bankDetails.pincode || ""} ${po.vendorId.bankDetails.country || "India"}`}
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
                <span className="block font-semibold text-text-primary">Associated RFQ</span>
                {po.rfqId ? (
                  <Link to={`/rfqs/${po.rfqId._id}`} className="text-primary hover:underline font-semibold">
                    {po.rfqId.rfqNumber}
                  </Link>
                ) : (
                  <span className="text-text-muted">N/A</span>
                )}
              </div>
              <div>
                <span className="block font-semibold text-text-primary">Created By</span>
                <span className="text-text-muted">
                  {po.createdBy?.name || "System"} ({po.createdBy?.email || ""})
                </span>
              </div>
              <div>
                <span className="block font-semibold text-text-primary">Status Timeline</span>
                <div className="mt-2 pl-2 border-l border-primary/30 space-y-2">
                  <div className="relative">
                    <span className="absolute -left-[13px] top-1 w-2.5 h-2.5 rounded-full bg-primary"></span>
                    <span className="block font-semibold text-text-primary">Draft Created</span>
                    <span className="text-[10px] text-text-hint">{new Date(po.createdAt).toLocaleString()}</span>
                  </div>
                  {po.status !== "draft" && (
                    <div className="relative">
                      <span className="absolute -left-[13px] top-1 w-2.5 h-2.5 rounded-full bg-primary"></span>
                      <span className="block font-semibold text-text-primary">PO Sent / Confirmed</span>
                      <span className="text-[10px] text-text-hint">{new Date(po.updatedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoDetails;
