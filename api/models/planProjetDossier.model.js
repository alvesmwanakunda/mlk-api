(function () {
  "use strict";

  var mongoose = require("mongoose");
  var Schema = mongoose.Schema;

  var planProjetDossierSchema = new Schema({
    nom: {
      type: String,
      required: true,
    },
    profondeur: {
      type: Number,
      required: true,
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
    sharepointItemId: {
      type: String,
      required: false,
    },
  });

  module.exports = {
    PlanProjetDossierSchema: planProjetDossierSchema,
    PlanProjetDossierModel: mongoose.model(
      "PlanProjetDossiers",
      planProjetDossierSchema
    ),
  };
})();
