import { lp_en } from "./langauge/english.mjs"
import { lp_fr } from "./langauge/french.mjs"
import { er_en } from "./langauge/english_errors.mjs"
import { er_fr } from "./langauge/french_errors.mjs"
import { solve } from "./math.mjs"

export let LANG = "en"

export const language_bindings = {
    "en": lp_en,
    "fr": lp_fr
}

export const error_bindings = {
    "en": er_en,
    "fr": er_fr
}

export function print(){return}
export function prompt(){return}
export function error(num, variable_store){return error_bindings[LANG](num, variable_store)}

var elseTaken = false

var global_line_array = []

export async function runtime(line_array, printFunction, promptFunction, errorcallback, lang){
    try{
        LANG=lang,
        print = printFunction
        prompt = promptFunction
        var variable_store = {
            "user_vars": {},
            "user_functions": {},
            "user_function_args": {},
            "meta": {}
        }
        for(let line of line_array){
            if(!line["EOF"] && getReservedValue(line["tokens"][0]) == "function"){
                variable_store["user_functions"][getFunctionName(line["tokens"][1])] = line["line_number"]
                variable_store["user_function_args"][getFunctionName(line["tokens"][1])] = parse_args(line["line"])
            }
        }
        global_line_array = line_array
        return await handle_line(0, line_array, variable_store)
    }catch(error){
        errorcallback(error)
    }
}

export async function handleFunction(line, variable_store){
    try{
        //remove previous line number
        delete variable_store["meta"]["previouslinenumber"]
        variable_store["meta"]["isFunction"] = true
        return handle_line(line+1, global_line_array, variable_store)
    }
    catch(error){throw error}
}

export async function handleLoop(line, variable_store, line_array){
    try{
        variable_store["meta"]["error_help"]  = line['line']
        var name = ""
        const index_start = name = line['line'].indexOf("(")
        if(index_start > 0){
            name = line['line'].substring(0,index_start)
        }
        else{
            variable_store["meta"]["error_help"] = line['line']
            throw error("FL1", variable_store)
        }

        const index_end = name = line['line'].indexOf(")")
        var tokens = name = line['line'].substring(index_start+1, index_end).split(';')

        if(tokens.length != 3){
            throw error("FL1", variable_store)
        }


        try{
            let re = /([A-Za-z0-9\-\_]+)( *)(=)( *)([A-Za-z0-9\-\_]+)/
            let matched = re.exec(tokens[0])
            if(matched[3] == "="){
                variable_store["user_vars"][matched[1]] = solve(matched[5], variable_store)
            }
            else throw new Error
        }
        catch(err){throw error("FL1", variable_store)}

        


        return await handleLoop2(tokens, variable_store, line_array)
    }
    catch(error){throw error}
}

async function handleLoop2(tokens, variable_store, line_array){
    let line_number = variable_store["meta"]["linenmber"]
    if(await solve(tokens[1], variable_store)){
        variable_store = await handle_line(line_number+1, line_array, variable_store)

        try{
            let re = /([A-Za-z0-9\-\_]+)( *)(=)( *)(.+)/
            let matched = re.exec(tokens[2])
            if(matched[3] == "="){
                variable_store["user_vars"][matched[1]] = await solve(matched[5], variable_store)
            }
            else throw new Error
        }
        catch(err){throw error("FL1", variable_store)}

        variable_store["meta"]["linenmber"] = line_number

        return handleLoop2(tokens, variable_store, line_array)
    }

    return variable_store

}

async function handle_line(line_number, line_array, variable_store){
    try{
        const line = line_array[line_number]
        variable_store["meta"]["linenmber"] = line_number
        variable_store["meta"]["line"] = line

        if(variable_store["meta"].hasOwnProperty("previouslinenumber") && line_array[variable_store["meta"]["previouslinenumber"]]["line_depth"] > line["line_depth"] && line_number - variable_store["meta"]["previouslinenumber"] == 1){
            return variable_store
        }

        variable_store["meta"]["previouslinenumber"] = line_number
        if(line["EOF"]){
            return variable_store
        }

        var tokens = line["tokens"]
        if(line["line"].trim() == "" || line["line"].trim().length == 0){
            return await handle_line(line_number+1, line_array, variable_store)
        }

        if(isReserved(tokens[0])){ //doing something
            const action = getReservedValue(tokens[0])
            if(action == "for"){
                return await handleLoop(line, variable_store, line_array)
            }
            if(action == "if"){
                const evaluation = await solve(tokens.slice(1).join(" "), variable_store)
                if(evaluation){
                    return await handle_line(line_number+1, line_array, variable_store)
                }
                else{
                    const this_depth = line["line_depth"]
                    for(var i = line_number+1; i < line_array.length; i++){
                        const _line = line_array[i]
                        if(_line["EOF"]) return variable_store
                        if(_line["line_depth"] == this_depth){
                            if(getReservedValue(_line["tokens"][0]) == "else"){
                                elseTaken = true
                            }
                            return await handle_line(_line["line_number"], line_array, variable_store)
                        }
                    }
                    throw error("SE2", variable_store)
                }
            }

            else if(action=="else"){
                if(elseTaken){
                    elseTaken = false
                    return await handle_line(line_number+1, line_array, variable_store)
                }
                else{
                    const this_depth = line["line_depth"]
                    for(var i = line_number+1; i < line_array.length; i++){
                        const _line = line_array[i]
                        if(_line["EOF"]) return variable_store
                        if(_line["line_depth"] == this_depth){
                            return await handle_line(_line["line_number"], line_array, variable_store)
                        }
                    }
                    throw error("SE2", variable_store)
                }
            }

            else if(action=="function"){
                const this_depth = line["line_depth"]
                for(var i = line_number+1; i < line_array.length; i++){
                    const _line = line_array[i]
                    if(_line["EOF"]) return variable_store
                    if(_line["line_depth"] == this_depth){
                        return await handle_line(_line["line_number"], line_array, variable_store)
                    }
                }
                throw error("SE2", variable_store)
            }

            else{
                const line_holder = line_number
                await solve(tokens.join(" "), variable_store)
                return await handle_line(line_holder+1, line_array, variable_store)
            }

        }
        else{ //declaring a variable or something the matter
            if(tokens[1] == "="){
                const value = await solve(tokens.slice(2).join(" "), variable_store)
                variable_store["user_vars"][tokens[0]] = value
                return await handle_line(line_number+1, line_array, variable_store)
            }
            else if(tokens[0].includes('=')){
                const var_name = tokens[0].substring(0, tokens[0].indexOf('='))
                tokens[0] = tokens[0].substring(tokens[0].indexOf('=')+1)
                console.log(tokens.join(" "))
                const value = await solve(tokens.join(" "), variable_store)
                variable_store["user_vars"][var_name] = value
                console.log(variable_store)
            }
            else{
                throw error("SE3", variable_store)
            }
        }


        return variable_store
    }catch(error){throw error}
}

function getFunctionName(token){
    const index = token.indexOf("(")
    if(index > 0){
        return token.substring(0,index)
    }
    return undefined
}

export function isReserved(token){
    const language = LANG
    if(getFunctionName(token) != undefined){
        return true
    }
    return language_bindings[language].hasOwnProperty(token)
}

function parse_args(line, variable_store){
    const index_start = line.indexOf("(")
    const index_end = line.indexOf(")")
    var args = []
    var tokens = line.substring(index_start+1, index_end).split(',')
    tokens.forEach(token=>{
        args.push(token)
    })
    return args
}

export function getReservedValue(token){
    const functionName = getFunctionName(token)
    const language = LANG
    if(functionName != undefined){
        if(language_bindings[language].hasOwnProperty(functionName)){
            return language_bindings[language][functionName]
        }
        return functionName
    }
    return language_bindings[language][token]
}
