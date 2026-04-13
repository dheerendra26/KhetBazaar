import { createContext, useContext, useState } from "react";

const LanguageContext = createContext();

export const translations = {
  en: {
    // ── NAVBAR ──
    home: "Home", shop: "Shop", sell: "Sell", myProducts: "My Products",
    dashboard: "📊 Dashboard", mandi: "🏪 Mandi", orders: "Orders",
    about: "About", cart: "Cart", profile: "Profile", logout: "Logout",
    login: "Login", register: "Register",

    // ── HOME ──
    heroBadge: "🌱 100% Fresh & Organic",
    heroTitle1: "Fresh From", heroTitleHighlight: "Farm", heroTitle2: "Directly To Your Home",
    heroDesc: "Buy fresh vegetables and fruits directly from verified farmers. Support local agriculture while enjoying healthier food for your family.",
    startShopping: "🛒 Start Shopping", learnMore: "Learn More →",
    todayFreshStock: "Today's Fresh Stock", products500: "500+ Products",
    whoAreYou: "Who Are You?", chooseYourPath: "Choose your path on KhetBazaar",
    imCustomer: "I'm a Customer", customerDesc: "Explore fresh farm products directly from verified farmers at fair prices.",
    shopFreshProduce: "Shop Fresh Produce",
    imFarmer: "I'm a Farmer", farmerDesc: "Upload your crops and sell directly to thousands of customers nationwide.",
    startSellingCrops: "Start Selling Crops",
    checkWeather: "Check Weather", weatherDesc: "Real-time weather updates to plan your farming and purchasing decisions.",
    checkWeatherNow: "Check Weather Now",
    ourProducts: "Our Products", whatWeOffer: "What We Offer",
    whatWeOfferDesc: "Fresh, organic, and directly sourced products for a healthier lifestyle.",
    whyChooseUs: "Why Choose Us", builtForFarmers: "Built for Farmers, Loved by Customers",
    readyFarmFresh: "Ready to go farm-fresh?",
    joinKhetBazaar: "Join KhetBazaar today and experience the difference of buying directly from farmers.",
    getStartedFree: "Get Started Free →", browseProducts: "Browse Products",
    happyCustomers: "Happy Customers", verifiedFarmers: "Verified Farmers",
    productVarieties: "Product Varieties", organicCertified: "Organic Certified",
    // features
    directFromFarm: "Direct from Farm", directFromFarmDesc: "No middlemen, no markup. Buy straight from the farmer who grew it.",
    qualityVerified: "Quality Verified", qualityVerifiedDesc: "Every product vetted for freshness and quality before listing.",
    organicFirst: "Organic First", organicFirstDesc: "Prioritizing natural farming practices for healthier produce.",
    fastDelivery: "Fast Delivery", fastDeliveryDesc: "Fresh produce delivered to your doorstep within 24–48 hours.",
    // categories
    vegetables: "Vegetables", fruits: "Fruits", dairy: "Dairy", seeds: "Seeds",
    browse: "Browse",

    // ── ABOUT ──
    ourStory: "🌾 Our Story",
    aboutTitle: "About KhetBazaar",
    aboutHeroDesc: "Connecting farmers directly to consumers — eliminating middlemen, ensuring fair prices, and bringing the freshest produce to your home.",
    ourMission: "Our Mission",
    empoweringFarmers: "Empowering Farmers with Digital Connectivity",
    missionP1: "KhetBazaar was born out of a passion for agricultural empowerment and a desire to revolutionize the way farmers connect with consumers. We began with a simple idea: create a digital platform where farmers can directly sell their produce, eliminating intermediaries and ensuring fair compensation.",
    missionP2: "From fresh vegetables and fruits to organic grains and dairy products, we offer an extensive collection directly sourced from local farmers and agricultural cooperatives, promoting sustainable farming practices and rural economic development.",
    happyCustomersStat: "Happy Customers", verifiedFarmersStat: "Verified Farmers",
    productTypes: "Product Types", avgRating: "Average Rating",
    whyUs: "Why Us", whyChooseKhetBazaar: "Why Choose KhetBazaar?",
    whyDesc: "We're more than a marketplace — we're a movement to support local farmers and bring transparency to food sourcing.",
    qualityAssurance: "Quality Assurance", qualityAssuranceDesc: "We meticulously vet every product to ensure it meets our stringent freshness and safety standards before listing.",
    fastConvenient: "Fast & Convenient", fastConvenientDesc: "With our user-friendly interface and hassle-free ordering, fresh produce is just a few taps away.",
    exceptionalSupport: "Exceptional Support", exceptionalSupportDesc: "Our dedicated team is here to assist you every step of the way, ensuring complete satisfaction.",
    sustainableFarming: "Sustainable Farming", sustainableFarmingDesc: "We promote eco-friendly farming practices that protect the environment for future generations.",
    fairPrices: "Fair Prices", fairPricesDesc: "By removing middlemen, farmers earn more and customers pay less — everyone wins.",
    securePlatform: "Secure Platform", securePlatformDesc: "Your data and payments are protected with enterprise-grade security and encryption.",
    theProcess: "The Process", howItWorks: "How KhetBazaar Works",
    farmerLists: "Farmer Lists", farmerListsDesc: "Verified farmers upload fresh produce with real-time stock and pricing.",
    youShop: "You Shop", youShopDesc: "Browse, filter, and order from hundreds of farm-fresh products.",
    deliveredFresh: "Delivered Fresh", deliveredFreshDesc: "Receive fresh produce directly from the farm to your doorstep.",
    readyExperience: "Ready to Experience Farm-Fresh?",
    joinToday: "Join KhetBazaar today — support farmers, eat healthier.",
    shopNow: "Shop Now →", joinFree: "Join Free",

    // ── FOOTER ──
    footerDesc: "KhetBazaar is a digital marketplace connecting farmers directly with customers. By eliminating middlemen, we ensure fair prices, fresh produce, and empower India's agricultural ecosystem.",
    company: "Company", aboutUs: "About Us", delivery: "Delivery", privacyPolicy: "Privacy Policy",
    getInTouch: "Get in Touch", allRightsReserved: "All Rights Reserved.",

    // ── LOGIN ──
    welcomeBack: "Welcome Back 🌾",
    enterEmailStep: "Enter your email to receive an OTP",
    enterOtpStep: "Enter the OTP sent to your email",
    emailAddress: "Email Address",
    emailPlaceholder: "example@email.com",
    sendOtp: "Send OTP 📩", sendingOtp: "Sending OTP...",
    verifyLogin: "Verify & Login 🔐", loggingIn: "Logging in...",
    resendOtp: "Resend OTP", change: "Change",
    otpLabel: "OTP", otpPlaceholder: "Enter 6-digit OTP",
    noAccount: "Don't have an account?", registerNow: "Register Now",

    // ── REGISTER ──
    createAccount: "Create Account", verifyEmail: "Verify Email",
    joinThousands: "Join thousands of farmers and buyers",
    iAmCustomer: "I am a Customer", iAmFarmer: "I am a Farmer",
    selectRole: "Select your role",
    agreeTo: "I agree to the", privacyPolicyLink: "Privacy Policy",
    getOtpRegister: "Get OTP & Register →", registering: "Registering...",
    verifyOtp: "Verify OTP & Continue →", verifying: "Verifying...",
    alreadyHaveAccount: "Already have an account?", loginHere: "Login Here",

    // ── SHOP ──
    searchPlaceholder: "Search products...",
    allCategories: "All Categories", filterByPrice: "Filter by price",
    under50: "Under ₹50", under100: "Under ₹100", under200: "Under ₹200",
    organicOnly: "Organic Only", rating4plus: "4★ & above",
    nearbyProducts: "Nearby Products", trendingNow: "Trending Now",
    noProductsFound: "No products found.", addToCart: "Add to Cart",
    perKg: "/kg", perLitre: "/litre", perPiece: "/piece",
    organic: "Organic", inStock: "in stock",

    // ── UPLOAD (SELL) ──
    sellYourCrops: "Sell Your Crops", sellDesc: "List your fresh produce and reach thousands of buyers directly.",
    productName: "Product Name", productNamePh: "e.g. Fresh Tomatoes",
    description: "Description", descPh: "Describe your product, quality, farming method...",
    yourPrice: "Your Selling Price (₹)", marketPriceLbl: "Market Price (₹)",
    stockQty: "Stock Quantity", locationLbl: "Your Location",
    locationPh: "City / Area (e.g. Ludhiana, Punjab)",
    unitLabel: "Unit", imageUrls: "Product Image URLs",
    addImage: "+ Add Image", submitListing: "Submit Listing",
    listingSuccess: "Product listed successfully!",

    // ── MY PRODUCTS (DELETE) ──
    myProductsTitle: "My Listed Products",
    myProductsDesc: "Manage, edit, or delete your listed products",
    noProductsYet: "You haven't listed any products yet.",
    editBtn: "Edit", deleteBtn: "Delete", loadingProducts: "Loading your products...",

    // ── CART ──
    yourCart: "Your Cart", cartEmpty: "Your cart is empty",
    remove: "Remove", subtotal: "Subtotal", shipping: "Shipping",
    shippingFree: "Free", total: "Total", proceedCheckout: "Proceed to Checkout",

    // ── CHECKOUT ──
    checkout: "Checkout", orderSummary: "Order Summary",
    paymentMethod: "Payment Method",
    onlinePayment: "💳 Online Payment (UPI / Cards)",
    onlinePaymentSub: "Razorpay — Secure payment gateway",
    cashOnDelivery: "🏠 Cash on Delivery",
    cashOnDeliverySub: "Pay when your order arrives",
    placeOrder: "Place Order", placing: "Placing...",

    // ── ORDER HISTORY ──
    myOrders: "My Orders", loadingOrders: "Loading orders…",
    noOrdersYet: "No orders yet.", downloadInvoice: "Download Invoice",
    seller: "Seller", payment: "Payment", quantity: "Quantity",
    unitPrice: "Unit Price", orderTotal: "Total", orderDate: "Order Date",
    cashOnDeliveryShort: "Cash on Delivery", walletShort: "Wallet", onlineShort: "Online",

    // ── WEATHER ──
    weatherTitle: "Weather App 🌤️",
    enterCity: "Enter city name", search: "Search",
    loadingWeather: "Loading...", cityNotFound: "City not found",
    humidity: "Humidity", wind: "Wind",

    // ── FARMER DASHBOARD ──
    farmerDashboard: "Farmer Dashboard",
    loadingDashboard: "Loading your dashboard…",
    totalRevenue: "Total Revenue", totalOrders: "Total Orders",
    totalProducts: "Total Products", avgRatingDash: "Avg Rating",
    salesByCategory: "Sales by Category",
    totalUnitsSold: "Total units sold per category",
    noSalesData: "No sales data available yet. Start selling to see charts!",
    manageStock: "Manage Stock →", restockNow: "Restock Now →",
    noOrdersYetDash: "No orders yet.",
    noProductsListed: "No products listed yet.",

    // ── PROFILE ──
    myProfile: "My Profile", loadingProfile: "Loading your profile...",
    totalOrdersStat: "Total Orders", totalSpent: "Total Spent", walletBalance: "Wallet Balance",
    viewAll: "View All →", noOrdersProfile: "No orders yet",
    startShopping: "Start shopping to see your orders here",

    // ── MANDI ──
    mandiTitle: "📊 Real Market Price Intelligence",
    mandiSubtitle: "Yesterday & today show real government mandi prices. Tomorrow is a forecast. No fake values.",
    pulsesAndCereals: "Pulses & Cereals",
    today: "Today", tomorrow: "Tomorrow 🔮", yesterday: "Yesterday", noData: "No data",
    refresh: "↻ Refresh",
    dataSourcesTitle: "ℹ️ How We Get Prices — Simple Explanation",
    yesterdayExplain: "Yesterday's Price", todayExplain: "Today's Price",
    tomorrowExplain: "Tomorrow's Price (Forecast)", dairyExplain: "Milk & Dairy Prices",
    yesterdayDesc1: "This is the real price from the market the day before today.",
    yesterdayDesc2: "It is collected from official government mandi records.",
    yesterdayDesc3: "If markets reported from different cities, we show the average.",
    yesterdayDesc4: "Shows 'No data' only if there are no records for that day.",
    todayDesc1: "This is the latest real price from today's mandi.",
    todayDesc2: "Data comes from the government's official market website.",
    todayDesc3: "If multiple cities reported prices, we average them for you.",
    todayDesc4: "Shows 'No data' if today's data hasn't arrived yet.",
    tomorrowDesc1: "This is our best guess — not real data.",
    tomorrowDesc2: "A computer model studies past prices to predict the future.",
    tomorrowDesc3: "Use it as a rough guide, not a guaranteed price.",
    tomorrowDesc4: "Shows 'No data' if the prediction system is offline.",
    dairyDesc1: "Prices for milk, paneer, butter etc. from Amul, Mother Dairy, Verka.",
    dairyDesc2: "These are official published rates — not guesses.",
    dairyDesc3: "Yesterday's dairy price is from the previous day's record.",
    dairyDesc4: "Tomorrow's dairy price adjusts slightly for the season (summer/winter).",
    realMandiData: "Real mandi data", mlPredicted: "ML predicted",
    cooperativeMRP: "Cooperative MRP", seasonalForecast: "Seasonal forecast",
    movingAvgFallback: "Moving avg (fallback)", mrpFallback: "Published MRP (fallback)",
    farmerTipTitle: "Quick tip for farmers",
    farmerTip: "Today's price is real government mandi data — you can trust it. Tomorrow's price is just a computer estimate — treat it as a rough guide, not a guaranteed price.",
  },

  hi: {
    // ── NAVBAR ──
    home: "होम", shop: "दुकान", sell: "बेचें", myProducts: "मेरे उत्पाद",
    dashboard: "📊 डैशबोर्ड", mandi: "🏪 मंडी", orders: "ऑर्डर",
    about: "हमारे बारे में", cart: "कार्ट", profile: "प्रोफ़ाइल", logout: "लॉग आउट",
    login: "लॉग इन", register: "रजिस्टर",

    // ── HOME ──
    heroBadge: "🌱 100% ताजा और जैविक",
    heroTitle1: "खेत से", heroTitleHighlight: "सीधे", heroTitle2: "आपके घर तक",
    heroDesc: "प्रमाणित किसानों से सीधे ताजी सब्जियां और फल खरीदें। स्थानीय कृषि का समर्थन करें और अपने परिवार के लिए स्वस्थ भोजन पाएं।",
    startShopping: "🛒 अभी खरीदें", learnMore: "और जानें →",
    todayFreshStock: "आज का ताजा स्टॉक", products500: "500+ उत्पाद",
    whoAreYou: "आप कौन हैं?", chooseYourPath: "KhetBazaar पर अपना रास्ता चुनें",
    imCustomer: "मैं खरीदार हूँ", customerDesc: "प्रमाणित किसानों से सीधे ताजा खेत उत्पाद उचित कीमत पर देखें।",
    shopFreshProduce: "ताजा उत्पाद खरीदें",
    imFarmer: "मैं किसान हूँ", farmerDesc: "अपनी फसल अपलोड करें और हजारों ग्राहकों को सीधे बेचें।",
    startSellingCrops: "फसल बेचना शुरू करें",
    checkWeather: "मौसम देखें", weatherDesc: "खेती और खरीदारी की योजना बनाने के लिए लाइव मौसम अपडेट।",
    checkWeatherNow: "अभी मौसम देखें",
    ourProducts: "हमारे उत्पाद", whatWeOffer: "हम क्या देते हैं",
    whatWeOfferDesc: "ताजे, जैविक और सीधे किसान से प्राप्त उत्पाद — एक स्वस्थ जीवन के लिए।",
    whyChooseUs: "हमें क्यों चुनें", builtForFarmers: "किसानों के लिए बना, ग्राहकों का पसंदीदा",
    readyFarmFresh: "खेत-ताजा अनुभव लेने के लिए तैयार हैं?",
    joinKhetBazaar: "आज KhetBazaar से जुड़ें और किसानों से सीधे खरीदने का फर्क महसूस करें।",
    getStartedFree: "मुफ्त में शुरू करें →", browseProducts: "उत्पाद देखें",
    happyCustomers: "खुश ग्राहक", verifiedFarmers: "प्रमाणित किसान",
    productVarieties: "उत्पाद किस्में", organicCertified: "जैविक प्रमाणित",
    directFromFarm: "सीधे खेत से", directFromFarmDesc: "कोई बिचौलिया नहीं। जिस किसान ने उगाया, उससे सीधे खरीदें।",
    qualityVerified: "गुणवत्ता जांची", qualityVerifiedDesc: "हर उत्पाद की ताजगी और गुणवत्ता की जांच लिस्टिंग से पहले होती है।",
    organicFirst: "जैविक पहले", organicFirstDesc: "स्वस्थ उत्पाद के लिए प्राकृतिक खेती को प्राथमिकता।",
    fastDelivery: "तेज डिलीवरी", fastDeliveryDesc: "24–48 घंटों के भीतर ताजा उत्पाद आपके दरवाजे तक।",
    vegetables: "सब्जियां", fruits: "फल", dairy: "डेयरी", seeds: "बीज",
    browse: "देखें",

    // ── ABOUT ──
    ourStory: "🌾 हमारी कहानी",
    aboutTitle: "KhetBazaar के बारे में",
    aboutHeroDesc: "किसानों को सीधे उपभोक्ताओं से जोड़ना — बिचौलियों को हटाना, उचित दाम सुनिश्चित करना, और आपके घर तक सबसे ताजा उत्पाद लाना।",
    ourMission: "हमारा मिशन",
    empoweringFarmers: "डिजिटल कनेक्टिविटी से किसानों को सशक्त बनाना",
    missionP1: "KhetBazaar कृषि सशक्तिकरण की भावना और किसानों को उपभोक्ताओं से जोड़ने के तरीके को बदलने की इच्छा से उभरा। हमने एक सरल विचार से शुरुआत की: एक डिजिटल प्लेटफ़ॉर्म बनाएं जहाँ किसान अपनी उपज सीधे बेच सकें।",
    missionP2: "ताजी सब्जियों और फलों से लेकर जैविक अनाज और डेयरी उत्पादों तक — हम स्थानीय किसानों और कृषि सहकारी समितियों से सीधे प्राप्त उत्पादों का विस्तृत संग्रह प्रदान करते हैं।",
    happyCustomersStat: "खुश ग्राहक", verifiedFarmersStat: "प्रमाणित किसान",
    productTypes: "उत्पाद प्रकार", avgRating: "औसत रेटिंग",
    whyUs: "हमें क्यों", whyChooseKhetBazaar: "KhetBazaar क्यों चुनें?",
    whyDesc: "हम सिर्फ एक मार्केटप्लेस नहीं हैं — हम स्थानीय किसानों का समर्थन करने और खाद्य आपूर्ति में पारदर्शिता लाने का एक आंदोलन हैं।",
    qualityAssurance: "गुणवत्ता आश्वासन", qualityAssuranceDesc: "हम हर उत्पाद को सूचीबद्ध करने से पहले ताजगी और सुरक्षा मानकों की जांच करते हैं।",
    fastConvenient: "तेज और सुविधाजनक", fastConvenientDesc: "आसान इंटरफेस और परेशानी मुक्त ऑर्डरिंग के साथ, ताजा उत्पाद बस कुछ क्लिक दूर है।",
    exceptionalSupport: "बेहतरीन सहायता", exceptionalSupportDesc: "हमारी टीम हर कदम पर आपकी मदद के लिए यहाँ है।",
    sustainableFarming: "टिकाऊ खेती", sustainableFarmingDesc: "हम पर्यावरण-अनुकूल खेती को बढ़ावा देते हैं जो भविष्य की पीढ़ियों के लिए पर्यावरण की रक्षा करती है।",
    fairPrices: "उचित दाम", fairPricesDesc: "बिचौलियों को हटाकर, किसान अधिक कमाते हैं और ग्राहक कम भुगतान करते हैं।",
    securePlatform: "सुरक्षित प्लेटफ़ॉर्म", securePlatformDesc: "आपका डेटा और भुगतान एंटरप्राइज़-ग्रेड सुरक्षा और एन्क्रिप्शन से सुरक्षित हैं।",
    theProcess: "प्रक्रिया", howItWorks: "KhetBazaar कैसे काम करता है",
    farmerLists: "किसान सूचीबद्ध करता है", farmerListsDesc: "प्रमाणित किसान रियल-टाइम स्टॉक और कीमत के साथ ताजा उत्पाद अपलोड करते हैं।",
    youShop: "आप खरीदारी करें", youShopDesc: "सैकड़ों खेत-ताजा उत्पादों में से ब्राउज़, फ़िल्टर और ऑर्डर करें।",
    deliveredFresh: "ताजा डिलीवर", deliveredFreshDesc: "खेत से सीधे आपके दरवाजे तक ताजा उत्पाद पाएं।",
    readyExperience: "खेत-ताजा अनुभव लेने के लिए तैयार हैं?",
    joinToday: "आज KhetBazaar से जुड़ें — किसानों का समर्थन करें, स्वस्थ खाएं।",
    shopNow: "अभी खरीदें →", joinFree: "मुफ्त जुड़ें",

    // ── FOOTER ──
    footerDesc: "KhetBazaar एक डिजिटल मार्केटप्लेस है जो किसानों को सीधे ग्राहकों से जोड़ता है। बिचौलियों को हटाकर हम उचित दाम, ताजा उत्पाद सुनिश्चित करते हैं।",
    company: "कंपनी", aboutUs: "हमारे बारे में", delivery: "डिलीवरी", privacyPolicy: "गोपनीयता नीति",
    getInTouch: "संपर्क करें", allRightsReserved: "सर्वाधिकार सुरक्षित।",

    // ── LOGIN ──
    welcomeBack: "वापस स्वागत है 🌾",
    enterEmailStep: "OTP पाने के लिए अपना ईमेल दर्ज करें",
    enterOtpStep: "आपके ईमेल पर भेजा गया OTP दर्ज करें",
    emailAddress: "ईमेल पता",
    emailPlaceholder: "example@email.com",
    sendOtp: "OTP भेजें 📩", sendingOtp: "OTP भेजा जा रहा है...",
    verifyLogin: "सत्यापित करें और लॉग इन करें 🔐", loggingIn: "लॉग इन हो रहा है...",
    resendOtp: "OTP दोबारा भेजें", change: "बदलें",
    otpLabel: "OTP", otpPlaceholder: "6 अंकों का OTP दर्ज करें",
    noAccount: "खाता नहीं है?", registerNow: "अभी रजिस्टर करें",

    // ── REGISTER ──
    createAccount: "खाता बनाएं", verifyEmail: "ईमेल सत्यापित करें",
    joinThousands: "हजारों किसानों और खरीदारों से जुड़ें",
    iAmCustomer: "मैं खरीदार हूँ", iAmFarmer: "मैं किसान हूँ",
    selectRole: "अपनी भूमिका चुनें",
    agreeTo: "मैं सहमत हूँ", privacyPolicyLink: "गोपनीयता नीति",
    getOtpRegister: "OTP प्राप्त करें और रजिस्टर करें →", registering: "रजिस्टर हो रहा है...",
    verifyOtp: "OTP सत्यापित करें और जारी रखें →", verifying: "सत्यापित हो रहा है...",
    alreadyHaveAccount: "पहले से खाता है?", loginHere: "यहाँ लॉग इन करें",

    // ── SHOP ──
    searchPlaceholder: "उत्पाद खोजें...",
    allCategories: "सभी श्रेणियां", filterByPrice: "कीमत से फ़िल्टर",
    under50: "₹50 से कम", under100: "₹100 से कम", under200: "₹200 से कम",
    organicOnly: "केवल जैविक", rating4plus: "4★ और ऊपर",
    nearbyProducts: "आस-पास के उत्पाद", trendingNow: "ट्रेंडिंग अभी",
    noProductsFound: "कोई उत्पाद नहीं मिला।", addToCart: "कार्ट में डालें",
    perKg: "/किग्रा", perLitre: "/लीटर", perPiece: "/पीस",
    organic: "जैविक", inStock: "स्टॉक में",

    // ── UPLOAD ──
    sellYourCrops: "अपनी फसल बेचें", sellDesc: "अपना ताजा उत्पाद सूचीबद्ध करें और हजारों खरीदारों तक पहुंचें।",
    productName: "उत्पाद का नाम", productNamePh: "जैसे ताजे टमाटर",
    description: "विवरण", descPh: "अपने उत्पाद, गुणवत्ता, खेती का तरीका बताएं...",
    yourPrice: "आपकी बिक्री कीमत (₹)", marketPriceLbl: "बाजार भाव (₹)",
    stockQty: "स्टॉक मात्रा", locationLbl: "आपका स्थान",
    locationPh: "शहर / क्षेत्र (जैसे लुधियाना, पंजाब)",
    unitLabel: "इकाई", imageUrls: "उत्पाद की फोटो (URL)",
    addImage: "+ फोटो जोड़ें", submitListing: "लिस्टिंग जमा करें",
    listingSuccess: "उत्पाद सफलतापूर्वक सूचीबद्ध किया गया!",

    // ── MY PRODUCTS ──
    myProductsTitle: "मेरे सूचीबद्ध उत्पाद",
    myProductsDesc: "अपने सूचीबद्ध उत्पादों को प्रबंधित, संपादित या हटाएं",
    noProductsYet: "आपने अभी तक कोई उत्पाद सूचीबद्ध नहीं किया है।",
    editBtn: "संपादित करें", deleteBtn: "हटाएं", loadingProducts: "उत्पाद लोड हो रहे हैं...",

    // ── CART ──
    yourCart: "आपका कार्ट", cartEmpty: "आपका कार्ट खाली है",
    remove: "हटाएं", subtotal: "उप-कुल", shipping: "शिपिंग",
    shippingFree: "मुफ्त", total: "कुल", proceedCheckout: "चेकआउट करें",

    // ── CHECKOUT ──
    checkout: "चेकआउट", orderSummary: "ऑर्डर सारांश",
    paymentMethod: "भुगतान विधि",
    onlinePayment: "💳 ऑनलाइन भुगतान (UPI / कार्ड)",
    onlinePaymentSub: "Razorpay — सुरक्षित भुगतान गेटवे",
    cashOnDelivery: "🏠 कैश ऑन डिलीवरी",
    cashOnDeliverySub: "ऑर्डर आने पर भुगतान करें",
    placeOrder: "ऑर्डर दें", placing: "ऑर्डर दिया जा रहा है...",

    // ── ORDER HISTORY ──
    myOrders: "मेरे ऑर्डर", loadingOrders: "ऑर्डर लोड हो रहे हैं…",
    noOrdersYet: "अभी तक कोई ऑर्डर नहीं।", downloadInvoice: "इनवॉइस डाउनलोड करें",
    seller: "विक्रेता", payment: "भुगतान", quantity: "मात्रा",
    unitPrice: "इकाई मूल्य", orderTotal: "कुल", orderDate: "ऑर्डर तिथि",
    cashOnDeliveryShort: "कैश ऑन डिलीवरी", walletShort: "वॉलेट", onlineShort: "ऑनलाइन",

    // ── WEATHER ──
    weatherTitle: "मौसम ऐप 🌤️",
    enterCity: "शहर का नाम दर्ज करें", search: "खोजें",
    loadingWeather: "लोड हो रहा है...", cityNotFound: "शहर नहीं मिला",
    humidity: "नमी", wind: "हवा",

    // ── FARMER DASHBOARD ──
    farmerDashboard: "किसान डैशबोर्ड",
    loadingDashboard: "डैशबोर्ड लोड हो रहा है…",
    totalRevenue: "कुल आय", totalOrders: "कुल ऑर्डर",
    totalProducts: "कुल उत्पाद", avgRatingDash: "औसत रेटिंग",
    salesByCategory: "श्रेणी के अनुसार बिक्री",
    totalUnitsSold: "प्रति श्रेणी बेची गई कुल इकाइयां",
    noSalesData: "अभी तक कोई बिक्री डेटा नहीं। बिक्री शुरू करें!",
    manageStock: "स्टॉक प्रबंधित करें →", restockNow: "अभी रिस्टॉक करें →",
    noOrdersYetDash: "अभी तक कोई ऑर्डर नहीं।",
    noProductsListed: "अभी तक कोई उत्पाद सूचीबद्ध नहीं।",

    // ── PROFILE ──
    myProfile: "मेरी प्रोफ़ाइल", loadingProfile: "प्रोफ़ाइल लोड हो रही है...",
    totalOrdersStat: "कुल ऑर्डर", totalSpent: "कुल खर्च", walletBalance: "वॉलेट बैलेंस",
    viewAll: "सभी देखें →", noOrdersProfile: "अभी तक कोई ऑर्डर नहीं",
    startShopping: "खरीदारी शुरू करें",

    // ── MANDI ──
    mandiTitle: "📊 असली बाजार भाव जानकारी",
    mandiSubtitle: "कल और आज के भाव सरकारी मंडी से हैं। कल का भाव अनुमान है। कोई झूठा भाव नहीं।",
    pulsesAndCereals: "दालें और अनाज",
    today: "आज", tomorrow: "कल 🔮", yesterday: "कल (बीता)", noData: "डेटा नहीं",
    refresh: "↻ ताज़ा करें",
    dataSourcesTitle: "ℹ️ हमें भाव कहाँ से मिलते हैं — सरल भाषा में",
    yesterdayExplain: "कल का भाव (बीता)", todayExplain: "आज का भाव",
    tomorrowExplain: "कल का भाव (अनुमान)", dairyExplain: "दूध और डेयरी के भाव",
    yesterdayDesc1: "यह कल का असली मंडी भाव है।",
    yesterdayDesc2: "सरकारी मंडी के आधिकारिक रिकॉर्ड से लिया गया है।",
    yesterdayDesc3: "अगर कई शहरों के भाव आए, तो औसत दिखाया जाता है।",
    yesterdayDesc4: "अगर उस दिन का रिकॉर्ड नहीं है तो 'डेटा नहीं' दिखता है।",
    todayDesc1: "यह आज का ताजा मंडी भाव है।",
    todayDesc2: "यह सरकार की आधिकारिक मंडी वेबसाइट से आता है।",
    todayDesc3: "कई शहरों के भाव होने पर औसत दिखाया जाता है।",
    todayDesc4: "अगर आज का डेटा अभी तक नहीं आया तो 'डेटा नहीं' दिखता है।",
    tomorrowDesc1: "यह केवल एक अनुमान है — असली भाव नहीं।",
    tomorrowDesc2: "एक कंप्यूटर प्रोग्राम पुराने भावों को देखकर अनुमान लगाता है।",
    tomorrowDesc3: "इसे एक मोटे अंदाजे के रूप में इस्तेमाल करें।",
    tomorrowDesc4: "अगर सिस्टम बंद हो तो 'डेटा नहीं' दिखता है।",
    dairyDesc1: "अमूल, मदर डेयरी, वर्का के दूध, पनीर, मक्खन के भाव।",
    dairyDesc2: "ये आधिकारिक घोषित दरें हैं — अनुमान नहीं।",
    dairyDesc3: "कल का डेयरी भाव पिछले दिन के असली रिकॉर्ड से है।",
    dairyDesc4: "कल के भाव में मौसम के अनुसार थोड़ा बदलाव होता है।",
    realMandiData: "असली मंडी भाव", mlPredicted: "कंप्यूटर अनुमान",
    cooperativeMRP: "सहकारी MRP", seasonalForecast: "मौसमी अनुमान",
    movingAvgFallback: "औसत अनुमान (फ़ॉलबैक)", mrpFallback: "प्रकाशित MRP (फ़ॉलबैक)",
    farmerTipTitle: "किसान भाइयों के लिए सलाह",
    farmerTip: "आज का भाव असली सरकारी मंडी से आता है — इस पर भरोसा करें। कल का भाव सिर्फ एक अनुमान है — इसे पक्का भाव न समझें।",
  },
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState("en");

  // Static key-based translation (existing behaviour — zero latency)
  const t = (key) => translations[lang][key] ?? translations["en"][key] ?? key;

  const toggleLang = () => setLang((p) => (p === "en" ? "hi" : "en"));

  // ── Dynamic translation via Google Translate API ────────────────────────
  // translateText(text) — returns a Promise<string>
  // When lang === "en" it resolves immediately with the original text.
  // Falls back to original on any error so the UI never breaks.
  const translateText = async (text) => {
    if (!text || lang === "en") return text;
    const { translateOne } = await import("../utils/useTranslate.js");
    return translateOne(text, lang);
  };

  // translateTexts(arr) — batch version, returns Promise<string[]>
  const translateTexts = async (arr) => {
    if (!arr?.length || lang === "en") return arr;
    const { translateBatch } = await import("../utils/useTranslate.js");
    return translateBatch(arr, lang);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t, translateText, translateTexts }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLang = () => useContext(LanguageContext);
