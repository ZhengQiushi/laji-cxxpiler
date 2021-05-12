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

/*
 * brief@ merge two set...
 * param@ src_set 
 *        dst_set 
 * return@ T/F (if the dst_set was changed, changed for T)
 */
function unionTwoSet(src_set, dst_set){
    var set_changing = false;                     
    src_set.forEach(last_tail => {
        
        if(!dst_set.has(last_tail)){
            set_changing = true;
            dst_set.add(last_tail);
        }
    });
    return set_changing;
}
/*
 * brief@ merge one ele to the set...
 * param@ src_set 
 *        dst_set (Set())
 * return@ T/F (if the dst_set was changed, changed for T)
 */
function unionOneEle(src_ele, dst_set){
    var set_changing = false;
    if(!dst_set.has(src_ele)){
        set_changing = true;
        dst_set.add(src_ele);
    }
    return set_changing;
}

/*
 * brief@ judge if two set are the same or not
 * param@ as(set a) 
 *        bs(set b)
 * return@ T/F (the same for T)
 */
function eqSet(as, bs) {
    if (as.size !== bs.size) return false;
    for (var a of as) if (!bs.has(a)) return false;
    return true;
}
/*
 * brief@ judge if the set was inclued in the arr
 * param@ arr(the element is Set()) 
 *        set(target set)
 * return@ T/F (the 'set' is in the 'arr' for T)
 */
function arrayIncludeSet(arr, set){
    var flag = -1;
    arr.forEach((cur_set, index) => {
        if(eqSet(cur_set, set)){
            flag = index;
            return;
        }
    });
    return flag;
}

/*
 * brief@ get the 'index' th ele of the arr
 * param@ arr(an array) 
 *        index( minus means the reverse order)
 * return@ the 'index' th ele
 */
function arrIndex(arr, index){
    if(index < 0){
        // reverse order
        return arr[arr.length + index];
    }
    else{
        return arr[index];
    }
}

module.exports = {
    isSpace,
    isAlpha,
    isDigit,
    isAlNum,
    getKeyVal,
    isReservedKeyword,
    unionTwoSet,
    unionOneEle,
    eqSet,
    arrayIncludeSet,
    arrIndex
}