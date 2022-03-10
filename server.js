const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const bodyParser = require('body-parser');

app.use(express.static(__dirname + '/public'));

var urlencodedParser = bodyParser.urlencoded({extended: false});

var defaultNames = ["Bob", "Alice", "John Doe", "Jane Doe", "Charlie", "Dakota", "River",
                    "James", "Robert", "William", "Foo", "Bar", "Ramirez", "Marin",
                    "Anon", "Space", "Mouse", "Alpha", "Apple", "Orange", "Zed",
                    "De Fault", "Running Out", "Oh No", "Last One"];
var takenNames = {};
var colours = {};
var chatHist = {};
var indexHist = 0;

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

    //if name is empty
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

    //put in chat history
    var details={
      name: takenNames[socket.id],
      colour: "#000000",
      date: "",
      msg: " has connected."
    };
    chatHist[indexHist] = details;
    indexHist++;
    
    //https://stackoverflow.com/questions/53073626/how-to-send-an-array-through-socket-io (initally had array, changed to dictionary)
    //Author: Baboo
    io.emit('chat message', chatHist);

    socket.emit('user colour connect', colours[socket.id]); //send user's colour choice when first connected 
    io.emit('user list', takenNames); //update user list
    io.emit('chat message', chatHist); //update chat history
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

  //Listen for chat messages
  socket.on('chat message', (message) => {

    //change nickname (format: /nick name)
    //https://stackoverflow.com/questions/10272773/split-string-on-the-first-white-space-occurrence
    //Author: Trott
    var command = message.substring(0, message.indexOf(' '));
    var newName = message.substring(message.indexOf(' ') + 1);

    if (command === "/nick" && !(/\S/.test(tmpName))){
      var taken = false;
      for (let name in takenNames){
        if (newName.toLowerCase() === takenNames[name].toLowerCase())
        taken = true;
      }
      if (!taken)
      {
        takenNames[socket.id] = newName;
        io.emit('user list', takenNames); //update user list
      }     
    }
    else {
      //get date of chat msg
      var date = new Date();
      var h = date.getHours();
      var m = date.getMinutes();
      if (h < 10){
        h = "0" + h;
      }
      if (m < 10){
        m = "0" + m;
      }

      //put in chat history
      var details={
        name: takenNames[socket.id],
        colour: colours[socket.id],
        date: h + ":" + m,
        msg: message
      };

      chatHist[indexHist] = details;
      indexHist++;
      io.emit('chat message', chatHist);
    }
    
  });
});

//Listen on port 3000
server.listen(3000, () => {
  console.log('listening on *:3000');
});