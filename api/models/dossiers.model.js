(function () {
    "use strict";
  
    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;
    var Fichier = require('./fichiers.model').FichierModel;
    //const Log = require('../../logs/logs.model').LogModel;
  
    var dossierSchema = new Schema({
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
    });


    dossierSchema.pre('deleteOne',{ document: true }, async function (next) {
      console.log("remove",this._id);
      try {
          await Fichier.deleteMany({ dossierParent: this._id });

          mongoose.model('Dossiers', dossierSchema).find({
            dossierParent: this._id
          }, function (err, resp) {
            if (resp) {
              resp.forEach(dos => {
                dos.remove();
              });
            }
          });
  
          next();
      } catch (error) {
          console.log(error);
          next(error);
      }
    });
  
  
    dossierSchema.pre('update', function (next) {
      let Dossier = mongoose.model('Dossiers', dossierSchema);
      Dossier.findOne({
        _id: this._conditions._id
      }, (error, old) => {
        global.oldDoc = old;
      })
      next()
    })
    
    module.exports = {
      DossierSchema: dossierSchema,
      DossierModel: mongoose.model('Dossiers', dossierSchema)
    }
  
  
  })();