var io = require('socket.io')();
var mongodb = require('mongodb');

var dbclient = mongodb.MongoClient;
var dburl = 'mogodb://localhost:27017/sschat';

var clients = {};

io.on('connection', function(socket){
    var pub_key = undefined;

    socket.on('register', function(data){
        // data = {'pub_key': '......'}
        if('pub_key' in data && data['pub_key'] !== undefined){
            if(pub_key in clients){
                socket.emit('info', 'Already registered.');
            }else{
                pub_key = data['pub_key'];
                clients[pub_key] = socket.id;
                socket.emit('info', 'Correctly registered.');
            }
        }else{
            socket.emit('info', 'Data malformed. Not registered.');
        }
    });

    socket.on('disconnect', function(data){
        delete clients[pub_key];
    });
});
io.listen(3000);

console.log("Socket started at localhost:3000");
