const express = require("express");
const app = express();
const rateLimit = require('express-rate-limit')
const Farm = require("./sync.js");
let eventLoop;
let responseCache = {};

const checkingLimit = rateLimit({
    windowMs: 60000,
    max: 62,
    statusCode: 200,
    message: {
        status: 400,
        error: 'Please try again in 1 minute.'
    }
});

const dataLimit = rateLimit({
    windowMs: 60000,
    max: 5,
    statusCode: 200,
    message: {
        status: 400,
        error: 'Please try again in 1 minute.'
    }
})

app.use((req, res, next) => {
    res.append('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    res.append('X-Content-Type-Options', 'nosniff');
    res.append('X-Frame-Options', 'DENY');
    res.append('X-XSS-Protection', '1; mode=block');

    next();
});

app.use(express.static("public"));

//Data Limit
app.use(express.json({ limit: "20kb" }));

app.post("/getGrades", dataLimit, async(req, res) => {
    if (responseCache[req.body.user] == "Loading") {
        res.json({
            status: 400,
            data: 'Request in progress.'
        });
        return;
    }
    let data = req.body;
    let response = { status: 400, data: "Incorrectly formatted Request." };
    if (data.user && data.pass) {
        responseCache[data.user] = "Loading";
        res.json({ status: 200, data: "Started Getting Grades" })
        response = await eventLoop.run(data.user, data.pass);
    }
    responseCache[data.user] = { pass: data.pass, grades: response };
});

app.post("/fetchGrades", checkingLimit, async(req, res) => {
    let data = req.body;
    if (data.user && data.pass) {
        if (responseCache[data.user] !== "Loading" && responseCache[data.user] != undefined && responseCache[data.user].pass === data.pass) {
            res.json(responseCache[data.user].grades);
            delete responseCache[data.user];
        } else if (responseCache[data.user]) {
            res.json({ status: 400, message: "Not Finished" });
        } else {
            res.json({ status: 400, message: "Never Started" });
        }
    }
});

app.get("/test", dataLimit, (req, res) => {
    res.json({ "message": "PASSED!" });
});

app.listen(process.env.PORT, () => {
    eventLoop = new Farm();
    console.log("Listening at http://localhost:3000");
});