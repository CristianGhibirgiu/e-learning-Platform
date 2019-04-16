var Lesson = require("../models/lesson");
var Comment = require("../models/comment");

// all the middleware goes here
var middlewareObj = {};

middlewareObj.checkLessonOwnership = function(req, res, next) {
 if(req.isAuthenticated()){
        Lesson.findById(req.params.id, function(err, foundLesson){
           if(err || !foundLesson){
               req.flash("error", "Aceasta lectie nu exista sau a fost stearsa!");
               res.redirect("back");
           }  else {
               // does user own the lesson?
            if(foundLesson.author.id.equals(req.user._id) || req.user.isAdmin) {
                next();
            } else {
                req.flash("error", "Nu ai permisiunea necesara pentru a face asta!");
                res.redirect("/lessons");
            }
           }
        });
    } else {
        req.flash("error", "Trebuie sa te autentifici pentru a face asta!");
        res.redirect("back");
    }
}

middlewareObj.checkCommentOwnership = function(req, res, next) {
 if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id, function(err, foundComment){
           if(err || !foundComment){
               req.flash("error" , "Comentariul nu a fost gasit!");
               res.redirect("/lessons/" + req.params.id );
           }  else {
               // does user own the comment?
            if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin) {
                next();
            } else {
                req.flash("error", "Nu ai permisiunea necesara pentru a face asta!");
                res.redirect("back");
            }
           }
        });
    } else {
        req.flash("error", "Trebuie sa te autentifici pentru a face asta!");
        res.redirect("back");
    }
}

middlewareObj.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "Trebuie sa te autentifici pentru a face asta!");
    res.redirect("/login");
}

module.exports = middlewareObj;
