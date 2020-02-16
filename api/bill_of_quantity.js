const db = require('../db')
const verifyToken = require('../auth/VerifyToken');

const express = require('express');
const bodyParser = require('body-parser');
const boqRouter = express.Router(mergeParams = true);

boqRouter.use(bodyParser.json()); // support json encoded bodies
boqRouter.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// A Project object represents each project that TCorp services throughout its lifetime. 

// ENDPOINTS
// GET    /boqs                                               READ all BOQ objects 
// GET    /boqs/:tcorp_id                                     READ a BOQ object with project id 'tcorp_id'  
// POST   /boqs                                               CREATE a BOQ object                           //******** Now not use ********//
// PUT    /boqs/:tcorp_id                                     UPDATE a BOQ by 'tcorp_id'                    //******** Now not use ********//
// DELETE /boqs/:tcorp_id                                     DELETE a BOQ by 'tcorp_id'                    //******** Now not use ********//


// TODAY Jan 6 2020
// GET  /boqs/line_item/:tcorp_id
// POST /boqs/line_item/:tcorp_id
// PUT  /boqs/line_item/:tcorp_id/:product_id/product_id
// PUT  /boqs/line_item/:tcorp_id/:product_id/stock_qty
// PUT  /boqs/line_item/:tcorp_id/:product_id/po_number
// PUT  /boqs/line_item/:tcorp_id/:product_id/received_at
// PUT  /boqs/line_item/:tcorp_id/:product_id/status_order
// DELETE  /boqs/line_item/:tcorp_id/:product_id
// ========= END OF TODAY ============


// TODAY Jan 7 2020
// Delivery Location
// GET     /boqs/delivery_location/:tcorp_id  * ====== Not Used ====== *
// POST    /boqs/delivery_location
// PUT     /boqs/delivery_location/:delivery_location_id
// DELETE  /boqs/delivery_location/:delivery_location_id

// Item to Location
// GET     /boqs/item_to_location/:line_item_id  * ====== Not Used ====== *
// POST    /boqs/item_to_location
// PUT     /boqs/item_to_location/:line_item_id/:delivery_location_id/delivery_location_id
// DELETE  /boqs/item_to_location/:line_item_id/:delivery_location_id/delivery_location_id
// ========= END OF TODAY ============

// POST   /boqs/line_item                                     CREATE a item in BOQ object

// GET    /boqs/line_item/:tcorp_id/line_item/:product_id     READ a item in BOQ object with project id 'tcorp_id'
// PUT    /boqs/line_item/:tcorp_id/line_item/:product_id     UPDATE a item in BOQ by 'tcorp_id' and 'product_id'
// DELETE /boqs/line_item/:tcorp_id/line_item/:product_id     DELETE a item in BOQ by 'tcorp_id' and 'product_id'

// GET    /boqs/status_order                                  READ status order all

// GET /boqs
boqRouter.get('/', verifyToken, (req, res, next) => {
    // Not REQUIRED: 
    db.query(`
        SELECT * 
        FROM ((line_item
        INNER JOIN bill_of_quantity 
        ON line_item.bill_of_quantity_id = bill_of_quantity.id)
        INNER JOIN product 
        ON line_item.products_id = product.id); `, function (err, result, fields) {
        if (err) throw err;
        res.json(result);
    });
});

// GET /boqs/:tcorp_id  
boqRouter.get('/:tcorp_id', verifyToken, (req, res, next) => {
    var tcorpID = req.params.tcorp_id;
    db.query(`
    SELECT 
        bill_of_quantity.id
    FROM bill_of_quantity
    INNER JOIN project 
    ON project.id=bill_of_quantity.project_id
    WHERE
        tcorp_id = '${tcorpID}'; `, function (err, result, fields) {
            if (err) throw err;
            res.json(result);
        });
});

// Donut
// GET /boqs/line_item/:tcorp_id 
boqRouter.get('/line_item/:tcorp_id', verifyToken, (req, res, next) => {
    // Not REQUIRED: 
    //   tcorp_id (Unique)
    // Must Add PO 7 Jan 2019

    var projectID = req.params.tcorp_id;
    db.query(`
        SELECT 
        l.id AS delivery_location_id,
            l.name AS delivery_location_name,
            il.qty AS qty,
            i.id AS line_item_id,
            i.stock_qty AS line_item_stock_qty,
            i.received_at AS line_item_received_at,
            i.po_number AS line_item_po_name,
            boq.id AS boq_id,
            boq.name AS boq_name,
            boq.update_at AS boq_update_at,
            boq.deadline_at AS boq_deadline,
            p.id AS project_id,
            p.tcorp_id AS project_tcorp_id,
            s.id AS status_order_id,
            s.description AS status_order_description,
            pd.id AS product_id,
            pd.tcorp_id AS product_tcorp_id,
            pd.description AS product_description,
            pd.price AS product_price,
            pd.picture_path AS product_picture_path,
            pd.supplier_id AS product_supplier_id,
            sp.company_name AS supplier_name,
            pc.name AS product_category_name
        FROM item_to_location il
        INNER JOIN delivery_location l ON il.delivery_location_id=l.id
        RIGHT OUTER JOIN line_item i ON il.line_item_id=i.id
        INNER JOIN bill_of_quantity boq ON i.bill_of_quantity_id=boq.id
        INNER JOIN project p ON boq.project_id=p.id
        INNER JOIN status_order s ON i.status_orders_id=s.id
        INNER JOIN product pd ON i.products_id=pd.id
        INNER JOIN supplier sp ON pd.supplier_id=sp.id
        INNER JOIN product_category pc ON pd.product_category_id=pc.id
        WHERE p.tcorp_id='${projectID}'
        ORDER BY line_item_id ASC, l.id ASC`, function (err, result, fields) {
        if (err) throw err;
            db.query(`
                SELECT p.tcorp_id, dl.id, dl.name FROM delivery_location dl 
                INNER JOIN bill_of_quantity boq ON dl.bill_of_quantity_id=boq.id
                INNER JOIN project p ON  p.id=boq.project_id WHERE p.tcorp_id='${projectID}'
                ORDER BY dl.id ASC`, function (err, result_unique_location, fields) {
                    if (err) throw err;
                    res.json({
                        "unique_location": result_unique_location,
                        "row_product": result,
                    });
                });
        // res.json(result);
    });
});

// POST /boqs/line_item/:tcorp_id
// Add Product in BOQ
// Donut
boqRouter.post('/line_item/:tcorp_id', verifyToken, function (req, res) {
    var projectID = req.params.tcorp_id;
    var lineItem = req.body;
    var addListProductOrLocation = lineItem.delivery_location_id;
    delete lineItem.delivery_location_id

    db.query(`INSERT INTO line_item (bill_of_quantity_id,${Object.keys(lineItem).join()}) 
                VALUES ((SELECT boq.id FROM bill_of_quantity boq INNER JOIN project p ON p.id=boq.project_id WHERE p.tcorp_id='${projectID}'),"${Object.values(lineItem).join('","')}")`, function(err, result, fields) {
        if (err) throw err;
        var lineItemIDofProduct_ID = result.insertId;
        if (addListProductOrLocation.length !== 0) {
            // Add Collabation between Product with Location in BOQ
            var sql = "INSERT INTO item_to_location (delivery_location_id, line_item_id, qty) VALUES ?";
            var values = []
            addListProductOrLocation.forEach(function(location_id) { 
                values.push([location_id, lineItemIDofProduct_ID, 0]); 
            })
            db.query(sql, [values], function(err,result,fields){
                if (err) throw err;
                result.line_item_id = lineItemIDofProduct_ID;
                res.json(result);
            });
        }
        else {
            result.line_item_id = lineItemIDofProduct_ID;
            res.json(result);
        }    
    });
});


// PUT  /boqs/line_item/:tcorp_id/:product_id/product_id
boqRouter.put('/line_item/:tcorp_id/:product_id/product_id', verifyToken, function (req, res) {
    var projectID = req.params.tcorp_id;
    var productID = req.params.product_id;
    var newProductID = req.body.product_id;
    db.query(`UPDATE line_item SET products_id=${newProductID} WHERE bill_of_quantity_id=(SELECT boq.id FROM bill_of_quantity boq INNER JOIN project p ON p.id=boq.project_id WHERE p.tcorp_id='${projectID}') AND products_id=${productID}`, function(err,result,fields){
        if (err) throw err;
        res.json(result);
    });

});

// PUT  /boqs/line_item/:tcorp_id/:product_id/stock_qty
boqRouter.put('/line_item/:tcorp_id/:product_id/stock_qty', verifyToken, function (req, res) {
    var projectID = req.params.tcorp_id;
    var productID = req.params.product_id;
    var newStockQTY = req.body.stock_qty;
    db.query(`UPDATE line_item SET stock_qty=${newStockQTY} WHERE bill_of_quantity_id=(SELECT boq.id FROM bill_of_quantity boq INNER JOIN project p ON p.id=boq.project_id WHERE p.tcorp_id='${projectID}') AND products_id=${productID}`, function(err,result,fields){
        if (err) throw err;
        res.json(result);
    });
});


// PUT  /boqs/line_item/:tcorp_id/:product_id/po_number
boqRouter.put('/line_item/:tcorp_id/:product_id/po_number', verifyToken, function (req, res) {
    var projectID = req.params.tcorp_id;
    var productID = req.params.product_id;
    var newPONumber = req.body.po_number;
    db.query(`UPDATE line_item SET po_number='${newPONumber}' WHERE bill_of_quantity_id=(SELECT boq.id FROM bill_of_quantity boq INNER JOIN project p ON p.id=boq.project_id WHERE p.tcorp_id='${projectID}') AND products_id=${productID}`, function(err,result,fields){
        if (err) throw err;
        res.json(result);
    });
});


// PUT  /boqs/line_item/:tcorp_id/:product_id/received_at
boqRouter.put('/line_item/:tcorp_id/:product_id/received_at', verifyToken, function (req, res) {
    var projectID = req.params.tcorp_id;
    var productID = req.params.product_id;
    var newReceivedAt = req.body.received_at;
    db.query(`UPDATE line_item SET received_at='${newReceivedAt}' WHERE bill_of_quantity_id=(SELECT boq.id FROM bill_of_quantity boq INNER JOIN project p ON p.id=boq.project_id WHERE p.tcorp_id='${projectID}') AND products_id=${productID}`, function(err,result,fields){
        if (err) throw err;
        res.json(result);
    });
});

// PUT  /boqs/line_item/:tcorp_id/:product_id/status_order
boqRouter.put('/line_item/:tcorp_id/:product_id/status_order', verifyToken, function (req, res) {
    var projectID = req.params.tcorp_id;
    var productID = req.params.product_id;
    var newStatusOrderID = req.body.status_order_id;
    db.query(`UPDATE line_item SET status_orders_id=${newStatusOrderID} WHERE bill_of_quantity_id=(SELECT boq.id FROM bill_of_quantity boq INNER JOIN project p ON p.id=boq.project_id WHERE p.tcorp_id='${projectID}') AND products_id=${productID}`, function(err,result,fields){
        if (err) throw err;
        res.json(result);
    });
});


// DELETE  /boqs/line_item/:tcorp_id/:product_id
// DELETE Row
boqRouter.delete('/line_item/:tcorp_id/:product_id', verifyToken, function (req, res) {
    var projectID = req.params.tcorp_id;
    var productID = req.params.product_id;
    db.query(`DELETE FROM  line_item WHERE bill_of_quantity_id=(SELECT boq.id FROM bill_of_quantity boq INNER JOIN project p ON p.id=boq.project_id WHERE p.tcorp_id='${projectID}') AND products_id=${productID}`, function(err,result,fields){
        if (err) throw err;
        res.json(result);
    });
});


// POST    /boqs/delivery_location
// Add Location in BOQ
// Donut
boqRouter.post('/delivery_location', verifyToken, function (req, res) {
    var locationName = req.body;
    var addListProductOrLocation = locationName.product_id;
    delete locationName.product_id;
    // console.log("..", locationName, addListProductOrLocation)
    db.query(`INSERT INTO delivery_location (${Object.keys(locationName).join()}) 
                VALUES ("${Object.values(locationName).join('","')}")`, function(err, result, fields) {
    if (err) throw err;
        var deliveryLocation_ID = result.insertId;
            
        if (addListProductOrLocation.length !== 0) {
            // Add Collabation between Product with Location in BOQ
            var sql = "INSERT INTO item_to_location (delivery_location_id, line_item_id, qty) VALUES ?";
            var values = []
            addListProductOrLocation.forEach(function(product_id) { 
                values.push([deliveryLocation_ID, product_id, 0]); 
            })
            // console.log(">>", sql, [values])
            db.query(sql, [values], function(err,result,fields){
                if (err) throw err;
                result.line_item_id = deliveryLocation_ID;
                res.json(result);
            });
        }
        else {
            result.line_item_id = deliveryLocation_ID;
            res.json(result);
        }
    });
});

// PUT     /boqs/delivery_location/:delivery_location_id
boqRouter.put('/delivery_location/:delivery_location_id', verifyToken, function (req, res) {
    var deliveryLocationID = req.params.delivery_location_id;
    var boqLineitemUpdateInfo = req.body;

    var update_set = Object.keys(boqLineitemUpdateInfo).map(value=>{
        return ` ${value}  = "${boqLineitemUpdateInfo[value]}"`;
    });
    sql = `UPDATE delivery_location SET ${update_set.join(" ,")} WHERE id=${deliveryLocationID}`
    db.query(sql, function(err,result,fields){
        if (err) throw err;
        res.json(result);
    });
});


// PUT    /boqs/item_to_location/:line_item_id/:delivery_location_id/delivery_location_id
boqRouter.put('/item_to_location/:line_item_id/:delivery_location_id/delivery_location_id', verifyToken, function (req, res) {
    var lineItemID = req.params.line_item_id;
    var deliveryLocationID = req.params.delivery_location_id;
    var boqLineitemUpdateInfo = req.body;
    var update_set = Object.keys(boqLineitemUpdateInfo).map(value=>{
        return ` ${value}  = "${boqLineitemUpdateInfo[value]}"`;
    });
    console.log("lineItemID", lineItemID, "deliveryLocationID", deliveryLocationID, update_set)
    sql = `UPDATE item_to_location SET ${update_set.join(" ,")} WHERE line_item_id=${lineItemID} AND delivery_location_id=${deliveryLocationID}`
    db.query(sql, function(err,result,fields){
        if (err) throw err;
        res.json(result);
    });
});


// DELETE  /boqs/delivery_location/:delivery_location_id
boqRouter.delete('/delivery_location/:delivery_location_id', verifyToken, function (req, res) {
    var deliveryLocationID = req.params.delivery_location_id;
    db.query(`DELETE FROM delivery_location WHERE id=${deliveryLocationID}`, function(err,result,fields){
        if (err) throw err;
        res.json(result);
    });
});

// Item to Location


// GET     /boqs/item_to_location/:line_item_id
boqRouter.get('/item_to_location/:line_item_id', verifyToken, function (req, res) {
    var lineItemID = req.params.line_item_id;
    db.query(`SELECT * FROM item_to_location WHERE line_item_id=${lineItemID}`, function(err,result,fields){
        if (err) throw err;
        console.log(result);
        res.json(result);
    });
});

// Insert Product Column
// POST    /boqs/item_to_location
boqRouter.post('/item_to_location', verifyToken, function (req, res) {
    var itemToLocation = req.body;
    var projectID = itemToLocation.tcorp_id;
    delete itemToLocation.tcorp_id;
    db.query(`INSERT INTO delivery_location (${Object.keys(itemToLocation).join()}) 
                VALUES ("${Object.values(itemToLocation).join('","')}")`, function(err, result, fields) {
    if (err) throw err;
        var deliveryLocationID = result.insertId;
        sql = `SELECT line_item.id FROM line_item WHERE bill_of_quantity_id=(SELECT boq.id FROM bill_of_quantity boq INNER JOIN project p ON p.id=boq.project_id WHERE p.tcorp_id='${projectID}')`;
        db.query(sql, function(err, result_line_item, fields) {
        if (err) throw err;
            result_line_item.map(function(line_item, index){
                sql = `INSERT INTO item_to_location (line_item_id, delivery_location_id, qty) 
                        VALUES (${line_item.id}, ${deliveryLocationID}, 0)`
                db.query(sql, function(err, result) {
                if (err) throw err;
                    if (result_line_item.length-1 === index) {
                        res.json({
                            "delivery_location_id": deliveryLocationID
                        });
                    }
                });
            });
        });
    });
});

// Donut
// DELETE  /boqs/item_to_location/:line_item_id/:delivery_location_id/delivery_location_id
// DELETE Column by location
boqRouter.delete('/item_to_location/:delivery_location_id/delivery_location_id', verifyToken, function (req, res) {
    // var lineItemID = req.params.line_item_id;
    var deliveryLocationID = req.params.delivery_location_id;
    db.query(`DELETE FROM item_to_location WHERE delivery_location_id=${deliveryLocationID}`, function(err,result,fields){
        if (err) throw err;
        db.query(`DELETE FROM delivery_location WHERE id=${deliveryLocationID}`, function(err,result,fields){
            if (err) throw err;
            res.json(result);
        });
        
        
    });
});





// // PLOI MUN. I DONT CARE BELOW
// // POST /boqs/line_item     
// boqRouter.post('/line_item', verifyToken, function (req, res) {
//     // REQUIRED: 
//     var lineItem = req.body;
//     // console.log("req.body", req.body);
//     db.query(`INSERT INTO line_item (${Object.keys(lineItem).join()}) 
//                         VALUES ?`, [[Object.values(lineItem)]], function(err, result, fields) {
//     if (err) throw err;
//         res.json({ 
//             id: result.insertId
//         });
//     });
// })

// // GET    /boqs/line_item/:tcorp_id/line_item/:product_id
// boqRouter.get('/line_item/:tcorp_id/line_item/:products_id', verifyToken, (req, res, next) => {
//     // Not REQUIRED: 
//     //   tcorp_id (Unique)

//     var projectID = req.params.tcorp_id;
//     var productID = req.params.products_id;
//     db.query(`
//         SELECT 
//             product.name,
//             product.description,
//             line_item.products_id,
//             line_item.bill_of_quantity_id,
//             line_item.products_id,
//             line_item.qty,
//             line_item.stock_qty,
//             line_item.purchase_orders_id,
//             line_item.received_at,
//             line_item.status_orders_id,
//             bill_of_quantity.deadline_at,
//             status_order.id AS status_order_id,
//             status_order.status,
//             purchase_order.id AS purchase_order_id,
//             purchase_order.po_number
//         FROM (((((line_item
//         LEFT JOIN product 
//         ON line_item.products_id = product.id)
//         LEFT JOIN bill_of_quantity 
//         ON line_item.bill_of_quantity_id = bill_of_quantity.id)
//         LEFT JOIN status_order 
//         ON line_item.status_orders_id = status_order.id)
//         LEFT JOIN purchase_order 
//         ON line_item.purchase_orders_id = purchase_order.id)
//         LEFT JOIN project 
//         ON bill_of_quantity.project_id = project.id)
//         WHERE
//             tcorp_id = '${projectID}' AND products_id = '${productID}';  `, function (err, result, fields) {
//         if (err) throw err;
//         res.json(result);
//     });
// });

// // PUT    /boqs/line_item/:tcorp_id/line_item/:products_id
// boqRouter.put('/line_item/:tcorp_id/line_item/:products_id', verifyToken, function (req, res) {
//     // REQUIRED: 

//     var projectID = req.params.tcorp_id;
//     var productID = req.params.products_id;
//     var projectUpdateInfo = req.body;

//     // console.log("req.params.tcorp_id", req.params.tcorp_id);
//     // console.log("req.params.products_id", req.params.products_id);
//     // console.log("req.body", req.body);
//     var update_set = Object.keys(projectUpdateInfo).map(value=>{
//         return ` ${value}  = ${projectUpdateInfo[value]}`;
//     });
//     // console.log("update_set", update_set)

//     sql = `UPDATE line_item SET ${update_set.join(" ,")} WHERE bill_of_quantity_id = (SELECT id FROM bill_of_quantity WHERE project_id = (SELECT id FROM project WHERE tcorp_id = "${projectID}")) AND products_id = "${productID}";`
//     // console.log("SQL" , sql)
//     db.query(sql, function (err, result) {
//     if (err) throw err;
//         res.json({
//             tcorp_id: projectID,
//             product_id: productID,
//             updateInfo: projectUpdateInfo
//         });
//     });
// })

// // DELETE /boqs/line_item/:tcorp_id/line_item/:product_id
// boqRouter.delete('/line_item/:tcorp_id/line_item/:products_id', verifyToken, function (req, res) {
//     var projectID = req.params.tcorp_id;
//     var productID = req.params.products_id;
//     db.query(`DELETE FROM line_item WHERE bill_of_quantity_id = (SELECT id FROM bill_of_quantity WHERE project_id = (SELECT id FROM project WHERE tcorp_id = "${projectID}")) AND products_id = ${productID};`, function (err, result) {
//         if (err) throw err;
// 	    res.json({result});
//     });
// })

// // GET    /boqs/status_order   
// // boqRouter.get('/status_order', verifyToken, (req, res, next) => {
// //     // Not REQUIRED: 
// //     db.query(`SELECT *
// //                 FROM status_order; `, function (err, result, fields) {
// //         if (err) throw err;
// //         res.json(result);
// //     });
// // });

module.exports = boqRouter;
