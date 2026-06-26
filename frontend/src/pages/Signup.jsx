import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";

const Signup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("IT");

  // Address sub-fields
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [country, setCountry] = useState("India");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || !companyName || !name) {
      return toast.error("All required fields must be filled");
    }

    setLoading(true);
    try {
      const payload = {
        name,
        email,
        password,
        companyName,
        phone,
        category,
        address: { street, city, state, pincode, country },
      };

      const res = await api.post("/auth/signup", payload);
      toast.success("Registration successful! Welcome to VendorBridge.");
      
      // Save tokens and login user immediately
      localStorage.setItem("accessToken", res.data.accessToken);
      // Wait for a reload or reload context
      window.location.href = "/";
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-page flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-success/5 rounded-full blur-3xl"></div>

      <div className="card max-w-2xl w-full border border-border/80 backdrop-blur-md bg-white/95 relative z-10 p-8 shadow-dropdown">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white font-bold text-2xl mx-auto shadow-md mb-2">
            V
          </div>
          <h2 className="text-2xl font-bold text-text-primary">Vendor Registration</h2>
          <p className="text-text-muted text-xs mt-1">Create your VendorBridge portal account and setup your corporate bidding profile.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Account Credentials */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-border pb-4">
            <div>
              <label className="block text-[10px] font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                Corporate Email Address *
              </label>
              <input
                type="email"
                placeholder="e.g. sales@vendorlabs.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                Password *
              </label>
              <input
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                required
                minLength={6}
                disabled={loading}
              />
            </div>
          </div>

          {/* Profile Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                Company Legal Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Apex IT Laboratories"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="input"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                Business Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input cursor-pointer"
                disabled={loading}
              >
                <option value="IT">IT</option>
                <option value="Office Supplies">Office Supplies</option>
                <option value="Logistics">Logistics</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Services">Services</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                Contact Person Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Alex Rivera"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                Contact Phone Number
              </label>
              <input
                type="text"
                placeholder="e.g. +91 98765 00000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input"
                disabled={loading}
              />
            </div>
          </div>

          {/* Address Details */}
          <div className="space-y-3 pt-2 border-t border-border">
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Registered Address</h4>
            
            <div>
              <label className="block text-[10px] font-semibold text-text-muted mb-1 uppercase tracking-wider">
                Street Address
              </label>
              <input
                type="text"
                placeholder="Building Name, Sector, Area"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="input text-xs"
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[10px] font-semibold text-text-muted mb-1 uppercase tracking-wider">
                  City
                </label>
                <input
                  type="text"
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="input text-xs"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-text-muted mb-1 uppercase tracking-wider">
                  State
                </label>
                <input
                  type="text"
                  placeholder="State"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="input text-xs"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-text-muted mb-1 uppercase tracking-wider">
                  Pincode
                </label>
                <input
                  type="text"
                  placeholder="Pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="input text-xs"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-text-muted mb-1 uppercase tracking-wider">
                  Country
                </label>
                <input
                  type="text"
                  placeholder="Country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="input text-xs"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full btn-primary py-2.5 flex items-center justify-center gap-2 mt-2 shadow-sm font-semibold"
            disabled={loading}
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-b-white rounded-full animate-spin"></span>
            ) : (
              "Submit Registration"
            )}
          </button>
        </form>

        <div className="mt-6 border-t border-border pt-4 text-center">
          <p className="text-xs text-text-muted">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline font-semibold">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
