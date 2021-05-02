import { getLineDepth, getFirstWhitespaceDepth } from "./strings.mjs";
import { runtime } from "./runtime.mjs";
import * as fs from "fs";

function parse_lines(lines){
    const lines_array = lines.split('\n')
    const ws_depth = getFirstWhitespaceDepth(lines_array)
    var new_lines_array = []
    var line_number = 0
    lines_array.forEach(line => {
        new_lines_array.push({
            "line":line,
            "line_number":line_number++,
            "line_depth": getLineDepth(line, ws_depth)
        })
    })

    return new_lines_array
}

function tokenize_lines(lines){
    const new_lines = []
    lines.forEach(line=>{
        var new_line = line
        new_line["tokens"] = line["line"].trim().split(" ")
        new_lines.push(line)
    })
    return new_lines
}


fs.readFile(process.argv[2], 'utf8' , (err, data) => {
    try{
        var lines = parse_lines(data)
        lines = tokenize_lines(lines)
        lines.push({'EOF': true})
        runtime(lines)
    }
    catch (error){
        console.log(error)
    }
})