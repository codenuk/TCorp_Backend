var jwt = require('jsonwebtoken');
var secret = require('./secret.js');

function verifyToken(req, res, next) {
  var token = req.headers['x-access-token'];
  if (!token)  return res.status(403).send({ auth: false, message: 'No token provided.' });
    
  jwt.verify(token, secret.secret, function(err, decoded) {
      if (err)  return res.status(500).send({ auth: false, message: `Failed to authenticate token. ${err.name}: ${err.message}`});
      
    // if everything good, save to request for use in other routes
    req.userId = decoded.id;
    req.username = decoded.username;
    next();
  });
}

module.exports = verifyToken;
