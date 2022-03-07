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

var defaultNames = ["Bob", "Alice", "John", "Jane"];
var takenNames = [];

var tmp;
//send html doc to server
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/chat', (req, res) => {
  res.sendFile(__dirname + '/chat.html')
});

app.post('/register', urlencodedParser, (req, res) => {
  tmp = req.body.nickname;
  takenNames.push(tmp);
  console.log(takenNames);

  res.redirect('/chat');
});

io.on('connection', (socket) => {
    console.log('a user connected');
    io.emit('chat message', tmp + " has connected.");
    //io.emit('chat message', socket.id + " has connected.");
    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
  });
  
  io.on('connection', (socket) => {
    socket.on('chat message', (msg) => {
      console.log('message: ' + msg);
      io.emit('chat message', msg);
    });
  });

server.listen(3000, () => {
  console.log('listening on *:3000');
});