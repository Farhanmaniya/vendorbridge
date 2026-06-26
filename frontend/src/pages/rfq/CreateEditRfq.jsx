import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../../api/axios";
import { IconPlus, IconTrash, IconArrowLeft, IconCheck } from "@tabler/icons-react";
import toast from "react-hot-toast";

const CreateEditRfq = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [category, setCategory] = useState("IT");
  
  // RFQ Items
  const [items, setItems] = useState([]);
  const [itemName, setItemName] = useState("");
  const [itemQty, setItemQty] = useState("");
  const [itemUnit, setItemUnit] = useState("pcs");

  // Vendors checklist
  const [vendorsList, setVendorsList] = useState([]);
  const [selectedVendors, setSelectedVendors] = useState([]);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Fetch all vendors to populate the invite checkbox list
        const vendorResponse = await api.get("/vendors");
        setVendorsList(vendorResponse.data || []);

        if (isEdit) {
          const rfqResponse = await api.get(`/rfq/${id}`);
          const rfq = rfqResponse.data.rfqs;

          if (rfq.status !== "draft") {
            toast.error("Only draft RFQs can be edited");
            navigate("/rfqs");
            return;
          }

          setBudget(rfq.budget || "");
          setDeadline(rfq.deadline ? new Date(rfq.deadline).toISOString().substring(0, 10) : "");
          setCategory(rfq.category || "IT");
          setItems(rfq.items || []);
          setSelectedVendors(rfq.vendors?.map((v) => v.vendor?._id || v.vendor) || []);
        }
      } catch (error) {
        toast.error("Failed to load RFQ data");
        navigate("/rfqs");
      } finally {
        setFetching(false);
      }
    };

    loadInitialData();
  }, [id, isEdit, navigate]);

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!itemName.trim() || !itemQty || !itemUnit.trim()) {
      return toast.error("Please fill in item details");
    }
    if (parseFloat(itemQty) <= 0) {
      return toast.error("Quantity must be greater than 0");
    }

    const newItem = {
      name: itemName.trim(),
      quantity: parseFloat(itemQty),
      unit: itemUnit.trim(),
    };

    setItems([...items, newItem]);
    setItemName("");
    setItemQty("");
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleVendorToggle = (vendorId) => {
    setSelectedVendors((prev) =>
      prev.includes(vendorId) ? prev.filter((vid) => vid !== vendorId) : [...prev, vendorId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      return toast.error("Please add at least one line item");
    }
    if (!deadline) {
      return toast.error("Please select a submission deadline");
    }
    if (selectedVendors.length === 0) {
      return toast.error("Please invite at least one vendor");
    }

    const payload = {
      budget: budget ? parseFloat(budget) : undefined,
      deadline,
      category,
      items,
      vendors: selectedVendors.map((vId) => ({ vendor: vId, status: "invited" })),
    };

    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/rfq/${id}`, payload);
        toast.success("RFQ updated successfully");
      } else {
        await api.post("/rfq", payload);
        toast.success("RFQ drafted successfully");
      }
      navigate("/rfqs");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save RFQ");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link to="/rfqs" className="p-2 text-text-muted hover:bg-bg-card rounded-lg transition-colors">
          <IconArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {isEdit ? "Modify Request for Quotation" : "Draft New RFQ"}
          </h1>
          <p className="text-text-muted text-xs">Fill out specifications, set parameters, and invite vendors.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Config */}
        <div className="card grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
              Procurement Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input cursor-pointer"
              required
            >
              <option value="IT">IT</option>
              <option value="Office Supplies">Office Supplies</option>
              <option value="Logistics">Logistics</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Services">Services</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
              Submission Deadline
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="input cursor-pointer"
              min={new Date().toISOString().substring(0, 10)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
              Target Budget (Optional)
            </label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g. 15000"
              className="input"
              min="0"
            />
          </div>
        </div>

        {/* Dynamic Items Builder */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-text-primary text-sm border-b border-border pb-2">Line Items</h3>
          
          {/* Add Item Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-6">
              <label className="block text-[10px] font-semibold text-text-muted mb-1 uppercase tracking-wider">
                Item Name / Description
              </label>
              <input
                type="text"
                placeholder="e.g., ThinkPad T14 Gen 4"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="input"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-[10px] font-semibold text-text-muted mb-1 uppercase tracking-wider">
                Quantity Required
              </label>
              <input
                type="number"
                placeholder="Qty"
                value={itemQty}
                onChange={(e) => setItemQty(e.target.value)}
                className="input"
                min="0.01"
                step="any"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-semibold text-text-muted mb-1 uppercase tracking-wider">
                Unit
              </label>
              <input
                type="text"
                placeholder="e.g. pcs, sets"
                value={itemUnit}
                onChange={(e) => setItemUnit(e.target.value)}
                className="input"
              />
            </div>

            <div className="md:col-span-1">
              <button
                type="button"
                onClick={handleAddItem}
                className="btn-primary w-full p-2.5 flex items-center justify-center rounded-lg shadow-sm"
                title="Add Item"
              >
                <IconPlus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full">
              <thead className="bg-bg-subtle border-b border-border">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-text-muted uppercase">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-text-muted uppercase w-28">Quantity</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-text-muted uppercase w-24">Unit</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-text-muted uppercase w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-6 text-xs text-text-hint">
                      No line items added yet. Add items above.
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2.5 text-xs text-text-primary font-medium">{item.name}</td>
                      <td className="px-4 py-2.5 text-xs text-text-primary">{item.quantity}</td>
                      <td className="px-4 py-2.5 text-xs text-text-muted">{item.unit}</td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-1.5 text-danger hover:bg-danger-light rounded-lg transition-colors"
                          title="Remove item"
                        >
                          <IconTrash className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invited Vendors Checklist */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-text-primary text-sm border-b border-border pb-2">Invite Vendors</h3>
          {vendorsList.length === 0 ? (
            <p className="text-xs text-text-hint">No active vendors registered in system. Contact Administrator.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto pr-2">
              {vendorsList.map((v) => {
                const isSelected = selectedVendors.includes(v._id);
                return (
                  <div
                    key={v._id}
                    onClick={() => handleVendorToggle(v._id)}
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary bg-primary-light/30"
                        : "border-border hover:border-strong bg-white"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="text-xs font-semibold text-text-primary truncate">{v.companyName}</p>
                      <span className="text-[10px] text-text-muted capitalize">{v.category}</span>
                    </div>
                    {isSelected && <IconCheck className="w-4 h-4 text-primary shrink-0" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          <Link to="/rfqs" className="btn-ghost px-5 py-2">
            Cancel
          </Link>
          <button
            type="submit"
            className="btn-primary px-6 py-2 shadow-sm font-semibold flex items-center gap-1.5"
            disabled={loading}
          >
            {loading && <span className="w-4 h-4 border-2 border-white/30 border-b-white rounded-full animate-spin"></span>}
            <span>{isEdit ? "Update RFQ" : "Save as Draft"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEditRfq;
