let express = require("express"),
  mongoose = require("mongoose"),
  { v1: uuidv1, v4: uuidv4 } = require("uuid");
router = express.Router();
const ShortUniqueId = require("short-unique-id");
const Teams = require("../models/TeamModel");
const User = require("../models/UserModel");

router.get("/:userId", async (req, res, next) => {
    
    const userId = req.params.userId;
  
    const team = await Teams.find({ "teamMembers": userId }).populate('teamMembers');
  
    if (team.length === 0) {
      return res.status(404).json("team not found");
    }
  
   console.log(team[0].teamMembers[0]);
    if (team[0].teamMembers[0]._id == userId) {
      res.status(200).json({ teamLeader: true, team });
    }
    else {
      res.status(200).json({ teamLeader: false, team });
    }

  
  });

router.post("/create", async (req, res, next) => {

    const { userId, pocEmail, teamName } = req.body;
    const uid = new ShortUniqueId({ length: 10 });
  
    try {
      const team = await Teams.create({
  
        teamName: teamName,
        teamID: uid(),
        pocEmail: pocEmail,
        teamMembers: [userId],
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
  
  router.post("/join", async (req, res, next) => {
  
    const { userId, teamID } = req.body;
  
    try {
      const checkDuplicate = await Teams.find({ "teamMembers": userId });
      if (checkDuplicate.length !== 0) {
        return res.status(500).json({ error: 'the user has already joined a team' });
      }
  
      const team = await Teams.find({ "teamID": teamID });
      if (team.length === 0) {
        return res.status(500).json({ error: 'please enter correct team ID' })
      }
  
      const updatedTeam = await Teams.findOneAndUpdate(
        teamID,
        { $push: { teamMembers: userId } },
        { new: true }
      );
      res.status(200).send(updatedTeam);
    } catch (error) {
      res.status(500).send(error);
    }
  });
  
  router.post("/leave", async (req, res, next) => {
    const { userId, teamID } = req.body;
  
    try {
      const team = await Teams.find({ "teamID": teamID });
      console.log(team);
      if (team.length === 0) {
        return res.status(500).json({ error: 'please enter correct team ID' })
      }
      if (userId === team[0].teamMembers[0]) {
        res.status(500).json({ error: 'the team leader cannot leave the team' });
        return;
      }
  
      const updatedTeam = await Teams.findOneAndUpdate(
        teamID,
        { $pull: { teamMembers: userId } },
        { new: true }
      );
      res.status(200).send(updatedTeam);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'error' })
    }
  });
  
  router.post("/delete", async (req, res, next) => {
    const { userId, teamID } = req.body;
  
    try {
      const team = await Teams.find({ "teamID": teamID });
      if (team.length === 0) {
        return res.status(500).json({ error: 'please enter correct team ID' })
      }
      
      if (userId != team[0].teamMembers[0]) {
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