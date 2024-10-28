const http = require("http");
const fs = require("fs");
const path = require("path");
const port = 3000;
var connection = require("./database");

const server = http.createServer(function (req, res) {
  if (req.url.startsWith("/images/")) {
    // Serve static files (images, CSS, JS)
    const filePath = path.join(__dirname, req.url);
    const extname = path.extname(filePath);
    let contentType = "text/plain";

    // Set the correct content type for different file extensions
    switch (extname) {
      case ".png": // Add support for favicon
        contentType = "image/x-icon";
      case ".html":
        contentType = "text/html";
        break;
      case ".js":
        contentType = "text/javascript";
        break;
      case ".css":
        contentType = "text/css";
        break;
      case ".png":
        contentType = "image/png";
        break;
      case ".jpg":
      case ".jpeg":
        contentType = "image/jpeg";
        break;
      case ".gif":
        contentType = "image/gif";
        break;
      default:
        contentType = "application/octet-stream";
    }

    // Read and serve the static file
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/html" });
        res.write("<h1>404 Not Found</h1>");
        res.end();
      } else {
        res.writeHead(200, { "Content-Type": contentType });
        res.write(data);
        res.end();
      }
    });
  } else if (req.url === "/") {
    // Serve the home.html file
    const filePath = path.join(__dirname, "home", "home.html");
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/html" });
        res.write("<h1>404 Not Found</h1>");
        res.end();
      } else {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.write(data);
        res.end();
      }
    });
  } else {
    res.writeHead(404, { "Content-Type": "text/html" });
    res.write("<h1>404 Not Found</h1>");
    res.end();
  }
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);

  connection.connect(function (err) {
    if (err) {
      console.error("Error connecting to the database:", err.stack);
      return;
    }
    console.log("Database connected as id " + connection.threadId);
  });
});
