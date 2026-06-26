import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { IconPlus, IconUser, IconMail, IconPhone, IconEye, IconBan, IconCheck, IconTrash } from "@tabler/icons-react";
import toast from "react-hot-toast";

const VendorList = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [gstin, setGstin] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [category, setCategory] = useState("IT");
  const [formLoading, setFormLoading] = useState(false);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await api.get("/vendors");
      setVendors(response.data || []);
    } catch (error) {
      toast.error("Failed to load vendors list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleToggleStatus = async (vendorId, currentStatus, targetStatus) => {
    if (currentStatus === targetStatus) return;
    
    try {
      await api.patch(`/vendors/${vendorId}/status`, { status: targetStatus });
      toast.success(`Vendor status changed to ${targetStatus}`);
      fetchVendors();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change vendor status");
    }
  };

  const handleRegisterVendor = async (e) => {
    e.preventDefault();
    if (!email || !companyName) {
      return toast.error("Email and Company Name are required");
    }

    setFormLoading(true);
    try {
      await api.post("/vendors", {
        email,
        companyName,
        contactPerson,
        phone,
        gstin,
        panNumber,
        category,
      });

      toast.success("Vendor profile registered successfully!");
      setShowAddModal(false);
      
      // Reset form
      setEmail("");
      setCompanyName("");
      setContactPerson("");
      setPhone("");
      setGstin("");
      setPanNumber("");
      setCategory("IT");

      fetchVendors();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to register vendor profile. Ensure the user exists first.");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Vendors Directory</h1>
          <p className="text-text-muted text-xs">Register new corporate bids providers, alter category status, and check active states.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-1.5 shadow-sm font-semibold"
        >
          <IconPlus className="w-4.5 h-4.5" />
          <span>Register Vendor Profile</span>
        </button>
      </div>

      {/* Vendors Table */}
      <div className="card">
        {loading ? (
          <div className="py-20 text-center flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : vendors.length === 0 ? (
          <div className="py-20 text-center text-text-hint text-xs">No vendors registered in database.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Company</th>
                  <th className="table-header">Contact Person</th>
                  <th className="table-header">Email (User Account)</th>
                  <th className="table-header">Category</th>
                  <th className="table-header">GSTIN / PAN</th>
                  <th className="table-header">Status</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {vendors.map((v) => (
                  <tr key={v._id} className="hover:bg-bg-subtle/50 transition-colors">
                    <td className="table-cell font-semibold text-text-primary">
                      {v.companyName}
                      <span className="text-[10px] text-text-hint block font-normal">{v.phone || "No phone"}</span>
                    </td>
                    <td className="table-cell">{v.contactPerson || "N/A"}</td>
                    <td className="table-cell text-text-muted">{v.userId?.email || "No Account"}</td>
                    <td className="table-cell capitalize font-medium">{v.category}</td>
                    <td className="table-cell text-[10px] text-text-muted font-mono leading-relaxed">
                      GST: {v.gstin || "N/A"}
                      <br />
                      PAN: {v.panNumber || "N/A"}
                    </td>
                    <td className="table-cell">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        v.status === "active"
                          ? "bg-success-light text-success-dark"
                          : v.status === "inactive"
                          ? "bg-warning-light text-warning-dark"
                          : "bg-danger-light text-danger-dark"
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex gap-1.5 justify-end">
                        <button
                          onClick={() => handleToggleStatus(v._id, v.status, "active")}
                          className="p-1 hover:bg-success-light text-text-hint hover:text-success-dark rounded"
                          title="Set Active"
                        >
                          <IconCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(v._id, v.status, "inactive")}
                          className="p-1 hover:bg-warning-light text-text-hint hover:text-warning-dark rounded"
                          title="Set Inactive"
                        >
                          <IconBan className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(v._id, v.status, "blacklisted")}
                          className="p-1 hover:bg-danger-light text-text-hint hover:text-danger-dark rounded"
                          title="Blacklist Vendor"
                        >
                          <IconTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-card shadow-dropdown max-w-lg w-full overflow-hidden border border-border">
            <div className="px-6 py-4 bg-bg-subtle border-b border-border">
              <h3 className="font-bold text-text-primary">Register New Vendor Profile</h3>
              <p className="text-[10px] text-text-hint mt-0.5">IMPORTANT: Ensure a user account with role 'vendor' is created for this email first.</p>
            </div>
            
            <form onSubmit={handleRegisterVendor} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-text-muted mb-1 uppercase tracking-wider">
                  Linked User Email
                </label>
                <input
                  type="email"
                  placeholder="e.g. contact@vendorcorp.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  required
                  disabled={formLoading}
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-text-muted mb-1 uppercase tracking-wider">
                  Company Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Apex IT Solutions"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="input"
                  required
                  disabled={formLoading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-text-muted mb-1 uppercase tracking-wider">
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="input"
                    disabled={formLoading}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-text-muted mb-1 uppercase tracking-wider">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +91 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input"
                    disabled={formLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-semibold text-text-muted mb-1 uppercase tracking-wider">
                    GSTIN
                  </label>
                  <input
                    type="text"
                    placeholder="22AAAAA0000A1Z5"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="input font-mono uppercase"
                    disabled={formLoading}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-text-muted mb-1 uppercase tracking-wider">
                    PAN
                  </label>
                  <input
                    type="text"
                    placeholder="ABCDE1234F"
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value)}
                    className="input font-mono uppercase"
                    disabled={formLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-text-muted mb-1 uppercase tracking-wider">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input cursor-pointer"
                  disabled={formLoading}
                >
                  <option value="IT">IT</option>
                  <option value="Office Supplies">Office Supplies</option>
                  <option value="Logistics">Logistics</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Services">Services</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 border-t border-border pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-ghost px-4 py-2 text-xs"
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-5 py-2 text-xs font-semibold shadow-sm"
                  disabled={formLoading}
                >
                  {formLoading ? "Saving Profile..." : "Register Vendor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorList;
