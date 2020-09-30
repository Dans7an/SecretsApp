//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('public'));
//Setting up mongodb using mongoose
mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false})
//Creating a schema which a blueprint for your dataBase
//Implimenting the mongoose class with the schema method instead of the usual JS object
const userSchema = new mongoose.Schema({
  email: String,
  password: String
});
//Creating our secret text and encrypting only the password field

const User = mongoose.model("User",userSchema);
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
//registering a new user
app.post("/register",function(req,res){
  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    // Store hash in your password DB.
    const newUser = new User ({
      email: req.body.username,
      password: hash
    });
      newUser.save(function(err){
        if(err){
          console.log(err);
        } else {
          res.render("secrets");
        }
      })
});
});
//login as a new user
app.post("/login", function(req,res){
    const username = req.body.username;
    const password = req.body.password;

  User.findOne({email: username}, function(err, foundlist){
    if (err){
      console.log(err);
    } else {
      // Load hash from your password DB.
      bcrypt.compare(password, foundlist.password, function(err, result) {
          // result == true
          if(result === true){
            res.render("secrets");
          }
      });
    }
  })
});

app.listen(3000, function(){
  console.log("Server started on port 3000");
});
