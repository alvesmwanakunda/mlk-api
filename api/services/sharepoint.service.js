"use strict";

const axios = require("axios");
const fs = require("fs");
const path = require("path");

const ProjetModel = require("../models/projets.model").ProjetModel;

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";
const SIMPLE_UPLOAD_MAX = 250 * 1024 * 1024;
const UPLOAD_CHUNK_SIZE = 10 * 1024 * 1024;
const MAX_PLAN_FILE_SIZE = 3 * 1024 * 1024 * 1024;
const LOG_PREFIX = "[PlanUpload][SharePoint]";

function formatFileSize(bytes) {
  const size = Number(bytes) || 0;
  if (size >= 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} Go`;
  }
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(2)} Mo`;
  }
  if (size >= 1024) {
    return `${(size / 1024).toFixed(2)} Ko`;
  }
  return `${size} o`;
}

function sanitizeUrlForLog(url) {
  if (!url || typeof url !== "string") {
    return url;
  }

  try {
    const parsed = new URL(url);
    if (parsed.searchParams.has("tempauth")) {
      parsed.searchParams.set("tempauth", "[REDACTED]");
    }
    return parsed.toString();
  } catch (error) {
    return url.replace(/tempauth=[^&]+/i, "tempauth=[REDACTED]");
  }
}

function toGraphPath(url) {
  if (!url) {
    return url;
  }
  return url.startsWith("http") ? url.replace(GRAPH_BASE, "") : url;
}

function logSharePoint(step, message, details) {
  const suffix =
    details && Object.keys(details).length > 0
      ? ` ${JSON.stringify(details)}`
      : "";
  console.log(`${LOG_PREFIX} [${step}] ${message}${suffix}`);
}

function logSharePointError(step, message, error, details) {
  const payload = {
    ...(details || {}),
    statusCode: error?.statusCode || error?.response?.status || null,
    graphCode: error?.graphError?.code || error?.response?.data?.error?.code || null,
    graphMessage:
      error?.graphError?.message ||
      error?.response?.data?.error?.message ||
      error?.message ||
      null,
  };
  console.error(`${LOG_PREFIX} [${step}] ${message} ${JSON.stringify(payload)}`);
}

function buildPostmanStyleSessionPath(parentItemId, fileName) {
  return `/sites/{site-id}/drive/items/${parentItemId}:/${fileName}:/createUploadSession`;
}

function isConfigured() {
  return Boolean(
    process.env.SHAREPOINT_TENANT_ID &&
      process.env.SHAREPOINT_CLIENT_ID &&
      process.env.SHAREPOINT_CLIENT_SECRET &&
      process.env.SHAREPOINT_DRIVE_ID
  );
}

function assertSharePointConfigured() {
  if (!isConfigured()) {
    throw new Error(
      "SharePoint non configuré : SHAREPOINT_TENANT_ID, SHAREPOINT_CLIENT_ID, SHAREPOINT_CLIENT_SECRET et SHAREPOINT_DRIVE_ID sont requis."
    );
  }
}

function isLegacyMockSharePointItemId(itemId) {
  if (!itemId || typeof itemId !== "string") {
    return false;
  }
  return (
    itemId.startsWith("mock-folder-") || itemId.startsWith("mock-file-")
  );
}

function isStoredSharePointItemValid(itemId) {
  return Boolean(itemId) && !isLegacyMockSharePointItemId(itemId);
}

function hasValidStoredRoot(projet) {
  return (
    projet?.sharepointPlansFolderId &&
    projet?.sharepointPlansFolderName &&
    isStoredSharePointItemValid(projet.sharepointPlansFolderId)
  );
}

function sanitizeSharePointFolderSegment(value) {
  return String(value ?? "")
    .trim()
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^\.+|\.+$/g, "");
}

function buildProjectRootFolderName(projet) {
  const year = new Date().getFullYear();
  const label = sanitizeSharePointFolderSegment(projet?.projet) || "Projet";
  return `${year}_${label}`;
}

function formatUploadDatePrefix(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildPlanFileName(originalName) {
  const baseName = sanitizeSharePointFileName(originalName);
  return `${formatUploadDatePrefix()}_${baseName}`;
}

function sanitizeSharePointFileName(originalName) {
  const raw = path.basename(String(originalName ?? "").trim()) || "fichier";
  const lastDot = raw.lastIndexOf(".");

  let stem = lastDot > 0 ? raw.slice(0, lastDot) : raw;
  let ext = lastDot > 0 ? raw.slice(lastDot + 1) : "";

  stem = stem
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\\/:*?"<>|#%&+]/g, "_")
    .replace(/[^\w.-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 180);

  ext = ext
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 20);

  if (ext) {
    return `${stem || "fichier"}.${ext}`;
  }

  return stem || "fichier";
}

function encodeDriveItemPathName(fileName) {
  return String(fileName).replace(/[#?&%+]/g, "_");
}

function buildDriveItemUploadPath(parentItemId, fileName, action) {
  const driveId = process.env.SHAREPOINT_DRIVE_ID;
  const safeName = encodeDriveItemPathName(fileName);
  const parentSegment =
    parentItemId === "root" ? "root" : `items/${parentItemId}`;

  return `/drives/${driveId}/${parentSegment}:/${safeName}:/${action}`;
}

function formatGraphErrorMessage(message) {
  if (!message) {
    return "Erreur lors de l'appel Microsoft Graph";
  }

  if (/malformed or incorrect/i.test(message)) {
    return "Nom de fichier ou requête SharePoint invalide. Vérifiez les caractères du fichier.";
  }

  return message;
}

let cachedToken = null;
let cachedTokenExpiresAt = 0;

async function getAccessToken() {
  assertSharePointConfigured();

  const now = Date.now();
  if (cachedToken && cachedTokenExpiresAt > now + 60_000) {
    logSharePoint("auth", "Token Graph réutilisé (cache)", {
      expiresInSec: Math.round((cachedTokenExpiresAt - now) / 1000),
    });
    return cachedToken;
  }

  logSharePoint("auth", "Demande d'un nouveau token Graph (client credentials)");

  const tenantId = process.env.SHAREPOINT_TENANT_ID;
  const clientId = process.env.SHAREPOINT_CLIENT_ID;
  const clientSecret = process.env.SHAREPOINT_CLIENT_SECRET;

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("client_secret", clientSecret);
  params.append("scope", "https://graph.microsoft.com/.default");
  params.append("grant_type", "client_credentials");

  const response = await axios.post(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    params.toString(),
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }
  );

  cachedToken = response.data.access_token;
  cachedTokenExpiresAt = now + (response.data.expires_in || 3600) * 1000;
  logSharePoint("auth", "Token Graph obtenu", {
    expiresInSec: response.data.expires_in || 3600,
  });
  return cachedToken;
}

async function graphRequest(method, url, options = {}) {
  const token = await getAccessToken();
  const requestPath = toGraphPath(url);
  const logStep = options.logStep;

  if (logStep) {
    logSharePoint(logStep, "Requête Graph", {
      method,
      path: requestPath,
    });
  }

  try {
    const response = await axios({
      method,
      url: url.startsWith("http") ? url : `${GRAPH_BASE}${url}`,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
      data: options.data,
      responseType: options.responseType,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    if (logStep) {
      logSharePoint(logStep, "Réponse Graph OK", {
        method,
        path: requestPath,
        status: response.status,
      });
    }

    return response.data;
  } catch (error) {
    if (logStep) {
      logSharePointError(logStep, "Erreur Graph", error, {
        method,
        path: requestPath,
      });
    }

    const graphError = error.response?.data?.error;
    const message = formatGraphErrorMessage(
      graphError?.message ||
        error.message ||
        "Erreur lors de l'appel Microsoft Graph"
    );
    const wrapped = new Error(message);
    wrapped.statusCode = error.response?.status;
    wrapped.graphError = graphError;
    throw wrapped;
  }
}

async function findDriveChildByName(parentItemId, folderName) {
  const driveId = process.env.SHAREPOINT_DRIVE_ID;
  const parentPath =
    parentItemId === "root"
      ? `/drives/${driveId}/root/children`
      : `/drives/${driveId}/items/${parentItemId}/children`;

  const data = await graphRequest("GET", parentPath);
  const items = data.value || [];
  return items.find(
    (item) =>
      item.name === folderName &&
      item.folder &&
      !item.deleted
  );
}

async function createDriveFolder(parentItemId, folderName) {
  const driveId = process.env.SHAREPOINT_DRIVE_ID;
  const parentPath =
    parentItemId === "root"
      ? `/drives/${driveId}/root/children`
      : `/drives/${driveId}/items/${parentItemId}/children`;

  return graphRequest("POST", parentPath, {
    data: {
      name: folderName,
      folder: {},
      "@microsoft.graph.conflictBehavior": "fail",
    },
  });
}

async function uploadDriveFileSimple(parentItemId, fileName, localFilePath) {
  const uploadPath = buildDriveItemUploadPath(parentItemId, fileName, "content");
  const fileSize = fs.statSync(localFilePath).size;

  logSharePoint("simple-upload", "Upload direct (<= 250 Mo)", {
    parentItemId,
    fileName,
    fileSize: formatFileSize(fileSize),
    graphPath: uploadPath,
    postmanStylePath: buildPostmanStyleSessionPath(parentItemId, fileName).replace(
      "createUploadSession",
      "content"
    ),
  });

  const fileBuffer = fs.readFileSync(localFilePath);

  const result = await graphRequest("PUT", uploadPath, {
    logStep: "simple-upload",
    headers: { "Content-Type": "application/octet-stream" },
    data: fileBuffer,
  });

  logSharePoint("simple-upload", "Upload direct terminé", {
    itemId: result?.id,
    name: result?.name,
    size: formatFileSize(result?.size),
  });

  return result;
}

async function createDriveFilePlaceholder(parentItemId, fileName) {
  const driveId = process.env.SHAREPOINT_DRIVE_ID;
  const parentPath =
    parentItemId === "root"
      ? `/drives/${driveId}/root/children`
      : `/drives/${driveId}/items/${parentItemId}/children`;

  logSharePoint("placeholder", "Création du fichier placeholder (étape 1/2 gros fichier)", {
    parentItemId,
    fileName,
    graphPath: parentPath,
  });

  const result = await graphRequest("POST", parentPath, {
    logStep: "placeholder",
    data: {
      name: fileName,
      file: {},
      "@microsoft.graph.conflictBehavior": "fail",
    },
  });

  logSharePoint("placeholder", "Placeholder créé", {
    itemId: result?.id,
    name: result?.name,
  });

  return result;
}

async function createUploadSessionForItem(itemId, context = {}) {
  const driveId = process.env.SHAREPOINT_DRIVE_ID;
  const sessionPath = `/drives/${driveId}/items/${itemId}/createUploadSession`;

  logSharePoint("session", "Création session upload sur item existant (étape 2/2 gros fichier)", {
    itemId,
    graphPath: sessionPath,
    postmanStyleColonPath: context.postmanStyleColonPath || null,
    note:
      "En app-only, colon-path createUploadSession (Postman) échoue ; on passe par placeholder + session item.",
  });

  const result = await graphRequest("POST", sessionPath, {
    logStep: "session",
    data: {
      item: {
        "@microsoft.graph.conflictBehavior": "replace",
      },
    },
  });

  logSharePoint("session", "Session upload créée", {
    itemId,
    expirationDateTime: result?.expirationDateTime,
    uploadUrl: sanitizeUrlForLog(result?.uploadUrl),
    nextExpectedRanges: result?.nextExpectedRanges,
  });

  return result;
}

async function uploadChunkToSessionUrl(
  uploadUrl,
  buffer,
  start,
  end,
  totalSize,
  chunkIndex
) {
  const chunkSize = end - start + 1;
  const contentRange = `bytes ${start}-${end}/${totalSize}`;

  logSharePoint("chunk", "Envoi chunk", {
    chunkIndex,
    contentRange,
    chunkSize: formatFileSize(chunkSize),
    uploadUrl: sanitizeUrlForLog(uploadUrl),
  });

  try {
    const response = await axios.put(uploadUrl, buffer, {
      headers: {
        "Content-Length": chunkSize,
        "Content-Range": contentRange,
        "Content-Type": "application/octet-stream",
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      validateStatus: (status) =>
        (status >= 200 && status < 300) || status === 202,
    });

    logSharePoint("chunk", "Chunk accepté", {
      chunkIndex,
      status: response.status,
      nextExpectedRanges: response.data?.nextExpectedRanges || null,
      completed: Boolean(response.data?.id),
      itemId: response.data?.id || null,
    });

    return response;
  } catch (error) {
    logSharePointError("chunk", "Erreur envoi chunk", error, {
      chunkIndex,
      contentRange,
      uploadUrl: sanitizeUrlForLog(uploadUrl),
    });
    throw error;
  }
}

async function uploadDriveFileViaSession(
  parentItemId,
  fileName,
  localFilePath,
  onProgress
) {
  const fileSize = fs.statSync(localFilePath).size;
  let placeholderItemId = null;
  const postmanStyleColonPath = buildPostmanStyleSessionPath(
    parentItemId,
    fileName
  );
  const graphColonPath = buildDriveItemUploadPath(
    parentItemId,
    fileName,
    "createUploadSession"
  );

  logSharePoint("session-upload", "Démarrage upload par session (> 250 Mo)", {
    parentItemId,
    fileName,
    fileSize: formatFileSize(fileSize),
    chunkSize: formatFileSize(UPLOAD_CHUNK_SIZE),
    postmanStyleColonPath,
    graphColonPath,
  });

  try {
    const placeholder = await createDriveFilePlaceholder(parentItemId, fileName);
    placeholderItemId = placeholder.id;
    const session = await createUploadSessionForItem(placeholderItemId, {
      postmanStyleColonPath,
    });

    if (!session?.uploadUrl) {
      throw new Error("Impossible de créer la session d'upload SharePoint");
    }

    const uploadUrl = session.uploadUrl;
    const fd = fs.openSync(localFilePath, "r");
    let offset = 0;
    let lastResponse = null;
    let chunkIndex = 0;
    const estimatedChunks = Math.ceil(fileSize / UPLOAD_CHUNK_SIZE);

    logSharePoint("session-upload", "Upload chunks démarré", {
      uploadUrl: sanitizeUrlForLog(uploadUrl),
      estimatedChunks,
    });

    try {
      while (offset < fileSize) {
        chunkIndex += 1;
        const remaining = fileSize - offset;
        let chunkSize = Math.min(UPLOAD_CHUNK_SIZE, remaining);

        if (remaining > chunkSize) {
          chunkSize =
            Math.floor(chunkSize / 327680) * 327680 || 327680;
        }

        const buffer = Buffer.alloc(chunkSize);
        fs.readSync(fd, buffer, 0, chunkSize, offset);

        const end = offset + chunkSize - 1;
        lastResponse = await uploadChunkToSessionUrl(
          uploadUrl,
          buffer,
          offset,
          end,
          fileSize,
          chunkIndex
        );

        offset += chunkSize;

        if (onProgress) {
          onProgress(Math.min(100, Math.round((offset / fileSize) * 100)));
        }
      }
    } finally {
      fs.closeSync(fd);
    }

    const driveItem = lastResponse?.data;
    if (driveItem?.id) {
      logSharePoint("session-upload", "Upload session terminé avec succès", {
        itemId: driveItem.id,
        name: driveItem.name,
        size: formatFileSize(driveItem.size),
        chunksSent: chunkIndex,
      });
      return driveItem;
    }

    throw new Error("Upload SharePoint incomplet");
  } catch (error) {
    logSharePointError("session-upload", "Échec upload session", error, {
      parentItemId,
      fileName,
      placeholderItemId,
    });

    if (placeholderItemId) {
      logSharePoint("cleanup", "Suppression du placeholder après échec", {
        placeholderItemId,
      });
      try {
        await deleteDriveItem(placeholderItemId);
        logSharePoint("cleanup", "Placeholder supprimé");
      } catch (cleanupError) {
        logSharePointError("cleanup", "Impossible de supprimer le placeholder", cleanupError, {
          placeholderItemId,
        });
      }
    }
    throw error;
  }
}

async function uploadDriveFile(
  parentItemId,
  fileName,
  localFilePath,
  onProgress
) {
  const fileSize = fs.statSync(localFilePath).size;

  logSharePoint("upload", "Analyse du fichier à uploader", {
    parentItemId,
    fileName,
    localFilePath,
    fileSize: formatFileSize(fileSize),
    strategy:
      fileSize <= SIMPLE_UPLOAD_MAX
        ? "direct (PUT content)"
        : "session (placeholder + chunks)",
    simpleUploadMax: formatFileSize(SIMPLE_UPLOAD_MAX),
  });

  if (fileSize > MAX_PLAN_FILE_SIZE) {
    throw new Error(
      "Fichier trop volumineux (maximum 3 Go par fichier plan)."
    );
  }

  if (onProgress) {
    onProgress(0);
  }

  if (fileSize <= SIMPLE_UPLOAD_MAX) {
    const result = await uploadDriveFileSimple(
      parentItemId,
      fileName,
      localFilePath
    );
    if (onProgress) {
      onProgress(100);
    }
    return result;
  }

  return uploadDriveFileViaSession(
    parentItemId,
    fileName,
    localFilePath,
    onProgress
  );
}

async function renameDriveItem(itemId, newName) {
  const driveId = process.env.SHAREPOINT_DRIVE_ID;
  return graphRequest("PATCH", `/drives/${driveId}/items/${itemId}`, {
    data: { name: newName },
  });
}

async function deleteDriveItem(itemId) {
  const driveId = process.env.SHAREPOINT_DRIVE_ID;
  await graphRequest("DELETE", `/drives/${driveId}/items/${itemId}`);
}

async function collectDossierTreeIds(dossierId) {
  const Dossier = require("../models/planProjetDossier.model")
    .PlanProjetDossierModel;
  const ids = [dossierId.toString()];
  const children = await Dossier.find({ dossierParent: dossierId }).select(
    "_id"
  );

  for (const child of children) {
    ids.push(...(await collectDossierTreeIds(child._id)));
  }

  return ids;
}

async function ensureProjectPlansRootFolder(projet) {
  assertSharePointConfigured();

  if (!projet) {
    throw new Error("Projet introuvable");
  }

  const freshProjet = await ProjetModel.findById(projet._id || projet);
  if (!freshProjet) {
    throw new Error("Projet introuvable");
  }

  if (hasValidStoredRoot(freshProjet)) {
    return {
      folderId: freshProjet.sharepointPlansFolderId,
      folderPath: freshProjet.sharepointPlansFolderPath || null,
      folderName: freshProjet.sharepointPlansFolderName,
      created: false,
    };
  }

  const folderName = buildProjectRootFolderName(freshProjet);
  let spFolder = await findDriveChildByName("root", folderName);
  let created = false;

  if (!spFolder) {
    spFolder = await createDriveFolder("root", folderName);
    created = true;
  }

  const updated = await ProjetModel.findByIdAndUpdate(
    freshProjet._id,
    {
      sharepointPlansFolderId: spFolder.id,
      sharepointPlansFolderPath: spFolder.webUrl || null,
      sharepointPlansFolderName: folderName,
    },
    { new: true }
  );

  return {
    folderId: updated.sharepointPlansFolderId,
    folderPath: updated.sharepointPlansFolderPath,
    folderName: updated.sharepointPlansFolderName,
    created,
  };
}

async function resolveParentSharePointFolderId(projet, dossierParentId) {
  const root = await ensureProjectPlansRootFolder(projet);
  if (!dossierParentId) {
    logSharePoint("resolve-parent", "Dossier parent = racine projet SharePoint", {
      projetId: projet._id?.toString?.() || projet._id,
      parentItemId: root.folderId,
      folderName: root.folderName,
    });
    return root.folderId;
  }

  const Dossier = require("../models/planProjetDossier.model")
    .PlanProjetDossierModel;
  const parent = await Dossier.findOne({
    _id: dossierParentId,
    projet: projet._id,
  });

  if (!parent) {
    throw new Error("Dossier parent introuvable");
  }

  if (
    parent.sharepointItemId &&
    isStoredSharePointItemValid(parent.sharepointItemId)
  ) {
    logSharePoint("resolve-parent", "Dossier parent Mongo trouvé", {
      dossierParentId: dossierParentId.toString(),
      parentItemId: parent.sharepointItemId,
      dossierName: parent.nom,
    });
    return parent.sharepointItemId;
  }

  logSharePoint("resolve-parent", "Provisionnement SharePoint du dossier parent", {
    dossierParentId: dossierParentId.toString(),
    dossierName: parent.nom,
    rootFolderId: root.folderId,
  });

  let spFolder = await findDriveChildByName(root.folderId, parent.nom);
  if (!spFolder) {
    spFolder = await createDriveFolder(root.folderId, parent.nom);
  }

  parent.sharepointItemId = spFolder.id;
  await parent.save();

  logSharePoint("resolve-parent", "Dossier parent provisionné", {
    parentItemId: parent.sharepointItemId,
    dossierName: parent.nom,
  });

  return parent.sharepointItemId;
}

async function createProjectSubFolder(projet, folderName, dossierParentId) {
  const parentItemId = await resolveParentSharePointFolderId(
    projet,
    dossierParentId
  );

  if (!isStoredSharePointItemValid(parentItemId)) {
    throw new Error(
      "Référence SharePoint invalide pour le dossier parent. Réessayez après rechargement."
    );
  }

  const existing = await findDriveChildByName(parentItemId, folderName);
  if (existing) {
    return existing;
  }

  return createDriveFolder(parentItemId, folderName);
}

async function uploadProjectPlanFile(
  projet,
  dossierParentId,
  multerFile,
  onProgress
) {
  logSharePoint("project-upload", "Démarrage upload plan projet", {
    projetId: projet._id?.toString?.() || projet._id,
    projetLabel: projet.projet,
    dossierParentId: dossierParentId?.toString?.() || dossierParentId || null,
    originalName: multerFile.originalname || multerFile.filename,
    multerSize: formatFileSize(multerFile.size),
  });

  const parentItemId = await resolveParentSharePointFolderId(
    projet,
    dossierParentId
  );
  const originalName = multerFile.originalname || multerFile.filename;
  const storedName = buildPlanFileName(originalName);
  const localPath = path.isAbsolute(multerFile.path)
    ? multerFile.path
    : path.join(multerFile.destination || "", multerFile.filename);

  logSharePoint("project-upload", "Nom SharePoint calculé", {
    originalName,
    storedName,
    localPath,
    parentItemId,
  });

  const result = await uploadDriveFile(
    parentItemId,
    storedName,
    localPath,
    onProgress
  );

  logSharePoint("project-upload", "Upload plan projet terminé", {
    itemId: result?.id,
    name: result?.name,
    webUrl: result?.webUrl,
    size: formatFileSize(result?.size),
  });

  return result;
}

async function renameProjectPlanFolder(dossierId, newName) {
  const Dossier = require("../models/planProjetDossier.model")
    .PlanProjetDossierModel;
  const dossier = await Dossier.findById(dossierId);

  if (!dossier) {
    throw new Error("Dossier introuvable");
  }

  const trimmedName = String(newName ?? "").trim();
  if (!trimmedName) {
    throw new Error("Le nom du dossier est requis");
  }

  if (isStoredSharePointItemValid(dossier.sharepointItemId)) {
    const spItem = await renameDriveItem(dossier.sharepointItemId, trimmedName);
    dossier.sharepointItemId = spItem.id || dossier.sharepointItemId;
  }

  dossier.nom = trimmedName;
  dossier.dateLastUpdate = new Date();
  await dossier.save();
  return dossier;
}

async function deleteProjectPlanDossier(dossierId) {
  const Dossier = require("../models/planProjetDossier.model")
    .PlanProjetDossierModel;
  const Fichier = require("../models/planProjetFichier.model")
    .PlanProjetFichierModel;

  const dossier = await Dossier.findById(dossierId);
  if (!dossier) {
    throw new Error("Dossier introuvable");
  }

  const treeIds = await collectDossierTreeIds(dossierId);

  if (isStoredSharePointItemValid(dossier.sharepointItemId)) {
    await deleteDriveItem(dossier.sharepointItemId);
  } else {
    const files = await Fichier.find({ dossierParent: { $in: treeIds } });
    for (const file of files) {
      if (isStoredSharePointItemValid(file.sharepointItemId)) {
        await deleteDriveItem(file.sharepointItemId);
      }
    }

    const subDossiers = await Dossier.find({
      _id: {
        $in: treeIds.filter((id) => id !== dossierId.toString()),
      },
    });
    for (const subDossier of subDossiers) {
      if (isStoredSharePointItemValid(subDossier.sharepointItemId)) {
        await deleteDriveItem(subDossier.sharepointItemId);
      }
    }
  }

  await Fichier.deleteMany({ dossierParent: { $in: treeIds } });
  await Dossier.deleteMany({ _id: { $in: treeIds } });
}

async function deleteProjectPlanFile(fichierId) {
  const Fichier = require("../models/planProjetFichier.model")
    .PlanProjetFichierModel;
  const file = await Fichier.findById(fichierId);

  if (!file) {
    throw new Error("Fichier introuvable");
  }

  if (isStoredSharePointItemValid(file.sharepointItemId)) {
    await deleteDriveItem(file.sharepointItemId);
  }

  await file.deleteOne();
}

module.exports = {
  isConfigured,
  MAX_PLAN_FILE_SIZE,
  sanitizeSharePointFolderSegment,
  buildProjectRootFolderName,
  buildPlanFileName,
  ensureProjectPlansRootFolder,
  createProjectSubFolder,
  uploadProjectPlanFile,
  renameProjectPlanFolder,
  deleteProjectPlanDossier,
  deleteProjectPlanFile,
};
