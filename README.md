# 🌾 KhetBazaar - Farm-to-Customer Marketplace

**KhetBazaar** is a full-stack web application that connects farmers directly to customers, eliminating middlemen and ensuring fair prices. Built using the **MERN stack** with **MongoDB** as the database, the platform provides secure authentication, product listings, and a shopping cart system.

### 🖼️ Hero Page

![Hero Page](./website-demo/Hero-Page.png)

---

## 🚀 Features

- User **signup** and **login** with JWT authentication.
- Browse **products** with details (name, price, location, description, image)
- **Filter** products by price, location, or search query
- **View product details** on a separate page
- **Add products to cart** and **checkout** securely
- **Profile management** for users
- **Sell products** by uploading listings
- Responsive and mobile-friendly frontend using **React.js**
- Backend API built with **Node.js** and **Express.js**
- Data storage with **MongoDB**

---

## 🛠️ Tech Stack

- **Frontend**: React.js, HTML, CSS, JavaScript, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT-based

**Hosting**:

- **Frontend**: Vite / Netlify / Render
- **Backend**: Render

---

## 📍 How It Works

### 👤 User Capabilities

- 📝 Register an account
- 🔐 Login to the platform
- 🌾 Browse available products
- 🔎 Filter products by price, location, or search term
- 🛒 Add products to **cart**
- 💳 Checkout and complete purchase
- 👤 Manage **profile details**
- 📝 Upload products for sale (farmers/sellers only)

---

### 🛠️ Admin / Seller Capabilities

- 👤 Create new admin users (optional)
- 📊 Access dashboard for managing listings
- 🌾 Add new products
- ✏️ Edit or update existing product details
- ❌ Delete product listings

---

## 🔁 Shopping Flow

1. **User logs in or signs up**
2. **Products are fetched and displayed**
3. **User applies filters or searches products**
4. **User clicks on a product** → navigates to details page
5. **Add product to cart**
6. **Proceed to checkout** → backend validates user and product availability
7. **Order is confirmed** → user receives confirmation
8. **Sellers can manage their product listings**

---

## 🖥️ Live Demo

👉 **[Explore](https://farmersconnnect.netlify.app/)**

---

## 🏪 Mandi Insights Module (New)

A full ML-powered module that fetches live government mandi data, trains a price prediction model, and helps farmers understand how much more they earn by selling directly.

### Architecture

```
data.gov.in API
      ↓
Node.js /mandi/fetch  →  MongoDB (MandiPrice collection)
                               ↓
                    Flask ML Service (/predict)
                    [Random Forest trained on modal prices]
                               ↓
              Node.js /mandi/predict-price
              Node.js /mandi/profit-comparison
                               ↓
                  React – MandiInsights page (/mandi-insights)
```

### New API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/mandi/fetch?commodity=Tomato&limit=100` | Fetch & store from data.gov.in |
| GET | `/mandi/prices?commodity=tomato&limit=50` | Query stored mandi records |
| POST | `/mandi/predict-price` | `{ crop, date }` → predicted modal price |
| POST | `/mandi/profit-comparison` | `{ crop, date, quantity_kg }` → earnings with/without middleman |

### Flask ML Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Check model status |
| POST | `/predict` | `{ crop, day, month, year }` → price |
| POST | `/retrain` | Force retrain from DB |

### Quick Start

**1. Start Flask ML service**
```bash
cd flask-ml
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
MONGO_URI=your_mongo_uri python app.py
```

**2. Seed mandi data + train model**
```bash
cd server
node seed-mandi.js
```

**3. Add to server `.env`**
```
FLASK_URL=http://localhost:5001
GOV_API_KEY=579b464db66ec23bdd000001cdd3946e44ce4aad38534209a5a3c9d0
```

**4. Visit `/mandi-insights` in the React app**

### Or use Docker Compose
```bash
docker-compose up --build
```

