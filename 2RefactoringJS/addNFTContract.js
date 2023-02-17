const { axios } = require("axios");

function makeAPIUrl(module,action,address,...info){
    url = process.env.base_url + `?module=${module}&action=${action}&address=${address}&apikey=${process.env.api_key}`;
    for(let item of info ){
        url += `&${item}`
    }
    return url
}
// console.log(makeAPIUrl(2,2,2,"a=1",2,3));