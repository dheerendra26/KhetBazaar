import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { assets } from "../assets/assets";
import { useLang } from "../context/LanguageContext";
import Reveal from "../components/Reveal";
import { motion, useReducedMotion } from "framer-motion";

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 35,
    scale: 0.96,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const Home = () => {
  const { t } = useLang();
  const shouldReduceMotion = useReducedMotion();
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: shouldReduceMotion ? "auto" : "smooth",
    });
  };

  const stats = [
    { value: "10,000+", labelKey: "happyCustomers" },
    { value: "500+", labelKey: "verifiedFarmers" },
    { value: "50+", labelKey: "productVarieties" },
    { value: "100%", labelKey: "organicCertified" },
  ];

  const features = [
    { icon: "🚜", titleKey: "directFromFarm", descKey: "directFromFarmDesc" },
    { icon: "✅", titleKey: "qualityVerified", descKey: "qualityVerifiedDesc" },
    { icon: "🌿", titleKey: "organicFirst", descKey: "organicFirstDesc" },
    { icon: "📞", titleKey: "directContact", descKey: "directContactDesc" },
  ];

  const categories = [
    { src: assets.vegetables, labelKey: "vegetables", icon: "🥬", to: "/shop" },
    { src: assets.fruits, labelKey: "fruits", icon: "🍎", to: "/shop" },
    { src: assets.dairy, labelKey: "dairy", icon: "🥛", to: "/shop" },
    { src: assets.seed, labelKey: "seeds", icon: "🌱", to: "/shop" },
  ];

  const reveal = "animate-[fadeUp_0.7s_ease-out_both]";
  const cardReveal = (index) =>
    `animate-[fadeUp_0.6s_ease-out_${index * 120}ms_both]`;

  return (
    <div className="min-h-screen overflow-hidden bg-white">
      <style>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }

        @keyframes drift {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-16px, 14px); }
        }

        @keyframes softPulse {
          0%, 100% { opacity: 0.65; }
          50% { opacity: 1; }
        }

        .hero-float {
          animation: float 5s ease-in-out infinite;
        }

        .hero-glow {
          animation: drift 9s ease-in-out infinite;
        }

        .fresh-pulse {
          animation: softPulse 2s ease-in-out infinite;
        }

        @keyframes gradientFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .cta-animated {
          background-size: 200% 200%;
          animation: gradientFlow 8s ease infinite;
        }

        .interactive-card {
          transition:
            transform 300ms ease,
            box-shadow 300ms ease,
            border-color 300ms ease;
        }

        .interactive-card:hover {
          transform: translateY(-7px);
          box-shadow: 0 20px 40px -20px rgba(22, 101, 52, 0.3);
        }

        .category-image {
          transition: transform 600ms cubic-bezier(0.2, 0.7, 0.2, 1);
        }

        .category-card:hover .category-image {
          transform: scale(1.1);
        }

        .action-button {
          transition:
            transform 250ms ease,
            box-shadow 250ms ease,
            background-color 250ms ease;
        }

        .action-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 22px -10px rgba(0, 0, 0, 0.3);
        }

        .action-button:active {
          transform: scale(0.97);
        }

        @media (prefers-reduced-motion: reduce) {
          .cta-animated {
            animation: none;
            background-position: 0% 50%;
          }

          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-950 via-green-800 to-emerald-700 text-white">
        <div className="hero-glow pointer-events-none absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-green-400/20 blur-3xl" />
        <div className="hero-glow pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />

        <div className="relative mx-auto flex max-w-7xl flex-col-reverse items-center gap-12 px-6 py-20 lg:flex-row lg:py-28">
          <div className="w-full text-center lg:w-1/2 lg:text-left">
            <div
              className={`${reveal} mb-6 inline-flex items-center gap-2 rounded-full border border-green-400/40 bg-green-700/50 px-4 py-1.5 text-sm font-medium text-green-200`}
            >
              <span className="fresh-pulse h-2 w-2 rounded-full bg-green-300" />
              {t("heroBadge")}
            </div>

            <h1
              className={`${reveal} mb-6 text-4xl font-extrabold leading-tight [animation-delay:100ms] sm:text-5xl lg:text-6xl`}
            >
              {t("heroTitle1")}{" "}
              <span className="bg-gradient-to-r from-green-300 to-emerald-200 bg-clip-text text-transparent">
                {t("heroTitleHighlight")}
              </span>
              <br />
              {t("heroTitle2")}
            </h1>

            <p
              className={`${reveal} mb-8 max-w-xl text-lg text-green-100 [animation-delay:200ms]`}
            >
              {t("heroDesc")}
            </p>

            <div
              className={`${reveal} flex flex-col justify-center gap-4 [animation-delay:300ms] sm:flex-row lg:justify-start`}
            >
              <Link to="/shop">
                <button className="action-button flex w-full items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 font-bold text-green-800 shadow-lg hover:bg-green-50 sm:w-auto">
                  {t("startShopping")}
                  <span
                    className="transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden="true"
                  >
                    →
                  </span>
                </button>
              </Link>

              <Link to="/about">
                <button className="action-button w-full rounded-xl border-2 border-white/60 px-8 py-3.5 font-bold text-white hover:bg-white/10 sm:w-auto">
                  {t("learnMore")}
                </button>
              </Link>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-5 sm:grid-cols-4">
              {stats.map((stat, index) => (
                <div
                  key={stat.labelKey}
                  className={`border-l-2 border-green-400/40 pl-3 text-left ${cardReveal(index)}`}
                >
                  <p className="text-2xl font-extrabold text-white sm:text-3xl">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-green-200">
                    {t(stat.labelKey)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex w-full justify-center lg:w-1/2">
            <div className="hero-float relative w-full max-w-md">
              <div className="hero-glow absolute inset-0 scale-105 rounded-3xl bg-gradient-to-br from-green-300/30 to-emerald-300/30 blur-2xl" />

              <motion.img
                src={assets.farmer_image}
                alt="Farmer in field"
                initial={
                  shouldReduceMotion
                    ? false
                    : { opacity: 0, scale: 0.94, y: 20 }
                }
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                whileHover={shouldReduceMotion ? undefined : { scale: 1.025 }}
                className="relative w-full max-w-md rounded-3xl object-cover shadow-2xl"
              />

              <div className="absolute -bottom-5 -left-2 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-gray-800 shadow-xl transition-transform duration-300 hover:scale-105 sm:-left-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-2xl">
                  🌾
                </div>
                <div>
                  <p className="text-xs text-gray-500">
                    {t("todayFreshStock")}
                  </p>
                  <p className="text-sm font-bold text-green-700">
                    {t("products500")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Choose your path */}
      <section className="bg-gradient-to-b from-green-50 to-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className={`${reveal} mb-12 text-center`}>
            <h2 className="mb-3 text-3xl font-extrabold text-gray-900">
              {t("whoAreYou")}
            </h2>
            <p className="text-gray-500">{t("chooseYourPath")}</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div
              className={`${cardReveal(0)} interactive-card group relative overflow-hidden rounded-2xl border border-green-100 bg-white p-8 shadow-md`}
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-green-50 transition-transform duration-500 group-hover:scale-150" />
              <div className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-3xl transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
                🛒
              </div>
              <h3 className="relative mb-2 text-xl font-bold text-gray-800">
                {t("imCustomer")}
              </h3>
              <p className="relative mb-6 text-sm text-gray-500">
                {t("customerDesc")}
              </p>
              <Link to="/shop" className="relative block">
                <button className="action-button w-full rounded-xl bg-green-600 py-2.5 font-semibold text-white hover:bg-green-700">
                  {t("shopFreshProduce")} →
                </button>
              </Link>
            </div>

            <div
              className={`${cardReveal(1)} interactive-card group relative overflow-hidden rounded-2xl border border-yellow-100 bg-white p-8 shadow-md`}
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-yellow-50 transition-transform duration-500 group-hover:scale-150" />
              <div className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-100 text-3xl transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                🚜
              </div>
              <h3 className="relative mb-2 text-xl font-bold text-gray-800">
                {t("imFarmer")}
              </h3>
              <p className="relative mb-6 text-sm text-gray-500">
                {t("farmerDesc")}
              </p>
              <Link to="/upload" className="relative block">
                <button className="action-button w-full rounded-xl bg-yellow-500 py-2.5 font-semibold text-white hover:bg-yellow-600">
                  {t("startSellingCrops")} →
                </button>
              </Link>
            </div>

            <div
              className={`${cardReveal(2)} interactive-card group relative overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-sky-500 to-blue-600 p-8 shadow-md`}
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10 transition-transform duration-500 group-hover:scale-150" />
              <div className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-3xl transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
                🌤
              </div>
              <h3 className="relative mb-2 text-xl font-bold text-white">
                {t("checkWeather")}
              </h3>
              <p className="relative mb-6 text-sm text-white/80">
                {t("weatherDesc")}
              </p>
              <Link to="/weather" className="relative block">
                <button className="action-button w-full rounded-xl bg-white py-2.5 font-semibold text-blue-600 hover:bg-blue-50">
                  {t("checkWeatherNow")} →
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className={`${reveal} mb-12 text-center`}>
            <span className="text-sm font-semibold uppercase tracking-wider text-green-600">
              {t("ourProducts")}
            </span>
            <Reveal>
              <h2 className="text-3xl font-extrabold text-gray-900">
                {t("whatWeOffer")}
              </h2>
            </Reveal>
            <p className="text-gray-500">{t("whatWeOfferDesc")}</p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4"
          >
            {categories.map((cat) => (
              <motion.div
                key={cat.labelKey}
                variants={cardVariants}
                whileHover={{ y: -8 }}
                className="h-full"
              >
                <Link
                  to={cat.to}
                  className="category-card group block h-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md transition-shadow duration-300 hover:shadow-xl"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={cat.src}
                      alt={t(cat.labelKey)}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                    <span className="absolute bottom-3 left-3 text-lg font-bold text-white">
                      {cat.icon} {t(cat.labelKey)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 text-sm font-semibold text-green-600">
                    <span>
                      {t("browse")} {t(cat.labelKey)}
                    </span>
                    <motion.span
                      aria-hidden="true"
                      initial={{ x: 0 }}
                      whileHover={{ x: 5 }}
                    >
                      →
                    </motion.span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-green-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className={`${reveal} mb-12 text-center`}>
            <span className="text-sm font-semibold uppercase tracking-wider text-green-600">
              {t("whyChooseUs")}
            </span>
            <h2 className="mt-2 text-3xl font-extrabold text-gray-900">
              {t("builtForFarmers")}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <div
                key={feature.titleKey}
                className={`${cardReveal(index)} interactive-card group rounded-2xl border border-green-100 bg-white p-6 shadow-sm`}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-2xl transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
                  {feature.icon}
                </div>
                <h3 className="mb-2 font-bold text-gray-800">
                  {t(feature.titleKey)}
                </h3>
                <p className="text-sm text-gray-500">{t(feature.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="cta-animated relative overflow-hidden bg-gradient-to-r from-green-700 via-emerald-600 to-green-700 py-20 text-center text-white">
        <div className="hero-glow pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="hero-glow pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-green-300/20 blur-3xl" />

        <div className={`${reveal} relative mx-auto max-w-2xl px-6`}>
          <h2 className="mb-4 text-3xl font-extrabold">
            {t("readyFarmFresh")}
          </h2>
          <p className="mb-8 text-green-100">{t("joinKhetBazaar")}</p>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link to="/register">
              <button className="action-button w-full rounded-xl bg-white px-8 py-3.5 font-bold text-green-700 hover:bg-green-50 sm:w-auto">
                {t("getStartedFree")} →
              </button>
            </Link>
            <Link to="/shop">
              <button className="action-button w-full rounded-xl border-2 border-white/60 px-8 py-3.5 font-bold text-white hover:bg-white/10 sm:w-auto">
                {t("browseProducts")}
              </button>
            </Link>
          </div>
        </div>
      </section>

      <motion.button
        type="button"
        aria-label="Back to top"
        title="Back to top"
        onClick={scrollToTop}
        initial={false}
        animate={{
          opacity: showBackToTop ? 1 : 0,
          y: showBackToTop ? 0 : 12,
          scale: showBackToTop ? 1 : 0.9,
        }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
        style={{ pointerEvents: showBackToTop ? "auto" : "none" }}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-green-700 text-xl font-bold text-white shadow-lg ring-1 ring-white/20 transition-colors hover:bg-green-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-green-300"
      >
        <span aria-hidden="true">↑</span>
      </motion.button>
    </div>
  );
};

export default Home;
