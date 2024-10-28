var mysql = require("mysql2");

var pool = mysql.createPool({
  host: "museumdb.mysql.database.azure.com",
  database: "museumdb",
  user: "user",
  password: "password12345",
});

module.exports = pool;
