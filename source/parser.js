var my_define = require("./define.js");
var my_tools = require("./tools.js");
var graphviz = require('graphviz');

var my_semantic = require("./semantic.js");


function parseTreeNode(val, cnt){
    this.parent = undefined;
    this.child = [];
    this.id = cnt;
    var index = my_define.TERMINAL_LIST.indexOf(val);
    if(index != -1){
        // is ter
        this.value = my_define.MAP_REVERSE_TERMINAL_LIST[index];
    }
    else{
        // is non-ter
        index = my_define.NONTERMIAL_LIST.indexOf(val);
        if(index != -1)
            this.value = my_define.MAP_REVERSE_NONTERMINAL_EN_LIST[index];
        else // is var-name
            this.value = val;
    }
    this.addParent = function addParent(node){
        this.parent = node;
    }
    this.addChild = function addChild(node){
        this.child.push(node);
    }
    
};
var parser = {
    token_list: [],

    action_table: [],
    goto_table:[],

    reduct_grammar:[],

    err_list: [],

    initParser: function(token_list, SLR){
        this.token_list = token_list;

        this.action_table = SLR.action_table;
        this.goto_table = SLR.goto_table;
        this.reduct_grammar = SLR.full_grammar_list;

        this.successParse = false;
        this.parse_sentence = "";
        this.node_stack = [];
        /* input sentence */
        this.token_list.forEach(per_token => {
            this.parse_sentence += my_define.MAP_TERMINAL_LIST[per_token["type"]] 
        });
        
    },
    goParser: function(is_debug = false){
        /* init status */
        status_id = [0];
        reduct_stack = '#';
        input = this.parse_sentence + '#';

        node_id = 1;
        my_semantic.semantic.sema_analyse_success = true;
        
        while(true){

            if(is_debug){
                console.log(reduct_stack);
            }
            var cur_input_char = input[0];
            // r12, s0 ....
            var cur_op = this.action_table[status_id[status_id.length-1]][cur_input_char];
            //console.log(cur_op)

            if(cur_op[0] == 's'){
                // status
                status_id.push(parseInt(cur_op.slice(1, cur_op.length)));
                reduct_stack += input[0];
                input = input.substr(1);

                //! add semantic node --- shift
                // find the node info
                var sema_new_node = new my_semantic.semanticNode(this.token_list[this.parse_sentence.length - input.length]);//reduct_stack[reduct_stack.length-1]);
                my_semantic.semantic.addNode(sema_new_node);

                //! add tree node --- shift....
                var new_node = new parseTreeNode(reduct_stack[reduct_stack.length-1], node_id ++);
                this.node_stack.push(new_node);
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


                //! reduct semantic node
                var reduct_success = my_semantic.semantic.reductNode(cur_grammar);
                if(is_debug){
                    console.log(cur_grammar);
                }
                my_semantic.semantic.sema_analyse_success *= reduct_success;
               

                //! merge tree node and add new tree node --- reduct
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
            }
            else if(cur_op == 'acc'){
                this.successParse = true;
                return true;
            }
            else if(cur_op == "error"){
                var cur_len = input.length - 1;
                var cur_token = my_tools.arrIndex(this.token_list, -cur_len);
                this.err_list.push(
                    "ParseError: Fail to parse at:" + cur_token.value +
                " line: " + cur_token.line_num + ", col:" + cur_token.col_num);
                    console.log(cur_token);
                console.log( "ParseError: Fail to parse at:" + cur_token.value +
                " line: " + cur_token.line_num + ", col:" + cur_token.col_num);
                return false;
            }
        }
    },
    visParserTree: function(){
        this.tree_root = this.node_stack[0];

        this.graphvisTree = graphviz.digraph("ParseTree");

        this.drawParserTree(this.tree_root);
        ////console.log( this.graphvisTree.to_dot() );
        this.graphvisTree.output( "png", "../ui/images/test01.png" );
    },

    drawParserTree: function(cur_node){
        if(cur_node.value == undefined){
            cur_node.value = "undefinded";
        }
        this.graphvisTree.addNode(cur_node.id + cur_node.value);

        if(cur_node.id != this.tree_root.id){
            this.graphvisTree.addEdge(cur_node.parent.id+cur_node.parent.value, cur_node.id+cur_node.value);
        }
        
        cur_node.child.forEach(per_child => {
            this.drawParserTree(per_child);
        });
    }

}

module.exports = {
    parser,
    parseTreeNode
};