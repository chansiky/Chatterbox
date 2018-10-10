import React from 'react'
import { EventEmitter } from 'events'
export const events = new EventEmitter()
import ColorPicker from './color-picker'
import { connect } from 'react-redux'


const mapStateToProps = (state) => {
  return {
    currentColor: state.currentColor,
  }
}

class Canvas extends React.Component{
  constructor(){
    super()
    this.drawingCanvas  = React.createRef()
  }

  draw(start, end, strokeColor = 'black', shouldBroadcast = true) {
  }

  setupCanvas() {
  }

  resize() {
  }

  componentDidMount(){
  }

  render() {
    return (
      <div>
        <div>
          <canvas ref={this.drawingCanvas}/>
        </div>
        <ColorPicker />
      </div>
    )
  }
}


export default connect(mapStateToProps )(Canvas)

