import {actionType2, itemGroupsState} from "../types/masters";

const stateData: itemGroupsState = {
    item_groups: []
}

export const SET_ITEM_GROUPS = 'SET_ITEM_GROUPS'

export const itemGroupsReducer = (state = stateData, action: actionType2): itemGroupsState => {
    switch (action.type) {
        case SET_ITEM_GROUPS:
            return {...state, item_groups: action.payload}
        default:
            return state
    }
}