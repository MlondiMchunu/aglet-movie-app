function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Please log in to access your favourites.' });
  }
  next();
}

module.exports = requireAuth;
