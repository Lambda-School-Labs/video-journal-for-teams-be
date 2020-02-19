const request = require("supertest");

const server = require("../api/server");

const db = require("../database/dbConfig");

//Clear and seed testing database
beforeAll(async () => {
	await db.seed.run();
});

//Close worker connection thread
afterAll(async () => {
	await db.destroy();
});

describe("Team Invitation Routes", () => {
	describe("Authenticated routes", () => {
		let token;

		// log in as Curr Ladley to get a token for all tests
		beforeAll(() => {
			return request(server)
				.post("/api/auth/login/username")
				.send({
					username: "fwilloughley0",
					password: "4OTUUVDkYT",
				})
				.then((res) => {
					token = res.body.token;
				});
		});

		describe("GET /invitation/:code", () => {
			it("without a :code should return status code 404", async () => {
				const response = await request(server)
					.get("/api/invites")
					.set("authorization", token);
				expect(response.status).toEqual(404);
			});

			it("POST status 200 success should RETURN an object", async () => {
				const response = await request(server)
					.post("/api/invites/20")
					.send({ "team_name": "Borer, Nienow and Kunde" })
					.set("authorization", token);
				expect(response.status).toEqual(200);
				expect(typeof response.body).toBe("object");
			});

			it("POST should not accept an incomplete or incorrect request object", async () => {
				const response = await request(server)
					.post("/api/invites/20")
					.send({ "team_id": 4 })
					.set("authorization", token);
				expect(response.status).toEqual(400);
				expect(response.body.message).toBe("Request needs to be an object with team_id and team_name elements.");
			});

			it("POST should not accept request from a regular team member, must be team lead only", async () => {
				const response = await request(server)
					.post("/api/invites/2")
					.send({ "team_name": "Huels and Sons" })
					.set("authorization", token);
				expect(response.status).toEqual(403);
				expect(response.body.message).toBe("Permission denied.");
			});
		})
	})
})
