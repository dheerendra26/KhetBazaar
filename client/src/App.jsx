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
import CheckoutPage from './pages/CheckoutPage.jsx';
import DeleteProduct from "./pages/Delete.jsx";
import ProductDetails from "./pages/ProductDetails.jsx"
import UserProfile from "./pages/userProfile.jsx";
import Cart from "./pages/Cart.jsx";
import { AuthProvider } from "./context/AuthContext";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <>
        <Navbar />
        <Home />
        <Footer />
      </>
    ),
  },
  {
    path: "/about",
    element: (
      <>
        <Navbar />
        <About />
        <Footer />
      </>
    ),
  },
  {
    path: "/shop",
    element: (
      <>
        <Navbar />
        <Shop />
        <Footer />
      </>
    ),
  },
  {
    path: "/login",
    element: (
      <>
        <Navbar />
        <Login />
        <Footer />
      </>
    ),
  },
  {
    path: "/register",
    element: (
      <>
        <Navbar />
        <Register />
        <Footer />
      </>
    ),
  },
  {
    path: "/upload",
    element: (
      <>
        <Navbar />
        <ProtectedRoute>
          <Upload />
        </ProtectedRoute>
        <Footer />
      </>
    ),
  },
  {
    path: "/checkout",
    element: (
      <>
        <Navbar />
        <ProtectedRoute>
          <CheckoutPage />
        </ProtectedRoute>
        <Footer />
      </>
    ),
  },
  {
    path: "/profile",
    element: (
      <>
        <Navbar />
        <ProtectedRoute>
          <UserProfile />
        </ProtectedRoute>
        <Footer />
      </>
    ),
  },
  {
    path: "/cart",
    element: (
      <>
        <Navbar />
        <ProtectedRoute>
          <Cart />
          <UserProfile />
        </ProtectedRoute>
        <Footer />
      </>
    ),
  },
  {
    path: "/product/:id",
    element: (
      <>
        <Navbar />
        <ProductDetails />
        <Footer />
      </>
    ),
  },
  {
    path: "/delete",
    element: (
      <>
        <Navbar />
        <DeleteProduct />
        <Footer />
      </>
    ),
  }

]);

const App = () => {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
};

export default App;