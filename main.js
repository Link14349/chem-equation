const readline = require('readline')
const { ChemEquation } = require("./parser");
const { gaussian } = require("./math");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})
rl.on('line', function(line) {
    let chemEquation = new ChemEquation(line);
    console.log(chemEquation.balance().toString());
    // console.log(chemEquation);
})
rl.on('close',function(){
    process.exit()
})

// let matrix = [ [ 2, 0, -1 ], [ 1, 1, -1 ], [ 0, 1, -1 ] ];
// gaussian(matrix);
// console.log(matrix);

