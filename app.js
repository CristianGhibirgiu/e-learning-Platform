var express       = require("express"),
    app           = express(),
    bodyParser    = require("body-parser"),
    mongoose      = require("mongoose"),
    flash         = require("connect-flash"),
    passport      = require("passport"),
    LocalStrategy = require("passport-local"),
    methodOverride= require("method-override"),
    Lesson        = require("./models/lesson"),
    Comment       = require("./models/comment"),
    User          = require("./models/user");

//configurare dotenv
require('dotenv').config();

//requiring routes
var commentRoutes    = require("./routes/comments"),
    lessonRoutes     = require("./routes/lessons"),
    indexRoutes      = require("./routes/index");

mongoose.connect("mongodb://localhost:27017/licenta", { useNewUrlParser: true });
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
//require moment
app.locals.moment = require('moment');
app.use(flash());

// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "Sir de caractere mega secret!",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(async function(req, res, next){
   res.locals.currentUser = req.user;
   //functia pt notificari
   if(req.user){
     try{
       let user = await User.findById(req.user._id).populate("notifications", null, {isRead: false}).exec();
       res.locals.notifications = user.notifications.reverse();
     } catch(err){
       console.log(err.message);
     }
   }
   res.locals.error = req.flash("error");
   res.locals.success = req.flash("success");
   next();
});


app.use("/", indexRoutes);
app.use("/lessons", lessonRoutes);
app.use("/lessons/:id/comments", commentRoutes);


app.listen(3000, function(){
  console.log("Server start on port 3000");
});
