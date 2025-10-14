import { Link } from "react-router-dom";
import { assets } from "../assets/assets";

const Home = () => {
  return (
    <div className="bg-gradient-to-b from-green-100 to-green-50 min-h-screen">
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center px-8 py-20 gap-8">
        <div className="md:w-1/2 text-left">
          <h1 className="text-5xl font-bold text-green-800 mb-4">
            Fresh from Farm to Your Home
          </h1>
          <p className="text-lg text-gray-700 mb-6">
            Enjoy farm-fresh produce directly from the hands of our farmers to your table. We ensure 100% organic and fresh products, bringing you closer to nature.
          </p>
          <div className="flex gap-4">
            <Link to="./about">
              <button className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700">
                Know More
              </button>
            </Link>
          </div>
        </div>
        <div className="md:w-1/2">
          <img
            src={assets.farmer_image}
            alt="Farmer in field"
            className="w-full h-auto rounded-lg shadow-lg"
          />
        </div>
      </section>

      {/* Customer and Farmer Section */}
      <section className="flex flex-col md:flex-row items-center justify-center gap-8 px-8 py-20 bg-green-200">
        <div className="w-full md:w-1/3 bg-white p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">I am a Customer</h2>
          <Link to="/shop">
            <button className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700">
              Shop Now
            </button>
          </Link>
        </div>
        <div className="w-full md:w-1/3 bg-white p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">I'm a Farmer</h2>
          <Link to="/upload">
            <button className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700">
              Start Selling
            </button>
          </Link>
        </div>
        <div className="w-full md:w-1/3 bg-white p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Delete a Listing</h2>
          <Link to="/delete">
            <button className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700">
              Delete Now
            </button>
          </Link>
        </div>
      </section>

      {/* Image and Text Placeholder Section */}
      <section className="flex flex-wrap justify-center gap-8 px-8 py-20 bg-green-50">
        <div className="w-full md:w-1/3 bg-white p-4 rounded-lg shadow-md text-center">
          <img
            src={assets.vegetables}
            alt="Fresh Vegetables"
            className="w-full h-48 object-cover rounded-lg mb-4"
          />
          <h3 className="text-xl font-bold text-gray-800 mb-2">Farm-Fresh Vegetables</h3>
          <p className="text-gray-600">
            Handpicked and organic, our vegetables are delivered fresh from local farms.
          </p>
        </div>
        <div className="w-full md:w-1/3 bg-white p-4 rounded-lg shadow-md text-center">
          <img
            src={assets.fruits}
            alt="Organic Fruits"
            className="w-full h-48 object-cover rounded-lg mb-4"
          />
          <h3 className="text-xl font-bold text-gray-800 mb-2">Organic Fruits</h3>
          <p className="text-gray-600">
            Enjoy the sweetness of nature with 100% organic fruits, grown with love.
          </p>
        </div>
        <div className="w-full md:w-1/3 bg-white p-4 rounded-lg shadow-md text-center">
          <img
            src={assets.dairy}
            alt="Dairy Products"
            className="w-full h-48 object-cover rounded-lg mb-4"
          />
          <h3 className="text-xl font-bold text-gray-800 mb-2">Dairy Products</h3>
          <p className="text-gray-600">
            Fresh dairy products from grass-fed cows, ensuring quality in every drop.
          </p>
        </div>
        <div className="w-full md:w-1/3 bg-white p-4 rounded-lg shadow-md text-center">
          <img
            src={assets.seed}
            alt="Dairy Products"
            className="w-full h-48 object-cover rounded-lg mb-4"
          />
          <h3 className="text-xl font-bold text-gray-800 mb-2">Plant Seeds</h3>
          <p className="text-gray-600">
          High-yielding varieties of vegetable and fruit seeds, flower seeds with high germination rates.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;
