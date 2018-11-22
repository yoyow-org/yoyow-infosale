import {
    Aes,
    PrivateKey
} from 'yoyowjs-lib';
import {
    Long
} from 'bytebuffer';
import global_conf from "../conf/global_conf";

class Utils {
    //CheckTimeStamp
    //功能介绍：检查时间戳是否为日期时间
    static CheckTimeStamp(str) {
        let result = false;
        try {
            new Date(str);
            result = true;
        } catch (e) {
            console.log("Invalid Date");
        }

        return result;
    }

    /**
     * Encrypt memo
     * @param {String} memo - memo string
     * @param {Number} nonce - nonce 
     * @param {PrivateKey} privKey - private key object
     * @param {String} pubKey - public key string
     * @returns {String} - encrypt message string
     */
    static encryptMemo(memo, nonce, privKey, pubKey) {
        let msg = encodeURI(memo);
        return Aes.encrypt_with_checksum(privKey, pubKey, nonce, msg).toString("hex");
    }


    /**
     * Decrypt memo
     * @param {String} memo - memo string
     * @param {Number} nonce - nonce 
     * @param {PrivateKey} privKey - private key object
     * @param {String} pubKey - public key string
     * @returns {String} - decrypt message string
     */
    static decryptMemo(memo, nonce, privKey, pubKey) {
        let message = "";
        try {
            message = Aes.decrypt_with_checksum(privKey, pubKey, nonce, memo).toString("utf-8");
        } catch (e) {
            message = "Invalid signature";
        }
        return decodeURI(message);
    }

    /**
     * 验证对象类型
     * @param {Object} obj 验证对象
     * @param {String} vType 验证类型
     * @return {Boolean} 对象是否与验证类型匹配
     */
    static base(obj, vType) {
        return Object.prototype.toString.call(obj) === `[object ${vType}]`;
    }

    /**
     * 验证是否数字类型
     * @param {Object} obj 需验证对象
     * @returns {Boolean} 是否数字
     */
    static isNumber(obj) {
        let result = false;
        try {
            // 不运行有空格的字符串
            if (typeof obj == 'string' && obj.indexOf(' ') >= 0)
                return false;

            let n = Number(obj);
            result = this.base(n, 'Number') && !isNaN(n);
        } catch (e) {
            console.log("isNumber:", e)
        }
        return result;
    }

    /**
     * Return asset precision power value
     * 5 ---- 100000
     * 3 ---- 1000
     * @param {Number} precision - power number
     */
    static getAssetPrecision(precision) {
        return Math.pow(10, precision);
    }

    /**
     * 计算可领取的币龄
     * @param statistics 账户的统计对象
     * @param window 币龄过期时间
     * @param now 头块时间
     * @returns {{new_coin_seconds_earned: number, new_average_coins: number}} 返回可领取的币龄和新的平均余额
     * remark
     * 时间之间的计算以秒为单位
     * 时间与其他的计算以分钟点的秒(向下取整的分钟秒数)为单位
     */
    static calcCoinSecondsEarned(statistics, window, now) {
        let new_average_coins = 0;
        let max_coin_seconds = 0;
        let effective_balance = Long.fromValue(statistics.core_balance).add(Long.fromValue(statistics.core_leased_in)).sub(Long.fromValue(statistics.core_leased_out));
        let nowTime = Long.fromNumber(new Date(now).getTime() / 1000); //头块时间 单位 秒
        nowTime -= nowTime % 60; // 转换成整分钟秒
        let averageUpdateTime = Long.fromNumber(new Date(statistics.average_coins_last_update).getTime() / 1000); //平均余额上次更新时间 单位 秒
        let earnedUpdateTime = Long.fromNumber(new Date(statistics.coin_seconds_earned_last_update).getTime() / 1000); //币龄采集上次更新时间 单位 秒

        if (nowTime <= averageUpdateTime) {
            new_average_coins = Long.fromValue(statistics.average_coins);
        } else {
            let delta_seconds = (nowTime - averageUpdateTime);
            if (delta_seconds >= window) {
                new_average_coins = effective_balance;
            } else {
                let old_seconds = window - delta_seconds;
                let old_coin_seconds = Long.fromValue(statistics.average_coins) * old_seconds;
                let new_coin_seconds = effective_balance * delta_seconds;
                max_coin_seconds = old_coin_seconds + new_coin_seconds;
                new_average_coins = Math.floor(max_coin_seconds / window);
            }
        }
        max_coin_seconds = new_average_coins * window;
        //检查可领取的币龄
        let new_coin_seconds_earned = 0;
        if (nowTime <= earnedUpdateTime) {
            new_coin_seconds_earned = Long.fromValue(statistics.coin_seconds_earned);
        } else {
            let delta_seconds = (nowTime - earnedUpdateTime);
            let delta_coin_seconds = effective_balance * delta_seconds;
            new_coin_seconds_earned = Long.fromValue(statistics.coin_seconds_earned).add(delta_coin_seconds);
        }
        if (new_coin_seconds_earned > max_coin_seconds) {
            new_coin_seconds_earned = max_coin_seconds;
        }

        return {
            new_coin_seconds_earned,
            new_average_coins
        };
    }

    /**
     * 核心资产类精度转换
     * @param {*} count 
     */
    static realCount(count) {
        let rc = global_conf.retain_count;
        let real = Math.round(count / rc * rc) / rc;
        return this.formatAmount(real);
    }

    /**
     * 精确小数点后5位的有效数据
     * 5位是根据实际yoyo全局比例参数来
     * @param val 格式化原始值
     * @param retainLen 保留小数长度(含小数点)
     */
    static formatAmount(val, retainLen) {
        let valLen = val.toString().length;
        let pointLen = val.toString().indexOf('.');
        if (!retainLen) retainLen = global_conf.retain_count.toString().length;
        if (pointLen >= 0 && valLen > pointLen + retainLen) {
            val = parseFloat(val.toString().substring(0, (pointLen + retainLen)));
        }
        return val;
    }
}
export default Utils;