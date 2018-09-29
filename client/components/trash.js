class VideoChat extends React.Component {

  handleVideoOfferMsg(msg) {

    let localStream = null;

    this.setState({targetUsername : msg.name})

    // Call createPeerConnection() to create the RTCPeerConnection.

    log('Starting to accept invitation from ' + this.state.targetUsername);
    this.createPeerConnection();

    // We need to set the remote description to the received SDP offer
    // so that our local WebRTC layer knows how to talk to the caller.

    let desc = new RTCSessionDescription(msg.sdp);


    this.myPeerConnection.setRemoteDescription(desc).then(() => {
      log('Setting up the local media stream...');
      return navigator.mediaDevices.getUserMedia(this.mediaConstraints);
    })
    .then((stream) => {
      log('-- Local video stream obtained');
      localStream = stream;

      this.refLocalVideo.current.src = window.URL.createObjectURL(localStream);
      this.refLocalVideo.current.srcObject = localStream;

      if (this.hasAddTrack) {
        log('-- Adding tracks to the RTCPeerConnection');
        localStream.getTracks().forEach(track =>
              this.myPeerConnection.addTrack(track, localStream));
      } else {
        log('-- Adding stream to the RTCPeerConnection');
        this.myPeerConnection.addStream(localStream);
      }
    })
    /*
    .then(() => {
      log('------> Creating answer');
      // Now that we've successfully set the remote description, we need to
      // start our stream up locally then create an SDP answer. This SDP
      // data describes the local end of our call, including the codec
      // information, options agreed upon, and so forth.
      return this.myPeerConnection.createAnswer();
    })
    .then((answer) => {
      log('------> Setting local description after creating answer');
      // We now have our answer, so establish that as the local description.
      // This actually configures our end of the call to match the settings
      // specified in the SDP.
      return this.myPeerConnection.setLocalDescription(answer);
    })
    .then(() => {
      let msg = {
        name: this.myUsername,
        target: this.state.targetUsername,
        type: 'video-answer',
        sdp: this.myPeerConnection.localDescription
      };

      // We've configured our end of the call now. Time to send our
      // answer back to the caller so they know that we want to talk
      // and how to talk to us.

      log('Sending answer packet back to other peer');
      this.sendToServer(msg);
    })
    .catch(this.handleGetUserMediaError);
    */
  }

}
