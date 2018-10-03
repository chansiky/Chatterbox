import React from 'react'
import {withRouter} from 'react-router'
import history from '../history'

import {TextField, Button} from '@material-ui/core'
import {withStyles} from '@material-ui/core/styles'


const styles = theme => ({
  formContainer:{
    display: 'flex', 
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    margin: 0,
    padding: 0,
    border: 0,
    color: 'secondary',
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
    textFieldLabel: '     Enter room name',
  }
  
  handleTextFieldChange = (event) => {
    this.setState({
      [event.target.name] : event.target.value,
      textFieldLabel: "Enter room name",
      error: false,
    })
  }

  handleSubmit = (event) => {
    event.preventDefault()
    if(this.state.roomField === ''){
      this.setState({
        error: true,
        textFieldLabel: "     Room name must be provided",
    })
    }else{
      history.push(`/peer/${this.state.roomField}`)
    }
  }

  render(props){
    const { classes } = this.props
    const nbsp = "        "

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
            fullWidth={true}
            color="secondary"
          />
          <Button label="Submit" type="submit" variant="outlined" color="default" className={classes.button}>
            submit
          </Button>
        </form>
      </React.Fragment>
      )
    }
}

export default withRouter(withStyles(styles)(RoomSearchBar))
