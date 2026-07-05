(function () {
    "use strict";

    var mongoose = require("mongoose");
    var Schema = mongoose.Schema;

    var notificationsTaskSchema = new Schema({
        proprieteTache: {
            type: Schema.ObjectId,
            ref: "Users",
            required: true
        },
        personneAssignee: {
            type: Schema.ObjectId,
            ref: "Users",
            required: true
        },
        date: {
            type: Date,
            default: Date.now
        },
        tache: {
            type: Schema.ObjectId,
            ref: "Taches",
            required: true
        },
        isLire: {
            type: Boolean,
            default: false
        }
    }, { timestamps: true });

    notificationsTaskSchema.index({ personneAssignee: 1, isLire: 1, date: -1 });
    notificationsTaskSchema.index({ tache: 1, personneAssignee: 1 });

    module.exports = {
        notificationsTaskSchema: notificationsTaskSchema,
        NotificationsTaskModel: mongoose.model("NotificationsTask", notificationsTaskSchema)
    };
})();
