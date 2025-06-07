import {actionType3, actionType4, itemGroupsState, itemMaterialsState, itemTypesState} from "../types/masters";

const stateData: itemTypesState = {
    item_types: []
}

export const SET_ITEM_TYPES = 'SET_ITEM_TYPES'
export const itemTypesReducer = (state = stateData, action: actionType3): itemTypesState => {
    switch (action.type) {
        case SET_ITEM_TYPES:
            return {...state, item_types: action.payload}
        default:
            return state
    }
}

const stateData2: itemMaterialsState = {
    materials: [],
    wears: [],
    sex: [],
    color: [],
    user: {
        cabinetes: [],
        accesses: []
    }
}

export const SET_ITEM_MATERIALS = 'SET_ITEM_MATERIALS'
export const SET_ITEM_WEARS = 'SET_ITEM_WEARS'
export const SET_ITEM_SEX = 'SET_ITEM_SEX'
export const SET_ITEM_COLOR = 'SET_ITEM_COLOR'
export const SET_USER = 'SET_USER'
export const itemMaterialsReducer = (state = stateData2, action: actionType4): itemMaterialsState => {
    switch (action.type) {
        case SET_ITEM_MATERIALS:
            return {...state, materials: action.payload}
        case SET_ITEM_WEARS:
            return {...state, wears: action.payload}
        case SET_ITEM_SEX:
            return {...state, sex: action.payload}
        case SET_ITEM_COLOR:
            return {...state, color: action.payload}
        case SET_USER:
            // @ts-ignore
            return {...state, user: action.payload}
        default:
            return state
    }
}