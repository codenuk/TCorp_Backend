// Node js require returns the same instance of a module everytime! 
// https://stackoverflow.com/questions/30545749/how-to-provide-a-mysql-database-connection-in-single-file-in-nodejs/32064391
// Node docs: https://nodejs.org/docs/latest/api/modules.html#modules_caching
const mysql = require('mysql');

const HOST = "172.17.0.6";
const PORT = "3306";
const USER = "root";
const PASSWORD = "vanilla";
const DATABASE = "ERP_TCorp"

// Create a Connection Object
dbConfig = {
    host: HOST,
    port: PORT,
    user: USER,
    password: PASSWORD,
    database: DATABASE,
}




var db = mysql.createConnection (dbConfig);

// Connect to the Database, if not then throw error.
// db.connect((err) => {
//     if (err) throw err;
//     console.log('Connected to database\n' + 
//                         'Host: '+HOST+'\tPort: '+PORT+
//                         '\tUser: '+USER+'\tPass: '+PASSWORD+
//                         '\tUse Database: '+ DATABASE
//                 );
// });

/*function handleDisconnect() {
    console.log("setTimeout handleDisconnect")
    db.connect( function onConnect(err) {   // The server is either down
        if (err) {                                  // or restarting (takes a while sometimes).
            console.log('error when connecting to db:', err);
            setTimeout(handleDisconnect, 100000);    // We introduce a delay before attempting to reconnect,
        }                                           // to avoid a hot loop, and to allow our node script to
    });                                             // process asynchronous requests in the meantime.
                                                    // If you're also serving http, display a 503 error.
    db.on('error', function onError(err) {
        console.log('db error', err);
        if (err.code == 'PROTOCOL_CONNECTION_LOST') {   // Connection to the MySQL server is usually
            handleDisconnect();                         // lost due to either server restart, or a
        } else {                                        // connnection idle timeout (the wait_timeout
            throw err;                                  // server variable configures this)
        }
    });
}
handleDisconnect();*/

// this doesn't work... idk why
/*function handleDisconnect(db){
    db.on('error', function(err){
        if (!err.fatal){
            return;
        }
        if (err.code !== 'PROTOCOL_CONNECTION_LOST'){
            throw err;
        }
        console.log('Re-connecting lost connection: ' + err.stack);
        console.log(db.config);
        db = mysql.createConnection(db.config);
        console.log("i created connection!")
        handleDisconnect(db);
        db.connect();
        console.log("I connected!")
    }); 
}
handleDisconnect(db);*/

// This works but im not sure, it creates new connection everytime
//const db = mysql.createPool(dbConfig); //connectionLimit : 10 as default
// END

//module.exports = db;
//
//see https://stackoverflow.com/questions/17015590/node-js-mysql-needing-persistent-connection
const pool = mysql.createPool(dbConfig); //connectionLimit : 10 as default
module.exports = {
    query: function(){
        var sql_args = [];
        var args = [];
        for(var i=0; i<arguments.length; i++){
            args.push(arguments[i]);
        }
        var callback = args[args.length-1]; //last arg is callback
        pool.getConnection(function(err, connection) {
        if(err) {
                console.log(err);
                return callback(err);
            }
            if(args.length > 2){
                sql_args = args[1];
            }
        connection.query(args[0], sql_args, function(err, results) {
          connection.release(); // always put connection back in pool after last query
          if(err){
                    console.log(err);
                    return callback(err);
                }
          callback(null, results);
        });
      });
    }
};

// var mysql_config = {
//     host: HOST,
//     port: PORT,
//     user: USER,
//     password: PASSWORD,
//     database: DATABASE,
// };

// var db;
// function disconnect_handler() {
//     console.log("______");
//     db = mysql.createConnection(mysql_config);
//     db.connect(err => {
//          (err) && setTimeout('disconnect_handler()', 2000);
//     });
//     console.log('Connected to database\n' + 
//             'Host: '+HOST+'\tPort: '+PORT+
//             '\tUser: '+USER+'\tPass: '+PASSWORD+
//             '\tUse Database: '+ DATABASE
//     );

//     db.on('error', err => {
//         if (err.code === 'PROTOCOL_CONNECTION_LOST') {
//             disconnect_handler();
//         } else {
//             throw err;
//         }
//     });
//     console.log("TEST ... #db")
//     module.exports.conn = db;
//  }
 
// // disconnect_handler()
// // const getName = () => {
// //     return 'Jim';
// //   };
  
// module.exports.disconnect_handler = disconnect_handler;
