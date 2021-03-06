/**
 * @Author:acexy@thankjava.com
 *
 * @Description: 电银辅助命令 生产环境
 */

const commandBuilder = require('../lib/commandBuilder');
const program = new commandBuilder();
const fs = require('fs');
const WXPaySDK = require('../../utils/lib/wxsdk');

const xmlJson = require('../../utils/lib/xmlJson');

const cmdEbic = global.config.cmdEbic;
const logger = require('../../utils/lib/logger');

program.version("1.0.1");
program.command("ebicPrd bindSubAppid <env> <subMchId> <subAppId>", '为子商户号绑定subAppId \n 例如: ebicPrd bindSubAppid online 3333333 wxwxwxwxx' +
    ' \n 参数说明 \n\t env[执行环境]: \n\tonline=线上(1507863201);offline=线下(1507593061);reduction=减免类(1507863181)', async function (env, subMchId, subAppId) {

    if (env !== 'online' && env !== 'offline' && env !== 'reduction') {
        return "env 参数指定了无效值";
    }
    let config = cmdEbic[env];
    if (!config) {
        return "指定的环境未有相应的配置";
    }

    let wxpay = new WXPaySDK.WXPay({
        appId: config.appId,
        mchId: config.mchId,
        certFileContent: fs.readFileSync(config.certFilePath)
    });

    let reqData = {
        appid: config.appId,
        mch_id: config.mchId,
        sub_mch_id: subMchId,
        sub_appid: subAppId,
    }

    reqData.sign = WXPaySDK.WXPayUtil.generateSignature(reqData, config.key, WXPaySDK.WXPayConstants.SIGN_TYPE_MD5);
    return await doRequest(wxpay, reqData);
});

program.command("ebicPrd addPayUrl <env> <subMchId> <payUrl>", '为子商户号添加支付目录 \n 例如: ebicPrd addPayUrl online 3333333 https://pay.com/' +
    ' \n 参数说明 \n\t env[执行环境]: \n\tonline=线上(1507863201);offline=线下(1507593061);reduction=减免类(1507863181)', async function (env, subMchId, payUrl) {

    if (env !== 'online' && env !== 'offline' && env !== 'reduction') {
        return "env 参数指定了无效值";
    }

    let config = cmdEbic[env];
    if (!config) {
        return "指定的环境未有相应的配置";
    }

    let wxpay = new WXPaySDK.WXPay({
        appId: config.appId,
        mchId: config.mchId,
        certFileContent: fs.readFileSync(config.certFilePath)
    });

    let reqData = {
        appid: config.appId,
        mch_id: config.mchId,
        sub_mch_id: subMchId,
        jsapi_path: payUrl,
    }

    reqData.sign = WXPaySDK.WXPayUtil.generateSignature(reqData, config.key, WXPaySDK.WXPayConstants.SIGN_TYPE_MD5);
    return await doRequest(wxpay, reqData);
});

const doRequest = async (wxpay, reqData) => {
    let response = await wxpay.requestWithCert(WXPaySDK.WXPayConstants.DOMAIN + '/secapi/mch/addsubdevconfig', reqData);
    logger.info('请求微信:' + JSON.stringify(reqData) + ' 微信响应: ' + response);
    response = await xmlJson.xml2Json(response);
    if (response.xml.return_code === 'SUCCESS' && response.xml.result_code === 'SUCCESS') {
        return '操作成功';
    } else {
        return '操作失败: ' + (!response.xml.err_code_des ? response.xml.return_msg : response.xml.err_code_des);
    }
}

module.exports.exec = async reqData => {
    return await program.exec(reqData.request.args);
};

