import io from 'socket.io';
import NodeRSA from 'node-rsa';
import db, {connect} from './database';

let ss = io();
let clients = {};

ss.on('connection', (socket) => {
    let pub_key = undefined;

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
        var json = JSON.parse(data);
        if(pub_key !== undefined){
            var message = {
                'message': json.message,
                'sender': pub_key,
                'to': json.to,
                'timestamp': new Date(),
                'encrypt': json.encrypt
            };
            db().collection('messages').insertOne(message, function(err, res){
                if(err) throw err;

                if(json.to in clients && json.to == json.encrypt){
                    socket.broadcast.to(clients[json.to]).emit('message', message);
                }
                if(json.encrypt == pub_key){
                    socket.emit('message', message);
                }
            });
        }else{
            socket.emit('info', 'Not registered. You should register first.');
        }
    });

    socket.on('get conversations', function(data){
        if(pub_key !== undefined){
                db().collection('contacts').find({'owner': pub_key}).toArray(function(err, res){
                    var conversations = {};
                    var count = 0;
                    if(err == null){
                        for(var contact of res){
                            (function(saved_contact){
                                db().collection('messages').find({$or: [{'sender': pub_key, 'to': saved_contact.pub_key, 'encrypt': pub_key},
                                                                      {'sender': saved_contact.pub_key, 'to': pub_key, 'encrypt': pub_key}]}).limit(50).toArray(function(err, resmes){
                                    if(err == null){
                                        conversations[saved_contact.pub_key] = resmes;
                                        ++count;
                                    }
                                    if(count == res.length){
                                        socket.emit('info', 'Conversations retrieved.');
                                        socket.emit('conversations', conversations);
                                    }
                                });
                            })(contact);
                        }
                    }
            });
        }
    });

    socket.on('add contact', function(data){
        // data = {'pub_key': '...', 'name': '...'}
        var json = JSON.parse(data);
        if(pub_key !== undefined && json.name !== undefined && json.pub_key !== undefined){
            var contact1 = {
                'name': json.name,
                'owner': pub_key,
                'pub_key': json.pub_key
            };
            var contact2 = {
                'name': 'undefined',
                'owner': json.pub_key,
                'pub_key': pub_key
            };
            db().collection('contacts').insertMany([contact1, contact2], function(err, res){
                if(err == null){
                    socket.emit('info', json.pub_key+' added correctly.');

                    // Resend full contact list
                    db().collection('contacts').find({'owner': pub_key}).toArray(function(err, res){
                        if(err == null){
                            socket.emit('contacts', res);
                        }else{
                            socket.emit('info', 'Contacts not edited correctly.');
                        }
                    });
                }else{
                    socket.emit('info', json.pub_key+' not added correctly.');
                }
            });
        }else{
            socket.emit('info', 'Not registered. You should register first.');
        }
    });

    socket.on('edit contact', function(data){
        // data = {'pub_key': '...', 'name': '....'}
        var json = JSON.parse(data);
        if(pub_key !== undefined){
            db().collection('contacts').updateOne({'owner': pub_key, 'pub_key': json.pub_key}, {$set: {'name': json.name}}, function(err, res){
                if(err == null){
                    socket.emit('info', data['pub_key']+' edited correctly.');
                    db().collection('contacts').find({'owner': pub_key}).toArray(function(err, res){
                        if(err == null){
                            socket.emit('contacts', res);
                        }
                    });
                }else{
                    socket.emit('info', data['pub_key']+' not edited correctly.');
                }
            });
        }else{
            socket.emit('info', 'Not registered. You should register first.');
        }
    });

    socket.on('get contacts', function(data){
        if(pub_key !== undefined){
            db().collection('contacts').find({'owner': pub_key}).toArray(function(err, res){
                if(err == null){
                    socket.emit('contacts', res);
                }
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

// connecting to mongodb and then starting socket server
connect(() => {
    ss.listen(4000);
});

console.log("Socket started at port 4000");
