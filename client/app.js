import React from 'react'
import Routes from './routes'

import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import green from '@material-ui/core/colors/green';
import pink from '@material-ui/core/colors/pink';
import red from '@material-ui/core/colors/red';

import Button from '@material-ui/core/Button';

const theme = createMuiTheme({
  palette: {
    primary: green,
    secondary: {
      main: '#F06292',
    },
    error: red,
    // Used by `getContrastText()` to maximize the contrast between the background and
    // the text.
    contrastThreshold: 3,
    // Used to shift a color's luminance by approximately
    // two indexes within its tonal palette.
    // E.g., shift from Red 500 to Red 300 or Red 700.
    tonalOffset: 0.2,
    type: 'light',
  },
});

const App = (props) => {
  return (
    <div>
      <MuiThemeProvider theme={theme}>
        <Routes />
      </MuiThemeProvider>
    </div>
  )
}

export default App

