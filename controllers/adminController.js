const express = require('express');
const router = express.Router();
const User = require('../Models/user'); // Adjust path as necessary
const Article = require('../Models/article'); // Adjust for your app
const Contact = require('../Models/contactUs'); // Adjust for your app
const { ensureAdmin } = require('../middlewares/auth');
const Quote = require('../Models/quote'); // Adjust for your app
const auth = require('../middlewares/auth'); 

exports.getAdminDashboard = async (req, res) => {
    try {
        // Ensure that req.user is available (authenticated user)
        if (!req.user) {
            return res.redirect('/login'); // Redirect if the user is not authenticated
        }

        // Fetch data (users, quotes, articles)
        const users = await User.find();
        const quotes = await Quote.find();
        const articles = await Article.find();
        const contacts = await Contact.find();
        const totalUsers = users.length;
        const totalQuotes = await Quote.countDocuments();
        const totalArticles = await Article.countDocuments();
        const totalContacts = await Contact.countDocuments();
        
        // Prepare chart data
        const chartData = {
            labels: ['Users', 'Quotes', 'Articles','Contact Us'],
            datasets: [{
                label: 'Content Overview',
                data: [totalUsers, totalQuotes, totalArticles, totalContacts],
                backgroundColor: ['#FF6347', '#4CAF50', '#3B9CFF', 'aqua'],
                hoverOffset: 4
            }]
        };

        // Pass user and other data to the EJS view
        res.render('admin-dashboard', {
            user: req.user,  // Ensure the authenticated user is passed
            data: {
                users: users,
                quotes: quotes,
                articles:articles,
                contacts:contacts,
                totalUsers: totalUsers,
                totalQuotes: totalQuotes,
                totalArticles: totalArticles,
                totalContacts: totalContacts,
                chartData: JSON.stringify(chartData)  // Inject chart data as a JSON string
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};