const ADD_CHAT_TEXT = "ADD_CHAT_TEXT"

const initialState = {
  text : []
}

function addChatText(text){
  return {
    type: ADD_CHAT_TEXT,
    text
  } 
}

export function dispatchAddChatText(text){
  return (dispatch) => {
    dispatch(addChatText(text))
  }
}

export default function reducer(state = initialState, action){
  switch(action.type){
    case ADD_CHAT_TEXT:
      return {...state, text: [...state.text, action.text]} 
    default:
      return state
  }
}
