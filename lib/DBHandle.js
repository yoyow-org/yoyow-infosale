import {
    Query,
    DBHandle
} from 'node_mysql';
import db_conf from '../conf/db_conf';

let db = DBHandle.instance(db_conf);

let user_query = new Query('sc_users', ['id', 'yoyow_id', 'memo_public_key', 'is_delete', 'created_date', 'last_modify_date', 'delete_date']);

let title_query = new Query('sc_titles', ['id', 'seller', 'title', 'created_date', 'last_modify_date']);

let rule_query = new Query('sc_rules', ['id', 'seller', 'title', 'content', 'amount', 'asset_id', 'expiration_date', 'is_delete', 'created_date', 'last_modify_date', 'delete_date']);

let order_query = new Query('sc_orders', ['id', 'order_id', 'buyer', 'seller', 'title', 'content', 'amount', 'asset_id', 'pay_date', 'status', 'is_view', 'is_delete', 'created_date', 'last_modify_date', 'delete_date']);

let verify_query = new Query('sc_verifys', ['id', 'block_num', 'order_id', 'status', 'created_date', 'deleted_date', 'last_modify_date']);

module.exports = {
    /**
     * get title by uid
     * @param {Number} uid - uid
     */
    getUserByUid(uid) {
        let q = user_query.query(['id', 'yoyow_id', 'memo_public_key']).where(['yoyow_id', uid]).getQuery();
        return db.exec(q);
    },

    /** create user
     * @param {Number} uid - seller uid
     * @param {String} memo_public_key - user's memo_public_key
     */
    createUser(uid, memo_public_key) {
        let q = user_query.add({
            yoyow_id: uid,
            memo_public_key: memo_public_key,
            created_date: Date.now().toString()
        }).getQuery();
        return db.exec(q);
    },

    /**
     * modify user publick key
     * @param {Number} uid - user id
     * @param {String} memo_public_key - user's memo_public_key
     */
    modifyUserPublicKey(uid, memo_public_key) {
        let q = user_query.update({
            memo_public_key: memo_public_key,
            last_modify_date: Date.now().toString()
        }).where(['yoyow_id', uid]).getQuery();
        return db.exec(q);
    },

    /**
     * get title by uid
     * @param {Number} uid - seller uid
     */
    getTitleByUid(uid) {
        let q = title_query.query(['id', 'seller', 'title']).where(['seller', uid]).getQuery();
        return db.exec(q);
    },

    /** create title
     * @param {Number} uid - seller uid
     * @param {String} uid - title
     */
    createTitle(uid, title) {
        let q = title_query.add({
            title: title,
            seller: uid,
            created_date: Date.now().toString()
        }).getQuery();
        return db.exec(q);
    },

    /**
     * create title
     * @param {Number} uid - seller uid
     * @param {String} title - resource title
     */
    modifyTitle(uid, title) {
        let q = title_query.update({
            title: title,
            last_modify_date: Date.now().toString()
        }).where(['seller', uid]).getQuery();
        return db.exec(q);
    },

    /**
     * get rule by uid
     * @param {Number} uid - seller uid
     */
    getRuleByUid(uid) {
        let q = rule_query.query(['id', 'seller', 'title', 'content', 'amount', 'asset_id', 'expiration_date', 'created_date']).where(['seller', uid]).and(['is_delete', '0']).getQuery();
        return db.exec(q);
    },

    /**
     * get rule by rule id
     * @param {Number} uid - seller uid
     */
    getRuleByRid(rid) {
        let q = rule_query.query(['id', 'seller', 'title', 'content', 'amount', 'asset_id', 'expiration_date', 'created_date']).where(['id', rid]).and(['is_delete', '0']).getQuery();
        return db.exec(q);
    },

    /**
     * create rule
     * @param {Number} rid - rule id
     * @param {Number} uid - seller uid
     * @param {String} title - rule title
     * @param {String} content - rule content
     * @param {Number} amount - rule amount
     * @param {Number} asset_id - asset id
     * @param {String} expiration_date - expiration date
     */
    createRule(uid, title, content, amount, asset_id, expiration_date) {
        let q = rule_query.add({
            seller: uid,
            title: title,
            content: content,
            amount: amount,
            asset_id: asset_id,
            expiration_date: expiration_date,
            created_date: Date.now().toString()
        }).getQuery();
        return db.exec(q);
    },

    /**
     * modify rule
     * @param {Number} rid - rule id
     * @param {String} title - rule title
     * @param {String} content - rule content
     * @param {Number} amount - rule amount
     * @param {Number} asset_id - asset id
     * @param {String} expiration_date - expiration date
     */
    modifyRule(rid, title, content, amount, asset_id, expiration_date) {
        let q = rule_query.update({
            title: title,
            content: content,
            amount: amount,
            asset_id: asset_id,
            expiration_date: expiration_date,
            last_modify_date: Date.now().toString()
        }).where(['id', rid]).getQuery();
        return db.exec(q);
    },

    /**
     * modify rule
     * @param {Number} rid - rule id
     * @param {String} content - rule content
     */
    modifyRuleContent(rid, content) {
        let q = rule_query.update({
            content: content,
            last_modify_date: Date.now().toString()
        }).where(['id', rid]).getQuery();
        return db.exec(q);
    },

    /**
     * delete rule
     * @param {Number} rid - rule id
     */
    deleteRuleByRid(rid) {
        let q = rule_query.update({
            is_delete: 1,
            delete_date: Date.now().toString()
        }).where(['id', rid]).getQuery();
        return db.exec(q);
    },

    /**
     * get order list by user id
     * @param {Number} id - seller or buyer id
     */
    getOrderByUid(uid) {
        let q = order_query.query(['id', 'order_id', 'seller', 'buyer', 'title', 'content', 'amount', 'asset_id', 'is_view', 'pay_date', 'status', 'created_date'])
            .where(['buyer', uid])
            .and(['status', '2'])
            .and(['is_delete', '0']).getQuery();
        return db.exec(q);
    },

    /**
     * get order by order id
     * @param {Number} id - order id
     * @param {Number} status - status 
     */
    getOrderByRid(oid, status = 2) {
        let q = order_query.query(['id', 'order_id', 'seller', 'buyer', 'title', 'content', 'amount', 'asset_id', 'is_view', 'pay_date', 'status'])
            .where(['order_id', oid])
            .and(['is_delete', '0'])
            .and(['status', status])
            .getQuery();
        return db.exec(q);
    },

    /**
     * get order by order id
     * @param {Number} id - order id
     */
    getUnDealOrderByRid(oid) {
        let q = order_query.query(['id', 'order_id', 'seller', 'buyer', 'title', 'content', 'amount', 'asset_id', 'is_view', 'pay_date', 'status'])
            .where(['order_id', oid])
            .and(['is_delete', '0'])
            .and(['status', 2], "<")
            .getQuery();
        return db.exec(q);
    },

    /**
     * modify order status
     * @param {Number} id - rule id
     */
    createOrder(order_id, buyer, seller, title, content, amount, asset_id) {
        let q = order_query.add({
            order_id: order_id,
            buyer: buyer,
            seller: seller,
            title: title,
            content: content,
            amount: amount,
            asset_id: asset_id,
            created_date: Date.now().toString(),
            is_view: 0
        }).getQuery();
        return db.exec(q);
    },

    /**
     * modify order status
     * @param {Number} id - rule id
     */
    viewOrderByRid(rid) {
        let q = order_query.update({
            is_view: 1,
            last_modify_date: Date.now().toString()
        }).where(['order_id', rid]).getQuery();
        return db.exec(q);
    },

    /**
     * modify rule
     * @param {Number} oid - rule id
     * @param {String} content - rule content
     */
    modifyOrderContent(oid, content) {
        let q = order_query.update({
            content: content,
            last_modify_date: Date.now().toString()
        }).where(['id', oid]).getQuery();
        return db.exec(q);
    },
    /**
     * modify order status
     * @param {Number} id - rule id
     * @param {Number} status - status 0：未付款；1：买家已付款；2：卖家已收款
     */
    payOrderByRid(rid, status) {
        let q = order_query.update({
            status: status,
            pay_date: Date.now().toString()
        }).where(['order_id', rid]).getQuery();
        return db.exec(q);
    },

    /**
     * modify order status
     * @param {Number} id - rule id
     */
    deleteOrderByRid(rid) {
        let q = order_query.update({
            is_delete: 1,
            delete_date: Date.now().toString()
        }).where(['order_id', rid]).getQuery();
        return db.exec(q);
    },

    /**
     * modify order status
     * @param {Number} oid - order id
     */
    deleteOrderByOid(oid) {
        let q = order_query.update({
            is_delete: 1,
            delete_date: Date.now().toString()
        }).where(['id', oid]).getQuery();
        return db.exec(q);
    },

    /**
     * modify order status
     * @param {Number} block_num - block num
     * @param {Number} order_id - order id
     * @param {Number} status - rule id
     */
    createVerify(block_num, order_id, status = 0) {
        let q = verify_query.add({
            block_num: block_num,
            order_id: order_id,
            status: status,
            created_date: Date.now().toString()
        }).getQuery();
        return db.exec(q);
    },

    /**
     * modify order status
     * @param {Number} block_num - block num
     * @param {Number} order_id - order id
     * @param {Number} status - rule id
     */
    getVerify(block_num, order_id) {
        let q = verify_query.query(['id', 'block_num', 'order_id', 'status']).where(['block_num', block_num]).and(["order_id", order_id]).getQuery();
        return db.exec(q);
    },

    /**
     * modify order status
     * @param {Number} block_num - block_num
     */
    getLessVerifyByBlockNum(block_num) {
        let q = verify_query.query(['id', 'block_num', 'order_id', 'status']).where(['status', 2], "<").and(["block_num", block_num], "<=").getQuery();
        return db.exec(q);
    },

    /**
     * modify order statu
     * @param {Number} id - order id
     * @param {status} id - status status 0：未付款；1：买家已付款；2：卖家已收款
     */
    payVerifyByRid(oid, status) {
        let q = verify_query.update({
            status: status,
            last_modify_date: Date.now().toString()
        }).where(['order_id', oid]).getQuery();
        return db.exec(q);
    },

    /**
     * pay verify and order
     * @param {*} oid 
     * @param {*} status 
     */
    payVerifyOrder(oid, status) {
        let querys = [];
        let q1 = order_query.update({
            status: status,
            pay_date: Date.now().toString()
        }).where(['order_id', oid]).getQuery();
        // querys.push(q1);
        let q2 = verify_query.update({
            status: status,
            last_modify_date: Date.now().toString()
        }).where(['order_id', oid]).getQuery();
        // querys.push(q2);
        return Promise.all([db.exec(q1), db.exec(q2)]);
    }
}