const Table = require('cli-table');
const prompt = require('prompt');

module.exports = {
    buildChoicePrompt: function(objArray, displayPropertyName, promptText, promptFieldText, cb) {
        let table = new Table({
            chars: { 'top': '' , 'top-mid': '' , 'top-left': '' , 'top-right': ''
                , 'bottom': '' , 'bottom-mid': '' , 'bottom-left': '' , 'bottom-right': ''
                , 'left': '-' , 'left-mid': '' , 'mid': '' , 'mid-mid': ''
                , 'right': '' , 'right-mid': '' , 'middle': ' ' },
            style: { 'padding-left': 1, 'padding-right': 0 }
        });

        console.log("\n" + promptText);

        for (let i = 0; i < objArray.length; i++) {
            let displayName = findProp(objArray[i], displayPropertyName, "");
            let array = [i, '-', displayName];
            table.push(array);
        }

        console.log(table.toString());

        console.log();

        prompt.start();

        let choiceIndex;

        // prompt.get([promptFieldText], function (err, result) {
        //     //
        //     // Log the results.
        //     //
        //     console.log("\n" + 'Command-line input received:');
        //     console.log('  ' + promptFieldText + ': ' + result[promptFieldText]);
        //
        //     choiceIndex = result[promptFieldText];
        //
        //     return choiceIndex
        // });
    }
}

function findProp(obj, prop, defval){
    if (typeof defval == 'undefined') defval = null;
    prop = prop.split('.');
    for (var i = 0; i < prop.length; i++) {
        if(typeof obj[prop[i]] == 'undefined')
            return defval;
        obj = obj[prop[i]];
    }
    return obj;
}