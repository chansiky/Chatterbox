import React from 'react'

class DataComponent extends React.Component{
  constructor(props){
    super(props)

    this.dataChannelSend = null

    this.remoteConnection = null
    this.sendChannel  = null
    this.receiveChannel = null
    this.pcConstraint = null
    this.dataConstraint = null

    this.refTextBox = React.createRef()

    this.servers = {
      iceServers: [{ url: 'stun:stun.l.google.com:19302' }]
    }

    
  }

  state = {
    textBox : '',
    receiveValues: [],
    disabled: {
      textBox: true,
      startButton: false,
      sendButton: true, 
      closeButton: true,
    }
  }
  
  handleChange = (event) => {
    this.setState({
      [event.target.name] : event.target.value
    })

    console.log(this.state)
  }

  handleSubmit = (event) => {
    console.log('submit called with: ', this.state.textBox)
    setTimeout(() => console.log('waiting is over'), 4000)
  }

  
  createConnection = () => {
    const servers = this.servers;
    this.pcConstraint = null;
    this.dataConstraint = null;

    this.localConnection =
        new RTCPeerConnection(servers, this.pcConstraint);
  
    this.sendChannel = this.localConnection.createDataChannel('sendDataChannel',
        this.dataConstraint);
  
    this.localConnection.onicecandidate = this.iceCallback1;
    this.sendChannel.onopen = this.onSendChannelStateChange;
    this.sendChannel.onclose = this.onSendChannelStateChange;
  
    // Add remoteConnection to global scope to make it visible
    // from the browser console.
    this.remoteConnection =
        new RTCPeerConnection(servers, this.pcConstraint);
  
    this.remoteConnection.onicecandidate = this.iceCallback2;
    this.remoteConnection.ondatachannel = this.receiveChannelCallback;
  
    this.localConnection.createOffer().then(
      this.gotDescription1
    );
    
    this.setState({
      ...this.state,
      disabled: {
        ...this.state.disabled, 
        textBox: false,
        startButton : true,
        closeButton : false,
      }
    })
  }

  closeDataChannels = () => {
    this.sendChannel.close();
    this.receiveChannel.close();
    this.localConnection.close();
    this.remoteConnection.close();
    this.localConnection = null;
    this.remoteConnection = null;


    this.setState({
      ...this.state,
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

  iceCallback1 = (event) => {
    if (event.candidate) {
      this.remoteConnection.addIceCandidate(
        event.candidate
      ).then(
        this.onAddIceCandidateSuccess,
        this.onAddIceCandidateError
      );
    }
  }

  iceCallback2 = (event) => {
    if (event.candidate) {
      this.localConnection.addIceCandidate(
        event.candidate
      ).then(
        this.onAddIceCandidateSuccess,
        this.onAddIceCandidateError
      );
    }
  }


  onSendChannelStateChange = () => {
    var readyState = this.sendChannel.readyState;
    if (readyState === 'open') {
      this.setState({
        ...this.state,
        disabled: {
          ...this.state.disabled, 
          textBox : false,
        }
      })
      this.refTextBox.current.focus();

      this.setState({
        ...this.state,
        disabled: {
          ...this.state.disabled, 
          sendButton : false,
          closeButton : false,
        }
      })
    } else {
      this.setState({
        ...this.state,
        disabled: {
          ...this.state.disabled, 
          textBox     : true,
          sendButton  : true,
          closeButton : true,
        }
      })
    }
  }

  receiveChannelCallback = (event) => {
    this.receiveChannel           = event.channel;
    this.receiveChannel.onmessage = this.onReceiveMessageCallback;
    this.receiveChannel.onopen    = this.onReceiveChannelStateChange;
    this.receiveChannel.onclose   = this.onReceiveChannelStateChange;
  }

  onReceiveMessageCallback = (event) => {
    this.setState({
      ...this.state,
      textBox: '',
      receiveValues: [...this.state.receiveValues, event.data]
    
    })
  }

  onReceiveChannelStateChange = () => {
    const readyState = this.receiveChannel.readyState;
  }

  gotDescription1 = (desc) => {
    this.localConnection.setLocalDescription(desc);
    this.remoteConnection.setRemoteDescription(desc);
    this.remoteConnection.createAnswer().then(
      this.gotDescription2
    );
  }


  gotDescription2 = (desc) => {
    this.remoteConnection.setLocalDescription(desc);
    this.localConnection.setRemoteDescription(desc);
  }

  render(){
    return(
      <div>
        <form onSubmit={this.handleSubmit}>
           <label >
             Name:
             <input name="textBox" ref={this.refTextBox} type="text" disabled={this.state.disabled.textBox} value={this.state.textBox} onChange={this.handleChange} />
           </label>
           <input type="submit" value="Submit" />
        </form>
        <div>
        {
          this.state.receiveValues.map(value => <h5> {value} </h5>)
        }
        </div>
        <div id="buttons">
          <button id="startButton" disabled={this.state.disabled.startButton} onClick ={this.createConnection} >Start</button>
          <button id="sendButton"  disabled={this.state.disabled.sendButton} onClick ={this.sendData} >Send</button>
          <button id="closeButton" disabled={this.state.disabled.closeButton} onClick ={this.closeDataChannels} >Stop</button>
        </div>
      </div>
    )
  }
}

export default DataComponent
