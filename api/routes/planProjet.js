(function () {
  "use strict";

  module.exports = function (app, acl) {
    var Ctrl = require("../controller/planProjet.controller")(acl);
    var uploadPlan = require("../../middlewares/uploadPlan");

    app.get("/plan/projet/upload/:uploadId", Ctrl.getUploadStatus);

    app.get(
      "/plan/projet/dossier/:dossierId([a-fA-F\\d]{24})",
      Ctrl.readDossier
    );

    app.put(
      "/plan/projet/dossier/:dossierId([a-fA-F\\d]{24})",
      Ctrl.updateDossier
    );

    app.delete(
      "/plan/projet/dossier/:dossierId([a-fA-F\\d]{24})",
      Ctrl.deleteDossier
    );

    app.delete(
      "/plan/projet/fichier/:fichierId([a-fA-F\\d]{24})",
      Ctrl.deleteFichier
    );

    app.post(
      "/plan/projet/dossier/:projetId([a-fA-F\\d]{24})",
      Ctrl.createDossier
    );

    app.get("/plan/projet/:projetId([a-fA-F\\d]{24})", Ctrl.list);

    app.post(
      "/plan/projet/:projetId([a-fA-F\\d]{24})",
      uploadPlan.array("uploadfile", 5),
      Ctrl.create
    );
  };
})();
