const express = require('express');
const passport = require('passport');
const User = require('../Models/user.js');
const router = express.Router();

// Register Route
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'Email already exists' });
    }

    user = new User({ username, email, password });
    await user.save();
    res.json({ msg: 'User registered successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Login Route
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(400).json({ msg: info.message });

    req.logIn(user, (err) => {
      if (err) return next(err);
      res.json({ msg: 'Logged in successfully', user });
    });
  })(req, res, next);
});

// Logout Route
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ msg: 'Logout error' });
    res.json({ msg: 'Logged out successfully' });
  });
});

module.exports = router;
