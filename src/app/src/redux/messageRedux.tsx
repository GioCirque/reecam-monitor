import { createReducer, createActions } from 'reduxsauce'
import Immutable from 'seamless-immutable'

/* ------------- Types and Action Creators ------------- */

type MessageWithColor = {
    message: string,
    color: "success" | "warning" | "error" | "info" | "default"
}

const { Types, Creators } = createActions({
    openSnackbar: ['message'],
    openSnackbarWithColor: ['message', 'color'],
    closeSnackbar: null,
})

export const AuthTypes = Types
export default Creators

/* ------------- Initial State ------------- */

export const INITIAL_STATE = Immutable({
    snackbar : false,
    snackbarMessage : "",
    snackbarColor: "default",
})

/* ------------- Reducers ------------- */


export const openSnackbar = (state : any, { message } : any) => state.merge({snackbar: true, snackbarMessage: message })

export const openSnackbarWithColor = (state : any, {message, color} : MessageWithColor) => state.merge({ snackbar: true, snackbarMessage: message, snackbarColor: color })

export const closeSnackbar = (state : any) => state.merge({snackbar: false, snackbarColor: 'default'})


/* ------------- Hookup Reducers To Types ------------- */

export const reducer = createReducer(INITIAL_STATE, {
    [Types.OPEN_SNACKBAR]: openSnackbar,
    [Types.OPEN_SNACKBAR_WITH_COLOR]: openSnackbarWithColor,
    [Types.CLOSE_SNACKBAR]: closeSnackbar,
})
