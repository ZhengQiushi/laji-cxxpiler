var my_define = require("./define.js");
var my_tools = require("./tools.js");

var SLR = {
    nonterminal: my_define.NONTERMIAL_LIST,
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

        for(let i = 0 ; i <= my_define.total_variable_num; i ++ ){
            this.my_prefix.push([]);
        }
    },
    /*
     * brief@ add prefix for all the grammar and genarate the project!
     *        i.e. M -> N]M  ===> M -> .N]M  N.]M  N].M  N]M.
     */
    getPrefix: function(){
        // add dot for start sign
        this.my_prefix[my_define.total_variable_num].push("." + this.start);
        this.my_prefix[my_define.total_variable_num].push(this.start + ".");
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
                                    set_changing += my_tools.unionOneEle(tmp_ret, res_list);
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
        init_project.add("1->" + this.my_prefix[my_define.total_variable_num][0]);
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
                    var index_in_array = my_tools.arrayIncludeSet(this.active_closure, extend_go_function);
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

    }
}

module.exports = {
    SLR
};
