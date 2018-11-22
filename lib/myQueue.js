
let Queue = require('promise-queue-plus');
let q = Queue.Promise; //a Promise utils;

module.exports={
    opQueue:new Queue(1,{
        "retry":0               //Number of retries
        ,"retryIsJump":false     //retry now? 
        ,"timeout":0            //The timeout period
    }),
    blockQueue:new Queue(1,{
        "retry":0               //Number of retries
        ,"retryIsJump":false     //retry now? 
        ,"timeout":0            //The timeout period
    })
};