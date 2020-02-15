const express = require("express");

const Teams = require("../teams/teamModel.js");

const router = express.Router();

const { validateTeamId, validateTeamData, validateMembership } = require("../middleware/middleware");
const { isTeamLead } = require("../utils/utils");

// 1. Fetch all teams
router.get("/", (req, res) => {
	Teams.find()
		.then((teams) => res.status(200).json(teams))
		.catch((err) => res.status(500).json({ message: "Could not get teams.", error: err }));
});

// 2. Fetch team by id
router.get("/:id", validateTeamId, (req, res) => {
	res.status(200).json(req.team);
});

// 3. Fetch users in a team
router.get("/:id/users", validateTeamId, (req, res) => {
	const { id } = req.params;

	Teams.getUsersByTeamId(id)
		.then((users) => res.status(200).json(users))
		.catch((err) => res.status(500).json({ message: "Could not get users for this team", error: err }));
});

// 4. Fetch prompts created by a team
router.get("/:id/prompts", validateTeamId, (req, res) => {
	const { id } = req.params;

	Teams.getPromptsByTeamId(id)
		.then((prompts) => res.status(200).json(prompts))
		.catch((err) => res.status(500).json({ message: "Could not get prompts for this team", error: err }));
});

// 5. Fetch team videos nested in prompt array
router.get("/:id/videos", validateTeamId, async (req, res) => {
	const { id } = req.params;

	const prompts = await Teams.getPromptsByTeamId(id);
	const videos = await Teams.getVideosByTeamId(id);
	const results = prompts.map((prompt) => {
		return {
			...prompt,
			videos: videos.filter((video) => prompt.id === video.prompt_id),
		};
	});
	if (results) {
		res.status(200).json(results);
	}
});

// 6. Add a new team prompt
router.post("/:id/prompts", validateTeamId, validateMembership, (req, res) => {
	const { body } = req;
	const { id } = req.params;

	const promptdata = {
		...body,
		team_id: id,
	};

	if (isTeamLead(req.user.role)) {
		if (!body.question || !body.description) {
			res.status(400).json({ message: "Bad question or description." });
		} else {
			Teams.insertPrompt(promptdata)
				.then((prompt) => {
					res.status(201).json(prompt);
				})
				.catch((err) => res.status(500).json({ message: "Could not create prompt.", err: err }));
		}
	} else {
		res.status(403).json({ message: "Permission denied." });
	}
});

// 7. Add a new team
router.post("/", validateTeamData, (req, res) => {
	const { body } = req;

	Teams.insert(body)
		.then((team) => {
			// after creating team it adds the team creator to the team with team_manager role
			Teams.insertUser({ user_id: req.user.id, role_id: 2, team_id: team[0].id }).then((result) =>
				res.status(201).json(team[0])
			);
		})
		.catch((err) => res.status(500).json({ message: "Could not create team." }));
});

// 8. Add a user to a team
router.post("/:id/users", validateTeamId, (req, res) => {
	const { id } = req.params;
	const body = { ...req.body, team_id: id };

	if (body.team_id && body.user_id && body.role_id) {
		Teams.insertUser(body)
			.then((count) => {
				if (count.rowCount === 1) {
					res.status(201).json(count);
				}
			})
			.catch((err) => {
				res.status(500).json({ message: "Could not add user to team", error: err });
			});
	} else {
		res.status(400).json({ message: "Must have team_id, user_id, and role_id" });
	}
});

// 9. Delete a user from a team
router.delete("/:id/users/:user_id", validateTeamId, (req, res) => {
	const teamId = req.params.id;
	const userId = req.params.user_id;

	if (userId) {
		Teams.remove(userId, teamId)
			.then((count) => {
				if (count > 0) {
					res.status(200).json({ count: count, message: "User has been removed successfully." });
				} else {
					res.status(404).json({ count: count, message: "User not found in team." });
				}
			})
			.catch((err) => res.status(500).json({ message: "Could not create team." }));
	}
});

// 10. Update team info
router.put("/:id", validateTeamId, (req, res) => {
	const updates = { ...req.body, updated_at: new Date(Date.now()).toISOString() };
	const { id } = req.params;

	if (updates.name || updates.description) {
		Teams.update(id, updates)
			.then((count) => {
				if (count > 0) {
					res.status(200).json(count);
				} else {
					res.status(404).json({ message: "That team id is not available for update." });
				}
			})
			.catch((err) => res.status(500).json({ message: "Could not update team information", error: err }));
	} else {
		res.status(400).json({ message: "Must have a team name or description to update." });
	}
});

// XYZ. Update a user's team role
router.put("/:id/users/:user_id/role", validateTeamId, (req, res) => {
	const teamId = req.params.id;
	const userId = req.params.user_id;
	const { role_id } = req.body;

	if (!role_id) {
		res.status(400).json({ message: "Missing role id." })
	} else if (role_id !== 1 && role_id !== 2) {
		res.status(406).json({ message: "Unable to accept role id, must be 1 or 2." })
	} else {
		Teams.switchRole(teamId, userId, role_id)
			.then((updatedRole) => res.status(200).json({ message: "Successfully updated user role.", updatedRole }))
			.catch((err) => res.status(500).json({ message: "Could not get user.", error: err }));
	}
});

module.exports = router;
