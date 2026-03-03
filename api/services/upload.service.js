var fs = require("fs");
const bucket = require("../../firebase-config").bucket;

//Fichier 
async function renameFileFromFirebaseStorage(filename, newFilename) {
  try{
    const destination = `files/${encodeURIComponent(newFilename)}`;
    const path = `files/${filename}`;

    // Copy the file to the new path
    await bucket.file(path).copy(bucket.file(destination));
    // Delete the original file
    await bucket.file(path).delete();

    return destination;
  }catch(error){
    // throw error;
    console.error("Une erreur s'est produite lors de la renommation du fichier :", error);
  }
}

async function renameFileProjetFromFirebaseStorage(filename, newFilename, projectId) {
  try{
    const sourcePath = filename && filename.startsWith("files/")
      ? filename
      : `files/${projectId}/${filename}`;
    const destination = `files/${projectId}/${newFilename}`;

    // Copy the file to the new path
    await bucket.file(sourcePath).copy(bucket.file(destination));
    // Delete the original file
    await bucket.file(sourcePath).delete();

    return destination;
  }catch(error){
    // throw error;
    console.error("Une erreur s'est produite lors de la renommation du fichier :", error);
  }
}

// Box
async function uploadFileToFirebaseStorage(filename) {

  const path = `./public/${filename}`;
  const destination = `files/${filename}`;

  try {
    await bucket.upload(path, {
      destination: destination
    });

    /*const [url] = await bucket.file(`files/${filename}`).getSignedUrl({
      action: "read",
      expires: "03-17-2025"
    });*/

    fs.unlink(path, (err) => {
      if (err) {
        console.error(err);
        return;
      }
    });
    return destination;
  } catch (error) {
    //throw error;
    console.error("Une erreur s'est produite lors de la suppression du fichier :", error);
    // Vous pouvez choisir d'arrêter l'application ici si vous le souhaitez
     //process.exit(1);
  }
}

async function uploadFileToFirebaseStorageByProject(filename, projectId) {
  const path = `./public/${filename}`;
  const destination = `files/${projectId}/${filename}`;

  try {
    await bucket.upload(path, {
      destination: destination
    });

    fs.unlink(path, (err) => {
      if (err) {
        console.error(err);
        return;
      }
    });
    return destination;
  } catch (error) {
    console.error("Une erreur s'est produite lors de l'upload du fichier projet :", error);
  }
}

async function deleteFirebaseStorage(filename){

  try {
    await bucket.file(`files/${filename}`).delete();

  } catch (error) {
     //throw error;
     console.error("Une erreur s'est produite lors de la suppression du fichier :", error);
    // Vous pouvez choisir d'arrêter l'application ici si vous le souhaitez
     //process.exit(1);
  }
}

async function deleteFirebaseStorageByProject(filenameOrPath, projectId){

  try {
    // const destination = filenameOrPath && filenameOrPath.includes("files/")
    //   ? filenameOrPath
    //   : `files/${projectId}/${filenameOrPath}`;
    await bucket.file(`files/${projectId}/${filenameOrPath}`).delete();

  } catch (error) {
     console.error("Une erreur s'est produite lors de la suppression du fichier projet :", error);
  }
}

function extractFilesStoragePath(pathOrUrl){
  if(!pathOrUrl){
    return null;
  }
  if(pathOrUrl.startsWith("files/")){
    return pathOrUrl;
  }
  try{
    const decoded = decodeURIComponent(pathOrUrl);
    const match = decoded.match(/files\/[^?]+/);
    return match ? match[0] : null;
  }catch(error){
    return null;
  }
}

async function migrateFileToProjectStorage(pathOrUrl, projectId){
  const sourcePath = extractFilesStoragePath(pathOrUrl);
  if(!sourcePath){
    throw new Error("Chemin source invalide");
  }

  if(sourcePath.startsWith(`files/${projectId}/`)){
    return sourcePath;
  }

  const sourceFile = bucket.file(sourcePath);
  const [sourceExists] = await sourceFile.exists();
  if(!sourceExists){
    throw new Error(`Source introuvable: ${sourcePath}`);
  }

  const fileName = sourcePath.split("/").pop();
  let destination = `files/${projectId}/${fileName}`;
  const destinationFile = bucket.file(destination);
  const [destinationExists] = await destinationFile.exists();
  if(destinationExists){
    destination = `files/${projectId}/${Date.now()}-${Math.round(Math.random() * 1E9)}-${fileName}`;
  }

  await sourceFile.copy(bucket.file(destination));
  await sourceFile.delete();

  return destination;
}

async function moveFileToExactProjectPath(pathOrUrl, projectId, targetFilename){
  const sourcePath = extractFilesStoragePath(pathOrUrl);
  if(!sourcePath){
    throw new Error("Chemin source invalide");
  }

  const destination = `files/${projectId}/${targetFilename}`;
  if(sourcePath === destination){
    return destination;
  }

  const sourceFile = bucket.file(sourcePath);
  const [sourceExists] = await sourceFile.exists();
  if(!sourceExists){
    const [destinationExists] = await bucket.file(destination).exists();
    if(destinationExists){
      return destination;
    }
    throw new Error(`Source introuvable: ${sourcePath}`);
  }

  await sourceFile.copy(bucket.file(destination));
  await sourceFile.delete();

  return destination;
}

// Projets
async function uploadProjetsToFirebaseStorage(filename) {

  const path = `./public/${filename}`;
  const destination = `projets/${filename}`;


  try {
    await bucket.upload(path, {
      destination: destination
    });

    /*const [url] = await bucket.file(`projets/${filename}`).getSignedUrl({
      action: "read",
      expires: "03-17-2025"
    });*/

    fs.unlink(path, (err) => {
      if (err) {
        console.error(err);
        return;
      }
    });
    return destination;
  } catch (error) {
    //throw error;
    console.error("Une erreur s'est produite lors de la suppression du fichier :", error);
    // Vous pouvez choisir d'arrêter l'application ici si vous le souhaitez
     //process.exit(1);
  }
}
async function deleteProjetsFirebaseStorage(filename){

  try {
    await bucket.file(`projets/${filename}`).delete();

  } catch (error) {
     //throw error;
     console.error("Une erreur s'est produite lors de la suppression du fichier :", error);
    // Vous pouvez choisir d'arrêter l'application ici si vous le souhaitez
     //process.exit(1);
  }
}

async function uploadPlansToFirebaseStorage(filename) {

  const path = `./public/${filename}`;
  const destination = `plans/${filename}`;


  try {
    await bucket.upload(path, {
      destination: destination
    });

    /*const [url] = await bucket.file(`plans/${filename}`).getSignedUrl({
      action: "read",
      expires: "03-17-2025"
    });*/

    fs.unlink(path, (err) => {
      if (err) {
        console.error(err);
        return;
      }
    });
    return destination;
  } catch (error) {
    //throw error;
    console.error("Une erreur s'est produite lors de la suppression du fichier :", error);
    // Vous pouvez choisir d'arrêter l'application ici si vous le souhaitez
     //process.exit(1);
  }
}
async function deletePlansFirebaseStorage(filename){

  try {
    await bucket.file(`plans/${filename}`).delete();

  } catch (error) {
     //throw error;
     console.error("Une erreur s'est produite lors de la suppression du fichier :", error);
    // Vous pouvez choisir d'arrêter l'application ici si vous le souhaitez
     //process.exit(1);
  }
}

async function uploadModuleToFirebaseStorage(filename) {

  const path = `./public/${filename}`;
  const destination = `photosmodules/${filename}`;


  try {
    await bucket.upload(path, {
      destination: destination
    });

    /*const [url] = await bucket.file(`photosmodules/${filename}`).getSignedUrl({
      action: "read",
      expires: "03-17-2025"
    });*/

    fs.unlink(path, (err) => {
      if (err) {
        console.error(err);
        return;
      }
    });
    return destination;
  } catch (error) {
    //throw error;
    console.error("Une erreur s'est produite lors de la suppression du fichier :", error);
    // Vous pouvez choisir d'arrêter l'application ici si vous le souhaitez
     //process.exit(1);
  }
}
async function deleteModuleFirebaseStorage(filename){

  try {
    await bucket.file(`photosmodules/${filename}`).delete();

  } catch (error) {
     //throw error;
     console.error("Une erreur s'est produite lors de la suppression du fichier :", error);
    // Vous pouvez choisir d'arrêter l'application ici si vous le souhaitez
     //process.exit(1);
  }
}

async function uploadCongesToFirebaseStorage(filename) {

  const path = `./public/${filename}`;
  const destination = `conges/${filename}`;

  try {
    await bucket.upload(path, {
      destination: destination
    });

    /*const [url] = await bucket.file(`conges/${filename}`).getSignedUrl({
      action: "read",
      expires: "03-17-2025"
    });*/

    fs.unlink(path, (err) => {
      if (err) {
        console.error(err);
        return;
      }
    });
    return destination;
  } catch (error) {
    //throw error;
    console.error("Une erreur s'est produite lors de la suppression du fichier :", error);
    // Vous pouvez choisir d'arrêter l'application ici si vous le souhaitez
     //process.exit(1);
  }
}
async function deleteCongesFirebaseStorage(filename){

  try {
    await bucket.file(`conges/${filename}`).delete();

  } catch (error) {
     //throw error;
     console.error("Une erreur s'est produite lors de la suppression du fichier :", error);
    // Vous pouvez choisir d'arrêter l'application ici si vous le souhaitez
     //process.exit(1);
  }
}

async function uploadProjetsModulesToFirebaseStorage(filename) {

  const path = `./public/${filename}`;
  const destination = `projetmodules/${filename}`

  try {
    await bucket.upload(path, {
      destination: destination
    });

    /*const [url] = await bucket.file(`projetmodules/${filename}`).getSignedUrl({
      action: "read",
      expires: "03-17-2025"
    });*/

    fs.unlink(path, (err) => {
      if (err) {
        console.error(err);
        return;
      }
    });
    return destination;
  } catch (error) {
    //throw error;
    console.error("Une erreur s'est produite lors de la suppression du fichier :", error);
    // Vous pouvez choisir d'arrêter l'application ici si vous le souhaitez
     //process.exit(1);
  }
}
async function deleteProjetsModulesFirebaseStorage(filename){

  try {
    await bucket.file(`projetmodules/${filename}`).delete();

  } catch (error) {
     //throw error;
     console.error("Une erreur s'est produite lors de la suppression du fichier :", error);
    // Vous pouvez choisir d'arrêter l'application ici si vous le souhaitez
     //process.exit(1);
  }
}

async function uploadNotesModulesToFirebaseStorage(filename) {

  const path = `./public/${filename}`;
  const destination = `notesmodules/${filename}`

  try {
    await bucket.upload(path, {
      destination: destination
    });

    /*const [url] = await bucket.file(`projetmodules/${filename}`).getSignedUrl({
      action: "read",
      expires: "03-17-2025"
    });*/

    fs.unlink(path, (err) => {
      if (err) {
        console.error(err);
        return;
      }
    });
    return destination;
  } catch (error) {
    //throw error;
    console.error("Une erreur s'est produite lors de la suppression du fichier :", error);
    // Vous pouvez choisir d'arrêter l'application ici si vous le souhaitez
     //process.exit(1);
  }
}
async function deleteNotesModulesFirebaseStorage(filename){

  try {
    await bucket.file(`notesmodules/${filename}`).delete();

  } catch (error) {
     //throw error;
     console.error("Une erreur s'est produite lors de la suppression du fichier :", error);
    // Vous pouvez choisir d'arrêter l'application ici si vous le souhaitez
     //process.exit(1);
  }
}

async function uploadTachesToFirebaseStorage(filename) {

  const path = `./public/${filename}`;
  const destination = `taches/${filename}`

  try {
    await bucket.upload(path, {
      destination: destination
    });

    /*const [url] = await bucket.file(`projetmodules/${filename}`).getSignedUrl({
      action: "read",
      expires: "03-17-2025"
    });*/

    fs.unlink(path, (err) => {
      if (err) {
        console.error(err);
        return;
      }
    });
    return destination;
  } catch (error) {
    //throw error;
    console.error("Une erreur s'est produite lors de la suppression du fichier :", error);
    // Vous pouvez choisir d'arrêter l'application ici si vous le souhaitez
     //process.exit(1);
  }
}
async function deleteTachesFirebaseStorage(filename){

  try {
    await bucket.file(`taches/${filename}`).delete();

  } catch (error) {
     //throw error;
     console.error("Une erreur s'est produite lors de la suppression du fichier :", error);
    // Vous pouvez choisir d'arrêter l'application ici si vous le souhaitez
     //process.exit(1);
  }
}

async function uploadPVToFirebaseStorage(filename) {

  const path = `./public/${filename}`;
  const destination = `pvreception/${filename}`

  try {
    await bucket.upload(path, {
      destination: destination
    });

    /*const [url] = await bucket.file(`projetmodules/${filename}`).getSignedUrl({
      action: "read",
      expires: "03-17-2025"
    });*/

    fs.unlink(path, (err) => {
      if (err) {
        console.error(err);
        return;
      }
    });
    return destination;
  } catch (error) {
    //throw error;
    console.error("Une erreur s'est produite lors de la suppression du fichier :", error);
    // Vous pouvez choisir d'arrêter l'application ici si vous le souhaitez
     //process.exit(1);
  }
}
async function deletePVFirebaseStorage(filename){

  try {
    await bucket.file(`pvreception/${filename}`).delete();

  } catch (error) {
     //throw error;
     console.error("Une erreur s'est produite lors de la suppression du fichier :", error);
    // Vous pouvez choisir d'arrêter l'application ici si vous le souhaitez
     //process.exit(1);
  }
}


async function getSignedUrl(filePath) {
  try {
    const [url] = await bucket.file(filePath).getSignedUrl({
      action: "read",
      expires: "03-17-2050"
    });
    //console.log("url", url);
    return url;
  } catch (error) {
    console.error("Erreur lors de la génération de l'URL signée :", error);
    throw error;
  }
}

async function getSignedUrlPhoto(filePath) {
  try {
    const [url] = await bucket.file(filePath).getSignedUrl({
      action: "read",
      expires: "03-17-2050"
    });
    //console.log("url", url);
    return url;
  } catch (error) {
    console.error("Erreur lors de la génération de l'URL signée :", error);
    throw error;
  }
}

function extractFilePath(url) {
  const match = url.match(/plans\/[^?]+/);
  return match ? match[0] : null;
}


module.exports = {
  uploadFileToFirebaseStorage,
  uploadFileToFirebaseStorageByProject,
  deleteFirebaseStorage,
  deleteFirebaseStorageByProject,
  migrateFileToProjectStorage,
  moveFileToExactProjectPath,
  uploadProjetsToFirebaseStorage,
  deleteProjetsFirebaseStorage,
  uploadPlansToFirebaseStorage,
  deletePlansFirebaseStorage,
  uploadModuleToFirebaseStorage,
  deleteModuleFirebaseStorage,
  uploadCongesToFirebaseStorage,
  deleteCongesFirebaseStorage,
  uploadProjetsModulesToFirebaseStorage,
  deleteProjetsModulesFirebaseStorage,
  getSignedUrl,
  extractFilePath,
  getSignedUrlPhoto,
  renameFileFromFirebaseStorage,
  renameFileProjetFromFirebaseStorage,
  uploadNotesModulesToFirebaseStorage,
  deleteNotesModulesFirebaseStorage,
  uploadTachesToFirebaseStorage,
  deleteTachesFirebaseStorage,
  uploadPVToFirebaseStorage,
  deletePVFirebaseStorage
};
