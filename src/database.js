import {MongoClient} from 'mongodb';

const url = 'mongodb://localhost:27017/sschat';
let db = null;

function connect(callback){
    MongoClient.connect(url, (err, database) => {
        if (err) throw err;
        db = database;
        callback();
    });
}

export {connect};

function get(){
    if(!db) throw new Error('Call connect() first!');
    return db;
}

export default get;
