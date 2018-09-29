import React from 'react'
import { connect } from 'react-redux'


const mapStateToProps = (state) => {
  return {
    currentColor: state.currentColor,
    colors: state.colors
  }
}

/*
const mapDispatchToProps = (dispatch) => {
  return ({
    setColor: () => {

    }
  )
}
*/

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

  /*
  setupColorPicker() {
    const picker = document.createElement('div')
    picker.classList.add('color-selector')
    colors
      .map(color => {
        const marker = document.createElement('div')
        marker.classList.add('marker')
        marker.dataset.color = color
        marker.style.backgroundColor = color
        return marker
      })
      .forEach(color => picker.appendChild(color))

    picker.addEventListener('click', ({ target }) => {
      color = target.dataset.color
      if (!color) return
      const current = picker.querySelector('.selected')
      current && current.classList.remove('selected')
      target.classList.add('selected')
    })

    document.body.appendChild(picker)

    // Select the first color
    picker.firstChild.click()
  }
  */

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
