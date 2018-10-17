import React from 'react'
import { connect } from 'react-redux'

class Chat extends React.Component{
  constructor(props){
    super(props)
  }

  render(props){
    return(
      <div>
        {this.props.text &&
          this.props.text.map(value => <div> {value} </div>)
        }
      </div>
    )
  }
}


const mapState = (state) => {
  return{
    text: state.chat.text
  }
}

export default connect(mapState, null)(Chat)
