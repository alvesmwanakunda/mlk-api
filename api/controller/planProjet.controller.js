(function () {
  "use strict";

  var PlanFichier =
    require("../models/planProjetFichier.model").PlanProjetFichierModel;
  var PlanDossier =
    require("../models/planProjetDossier.model").PlanProjetDossierModel;
  var Projet = require("../models/projets.model").ProjetModel;
  var User = require("../models/users.model").UserModel;
  var planTaskService = require("../services/planTask.service");
  var sharepointService = require("../services/sharepoint.service");
  var planUploadJobService = require("../services/planUploadJob.service");
  var fs = require("fs");
  var path = require("path");

  async function loadProjet(projetId) {
    return Projet.findById(projetId);
  }

  async function assertAdmin(userId) {
    const user = await User.findById(userId).select("role");
    if (!user || user.role !== "admin") {
      const error = new Error("Action réservée aux administrateurs");
      error.statusCode = 403;
      throw error;
    }
    return user;
  }

  function cleanupMulterFile(file) {
    try {
      const localPath = path.isAbsolute(file.path)
        ? file.path
        : path.join(file.destination || "", file.filename);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    } catch (error) {
      console.error("Erreur suppression fichier temporaire:", error);
    }
  }

  async function processPlanFileUpload(jobId, context) {
    const {
      projetId,
      dossierParentId,
      profondeur,
      creatorId,
      file,
    } = context;

    console.log(
      `[PlanUpload][Job] Début job ${jobId}`,
      JSON.stringify({
        projetId: projetId?.toString?.() || projetId,
        dossierParentId: dossierParentId?.toString?.() || dossierParentId || null,
        fileName: file.originalname || file.filename,
        size: file.size,
      })
    );

    planUploadJobService.update(jobId, {
      progress: 0,
      status: "processing",
      phase: "sharepoint",
      fileName: file.originalname || file.filename,
    });

    try {
      const projet = await loadProjet(projetId);
      if (!projet) {
        throw new Error("Projet introuvable");
      }

      await sharepointService.ensureProjectPlansRootFolder(projet);

      const spFile = await sharepointService.uploadProjectPlanFile(
        projet,
        dossierParentId,
        file,
        function (progress) {
          planUploadJobService.update(jobId, {
            progress,
            status: "processing",
            phase: "sharepoint",
          });
        }
      );

      const originalName = file.originalname || file.filename;
      const storedName =
        spFile.name || sharepointService.buildPlanFileName(originalName);
      const parts = storedName.split(".");
      const extension =
        parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";

      const planFile = new PlanFichier({
        nom: storedName,
        chemin: spFile.webUrl || null,
        sharepointItemId: spFile.id,
        extension,
        size: file.size,
        profondeur,
        dossierParent: dossierParentId,
        projet: projet._id,
        creator: creatorId,
        date: new Date(),
        dateLastUpdate: new Date(),
        isPlan: false,
        isActif: false,
        classificationPending: true,
        validationStatus: "none",
      });

      const saved = await planFile.save();

      console.log(
        `[PlanUpload][Job] Succès job ${jobId}`,
        JSON.stringify({
          fichierId: saved._id?.toString?.() || saved._id,
          nom: saved.nom,
          sharepointItemId: saved.sharepointItemId,
        })
      );

      planUploadJobService.update(jobId, {
        progress: 100,
        status: "done",
        phase: "sharepoint",
        result: saved,
      });
    } catch (error) {
      console.error(
        `[PlanUpload][Job] Échec job ${jobId}`,
        error.message,
        error.graphError || ""
      );
      console.error(error);
      planUploadJobService.update(jobId, {
        status: "error",
        phase: "sharepoint",
        message: error.message || "Erreur lors de l'upload SharePoint",
      });
    } finally {
      console.log(`[PlanUpload][Job] Fin job ${jobId} — nettoyage fichier temporaire`);
      cleanupMulterFile(file);
    }
  }

  module.exports = function (acl) {
    return {
      listActivePlans: function (req, res) {
        acl.isAllowed(
          req.decoded.id,
          "box",
          "create",
          async function (err, aclres) {
            if (!aclres) {
              return res.status(401).json({ success: false, message: "401" });
            }

            try {
              const projet = await loadProjet(req.params.projetId);
              if (!projet) {
                return res.status(404).json({
                  success: false,
                  message: "Projet introuvable",
                });
              }

              const plans = await planTaskService.listActivePlansForProject(
                projet._id,
                { pdfOnly: true }
              );

              return res.json({
                success: true,
                message: plans,
              });
            } catch (error) {
              console.error(error);
              return res.status(500).json({
                success: false,
                message: error.message,
              });
            }
          }
        );
      },

      streamFichierContent: function (req, res) {
        acl.isAllowed(
          req.decoded.id,
          "box",
          "create",
          async function (err, aclres) {
            if (!aclres) {
              return res.status(401).json({ success: false, message: "401" });
            }

            try {
              const fichier = await PlanFichier.findById(req.params.fichierId);
              if (!fichier) {
                return res.status(404).json({
                  success: false,
                  message: "Fichier introuvable",
                });
              }

              if (!sharepointService.isStoredSharePointItemValid(fichier.sharepointItemId)) {
                return res.status(400).json({
                  success: false,
                  message: "Ce fichier n'est pas disponible sur SharePoint",
                });
              }

              const { data, contentType } =
                await sharepointService.downloadDriveItemContent(
                  fichier.sharepointItemId
                );

              res.setHeader("Content-Type", contentType);
              res.setHeader(
                "Content-Disposition",
                `inline; filename="${encodeURIComponent(fichier.nom || "plan.pdf")}"`
              );
              res.setHeader("Cache-Control", "private, max-age=300");
              return res.send(data);
            } catch (error) {
              console.error(error);
              const statusCode = error.statusCode || 500;
              return res.status(statusCode).json({
                success: false,
                message: error.message,
              });
            }
          }
        );
      },

      list: function (req, res) {
        acl.isAllowed(
          req.decoded.id,
          "box",
          "create",
          async function (err, aclres) {
            if (!aclres) {
              return res.status(401).json({ success: false, message: "401" });
            }

            try {
              const projet = await loadProjet(req.params.projetId);
              if (!projet) {
                return res.status(404).json({
                  success: false,
                  message: "Projet introuvable",
                });
              }

              const dossiers = await PlanDossier.find({
                profondeur: 0,
                projet: projet._id,
              }).populate("creator");

              const fichiers = await PlanFichier.find({
                profondeur: 0,
                projet: projet._id,
              })
                .populate("creator")
                .populate("validatedBy", "nom prenom");

              return res.json({
                success: true,
                message: {
                  dossiers,
                  fichiers,
                },
              });
            } catch (error) {
              console.error(error);
              return res.status(500).json({
                success: false,
                message: error.message,
              });
            }
          }
        );
      },

      readDossier: function (req, res) {
        acl.isAllowed(
          req.decoded.id,
          "box",
          "create",
          async function (err, aclres) {
            if (!aclres) {
              return res.status(401).json({ success: false, message: "401" });
            }

            try {
              const dossier = await PlanDossier.findOne({
                _id: req.params.dossierId,
              });

              if (!dossier) {
                return res.status(404).json({
                  success: false,
                  message: "404",
                });
              }

              const dossiers = await PlanDossier.find({
                dossierParent: dossier._id,
              })
                .populate("creator")
                .populate("dossierParent");

              const fichiers = await PlanFichier.find({
                dossierParent: dossier._id,
              })
                .populate("creator")
                .populate("validatedBy", "nom prenom")
                .populate("dossierParent");

              return res.json({
                success: true,
                message: {
                  dossier,
                  dossiers,
                  fichiers,
                },
              });
            } catch (error) {
              return res.status(500).json({
                success: false,
                message: error.message,
              });
            }
          }
        );
      },

      createDossier: function (req, res) {
        acl.isAllowed(
          req.decoded.id,
          "box",
          "create",
          async function (err, aclres) {
            if (!aclres) {
              return res.status(401).json({ success: false, message: "401" });
            }

            try {
              const projet = await loadProjet(req.params.projetId);
              if (!projet) {
                return res.status(404).json({
                  success: false,
                  message: "Projet introuvable",
                });
              }

              if (!req.body.nom) {
                return res.status(400).json({
                  success: false,
                  message: "Le nom du dossier est requis",
                });
              }

              let profondeur = 0;
              let dossierParentId = req.body.dossierParent || null;

              if (dossierParentId) {
                const parent = await PlanDossier.findOne({
                  _id: dossierParentId,
                  projet: projet._id,
                });
                if (!parent) {
                  return res.status(404).json({
                    success: false,
                    message: "Dossier parent introuvable",
                  });
                }
                profondeur = parent.profondeur + 1;
              }

              await sharepointService.ensureProjectPlansRootFolder(projet);
              const spFolder = await sharepointService.createProjectSubFolder(
                projet,
                req.body.nom,
                dossierParentId
              );

              const dossier = new PlanDossier({
                nom: req.body.nom,
                profondeur,
                dossierParent: dossierParentId,
                projet: projet._id,
                creator: req.decoded.id,
                date: new Date(),
                dateLastUpdate: new Date(),
                sharepointItemId: spFolder.id,
              });

              const saved = await dossier.save();

              return res.json({
                success: true,
                message: saved,
              });
            } catch (error) {
              console.error(error);
              return res.status(500).json({
                success: false,
                message: error.message,
              });
            }
          }
        );
      },

      create: function (req, res) {
        acl.isAllowed(
          req.decoded.id,
          "box",
          "create",
          async function (err, aclres) {
            if (!aclres) {
              return res.status(401).json({ success: false, message: "401" });
            }

            try {
              const projet = await loadProjet(req.params.projetId);
              if (!projet) {
                return res.status(404).json({
                  success: false,
                  message: "Projet introuvable",
                });
              }

              const files = req.files;
              if (!files || files.length === 0) {
                return res.status(400).json({
                  success: false,
                  message: "Aucun fichier n'a été téléchargé.",
                });
              }

              let profondeur = 0;
              const dossierParentId = req.body.dossierParent || null;

              if (dossierParentId) {
                const parent = await PlanDossier.findOne({
                  _id: dossierParentId,
                  projet: projet._id,
                });
                if (!parent) {
                  return res.status(404).json({
                    success: false,
                    message: "Dossier parent introuvable",
                  });
                }
                profondeur = parent.profondeur + 1;
              }

              await sharepointService.ensureProjectPlansRootFolder(projet);

              const jobs = [];
              for (const file of files) {
                if (file.size > sharepointService.MAX_PLAN_FILE_SIZE) {
                  return res.status(400).json({
                    success: false,
                    message:
                      "Fichier trop volumineux (maximum 3 Go par fichier plan).",
                  });
                }

                const uploadId = planUploadJobService.create({
                  fileName: file.originalname || file.filename,
                });

                jobs.push({
                  uploadId,
                  fileName: file.originalname || file.filename,
                  status: "processing",
                  phase: "sharepoint",
                });

                setImmediate(function () {
                  console.log(
                    `[PlanUpload][Job] Job ${uploadId} planifié en arrière-plan`,
                    JSON.stringify({
                      fileName: file.originalname || file.filename,
                      size: file.size,
                      projetId: projet._id?.toString?.() || projet._id,
                    })
                  );
                  processPlanFileUpload(uploadId, {
                    projetId: projet._id,
                    dossierParentId,
                    profondeur,
                    creatorId: req.decoded.id,
                    file,
                  });
                });
              }

              return res.json({
                success: true,
                message: jobs,
              });
            } catch (error) {
              console.error(error);
              return res.status(500).json({
                success: false,
                message: error.message,
              });
            }
          }
        );
      },

      getUploadStatus: function (req, res) {
        acl.isAllowed(
          req.decoded.id,
          "box",
          "create",
          function (err, aclres) {
            if (!aclres) {
              return res.status(401).json({ success: false, message: "401" });
            }

            const job = planUploadJobService.get(req.params.uploadId);
            if (!job) {
              return res.status(404).json({
                success: false,
                message: "Upload introuvable ou expiré",
              });
            }

            return res.json({
              success: true,
              message: {
                uploadId: job.id,
                progress: job.progress,
                status: job.status,
                phase: job.phase,
                fileName: job.fileName,
                error: job.message,
                result: job.result,
              },
            });
          }
        );
      },

      updateDossier: function (req, res) {
        acl.isAllowed(
          req.decoded.id,
          "box",
          "update",
          async function (err, aclres) {
            if (!aclres) {
              return res.status(401).json({ success: false, message: "401" });
            }

            try {
              const dossier = await sharepointService.renameProjectPlanFolder(
                req.params.dossierId,
                req.body.nom
              );

              return res.json({
                success: true,
                message: dossier,
              });
            } catch (error) {
              console.error(error);
              return res.status(500).json({
                success: false,
                message: error.message,
              });
            }
          }
        );
      },

      deleteDossier: function (req, res) {
        acl.isAllowed(
          req.decoded.id,
          "box",
          "delete",
          async function (err, aclres) {
            if (!aclres) {
              return res.status(401).json({ success: false, message: "401" });
            }

            try {
              await sharepointService.deleteProjectPlanDossier(
                req.params.dossierId
              );

              return res.json({
                success: true,
                message: "Dossier supprimé",
              });
            } catch (error) {
              console.error(error);
              return res.status(500).json({
                success: false,
                message: error.message,
              });
            }
          }
        );
      },

      deleteFichier: function (req, res) {
        acl.isAllowed(
          req.decoded.id,
          "box",
          "delete",
          async function (err, aclres) {
            if (!aclres) {
              return res.status(401).json({ success: false, message: "401" });
            }

            try {
              await sharepointService.deleteProjectPlanFile(
                req.params.fichierId
              );

              return res.json({
                success: true,
                message: "Fichier supprimé",
              });
            } catch (error) {
              console.error(error);
              return res.status(500).json({
                success: false,
                message: error.message,
              });
            }
          }
        );
      },

      classifyFichier: function (req, res) {
        acl.isAllowed(
          req.decoded.id,
          "box",
          "create",
          async function (err, aclres) {
            if (!aclres) {
              return res.status(401).json({ success: false, message: "401" });
            }

            try {
              if (typeof req.body.isPlan !== "boolean") {
                return res.status(400).json({
                  success: false,
                  message: "Le champ isPlan (boolean) est requis",
                });
              }

              const fichier = await PlanFichier.findById(req.params.fichierId);
              if (!fichier) {
                return res.status(404).json({
                  success: false,
                  message: "Fichier introuvable",
                });
              }

              if (fichier.creator.toString() !== req.decoded.id.toString()) {
                return res.status(403).json({
                  success: false,
                  message:
                    "Seul l'utilisateur ayant uploadé ce fichier peut le classifier",
                });
              }

              if (!fichier.classificationPending) {
                return res.status(400).json({
                  success: false,
                  message: "Ce fichier a déjà été classifié",
                });
              }

              fichier.isPlan = req.body.isPlan;
              fichier.classificationPending = false;
              fichier.dateLastUpdate = new Date();

              if (req.body.isPlan) {
                fichier.validationStatus = "pending";
                fichier.isActif = false;
                fichier.validatedBy = null;
                fichier.validatedAt = null;
              } else {
                fichier.validationStatus = "none";
                fichier.isActif = false;
                fichier.validatedBy = null;
                fichier.validatedAt = null;
              }

              const saved = await fichier.save();
              await saved.populate("creator validatedBy", "nom prenom");

              return res.json({
                success: true,
                message: saved,
              });
            } catch (error) {
              console.error(error);
              return res.status(500).json({
                success: false,
                message: error.message,
              });
            }
          }
        );
      },

      validateFichier: function (req, res) {
        acl.isAllowed(
          req.decoded.id,
          "box",
          "update",
          async function (err, aclres) {
            if (!aclres) {
              return res.status(401).json({ success: false, message: "401" });
            }

            try {
              await assertAdmin(req.decoded.id);

              const action = req.body.action;
              if (!["approve", "reject"].includes(action)) {
                return res.status(400).json({
                  success: false,
                  message: "Action invalide (approve ou reject attendu)",
                });
              }

              const fichier = await PlanFichier.findById(req.params.fichierId);
              if (!fichier) {
                return res.status(404).json({
                  success: false,
                  message: "Fichier introuvable",
                });
              }

              if (!fichier.isPlan) {
                return res.status(400).json({
                  success: false,
                  message: "Ce fichier n'est pas déclaré comme plan",
                });
              }

              if (fichier.validationStatus !== "pending") {
                return res.status(400).json({
                  success: false,
                  message: "Ce plan n'est pas en attente de validation",
                });
              }

              fichier.validatedBy = req.decoded.id;
              fichier.validatedAt = new Date();
              fichier.dateLastUpdate = new Date();

              if (action === "approve") {
                fichier.validationStatus = "approved";
                fichier.isActif = true;
              } else {
                fichier.validationStatus = "rejected";
                fichier.isActif = false;
              }

              const saved = await fichier.save();
              await saved.populate("creator validatedBy", "nom prenom");

              return res.json({
                success: true,
                message: saved,
              });
            } catch (error) {
              console.error(error);
              const statusCode = error.statusCode || 500;
              return res.status(statusCode).json({
                success: false,
                message: error.message,
              });
            }
          }
        );
      },
    };
  };
})();
