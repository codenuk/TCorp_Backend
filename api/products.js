const db = require('../db')
const verifyToken = require('../auth/VerifyToken');

const express = require('express');
const bodyParser = require('body-parser');
const productRouter = express.Router(mergeParams = true);

productRouter.use(bodyParser.json()); // support json encoded bodies
productRouter.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// ENDPOINTS
// GET  /products               READ all Product objects
// POST /products               CREATE a Product object
//
// GET     /products/:product_tcorp_id   READ a Product object with product_id
// PUT     /products/:product_tcorp_id   UPDATE a Product object
// DELETE  /products/:product_tcorp_id   DELETE a Product object
// DELETE  /products/child_product_id/:product_tcorp_id   DELETE a Child Product object

// GET /products
productRouter.get('/', verifyToken, (req, res, next) => {
    // Not REQUIRED: 
    db.query(`
        SELECT 
			product.id,
			product.tcorp_id,
			product.description,
			product.price,
			product.picture_path,
			product.supplier_id,
			supplier.company_name AS supplier_name,
			product.product_category_id,
			product_category.name AS category_name
		FROM
			product
				INNER JOIN
			supplier ON supplier.id = product.supplier_id
				INNER JOIN
			product_category ON product_category.id = product.product_category_id`, function (err, result, fields) {
        if (err) throw err;
        res.json(result);
    });
});

// POST /products
productRouter.post('/', verifyToken, function (req, res) {
    // REQUIRED: 
    //   tcorp_id (Unique), name, supplier_id, category_id
    //   MUST: child_products: []  EMPTY if none!
    var productInfo = req.body;
    // console.log(productInfo);
    var childProducts = productInfo.child_products;
    delete productInfo.child_products;

    // console.log("after delete");
    // console.log(productInfo);
    // console.log(childProducts);
    db.query(`INSERT INTO product (${Object.keys(productInfo).join()}) 
                        VALUES ?`, [[Object.values(productInfo)]], function (err, result, fields) {
        if (err) throw err;
        var newProductID = result.insertId;
        if (childProducts !== undefined && childProducts.length !== 0) {
            var values = childProducts.map(function (child) {
                return ([newProductID, child.id, child.quantity]);
            });
            db.query(`INSERT INTO product_hierarchy (parent_product_id, child_product_id, quantity) 
                            VALUES ?`, [values], function (err, result, fields) {
                if (err) throw err;
                res.json(result);
            });
        } else {
            res.json(result);
        }
    });
});

// GET  /products/:product_tcorp_id
productRouter.get('/:product_tcorp_id', verifyToken, (req, res, next) => {
    // REQUIRED: 
    //  - product_tcorp_id
    var productID = req.params.product_tcorp_id;
    console.log("productID", productID)
    db.query(`
        SELECT 
			product.id,
			product.tcorp_id,
			product.description,
			product.price,
			product.picture_path,
			product.supplier_id,
			supplier.company_name AS supplier_name,
			product.product_category_id,
            product_category.name AS category_name,
            newp.id AS child_product_id,
            newp.tcorp_id AS child_product_tcorp_id,
            newp.description AS child_description,
            product_hierarchy.quantity
		FROM
			product
        INNER JOIN
			supplier ON supplier.id = product.supplier_id
        INNER JOIN
            product_category ON product_category.id = product.product_category_id
        LEFT JOIN
            product_hierarchy ON product_hierarchy.parent_product_id = product.id
        LEFT JOIN
            product newp ON newp.id = product_hierarchy.child_product_id
        WHERE
            product.tcorp_id = "${productID}"`, function (err, result, fields) {
        if (err) throw err;
        res.json(result);
    });
});

// PUT     /products/:product_tcorp_id   UPDATE a Product object
productRouter.put('/:product_tcorp_id', verifyToken, function (req, res) {
    // REQUIRED: 
    //   tcorp_id (Unique), name, supplier_id, category_id
    //   MUST: child_products: []  EMPTY if none!
    var productID = req.params.product_tcorp_id;
    var productUpdateInfo = req.body;
    // console.log("productUpdateInfo", productUpdateInfo)
    var childProducts = productUpdateInfo.child_products;
    delete productUpdateInfo.child_products;

    var update_set = Object.keys(productUpdateInfo).map(key => {
        // console.log("typeof productUpdateInfo[key]", typeof productUpdateInfo[key])
        if (typeof productUpdateInfo[key] === "number") {
            return ` ${key}  = ${productUpdateInfo[key]}`;
        }
        else {
            return ` ${key}  = "${productUpdateInfo[key]}"`;
        }

    });
    sql = `SELECT id FROM product WHERE tcorp_id = "${productID}"`
    db.query(sql, function (err, result) {
        if (err) throw err;
        var parentProductID = result[0].id;
        sql = `UPDATE product SET ${update_set.join(" ,")} WHERE id = "${parentProductID}"`
        db.query(sql, function (err, result) {
            if (err) throw err;
            if (childProducts !== undefined && childProducts.length !== 0) {
                // (1) DELETE all childs from product_hierarchy
                // (2) POST all childs into product_hierarchy
                db.query(`DELETE FROM product_hierarchy WHERE parent_product_id="${parentProductID}"`, function (err, result) {
                    if (err) throw err;
                    var values = childProducts.map(function (child) {
                        return ([parentProductID, child.id, child.quantity]);
                    });
                    db.query(`INSERT INTO product_hierarchy (parent_product_id, child_product_id, quantity) 
                                    VALUES ?`, [values], function (err, result, fields) {
                        if (err) throw err;
                        res.json(result);
                    });
                });
            } else {
                db.query(`DELETE FROM product_hierarchy WHERE parent_product_id="${parentProductID}"`, function (err, result) {
                    if (err) throw err;
                    res.json({
                        tcorp_id: productID,
                        updateInfo: productUpdateInfo
                    });
                });
            }
        });
    });
});

// [                                                                     
//     RowDataPacket {                                                         
//       parent_product_id: 9,                                                 
//       child_product_id: 1,                                                  
//       quantity: 1,                                                          
//       id: 1,                                                                
//       tcorp_id: 'H80Z4MABC',                                                
//       description: 'ETSI Service Shelf,48V/60V,4-Fan',                      
//       price: 2000,                                                          
//       picture_path: null,                                                   
//       supplier_id: 1,                                                       
//       product_category_id: 6                                                
//     }                                                                       
//   ]
// DELETE  /products/:product_tcorp_id   DELETE a Product object
productRouter.delete('/:product_tcorp_id', verifyToken, function (req, res) {
    var productID = req.params.product_tcorp_id;
    var sql = `SELECT * FROM product_hierarchy ph INNER JOIN product p ON ph.child_product_id=p.id WHERE ph.child_product_id=(SELECT p.id FROM product p WHERE p.tcorp_id="${productID}")`
    console.log("sql", sql)
    db.query(sql, function (err, getProducts, fields) {
    if (err) throw err;
        var chk = false;
        for (i = 0; i < getProducts.length; i++) {
            if (getProducts[i].tcorp_id === productID) {
                chk = true;
                break;
            }
        }
        if (!chk) {
            db.query(`DELETE FROM product WHERE tcorp_id="${productID}"`, function (err) {
            if (err) throw err;
                res.json({
                    tcorp_id: productID
                });
            });
        } else{
            res.json({
                status: "cannot delete"
            });
        }

    });
    
});

// DELETE  /products/child_product_id/:product_tcorp_id
productRouter.delete('/:parent_product_id/child_product_id/:child_product_id', verifyToken, function (req, res) {
    var parentProductID = req.params.parent_product_id;
    var childProductID = req.params.child_product_id;

    db.query(`
        DELETE FROM product_hierarchy WHERE parent_product_id="${parentProductID}" and child_product_id="${childProductID}"`, function (err, result) {
        if (err) throw err;
        res.json({
            parent_product_id: parentProductID,
            child_product_id: childProductID
        });
    });
});

// // GET /products/product_hierarchy/:product_id
// productRouter.get('/product_hierarchy/:product_id', verifyToken, (req, res, next) => {
//     // Not REQUIRED: 
//     var productID = req.params.product_id;
//     db.query(`
//     SELECT 
//         *
//     FROM
//         product_hierarchy
//     WHERE
//         product_hierarchy.child_product_id = ${productID}`, function (err, result, fields) {
//         if (err) throw err;
//         res.json(result);
//     });
// });

module.exports = productRouter;
