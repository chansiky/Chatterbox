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
    this.canvas         = null
    this.ctx            = null

    this.position       = this.position.bind(this)
    this.resize         = this.resize.bind(this)
    this.setupCanvas    = this.setupCanvas.bind(this)
    this.draw           = this.draw.bind(this)

    this.currentMousePosition = {
      x: 0,
      y: 0
    }

    this.lastMousePosition = {
      x: 0,
      y: 0
    }

    this.state = {
      currentColor: 'black',
    }
  }


  draw(start, end, strokeColor = 'black', shouldBroadcast = true) {
    // Draw the line between the start and end positions
    // that is colored with the given color.
    this.ctx.beginPath()
    this.ctx.strokeStyle = strokeColor
    this.ctx.moveTo(...start)
    this.ctx.lineTo(...end)
    this.ctx.closePath()
    this.ctx.stroke()

    // If shouldBroadcast is truthy, we will emit a draw event to listeners
    // with the start, end and color data.
    /*
    shouldBroadcast &&
        events.emit('draw', start, end, strokeColor)
    */
  }


  setupCanvas() {
    // Set the size of the canvas and attach a listener
    this.resize()
    // to handle resizing.  this.resize()
    window.addEventListener('resize', this.resize)

    window.addEventListener('mousedown', (e) => {
      this.currentMousePosition = this.position(e)
    })

    window.addEventListener('mousemove', (e) => {
      if (!e.buttons) return
      this.lastMousePosition = this.currentMousePosition
      this.currentMousePosition = this.position(e)
      this.lastMousePosition && this.currentMousePosition &&
                  this.draw(this.lastMousePosition, this.currentMousePosition, this.state.currentColor, true)
    })
  }

  resize() {
    // Unscale the canvas (if it was previously scaled)
    this.ctx.setTransform(1, 0, 0, 1, 0, 0)

    // The device pixel ratio is the multiplier between CSS pixels
    // and device pixels
    var pixelRatio = window.devicePixelRatio || 1

    // Allocate backing store large enough to give us a 1:1 device pixel
    // to canvas pixel ratio.
   
    // console.log('this.canvas', this.canvas)
    // console.log('this.canvas.clientWidth', this.canvas.clientWidth)
    // console.log('this.canvas.clientHeight', this.canvas.clientHeight)
    // console.log('pixelRatio', pixelRatio)
    this.canvas.width = this.canvas.parentElement.clientWidth
    this.canvas.height = this.canvas.parentElement.clientHeight

    /*
    var w = this.canvas.clientWidth * pixelRatio,
      h = this.canvas.clientHeight * pixelRatio
    if (w !== this.canvas.width || h !== this.canvas.height){
      // Resizing the canvas destroys the current content.
      // So, save it...
      var imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)

      this.canvas.width = w
      this.canvas.height = h

      // ...then restore it.
      this.ctx.putImageData(imgData, 0, 0)
    }

      */
    // Scale the canvas' internal coordinate system by the device pixel
    // ratio to ensure that 1 canvas unit = 1 css pixel, even though our
    // backing store is larger.
    this.ctx.scale(pixelRatio, pixelRatio)

    this.ctx.lineWidth = 5
    this.ctx.lineJoin = 'round'
    this.ctx.lineCap = 'round'
  }


  position = (event) => {
    //console.log('position event is: ', event)
    //console.log('position canvas is: ', this.drawingCanvas.current)
    return ([
      event.pageX - this.canvas.offsetLeft,
      event.pageY - this.canvas.offsetTop
    ])
  }

  componentDidMount(){
    //const drawingCanvas = this.drawingCanvas.current
    //const ctx = drawingCanvas.getContext('2d')
    this.canvas = this.drawingCanvas.current
    this.ctx    = this.canvas.getContext('2d')

    this.setupCanvas()
    this.setState = {
      currentColor: 'black',
    }
    console.log('this.canvas', this.canvas)
  }

  render() {
    return (
      <div>
        <div>
          <canvas ref={this.drawingCanvas}/>
        </div>
        <ColorPicker />
        <button ref={this.buttonStart} type="button" />
        <button ref={this.buttonCall} type="button" />
        <button ref={this.buttonHangup} type="button" />
      </div>
    )
  }
}


export default connect(mapStateToProps )(Canvas)

