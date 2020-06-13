const axios = require("axios");
require("dotenv").config();

const validateOktaAccessToken = (req, res, next) => {
  const token = req.headers.authorization;
  axios
    .post(
      `https://dev-292346.okta.com/oauth2/default/v1/introspect?client_id=0oacbrrfntl0SndJM4x6&token=${token}&token_type_hint=access_token`
    )
    .then((response) => {
      console.log("response", response.data);
      response.data.active
        ? next()
        : res.status(401).json({ message: "unauthorized user" });
    })
    .catch((err) => {
      res.status(500).json({ error: err });
      console.log("error", err);
    });
};

module.exports = validateOktaAccessToken;
