import { getLineDepth, getFirstWhitespaceDepth } from "./runtime/strings.mjs";
import { runtime } from "./runtime/runtime.mjs";
import { handleLoop } from "./runtime/runtime.mjs";

var waiting = false
var rettext = ""
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

function errorcallback(err){
    console.log(err)
    const line_number = err.linenumber
    const helper = err.helper
    addToConsole(err)

    if(helper != undefined){
        addHelperButton(helper, line_number)
    }
}

function addHelperButton(helper, line_number){
    var c = document.getElementById("console")
    var tag = document.createElement("div");
    tag.innerHTML=`
    <button id="helperButton">Do it for me</button
    `
    c.appendChild(tag)
    tag.addEventListener("click", ()=>{
        editor.session.replace(new ace.Range(line_number, 0, line_number, 10000), new String(helper))
    })
}

function runWeb(text){
    try{
        var c = document.getElementById("console")
        c.innerHTML = ""
        var lines = parse_lines(text)
        lines = tokenize_lines(lines)
        lines.push({'EOF': true})
        runtime(lines, print, prompt, errorcallback, lang)
    }
    catch (error){
        errorcallback(error)
    }
}

function addToConsole(item){
    const c = document.getElementById("console")
    if(item.nodeType == undefined){
        const tag = document.createElement("div");
        tag.innerHTML = (item);
        c.appendChild(tag)
    }
    else{
        c.appendChild(item)
    }
}

async function print(text){
    var c = document.getElementById("console")
    var tag = document.createElement("div");
    var textNode = document.createTextNode(text);
    tag.appendChild(textNode);
    c.appendChild(tag)
    c.scrollTop = c.scrollHeight;
    return
}

async function prompt(text){
    var c = document.getElementById("console")
    var tag = document.createElement("div");
    tag.innerHTML=`
    ${text}
    <input type="text" id="prompt">
    `
    c.appendChild(tag)
    c.scrollTop = c.scrollHeight;
    

    const res = await waitForResponse()
    document.getElementById("prompt").remove()
    var textNode = document.createTextNode(rettext);
    tag.appendChild(textNode);
    return rettext
}

function waitForResponse(){
    return new Promise(resolve => {
        document.getElementById("prompt").focus()
        document.getElementById("prompt").addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
              rettext = document.getElementById("prompt").value
              resolve(rettext)
            }
        })
        

    })
}

let urlParams = {};
(window.onpopstate = function () {
    let match,
        pl = /\+/g,  // Regex for replacing addition symbol with a space
        search = /([^&=]+)=?([^&]*)/g,
        decode = function (s) {
            return decodeURIComponent(s.replace(pl, " "));
        },
        query = window.location.search.substring(1);

    while (match = search.exec(query)) {
        if (decode(match[1]) in urlParams) {
            if (!Array.isArray(urlParams[decode(match[1])])) {
                urlParams[decode(match[1])] = [urlParams[decode(match[1])]];
            }
            urlParams[decode(match[1])].push(decode(match[2]));
        } else {
            urlParams[decode(match[1])] = decode(match[2]);
        }
    }
})();

var lang = urlParams["lang"]

if(lang==undefined){
    lang = "en"
}
document.getElementById("lang").value = lang

console.log(lang)

const webstrings_en = {
    "run":"Run",
    "tutorial": "Turorial"
}
const webstrings_fr = {
    "run":"Exécuter",
    "tutorial": "Didacticiel"
}
const wsmap={
    "en":webstrings_en,
    "fr":webstrings_fr
}
const ws = wsmap[lang]

document.getElementById("run").innerHTML = ws["run"]
document.getElementById("showModal").innerHTML = ws["tutorial"]




var editor = ace.edit("editor");
editor.setTheme("ace/theme/github");

ace.config.setModuleUrl("ace/mode/en", "https://cobblecode.com/src/english_theme.js")
ace.config.setModuleUrl("ace/mode/fr", "https://cobblecode.com/src/french_theme.js")

editor.setOption("mode", `ace/mode/${lang}`)
//editor.session.setMode("ace/mode/en");
document.getElementById("run").addEventListener("click", ()=>{runWeb(editor.getValue())})

document.getElementById("showModal").addEventListener("click", ()=>{document.getElementById("modal").style.display = "flex"})
document.getElementById("closeModal").addEventListener("click", ()=>{document.getElementById("modal").style.display = "none"})

document.getElementById("lang").addEventListener("change", ()=>{
    window.location.href=`.?lang=${document.getElementById("lang").value}`
})

const tut = {
    en : [
        {
            "title":"Hello World",
            "cont": "Hello and welcome to CobbleCode. This tutorial will help you get started. Our first lesson is on printing. By printing your programs can talk back to you. To print \"Hello\", you would tell your program <code>print(\"Hello\")</code>. You can put whatever you want in place of \"Hello\" and get your program to print anything you'd like. Remember to put quotations \" around your value.",
            "code": "print(\"Hello World\")"
        },
        {
            "title":"Variables and Prompts",
            "cont": "If <code>print</code> is how your code tells you something, <code>prompt</code> is how your code asks you something and you get to tell it. We need to store the answer somewhere, however. Places where we store values in programs are called variables. You can set a variable to a value by using an equals sign. We can combine variables and <code>prompt</code> to make our hello program more personal.",
            "code": "name = prompt(\"What is your name?\")\nprint(\"Hello\", name)"
            
        },
        {
            "title":"If / Else",
            "cont": "Sometimes we write code we only want to run in certain situations. This is where we use an if statement. If statements evaluate some code and only run if it is true. To pick the code we run in an if statement, we indent it by pressing the tab key. We can also use an else statement, which only runs when the if statement is not true.",
            "code": "number_of_cats = prompt(\"How many cats do you have?\")\nif number_of_cats == 0\n\tprint(\"You should get a cat\")\nelse\n\tprint(\"You have\", number_of_cats, \"cats\")"     
        },
        {
            "title":"Booleans",
            "cont":"In programming we use True and False a lot, just like in the if statement. These are called booleans. You can make a boolean by setting a variable equal to true or false, or by comparing two statements. We use == to see if two statements are equal, > to see if the one on the left is greater than the one of the right, and < to see if the one on the right is greater than the one on the left.",
            "code": "number = prompt(\"Enter a number:\")\nif number > 5\n\tprint(\"Your number is greater than 5\")\nif number < 5\n\tprint(\"Your number is less than 5\")\nif number == 5\n\tprint(\"You number is 5!\")"
        },
        {
            "title":"Arrays",
            "cont":"Arrays are collections of variables. You can create an empty array by setting a variable equal to a pair of empty brackets, []. You can create an array with values by placing values inside of the brackets, seperated with commas. You can add and remove values later by using + and -.",
            "code":"my_array = [1, 2, 3, 4, 5]\nprint(\"The array looks like this:\", my_array)\nmy_array = my_array + 6\nmy_arrray = my_array - 1\nprint(\"Now the array looks like this:\", my_array)"
        },
        {
            "title":"Loops",
            "cont":"Loops define code that run continulously, as long as a certain statement remains true. We define a for loop by using the word for, and then three specific statements in a pair of paranthesis after. The first one defines a new variable, one that we use as a counter. The second is a check, like what would be written in an if statement, often including the counter. The third is a statement that runs after each loop, often increasing the counter.",
            "code":"for(i = 0; i < 10; i = i+1)\n\tprint(i)"
        },
        {
            "title":"Functions",
            "cont":"Sometimes we'll want to use the same code at different times in our code. Instead of writing it twice, we define a function. You've already used functions, print and prompt are predefined functions in the language. To write your own function you type function and then your new functions name, and then in paraenthesis and variables you want to use. To call your function you simply type your function name and pass any variables you need in a pair of paranthesis. Remember, you must always have paraenthesis when creating or calling a function, even if you don't have any variables.",
            "code":"function sayHello(name)\n\tprint(\"Hello\", name)\n\nsayHello(\"World\")\nname = prompt(\"What is your name?\")\nsayHello(name)"
        }
    ],
    fr: [
        {
            "title":"Bonjour le monde",
            "cont":"Bonjour et bienvenue sur CobbleCode. Ce tutoriel vous aidera à démarrer. Notre première leçon porte sur l’impression. En imprimant, vos programmes peuvent vous répondre. Pour imprimer \"Bonjour \", vous devez indiquer à votre programme <code> imprimer(\"Bonjour\") </code>. Vous pouvez mettre ce que vous voulez à la place de \"Bonjour\" et demander à votre programme d'imprimer ce que vous voulez. N'oubliez pas de mettre des guillemets \" autour de votre valeur.",
            "code":"imprimer(\"Bonjour le monde\")"
        },
        {
            "title":"Variables et invites",
            "cont":"Si <code>imprimer</code> est la façon dont votre code vous dit quelque chose, <code>inciter</code> est la façon dont votre code vous demande quelque chose et vous pouvez le dire. Nous devons cependant stocker la réponse quelque part. Les endroits où nous stockons les valeurs dans les programmes sont appelés variables. Vous pouvez définir une variable sur une valeur en utilisant un signe égal. Nous pouvons combiner des variables et <code>inciter</code> pour rendre notre programme bonjour plus personnel.",
            "code":"nom = inciter(\"Quel est ton nom?\")\nimprimer(\"Bonjour\", name)"
        },
        {
            "title":"Si / autre",
            "cont":"Parfois, nous écrivons du code que nous ne voulons exécuter que dans certaines situations. C'est là que nous utilisons une instruction if. Les instructions If évaluent du code et ne s'exécutent que si c'est vrai. Pour choisir le code que nous exécutons dans une instruction if, nous le mettons en retrait en appuyant sur la touche de tabulation. Nous pouvons également utiliser une instruction else, qui ne s'exécute que lorsque l'instruction if n'est pas vraie.",
            "code":"nombre_de_chats = inciter(\"Combien de chats as-tu?\")\nsi nombre_de_chats == 0\n\timprimer(\"Tu devrais avoir un chat\")\nautre\n\timprimer(\"Vous avez\", nombre_de_chats, \"chats\")"
        },
        {
            "title":"Booléens",
            "cont":"En programmation, nous utilisons beaucoup Vrai et Faux, tout comme dans l'instruction if. Ceux-ci sont appelés booléens. Vous pouvez créer un booléen en définissant une variable égale à vrai ou faux, ou en comparant deux instructions. Nous utilisons == pour voir si deux instructions sont égales, > pour voir si celle de gauche est plus grande que celle de droite, et < pour voir si celle de droite est plus grande que celle de gauche.",
            "code":"nombre = inciter(\"Entrez un nombre: \")\nsi nombre > 5\n\timprimer(\"Le nombre est supérieur à 5\")\nsi nombre < 5\n\timprimer(\"Le nombre est inférieur à 5 5\")\nsi nombre == 5\n\timprimer(\"Le nombre est 5!\")"
        },
        {
            "title":"Tableaux",
            "cont":"Les tableaux sont des collections de variables. Vous pouvez créer un tableau vide en définissant une variable égale à une paire de crochets vides, []. Vous pouvez créer un tableau avec des valeurs en plaçant des valeurs à l'intérieur des crochets, séparés par des virgules. Vous pouvez ajouter et supprimer des valeurs ultérieurement en utilisant + et -.",
            "code":"mon_tableau = [1, 2, 3, 4, 5]\nimprimer(\"Le tableau ressemble à ceci:\", mon_tableau)\nmon_tableau = mon_tableau + 6\nmon_tableau = mon_tableau - 1\nprint(\"Maintenant, le tableau ressemble à ceci:\", mon_tableau)"
        },
        {
            "title":"Boucles",
            "cont":"Les boucles définissent du code qui s'exécute en continu, tant qu'une certaine déclaration reste vraie. Nous définissons une boucle for en utilisant le mot for, puis trois instructions spécifiques dans une paire de paranthèses après. La première définit une nouvelle variable, celle que nous utilisons comme compteur. Le second est un chèque, comme ce qui serait écrit dans une instruction if, incluant souvent le compteur. La troisième est une instruction qui s'exécute après chaque boucle, augmentant souvent le compteur.",
            "code":"pour(i = 0; i < 10; i = i+1)\n\timprimer(i)"
        },
        {
            "title":"Les fonctions",
            "cont":"Parfois, nous voudrons utiliser le même code à des moments différents dans notre code. Au lieu de l'écrire deux fois, nous définissons une fonction. Vous avez déjà utilisé des fonctions, l'impression et l'invite sont des fonctions prédéfinies dans la langue. Pour écrire votre propre fonction, vous tapez function, puis le nom de votre nouvelle fonction, puis dans les paragraphes et les variables que vous souhaitez utiliser. Pour appeler votre fonction, tapez simplement le nom de votre fonction et passez toutes les variables dont vous avez besoin dans une paire de paranthèses. N'oubliez pas que vous devez toujours avoir des parenthésis lors de la création ou de l'appel d'une fonction, même si vous n'avez aucune variable.",
            "code":"fonction disBonjour(nom)\n\timprimer(\"Bonjour\", nom)\n\ndisBonjour(\"World\")\nnom = inciter(\"Quel est ton nom?\")\ndisBonjour(nom)"
        }
    ]
}

var curCode = ""
document.getElementById("tut-title").innerText = tut[lang][0]["title"]
document.getElementById("tut-cont").innerHTML = tut[lang][0]["cont"]
curCode = tut[lang][0]["code"]

for(let i = 1; i<= 7; i++){
    document.getElementById(`sel-${i}`).innerText = tut[lang][i-1]["title"]
    document.getElementById(`sel-${i}`).addEventListener("click", ()=>{
        for(let j = 1; j<= 7; j++){
            document.getElementById(`sel-${j}`).classList.remove("sel")
        }
        document.getElementById(`sel-${i}`).classList.add("sel")

        document.getElementById("tut-title").innerText = tut[lang][i-1]["title"]
        document.getElementById("tut-cont").innerHTML = tut[lang][i-1]["cont"]
        curCode = tut[lang][i-1]["code"]
    })
}

document.getElementById("tryit").addEventListener("click", ()=>{
    editor.setValue(curCode)
    editor.clearSelection()
    document.getElementById("modal").style.display = "none"

})

const tryitstr={
    "en": "Try It",
    "fr": "l'essayer"
}

document.getElementById("tryit").innerText = tryitstr[lang]