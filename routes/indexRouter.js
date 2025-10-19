const express = require("express");
const { registerUser, loginUser } = require("../controllers/authController");
const { getUser } = require("../controllers/userController");
const router = express.Router();

router.get("/", (req, res) => {
    res.json({ page: "home" });
});

router.post("/register", registerUser);

router.post("/login", loginUser);

router.get("/user", getUser);

module.exports = router;