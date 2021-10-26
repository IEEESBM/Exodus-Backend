const mongoose = require("mongoose");
const { isEmail } = require('validator');
const Schema = mongoose.Schema;

const teamSchema = new Schema({

  teamID: {
    type: String,
    unique: true
  },

  teamName: {
    type: String,
    unique: true,
    required: [true, 'Please enter a Team Name'],
    minlength: [4, 'Minimum Team Name length must be 4 characters']
  },

  teamMembers: [String],

  pocEmail: {
    type: String,
    required: [true, 'Please enter your Email ID'],
    unique: true,
    lowercase: true,
    validate: [isEmail, 'Please enter a valid Email ID']
  },

});

module.exports = mongoose.model("Team", teamSchema);
