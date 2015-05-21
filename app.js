
var express = require('express'),
	app = express(),
	http = require('http').Server(app),
	path = require('path'),
	exphbs = require('express-handlebars'),
  hbsHelpers = require('./views/helpers/index.js'),
	io = require('socket.io')(http),
	fs = require('fs');

app.set('port', process.env.PORT || 8080);
app.engine('hbs', exphbs({
  defaultLayout: 'layouts/main.hbs',
  layoutsDir: 'views/',
  extname: 'hbs',
  helpers: hbsHelpers()
  }));
app.set('view engine', 'handlebars');

app.use(express.static(path.join(__dirname, 'public')));


app.get('/', function(req, res){

  fs.readFile(__dirname + '/public/data/script.json', function (err, data) {
    if (err) throw err;
    res.render('admin.hbs', JSON.parse(data));
  });
});

io.on('connection', function(socket){
  console.log("New user connected >> " + socket.handshake.address);

  socket.on('request state', function(){
    console.log('client request >> current state');
    io.emit('request state');
  });

  socket.on('current state', function(state){
    console.log('admin emit >> current state');
    io.emit('current state', state);
  });

  socket.on('update', function(state){
    console.log('admin emit >> change state');
    io.emit('update', state);
  });

  socket.on('change slide', function(num){
    console.log('admin emit >> change slide');
    io.emit('change slide', num);
  });

  socket.on('change video', function(file){
    console.log('admin emit >> change video');
    io.emit('change video', file);
  });
});

http.listen(8080, function(){
  console.log('listening on *:8080');
});