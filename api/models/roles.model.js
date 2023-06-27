(function(){
    "use strict";

    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;

    var rolesSchema = new Schema({
        roles:{
            type: String,
            unique: true,
            required: true
        },
        allows:[{
            resources:{
                type:String,
                required:true
            },
            permissions:[String]
        }],
        menus:[String]
    })
    module.exports=mongoose.model('Roles',rolesSchema);
})();