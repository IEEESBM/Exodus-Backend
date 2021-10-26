let express = require("express"),
  mongoose = require("mongoose"),
  { v1: uuidv1, v4: uuidv4 } = require("uuid");
router = express.Router();
const Teams = require("../models/TeamModel");
const ShortUniqueId = require("short-unique-id");

//get request for now, will be changed to post request when data comes from req object
router.post("/create-team", async (req, res, next) => {

  const { username, pocEmail, teamName } = req.body;
  const uid = new ShortUniqueId({ length: 10 });

  try {
    const team = await Teams.create({

      teamName: teamName,
      teamID: uid(),
      pocEmail: pocEmail,
      teamMembers: [username],
    });
    return res.status(200).json({ team });
  }
  catch (err) {
    let errorMessage = { pocEmail: '', teamName: '' };
    if (err.code === 11000) {
      if (err.keyValue.teamName) {
        errorMessage.teamName = 'That team name is not available';
      }
      if (err.keyValue.pocEmail) {
        errorMessage.pocEmail = 'That email is already registered';
      }
    }
    if (err.message.includes('Team validation failed')) {
      Object.values(err.errors).forEach((err) => {
        errorMessage[err.properties.path] = err.properties.message;
      });
    }
    return res.status(500).json({ errorMessage });
  }

});

router.post("/join-team", async (req, res, next) => {

  const { username, teamID } = req.body;

  try {
    const checkDuplicate = await Teams.find({ "teamMembers": username });
    if (checkDuplicate.length !== 0) {
      return res.status(500).json({ error: 'the user has already joined a team' });
    }

    const team = await Teams.find({ "teamID": teamID });
    if (team.length === 0) {
      return res.status(500).json({ error: 'please enter correct team ID' })
    }

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
    const team = await Teams.find({ "teamID": teamID });
    console.log(team);
    if (team.length === 0) {
      return res.status(500).json({ error: 'please enter correct team ID' })
    }
    if (username === team[0].teamMembers[0]) {
      res.status(500).json({ error: 'the team leader cannot leave the team' });
      return;
    }

    const updatedTeam = await Teams.findOneAndUpdate(
      teamID,
      { $pull: { teamMembers: username } }
    );
    res.status(200).send(updatedTeam);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'error' })
  }
});

router.post("/delete-team", async (req, res, next) => {
  const { username, teamID } = req.body;

  try {
    const team = await Teams.find({ "teamID": teamID });
    if (team.length === 0) {
      return res.status(500).json({ error: 'please enter correct team ID' })
    }
    if (username !== team[0].teamMembers[0]) {
      res.status(500).json({ error: 'only the team leader can delete a team' });
      return;
    }
    await Teams.deleteOne({ "teamID": teamID });
    res.status(200).send('team deleted');
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'error' });
  }
});


module.exports = router;
