import { BigNumber } from "bignumber.js";

export function kValueValidate(value) {
    if (value.length !== 1802) 
        return false;

    for (let i = 0; i < 1802; i++)
        if (value[i] !== '0' && value[i] !== '1')
            return false;

    /* value is 1802 bits long and all bits are either 0 or 1 */
    return true;
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