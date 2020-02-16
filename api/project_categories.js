const db = require('../db')
const verifyToken = require('../auth/VerifyToken');

const express = require('express');
const bodyParser = require('body-parser');
const productCategoriesRouter = express.Router(mergeParams=true);

productCategoriesRouter.use(bodyParser.json()); // support json encoded bodies
productCategoriesRouter.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// ENDPOINTS
// GET     /product_categories           READ all Product object
// GET     /product_categories           READ all Product object
// POST    /products                     CREATE a Product object
// PUT     /products/:product_tcorp_id   UPDATE a Product object
// DELETE  /products/:product_tcorp_id   DELETE a Product object

// GET /product_categories
productCategoriesRouter.get('/', verifyToken, (req, res, next) => {
    db.query(`
        SELECT
            *
        FROM
            project_category;`, function (err, result, fields) 
    {
    if (err) throw err;
	    res.json(result);
    });
});


module.exports = productCategoriesRouter;
