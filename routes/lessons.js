var express = require("express");
var router  = express.Router();
var Lesson = require("../models/lesson");
var User = require("../models/user");
var Notification = require("../models/notification");
var middleware = require("../middleware");


//INDEX - show all lessons
router.get("/", function(req, res){
  var noMatch = null;
    if(req.query.search) {
      const regex = new RegExp(escapeRegex(req.query.search), 'gi');
      Lesson.find({name: regex}, function(err, allLessons){
         if(err){
             console.log(err);
         } else {
            if(allLessons.length < 1) {
              noMatch = "Nu exista aceasta lectie. Doresti sa cauti altceva?";
            }
            res.render("lessons/index",{lessons:allLessons, noMatch: noMatch });
         }
      });
    } else {
      // Get all lessons from DB
      Lesson.find({}, function(err, allLessons){
         if(err){
             console.log(err);
         } else {
            res.render("lessons/index",{lessons:allLessons, noMatch: noMatch });
         }
      });
    }
});

//CREATE - add new lesson to DB
router.post("/", middleware.isLoggedIn, async function(req, res){

    // get data from form and add to lessons array
    var name = req.body.name;
    var image = req.body.image;
    var difficulty = req.body.difficulty;
    var desc = req.body.description;
    var author = {
        id: req.user._id,
        username: req.user.username
    }
    var newLesson = {name: name, image: image, description: desc, author:author, difficulty: difficulty};

    try {
      let lesson = await Lesson.create(newLesson);
      let user = await User.findById(req.user._id).populate('followers').exec();
      let newNotification = {
        username: req.user.username,
        follId: lesson.id
      }
      for(const follower of user.followers) {
        let notification = await Notification.create(newNotification);
        follower.notifications.push(notification);
        follower.save();
      }

      //redirect back to lesson page
      res.redirect(`/lessons/${lesson.id}`);
    } catch(err) {
      req.flash('error', err.message);
      res.redirect('back');
    }
});


//NEW - show form to create new lesson
router.get("/new", middleware.isLoggedIn, function(req, res){
   res.render("lessons/new");
});

// SHOW - shows more info about one lesson
router.get("/:id", function(req, res){
    //find the campground with provided ID
    Lesson.findById(req.params.id).populate("comments").exec(function(err, foundLesson){
        if(err || !foundLesson){
            req.flash("error", "Aceasta postare nu exista sau a fost stearsa");
            res.redirect("/lessons");
        } else {
            console.log(foundLesson);
            //render show template with that campground
            res.render("lessons/show", {lesson: foundLesson});
        }
    });
});

// EDIT Lesson ROUTE
router.get("/:id/edit", middleware.checkLessonOwnership, function(req, res){
    Lesson.findById(req.params.id, function(err, foundLesson){
       if(err){
          console.log(err);
       }
        res.render("lessons/edit", {lesson: foundLesson});
    });
});

// UPDATE Lesson ROUTE
router.put("/:id",middleware.checkLessonOwnership, function(req, res){
    // find and update the correct campground
    Lesson.findByIdAndUpdate(req.params.id, req.body.lesson, function(err, updateLesson){
       if(err){
           res.redirect("/lessons");
       } else {
           //redirect somewhere(show page)
           res.redirect("/lessons/" + req.params.id);
       }
    });
});

// DESTROY Lesson ROUTE
router.delete("/:id",middleware.checkLessonOwnership, function(req, res){
   Lesson.findByIdAndRemove(req.params.id, function(err,lesson){
      if(err){
          res.redirect("/lessons");
      } else {
        req.flash("success", "Postarea a fost inlaturata cu succes");
          res.redirect("/lessons");
      }
   });
});



function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};


module.exports = router;
