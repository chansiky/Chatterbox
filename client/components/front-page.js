import React from 'react'
import {withStyles} from '@material-ui/core/styles'
import { Typography } from '@material-ui/core'
import { RoomSearchBar } from './index'
import {withRouter} from 'react-router'
import green from '@material-ui/core/colors/green';
import teal from '@material-ui/core/colors/teal';
import BrushIcon from '@material-ui/icons/Brush';

const styles = {
  flexContainer1: {
    display: 'flex', 
    flexDirection: 'column',
    justifyContent: 'start',
    alignItems: 'center',
    height: '100vh',
  },
  flexItem1: {
    color: green[800], 
    display: 'block',
  },
  flexItem1BlankSpace: {
    display: 'block',
    height: '200px',
  },
  brushIcon: {
    color: green[800], 
    fontSize: '100px',
  },
  topErrorNotification: {
    textAlign: 'center',
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
      <div>
        {(fromRoom) && 
        <div >
          <Typography className={classes.topErrorNotification}>
            room &quot;{fromRoom}&quot; is full 
          </Typography>
        </div>
        }
        <div className={classes.flexContainer1}>
          <div className={classes.flexItem1BlankSpace} />
          <BrushIcon className={classes.brushIcon}/>
          <Typography variant='display3' className={classes.flexItem1} >
            drawRTC
          </Typography>
          <RoomSearchBar  className={classes.flexItem11}/>
        </div>
      </div>
      )
    }
}

export default withRouter(withStyles(styles)(FrontPage))
