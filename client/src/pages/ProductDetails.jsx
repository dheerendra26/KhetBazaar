import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";


const ProductDetail = () => {
  const { id } = useParams(); 
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    console.log("Product ID from params:", id);
    if (!id) {
      console.error("Invalid product ID.");
      setError("Invalid product ID.");
      return;
    }
    console.log("Fetching data for product ID:", id);
    
    const fetchProductData = async () => {
      try {
        const productResponse = await axios.get(
          `https://farmers-mart.onrender.com/store/products/${id}`
        );
        console.log("Product data received:", productResponse.data);
        setProduct(productResponse.data);
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Failed to fetch product details.");
      }
    };
    
    const fetchComments = async () => {
      try {
        const commentsResponse = await axios.get(
          `https://farmers-mart.onrender.com/store/products/${id}/comments`
        );
        console.log("Comments data received:", commentsResponse.data);
        setComments(commentsResponse.data);
      } catch (err) {
        console.error("Error fetching comments:", err);
      }
    };
    
    fetchProductData();
    fetchComments();
  }, [id]);

  const handleQuantityChange = (newQuantity) => {
    setQuantity(Math.max(1, newQuantity));
  };

  const addToCart = () => {
    if (!product) return;
    const currentCart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existingItemIndex = currentCart.findIndex(item => item._id === product._id);
    
    if (existingItemIndex !== -1) {
      currentCart[existingItemIndex].quantity += quantity;
    } else {
      currentCart.push({
        _id: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity,
        sellerEmail: product.email,
      });
    }
    
    localStorage.setItem("cart", JSON.stringify(currentCart));
    alert("Product added to cart!");
  };

  const submitComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      const response = await axios.post(
        `https://farmers-mart.onrender.com/store/products/${id}/comments`, 
        { content: newComment }
      );
      console.log("New comment added:", response.data);
      setComments([...comments, response.data]);
      setNewComment("");
    } catch (error) {
      console.error("Error posting comment:", error);
      setError("Failed to post comment.");
    }
  };

  if (error) return <div className="p-6 text-red-500 text-center">{error}</div>;
  if (!product) return <div className="p-6 text-center">Loading product details...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/2">
            <img src={product.image} alt={product.name} className="h-96 w-full object-cover" />
          </div>
          <div className="md:w-1/2 p-6">
            <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
            <p className="text-gray-700 mb-4">{product.description}</p>

            {/* Seller Details Section */}
            <div className="mb-6 p-4 bg-gray-100 rounded-lg">
              <h2 className="text-xl font-bold mb-2">Seller Details</h2>
              <p><strong>Location:</strong> {product.location}</p>
              <p><strong>Email:</strong> {product.email}</p>
            </div>

            <p className="text-green-600 text-2xl font-bold mb-6">₹{product.price}</p>
            <div className="flex items-center space-x-4 mb-6">
              <span className="font-medium">Quantity:</span>
              <div className="flex items-center border rounded-md">
                <button onClick={() => handleQuantityChange(quantity - 1)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200">-</button>
                <span className="px-4 py-1">{quantity}</span>
                <button onClick={() => handleQuantityChange(quantity + 1)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200">+</button>
              </div>
            </div>
            <button onClick={addToCart} className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition duration-300">Add to Cart</button>
          </div>
        </div>
        <div className="p-6 border-t">
          <h2 className="text-xl font-bold mb-4">Comments</h2>
          {isAuthenticated && (
            <div className="mb-6">
              <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..." className="w-full p-3 border rounded-lg mb-2" rows="3"></textarea>
              <button onClick={submitComment} className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700">Post Comment</button>
            </div>
          )}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-gray-500">No comments yet. Be the first to comment!</p>
            ) : (
              comments.map((comment) => (
                <div key={comment._id} className="border-b pb-4">
                  <div className="flex justify-between items-start">
                    <span className="font-medium">{comment.userName || "Anonymous"}</span>
                    <span className="text-sm text-gray-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="mt-1">{comment.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
