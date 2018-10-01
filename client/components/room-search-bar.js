import React from 'react'
import {withRouter} from 'react-router'
import history from '../history'

import {TextField, Button} from '@material-ui/core'
import {withStyles} from '@material-ui/core/styles'


const styles = theme => ({
  formContainer:{
    display: 'flex', 
    flexWrap: 'wrap',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
  }, 
  textField: {
    width: 400,
  },
})

class RoomSearchBar extends React.Component{
  constructor(props){
    super(props)
  
  }

  state={
    error: false,
    roomField: '',
  }
  
  handleTextFieldChange = (event) => {
    this.setState({
      [event.target.name] : event.target.value
    })
  }

  handleSubmit = (event) => {
    event.preventDefault()
    history.push(`/peer/${this.state.roomField}`)
  }

  render(props){
    const { classes } = this.props

    return(
      <React.Fragment>
        <form className={classes.formContainer} onSubmit={this.handleSubmit}>
          <TextField
            id="standard-textarea"
            name="roomField"
            label="&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Enter room name"
            error={ this.state.error }
            value={this.state.formValue}
            autoFocus={true}
            onChange={this.handleTextFieldChange}
            placeholder="Johns_Room"
            className={classes.textField}
            margin="normal"
          />
          <Button label="Submit" type="submit" variant="outlined" className={classes.button}>
            submit
          </Button>
        </form>
      </React.Fragment>
      )
    }
}

export default withRouter(withStyles(styles)(RoomSearchBar))