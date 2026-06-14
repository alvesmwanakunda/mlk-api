const multer = require("multer");
const planUploadJobService = require("../api/services/planUploadJob.service");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

module.exports = multer({
  storage,
  limits: {
    fileSize: planUploadJobService.MAX_PLAN_FILE_SIZE,
  },
});
