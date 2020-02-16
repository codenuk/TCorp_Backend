const db = require('../db')
const verifyToken = require('../auth/VerifyToken');

const express = require('express');
const bodyParser = require('body-parser');
const moment = require('moment');
const logBoqsRouter = express.Router(mergeParams = true);

logBoqsRouter.use(bodyParser.json()); // support json encoded bodies
logBoqsRouter.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// ENDPOINTS
// GET    /log_boqs/:line_item_id
// POST   /log_boqs

// GET /log_boqs/:line_item_id
logBoqsRouter.get('/:line_item_id', verifyToken, (req, res, next) => {
    var lineItemID = req.params.line_item_id;
    db.query(`
        SELECT * FROM audit_line_item WHERE line_item_id=${lineItemID}; `, function (err, result, fields) {
        if (err) throw err;
            res.json(result);
    });
});

// POST /log_boqs
logBoqsRouter.post('/', verifyToken, function (req, res) {
    var newItem = req.body;
    var dateNow = moment().utcOffset('+0700').format('YYYY-MM-DD HH:mm:ss');
    newItem['timestamp'] = dateNow;

    db.query(`INSERT INTO audit_line_item (${Object.keys(newItem).join()}) 
                VALUES ?`, [[Object.values(newItem)]], function(err, result) {
    if (err) throw err;
        res.json(result);
    });
});



module.exports = logBoqsRouter;
