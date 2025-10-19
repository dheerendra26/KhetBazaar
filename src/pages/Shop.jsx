import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const API = import.meta.env.VITE_BACKEND_URL;

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState({ price: "", location: "", search: "" });
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.error("No token found in localStorage");
      setError("You are not authenticated. Please log in.");
      navigate("/login");
      return;
    }

    const config = {
      headers: { Authorization: `Bearer ${token}` },
    };

    axios
      .get(`${API}/store/products`, config)
      .then((response) => {
        setProducts(response.data);
        setFilteredProducts(response.data);
      })
      .catch((error) => {
        console.error("Error fetching products:", error);
        setError("Failed to fetch products. Please try again later.");
      });
  }, [navigate]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const filtered = products.filter((product) => {
      const matchesPrice =
        !filter.price || product.price <= parseFloat(filter.price);
      const matchesLocation =
        !filter.location ||
        product.location.toLowerCase().includes(filter.location.toLowerCase());
      const matchesSearch =
        !filter.search ||
        product.name.toLowerCase().includes(filter.search.toLowerCase());
      return matchesPrice && matchesLocation && matchesSearch;
    });
    setFilteredProducts(filtered);
  }, [filter, products]);

  if (!isAuthenticated) return null;

  return (
    <div className="px-4 sm:px-6 md:px-10 py-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-5 text-center sm:text-left">
        Products
      </h1>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-5">
        <input
          type="text"
          name="search"
          value={filter.search}
          onChange={handleFilterChange}
          placeholder="Search products"
          className="p-2 border rounded-lg w-full sm:w-80 text-sm sm:text-base"
        />
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <input
            type="number"
            name="price"
            value={filter.price}
            onChange={handleFilterChange}
            placeholder="Max Price"
            className="p-2 border rounded-lg w-full sm:w-32 text-sm sm:text-base"
          />
          <input
            type="text"
            name="location"
            value={filter.location}
            onChange={handleFilterChange}
            placeholder="Location"
            className="p-2 border rounded-lg w-full sm:w-32 text-sm sm:text-base"
          />
        </div>
      </div>

      {error && <p className="text-red-500 text-sm sm:text-base mb-3">{error}</p>}

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {filteredProducts.map((product) => (
          <Link
            to={`/product/${product._id}`}
            key={product._id}
            className="border p-3 sm:p-4 rounded-lg shadow-md bg-white flex flex-col justify-between hover:shadow-lg transition duration-300"
          >
            <div className="relative pb-[70%] mb-3 sm:mb-4">
              <img
                src={product.image}
                alt={product.name}
                className="absolute h-full w-full object-cover rounded-lg"
              />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold truncate">
                {product.name}
              </h2>
              <p className="text-gray-600 mb-1 sm:mb-2 text-xs sm:text-sm line-clamp-2">
                {product.description}
              </p>
              <p className="text-gray-500 text-xs sm:text-sm">
                Location: {product.location}
              </p>
              <p className="text-green-600 font-semibold mt-2 text-sm sm:text-base">
                ₹{product.price}
              </p>
            </div>
            <div className="mt-3 text-blue-600 text-xs sm:text-sm font-medium text-center sm:text-left">
              View details
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Shop;
