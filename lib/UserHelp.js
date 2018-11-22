import DBHandle from "./DBHandle";
import ChainApi from "./ChainApi";


class UserHelp {

    /**
     * 根据uid判断是否有用户，如果没有用户就添加用户
     */
    static checkUser(uid) {
        Promise.all([DBHandle.getUserByUid(uid), ChainApi.getAccount(uid)])
            .then(res => {
                if (res[0].length > 0) {
                    //
                } else if(res[1]) {
                    let memo_public_key = res[1].memo_key;
                    DBHandle.createUser(uid, memo_public_key);
                }
            })
            .catch((err)=>{
                console.log("~~~~~~~checkUser~~~~~~err:",JSON.stringify(err));
            });
    }
}
export default UserHelp;