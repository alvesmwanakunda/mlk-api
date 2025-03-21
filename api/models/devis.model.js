(function(){
    "use strict";

    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;
    var DevisProduit = require('../models/devisProduits.model').DevisProduitsModel;

    var devisSchema = new Schema({

        numero: {
            type: String,
            required: false
        },
        total:{
            type: Number,
            required: false
        },
        projet: {
            type: Schema.ObjectId,
            ref: 'Projets',
            required: false
        },
        entreprise: {
          type: Schema.ObjectId,
          ref: 'Entreprises',
          required: false
        },
        dateLastUpdate: {
            type: Date,
            required: true
        },
        isFacture:{
          type:Boolean,
          default:false,
          required:false
        },
        signature:{
          type:String,
          required:false
        },
        isPrestation:{
          type:Boolean,
          default:false,
          required:false
        },
    });
    devisSchema.pre('remove', async function (next) {
        try {
          const devisProduits = await DevisProduit.find({
            devis: this._id
          });
      
          if (devisProduits && devisProduits.length > 0) {
            await Promise.all(devisProduits.map(async (doc) => {
              await doc.remove();
            }));
          }
      
          next();
        } catch (err) {
          next(err);
        }
    });
    module.exports = {
        DevisSchema: devisSchema,
        DevisModel: mongoose.model("Devis",devisSchema)
    }
})();