//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('public'));
//Using the sessions package
app.use(session({
  secret: 'The secret I tell everyone,',
  resave: false,
  saveUninitialized: true
}));
//enabling passport, passport is used for authentication
app.use(passport.initialize());
app.use(passport.session());
//Setting up mongodb using mongoose
mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});
mongoose.set("useCreateIndex", true);
//Creating a schema which a blueprint for your dataBase
//Implimenting the mongoose class with the schema method instead of the usual JS object
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  facebookId: String,
  secret: String
});
//plugin Passport-Local Mongoose into your User schema
userSchema.plugin(passportLocalMongoose);
//Applying the findOrCreate package as a plugin
userSchema.plugin(findOrCreate);

const User = mongoose.model("User",userSchema);

passport.use(User.createStrategy());
 //serialize creates the cookie content and deserialize breaks the cookie in order to read the content
 passport.serializeUser(function(user, done) {
   done(null, user.id);
 });

 passport.deserializeUser(function(id, done) {
   User.findById(id, function(err, user) {
     done(err, user);
   });
 });
//configuring the google strategy
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
//configuring the new facebook strategy
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
//Retriving data from home route
app.get("/",function(req,res){
  res.render("home");
});

app.get("/register",function(req,res){
  res.render("register");
});

app.get("/login",function(req,res){
  res.render("login");
});

app.get("/secrets", function(req,res){
  User.find({"secret":{$ne:null}}, function (err, foundUser){
    if(err){
      console.log(err);
    } else {
      if(foundUser){
      res.render("secrets",{usersWithSecrets: foundUser});
    }
    }
  });
});
app.get("/submit", function(req,res){
  if(req.isAuthenticated()){
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});
app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});
//register or login user using google
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });
//register or login user using facebook
app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });
//registering a new user
app.post("/register",function(req,res){
  User.register({username: req.body.username , active: false}, req.body.password, function(err, user) {
  if (err) {
  console.log(err);
res.redirect("/register") } else {
   passport.authenticate("local")(req,res, function() {
    if (err) {
    console.log(err);
  } else {
    res.redirect("/secrets");
  }
});
};
})
});
//login as a new user
app.post("/login", function(req,res){
    const user = new User ({
      username: req.body.username,
      password: req.body.password
    });

    req.login(user,function(err){
      if(err){
        console.log(err);
      } else {
        passport.authenticate("local")(req,res, function() {
         if (err) {
         console.log(err);
       } else {
         res.redirect("/secrets");
       }
      })
}
})
});
//Submitting your secret
app.post("/submit", function(req,res){
  const submittedSecret = req.body.secret;
  User.findById(req.user._id, function(err, foundUser){
    if(err){
      console.log(err);
    } else if(foundUser){
      foundUser.secret = submittedSecret;
      foundUser.save(function(err){
        if(err){
          console.log(err);
        } else {
          res.redirect("/secrets");
        }
      })

    }
  })
});

app.listen(3000, function(){
  console.log("Server started on port 3000");
});
