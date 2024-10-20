var mysql = require("mysql");

var connection = mysql.createConnection({
    host: 'museumdb.mysql.database.azure.com',
    database: 'museumDB',
    user: 'user',
    password: 'password12345',
})