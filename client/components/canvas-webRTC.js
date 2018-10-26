import React from 'react'
import { EventEmitter } from 'events'
import { connect } from 'react-redux'
import CreateIcon from '@material-ui/icons/create'
import './canvas.css'

class Canvas extends React.Component{
  constructor(){
    super()
    this.refCanvas  = React.createRef()
    this.divThing = React.createRef()

    this.canvas = null
    this.ctx = null

    this.mouseDown = false;
    this.mousePositionPrev = null;
    this.mousePositionCurr = null;

    this.state = {
      currentColor: 'black',
      width: '800',
      height: '600',
    }
    
    this.recordMouse = this.recordMouse.bind(this)
    this.getCanvasXY = this.getCanvasXY.bind(this)
    this.onMouseDown = this.onMouseDown.bind(this)
    this.onMouseUp   = this.onMouseUp.bind(this)
    this.onMouseMove = this.onMouseMove.bind(this)
    this.draw        = this.draw.bind(this)
  }

  componentDidMount(){
    this.canvas = this.refCanvas.current
    this.ctx    = this.canvas.getContext('2d')

    this.setupCanvas()
    this.setState = {
      currentColor: 'black',
    }
  }

  draw(start, end, strokeColor = 'black', shouldBroadcast = true) {
    this.ctx.beginPath()
    this.ctx.strokeStyle = this.state.strokeColor
    this.ctx.moveTo(start.x, start.y)
    this.ctx.lineTo(end.x, end.y)
    this.ctx.closePath()
    this.ctx.stroke()
    if(shouldBroadcast){
      this.props.funcBroadcastRTC("DRAW",{start, end, strokeColor})
    }
  }

  setupCanvas() {
    console.log('setting up canvas')
    this.ctx.lineWidth = 2
    this.ctx.lineJoin = 'round'
    this.ctx.lineCap = 'round'
  }

  resize() {
  }

  recordMouse(e){
    //console.log("canvasXY is " , this.getCanvasXY(e.pageX, e.pageY))
  }

  onMouseDown(e){
    this.mouseDown = true
    this.recordMouse(e)
    this.mousePositionCurr = this.getCanvasXY(e.pageX, e.pageY)
  }
  
  onMouseUp(e){
    this.mouseDown = false
    this.recordMouse(e)
  }

  onMouseMove(e){
    if (this.mouseDown) {
      this.mousePositionPrev = this.mousePositionCurr
      this.mousePositionCurr = this.getCanvasXY(e.pageX, e.pageY)
      
      this.draw(this.mousePositionPrev, this.mousePositionCurr, this.state.currentColor, true)
      this.recordMouse(e)
    }
  }


  getCanvasXY(x,y){
    return {
      x : x-this.canvas.offsetLeft,
      y : y-this.canvas.offsetTop
    }
  }

  render() {
    const { classes } = this.props
    return (
      <div className="Canvas">
        <canvas 
          onMouseDown = {this.onMouseDown}
          onMouseUp   = {this.onMouseUp}
          onMouseMove = {this.onMouseMove}
          width       = {this.state.width}
          height      = {this.state.height}
          ref         = {this.refCanvas}
          id          = "drawing">
        </canvas>
      </div>
    )
  }
}

export default (Canvas)
