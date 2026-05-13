/*const express = require('express');
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
const { WebSocketServer } = require('ws');
const speech = require('@google-cloud/speech');
const http = require('http');

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

// Client Google Speech
const client = new speech.SpeechClient({
  keyFilename: 'mlka-speech-to-text-service.json',
});

// Serveur WebSocket
const wss = new WebSocketServer({ port: 8080 });
wss.on('connection', (ws) => {
  console.log('🎙️ Client connecté');
  let recognizeStream = null;

  function startRecognitionStream() {
    recognizeStream = client
      .streamingRecognize({
        config: {
          encoding: 'LINEAR16',
          sampleRateHertz: 44100,
          languageCode: 'fr-FR',
          enableAutomaticPunctuation: true,
        },
        interimResults: true,
      })
      .on('error', (err) => {
        console.error('❌ Erreur Google Speech:', err);
        stopRecognitionStream();
      })
      .on('data', (data) => {
        const transcript = data.results[0]?.alternatives[0]?.transcript;
        if (transcript) {
          ws.send(JSON.stringify({
            transcript,
            isFinal: data.results[0].isFinal
          }));
        }
      });
  }

  function stopRecognitionStream() {
    if (recognizeStream && !recognizeStream.destroyed) {
      recognizeStream.end();
      recognizeStream = null;
    }
  }

  startRecognitionStream();

  ws.on('message', (msg) => {
    // ✅ Vérifie que le flux existe et n’est pas détruit
    if (recognizeStream && !recognizeStream.destroyed) {
      recognizeStream.write(msg);
    }
  });

  ws.on('close', () => {
    console.log('🔌 Client déconnecté');
    stopRecognitionStream();
  });

  ws.on('error', (err) => {
    console.error('❌ WS error:', err);
    stopRecognitionStream();
  });
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

  
}*/
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const node_acl = require('acl');
const roles = require("./api/models/roles.model");
const Files = require("./files");
const compression = require("compression");
const jwt = require('jsonwebtoken');
const Encryption = require('./utils/Encryption');
const config = require('./config');
const path = require('path');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const speech = require('@google-cloud/speech');
const http = require('http');

// Chargement variables d’environnement
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

//const port = process.env.PORT || 8100;
const port = process.env.PORT||5002;
const MONGO_URL = process.env.MONGODB_URI;
const acl = new node_acl(new node_acl.memoryBackend());

// Connexion MongoDB
mongoose.Promise = global.Promise;
mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("✅ Connected to MongoDB");
    return roles.find({}).exec();
  })
  .then(roles => {
    acl.allow(roles);
    initApp();
  })
  .catch(error => {
    console.log(`❌ MongoDB connection error: ${error}`);
    process.exit(1);
  });

// Client Google Speech
const client = new speech.SpeechClient({
  keyFilename: 'mlka-speech-to-text-service.json',
});

function initApp() {
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json({ limit: "50mb" }));
  app.use(compression());
  app.use(express.json({ extended: false }));
  app.use(cors());
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.json({ limit: '50mb' }));

  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "token, Content-Type, X-Requested-With, x-user-language");
    res.setHeader("Access-Control-Allow-Credentials", true);
    if (req.method === "OPTIONS") return res.sendStatus(200);
    next();
  });

  app.get('/', (req, res) => res.send('Koonda API ready 🚀'));

  app.use((req, res, next) => {
    const token = req.headers.token;
    if (token) {
      jwt.verify(token, config.certif, async (err, decoded) => {
        if (err) {
          return res.status(401).json({
            success: false,
            message: 'Failed to authenticate token.'
          });
        } else {
          req.decoded = decoded;
          global.infosUser = decoded;
          acl.addUserRoles(req.decoded.id, Encryption.decrypt(req.decoded.role));
          next();
        }
      });
    } else {
      req.decoded = { id: "guest" };
      acl.addUserRoles(req.decoded.id, "guest");
      next();
    }
  });

  // Charger les routes
  const routesDir = path.join(__dirname, 'api/routes');
  const routeFiles = Files.walk(routesDir);
  routeFiles.forEach(routeFile => {
    if (routeFile.endsWith('.js')) {
      const routePath = path.resolve(routeFile);
      const routeModule = require(routePath);
      routeModule(app, acl);
    }
  });

  // Création du serveur HTTP
  const server = http.createServer(app);
  server.listen(port, () => {
    console.log(`🚀 HTTP Server running on port ${port}`);
  });

  // 🧠 WebSocket lié au serveur HTTP (compat AlwaysData)
  const wss = new WebSocketServer({ server });
  wss.on('connection', (ws) => {
  console.log('🎙️ Client connecté');
  let recognizeStream = null;

  function startRecognitionStream() {
    recognizeStream = client
      .streamingRecognize({
        config: {
          encoding: 'LINEAR16',
          sampleRateHertz: 44100,
          languageCode: 'fr-FR',
          enableAutomaticPunctuation: true,
        },
        interimResults: true,
      })
      .on('error', (err) => {
        console.error('❌ Erreur Google Speech:', err);
        stopRecognitionStream();
      })
      .on('data', (data) => {
        const transcript = data.results[0]?.alternatives[0]?.transcript;
        if (transcript) {
          ws.send(JSON.stringify({
            transcript,
            isFinal: data.results[0].isFinal
          }));
        }
      });
  }

  function stopRecognitionStream() {
    if (recognizeStream && !recognizeStream.destroyed) {
      recognizeStream.end();
      recognizeStream = null;
    }
  }

  startRecognitionStream();

  ws.on('message', (msg) => {
    // ✅ Vérifie que le flux existe et n’est pas détruit
    if (recognizeStream && !recognizeStream.destroyed) {
      recognizeStream.write(msg);
    }
  });

  ws.on('close', () => {
    console.log('🔌 Client déconnecté');
    stopRecognitionStream();
  });

  ws.on('error', (err) => {
    console.error('❌ WS error:', err);
    stopRecognitionStream();
  });
});

  

  // Socket.io si besoin
  const io = require('socket.io')(server, { cors: { origin: '*' } });
  global.io = io;
  io.on('connection', (socket) => {
    global.socket = socket;
    console.log("⚡ Socket.io prêt");
  });
}

