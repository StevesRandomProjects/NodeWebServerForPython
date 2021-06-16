
/****** CONSTANTS******************************************************/

/* if you want to run WebPort on a port lower than 1024 without running
 * node as root, you need to run following from a terminal on the pi
 * sudo apt update
 * sudo apt install libcap2-bin
 * sudo setcap cap_net_bind_service=+ep /usr/local/bin/node
 */
 
const WebPort = 80;

/* We will setup two UDP connections.  One is a comlink to another computer
 * or control system.  The other is a loopback connection to talk to
 * other programs running on the Pi.  
 */
const UdpListenPort = 3000;
const RemoteAddress1 = '192.168.18.34'
const UdpTransmitPort1 = 3000;
const RemoteAddress2 = '127.0.0.1'
const UdpTransmitPort2 = 3001;


/*************** Web Browser Communication ****************************/

var http = require('http').createServer(handler); //require http server, and create server with function handler()
var fs = require('fs'); //require filesystem module
var url = require('url');
var path = require('path');

// Start http webserver
http.listen(WebPort, function() {  // This gets call when the web server is first started.
	console.log('Server running on Port '+WebPort);
	} 
); 



// function handler is called whenever a client makes an http request to the server
// such as requesting a web page.
function handler (req, res) { 
    
    var q = url.parse(req.url, true);
    var filename = "." + q.pathname;
//    console.log('filename='+filename);
    var extname = path.extname(filename);
    if (filename=='./') {
//      console.log('retrieving default index.html file');

      filename= './index.html';
    }
    
 //   if (filename== './index.html') console.log(req);
    
    // Initial content type
    var contentType = 'text/html';
    
    // Check ext and set content type
    switch(extname) {
	case '.js':
	    contentType = 'text/javascript';
	    break;
	case '.css':
	    contentType = 'text/css';
	    break;
	case '.json':
	    contentType = 'application/json';
	    break;
	case '.png':
	    contentType = 'image/png';
	    break;
	case '.jpg':
	    contentType = 'image/jpg';
	    break;
	case '.ico':
	    contentType = 'image/png';
	    break;
    }
    

    
    fs.readFile(__dirname + '/public/' + filename, function(err, content) {
	if(err) {
	    console.log('File not found. Filename='+filename);
	    fs.readFile(__dirname + '/public/404.html', function(err, content) {
		res.writeHead(200, {'Content-Type': 'text/html'}); 
		return res.end(content,'utf'); //display 404 on error
	    });
	}
	else {
	    // Success
	    res.writeHead(200, {'Content-Type': contentType}); 
	    return res.end(content,'utf8');
	}
      
    });
}


// Execute this when web server is terminated
process.on('SIGINT', function () { //on ctrl+c
  process.exit(); //exit completely
}); 


/****** socket.io adds a websocket connection to the client's browser*********/

var io = require('socket.io','net')(http) //require socket.io module and pass the http object (server)

//  See  https://stackoverflow.com/questions/7702461/socket-io-custom-client-id
//	for how to get client session IDs.
var clients =[];  

io.sockets.on('connection', function (socket) {// WebSocket Connection
    console.log('A new client has connectioned.');
    //console.log(socket.id); // writes client ID to the console
    //clients.push(socket.id);
    var clientInfo = new Object();
    clientInfo.clientId = socket.id;
    clientInfo.logIn = false;
    clients.push(clientInfo);
    console.log(clientInfo);
    console.log(clients.length + ' clients are currently connected');
    
    Send2ComLink('{"NewClient":1}');  
    
  
    // this gets called whenever client presses a button that needs to be sent to WebServer
    socket.on('msg', function(data) { 
	Send2ComLink(data);
	//io.emit('FB', data); // Push new data to all web clients
    });


    //Whenever someone disconnects this piece of code executed
    socket.on('disconnect', function (data) {
	//console.log('A user disconnected');
	for( var i=0, len=clients.length; i<len; ++i ){
	    var c = clients[i];

	    if(c.clientId == socket.id){
		clients.splice(i,1);
		console.log("client '" + c.clientId + "' has disconnected");
		console.log(clients.length + ' clients are currently connected');
		break;
	    }
	}
    });
    
}); // End of io.sockets.on


/***************Communication to another program or device****************/

// creating a socket for remote program
// Inspiration from https://nodejs.org/dist./v6.3.0/docs/api/dgram.html
//  In order to use Linux netcat command to communicate with the socket,
// you can use either
// 	netcat -l -u 3000 
//    or
// 	sudo netcat -u 192.168.18.105 3000 -p 3000
// Be sure to let port 3000 pass your firewall

var buffer = require('buffer');
const dgram = require('dgram');
const ComLink = dgram.createSocket('udp4');


ComLink.on('error', (err) => {
  console.log(`ComLink udp socket error:\n${err.stack}`);
  ComLink.close();
});


/* This function runs when ComLink sends data to the Pi
 * Some example received data strings are
 * {"D1":0}		// digital signals
 * {"A1": 55}		// analog signals
 * {"S2": "Hello World"}// serial signals
 * */
ComLink.on('message',function(msg,info){
   
    console.log('Received %d bytes from %s:%d',msg.length, info.address, info.port);
    
    // by default, the UDP socket will receive UDP packets from any IP address
    // We will check if the device is on our approved list
    if ((info.address == RemoteAddress1) || (info.address == RemoteAddress2)) { // Confirm that it is Remote IP address is valid
//	console.log('Data received from RemoteSource='+msg+'!');
	try { // test is data can be converted to JSON format
	    var obj = JSON.parse(msg);
	} catch(error) {
	    console.log('error: '+error);
	    obj = null;
	}

	if (obj !== null) { // data is valid, go ahead and send it to client browsers
//	    console.log(obj); 
	    var data = JSON.stringify(obj);
	    console.log('Data='+data+'!');
	    io.emit('FB',data); 
	}
    }
	
    else {
	console.log('Data received from Rogue device='+msg+'!');
    }

});


ComLink.on('listening', function() {
   const address = ComLink.address(); 
   console.log(`Pi is listening to UDP Port ${address.address}:${address.port}:${address.family}`);
   console.log("Pi is transmitting on UDP Port "+RemoteAddress1+":"+UdpTransmitPort1+" and "+RemoteAddress2+":"+UdpTransmitPort2);
});

ComLink.on('close',function(){
    console.log('ComLink UDP socket is closed!');
});

ComLink.bind(UdpListenPort);


// This function is used to send data to ComLink
// While the UDP socket will accept packats from any IP address, we need
// to explictly tell node which IP addresses to transmit to.
function Send2ComLink (data) { 
    // Fi
    ComLink.send(data+"\n",UdpTransmitPort1,RemoteAddress1,function(error){
	if(error){
	    ComLink.close();
	    console.log('There was an error sending data to ComLink1');
	}else{
	    console.log('ComLink1 Data sent: '+data);
	}
    });
    ComLink.send(data+"\n",UdpTransmitPort2,RemoteAddress2,function(error){
	if(error){
	    ComLink.close();
	    console.log('There was an error sending data to ComLink2');
	}else{
	    console.log('ComLink2 Data sent: '+data);
	}
    });    
}



//example of sending multiple msg to ComLink
//var data1 = Buffer.from('msg=Webserver online');
//var data2 = Buffer.from('msg=Send your feedback');
//Send2ComLink([data1,data2]);
// ComLink wlil receive "msg=Webserver online,msg=Send your feedback"




