import {MastersType} from "../models/OrderModels";

export enum actionTypes {
    SET_MASTERS = 'SET_MASTERS',
    SET_ITEM_GROUPS = 'SET_ITEM_GROUPS',
    SET_ITEM_TYPES = 'SET_ITEM_TYPES',
    SET_ITEM_MATERIALS = 'SET_ITEM_MATERIALS',
    SET_ITEM_WEARS = 'SET_ITEM_WEARS',
    SET_ITEM_SEX = 'SET_ITEM_SEX',
    SET_ITEM_COLOR = 'SET_ITEM_COLOR',
    SET_USER = 'SET_USER'
}

interface setMasterAction {
    type: actionTypes.SET_MASTERS,
    payload: MastersType[]
}


export type actionType = setMasterAction
export interface masterState {
    masters: MastersType[]
}

interface setItemGroupsAction {
    type: actionTypes.SET_ITEM_GROUPS,
    payload: any[]
}
export type actionType2 = setItemGroupsAction
export interface itemGroupsState {
    item_groups: any[]
}

export type actionType3 = {
    type: actionTypes.SET_ITEM_TYPES,
    payload: any[]
}
export interface itemTypesState {
    item_types: any[]
}

export type actionType4 = {
    type: any,
    payload: any[]
}
export interface itemMaterialsState {
    materials: any[],
    wears: any[],
    sex: any[],
    color: any[],
    user: {
        accesses: string[];
        cabinetes: any[];
    }
}