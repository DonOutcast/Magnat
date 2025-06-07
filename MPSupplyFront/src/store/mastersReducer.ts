import {actionType, masterState} from "../types/masters";

const stateData: masterState = {
    masters: []
}

export const SET_MASTERS = 'SET_MASTERS'

export const mastersReducer = (state = stateData, action: actionType): masterState => {
    switch (action.type) {
        case SET_MASTERS:
            return {...state, masters: action.payload}
        default:
            return state
    }
}