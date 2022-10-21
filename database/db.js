const mongodb = require('mongodb');

const MongoClient=mongodb.MongoClient;
const mongodbURL=process.env.MONGODB_LINK;

let _db;

const initdb=callback=>{
if(_db){
    console.log('db is initialized');
    return callback(null,_db);
}
MongoClient.connect(mongodbURL)
.then(client=>{
    _db=client.db('Auverse');
    callback(null,_db)
})
.catch(err=>{
    callback(err);
})
};

const getdb=()=>{
if(!_db){
    throw Error('database not initialized')
}
return _db;
}

module.exports={
    initdb,
    getdb
}