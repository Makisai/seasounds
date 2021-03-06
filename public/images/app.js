const express = require("express");
var cors = require("cors");
const InMemorySessionStore = require("./session_store.js");
const app = express();
app.use(express.json());
const port = 4000;
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
//const td = require("socket.io-client");
const {WebSocketServer} = require("ws");

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000"
  }
});

const WebSocket = require('ws')
const ws = new WebSocket("ws://141.22.69.32:25000"); //touch desiner wlan ip + port

//const socketTd = td("ws://127.0.0.1:6000");

const { v4: uuidv4 } = require('uuid');

let sessionStore = new InMemorySessionStore();

var corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200
}
app.use(cors(corsOptions))

let queue = [];

//digest für SocketIO
/*const digest = (socketTd) => {
  item = queue.shift();
  setTimeout(() => digest(socketTd), 15000);
  if (item) {
    socketTd.emit("play_sound" , item.soundName);
    console.log(`digest: ${item.soundName} from ${item.id}`);
  }
};
digest(socketTd);*/

const digest = (WebSocket) => {
  item = queue.shift();
  setTimeout(() => digest(WebSocket), 15000);
  if (item) {
    console.log(`digest: ${item.soundName} from ${item.id}`);
    ws.send(item.soundName);
  }
};
digest(WebSocket);

io.use((socket, next) => {
  const sessionID = socket.handshake.auth.sessionID;
  if(sessionID) {
    //find existing session
    const session = sessionStore.findSession(sessionID);
    console.log("Session found:", session)
    if(session) {
      socket.sessionID = sessionID;
      socket.userID = session.userID;
      console.log(session.userID)
      return next();
    }
  }
  //create new session
  socket.sessionID = uuidv4();
  socket.userID = uuidv4();
  console.log(socket.userID);
  next();
});


//send session details to user
io.on('connection', (socket) => {
  console.log('a user connected');
  sessionStore.saveSession(socket.sessionID, {
    userID: socket.userID,
    connected: true,
  });

  socket.emit("session", {
    sessionID: socket.sessionID,
    userID: socket.userID,
  });

  socket.on("add_to_queue", (id, soundName) => {
    queue.push({ id: id, soundName: soundName });
    console.log(id,soundName);
    socket.emit("position", queue.length);
  })
});

/*app.get("/api/queue/check", (req, res) => {
  if (req.query && req.query.id) {
    position = queue.findIndex((item) => item.id == req.query.id);
    if (position < 0) {
      res.status(404).json({
        success: true,
        status: 404,
        position: -1,
        message: "user has no item in queue",
      });
    } else {
      res.json({
        success: true,
        status: 200,
        position: position + 1
      });
    }
  } else {
    res.status(400).json({
      success: false,
      status: 400,
      message: "id is missing",
    });
  }
});

app.post("/api/add-to-queue", (req, res) => {
  if (req.body && req.body.id && req.body.soundName) {
    position = queue.findIndex((item) => item.id == req.body.id);
    if (position < 0) {
      queue.push({ id: req.body.id, soundName: req.body.soundName });
      res.status(201).json({
        success: true,
        status: 201,
        position: queue.length,
        message: "item enqueued",
      });
    } else {
      res.json({
        success: false,
        status: 200,
        position: position,
        message: "user already has something in da queue",
      });
    }
  } else {
    res.status(400).json({
      success: false,
      status: 400,
      message: "id or soundName is missing",
    });
  }
});

app.delete("/api/queue/clear", (req, res) => {
  queue = [];
  res.status(204).send();
});

app.post("/api/queue/add-priority", (req, res) => {
  if (req.body && req.body.id && req.body.soundName) {
    position = queue.findIndex((item) => item.id == req.body.id);
    if (position < 0) {
      queue.unshift({ id: req.body.id, soundName: req.body.soundName });
      res.status(201).json({
        success: true,
        status: 201,
        position: 1,
        message: "item enqueued",
      });
    } else {
      res.json({
        success: false,
        status: 200,
        position: position,
        message: "user already has something in da queue",
      });
    }
  } else {
    res.status(400).json({
      success: false,
      status: 400,
      message: "id or soundName is missing",
    });
  }
});
*/
server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
