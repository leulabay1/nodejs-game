dotenv = require("dotenv");
dotenv.config();

const config = {
  env: process.env.NODE_ENV,
  secretKey: process.env.SECRET_KEY,
  PORT: process.env.PORT,
  baseUrl: process.env.BASE_URL
};

module.exports = config;