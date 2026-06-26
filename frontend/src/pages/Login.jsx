import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.error("Please fill in all fields");
    }

    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}!`);
      
      if (user.mustChangePassword) {
        navigate("/change-password");
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-page flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs for premium appearance */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-success/5 rounded-full blur-3xl"></div>

      <div className="card max-w-md w-full border border-border/80 backdrop-blur-md bg-white/95 relative z-10 p-8 shadow-dropdown">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white font-bold text-2xl mx-auto shadow-md mb-3">
            V
          </div>
          <h2 className="text-2xl font-bold text-text-primary">Welcome to VendorBridge</h2>
          <p className="text-text-muted text-xs mt-1">Enterprise RFQ & Vendor Collaboration Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g., admin@vendorbridge.com"
              className="input text-sm"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input text-sm"
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full btn-primary py-2.5 flex items-center justify-center gap-2 mt-2 shadow-sm font-semibold"
            disabled={loading}
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-b-white rounded-full animate-spin"></span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="mt-6 border-t border-border pt-4 flex flex-col gap-2 items-center text-xs text-text-muted">
          <Link to="/forgot-password" className="text-primary hover:underline">
            Forgot Password?
          </Link>
          <p>
            Are you a vendor?{" "}
            <Link to="/signup" className="text-primary hover:underline font-semibold">
              Register now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
