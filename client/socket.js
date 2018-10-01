import io from 'socket.io-client'
import {PeerSignalComponent} from './components'


//window.room = prompt("Enter room name:");

var socket = io.connect();


/*
socket.on('message', function(message) {
  console.log('Client received message:', message);
  
  if (message === 'got user media') {
    PeerSignalComponent.maybeStart();
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
*/

///////



export default socket
