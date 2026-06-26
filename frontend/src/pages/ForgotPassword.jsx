import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email address");

    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSubmitted(true);
      toast.success("Recovery instructions sent!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit recovery request");
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
          <h2 className="text-2xl font-bold text-text-primary">Reset Password</h2>
          <p className="text-text-muted text-xs mt-1.5 leading-relaxed">
            {submitted
              ? "We've sent password reset instructions to your email."
              : "Enter your email address and we'll send you instructions to reset your password."}
          </p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                placeholder="e.g. administrator@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                "Send Reset Link"
              )}
            </button>
          </form>
        ) : (
          <div className="text-center pt-2">
            <button
              onClick={() => setSubmitted(false)}
              className="btn-outline px-6 py-2 text-xs font-semibold"
            >
              Resend Instructions
            </button>
          </div>
        )}

        <div className="mt-6 border-t border-border pt-4 text-center">
          <p className="text-xs text-text-muted">
            Remembered your password?{" "}
            <Link to="/login" className="text-primary hover:underline font-semibold">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
