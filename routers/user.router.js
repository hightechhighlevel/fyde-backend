var router = require("express").Router(),
    userCtr = require("../controllers/user.controller");

router.post("/:id", userCtr.getUser);
router.get("/friend/:id", userCtr.getFriends);
router.put("/:id", userCtr.updatePoints);
router.put("/friend/:id", userCtr.updateFriendPoints);
router.put("/transaction/:id", userCtr.updateTransaction);
router.put("/claim/:id", userCtr.updateClaimStatus);
router.put("/blur/:id", userCtr.updateBlurTime);
router.put("/task/:id", userCtr.updateTask);

module.exports = router;
