const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const submissionSchema = new Schema({
  teamName: {
    type: String,
    required: true,
  },
  websiteLink: {
    type: String,
    required: [true, 'Please enter link'],
  }
})

module.exports = mongoose.model("Submission", submissionSchema);