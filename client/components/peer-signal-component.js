import React from 'react'
import {Redirect} from 'react-router'
import socket, {socketRoomInit} from '../socket'
import { withStyles } from '@material-ui/core/styles'
import {servers} from '../data'

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  videoContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
  },
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
    this.dataChannel = undefined

    this.pc = undefined

    this.isChannelReady = false;
    this.isInitiator = false;
    this.isStarted = false;
    this.turnReady = false;
    this.dataConstraint = null;

    this.state = {
      roomId: props.match.params.roomId,
      redirectFullRoom: false,
      chatBox: '',
      receiveValues: [],
      disabled: {
        chatBox: true,
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
    this.mediaStartAndInitiate()
  }

  mediaStartAndInitiate = async () => {
    this.localStream = await navigator.mediaDevices.getUserMedia(this.mediaConstraints)
    sendMessage('got user media');
    this.refLocalVideo.current.srcObject = this.localStream

    if (this.Initiator) {
      this.maybeStart();
    }
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

      this.pc.onicecandidate = this.handleIceCandidate;
      this.pc.onaddstream    = this.handleRemoteStreamAdded;
      this.pc.onremovestream = this.handleRemoteStreamRemoved;

      this.dataChannel = this.pc.createDataChannel('sendDataChannel', this.dataConstraint)
      this.dataChannel.onmessage = this.onSendMessageCallback;
      this.dataChannel.onopen = this.onDataChannelStateChange;
      this.dataChannel.onclose = this.onDataChannelStateChange;

      this.pc.ondatachannel  = this.dataChannelCallback;
    } catch (e) {
      alert('Cannot create RTCPeerConnection object.');
      return;
    }
  }

  onDataChannelStateChange = () => {
    var readyState = this.dataChannel.readyState;
    if (readyState === 'open') {
      this.setState({
        disabled: {
          chatBox : false,
          sendButton : false,
          closeButton : false,
        }
      })
      this.refTextBox.current.focus();
    } else {
      this.setState({
        disabled: {
          chatBox     : true,
          sendButton  : true,
          closeButton : true,
        }
      })
    }
  }

  dataChannelCallback = (RTCDataChannelEvent) => {
    this.receiveChannel           = RTCDataChannelEvent.channel;
    this.receiveChannel.onmessage = this.onReceiveMessageCallback;
    this.receiveChannel.onopen    = this.onReceiveChannelStateChange;
    this.receiveChannel.onclose   = this.onReceiveChannelStateChange;
  }


  onSendMessageCallback = (event) => {
    console.log(event.data)
  }

  onReceiveMessageCallback = (event) => {
    this.setState({
      receiveValues: [...this.state.receiveValues, event.data]
    })
  }

  onReceiveChannelStateChange = () => {
    const readyState = this.receiveChannel.readyState;
  }


  closePeerConnection = () => {
    this.localStream = null
    this.refLocalVideo.current.srcObject = this.localStream
    
    this.isStarted = false;
    this.dataChannel.close();
    this.pc.close();
    this.pc = null;

    sendMessage('bye');
    this.isInitiator = false;

    this.setState({
      chatBox: '',
      receiveValues: [],
      disabled: {
        ...this.state.disabled, 
        chatBox : false,
        startButton : false,
        sendButton  : true,
        closeButton : true,
      }
    })
  }

  sendChatMessage = () => {
    
    if(this.state.texxtBox !== ""){
      const data = this.state.chatBox
      this.dataChannel.send(data);
      this.setState({
        chatBox: '',
        receiveValues: [...this.state.receiveValues, this.state.chatBox]
      })
    }
  }

  doCall = () => {
    this.pc.createOffer(this.setLocalAndSendMessage, this.handleCreateOfferError);
  }

  doAnswer = () => {
    console.log('Sending answer to peer.');
    this.pc.createAnswer().then(
      this.setLocalAndSendMessage,
      this.onCreateSessionDescriptionError
    );
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

  handleChatSubmit = (event) => {
    event.preventDefault()
    this.sendChatMessage()
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
      <div className={classes.root}>
        <h1>
          Room: {roomId}
        </h1>

        <div className={classes.videoContainer}>
          <video ref={this.refLocalVideo} autoPlay muted className={`${classes.video} ${classes.local}`} /> 
          <video ref={this.refRemoteVideo} autoPlay muted className={`${classes.video} ${classes.remote}`} /> 
        </div>

        <form onSubmit={this.handleChatSubmit}>
           <label >
             chat:
             <input name="chatBox" ref={this.refTextBox} type="text" disabled={this.state.disabled.chatBox} value={this.state.chatBox} onChange={this.handleChange} />
           </label>
           <input value="send" type="submit" disabled={this.state.disabled.chatBox} />
        </form>
        <div>
        {
          this.state.receiveValues.map(value => <h5> {value} </h5>)
        }
        </div>

        <div id="buttons">
          <button id="closeButton" disabled={this.state.disabled.closeButton} onClick ={this.closePeerConnection} >Stop</button>
        </div>
      </div>
    )
  }

}

export default withStyles(styles)(PeerSignalComponent)
