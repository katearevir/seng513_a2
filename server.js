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

var defaultNames = ["Bob", "Alice", "John", "Jane", "Charlie", "Dakota", "River",
                    "James", "Robert", "William", "Foo", "Bar", "Ramirez", "Marin"];
var takenNames = {};
var colours = {};

var tmpName;
var tmpColour;

//send registration doc to server
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

//send chat doc to server
app.get('/chat', (req, res) => {
  res.sendFile(__dirname + '/chat.html');

});

//Register request
app.post('/register', urlencodedParser, (req, res) => {

  //Check if nickname is taken
  var taken = false;
  for (let name in takenNames){
    if (req.body.nickname.toLowerCase() === takenNames[name].toLowerCase())
      taken = true;
  }

  if (taken)
    //https://stackoverflow.com/questions/42106506/express-js-how-to-send-alert-from-express-to-client-using-res-render-not-res
    //Author: M.HUSSAIN
    res.send('<script>alert("Nickname Taken!"); window.location.href = "/"; </script>');
  else{
    tmpName = req.body.nickname;
    tmpColour = req.body.colour;
    
    console.log(tmpName);

    if (!(/\S/.test(tmpName))){
      tmpName = defaultNames[0];
      defaultNames.shift();
    }
    res.redirect('/chat');
  }
  
});

io.on('connection', (socket) => {
  console.log('a user connected ' + socket.id);

  //if name is valid, put in takenNames dictionary and emit user list
  if (tmpName !== "" && typeof tmpName !== "undefined")
  {
    takenNames[socket.id] = tmpName;
    colours[socket.id] = tmpColour;
    tmpName = "";
    io.emit('user connect', takenNames[socket.id]);
    socket.emit('user colour connect', colours[socket.id]);
    io.emit('user list', takenNames);
  }

  //if page is refreshed in localhost:3000/chat, take user to registration page
  if (!takenNames.hasOwnProperty(socket.id)){
    var redir = '/';
    socket.emit('register', redir);
  }
  
  //if page is disconnected, delete name in dictionary, emit user list
  socket.on('disconnect', () => {
    delete takenNames[socket.id];
    io.emit('user list', takenNames);
    console.log('user disconnected');
    console.log(takenNames);
  });
});

io.on('connection', (socket) => {
  
  //Listen for colour change
  socket.on('colour change', (colour) => {
    colours[socket.id] = colour;
  });

  socket.on('chat message', (message) => {

    //Listen for colour change
    splitMsg = message.split(" ");
    if (splitMsg[0] === "/nick" && splitMsg[1] !== "undefined"){
      var taken = false;
      for (let name in takenNames){
        if (splitMsg[1].toLowerCase() === takenNames[name].toLowerCase())
        taken = true;
      }
      if (!taken)
      {
        takenNames[socket.id] = splitMsg[1];
        io.emit('user list', takenNames);
      }     
    }
    else {
      var date = new Date();
      var h = date.getHours();
      var m = date.getMinutes();
      var details={
        name: takenNames[socket.id],
        colour: colours[socket.id],
        date: h + ":" + m,
        msg: message
      };
      io.emit('chat message', details);
    }
    
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});