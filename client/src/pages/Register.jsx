
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await axios.post("https://farmers-mart.onrender.com/register", {
        email,
      });

      setMessage({
        type: "success",
        text: response.data.message || "OTP sent successfully. Check your email.",
      });

      // Redirect to login page
      setTimeout(() => navigate("/login"), 3000);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Registration failed. Try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-b from-green-100 via-blue-50 to-yellow-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm border-t-4 border-green-500">
        <h2 className="text-3xl font-bold text-center text-orange-400 mb-4">
          Register
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Enter your email to register and receive an OTP.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition duration-200"
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
        {message && (
          <p
            className={`mt-4 text-center ${
              message.type === "success" ? "text-green-600" : "text-red-600"
            }`}
          >
            {message.text}
          </p>
        )}
        <p className="text-center text-gray-600 mt-4">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-orange-600 font-medium hover:underline cursor-pointer"
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
};

export default Register;


// import { useState } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";

// const Register = () => {
//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     contact: "",
//     address: "",
//   });
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState(null);
//   const navigate = useNavigate();

//   // Handle input changes
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   // Handle form submission
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setMessage(null);

//     try {
//       const response = await axios.post(
//         "https://farmers-mart.onrender.com/register",
//         formData
//       );

//       setMessage({
//         type: "success",
//         text: response.data.message || "OTP sent successfully. Check your email.",
//       });

//       // Redirect to login page
//       setTimeout(() => navigate("/login"), 3000);
//     } catch (error) {
//       setMessage({
//         type: "error",
//         text: error.response?.data?.message || "Registration failed. Try again.",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="flex items-center justify-center h-screen bg-gradient-to-b from-green-100 via-blue-50 to-yellow-50">
//       <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm border-t-4 border-green-500">
//         <h2 className="text-3xl font-bold text-center text-orange-400 mb-4">
//           Register
//         </h2>
//         <p className="text-center text-gray-600 mb-6">
//           Fill in the details to create a new account.
//         </p>
//         <form onSubmit={handleSubmit}>
//           <div className="mb-4">
//             <input
//               type="text"
//               name="name"
//               placeholder="Enter your name"
//               value={formData.name}
//               onChange={handleChange}
//               required
//               className="w-full px-3 py-2 border rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
//             />
//           </div>
//           <div className="mb-4">
//             <input
//               type="email"
//               name="email"
//               placeholder="Enter your email"
//               value={formData.email}
//               onChange={handleChange}
//               required
//               className="w-full px-3 py-2 border rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
//             />
//           </div>
//           <div className="mb-4">
//             <input
//               type="text"
//               name="contact"
//               placeholder="Enter your contact number"
//               value={formData.contact}
//               onChange={handleChange}
//               required
//               className="w-full px-3 py-2 border rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
//             />
//           </div>
//           <div className="mb-4">
//             <input
//               type="text"
//               name="address"
//               placeholder="Enter your address"
//               value={formData.address}
//               onChange={handleChange}
//               required
//               className="w-full px-3 py-2 border rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
//             />
//           </div>
//           <button
//             type="submit"
//             className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition duration-200"
//             disabled={loading}
//           >
//             {loading ? "Registering..." : "Register"}
//           </button>
//         </form>
//         {message && (
//           <p
//             className={`mt-4 text-center ${
//               message.type === "success" ? "text-green-600" : "text-red-600"
//             }`}
//           >
//             {message.text}
//           </p>
//         )}
//         <p className="text-center text-gray-600 mt-4">
//           Already have an account?{" "}
//           <span
//             onClick={() => navigate("/login")}
//             className="text-orange-600 font-medium hover:underline cursor-pointer"
//           >
//             Login
//           </span>
//         </p>
//       </div>
//     </div>
//   );
// };

// export default Register;
