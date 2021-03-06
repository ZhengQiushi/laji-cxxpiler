
module.paths.push('./node_modules');

var my_define = require("./define.js");
var pre_process = require("./preprocess.js");
var my_tools = require("./tools.js");
var my_lexer = require("./lexer.js");
var my_ffs = require("./ffs.js");
var my_slr = require("./slr.js");
var my_parser = require("./parser.js");
var my_semantic = require("./semantic.js");

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

/*
 * calculate First and Follow Set
 */
my_ffs.FirstFollowSet.initFFS("@");
my_ffs.FirstFollowSet.calFirstFollow(my_define.GRAMMAR, show_ffs_result); //  = true

/*
 * calculate SLR and construct action and go-to-table
 */
my_slr.SLR.initSLR(my_ffs.FirstFollowSet);
my_slr.SLR.getPrefix();
my_slr.SLR.getActiveProject();
my_slr.SLR.fillActionGotoTable();

/*
 * parse while building AST and semantic analysing
 */
my_parser.parser.initParser(all_tokens, my_slr.SLR);
var parser_res = my_parser.parser.goParser();
console.log(parser_res)


var MIPSer= {
    IR: [],
    reg_table: {},
    var_where: {},
    data_segment: 10010000,
    stack_size: 8000, 
    symbol_table: [],
    mips_code: [],

    initMIPSer: function(IR, symbol_table){
        IR.forEach(per => {
            this.IR.push(per);
        });
        for(let i = 7 ; i < 26 ; i ++ ){
            var reg_name = "$" + i;
            this.reg_table[reg_name] = "_";
        }
       this.symbol_table = symbol_table; 
    },
    showIR: function(){
        this.IR.forEach(per => {
            if(per.r2 == undefined){
                console.log(per.op + per.r1) // per.position + ":" + 
            }
            else{
                console.log(per.op + "," + per.r1 + "," + per.r2 + "," + per.res); //per.position + ":" + 
            }
            
        });
    },
    freeRegister: function(cur_index){
        var reg_used_var = Object.values(this.reg_table); // t1, t2, ...
        
        var var_user_cnt = {}; // {t1: 1, t2: 5} ...

        for(let i = cur_index + 1; i < this.IR.length; i ++ ){
            var nxt_IR = this.IR[i];
            if(nxt_IR.r1[0] == 't'){
                if(Object.keys(var_user_cnt).includes(nxt_IR.r1)){
                    var_user_cnt[nxt_IR.r1] ++;
                }
                else{
                    var_user_cnt[nxt_IR.r1] = 1;
                }
            }
            if(nxt_IR.r2[0] == 't'){
                if(Object.keys(var_user_cnt).includes(nxt_IR.r2)){
                    var_user_cnt[nxt_IR.r2] ++;
                }
                else{
                    var_user_cnt[nxt_IR.r2] = 1;
                }
            }
            if(nxt_IR.res[0] == 't'){
                if(Object.keys(var_user_cnt).includes(nxt_IR.res)){
                    var_user_cnt[nxt_IR.res] ++;
                }
                else{
                    var_user_cnt[nxt_IR.res] = 1;
                }
            }
        }

        var has_freed = false;

        var freed_index = "";
        for(let i = 0 ; i < reg_used_var.length; i ++ ){
            var cur_var = reg_used_var[i];
            if(var_user_cnt[cur_var] == undefined){
                // this var will no longer be used!
                console.log("fuck" + cur_index, has_freed);
                var cur_reg_index = 7 + reg_used_var.indexOf(cur_var);
                this.reg_table["$"+cur_reg_index] = "";
                this.var_where[cur_var] = "memory";
                has_freed = true;
                freed_index = "$"+cur_reg_index;
                break;
            }
        }

        if(has_freed == true){
            return freed_index;
        }
        else{
            var sorted_cnt = Object.keys(var_user_cnt).sort((a, b) => 
                                    {return var_user_cnt[a] - var_user_cnt[b]}); 
            //console.log(sorted_cnt);

            var var_should_free = sorted_cnt[0];

            var reg_index = Object.values(this.reg_table).indexOf(var_should_free) + 7;
            var reg = "$"+reg_index;

            for(let i = 0 ; i < symbol_table.length; i ++ ){
                var per_symbol = symbol_table[i];
                if(per_symbol.tmp_id == var_should_free){
                    this.mips_code.push('addi $at, $zero, 0x{}'.format(this.data_segment));
                    this.mips_code.push('sw {}, {}($at)'.format(reg, per_symbol.offset));
                    this.regTable[reg] = '';
                    this.var_where[var_should_free] = "memory";
                    break;
                }
            }

            return reg;
        }
    },
    getRegister: function(var_id, cur_index){

        if(var_id[0] != 't'){
            return var_id;
        }
        // console.log(Object.keys(this.var_where).includes(var_id))
        if(Object.keys(this.var_where).includes(var_id)){
            // already been used
            
            if(this.var_where[var_id] == 'reg'){
                // already in the reg
                var index = Object.values(this.reg_table).indexOf(var_id);
                
                return Object.keys(this.reg_table)[index];
            }
            //? what if is in memory?
        }



        var empty_index = Object.values(this.reg_table).indexOf("_");
        if(empty_index == -1){
            // need free!
            var tmp  = this.freeRegister(cur_index);;
            console.log(tmp);
            return tmp;
        }
        else{  
            this.reg_table["$" + (empty_index + 7)] = var_id;
            this.var_where[var_id] = "reg";
            return "$" + (empty_index + 7);
        }
    },
    showMips: function(){
        console.log("@@@@@@@@@@@@@@@@@Mips Code @@@@@@@@@@@@@@@@@@")
        this.mips_code.forEach(per_code =>{
            console.log(per_code);
        });
    },
    calArraySize: function(size_arr){
        var total_size = 1;
        for(let i = 0 ; i < size_arr.length; i ++ ){
            total_size *= size_arr[i];
        }
        return total_size;
    },
    calOffset: function(size_arr, cur_size){
        var total_offset = 0;
        for(let i = 0; i <= size_arr.length - 1; i ++){
            var tmp_offset = cur_size[i];
            for(let j = i + 1; j <= size_arr.length - 1; j ++){
                tmp_offset *= size_arr[j];
            }
            total_offset += tmp_offset;
        }
        return total_offset;
    },
    parseCurSizeArr: function(cur_name){
        var cur_size = [];
        while(cur_name.includes("[")){
            var cur_num = cur_name.slice(cur_name.indexOf("[") + 1, cur_name.indexOf("]"));
            ////console.log(cur_num, cur_name)
            cur_size.push(parseInt(cur_num));
            cur_name = cur_name.slice(cur_name.indexOf("]") + 1, cur_name.length);
        }
        return cur_size;
    },
    
    searchSymbol: function(arr_name){
        var cur_index = -1;
        this.symbol_table.forEach((symbol, index) => {
            if(symbol.name == arr_name){
                cur_index = index;
                return;
            }
        });
        return this.symbol_table[cur_index];
    },
    handleArrName:function(dst, index){
        var cur_size = this.parseCurSizeArr(dst);
        var cur_symbol = this.searchSymbol(my_semantic.semantic.recoverArrayName(dst));
        var total_size = cur_symbol.size;
        var cur_offset = this.calOffset(total_size, cur_size);
        var arr_addr_reg = this.getRegister(cur_symbol.tmp_id, index);
        //console.log(cur_offset, arr_addr_reg);
        return {
            cur_offset: cur_offset, 
            arr_addr_reg: arr_addr_reg
        };
    },
    genMips: function(){
        //console.log(this.symbol_table);
        var has_arr = false;
        this.symbol_table.forEach(cur_symbol => {
            if(cur_symbol.name.includes("[")){
                var size_arr = this.calArraySize(cur_symbol.size);
                if(has_arr == false){
                    this.mips_code.push(".data");
                    has_arr = true;

                }
                this.mips_code.push(cur_symbol.tmp_id + ":");
                this.mips_code.push(" .space " + size_arr * 4);
                //
                this.IR.unshift(new my_semantic.emit_code_element(undefined, "=", cur_symbol.tmp_id, "[]", cur_symbol.tmp_id));
            }
        });


        this.mips_code.push(" ");
        this.mips_code.push(".text");

        this.mips_code.push("addiu $sp, $zero, 0x" + (this.data_segment + this.stack_size));
        this.mips_code.push("or $fp, $sp, $zero");

        while(this.IR[0].r2 == "[]"){
            var dst = this.getRegister(this.IR[0].res, 0);
            this.mips_code.push("la " + dst + "," + this.IR[0].r1);
            this.IR.shift();
        }

        this.mips_code.push("jal   main");
        this.mips_code.push("dead_loop:");
        this.mips_code.push("j dead_loop");
        this.mips_code.push("nop");
       
        // this.IR.unshift(new my_semantic.emit_code_element(undefined, "call", "_", "_", "programEnd"));
        // this.IR.unshift(new my_semantic.emit_code_element(undefined, "call", "_", "_", "main"));

        this.IR.forEach((cur_IR, index) => {
            switch(cur_IR.op){
                case "=":
                    //assign
                    var src = this.getRegister(cur_IR.r1, index);
                    var dst = this.getRegister(cur_IR.res, index);


                    var src_tmp = src+"";
                    var dst_tmp = dst+"";
                    //console.log(cur_IR);
                    if( dst_tmp.includes("[") || src_tmp.includes("[")){ // dst_tmp.includes("[") || src_tmp.includes("[")

                        if(src_tmp.includes("[")){
                            var arr_info = this.handleArrName(src_tmp, index);
                            src = "$a0"
                            this.mips_code.push("lw " + src + "," + arr_info.cur_offset*4 + "(" + arr_info.arr_addr_reg +")"); 
                        }


                        if(dst_tmp.includes("[")){
                            var arr_info = this.handleArrName(dst_tmp, index);
                            dst = "$a1";
                            this.mips_code.push("add " + dst + ",$zero," + src);
                            this.mips_code.push("sw " + dst + "," + arr_info.cur_offset*4 + "(" + arr_info.arr_addr_reg +")"); 
                        }
                        console.log(src);
                        console.log(dst);
                    }
                    else{
                        this.mips_code.push("add "  + dst + ",$zero," + src);
                    }
                    
                    break;
                case "call":
                    this.mips_code.push("jal  " + cur_IR.res);
                    break;
                case "param":
                    // only four params!
                    var src = this.getRegister(cur_IR.r1, index);

                    var src_tmp = src+"";
                    if(src_tmp.includes("[")){
                        var arr_info = this.handleArrName(src_tmp, index);
                        src = "$a0"
                        this.mips_code.push("lw " + src + "," + arr_info.cur_offset*4 + "(" + arr_info.arr_addr_reg +")"); 
                    }
                    //console.log(this.reg_table);

                    if(src[0] != '$'){
                        //! not a var: numbers!
                        this.mips_code.push("add $a0, $zero, " + src);
                        src = "$a0";
                    }
                    this.mips_code.push("sw " + src +","+ cur_IR.r2 + "($fp)");

                    break;
                case "pop":
                    var src = this.getRegister(cur_IR.res, index);
                    this.mips_code.push("lw "+ src + "," + cur_IR.r2 + "($fp)");
                    break; 
                case "store":
                    this.mips_code.push("sw $ra," + cur_IR.r2 + "($sp)");
                    break;
                case "load":
                    this.mips_code.push("lw "+ "$ra," + cur_IR.r2 + "($sp)");
                    break;
                case "j":
                    this.mips_code.push("j   " + cur_IR.res);
                    break;
                case "j >":
                case "j <=":
                case "j >=":
                case "j <":
                case "j ==":
                case "j !=":
                //! a lot!
                    var op1 = this.getRegister(cur_IR.r1, index);
                    var op2 = this.getRegister(cur_IR.r2, index);

                    if(op1[0] != "$"){
                        this.mips_code.push("add $a1,$zero," + op1);
                        op1 = "$a1";
                    }
                    if(op2[0] != "$"){
                        this.mips_code.push("add $a2,$zero," + op2);
                        op2 = "$a2";
                    }
                    // this.mips_code.push("sub " + op1 + "," + op1 + "," + op2);

                    if(cur_IR.op == "j >")
                        this.mips_code.push("bgt " + op1 +"," + op2 + "," + cur_IR.res);
                    else if(cur_IR.op == "j <=")
                        this.mips_code.push("ble " + op1 +"," + op2 + "," + cur_IR.res);
                    else if(cur_IR.op == "j ==")
                        this.mips_code.push("beq " + op1 +"," + op2 + "," + cur_IR.res);
                    else if(cur_IR.op == "j !=")
                        this.mips_code.push("bne " + op1 +"," + op2 + "," + cur_IR.res);
                    else if(cur_IR.op == "j >=")
                        this.mips_code.push("bge " + op1 +"," + op2 + "," + cur_IR.res);
                    else if(cur_IR.op == "j <")
                        this.mips_code.push("blt " + op1 +"," + op2 + "," + cur_IR.res);


                    break;
                case "ret":
                    this.mips_code.push("jr   $ra");
                    break;
                case "+":
                case "-":
                    if(cur_IR.r1 == 'fp' || cur_IR.r1 == 'sp'){
                        if(cur_IR.op == "+")
                            this.mips_code.push("add $" + cur_IR.r1 + ",$" + cur_IR.r1 + ","+ cur_IR.r2);
                        else
                            this.mips_code.push("sub $" + cur_IR.r1 + ",$" + cur_IR.r1 + ","+ cur_IR.r2);
                    }
                    else{

                        var op1 = this.getRegister(cur_IR.r1, index);
                        var op2 = this.getRegister(cur_IR.r2, index);
                        var dst = this.getRegister(cur_IR.res, index);

                        //! for array
                        var op1_tmp = op1 + "";
                        var op2_tmp = op2 + "";
                        var dst_tmp = dst + "";
                        //console.log(cur_IR);
                        if( op2_tmp.includes("[") || op1_tmp.includes("[")){ // dst_tmp.includes("[") || src_tmp.includes("[")
    
                            if(op1_tmp.includes("[")){
                                var arr_info = this.handleArrName(op1_tmp, index);
                                op1 = "$a1"
                                this.mips_code.push("lw " + op1 + "," + arr_info.cur_offset*4 + "(" + arr_info.arr_addr_reg +")"); 
                            }
                            if(op2_tmp.includes("[")){
                                var arr_info = this.handleArrName(op2_tmp, index);
                                op2 = "$a2"
                                this.mips_code.push("lw " + op2 + "," + arr_info.cur_offset*4 + "(" + arr_info.arr_addr_reg +")"); 
                            }
                        }

                        //! number or after array
                        if(op1[0] != "$"){
                            this.mips_code.push("add $a1,$zero," + op1);
                            op1 = "$a1";
                        }
                        if(op2[0] != "$"){
                            this.mips_code.push("add $a2,$zero," + op2);
                            op2 = "$a2";
                        }

                        //! for array
                        if(dst[0] != "$"){
                            this.mips_code.push("add $a2," + op1 +"," + op2);
                            dst = "$a2";
                        }


                        if(cur_IR.op == '+'){
                            this.mips_code.push("add " + dst + "," + op1 + "," + op2);
                        } 
                        else
                            this.mips_code.push("sub " + dst + "," + op1 + "," + op2);

                        //! for array
                        if(dst == "$a2"){
                            var arr_info = this.handleArrName(dst_tmp, index);
                            this.mips_code.push("sw " + dst + "," + arr_info.cur_offset*4 + "(" + arr_info.arr_addr_reg +")"); 
                        }
                        
                    }
                    break;
                
                case "*":
                case "/":
                    var op1 = this.getRegister(cur_IR.r1, index);
                    var op2 = this.getRegister(cur_IR.r2, index);
                    var dst = this.getRegister(cur_IR.res, index);

                    //! for array
                    var op1_tmp = op1 + "";
                    var op2_tmp = op2 + "";
                    var dst_tmp = dst + "";
                    //console.log(cur_IR);
                    if( op2_tmp.includes("[") || op1_tmp.includes("[")){ // dst_tmp.includes("[") || src_tmp.includes("[")
    
                        if(op1_tmp.includes("[")){
                            var arr_info = this.handleArrName(op1_tmp, index);
                            op1 = "$a1"
                            this.mips_code.push("lw " + op1 + "," + arr_info.cur_offset*4 + "(" + arr_info.arr_addr_reg +")"); 
                        }
                        if(op2_tmp.includes("[")){
                            var arr_info = this.handleArrName(op2_tmp, index);
                            op2 = "$a2"
                            this.mips_code.push("lw " + op2 + "," + arr_info.cur_offset*4 + "(" + arr_info.arr_addr_reg +")"); 
                        }
                    }

                    if(op1[0] != "$"){
                        this.mips_code.push("add $a1,$zero," + op1);
                        op1 = "$a1";
                    }
                    if(op2[0] != "$"){
                        this.mips_code.push("add $a2,$zero," + op2);
                        op2 = "$a2";
                    }

                    //! for array
                    if(dst[0] != "$"){
                        this.mips_code.push("add $a2," + op1 +"," + op2);
                        dst = "$a2";
                    }

                    if(cur_IR.op == "*")
                        this.mips_code.push("mul " + dst + "," + op1 + "," + op2);
                    else
                        this.mips_code.push("div " + dst + "," + op1 + "," + op2);

                    //! for array
                    if(dst == "$a2"){
                        var arr_info = this.handleArrName(dst_tmp, index);
                        this.mips_code.push("sw " + dst + "," + arr_info.cur_offset*4 + "(" + arr_info.arr_addr_reg +")"); 
                    }
                    break;
                default:
                    if(cur_IR.r1 == ':'){
                        // notaion of function
                        
                        this.mips_code.push(cur_IR.op + ":");
                    }
                    break;

            }

            // else if(cur_IR.op == 'call'){
            // }
            // else if(cur_IR.op == 'param'){
            //     // only four params!
            //     var src = this.getRegister(cur_IR.r1, index);
            //     if(src[0] != '$'){
            //         //! not a var: numbers!
            //         this.mips_code.push("add $a0, $zero, " + src);
            //         src = "$a0";
            //     }
            //     this.mips_code.push("sw " + src, cur_IR.r2 + "($fp)");
            // }
            // else if(cur_IR.op == "pop"){
            //     var src = this.getRegister(cur_IR.res, index);
            //     this.mips_code.push("lw "+ src + ", " + cur_IR.r2 + "($fp)");
            // }




        });

        this.showMips();
    }
}



if(parser_res){
    /*
    * show visGraph tree in ../ui/image
    */
    my_parser.parser.visParserTree();
    ////semantic.showFuncTable();
    /* 
     * semantic check
     */
    if(my_semantic.semantic.sema_analyse_success){
        console.log("semantic true");
        /*
         * IR output
         */
        my_semantic.semantic.showSymbolTable();
        MIPSer.initMIPSer(my_semantic.semantic.emit_code, my_semantic.semantic.symbol_table);
        MIPSer.showIR();
        MIPSer.genMips();

    }
    else{
        my_semantic.semantic.err_list.forEach( err=> {
            console.log(err);
        });
    
    }
}
else{
    console.log("Failed to Parse!");
}











