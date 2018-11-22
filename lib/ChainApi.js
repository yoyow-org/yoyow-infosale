"use strict";

import {
    Apis
} from "yoyowjs-ws";
import {
    ChainStore,
    ChainTypes,
    ChainValidation,
    PrivateKey,
    TransactionHelper,
    TransactionBuilder
} from 'yoyowjs-lib';
import {
    Long
} from 'bytebuffer';
import Work from "./Work";
import Utils from "./Utils";
import global_conf from "../conf/global_conf";

let global_prams_type = `2.${parseInt(ChainTypes.impl_object_type.global_property, 10)}.0`;
let dynamic_global_prams_type = `2.${parseInt(ChainTypes.impl_object_type.dynamic_global_property, 10)}.0`;
export default {

    /**
     * apiInstance
     */
    apiInstance() {
        Apis.instance(global_conf.serverAddress, true).init_promise
            .then(res => {
                console.log('init Apis.instance ...', res[0].network);
                this.chainStore_init();
            }).catch(err => {
                console.log('init Apis.instance... err...', err);
            });
    },

    /**
     * chainStore_init
     */
    chainStore_init() {
        ChainStore.init().then(() => {
                console.log("chainStore.init...");
                let subscribeChainStore = (objects) => {
                    Work.CheckOP(objects);
                }
                ChainStore.subscribe(subscribeChainStore);
                ChainStore.getAccountsByUid(global_conf.transfer_id);
            })
            .catch(err => {
                this.apiInstance();
                console.log('chainStore.init...err...', err);
            });;
    },

    /**
     * 系统通用参数
     * @returns {Promise<U>|*|Thenable<U>|Promise.<TResult>} resolve({ params, dynamicParams}) resolve(err)
     */
    getParameters() {
        return Apis.instance().db_api().exec("get_objects", [
                [global_prams_type, dynamic_global_prams_type]
            ])
            .then(res => {
                let params = res[0]['parameters'];
                let dynamicParams = res[1];
                return {
                    params,
                    dynamicParams
                };
            }).catch(err => {
                console.log("getParameters...err...", err);
                this.chainStore_init();
                return Promise.reject({
                    code: 5012,
                    message: "the websocket connection was disconnected"
                });
            });
    },

    /**
     * 根据账号获取账号信息
     * @param {Number|String} uid - yoyow id
     * @returns {Promise<U>|*|Thenable<U>|Promise.<TResult>} resolve(account) reject(err)
     */
    getAccount(uid) {
        return new Promise((resolve, reject) => {
            if (ChainValidation.is_account_uid(uid)) {
                return Apis.instance().db_api().exec("get_accounts_by_uid", [
                    [uid]
                ]).then(res => {
                    if (res && res.length > 0 && res[0] != null) {
                        resolve(res[0]);
                    } else {
                        reject({
                            code: 5009,
                            message: "the account is not valid"
                        });
                    }
                });
            } else {
                reject({
                    code: 5009,
                    message: "the account is not valid"
                });
            }
        });
    },

    /**
     * 获取资产信息(如果积分小于50000且可领取积分大于100))
     * @param {Number|String} uid - 账号id
     */
    getAssetsByUid(uid = global_conf.transfer_id) {
        let statisticsPromise = new Promise((resolve, reject) => {
            if (!ChainValidation.is_account_uid(uid)) {
                reject(new Error('invalid account uid'));
            } else {
                Apis.instance().db_api().exec("get_full_accounts_by_uid", [
                        [uid], {
                            fetch_statistics: true
                        }
                    ])
                    .then(res => {
                        if (res.length == 0) {
                            reject({
                                code: 1
                            });
                        } else {
                            resolve(res[0][1].statistics);
                        }
                    }).catch(err => {
                        reject(err);
                    });
            }
        });
        return Promise.all([statisticsPromise, this.getParameters()])
            .then(res => {
                let statistics = res[0];
                let {
                    params,
                    dynamicParams
                } = res[1];
                // 币天/积分积累
                // 余额（加上借入的，减去借出的）
                let effective_balance = Long.fromValue(statistics.core_balance).add(Long.fromValue(statistics.core_leased_in)).sub(Long.fromValue(statistics.core_leased_out));
                // * 一天秒数 / 币龄抵扣手续费比率（csaf_rate）
                let csaf_accumulate = effective_balance * 86400 / params.csaf_rate * global_conf.csaf_param;

                // 币天/积分 可领取
                let csaf_collect = Math.floor(Utils.calcCoinSecondsEarned(statistics, params.csaf_accumulate_window, dynamicParams.time).new_coin_seconds_earned / params.csaf_rate * global_conf.csaf_param);

                let assets = {
                    orign_core_balance: Utils.realCount(statistics.core_balance), // 原始余额
                    core_balance: Utils.realCount(Long.fromValue(statistics.core_balance)
                        .sub(statistics.total_witness_pledge)
                        .sub(statistics.total_committee_member_pledge)
                        .sub(statistics.total_platform_pledge)
                        .toNumber()), // 实际余额 - 见证人抵押 - 理事会抵押 - 平台抵押
                    prepaid_balance: Utils.realCount(statistics.prepaid), // 零钱
                    csaf_balance: Utils.realCount(statistics.csaf * global_conf.csaf_param), // 币天/积分
                    max_csaf_limit: Utils.realCount(params.max_csaf_per_account * global_conf.csaf_param), // 币天/积分上限
                    csaf_accumulate: Utils.formatAmount(Utils.realCount(csaf_accumulate), 4), // 币天/积分积累
                    csaf_collect: Utils.formatAmount(Utils.realCount(csaf_collect), 4), // 可领取币天/积分
                    max_accoumulate_csaf: params.csaf_accumulate_window / 86400 * effective_balance / 10000 / 1000,
                    total_witness_pledge: Utils.realCount(statistics.total_witness_pledge), // 见证人抵押总额
                    releasing_witness_pledge: Utils.realCount(statistics.releasing_witness_pledge), // 见证人抵押待退
                    total_committee_member_pledge: Utils.realCount(statistics.total_committee_member_pledge), // 理事会抵押总额
                    releasing_committee_member_pledge: Utils.realCount(statistics.releasing_committee_member_pledge), // 理事会抵押待退
                    is_pledge: statistics.total_witness_pledge > 0 || statistics.total_committee_member_pledge > 0, // 以是否有抵押判断时候见证人或理事会成员
                    is_witness: statistics.total_witness_pledge > 0, // 是否有见证人抵押
                    is_committee: statistics.total_committee_member_pledge > 0 // 是否有理事会抵押
                };
                if (assets.csaf_collect / 100 >= 100 && assets.csaf_balance < 50000) {
                    this.__collectCsaf(100);
                }
                return assets;
            }).catch(err => {
                return Promise.reject(err);
            });
    },

    /**
     * 处理op操作
     * @param {String} op_type - op 类型
     * @param {Object} op_data - op 操作数据
     * @param {Number|String} pay_uid - 操作者 yoyow id
     * @param {Boolean} useBalance - 是否使用余额 true , 零钱 false
     * @param {Boolean} useCsaf - 是否使用积分
     * @param {PrivateKey} priKey - 私钥
     * @param {Boolean} broadcast - 是否广播 , 默认为false
     * @returns {Promise<U>|*|Thenable<U>|Promise.<TResult>} 不广播的情况 resolve 操作费率, 否则resolve {block_num, txid};
     */
    __processTransaction(op_type, op_data, pay_uid, useBalance, useCsaf, priKey, broadcast = false) {
        return new Promise((resolve, reject) => {
            TransactionHelper.process_transaction(op_type, op_data, pay_uid, useBalance, useCsaf, priKey, broadcast).then(res => {
                if (!broadcast) {
                    res.min_fees = Utils.realCount(res.min_fees.toNumber());
                    res.min_real_fees = Utils.realCount(res.min_real_fees.toNumber()),
                        res.use_csaf = Utils.realCount(res.use_csaf.toNumber()),
                        res.with_csaf_fees = Utils.realCount(res.with_csaf_fees.toNumber()),
                        res.useCsaf = useCsaf // 是否使用积分
                }
                resolve(res);
            }).catch(err => reject(err));
        });
    },

    /**
     * 获取给定数组的用户资产信息
     * @param {Array} uids - 用户id 数组
     */
    handleTransfer(type, opData, pay_uid, useBalance, useCsaf, priKey, broadcast) {
        return this.__processTransaction(type, opData, pay_uid, useBalance, useCsaf, priKey, broadcast)
    },

    /**
     * 查询单个资产
     * @param {String | Number} query - 资产ID 或 符号
     */
    fetchAsset(query) {
        return new Promise((resolve, reject) => {
            ChainStore.fetchAsset(query).then(asset => {
                if (asset)
                    resolve(asset);
                else
                    reject(1007);
            }).catch(err => reject(err));
        });
    },

    /**
     * 领取积分
     * @param {*} uid 
     * @param {*} amount 
     */
    __collectCsaf(amount = 100) {
        return new Promise((resolve, reject) => {
            Apis.instance().db_api().exec("get_objects", [
                ["2.1.0"]
            ]).then(res => {
                console.log("........XXX........");
                let from = global_conf.transfer_id;
                let timesec = Math.max((new Date(res[0].time).getTime() / 1000), (Date.now() / 1000));
                if (amount == null || amount < 1) {
                    return;
                }
                let nPKey = PrivateKey.fromWif(global_conf.secondary_private_key);
                let op_data = {
                    from: global_conf.transfer_id,
                    to: global_conf.transfer_id,
                    amount: {
                        amount: parseInt(amount * 100000),
                        asset_id: 0
                    },
                    time: timesec - (timesec % 60)
                };
                let tr = new TransactionBuilder();
                tr.add_type_operation('csaf_collect', op_data);
                tr.set_required_fees(from, true, true).then(() => {
                    console.log("................");
                    tr.add_signer(nPKey);
                    tr.broadcast();
                }).catch(err => {
                    console.log("set_required_fees....", err);
                });
            }).catch(err => {
                console.log("set_required_fees....", err);
            });
        });
    }
};