const axios = require("axios");

const productsModel = require("../models/productModel");
const userModel = require("../models/userModel");
const MandiPrice = require("../models/mandiPriceModel");

const {
  sendListingConfirmationEmail,
  sendListingDeletionEmail,
} = require("../utils/sendEmail");

const { resolveCategory, getAllSynonyms } = require("../utils/categoryMapper");

const resolveProductCategory = (req, res) => {
  const { name } = req.query;
  if (!name)
    return res.status(400).json({ message: "name query param is required" });
  const result = resolveCategory(name);
  res.json(result);
};

const getCategorySynonyms = (req, res) => {
  res.json(getAllSynonyms());
};

const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      marketPrice,
      email,
      location,
      images,
      lat,
      lng,
      unit,
      category,
      isOrganic,
      isVerified,
      stock,
    } = req.body;
    if (!name || !name.trim())
      return res.status(400).json({ message: "Product name is required" });
    if (!images || images.length === 0)
      return res
        .status(400)
        .json({ message: "At least one image is required" });

    const resolved = resolveCategory(name);
    const finalCategory =
      category && category !== "vegetable" ? category : resolved.category;
    const product = await productsModel.create({
      name:
        resolved.confidence !== "default" ? resolved.canonical : name.trim(),
      description,
      price,
      originalPrice: price,
      marketPrice: marketPrice ? Number(marketPrice) : undefined,
      email,
      location,
      images,
      lat,
      lng,
      stock: Math.max(0, stock || 10),
      unit,
      category: finalCategory,
      isOrganic: !!isOrganic,
      isVerified: !!isVerified,
    });

    await sendListingConfirmationEmail(email, product);

    try {
      await userModel.updateMany(
        { role: { $in: [1, 3] } },
        {
          $push: {
            notifications: {
              message: `🌱 New product listed: ${name} at ₹${price}/${unit || "kg"}`,
              type: "new_product",
            },
          },
        },
      );
    } catch {}

    res.status(200).json(product);
  } catch (error) {
    console.error("Product upload error:", error);
    res.status(500).json({ message: "Failed to upload product" });
  }
};

const deactivateProduct = async (req, res) => {
  try {
    const { adminEmail } = req.body;
    const product = await productsModel.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (!product.isActive)
      return res.status(400).json({ message: "Product already deactivated" });

    const hasSales = (product.soldCount || 0) > 0;

    product.isActive = false;
    product.deactivatedAt = new Date();
    product.deactivatedBy = adminEmail || product.email;
    await product.save();

    await sendListingDeletionEmail(product.email, product);
    res.status(200).json({
      message: "Product deactivated successfully",
      hasSales,
      soldCount: product.soldCount || 0,
      note: hasSales
        ? "Product had existing sales and has been deactivated. It is hidden from all listings but preserved in order history."
        : "Product had no sales and has been deactivated and removed from all listings.",
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getProductSalesStatus = async (req, res) => {
  try {
    const product = await productsModel
      .findById(req.params.id)
      .select("name soldCount isActive");
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json({
      productId: req.params.id,
      name: product.name,
      soldCount: product.soldCount || 0,
      hasSales: (product.soldCount || 0) > 0,
      isActive: product.isActive,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateProduct = async (req, res) => {
  try {
    const {
      email,
      name,
      description,
      price,
      marketPrice,
      images,
      stock,
      discountPercent,
      isOrganic,
      isVerified,
      category,
    } = req.body;
    const product = await productsModel.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (product.email !== email)
      return res
        .status(403)
        .json({ message: "Unauthorized: You can only edit your own products" });

    const updatedFields = {};
    if (name !== undefined) updatedFields.name = name;
    if (description !== undefined) updatedFields.description = description;
    if (marketPrice !== undefined)
      updatedFields.marketPrice = Number(marketPrice);
    if (price !== undefined) {
      updatedFields.price = Number(price);
      updatedFields.originalPrice = Number(price);
    }
    if (images !== undefined && images.length > 0)
      updatedFields.images = images;
    if (stock !== undefined) updatedFields.stock = Math.max(0, Number(stock));
    if (discountPercent !== undefined) {
      const disc = Math.max(0, Math.min(90, Number(discountPercent)));
      updatedFields.discountPercent = disc;
      const base =
        price !== undefined
          ? Number(price)
          : product.originalPrice || product.price;
      if (price !== undefined) updatedFields.originalPrice = Number(price);
      updatedFields.price =
        disc > 0 ? Math.round(base * (1 - disc / 100)) : base;
      if (disc > 0) {
        try {
          await userModel.updateMany(
            { role: { $in: [1, 3] } },
            {
              $push: {
                notifications: {
                  message: `🏷️ ${disc}% OFF on ${product.name}! Now ₹${updatedFields.price}`,
                  type: "price_drop",
                },
              },
            },
          );
        } catch {}
      }
    }
    if (isOrganic !== undefined) updatedFields.isOrganic = !!isOrganic;
    if (isVerified !== undefined) updatedFields.isVerified = !!isVerified;
    if (category !== undefined) updatedFields.category = category;

    const updated = await productsModel.findByIdAndUpdate(
      req.params.id,
      { $set: updatedFields },
      { new: true },
    );
    res
      .status(200)
      .json({ message: "Product updated successfully", product: updated });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getSellerProducts = async (req, res) => {
  try {
    const products = await productsModel.find({
      email: req.params.email,
      isActive: { $ne: false },
    });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const predictCropPrice = async (req, res) => {
  try {
    const { cropName, location } = req.query;
    if (!cropName)
      return res.status(400).json({ message: "Crop name is required" });

    const FLASK_URL = process.env.FLASK_URL;

    const resolved = resolveCategory(cropName.trim());
    const canonicalEN =
      resolved.confidence !== "default"
        ? resolved.canonical.toLowerCase()
        : cropName.toLowerCase().trim();

    const crop = canonicalEN;

    const CROP_ALIASES = {
      "arhar dal": [
        "arhar(tur/red gram)(whole)",
        "tur",
        "arhar dal",
        "pigeon pea",
      ],
      "chana dal": [
        "bengal gram(split)",
        "gram(split)",
        "chana dal",
        "bengal gram(whole)",
        "gram",
      ],
      "masoor dal": ["lentil", "masur(whole)", "masoor dal", "masur dal"],
      lentils: ["lentil", "masur(whole)", "masoor dal", "masur dal"],
      "urad dal": [
        "black gram(urd beans)(whole)",
        "urad(whole)",
        "urad dal",
        "black gram",
      ],
      "moong dal": [
        "green gram(whole)",
        "moong(whole)",
        "moong dal",
        "green gram",
      ],
      soybean: ["soybean", "soya bean", "soyabean"],
      groundnut: [
        "groundnut",
        "groundnut (with shell)",
        "groundnut(without shell)",
      ],
      "mustard seeds": ["mustard", "mustard seeds(black)", "rapeseed"],
      mustard: ["mustard", "mustard seeds(black)", "rapeseed"],
      bajra: ["bajra", "pearl millet", "bajra(pearl millet/cumbu)"],
      ladyfinger: ["ladyfinger", "bhindi(ladies finger)", "okra"],
      brinjal: ["brinjal", "brinjal(vankaya)"],
      pomegranate: ["pomegranate", "anar"],
      "green chilli": ["green chilli", "chilli", "chilly"],
      "bottle gourd": ["bottle gourd", "lauki", "ghiya"],
      "bitter gourd": ["bitter gourd", "karela"],
      "sweet corn": ["maize", "corn", "sweet corn"],
      maize: ["maize", "corn"],
    };

    const cropAliasesLower = [crop, ...(CROP_ALIASES[crop] || [])].map((a) =>
      a.toLowerCase(),
    );
    const cropFilter =
      cropAliasesLower.length === 1
        ? cropAliasesLower[0]
        : { $in: cropAliasesLower };

    const basePrices = {
      potato: 18,
      tomato: 25,
      onion: 20,
      garlic: 120,
      ginger: 60,
      cauliflower: 25,
      cabbage: 15,
      carrot: 30,
      spinach: 20,
      brinjal: 22,
      ladyfinger: 35,
      peas: 45,
      capsicum: 40,
      "green chilli": 30,
      cucumber: 20,
      pumpkin: 18,
      "bottle gourd": 20,
      "bitter gourd": 30,
      radish: 15,
      beetroot: 25,
      "sweet corn": 20,
      coriander: 40,
      fenugreek: 30,
      mushroom: 80,
      mango: 60,
      banana: 35,
      apple: 120,
      grapes: 80,
      orange: 50,
      papaya: 25,
      watermelon: 15,
      guava: 35,
      pomegranate: 90,
      lemon: 40,
      pineapple: 45,
      coconut: 30,
      litchi: 70,
      plum: 60,
      jackfruit: 20,
      "custard apple": 50,
      milk: 55,
      curd: 45,
      butter: 500,
      ghee: 600,
      paneer: 300,
      cheese: 400,
      buttermilk: 25,
      cream: 200,
      khoya: 250,
      wheat: 22,
      rice: 32,
      "mustard seeds": 65,
      mustard: 65,
      soybean: 40,
      groundnut: 70,
      lentils: 90,
      chickpea: 75,
      "moong dal": 90,
      "urad dal": 95,
      "arhar dal": 100,
      bajra: 18,
      jowar: 20,
      maize: 20,
      sesame: 110,
      "sunflower seeds": 55,
      cotton: 65,
      sugarcane: 3,
      default: 35,
    };

    const now = new Date();
    const month = now.getMonth();

    const tomorrowDate = new Date(now);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);

    const majorCities = [
      "delhi",
      "mumbai",
      "bangalore",
      "chennai",
      "kolkata",
      "hyderabad",
      "pune",
    ];
    const locationFactor = majorCities.some((c) =>
      (location || "").toLowerCase().includes(c),
    )
      ? 1.15
      : 1.0;
    let locationAlreadyApplied = false;

    const seasonalMultipliers = [
      1.1, 1.15, 1.1, 1.05, 1.0, 0.95, 0.9, 0.85, 0.9, 1.0, 1.05, 1.1,
    ];
    const seasonal = seasonalMultipliers[month];
    const tomorrowSeasonal = seasonalMultipliers[tomorrowDate.getMonth()];

    const seasonName =
      month >= 6 && month <= 9
        ? "Kharif (Monsoon)"
        : month >= 10 || month <= 2
          ? "Rabi (Winter)"
          : "Summer";

    function safePrice(val) {
      const n = Number(val);
      return Number.isFinite(n) && n > 0 ? n : null;
    }

    let todayPrice = null;
    let tomorrowPrice = null;
    let priceSource = "ml_predicted";

    try {
      const todayRes = await axios.post(
        `${FLASK_URL}/predict`,
        {
          crop,
          day: now.getDate(),
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        },
        { timeout: 7000 },
      );
      todayPrice = safePrice(
        todayRes.data?.predicted_price != null
          ? todayRes.data.predicted_price / 100
          : null,
      );
    } catch {}

    try {
      const tomRes = await axios.post(
        `${FLASK_URL}/predict-tomorrow`,
        { crop },
        { timeout: 7000 },
      );
      tomorrowPrice = safePrice(
        tomRes.data?.predicted_price != null
          ? tomRes.data.predicted_price / 100
          : null,
      );
    } catch (e) {
      if (e.response?.status === 404) {
        try {
          const tomFallbackRes = await axios.post(
            `${FLASK_URL}/predict`,
            {
              crop,
              day: tomorrowDate.getDate(),
              month: tomorrowDate.getMonth() + 1,
              year: tomorrowDate.getFullYear(),
            },
            { timeout: 7000 },
          );
          tomorrowPrice = safePrice(
            tomFallbackRes.data?.predicted_price != null
              ? tomFallbackRes.data.predicted_price / 100
              : null,
          );
        } catch {}
      }
    }

    if (todayPrice == null && tomorrowPrice == null) {
      priceSource = "mandi_db";
    }

    if (todayPrice == null || tomorrowPrice == null) {
      const pipeline = [
        { $match: { commodity: cropFilter, modal_price: { $gt: 0 } } },
        {
          $group: {
            _id: "$arrival_date",
            avg_price: { $avg: "$modal_price" },
            year: { $max: "$year" },
            month: { $max: "$month" },
            day: { $max: "$day" },
          },
        },
        { $sort: { year: -1, month: -1, day: -1 } },
        { $limit: 5 },
      ];

      const dbRecords = await MandiPrice.aggregate(pipeline);

      const validRecords = dbRecords.filter(
        (r) => safePrice(r.avg_price) !== null,
      );

      if (validRecords.length > 0) {
        const latestPerKg = safePrice(validRecords[0].avg_price / 100);

        if (todayPrice == null) {
          todayPrice = latestPerKg;
          priceSource = "mandi_db";
        }

        if (tomorrowPrice == null) {
          if (validRecords.length >= 2) {
            const sumAvg = validRecords.reduce((s, r) => s + r.avg_price, 0);
            const movAvg = safePrice(sumAvg / validRecords.length / 100);
            const newest = validRecords[0].avg_price;
            const oldest = validRecords[validRecords.length - 1].avg_price;
            const rawTrend = oldest > 0 ? (newest - oldest) / oldest : 0;
            const capped = Math.max(-0.05, Math.min(0.05, rawTrend));
            tomorrowPrice =
              movAvg != null ? Math.round(movAvg * (1 + capped)) : latestPerKg;
            priceSource =
              priceSource === "ml_predicted"
                ? "ml_predicted"
                : "moving_avg_fallback";
          } else {
            tomorrowPrice = latestPerKg;
            priceSource =
              priceSource === "ml_predicted" ? "ml_predicted" : "mandi_db";
          }
        }
      }
    }

    if (todayPrice == null) {
      const base =
        basePrices[canonicalEN] || basePrices[crop] || basePrices.default;
      todayPrice = Math.round(base * seasonal * locationFactor);
      tomorrowPrice = Math.round(base * tomorrowSeasonal * locationFactor);
      priceSource = "baseline_estimate";
      locationAlreadyApplied = true;
    }

    if (
      tomorrowPrice == null ||
      !Number.isFinite(tomorrowPrice) ||
      tomorrowPrice <= 0
    ) {
      tomorrowPrice = todayPrice;
    }

    if (!locationAlreadyApplied && locationFactor !== 1.0) {
      todayPrice = Math.round(todayPrice * locationFactor);
      tomorrowPrice = Math.round(tomorrowPrice * locationFactor);
    }

    if (!Number.isFinite(todayPrice) || todayPrice <= 0)
      todayPrice =
        basePrices[canonicalEN] || basePrices[crop] || basePrices.default;
    if (!Number.isFinite(tomorrowPrice) || tomorrowPrice <= 0)
      tomorrowPrice = todayPrice;

    const minPrice = Math.round(todayPrice * 0.88);
    const maxPrice = Math.round(todayPrice * 1.12);
    const avgPrice = todayPrice;
    const tomorrowMin = Math.round(tomorrowPrice * 0.9);
    const tomorrowMax = Math.round(tomorrowPrice * 1.1);

    const diff = tomorrowPrice - todayPrice;
    const trendPctRaw = todayPrice > 0 ? (diff / todayPrice) * 100 : 0;
    const trend =
      trendPctRaw > 2
        ? "📈 Rising (expected tomorrow)"
        : trendPctRaw < -2
          ? "📉 Falling (expected tomorrow)"
          : "➡️ Stable";

    const baseForCompare =
      basePrices[canonicalEN] || basePrices[crop] || basePrices.default;
    const recommendation =
      avgPrice > baseForCompare * 1.05
        ? "✅ Good time to sell — prices are above average"
        : avgPrice < baseForCompare * 0.95
          ? "⏳ Consider waiting — prices are below average"
          : "🟡 Fair market price — sell as needed";

    const sourceLabels = {
      ml_predicted: "ML model trained on government mandi data",
      mandi_db: "Latest government mandi records (data.gov.in)",
      moving_avg_fallback:
        "Moving average of recent mandi records (ML unavailable)",
      baseline_estimate: "Baseline seasonal estimate (no live data available)",
    };

    return res.status(200).json({
      cropName:
        resolved.confidence !== "default" ? resolved.canonical : cropName,
      inputName: cropName,
      location: location || "General",
      predictedRange: { min: minPrice, max: maxPrice, avg: avgPrice },
      tomorrow: { min: tomorrowMin, max: tomorrowMax, avg: tomorrowPrice },
      trend,
      trend_pct: +trendPctRaw.toFixed(1),
      season: seasonName,
      confidence:
        priceSource === "ml_predicted"
          ? "High"
          : priceSource === "mandi_db"
            ? "Medium-High"
            : priceSource === "moving_avg_fallback"
              ? "Medium"
              : "Low (no live data)",
      recommendation,
      source: priceSource,
      basedOn: sourceLabels[priceSource] || "Historical data",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Prediction failed", error: error.message });
  }
};

const getCropRecommendations = async (req, res) => {
  try {
    const { soilType, season, state } = req.query;

    const recommendations = {
      clay: {
        kharif: ["Rice", "Jute", "Sugarcane", "Cotton"],
        rabi: ["Wheat", "Barley", "Mustard", "Gram"],
        summer: ["Moong Dal", "Watermelon", "Cucumber"],
      },
      loamy: {
        kharif: ["Maize", "Soybean", "Groundnut", "Bajra"],
        rabi: ["Wheat", "Potato", "Peas", "Lentils"],
        summer: ["Vegetables", "Sunflower", "Sesame"],
      },
      sandy: {
        kharif: ["Bajra", "Groundnut", "Moong", "Cowpea"],
        rabi: ["Barley", "Mustard", "Carrot", "Radish"],
        summer: ["Watermelon", "Muskmelon", "Sesame"],
      },
      black: {
        kharif: ["Cotton", "Sorghum", "Soybean", "Sunflower"],
        rabi: ["Wheat", "Chickpea", "Safflower", "Linseed"],
        summer: ["Maize", "Vegetables"],
      },
      red: {
        kharif: ["Groundnut", "Ragi", "Maize", "Tobacco"],
        rabi: ["Wheat", "Barley", "Mustard"],
        summer: ["Watermelon", "Sesame", "Moong"],
      },
    };

    const soil = (soilType || "loamy").toLowerCase();
    const s = (season || "rabi").toLowerCase();
    const crops = recommendations[soil]?.[s] || recommendations.loamy.rabi;

    const demandData = {
      Rice: "High",
      Wheat: "Very High",
      Tomato: "High",
      Onion: "Very High",
      Potato: "High",
      Cotton: "Medium",
      Sugarcane: "Medium",
      Groundnut: "High",
      Soybean: "High",
      Maize: "High",
      default: "Medium",
    };

    const result = crops.map((crop) => ({
      crop,
      demand: demandData[crop] || demandData.default,
      reason: `Ideal for ${soil} soil in ${s} season`,
      estimatedReturn: `₹${Math.floor(20000 + Math.random() * 40000).toLocaleString("en-IN")} / acre`,
    }));

    res.json({
      soilType: soil,
      season: s,
      state: state || "General",
      recommendations: result,
    });
  } catch (err) {
    res.status(500).json({ message: "Recommendation failed" });
  }
};

const purchaseProduct = async (req, res) => {
  try {
    const { quantity } = req.body;
    const product = await productsModel.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (!product.isActive)
      return res
        .status(400)
        .json({ message: "Product is no longer available" });
    if (product.stock < quantity)
      return res.status(400).json({ message: "Not enough stock" });
    product.stock -= quantity;
    product.soldCount += quantity;
    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Error updating stock" });
  }
};

module.exports = {
  resolveProductCategory,
  getCategorySynonyms,
  createProduct,
  deactivateProduct,
  getProductSalesStatus,
  updateProduct,
  getSellerProducts,
  predictCropPrice,
  getCropRecommendations,
  purchaseProduct,
};
