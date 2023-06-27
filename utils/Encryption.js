var crypto = require('crypto');
var config = require('../config');
var iv = Buffer.from(Array.prototype.map.call(Buffer.alloc(16),()=>{
    return Math.floor(Math.random()*256)
}));
var key = Buffer.concat([Buffer.from(config.password)],Buffer.alloc(32).length);
var encrypt = function(text){
    var cipher = crypto.createCipheriv(config.algorithm,key,iv);
    var crypted = cipher.update(text,'utf8','hex');
    crypted += cipher.final('hex');
    return crypted
};
exports.encrypt = encrypt;
var decrypt = function(text){
    var decipher = crypto.createDecipheriv(config.algorithm,key,iv);
    try {
        var dec = decipher.update(text,'hex','utf8');
        dec += decipher.final('utf8');
        return dec;
    } catch (error) {
        return false;
    }
};
exports.decrypt = decrypt;
