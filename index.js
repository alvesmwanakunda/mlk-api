const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const node_acl = require('acl');
const roles = require("./api/models/roles.model");
const Files = require("./files");
const compression = require("compression");
var jwt = require('jsonwebtoken');
const Encryption = require('./utils/Encryption');
const config = require('./config');
var path = require('path');
const cors = require('cors');

/*var admin = require("firebase-admin");

var serviceAccount = require("path/to/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.BUCKET_URL
});*/



if(process.env.NODE_ENV !=="production"){
    require("dotenv").config();
}
const port = process.env.PORT||5000;
const MONGO_URL = process.env.MONGODB_URI;
var acl = new node_acl(new node_acl.memoryBackend());
mongoose.Promise = global.Promise;
mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to MongoDB");
    return roles.find({}).exec(); // Utilise exec() pour renvoyer une promesse
  })
  .then(roles => {
    acl.allow(roles);
    initApp();
  })
  .catch(error => {
    console.log(`MongoBD connection error: ${error}`);
    process.exit(1);
  });

function initApp(){
    app.use(
        bodyParser.urlencoded({
            extended:true
        })
    );
    app.use(
        bodyParser.json({
            limit:"50mb"
        })
    );
    app.use(compression());
    app.use(express.json({extended:false}));
    app.use(cors());
    app.use(express.static(path.join(__dirname,'public')));
    app.use(express.json({limit:'50mb'}));

    app.use(function(req,res,next){
        res.setHeader("Acces-Control-Allow-Origin","*");
        res.setHeader("Access-Control-Allow-Methods","GET, POST, OPTIONS, PUT, PATCH, DELETE");
        res.setHeader("Access-Control-Allow-Headers","token, Content-Type, X-Requested-With");
        res.setHeader("Access-Control-Allow-Credentials", true);
        if (req.method == "OPTIONS") return res.sendStatus(200);
        next();
    });
    app.get('/', (req, res)=> res.send('Koonda API ready'));  

    app.use(function(req,res,next){
    var token =  req.headers.token;
    if(token){
      jwt.verify(token,config.certif, async function(err, decoded){
        //console.log("decoded", decoded);
        if(err){
          return res.status(401).json({
            successs:false,
            message: 'Failed to authenticate token.'
          });
        }else{
          req.decoded = decoded;
          global.infosUser = decoded;
          acl.addUserRoles(req.decoded.id, Encryption.decrypt(req.decoded.role));
          next();
        }
      });
    } else {
      req.decoded = {
        id: "guest"
      };
      acl.addUserRoles(req.decoded.id, "guest");
      next();
    }
  }); 

  const routesDir = path.join(__dirname, 'api/routes');
  const routeFiles = Files.walk(routesDir);
  //Charger les modules de route

  routeFiles.forEach(routeFile=>{
    if(routeFile.endsWith('.js')){
      const routePath = path.resolve(routeFile);
      const routeModule = require(routePath);
      routeModule(app,acl);
    }
  })

  var server = app.listen(port,()=>{
    console.log(`Now listening on port ${port}`);
  });
  // Socket io
  var io = require('socket.io')(server,{
    cors:{origin:'*'}
  });
  global.io = io;
  io.on('connection', (socket)=>{
    global.socket=socket;
    console.log("Socket run");
  })
}

