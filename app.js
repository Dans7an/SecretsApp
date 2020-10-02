//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

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
  password: String
});
//plugin Passport-Local Mongoose into your User schema
userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User",userSchema);

passport.use(User.createStrategy());
 //serialize creates the cookie content and deserialize breaks the cookie in order to read the content
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

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
  if(req.isAuthenticated()){
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});
app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
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

app.listen(3000, function(){
  console.log("Server started on port 3000");
});
