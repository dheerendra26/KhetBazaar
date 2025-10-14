import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState({ price: "", location: "", search: "" });
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      console.error("No token found in cookies");
      setError("You are not authenticated. Please log in.");
      navigate("/login");
      return;
    }

    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true,
    };

    axios
      .get("https://farmers-mart.onrender.com/store/products", config)
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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-5">Products</h1>
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-4 justify-between">
          <input
            type="text"
            name="search"
            value={filter.search}
            onChange={handleFilterChange}
            placeholder="Search products"
            className="p-2 border rounded-lg w-80"
          />
          <input
            type="number"
            name="price"
            value={filter.price}
            onChange={handleFilterChange}
            placeholder="Max Price"
            className="p-2 border rounded-lg w-32"
          />
          <input
            type="text"
            name="location"
            value={filter.location}
            onChange={handleFilterChange}
            placeholder="Location"
            className="p-2 border rounded-lg w-32"
          />
        </div>
      </div>

      {error && <p className="text-red-500">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <Link 
            to={`/product/${product._id}`} 
            key={product._id}
            className="border p-4 rounded-lg shadow-md bg-white flex flex-col justify-between hover:shadow-lg transition duration-300"
          >
            <div className="relative pb-[70%] mb-4">
              <img
                src={product.image}
                alt={product.name}
                className="absolute h-full w-full object-cover rounded-lg"
              />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{product.name}</h2>
              <p className="text-gray-600 mb-2 line-clamp-2">{product.description}</p>
              <p className="text-sm text-gray-500">Location: {product.location}</p>
              <p className="text-green-500 font-bold mt-2">₹{product.price}</p>
            </div>
            <div className="mt-4 text-blue-600 text-sm font-medium">
              View details
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Shop;