const child_process = require('child_process');
const cpus = require('os').cpus();
 
// for(let i=0, len=cpus.length; i<len; i++) {
//     fork('./worker.js');
// }

const logWorker = child_process.fork('./log.js');

setInterval(() => {
    let worker_process = child_process.fork("worker.js");
    worker_process.send(Math.floor(Math.random()*10 + 4)); //传给子进程
    worker_process.on('message', (data) => { //子进程返回的结果
        logWorker.send(data);
    })
    // worker_process.on('exit', function (code) {
    //     console.log('子进程已退出，退出码 ' + code);
    //  });
     
}, 3000);