const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../Models/user'); // Adjust path if necessary

passport.use(new LocalStrategy({
    usernameField: 'email',  // Email will be the username for login
    passwordField: 'password', // Field for password
}, async (email, password, done) => {
    try {
        const user = await User.findOne({ email });

        if (!user) {
            return done(null, false, { message: 'Incorrect email.' });
        }

        // Use the `authenticate` method from `passport-local-mongoose` to check the password
        user.authenticate(password, (err, authenticatedUser) => {
            if (err) return done(err);
            if (!authenticatedUser) {
                return done(null, false, { message: 'Incorrect password.' });
            }
            return done(null, authenticatedUser);
        });

    } catch (err) {
        return done(err);
    }
}));

// Serializing and deserializing the user for session storage
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

module.exports = passport;
