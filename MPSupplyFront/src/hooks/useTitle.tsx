export const useTitle = (title: string) => {
    document.title = title
    const elem = document.getElementById('pageName')
    if (elem) {
        elem.innerHTML = title
    } else {
        setTimeout(function () {
            const elem = document.getElementById('pageName')
            if (elem) {
                elem.innerHTML = title
            }
        },300)
    }
};