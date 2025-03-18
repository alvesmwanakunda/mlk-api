var fs = require("fs");
const bucket = require("../../firebase-config");

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

function extractFilePath(url) {
  const match = url.match(/plans\/[^?]+/);
  return match ? match[0] : null;
}


module.exports = {
  uploadFileToFirebaseStorage,
  deleteFirebaseStorage,
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
  extractFilePath
};
