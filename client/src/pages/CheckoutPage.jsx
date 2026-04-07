import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;
const API = import.meta.env.VITE_BACKEND_URL;

/* ─── Razorpay SDK loader ───────────────────────────────────────── */
const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

/* ─── Preset top-up amounts ─────────────────────────────────────── */
const PRESET_AMOUNTS = [100, 250, 500, 1000, 2000, 5000];

/* ═══════════════════════════════════════════════════════════════════
   WalletTopUpModal — inline modal for adding funds via Razorpay
═══════════════════════════════════════════════════════════════════ */
const WalletTopUpModal = ({ onClose, onSuccess, currentBalance, email }) => {
  const [amount, setAmount] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState("select"); // "select" | "success"
  const [addedAmount, setAddedAmount] = useState(0);
  const [newBalance, setNewBalance] = useState(currentBalance);

  const effectiveAmount = useCustom ? customAmount : amount;
  const parsedAmount = Number(effectiveAmount);
  const isValidAmount =
    effectiveAmount !== "" &&
    Number.isFinite(parsedAmount) &&
    parsedAmount >= 1 &&
    parsedAmount <= 100000;

  const handlePreset = (val) => {
    setAmount(String(val));
    setUseCustom(false);
    setError("");
  };

  const handleCustomChange = (e) => {
    const val = e.target.value;
    if (/^\d*\.?\d{0,2}$/.test(val)) {
      setCustomAmount(val);
      setError("");
    }
  };

  const handlePay = async () => {
    setError("");
    if (!isValidAmount) {
      setError("Please enter a valid amount between ₹1 and ₹1,00,000.");
      return;
    }
    setLoading(true);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) {
        setError("Payment gateway failed to load. Please try again.");
        setLoading(false);
        return;
      }

      const res = await fetch(`${API}/payments/razorpay/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parsedAmount }),
      });
      if (!res.ok) throw new Error("Failed to initiate payment");
      const data = await res.json();

      const options = {
        key: RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: "INR",
        order_id: data.order.id,
        name: "KhetBazaar Wallet",
        description: `Add ₹${parsedAmount.toLocaleString("en-IN")} to wallet`,
        handler: async () => {
          try {
            const topupRes = await fetch(`${API}/wallet/topup`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, amount: parsedAmount }),
            });
            const topupData = await topupRes.json();
            if (!topupRes.ok) throw new Error(topupData.message || "Top-up failed");

            setAddedAmount(parsedAmount);
            setNewBalance(topupData.walletBalance);
            setStep("success");
            onSuccess(topupData.walletBalance);
          } catch (err) {
            setError(err.message || "Wallet credit failed. Please contact support.");
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
        prefill: { email },
        theme: { color: "#16a34a" },
      };
      new window.Razorpay(options).open();
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.48)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ animation: "modalIn 0.22s cubic-bezier(.34,1.56,.64,1) both" }}
      >
        {step === "success" ? (
          <div className="p-8 text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "linear-gradient(135deg,#bbf7d0,#4ade80)" }}
            >
              <span className="text-4xl">✅</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-1">Wallet Topped Up!</h3>
            <p className="text-gray-500 mb-2">
              <span className="font-semibold text-green-600">
                ₹{addedAmount.toLocaleString("en-IN")}
              </span>{" "}
              added successfully.
            </p>
            <p className="text-sm text-gray-400 mb-6">
              New balance:{" "}
              <span className="font-bold text-gray-700">
                ₹{newBalance.toLocaleString("en-IN")}
              </span>
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-green-600 text-white font-bold text-base hover:bg-green-700 transition"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div
              className="px-6 py-5 flex items-center justify-between"
              style={{ background: "linear-gradient(135deg,#14532d 0%,#166534 60%,#15803d 100%)" }}
            >
              <div>
                <p className="text-green-300 text-xs font-semibold tracking-widest uppercase mb-0.5">
                  KhetBazaar Wallet
                </p>
                <h3 className="text-white text-xl font-bold">Add Funds</h3>
              </div>
              <button
                onClick={onClose}
                className="text-green-200 hover:text-white text-3xl leading-none transition w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {/* Current balance */}
              <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-2xl px-4 py-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-xl">
                  💰
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Current Balance</p>
                  <p className="text-lg font-extrabold text-green-700">
                    ₹{currentBalance.toLocaleString("en-IN")}
                  </p>
                </div>
                {parsedAmount > 0 && isValidAmount && (
                  <div className="ml-auto text-right">
                    <p className="text-xs text-gray-400">After top-up</p>
                    <p className="text-base font-bold text-green-600">
                      ₹{(currentBalance + parsedAmount).toLocaleString("en-IN")}
                    </p>
                  </div>
                )}
              </div>

              {/* Preset amounts */}
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Quick Select
              </p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {PRESET_AMOUNTS.map((val) => (
                  <button
                    key={val}
                    onClick={() => handlePreset(val)}
                    className={`py-2.5 rounded-xl text-sm font-bold border-2 transition ${
                      !useCustom && Number(amount) === val
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 text-gray-600 hover:border-green-300 hover:bg-green-50"
                    }`}
                  >
                    ₹{val.toLocaleString("en-IN")}
                  </button>
                ))}
              </div>

              {/* Custom amount */}
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Custom Amount
              </p>
              <div className="relative mb-5">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg pointer-events-none">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  max="100000"
                  step="1"
                  placeholder="Enter amount"
                  value={customAmount}
                  onChange={handleCustomChange}
                  onFocus={() => setUseCustom(true)}
                  className={`w-full pl-9 pr-4 py-3 rounded-xl border-2 text-gray-800 font-semibold text-base outline-none transition ${
                    useCustom && customAmount
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 bg-gray-50 focus:border-green-400"
                  }`}
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
                  <span className="mt-0.5">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handlePay}
                disabled={loading || !isValidAmount}
                className={`w-full py-4 rounded-2xl font-bold text-base transition ${
                  loading || !isValidAmount
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700 active:scale-95 shadow-lg shadow-green-200"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing…
                  </span>
                ) : isValidAmount ? (
                  `Pay ₹${parsedAmount.toLocaleString("en-IN")} via Razorpay`
                ) : (
                  "Select or enter an amount"
                )}
              </button>

              <p className="text-center text-xs text-gray-400 mt-3">
                🔒 Secured by Razorpay · Instant credit to wallet
              </p>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.88) translateY(20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   Main CheckoutPage
═══════════════════════════════════════════════════════════════════ */
const CheckoutPage = () => {
  const navigate = useNavigate();
  const { userEmail } = useAuth();
  const { t } = useLang();

  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(true);
  const [showTopUp, setShowTopUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const email = userEmail || localStorage.getItem("userEmail");

  /* ── Fetch wallet balance from dedicated REST endpoint ── */
  const fetchWalletBalance = useCallback(async () => {
    if (!email) return;
    setWalletLoading(true);
    try {
      const res = await fetch(`${API}/wallet/${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setWalletBalance(data.walletBalance ?? 0);
      }
    } catch {
      /* silent — wallet will show ₹0 */
    } finally {
      setWalletLoading(false);
    }
  }, [email]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(stored);
    fetchWalletBalance();
  }, [fetchWalletBalance]);

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const walletShortfall = Math.max(0, totalAmount - walletBalance);
  const walletSufficient = walletBalance >= totalAmount;

  const buildOrderItems = () =>
    cart.map((item) => ({
      productId: item._id,
      productName: item.name,
      productPrice: item.price,
      quantity: item.quantity,
      totalPrice: item.price * item.quantity,
      sellerEmail: item.sellerEmail || item.email || "seller@khetbazaar.com",
    }));

  const sendOrderNotification = async (method) => {
    const res = await fetch(`${API}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        buyerEmail: email,
        items: buildOrderItems(),
        paymentMethod: method,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Order failed");
    // Backend returns updated walletBalance for wallet payments — sync instantly
    if (method === "wallet" && data.walletBalance !== undefined) {
      setWalletBalance(data.walletBalance);
    }
    return data;
  };

  const handlePlaceOrder = async () => {
    setError("");
    setLoading(true);
    try {
      if (paymentMethod === "cod") {
        await sendOrderNotification("cod");
        localStorage.removeItem("cart");
        navigate("/orders", { state: { success: true, method: "cod" } });

      } else if (paymentMethod === "wallet") {
        if (!walletSufficient) {
          setError(
            `Insufficient balance. You need ₹${walletShortfall.toLocaleString("en-IN")} more.`
          );
          setLoading(false);
          return;
        }
        await sendOrderNotification("wallet");
        localStorage.removeItem("cart");
        navigate("/orders", { state: { success: true, method: "wallet" } });

      } else {
        // Razorpay
        const loaded = await loadRazorpay();
        if (!loaded) {
          setError("Razorpay SDK failed to load.");
          setLoading(false);
          return;
        }
        const res = await fetch(`${API}/payments/razorpay/create-order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: totalAmount }),
        });
        const data = await res.json();
        const options = {
          key: RAZORPAY_KEY_ID,
          amount: data.order.amount,
          currency: "INR",
          order_id: data.order.id,
          name: "KhetBazaar",
          description: "Fresh Farm Products",
          handler: async () => {
            await sendOrderNotification("razorpay");
            localStorage.removeItem("cart");
            navigate("/orders", { state: { success: true, method: "razorpay" } });
          },
          modal: { ondismiss: () => setLoading(false) },
          prefill: { email },
          theme: { color: "#16a34a" },
        };
        new window.Razorpay(options).open();
      }
    } catch (err) {
      setError(err.message || "Order placement failed. Please try again.");
    } finally {
      if (paymentMethod !== "razorpay") setLoading(false);
    }
  };

  if (cart.length === 0)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-yellow-50">
        <div className="text-center bg-white rounded-2xl shadow p-10">
          <p className="text-5xl mb-4">🛒</p>
          <p className="text-xl text-gray-600 mb-4">Your cart is empty</p>
          <button
            onClick={() => navigate("/shop")}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
          >
            Browse Shop
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-green-700 mb-6">🧾 Checkout</h1>

        {/* ── Order Summary ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow p-6 mb-5">
          <h2 className="font-bold text-gray-700 mb-4 text-lg">Order Summary</h2>
          <div className="space-y-3">
            {cart.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <img
                  src={item.image || "https://via.placeholder.com/50"}
                  className="w-12 h-12 rounded-lg object-cover"
                  alt=""
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-800 text-sm">{item.name}</p>
                  <p className="text-xs text-gray-400">
                    Qty: {item.quantity} × ₹{item.price}
                  </p>
                </div>
                <p className="font-bold text-green-600">
                  ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                </p>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-4 pt-4 flex items-center justify-between">
            <span className="font-bold text-gray-700 text-lg">Total</span>
            <span className="font-bold text-green-600 text-2xl">
              ₹{totalAmount.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* ── Wallet Balance Card ───────────────────────────── */}
        <div
          className="rounded-2xl shadow-md p-5 mb-5 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg,#14532d 0%,#166534 55%,#15803d 100%)",
          }}
        >
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white opacity-10 pointer-events-none" />
          <div className="absolute -bottom-10 -left-6 w-32 h-32 rounded-full bg-white opacity-10 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💰</span>
                <div>
                  <p className="text-green-300 text-xs font-semibold tracking-widest uppercase">
                    KhetBazaar Wallet
                  </p>
                  <p className="text-white font-extrabold text-2xl leading-tight">
                    {walletLoading ? (
                      <span className="inline-block w-24 h-7 bg-white/20 rounded-lg animate-pulse" />
                    ) : (
                      `₹${walletBalance.toLocaleString("en-IN")}`
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowTopUp(true)}
                className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 active:scale-95 text-white text-sm font-bold px-4 py-2 rounded-xl transition border border-white/30"
              >
                <span className="text-lg leading-none">+</span>
                Add Funds
              </button>
            </div>

            {/* Balance progress bar vs. order total */}
            {!walletLoading && totalAmount > 0 && (
              <div>
                <div className="flex justify-between text-xs text-green-200 mb-1">
                  <span>Wallet balance</span>
                  <span>Order: ₹{totalAmount.toLocaleString("en-IN")}</span>
                </div>
                <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(100, (walletBalance / totalAmount) * 100)}%`,
                      background: walletSufficient
                        ? "linear-gradient(90deg,#4ade80,#86efac)"
                        : "linear-gradient(90deg,#fbbf24,#fde68a)",
                    }}
                  />
                </div>
                <p className="text-xs mt-1.5">
                  {walletSufficient ? (
                    <span className="text-green-300">
                      ✓ Sufficient · ₹{(walletBalance - totalAmount).toLocaleString("en-IN")} will remain after purchase
                    </span>
                  ) : (
                    <span className="text-yellow-300">
                      ⚠ Need ₹{walletShortfall.toLocaleString("en-IN")} more to use wallet
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Payment Method ────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow p-6 mb-5">
          <h2 className="font-bold text-gray-700 mb-4 text-lg">💳 Payment Method</h2>
          <div className="space-y-3">
            {[
              {
                value: "razorpay",
                icon: "🏦",
                label: t("onlinePayment"),
                sub: t("onlinePaymentSub"),
                badge: null,
                subRed: false,
              },
              {
                value: "cod",
                icon: "💵",
                label: t("cashOnDelivery"),
                sub: t("cashOnDeliverySub"),
                badge: null,
                subRed: false,
              },
              {
                value: "wallet",
                icon: "👛",
                label: "Pay with Wallet",
                sub: walletLoading
                  ? "Checking balance…"
                  : walletSufficient
                  ? `Available: ₹${walletBalance.toLocaleString("en-IN")}`
                  : `Need ₹${walletShortfall.toLocaleString("en-IN")} more`,
                badge: !walletLoading && walletSufficient ? "READY" : null,
                subRed: !walletLoading && !walletSufficient,
              },
            ].map((opt) => (
              <label
                key={opt.value}
                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${
                  paymentMethod === opt.value
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-green-300"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={opt.value}
                  checked={paymentMethod === opt.value}
                  onChange={(e) => {
                    setPaymentMethod(e.target.value);
                    setError("");
                  }}
                  className="mt-1 accent-green-600"
                />
                <span className="text-xl mt-0.5">{opt.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-800">{opt.label}</p>
                    {opt.badge && (
                      <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">
                        {opt.badge}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs mt-0.5 ${opt.subRed ? "text-amber-500 font-medium" : "text-gray-400"}`}>
                    {opt.sub}
                  </p>
                </div>
                {/* Inline Top Up link when wallet is selected but insufficient */}
                {opt.value === "wallet" && !walletSufficient && paymentMethod === "wallet" && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowTopUp(true);
                    }}
                    className="text-xs font-bold text-green-600 underline hover:text-green-700 whitespace-nowrap mt-1"
                  >
                    Top Up →
                  </button>
                )}
              </label>
            ))}
          </div>

          {/* Insufficient wallet nudge */}
          {paymentMethod === "wallet" && !walletSufficient && !walletLoading && (
            <div className="mt-3 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <span className="text-amber-500 mt-0.5">⚠️</span>
              <div className="flex-1">
                <p className="text-sm text-amber-700 font-medium">Wallet balance is insufficient</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Add at least ₹{walletShortfall.toLocaleString("en-IN")} to use wallet for this order.
                </p>
              </div>
              <button
                onClick={() => setShowTopUp(true)}
                className="text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg transition whitespace-nowrap"
              >
                + Add Funds
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
            <span>❌</span>
            {error}
          </div>
        )}

        {/* ── Place Order button ────────────────────────────── */}
        <button
          onClick={handlePlaceOrder}
          disabled={
            loading ||
            (paymentMethod === "wallet" && (!walletSufficient || walletLoading))
          }
          className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition ${
            loading || (paymentMethod === "wallet" && (!walletSufficient || walletLoading))
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-green-600 text-white hover:bg-green-700 active:scale-95"
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing…
            </span>
          ) : paymentMethod === "cod" ? (
            `📦 ${t("placeOrder")} (COD)`
          ) : paymentMethod === "wallet" ? (
            walletSufficient
              ? `👛 Pay ₹${totalAmount.toLocaleString("en-IN")} with Wallet`
              : "👛 Insufficient Balance"
          ) : (
            `💳 Pay ₹${totalAmount.toLocaleString("en-IN")}`
          )}
        </button>

        <p className="text-center text-xs text-gray-400 mt-4">
          🔒 Your payment is secure and encrypted
        </p>
      </div>

      {/* ── Wallet Top-Up Modal ───────────────────────────── */}
      {showTopUp && (
        <WalletTopUpModal
          email={email}
          currentBalance={walletBalance}
          onClose={() => setShowTopUp(false)}
          onSuccess={(newBalance) => {
            setWalletBalance(newBalance);
            setShowTopUp(false);
          }}
        />
      )}
    </div>
  );
};

export default CheckoutPage;
