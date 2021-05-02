//import * as readline from "readline-sync";

export function print(value){
    console.log(` ${value}`)
}

export function prompt(prompt){
    var value = readline.question(`${prompt}: `)
    return value
}