var express = require("express");
var router  = express.Router({mergeParams: true});
var Lesson = require("../models/lesson");
var Comment = require("../models/comment");
var middleware = require("../middleware");

//Comments New
router.get("/new",middleware.isLoggedIn, function(req, res){
    // find campground by id
    console.log(req.params.id);
    Lesson.findById(req.params.id, function(err, lesson){
        if(err){
            console.log(err);
        } else {
             res.render("comments/new", {lesson: lesson});
        }
    })
});

//Comments Create
router.post("/",middleware.isLoggedIn,function(req, res){
   //lookup lesson using ID
   Lesson.findById(req.params.id, function(err, lesson){
       if(err){
           console.log(err);
           res.redirect("/lessons");
       } else {
        Comment.create(req.body.comment, function(err, comment){
           if(err){
               req.flash("error", "Eroare");
               console.log(err);
           } else {
               //add username and id to comment
               comment.author.id = req.user._id;
               comment.author.username = req.user.username;
               //save comment
               comment.save();
               lesson.comments.push(comment);
               lesson.save();
               console.log(comment);
               req.flash("success", "Comentariu adaugat cu succes");
               res.redirect('/lessons/' + lesson._id);
           }
        });
       }
   });
});

// COMMENT EDIT ROUTE
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function(req, res){
   Lesson.findById(req.params.id, function(err, foundLesson){
        if(err || !foundLesson){
          req.flash("error", "Aceasta lectie nu exista sau a fost stearsa!");
           return res.redirect("/lessons/" + req.params.id);
        }
        Comment.findById(req.params.comment_id, function(err, foundComment){
             if(err){
                 res.redirect("back");
             } else {
               res.render("comments/edit", {lesson_id: req.params.id, comment: foundComment});
             }
          });
   });
});

// COMMENT UPDATE
router.put("/:comment_id", middleware.checkCommentOwnership, function(req, res){
   Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
      if(err){
          res.redirect("back");
      } else {
          res.redirect("/lessons/" + req.params.id );
      }
   });
});

// COMMENT DESTROY ROUTE
router.delete("/:comment_id", middleware.checkCommentOwnership, function(req, res){
    //findByIdAndRemove
    Comment.findByIdAndRemove(req.params.comment_id, function(err){
       if(err){
           res.redirect("back");
       } else {
           req.flash("success", "Comentariu sters cu succes");
           res.redirect("/lessons/" + req.params.id);
       }
    });
});

module.exports = router;
