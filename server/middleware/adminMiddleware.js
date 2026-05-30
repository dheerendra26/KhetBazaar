function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 4) {
    return res.status(403).json({
      message: "Forbidden: Admins only",
    });
  }

  next();
}

module.exports = {
  requireAdmin,
};