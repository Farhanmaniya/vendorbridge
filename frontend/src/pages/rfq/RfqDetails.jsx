import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import {
  IconFileText,
  IconArrowLeft,
  IconCalendar,
  IconClock,
  IconUser,
  IconCategory,
  IconDownload,
  IconTrash,
  IconPlus,
  IconCheck,
  IconEye,
  IconAlertCircle
} from "@tabler/icons-react";
import toast from "react-hot-toast";

const RfqDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [rfq, setRfq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quotations, setQuotations] = useState([]);
  const [activeQuotation, setActiveQuotation] = useState(null);
  const [showBidModal, setShowBidModal] = useState(false);

  // Attachment Form
  const [attachLabel, setAttachLabel] = useState("");
  const [attachLoading, setAttachLoading] = useState(false);

  const fetchRfqDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/rfq/${id}`);
      setRfq(response.data.rfqs);

      // If user is Staff (officer/manager), and RFQ is published, closed or awarded, fetch submissions
      if (["admin", "officer", "manager"].includes(user.role)) {
        try {
          const qResponse = await api.get(`/quotations/rfq/${id}`);
          setQuotations(qResponse.data.quotations || []);
        } catch (e) {
          // If no quotations are found, API returns 404 with "Quotation Not Found", which is fine
          setQuotations([]);
        }
      }
    } catch (error) {
      toast.error("Failed to load RFQ details");
      navigate("/rfqs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRfqDetails();
  }, [id]);

  // Transition RFQ Status
  const handleTransitionStatus = async (newStatus) => {
    try {
      await api.patch(`/rfq/${id}/status`, { status: newStatus });
      toast.success(`RFQ transitioned to ${newStatus}`);
      fetchRfqDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update RFQ status");
    }
  };

  // Upload Attachment (Simulated uploading + backend registration)
  const handleAddAttachment = async (e) => {
    e.preventDefault();
    if (!attachLabel.trim()) return toast.error("Please enter a document label");

    setAttachLoading(true);
    try {
      // Simulate file upload generating a mockup URL
      const mockUrl = `https://cloudinary.com/vendorbridge/attachments/${Date.now()}_${attachLabel.toLowerCase().replace(/\s+/g, "_")}.pdf`;
      
      await api.post(`/rfq/${id}/attachments`, {
        label: attachLabel.trim(),
        url: mockUrl,
      });

      toast.success("Attachment added successfully");
      setAttachLabel("");
      fetchRfqDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add attachment");
    } finally {
      setAttachLoading(false);
    }
  };

  // Delete Attachment
  const handleDeleteAttachment = async (attachmentId) => {
    try {
      await api.delete(`/rfq/${id}/attachments/${attachmentId}`);
      toast.success("Attachment removed");
      fetchRfqDetails();
    } catch (error) {
      toast.error("Failed to delete attachment");
    }
  };

  // Award RFQ / Accept Bid (Manager only)
  const handleAwardQuotation = async (quotationId) => {
    if (!window.confirm("Are you sure you want to award this RFQ to this bidder? This will reject all other bids and close submissions.")) return;

    try {
      await api.patch(`/quotations/${quotationId}/status`, { status: "accepted" });
      toast.success("RFQ awarded successfully!");
      setShowBidModal(false);
      fetchRfqDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to award quotation");
    }
  };

  if (loading || !rfq) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  const daysRemaining = Math.ceil((new Date(rfq.deadline) - new Date()) / (1000 * 60 * 60 * 24));
  const isVendor = user.role === "vendor";
  const myInvitation = rfq.vendors?.find((v) => v.vendor?._id === user.vendorProfile || v.vendor === user.vendorProfile);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link to="/rfqs" className="p-2 text-text-muted hover:bg-white rounded-lg transition-colors border border-transparent hover:border-border">
            <IconArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-text-primary">{rfq.rfqNumber}</h1>
              <span className={`badge-${rfq.status} capitalize`}>{rfq.status}</span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">Created on {new Date(rfq.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex gap-2">
          {/* Officer Edits */}
          {user.role === "officer" && rfq.status === "draft" && (
            <Link to={`/rfqs/${id}/edit`} className="btn-outline px-4 py-2 text-sm shadow-sm">
              Modify Draft
            </Link>
          )}

          {/* Manager Publishes */}
          {user.role === "manager" && rfq.status === "draft" && (
            <button
              onClick={() => handleTransitionStatus("published")}
              className="btn-primary px-5 py-2 text-sm shadow-sm font-semibold flex items-center gap-1.5"
            >
              <IconCheck className="w-4 h-4" />
              <span>Approve & Publish RFQ</span>
            </button>
          )}

          {/* Officer Closes */}
          {user.role === "officer" && rfq.status === "published" && (
            <button
              onClick={() => handleTransitionStatus("closed")}
              className="btn-danger px-5 py-2 text-sm shadow-sm font-semibold"
            >
              Close RFQ Bidding
            </button>
          )}

          {/* Manager Cancels */}
          {["officer", "manager"].includes(user.role) && ["draft", "published", "closed"].includes(rfq.status) && (
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to cancel this RFQ? This action is permanent.")) {
                  handleTransitionStatus("cancelled");
                }
              }}
              className="btn-ghost px-4 py-2 text-sm hover:bg-danger-light hover:text-danger-dark border border-border"
            >
              Cancel RFQ
            </button>
          )}

          {/* Vendor Submit Bid */}
          {isVendor && rfq.status === "published" && myInvitation && (
            <Link
              to={`/rfqs/${id}/bid`}
              className="btn-primary px-5 py-2 text-sm font-semibold shadow-sm flex items-center gap-1.5"
            >
              <IconPlus className="w-4 h-4" />
              <span>{myInvitation.status === "submitted" ? "Revise Bid Quotation" : "Submit Bid Quotation"}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Metadata & Line Items */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Metadata */}
          <div className="card grid grid-cols-2 md:grid-cols-4 gap-4 p-5">
            <div>
              <span className="text-[10px] text-text-hint font-semibold uppercase tracking-wider block">Category</span>
              <span className="text-sm font-medium text-text-primary mt-1 block capitalize">{rfq.category}</span>
            </div>
            <div>
              <span className="text-[10px] text-text-hint font-semibold uppercase tracking-wider block">Budget Limit</span>
              <span className="text-sm font-medium text-text-primary mt-1 block">
                {rfq.budget !== undefined && rfq.budget !== null ? `$${rfq.budget.toLocaleString()}` : "N/A"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-text-hint font-semibold uppercase tracking-wider block">Deadline</span>
              <span className="text-sm font-medium text-text-primary mt-1 block flex items-center gap-1">
                <IconCalendar className="w-4 h-4 text-text-muted" />
                {new Date(rfq.deadline).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-text-hint font-semibold uppercase tracking-wider block">Created By</span>
              <span className="text-sm font-medium text-text-primary mt-1 block truncate">
                {rfq.createdBy?.name || "System"}
              </span>
            </div>
          </div>

          {/* Line Items */}
          <div className="card space-y-3">
            <h3 className="font-semibold text-text-primary text-sm">Required Specifications / Items</h3>
            <div className="overflow-x-auto border border-border rounded-lg">
              <table className="w-full">
                <thead className="bg-bg-subtle">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-muted uppercase">Item Description</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-muted uppercase w-32">Required Quantity</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-muted uppercase w-28">Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rfq.items?.map((item, index) => (
                    <tr key={item._id || index}>
                      <td className="px-4 py-3 text-xs text-text-primary font-medium">{item.name}</td>
                      <td className="px-4 py-3 text-xs text-text-primary">{item.quantity}</td>
                      <td className="px-4 py-3 text-xs text-text-muted">{item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Attachments Section */}
          <div className="card space-y-4">
            <h3 className="font-semibold text-text-primary text-sm">Reference Documents</h3>
            {rfq.attachments?.length === 0 ? (
              <p className="text-xs text-text-hint">No reference documents attached to this RFQ.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {rfq.attachments?.map((doc) => (
                  <div key={doc._id} className="flex items-center justify-between p-3 bg-bg-subtle rounded-lg border border-border hover:border-strong transition-colors">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <IconFileText className="w-5 h-5 text-primary shrink-0" />
                      <span className="text-xs font-medium text-text-primary truncate">{doc.label}</span>
                    </div>
                    <div className="flex gap-1.5">
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 text-text-muted hover:text-primary rounded"
                        title="Download Document"
                      >
                        <IconDownload className="w-4 h-4" />
                      </a>
                      {user.role === "officer" && rfq.status === "draft" && (
                        <button
                          onClick={() => handleDeleteAttachment(doc._id)}
                          className="p-1 text-text-muted hover:text-danger rounded"
                          title="Delete Document"
                        >
                          <IconTrash className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload form for Officer */}
            {user.role === "officer" && rfq.status === "draft" && (
              <form onSubmit={handleAddAttachment} className="flex gap-2 items-end pt-2 border-t border-border">
                <div className="flex-1">
                  <label className="block text-[10px] font-semibold text-text-muted mb-1 uppercase tracking-wider">
                    Add PDF Document / Reference
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Technical Specifications Blueprint"
                    value={attachLabel}
                    onChange={(e) => setAttachLabel(e.target.value)}
                    className="input text-xs"
                    disabled={attachLoading}
                  />
                </div>
                <button
                  type="submit"
                  className="btn-outline px-4 py-2 text-xs h-[38px] flex items-center gap-1"
                  disabled={attachLoading}
                >
                  <IconPlus className="w-4 h-4" />
                  <span>Attach Document</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Invitees / Bidders Submissions */}
        <div className="space-y-6">
          
          {/* Invited Vendors Status */}
          <div className="card space-y-4">
            <h3 className="font-semibold text-text-primary text-sm">Invited Vendors</h3>
            <div className="space-y-3">
              {rfq.vendors?.map((invitee) => {
                const getInviteStatusBadge = (status) => {
                  switch (status) {
                    case "invited":
                      return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary-light text-primary">Invited</span>;
                    case "submitted":
                      return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-success-light text-success-dark">Submitted</span>;
                    case "declined":
                      return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-danger-light text-danger-dark">Declined</span>;
                    default:
                      return null;
                  }
                };

                return (
                  <div key={invitee._id} className="flex items-center justify-between border-b border-border/60 pb-2.5 last:border-b-0 last:pb-0">
                    <div>
                      <p className="text-xs font-semibold text-text-primary">{invitee.vendor?.companyName || "Vendor Profile"}</p>
                      <span className="text-[10px] text-text-muted">Contact: {invitee.vendor?.contactPerson || "N/A"}</span>
                    </div>
                    {getInviteStatusBadge(invitee.status)}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quotations / Bids Overview for Staff */}
          {["admin", "officer", "manager"].includes(user.role) && ["published", "closed", "awarded"].includes(rfq.status) && (
            <div className="card space-y-4">
              <div className="flex justify-between items-center border-b border-border pb-2">
                <div>
                  <h3 className="font-semibold text-text-primary text-sm">Submitted Bids</h3>
                  <span className="text-[10px] text-text-muted font-bold uppercase">{quotations.length} total</span>
                </div>
                {quotations.length > 0 && (
                  <Link
                    to={`/rfqs/${id}/compare`}
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    Compare Bids
                  </Link>
                )}
              </div>
              {quotations.length === 0 ? (
                <div className="py-8 text-center text-text-hint text-xs space-y-1">
                  <IconAlertCircle className="w-5 h-5 mx-auto" />
                  <p>No bids submitted yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {quotations.map((quote) => (
                    <div
                      key={quote._id}
                      onClick={() => {
                        setActiveQuotation(quote);
                        setShowBidModal(true);
                      }}
                      className="p-3 bg-bg-subtle border border-border hover:border-primary hover:bg-primary-light/5 rounded-lg cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-text-primary">{quote.vendorId?.companyName}</p>
                        <div className="flex items-center gap-3 text-[10px] text-text-muted mt-1">
                          <span>Delivery: {quote.deliveryDays} Days</span>
                          <span>•</span>
                          <span className="font-semibold text-primary">Total: ${quote.grandTotal.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {quote.status === "accepted" && (
                          <span className="badge-approved text-[9px] px-1.5 font-bold uppercase">Winner</span>
                        )}
                        <IconEye className="w-4 h-4 text-text-hint" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bid Details Modal (Manager Awarding flow) */}
      {showBidModal && activeQuotation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-card shadow-dropdown max-w-2xl w-full max-h-[85vh] overflow-y-auto border border-border flex flex-col">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-border flex justify-between items-center bg-bg-subtle">
              <div>
                <h3 className="font-bold text-text-primary">{activeQuotation.vendorId?.companyName} - Bid Sheet</h3>
                <p className="text-[10px] text-text-muted">Quoted on {new Date(activeQuotation.createdAt).toLocaleDateString()}</p>
              </div>
              <button
                onClick={() => setShowBidModal(false)}
                className="p-1 rounded-full hover:bg-border transition-colors"
              >
                <IconTrash className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 flex-1">
              
              {/* Deliverables Overview */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-bg-subtle rounded-lg">
                  <span className="text-[10px] text-text-muted block font-semibold uppercase">Total Bid Amount</span>
                  <span className="text-lg font-bold text-primary mt-0.5 block">${activeQuotation.grandTotal.toLocaleString()}</span>
                </div>
                <div className="p-3 bg-bg-subtle rounded-lg">
                  <span className="text-[10px] text-text-muted block font-semibold uppercase">Turnaround Time</span>
                  <span className="text-lg font-bold text-text-primary mt-0.5 block">{activeQuotation.deliveryDays} Days</span>
                </div>
              </div>

              {/* Items pricing */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider">Item Pricing Matrix</h4>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-bg-subtle text-text-muted">
                      <tr>
                        <th className="px-3 py-2 text-left">Item</th>
                        <th className="px-3 py-2 text-center w-24">Price Per Unit</th>
                        <th className="px-3 py-2 text-right w-28">Total Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {activeQuotation.items?.map((item, index) => {
                        const rfqItem = rfq.items?.find((ri) => ri._id === item.itemId || ri._id.toString() === item.itemId.toString());
                        return (
                          <tr key={index}>
                            <td className="px-3 py-2.5 font-medium text-text-primary">
                              {rfqItem?.name || "Required Item"}
                              <span className="text-[10px] text-text-muted block mt-0.5">Quantity: {rfqItem?.quantity} {rfqItem?.unit}</span>
                            </td>
                            <td className="px-3 py-2.5 text-center">${item.pricePerUnit.toLocaleString()}</td>
                            <td className="px-3 py-2.5 text-right font-semibold text-text-primary">${item.totalPrice.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Milestones */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider">Payment Milestone Terms</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeQuotation.paymentTerms?.map((term, index) => (
                    <div key={index} className="flex justify-between p-2.5 bg-bg-subtle rounded border border-border/80 text-xs">
                      <span className="text-text-muted font-medium">{term.label}</span>
                      <span className="font-bold text-primary">{term.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border flex justify-end gap-2 bg-bg-subtle">
              <button
                onClick={() => setShowBidModal(false)}
                className="btn-ghost px-4 py-2 text-xs"
              >
                Close Sheets
              </button>

              {/* Officer Review Action */}
              {user.role === "officer" && activeQuotation.status === "submitted" && (
                <button
                  onClick={async () => {
                    try {
                      await api.patch(`/quotations/${activeQuotation._id}/status`, { status: "reviewed" });
                      toast.success("Quotation marked as reviewed");
                      setShowBidModal(false);
                      fetchRfqDetails();
                    } catch (error) {
                      toast.error(error.response?.data?.message || "Failed to review quotation");
                    }
                  }}
                  className="btn-primary px-5 py-2 text-xs font-bold shadow-sm flex items-center gap-1.5"
                >
                  <IconCheck className="w-4 h-4" />
                  <span>Mark as Reviewed</span>
                </button>
              )}

              {/* Manager Award Action */}
              {user.role === "manager" && rfq.status === "closed" && activeQuotation.status === "reviewed" && (
                <button
                  onClick={() => handleAwardQuotation(activeQuotation._id)}
                  className="btn-primary px-5 py-2 text-xs font-bold shadow-sm flex items-center gap-1.5"
                >
                  <IconCheck className="w-4 h-4" />
                  <span>Accept Bid & Award RFQ</span>
                </button>
              )}

              {/* Manager Awaiting Review Banner */}
              {user.role === "manager" && rfq.status === "closed" && activeQuotation.status === "submitted" && (
                <span className="text-xs text-warning-dark bg-warning-light px-3 py-2 rounded-lg font-semibold flex items-center gap-1">
                  Awaiting Officer Review
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RfqDetails;
