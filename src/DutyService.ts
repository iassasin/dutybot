import Storage, { BotStorage } from './storage';
import Telegraf, { ContextMessageUpdate } from 'telegraf';

export default class DutyService {
	private timer: NodeJS.Timeout;

	constructor(
		private storage: Storage<BotStorage>,
		private bot: Telegraf<ContextMessageUpdate>,
	) {}

	update() {
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}

		let date = new Date(Date.now() + 60 * 1000);
		for (let slot of this.storage.data.dutySlots) {
			let startTime = new Date(slot.startTime);
			if (date < startTime) {
				console.info(`Next time slot at ${slot.startTime}`);
				this.timer = setTimeout(this.checkDuty.bind(this), +startTime - +date);
				return;
			}
		}

		console.info(`Next time slot not set`);
	}

	checkDuty() {
		let date = new Date();
		for (let slot of this.storage.data.dutySlots) {
			let startTime = new Date(slot.startTime);
			if (Math.abs(+date - +startTime) < 5000) {
				console.info(`Triggered duty slot`, slot);

				let user = this.storage.data.dutyMans.find(x => x.id === slot.userId);
				if (user) {
					if (user.username) {
						this.broadcast(`Настала очередь дежурить @${user.username}`);
					} else {
						this.broadcast(`Настала очередь дежурить @${user.id}(${user.name})`);
					}
				} else {
					this.broadcast(`Кто-то неизвестный с id ${slot.userId} теперь дежурный!`);
				}
			}
		}

		this.update();
	}

	broadcast(message: string) {
		for (let chat of this.storage.data.subscribedChats) {
			this.bot.telegram.sendMessage(chat.id, message);
		}
	}
}