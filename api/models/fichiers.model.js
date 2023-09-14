(function () {
    "use strict";
  
    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;
  
    var fichierSchema = new Schema({
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
      profondeur: {
        type: Number,
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
        ref: 'Projects',
        required: false
      },
  
    });
   
    module.exports = {
      FichierSchema: fichierSchema,
      FichierModel: mongoose.model('Fichiers', fichierSchema)
    }
  })();