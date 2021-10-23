let express = require("express"),
  mongoose = require("mongoose"),
  { v1: uuidv1, v4: uuidv4 } = require("uuid");
router = express.Router();
const Teams = require("../models/TeamModel");
const ShortUniqueId = require("short-unique-id");

//get request for now, will be changed to post request when data comes from req object
router.post("/create-team", (req, res, next) => {
  const { leader, email, teamName } = req.body;
  const uid = new ShortUniqueId({ length: 10 });

  try {
    const team = new Teams({
      _id: new mongoose.Types.ObjectId(),
      teamName: teamName,
      teamID: uid(),
      pocEmail: email,
      teamMembers: [leader],
    });

    team.save();
    return res.status(200).send(team);
  } catch (err) {
    console.log(err);
    return res.status(500).send("Unable to create team!");
  }
});

router.post("/join-team", async (req, res, next) => {
  const { username, teamID } = req.body;
  try {
    const updatedTeam = await Teams.findOneAndUpdate(
      teamID,
      { $push: { teamMembers: username } },
      { new: true }
    );
    res.status(200).send(updatedTeam);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post("/leave-team", async (req, res, next) => {
  const { username, teamID } = req.body;

  try {
    const updatedTeam = await Teams.findOneAndUpdate(
      teamID,
      { $pull: { teamMembers: username } }
    );
    res.status(200).send(updatedTeam);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

router.post("/delete-team", async (req, res, next) => {
  const { teamID } = req.body;

  try {
    await Teams.deleteOne({ "teamID": teamID });
    res.status(200).send('team deleted');
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});


module.exports = router;
