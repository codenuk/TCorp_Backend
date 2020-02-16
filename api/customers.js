const db = require('../db')
const verifyToken = require('../auth/VerifyToken');

const express = require('express');
const bodyParser = require('body-parser');
const customersRouter = express.Router(mergeParams=true);

customersRouter.use(bodyParser.json()); // support json encoded bodies
customersRouter.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// ENDPOINTS
//    GET /customers <---> customers

// GET /customers
customersRouter.get('/', verifyToken, (req, res, next) => {
    db.query(`
        SELECT
            *
        FROM
            customer;`, function (err, result, fields) 
    {
    if (err) throw err;
	    res.json(result);
    });
});


module.exports = customersRouter;
