// auth.js
const passport = require('passport');

module.exports = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  } else {
    return res.redirect('/login'); // Redirect to login if not authenticated or not admin
  }
};
