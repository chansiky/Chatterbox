import React from 'react'
import { EventEmitter } from 'events'
export const events = new EventEmitter()
import { connect } from 'react-redux'
import { withStyles } from '@material-ui/core/styles'

const styles = {
  canvas: {
    borderStyle: 'solid',
    borderColor: 'black',
    borderWidth: 'thin'
  }
}

class Canvas extends React.Component{
  constructor(){
    super()
    this.refCanvas  = React.createRef()
    this.divThing = React.createRef()

    this.canvas = null
    this.ctx = null

    console.log(this.refCanvas)
    console.log(this.divThing)

    this.state = {
      currentColor: 'black',
      width: '800',
      height: '600',
    }
    
    this.recordMouse = this.recordMouse.bind(this)
    this.getCanvasXY = this.getCanvasXY.bind(this)
  }

  componentDidMount(){
    console.log('componentDidMount')
    this.canvas = this.refCanvas.current
    this.ctx    = this.canvas.getContext('2d')

    this.setupCanvas()
    this.setState = {
      currentColor: 'black',
    }
  }


  draw(start, end, strokeColor = 'black', shouldBroadcast = true) {
  }

  setupCanvas() {

    console.log('setting up canvas')
    this.ctx.fillStyle = 'rgb(200, 0, 0)';
    this.ctx.fillRect(10, 10, 50, 50);

    this.ctx.fillStyle = 'rgba(0, 0, 200, 0.5)';
    this.ctx.fillRect(30, 30, 50, 50);
  }

  resize() {
  }

  recordMouse(e){
    console.log("hello", e.pageX, ", " , e.pageY)
    console.log("offsets are" , this.canvas.offsetLeft, this.canvas.offsetTop)
    console.log("canvasXY is " , this.getCanvasXY(e.pageX, e.pageY))
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
      <div>
          <div ref={this.divThing} >
            Title
          </div>
          <div>
            <canvas className={classes.canvas} onMouseDown={this.recordMouse} width={this.state.width} height={this.state.height} ref={this.refCanvas} id="drawing"></canvas>
          </div>
      </div>
    )
  }
}

export default withStyles(styles)(Canvas)
