import io from 'socket.io-client'

var socket = io.connect();

export const socketRoomInit = (roomComponent) => {

  socket.on('created', (room) => {
    console.log('Created room ' + room);
    roomComponent.isInitiator = true;
    });

  socket.on('full', (room) => {
    console.log('Room ' + room + ' is full');
    roomComponent.fullRoom()
    });

  socket.on('join', (room) => {
    console.log('Another peer made a request to join room ' + room);
    console.log('this peer is the initiator of room ' + room + '!');
    roomComponent.isChannelReady = true;
    });

  socket.on('joined', (room) => {
    console.log('joined: ' + room);
    roomComponent.isChannelReady = true;
    });

  socket.on('log', (array) => {
    console.log.apply(console, array);
    });

  socket.on('ipaddr', (ipaddr) => {
    console.log('Message from client: Server IP address is ' + ipaddr);
    });

  socket.on('message', (message) => {
    console.log('Client received message:', message);

    if (message === 'got user media') {
    roomComponent.maybeStart();
    } else if (message.type === 'offer') {
    if (!roomComponent.isInitiator && !roomComponent.isStarted) {
    roomComponent.maybeStart();
    }
    roomComponent.pc.setRemoteDescription(new RTCSessionDescription(message));
    roomComponent.doAnswer();
    } else if (message.type === 'answer' && roomComponent.isStarted) {
    roomComponent.pc.setRemoteDescription(new RTCSessionDescription(message));
    } else if (message.type === 'candidate' && roomComponent.isStarted) {
    var candidate = new RTCIceCandidate({
      sdpMLineIndex: message.label,
      candidate: message.candidate
    });
    roomComponent.pc.addIceCandidate(candidate);
    } else if (message === 'bye' && roomComponent.isStarted) {
    roomComponent.handleRemoteHangup();
    }
  })
}

export default socket
