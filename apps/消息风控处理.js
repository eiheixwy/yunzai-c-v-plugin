//此js插件来源小飞插件，已获得原作者许可
import { segment } from "oicq";
import fetch from "node-fetch";
import plugin from '../../../lib/plugins/plugin.js';
import fs from 'fs'
import YAML from 'yaml'
export class xiaofei extends plugin {
	constructor() {
		super({
			name: '消息风控处理-小飞',
			dsc: '检测到消息发送失败时，自动使用特殊处理的转发消息再次发送',
			/** https://oicqjs.github.io/oicq/#events */
			event: 'message',
			priority: 2,
		});
	}
	async accept() {
		let set = await YAML.parse(fs.readFileSync('./plugins/yunzai-c-v-plugin/config/cfg.yaml','utf8'));
		let cdtime = 0//←请勿修改此配置
		let isopen = set.xiaofeifengkong
        if (!isopen) {
            return false
        } else {
            isopen = false;
            setTimeout(async () => {
               isopen = true;
            }, cdtime);
        }
		let old_reply = this.e.reply;
		this.e.reply = async function (msgs, quote, data) {
			if (!msgs) return false;
			if (!Array.isArray(msgs)) msgs = [msgs];
			let result = await old_reply(msgs, quote, data);
			if (!result || !result.message_id) {
				let isxml = false;
				for (let msg of msgs) {
					if (msg && msg?.type == 'xml' && msg?.data) {
						msg.data = msg.data.replace(/^<\?xml.*version=.*?>/g, '<?xml version="1.0" encoding="utf-8" ?>');
						isxml = true;
					}
				}
				if (isxml) {
					result = await old_reply(msgs, quote, data);
				} else {
					let MsgList = [{
						message: msgs,
						nickname: Bot.nickname,
						user_id: Bot.uin
					}];
					let forwardMsg = await Bot.makeForwardMsg(MsgList);
					forwardMsg.data = forwardMsg.data
						.replace('<?xml version="1.0" encoding="utf-8"?>', '<?xml version="1.0" encoding="utf-8" ?>')
						.replace(/\n/g, '')
						.replace(/<title color="#777777" size="26">(.+?)<\/title>/g, '___')
						.replace(/___+/, '<title color="#777777" size="26">请点击查看内容</title>');
					msgs = forwardMsg;
					result = await old_reply(msgs, quote, data);
				}
				if (!result || !result.message_id) {
					logger.error('风控消息处理失败，请登录手机QQ查看是否可手动解除风控！');
				}
			}
			return result;
		}
	}
}