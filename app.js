const PORT = 4000;

const api = require('./api/api.js');
const authController = require('./auth/AuthController.js')
const express = require('express');
const app = express();

// Set up CORS Middleware and logging
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, x-access-token, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD");
    console.log(req.method, req.originalUrl);
    next();
});

app.get("/", (req, res) => res.send("Welcome to vanilla web application! Development is currently in progress :)\n\nPlease wait a while! >_>"));

app.use('/api/v1', api);
app.use('/api/auth', authController);

// set the app to listen on the port
app.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`);
});

