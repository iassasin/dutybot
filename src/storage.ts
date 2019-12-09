import * as fs  from 'fs';

export interface Chat {
	id: number;
	title: string;
	type: string;
}

export interface DutyMan {
	id: number;
	username: string;
	name: string;
}

export interface DutySlot {
	userId: number;
	startTime: string;
}

export interface BotStorage {
	subscribedChats: Chat[];
	dutyMans: DutyMan[];
	dutySlots: DutySlot[];
}

export default class Storage<T> {
	private dataObj: T = {} as T;
	readonly filename: string;

	get data() { return this.dataObj; }

	constructor(filename: string, defaultObj: T = {} as T) {
		this.filename = filename;
		this.dataObj = defaultObj;

		this.reload();
	}

	reload() {
		try {
			this.dataObj = JSON.parse(fs.readFileSync(this.filename).toString());
		} catch (e) {
			console.error(`Can't read data from file '${this.filename}'`, e);
		}
	}

	mutate(mutator: (data: T) => void) {
		mutator(this.dataObj);
		try {
			fs.writeFileSync(this.filename, JSON.stringify(this.dataObj));
		} catch (e) {
			console.error(`Can't write data to file '${this.filename}'`, e);
		}
	}
}