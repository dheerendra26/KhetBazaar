import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_BACKEND_URL;

const Register = () => {
  const [step, setStep]           = useState(1);
  const [email, setEmail]         = useState("");
  const [otp, setOtp]             = useState("");
  const [customer, setCustomer]   = useState(false);
  const [farmer, setFarmer]       = useState(false);
  const [agreePolicy, setAgreePolicy] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [message, setMessage]     = useState(null);

  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  // Already logged in → redirect away
  useEffect(() => {
    if (isAuthenticated) navigate("/");
  }, [isAuthenticated, navigate]);

  const isSubmitButtonDisabled =
    loading || (!farmer && !customer) || !email || !agreePolicy || message?.type === "error";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customer && !farmer) {
      setMessage({ type: "error", text: "Please select at least one role." });
      return;
    }
    setLoading(true);
    setMessage(null);
    const roles = [];
    if (customer) roles.push("customer");
    if (farmer)   roles.push("farmer");
    try {
      const res = await axios.post(`${API}/register`, { email, roles });
      setMessage({ type: "success", text: res.data.message || "OTP sent! Check your email." });
      setStep(2);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Registration failed. Try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await axios.post(`${API}/login`, { email, otp });
      // Persist auth data to localStorage first, then do a full page reload
      // so that the Navbar and entire app re-initialise with the correct auth state.
      login(res.data.token, email, res.data.role);
      window.location.href = "/";
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Invalid OTP. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setMessage(null);
    const roles = [];
    if (customer) roles.push("customer");
    if (farmer)   roles.push("farmer");
    try {
      await axios.post(`${API}/register`, { email, roles });
      setMessage({ type: "success", text: "OTP resent! Check your email." });
    } catch {
      setMessage({ type: "error", text: "Failed to resend OTP." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50 flex items-center justify-center px-4 py-12">
      <div className="fixed top-0 left-0 w-96 h-96 bg-green-200 rounded-full opacity-20 blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-emerald-300 rounded-full opacity-20 blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="relative w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-2xl shadow-lg mb-4">
            <span className="text-3xl">🌾</span>
          </div>
          <h1 className="text-2xl font-bold text-green-800">KhetBazaar</h1>
          <p className="text-gray-500 text-sm">Farm to Table, Directly</p>
        </div>

        <div className="bg-white shadow-2xl rounded-3xl overflow-hidden border border-green-100">
          {/* Header bar */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6 text-white">
            <h2 className="text-2xl font-bold">
              {step === 1 ? "Create Account" : "Verify Email"}
            </h2>
            <p className="text-green-100 text-sm mt-1">
              {step === 1 ? "Join thousands of farmers and buyers" : `OTP sent to ${email}`}
            </p>
            <div className="flex items-center gap-3 mt-4">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${step >= 1 ? "bg-white text-green-700 border-white" : "border-green-300 text-green-300"}`}>1</div>
              <span className="text-green-100 text-xs">Details</span>
              <div className={`flex-1 h-0.5 rounded ${step >= 2 ? "bg-white" : "bg-green-400"}`} />
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${step >= 2 ? "bg-white text-green-700 border-white" : "border-green-300 text-green-300"}`}>2</div>
              <span className="text-green-100 text-xs">Verify OTP</span>
            </div>
          </div>

          <div className="px-8 py-8">
            {message && (
              <div className={`mb-5 p-4 rounded-xl text-sm font-medium flex items-start gap-2 ${
                message.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-600 border border-red-200"
              }`}>
                <span>{message.type === "success" ? "✅" : "⚠️"}</span>
                <span>{message.text}</span>
              </div>
            )}

            {/* ── Step 1: Details ── */}
            {step === 1 && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">📧</span>
                    <input
                      type="email"
                      placeholder="example@email.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setMessage(null); }}
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Select Your Role</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`flex flex-col items-center gap-2 cursor-pointer p-4 border-2 rounded-xl transition ${customer ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-green-300"}`}>
                      <input type="checkbox" checked={customer} onChange={() => setCustomer(!customer)} className="sr-only" />
                      <span className="text-3xl">🛒</span>
                      <span className="font-semibold text-sm text-gray-800">Customer</span>
                      <span className="text-xs text-gray-500 text-center">Buy from farmers</span>
                      {customer && <span className="text-green-600 text-xs font-bold">✓ Selected</span>}
                    </label>
                    <label className={`flex flex-col items-center gap-2 cursor-pointer p-4 border-2 rounded-xl transition ${farmer ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-emerald-300"}`}>
                      <input type="checkbox" checked={farmer} onChange={() => setFarmer(!farmer)} className="sr-only" />
                      <span className="text-3xl">🚜</span>
                      <span className="font-semibold text-sm text-gray-800">Farmer</span>
                      <span className="text-xs text-gray-500 text-center">Sell your crops</span>
                      {farmer && <span className="text-emerald-600 text-xs font-bold">✓ Selected</span>}
                    </label>
                  </div>
                </div>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition ${agreePolicy ? "bg-green-600 border-green-600" : "border-gray-300 group-hover:border-green-400"}`}>
                    {agreePolicy && <span className="text-white text-xs font-bold">✓</span>}
                  </div>
                  <input type="checkbox" checked={agreePolicy} onChange={(e) => setAgreePolicy(e.target.checked)} className="sr-only" />
                  <span className="text-sm text-gray-600">
                    I agree to the{" "}
                    <Link to="/privacy" className="text-green-600 font-semibold hover:underline">Privacy Policy</Link>
                    {" "}and Terms of Service
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitButtonDisabled}
                  className={`w-full py-3.5 rounded-xl font-semibold text-white shadow-md transition duration-300 ${
                    isSubmitButtonDisabled
                      ? "bg-green-400 opacity-60 cursor-not-allowed"
                      : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 active:scale-95"
                  }`}
                >
                  {loading
                    ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending OTP...</span>
                    : "Get OTP & Register →"}
                </button>
              </form>
            )}

            {/* ── Step 2: OTP ── */}
            {step === 2 && (
              <form onSubmit={handleVerifyOTP} className="space-y-5">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <p className="text-green-700 text-sm">OTP sent to</p>
                  <p className="text-green-900 font-bold">{email}</p>
                  <button type="button" onClick={() => { setStep(1); setOtp(""); setMessage(null); }} className="text-green-600 text-xs underline mt-1">
                    Change email
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Enter OTP</label>
                  <input
                    type="text"
                    placeholder="------"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition text-center text-2xl tracking-widest font-mono"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !otp}
                  className={`w-full py-3.5 rounded-xl font-semibold text-white shadow-md transition duration-300 ${
                    loading || !otp
                      ? "bg-green-400 opacity-60 cursor-not-allowed"
                      : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 active:scale-95"
                  }`}
                >
                  {loading
                    ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Verifying...</span>
                    : "✅ Verify & Enter KhetBazaar"}
                </button>

                <button type="button" onClick={handleResendOTP} disabled={loading} className="w-full py-2.5 rounded-xl border border-green-500 text-green-600 text-sm font-medium hover:bg-green-50 transition">
                  Resend OTP
                </button>
              </form>
            )}

            <div className="mt-6 text-center text-sm text-gray-500">
              Already have an account?{" "}
              <span onClick={() => navigate("/login")} className="text-green-600 font-semibold hover:underline cursor-pointer">Login</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 mt-6 text-xs text-gray-400">
          <span>🔒 Secure OTP</span>
          <span>🌿 100% Organic</span>
          <span>🚜 Farmer First</span>
        </div>
      </div>
    </div>
  );
};

export default Register;
