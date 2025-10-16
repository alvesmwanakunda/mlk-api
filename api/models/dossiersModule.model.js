(function () {
    "use strict";
  
    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;
  
    var dossierModuleSchema = new Schema({
      nom: {
        type: String,
        required: true
      },
      profondeur: {
        type: Number,
        required: true
      },
      date: {
        type: Date,
        required: true
      },
      dateLastUpdate: {
        type: Date,
        required: true
      },
      dossierParent: {
        type: Schema.ObjectId,
        ref: 'Dossiers',
        required: false
      },
      creator: {
        type: Schema.ObjectId,
        ref: 'Users',
        required: true
      },
      project: {
        type: Schema.ObjectId,
        ref: 'Projets',
        required: false
      },
      module: {
        type: Schema.ObjectId,
        ref: 'Modules',
        required: false
      },
      projetmodule: {
        type: Schema.ObjectId,
        ref: 'ProjetModules',
        required: false
      },
    });    
    module.exports = {
      DossierModuleSchema: dossierModuleSchema,
      DossierModuleModel: mongoose.model('DossiersModule', dossierModuleSchema)
    }
  })();