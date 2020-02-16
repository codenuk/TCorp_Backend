var express = require('express');
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');

var secret = require('./secret.js');
var authRouter = express.Router();
authRouter.use(bodyParser.urlencoded({ extended: false }));
authRouter.use(bodyParser.json());
var verifyToken = require('./VerifyToken');

var db = require('../db.js');
// console.log("...", db)

// https://www.freecodecamp.org/news/securing-node-js-restful-apis-with-json-web-tokens-9f811a92bb52/
//
//
//
// POST /api/auth/register
// GET  /api/auth/:id              Returns the user if exists, returns null if not (need to change to not found!)


function findUserByID(userID, employee_id=false){
  // Finds the user by user ID/Employee ID exists in the database of Table 'User'
  // Returns a Promise of the result
  return new Promise(function(resolve, reject){
    db.query(`SELECT id,employee_id, username, email, firstname, lastname, is_approved, active, role_id FROM user
            WHERE ${employee_id ? 'employee_id' : 'id'}=${userID}`, function (err, result, fields){
         if (err) reject(err);
         //console.log(result);
         
         resolve(result[0]); // If empty, result will be [], and result[0] will be undefined
    });
  });
} 
function findUserByUsername(username){
  // Finds the user by username exists in the database of Table 'User'
  // Returns a Promise of the result
  return new Promise(function(resolve, reject){
    db.query(`SELECT * FROM user
            WHERE username=${username}`, function (err, result, fields){
         if (err) reject(err);
         //console.log(result);
         resolve(result[0]); // If empty, result will be [], and result[0] will be undefined
    });
  });
} 
function findUserByEmail(email){
  // Finds the user by email exists in the database of Table 'User'
  // Returns a Promise of the result
  return new Promise(function(resolve, reject){
    db.query(`SELECT * FROM user
            WHERE email=${email}`, function (err, result, fields){
         if (err) reject(err);
         //console.log(result);
         resolve(result[0]); // If empty, result will be [], and result[0] will be undefined
    });
  });
} 
function findUserByX(field, query){
  // Finds the user by field X exists in the database of Table 'User'
  // Returns a Promise of the result
  // console.log(">>> findUserByX", db);
  return new Promise(function(resolve, reject){
    console.log("result");
    db.query(`SELECT * FROM user
            WHERE ${field}='${query}'`, function (err, result, fields){
         if (err) reject(err);
         console.log("result", result);
         console.log("field", field);
         console.log("query", query);
         resolve(result[0]); // If empty, result will be [], and result[0] will be undefined
    });
  });
} 




function registerUser(obj, callback){
   callback(null, {_id: "123asd"});
}

// GET api/auth/:id
authRouter.get('/users/:id', function(req, res) {
  console.log("I AM IN ID");
  findUserByID(req.params.id).then(function(userData) {
      res.json(userData);
  });
});

authRouter.post('/register', function(req, res, next) {
    // REQUIRED: 
    //   employee_id, username, password, email, firstname (+_th), lastname (+_th)
    // NON-REQUIRED:
    //   gender, address, birthdate, phone

    var userInfo = req.body;
    // Check if has REQUIRED property
    if (!(userInfo.hasOwnProperty('employee_id') && userInfo.hasOwnProperty('username') && userInfo.hasOwnProperty('password'))) throw new Error("User information doesn't have REQUIRED properties: employee_id/username/password");
    // Check if the employee_id is duplicate
    // ALSO NEED TO CHECK IF USERNAME and EMAIL duplicate!, but later
    findUserByID(userInfo.employee_id, employee_id=true).then(function(userData) {
        if (typeof userData !== 'undefined') throw new Error("Duplicate employee ID");

        bcrypt.hash(userInfo.password, 8).then(function (hashedPassword) { //auto-gen salt with 8 salt rounds
            delete userInfo['password']
            userInfo['password_hash'] = hashedPassword;
            // userInfo['id'] = 22; ///TEMPORARY
            userInfo['role_id'] = 1; //TEMPORARY
            db.query(`INSERT INTO user (${Object.keys(userInfo).join()}) 
                          VALUES ?`,  [[Object.values(userInfo)]], function(err, result, fields){
                if (err) throw err;
                //console.log(result);
                //console.log(result.insertId);
                //result has insertId (id of the user)
                var token = jwt.sign({ id: result.insertId , username: userInfo.username}, secret.secret, {
                  expiresIn: 86400 // expires in 24 hours
                });
                res.status(200).send({ auth: true, token: token });
            }); 
        }); 
    }).catch(next); //since it's a promise, maybe need to find a way to .then() remove afterwards if added

    /* THIS WAY IT WILL RETURN ERROR, but run the INSERT INTO FIRST
    var hashedPassword = bcrypt.hashSync(userInfo.password, 8); // auto-gen salt with 8 salt rounds
    delete userInfo['password']
    userInfo['password_hash'] = hashedPassword;
    userInfo['id'] = 22; ///TEMPORARY
    userInfo['role_id'] = 1; //TEMPORARY
    console.log(`INSERT INTO user (${Object.keys(userInfo).join()}) 
                     VALUES ('${Object.values(userInfo).join("','")}')`); 
    
    db.query(`INSERT INTO user (${Object.keys(userInfo).join()}) 
                  VALUES ('${Object.values(userInfo).join("','")}')`, function(err, result, fields){
             if (err) throw err;
             console.log(result);
    }); 

  registerUser({
    name : req.body.name,
    email : req.body.email,
    password : hashedPassword
  },
  function (err, user) {
    if (err) return res.status(500).send("There was a problem registering the user.")
    // create a token
    var token = jwt.sign({ id: user._id }, secret.secret, {
      expiresIn: 86400 // expires in 24 hours
    });
    //res.status(200).send({ auth: true, token: token });
  }); */
});

authRouter.get('/me', verifyToken, function(req, res, next) {    
	console.log(`I have this user id ${req.userId}`);
    res.status(200).send({'id': req.userId});
});

// POST /login
authRouter.post('/login', function(req, res, next) {
    // REQUIRED
    //   username|email, password
    var loginInfo = req.body; 
    // console.log("TEST ... #1")
    // db.disconnect_handler();
    // console.log(db)
    // console.log("TEST ... #2")
    // Check if has REQUIRED property (Check if NOT user,pass AND Not email,pass
    if (!(loginInfo.hasOwnProperty('username') && loginInfo.hasOwnProperty('password')) && !(loginInfo.hasOwnProperty('email') && loginInfo.hasOwnProperty('password'))) throw new Error("Login Credentials doesn't have REQUIRED properties: username|email, password");

    var field = loginInfo.hasOwnProperty('username') ? 'username' : 'email'; 
    var query = loginInfo.hasOwnProperty('username') ? loginInfo.username : loginInfo.email;
    findUserByX(field, query)
        .then(function(userData) {
            if (typeof userData === 'undefined') return res.status(404).send('No user found.'); 
            bcrypt.compare(loginInfo.password, userData.password_hash)
                .then(function(isCorrectPassword) {
//                    if(!isCorrectPassword) throw new Error("Wrong Password");
                    if(!isCorrectPassword) return res.status(401).json({ auth: false, token: null });

                    var token = jwt.sign({id: userData.id, username: userData.username}, secret.secret, {
                        expiresIn: 86400 // expires in 24 hours
                    });
                    res.status(200).json({ auth: true, token: token });
                });
        })
        .catch(function(err) {
            return res.status(500).send('Error on the server.');
        });
        //.catch(next);

});

// Disclaimer: The logout endpoint is not needed. The act of logging out can solely be done through the client side. A token is usually kept in a cookie or the browser’s localstorage. Logging out is as simple as destroying the token on the client. This /logout endpoint is created to logically depict what happens when you log out. The token gets set to null.


module.exports = authRouter;
