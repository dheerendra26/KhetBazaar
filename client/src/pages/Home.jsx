import { Link } from "react-router-dom";
import { assets } from "../assets/assets";
import { useLang } from "../context/LanguageContext";

const Home = () => {
  const { t } = useLang();

  const stats = [
    { value: "10,000+", labelKey: "happyCustomers" },
    { value: "500+",    labelKey: "verifiedFarmers" },
    { value: "50+",     labelKey: "productVarieties" },
    { value: "100%",    labelKey: "organicCertified" },
  ];

  const features = [
    { icon: "🚜", titleKey: "directFromFarm",   descKey: "directFromFarmDesc" },
    { icon: "✅", titleKey: "qualityVerified",  descKey: "qualityVerifiedDesc" },
    { icon: "🌿", titleKey: "organicFirst",      descKey: "organicFirstDesc" },
    { icon: "⚡", titleKey: "fastDelivery",      descKey: "fastDeliveryDesc" },
  ];

  const categories = [
    { src: assets.vegetables, labelKey: "vegetables", icon: "🥬", to: "/shop" },
    { src: assets.fruits,     labelKey: "fruits",      icon: "🍎", to: "/shop" },
    { src: assets.dairy,      labelKey: "dairy",       icon: "🥛", to: "/shop" },
    { src: assets.seed,       labelKey: "seeds",       icon: "🌱", to: "/shop" },
  ];

  return (
    <div className="bg-white min-h-screen">

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-900 via-green-800 to-emerald-700 text-white">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-600 rounded-full opacity-20 blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-500 rounded-full opacity-20 blur-3xl -translate-x-1/3 translate-y-1/3 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-28 flex flex-col-reverse lg:flex-row items-center gap-12">
          <div className="lg:w-1/2 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-green-700/50 border border-green-500/50 rounded-full px-4 py-1.5 text-sm font-medium text-green-200 mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              {t("heroBadge")}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              {t("heroTitle1")}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-emerald-300">{t("heroTitleHighlight")}</span>
              <br />{t("heroTitle2")}
            </h1>

            <p className="text-green-100 text-lg mb-8 max-w-xl">{t("heroDesc")}</p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/shop">
                <button className="bg-white text-green-800 px-8 py-3.5 rounded-xl font-bold shadow-lg hover:bg-green-50 hover:scale-105 transition duration-300 flex items-center gap-2">
                  {t("startShopping")}
                </button>
              </Link>
              <Link to="/about">
                <button className="border-2 border-white/60 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-white/10 transition duration-300">
                  {t("learnMore")}
                </button>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12">
              {stats.map((s) => (
                <div key={s.labelKey} className="text-center">
                  <p className="text-2xl font-extrabold text-white">{s.value}</p>
                  <p className="text-green-300 text-xs mt-0.5">{t(s.labelKey)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:w-1/2 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400/30 to-emerald-400/30 rounded-3xl blur-xl scale-110" />
              <img src={assets.farmer_image} alt="Farmer in field" className="relative w-full max-w-md rounded-3xl shadow-2xl object-cover" />
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-xl">🌾</div>
                <div>
                  <p className="text-xs text-gray-500">{t("todayFreshStock")}</p>
                  <p className="font-bold text-green-700 text-sm">{t("products500")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ROLE CARDS ── */}
      <section className="py-20 bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">{t("whoAreYou")}</h2>
            <p className="text-gray-500">{t("chooseYourPath")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group relative bg-white border border-green-100 rounded-2xl p-8 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center text-3xl mb-5">🛒</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{t("imCustomer")}</h3>
              <p className="text-gray-500 text-sm mb-6">{t("customerDesc")}</p>
              <Link to="/shop"><button className="w-full bg-green-600 text-white py-2.5 rounded-xl font-semibold hover:bg-green-700 transition">{t("shopFreshProduce")}</button></Link>
            </div>

            <div className="group relative bg-white border border-yellow-100 rounded-2xl p-8 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-50 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="w-14 h-14 bg-yellow-100 rounded-2xl flex items-center justify-center text-3xl mb-5">🚜</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{t("imFarmer")}</h3>
              <p className="text-gray-500 text-sm mb-6">{t("farmerDesc")}</p>
              <Link to="/upload"><button className="w-full bg-yellow-500 text-white py-2.5 rounded-xl font-semibold hover:bg-yellow-600 transition">{t("startSellingCrops")}</button></Link>
            </div>

            <div className="group relative bg-gradient-to-br from-sky-500 to-blue-600 border border-blue-200 rounded-2xl p-8 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl mb-5">🌤</div>
              <h3 className="text-xl font-bold text-white mb-2">{t("checkWeather")}</h3>
              <p className="text-white/80 text-sm mb-6">{t("weatherDesc")}</p>
              <Link to="/weather"><button className="w-full bg-white text-blue-600 py-2.5 rounded-xl font-semibold hover:bg-blue-50 transition">{t("checkWeatherNow")}</button></Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-green-600 font-semibold text-sm uppercase tracking-wider">{t("ourProducts")}</span>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-2 mb-3">{t("whatWeOffer")}</h2>
            <p className="text-gray-500">{t("whatWeOfferDesc")}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <Link to={cat.to} key={cat.labelKey}>
                <div className="group bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100">
                  <div className="relative h-48 overflow-hidden">
                    <img src={cat.src} alt={t(cat.labelKey)} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <span className="absolute bottom-3 left-3 text-white font-bold text-lg drop-shadow">{cat.icon} {t(cat.labelKey)}</span>
                  </div>
                  <div className="p-4">
                    <button className="w-full text-green-600 font-semibold text-sm hover:text-green-700 transition">
                      {t("browse")} {t(cat.labelKey)} →
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY KHETBAZAAR ── */}
      <section className="py-20 bg-green-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-green-600 font-semibold text-sm uppercase tracking-wider">{t("whyChooseUs")}</span>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-2">{t("builtForFarmers")}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.titleKey} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition border border-green-100">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-gray-800 mb-2">{t(f.titleKey)}</h3>
                <p className="text-gray-500 text-sm">{t(f.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl font-extrabold mb-4">{t("readyFarmFresh")}</h2>
          <p className="text-green-100 mb-8">{t("joinKhetBazaar")}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register"><button className="bg-white text-green-700 px-8 py-3.5 rounded-xl font-bold hover:bg-green-50 transition">{t("getStartedFree")}</button></Link>
            <Link to="/shop"><button className="border-2 border-white/60 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-white/10 transition">{t("browseProducts")}</button></Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
