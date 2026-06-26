import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../api/axios";
import { IconArrowLeft, IconPlus, IconTrash, IconCheck, IconAlertTriangle } from "@tabler/icons-react";
import toast from "react-hot-toast";

const BidSubmission = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [rfq, setRfq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [prices, setPrices] = useState({}); // map itemId -> pricePerUnit
  const [deliveryDays, setDeliveryDays] = useState("");
  const [milestones, setMilestones] = useState([
    { label: "Advance Payment", percentage: 20 },
    { label: "Upon Delivery Completion", percentage: 80 },
  ]);
  const [mLabel, setMLabel] = useState("");
  const [mPct, setMPct] = useState("");

  useEffect(() => {
    const fetchRfqAndExistingQuotation = async () => {
      try {
        setLoading(true);
        const rfqRes = await api.get(`/rfq/${id}`);
        const rfqData = rfqRes.data.rfqs;
        setRfq(rfqData);

        // Check if there is an existing quotation submitted by this vendor
        const quoteRes = await api.get(`/quotations/rfq/${id}`);
        const existingQuote = quoteRes.data.quotations?.[0]; // The controller is modified to only return this vendor's quote

        if (existingQuote) {
          setDeliveryDays(existingQuote.deliveryDays || "");
          setMilestones(existingQuote.paymentTerms || []);
          
          // Populate pricing map
          const priceMap = {};
          existingQuote.items.forEach((item) => {
            priceMap[item.itemId] = item.pricePerUnit;
          });
          setPrices(priceMap);
        } else {
          // Initialize prices map with empty values
          const initialMap = {};
          rfqData.items.forEach((item) => {
            initialMap[item._id] = "";
          });
          setPrices(initialMap);
        }
      } catch (error) {
        toast.error("Failed to load RFQ specifications");
        navigate(`/rfqs/${id}`);
      } finally {
        setLoading(false);
      }
    };

    fetchRfqAndExistingQuotation();
  }, [id, navigate]);

  const handlePriceChange = (itemId, val) => {
    setPrices({
      ...prices,
      [itemId]: val,
    });
  };

  const handleAddMilestone = (e) => {
    e.preventDefault();
    if (!mLabel.trim() || !mPct) return toast.error("Please fill milestone fields");
    const pctVal = parseFloat(mPct);
    if (pctVal <= 0 || pctVal > 100) return toast.error("Percentage must be between 1 and 100");

    setMilestones([...milestones, { label: mLabel.trim(), percentage: pctVal }]);
    setMLabel("");
    setMPct("");
  };

  const handleRemoveMilestone = (index) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  // Calculations
  const calculatedItems = rfq?.items?.map((item) => {
    const pricePerUnit = parseFloat(prices[item._id]) || 0;
    const totalPrice = pricePerUnit * item.quantity;
    return {
      itemId: item._id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      pricePerUnit,
      totalPrice,
    };
  }) || [];

  const grandTotal = calculatedItems.reduce((acc, item) => acc + item.totalPrice, 0);
  const milestoneSum = milestones.reduce((acc, m) => acc + m.percentage, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (!deliveryDays || parseFloat(deliveryDays) <= 0) {
      return toast.error("Please enter a valid turnaround delivery timeframe");
    }

    const missingPrices = calculatedItems.some((item) => !prices[item.itemId] || parseFloat(prices[item.itemId]) <= 0);
    if (missingPrices) {
      return toast.error("Please provide a valid unit price for all required items");
    }

    if (milestoneSum !== 100) {
      return toast.error(`Payment milestones sum must equal 100%. Current sum: ${milestoneSum}%`);
    }

    const payload = {
      rfqId: id,
      deliveryDays: parseInt(deliveryDays),
      items: calculatedItems.map((item) => ({
        itemId: item.itemId,
        pricePerUnit: item.pricePerUnit,
      })),
      paymentTerms: milestones.map((m) => ({
        label: m.label,
        percentage: m.percentage,
      })),
    };

    setSaving(true);
    try {
      await api.post("/quotations", payload);
      toast.success("Quotation submitted successfully");
      navigate(`/rfqs/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit quotation");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3">
        <Link to={`/rfqs/${id}`} className="p-2 text-text-muted hover:bg-white rounded-lg transition-colors border border-transparent hover:border-border">
          <IconArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Bid Quotation Sheet</h1>
          <p className="text-text-muted text-xs">Submit pricing proposals, timeline limits, and payment schedules for RFQ: {rfq?.rfqNumber}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Item Pricing Matrix */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-text-primary text-sm border-b border-border pb-2">Line Items Pricing</h3>
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full">
              <thead className="bg-bg-subtle text-text-muted text-xs font-semibold">
                <tr>
                  <th className="px-4 py-2.5 text-left">Required Item</th>
                  <th className="px-4 py-2.5 text-center w-28">Quantity</th>
                  <th className="px-4 py-2.5 text-center w-36">Price Per Unit ($)</th>
                  <th className="px-4 py-2.5 text-right w-36">Total Pricing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {calculatedItems.map((item) => (
                  <tr key={item.itemId}>
                    <td className="px-4 py-3.5 font-medium text-text-primary">
                      {item.name}
                      <span className="text-[10px] text-text-hint block mt-0.5">Unit: {item.unit}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center font-medium text-text-muted">{item.quantity}</td>
                    <td className="px-4 py-3.5">
                      <input
                        type="number"
                        placeholder="0.00"
                        value={prices[item.itemId] || ""}
                        onChange={(e) => handlePriceChange(item.itemId, e.target.value)}
                        className="input text-xs py-1.5 px-2 text-center"
                        min="0.01"
                        step="any"
                        required
                        disabled={saving}
                      />
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-text-primary">
                      ${item.totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                {/* Grand Total Row */}
                <tr className="bg-bg-subtle/40 border-t-2 border-border">
                  <td colSpan="3" className="px-4 py-4 text-right font-bold text-text-muted uppercase text-[10px] tracking-wider">
                    Total Quotation Value:
                  </td>
                  <td className="px-4 py-4 text-right font-extrabold text-primary text-base">
                    ${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Timeline details */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-text-primary text-sm border-b border-border pb-2">Delivery & Turnaround</h3>
          <div className="max-w-md">
            <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
              Expected Delivery Timeframe (in Days)
            </label>
            <input
              type="number"
              placeholder="e.g. 14"
              value={deliveryDays}
              onChange={(e) => setDeliveryDays(e.target.value)}
              className="input text-sm"
              min="1"
              required
              disabled={saving}
            />
            <span className="text-[10px] text-text-hint mt-1 block">Specify estimated days required to deliver all items upon RFQ award.</span>
          </div>
        </div>

        {/* Payment Terms Milestones */}
        <div className="card space-y-4">
          <div className="flex justify-between items-center border-b border-border pb-2">
            <h3 className="font-semibold text-text-primary text-sm">Payment Milestones</h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
              milestoneSum === 100
                ? "bg-success-light text-success-dark"
                : "bg-warning-light text-warning-dark"
            }`}>
              Total Percentage: {milestoneSum}%
            </span>
          </div>

          {milestoneSum !== 100 && (
            <div className="p-3 bg-warning-light text-warning-dark rounded-lg flex items-start gap-2.5 text-xs">
              <IconAlertTriangle className="w-5 h-5 shrink-0" />
              <p className="leading-snug">
                The milestone percentages must sum up to exactly **100%**. Current allocation is **{milestoneSum}%**.
              </p>
            </div>
          )}

          {/* List milestones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {milestones.map((m, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-bg-subtle rounded-lg border border-border">
                <div>
                  <p className="text-xs font-semibold text-text-primary">{m.label}</p>
                  <span className="text-[10px] text-text-hint">Percentage: {m.percentage}%</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveMilestone(index)}
                  className="p-1.5 text-text-muted hover:text-danger rounded-lg transition-colors"
                  disabled={saving}
                >
                  <IconTrash className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Milestone Form */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end pt-2 border-t border-border/60">
            <div className="sm:col-span-8">
              <label className="block text-[10px] font-semibold text-text-muted mb-1 uppercase tracking-wider">
                Milestone Title
              </label>
              <input
                type="text"
                placeholder="e.g. Initial Deposit, Final Acceptance"
                value={mLabel}
                onChange={(e) => setMLabel(e.target.value)}
                className="input text-xs"
                disabled={saving}
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-[10px] font-semibold text-text-muted mb-1 uppercase tracking-wider">
                Percentage (%)
              </label>
              <input
                type="number"
                placeholder="%"
                value={mPct}
                onChange={(e) => setMPct(e.target.value)}
                className="input text-xs text-center"
                min="1"
                max="100"
                disabled={saving}
              />
            </div>
            <div className="sm:col-span-1">
              <button
                type="button"
                onClick={handleAddMilestone}
                className="btn-outline w-full p-2 h-[38px] flex items-center justify-center rounded-lg shadow-sm"
                disabled={saving}
              >
                <IconPlus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <Link to={`/rfqs/${id}`} className="btn-ghost px-5 py-2">
            Back to RFQ
          </Link>
          <button
            type="submit"
            className="btn-primary px-6 py-2 shadow-sm font-semibold flex items-center gap-1.5"
            disabled={saving || milestoneSum !== 100}
          >
            {saving && <span className="w-4 h-4 border-2 border-white/30 border-b-white rounded-full animate-spin"></span>}
            <span>Submit Bid Quotation</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default BidSubmission;
