import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useLang } from "../context/LanguageContext";

const API = import.meta.env.VITE_BACKEND_URL;

// ── Constants ──────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: "vegetables", labelKey: "vegetables",      icon: "🥬", color: "green"  },
  { key: "fruits",     labelKey: "fruits",           icon: "🍎", color: "orange" },
  { key: "pulses",     labelKey: "pulsesAndCereals", icon: "🌾", color: "amber"  },
  { key: "dairy",      labelKey: "dairy",            icon: "🥛", color: "blue"   },
];

const COLORS = {
  green:  { active: "bg-green-600 text-white border-green-600",   ghost: "border-green-200 text-green-700 hover:bg-green-50"  },
  orange: { active: "bg-orange-500 text-white border-orange-500", ghost: "border-orange-200 text-orange-700 hover:bg-orange-50" },
  amber:  { active: "bg-amber-500 text-white border-amber-500",   ghost: "border-amber-200 text-amber-700 hover:bg-amber-50"  },
  blue:   { active: "bg-blue-600 text-white border-blue-600",     ghost: "border-blue-200 text-blue-700 hover:bg-blue-50"    },
};

// Source label config — strictly no invented values
const SOURCE_META = {
  mandi_record:        { labelKey: "realMandiData",    dot: "bg-green-500",  text: "text-green-700",  bg: "bg-green-50"  },
  live_api:            { labelKey: "realMandiData",    dot: "bg-blue-500",   text: "text-blue-700",   bg: "bg-blue-50"   },
  ml_predicted:        { labelKey: "mlPredicted",      dot: "bg-purple-500", text: "text-purple-700", bg: "bg-purple-50" },
  cooperative_mrp:     { labelKey: "cooperativeMRP",   dot: "bg-teal-500",   text: "text-teal-700",   bg: "bg-teal-50"   },
  seasonal_model:      { labelKey: "seasonalForecast", dot: "bg-indigo-500", text: "text-indigo-700", bg: "bg-indigo-50" },
  moving_avg_fallback: { labelKey: "movingAvgFallback",dot: "bg-yellow-500", text: "text-yellow-700", bg: "bg-yellow-50" },
  mrp_fallback:        { labelKey: "mrpFallback",      dot: "bg-orange-400", text: "text-orange-700", bg: "bg-orange-50" },
  no_data:             { labelKey: "noData",            dot: "bg-gray-300",   text: "text-gray-400",   bg: "bg-gray-50"   },
};

// ── Tiny helper components ─────────────────────────────────────────────────────

const Spin = ({ sm }) => (
  <span className={`inline-block border-2 border-current border-t-transparent rounded-full animate-spin ${sm ? "w-3.5 h-3.5" : "w-5 h-5"}`} />
);

// Price cell — shows real price or "No data", never invents
const PriceCell = ({ slot, unit, isToday, isTomorrow, t }) => {
  const meta   = SOURCE_META[slot?.source] || SOURCE_META.no_data;
  const hasVal = slot?.price != null;

  let wrapCls = "rounded-xl py-3 px-2 text-center flex flex-col items-center gap-1 ";
  if (isToday)    wrapCls += "bg-gradient-to-b from-green-50 to-emerald-50 border border-green-200";
  else if (isTomorrow) wrapCls += "bg-purple-50 border border-purple-100";
  else            wrapCls += "bg-gray-50";

  return (
    <div className={wrapCls}>
      {isToday    && <span className="text-xs font-semibold text-green-700 leading-none">{t("today")}</span>}
      {isTomorrow && <span className="text-xs font-semibold text-purple-600 leading-none">{t("tomorrow")}</span>}
      {!isToday && !isTomorrow && <span className="text-xs text-gray-400 leading-none">{t("yesterday")}</span>}

      {hasVal ? (
        <span className={`font-extrabold leading-none ${isToday ? "text-green-700 text-lg" : isTomorrow ? "text-purple-600 text-base" : "text-gray-600 text-base"}`}>
          ₹{Number(slot.price).toLocaleString("en-IN")}
        </span>
      ) : (
        <span className="text-gray-300 font-bold text-base leading-none">{t("noData")}</span>
      )}

      <span className="text-xs text-gray-400 leading-none">{unit}</span>

      {/* source badge */}
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs ${meta.bg} ${meta.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${meta.dot}`} />
        {t(meta.labelKey)}
      </span>

      {/* date if available */}
      {slot?.date && (
        <span className="text-xs text-gray-300 leading-none">{slot.date}</span>
      )}
    </div>
  );
};

// Trend badge — computed independently per card
const TrendBadge = ({ today, tomorrow }) => {
  if (!today?.price || !tomorrow?.price) return null;
  const diff = tomorrow.price - today.price;
  const pct  = Math.round((diff / today.price) * 1000) / 10;
  if (Math.abs(pct) < 0.1) return <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">→ Stable</span>;
  const up = diff > 0;
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${up ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
      {up ? "↑" : "↓"} {Math.abs(pct)}%
    </span>
  );
};

// Mini trend bar — uses only this card's own data
const TrendBar = ({ today, tomorrow }) => {
  if (!today?.price || !tomorrow?.price) return null;
  const diff  = tomorrow.price - today.price;
  const pct   = Math.round((diff / today.price) * 1000) / 10;
  const up    = diff > 0;
  const width = Math.min(100, Math.max(5, 50 + pct * 4));
  return (
    <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
      <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-1 rounded-full transition-all duration-700 ${up ? "bg-green-500" : "bg-red-400"}`} style={{ width: `${width}%` }} />
      </div>
      <span className="text-xs text-gray-400 whitespace-nowrap">
        {up ? "📈 Rising" : "📉 Falling"}
      </span>
    </div>
  );
};

// Warning labels for data_warnings array items
const WARNING_META = {
  today_data_missing:                   { icon: "⚠️", text: "Today's data unavailable", color: "text-amber-600 bg-amber-50 border-amber-200" },
  yesterday_data_missing:               { icon: "ℹ️", text: "Yesterday's data unavailable", color: "text-gray-500 bg-gray-50 border-gray-200" },
  tomorrow_ml_unavailable_used_fallback:{ icon: "🔄", text: "Tomorrow: moving avg (ML offline)", color: "text-yellow-700 bg-yellow-50 border-yellow-200" },
  tomorrow_no_data:                     { icon: "❓", text: "Tomorrow's prediction unavailable", color: "text-gray-400 bg-gray-50 border-gray-200" },
  today_used_published_mrp:             { icon: "📋", text: "Today: using published MRP", color: "text-orange-600 bg-orange-50 border-orange-200" },
};

// One product card
const ProductCard = ({ item, isDairy, t }) => {
  const unit = isDairy ? `/${item.unit}` : "/qtl";
  const warnings = item.data_warnings || [];
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col gap-3">
      {/* header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-gray-800 text-sm leading-tight truncate">{item.name}</p>
          {isDairy && item.cooperative && (
            <p className="text-xs text-gray-400 mt-0.5">{item.cooperative}</p>
          )}
          {!isDairy && item.today?.records > 1 && (
            <p className="text-xs text-gray-400 mt-0.5">avg of {item.today.records} markets</p>
          )}
        </div>
        <TrendBadge today={item.today} tomorrow={item.tomorrow} />
      </div>

      {/* 3-column timeline */}
      <div className="grid grid-cols-3 gap-1.5">
        <PriceCell slot={item.yesterday} unit={unit} t={t} />
        <PriceCell slot={item.today}     unit={unit} isToday t={t} />
        <PriceCell slot={item.tomorrow}  unit={unit} isTomorrow t={t} />
      </div>

      <TrendBar today={item.today} tomorrow={item.tomorrow} />

      {/* Data quality warnings — only shown when backend flags an issue */}
      {warnings.length > 0 && (
        <div className="flex flex-col gap-1 pt-1">
          {warnings.map((w) => {
            const meta = WARNING_META[w];
            if (!meta) return null;
            return (
              <p key={w} className={`text-xs flex items-center gap-1 px-2 py-0.5 rounded-full border w-fit ${meta.color}`}>
                <span>{meta.icon}</span>{meta.text}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Skeleton
const SkeletonCard = () => (
  <div className="bg-white border border-gray-100 rounded-2xl p-4 animate-pulse space-y-3">
    <div className="flex justify-between"><div className="h-4 bg-gray-100 rounded w-2/5" /><div className="h-4 bg-gray-100 rounded w-12" /></div>
    <div className="grid grid-cols-3 gap-1.5">
      {[0,1,2].map(i => (
        <div key={i} className="rounded-xl bg-gray-50 py-3 px-2 space-y-2">
          <div className="h-2 bg-gray-100 rounded" />
          <div className="h-5 bg-gray-100 rounded" />
          <div className="h-2 bg-gray-100 rounded w-2/3 mx-auto" />
        </div>
      ))}
    </div>
  </div>
);

// ── Main Page ──────────────────────────────────────────────────────────────────
const MandiInsights = () => {
  const [active, setActive]     = useState("vegetables");
  const [data, setData]         = useState({});
  const [loading, setLoading]   = useState({});
  const [errors, setErrors]     = useState({});
  const [fetchedAt, setFetchedAt] = useState({});
  const { t } = useLang();

  const fetchCategory = useCallback(async (key) => {
    setLoading(l => ({ ...l, [key]: true }));
    setErrors(e  => ({ ...e, [key]: null }));
    try {
      const ep = key === "dairy"
        ? `${API}/mandi/dairy-prices`
        : `${API}/mandi/market-intelligence?category=${key}`;
      const { data: res } = await axios.get(ep, { timeout: 25000 });
      setData(d => ({ ...d, [key]: res.results || [] }));
      setFetchedAt(f => ({ ...f, [key]: new Date() }));
    } catch (err) {
      setErrors(e => ({ ...e, [key]: err.response?.data?.message || err.message || "Request failed" }));
    } finally {
      setLoading(l => ({ ...l, [key]: false }));
    }
  }, []);

  // fetch on tab switch (lazy)
  useEffect(() => {
    if (!data[active] && !loading[active]) fetchCategory(active);
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  const cat      = CATEGORIES.find(c => c.key === active);
  const col      = COLORS[cat?.color || "green"];
  const isDairy  = active === "dairy";
  const isLoad   = loading[active];
  const err      = errors[active];
  const items    = data[active] || [];
  const stamp    = fetchedAt[active];

  // Data source cards — farmer-friendly, bilingual via t()
  const dataSources = [
    {
      icon: "📅",
      titleKey: "yesterdayExplain",
      bg: "bg-gray-50 border-gray-200",
      descKeys: ["yesterdayDesc1", "yesterdayDesc2", "yesterdayDesc3", "yesterdayDesc4"],
    },
    {
      icon: "✅",
      titleKey: "todayExplain",
      bg: "bg-green-50 border-green-200",
      descKeys: ["todayDesc1", "todayDesc2", "todayDesc3", "todayDesc4"],
    },
    {
      icon: "🔮",
      titleKey: "tomorrowExplain",
      bg: "bg-purple-50 border-purple-200",
      descKeys: ["tomorrowDesc1", "tomorrowDesc2", "tomorrowDesc3", "tomorrowDesc4"],
    },
    {
      icon: "🥛",
      titleKey: "dairyExplain",
      bg: "bg-blue-50 border-blue-200",
      descKeys: ["dairyDesc1", "dairyDesc2", "dairyDesc3", "dairyDesc4"],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 tracking-tight">
            {t("mandiTitle")}
          </h1>
          <p className="text-gray-500 text-sm max-w-xl mx-auto">
            {t("mandiSubtitle")}
          </p>
          {/* legend */}
          <div className="flex flex-wrap justify-center gap-2">
            {Object.entries(SOURCE_META).filter(([k]) => k !== "live_api" && k !== "no_data").map(([k, v]) => (
              <span key={k} className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border ${v.bg} ${v.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${v.dot}`} />
                {t(v.labelKey)}
              </span>
            ))}
          </div>
        </div>

        {/* ── Category tabs ── */}
        <div className="flex flex-wrap gap-2 justify-center">
          {CATEGORIES.map(c => {
            const cc  = COLORS[c.color];
            const act = active === c.key;
            return (
              <button key={c.key} onClick={() => setActive(c.key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm border transition-all shadow-sm
                  ${act ? cc.active : cc.ghost}`}>
                {c.icon} {t(c.labelKey)}
                {loading[c.key] && <Spin sm />}
              </button>
            );
          })}
        </div>

        {/* ── Section bar ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-bold text-gray-800">{cat?.icon} {t(cat?.labelKey)} Prices</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isDairy
                ? "Source: Amul · Mother Dairy · Verka published MRP 2024-25"
                : "Source: Government Agmarknet (data.gov.in) · prices in ₹/quintal (100 kg)"}
              {stamp && ` · fetched ${stamp.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`}
            </p>
          </div>
          <button onClick={() => fetchCategory(active)} disabled={isLoad}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition
              ${isLoad ? "opacity-40 cursor-not-allowed" : ""} ${col.ghost}`}>
            {isLoad ? <Spin sm /> : "↻"} {t("refresh")}
          </button>
        </div>

        {/* ── Error ── */}
        {err && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm space-y-1">
            <p className="font-semibold text-red-700">⚠️ Could not load {t(cat?.labelKey)} prices</p>
            <p className="text-red-500">{err}</p>
            <p className="text-red-400 text-xs">
              Ensure Node.js server is running.
              {!isDairy && " Flask (port 5001) must be running for ML predictions. Run node seed-mandi.js to populate data."}
            </p>
          </div>
        )}

        {/* ── Skeletons ── */}
        {isLoad && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: isDairy ? 8 : 12 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* ── Product cards ── */}
        {!isLoad && items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((item, i) => <ProductCard key={i} item={item} isDairy={isDairy} t={t} />)}
          </div>
        )}

        {/* ── Empty state ── */}
        {!isLoad && !err && items.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm space-y-4">
            <p className="text-5xl">{cat?.icon}</p>
            <p className="font-semibold text-gray-700">No price data in database yet</p>
            <p className="text-sm text-gray-400">
              Run <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">node seed-mandi.js</code> to fetch real mandi data
            </p>
            <button onClick={() => fetchCategory(active)} className={`px-5 py-2.5 rounded-xl text-sm font-semibold border ${col.active}`}>
              Retry
            </button>
          </div>
        )}

        {/* ── Data Sources — Farmer-Friendly ── */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-700 mb-1">{t("dataSourcesTitle")}</h3>
          <p className="text-xs text-gray-400 mb-5">
            {active === "hi"
              ? "नीचे बताया गया है कि ये भाव कहाँ से आते हैं — बिल्कुल सरल भाषा में।"
              : "Here's a simple explanation of where each price comes from — no technical terms."}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            {dataSources.map((src, i) => (
              <div key={i} className={`rounded-xl border p-4 ${src.bg}`}>
                <p className="font-bold text-gray-800 mb-3 text-base">
                  {src.icon} {t(src.titleKey)}
                </p>
                <ul className="space-y-2">
                  {src.descKeys.map((key, j) => (
                    <li key={j} className="text-xs text-gray-600 flex gap-2 leading-relaxed">
                      <span className="text-green-400 mt-0.5 flex-shrink-0">✓</span>
                      <span>{t(key)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Quick tip box */}
          <div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
            <span className="text-2xl flex-shrink-0">💡</span>
            <div>
              <p className="font-semibold text-amber-800 text-sm mb-1">
                {active === "hi" ? "किसान भाइयों के लिए सलाह" : "Quick tip for farmers"}
              </p>
              <p className="text-xs text-amber-700 leading-relaxed">
                {active === "hi"
                  ? "आज का भाव असली सरकारी मंडी से आता है — इस पर भरोसा करें। कल का भाव सिर्फ एक अनुमान है — इसे एक अंदाजे के रूप में देखें, न कि पक्का भाव।"
                  : "Today's price is real government mandi data — you can trust it. Tomorrow's price is just a computer estimate — treat it as a rough guide, not a guaranteed price."}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MandiInsights;
