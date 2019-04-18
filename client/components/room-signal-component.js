import React from 'react'
import socket from '../socket'
import { PeerSignalComponent } from './index'

class RoomSignalComponent extends React.Component{
  constructor(props){
    super(props)

    this.state = {
      roomId: props.match.params.roomId
    }

    socket.emit('create or join', this.state.roomId)
  }

  render(props){
    let url = document.url
    return(
      <div>
        <h1>
          Room: &nbsp;{this.state.roomId}
        </h1>
        <section> invite someone to join this room:
          <a href={url} target="_blank"> url </a>
        </section>
        this component will console log a bunch of signals
        <PeerSignalComponent />
      </div>
    )
  }
}

export default RoomSignalComponent
