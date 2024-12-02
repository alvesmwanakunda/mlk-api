(function(){

    "use strict";

    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;

    var modulesDescriptionSchema = new Schema({

        module:{
            type:Schema.ObjectId,
            ref:"Modules",
            required:false
         },

        description: {
            type: String,
            required: false
        },
    });
    module.exports = {
        ModulesDescriptionSchema: modulesDescriptionSchema,
        ModulesDescriptionModel: mongoose.model("ModulesDescriptions",modulesDescriptionSchema)
      }
})();