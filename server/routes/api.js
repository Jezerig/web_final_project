
var express = require('express');
var router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const {body, validationResult } = require("express-validator");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const passport = require('passport');
const multer = require("multer")
const storage = multer.memoryStorage();
const upload = multer({storage});
const Post = require("../models/Post");
const Comment = require("../models/Comment");

require('../auth/passport')(passport)
//source: https://stackoverflow.com/questions/60034257/typeerror-req-login-is-not-a-function-passport-js
router.use(passport.initialize());


router.post('/user/login',
  upload.none(),
  body("email").trim().escape(),
  body("password"),
  (req, res, next) => {
    User.findOne({email: req.body.email}, (err, user) =>{
    if(err) throw err;
    if(!user) {
      return res.send({success: false, message: "Invalid credentials"});
    } else {
      bcrypt.compare(req.body.password, user.password, (err, isMatch) => {
        if(err) throw err;
        if(isMatch) {
          const jwtPayload = {
            id: user._id,
            email: user.email
          }
          jwt.sign(
            jwtPayload,
            process.env.SECRET,
            {
              expiresIn: 6000
            },
            (err, token) => {
              res.json({success: true, token});
            }
          );
        } else {
          return res.status(403).json({success: false, message: "Invalid credentials"});
        }
      })
    }
    })
});

router.post('/user/register', 
  body("email").trim().isEmail().escape(),
  body("password").isStrongPassword().withMessage('Password is not strong enough'),
  (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      return res.status(400).json({success: false, errors: errors.array()});
    }
    //checks if email or username is already in use: https://stackoverflow.com/questions/33627238/mongoose-find-with-multiple-conditions
    User.findOne({$or:[{username: req.body.username}, {email: req.body.email}]}, (err, user) => {
      if(err) {
        console.log(err);
        throw err
      };
      if(user){
        return res.status(403).json({success: false, message: "Email or Username already in use"});
      } else {
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(req.body.password, salt, (err, hash) => {
            if(err) throw err;
            User.create(
              {
                username: req.body.username,
                email: req.body.email,
                password: hash,
                bio: req.body.bio,
                admin: 0
              },
              (err, ok) => {
                if(err) throw err;
                return res.send({success: true, message: "New user registered."});
              }
            );
          });
        });
      }
    });
});

router.post('/newpost', passport.authenticate('jwt', {session: false}), (req, res, next) => {
  new Post({
      username: req.user.username,
      userid: req.user._id,
      title: req.body.title,
      text:req.body.text
  }).save((err) => {
      if(err) return next(err);
      return res.send({success: true});
  });
});

router.post('/addcomment', passport.authenticate('jwt', {session: false}), (req, res, next) => {
  new Comment({
      username: req.user.username,
      userid: req.user._id,
      postid: req.body.postid,
      text:req.body.text
  }).save((err) => {
      if(err) return next(err);
      return res.send({success: true});
  });
});


router.get('/posts', (req, res, next) => {
  Post.find({}, (err, posts) => {
    if (err) return next(err)
    if (posts) {
        return res.send(posts);
    } else {
        return res.send("No posts.");
    }
  });
});

router.get("/comment/:id", (req, res, next) => {
  Comment.find({'postid' : req.params.id}, (err, comments) => {
      if(err) return next(err);
      if(comments) {
          return res.send({success: true, comments});
      } else {
          return res.status(404).send({success: false, message: "Error loading post comments"});
      }
  });
})

router.get("/post/:id", (req, res, next) => {
  Post.findOne({_id : req.params.id}, (err, post) => {
      if(err) return next(err);
      if(post) {
          return res.send({success: true, post});
      } else {
          return res.status(404).send({success: false, message: "Error loading post"});
      }
  });
})

router.get("/user/:id", (req, res, next) => {
  User.findOne({_id : req.params.id}, (err, user) => {
      if(err) return next(err);
      if(user) {
          return res.send({success: true, user});
      } else {
          return res.status(404).send({success: false, message: "Error loading user"});
      }
  });
})

module.exports = router;