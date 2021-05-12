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


module.exports={
    total_variable_num,
    Front_Char,
    TERMINAL_LIST,
    NONTERMIAL_LIST,
    MAP_TERMINAL_LIST,
    MAP_REVERSE_TERMINAL_LIST,
    MAP_REVERSE_NONTERMINAL_EN_LIST,
    GRAMMAR
}