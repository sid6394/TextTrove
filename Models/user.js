const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
    username: String,
    email: { type: String, unique: true },
    role: { type: String, default: 'user' },
});

// Apply passport-local-mongoose plugin
userSchema.plugin(passportLocalMongoose); // This automatically adds methods like `authenticate`, `setPassword`, and `verifyPassword`

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
