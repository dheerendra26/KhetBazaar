import { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X, User, ShoppingCart } from 'lucide-react';
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const updateCartCount = () => {
      if (isAuthenticated) {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        setCartCount(count);
      } else {
        setCartCount(0);
      }
    };

    updateCartCount();

    window.addEventListener('storage', updateCartCount);

    const interval = setInterval(updateCartCount, 1000);

    return () => {
      window.removeEventListener('storage', updateCartCount);
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const navLinkStyle = ({ isActive }) => 
    `text-gray-600 hover:text-green-500 transition duration-300 ${
      isActive ? 'text-green-500 border-b-2 border-green-500' : ''
    }`;

  return (
    <nav className="bg-white shadow-lg py-4 sticky top-0 z-50">
      <div className="container mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-gray-800">
          <span className="text-black">Agri</span>
          <span className="text-green-500">Linker</span>
          <span className="text-orange-500">.</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8">
          {/* Links */}
          <ul className="flex space-x-6">
            <li>
              <NavLink to="/" className={navLinkStyle} end>
                Home
              </NavLink>
            </li>
            <li>
              <NavLink to="/shop" className={navLinkStyle}>
                Shop
              </NavLink>
            </li>
            <li>
              <NavLink to="/about" className={navLinkStyle}>
                About
              </NavLink>
            </li>
            <li>
              <NavLink to="/upload" className={navLinkStyle}>
                Sell
              </NavLink>
            </li>
          </ul>

          {/* Authentication Buttons or User Profile & Cart */}
          <div className="flex space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/cart"
                  className="flex items-center px-4 py-2 rounded-lg border border-green-500 text-green-500 hover:bg-green-500 hover:text-white transition duration-300 relative"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Cart
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </Link>
                <Link
                  to="/profile"
                  className="flex items-center px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition duration-300"
                >
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg border border-green-500 text-green-500 hover:bg-green-500 hover:text-white transition duration-300"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition duration-300"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="block md:hidden text-gray-700 focus:outline-none"
          onClick={toggleMenu}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white shadow-lg p-4">
          <ul className="flex flex-col items-center space-y-4">
            <li>
              <NavLink
                to="/"
                className={({ isActive }) => 
                  `text-gray-700 hover:text-green-500 transition duration-300 ${
                    isActive ? 'text-green-500' : ''
                  }`
                }
                onClick={() => setIsOpen(false)}
                end
              >
                Home
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/shop"
                className={({ isActive }) => 
                  `text-gray-700 hover:text-green-500 transition duration-300 ${
                    isActive ? 'text-green-500' : ''
                  }`
                }
                onClick={() => setIsOpen(false)}
              >
                Shop
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/about"
                className={({ isActive }) => 
                  `text-gray-700 hover:text-green-500 transition duration-300 ${
                    isActive ? 'text-green-500' : ''
                  }`
                }
                onClick={() => setIsOpen(false)}
              >
                About
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/upload"
                className={({ isActive }) => 
                  `text-gray-700 hover:text-green-500 transition duration-300 ${
                    isActive ? 'text-green-500' : ''
                  }`
                }
                onClick={() => setIsOpen(false)}
              >
                Sell
              </NavLink>
            </li>
            {isAuthenticated ? (
              <>
                <li>
                  <Link
                    to="/cart"
                    className="flex items-center justify-center px-4 py-2 w-full text-center rounded-lg border border-green-500 text-green-500 hover:bg-green-500 hover:text-white transition duration-300"
                    onClick={() => setIsOpen(false)}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Cart {cartCount > 0 && `(${cartCount})`}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/profile"
                    className="flex items-center justify-center px-4 py-2 w-full text-center rounded-lg bg-green-500 text-white hover:bg-green-600 transition duration-300"
                    onClick={() => setIsOpen(false)}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link
                    to="/login"
                    className="px-4 py-2 w-full text-center rounded-lg border border-green-500 text-green-500 hover:bg-green-500 hover:text-white transition duration-300"
                    onClick={() => setIsOpen(false)}
                  >
                    Login
                  </Link>
                </li>
                <li>
                  <Link
                    to="/register"
                    className="px-4 py-2 w-full text-center rounded-lg bg-green-500 text-white hover:bg-green-600 transition duration-300"
                    onClick={() => setIsOpen(false)}
                  >
                    Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;