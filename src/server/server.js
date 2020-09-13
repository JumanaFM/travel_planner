var path = require("path");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

let projectData = [];

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("dist"));

function addEntry(entry) {
    projectData.push(entry);
}

app.get("/", function(req, res) {
    res.sendFile(path.resolve("dist/index.html"));
});

app.get("/entry", function(req, res) {
    res.send(projectData);
});

app.post("/entry", function(req, res) {
    addEntry(req.body)
    res.send(req.body);
});

app.listen(8081, function() {
    console.log("app listening on port 8081!");
});

module.exports = { addEntry }