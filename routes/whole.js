let express = require("express"),
  mongoose = require("mongoose"),
  { v1: uuidv1, v4: uuidv4 } = require("uuid");
router = express.Router();
const ShortUniqueId = require("short-unique-id");
const Teams = require("../models/TeamModel");
const User = require("../models/UserModel");

// *******************************************************

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
      { $pull: { teamMembers: username } },
      { new: true }
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


// ******************************************************

router.post("/user-create", async (req, res, next) => {
  const { username, email, password, public } = req.body;
  console.log("hello");
  try {
    const newUser = new User({
      username: username,
      email: email,
      password: password,
      public: public,
      requestSent: [],
      requestReceived: [],
      friends: [],
    });

    console.log(newUser);

    await newUser.save();
    return res.status(200).send(newUser);
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
});

router.post("/toggle-public", async (req, res, next) => {
  const { username } = req.body;

  try {
    const user = await User.findOne({ username: username });
    if (user.public === false) {
      await user.updateOne({ public: true });
    }
    else if (user.public === true) {
      await user.updateOne({ public: false });
    }
    res.status(200).json({ user });
  } catch (error) {
    console.log(error);
  }
});

router.put("/send-request", async (req, res) => {
  const { currentUserId, requestedUserId } = req.body;

  try {
    try {
      const currentUser = await User.findOne({ _id: currentUserId });
      const requestedUser = await User.findOne({ _id: requestedUserId });

      //following code checks so that user cannot send multiple requests to the same person

      if (
        currentUser.requestSentPending.indexOf(requestedUserId) != -1 ||
        requestedUser.requestReceivedPending.indexOf(currentUserId) != -1
      ) {
        return res
          .status(401)
          .json("You cannot send multiple connection requests!");
      } else if (
        currentUser.friends.indexOf(requestedUserId) != -1 ||
        requestedUser.friends.indexOf(currentUserId) != -1
      ) {
        return res
          .status(401)
          .json("The user requested is already a connection!");
      }

      const updatedCurrentUser = await User.findOneAndUpdate(
        { _id: currentUserId },
        { $push: { requestSentPending: requestedUserId } },
        { new: true }
      );
      const updatedRequestedUser = await User.findOneAndUpdate(
        { _id: requestedUserId },
        { $push: { requestReceivedPending: currentUserId } },
        { new: true }
      );

      res.status(200).json({ updatedCurrentUser, updatedRequestedUser });
    } catch (error) {
      return res.status(500).json("Users not found");
    }
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

router.put("/accept-request", async (req, res) => {
  const { currentUserId, requestedUserId } = req.body;

  try {
    try {
      const currentUser = await User.findOne({ _id: currentUserId });
      const requestedUser = await User.findOne({ _id: requestedUserId });
      if (
        currentUser.requestSentPending.indexOf(requestedUserId) == -1 ||
        requestedUser.requestReceivedPending.indexOf(currentUserId) == -1
      ) {
        return res.status(401).json("Error in accepting request!");
      }

      const updatedRequestedUser = await User.findOneAndUpdate(
        { _id: requestedUserId },
        {
          $push: { friends: currentUserId },
          $pull: { requestReceivedPending: currentUserId },
        },
        { new: true }
      );

      const updatedCurrentUser = await User.findOneAndUpdate(
        { _id: currentUserId },
        {
          $push: { friends: requestedUserId },
          $pull: { requestSentPending: requestedUserId },
        },
        { new: true }
      );

      res.status(200).json({ updatedCurrentUser, updatedRequestedUser });
    } catch (error) {
      return res.status(500).json("Users not found");
    }
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// *******************************************************

router.get("/get-team", async (req, res, next) => {

  const { username } = req.body;

  const team = await Teams.find({ "teamMembers": username });

  if (team.length === 0) {
    return res.status(404).json("team not found");
  }

  // res.status(200).json(team);
  if (team[0].teamMembers[0] === username) {
    res.status(200).json({ teamLeader: true, team });
  }
  else {
    res.status(200).json({ teamLeader: false, team });
  }

});

// *******************************************************

router.post("/submit", async (req, res, next) => {

  try {
    const { username, link } = req.body;
    if (link === '') {
      return res.status(500).json("enter website link")
    }
    const team = await Teams.find({ "teamMembers": username });
    if (team.length === 0) {
      return res.status(404).json("team not found");
    }
    if (team[0].teamMembers[0] !== username) {
      return res.status(500).json("only team leader can submit");
    }

    const updatedTeam = await Teams.findOneAndUpdate(
      username,
      { "websiteLink": link },
      { new: true }
    );
    res.status(200).send(updatedTeam);

  } catch (error) {
    return res.status(500).json(error);
  }

})


module.exports = router;
