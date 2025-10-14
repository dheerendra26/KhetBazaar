import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const DeleteProduct = () => {
  const [productId, setProductId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (!productId) {
      setError("Please enter a product ID.");
      return;
    }

    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      setError("You are not authenticated. Please log in.");
      return navigate("/login");
    }

    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      };

      await axios.delete(
        `https://farmers-mart.onrender.com/products/delete/${productId}`,
        config
      );

      setMessage("Product deleted successfully.");
      setProductId("");
    } catch (err) {
      console.error("Error deleting product:", err);
      setError("Failed to delete product. Please check the ID and try again.");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-5">Delete Product</h1>

      <div className="flex space-x-4 mb-4">
        <input
          type="text"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          placeholder="Enter Product ID"
          className="p-2 border rounded-lg w-80"
        />
        <button
          onClick={handleDelete}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-300"
        >
          Delete
        </button>
      </div>

      {message && <p className="text-green-500">{message}</p>}
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
};

export default DeleteProduct;
