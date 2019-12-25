import Telegraf, { ContextMessageUpdate } from 'telegraf';
import * as Koa from 'koa';
import * as KoaRouter from '@koa/router';
import * as bodyparser from 'koa-bodyparser';
import * as YAML from 'yaml';
import * as fs from 'fs';

import Storage, { BotStorage, DutySlot } from './src/storage';
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

bot.command('subscribe', async ctx => {
	let {message} = ctx.update;

	if (message.from.id === config.bot.ownerId) {
		let match = message.text.match(/\/\w+ (-?\d+)/) || [];
		let chatId = +match[1] || ctx.chat.id;

		if (!storage.data.subscribedChats.some(x => x.id === chatId)) {
			storage.mutate(data => data.subscribedChats.push({
				id: chatId,
				title: ctx.chat.title,
				type: ctx.chat.type,
			}));
			ctx.reply('Чат подписан!');
		} else {
			ctx.reply('Чат уже подписан!');
		}
	} else {
		ctx.reply('Недостаточно прав!');
	}
});

bot.command('unsubscribe', async ctx => {
	let {message} = ctx.update;

	if (message.from.id === config.bot.ownerId) {
		let match = message.text.match(/\/\w+ (-?\d+)/) || [];
		let chatId = +match[1] || ctx.chat.id;

		if (storage.data.subscribedChats.some(x => x.id === chatId)) {
			storage.mutate(data => {
				data.subscribedChats = data.subscribedChats.filter(x => x.id !== chatId);
			});
			ctx.reply('Чат отписан!');
		} else {
			ctx.reply('Чат не подписан!');
		}
	} else {
		ctx.reply('Недостаточно прав!');
	}
});

bot.command('subscribes', async ctx => {
	let {message} = ctx.update;

	if (message.from.id === config.bot.ownerId) {
		ctx.reply(storage.data.subscribedChats.map(x => `${x.type} [ ${x.id} ]: ${x.title}`).join('\n'));
	} else {
		ctx.reply('Недостаточно прав!');
	}
});

bot.catch(async (err: any, ctx: ContextMessageUpdate) => {
	console.error(`Ooops, ecountered an error for ${ctx.updateType}`, err);
});

bot.start(async ctx => {
	console.log(`/start from`, {
		id: ctx.chat.id,
		title: ctx.chat.title,
		type: ctx.chat.type,
	});
});

bot.launch();

let app = new Koa();
let router = new KoaRouter();

router.use(bodyparser({enableTypes: ['json']}));
router.patch('/schedule', async (ctx) => {
	let slots = ctx.request.body && ctx.request.body.slots as DutySlot[];
	slots = Array.isArray(slots) ? slots : [];

	for (let slot of slots) {
		let startTime = new Date(slot.startTime);
		dutyService.deleteByTime(startTime);
		dutyService.addTimeSlot(slot.userId, startTime);
	}

	ctx.response.body = `Added ${slots.length} slots\n`;

	dutyService.update();
});

app.use(router.routes());

app.listen(config.webhook.port, () => {
	console.info(`Server listen at port ${config.webhook.port}`);
});