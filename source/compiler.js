
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
        my_semantic.semantic.emit_code.forEach(per => {
            console.log(per);
        });
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











