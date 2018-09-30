import io from 'socket.io-client'


//window.room = prompt("Enter room name:");

var socket = io.connect();


var isInitiator;

socket.on.call(this,'created', function(room, clientId) {
  this.isInitiator = true;
});

socket.on('full', function(room) {
  console.log('Message from client: Room ' + room + ' is full :^(');
});

socket.on('ipaddr', function(ipaddr) {
  console.log('Message from client: Server IP address is ' + ipaddr);
});

socket.on.call(this,'joined', function(room, clientId) {
  this.isInitiator = false;
});

socket.on('log', function(array) {
  console.log.apply(console, array);
});

socket.on.call(this,'message', function(message) {
  console.log('Client received message:', message);
  
  if (message === 'got user media') {
    this.maybeStart();
  } else if (message.type === 'offer') {
    if (!isInitiator && !isStarted) {
      this.maybeStart();
    }
    this.pc.setRemoteDescription(new RTCSessionDescription(message));
    this.doAnswer();
  } else if (message.type === 'answer' && isStarted) {
    this.pc.setRemoteDescription(new RTCSessionDescription(message));
  } else if (message.type === 'candidate' && isStarted) {
    var candidate = new RTCIceCandidate({
      sdpMLineIndex: message.label,
      candidate: message.candidate
    });
    this.pc.addIceCandidate(candidate);
  } else if (message === 'bye' && isStarted) {
    this.handleRemoteHangup();
  }
})


///////



export default socket
