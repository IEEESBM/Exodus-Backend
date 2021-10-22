const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const teamSchema = new Schema({
  _id: mongoose.Schema.Types.ObjectId,
  teamID: {
    type: String,
    unique: true
  },
  teamName: {
    type: String,
    unique: true
  },
  teamMembers: [String],
  pocEmail: {
    type: String,
    unique: true
  },
});

module.exports = mongoose.model("Team", teamSchema);
