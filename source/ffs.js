var my_define = require("./define.js");
var my_tools = require("./tools.js");

var FirstFollowSet = {
    start:"",
    nonterminal:[],
    terminal:my_define.TERMINAL_LIST,
    first_set:[],
    follow_set:[],
    grammar_list:[],      // i.e. 'dzSk', 'YzSk'
    full_grammar_list:[], // i.e. Y->dzSk, Y->YzSk
    initFFS: function(start){
        this.start = start;

        for(let i = 0 ; i < my_define.total_variable_num; i ++ ){
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
                let grammer_index = my_define.NONTERMIAL_LIST.indexOf(head);
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
                let grammar_index = my_define.NONTERMIAL_LIST.indexOf(head);

                this.grammar_list[grammar_index].forEach(per_tail => {
                    // tranverse all the grammer list of the nonter... 正式遍历每一个产生式
                    for(let i = 0 ; i < per_tail.length; i ++ ){
                        // tranverse all the item (when finish ? => 1.meet terminal 2.nonterminal first set does not have 'e') 遍历每个产生式的每一项
                        var head_first = per_tail[i];

                        if(my_define.TERMINAL_LIST.includes(head_first) || head_first == 'e'){
                            // union if it is terminal
                            set_changing += my_tools.unionOneEle(head_first, this.first_set[grammar_index]);
                            break;//???
                        }
                        else if(my_define.NONTERMIAL_LIST.includes(head_first)){
                            // is non-terminal, union all the element of `head_first` into  `first_set[grammar_index]`
                            let last_grammer_index = my_define.NONTERMIAL_LIST.indexOf(head_first);
                            set_changing += my_tools.unionTwoSet(this.first_set[last_grammer_index], this.first_set[grammar_index]);

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
        let grammar_index = my_define.NONTERMIAL_LIST.indexOf(this.start);
        this.follow_set[grammar_index].add('#');

        var set_changing = true;
        while(set_changing){
            set_changing = false;
            this.nonterminal.forEach(head => {
                // tranverse all the nonterminal
                let grammar_index = my_define.NONTERMIAL_LIST.indexOf(head);

                this.grammar_list[grammar_index].forEach(per_tail => {
                    // tranverse all the grammer list of the nonter... 正式遍历每一个产生式
                    for(let i = 0 ; i < per_tail.length; i ++ ){
                        // tranverse all the item
                        var head_first = per_tail[i];
                        let first_grammer_index = my_define.NONTERMIAL_LIST.indexOf(head_first);
                        
                        if(my_define.NONTERMIAL_LIST.includes(head_first)){
                            for(let j = i + 1 ; j < per_tail.length; j ++ ){
                                // 两两相互遍历！ not the last one , add the last First-set into current Follow
                                var head_next = per_tail[j];
                                if(my_define.TERMINAL_LIST.includes(head_next)){ 
                                    // 终结符直接加上
                                    //console.log("--- " + head_next);
                                    set_changing += my_tools.unionOneEle(head_next, this.follow_set[first_grammer_index]);
                                    break; // ???
                                }
                                else if(my_define.NONTERMIAL_LIST.includes(head_next)){
                                    // 不然需要继续遍历
                                    let last_grammer_index = my_define.NONTERMIAL_LIST.indexOf(head_next);
                                    set_changing += my_tools.unionTwoSet(this.first_set[last_grammer_index] , this.follow_set[first_grammer_index]);
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
                                set_changing += my_tools.unionTwoSet(this.follow_set[grammar_index], this.follow_set[first_grammer_index]);
                            }
                        }
                    }
                }); 
            });
        }

        // get gid of e
        for(let i = 0 ; i < my_define.total_variable_num; i ++ ){
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

module.exports = {
    FirstFollowSet
}