function removeComment(src_code, obj){
    
    src_code = src_code.replace(/(^\s*)|(\s*$)/g, '');
    src_code = src_code.replace(/\t/g, '');
    src_code = src_code.replace(/\r/g, '');
    code_len = src_code.length;
    dst_code = ''

    // console.log(src_code);
    // console.log(code_len);
    var i = 0;
    var row_num = 1;

    while(i < code_len){
        if(i + 1 < code_len){
            if(src_code[i] == '/' && src_code[i+1] == '/'){
                // get rid of '//', skip the whole row
                while(i < code_len && src_code[i] != '\n')
                    i+=1;
            }
            else if(src_code[i] == '/' && src_code[i+1] == '*'){
                // get rid of '/*'
                i += 2;
                var flag = false;
                // span number of rows
                var enter_num = 0;

                while(i < code_len){
                    if(src_code[i] == '\n'){
                        enter_num ++ ;
                    }
                    else if(src_code[i] == '*' && src_code[i + 1] == '/'){
                        flag = true;
                        break;
                    }
                    i ++ ;
                }
                if(flag == true){
                    // get rid of the '*/'
                    i += 2;
                    row_num += enter_num;
                }
                else{
                    obj.error_info = "Fail to find the */ for the /* at line " + row_num + "\n";
                    return false;
                }
            }
            else if(src_code[i] == '*' && src_code[i+1] == '/'){
                obj.error_info = "Fail to find the /* for the */ at line " + row_num + "\n";
                return false;
            }
        }

        if(i < code_len){
            dst_code += src_code[i];            
            if(src_code[i] == '\n'){
                row_num += 1;
            }
        }

        i ++ ;
    }
    obj.result = dst_code;

    return true;//dst_code, "";
}


module.exports = {
    removeComment
   }