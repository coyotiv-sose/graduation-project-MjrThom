console.log("Travel Mate");

const express = require('express');
const app = express();
const helmet = require('helmet');
const mongoose = require('mongoose');
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const InstagramStrategy = require('passport-instagram').Strategy;
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Set up middleware for parsing requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up helmet middleware for enhancing app security
app.use(helmet());

// Set up routes for the app
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Connect to the database
mongoose.connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Database connected'))
  .catch(err => console.log(`Database connection error: ${err.message}`));

// Define the user schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  facebookId: String,
  googleId: String,
  instagramId: String,
  hasCompletedDigitalLobby: Boolean,
});

// Define the User model
const User = mongoose.model('User', userSchema);

// Configure passport with social media strategies
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: 'http://localhost:3000/auth/facebook/callback'
}, (accessToken, refreshToken, profile, done) => {
  // Handle authentication for Facebook sign-in
  // ...
}));

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:3000/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
  // Handle authentication for Google sign-in
  // ...
}));

passport.use(new InstagramStrategy({
  clientID: process.env.INSTAGRAM_CLIENT_ID,
  clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
  callbackURL: 'http://localhost:3000/auth/instagram/callback'
}, (accessToken, refreshToken, profile, done) => {
  // Handle authentication for Instagram sign-in
  // ...
}));

// Set up passport middleware for managing authentication
app.use(passport.initialize());
app.use(passport.session());

// Set up routes for social media sign-in
app.get('/auth/facebook', passport.authenticate('facebook'));
app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), (req, res) => {
  // Handle successful Facebook sign-in
  res.redirect('/');
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
  // Handle successful Google sign-in
  res.redirect('/');
});

app.get('/auth/instagram', passport.authenticate('instagram'));
app.get('/auth/instagram/callback', passport.authenticate('instagram', { failureRedirect: '/login' }), (req, res) => {
  // Handle successful Instagram sign-in
  res.redirect('/');
});

// Set up socket.io middleware for managing real-time chat
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Set up routes for real-time chat
app.get('/chat', (req, res) => {
  res.sendFile(__dirname + '/chat.html');
});

// Start the server
const port = 3000;
http.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

// Set up
const lobby = io.of('/lobby');

lobby.on('connection', (socket) => {
  console.log('A user connected to the lobby');

  socket.on('join', (userId) => {
    // Join the user to a room named after their userId
    socket.join(userId);
    console.log(`User ${userId} joined the lobby`);

    // Broadcast a message to other users in the lobby
    socket.to(userId).emit('message', `User ${userId} joined the lobby`);
  });

  socket.on('leave', (userId) => {
    // Leave the room named after the user's userId
    socket.leave(userId);
    console.log(`User ${userId} left the lobby`);

    // Broadcast a message to other users in the lobby
    socket.to(userId).emit('message', `User ${userId} left the lobby`);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected from the lobby');
  });
});
