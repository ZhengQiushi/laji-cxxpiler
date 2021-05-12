var my_tools = require("./tools.js");

/*
 * key - values
 */
var TokenType = {
    // ¹Ø¼ü×Ö - RESERVED KEYWORDS
    INT: 'INT',
    VOID: 'VOID',
    IF: 'IF',
    ELSE: 'ELSE',
    WHILE: 'WHILE',
    RETURN: 'RETURN',
    // ±êÊ¶·û
    ID: 'ID',
    // ÊýÖµ
    INTEGER_CONST: 'INTEGER_CONST',
    REAL_CONST: 'REAL_CONST',
    // ¸³ÖµºÅ
    ASSIGN: '=',
    // Ëã·û
    PLUS: '+',
    MINUS: '-',
    MUL: '*',
    DIV: '/',
    LG: '>',
    LT: '<',
    LTE: '<=',
    NOT_EQUAL: '!=',
    LGE: '>=',
    EQUAL: '==',
    // ½ç·û
    SEMI: ';',
    // ·Ö¸ô·û
    COMMA: ',',
    //// ×¢ÊÍºÅ
    // ×ó/ÓÒÐ¡À¨ºÅ
    LPAREN: '(',
    RPAREN: ')',
    // ×ó/ÓÒ´óÀ¨ºÅ
    LBRACE: '{',
    RBRACE: '}',
    // ×ó/ÓÒÖÐÀ¨ºÅ
    LBRACKET: '[',
    RBRACKET: ']',
    // ½áÊø·û
    EOF: '#'
}


/*
 * 
 */
function Token(type, value, line_num = undefined, col_num = undefined){
    this.type=type;
    this.value=value;
    this.line_num=line_num;
    this.col_num=col_num;
}



var Lexer = {
    text: "",
    pos: 0,
    total_len:0,
    current_char: " ", // current char in code-text
    line_num: 1,
    col_num: 1,
    show_all_tokens: false,
    error_info: [],

    /* 
     * brief@ result(code-text without comment, \r, \t, \s)
     *        show_tokens(for debug)
     */
    initLexer: function (result, show_tokens = false){
        Lexer.text = result;
        Lexer.total_len = Lexer.text.length;
        Lexer.current_char = Lexer.text[Lexer.pos];
        this.show_all_tokens = show_tokens;
    },
    /* 
     * brief@ go ahead for one char
     */
    advance: function (){
        this.pos += 1;
        // several \n\r...
        while(this.text[this.pos] == '\n'){ // update line info and skip the \n
            this.line_num += 1;
            this.col_num = 1;
            this.pos += 1;
        }
        //out of border
        if(this.pos >= this.total_len){
            this.current_char = undefined;
        }
        else{
            this.current_char = this.text[this.pos];
            this.col_num += 1;
        }
    },
    /* 
     * brief@ watch the next one char
     */
    peek: function(){
        peek_pos = this.pos + 1;
        //out of border
        if(peek_pos > this.total_len - 1){
            return undefined;
        }
        else{
            return this.text[peek_pos];
        }
    },
    
    error: function(){
        var s = "Lexer error on " + this.current_char + " line: " + this.line_num + " column: " + this.col_num;
        this.error_info.push(s)
        
    },

    skipBlankSpace: function (){
        while(this.current_char != undefined && my_tools.isSpace(this.current_char)){
            this.advance();
        }
    },

    alphaToken: function(){
        token = new Token(undefined, undefined, this.line_num, this.col_num);
        token_value = '';
        // get the whole token
        while(this.current_char != undefined && my_tools.isAlNum(this.current_char)){
            token_value += this.current_char;
            this.advance();
        }
        // Reserved word!
       
        if(my_tools.isReservedKeyword(token_value.toUpperCase(), 0, 6, TokenType)){
            token.type = token_value.toUpperCase();
            token.value = token_value.toUpperCase();
        }
        else{
            token.type = TokenType.ID;
            token.value = token_value;
        }
        return token;
    },

    numberToken: function(){
        token = new Token(undefined, undefined, this.line_num, this.col_num);
        token_value = '';
        // get the whole token
        while(this.current_char != undefined && my_tools.isDigit(this.current_char)){
            token_value += this.current_char;
            this.advance();
        }
        
        if(this.current_char == '.'){
            // dot for double
            token_value += this.current_char;
            this.advance();
            while(this.current_char != undefined && my_tools.isDigit(this.current_char)){
                token_value += this.current_char;
                this.advance();
            }
            token.type = TokenType.REAL_CONST
            token.value = parseFloat(token_value)
        }
        else{
            // int 
            token.type = TokenType.INTEGER_CONST
            token.value = parseInt(token_value)
        }
        
        return token;
    },

    doubleCharToken: function(){
        var double_char_operation = this.current_char + this.peek()
        // get the map-key according to the val 
        //    i.e. a:1  
        //         b = getKeyVal(TokenType, 1) => a
        token_type = my_tools.getKeyVal(TokenType, double_char_operation);
        
        token = new Token(
            type=token_type,
            value=double_char_operation,  
            lineno=this.line_num,
            column=this.col_num,
        )
        // go ahead for two char
        this.advance()
        this.advance()
        return token
    },
    singleCharToken: function(){
        // all types
        var type_len = Object.keys(TokenType).length;
        
        if(my_tools.isReservedKeyword(this.current_char, 0, type_len, TokenType)){
            // legal!
            token_type = my_tools.getKeyVal(TokenType, this.current_char);
            token = new Token(
                type=token_type,
                value=this.current_char,
                lineno=this.line_num,
                column=this.col_num,
            );
            this.advance();
            return token;
        }
        else{
            // illegal
            this.error();
            this.advance();
            return new Token(
                type=undefined,
                value=this.current_char,
                lineno=this.line_num,
                column=this.col_num,
            );
        }
    },

    getNextToken: function (){
        while(this.current_char != undefined){
            if(my_tools.isSpace(this.current_char)){
                this.skipBlankSpace();
                continue;
            }
            if(my_tools.isAlpha(this.current_char)){
                return this.alphaToken();
            }
            if(my_tools.isDigit(this.current_char)){
                return this.numberToken();
            }
            var type_len = Object.keys(TokenType).length;
            if(this.current_char == "<" || this.current_char == ">" || this.current_char == "!" || this.current_char == "="){
                if(this.peek() == '='){
                    return this.doubleCharToken();
                }
            }
            return this.singleCharToken();
        }
        return Token(TokenType.EOF, undefined);
    },
    
    getAllTokens: function (){
        // final result
        token_list = [];

        token = this.getNextToken();
        token_list.push(token);
        // for debug
        if(this.show_all_tokens)
            console.log(token);

        while (token.type != TokenType.EOF){
            token = this.getNextToken();

            if(token == undefined)
                break;
            // for debug
            if(this.show_all_tokens)
                console.log(token);

            token_list.push(token);
        }
        return token_list;
    }
}

module.exports = {
    TokenType,
    Token,
    Lexer
}