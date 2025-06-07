import {useTypedSelector} from "./useTypedSelector";

export const useAccess = (access) => {
    const accesses = useTypedSelector(state => state.itemRefs.user.accesses)
    if (accesses) {
        return accesses.includes(access)
    } else {
        return true
    }
};