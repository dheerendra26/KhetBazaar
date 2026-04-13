import { LogOut, Menu, ShoppingCart, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";
import { ROLES } from "../../../server/utils/constants";
import NotificationBell from "./NotificationBell";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const { isAuthenticated, logout, userRole } = useAuth();
  const { lang, toggleLang, t } = useLang();
  const navigate = useNavigate();

  useEffect(() => {
    const updateCartCount = () => {
      if (isAuthenticated) {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
      } else setCartCount(0);
    };
    updateCartCount();
    window.addEventListener("storage", updateCartCount);
    const interval = setInterval(updateCartCount, 1000);
    return () => { window.removeEventListener("storage", updateCartCount); clearInterval(interval); };
  }, [isAuthenticated]);

  const handleLogout = () => { logout(); navigate("/login"); };

  const navLinkStyle = ({ isActive }) =>
    `text-gray-600 hover:text-green-500 transition duration-300 text-sm ${isActive ? "text-green-500 border-b-2 border-green-500" : ""}`;

  const isFarmer = userRole === ROLES["FARMER"] || userRole === ROLES["BOTH"];
  const isCustomer = userRole === ROLES["CUSTOMER"] || userRole === ROLES["BOTH"];

  const LangToggle = ({ mobile }) => (
    <button
      onClick={toggleLang}
      title={lang === "en" ? "Switch to Hindi" : "English में बदलें"}
      className={`flex items-center gap-1 font-semibold text-sm border rounded-lg transition
        ${mobile
          ? "px-4 py-2 border-green-500 text-green-700 hover:bg-green-50"
          : "px-3 py-1.5 border-green-400 text-green-700 hover:bg-green-50"
        }`}
    >
      <span className="text-base leading-none">{lang === "en" ? "🇮🇳" : "🇬🇧"}</span>
      <span>{lang === "en" ? "हिंदी" : "English"}</span>
    </button>
  );

  return (
    <nav className="bg-white shadow-lg py-3 sticky top-0 z-50">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold">
          <span className="text-black">Khet</span><span className="text-green-500">Bazaar</span><span className="text-orange-500">.</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          <ul className="flex gap-5">
            <li><NavLink to="/" className={navLinkStyle} end>{t("home")}</NavLink></li>
            {isCustomer && <li><NavLink to="/shop" className={navLinkStyle}>{t("shop")}</NavLink></li>}
            {isFarmer && <>
              <li><NavLink to="/upload" className={navLinkStyle}>{t("sell")}</NavLink></li>
              <li><NavLink to="/delete" className={navLinkStyle}>{t("myProducts")}</NavLink></li>
              <li><NavLink to="/dashboard" className={navLinkStyle}>{t("dashboard")}</NavLink></li>
              <li><NavLink to="/mandi-insights" className={navLinkStyle}>{t("mandi")}</NavLink></li>
            </>}
            {isCustomer && <li><NavLink to="/orders" className={navLinkStyle}>{t("orders")}</NavLink></li>}
            <li><NavLink to="/about" className={navLinkStyle}>{t("about")}</NavLink></li>
          </ul>

          <div className="flex items-center gap-3">
            <LangToggle />
            {isAuthenticated ? <>
              {isCustomer && (
                <Link to="/cart" className="flex items-center px-3 py-1.5 rounded-lg border border-green-500 text-green-500 hover:bg-green-500 hover:text-white transition text-sm relative">
                  <ShoppingCart className="w-4 h-4 mr-1" />{t("cart")}
                  {cartCount > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{cartCount > 99 ? "99+" : cartCount}</span>}
                </Link>
              )}
              <NotificationBell />
              <Link to="/profile" className="flex items-center px-3 py-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600 transition text-sm">
                <User className="w-4 h-4 mr-1" />{t("profile")}
              </Link>
              <button onClick={handleLogout} className="flex items-center px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition text-sm">
                <LogOut className="w-4 h-4 mr-1" />{t("logout")}
              </button>
            </> : <>
              <Link to="/login" className="px-4 py-2 rounded-lg border border-green-500 text-green-500 hover:bg-green-500 hover:text-white transition text-sm">{t("login")}</Link>
              <Link to="/register" className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition text-sm">{t("register")}</Link>
            </>}
          </div>
        </div>

        {/* Mobile toggle */}
        <div className="flex items-center gap-2 md:hidden">
          {isAuthenticated && <NotificationBell />}
          <button onClick={() => setIsOpen(!isOpen)} className="text-gray-700">
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white shadow-lg p-4">
          <ul className="flex flex-col items-center gap-4">
            {[
              { to: "/", label: t("home"), end: true },
              ...(isCustomer ? [{ to: "/shop", label: t("shop") }] : []),
              ...(isFarmer ? [
                { to: "/upload", label: t("sell") },
                { to: "/delete", label: t("myProducts") },
                { to: "/dashboard", label: t("dashboard") },
                { to: "/mandi-insights", label: t("mandi") },
              ] : []),
              ...(isCustomer ? [{ to: "/orders", label: t("orders") }] : []),
              { to: "/about", label: t("about") },
            ].map(({ to, label, end }) => (
              <li key={to}>
                <NavLink to={to} end={end} onClick={() => setIsOpen(false)}
                  className={({ isActive }) => `text-gray-700 hover:text-green-500 transition ${isActive ? "text-green-500 font-semibold" : ""}`}
                >{label}</NavLink>
              </li>
            ))}
            <li><LangToggle mobile /></li>
            {isAuthenticated ? <>
              {isCustomer && <li><Link to="/cart" onClick={() => setIsOpen(false)} className="flex items-center px-4 py-2 rounded-lg border border-green-500 text-green-500">
                <ShoppingCart className="w-4 h-4 mr-2" />{t("cart")} {cartCount > 0 && `(${cartCount})`}
              </Link></li>}
              <li><Link to="/profile" onClick={() => setIsOpen(false)} className="flex items-center px-4 py-2 rounded-lg bg-green-500 text-white"><User className="w-4 h-4 mr-2" />{t("profile")}</Link></li>
              <li><button onClick={() => { handleLogout(); setIsOpen(false); }} className="flex items-center px-4 py-2 rounded-lg bg-red-500 text-white"><LogOut className="w-4 h-4 mr-2" />{t("logout")}</button></li>
            </> : <>
              <li><Link to="/login" onClick={() => setIsOpen(false)} className="px-4 py-2 rounded-lg border border-green-500 text-green-500">{t("login")}</Link></li>
              <li><Link to="/register" onClick={() => setIsOpen(false)} className="px-4 py-2 rounded-lg bg-green-500 text-white">{t("register")}</Link></li>
            </>}
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
