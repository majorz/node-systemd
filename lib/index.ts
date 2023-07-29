import {
	SystemBus,
	unitActiveState,
	unitPartOf,
	startUnit,
	stopUnit,
	restartUnit,
	reboot,
	powerOff,
} from '../index.node';

export { system } from '../index.node';
export class ServiceManager {
	constructor(readonly bus: SystemBus) {}

	getUnit(name: string) {
		return new Unit(this.bus, name);
	}

	async startUnit(name: string, mode: string): Promise<void> {
		await startUnit(this.bus, name, mode);
	}

	async stopUnit(name: string, mode: string): Promise<void> {
		await stopUnit(this.bus, name, mode);
	}

	async restartUnit(name: string, mode: string): Promise<void> {
		await restartUnit(this.bus, name, mode);
	}
}

export class Unit {
	constructor(readonly bus: SystemBus, readonly name: string) {}

	get activeState(): Promise<string> {
		return unitActiveState(this.bus, this.name);
	}
	get partOf(): Promise<string[]> {
		return unitPartOf(this.bus, this.name);
	}
}

export class LoginManager {
	constructor(readonly bus: SystemBus) {}

	async reboot(interactive = false): Promise<void> {
		await reboot(this.bus, interactive);
	}

	async powerOff(interactive = false): Promise<void> {
		await powerOff(this.bus, interactive);
	}
}
