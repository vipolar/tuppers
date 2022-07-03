import { BigNumber } from "bignumber.js";

export function setCharAt(str, index, chr) {
    if(index > str.length - 1)
        return str;

    return str.substring(0, index) + chr + str.substring(index + 1);
}

export function kValueBinaryToBase(value, base) {
    let valueBigNumber;
    let valueBigNumberString;
    BigNumber.config({ ALPHABET: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_~' });
   
    if (base === 'b64') {
        valueBigNumber = new BigNumber(value, 2).times(17);
        valueBigNumberString = valueBigNumber.toString(64);
    } else if (base === 'dec') {
        valueBigNumber = new BigNumber(value, 2).times(17);
        valueBigNumberString = valueBigNumber.toString(10);
    } else if (base === 'bin') {
        valueBigNumberString = value;
    } else { /* shouldn't be possible */
        valueBigNumberString = '!ERROR!'; 
    }

    return valueBigNumberString;
};

export function kValueBaseToBinary(value, base) {
    let valueBinaryString;
    BigNumber.config({ ALPHABET: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_~' });
    
    if (base === 'b64') {
        valueBinaryString = new BigNumber(value, 64).div(17).toString(2).padStart(1802, 0);
    } else if (base === 'dec') {
        valueBinaryString = new BigNumber(value, 10).div(17).toString(2).padStart(1802, 0);
    } else if (base === 'bin') {
        valueBinaryString = value;
    } else { /* shouldn't be possible */
        valueBinaryString = '!ERROR!'; 
    }

    return valueBinaryString;
};

export function stabilizeFunction(func, delay) {
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

export function getPixelsOnTheLine(x1, y1, x2, y2, pixelSize) {
    // Array to be returned in the end
    const pixelArray = [];
    let arrayLast = 0;
    // PseudoPixel coordinates
    let pixelCoordinates;
    let pixelX = 20;
    let pixelY = 20;
    // Iterators, counters required by algorithm
    let x, y, dx, dy, dx1, dy1, px, py, xe, ye, i;
    // Calculate line deltas
    dx = x2 - x1;
    dy = y2 - y1;
    // Create a positive copy of deltas (makes iterating easier)
    dx1 = Math.abs(dx);
    dy1 = Math.abs(dy);
    // Calculate error intervals for both axis
    px = 2 * dy1 - dx1;
    py = 2 * dx1 - dy1;
    // The line is X-axis dominant
    if (dy1 <= dx1) {
        // Line is drawn left to right
        if (dx >= 0) {
            x = x1; y = y1; xe = x2;
        } else { 
            // Line is drawn right to left (swap ends)
            x = x2; y = y2; xe = x1;
        }
        // Rasterize the line
        for (i = 0; x < xe; i++) {
            x = x + 1;
            // Deal with octants...
            if (px < 0) {
                px = px + 2 * dy1;
            } else {
                if ((dx < 0 && dy < 0) || (dx > 0 && dy > 0)) {
                    y = y + 1;
                } else {
                    y = y - 1;
                }
                px = px + 2 * (dy1 - dx1);
            }
            // Draw pixel from line span at
            // currently rasterized position
            pixelX = Math.floor(x / pixelSize);
            pixelY = Math.floor(y / pixelSize);
            pixelCoordinates = [pixelX, pixelY];
            arrayLast = pixelArray.length - 1;
            if (pixelArray.length > 0) {
                if (pixelX != pixelArray[arrayLast][0] || pixelY != pixelArray[arrayLast][1])
                    pixelArray.push(pixelCoordinates);
            } else {
                pixelArray.push(pixelCoordinates);
            }
        }
    } else {
        // The line is Y-axis dominant
        // Line is drawn bottom to top
        if (dy >= 0) {
            x = x1; y = y1; ye = y2;
        } else {
            // Line is drawn top to bottom
            x = x2; y = y2; ye = y1;
        }
         // Rasterize the line
        for (i = 0; y < ye; i++) {
            y = y + 1;
            // Deal with octants...
            if (py <= 0) {
                py = py + 2 * dx1;
            } else {
                if ((dx < 0 && dy<0) || (dx > 0 && dy > 0)) {
                    x = x + 1;
                } else {
                    x = x - 1;
                }
                py = py + 2 * (dx1 - dy1);
            }
            // Draw pixel from line span at
            // currently rasterized position
            pixelX = Math.floor(x / pixelSize);
            pixelY = Math.floor(y / pixelSize);
            pixelCoordinates = [pixelX, pixelY];
            arrayLast = pixelArray.length - 1;
            if (pixelArray.length > 0) {
                if (pixelX != pixelArray[arrayLast][0] || pixelY != pixelArray[arrayLast][1])
                    pixelArray.push(pixelCoordinates);
            } else {
                pixelArray.push(pixelCoordinates);
            }
        }
    }
    return pixelArray;
}