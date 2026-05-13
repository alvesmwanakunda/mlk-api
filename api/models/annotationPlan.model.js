(function(){

    "use strict";

    var mongoose = require("mongoose");
    var Schema = mongoose.Schema;

     var annotationPlanSchema = new mongoose.Schema({

        plan: {
            type: Schema.ObjectId,
            ref: "PlanProjet",
            required: false
        },
        projet: {
            type: Schema.ObjectId,
            ref: "Projets",
            required: false
        },
        page: {type: Number},
        type: {
            type: String,
            required: false
        },
        x: {type: Number},
        y: {type: Number},
        x2: {type: Number},
        y2: {type: Number},
        points: [{ x: {type: Number}, y: {type: Number}}],
        text: {
            type: String,
            required: false
          },
        color: {
            type: String,
            required: false
          },
        fill: {
            type: String,
            required: false
          },
        strokeWidth: {type: Number},
        fontSize: {type: Number},
        createdBy: {
            type:Schema.ObjectId,
            ref:"Users",
            required:false
        },
        createdAt:  { type: Date, default: Date.now }
     });
      module.exports = {
        AnnotationPlanSchema: annotationPlanSchema,
        AnnotationPlanModel: mongoose.model('AnnotationPlan', annotationPlanSchema)
    }
})();