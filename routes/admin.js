const express = require('express');
const router = express.Router();
const User = require('../Models/user'); // Adjust path as necessary
const Article = require('../Models/article'); // Adjust for your app
const { ensureAdmin } = require('../middlewares/auth');
const Quote = require('../Models/quote'); // Adjust for your app
const auth = require('../middlewares/auth'); 
// const Article = require('../Models/article'); // Adjust for your app
const adminController = require('../controllers/adminController');


// Example of protected admin route
router.get('/admin-dashboard', adminController.getAdminDashboard);


module.exports = router;