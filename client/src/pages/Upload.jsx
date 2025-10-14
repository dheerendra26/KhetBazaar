import { useState } from "react";
import axios from "axios";

const Upload = () => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    email: "",
    location: "",
    image: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "https://farmers-mart.onrender.com/products/post",
        formData
      );

      console.log("Product uploaded successfully:", response.data);

      alert("Product uploaded successfully!");
      setFormData({
        name: "",
        description: "",
        price: "",
        email: "",
        location: "",
        image: "",
      });
    } catch (error) {
      console.error("Error uploading product:", error);
      alert("Failed to upload product. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-green-100 via-blue-50 to-yellow-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-10 rounded-lg shadow-lg w-full max-w-lg"
      >
        <h2 className="text-3xl font-bold text-center text-green-600 mb-6">
          Upload Product
        </h2>
        <p className="text-center text-gray-600 mb-8">
          Fill in the details to add a new product
        </p>

        <div className="space-y-4">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Product Name"
            required
            className="w-full border rounded-lg px-4 py-2 bg-gray-50 focus:ring-2 focus:ring-green-400 focus:outline-none"
          />

          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Description"
            required
            className="w-full border rounded-lg px-4 py-2 bg-gray-50 focus:ring-2 focus:ring-green-400 focus:outline-none"
            rows="3"
          />

          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            placeholder="Price"
            required
            className="w-full border rounded-lg px-4 py-2 bg-gray-50 focus:ring-2 focus:ring-green-400 focus:outline-none"
          />

          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            required
            className="w-full border rounded-lg px-4 py-2 bg-gray-50 focus:ring-2 focus:ring-green-400 focus:outline-none"
          />

          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Location"
            required
            className="w-full border rounded-lg px-4 py-2 bg-gray-50 focus:ring-2 focus:ring-green-400 focus:outline-none"
          />

          <input
            type="text"
            name="image"
            value={formData.image}
            onChange={handleChange}
            placeholder="Image URL"
            required
            className="w-full border rounded-lg px-4 py-2 bg-gray-50 focus:ring-2 focus:ring-green-400 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          className="w-full mt-6 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition duration-300"
        >
          Submit Product
        </button>
      </form>
    </div>
  );
};

export default Upload;
