import Telegraf from 'telegraf';
import * as Koa from 'koa';
import * as KoaRouter from '@koa/router';
import * as YAML from 'yaml';
import * as fs from 'fs';

const config = YAML.parse(fs.readFileSync(`${__dirname}/../config.yml`).toString());

let bot = new Telegraf(config.bot.token);
bot.command('/subscribe_group', async ctx => {
	let {message} = ctx.update;
	if (message.from.id === config.bot.ownerId) {
		ctx.reply('Subscribed!');
	} else {
		ctx.reply('No permission to rule bot!');
	}
});
bot.launch();

let app = new Koa();
let router = new KoaRouter();

app.use(router.routes());

app.listen(config.webhook.port, () => {
	console.info(`Server listen at port ${config.webhook.port}`);
});