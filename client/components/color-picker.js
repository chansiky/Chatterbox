import React from 'react'
import { connect } from 'react-redux'


const mapStateToProps = (state) => {
  return {
    currentColor: state.currentColor,
    colors: state.colors
  }
}

class ColorPicker extends React.Component{

  constructor(props){
    super(props)
    this.state = {
      currentColor: 'black',
      colors: ['black', 'pink', 'red'],
      inSelection: false,
    }
    this.handleClickSelectColor = this.handleClickSelectColor.bind()
  }

  componentDidMount(){
    this.setState({
      currentColor: 'black',
      colors: ['black', 'pink', 'red'],
    })
  }

  handleClickSelectColor = (event) => {
    console.log('select color has been clicked, currentColor is: ', this.state)
    console.log('colorSelect is: ', this.state)
    console.log('event is: ', event)
    this.setState({
      inSelection: true
    })
  }

  render() {
    console.log(this.state)
    return (
      <div>
        <a onClick={this.handleClickSelectColor} >
        select color
        </a>
        { this.state.inSelection ?
          this.state.colors.map( (color) => <div> {color} </div> )
          : null
        }
      </div>
    )
  }
}


export default connect(mapStateToProps, null)(ColorPicker)
