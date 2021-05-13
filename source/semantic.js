var my_define = require("./define.js");
var my_tools = require("./tools.js");

var my_lexer = require("./lexer.js");

// true:��ֵ�͵ģ�false������ֵ��
function myIsNaN(value) {
    return typeof value === 'number' && !isNaN(value);
  }

function semanticNode(token){
    this.layer= 0;
    
    this.quad= 0;

    this.nextlist= [];
    this.truelist= [];
    this.falselist= [];
    
    this.type = token.type;   // ID INT ....
    this.value = token.value; // a, hello....
    this.position = "line: " + token.line_num + " col: " + token.col_num;
    this.size= []; // array
    this.func_params= []; // array
    this.func_params_tmp = []; //array t1, t2, t....
};



function var_table_element(sema_node, func){
    this.layer = sema_node.layer; // 
    this.value = sema_node.value; // 
    this.size = [];
    this.data = [];
    if(func == undefined){
        this.func = "global";
    }
    else{
        this.func = func;
    }
    
}
/*
 * notice@ params type can only be int! 
 */
function func_table_element(sema_node){
    this.value = sema_node.value; // name
    this.type = sema_node.type;
    this.func_params = sema_node.func_params;
    this.params_value = []; // ? 
    this.quad = sema_node.quad; //? quad
    this.position = sema_node.position;
}

function symbol_table_element(type, size, name, tmp_id, func, layer, offset){
    this.type = type;
    this.size = size;
    this.name = name;
    this.tmp_id = tmp_id;
    this.func = func;
    this.layer = layer;
    this.offset = offset;
}

function emit_code_element(position, op, r1, r2, res){
    this.position = position;
    this.op = op;
    this.r1 = r1;
    this.r2 = r2;
    this.res = res;
}
var semantic = {
    emit_code:[],
    new_tmp_num: 0,
    new_jmp_num: 0,
    func_table: [], // 
    vari_table: [],
    symbol_table: [],
    symbol_cur_offset : 0,
    nextquad: 100,

    sema_node_list: [],
    err_list: [],
    layer: 0,

    sema_analyse_success: true,

    /*
     * brief@ add node into the reduct stack
     */
    addNode: function(node){
        node.layer = this.layer;
        this.sema_node_list.push(node);
        //// console.log(node)
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
        /* pop item after the -> */
        for(let i = 0 ; i < old_node_list.length; i ++ ){
            this.sema_node_list.pop();
        }
        /* push the new non-ter */
        this.sema_node_list.push(newNode);
        return newNode; //! continue to handle the new node
    },
    /*
     * brief@ pop out the function content to remove the redefination of two functions 
     */
    removeVarTable:function(){
        while(this.vari_table.length > 0){
            /* pop the lastest */
            var cur_var_table = my_tools.arrIndex(this.vari_table, -1);
            if(cur_var_table.layer == this.layer + 1){
                
                this.vari_table.pop();
            }
            else{
                break;
            }
        }
    },
    /*
     * brief@ insert var into cur table
     * params@ sema_node() 
     *         arr_size(if array!)  
     */
    insertVarTable: function(sema_node, arr_size = undefined){
        var cur_func = my_tools.arrIndex(this.func_table, -1);
        
        var new_var_tb_ele;
        if(cur_func == undefined)
            new_var_tb_ele = new var_table_element(sema_node, undefined);
        else
            new_var_tb_ele = new var_table_element(sema_node, cur_func.value);
        
        if(arr_size != undefined){
            new_var_tb_ele.size = arr_size;
        }

        this.vari_table.push(new_var_tb_ele);
    },
    /*
     * brief@ insert func
     * params@ sema_node() 
     */
    insertFuncTable: function(sema_node){
        var new_func_tb_ele = new func_table_element(sema_node);
        this.func_table.push(new_func_tb_ele);
    },
    insertSymbolTable: function(func_node){
        func_node.func_params.forEach((per_param, index) => {
            
            this.symbol_table.push(new symbol_table_element("int", [4], per_param, func_node.func_params_tmp[index], func_node.value, this.layer, this.symbol_cur_offset));
            this.symbol_cur_offset += 4;
        });
    },
    searchSymbolTable: function(func, name){
        var is_exist = -1;
        
        this.symbol_table.forEach((per, index) => {

            if(per.func == "global" || per.func == func){

                if(per.name == name){
                    is_exist = index;
                    return;
                }
            }
        });
        return is_exist;
    },
    showSymbolTable: function(){
        console.log("@@@@@@@@symbol table @@@@@@@@")
        this.symbol_table.forEach(per => {
            console.log(per.type, per.size, per.name, per.tmp_id, per.func, per.layer);
        });
        console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@")

    },
    replaceSymbol:function(exp_node){
        if(!myIsNaN(exp_node.value)){ // not a number
            if(exp_node.value[0] == "t"){ // already is a tmp_reg
                return exp_node.value;
            }
            var cur_func = my_tools.arrIndex(this.func_table, -1);
            //console.log(exp_node)
            var symbol_ele = this.symbol_table[this.searchSymbolTable(cur_func.value, exp_node.value)];
            
            
            return symbol_ele.tmp_id;    
        }   
        return exp_node.value;
    },
    /*
     * brief@ search if the vari was declared already
     * params@
     * return@ index in the var-table
     */
    SearchVarTable: function(sema_node){
        var is_exist = false;
         console.log("@@@cur table@@@");

        var cur_func = my_tools.arrIndex(this.func_table, -1);
        var cur_field ="";
        // console.log(cur_func)
        // console.log(this.vari_table)
        if(cur_func == undefined){
            cur_field = "global";
        }
        else{
            cur_field = cur_func.value;
        }
        console.log(cur_field, sema_node.layer, sema_node.value);
        //console.log(sema_node);
        this.symbol_table.forEach(per_var => {
            //// console.log(per_var)
            // not in the same function 
            if(per_var.name == sema_node.value && sema_node.layer >= per_var.layer && cur_field == per_var.func){
                is_exist = true;
                console.log(cur_field, per_var.func);
                return;
            }
        });
        return is_exist;
    },
    /* 
     * notice@ functions can only be declared at layer 0!
     */
    SearchFuncTable: function(sema_node){ 
        var is_exist = -1;
        ////console.log("@@@cur func table@@@");
        this.func_table.forEach((per_func, index) => {
            ////console.log(per_func)
            // params len the same && func_name the same  <=> redefined
            if(per_func.func_params.length == sema_node.func_params.length && per_func.value == sema_node.value){
                is_exist = index;
                return;
            }
        });
        return is_exist;
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
        var is_exist = this.SearchVarTable(var_name_node)

        if(!is_exist){
            this.insertVarTable(var_name_node);
            return true;
        }
        else{
            this.showSymbolTable();
            console.log(var_name_node)
            var cur_func = my_tools.arrIndex(this.func_table, -1);
            console.log(cur_func);

            console.log("Semantic Error: The variable " + var_name_node.value 
            + " at Position(" + var_name_node.position + " )is redefined.")

            this.err_list.push("Semantic Error: The variable " + var_name_node.value 
                + " at Position(" + var_name_node.position + " )is redefined.");
            return false;
        }
    },
    checkArrRedefine: function(var_name_node, var_size_node){
        var is_exist = this.SearchVarTable(var_name_node)
        if(!is_exist){
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
        var is_exist = this.SearchFuncTable(func_node)
        // console.log("=============================")
        // console.log(func_node)
        if(is_exist == -1){
            this.insertFuncTable(func_node);
            this.insertSymbolTable(func_node);
            return true;
        }
        else{
            this.err_list.push("Semantic Error: The Function " + func_node.value 
                + " at Position(" + func_node.position + " )is redefined.");
            return false;
        }
    },
    /*
     * brief@ 
     */

    emit: function(op, r1, r2, res){
        if(r2 == ' ' && res == ' '){
            this.emit_code.push(new emit_code_element(this.nextquad, op, r1, " ", " "));//this.nextquad + ": " + op + r1);
        }
        else{
            this.emit_code.push(new emit_code_element(this.nextquad, op, r1, r2, res));//this.nextquad + ": " + op + ", " + r1 + ", " + r2 + ", " + res);
        }
        this.nextquad += 1;
    },
    backpatch: function(list, quad){
        //backpatch all items in the list with the addr quad
        this.emit_code.forEach((per_code, index) => {
            var target_addr = per_code.position;//slice(0, per_code.indexOf(":")); 

            if(list.includes(parseInt(target_addr))){
                this.emit_code[index].res = quad;// = per_code.slice(0,per_code.length - 1) + quad;
            }

        });
    },
    // backpatchFunc: function(list, target){
    //     //backpatch all items in the list with the addr quad
    //     this.emit_code.forEach((per_code, index) => {
    //         var target_addr = per_code.slice(0, per_code.indexOf(":")); 
    //         if(list.includes(parseInt(target_addr))){
    //             this.emit_code[index] = per_code.slice(0,per_code.length - 1) + quad;
    //         }
    //     });
    // },
    // backpatchJmp: function(list, target){
    //     //backpatch all items in the list with the addr quad
    //     this.emit_code.forEach((per_code, index) => {
    //         var target_addr = per_code.slice(0, per_code.indexOf(":")); 
    //         if(list.includes(parseInt(target_addr))){
    //             this.emit_code[index] = per_code.slice(0,per_code.length - 1) + quad;
    //         }
    //     });
    // },

    newTmp: function(){
        this.new_tmp_num += 1;
        return "t" + this.new_tmp_num;
    },
    newJumpDst: function(){
        this.new_jmp_num += 1;
        return "l" + this.new_jmp_num;
    },
    reductNode: function(grammar){
        
        //console.log(this.sema_node_list.length);
        // output = "";
        // this.sema_node_list.forEach(cle => {
        //     output += cle.value + "";
        // })
        // console.log("after: ", output)
        switch(grammar){
            case "@->^A":
                //  -2 -1
                var placeN_node = my_tools.arrIndex(this.sema_node_list, -2);
                var func_node = my_tools.arrIndex(this.sema_node_list, -1);



                func_node.value = "main";
                var index = this.SearchFuncTable(func_node);
                var cur_func = this.func_table[index];

                //this.backpatch(placeN_node.nextlist, cur_func.quad);// ?
                //this.backpatch(placeN_node.nextlist, cur_func.value);
                var new_non_ter = this.updateNodeList(grammar);
                

                

                
                break;
            case "A->B": 
            // "<������> ::= <����>"
            case "A->BA": 
            // "<������> ::= <����><������>"
            case "K->e":
            // "<�ڲ�����> ::= e"    
            case "K->L;K":
            // "<�ڲ�����> ::= <�ڲ���������> ;<�ڲ�����>"
                var new_non_ter = this.updateNodeList(grammar);
                //console.log(" ====== ", new_non_ter.layer)
                
                break; // simply declare
            case "B->td;":
                // "<�ⲿ����> ::= INT ID ;             var_table.insert(ID.name, int, layer, 4)"
                // int   id    ;
                //       -2   -1
                var is_success = true;
                var var_name_node = my_tools.arrIndex(this.sema_node_list, -2);
                if(!this.checkVarRedefine(var_name_node)){
                    is_success = false;
                }
                var new_non_ter = this.updateNodeList(grammar);

                this.symbol_table.push(new symbol_table_element("int", [4], var_name_node.value, this.newTmp(), "global", this.layer, this.symbol_cur_offset));
                this.symbol_cur_offset += 4;

                return is_success;
                break;
            case "L->td":
                //"<�ڲ���������> ::= INT ID                      var_table.insert(ID.name, int, layer, 4)"
                // int id
                //  -2 -1
                var is_success = true;
                var var_name_node = my_tools.arrIndex(this.sema_node_list, -1);

                if(!this.checkVarRedefine(var_name_node)){
                    is_success = false;
                }
                var new_tmp = this.newTmp();

                var cur_func = my_tools.arrIndex(this.func_table, -1);
                
                this.symbol_table.push(new symbol_table_element("int", [4], var_name_node.value, new_tmp, cur_func.value, this.layer, this.symbol_cur_offset));
                this.symbol_cur_offset += 4;

                var new_non_ter = this.updateNodeList(grammar);// pop and gen new-non-ter
                return is_success;
                break;
            case "B->tdF;":
                // "<����> ::= INT ID <��������> ;    var_table.insert(ID.name, int, layer, 4 * <��������>.size)"
                // int arr <...>  ;
                //     -3   -2  -1
                var is_success = true;
                var var_name_node = my_tools.arrIndex(this.sema_node_list, -3);
                var arr_size_node = my_tools.arrIndex(this.sema_node_list, -2);
                // console.log(var_name_node, arr_size_node);
                if(!this.checkArrRedefine(var_name_node, arr_size_node)){
                    is_success = false;
                }
                // ? global pop

                this.symbol_table.push(new symbol_table_element("int", arr_size_node.size, var_name_node.value, this.newTmp(), "global", this.layer, this.symbol_cur_offset));
                var offset_add = 1;
                arr_size_node.size.forEach( size => {
                    offset_add *= size;
                })
                this.symbol_cur_offset += offset_add;

                var new_non_ter = this.updateNodeList(grammar);
                return is_success;
                break;
            case "F->zgk":
                // "<��������> ::= [ INTEGER_CONST ]              <��������>.size = [INTEGER_CONST]"
                // [  int ]
                // -3 -2 -1
                var arr_size_node = my_tools.arrIndex(this.sema_node_list, -2);

                var new_non_ter = this.updateNodeList(grammar);
                new_non_ter.size.push(arr_size_node.value);
                break;
            case "F->zgkF":
                // "<��������1> ::= [ INTEGER_CONST ]<��������2>    <��������1>.size = [INTEGER_CONST] + <��������2>.size"
                //  [  int  ]  <....>
                //  -4  -3  -2  -1
                var old_arr_size_node = my_tools.arrIndex(this.sema_node_list, -1);
                var int_node = my_tools.arrIndex(this.sema_node_list, -3);
                var new_non_ter = this.updateNodeList(grammar);
                // concat the old size with the new size
                new_non_ter.size = old_arr_size_node.size;
                new_non_ter.size.unshift(int_node.value);
                break;
            case "B->td]_E":
                // "<����> ::= INT ID <ռλ��M> <ռλ��A> <��������> "
            case "B->vd]_E":
                // "<����> ::= VOID ID <ռλ��M> <ռλ��A> <��������> "
                var new_non_ter = this.updateNodeList(grammar);
                break;
            case "`->e":
                // <ռλ��S> :: = empty // �������У����һ����-1����λ��Ӧ�ö�Ӧ����ռλ��ǰһ������
                //"<��������> ::= ( <�β�> ) <ռλ��S> <����>                    E->(G)`J"
                //"<����> ::= INT ID <ռλ��M> <ռλ��A> <��������>"
                //"<����> ::= VOID ID <ռλ��M> <ռλ��A> <��������>"
                // ==>TYPE ID <ռλ��M> <ռλ��A> ( <�β�> ) <ռλ��S> <����> 
                //     -7   -6    -5       -4   -3   -2   -1
                var is_success = true;
                var func_name_node = my_tools.arrIndex(this.sema_node_list, -6);
                var func_type_node = my_tools.arrIndex(this.sema_node_list, -7);
                var func_params_node = my_tools.arrIndex(this.sema_node_list, -2);

                var tmp_func_node = func_type_node;
                tmp_func_node.value = func_name_node.value;
                tmp_func_node.func_params = func_params_node.func_params;

                this.emit(tmp_func_node.value, ":", " ", " ");

                var cur_index = 0;
                


                tmp_func_node.func_params.forEach((per_param, index) => {
                    tmp_func_node.func_params_tmp.push(this.newTmp());
                });
                tmp_func_node.func_params.forEach((per_param, index) => {
                    this.emit("pop",  "_", index*4, tmp_func_node.func_params_tmp[tmp_func_node.func_params_tmp.length - 1 - index]);
                    cur_index+=4;
                });
                if(cur_index!=0)
                    this.emit("-","fp",cur_index, "fp"); // ('-', 'fp', 12, 'fp')

                tmp_func_node.quad = this.nextquad;
                if(!this.checkFuncRedefine(tmp_func_node)){
                    is_success = false;
                }


                var new_non_ter = this.updateNodeList(grammar);
                return is_success;
                break;
            case "E->(G)`J":
                // "<��������> ::= ( <�β�> ) <ռλ��S> <����>         <��������>.param_list =  <�β�>.param_list "
                // ( <...> ) S <...>
                // -5  -4  -3 -2 -1

                //console.log(this.sema_node_list)

                var func_params_node = my_tools.arrIndex(this.sema_node_list, -4);
                var new_non_ter = this.updateNodeList(grammar);// pop and gen new-non-ter
                // console.log(func_params_node);
                // console.log(my_tools.arrIndex(this.sema_node_list, -1));

                new_non_ter.func_params = func_params_node.func_params;
                //! function table ???
                break;               
            case "G->H":
                // "<�β�> ::= <�����б�>                         <�β�>.param_list = <�����б�>.param_list"
                var func_params_node = my_tools.arrIndex(this.sema_node_list, -1);
                var new_non_ter = this.updateNodeList(grammar);// pop and gen new-non-ter
                new_non_ter.func_params = func_params_node.func_params;
                var index = 0;

                //console.log(new_non_ter.func_params)
                break;
            case "G->v":
                // "<�β�> ::= VOID                             <�β�>.param_list = []"
                var new_non_ter = this.updateNodeList(grammar);
                break;
            case "I->td":
                // "<����> ::= INT ID                            var_table.insert(ID.name, int, layer, 4)"
                //  int a 
                //  -2 -1
                var is_success = true;
                var var_name_node = my_tools.arrIndex(this.sema_node_list, -1);
                                
                // if(!this.checkVarRedefine(var_name_node)){
                //     is_success = false;
                // }
                
                var new_non_ter = this.updateNodeList(grammar);// pop and gen new-non-ter
                new_non_ter.func_params.push(var_name_node.value);
                return is_success;
                break;
            case "H->I":
                // "<�����б�> ::= <����>                         <�����б�>.param_list = [<����>.name]"
                var func_params_node = my_tools.arrIndex(this.sema_node_list, -1);
                var new_non_ter = this.updateNodeList(grammar);// pop and gen new-non-ter
                new_non_ter.func_params = func_params_node.func_params;
                break;
            case "H->I,H":
                // "<�����б�1> ::= <����> , <�����б�2>        <�����б�1>.param_list = <�����б�2>   <�����б�1>.append(<����>.name)"
                //  param, param_list
                //   -3  -2  -1
                var param_node = my_tools.arrIndex(this.sema_node_list, -3);
                var param_list_node = my_tools.arrIndex(this.sema_node_list, -1);
               
                var new_non_ter = this.updateNodeList(grammar);
                // console.log(param_list_node.func_params)
                // console.log(param_node.func_params)
                
                new_non_ter.func_params = param_list_node.func_params.concat(param_node.func_params);
                break;
            case "P->r;":
                // "<return���> ::= RETURN ;                    emit(return, _, _, _)      "
                var is_success = true;
                var cur_func_info = my_tools.arrIndex(this.func_table, -1);
                if(cur_func_info.type == 'INT'){
                    this.err_list.push("Semantic Error: The Function " + cur_func_info.value 
                    + " at Position(" + cur_func_info.position + " ) should not have a return value.");
                    is_success = false;
                }
                //emit
                var new_non_ter = this.updateNodeList(grammar); 
                this.emit("ret", "_", "_", "_");
                return is_success;
                break;
            case "P->rS;":
                // "<return���> ::= RETURN <���ʽ> ;            emit(return, <���ʽ>.name,_,_)"
                //                    -3      -2     -1
                var is_success = true;
                var cur_func_info = my_tools.arrIndex(this.func_table, -1);
                if(cur_func_info.type == 'VOID'){
                    this.err_list.push("Semantic Error: The Function " + cur_func_info.value 
                    + " at Position(" + cur_func_info.position + " ) should not have a return value.");
                    is_success = false;
                }
                var exp_node = my_tools.arrIndex(this.sema_node_list, -2);

                //emit
                var new_non_ter = this.updateNodeList(grammar);
                this.emit("=", this.replaceSymbol(exp_node), "_", "$v0");//exp_node.value
                this.emit("ret", "_", "_", "_");
                return is_success;

                break;
            case "M->N":
                // "<��䴮> ::= <���>                            <��䴮>.nextlist = <���>.nextlist"
                // nextlist
                var sentence_node = my_tools.arrIndex(this.sema_node_list, -1);
                var new_non_ter = this.updateNodeList(grammar);
                new_non_ter.nextlist = sentence_node.nextlist;
                break;
            case "M->N]M":
                // "<��䴮1> ::= <���><ռλ��M><��䴮2>  <��䴮1>.nextlist = <��䴮2>.nextlist backpatch(<���>.nextlist, M.quad)"
                //                 -3       -2       -1
                var sentence1_node = my_tools.arrIndex(this.sema_node_list, -3);
                var sentence2_node = my_tools.arrIndex(this.sema_node_list, -1);
                var placeM_node = my_tools.arrIndex(this.sema_node_list, -2);

                //this.backpatch(sentence1_node.nextlist, placeM_node.quad);
                this.backpatch(sentence1_node.nextlist, placeM_node.new_jmp_num);
                var new_non_ter = this.updateNodeList(grammar);
                new_non_ter.nextlist = sentence2_node.nextlist;

                break;
            case "N->R":
                // "<���> ::= <if���>                           <���>.nextlist = <if���>.nextlist"
                var sentence_node = my_tools.arrIndex(this.sema_node_list, -1);
                var new_non_ter = this.updateNodeList(grammar);
                new_non_ter.nextlist = sentence_node.nextlist;
                new_non_ter.type = "IF";
            case "N->Q":
                // "<���> ::= <while���>                        <���>.nextlist = <while���>.nextlist"    
                //nextlist
                var sentence_node = my_tools.arrIndex(this.sema_node_list, -1);
                var new_non_ter = this.updateNodeList(grammar);
                new_non_ter.nextlist = sentence_node.nextlist;
                new_non_ter.type = "WHILE";
                break;
            case "Q->w](S)]_J":
                //"<while���> ::= WHILE <ռλ��M1>( <���ʽ> ) <ռλ��M2> <ռλ��A> <����>"
                //                   -8      -7    -6  -5     -4  -3          -2       -1
                //"backpatch(<����>.nextlist,M1.quad)  backpatch(<���ʽ>.truelist, M2.quad)"
                //"<while���>.nextlist = <���ʽ>.falselist  emit(j,_,_,M1.quad)"
                // emit 
                var sentence_node = my_tools.arrIndex(this.sema_node_list, -1);
                var placeM2_node = my_tools.arrIndex(this.sema_node_list, -3);
                var exp_node = my_tools.arrIndex(this.sema_node_list, -5);
                var placeM1_node = my_tools.arrIndex(this.sema_node_list, -7);

                //this.emit("11111111111111111", "_", "_", "_");
                
                // backpatch
                // Loop continues! Judge the condition again
                //this.backpatch(sentence_node.nextlist, placeM1_node.quad);
                this.backpatch(sentence_node.nextlist, placeM1_node.new_jmp_num);
                // Condition true, continue to do the sentence
                //this.backpatch(exp_node.truelist, placeM2_node.quad);
                this.backpatch(exp_node.truelist, placeM2_node.new_jmp_num);
                
                var new_non_ter = this.updateNodeList(grammar);
                // Condition false, 
                new_non_ter.nextlist = exp_node.falselist;
                //this.emit("j", "_", "_", placeM1_node.quad);
                this.emit("j", "_", "_", placeM1_node.new_jmp_num);

                break;
            case "R->i(S)]_J":
                //"<if���> ::= IF ( <���ʽ> ) <ռλ��M> <ռλ��A> <����>"
                //             -7  -6  -5    -4  -3        -2        -1
                //"backpatch(<���ʽ>.truelist,M.quad) <if���>.nextlist = merge(<���ʽ>.falselist, <����>.nextlist)"
                var sentence_node = my_tools.arrIndex(this.sema_node_list, -1);
                var placeM_node = my_tools.arrIndex(this.sema_node_list, -3);
                var exp_node = my_tools.arrIndex(this.sema_node_list, -5);
                //backpatch
                //this.backpatch(exp_node.truelist, placeM_node.quad);//? new_jmp_num
                this.backpatch(exp_node.truelist, placeM_node.new_jmp_num);//? 

                // emit
                var new_non_ter = this.updateNodeList(grammar);
                new_non_ter.nextlist = exp_node.falselist.concat(sentence_node.nextlist);
                break;
            case "R->i(S)]_J^l]_J":
                //"<if���> ::= IF ( <���ʽ> ) <ռλ��M1> <ռλ��A> <����1> <ռλ��N> ELSE <ռλ��M2> <ռλ��A> <����2>"
                //             -12 -11  -10  -9  -8          -7        -6       -5       -4    -3         -2         -1          
                //"backpatch(<���ʽ>.truelist,M1.quad)  backpatch(<���ʽ>.falselist,M2.quad)"
                //"<if���>.nextlist = merge(<����1>.nextlist, N.nextlist, <����2>.nextlist)"  
                var exp_node = my_tools.arrIndex(this.sema_node_list, -10);
                var placeM1_node = my_tools.arrIndex(this.sema_node_list, -8);
                var sentence_node1 = my_tools.arrIndex(this.sema_node_list, -6);
                var placeN_node = my_tools.arrIndex(this.sema_node_list, -5);
                var placeM2_node = my_tools.arrIndex(this.sema_node_list, -3);
                var sentence_node2 = my_tools.arrIndex(this.sema_node_list, -1);

                // this.backpatch(exp_node.truelist, placeM1_node.quad);
                // this.backpatch(exp_node.falselist, placeM2_node.quad);
                this.backpatch(exp_node.truelist, placeM1_node.new_jmp_num);
                this.backpatch(exp_node.falselist, placeM2_node.new_jmp_num);
                
                // emit
                var new_non_ter = this.updateNodeList(grammar);
                new_non_ter.nextlist = sentence_node1.nextlist.concat(sentence_node2.nextlist);
                new_non_ter.nextlist = new_non_ter.nextlist.concat(placeN_node.nextlist);
                break;
            case "N->O":
            case "N->P":
                // "<���> ::= <return���>                       <���>.nextlist = []"
                // "<���> ::= <��ֵ���>                          <���>.nextlist = []"    
                var new_non_ter = this.updateNodeList(grammar);
                break;
            case "O->d=S;":
                // "<��ֵ���> ::= ID = <���ʽ>;                  emit(=,<���ʽ>.name,_,ID.name)"
                //                -4 -3   -2  -1
                var is_success = true;
                var var_name_node = my_tools.arrIndex(this.sema_node_list, -4);
                var exp_node = my_tools.arrIndex(this.sema_node_list, -2);
                
                if(!this.SearchVarTable(var_name_node)){
                    this.showSymbolTable();
                    

                    console.log("Semantic Error: The Variable " + var_name_node.value
                    + " at Position(" + var_name_node.position + ") is not defined before reference.")

                    this.err_list.push("Semantic Error: The Variable " + var_name_node.value
                    + " at Position(" + var_name_node.position + ") is not defined before reference.")
                    is_success = false;
                }
                
                // console.log("hahahahah");
                // console.log(exp_node);

                // exp name! exact value?
                this.emit("=", this.replaceSymbol(exp_node), "_", this.replaceSymbol(var_name_node));

                var new_non_ter = this.updateNodeList(grammar);
                return is_success;
                // emit

                break;
            case "O->Y=S;":
                // "<��ֵ���> ::= <����> = <���ʽ>;               emit(=,<���ʽ>.name,_,<����>.name)"
                //                    -4 -3   -2  -1
                var is_success = true;
                var arr_name_node = my_tools.arrIndex(this.sema_node_list, -4);
                // array_name !
                // but emit the whole array thing! // hard copy
                var arr_node_with_real_name = new semanticNode({type:""});
                Object.assign(arr_node_with_real_name, arr_name_node);
                arr_node_with_real_name.value = arr_node_with_real_name.value.slice(0, arr_node_with_real_name.value.indexOf("["));
                
                var exp_node = my_tools.arrIndex(this.sema_node_list, -2);
                if(!this.SearchVarTable(arr_node_with_real_name)){
                    this.err_list.push("Semantic Error: The Array " + arr_node_with_real_name.value
                    + " at Position(" + arr_name_node.position + ") is not defined before reference.")
                    is_success = false;
                }

                // ? array
                
                // exp name! exact value?
                this.emit("=", exp_node.value, "_", arr_name_node.value);

                //this.emit("=", exp_node.value, "_", arr_name_node.value)

                // emit
                var new_non_ter = this.updateNodeList(grammar);
                return is_success;
                break;
            case "V->Y":
                // "<����> ::= <����>                          <����>.name = <����>.name"
                var is_success = true;
                var arr_name_node = my_tools.arrIndex(this.sema_node_list, -1);
                // find array name but cur name is a whole array thing like a[][]                
                var arr_node_with_real_name = new semanticNode({type:""});
                Object.assign(arr_node_with_real_name, arr_name_node);
                arr_node_with_real_name.value = arr_name_node.value.slice(0, arr_name_node.value.indexOf("["));

                if(!this.SearchFuncTable(arr_node_with_real_name)){
                    this.err_list.push("Semantic Error: The Array " + arr_node_with_real_name.value
                    + " at Position(" + arr_name_node.position + ") is not defined before reference.")
                    is_success = false;
                }
                var new_non_ter = this.updateNodeList(grammar);
                new_non_ter.value = arr_name_node.value;
                return is_success;
               break;
            case "Y->dzSk":
                // "<����> ::= ID [ <���ʽ> ]    <����>.layer  <����>.name = ID.name[<���ʽ>.name]   <����>.size = [int(<���ʽ>.name)]"
                //             -4 -3   -2   -1
                var arr_name_node = my_tools.arrIndex(this.sema_node_list, -4);
                var exp_node = my_tools.arrIndex(this.sema_node_list, -2);
                var new_non_ter = this.updateNodeList(grammar);

                new_non_ter.size.push(exp_node.value);
                // get all array thing
                new_non_ter.value = arr_name_node.value + "[" + exp_node.value + "]";
                break;
            case "Y->YzSk":
                //"<����1> ::= <����2> [ <���ʽ> ]    <����1>.name = <����2>.name + [<���ʽ>.name] "
                //             -4      -3    -2   -1
                //"<����1>.size = <����2>.size +[int(<���ʽ>.name)]  <����1>.layer = <����2>.layer"
                //    
                var arr_name_node = my_tools.arrIndex(this.sema_node_list, -4);
                var exp_node = my_tools.arrIndex(this.sema_node_list, -2);
                var new_non_ter = this.updateNodeList(grammar);

                new_non_ter.value = arr_name_node.value + "[" + exp_node.value + "]";
                new_non_ter.size = arr_name_node.size;
                new_non_ter.size.push(exp_node.value);
                break;

            case "S->T": 
                // "<���ʽ> ::= <�ӷ����ʽ>
                var exp_node = my_tools.arrIndex(this.sema_node_list, -1);
                var new_non_ter = this.updateNodeList(grammar);

                new_non_ter.value = exp_node.value;
                new_non_ter.truelist.push(this.nextquad);
                new_non_ter.falselist.push(this.nextquad + 1);
                break;
            case "S->TxT":
            case "S->TyT":
            case "S->TfT":
            case "S->TcT":   
            case "S->TbT":
            case "S->TnT":
                //"<���ʽ> ::= <�ӷ����ʽ1> relop <�ӷ����ʽ2>         !!! Ĭ�ϳ���relop����� ���������Ƚ� �����ڸ�ֵ����"
                //              (   -3         -2          -1
                //"<���ʽ>.name = NULL  <���ʽ>.truelist = [nextquad]  <���ʽ>.falselist = [nextquad+1]"
                //"emit(j relop, <�ӷ����ʽ1>.name, <�ӷ����ʽ2>.name��_)  emit(j,_,_,_)"
                // logic op
                var exp_node1 = my_tools.arrIndex(this.sema_node_list, -3);
                var exp_node2 = my_tools.arrIndex(this.sema_node_list, -1);
                var op_node = my_tools.arrIndex(this.sema_node_list, -2);
                var par_node = my_tools.arrIndex(this.sema_node_list, -4);
                var new_non_ter = this.updateNodeList(grammar);

                
                console.log(par_node);
                if(par_node.value != "("){
                    new_non_ter.new_jmp_num = this.newJumpDst();
                    this.emit(new_non_ter.new_jmp_num, ":", " ", " ");  
                }


                new_non_ter.truelist.push(this.nextquad);
                new_non_ter.falselist.push(this.nextquad + 1);

                //console.log(exp_node1);
                //console.log(exp_node2);
                 
                this.emit("j " + op_node.value, this.replaceSymbol(exp_node1), this.replaceSymbol(exp_node2), "_");
                this.emit("j", "_", "_", "_");


                break;

            case "T->U":
                // "<�ӷ����ʽ> ::= <��>
                var item_node = my_tools.arrIndex(this.sema_node_list, -1);
                var new_non_ter = this.updateNodeList(grammar);
                new_non_ter.value = item_node.value;
                break;
            case "T->U+T":
            case "T->U-T": 
            case "U->V*U":
            case "U->V/U":  
                // "<�ӷ����ʽ1> ::= <��> + <�ӷ����ʽ2>  <�ӷ����ʽ1>.name = newTemp()  emit(+,<��>.name,<�ӷ����ʽ2>.name,<�ӷ����ʽ1>.name)"
                //                     -3  -2   -1
                var exp_node = my_tools.arrIndex(this.sema_node_list, -1);
                var op_node = my_tools.arrIndex(this.sema_node_list, -2);
                var item_node = my_tools.arrIndex(this.sema_node_list, -3);
                
                
                var new_non_ter = this.updateNodeList(grammar);
                new_non_ter.value = this.newTmp();
                

                this.emit(op_node.value, this.replaceSymbol(item_node), this.replaceSymbol(exp_node), this.replaceSymbol(new_non_ter));

                break;
            case "U->V":
                // "<��> ::= <����>                        <��>.name = <����>.name"
                var factor_node = my_tools.arrIndex(this.sema_node_list, -1);
                var new_non_ter = this.updateNodeList(grammar);
                new_non_ter.value = factor_node.value;
                break;
            // case "U->V*U":
            // case "U->V/U":
            //     var new_non_ter = this.updateNodeList(grammar);
            //     break;
            case "V->g":
            // "<����> ::= INTEGER_CONST               <����>.name = INTEGER_CONST"
                var int_node = my_tools.arrIndex(this.sema_node_list, -1);
                var new_non_ter = this.updateNodeList(grammar);
                new_non_ter.value = int_node.value;
                break;
            case "V->(S)":
            // "<����> ::= ( <���ʽ> )                  <����>.name = <���ʽ>.name"
                var exp_node = my_tools.arrIndex(this.sema_node_list, -2);
                var new_non_ter = this.updateNodeList(grammar);
                new_non_ter.value = exp_node.value;
                break;
            case "V->d":
            //"<����> ::= ID                           <����>.name = ID.name"
                var is_success = true;
                var var_name_node = my_tools.arrIndex(this.sema_node_list, -1);
                ////console.log(this.SearchVarTable(var_name_node))
                if(!this.SearchVarTable(var_name_node)){
                    this.err_list.push("Semantic Error: The Variable " + var_name_node.value
                    + " at Position(" + var_name_node.position + ") is not defined before reference.")
                    is_success = false;
                }
                var new_non_ter = this.updateNodeList(grammar);
                new_non_ter.value = var_name_node.value;
                return is_success;
                break;
            case "V->d(Z)":
                //"<����> ::= ID ( <ʵ��> )  push <ʵ��>.param_list   emit(jal,func_table.find(ID.name).enterPoint)"
                //            -4 -3  -2   -1
                //" if(f.returnType == int) <����>.name = newTemp()  emit(=,ID.name(),_,<����>.name)"
                var is_success = true;
                var real_param_list = my_tools.arrIndex(this.sema_node_list, -2);
                var func_name_node = my_tools.arrIndex(this.sema_node_list, -4);


                var tmp_func_node = func_name_node;
                tmp_func_node.func_params = real_param_list.func_params;

                var index = this.SearchFuncTable(tmp_func_node);
                // for output
                var param_list = "";
                var param_num = tmp_func_node.func_params.length;

                this.emit("-", "sp", 4, "sp");
                this.emit("store", "_", 0, "ra");


                if(tmp_func_node.func_params.length == 0){
                    param_list = "VOID";
                }
                else{
                    var cur_func = my_tools.arrIndex(this.func_table, -1);

                    
                    if(tmp_func_node.func_params.length!=0) // frame pointer
                        this.emit("+", "fp", tmp_func_node.func_params.length * 4, "fp");

                    tmp_func_node.func_params.forEach((param, index) => {
                        var symbol_ele = this.symbol_table[this.searchSymbolTable(cur_func.value, param)];
                        if(symbol_ele == undefined){
                            this.emit("param", param, index * 4, "_");
                        }
                        else{
                            this.emit("param", symbol_ele.tmp_id, index * 4, "_");
                        }
                        
                        param_list += "INT";
                        if(index != param_num - 1){
                            param_list += ", ";
                        }
                    });
                }
                this.emit("call", "_", "_", this.func_table[index].value);
                param_list = "(" +param_list + ")";

                this.emit("load", "_", 0, "ra");
                this.emit("+", "sp", 4, "sp");
                

                if(index == -1){
                    this.err_list.push("Semantic Error: The Function " + tmp_func_node.value + 
                    param_list + " at Position( " + tmp_func_node.position +") is undefined before reference")
                    is_success = false;
                }

                var cur_func = this.func_table[index];
                // emit params

                // emit jal
                ////console.log(tmp_func_node)
                var new_non_ter = this.updateNodeList(grammar);

                if(tmp_func_node.type == 'INT' || tmp_func_node.type == "ID"){
                    new_non_ter.value = this.newTmp();
                    this.emit("=", "$v0", "_", this.replaceSymbol(new_non_ter));
                    //this.emit("=", func_name_node.value + "()", "_", new_non_ter.value);
                }
                else{
                    this.err_list.push("Semantic Error: The Function " + tmp_func_node.value + 
                    param_list + " at Position(" + tmp_func_node.position +") has an incorrect return value type");
                    is_success = false;
                }
                
                return is_success;
                break;
            case "Z->e":
                // "<ʵ��> ::= e                              <ʵ��>.param_list = []"
                var new_non_ter = this.updateNodeList(grammar);
                break;
            case "Z->[":
                // "<ʵ��> ::= <ʵ���б�>                       <ʵ��>.param_list = <ʵ���б�>.param_list"
                var params_list = my_tools.arrIndex(this.sema_node_list, -1);
                var new_non_ter = this.updateNodeList(grammar);

                new_non_ter.func_params = params_list.func_params;
                break;
            case "[->S":
                // "<ʵ���б�> ::= <���ʽ>                     <ʵ���б�>.param_list = [<���ʽ>.name]"
                var exp_node = my_tools.arrIndex(this.sema_node_list, -1);
                var new_non_ter = this.updateNodeList(grammar);
                new_non_ter.func_params.push(exp_node.value);
                break;
            case "[->S,[":
                // "<ʵ���б�1> ::= <���ʽ> , <ʵ���б�2> <ʵ���б�1>.param_list = <ʵ���б�2>.param_list <ʵ���б�1>.append(<���ʽ>.name)"
                //                    -3    -2    -1
                var exp_node = my_tools.arrIndex(this.sema_node_list, -3);
                var param_list = my_tools.arrIndex(this.sema_node_list, -1);
                var new_non_ter = this.updateNodeList(grammar);
                new_non_ter.func_params = param_list.func_params;
                new_non_ter.func_params.unshift(exp_node.value);

                break;
            //     case :
            //     break;
            case "J->{KM}":
            // "<����> ::= { <�ڲ�����> <��䴮> }   <����>.nextlist = <��䴮>.nextlist layer--   var_table.pop(layer+1)"
                this.layer -= 1;
                // 
                
                var sentence_node = my_tools.arrIndex(this.sema_node_list, -2);
                // pop function
                this.removeVarTable();
                var new_non_ter = this.updateNodeList(grammar);
                new_non_ter.nextlist = sentence_node.nextlist;
                
                break;
            case "^->e":
                var new_non_ter = this.updateNodeList(grammar);
                //
                new_non_ter.nextlist.push(this.nextquad);

                //this.emit("j", "_", "_", "_");

                break;
            case "]->e":
            //  "<ռλ��M> ::= e                            M.quad = nextquad"
                var pre_node = my_tools.arrIndex(this.sema_node_list, -1);
                var new_tmp = "";
                if(pre_node.value == 'N' && (pre_node.type == 'IF' || pre_node.type == 'WHILE') || 
                   pre_node.value == 'w' || pre_node.value == ')' || pre_node.value == 'ELSE' || 
                   pre_node.type == 'WHILE' && pre_node.type == 'WHILE'){ // l
                    new_tmp = this.newJumpDst();
                    this.emit(new_tmp, ":", " ", " ");    
                }

                var new_non_ter = this.updateNodeList(grammar);
                new_non_ter.quad = this.nextquad; // function
                new_non_ter.new_jmp_num = new_tmp;
                // if(my_define.MAP_TERMINAL_LIST[pre_node.type] != 'd' ){
                //     console.log(this.new_jmp_num)
                //     console.log(pre_node);
                //     new_non_ter.new_jmp_num = this.newJumpDst();
                //     this.emit(new_non_ter.new_jmp_num, "_", "_", "_");    
                // }

                break;
            case "_->e":
                // "<ռλ��A> ::= e                            layer++"
                var new_non_ter = this.updateNodeList(grammar);// pop and gen new-non-ter
                new_non_ter.layer = ++ this.layer;

                break;

        };
        
        return true;
    }


}

module.exports = {
    semanticNode,
    semantic,
    emit_code_element
}
