import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { IconArrowLeft, IconCheck, IconTrophy, IconClock, IconBuildingStore } from "@tabler/icons-react";
import toast from "react-hot-toast";

const QuotationComparison = () => {
  const { id } = useParams(); // RFQ ID
  const { user } = useAuth();
  const navigate = useNavigate();

  const [rfq, setRfq] = useState(null);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchComparisonData = async () => {
    try {
      setLoading(true);
      const [rfqRes, quoteRes] = await Promise.all([
        api.get(`/rfq/${id}`),
        api.get(`/quotations/rfq/${id}`).catch(() => ({ data: { quotations: [] } })), // handle 404 gracefully
      ]);

      setRfq(rfqRes.data.rfqs);
      setQuotations(quoteRes.data.quotations || []);
    } catch (error) {
      toast.error("Failed to load comparison data");
      navigate(`/rfqs/${id}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparisonData();
  }, [id]);

  const handleAwardQuotation = async (quotationId) => {
    if (!window.confirm("Are you sure you want to award this RFQ to this vendor? This will reject all other bids and close submissions.")) return;

    try {
      await api.patch(`/quotations/${quotationId}/status`, { status: "accepted" });
      toast.success("RFQ awarded successfully!");
      fetchComparisonData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to award RFQ");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Find lowest price
  const activeQuotes = quotations.filter((q) => q.status !== "rejected");
  const lowestPrice = activeQuotes.length > 0
    ? Math.min(...activeQuotes.map((q) => q.grandTotal))
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <Link to={`/rfqs/${id}`} className="p-2 text-text-muted hover:bg-white rounded-lg transition-colors border border-transparent hover:border-border">
          <IconArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Bid Comparison Sheet</h1>
          <p className="text-text-muted text-xs">Side-by-side analysis of vendor quotation sheets for RFQ: {rfq?.rfqNumber}</p>
        </div>
      </div>

      {quotations.length === 0 ? (
        <div className="card py-20 text-center text-text-hint text-sm">
          No bids have been submitted for this RFQ yet. Comparison is not available.
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Side-by-Side Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quotations.map((quote) => {
              const isCheapest = quote.grandTotal === lowestPrice;
              const isWinner = quote.status === "accepted";

              return (
                <div
                  key={quote._id}
                  className={`card relative overflow-hidden flex flex-col justify-between transition-all ${
                    isWinner
                      ? "border-2 border-success bg-success-light/5 shadow-dropdown"
                      : isCheapest
                      ? "border-2 border-primary bg-primary-light/5 shadow-md"
                      : "border border-border"
                  }`}
                >
                  {/* Ribbons */}
                  {isWinner && (
                    <div className="absolute top-0 right-0 bg-success text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-lg flex items-center gap-1">
                      <IconTrophy className="w-3.5 h-3.5" />
                      <span>Winner / Awarded</span>
                    </div>
                  )}
                  {!isWinner && isCheapest && (
                    <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-lg flex items-center gap-1">
                      <IconTrophy className="w-3.5 h-3.5" />
                      <span>Lowest Price</span>
                    </div>
                  )}

                  {/* Vendor Details */}
                  <div className="space-y-4">
                    <div className="flex gap-2.5 items-start">
                      <div className="p-2 bg-white rounded-lg border border-border shadow-sm text-primary mt-1">
                        <IconBuildingStore className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-text-primary text-sm leading-tight truncate max-w-[180px]">
                          {quote.vendorId?.companyName}
                        </h3>
                        <span className="text-[10px] text-text-hint block mt-0.5">Contact: {quote.vendorId?.contactPerson || "N/A"}</span>
                      </div>
                    </div>

                    {/* Meta stats */}
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/60">
                      <div>
                        <span className="text-[9px] font-semibold text-text-hint uppercase block">Total Bid Value</span>
                        <span className="text-base font-extrabold text-text-primary mt-0.5 block">
                          ${quote.grandTotal.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-semibold text-text-hint uppercase block">Timeframe</span>
                        <span className="text-sm font-semibold text-text-primary mt-0.5 block flex items-center gap-1">
                          <IconClock className="w-4 h-4 text-text-muted" />
                          {quote.deliveryDays} Days
                        </span>
                      </div>
                    </div>

                    {/* Item Prices breakdown */}
                    <div className="space-y-2 pt-3 border-t border-border/60">
                      <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Line Item Prices</span>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {quote.items?.map((item, index) => {
                          const rfqItem = rfq.items?.find((ri) => ri._id === item.itemId || ri._id.toString() === item.itemId.toString());
                          return (
                            <div key={index} className="flex justify-between items-center text-xs">
                              <span className="text-text-muted truncate max-w-[120px]">{rfqItem?.name || "Required Item"}</span>
                              <span className="font-semibold text-text-primary">
                                ${item.pricePerUnit.toLocaleString()} <span className="text-[9px] font-normal text-text-hint">/ unit</span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Milestones */}
                    <div className="space-y-2 pt-3 border-t border-border/60">
                      <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Milestones</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {quote.paymentTerms?.map((term, index) => (
                          <div key={index} className="p-1.5 bg-white rounded border border-border/60 text-[10px] flex justify-between">
                            <span className="text-text-hint truncate max-w-[80px]">{term.label}</span>
                            <span className="font-bold text-primary">{term.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {user.role === "manager" && rfq.status === "closed" && quote.status === "reviewed" && (
                    <button
                      onClick={() => handleAwardQuotation(quote._id)}
                      className="w-full btn-primary py-2 mt-5 flex items-center justify-center gap-1.5 shadow-sm font-semibold text-xs"
                    >
                      <IconCheck className="w-4 h-4" />
                      <span>Award RFQ Contract</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationComparison;
