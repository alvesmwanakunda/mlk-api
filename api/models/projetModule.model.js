(function(){
    "use strict";

    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;

    var projetmodulesSchema = new Schema({

        module:{
            type:Schema.ObjectId,
            ref:"Modules",
            required:false
         },
         projet:{
            type:Schema.ObjectId,
            ref:"Projets",
            required:false
         },
        dateLastUpdate: {
            type: Date,
            required: true
        },
    });
    module.exports = {
      ProjetModulesSchema: projetmodulesSchema,
      ProjetModulesModel: mongoose.model("ProjetModules",projetmodulesSchema)
    }
})();