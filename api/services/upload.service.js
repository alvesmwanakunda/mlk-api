var fs = require("fs");
const bucket = require("../../firebase-config");


async function uploadFileToFirebaseStorage(filename) {

  const path = `./public/${filename}`;

  try {
    await bucket.upload(path, {
      destination: `files/${filename}`
    });

    const [url] = await bucket.file(`files/${filename}`).getSignedUrl({
      action: "read",
      expires: "03-17-2025"
    });

    fs.unlink(path, (err) => {
      if (err) {
        console.error(err);
        return;
      }
    });
    return url;
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


module.exports = {
  uploadFileToFirebaseStorage,
  deleteFirebaseStorage
};
