import { lp_en } from "./langauge/english.mjs"
import {isReserved, getReservedValue, handleFunction, print, prompt, error} from "./runtime.mjs"

const io = {
    "print": (arg)=>{console.log(arg)},
    "prompt": (arg)=>{return 2}
}

export async function solve(eq, variable_store){
    try{
        const STRINGMODE = "stringmode"
        const NUMBERMODE = "numbermode"
        const VARMODE = "varmode"
        const BLANKMODE = "blankmode"
        const OPMODE = "opmode"
        const FUNCMODE = "funcmode"
        const operators = ["+", "-", "*", "/", "(", ")", "=", ">", "<", "[", "]", ","]
        var tokens = []
        var buffer = ""
        var bufferMode = BLANKMODE
        eq = eq.trim()
        eq = Array.from(eq)
        while(eq.length > 0){
            let ch = eq.shift()
            if(bufferMode == FUNCMODE){
                if(ch == ")"){
                    //insert matching check
                    buffer += ch
                    tokens.push(await handleFunc(buffer, variable_store))
                    buffer = ""
                    bufferMode = BLANKMODE
                }
                else{
                    buffer += ch
                }
            }
            else if(ch == "\""){
                if(buffer[0] == "\"" && bufferMode == STRINGMODE){
                    buffer += "\""
                    tokens.push(buffer.substring(1, buffer.length - 1))
                    bufferMode = BLANKMODE
                    buffer = ""
                }
                else if(bufferMode == BLANKMODE){
                    bufferMode = STRINGMODE
                    buffer += "\""
                }
                else if(bufferMode == OPMODE){
                    tokens.push(buffer)
                    bufferMode = STRINGMODE
                    buffer += "\""
                }
                else {
                    throw error("UQ1", variable_store)
                }
            }
            else if(await isNumber(ch)){
                if(bufferMode == BLANKMODE || bufferMode == NUMBERMODE){
                    bufferMode = NUMBERMODE
                    buffer += ch
                }
                else if(bufferMode == OPMODE){
                    tokens.push(buffer)
                    bufferMode = NUMBERMODE
                    buffer = ""
                    buffer += ch
                }
                else if(bufferMode == STRINGMODE || bufferMode == VARMODE){
                    buffer += ch
                }
            
            }
            else if(await isLetter(ch)){
                if(bufferMode == STRINGMODE || bufferMode == VARMODE){
                    buffer += ch
                }
                else if(bufferMode == NUMBERMODE){
                    variable_store["meta"]["error_help"] = buffer
                    throw error("UL1", variable_store)
                }
                else if(bufferMode == OPMODE){
                    tokens.push(buffer)
                    bufferMode = VARMODE
                    buffer = ""
                    buffer += ch
                }
                else if(bufferMode == BLANKMODE){
                    buffer += ch
                    bufferMode = VARMODE
                }
            }
            else if(ch == " "){
                if (bufferMode  == STRINGMODE){
                    buffer += " "
                }
                else if(bufferMode == NUMBERMODE){
                    tokens.push(Number.parseFloat(buffer))
                    buffer = ""
                    bufferMode = BLANKMODE
                }
                else if(bufferMode == VARMODE){
                    const value = await variableValue(buffer, variable_store)
                    if(value == null){
                        variable_store["meta"]["error_help"] = buffer
                        throw  error("UV1", variable_store)
                    }
                    tokens.push(value)
                    buffer = ""
                    bufferMode = BLANKMODE
                }
                else if(bufferMode == OPMODE){
                    tokens.push(buffer)
                    buffer = ""
                    bufferMode = BLANKMODE
                }
            }
            //const operators = ["+", "-", "*", "/"]
            else if(operators.includes(ch)){ 
                if(bufferMode == NUMBERMODE){
                    tokens.push(Number.parseFloat(buffer))
                    tokens.push(ch)
                    buffer = ""
                    bufferMode = BLANKMODE
                }
                else if(bufferMode == VARMODE){
                    if(ch == "[" || ch == "]" || ch == ","){
                        buffer += ch
                    }
                    else if(ch == "("){
                        buffer += ch
                        bufferMode = FUNCMODE
                        //this is a function
                    }
                    else{
                        const value = await variableValue(buffer, variable_store)
                        if(value == null){
                            variable_store["meta"]["error_help"] = buffer
                            throw error("UV1", variable_store)
                        }
                        tokens.push(value)
                        buffer = ""
                        tokens.push(ch)
                        bufferMode = BLANKMODE
                    }
                }
                else if(bufferMode == STRINGMODE){
                    buffer += ch
                }
                else if(bufferMode == OPMODE){
                    buffer += ch
                }
                else if(bufferMode == BLANKMODE){
                    buffer += ch
                    bufferMode = OPMODE
                }
            }
            else{
                if(bufferMode == STRINGMODE){
                    buffer += ch
                }
                else{
                    variable_store["meta"]["error_help"] = ch
                    throw error("IC1", variable_store)
                }
            }
        }
        //string is parsed, everything in stakc or buffer
        if(bufferMode == STRINGMODE){
            throw error("SE1", variable_store)
        }
        else if(bufferMode == NUMBERMODE){
            tokens.push(Number.parseFloat(buffer))
            buffer = ""
            bufferMode = BLANKMODE
        }
        else if(bufferMode == VARMODE){
            const value = await variableValue(buffer, variable_store)
            if(value == null){
                variable_store["meta"]["error_help"] = buffer
                throw error("UV1", variable_store)
            }
            tokens.push(value)
            buffer = ""
            bufferMode = BLANKMODE
        }
        else if(bufferMode == OPMODE){
            variable_store["meta"]["error_help"] = buffer
            throw error("OP1", variable_store)
        }

        //Look for arrays
        var holding = []
        while (tokens.length > 0){
            let token = tokens.shift()
            if(token == "["){
                let arr = []
                let buffer = ""
                let t = tokens.shift()
                while(t != "]"){
                    if(t == ","){
                        arr.push(await solve(buffer))
                        buffer = ""
                    }
                    else{
                        buffer += t
                    }
                    t = tokens.shift()
                }
                arr.push(await solve(buffer))
                holding.push(arr)
            }
            else{
                holding.push(token)
            }
        }

        tokens = holding

        if(tokens.length == 0){
            return null
        }
        else if(tokens.length == 1){
            return tokens[0]
        }


        /*
        Going to need to do postfix stuff
        */


        //Infix to postfix: Shunting yard
        /**
         * array.pop = last element
         * array.push
         * array.shift = first element
         */
        var q1 = []
        var s1 = []

        const precedence = {
            "&&": 0,
            "||": 0,
            "==": 0,
            ">": 0,
            "<": 0,
            ">=": 0,
            "<=": 0,
            "+": 1,
            "-": 1,
            "*": 2,
            "/": 2,
            "(": 9,
            ")": 9,
        }
        for(let token of tokens){
            if(await isNumber(token) || await isBoolean(token) || Array.isArray(token)){
                q1.push(token)
            }
            else if(precedence.hasOwnProperty(token) && token != ")" && token != "("){
                while((s1.length > 0) && 
                    (precedence[s1[s1.length-1]] >= precedence[token]) &&
                    (s1[s1.length-1] != "(")){
                        q1.push(s1.pop())
                }
                s1.push(token)
            }
            else if(token == "("){
                s1.push(token)
            }
            else if(token == ")"){
                while(s1[s1.length-1] != "("){
                    q1.push(s1.pop())
                }
                if(s1[s1.length-1] == "("){
                    s1.pop()
                }
                else{
                    throw error("MP1", variable_store)
                }
            }
            else{
                throw error("UT1", variable_store)
            }
        }
        while(s1.length > 0){
            q1.push(s1.pop())
        }

        var s2 = []
        while(q1.length > 0){
            let token = q1.shift()
            if(await isNumber(token) || await isBoolean(token) || Array.isArray(token)){
                s2.push(token)
            }
            else{
                const v1 = s2.pop()
                const v2 = s2.pop()
                const v3 = await solveEval(v2, token, v1)
                s2.push(v3)
            }
        }
        if(s2.length != 1){
            throw error("WM1", variable_store)
        }
        return s2[0]
    }catch(error){throw error}
}

async function solveEval(val1, op, val2){
    if(!Array.isArray(val1) && !Array.isArray(val2)){ //Neither arrays
        return eval(`${val1} ${op} ${val2}`)
    }
    else if(Array.isArray(val1) && Array.isArray(val2)){ //Both arrays
        if(op == "+"){
            return val1.concat(val2)
        }
    }
    else if(Array.isArray(val1)){
        if(op == "+"){
            val1.push(val2)
            return val1
        }
        else if (op == "-"){
            const index = val1.indexOf(val2);
            if (index > -1) {
                val1.splice(index, 1);
            }
            return val1;
        }
    }
    else if(Array.isArray(val2)){
        if(op == "+"){
            val1 = Array.from(val1)
            return val1.concat(val2)
        }
    }
}

async function isLetter(ch){
    const kindaLetters = ["_"]
    if(kindaLetters.includes(ch)) return true
    return( ch.toUpperCase() != ch.toLowerCase() || ch.codePointAt(0) > 127 )
}

async function isNumber(ch){
    return(!Number.isNaN(Number.parseFloat(ch)))
}

async function isBoolean(val){
    return (val === true || val === false)
}

async function variableValue(token, variable_store){
    let indexOfBracket = token.indexOf("[")

    if(isReserved(token)){
        if(getReservedValue(token) == "and"){
            return "&&"
        }
        else if(getReservedValue(token) == "or"){
            return "||"
        }
        else if(getReservedValue(token) == "true"){
            return true
        }
        else if(getReservedValue(token) == "false"){
            return false
        }
        else{
            variable_store["meta"]["error_help"] = token
            throw error("IR1", variable_store)
        }
    }
    else if(indexOfBracket >= 0){
        let tok = token.substring(0, indexOfBracket)
        let arrayVal = token.substring(indexOfBracket)
        if(variable_store != undefined && variable_store["user_vars"].hasOwnProperty(tok)){
            let val = variable_store["user_vars"][tok]
            return eval(`[${val}]${arrayVal}`)
        }
    }
    else if(variable_store != undefined && variable_store["user_vars"].hasOwnProperty(token)){
        return variable_store["user_vars"][token] 
    }
    return null
}

async function handleFunc(func, variable_store){
    try{
        var name = ""
        const index_start = func.indexOf("(")
        if(index_start > 0){
            name = func.substring(0,index_start)
        }
        else{
            variable_store["meta"]["error_help"] = func
            throw error("IF1", variable_store)
        }

        const index_end = func.indexOf(")")
        var tokens = func.substring(index_start+1, index_end).split(',')
        var args = await Promise.all(
            tokens.map(function (x){
                try{
                    return solve(x, variable_store).catch(error =>{throw error})
                }
                catch(error){console.log(error)}
            })
        ).catch(error =>{throw error})

        if(isReserved(name) && getReservedValue(name) == "prompt"){
            var value = await prompt(args[0])
            return value
        }
        else if(isReserved(name) && getReservedValue(name) == "print"){
            return await print(args.join(" "))
        }
        else if(variable_store["user_functions"].hasOwnProperty(name)){
            //We going back to the code bb
            //copy var store

            for(let i = 0; i < variable_store["user_function_args"][name].length; i++){
                variable_store["user_vars"][variable_store["user_function_args"][name][i]] = args[i]
            }
            await handleFunction(variable_store["user_functions"][name], variable_store)
        }
        else{
            variable_store["meta"]["error_help"]  = name
            throw error("UF1", variable_store)
        }
    }catch(error){throw error}
}