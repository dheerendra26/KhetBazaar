import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;
const API = import.meta.env.VITE_BACKEND_URL;

const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const handlePayment = ({ amount }) => {
  return new Promise(async (resolve, reject) => {
    const loaded = await loadRazorpay();
    if (!loaded) return reject("Razorpay SDK failed");

    const res = await fetch(`${API}/payments/razorpay/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });

    const data = await res.json();

    const options = {
      key: RAZORPAY_KEY_ID,
      amount: data.order.amount,
      currency: "INR",
      order_id: data.order.id,
      name: "KhetBazaar",

      handler: async function (response) {
        await fetch(`${API}/payments/razorpay/verify-payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(response),
        });
        resolve("success");
      },

      modal: {
        ondismiss: function () {
          resolve("closed");
        },
      },
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
  });
};

const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderData } = location.state || {};

  if (!orderData) {
    return <div>No order data found. Please try again.</div>;
  }
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    paymentMethod: "razorpay",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const amount = orderData.items.reduce(
      (acc, item) => acc + item.totalPrice,
      0,
    );

    if (formData.paymentMethod === "razorpay") {
      const result = await handlePayment({ amount });

      if (result === "success") {
        alert("Payment successful! Thank you for your purchase.");
        navigate("/");
      } else {
        alert("Payment cancelled.");
      }
    }else{
        alert("Payment successful! Thank you for your purchase.");
        navigate("/");
    }

  };

  return (
    <>
      <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
        <h1>Checkout Summary</h1>
        <h3>Buyer Email: {orderData.buyerEmail}</h3>
        <table border="1">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Total Price</th>
              <th>Seller Email</th>
            </tr>
          </thead>
          <tbody>
            {orderData.items.map((item, index) => (
              <tr key={index}>
                <td>{item.productName}</td>
                <td>{item.productPrice}</td>
                <td>{item.quantity}</td>
                <td>{item.totalPrice}</td>
                <td>{item.sellerEmail}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>Thank you for shopping with us!</p>
      </div>
      <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
        <h1>Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "15px" }}>
            <label
              htmlFor="name"
              style={{ display: "block", marginBottom: "5px" }}
            >
              Name:
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={{ width: "100%", padding: "10px", fontSize: "16px" }}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label
              htmlFor="address"
              style={{ display: "block", marginBottom: "5px" }}
            >
              Address:
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "10px",
                fontSize: "16px",
                resize: "vertical",
              }}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label
              htmlFor="paymentMethod"
              style={{ display: "block", marginBottom: "5px" }}
            >
              Payment Method:
            </label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              style={{ width: "100%", padding: "10px", fontSize: "16px" }}
            >
              <option value="creditCard">Credit Card</option>
              <option value="debitCard">Debit Card</option>
              <option value="paypal">PayPal</option>
              <option value="razorpay">Razorpay</option>
            </select>
          </div>

          {formData.paymentMethod !== "paypal" &&
            formData.paymentMethod !== "razorpay" && (
              <>
                <div style={{ marginBottom: "15px" }}>
                  <label
                    htmlFor="cardNumber"
                    style={{ display: "block", marginBottom: "5px" }}
                  >
                    Card Number:
                  </label>
                  <input
                    type="text"
                    id="cardNumber"
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={handleChange}
                    required
                    pattern="\d{16}"
                    maxLength="16"
                    style={{ width: "100%", padding: "10px", fontSize: "16px" }}
                  />
                </div>
                <div
                  style={{ marginBottom: "15px", display: "flex", gap: "10px" }}
                >
                  <div style={{ flex: 1 }}>
                    <label
                      htmlFor="expiryDate"
                      style={{ display: "block", marginBottom: "5px" }}
                    >
                      Expiry Date:
                    </label>
                    <input
                      type="text"
                      id="expiryDate"
                      name="expiryDate"
                      value={formData.expiryDate}
                      onChange={handleChange}
                      required
                      placeholder="MM/YY"
                      style={{
                        width: "100%",
                        padding: "10px",
                        fontSize: "16px",
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label
                      htmlFor="cvv"
                      style={{ display: "block", marginBottom: "5px" }}
                    >
                      CVV:
                    </label>
                    <input
                      type="text"
                      id="cvv"
                      name="cvv"
                      value={formData.cvv}
                      onChange={handleChange}
                      required
                      maxLength="3"
                      pattern="\d{3}"
                      style={{
                        width: "100%",
                        padding: "10px",
                        fontSize: "16px",
                      }}
                    />
                  </div>
                </div>
              </>
            )}

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "10px",
              fontSize: "18px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            Place Order
          </button>
        </form>
      </div>
    </>
  );
};

export default CheckoutPage;
