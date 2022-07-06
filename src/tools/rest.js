export function setCharAt(str, index, chr) {
    if(index > str.length - 1)
        return str;

    return str.substring(0, index) + chr + str.substring(index + 1);
}

export function debounceFunction(func, delay) {
    let timer;

    return function () {
        const context = this;
        const args = arguments;
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(context, args), delay);
    };
};

export function findTouchIndexById(arrayToSearh, idToFind) {
    for (let i = 0; i < arrayToSearh.length; i++) {
        const id = arrayToSearh[i].pointerId;
        if (id == idToFind) {
            return i;
        }
    }
    /* not found */
    return -1;
}

export function copyCanvasTouch({ pointerId, layerX, layerY }) {
    return { pointerId, layerX, layerY };
}
