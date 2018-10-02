import React from 'react'
import {withStyles} from '@material-ui/core/styles'
import { Typography } from '@material-ui/core'
import { RoomSearchBar } from './index'
import {withRouter} from 'react-router'

const styles = {
  flexContainer1: {
    display: 'flex', 
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: 'charteuse',
  },
  flexItem1: {
    display: 'flex'
  }
}

class FrontPage extends React.Component{
  constructor(props){
    super(props)
  
  }
  render(props){
    const { classes } = this.props
    let fromRoom
    if(this.props.location.state){
      fromRoom = this.props.location.state.fromRoom
    }


    return(
      <div className={classes.flexContainer1}>
        {(fromRoom) && 
          <Typography>
            room &quot;{fromRoom}&quot; is full 
          </Typography>
        }
        <Typography variant='display3' className={classes.flexItem1}>
          drawRTC
        </Typography>
        <RoomSearchBar  className={classes.flexItem11}/>
      </div>
      )
    }
}

export default withRouter(withStyles(styles)(FrontPage))
