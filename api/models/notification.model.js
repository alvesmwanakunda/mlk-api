(function () {
  "use strict";

  var mongoose = require("mongoose");
  var Schema = mongoose.Schema;

  var notificationSchema = new Schema({
    user: {
      type: Schema.ObjectId,
      ref: "Users",
      required: false,
    },
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    originalTitle: {
      type: String,
      required: false,
    },
    originalBody: {
      type: String,
      required: false,
    },
    sourceLanguage: {
      type: String,
      default: "fr",
    },
    titleTranslations: {
      type: Map,
      of: String,
      default: {},
    },
    bodyTranslations: {
      type: Map,
      of: String,
      default: {},
    },
    translation: {
      provider: String,
      status: String,
      translatedAt: Date,
      baseLanguage: String,
      templateKey: String,
      error: String,
    },
    type: {
      type: String,
      required: false,
    },
    resource: {
      type: String,
      required: false,
    },
    resourceId: {
      type: String,
      required: false,
    },
    tacheId: {
      type: String,
      required: false,
    },
    agendaId: {
      type: String,
      required: false,
    },
    data: {
      type: Schema.Types.Mixed,
      required: false,
    },
    readAt: {
      type: Date,
      required: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  });

  module.exports = {
    notificationSchema: notificationSchema,
    NotificationModel: mongoose.model("Notifications", notificationSchema),
  };
})();
