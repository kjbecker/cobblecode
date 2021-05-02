export function er_fr(num, variable_store){
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
        "msg": `Chaîne non fermée sur la ligne nuber $linenumber, vous devez mettre vos chaînes entre guillemets. <br>
        Vous avez <code>$line</code>$ifhelp, tu devrais essayer <code>$fix</code>.$/ifhelp`,
        "helper": se1helper
    },
    "UV1": {
        "msg": `Variable indéfinie sur la ligne nuber $linenumber.Il semble que vous essayez d'utiliser <code> $error_help</code> comme variable dans <code>$line</code> ,mais ne lui attribuez jamais de valeur.<br>
        Essayez de placer <code> $error_help = some_value </code> au-dessus de cette ligne.`,
        "helper": none
    },
    "UQ1":{
        "msg": `Guillemets inattendus en ligne $linenumber. Il se peut que vous manquiez une citation au début d'une chaîne. Veuillez regarder la ligne $line.`,
        "helper": none
    },
    "UL1":{
        "msg": `Lettre inattendue sur la ligne $linenumber lors de la tentative d'analyse de la valeur <code>$error_help</code> en linge <code>$line</code>. Il se peut que vous manquiez des guillemets si vous vouliez qu'il s'agisse d'une chaîne.`,
        "helper": none
    },
    "IC1":{
        "msg": `Caractère non valide en ligne $linenumber. <code>$error_help</code> ne peut pas être utilisé dans ce contexte en ligne <code>$line.</code>`,
        "helper": none
    },
    "OP1":{
        "msg": `Opérateur non valide en linge $linenumber. Les opérateurs sont utilisés pour comparer des valeurs ou exécuter des fonctions mathématiques. Vous avez besoin de chaînes, de valeurs booléennes ou de nombres des deux côtés de $error_help en linge $line.`,
        "helper": none
    },
    "IR1":{
        "msg": `Mot réservé invalide en linge $linenumber. Les seuls mots réservés que vous pouvez utiliser ici sont <code>et, ou vrai(vraie), </code> et <code>false</code>. Supprimer <code>$error_help</code> de <code>$line</code> et essayez à nouveau.`,
        "helper": none
    },
    "MP1":{
        "msg": `Parenthèses incohérentes en linge $linenumber. Assurez-vous que vous avez le même nombre de gauche <code>(</code> et driot <code>)</code> dans cette déclaration <code>$line</code>.`,
        "helper": none
    },
    "MB1":{
        "msg": `Crochets incompatibles en linge $linenumber. Assurez-vous que vous avez le même nombre de gauche <code>[</code> et driot <code>]</code> dans cette déclaration <code>$line</code>.`,
        "helper": none
    },
    "WM1":{
        "msg": `Équation invalide en linge $linenumber. Nous ne comprenons pas <code>$line</code>. S'il vous plaît, jetez un oeil.`,
        "helper": none
    },
    "IF1":{
        "msg": `Nom de fonction non valide en linge $linenumber. Nous ne comprenons pas <code>$line</code>. Nous pensons que <code>$error_help</code> est un nom de fonction, mais quelque chose ne va pas.`,
        "helper": none
    },
    "SE2":{
        "msg": `Erreur d'indentation en linge $linenumber.`,
        "helper": none
    },
    "SE3":{
        "msg": "Quelque chose ne va pas en linge $linenumber.  Nous ne comprenons pas <code>$line</code>. S'il vous plaît, jetez un oeil.",
        "helper": none
    },
    "UT1":{
        "msg": "Toekn non reconnu en linge $linenumber.  Nous ne comprenons pas <code>$line</code>. S'il vous plaît, jetez un oeil.",
        "helper": none
    },
    "FL1":{
        "msg":"Boucle 'pour' invalide en linge $linenumber. Les boucles pour doivent être au format pour(i = chose, i < autre_chose, i = i + 1). Vous avez <code>$error_help</code>",
        "helper": none
    },
    "UF1":{
        "msg":"Fonction non définie <code>$error_help</code> en linge $linenumber. Vous devez définir la fonction en utilisant <code>fonction $error_help(paramètres)</code>",
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