import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const API = import.meta.env.VITE_BACKEND_URL;

const Login = () => {
  const [step, setStep]       = useState(1); // 1 = email, 2 = OTP
  const [email, setEmail]     = useState("");
  const [otp, setOtp]         = useState("");
  const [error, setError]     = useState("");
  const [info, setInfo]       = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  // Already logged in → redirect away
  useEffect(() => {
    if (isAuthenticated) navigate("/");
  }, [isAuthenticated, navigate]);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError(""); setInfo(""); setLoading(true);
    try {
      const res = await axios.post(`${API}/send-login-otp`, { email });
      setInfo(res.data.message || "OTP sent! Check your inbox.");
      setStep(2);
    } catch (err) {
      setError(
        err.response?.data?.isNewUser
          ? "No account found. Please register first."
          : err.response?.data?.message || "Failed to send OTP."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await axios.post(`${API}/login`, { email, otp });
      // Persist auth data to localStorage first, then do a full page reload
      // so that the Navbar and entire app re-initialise with the correct auth state.
      login(res.data.token, email, res.data.role);
      window.location.href = "/shop";
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-gradient-to-br from-green-100 via-emerald-50 to-yellow-50">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-lg shadow-2xl rounded-2xl p-10 border border-green-200">

        <h2 className="text-3xl font-bold text-center text-green-700 mb-2">Welcome Back 🌾</h2>
        <p className="text-center text-gray-600 mb-8">
          {step === 1 ? "Enter your email to receive an OTP" : "Enter the OTP sent to your email"}
        </p>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? "bg-green-600 text-white" : "bg-gray-200 text-gray-500"}`}>1</div>
          <div className={`h-1 w-10 rounded ${step >= 2 ? "bg-green-600" : "bg-gray-200"}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? "bg-green-600 text-white" : "bg-gray-200 text-gray-500"}`}>2</div>
        </div>

        {error && <div className="bg-red-100 text-red-600 text-sm p-3 rounded-lg mb-4 text-center">{error}</div>}
        {info  && <div className="bg-green-100 text-green-700 text-sm p-3 rounded-lg mb-4 text-center">{info}</div>}

        {step === 1 && (
          <form onSubmit={handleSendOTP}>
            <div className="mb-5">
              <label className="text-sm font-medium text-gray-600">Email Address</label>
              <input
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-2 px-4 py-3 rounded-lg border bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !email}
              className={`w-full py-3 rounded-lg font-semibold shadow-md transition duration-300 ${
                loading || !email
                  ? "bg-green-400 text-white opacity-50 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700 active:scale-95"
              }`}
            >
              {loading ? "Sending OTP..." : "Send OTP 📩"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-600">Email Address</label>
              <div className="flex items-center gap-2 mt-2 px-4 py-3 rounded-lg border bg-gray-100 text-gray-700">
                <span className="flex-1 text-sm">{email}</span>
                <button
                  type="button"
                  onClick={() => { setStep(1); setOtp(""); setError(""); setInfo(""); }}
                  className="text-green-600 text-sm font-semibold hover:underline"
                >
                  Change
                </button>
              </div>
            </div>
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-600">OTP</label>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                className="w-full mt-2 px-4 py-3 rounded-lg border bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !otp}
              className={`w-full py-3 rounded-lg font-semibold shadow-md transition duration-300 ${
                loading || !otp
                  ? "bg-green-400 text-white opacity-50 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700 active:scale-95"
              }`}
            >
              {loading ? "Logging in..." : "Verify & Login 🔐"}
            </button>
            <button
              type="button"
              onClick={handleSendOTP}
              disabled={loading}
              className="w-full mt-3 py-2 rounded-lg border border-green-600 text-green-600 font-medium hover:bg-green-50 transition text-sm"
            >
              Resend OTP
            </button>
          </form>
        )}

        <p className="text-center text-gray-600 mt-6">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-green-600 font-semibold hover:underline">Register Now</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
