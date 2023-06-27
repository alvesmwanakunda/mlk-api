const multer = require("multer");
var storage = multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,'./public/');
    },
    filename:(req,file,cb)=>{
        cb(null,file.originalname);
    }
});
var uploadClient = multer({
    storage:storage
  });
  var uploadEntreprise = multer({
     storage:storage
  });
  module.exports = uploadClient;
  module.exports = uploadEntreprise;