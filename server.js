const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const bodyParser = require('body-parser');

app.use(express.static(__dirname + '/public'));

var urlencodedParser = bodyParser.urlencoded({extended: false});
var jsonParser = bodyParser.json();

var defaultNames = ["Bob", "Alice", "John", "Jane", "Charlie", "Dakota", "River"];
var takenNames = [];
var colours = [];

var tmpName;
var tmpColour;
//send html doc to server
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/chat', (req, res) => {
  res.sendFile(__dirname + '/chat.html')
});

app.post('/register', urlencodedParser, (req, res) => {
  tmpName = req.body.nickname;
  tmpColour = req.body.colour;

  if (tmpName == ""){
    tmpName = defaultNames[0];
    defaultNames.shift();
  }
  res.redirect('/chat');
  
});

io.on('connection', (socket) => {
  console.log('a user connected' + socket.id);

  if (tmpName !== "" && typeof tmpName !== "undefined")
  {
    takenNames[socket.id] = tmpName;
    colours[socket.id] = tmpColour;
    tmpName = "";
    io.emit('user connect', takenNames[socket.id] + " has connected.");
    io.emit('user list', takenNames[socket.id]);
    console.log(takenNames);
    console.log(colours);
  }
  

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

io.on('connection', (socket) => {
  socket.on('chat message', (message) => {
    console.log('message: ' + message);
    var details={
      name: takenNames[socket.id],
      colour: colours[socket.id],
      msg: message
    };
    io.emit('chat message', details);
  });
});


server.listen(3000, () => {
  console.log('listening on *:3000');
});