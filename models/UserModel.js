const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema1 = new Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  public: {
    type: Boolean,
    required: true,
    default: false,
  },

  requestSentPending: [String],

  requestReceivedPending: [String],

  friends: [String],
});

module.exports = mongoose.model("User", userSchema1);
