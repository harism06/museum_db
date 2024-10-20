var mysql = require("mysql");

var connection = mysql.createConnection({
    host: 'museumdb.mysql.database.azure.com',
    database: 'museumdb',
    user: 'user',
    password: 'password12345',
})

module.exports = connection;