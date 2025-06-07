import {applyMiddleware, combineReducers, createStore} from "redux";
import thunk from "redux-thunk";
import {mastersReducer} from "./mastersReducer";
import {itemGroupsReducer} from "./itemGroupsReducer";
import {itemMaterialsReducer, itemTypesReducer} from "./itemTypesReducer";

const rootReducer = combineReducers({
    masters: mastersReducer,
    item_groups: itemGroupsReducer,
    item_types: itemTypesReducer,
    itemRefs: itemMaterialsReducer
})

export type RootState = ReturnType<typeof rootReducer>
export const store = createStore(rootReducer, applyMiddleware(thunk))