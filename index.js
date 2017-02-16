var io = require('socket.io')();
var mongodb = require('mongodb');
var NodeRSA = require('node-rsa');

var dbclient = mongodb.MongoClient;
var dburl = 'mongodb://localhost:27017/sschat';

var clients = {};

io.on('connection', function(socket){
    var pub_key = undefined;

    socket.on('register', function(data){
        // data = {'pub_key': '......'}
        var json = JSON.parse(data);
        if(json['pub_key'] !== undefined){
            if(pub_key in clients && pub_key === undefined){
                socket.emit('info', 'Already registered.');
            }else{
                pub_key = json['pub_key'];
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
            var message = {
                'message': data['message'],
                'sender': pub_key,
                'to': data['to']
            };
            if(data.to in clients){
                message['sended'] = true;
                socket.broadcast.to(clients[data.to]).emit('message', message);
                MongoClient.connect(url, function(err, db) {
                    db.collection('messages').insertOne(message, function(err, res){});
                    db.close();
                });
            }else{
                message['sended'] = false;
                MongoClient.connect(url, function(err, db) {
                    db.collection('messages').insertOne(message, function(err, res){});
                    db.close();
                });
            }
        }else{
            socket.emit('info', 'Not registered. You should register first.');
        }
    });

    socket.on('add contact', function(data){
        // data = {'pub_key': '...', 'name': '...'}
        if(pub_key !== undefined){
            var contact = {
                'name': data['name'],
                'owner': pub_key,
                'pub_key': data['pub_key']
            };
            MongoClient.connect(url, function(err, db) {
                db.collection('contacts').insertOne(contact, function(err, res){
                    if(err == null){
                        socket.emit('info', data['pub_key']+' added correctly.');
                    }else{
                        socket.emit('info', data['pub_key']+' not added correctly.');
                    }
                });
                db.close();
            });
        }else{
            socket.emit('info', 'Not registered. You should register first.');
        }
    });

    socket.on('remove contact', function(data){
        // data = {'pub_key': '...'}
        if(pub_key !== undefined){
            MongoClient.connect(url, function(err, db) {
                db.collection('contacts').deleteOne({'owner': pub_key, 'pub_key': data['pub_key']}, function(err, res){
                    if(err == null){
                        socket.emit('info', data['pub_key']+' edited correctly.');
                    }else{
                        socket.emit('info', data['pub_key']+' not edited correctly.');
                    }
                });
                db.close();
            });
        }else{
            socket.emit('info', 'Not registered. You should register first.');
        }
    });

    socket.on('edit contact', function(data){
        // data = {'pub_key': '...', 'name': '....'}
        if(pub_key !== undefined){
            MongoClient.connect(url, function(err, db) {
                db.collection('contacts').updateOne({'owner': pub_key, 'pub_key': data['pub_key']}, {'name': data['name']}, function(err, res){
                    if(err == null){
                        socket.emit('info', data['pub_key']+' edited correctly.');
                    }else{
                        socket.emit('info', data['pub_key']+' not edited correctly.');
                    }
                });
                db.close();
            });
        }else{
            socket.emit('info', 'Not registered. You should register first.');
        }
    });

    socket.on('get contacts', function(data){
        if(pub_key !== undefined){
            MongoClient.connect(url, function(err, db) {
                db.collection('contacts').find({'owner': pub_key}).toArray(function(err, res){
                    if(err == null){
                        socket.emit('contacts', res);
                    }else{
                        socket.emit('info', 'Contacts not edited correctly.');
                    }
                });
                db.close();
            });
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
io.listen(4000);

console.log("Socket started at localhost:4000");
