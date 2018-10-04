import React from 'react'
import {Redirect} from 'react-router'
import socket, {socketRoomInit} from '../socket'
import { withStyles } from '@material-ui/core/styles'
import {servers} from '../data'

const styles = {
  video: {
    height: 150, 
    width: 200,
  },
  local: {
    borderStyle: 'solid',
    borderColor: 'red',
  },
  remote: {
    borderStyle: 'solid',
    borderColor: 'black',
  }
};

const sendMessage = (message) => {
  console.log('Client sending message: ', message);
  socket.emit('message', message);
}

class PeerSignalComponent extends React.Component{
  constructor(props){
    super(props)

    this.localStream = undefined
    this.remoteStream = undefined
    this.sendChannel = undefined

    this.pc = undefined

    this.isChannelReady = false;
    this.isInitiator = false;
    this.isStarted = false;
    this.turnReady = false;
    this.dataConstraint = null;

    this.state = {
      roomId: props.match.params.roomId,
      redirectFullRoom: false,
      textBox: '',
      receiveValues: [],
      disabled: {
        textBox: true,
        sendButton: true, 
        startButton: false,
        closeButton: true,
      }
    }

    this.refLocalVideo = React.createRef()
    this.refRemoteVideo = React.createRef()
    this.refTextBox = React.createRef()

    this.mediaConstraints = {
      audio: true,
      video: true,
    }

    this.sdpConstraints = {
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    };

    if (location.hostname !== 'localhost') {
      this.requestTurn(
        'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
      );
    }
    socketRoomInit(this)
    this.joinRoom()
  }

  openConnection = async () => {
    this.getUserMedia()

    this.localStream = await navigator.mediaDevices.getUserMedia(this.mediaConstraints)
    sendMessage('got user media');
    this.refLocalVideo.current.srcObject = this.localStream

    if (this.Initiator) {
      this.maybeStart();
    }

    this.setState({
      disabled: {
        ...this.state.disabled, 
        textBox: false,
        sendButton : false,
        startButton : true,
        closeButton : false,
      }
    })
  }

  maybeStart = () => {
    console.log('>>>>>>> maybeStart() ', this.isStarted, this.localStream, this.isChannelReady);
    if (!this.isStarted && typeof this.localStream !== 'undefined' && this.isChannelReady) {
      console.log('>>>>>> creating peer connection');
      this.createPeerConnection();
      this.pc.addStream(this.localStream);
      this.isStarted = true;
      console.log('isInitiator', this.isInitiator);
      if (this.isInitiator) {
        this.doCall();
      }
    }
  }
  
  createPeerConnection = () => {
    try {
      this.pc = new RTCPeerConnection(null);
      this.sendChannel = this.pc.createDataChannel('sendDataChannel', this.dataConstraint)

      this.pc.onicecandidate = this.handleIceCandidate;
      this.pc.ondatachannel  = this.receiveChannelCallback;

      this.pc.onaddstream    = this.handleRemoteStreamAdded;
      this.pc.onremovestream = this.handleRemoteStreamRemoved;
    } catch (e) {
      alert('Cannot create RTCPeerConnection object.');
      return;
    }
  }

  doCall = () => {
    this.pc.createOffer(this.setLocalAndSendMessage, this.handleCreateOfferError);
  }

  onSendChannelStateChange = () => {
    var readyState = this.sendChannel.readyState;
    if (readyState === 'open') {
      this.setState({
        disabled: {
          textBox : false,
          sendButton : false,
          closeButton : false,
        }
      })
      this.refTextBox.current.focus();
    } else {
      this.setState({
        disabled: {
          textBox     : true,
          sendButton  : true,
          closeButton : true,
        }
      })
    }
  }


  closeDataChannels = () => {
    this.sendChannel.close();
    this.receiveChannel.close();
    this.localPC.close();
    this.remotePC.close();
    this.localPC = null;
    this.remotePC = null;

    this.localStream = null
    this.refLocalVideo.current.srcObject = this.localStream
    this.hangup()

    this.setState({
      textBox: '',
      receiveValues: [],
      disabled: {
        ...this.state.disabled, 
        textBox : false,
        startButton : false,
        sendButton  : true,
        closeButton : true,
      }
    })
  }

  sendData = () => {
    console.log('this.state.textBox is: ', this.state.textBox)
    const data = this.state.textBox
    this.sendChannel.send(data);
  }


  doAnswer = () => {
    console.log('Sending answer to peer.');
    this.pc.createAnswer().then(
      this.setLocalAndSendMessage,
      this.onCreateSessionDescriptionError
    );
  }


  receiveChannelCallback = (event) => {
    this.receiveChannel           = event.channel;
    this.receiveChannel.onmessage = this.onReceiveMessageCallback;
    this.receiveChannel.onopen    = this.onReceiveChannelStateChange;
    this.receiveChannel.onclose   = this.onReceiveChannelStateChange;
  }

  onReceiveMessageCallback = (event) => {
    this.setState({
      textBox: '',
      receiveValues: [...this.state.receiveValues, event.data]
    })
  }

  handleIceCandidate = (event) => {
    console.log('icecandidate event: ', event);
    if (event.candidate) {
      sendMessage({
        type: 'candidate',
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate
      });
    } else {
      console.log('End of candidates.');
    }
  }

  handleRemoteStreamAdded = (event) => {
    console.log('Remote stream added.');
    this.remoteStream = event.stream;
    this.refRemoteVideo.current.srcObject = this.remoteStream;
  }

  handleRemoteStreamRemoved = (event) => {
    console.log('Remote stream removed. Event: ', event);
  }

  handleCreateOfferError = (event) => {
    console.log('createOffer() error: ', event);
  }

  requestTurn = (turnURL) => {
    var turnExists = false;
    for (let i in servers.iceServers) {
      if (servers.iceServers[i].urls.substring(0, 5) === 'turn:') {
        turnExists = true;
        this.turnReady = true;
        break;
      }
    }
    if (!turnExists) {
      console.log('Getting TURN server from ', turnURL);
      // No TURN server. Get one from computeengineondemand.appspot.com:
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
          var turnServer = JSON.parse(xhr.responseText);
          console.log('Got TURN server: ', turnServer);
          servers.iceServers.push({
            'urls': 'turn:' + turnServer.username + '@' + turnServer.turn,
            'credential': turnServer.password
          });
          this.turnReady = true;
        }
      };
      xhr.open('GET', turnURL, true);
      xhr.send();
    }
  }

  setLocalAndSendMessage = (sessionDescription) => {
    this.pc.setLocalDescription(sessionDescription);
    console.log('setLocalAndSendMessage sending message', sessionDescription);
    sendMessage(sessionDescription);
  }

  onCreateSessionDescriptionError = (error) => {
    trace('Failed to create session description: ' + error.toString());
  }

  hangup = () => {
    console.log('Hanging up.');
    this.stop();
    sendMessage('bye');
    this.isInitiator = false;
  }
  
  stop = () => {
    this.isStarted = false;
    this.pc.close();
    this.pc = null;
  }

  showThis = () => {
    console.log('this is ', this)
  }

  joinRoom = () => {
    console.log('Message from client: Asking to join room ' + this.state.roomId);
    socket.emit('create or join', this.state.roomId);
  }

  fullRoom = () => {
    this.setState({redirectFullRoom: 'true'})
  }

  handleChange = (event) => {
    this.setState({
      [event.target.name] : event.target.value
    })
  }


  render(props){
    const { classes } = this.props
    const {redirectFullRoom, roomId} = this.state

    if(redirectFullRoom){
      return <Redirect to={{
        pathname: '/',
        state: {fromRoom: `${roomId}`}
        }}
      />
    }
    return(
      <div>
        <h1>
          Room: {roomId}
        </h1>

        <div>
          <video ref={this.refLocalVideo} autoPlay muted className={`${classes.video} ${classes.local}`} /> 
          <video ref={this.refRemoteVideo} autoPlay muted className={`${classes.video} ${classes.remote}`} /> 
        </div>

        <form >
           <label >
             chat:
             <input name="textBox" ref={this.refTextBox} type="text" disabled={this.state.disabled.textBox} value={this.state.textBox} onChange={this.handleChange} />
           </label>
           <button id="sendButton"  disabled={this.state.disabled.sendButton} onClick ={this.sendData} >Send</button>
        </form>
        <div>
        {
          this.state.receiveValues.map(value => <h5> {value} </h5>)
        }
        </div>

        <button onClick={this.showThis}>
          console log this
        </button>

        <div id="buttons">
          <button id="startButton" disabled={this.state.disabled.startButton} onClick ={this.openConnection} >Start</button>
          <button id="closeButton" disabled={this.state.disabled.closeButton} onClick ={this.closeDataChannels} >Stop</button>
        </div>
      </div>
    )
  }

}

export default withStyles(styles)(PeerSignalComponent)
