import React from 'react'
import { withStyles } from '@material-ui/core/styles';

const styles = {
  video: {
    height: 200, 
    width: 300,
  }
};

class VideoChatB extends React.Component {
  constructor(props){
    super(props)

    this.localStream = null
    this.remoteStream = null

    this.refLocalVideo = React.createRef()
    this.refRemoteVideo = React.createRef()

    this.refPeerVideo = React.createRef()
    this.getUserMedia = this.getUserMedia.bind(this)
    this.mediaConstraints = {
      audio: true,
      video: true,
    }

    this.servers = {
      iceServers: [{ url: 'stun:stun.l.google.com:19302' }]
    }
  }

  async getUserMedia(){
    try{
      this.localStream = await navigator.mediaDevices.getUserMedia(this.mediaConstraints)
      this.refLocalVideo.current.srcObject = this.localStream
    }catch(err){
      console.error(err)
    }
  }

  toggleLocalStream = () => {
    if(this.localStream){
      this.localStream = null
      this.refLocalVideo.current.srcObject = this.localStream
    }else{
      this.getUserMedia()
    }
  }

  handleConnection = (event) => {
    const peerConnection = event.target;
    const iceCandidate = event.candidate;

    if (iceCandidate) {
      const newIceCandidate = new RTCIceCandidate(iceCandidate);
      const otherPeer = this.getOtherPeer(peerConnection);

      otherPeer.addIceCandidate(newIceCandidate)
    }
  }
  
  getOtherPeer = (peerConnection) => {
    return (peerConnection === this.localPeerConnection) ?
        this.remotePeerConnection : this.localPeerConnection;
  }

  handleConnectionChange = (event) => {
    const peerConnection = event.target;
  }


  gotRemoteMediaStream = (event) => {
    const mediaStream = event.stream;
    this.refRemoteVideo.current.srcObject = mediaStream;
    this.remoteStream = mediaStream;
  }

  callAction = () => {
    const servers = this.servers

    this.localPeerConnection = new RTCPeerConnection(servers)

    this.localPeerConnection.addEventListener('icecandidate', this.handleConnection);
    this.localPeerConnection.addEventListener('iceconnectionstatechange', this.handleConnectionChange);


    this.remotePeerConnection = new RTCPeerConnection(servers);

    this.remotePeerConnection.addEventListener('icecandidate', this.handleConnection);
    this.remotePeerConnection.addEventListener('iceconnectionstatechange', this.handleConnectionChange);
    this.remotePeerConnection.addEventListener('addstream', this.gotRemoteMediaStream);
    

    // Add local stream to connection and create offer to connect.
    this.localPeerConnection.addStream(this.localStream);

    const offerOptions = {
      offerToReceiveVideo: 1,
    }

    this.localPeerConnection.createOffer(offerOptions)
      .then(this.createdOffer)
  }


  // Logs offer creation and sets peer connection session descriptions.
  createdOffer = (description) => {
  
    this.localPeerConnection.setLocalDescription(description)
 
    this.remotePeerConnection.setRemoteDescription(description)
 
    this.remotePeerConnection.createAnswer()
      .then(this.createdAnswer)
  }


  createdAnswer = (description) => {
  
    this.remotePeerConnection.setLocalDescription(description)
  
    this.localPeerConnection.setRemoteDescription(description)
  }

  
  hangupAction() {
    this.localPeerConnection.close();
    this.remotePeerConnection.close();
    this.localPeerConnection = null;
    this.remotePeerConnection = null;
  }


  render(){
    const { classes } = this.props
    return(
      <div >
        hello
        <div>
          <video autoPlay ref={this.refLocalVideo} className={classes.video}/>
          <video autoPlay ref={this.refRemoteVideo} className={classes.video}/>
        </div>
        <button onClick={this.toggleLocalStream}>
          stream
        </button>

        <button onClick={this.callAction}>
          connect to peer
        </button>

        <button onClick={this.hangupAction}>
          hangupCall
        </button>

        hello
      </div>
    )
  }
}

export default withStyles(styles)(VideoChatB)
