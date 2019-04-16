var express = require("express");
var router  = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Lesson = require("../models/lesson");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
var Notification = require("../models/notification");
var {isLoggedIn} = require('../middleware');

//root route
router.get("/", function(req, res){
    res.render("landing");
});

// show register form
router.get("/register", function(req, res){
   res.render("register");
});

//handle sign up logic
router.post("/register", function(req, res){
    var newUser = new User({
      username: req.body.username,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      avatar: req.body.avatar
    });
    // if(req.body.adminCode === 'adm@12#HTx') {
    //   newUser.isAdmin = true;
    // }
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.render("register", {error: err.message});
        }
        passport.authenticate("local")(req, res, function(){
           req.flash("success", "Te-ai inregistrat cu succes " + req.body.username);
           res.redirect("/lessons");
        });
    });
});
//show login form
router.get("/login", function(req, res){
   res.render("login");
});

//handling login logic
router.post("/login", passport.authenticate("local",
    {
        successRedirect: "/lessons",
        failureRedirect: "/login"
    }), function(req, res){
});

// logout route
router.get("/logout", function(req, res){
   req.logout();
   req.flash("success", "Te-ai deconectat cu succes. La revedere!");
   res.redirect("/lessons");
});

//forgot Password
router.get('/forgot', function(req, res) {
  res.render('forgot');
});

router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
    User.findOne({ email: req.body.email }, function(err, user) {
      if (!user) {
        req.flash('error', 'Nu exista un email atasat acestui account.');
        return res.redirect('/forgot');
      }

      user.resetPasswordToken = token;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

      user.save(function(err) {
        done(err, token, user);
      });
    });
  },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'lucrarelicenta2019@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
       to: user.email,
       from: 'lucrarelicenta2019@gmail.com',
       subject: 'webTuts password reset',
       text: 'Ai primit acest mesaj deoarece ai solicitat o resetare de parola pentru contul tau.\n\n' +
         'Apasa pe linkul urmator, sau acceseaza-l direct din browser si completeaza procedurile aferente :\n\n' +
         'http://' + req.headers.host + '/reset/' + token + '\n\n' +
         'Daca nu ai solicitat acest lucru, te rog ignora acest mesaj, parola ta ramanand neschimbata.\n'
     };
     smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'Un e-mail a fost trimit catre ' + user.email + ' cu intructiunile necesare.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Token-ul pentru resetarea parolei este invalid sau a expirat.');
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Token-ul pentru resetarea parolei este invalid sau a expirat.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "Parola nu corespunde.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'lucrarelicenta2019@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'lucrarelicenta2019@gmail.com',
        subject: 'Parola ta a fost schimbata cu succes',
        text: 'Salut,\n\n' +
          'Acest email reprezinta confirmarea faptului ca parola atasata email-ului ' + user.email + ' a fost schimbata.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Parola ta a fost schimbata.');
        done(err);
      });
    }
  ], function(err) {
   res.redirect('/lessons');
 });
});


//personal profile
router.get("/profile/:id", function(req, res){
  User.findById(req.params.id, function(err, foundUser) {
    if(err){
      req.flash("error", "Ceva nu a mers bine!");
      return res.redirect("/lessons");
    }
    Lesson.find().where("author.id").equals(foundUser._id).exec(function(err, lessons) {
      if(err){
        req.flash("error", "Ceva nu a mers bine!");
        return res.redirect("/lessons");
      }
        res.render("users/show", {user: foundUser, lessons: lessons});
    });
  });
});

// profile for follow function
router.get("/users/:id", async function(req, res) {
  try {
    let user = await User.findById(req.params.id).populate('followers').exec();
    res.render('users/show', { user: user} );
  } catch(err) {
    req.flash('error', err.message);
    return res.redirect('back');
  }
});

// follow user
router.get('/follow/:id', isLoggedIn, async function(req, res) {
  try {
    let user = await User.findById(req.params.id);
    user.followers.push(req.user._id);
    user.save();
    req.flash('success', 'Ai inceput sa il/o urmaresti pe: ' + user.username + '!');
    res.redirect('/users/' + req.params.id);
  } catch(err) {
    req.flash('error', err.message);
    res.redirect('back');
  }
});

//view all notifications
router.get('/notifications', isLoggedIn, async function(req, res) {
  try {
    let user = await User.findById(req.user._id).populate({
      path: 'notifications',
      options: { sort: { "_id": -1 } }
    }).exec();
    let allNotifications = user.notifications;
    res.render('notifications/index', { allNotifications });
  } catch(err) {
    req.flash('error', err.message);
    res.redirect('back');
  }
});

// handle notification
router.get('/notifications/:id', isLoggedIn, async function(req, res) {
  try {
    let notification = await Notification.findById(req.params.id);
    notification.isRead = true;
    notification.save();
    res.redirect(`/lessons/${notification.follId}`);
  } catch(err) {
    req.flash('error', err.message);
    res.redirect('back');
  }
});

module.exports = router;
