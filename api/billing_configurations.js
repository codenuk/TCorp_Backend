const db = require('../db')
const verifyToken = require('../auth/VerifyToken');

const express = require('express');
const bodyParser = require('body-parser');
const billingConfigurationsRouter = express.Router(mergeParams=true);

billingConfigurationsRouter.use(bodyParser.json()); // support json encoded bodies
billingConfigurationsRouter.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// ENDPOINTS
//    GET /billing_configurations <---> billingConfigurations

// GET /billing_configurations
billingConfigurationsRouter.get('/', verifyToken, (req, res, next) => {
    db.query(`
        SELECT
            *
        FROM
            billing_configuration;`, function (err, result, fields) 
    {
    if (err) throw err;
	    res.json(result);
    });
});


module.exports = billingConfigurationsRouter;
