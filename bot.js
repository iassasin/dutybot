const Telegraf = require('telegraf');
const Koa = require('koa');
const KoaRouter = require('@koa/router');
const YAML = require('yaml');
const fs = require('fs');

const config = YAML.parse(fs.readFileSync(`${__dirname}/config.yml`).toString());

let bot = new Telegraf(config.bot.token);
bot.command('/subscribe_group', async ctx => {
	ctx.reply('Subscribed!');
});
bot.launch();

let app = new Koa();
let router = new KoaRouter();

app.use(router.routes());

app.listen(config.webhook.port, () => {
	console.info(`Server listen at port ${config.webhook.port}`);
});