function isSpace(cur_char){
    if(cur_char == " " || cur_char == "\n" ){
        return true;
    }
    return false;
}
function isAlpha(cur_char){
    if("A" <= cur_char && cur_char <= "Z" || "a" <= cur_char && cur_char <= "z"){
        return true;
    }
    return false;
}
function isDigit(cur_char){
    if("0" <= cur_char && cur_char <= "9"){
        return true;
    }
    return false;
}
function isAlNum(cur_char){
    if(isDigit(cur_char) || isAlpha(cur_char)){
        return true;
    }
    return false;
}
/*
 * brief@ get key of map according to the value!
 * param@ map_arr(the key-value map) i.e. a: 1
 *        val    (the value)  i.e. 1
 * return@ the key i.e. a
 */
function getKeyVal(map_arr, val){
    var value_index = Object.values(map_arr).indexOf(val);
    var token_type = Object.keys(map_arr)[value_index];
    return token_type;
}
/*
 * brief@ check if the value is in the map-val or not!
 * param@ TokenType(the key-value map) i.e. a: 1
 *        token_val    (the value)  i.e. 1
 *        lower - upper [ : ) the border 
 * return@ T/F
 */
function isReservedKeyword(token_val, lower, upper, TokenType){
    var i = lower;
    var isReserved = false;
    var tokenType_val = Object.values(TokenType);

    for(let cur in tokenType_val){
        if(i > upper){
            break;
        }
        if(tokenType_val[cur] == token_val){
            return true;
        }
    }
    return isReserved;
}

module.exports = {
    isSpace,
    isAlpha,
    isDigit,
    isAlNum,
    getKeyVal,
    isReservedKeyword
}