const multer = require('multer');

// Configurez le stockage avec Multer pour le plan
const storagePlan = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public'); // Spécifiez le répertoire de stockage pour les plans
  },
  filename: function (req, file, cb) {
    const extension = file.originalname.split('.').pop();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '.' + extension);
  },
});
// Configurez le stockage avec Multer pour l'image (base64)
const storageImage = multer.memoryStorage();
const uploadPlan = multer({ storage: storagePlan });
const uploadImage = multer({ storage: storageImage });
module.exports = { uploadPlan, uploadImage };


