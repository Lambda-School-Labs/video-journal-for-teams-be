const express = require("express");
const Organizations = require("../organization/organizationModel");
const router = express.Router();

// router.get("/", (req, res) => {
//   Organizations.findById(1)
//     .then((org) => res.status(200).json(org))
//     .catch((err) => res.status(500).json({ error: err }));
// });

//create and add member to organization
router.post("/", (req, res) => {
  console.log(req.body);
  const org = req.body.name;
  const uid = req.body.uid;
  console.log(org);
  Organizations.insert(org)
    .then((_org) => {
      console.log(_org);
      Organizations.insertOrgUser({
        organization_id: _org[0],
        user_id: uid,
        role_id: 3,
      }).then(() => res.status(201).json({ id: _org[0], name: org.name }));
    })
    .catch((err) => res.status(500).json({ error: err }));
});

//add member to an org

router.post("/:id/members", (req, res) => {
  const { id } = req.params;
  const userInfo = { ...req.body, organization_id: Number(id) };

  if (userInfo.organization_id && userInfo.user_id && userInfo.role_id) {
    Organizations.insertOrgUser(userInfo)
      .then(() => res.status(201).json(userInfo))
      .catch((err) => res.status(500).json({ error: err }));
  } else {
    res.status(400).json({ message: "must contain required fields" });
  }
});

// fetch all users in an organization

router.get("/:id/users", (req, res) => {
  const { id } = req.params;
  Organizations.getUsersByOrganization(id)
    .then((users) => res.status(200).json(users))
    .catch((err) => res.status(500).json({ error: err }));
});

//fetch teams in an organization

router.get("/:id/teams", (req, res) => {
  const { id } = req.params;
  Organizations.getTeamsByOrganization(id)
    .then((teams) => res.status(200).json(teams))
    .catch((err) => res.status(500).json({ error: err }));
});
module.exports = router;
