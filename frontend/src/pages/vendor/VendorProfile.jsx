import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { IconBuilding, IconPhone, IconUser, IconCreditCard, IconFileText, IconPlus, IconTrash, IconDownload } from "@tabler/icons-react";
import toast from "react-hot-toast";

const VendorProfile = () => {
  const { user } = useAuth();
  const [profileId, setProfileId] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Form Fields
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [gstin, setGstin] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [category, setCategory] = useState("IT");

  // Address sub-fields
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [country, setCountry] = useState("India");

  // Bank details sub-fields
  const [bankStreet, setBankStreet] = useState("");
  const [bankCity, setBankCity] = useState("");
  const [bankState, setBankState] = useState("");
  const [bankPincode, setBankPincode] = useState("");
  const [bankCountry, setBankCountry] = useState("India");

  // Documents
  const [documents, setDocuments] = useState([]);
  const [docLabel, setDocLabel] = useState("");
  const [docLoading, setDocLoading] = useState(false);

  const fetchProfile = async () => {
    if (!user.vendorProfile) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/vendors/${user.vendorProfile}`);
      const v = response.data.vendorDetails;

      setProfileId(v._id);
      setCompanyName(v.companyName || "");
      setContactPerson(v.contactPerson || "");
      setPhone(v.phone || "");
      setGstin(v.gstin || "");
      setPanNumber(v.panNumber || "");
      setCategory(v.category || "IT");

      // Address fields
      setStreet(v.address?.street || "");
      setCity(v.address?.city || "");
      setState(v.address?.state || "");
      setPincode(v.address?.pincode || "");
      setCountry(v.address?.country || "India");

      // Bank Details fields
      setBankStreet(v.bankDetails?.street || "");
      setBankCity(v.bankDetails?.city || "");
      setBankState(v.bankDetails?.state || "");
      setBankPincode(v.bankDetails?.pincode || "");
      setBankCountry(v.bankDetails?.country || "India");

      setDocuments(v.documents || []);
    } catch (error) {
      toast.error("Failed to load vendor profile details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profileId) return;

    setUpdating(true);
    try {
      const payload = {
        contactPerson,
        phone,
        gstin,
        panNumber,
        category,
        address: { street, city, state, pincode, country },
        bankDetails: {
          street: bankStreet,
          city: bankCity,
          state: bankState,
          pincode: bankPincode,
          country: bankCountry,
        },
      };

      await api.put(`/vendors/${profileId}`, payload);
      toast.success("Profile details updated successfully!");
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  const handleUploadDoc = async (e) => {
    e.preventDefault();
    if (!docLabel.trim()) return toast.error("Please enter a document label");

    setDocLoading(true);
    try {
      // Simulate file upload generating mockup URL
      const mockUrl = `https://cloudinary.com/vendorbridge/documents/${Date.now()}_${docLabel.toLowerCase().replace(/\s+/g, "_")}.pdf`;

      await api.post(`/vendors/${profileId}/documents`, {
        label: docLabel.trim(),
        url: mockUrl,
      });

      toast.success("Document uploaded successfully!");
      setDocLabel("");
      fetchProfile();
    } catch (error) {
      toast.error("Failed to register document reference");
    } finally {
      setDocLoading(false);
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;

    try {
      await api.delete(`/vendors/${profileId}/documents/${docId}`);
      toast.success("Document deleted");
      fetchProfile();
    } catch (error) {
      toast.error("Failed to delete document");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user.vendorProfile) {
    return (
      <div className="card text-center p-8 max-w-md mx-auto space-y-4 mt-10">
        <IconBuilding className="w-12 h-12 text-text-hint mx-auto" />
        <h3 className="font-bold text-text-primary text-base">No Vendor Profile Linked</h3>
        <p className="text-xs text-text-muted">
          Your user account does not have a linked corporate vendor profile. Please contact an Administrator to set this up.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Company Profile</h1>
        <p className="text-text-muted text-xs">Configure bank details, address details, contact credentials, and verify documents.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Settings Form */}
        <form onSubmit={handleUpdateProfile} className="lg:col-span-2 space-y-6">
          {/* Basic Config */}
          <div className="card space-y-4">
            <h3 className="font-semibold text-text-primary text-sm border-b border-border pb-2">Basic Info</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-text-muted mb-1 uppercase tracking-wider">
                  Company Name (ReadOnly)
                </label>
                <input type="text" value={companyName} className="input bg-bg-subtle text-text-muted" readOnly />
              </div>
              
              <div>
                <label className="block text-[10px] font-semibold text-text-muted mb-1 uppercase tracking-wider">
                  Category (ReadOnly)
                </label>
                <input type="text" value={category} className="input bg-bg-subtle text-text-muted capitalize" readOnly />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                  Contact Person Name
                </label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="input text-sm"
                  disabled={updating}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                  Contact Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input text-sm"
                  disabled={updating}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                  GSTIN
                </label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="input text-sm font-mono uppercase"
                  disabled={updating}
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                  PAN Number
                </label>
                <input
                  type="text"
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value)}
                  className="input text-sm font-mono uppercase"
                  disabled={updating}
                />
              </div>
            </div>
          </div>

          {/* Corporate Address */}
          <div className="card space-y-4">
            <h3 className="font-semibold text-text-primary text-sm border-b border-border pb-2">Registered Address</h3>
            
            <div>
              <label className="block text-[10px] font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                Street Address
              </label>
              <input
                type="text"
                placeholder="e.g. 503, Synergy Hub, BKC"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="input text-sm"
                disabled={updating}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[10px] font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="input text-sm"
                  disabled={updating}
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                  State
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="input text-sm"
                  disabled={updating}
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                  Pincode
                </label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="input text-sm"
                  disabled={updating}
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                  Country
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="input text-sm"
                  disabled={updating}
                />
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="card space-y-4">
            <h3 className="font-semibold text-text-primary text-sm border-b border-border pb-2 flex items-center gap-1.5">
              <IconCreditCard className="w-5 h-5 text-primary" />
              <span>Remittance Bank Details</span>
            </h3>
            
            <div>
              <label className="block text-[10px] font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                Bank Branch Street Address
              </label>
              <input
                type="text"
                placeholder="e.g. HDFC Bank, Corporate Towers"
                value={bankStreet}
                onChange={(e) => setBankStreet(e.target.value)}
                className="input text-sm"
                disabled={updating}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[10px] font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                  City
                </label>
                <input
                  type="text"
                  value={bankCity}
                  onChange={(e) => setBankCity(e.target.value)}
                  className="input text-sm"
                  disabled={updating}
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                  State
                </label>
                <input
                  type="text"
                  value={bankState}
                  onChange={(e) => setBankState(e.target.value)}
                  className="input text-sm"
                  disabled={updating}
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                  Pincode
                </label>
                <input
                  type="text"
                  value={bankPincode}
                  onChange={(e) => setBankPincode(e.target.value)}
                  className="input text-sm"
                  disabled={updating}
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                  Country
                </label>
                <input
                  type="text"
                  value={bankCountry}
                  onChange={(e) => setBankCountry(e.target.value)}
                  className="input text-sm"
                  disabled={updating}
                />
              </div>
            </div>
          </div>

          {/* Form Submit */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="btn-primary px-6 py-2 shadow-sm font-semibold flex items-center gap-1.5"
              disabled={updating}
            >
              {updating && <span className="w-4 h-4 border-2 border-white/30 border-b-white rounded-full animate-spin"></span>}
              <span>Save Profile Config</span>
            </button>
          </div>
        </form>

        {/* Right Column: Documents Upload */}
        <div className="space-y-6">
          <div className="card space-y-4">
            <h3 className="font-semibold text-text-primary text-sm border-b border-border pb-2">Verification Documents</h3>
            
            {documents.length === 0 ? (
              <p className="text-xs text-text-hint">No business verification documents registered yet.</p>
            ) : (
              <div className="space-y-2.5">
                {documents.map((doc) => (
                  <div key={doc._id} className="flex items-center justify-between p-2.5 bg-bg-subtle rounded border border-border">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <IconFileText className="w-4.5 h-4.5 text-primary shrink-0" />
                      <span className="text-xs font-medium text-text-primary truncate">{doc.label}</span>
                    </div>
                    <div className="flex gap-1.5">
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 text-text-muted hover:text-primary rounded hover:bg-white"
                        title="Download Document"
                      >
                        <IconDownload className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleDeleteDoc(doc._id)}
                        className="p-1 text-text-muted hover:text-danger rounded hover:bg-white"
                        title="Delete Document"
                      >
                        <IconTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Document Form */}
            <form onSubmit={handleUploadDoc} className="pt-4 border-t border-border flex flex-col gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-text-muted mb-1 uppercase tracking-wider">
                  Add Document Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. GST Registration Copy"
                  value={docLabel}
                  onChange={(e) => setDocLabel(e.target.value)}
                  className="input text-xs"
                  disabled={docLoading}
                />
              </div>
              <button
                type="submit"
                className="btn-outline px-4 py-2 text-xs flex items-center justify-center gap-1.5 mt-1"
                disabled={docLoading}
              >
                <IconPlus className="w-4 h-4" />
                <span>Upload PDF Reference</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorProfile;
