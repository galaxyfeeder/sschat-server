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
            if(pub_key in clients && pub_key === undefined){
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

    socket.on('message', function(data){
        // data = {'message': '...', 'to': '...'}
        if(pub_key !== undefined){
            if(data.to in clients){

            }else{
                
            }
        }else{
            socket.emit('info', 'Not registered. You should register first.');
        }
    });

    socket.on('add contact', function(data){
        // data = {'pub_key': '...', 'name': '...'}
        if(pub_key !== undefined){

        }else{
            socket.emit('info', 'Not registered. You should register first.');
        }
    });

    socket.on('remove contact', function(data){
        // data = {'pub_key': '...'}
        if(pub_key !== undefined){

        }else{
            socket.emit('info', 'Not registered. You should register first.');
        }
    });

    socket.on('edit contact', function(data){
        // data = {'pub_key': '...', 'name': '....'}
        if(pub_key !== undefined){

        }else{
            socket.emit('info', 'Not registered. You should register first.');
        }
    });

    socket.on('get contacts', function(data){
        if(pub_key !== undefined){

        }else{
            socket.emit('info', 'Not registered. You should register first.');
        }
    });

    socket.on('disconnect', function(data){
        if(pub_key in clients && pub_key !== undefined){
            delete clients[pub_key];
        }
    });
});
io.listen(3000);

console.log("Socket started at localhost:3000");
