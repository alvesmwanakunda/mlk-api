(function () {
  "use strict";

  var mongoose = require("mongoose");
  var Schema = mongoose.Schema;

  var planProjetFichierSchema = new Schema({
    nom: {
      type: String,
      required: true,
    },
    chemin: {
      type: String,
      required: false,
    },
    sharepointItemId: {
      type: String,
      required: false,
    },
    extension: {
      type: String,
      required: true,
    },
    profondeur: {
      type: Number,
      required: true,
    },
    size: {
      type: Number,
      required: false,
    },
    date: {
      type: Date,
      required: true,
    },
    dateLastUpdate: {
      type: Date,
      required: true,
    },
    dossierParent: {
      type: Schema.ObjectId,
      ref: "PlanProjetDossiers",
      required: false,
    },
    creator: {
      type: Schema.ObjectId,
      ref: "Users",
      required: true,
    },
    projet: {
      type: Schema.ObjectId,
      ref: "Projets",
      required: true,
    },
  });

  module.exports = {
    PlanProjetFichierSchema: planProjetFichierSchema,
    PlanProjetFichierModel: mongoose.model(
      "PlanProjetFichiers",
      planProjetFichierSchema
    ),
  };
})();
