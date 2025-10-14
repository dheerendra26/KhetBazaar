import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../utils/axiosInstance";

const Login = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axiosInstance.post("/login", { email, otp });
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("userEmail", email);
      
      login(response.data.token, email);
      navigate("/shop");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-r from-green-100 via-blue-50 to-yellow-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-semibold text-center text-green-500 mb-4">
          Login
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Enter your details to sign in to your account
        </p>

        {error && (
          <p className="text-red-500 text-center mb-4">{error}</p>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="text-gray-600 text-sm font-medium">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border px-3 py-2 rounded-lg mt-1"
              required
            />
          </div>
          <div className="mb-6">
            <label className="text-gray-600 text-sm font-medium">OTP</label>
            <input
              type="text"
              placeholder="Enter your OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full bg-gray-50 border px-3 py-2 rounded-lg mt-1"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-green-600 text-white py-2 rounded-lg font-semibold transition duration-300 ${loading ? "opacity-50 cursor-not-allowed" : "hover:bg-green-700"
              }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-4">
          Dont have an account?{" "}
          <Link to="/register" className="text-green-600 font-medium hover:text-green-700">
            Register Now
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;