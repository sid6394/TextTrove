const mongoose = require('mongoose');
const User = require('./Models/user');
require('dotenv').config();

// MongoDB connection string
const dbURI = process.env.ATLASDB_URI;

// Connect to MongoDB
mongoose.connect(dbURI)
  .then(() => {
    console.log('Connected to MongoDB');
    createAdmin(); // Create admin user
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1); // Exit the process if connection fails
  });

const createAdmin = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@texttrove.in' });

    if (!existingAdmin) {
      const adminUser = new User({
        username: 'Admin',
        email: 'admin@texttrove.in',
        role: 'admin', // Add role for admin differentiation
      });

      await User.register(adminUser, 'Haridwar123+'); // Register admin with secure password
      console.log('Admin user created');
    } else {
      console.log('Admin user already exists');
    }
  } catch (err) {
    console.error('Error creating admin user:', err.message);
  } finally {
    mongoose.connection.close(); // Close the database connection
  }
};
