export function er_en(num, variable_store){
    const linenumber = variable_store["meta"]["linenmber"]
    var msg = errors[num]["msg"]
    msg = msg.replace(/\$linenumber/g, linenumber+1)
    msg = msg.replace(/\$line/g, variable_store["meta"]["line"]["line"])
    msg = msg.replace(/\$error_help/g, variable_store["meta"]["error_help"])

    const helper = errors[num]["helper"](variable_store)
    msg = msg.replace("$fix", helper)
    if(msg.includes("$ifhelp")){
        if(helper == undefined){
            const indexHelpStart = msg.indexOf("$ifhelp")
            const indexHelpEnd = msg.indexOf("$/ifhelp")
            msg = msg.substring(0, indexHelpStart) + msg.substring(indexHelpEnd+8)
        }
        else{
            msg = msg.replace("$ifhelp", "")
            msg = msg.replace("$/ifhelp", "")
        }

    }
    var err = new Error(msg)
    err.linenumber =linenumber
    err.helper = helper
    return err
}

const errors = {
    "SE1": {
        "msg": `Unclosed String on line $linenumber, you need to enclose your strings in quotations. <br>
        You have <code>$line</code>$ifhelp, you should try something like <code>$fix</code>.$/ifhelp`,
        "helper": se1helper
    },
    "UV1": {
        "msg": `Undefined variable on line $linenumber. It looks like you're trying to use <code> $error_help</code> as a variable in the statement <code>$line</code>, but never assign it a value. <br>
        Try placing <code> $error_help = some_value </code> above this line.`,
        "helper": none
    },
    "UQ1":{
        "msg": `Unexpected quotation " on line $linenumber. You might be missing a quotation at the beginning of a string. Take a look at $line and see if you can spot it.`,
        "helper": none
    },
    "UL1":{
        "msg": `Unexpected letter on line $linenumber when trying to parse value <code>$error_help</code> on line <code>$line</code>. Perhaps this was a string missing quotations.`,
        "helper": none
    },
    "IC1":{
        "msg": `Invalid character on line $linenumber. <code>$error_help</code> can not be used in this context on line <code>$line.</code>`,
        "helper": none
    },
    "OP1":{
        "msg": `Invalid operator on line $linenumber. Operators are used to compare values or perform mathematical functions. You need strings, booleans, or numbers on both sides of $error_help on line $line.`,
        "helper": none
    },
    "IR1":{
        "msg": `Invalid reserved word on line $linenumber. The only reserved words you can use here are <code>and, or true</code> and <code>false</code>. Remove <code>$error_help</code> from <code>$line</code> and try again.`,
        "helper": none
    },
    "MP1":{
        "msg": `Mismatched parentheses on $linenumber. Make sure you have the same number of left <code>(</code> and right <code>)</code> in this statement <code>$line</code>.`,
        "helper": none
    },
    "MB1":{
        "msg": `Mismatched brackets on $linenumber. Make sure you have the same number of left <code>[</code> and right <code>]</code> in this statement <code>$line</code>.`,
        "helper": none
    },
    "WM1":{
        "msg": `Invalid equation on $linenumber. We can't quite understand <code>$line</code>. Maybe you can take a look.`,
        "helper": none
    },
    "IF1":{
        "msg": `Invalid function name on $linenumber. We can't quite understand <code>$line</code>. We think <code>$error_help</code> is a function name, but somethings not quite right.`,
        "helper": none
    },
    "SE2":{
        "msg": `Indentation Error starting on line $linenumber. Never returned to the original depth.`,
        "helper": none
    },
    "SE3":{
        "msg": "Something isn't quite right on line $linenumber. Have a look at <code>$line</code> and see if you can figure it out.",
        "helper": none
    },
    "UT1":{
        "msg": "Unrecognized token on line $linenumber. Have a look at <code>$line</code> and see if you can figure it out.",
        "helper": none
    },
    "FL1":{
        "msg":"Invalid 'for' loop on line $linenumber. For loops should be in the format for(i = something, i < something_else, i = i + 1). You have <code>$error_help</code>",
        "helper": none
    },
    "UF1":{
        "msg":"Undefined function <code>$error_help</code> on line $linenumber. You must define the function by using <code>function $error_help(parameters)</code>",
        "helper": none
    }
}

function none(){
    return undefined
}

function se1helper(variable_store){
    const line = variable_store["meta"]["line"]["line"]
    let offset = 0
    const ends = [")"]
    for(let i = 0; i < line.length; i++){
        if(line.charAt(i) == '"'){
            offset++
        }
        else if(ends.includes(line.charAt(i))){
            if(offset % 2 == 1){
                const ret = line.substring(0, i) + '"' + line.substring(i, line.length);
                return ret
            }
        }
    }
    return undefined
}