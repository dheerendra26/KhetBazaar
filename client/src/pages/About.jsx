import { assets } from "../assets/assets";
import { useLang } from "../context/LanguageContext";

function About() {
  const { t } = useLang();

  const whyUs = [
    { icon: "🏆", color: "bg-green-100 text-green-600",   titleKey: "qualityAssurance",   descKey: "qualityAssuranceDesc" },
    { icon: "⚡", color: "bg-blue-100 text-blue-600",     titleKey: "fastConvenient",      descKey: "fastConvenientDesc" },
    { icon: "💬", color: "bg-yellow-100 text-yellow-600", titleKey: "exceptionalSupport",  descKey: "exceptionalSupportDesc" },
    { icon: "🌿", color: "bg-emerald-100 text-emerald-600", titleKey: "sustainableFarming", descKey: "sustainableFarmingDesc" },
    { icon: "💰", color: "bg-orange-100 text-orange-600", titleKey: "fairPrices",          descKey: "fairPricesDesc" },
    { icon: "🔒", color: "bg-purple-100 text-purple-600", titleKey: "securePlatform",      descKey: "securePlatformDesc" },
  ];

  const stats = [
    { num: "10K+", labelKey: "happyCustomersStat" },
    { num: "500+", labelKey: "verifiedFarmersStat" },
    { num: "50+",  labelKey: "productTypes" },
    { num: "5★",   labelKey: "avgRating" },
  ];

  const steps = [
    { step: "01", icon: "🧑‍🌾", titleKey: "farmerLists",    descKey: "farmerListsDesc" },
    { step: "02", icon: "🛒",    titleKey: "youShop",        descKey: "youShopDesc" },
    { step: "03", icon: "🏠",    titleKey: "deliveredFresh", descKey: "deliveredFreshDesc" },
  ];

  return (
    <div className="bg-white min-h-screen">
      {/* ── HERO ── */}
      <section className="bg-gradient-to-br from-green-900 via-green-800 to-emerald-700 text-white py-20 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-600/30 to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 bg-green-700/50 border border-green-500/50 rounded-full px-4 py-1.5 text-sm font-medium text-green-200 mb-6">
            {t("ourStory")}
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-6">
            {t("aboutTitle").split("KhetBazaar")[0]}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-emerald-300">KhetBazaar</span>
          </h1>
          <p className="text-green-100 text-lg leading-relaxed">{t("aboutHeroDesc")}</p>
        </div>
      </section>

      {/* ── MISSION ── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
          <div className="lg:w-1/2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-200 to-emerald-200 rounded-3xl rotate-3 scale-105 opacity-50" />
              <img src={assets.about_img} alt="About KhetBazaar" className="relative rounded-3xl shadow-2xl w-full object-cover" />
            </div>
          </div>
          <div className="lg:w-1/2 space-y-6">
            <span className="text-green-600 font-semibold text-sm uppercase tracking-wider">{t("ourMission")}</span>
            <h2 className="text-3xl font-extrabold text-gray-900 leading-tight">{t("empoweringFarmers")}</h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>{t("missionP1")}</p>
              <p>{t("missionP2")}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              {stats.map((s) => (
                <div key={s.labelKey} className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
                  <p className="text-2xl font-extrabold text-green-700">{s.num}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{t(s.labelKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE US ── */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-green-600 font-semibold text-sm uppercase tracking-wider">{t("whyUs")}</span>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-2 mb-3">{t("whyChooseKhetBazaar")}</h2>
            <p className="text-gray-500 max-w-xl mx-auto">{t("whyDesc")}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyUs.map((item) => (
              <div key={item.titleKey} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition border border-gray-100">
                <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center text-2xl mb-4`}>{item.icon}</div>
                <h3 className="font-bold text-gray-800 mb-2">{t(item.titleKey)}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{t(item.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-green-600 font-semibold text-sm uppercase tracking-wider">{t("theProcess")}</span>
          <h2 className="text-3xl font-extrabold text-gray-900 mt-2 mb-12">{t("howItWorks")}</h2>
          <div className="relative">
            <div className="hidden md:block absolute top-8 left-1/6 right-1/6 h-0.5 bg-green-200" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((s) => (
                <div key={s.step} className="flex flex-col items-center">
                  <div className="relative z-10 w-16 h-16 bg-green-600 text-white rounded-2xl flex items-center justify-center text-3xl shadow-lg mb-4">
                    {s.icon}
                    <span className="absolute -top-2 -right-2 bg-white text-green-600 text-xs font-extrabold rounded-full w-6 h-6 flex items-center justify-center shadow border border-green-100">{s.step}</span>
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2">{t(s.titleKey)}</h3>
                  <p className="text-gray-500 text-sm text-center">{t(s.descKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-center px-6">
        <h2 className="text-2xl font-extrabold mb-3">{t("readyExperience")}</h2>
        <p className="text-green-100 mb-6">{t("joinToday")}</p>
        <div className="flex gap-4 justify-center">
          <a href="/shop"><button className="bg-white text-green-700 px-6 py-3 rounded-xl font-bold hover:bg-green-50 transition">{t("shopNow")}</button></a>
          <a href="/register"><button className="border-2 border-white/60 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/10 transition">{t("joinFree")}</button></a>
        </div>
      </section>
    </div>
  );
}

export default About;
