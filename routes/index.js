import express from 'express';
import DBHandle from '../lib/DBHandle';
import Utils from "../lib/Utils";
import global_conf from "../conf/global_conf";
import ChainAPI from "../lib/ChainApi";
import {PrivateKey} from 'yoyowjs-lib';
import UserHelp from '../lib/UserHelp';

const router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  let result = {
    code: 0,
    message: "success",
    data: {
      status: "200"
    }
  }
  res.json(result);
});

/**
 * get title by seller uid
 */
router.get('/title/:uid', (req, res, next) => {
  let {
    uid
  } = req.params;
  let result = {
    code: 0,
    message: "success",
    data: {}
  }

  if (!uid) {
    result.code = 5001;
    result.message = "the account is not allowed to be empty";
    res.json(result);
    return;
  }
  let obj = {
    title: "",
    uid: 0,
    data: []
  }
  //检测用户
  UserHelp.checkUser(uid);

  DBHandle.getTitleByUid(uid)
    .then(rs => {
      if (rs.length > 0) {
        obj.uid = rs[0].seller;
        obj.title = rs[0].title;
      } else {
        obj.uid = uid;
      }
      DBHandle.getRuleByUid(uid)
        .then(rs => {
          if (rs.length > 0) {
            obj.data = rs;
          }
          result.data = obj;
          res.json(result);
        })
    })
    .catch(err => {
      result.code = 5000;
      result.message = "operation failed. please try again later";
      res.json(result);
    });
});

/**
 * user create title 
 */
router.post('/title', (req, res, next) => {
  let {
    uid,
    title
  } = req.body;
  let result = {
    code: 0,
    message: "success",
    data: {}
  }
  if (!uid) {
    result.code = 5001;
    result.message = "the account is not allowed to be empty";
    res.json(result);
    return;
  }
  if (!title) {
    result.code = 5002;
    result.message = "the title is not allowed to be empty";
    res.json(result);
    return;
  }
  if (title.length > 20) {
    result.code = 5003;
    result.message = "the title's length must less than 20";
    res.json(result);
    return;
  }
  Promise.all([DBHandle.getTitleByUid(uid), ChainAPI.getAccount(uid)])
    .then(rs => {
      if (rs[0].length > 0) {
        DBHandle.modifyTitle(uid, title)
          .then(rs => {
            res.json(result);
          })
          .catch(err => {
            if (err.sqlMessage.indexOf("title") > -1) {
              result.code = 5012;
              result.message = "the title is not valid";
            } else {
              result.code = 5000;
              result.message = "operation failed. please try again later";
            }
            res.json(result);
          });
      } else {
        DBHandle.createTitle(uid, title, rs[1].memo_key)
          .then(rs => {
            res.json(result);
          })
          .catch(err => {
            if (err.sqlMessage.indexOf("title") > -1) {
              result.code = 5012;
              result.message = "the title is not valid";
            } else {
              result.code = 5000;
              result.message = "operation failed. please try again later";
            }
            res.json(result);
          });
      }
    })
    .catch(err => {
      result.code = 5000;
      result.message = "operation failed. please try again later";
      res.json(result);
    });
});

/**
 * user create rule 
 * TODO: 创建资源检查手续费，考虑创建需要手续费
 */
router.post('/rule', (req, res, next) => {
  let {
    rid,
    uid,
    title,
    content,
    amount,
    asset_id,
    expiration_date
  } = req.body;
  let result = {
    code: 0,
    message: "success",
    data: {}
  }
  if (!rid) {
    rid = 0;
  }
  if (!uid) {
    result.code = 5001;
    result.message = "the account is not allowed to be empty";
    res.json(result);
    return;
  }
  if (!title) {
    result.code = 5002;
    result.message = "the title is not allowed to be empty";
    res.json(result);
    return;
  }
  if (title.length > 20) {
    result.code = 5003;
    result.message = "the title's length must less than 20";
    res.json(result);
    return;
  }

  if (!Utils.isNumber(asset_id)) {
    result.code = 5005;
    result.message = "the asset_id is not valid";
    res.json(result);
    return;
  }
  if (expiration_date && expiration_date > 0 && !Utils.CheckTimeStamp(expiration_date)) {
    result.code = 5006;
    result.message = "the expiration_date is not valid";
    res.json(result);
    return;
  }
  ChainAPI.fetchAsset(asset_id)
    .then(asset_rs => {
      if (asset_rs) {
        let precisionVal = Utils.getAssetPrecision(asset_rs.precision) * 10000;
        if (amount > precisionVal) {
          result.code = 5004;
          result.message = "the amount must less than 10000";
          res.json(result);
          return;
        }

        if (rid == 0) {
          DBHandle.getRuleByUid(uid)
            .then(rs => {
              if (rs.length >= 20) {
                result.code = 5011;
                result.message = "the rules must be less than 20 counts";
                res.json(result);
                return;
              } else {
                DBHandle.createRule(uid, title, content, amount, asset_id, expiration_date)
                  .then(rs => {
                    res.json(result);
                  }).catch(err => {
                    if (err.sqlMessage.indexOf("title") > -1) {
                      result.code = 5013;
                      result.message = "the rule name is not valid";
                    } else {
                      result.code = 5000;
                      result.message = "operation failed. please try again later";
                    }
                    res.json(result);
                  });
              }
            })
            .catch(err => {
              result.code = 5000;
              result.message = "operation failed. please try again later";
              res.json(result);
            });
        } else {
          DBHandle.modifyRule(rid, title, content, amount, asset_id, expiration_date)
            .then(rs => {
              res.json(result);
            }).catch(err => {
              if (err.sqlMessage.indexOf("title") > -1) {
                result.code = 5013;
                result.message = "the rule name is not valid";
              } else {
                result.code = 5000;
                result.message = "operation failed. please try again later";
              }
              res.json(result);
            });
        }

      } else {
        result.code = 5005;
        result.message = "the asset_id is not valid";
        res.json(result);
        return;
      }
    }).catch(err => {
      result.code = 5005;
      result.message = "the asset_id is not valid";
      res.json(result);
      return;
    });
});

/**
 * user delete rule
 */
router.delete('/rule/:rid', (req, res, next) => {
  let {
    rid
  } = req.params;
  let result = {
    code: 0,
    message: "success",
    data: {}
  }
  if (!rid) {
    result.code = 5007;
    result.message = "the rule id is not allowed to be empty";
    res.json(result);
    return;
  }
  DBHandle.deleteRuleByRid(rid)
    .then(rs => {
      res.json(result);
    }).catch(err => {
      result.code = 5000;
      result.message = "operation failed. please try again later";
      res.json(result);
    });
});

/**
 * get order by account uid
 */
router.get('/orders/:uid', (req, res, next) => {
  let {
    uid
  } = req.params;
  let result = {
    code: 0,
    message: "success",
    data: []
  }
  if (!uid) {
    result.code = 5001;
    result.message = "the account is not allowed to be empty";
    res.json(result);
    return;
  }
  //检测用户
  UserHelp.checkUser(uid);

  DBHandle.getOrderByUid(uid)
    .then(rs => {
      result.data = rs;
      res.json(result);
    })
    .catch(err => {
      result.code = 5000;
      result.message = "operation failed. please try again later";
      res.json(result);
    })
});

/**
 * get order by rid
 */
router.get('/order/:rid', (req, res, next) => {
  let {
    rid
  } = req.params;
  let result = {
    code: 0,
    message: "success",
    data: {}
  }
  if (!rid) {
    result.code = 5008;
    result.message = "the order id is not allowed to be empty";
    res.json(result);
    return;
  }
  DBHandle.getOrderByRid(rid)
    .then(rs => {
      DBHandle.viewOrderByRid(rid);
      if (rs.length > 0) {
        result.data = rs[0];
      }
      res.json(result);
    })
    .catch(err => {
      result.code = 5000;
      result.message = "operation failed. please try again later";
      res.json(result);
    })
});

/**
 * add order by rid uid
 */
router.post('/order', (req, res, next) => {
  let {
    rid,
    uid
  } = req.body;

  let result = {
    code: 0,
    message: "success",
    data: {}
  }
  if (!rid) {
    result.code = 5007;
    result.message = "the rule id is not allowed to be empty";
    res.json(result);
    return;
  }
  if (!uid) {
    result.code = 5001;
    result.message = "the account is not allowed to be empty";
    res.json(result);
    return;
  }

  Promise.all([DBHandle.getRuleByRid(rid), ChainAPI.getAccount(uid)])
    .then(rs => {
      if (rs[0].length == 0) {
        result.code = 5010;
        result.message = "the rule id is not valid";
        res.json(result);
        return;
      }
      if (!rs[1]) {
        result.code = 5009;
        result.message = 'the account is not valid';
        res.json(result);
        return;
      }
      let data = {
        seller: uid,
        title: rs[0][0].title,
        content: rs[0][0].content, //需要先解密再加密
        amount: rs[0][0].amount,
        asset_id: rs[0][0].asset_id
      }
      let customer = rs[1];
      /***********************/
      let seller_id = rs[0][0].seller;
      ChainAPI.getAccount(seller_id)
        .then(rss => {

          let order = {
            order_id: "SC" + Date.now().toString(),
            buyer: customer.uid,
            title: data.title,
            content: "",
            amount: data.amount,
            asset_id: data.asset_id
          }

          let seller = rss;
          let transfer_memo_private_key = PrivateKey.fromWif(global_conf.memo_private_key);
          //1.提取卖家的公钥和中转号私钥(memo)解密content
          let seller_nonce = seller.uid + ~~global_conf.transfer_id;
          let decrtpt_content = Utils.decryptMemo(data.content, seller_nonce, transfer_memo_private_key, seller.memo_key);

          // //2.提取买家公钥和中转号私钥(memo)加密content
          let customer_nonce = customer.uid + ~~global_conf.transfer_id;
          let encrypt_content = Utils.encryptMemo(decrtpt_content, customer_nonce, transfer_memo_private_key, customer.memo_key);
          order.content = encrypt_content;

          DBHandle.createOrder(order.order_id, order.buyer, seller_id, order.title, order.content, order.amount, order.asset_id)
            .then(rs => {
              console.log("~~~~~~~~~~~~~~~~~order_id:",order.order_id);
              result.data = {
                order_id: order.order_id,
                amount: order.amount,
                asset_id: order.asset_id
              };
              res.json(result)
            })
            .catch(err => {
              result.code = 5000;
              result.data = "operation failed. please try again later";
              res.json(result)
            });
        })
        .catch(err => {
          result.code = err.code;
          result.message = err.message;
          res.json(result);
        });

    })
    .catch(err => {
      result.code = err.code;
      result.message = err.message;
      res.json(result);
    });

});

/**
 * get order by rid
 */
router.delete('/order/:rid', (req, res, next) => {
  let {
    rid
  } = req.params;
  let result = {
    code: 0,
    message: "success",
    data: {}
  }
  if (!rid) {
    result.code = 5008;
    result.message = "the order id is not allowed to be empty";
    res.json(result);
    return;
  }
  DBHandle.deleteOrderByRid(rid)
    .then(rs => {
      res.json(result);
    }).catch(err => {
      result.code = 5000;
      result.message = "operation failed. please try again later";
      res.json(result);
    });
});

/**
 * get account
 */
router.get('/config', (req, res, next) => {
  let result = {
    code: 0,
    message: "success",
    data: {}
  }
  result.data = {
    uid: global_conf.transfer_id
  };
  res.json(result);

});

/**
 * account import change content
 */
router.post('/import', (req, res, next) => {
  let {
    uid
  } = req.body;
  let result = {
    code: 0,
    message: "success",
    data: {}
  }
  Promise.all([ChainAPI.getAccount(uid), DBHandle.getUserByUid(uid), DBHandle.getRuleByUid(uid), DBHandle.getOrderByUid(uid)])
    .then(res => {
      let chain_memo_public_key = res[0].memo_key;
      let memo_public_key = res[1].length > 0 ? res[1][0].memo_public_key : "";
      console.log("############~~~~~~~~~~~memo_public_key:", res[1], memo_public_key)
      let rules = res[2];
      let orders = res[3];
      /******判读逻辑********/
      if (chain_memo_public_key != memo_public_key) {
        memo_public_key = memo_public_key == null ? chain_memo_public_key : memo_public_key;
        //处理规则内容
        if (rules.length > 0) {
          for (let item of rules) {
            let transfer_memo_private_key = PrivateKey.fromWif(global_conf.memo_private_key);
            //1.根据旧公钥和中转号私钥(memo)解密content
            let seller_nonce = ~~item.seller + ~~global_conf.transfer_id;
            console.log("relues_decrtpt:", item.content, seller_nonce, transfer_memo_private_key, memo_public_key);
            let decrtpt_content = Utils.decryptMemo(item.content, seller_nonce, transfer_memo_private_key, memo_public_key);
            console.log("relues_decrtpt_content:", decrtpt_content);
            if (decrtpt_content == "Invalid signature") {
              DBHandle.deleteRuleByRid(item.id);
            } else {
              //2.根据新公钥和中转号私钥(memo)加密content
              let encrypt_content = Utils.encryptMemo(decrtpt_content, seller_nonce, transfer_memo_private_key, chain_memo_public_key);

              DBHandle.modifyRuleContent(item.id, encrypt_content)
                .then(res => {
                  console.log("~~~~~~~~~~~Edit order content sucessful~~~~~", item.id);
                })
                .catch(err => {
                  console.log("~~~~~~~~~~~Edit order content faild~~~~~", item.id);
                });
            }
          }

        }
        //处理订单内容
        if (orders.length > 0) {
          for (let item of orders) {
            let transfer_memo_private_key = PrivateKey.fromWif(global_conf.memo_private_key);
            //1.根据旧公钥和中转号私钥(memo)解密content
            let buyer_nonce = ~~item.buyer + ~~global_conf.transfer_id;
            console.log("order_decrtpt:", item.content, buyer_nonce, transfer_memo_private_key, memo_public_key);
            let decrtpt_content = Utils.decryptMemo(item.content, buyer_nonce, transfer_memo_private_key, memo_public_key);
            console.log("order_decrtpt_content:", decrtpt_content);
            if (decrtpt_content == "Invalid signature") {
              DBHandle.deleteOrderByOid(item.id);
            } else {
              //2.根据新公钥和中转号私钥(memo)加密content
              let encrypt_content = Utils.encryptMemo(decrtpt_content, buyer_nonce, transfer_memo_private_key, chain_memo_public_key);

              DBHandle.modifyOrderContent(item.id, encrypt_content)
                .then(res => {
                  console.log("!!!!!!!!!!!!!!Edit order content sucessful!!!!!!!!!!!!!!", item.id);
                })
                .catch(err => {
                  console.log("!!!!!!!!!!!!!!Edit order content faild!!!!!!!!!!!!!!", item.id);
                });
            }
          }
        }
        //修改User新的公钥
        DBHandle.modifyUserPublicKey(uid, chain_memo_public_key)
          .then(res => {
            console.log("@@@@@@@@@@@@@@Edit memo publicKey sucessful@@@@@@@@@@@@@@");
          })
          .catch(err => {
            console.log("@@@@@@@@@@@@@@Edit memo publicKey faild@@@@@@@@@@@@@@");
          });
      }
    })
    .catch(err => {
      console.log("################get info faild################");
    });
  res.json(result);

});

export default router;