let express = require("express"),
  mongoose = require("mongoose"),
  { v1: uuidv1, v4: uuidv4 } = require("uuid");
router = express.Router();
const ShortUniqueId = require("short-unique-id");
const Teams = require("../models/TeamModel");
const User = require("../models/UserModel");
const { checkIsVerified, checkJWT } = require('../middleware/authMiddleware');
const {verifyToken} = require('../middleware/usercheck');

router.get("/",verifyToken, async (req, res, next) => {
    
    const userId = req.userId;
    console.log("userId:"+userId);
  
    const team = await Teams.find({ "teamMembers": userId });
  
    if (team.length === 0) {
      return res.status(404).json("team not found");
    }
  
   console.log(team);
    if (team[0].teamMembers[0]._id == userId) {
      res.status(200).json({ teamLeader: true, team });
    }
    else {
      res.status(200).json({ teamLeader: false, team });
    }

  
  });

router.post("/create",verifyToken, async (req, res, next) => {

    const {teamName } = req.body;
    const userId = req.userId;
    const user = await User.findOne({_id:userId});
    if(!user){
      return res.status(404).json({'err':'User not found'});
    }
    const pocEmail = user.email;
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
      // let errorMessage = { pocEmail: '', teamName: '' };
      // if (err.code === 11000) {
      //   if (err.keyValue.teamName) {
      //     errorMessage.teamName = 'That team name is not available';
      //   }
      //   if (err.keyValue.pocEmail) {
      //     errorMessage.pocEmail = 'That email is already registered';
      //   }
      // }
      // if (err.message.includes('Team validation failed')) {
      //   Object.values(err.errors).forEach((err) => {
      //     errorMessage[err.properties.path] = err.properties.message;
      //   });
      // }
      // return res.status(500).json({ errorMessage });
      return res.status(500).json({'err':err.toString()});
    }
  
  });
  
  router.post("/join",verifyToken, async (req, res, next) => {
  
    const {teamID } = req.body;
    const userId = req.userId;
  
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
  
  router.post("/leave",verifyToken, async (req, res, next) => {
    const {teamID } = req.body;
    const userId = req.userId;
  
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
  
  router.post("/delete",verifyToken, async (req, res, next) => {
    const {teamID } = req.body;
    const userId = req.userId;
  
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

  router.post("/submit",verifyToken, async (req, res, next) => {

    try {
      const {websiteLink,details,topic } = req.body;
      const userId = req.userId;
      // if (link === '') {
      //   return res.status(500).json("enter website link")
      // }
      const team = await Teams.findOne({ "teamMembers": userId });
      console.log(team);
      if(!team){
        return res.status(404).json({'msg':'Team not found'});
      }
      // if (team.length === 0) {
      //   return res.status(404).json("team not found");
      // }
      // if (team[0].teamMembers[0]._id !== userId) {
      //   return res.status(500).json("only team leader can submit");
      // }
  
      const updatedTeam = await Teams.findOneAndUpdate(
        {"teamMembers":userId},
        { websiteLink,details,topic },
        { new: true }
      );
      console.log(updatedTeam);
      res.status(200).json(updatedTeam);
  
    } catch (error) {
      return res.status(500).json(error);
    }
  
  })
  
module.exports = router;  