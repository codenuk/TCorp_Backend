const db = require('../db')
const verifyToken = require('../auth/VerifyToken');

const express = require('express');
const bodyParser = require('body-parser');
const productCategoriesRouter = express.Router(mergeParams=true);

productCategoriesRouter.use(bodyParser.json()); // support json encoded bodies
productCategoriesRouter.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// ENDPOINTS
// GET     /product_categories                        READ all Product object
// POST    /product_categories                        CREATE a Product object
// PUT     /product_categories/:product_category_id   UPDATE a Product object
// DELETE  /product_categories/:product_category_id   DELETE a Product object

// GET /product_categories
productCategoriesRouter.get('/', verifyToken, (req, res, next) => {
    db.query(`
        SELECT
            *
        FROM
            product_category;`, function (err, result, fields) 
    {
    if (err) throw err;
	    res.json(result);
    });
});

productCategoriesRouter.get('/:product_category_id', verifyToken, (req, res, next) => {
    var productCategoriesID = req.params.product_category_id;
    db.query(`
        SELECT
            *
        FROM
            product_category
        WHERE
            id = "${productCategoriesID}";`, function (err, result, fields) 
    {
    if (err) throw err;
	    res.json(result);
    });
});

// POST /products
productCategoriesRouter.post('/', verifyToken, (req, res, next) => {
    var productCategoriesInfo = req.body;
    db.query(`INSERT INTO product_category (${Object.keys(productCategoriesInfo).join()}) 
                        VALUES ?`, [[Object.values(productCategoriesInfo)]], function(err, result, fields) {
    if (err) throw err;
        res.json(result);
    });
});

// PUT /products/:product_category_id   UPDATE a Product object
productCategoriesRouter.put('/:product_category_id', verifyToken, function (req, res) {
    // REQUIRED:
    var productCategoriesID = req.params.product_category_id;
    var productCategoriesInfo = req.body;

    var update_set = Object.keys(productCategoriesInfo).map(key=>{
        return ` ${key}  = "${productCategoriesInfo[key]}"`;
    });
    sql = `UPDATE product_category SET ${update_set.join(" ,")} WHERE id = ${productCategoriesID}`
    console.log(sql)

    db.query(sql, function (err, result) {
        if (err) throw err;
        res.json(result);
    });
});

// DELETE  /products/:product_category_id
productCategoriesRouter.delete('/:product_category_id', verifyToken, function (req, res) {
    var productCategoriesID = req.params.product_category_id;
    db.query(`DELETE FROM product_category WHERE id=${productCategoriesID}`, function (err, result) {
        if (err) throw err;
        res.json({
            productCategoriesID: productCategoriesID
        });
    });
});

module.exports = productCategoriesRouter;
