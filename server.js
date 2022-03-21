const express = require("express");
const app = express();
const rateLimit = require('express-rate-limit')
const Farm = require("./sync.js");
let eventLoop;

const dataLimit = rateLimit({
    windowMs: 60000,
    max: 5,
    statusCode: 200,
    message: {
        status: 429,
        error: 'You are doing that too much. Please try again in 1 minute.'
    }
})

app.use(express.static("public"));

//Data Limit
app.use(express.json({ limit: "20kb" }));

app.post("/getGrades", dataLimit, async (req, res) => {
    let data = req.body;
    let response = { status: 400, data: "Incorrectly formatted Request." };
    if (data.user && data.pass) {
        response = await eventLoop.run(data.user, data.pass);
    }
    res.json(response);
});

app.get("/test", dataLimit, (req, res) => {
    res.json({ "message": "PASSED!" });
});

app.listen(process.env.PORT, () => {
    eventLoop = new Farm();
    console.log("Listening at http://localhost:3000");
});