import React from 'react'

function log(text) {
  let time = new Date();
  console.log('[' + time.toLocaleTimeString() + '] ' + text);
}

// Output an error message to console.
function log_error(text) {
  let time = new Date();
  console.error('[' + time.toLocaleTimeString() + '] ' + text);
}

// Handles reporting errors. Currently, we just dump stuff to console but
// in a real-world application, an appropriate (and user-friendly)
// error message should be displayed.
function reportError(errMessage) {
  log_error('Error ' + errMessage.name + ': ' + errMessage.message);
}

class VideoChat extends React.Component {
  constructor(){
    super()

    this.state = {
      myUsername: null,
      usernameInput: '',
      targetUsername: null, //should targetUsername be kept in state?
      textInput: '',
      userList: [],
      disabled: {
        hangup: true,
        text: true,
        send: true
      }
    }

    //create refs
    this.refChatbox = React.createRef()
    this.refReceivedVideo = React.createRef()
    this.refLocalVideo = React.createRef()
    this.refUserlistbox = React.createRef()


    this.myHostname = window.location.hostname;
    //console.log('Hostname: ' + this.myHostname);

    //this.myUsername = null;
    //this.targetUsername = null;      // To store username of other peer
    this.myPeerConnection = null;    // RTCPeerConnection

    // WebSocket chat/signaling channel variables.
    this.connection = null;
    this.clientID = 0;

    // To work both with and without addTrack() we need to note
    // if it's available
    this.hasAddTrack = false;

    this.mediaConstraints = {
      audio: true,            // We want an audio track
      video: true             // ...and we want a video track
    };

    this.connect                      = this.connect              .bind(this)
    this.closeVideoCall               = this.closeVideoCall.bind(this)
    this.createPeerConnection         = this.createPeerConnection .bind(this)
    this.handleAddStreamEvent         = this.handleAddStreamEvent.bind(this)
    this.handleChange                 = this.handleChange         .bind(this)
    this.handleGetUserMediaError      = this.handleGetUserMediaError.bind(this)
    this.handleNegotiationNeededEvent = this.handleNegotiationNeededEvent.bind(this)
    this.handleRemoveStreamEvent      = this.handleRemoveStreamEvent.bind(this)
    this.handleSendButton             = this.handleSendButton     .bind(this)
    this.handleTrackEvent             = this.handleTrackEvent.bind(this)
    this.sendToServer                 = this.sendToServer         .bind(this)
    this.setUsername                  = this.setUsername          .bind(this)

    this.handleICECandidateEvent      = this.handleICECandidateEvent.bind(this)
    this.handleICEConnectionStateChangeEvent = this.handleICEConnectionStateChangeEvent.bind(this)
    this.handleICEGatheringStateChangeEvent = this.handleICEGatheringStateChangeEvent.bind(this)
    this.handleSignalingStateChangeEvent = this.handleSignalingStateChangeEvent.bind(this)

    this.hangUpCall = this.hangUpCall.bind(this)
    this.handleUserlistMsg = this.handleUserlistMsg.bind(this)
    this.handleHangUpMsg = this.handleHangUpMsg.bind(this)
    this.invite = this.invite.bind(this)
    this.handleVideoOfferMsg = this.handleVideoOfferMsg.bind(this) 
    this.handleNewICECandidateMsg  = this.handleNewICECandidateMsg.bind(this)
  }

  // Open and configure the connection to the WebSocket server.
  connect() {

    var HOST = location.origin.replace(/^http/, 'ws')

    console.log("tying to connect")
    let serverUrl;
    let scheme = 'ws';

    this.connection = new WebSocket(HOST, 'json');
    this.connection.onopen = (evt) => {
      this.setState({
        disabled: {...this.state.disabled , ...{text: false, send: false}}
      })
    }

    this.connection.onmessage = (evt) => {

      let chatFrameDocument = this.refChatbox.current.contentDocument
      //let chatFrameDocument = document.getElementById('chatbox').contentDocument;
      let text = '';
      let msg = JSON.parse(evt.data);
      log('Message received: ');
      console.dir(msg);
      let time = new Date(msg.date);
      let timeStr = time.toLocaleTimeString();

      switch (msg.type) {
        case 'id':
          this.clientID = msg.id;
          this.setUsername();
          break;

        case 'username':
          text = '<b>User <em>' + msg.name + '</em> signed in at ' + timeStr + '</b><br>';
          break;

        case 'message':
          text = '(' + timeStr + ') <b>' + msg.name + '</b>: ' + msg.text + '<br>';
          break;

        case 'rejectusername':
          myUsername = msg.name;
          text = '<b>Your username has been set to <em>' + myUsername +
            '</em> because the name you chose is in use.</b><br>';
          break;

        case 'userlist':      // Received an updated user list
          this.handleUserlistMsg(msg);
          break;

        // Signaling messages: these messages are used to trade WebRTC
        // signaling information during negotiations leading up to a video
        // call.

        case 'video-offer':  // Invitation and offer to chat
          this.handleVideoOfferMsg(msg);
          break;

        case 'video-answer':  // Callee has answered our offer
          this.handleVideoAnswerMsg(msg);
          break;

        case 'new-ice-candidate': // A new ICE candidate has been received
          this.handleNewICECandidateMsg(msg);
          break;

        case 'hang-up': // The other peer has hung up the call
          this.handleHangUpMsg(msg);
          break;

        // Unknown message; output to console for debugging.

        default:
          log_error('Unknown message received:');
          log_error(msg);
      }

      // If there's text to insert into the chat buffer, do so now, then
      // scroll the chat panel so that the new text is visible.

      if (text.length) {
        chatFrameDocument.write(text);
        this.refChatbox.current.contentWindow.scrollByPages(1);
        //document.getElementById('chatbox').contentWindow.scrollByPages(1);
      }
    }
  }

  // Close the RTCPeerConnection and reset variables so that the user can
  // make or receive another call if they wish. This is called both
  // when the user hangs up, the other user hangs up, or if a connection
  // failure is detected.
  
  closeVideoCall() {
    let remoteVideo = this.refReceivedVideo
    let localVideo  = this.refLocalVideo
  
    log('Closing the call');
  
    // Close the RTCPeerConnection
  
    if (this.myPeerConnection) {
      log('--> Closing the peer connection');
  
      // Disconnect all our event listeners; we don't want stray events
      // to interfere with the hangup while it's ongoing.
  
      this.myPeerConnection.onaddstream = null;  // For older implementations
      this.myPeerConnection.ontrack = null;      // For newer ones
      this.myPeerConnection.onremovestream = null;
      this.myPeerConnection.onnicecandidate = null;
      this.myPeerConnection.oniceconnectionstatechange = null;
      this.myPeerConnection.onsignalingstatechange = null;
      this.myPeerConnection.onicegatheringstatechange = null;
      this.myPeerConnection.onnotificationneeded = null;
  
      // Stop the videos
  
      if (this.remoteVideo.srcObject) {
        this.remoteVideo.srcObject.getTracks().forEach(track => track.stop());
      }
  
      if (localVideo.srcObject) {
        this.localVideo.srcObject.getTracks().forEach(track => track.stop());
      }
  
      this.remoteVideo.src = null;
      this.localVideo.src = null;
  
      // Close the peer connection
  
      this.myPeerConnection.close();
      this.myPeerConnection = null;
    }
  
    // Disable the hangup button
  
    this.setState({
      disabled: {...this.state.disabled, ...{hangup: true}}
    })
  
    this.setState({ targetUsername : null })
  }

  // Create the RTCPeerConnection which knows how to talk to our
  // selected STUN/TURN server and then uses getUserMedia() to find
  // our camera and microphone and add that stream to the connection for
  // use in our video call. Then we configure event handlers to get
  // needed notifications on the call.
  createPeerConnection() {
    log('Setting up a connection...');
  
    // Create an RTCPeerConnection which knows to use our chosen
    // STUN server.
  
    this.myPeerConnection = new RTCPeerConnection({
      iceServers: [     // Information about ICE servers - Use your own!
        {
          urls: 'turn:' + this.myHostname,  // A TURN server
          username: 'webrtc',
          credential: 'turnserver'
        }]
    });
  
    // Do we have addTrack()? If not, we will use streams instead.
    this.hasAddTrack = (this.myPeerConnection.addTrack !== undefined);
  
    // Set up event handlers for the ICE negotiation process.
    this.myPeerConnection.onicecandidate             = this.handleICECandidateEvent;
    this.myPeerConnection.onnremovestream            = this.handleRemoveStreamEvent;
    this.myPeerConnection.oniceconnectionstatechange = this.handleICEConnectionStateChangeEvent;
    this.myPeerConnection.onicegatheringstatechange  = this.handleICEGatheringStateChangeEvent;
    this.myPeerConnection.onsignalingstatechange     = this.handleSignalingStateChangeEvent;
    this.myPeerConnection.onnegotiationneeded        = this.handleNegotiationNeededEvent;
  
    // Because the deprecation of addStream() and the addstream event is recent,
    // we need to use those if addTrack() and track aren't available.
  
    if (this.hasAddTrack) {
      this.myPeerConnection.ontrack = this.handleTrackEvent;
    } else {
      this.myPeerConnection.onaddstream = this.handleAddStreamEvent;
    }
  }

  // Called by the WebRTC layer when a stream starts arriving from the
  // remote peer. We use this to update our user interface, in this
  // example.

  handleAddStreamEvent(event) {
    log('*** Stream added');
    this.refReceivedVideo.current.srcObject = event.stream
    this.setState({
      disabled: {...this.state.disabled, ...{hangup: false}}
    })
  }


  // Called by the WebRTC layer to let us know when it's time to
  // begin (or restart) ICE negotiation. Starts by creating a WebRTC
  // offer, then sets it as the description of our local media
  // (which configures our local media stream), then sends the
  // description to the callee as an offer. This is a proposed media
  // format, codec, resolution, etc.

  handleChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    })

  }

  // Handle the "hang-up" message, which is sent if the other peer
  // has hung up the call or otherwise disconnected.


  // Handle errors which occur when trying to access the local media
  // hardware; that is, exceptions thrown by getUserMedia(). The two most
  // likely scenarios are that the user has no camera and/or microphone
  // or that they declined to share their equipment when prompted. If
  // they simply opted not to share their media, that's not really an
  // error, so we won't present a message in that situation.
  
  handleGetUserMediaError(e) {
    log(e);
    switch (e.name) {
      case 'NotFoundError':
        alert('Unable to open your call because no camera and/or microphone' +
              'were found.');
        break;
      case 'SecurityError':
      case 'PermissionDeniedError':
        // Do nothing; this is the same as the user canceling the call.
        break;
      default:
        alert('Error opening your camera and/or microphone: ' + e.message);
        break;
    }
  
    // Make sure we shut down our end of the RTCPeerConnection so we're
    // ready to try again.
  
    this.closeVideoCall();
  }


  handleHangUpMsg(msg) {
    log('*** Received hang up notification from other peer');
  
    this.closeVideoCall();
  }


  // Handles |icecandidate| events by forwarding the specified
  // ICE candidate (created by our local ICE agent) to the other
  // peer through the signaling server.

  handleICECandidateEvent(event) {
    if (event.candidate) {
      log('Outgoing ICE candidate: ' + event.candidate.candidate);
  
      this.sendToServer({
        type: 'new-ice-candidate',
        target: this.state.targetUsername,
        candidate: event.candidate
      });
    }
  }

  // Handle |iceconnectionstatechange| events. This will detect
  // when the ICE connection is closed, failed, or disconnected.
  //
  // This is called when the state of the ICE agent changes.
  handleICEConnectionStateChangeEvent(event) {
    log('*** ICE connection state changed to ' + this.myPeerConnection.iceConnectionState);
  
    switch (this.myPeerConnection.iceConnectionState) {
      case 'closed':
      case 'failed':
      case 'disconnected':
        this.closeVideoCall();
        break;
    }
  }


  handleNegotiationNeededEvent() {
    log('*** Negotiation needed');
  
    log('---> Creating offer');
    this.myPeerConnection.createOffer().then((offer) => {
      log('---> Creating new description object to send to remote peer');

      return this.myPeerConnection.setLocalDescription(offer);
    })
    .then(() => {
      log('---> Sending offer to remote peer');
      this.sendToServer({
        name: this.myUsername,
        target: this.targetUsername,
        type: 'video-offer',
        sdp: this.myPeerConnection.localDescription
      });
    })
    .catch(this.reportError);
  }

  // An event handler which is called when the remote end of the connection
  // removes its stream. We consider this the same as hanging up the call.
  // It could just as well be treated as a "mute".
  //
  // Note that currently, the spec is hazy on exactly when this and other
  // "connection failure" scenarios should occur, so sometimes they simply
  // don't happen.
  
  handleRemoveStreamEvent(event) {
    log('*** Stream removed');
    this.closeVideoCall();
  }

  // Handles a click on the Send button (or pressing return/enter) by
  // building a "message" object and sending it to the server.
  handleSendButton() {
    let msg = {
      text: this.state.textInput,
      type: 'message',
      id: this.clientID,
      date: Date.now()
    };
    this.sendToServer(msg);
    this.setState({textInput: ''})
  }


  // Called by the WebRTC layer when events occur on the media tracks
  // on our WebRTC call. This includes when streams are added to and
  // removed from the call.
  //
  // track events include the following fields:
  //
  // RTCRtpReceiver       receiver
  // MediaStreamTrack     track
  // MediaStream[]        streams
  // RTCRtpTransceiver    transceiver
  handleTrackEvent(event) {
    log('*** Track event');
    this.refReceivedVideo.current.srcObject = event.streams[0]
    //document.getElementById('received_video').srcObject = event.streams[0];
    this.setState({
      disabled: {...this.state.disabled, ...{hangup: false}}
    })
  }

  // Given a message containing a list of usernames, this function
  // populates the user list box with those names, making each item
  // clickable to allow starting a video call.
  handleUserlistMsg(msg) {
    let i;
  
    console.log('msg is,', msg)
     
    this.setState({
      userList: msg.users
    })
    console.log('handling user list msg, this . state is', this.state)
    
    /*
      //let listElem = document.getElementById('userlistbox');
      let listElem = this.refUserlistbox.current;
  
      // Remove all current list members. We could do this smarter,
      // by adding and updating users instead of rebuilding from
      // scratch but this will do for this sample.
  
      while (listElem.firstChild) {
        listElem.removeChild(listElem.firstChild);
      }
  
      // Add member names from the received list
  
      for (i = 0; i < msg.users.length; i++) {
        let item = document.createElement('li');
        item.appendChild(document.createTextNode(msg.users[i]));
        item.addEventListener('click', this.invite, false);
  
        listElem.appendChild(item);
      }
    */

  }


  // Hang up the call by closing our end of the connection, then
  // sending a "hang-up" message to the other peer (keep in mind that
  // the signaling is done on a different connection). This notifies
  // the other peer that the connection should be terminated and the UI
  // returned to the "no call in progress" state.
  hangUpCall() {
    this.closeVideoCall();
    this.sendToServer({
      name: this.state.myUsername,
      target: this.state.targetUsername,
      type: 'hang-up'
    });
  }

  // Handle a click on an item in the user list by inviting the clicked
  // user to video chat. Note that we don't actually send a message to
  // the callee here -- calling RTCPeerConnection.addStream() issues
  // a |notificationneeded| event, so we'll let our handler for that
  // make the offer.
  invite(event) {
    log('Starting to prepare an invitation');
    if (this.myPeerConnection) {
      alert("You can't start a call because you already have one open!");
    } else {
      let clickedUsername = event.target.textContent;
  
      // Don't allow users to call themselves, because weird.
  
      if (clickedUsername === this.state.myUsername) {
        alert("I'm afraid I can't let you talk to yourself. That would be weird.");
        return;
      }
  
      // Record the username being called for future reference
  
      this.setState({targetUsername : clickedUsername})
      //targetUsername = clickedUsername;
      log('Inviting user ' + this.state.targetUsername);
  
      // Call createPeerConnection() to create the RTCPeerConnection.
  
      log('Setting up connection to invite user: ' + this.state.targetUsername);
      this.createPeerConnection();
  
      // Now configure and create the local stream, attach it to the
      // "preview" box (id "local_video"), and add it to the
      // RTCPeerConnection.
  
      log('Requesting webcam access...');
  
      navigator.mediaDevices.getUserMedia(this.mediaConstraints)
      .then((localStream) => {
        log('-- Local video stream obtained');
        this.refLocalVideo.current.src = window.URL.createObjectURL(localStream)
        this.refLocalVideo.current.srcObject = localStream
  
        if (this.hasAddTrack) {
          log('-- Adding tracks to the RTCPeerConnection');
          localStream.getTracks().forEach(track => this.myPeerConnection.addTrack(track, localStream));
        } else {
          log('-- Adding stream to the RTCPeerConnection');
          this.myPeerConnection.addStream(localStream);
        }
      })
      .catch(this.handleGetUserMediaError);
    }
  }

// Responds to the "video-answer" message sent to the caller
// once the callee has decided to accept our request to talk.

  handleVideoAnswerMsg(msg) {
    log('Call recipient has accepted our call');
  
    // Configure the remote description, which is the SDP payload
    // in our "video-answer" message.
    let desc = new RTCSessionDescription(msg.sdp);
    this.myPeerConnection.setRemoteDescription(desc)
      .catch(reportError);
  }

  // Send a JavaScript object by converting it to JSON and sending
  // it as a message on the WebSocket connection.
  sendToServer(msg) {
    let msgJSON = JSON.stringify(msg);

    log("Sending '" + msg.type + "' message: " + msgJSON);
    this.connection.send(msgJSON);
  }

  // Called when the "id" message is received; this message is sent by the
  // server to assign this login session a unique ID number; in response,
  // this function sends a "username" message to set our username for this
  // session.
  setUsername() {
    this.myUsername = this.state.usernameInput
    //console.log('sending username', this.myUsername)

    this.sendToServer({
      name: this.myUsername,
      date: Date.now(),
      id: this.clientID,
      type: 'username'
    });
  }

  // Set up a |signalingstatechange| event handler. This will detect when
  // the signaling connection is closed.
  //
  // NOTE: This will actually move to the new RTCPeerConnectionState enum
  // returned in the property RTCPeerConnection.connectionState when
  // browsers catch up with the latest version of the specification!
  
  handleSignalingStateChangeEvent(event) {
    log('*** WebRTC signaling state changed to: ' + this.myPeerConnection.signalingState);
    switch (this.myPeerConnection.signalingState) {
      case 'closed':
        this.closeVideoCall();
        break;
    }
  }


// Accept an offer to video chat. We configure our local settings,
// create our RTCPeerConnection, get and attach our local camera
// stream, then create and send an answer to the caller.

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
        name: this.state.myUsername,
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
  }


  // A new ICE candidate has been received from the other peer. Call
  // RTCPeerConnection.addIceCandidate() to send it along to the
  // local ICE framework.
  
  handleNewICECandidateMsg(msg) {
    let candidate = new RTCIceCandidate(msg.candidate);
  
    log('Adding received ICE candidate: ' + JSON.stringify(candidate));
    this.myPeerConnection.addIceCandidate(candidate)
      .catch(reportError);
  }

  // Handle the |icegatheringstatechange| event. This lets us know what the
  // ICE engine is currently working on: "new" means no networking has happened
  // yet, "gathering" means the ICE engine is currently gathering candidates,
  // and "complete" means gathering is complete. Note that the engine can
  // alternate between "gathering" and "complete" repeatedly as needs and
  // circumstances change.
  //
  // We don't need to do anything when this happens, but we log it to the
  // console so you can see what's going on when playing with the sample.
  
  handleICEGatheringStateChangeEvent(event) {
    log('*** ICE gathering state changed to: ' + this.myPeerConnection.iceGatheringState);
  }

  render(){
    console.log('this.state.userList is ', this.state.userList)
    const userListDiv = (this.state.userList.length > 0) ?
      <div>
        {this.state.userList.map((elem) => {
          return(
            <div>
              {elem}
              <button
                id="invite-button"
                onClick={this.invite}
              >
                invite
              </button>
            </div>
          )
        })}
      </div> :
      <div> no users </div>

    console.log('userlist div is', userListDiv)


    return (
      <div>
        <p>Enter a username:
          <input

            name="usernameInput"
            value={this.state.usernameInput}
            onChange={this.handleChange}

            id="name"
            type="text"
            maxLength="20"
            required
            autoComplete="username"
            inputMode="verbatim"
            placeholder="Username"
          />
          <button
            id="login"
            onClick={this.connect}
          >
            Log In
          </button>
        </p>

        <div id="container" className="flexChild columnParent">
          <div className="flexChild rowParent">
            <div className="flexChild rowParent">
              <div className="flexChild" id="userlist-container">

                <ul ref={this.refUserlistbox} id="userlistbox" />
              </div>
              <div className="flexChild" id="chat-container">
                <iframe id="chatbox" ref={this.refChatbox} />
              </div>
            </div>
            {userListDiv}

            <div className="flexChild" id="camera-container">
              <div className="camera-box">
                <video ref={this.refReceivedVideo} id="received_video" autoPlay />
                <video ref={this.refLocalVideo} id="local_video" autoPlay muted />
                <button 
                  id="hangup-button" 
                  onClick={this.hangUpCall}
                  disabled={this.state.disabled.hangup}>
                  Hang Up
                </button>
              </div>
            </div>
          </div>

          <div className="flexChild rowParent" id="control-row">
            <div className="flexChild" id="empty-container" />
            <div className="flexChild" id="chat-controls-container">
              Chat:
              <input

                name="textInput"
                value={this.state.textInput}
                onChange={this.handleChange}
                disabled={this.state.disabled.text}

                id="text"
                type="text"
                size="80"
                maxLength="256"
                placeholder="Chat with us!"
                autoComplete="off"
              />
              <button
                id="textSend"
                onClick={this.handleSendButton}
                disabled={this.state.disabled.send}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default VideoChat
