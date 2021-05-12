const total_variable_num = 33;
Front_Char = '@';
/*  ���ս������
    ����           @
    ������         A
    ����           B
    ��������        C
    ��������        D
    ��������        E
    ��������        F
    �β�           G
    �����б�        H
    ����           I
    ����         J
    �ڲ�����        K
    �ڲ���������     L
    ��䴮         M
    ���           N
    ��ֵ���        O
    return���     P
    while���      Q
    if���         R
    ���ʽ         S
    �ӷ����ʽ      T
    ��            U
    ����           V
    FTYPE         W
    call          X
    ����           Y
    ʵ��           Z
    ʵ���б�        [
    ռλ��M        ]
    ռλ��N        ^
    ռλ��A        _
    ռλ��S        `
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
           "`->e" // ���������������� ������ӣ�return�������͵Ĵ����޷��ж�
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