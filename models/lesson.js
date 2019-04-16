var mongoose = require("mongoose");

//SCHEMA SETUP
var lessonSchema = new mongoose.Schema({
   name: String,
   difficulty: String,
   image: String,
   description: String,
   createdAt: { type: Date, default: Date.now },
   author: {
      id: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User"
      },
      username: String
   },
   comments: [
      {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Comment"
      }
   ]
   });

module.exports =  mongoose.model("Lesson",lessonSchema);
