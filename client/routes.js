import React, {Component} from 'react'
import {connect} from 'react-redux'
import {withRouter, Route, Switch} from 'react-router-dom'
import PropTypes from 'prop-types'
import {
  FrontPage, 
  RoomSignalComponent, 
  PeerSignalComponent
  } from './components'
import {me} from './store'

class Routes extends Component {
  componentDidMount () {
    this.props.loadInitialData()
  }

  render () {

    return (
      <Switch>
        <Route path="/peer/:roomId" component={PeerSignalComponent} />
        <Route path="/room/:roomId" component={RoomSignalComponent} />
        <Route exact path='/' component={FrontPage} />
      </Switch>
    )
  }
}

const mapState = (state) => {
  return {
  }
}

const mapDispatch = (dispatch) => {
  return {
    loadInitialData () {
      dispatch(me())
    }
  }
}

export default withRouter(connect(mapState, mapDispatch)(Routes))

Routes.propTypes = {
  loadInitialData: PropTypes.func.isRequired,
}
