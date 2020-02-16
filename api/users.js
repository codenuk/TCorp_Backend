const db = require('../db')
const verifyToken = require('../auth/VerifyToken');

const express = require('express');
const bodyParser = require('body-parser');
const userRouter = express.Router(mergeParams=true);

userRouter.use(bodyParser.json()); // support json encoded bodies
userRouter.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// ENDPOINTS
// GET  /users             READ all User objects
// GET  /users/:username   READ all User objects
// POST /users             CREATE a User objects (auth/AuthController.js)
// PUT  /users/:username   UPDATE a User objects
// GET  /users/role        READ all Role objects

// GET /users/role
userRouter.get('/role', verifyToken, (req, res, next) => {
    // Not REQUIRED: 
    db.query(`
        SELECT
            *
        FROM
            role;`, function (err, result, fields) 
    {
    if (err) throw err;
	    res.json(result);
    });
});

// GET /users
userRouter.get('/', (req, res, next) => {
    // Not REQUIRED: 
    db.query(`
        SELECT
            *,
            user.id
        FROM
            user
        INNER JOIN
            role ON user.role_id = role.id;`, function (err, result, fields) 
    {
    if (err) throw err;
	    res.json(result);
    });
});

// GET /users/:username
userRouter.get('/:username', verifyToken, (req, res, next) => {
    // Not REQUIRED: 
    var username = req.params.username;
    console.log("username", username)
    db.query(`
        SELECT
            *
        FROM
            user
        INNER JOIN
            role ON user.role_id = role.id
        WHERE 
            username='${username}';`, function (err, result, fields) 
    {
    if (err) throw err;
        console.log(">>>>>> GET username")
	    res.json(result);
    });
});


// PUT /users/:username
userRouter.put('/:username', (req, res, next) => {
    // REQUIRED
    //  username

    // Not REQUIRED: 
    //  employee_id, password_hash, email, firstname(_th), lastname(_th), gender, address, birthdate, phone, created_id, update_id, is_approved, active, path_img, role_id
    var userID = req.params.username;
    var userInfo = req.body;
    console.log("userInfo", userInfo)
    var update_set = Object.keys(userInfo).map(value=>{
        return ` ${value}  = "${userInfo[value]}"`;
    });

    sql = `UPDATE user SET ${update_set.join(" ,")} WHERE username = '${userID}'`
    db.query(sql, function (err, result) {
    if (err) throw err;
        res.json({
            username: userID,
            userInfo: userInfo
        });
    });
});




module.exports = userRouter;
