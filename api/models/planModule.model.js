(function(){
    "use strict";

    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;

    var planModuleSchema = new Schema({

        nom: {
            type: String,
            required: true
          },
          vignette: {
            type: String,
            required: false
          },
          chemin: {
            type: String,
            required: false
          },
          extension: {
            type: String,
            required: true
          },
          
          size: {
            type: Number,
            required: false
          },
          numeroPage: {
            type: Number,
            required: false
          },
          date: {
            type: Date,
            required: true
          },
          dateLastUpdate: {
            type: Date,
            required: true
          },
          creator: {
            type: Schema.ObjectId,
            ref: 'Users',
            required: true
          },
          module: {
            type: Schema.ObjectId,
            ref: 'Modules',
            required: false
          },
      

    });
    module.exports = {
        PlanModuleSchema: planModuleSchema,
        PlanModuleModel: mongoose.model('PlanModule', planModuleSchema)
    }
})();