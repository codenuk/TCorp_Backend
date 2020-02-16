const db = require('../db')
const verifyToken = require('../auth/VerifyToken');

const express = require('express');
const bodyParser = require('body-parser');
const taskStatusesRouter = express.Router(mergeParams=true);

taskStatusesRouter.use(bodyParser.json()); // support json encoded bodies
taskStatusesRouter.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// GET /users
taskStatusesRouter.get('/', verifyToken, (req, res, next) => {
    // Not REQUIRED: 
    db.query(`
        SELECT
            *
        FROM
            task_status;`, function (err, result, fields) 
    {
    if (err) throw err;
	    res.json(result);
    });
});

// GET    /boqs/status_order   
taskStatusesRouter.get('/status_order', verifyToken, (req, res, next) => {
    // Not REQUIRED: 
    db.query(`SELECT *
                FROM status_order; `, function (err, result, fields) {
        if (err) throw err;
        res.json(result);
    });
});

// GET    /boqs/list_location   
taskStatusesRouter.get('/list_location', verifyToken, (req, res, next) => {
    // Not REQUIRED: 
    db.query(`
        SELECT
            *
        FROM
            delivery_location;`, function (err, result, fields) 
    {
    if (err) throw err;
	    res.json(result);
    });
});

module.exports = taskStatusesRouter;
