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
				this.timer = setTimeout(this.checkDuty.bind(this), +startTime - Date.now());
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
						this.broadcast(`Настала очередь дежурить [${user.name}](tg://user?id=${user.id})`);
					}
				} else {
					this.broadcast(`Кто-то неизвестный с id [${slot.userId}](tg://user?id=${slot.userId}) теперь дежурный!`);
				}
			}
		}

		this.update();
	}

	broadcast(message: string) {
		for (let chat of this.storage.data.subscribedChats) {
			this.bot.telegram.sendMessage(chat.id, message, {parse_mode: 'Markdown'});
		}
	}

	addTimeSlot(userId: number, startTime: Date) {
		this.storage.mutate(data => {
			data.dutySlots.push({userId, startTime: startTime.toISOString()});
		});
	}

	deleteTimeSlot(userId: number, startTime: Date) {
		let time = startTime.toISOString();
		this.storage.mutate(data => {
			data.dutySlots = data.dutySlots.filter(slot => !(slot.userId === userId && slot.startTime === time));
		});
	}

	deleteByTime(startTime: Date) {
		let time = startTime.toISOString();
		this.storage.mutate(data => {
			data.dutySlots = data.dutySlots.filter(slot => slot.startTime !== time);
		});
	}
}