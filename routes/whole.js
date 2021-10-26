let express = require("express"),
  mongoose = require("mongoose"),
  { v1: uuidv1, v4: uuidv4 } = require("uuid");
router = express.Router();

const User = require("../models/UserModel");

router.get("/user-create", async (req, res, next) => {
  let username = "DummyUser",
    email = "dummy@gmail.com",
    password = "123456",
    public = true;

  try {
    const newUser = await User.create({
      username: username,
      email: email,
      password: password,
      public: public,
    });

    console.log(newUser);

    return res.status(200).send(newUser);
  } catch (error) {
    return res.status(500).send(error);
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

module.exports = router;
