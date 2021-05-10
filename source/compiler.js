
module.paths.push('./node_modules');

var pre_process = require("./preprocess.js");
var my_tools = require("./tools.js");
var my_lexer = require("./lexer.js");

var show_pre_process_result = 0;
var show_lexer_result = 0;
var show_ffs_result = 0;

console.log("Hello World");

var fs = require('fs');
var file = fs.readFileSync("./test/text.txt", "utf8");

var error_info;

/*
 *  Code without comment!
 */
var obj = {result : "", error_info: ""};
if(!pre_process.removeComment(file, obj)){
    if(show_pre_process_result)
        console.log(obj.error_info);
}
else{
    if(show_pre_process_result)
        console.log(obj.result);
}

/*
 *  Code to Tokens.
 */

my_lexer.Lexer.initLexer(obj.result, show_lexer_result);
var all_tokens = my_lexer.Lexer.getAllTokens();
if(my_lexer.Lexer.error_info.length != 0){
    // console.log(my_lexer.Lexer.error_info.length);
    for(let a in my_lexer.Lexer.error_info){
        console.log(my_lexer.Lexer.error_info[a]);
    }
}

const total_variable_num = 33;
Front_Char = '@';
/*  非终结符序列
    程序           @
    声明串         A
    声明           B
    声明类型        C
    变量声明        D
    函数声明        E
    数组声明        F
    形参           G
    参数列表        H
    参数           I
    语句块         J
    内部声明        K
    内部变量声明     L
    语句串         M
    语句           N
    赋值语句        O
    return语句     P
    while语句      Q
    if语句         R
    表达式         S
    加法表达式      T
    项            U
    因子           V
    FTYPE         W
    call          X
    数组           Y
    实参           Z
    实参列表        [
    占位符M        ]
    占位符N        ^
    占位符A        _
    占位符S        `
*/

var TERMINAL_LIST = ['b', 'c', 'd', 'f', 'g',
                 'i', 'l', 'n', 'r', 't',
                 'v', 'w', 'z', '=', '+',
                 '-', '*', '/', 'x', 'y',
                 ';', ',', ')', '(', '{',
                 '}', 'k'];

var MAP_TERMINAL_LIST = {"INT": 't', "VOID": 'v', "IF": 'i', "ELSE": 'l', "WHILE": 'w',
                     "RETURN": 'r', "ID": 'd', "INTEGER_CONST": 'g', "ASSIGN": '=', "PLUS": '+',
                     "MINUS": '-', "MUL": '*', "DIV": '/', "LG": 'y', "LT": 'x',
                     "LTE": 'b', "NOT_EQUAL": 'n', "LGE": 'c', "EQUAL": 'f', "SEMI": ';',
                     "COMMA": ',', "LPAREN": '(', "RPAREN": ')', "LBRACE": '{', "RBRACE": '}',
                     "LBRACKET": 'z', "RBRACKET": 'k'};

var MAP_REVERSE_TERMINAL_LIST =[ 'LTE',    'LGE',    'ID',          'EQUAL',  'INTEGER_CONST',
                                 'IF',     'ELSE',   'NOT_EQUAL',   'RETURN', 'INT', 
                                 'VOID',   'WHILE',  'LBRACKET',    'ASSIGN', 'PLUS',
                                 
                                 'MINUS',  'MUL',    'DIV',         'LT',     'LG',
                                 'SEMI',   'COMMA',  'RPAREN',      'LPAREN', 'LBRACE', 
                                 'RBRACE', 'RBRACKET']

var NONTERMIAL_LIST = ['@', 'A', 'B', 'C', 'D', 'E', 'F',
                   'G', 'H', 'I', 'J', 'K', 'L',
                   'M', 'N', 'O', 'P', 'Q', 'R',
                   'S', 'T', 'U', 'V', 'W', 'X',
                   'Y', 'Z', '[', '', ']', '^', '_', '`'];



var MAP_REVERSE_NONTERMINAL_EN_LIST = [ '<Demo>', '<Program>',   '<Declare>',   '<Declare Type>',  '<Variable Declare>',
                                     '<Func Declare>',   '<Array Declare>',   '<Formal Param>',   '<Formal Param List>',
                                     '<Params>',   '<Statement Block>',   '<Inner Declare>',   '<Inner Variable Declare>',
                                     "<Statement Set>",   "<Statement>",   "<Assign Statement>",  '<Return Statement>',
                                     '<While Statement>',   '<If Statement>',  '<Expression>',   '<Plus Expression>',
                                     "<Item>",   '<Factor>',   '<FTYPE>',   '<Call>',
                                     '<Array>',  '<Actual Param>',   '<Actual Param List>',   
                                     '<placeholder M>',   '<placeholder N>',   '<placeholder A>',   '<placeholder S>'];
     
var GRAMMAR = ["@->^A",
           "A->B|BA",
           "B->td;|td]_E|tdF;|vd]_E",
           "E->(G)`J",
           "F->zgk|zgkF",
           "G->H|v",
           "H->I|I,H",
           "I->td",
           "J->{KM}",
           "K->e|L;K",
           "L->td",
           "M->N|N]M",
           "N->R|Q|P|O",
           "O->d=S;|Y=S;",
           "P->r;|rS;",
           "Q->w](S)]_J",
           "R->i(S)]_J|i(S)]_J^l]_J",
           "S->T|TxT|TyT|TfT|TcT|TbT|TnT",
           "T->U|U+T|U-T",
           "U->V|V*U|V/U",
           "V->g|(S)|d|Y|d(Z)",
           "Y->dzSk|YzSk",
           "Z->[|e",
           "[->S|S,[",
           "]->e",
           "^->e",
           "_->e",
           "`->e" // 解决函数定义的问题 如果不加，return返回类型的错误无法判断
        ];



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

function unionOneEle(src_ele, dst_set){
    var set_changing = false;
    if(!dst_set.has(src_ele)){
        set_changing = true;
        dst_set.add(src_ele);
    }
    return set_changing;
}


function eqSet(as, bs) {
    if (as.size !== bs.size) return false;
    for (var a of as) if (!bs.has(a)) return false;
    return true;
}

function arrayIncludeSet(arr, set){
    var flag = -1;
    arr.forEach((cur_set, index) => {
        //console.log("cur_set : ");
        //console.log(cur_set);

        //console.log("set : ");
        //console.log(set);

        if(eqSet(cur_set, set)){
            flag = index;
            return;
        }
    });
    return flag;
}


var FirstFollowSet = {
    start:"",
    nonterminal:[],
    terminal:TERMINAL_LIST,
    first_set:[],
    follow_set:[],
    grammar_list:[],      // i.e. 'dzSk', 'YzSk'
    full_grammar_list:[], // i.e. Y->dzSk, Y->YzSk
    initFFS: function(start){
        this.start = start;

        for(let i = 0 ; i < total_variable_num; i ++ ){
            // share the s!!
            let s1 = new Set();
            let s2 = new Set();
            this.first_set.push(s1);
            this.follow_set.push(s2);
            this.grammar_list.push([]);
        }


    },
    /*
     * brief@ Split every grammer   i.e. M->N|N]M ==> M->N  M->N]M     grammar_list[index of M] = [N, N]M]
     */
    preProcess: function(grammar_list){
        let list_len = grammar_list.length;
        // tranverse all the grammer list
        for(let i = 0 ; i < list_len; i ++ ){
            var per_grammer = grammar_list[i];
            // find the nonterminal
            var head = per_grammer[0];
            this.nonterminal.push(head);
            // find all the tails~
            var tail_list = per_grammer.split('>')[1].split('|');
            // complete the grammer for each nonterminal
            tail_list.forEach(per_tail => {
                let grammer_index = NONTERMIAL_LIST.indexOf(head);
                this.grammar_list[grammer_index].push(per_tail);
                this.full_grammar_list.push(head + "->" + per_tail);
            });
        }
    },
    /*
     * brief@ 1. tranverse all the grammar
     *        2. tranverse the item of certain grammar until (a)  meet terminal
     *                                                       (b)  nonterminal first set does not have 'e'
     */
    calFirstSet: function(){
        var set_changing = true;
        while(set_changing){
            set_changing = false;
            this.nonterminal.forEach(head => {
                // tranverse all the nonterminal
                let grammar_index = NONTERMIAL_LIST.indexOf(head);

                this.grammar_list[grammar_index].forEach(per_tail => {
                    // tranverse all the grammer list of the nonter... 正式遍历每一个产生式
                    for(let i = 0 ; i < per_tail.length; i ++ ){
                        // tranverse all the item (when finish ? => 1.meet terminal 2.nonterminal first set does not have 'e') 遍历每个产生式的每一项
                        var head_first = per_tail[i];

                        if(TERMINAL_LIST.includes(head_first) || head_first == 'e'){
                            // union if it is terminal
                            set_changing += unionOneEle(head_first, this.first_set[grammar_index]);
                            break;//???
                        }
                        else if(NONTERMIAL_LIST.includes(head_first)){
                            // is non-terminal, union all the element of `head_first` into  `first_set[grammar_index]`
                            let last_grammer_index = NONTERMIAL_LIST.indexOf(head_first);
                            set_changing += unionTwoSet(this.first_set[last_grammer_index], this.first_set[grammar_index]);

                            if(!this.first_set[last_grammer_index].has('e')){
                                break;
                            }
                        }
                    }
                }); 
            });
        }
    },
    /*
     * brief@ 1. tranverse all the grammar
     *        2. tranverse the item(NON-TER ONLY!) of certain grammar until (a)  当前有空，其后一个（first）需要继续加入前一个（first），直到不空为止
     *                                                                      (b)  当到达最后一个，head的（follow）需要加入last的（follow)
     */
    calFollowSet: function(){
        // add the # for start non-ter
        let grammar_index = NONTERMIAL_LIST.indexOf(this.start);
        this.follow_set[grammar_index].add('#');

        var set_changing = true;
        while(set_changing){
            set_changing = false;
            this.nonterminal.forEach(head => {
                // tranverse all the nonterminal
                let grammar_index = NONTERMIAL_LIST.indexOf(head);

                this.grammar_list[grammar_index].forEach(per_tail => {
                    // tranverse all the grammer list of the nonter... 正式遍历每一个产生式
                    for(let i = 0 ; i < per_tail.length; i ++ ){
                        // tranverse all the item
                        var head_first = per_tail[i];
                        let first_grammer_index = NONTERMIAL_LIST.indexOf(head_first);
                        
                        if(NONTERMIAL_LIST.includes(head_first)){
                            for(let j = i + 1 ; j < per_tail.length; j ++ ){
                                // 两两相互遍历！ not the last one , add the last First-set into current Follow
                                var head_next = per_tail[j];
                                if(TERMINAL_LIST.includes(head_next)){ 
                                    // 终结符直接加上
                                    //console.log("--- " + head_next);
                                    set_changing += unionOneEle(head_next, this.follow_set[first_grammer_index]);
                                    break; // ???
                                }
                                else if(NONTERMIAL_LIST.includes(head_next)){
                                    // 不然需要继续遍历
                                    let last_grammer_index = NONTERMIAL_LIST.indexOf(head_next);
                                    set_changing += unionTwoSet(this.first_set[last_grammer_index] , this.follow_set[first_grammer_index]);
                                    if(!this.first_set[last_grammer_index].has('e')){
                                        break;
                                    }
                                }
                            }
                            //只选择non-ter
                            if(i + 1 < per_tail.length){
                                ;
                            }
                            else{
                                // last one !
                                set_changing += unionTwoSet(this.follow_set[grammar_index], this.follow_set[first_grammer_index]);
                            }
                        }
                    }
                }); 
            });
        }

        // get gid of e
        for(let i = 0 ; i < total_variable_num; i ++ ){
            this.follow_set[i].delete('e');
        }
    },
    /*
     * brief@ cal both set, show as you want to ...
     */
    calFirstFollow: function(grammar_list, is_debug = false){
        FirstFollowSet.preProcess(grammar_list);
        if(is_debug)
            FirstFollowSet.showAllSet();

        FirstFollowSet.calFirstSet();
        if(is_debug)
            FirstFollowSet.showFirstSet();

        FirstFollowSet.calFollowSet();
        if(is_debug)
            FirstFollowSet.showFollowSet();
    },

    showAllSet: function(){
        for(let i = 0 ; i < total_variable_num; i ++ ){
            if(this.grammar_list[i].length == 0)
                continue;
            console.log(NONTERMIAL_LIST[i] + " : ");
            for(let j = 0; j < this.grammar_list[i].length; j ++ ){
                console.log("   " + this.grammar_list[i][j]);
            }
        }
    },
    showFirstSet: function(){
        console.log("@@@First-Set@@@")
        for(let i = 0 ; i < total_variable_num; i ++ ){
            // if(this.first_set[i].size == 0)
            //     continue;
            console.log(NONTERMIAL_LIST[i] + " : ");
            console.log(this.first_set[i]);
        }
    },
    showFollowSet: function(){
        console.log("@@@Follow-Set@@@")
        for(let i = 0 ; i < total_variable_num; i ++ ){
            // if(this.follow_set[i].size == 0)
            //     continue;
            console.log(NONTERMIAL_LIST[i] + " : ");
            console.log(this.follow_set[i]);
        }
    },
}

test_grammer_list = [
    'M->N|N]M', ']->e', 'N->i|r|w'
];

FirstFollowSet.initFFS("@");
FirstFollowSet.calFirstFollow(GRAMMAR, show_ffs_result); //  = true

var SLR = {
    nonterminal: NONTERMIAL_LIST,
    active_closure: [],
    action_table: [],
    goto_table: [],
    transfer: [],
    my_prefix: [],
    start: [],
    terminal: [],
    follow_set: [],
    initSLR: function(ffs){
        this.start = ffs.start;
        this.terminal = ffs.terminal;
        this.follow_set = ffs.follow_set;
        this.grammar_list = ffs.grammar_list;
        this.full_grammar_list = ffs.full_grammar_list;
        this.full_grammar_list.unshift("1->"+ this.start);

        for(let i = 0 ; i <= total_variable_num; i ++ ){
            this.my_prefix.push([]);
        }
    },
    /*
     * brief@ add prefix for all the grammar and genarate the project!
     *        i.e. M -> N]M  ===> M -> .N]M  N.]M  N].M  N]M.
     */
    getPrefix: function(){
        // add dot for start sign
        this.my_prefix[total_variable_num].push("." + this.start);
        this.my_prefix[total_variable_num].push(this.start + ".");
        // tranverse all the grammar
        for(per_head in this.grammar_list){
            // tranverse all the belongings under certain head
            for(per_grammer in this.grammar_list[per_head]){
                var cur_grammer = this.grammar_list[per_head][per_grammer];
                if(cur_grammer == "e"){
                    this.my_prefix[per_head].push(".");
                    continue;
                }
                var g_len = cur_grammer.length;
                // insert a dot in grammer
                for(per_item in cur_grammer){
                    if(per_item == 0){
                        // add at the beginning
                        this.my_prefix[per_head].push("." + cur_grammer);
                    }
                    if(per_item + 1 < g_len){
                        // add in the middle
                        this.my_prefix[per_head].push(cur_grammer.slice(0,per_item + 1) + "." + cur_grammer.slice(per_item+1, g_len))
                    }
                    else{
                        // add at the end
                        this.my_prefix[per_head].push(cur_grammer + ".");
                    }
                }
            }
        }
        //// console.log(this.my_prefix);

    },
    /*
     * brief@ input as a set, enlarge the set with full closure.
     *        this is the step following the go-on process
     * param@ src_closure(a Set, which need enlarge!)
     * return@ the expanded closure
     */
    getClosure: function(src_closure){
        var res_list = src_closure;
        // stop when no more enlargement
        var set_changing = true;
        while(set_changing){
            set_changing = false;
            
            res_list.forEach(c_grammer => {
                // full grammar   i.e. M -> .N]M
                var g_len = c_grammer.length;

                var dot_pos = c_grammer.indexOf('.');
                if(dot_pos != -1){
                    if(dot_pos + 1 < g_len){
                        var char_after_dot = c_grammer[dot_pos + 1];
                        if(this.nonterminal.includes(char_after_dot)){
                            // char_after_dot is non-terminal, needs enlarge
                            var non_ter_index = this.nonterminal.indexOf(char_after_dot);
                            // start from this non-terminal
                            for(last_grammer in this.my_prefix[non_ter_index]){
                                // grammar which is start from this non-terminal
                                var last_cur_gra = this.my_prefix[non_ter_index][last_grammer];
                                if(last_cur_gra[0] == '.'){
                                    // the original one can be used to extend!
                                    var tmp_ret = char_after_dot + "->" + last_cur_gra;
                                    // add into the closure
                                    set_changing += unionOneEle(tmp_ret, res_list);
                                }
                            }
                        }
                    }
                    else{
                        if(c_grammer.length == 4){
                            // to epslion
                            
                        }
                        //console.log(c_grammer)
                    }
                }

            });
        }
        return res_list;
    },
    /*
     * brief@ calculate all the active project. record the transfer condition.
     *        is the prerequisite of the implement of go-to & action table
     *  
     */
    getActiveProject: function(){
        /*
         * 'this.transfer' and  'this.active_closure' has the same index!
         */
        console.log("%%%% getActiveProject %%%%")
        // the first status leading to the start sign
        var init_project = new Set();
        init_project.add("1->" + this.my_prefix[total_variable_num][0]);
        // expand the first status
        var init_extended_project = this.getClosure(init_project);
        this.active_closure.push(init_extended_project);
        ////console.log(init_extended_project);
        // start from the original. Use a queue!
        var queue = [];
        queue.push(init_extended_project);
        
        var all_reserved_chars = this.terminal + this.nonterminal;
        ////console.log(all_reserved_chars);
        while(queue.length != 0){
            var tmp_active_closure = queue.shift();
            // record the goto(x,i), which is a map
            var goto_function = {};
            // tranverse all the possible chars for the shift!  i.e. M -> .N]M  ==> M -> N.]M
            for(let i = 0 ; i < all_reserved_chars.length; i ++ ){
                var cur_char = all_reserved_chars[i];
                var tmp_go_function = this.getClosureShift(tmp_active_closure, cur_char);
                
                if(tmp_go_function.size > 0){
                    // can be shift!
                    var extend_go_function = this.getClosure(tmp_go_function);
                    var index_in_array = arrayIncludeSet(this.active_closure, extend_go_function);
                    if(index_in_array < 0){//! damn js Set can't simply use ===
                        // brand new status should be added in the queue for the next round shift and expand
                        queue.push(extend_go_function);
                        // this is a new status!
                        this.active_closure.push(extend_go_function);
                        //update index
                        index_in_array = this.active_closure.length - 1;
                    }
                    // focus on the ??? how to use ???
                    var dst_status_index = index_in_array; // this.active_closure.indexOf(extend_go_function);
                    goto_function[cur_char] = dst_status_index;
                }
            }
            this.transfer.push(goto_function);
        }

        // console.log("============================================");
        // for (i in this.active_closure){
        //     console.log(i + " : ")
        //     //console.log(this.transfer[i]);
        //     console.log( this.active_closure[i]);
        // }
    },
    /*
     * brief@ implement of go-to-function
     * params@ prefix_list( the Set which need shift!)
     *         shift_char( the shift-character)
     * retrun@ Set
     */
    getClosureShift: function(prefix_list, shift_char){
        var res_list = new Set();

        prefix_list.forEach(elemnt=>{
            // check if any grammar can be shift or not
            var g_len = elemnt.length;
            var dot_pos = elemnt.indexOf('.');
            if(dot_pos + 1 < g_len){
                // can be possible shift
                var char_after_dot = elemnt[dot_pos + 1];
                // can be shift!
                if(char_after_dot == shift_char){
                    // move the '.' backward
                    res_list.add(elemnt.slice(0, dot_pos) + shift_char + "." + elemnt.slice(dot_pos + 2, g_len));
                }
            }
        });
        return res_list;
    },
    fillActionGotoTable: function(){
        expanded_terminal = this.terminal;
        expanded_terminal.push('#');
        // fill action table
        for(id in this.active_closure){
            // tranverse every status I
            var cur_action = {};
            var cur_transfer = this.transfer[id];
            expanded_terminal.forEach(per_ter => {
                if(cur_transfer[per_ter] != undefined){
                    // can goto another status
                    cur_action[per_ter] = 's' + cur_transfer[per_ter];
                }
                else{
                    // can't go, maybe can reduct
                    var reductable = false;
                    this.active_closure[id].forEach(grammar => {
                        // only find the reductable item
                        if(grammar.indexOf('.') == grammar.length - 1){
                            var head = grammar[0];
                            if(head != "1"){
                                // omit the acc conditions
                                var head_index = this.nonterminal.indexOf(head);
                                if(this.follow_set[head_index].has(per_ter)){
                                    // this terminal is in the follow set... so let it be reduct
                                    var full_grammar_without_dot = grammar.slice(0, grammar.length - 1);
                                    if(full_grammar_without_dot.length == 3){
                                        // i.e. A->.
                                        full_grammar_without_dot += "e";
                                    }
                                    var grammar_id = this.full_grammar_list.indexOf(full_grammar_without_dot);
                                    cur_action[per_ter] = "r" + grammar_id;
                                    reductable = true;
                                    return;
                                }
                            }
                        }
                    });
                    if(reductable == false){
                        cur_action[per_ter] = "error";
                    }
                }

            });

            this.action_table.push(cur_action);
        }
        // fill acc 
        for(id in this.active_closure){
            var acc_grammar = "1->" + this.start + ".";
            if(this.active_closure[id].has(acc_grammar)){
                this.action_table[id]["#"] = "acc";
            }
        }
        // fill go-to table: after each reduct, we need to check if go-to is necessary! only add a status!
        for(id in this.active_closure){
            var cur_goto = {};
            var cur_transfer = this.transfer[id];

            this.nonterminal.forEach(non_ter => {
                var goto_index = cur_transfer[non_ter];
                if(goto_index != undefined){
                    // can goto another status
                    cur_goto[non_ter] = goto_index;
                }
                else{
                    cur_goto[non_ter] = "error";
                }
            });
            this.goto_table.push(cur_goto);
        }
        // console.log(this.full_grammar_list);

        // for(id in this.action_table){
        //     if(this.action_table[id].length == 0)
        //         continue;
        //     console.log(id + " : ")
            
        //     for (idd in this.action_table[id]){
                
        //         if(this.action_table[id][idd]!="error")
        //             console.log(this.action_table[id][idd])
        //     }
            
        // }

        // console.log(" == ", this.full_grammar_list);
        

        // console.log("goto");
        // for(id in this.goto_table){
        //     console.log(this.goto_table[id])
        // }

        
    }
}
SLR.initSLR(FirstFollowSet);
SLR.getPrefix();
SLR.getActiveProject();
SLR.fillActionGotoTable();

var graphviz = require('graphviz');
function parseTreeNode(val, cnt){
    this.parent = undefined;
    this.child = [];
    this.id = cnt;
    var index = TERMINAL_LIST.indexOf(val);

    if(index != -1){

        this.value = MAP_REVERSE_TERMINAL_LIST[index];
        // console.log("TERMINAL_LIST", val, value);
    }
    else{
        index = NONTERMIAL_LIST.indexOf(val);
        if(index != -1){
            this.value = MAP_REVERSE_NONTERMINAL_EN_LIST[index];
            //console.log("MAP_REVERSE_NONTERMINAL_EN_LIST", val, value);
        }
        else{
            this.value = val;
        }
    }

    this.addParent = function addParent(node){
        this.parent = node;
    }
    this.addChild = function addChild(node){
        this.child.push(node);
    }
    
};


function semanticNode(token){
    this.layer= 0;
    
    this.quad= 0;

    this.nextlist= [];
    this.truelist= [];
    this.falselist= [];
    
    this.type = token.type;
    this.value = token.value;
    this.position = "line: " + token.line_num + " col: " + token.col_num;
    this.size= []; // array ?
    this.func_params= []; // 
};

function arrIndex(arr, index){
    if(index < 0){
        return arr[arr.length + index];
    }
    else{
        return arr[index];
    }
}

function var_table_element(sema_node){
    this.layer = sema_node.layer;
    this.value = sema_node.value;
    this.size = [];
    this.data = [];
}
/*
 * notice@ params type can only be int! 
 */
function func_table_element(sema_node){
    this.value = sema_node.value; // name
    this.type = sema_node.type;
    this.func_params = sema_node.func_params;
    this.params_value = []; // ?
    this.addr = []; //? quad
    this.position = sema_node.position;
}

var semantic = {
    emit_code:[],
    func_table: [], // 
    vari_table: [],
    nextquad: 100,

    sema_node_list: [],
    err_list: [],
    layer: 0,

    sema_analyse_success: true,

    addNode: function(node){
        node.layer = this.layer;
        this.sema_node_list.push(node);
        // console.log(node)
    },
    /*
     * brief@ pop out all the old, and push in the new 
     *        change the name at the same time
     */
    updateNodeList: function(grammar){
        var two_parts = grammar.split("->");
        var new_node_val = two_parts[0];
        var old_node_list = two_parts[1];
        /* handle the empty!!! */
        if(old_node_list[0] == 'e')
            old_node_list = [];
        
        var newNode = new semanticNode(new my_lexer.Token(undefined, new_node_val));
        //Token(type, value, line_num = undefined, col_num = undefined)

        // console.log(grammar);
        for(let i = 0 ; i < old_node_list.length; i ++ ){
            this.sema_node_list.pop();
        }

        this.sema_node_list.push(newNode);
        return newNode; //! continue to handle the new node
    },
    times_d: 0,
                    // new_non_ter.value = "fuck you";
                // output = "";
                // this.sema_node_list.forEach(cle => {
                //     output += cle.value + "";
                // })
                // console.log("after: ", output)
    
    insertVarTable: function(sema_node, arr_size = undefined){
        var new_var_tb_ele = new var_table_element(sema_node);

        if(arr_size != undefined){
            new_var_tb_ele.size = arr_size;
        }

        this.vari_table.push(new_var_tb_ele);
    },
    insertFuncTable: function(sema_node){
        // console.log(sema_node);
        // console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@")
        var new_func_tb_ele = new func_table_element(sema_node);
        this.func_table.push(new_func_tb_ele);
    },
    /*
     * brief@ true means not find
     */
    SearchVarTable: function(sema_node){
        var can_declare = true;
        console.log("@@@cur table@@@");
        this.vari_table.forEach(per_var => {
            console.log(per_var)
            if(per_var.value == sema_node.value && sema_node.layer == per_var.layer){
                can_declare = false;
                return;
            }
        });
        return can_declare;
    },
    /* 
     * notice@ functions can only be declared at layer 0!
     */
    SearchFuncTable: function(sema_node){ 
        var can_declare = true;
        console.log("@@@cur func table@@@");
        this.func_table.forEach(per_func => {
            console.log(per_func)
            // params len the same && func_name the same  <=> redefined
            if(per_func.func_params.length == sema_node.func_params.length && per_func.value == sema_node.value){
                can_declare = false;
                return;
            }
        });
        return can_declare;
    },
    showFuncTable:function(){
        console.log("@@@cur func table@@@");
        this.func_table.forEach(per_func => {
            console.log(per_func)
        });
    },
    /*
     * brief@ check and insert
     */
    checkVarRedefine: function(var_name_node){
        var can_declare = this.SearchVarTable(var_name_node)
        if(can_declare){
            this.insertVarTable(var_name_node);
            return true;
        }
        else{
            this.err_list.push("Semantic Error: The variable " + var_name_node.value 
                + " at Position(" + var_name_node.position + " )is redefined.");
            return false;
        }
    },
    checkArrRedefine: function(var_name_node, var_size_node){
        var can_declare = this.SearchVarTable(var_name_node)
        if(can_declare){
            this.insertVarTable(var_name_node, var_size_node.size);
            return true;
        }
        else{
            this.err_list.push("Semantic Error: The Array " + var_name_node.value 
                + " at Position(" + var_name_node.position + " )is redefined.");
            return false;
        }
    },
    checkFuncRedefine: function(func_node){
        var can_declare = this.SearchFuncTable(func_node)
        // console.log("=============================")
        // console.log(func_node)
        if(can_declare){
            this.insertFuncTable(func_node);
            return true;
        }
        else{
            this.err_list.push("Semantic Error: The Function " + func_node.value 
                + " at Position(" + func_node.position + " )is redefined.");
            return false;
        }
    },
    reductNode: function(grammar){
        console.log(grammar);
        // output = "";
        // this.sema_node_list.forEach(cle => {
        //     output += cle.value + "";
        // })
        // console.log("after: ", output)
        switch(grammar){
            case "@->^A":

                break;
            case "A->B": 
            // "<声明串> ::= <声明>"
            case "A->BA": 
            // "<声明串> ::= <声明><声明串>"
            case "K->e":
            // "<内部声明> ::= e"    
            case "K->L;K":
            // "<内部声明> ::= <内部变量声明> ;<内部声明>"
                var new_non_ter = this.updateNodeList(grammar);
                console.log(" ====== ", new_non_ter.layer)
                
                break; // simply declare
            case "B->td;":
                // "<外部声明> ::= INT ID ;             var_table.insert(ID.name, int, layer, 4)"
                // int   id    ;
                //       -2   -1
                var var_name_node = arrIndex(this.sema_node_list, -2);
                if(!this.checkVarRedefine(var_name_node)){
                    return false;
                }
                var new_non_ter = this.updateNodeList(grammar);
                break;

                
                break;
            case "L->td":
                //"<内部变量声明> ::= INT ID                      var_table.insert(ID.name, int, layer, 4)"
                // int id
                //  -2 -1
                var var_name_node = arrIndex(this.sema_node_list, -1);
                if(!this.checkVarRedefine(var_name_node)){
                    return false;
                }
                var new_non_ter = this.updateNodeList(grammar);// pop and gen new-non-ter
                break;
            case "B->tdF;":
                // "<声明> ::= INT ID <数组声明> ;    var_table.insert(ID.name, int, layer, 4 * <数组声明>.size)"
                // int arr <...>  ;
                //     -3   -2  -1
                var var_name_node = arrIndex(this.sema_node_list, -3);
                var arr_size_node = arrIndex(this.sema_node_list, -2);
                // console.log(var_name_node, arr_size_node);
                if(!this.checkArrRedefine(var_name_node, arr_size_node)){
                    return false;
                }
                var new_non_ter = this.updateNodeList(grammar);
                break;
            case "F->zgk":
                // "<数组声明> ::= [ INTEGER_CONST ]              <数组声明>.size = [INTEGER_CONST]"
                // [  int ]
                // -3 -2 -1
                var arr_size_node = arrIndex(this.sema_node_list, -2);

                var new_non_ter = this.updateNodeList(grammar);
                new_non_ter.size.push(arr_size_node.value);
                break;
            case "F->zgkF":
                // "<数组声明1> ::= [ INTEGER_CONST ]<数组声明2>    <数组声明1>.size = [INTEGER_CONST] + <数组声明2>.size"
                //  [  int  ]  <....>
                //  -4  -3  -2  -1
                var old_arr_size_node = arrIndex(this.sema_node_list, -1);
                var int_node = arrIndex(this.sema_node_list, -3);
                var new_non_ter = this.updateNodeList(grammar);
                // concat the old size with the new size
                new_non_ter.size = old_arr_size_node.size;
                new_non_ter.size.unshift(int_node.value);
                break;
            case "B->td]_E":
                // "<声明> ::= INT ID <占位符M> <占位符A> <函数声明> "
            case "B->vd]_E":
                // "<声明> ::= VOID ID <占位符M> <占位符A> <函数声明> "
                //              -5  -4  -3        -2        -1
                // var func_node = arrIndex(this.sema_node_list, -1);
                // var return_type_node = arrIndex(this.sema_node_list, -5);
                // var func_name_node = arrIndex(this.sema_node_list, -4);
                // var new_non_ter = this.updateNodeList(grammar);
                // new_non_ter.type = return_type_node.value;
                // new_non_ter.func_params = func_node.func_params;
                // new_non_ter.value = func_name_node.value;
                // console.log("=======================")
                // console.log(new_non_ter)

                break;
            case "`->e":
                // <占位符S> :: = empty // 无中生有，最后一个（-1）的位置应该对应的是占位符前一个符号
                //"<函数声明> ::= ( <形参> ) <占位符S> <语句块>                    E->(G)`J"
                //"<声明> ::= INT ID <占位符M> <占位符A> <函数声明>"
                //"<声明> ::= VOID ID <占位符M> <占位符A> <函数声明>"
                // ==>TYPE ID <占位符M> <占位符A> ( <形参> ) <占位符S> <语句块> 
                //     -7   -6    -5       -4   -3   -2   -1
                
                var func_name_node = arrIndex(this.sema_node_list, -6);
                var func_type_node = arrIndex(this.sema_node_list, -7);
                var func_params_node = arrIndex(this.sema_node_list, -2);

                var tmp_func_node = func_type_node;
                tmp_func_node.value = func_name_node.value;
                tmp_func_node.func_params = func_params_node.func_params;

                if(!this.checkFuncRedefine(tmp_func_node)){
                    return false;
                }
                var new_non_ter = this.updateNodeList(grammar);

                break;
            case "E->(G)`J":
                // "<函数声明> ::= ( <形参> ) <占位符S> <语句块>         <函数声明>.param_list =  <形参>.param_list "
                // ( <...> ) S <...>
                // -5  -4  -3 -2 -1
                var func_params_node = arrIndex(this.sema_node_list, -4);
                var new_non_ter = this.updateNodeList(grammar);// pop and gen new-non-ter
                new_non_ter.func_params = func_params_node.func_params;
                //! function table ???
                break;               
            case "G->H":
                // "<形参> ::= <参数列表>                         <形参>.param_list = <参数列表>.param_list"
                var func_params_node = arrIndex(this.sema_node_list, -1);
                var new_non_ter = this.updateNodeList(grammar);// pop and gen new-non-ter
                new_non_ter.func_params = func_params_node.func_params;
                break;
            case "G->v":
                // "<形参> ::= VOID                             <形参>.param_list = []"
                var new_non_ter = this.updateNodeList(grammar);
                break;
            case "I->td":
                // "<参数> ::= INT ID                            var_table.insert(ID.name, int, layer, 4)"
                //  int a 
                //  -2 -1
                var var_name_node = arrIndex(this.sema_node_list, -1);
                var new_non_ter = this.updateNodeList(grammar);// pop and gen new-non-ter
                new_non_ter.func_params.push(var_name_node.value);
                break;
            case "H->I":
                // "<参数列表> ::= <参数>                         <参数列表>.param_list = [<参数>.name]"
                var func_params_node = arrIndex(this.sema_node_list, -1);
                var new_non_ter = this.updateNodeList(grammar);// pop and gen new-non-ter
                new_non_ter.func_params = func_params_node.func_params;
                break;
            case "H->I,H":
                // "<参数列表1> ::= <参数> , <参数列表2>        <参数列表1>.param_list = <参数列表2>   <参数列表1>.append(<参数>.name)"
                //  param, param_list
                //   -3  -2  -1
                var param_node = arrIndex(this.sema_node_list, -3);
                var param_list_node = arrIndex(this.sema_node_list, -1);
               
                var new_non_ter = this.updateNodeList(grammar);
                // console.log(param_list_node.func_params)
                // console.log(param_node.func_params)
                
                new_non_ter.func_params = param_list_node.func_params.concat(param_node.func_params);
                break;
            case "P->r;":
                // "<return语句> ::= RETURN ;                    emit(return, _, _, _)      "
                var cur_func_info = arrIndex(this.func_table, -1);
                if(cur_func_info.type == 'INT'){
                    this.err_list.push("Semantic Error: The Function " + cur_func_info.value 
                    + " at Position(" + cur_func_info.position + " ) should not have a return value.");
                    return false;
                }
                //emit
                var new_non_ter = this.updateNodeList(grammar);
                break;
            case "P->rS;":
                var cur_func_info = arrIndex(this.func_table, -1);
                if(cur_func_info.type == 'VOID'){
                    this.err_list.push("Semantic Error: The Function " + cur_func_info.value 
                    + " at Position(" + cur_func_info.position + " ) should not have a return value.");
                    return false;
                }
                //emit
                var new_non_ter = this.updateNodeList(grammar);
                break;
            case "S->T": 
                // "<表达式> ::= <加法表达式>
                var new_non_ter = this.updateNodeList(grammar);
                break;

            case "T->U":
                // "<加法表达式> ::= <项>
                var new_non_ter = this.updateNodeList(grammar);
                break;
            case "T->U+T":
            case "T->U-T":   
                // "<加法表达式1> ::= <项> + <加法表达式2>  <加法表达式1>.name = newTemp()  emit(+,<项>.name,<加法表达式2>.name,<加法表达式1>.name)"
                //                     -3  -2   -1

                var new_non_ter = this.updateNodeList(grammar);
                break;
            case "U->V":
                var new_non_ter = this.updateNodeList(grammar);
                break;
            case "U->V*U":
            case "U->V/U":
                var new_non_ter = this.updateNodeList(grammar);
                break;
            case "V->g":
            // "<因子> ::= INTEGER_CONST               <因子>.name = INTEGER_CONST"
                var new_non_ter = this.updateNodeList(grammar);
                break;
            case "V->(S)":
            // "<因子> ::= ( <表达式> )                  <因子>.name = <表达式>.name"
                var new_non_ter = this.updateNodeList(grammar);
                break;
            case "V->d":
            //"<因子> ::= ID                           <因子>.name = ID.name"
                var var_name_node = arrIndex(this.sema_node_list, -1);
                console.log(this.SearchVarTable(var_name_node))
                if(this.SearchVarTable(var_name_node)){
                    this.err_list.push("Semantic Error: The Variable " + var_name_node.value
                    + " at Position(" + var_name_node.position + ") is not defined before reference.")
                    return false;
                }
                break;
            //     case :
            //     break;
            // case :
            //     break;
            //     case :
            //     break;
            // case :
            //     break;
            //     case :
            //     break;
            // case :
            //     break;
            case "^->e":
                var new_non_ter = this.updateNodeList(grammar);
                //

                break;
            case "]->e":
            //  "<占位符M> ::= e                            M.quad = nextquad"
                var new_non_ter = this.updateNodeList(grammar);
                new_non_ter.quad = this.quad;
                break;
            case "_->e":
                // "<占位符A> ::= e                            layer++"
                var new_non_ter = this.updateNodeList(grammar);// pop and gen new-non-ter
                new_non_ter.layer = ++ this.layer;
                console.log("cur_layer : ", new_non_ter.layer);
                break;

        };
        
        return true;
    }


}



var parser = {
    token_list: [],

    obj: "", // SLR(GRAMMAR, '@'),
    action_table: [],
    goto_table:[],
    reduct_grammar:[],
    semantic_analyser: undefined,
    parse_analyse_string: "",
    parse_element_list: [], // error info
    err_list: [],
    sentence: "",
    initParser: function(token_list, SLR){
        this.token_list = token_list;
        this.action_table = SLR.action_table;
        this.goto_table = SLR.goto_table;
        this.reduct_grammar = SLR.full_grammar_list;
        this.successParse = false;
        this.parse_sentence = "";
        this.node_stack = [];
        this.token_list.forEach(per_token => {
            this.parse_sentence += MAP_TERMINAL_LIST[per_token["type"]] 
        });
        
    },
    goParser: function(is_debug = false){
        console.log(this.token_list);
        console.log(this.parse_sentence)
        status_id = [0];
        reduct_stack = '#';
        input = this.parse_sentence + '#';
        node_id = 1;
        semantic.sema_analyse_success = true;
        
        while(true){
            //console.log(status_id);
            //console.log(status_id[status_id.length-1], "+", input[0])

            var cur_input_char = input[0];
            var cur_op = this.action_table[status_id[status_id.length-1]][cur_input_char];
            //console.log(input)
            //if(is_debug)
            //console.log("status  ", status_id[status_id.length-1], cur_input_char, cur_op)
            
            if(cur_op[0] == 's'){
                // status
                status_id.push(parseInt(cur_op.slice(1, cur_op.length)));
                reduct_stack += input[0];
                input = input.substr(1);

                // add semantic node --- shift
                ////console.log(reduct_stack, this.token_list[this.parse_sentence.length - input.length]);
                // find the node info
                var sema_new_node = new semanticNode(this.token_list[this.parse_sentence.length - input.length]);//reduct_stack[reduct_stack.length-1]);
                semantic.addNode(sema_new_node);

                // add tree node --- shift....
                var new_node = new parseTreeNode(reduct_stack[reduct_stack.length-1], node_id ++);
                // console.log(new_node.value)
                this.node_stack.push(new_node);
                //// console.log(reduct_stack, "  ", reduct_stack[reduct_stack.length-1])
                //// console.log(new_node.id, new_node.value);

            }
            else if (cur_op[0] == 'r'){
                var grammar_id = parseInt(cur_op.slice(1, cur_op.length));
                var cur_grammar = this.reduct_grammar[grammar_id];
                var cur_reduct = cur_grammar.slice(3, cur_grammar.length);
                var reduct_num = 0;
                // the number of reduct!
                if(cur_reduct == "e"){
                    reduct_num = 0;
                }
                else{
                    reduct_num = cur_reduct.length;
                }
                // pop out the reducted string and push new non-ter
                var reduct_non_ter = cur_grammar[0]
                for(let i = 0 ; i < reduct_num; i ++ ){
                    status_id.pop();
                }
                status_id.push(this.goto_table[status_id[status_id.length-1]][reduct_non_ter])


                // reduct semantic node
                var reduct_success = semantic.reductNode(cur_grammar);

                console.log(reduct_stack);
                console.log(semantic.sema_analyse_success, reduct_success)
                semantic.sema_analyse_success *= reduct_success;
               

                // merge tree node and add new tree node --- reduct
                var list_node = []
                if(reduct_num == "0"){
                    var e_node = new parseTreeNode('empty', node_id ++ );
                    list_node.push(e_node);
                }
                else{
                    // pop out the reduct-stack
                    for(let i = 0 ; i < reduct_num; i ++ ){
                        reduct_stack = reduct_stack.slice(0, reduct_stack.length - 1);
                        list_node.push(this.node_stack.pop())
                    }
                }
                // get merged node 
                var merged_node = new parseTreeNode(reduct_non_ter, node_id ++ );
                this.node_stack.push(merged_node)
                reduct_stack += reduct_non_ter;
                // add children for the merged node
                while(list_node.length != 0){
                    var per_child = list_node.pop();
                    per_child.addParent(merged_node);
                    merged_node.addChild(per_child);
                }

                // console.log(merged_node.parent, merged_node.child);


            }
            else if(cur_op == 'acc'){
                this.successParse = true;
                return true;
            }
            else if(cur_op == "error"){
                return false;
            }
        }
    },
    visParserTree: function(){
        console.log(this.node_stack.length, this.node_stack[0].id);
        this.tree_root = this.node_stack[0];

        this.graphvisTree = graphviz.digraph("ParseTree");

        this.drawParserTree(this.tree_root);

        //console.log( this.graphvisTree.to_dot() );
        
        this.graphvisTree.output( "png", "../ui/images/test01.png" );
    },

    drawParserTree: function(cur_node){
        if(cur_node.value == undefined){
            cur_node.value = "undefinded";
        }
        // console.log("addNode : ", cur_node.id + cur_node.value)
        this.graphvisTree.addNode(cur_node.id + cur_node.value);

        if(cur_node.id != this.tree_root.id){
            // console.log("addEdge : " , cur_node.parent.id+'', cur_node.id+'')
            this.graphvisTree.addEdge(cur_node.parent.id+cur_node.parent.value, cur_node.id+cur_node.value);
            //console.log(cur_node.id, cur_node.value);
        }
        
        cur_node.child.forEach(per_child => {
            this.drawParserTree(per_child);
        });
    }

}

parser.initParser(all_tokens, SLR);
var parser_res = parser.goParser();
console.log(parser_res)
// console.log(parser.reduct_grammar);
if(parser_res){
    parser.visParserTree();
    //semantic.showFuncTable();
}
else{
    
}

if(semantic.sema_analyse_success){
    console.log("semantic true");
}
else{
    semantic.err_list.forEach( err=> {
        console.log(err);
    });

}









