import Telegraf from 'telegraf';
import * as Koa from 'koa';
import * as KoaRouter from '@koa/router';
import * as YAML from 'yaml';
import * as fs from 'fs';

import Storage, { BotStorage } from './src/storage';
import DutyService from './src/DutyService';

const config = YAML.parse(fs.readFileSync(`${__dirname}/../config.yml`).toString());

let storage = new Storage<BotStorage>(`${__dirname}/../data.json`, {
	dutyMans: [],
	dutySlots: [],
	subscribedChats: [],
});
let bot = new Telegraf(config.bot.token);
let dutyService = new DutyService(storage, bot);

dutyService.update();

bot.command('/subscribe_group', async ctx => {
	let {message} = ctx.update;

	if (message.from.id === config.bot.ownerId) {
		if (!storage.data.subscribedChats.some(x => x.id === ctx.chat.id)) {
			storage.mutate(data => data.subscribedChats.push({
				id: ctx.chat.id,
				title: ctx.chat.title,
				type: ctx.chat.type,
			}));
			ctx.reply('Группа подписана!');
		} else {
			ctx.reply('Группа уже подписана!');
		}
	} else {
		ctx.reply('Недостаточно прав!');
	}
});
bot.launch();

let app = new Koa();
let router = new KoaRouter();

app.use(router.routes());

app.listen(config.webhook.port, () => {
	console.info(`Server listen at port ${config.webhook.port}`);
});