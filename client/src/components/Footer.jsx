import { Link } from "react-router-dom";
import { FaFacebookF, FaTwitter, FaInstagram, FaPhoneAlt } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { HiLocationMarker } from "react-icons/hi";
import { useLang } from "../context/LanguageContext";

const Footer = () => {
  const { t } = useLang();
  return (
    <footer className="bg-gradient-to-br from-green-100 via-emerald-50 to-yellow-50 text-gray-700 pt-12 pb-6">
      <div className="max-w-7xl mx-auto px-8 grid gap-10 md:grid-cols-3">
        <div>
          <h1 className="text-4xl font-bold text-green-600">Khet <span className="text-orange-500">Bazaar</span><span className="text-6xl text-orange-500">.</span></h1>
          <p className="mt-4 text-gray-600 max-w-md leading-relaxed">{t("footerDesc")}</p>
          <div className="flex gap-4 mt-6">
            {[FaFacebookF, FaTwitter, FaInstagram].map((Icon, i) => (
              <a key={i} className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow hover:bg-green-600 hover:text-white transition cursor-pointer"><Icon /></a>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xl font-semibold text-gray-800 mb-4">{t("company")}</p>
          <ul className="space-y-3">
            {[
              { to: "/",       label: t("home") },
              { to: "/about",  label: t("aboutUs") },
              { to: "#",       label: t("delivery") },
              { to: "/privacy",label: t("privacyPolicy") },
            ].map((item) => (
              <li key={item.to + item.label}>
                <Link to={item.to} className="flex items-center gap-2 hover:text-green-600 transition">
                  <HiLocationMarker /> {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xl font-semibold text-gray-800 mb-4">{t("getInTouch")}</p>
          <ul className="space-y-3 text-gray-600">
            <li className="flex items-center gap-3 hover:text-green-600 transition"><FaPhoneAlt />+91-98765-43210</li>
            <li className="flex items-center gap-3 hover:text-green-600 transition"><MdEmail />support@khetbazaar.com</li>
          </ul>
        </div>
      </div>
      <div className="mt-10 border-t border-gray-200 pt-6 text-center">
        <p className="text-sm text-gray-600">© 2026 <span className="font-semibold text-green-700">KhetBazaar</span>. {t("allRightsReserved")}</p>
      </div>
    </footer>
  );
};

export default Footer;
