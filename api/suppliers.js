const db = require('../db')
const verifyToken = require('../auth/VerifyToken');

const express = require('express');
const bodyParser = require('body-parser');
const suppliersRouter = express.Router(mergeParams=true);

suppliersRouter.use(bodyParser.json()); // support json encoded bodies
suppliersRouter.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// ENDPOINTS
//    GET /suppliers <---> suppliers

// GET /suppliers
suppliersRouter.get('/', verifyToken, (req, res, next) => {
    db.query(`
        SELECT
            *
        FROM
            supplier;`, function (err, result, fields) 
    {
    if (err) throw err;
	    res.json(result);
    });
});


module.exports = suppliersRouter;
