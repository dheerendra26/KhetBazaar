import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import Login from "./pages/Login";
import Upload from "./pages/Upload";
import Register from "./pages/Register";
import Shop from "./pages/Shop";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import DeleteProduct from "./pages/Delete.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";
import UserProfile from "./pages/userProfile.jsx";
import Cart from "./pages/Cart.jsx";
import { AuthProvider } from "./context/AuthContext";
import { warmUpBackend } from "./utils/coldStarts.js";
import React from "react";
import Weather from "./pages/Weather.jsx";

const Layout = ({ children }) => (
  <div className="flex flex-col min-h-screen">
    <Navbar />
    <main className="flex-grow">{children}</main>
    <Footer />
  </div>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <>
        <Layout>
          <Home />
        </Layout>
      </>
    ),
  },
  {
    path: "/about",
    element: (
      <>
        <Layout>
          <About />
        </Layout>
      </>
    ),
  },
  {
    path: "/shop",
    element: (
      <>
        <Layout>
          <Shop />
        </Layout>
      </>
    ),
  },
  {
    path: "/login",
    element: (
      <>
        <Layout>
          <Login />
        </Layout>
      </>
    ),
  },
  {
    path: "/register",
    element: (
      <>
        <Layout>
          <Register />
        </Layout>
      </>
    ),
  },
  {
    path: "/upload",
    element: (
      <>
        <Layout>
          <ProtectedRoute>
            <Upload />
          </ProtectedRoute>
        </Layout>
      </>
    ),
  },
  {
    path: "/checkout",
    element: (
      <>
        <Layout>
          <ProtectedRoute>
            <CheckoutPage />
          </ProtectedRoute>
        </Layout>
      </>
    ),
  },
  {
    path: "/profile",
    element: (
      <>
        <Layout>
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        </Layout>
      </>
    ),
  },
  {
    path: "/cart",
    element: (
      <>
        <Layout>
          <ProtectedRoute>
            <Cart />
            <UserProfile />
          </ProtectedRoute>
        </Layout>
      </>
    ),
  },
  {
    path: "/product/:id",
    element: (
      <>
        <Layout>
          <ProductDetails />
        </Layout>
      </>
    ),
  },
  {
    path: "/delete",
    element: (
      <>
        <Layout>
          <DeleteProduct />
        </Layout>
      </>
    ),
  },
  {
    path: "/weather",
    element: (
      <>
        <Layout>
          <Weather />
        </Layout>
      </>
    ),
  },
]);

const App = () => {
  React.useEffect(() => {
    warmUpBackend(); 
  }, []);

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
};

export default App;
