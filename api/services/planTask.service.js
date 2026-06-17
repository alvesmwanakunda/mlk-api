"use strict";

const PlanProjetModel = require("../models/planProjet.model").PlanProjetModel;
const PlanProjetFichierModel =
  require("../models/planProjetFichier.model").PlanProjetFichierModel;
const uploadService = require("./upload.service");

const TASK_PLAN_PDF_EXTENSIONS = ["pdf"];

function normalizePlanId(planId) {
  if (!planId) {
    return null;
  }
  return planId.toString();
}

async function formatLegacyPlan(plan) {
  if (!plan) {
    return null;
  }

  let chemin = plan.chemin;
  if (chemin && !/^https?:\/\//i.test(chemin)) {
    chemin = await uploadService.getSignedUrl(chemin);
  }

  return {
    _id: plan._id,
    nom: plan.nom,
    chemin,
    extension: plan.extension || "pdf",
    planSource: "legacy",
    isPlan: true,
    isActif: true,
  };
}

function formatSharePointPlan(fichier) {
  if (!fichier) {
    return null;
  }

  return {
    _id: fichier._id,
    nom: fichier.nom,
    chemin: fichier.chemin,
    extension: fichier.extension,
    size: fichier.size,
    sharepointItemId: fichier.sharepointItemId,
    planSource: "sharepoint",
    isPlan: fichier.isPlan,
    isActif: fichier.isActif,
    validationStatus: fichier.validationStatus,
  };
}

async function listActivePlansForProject(projetId, options = {}) {
  const pdfOnly = options.pdfOnly !== false;
  const sharePointQuery = {
    projet: projetId,
    isPlan: true,
    isActif: true,
    validationStatus: "approved",
  };

  if (pdfOnly) {
    sharePointQuery.extension = { $in: TASK_PLAN_PDF_EXTENSIONS };
  }

  const [sharePointPlans, legacyPlan] = await Promise.all([
    PlanProjetFichierModel.find(sharePointQuery)
      .sort({ nom: 1 })
      .lean(),
    PlanProjetModel.findOne({ projet: projetId }).lean(),
  ]);

  const plans = sharePointPlans.map(formatSharePointPlan).filter(Boolean);

  if (legacyPlan) {
    const legacyExtension = (legacyPlan.extension || "pdf").toLowerCase();
    const includeLegacy = !pdfOnly || TASK_PLAN_PDF_EXTENSIONS.includes(legacyExtension);
    if (includeLegacy) {
      const alreadyListed = plans.some(
        (item) => item._id.toString() === legacyPlan._id.toString()
      );
      if (!alreadyListed) {
        plans.unshift(await formatLegacyPlan(legacyPlan));
      }
    }
  }

  return plans;
}

async function validatePlanForTask(planId) {
  const normalizedPlanId = normalizePlanId(planId);
  if (!normalizedPlanId) {
    const error = new Error("Plan introuvable");
    error.statusCode = 404;
    throw error;
  }

  const sharePointPlan = await PlanProjetFichierModel.findById(normalizedPlanId);
  if (sharePointPlan) {
    if (!sharePointPlan.isPlan) {
      const error = new Error("Ce fichier n'est pas déclaré comme plan");
      error.statusCode = 400;
      throw error;
    }

    if (!sharePointPlan.isActif || sharePointPlan.validationStatus !== "approved") {
      const error = new Error(
        "Seuls les plans actifs et validés peuvent recevoir des tâches"
      );
      error.statusCode = 400;
      throw error;
    }

    const extension = (sharePointPlan.extension || "").toLowerCase();
    if (!TASK_PLAN_PDF_EXTENSIONS.includes(extension)) {
      const error = new Error(
        "Seuls les plans PDF peuvent recevoir des marqueurs de tâches pour le moment"
      );
      error.statusCode = 400;
      throw error;
    }

    return {
      id: sharePointPlan._id,
      source: "sharepoint",
      document: sharePointPlan,
    };
  }

  const legacyPlan = await PlanProjetModel.findById(normalizedPlanId);
  if (legacyPlan) {
    return {
      id: legacyPlan._id,
      source: "legacy",
      document: legacyPlan,
    };
  }

  const error = new Error("Plan introuvable");
  error.statusCode = 404;
  throw error;
}

module.exports = {
  TASK_PLAN_PDF_EXTENSIONS,
  listActivePlansForProject,
  validatePlanForTask,
};
