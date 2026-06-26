import React, { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return toast.error("Invalid password reset token URL");
    if (!password || !confirmPassword) return toast.error("All fields are required");
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    if (password !== confirmPassword) return toast.error("Passwords do not match");

    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, newPassword: password });
      toast.success("Password reset successful! Please log in.");
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reset password. Link may be expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-page flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-danger/5 rounded-full blur-3xl"></div>

      <div className="card max-w-md w-full border border-border/80 backdrop-blur-md bg-white/95 relative z-10 p-8 shadow-dropdown">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-text-primary">Set New Password</h2>
          <p className="text-text-muted text-xs mt-1.5 leading-relaxed">
            Enter your new credentials below to finalize password reset.
          </p>
        </div>

        {!token ? (
          <div className="text-center text-xs text-danger font-medium p-4 bg-danger-light rounded-lg">
            Missing or invalid reset token. Please check your recovery email link.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                New Password
              </label>
              <input
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input text-sm"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                Confirm New Password
              </label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input text-sm"
                disabled={loading}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full btn-primary py-2.5 flex items-center justify-center gap-2 mt-2 font-semibold shadow-sm"
              disabled={loading}
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-b-white rounded-full animate-spin"></span>
              ) : (
                "Save New Password"
              )}
            </button>
          </form>
        )}

        <div className="mt-6 border-t border-border pt-4 text-center">
          <p className="text-xs text-text-muted">
            Go back to{" "}
            <Link to="/login" className="text-primary hover:underline font-semibold">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
