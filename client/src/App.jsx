import { useEffect } from "react";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import PropTypes from "prop-types";

import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";

import About         from "./pages/About";
import Cart          from "./pages/Cart.jsx";
import CheckoutPage  from "./pages/CheckoutPage.jsx";
import DeleteProduct from "./pages/Delete.jsx";
import EditProduct   from "./pages/EditProduct.jsx";
import FarmerDashboard from "./pages/FarmerDashboard.jsx";
import Home          from "./pages/Home";
import Login         from "./pages/Login";
import OrderHistory  from "./pages/OrderHistory.jsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";
import Register      from "./pages/Register";
import Shop          from "./pages/Shop";
import Upload        from "./pages/Upload";
import UserProfile   from "./pages/userProfile.jsx";
import Weather       from "./pages/Weather.jsx";
import MandiInsights from "./pages/MandiInsights.jsx";

import { warmUpBackend } from "./utils/coldStarts.js";

/**
 * Root layout rendered by the router.
 * Lives INSIDE RouterProvider, which lives INSIDE AuthProvider —
 * so Navbar always has live access to AuthContext via useAuth().
 */
const RootLayout = () => (
  <div className="flex flex-col min-h-screen">
    <Navbar />
    <main className="flex-grow">
      <Outlet />
    </main>
    <Footer />
  </div>
);

const router = createBrowserRouter([
  {
    element: <RootLayout />,          // ← single shared layout for every route
    children: [
      { path: "/",               element: <Home /> },
      { path: "/about",          element: <About /> },
      { path: "/shop",           element: <Shop /> },
      { path: "/login",          element: <Login /> },
      { path: "/register",       element: <Register /> },
      { path: "/privacy",        element: <PrivacyPolicy /> },
      { path: "/weather",        element: <Weather /> },
      { path: "/product/:id",    element: <ProductDetails /> },
      { path: "/upload",         element: <ProtectedRoute><Upload /></ProtectedRoute> },
      { path: "/checkout",       element: <ProtectedRoute><CheckoutPage /></ProtectedRoute> },
      { path: "/profile",        element: <ProtectedRoute><UserProfile /></ProtectedRoute> },
      { path: "/cart",           element: <ProtectedRoute><Cart /></ProtectedRoute> },
      { path: "/delete",         element: <ProtectedRoute><DeleteProduct /></ProtectedRoute> },
      { path: "/edit-product/:id", element: <ProtectedRoute><EditProduct /></ProtectedRoute> },
      { path: "/dashboard",      element: <ProtectedRoute><FarmerDashboard /></ProtectedRoute> },
      { path: "/orders",         element: <ProtectedRoute><OrderHistory /></ProtectedRoute> },
      { path: "/mandi-insights", element: <ProtectedRoute><MandiInsights /></ProtectedRoute> },
    ],
  },
]);

const App = () => {
  useEffect(() => { warmUpBackend(); }, []);
  return (
    <AuthProvider>
      <LanguageProvider>
        {/*
          RouterProvider is INSIDE AuthProvider.
          RootLayout (with Navbar) is rendered by the router,
          so Navbar's useAuth() call reads the live AuthContext —
          no stale closures, no refresh needed after login.
        */}
        <RouterProvider router={router} />
      </LanguageProvider>
    </AuthProvider>
  );
};

export default App;
