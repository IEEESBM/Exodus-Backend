let express = require("express"),
  mongoose = require("mongoose"),
  { v1: uuidv1, v4: uuidv4 } = require("uuid");
router = express.Router();

const User = require("../models/UserModel");

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

router.get("/public-users", async (req, res, next) => {
  let publicBool = true;
  try {
    let publicUsers;
    publicUsers = await User.find({
      public: {
        $in: [publicBool],
      },
    });
    res.status(200).json(publicUsers);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.put("/toggle-public", async (req, res, next) => {
  let toggleBool = false;

  try {
    const updatedUser = await User.findOneAndUpdate(
      "dummy1@gmail.com",
      {
        $set: { public: toggleBool },
      },
      { new: true }
    );
    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.put("/send-request/", async (req, res) => {
  const { currentUserId, requestedUserId } = req.body;

  try {
    try {
      const currentUser = await User.findOne({ _id: currentUserId });
      const requestedUser = await User.findOne({ _id: requestedUserId });

      if (
        currentUser.requestSentPending.indexOf(requestedUserId) != -1 ||
        requestedUser.requestReceivedPending.indexOf(currentUserId) != -1
      ) {
        return res
          .status(401)
          .json("You cannot send multiple connection requests!");
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

router.put("/accept-request/", async (req, res) => {
  const { currentUserId, requestedUserId } = req.body;

  console.log(requestedUserId);

  try {
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
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

module.exports = router;
