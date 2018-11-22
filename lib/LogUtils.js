const s = true;

module.exports = {
    log(m){
        if(s) console.log(m);
    },

    error(m){
        if(s) console.error(m);
    }
}