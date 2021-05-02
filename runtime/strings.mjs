export function getLineDepth(line, ws_depth){
    console.log(line)
    line = line.replace(/\t/g, '    ')
    console.log(line)
    const ws = line.length - line.trimStart().length
    if(ws % ws_depth == 0){return ws/ws_depth}
    throw {"Error":"Mismatched whitespace depths"}
}

export function getFirstWhitespaceDepth(lines_array){
    lines_array.forEach(line => {
        const ws = line.search(/\S/);
        if(ws != 0){return ws}
    });
    return 4
}