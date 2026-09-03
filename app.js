const express = require("express");
const path = require("path");
const ejsMate = require("ejs-mate");
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
// const passport = require('passport');
const methodOverride = require("method-override");
const router = express.Router();
const session = require('express-session');
const flash = require('connect-flash'); // Add this line
const { body, validationResult } = require('express-validator');
const User = require("./Models/user");
require('dotenv').config();
const adminRoutes = require('./routes/admin'); // Import admin routes
const passport = require('./config/passport');  // Just import the passport configuration

const multer = require('multer');
const { storage } = require('./cloudinaryConfig');
const Blog = require('./Models/blog');

// Configure Multer with Cloudinary storage
const upload = multer({ storage });

// Import models
// const User = require("./Models/user.js");
const Article = require("./Models/article.js");
const Quote = require("./Models/quote.js"); // Import the Quote model
const ContactUs = require("./Models/contactUs.js");
const Visit = require("./Models/visit.js");


// Initialize the app
const app = express();

// Setup view engine
app.engine('ejs', ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views/webPages"));
app.use(bodyParser.json()); 
app.use(methodOverride("_method"));


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "/public/assets")));

// Database connection
// const dbURI = 'mongodb://localhost:27017/TextTroveDB';
const dbURI = process.env.ATLASDB_URI;
mongoose.connect(dbURI, {
    connectTimeoutMS: 10000,
}).then(() => console.log('Connected to MongoDB successfully'))
    .catch((err) => console.error('Failed to connect to MongoDB:', err));


    // Middleware to check if the user is an admin
function isAdmin(req, res, next) {
    if (req.isAuthenticated() && req.user.email === 'admin@texttrove.in') {
      return next();  // Proceed to the admin page
    }
    res.redirect('/login');  // Redirect to login if not admin
  }
 
// Express session
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: false,
}));

// Connect-flash setup
app.use(flash());

// Passport setup
app.use(passport.initialize());
app.use(passport.session());
app.use(adminRoutes);


// Middleware to save the original URL
function saveReturnTo(req, res, next) {
    if (!req.isAuthenticated() && req.originalUrl) {
        req.session.returnTo = req.originalUrl;// Save the original URL
    }
    next();
}
//Middlware to check the user is loggedin or not




// Middleware to make flash messages available in all views
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.currentUser = req.user;
    next();
});

// Routes
app.get("/", async (req, res) => {
    try {
      const clientIp = req.headers["x-forwarded-for"] || req.connection.remoteAddress; // Get visitor IP
      let visit = await Visit.findOne();
  
      if (!visit) {
        // Create the first record
        visit = new Visit({ totalVisits: 1, uniqueVisitors: 1, visitors: [clientIp] });
      } else {
        visit.totalVisits += 1; // Increment total visits
  
        // Check if the IP is unique
        if (!visit.visitors.includes(clientIp)) {
          visit.uniqueVisitors += 1;
          visit.visitors.push(clientIp); // Add new IP to the list
        }
      }
  
      await visit.save();
  
      res.render("home", {   visit });
    } catch (err) {
      console.error("Error handling request:", err);
      res.status(500).send("Internal Server Error");
    }
  });
app.get("/signup", (req, res) => res.render("signup.ejs"));
app.get("/login", (req, res) => res.render("login.ejs"));
// Register route
app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
    try {
      let user = await User.findOne({ email });
      if (user) {
        req.flash('error', 'Email already exists');
        return res.redirect('/signup');
      }
      
      // Ensure that only the seed script creates an admin account
      if (email === 'admin@texttrove.in') {
        req.flash('error', 'Cannot create admin account through this route');
        return res.redirect('/signup');
      }
      
      user = new User({ username, email, role: 'user' });
      await User.register(user, password);
      req.flash('success', 'Account created successfully! Please login.');
      res.redirect('/login');
    } catch (err) {
      console.error(err.message);
      req.flash('error', err.message || 'Server error during registration');
      res.redirect('/signup');
    }
  });

// Login Route
app.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) { return next(err); }
      if (!user) { 
        req.flash('error', (info && info.message) ? info.message : 'Invalid email or password');
        return res.redirect('/login');
      }
  
      req.logIn(user, (err) => {
        if (err) { return next(err); }
  
        // Check if the logged-in user is the admin
        if (user.email === 'admin@texttrove.in') {
          return res.redirect('/admin-dashboard');
        } else {
          return res.redirect('/');  // Regular user dashboard
        }
      });
    })(req, res, next);
  });
  

// Logout route
app.get('/logout', (req, res) => {
    req.logout(err => {
        if (err) {
            req.flash('error', 'Logout error');
            return res.redirect('/');
        }
        req.flash('success', 'Logged out successfully');
        res.redirect('/');
    });
});

// Middleware to ensure the user is authenticated
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}
// Example routes
app.get('/terms', (req, res) => res.render('terms.ejs'));
app.get('/privacy', (req, res) => res.render('privacy.ejs'));
app.get('/cookies', (req, res) => res.render('cookies.ejs'));
app.get('/contact', (req, res) => res.render('contact.ejs'));

app.post('/contact', async (req, res) => {
    try {
      const { name, email, message } = req.body;
      const contactingDetail = new ContactUs({ name, email, message }); // Use parentheses with curly braces
      await contactingDetail.save();
  
      // Send email using a service like SendGrid or Nodemailer
      // For simplicity, we'll just log the contact details
     
  
      res.send('Thank you for contacting us! We will get back to you soon.');
    } catch (error) {
      console.error('Error saving contact details:', error);
      res.status(500).send('An error occurred. Please try again later.');
    }
  });
  
// Static pages
app.get('/about', (req, res) => res.render('about'));
app.get('/quotes', async (req, res) => {
    try {
        const quotes = await Quote.find().sort({ createdAt: -1 }); // Fetch quotes
        res.render('quotes', { quotes });
    } catch (error) {
        console.error('Error fetching quotes:', error);
        res.status(500).send('Server error');
    }
});

// Quote submission form route
app.get('/submit-quote', ensureAuthenticated, (req, res) => {
    res.render('quoteForm'); // Render quote submission form
});

// Quote submission handling
app.post('/submit-quote', ensureAuthenticated, async (req, res) => {
    const { quote, author } = req.body;
    if (!quote || quote.trim() === '') {
        return res.status(400).send('Quote cannot be empty.');
    }

    try {
        const newQuote = new Quote({ quote, author: author || 'Anonymous' });
        await newQuote.save();
        res.redirect('/quotes'); // Redirect to quotes page after submission
    } catch (error) {
        console.error('Error saving quote:', error);
        res.status(500).send('Server error');
    }
});
//Quote Show Route
app.get("/quotes/:id", async(req, res) =>{
    const id = req.params.id;
    const quote = await Quote.findById(id);
    if (!quote) {
        // Handle the case where the article does not exist
        res.status(404).send('Quote not found.');
    }
    try {
        
        // If the article is found, render the article view
        res.render("quoteDetails", { quote });
    } catch (err) {
        console.error('Error fetching quote:', err);
        res.status(500).send('Server error');
    }

})
//Quote 
app.get("/quotes/:id/edit", async(req, res) => {
    const id = req.params.id;
    const quote = await Quote.findById(id);
    if (!quote) {
        res.status(500).send('not found');
        }
        try {
            res.render("editQuote", { quote });
            } catch (err) {
                cres.json("message: quote not found")
                res.status(500).send('Server error');
            }

    });
    app.put("/quotes/:id", async (req, res) => {
        const { quote_text } = req.body; // Destructure quote_text from the request body
        const id = req.params.id;
    
        // Check if quote_text is a string and not empty
        if (!quote_text || typeof quote_text !== "string") {
            return res.status(400).send("Quote content must be a non-empty string");
        }
    
        try {
            // Use the quote_text directly in the update
            const updatedQuote = await Quote.findByIdAndUpdate(
                id,
                { quote: quote_text }, // Update the quote field with the correct string
                { new: true }
            );
    
            if (!updatedQuote) {
                return res.status(404).send("Quote not found");
            }
    
            res.redirect(`/quotes/${id}`);
        } catch (err) {
            console.error("Error updating quote:", err);
            res.status(500).send("Server error");
        }
    });
//Quote Delete
app.delete("/article/:id/", (req, res) =>{
    const id = req.params.id;
    Article.findByIdAndRemove(id, (err, deletedArticle) => {
        if (err) { 
            res.status(500).send('Server error');
            }
            if (!deletedArticle) {
                res.status(404).send('Article not found');
            }
            res.redirect('/articles');

    });
})
// Articles routes
app.get('/articles', async (req, res) => {
    try {
        const articles = await Article.find().sort({ createdAt: -1 });
        res.render('articles', { articles });
    } catch (error) {
        console.error('Error fetching articles:', error);
        res.status(500).send('Server error');
    }
});
// Article viewing
app.get("/articles/:id", async (req, res) => {
    const id = req.params.id;
    const article = await Article.findById(id);
    if (!article) {
        // Handle the case where the article does not exist
        res.status(404).send('Article not found.');
    }
    try {
       
        // If the article is found, render the article view
        res.render("articleDetails", { article });
    } catch (err) {
        console.error('Error fetching article:', err);
        res.status(500).send('Server error');
    }
});
//
//Update Articles
app.get("/articles/:id/edit", async (req, res) => {
    const id = req.params.id;

    try {
        const article = await Article.findById(id);
        if (!article) {
            return res.status(404).send("Article not found");
        }
        res.render("editArticle", { article });
    } catch (err) {
        console.error("Error retrieving article:", err);
        res.status(500).send("Server error");
    }
});

app.put("/articles/:id", async (req, res) => {
    const { content } = req.body;
    const id = req.params.id;

    // Validation for content
    if (!content || typeof content !== "string" || content.trim() === "") {
        return res.status(400).send("Article content must be a non-empty string");
    }

    try {
        // Corrected field name to match the schema
        const updatedArticle = await Article.findByIdAndUpdate(
            id,
            { content: content }, // Use 'content' instead of 'article'
            { new: true }
        );

        if (!updatedArticle) {
            return res.status(404).send("Article not found");
        }

        // Redirect to the updated article
        res.redirect(`/articles/${id}`);
    } catch (err) {
        console.error("Error updating article:", err);
        res.status(500).send("Server error");
    }
});


// Protected routes
app.get('/write-article', ensureAuthenticated, (req, res) => res.render('writeArticle'));

app.post('/submit-article', ensureAuthenticated, async (req, res) => {
    const { title, author, content } = req.body;
    try {
        const newArticle = new Article({ title, author, content });
        await newArticle.save();
        res.redirect('/articles');
    } catch (error) {
        console.error('Error saving article:', error);
        res.status(500).send('Server error');
    }
});

// Route to display all blogs
app.get('/blogs', async (req, res) => {
    try {
      const blogs = await Blog.find().sort({ createdAt: -1 });
      res.render('../blogs/index', { blogs });
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
  });
  
  // Route to display the form for creating a blog
  app.get('/new-blogs', (req, res) => {
    res.render('../blogs/new');
  });
  
  // Route to create a new blog
  app.post('/blogs', upload.single('image'), async (req, res) => {
    try {
      const { title, content } = req.body;
      const blog = new Blog({
        title,
        content,
        image: req.file ? { url: req.file.path, filename: req.file.filename } : null,
      });
      await blog.save();
      res.redirect('../blogs');
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
  });
  
  // Route to view a specific blog
  app.get('/blogs/:id', async (req, res) => {
    try {
      const blog = await Blog.findById(req.params.id);
      res.render('../blogs/show', { blog });
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
  });
  
  // Route to delete a blog
  app.post('/blogs/:id/delete', async (req, res) => {
    try {
      const blog = await Blog.findByIdAndDelete(req.params.id);
      res.redirect('../blogs');
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
  });

app.get('/*', (req, res) => {
    res.render('error.ejs');
});

// Start the server
const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`This server is listening on port ${port}`);
});
