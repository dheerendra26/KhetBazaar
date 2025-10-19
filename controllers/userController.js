const userModel = require("../models/userModel");

module.exports.getUser  = async (req, res) => {
    const email = req.body.email;

    try {
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User  not found" });
        }

        res.json({ user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};