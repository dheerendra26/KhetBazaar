import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';


const CheckoutPage = () => {
    const location = useLocation();
    const { orderData } = location.state || {};

    if (!orderData) {
        return <div>No order data found. Please try again.</div>;
    }
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        paymentMethod: 'creditCard',
        cardNumber: '',
        expiryDate: '',
        cvv: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form submitted:', formData);
        alert("Thank you for your purchase! You will receive an email confirmation shortly.");
    };

    return (
        <>
            <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto' }}>
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
            <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto' }}>
                <h1>Checkout</h1>

                <form onSubmit={handleSubmit}>
                    {/* Name */}
                    <div style={{ marginBottom: '15px' }}>
                        <label htmlFor="name" style={{ display: 'block', marginBottom: '5px' }}>
                            Name:
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: '10px', fontSize: '16px', }}
                        />
                    </div>

                    {/* Address */}
                    <div style={{ marginBottom: '15px' }}>
                        <label htmlFor="address" style={{ display: 'block', marginBottom: '5px' }}>
                            Address:
                        </label>
                        <textarea
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: '10px', fontSize: '16px', resize: 'vertical' }}
                        />
                    </div>

                    {/* Payment Method */}
                    <div style={{ marginBottom: '15px' }}>
                        <label htmlFor="paymentMethod" style={{ display: 'block', marginBottom: '5px' }}>
                            Payment Method:
                        </label>
                        <select
                            id="paymentMethod"
                            name="paymentMethod"
                            value={formData.paymentMethod}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '10px', fontSize: '16px' }}
                        >
                            <option value="creditCard">Credit Card</option>
                            <option value="debitCard">Debit Card</option>
                            <option value="paypal">PayPal</option>
                        </select>
                    </div>

                    {/* Card Details */}
                    {formData.paymentMethod !== 'paypal' && (
                        <>
                            <div style={{ marginBottom: '15px' }}>
                                <label htmlFor="cardNumber" style={{ display: 'block', marginBottom: '5px' }}>
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
                                    style={{ width: '100%', padding: '10px', fontSize: '16px' }}
                                />
                            </div>
                            <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
                                <div style={{ flex: 1 }}>
                                    <label htmlFor="expiryDate" style={{ display: 'block', marginBottom: '5px' }}>
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
                                        style={{ width: '100%', padding: '10px', fontSize: '16px' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label htmlFor="cvv" style={{ display: 'block', marginBottom: '5px' }}>
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
                                        style={{ width: '100%', padding: '10px', fontSize: '16px' }}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <button
                        type="submit"
                        style={{
                            width: '100%',
                            padding: '10px',
                            fontSize: '18px',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer'
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