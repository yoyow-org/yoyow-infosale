import DBHandle from '../lib/DBHandle';
import Utils from "../lib/Utils";
import global_conf from "../conf/global_conf";
import ChainAPI from "../lib/ChainApi";
import {PrivateKey} from 'yoyowjs-lib';
import {opQueue,blockQueue} from './myQueue';

let last_block_num = 0;
class Work {

    /**CheckOP
     *判断OP备注是否含订单
     */
    static CheckOP(obj) {
        if (obj) {
            let block_num = obj.block_num;
            if (obj.op[0] == 0) {
                let op = obj.op[1];
                let memo = op.memo;
                if (memo && op.to == global_conf.transfer_id) {
                    opQueue.push(this.CreateVersify, [block_num, op, memo]);
                    opQueue.start();
                }
            }
        }
    }

    static CreateVersify(block_num, op, memo) {
        let transfer_memo_private_key = PrivateKey.fromWif(global_conf.memo_private_key);
        //1.提取卖家的公钥和中转号私钥(memo)解密content
        let decrtpt_content = Utils.decryptMemo(memo.message, memo.nonce, transfer_memo_private_key, memo.from);
        if (decrtpt_content.indexOf("#") > -1) {
            let order_id = decrtpt_content.substring(1, decrtpt_content.length);
            //2.判断转账金额和订单金额是否一致
            DBHandle.getOrderByRid(order_id, 0)
                .then(order_res => {
                    if (order_res.length > 0) {
                        let order = order_res[0];
                        if (order.amount == op.amount.amount && order.asset_id == op.amount.asset_id) {
                            DBHandle.getVerify(block_num, order_id)
                                .then(verify_rs => {
                                    if (verify_rs.length > 0) {
                                        console.log("~~~~~~~repeat~~~block_num,order_id~~~~~~~", block_num, order_id);
                                        return;
                                    }
                                    DBHandle.createVerify(block_num, order_id)
                                        .then(rs => {
                                            console.error("createVersify successful~~~~~~~~~~", block_num, order_id)
                                        })
                                        .catch(err => {
                                            console.log("~~~~~~~createVerify~~~catch~~~~~~~", err);
                                        });
                                })
                                .catch(err => {
                                    console.log("~~~~~~~~~~getVerify~~catch~~~~~~~~~~~", err)
                                });

                        } else {
                            DBHandle.payOrderByRid(item.order_id, 3);
                            DBHandle.createVerify(block_num, order_id, 3);
                        }
                    }
                }).catch(err => {
                    console.log("~~~~~~~~~~getOrderByRid~~catch~~~~~~~~~~~", err)
                });
        }
    }


    /**
     * 每3秒获取块id并做
     */
    static GetLastBlockNum() {
        ChainAPI.getParameters()
            .then(rs => {
                let last_irreversible_block_num = rs.dynamicParams.last_irreversible_block_num;
                console.log("~~~~~~~GetLastBlockNum~~~~~~~", last_irreversible_block_num, last_block_num);
                if (last_irreversible_block_num != last_block_num) {
                    last_block_num = last_irreversible_block_num;
                    blockQueue.push(this.TransferBlockInfo,[last_irreversible_block_num]);
                    blockQueue.start();
                }
            })
            .catch(err => {
                console.log("getParameters...", err);
            });
    }

    static TransferBlockInfo(last_irreversible_block_num) {
        DBHandle.getLessVerifyByBlockNum(last_irreversible_block_num)
            .then(rs => {
                for (let item of rs) {
                    //设置订单为已经转账状态
                    DBHandle.getUnDealOrderByRid(item.order_id)
                        .then(order_rs => {
                            //判断订单状态是否以及转账
                            if (order_rs.length == 0) {
                                //无效订单
                                return;
                            }
                            let order = order_rs[0];
                            if (order.status == 0) {
                                ChainAPI.getAccount(order_rs[0].seller)
                                    .then(seller_res => {
                                        if (!seller_res) {
                                            return;
                                        }
                                        let seller = seller_res;

                                        DBHandle.payVerifyOrder(item.order_id, 1)
                                        .catch((err)=>{
                                            console.log("~~~~~~payVerifyOrder~~~~~err:",JSON.stringify(err));
                                        });

                                        let data = {
                                            amount: order.amount,
                                            asset_id: order.asset_id,
                                            content: ""
                                        }
                                        //2.提取买家公钥和中转号私钥(memo)加密content
                                        let transfer_memo_private_key = PrivateKey.fromWif(global_conf.memo_private_key);
                                        let seller_nonce = seller.uid + ~~global_conf.transfer_id;
                                        let encrypt_content = Utils.encryptMemo(`#${item.order_id}`, seller_nonce, transfer_memo_private_key, seller.memo_key);
                                        data.content = encrypt_content;

                                        // //3.转账给卖家
                                        let op_data = {
                                            from: global_conf.transfer_id,
                                            to: seller.uid,
                                            amount: {
                                                amount: data.amount,
                                                asset_id: data.asset_id
                                            },
                                            extensions: {
                                                from_balance: {
                                                    amount: data.amount,
                                                    asset_id: data.asset_id
                                                },
                                                to_balance: {
                                                    amount: data.amount,
                                                    asset_id: data.asset_id
                                                }
                                            },
                                            memo: {
                                                from: transfer_memo_private_key.toPublicKey().toString(),
                                                to: seller.memo_key,
                                                nonce: seller_nonce,
                                                message: data.content
                                            }
                                        };
                                        ChainAPI.handleTransfer("transfer", op_data, global_conf.transfer_id, true, true, PrivateKey.fromWif(global_conf.active_private_key), true)
                                            .then(rs => {
                                                console.log("Transfer successful...",item.order_id,last_block_num);
                                            })
                                            .catch(err => {
                                                console.log("Transfer faild...", err);
                                            });
                                    });
                                return;
                            }

                            if (order.status == 1) {
                                DBHandle.payVerifyOrder(item.order_id, 2)
                                .catch((err)=>{
                                    console.log("~~~~~~payVerifyOrder~~~~~err:",JSON.stringify(err));
                                });
                                return;
                            }
                        })
                        .catch(err => {
                            console.log("getUnDealOrderByRid...", err);
                        });
                }
            })
            .catch(err => {
                console.log("getLessVerifyByBlockNum...", err);
            });
    }

}

export default Work;