const fs = require('fs');

let whiteList = [];

try {
    // read contents of the file
    const data = fs.readFileSync('whitelist.csv', 'UTF-8');

    // split the contents by new line
    const lines = data.split(/\r?\n/);

    // print all lines
    lines.forEach((line) => {
        whiteList.push(line)
        console.log(line);
    });
} catch (err) {
    console.error(err);
}

console.log(whiteList);

function isMint(signature){
    let flag = whiteList.indexOf(signature);
    if(flag != -1){
        return true;
    }
    return false;
}

let isMint_ = isMint("0xefd0cbf9");
console.log(isMint_);