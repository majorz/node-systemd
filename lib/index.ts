import { SystemBus, unit_active_state } from '../index.node';

export { system } from '../index.node';
export class ServiceManager {
	constructor(readonly bus: SystemBus) {}

	getUnit(name: string) {
		return new Unit(this.bus, name);
	}
}

export class Unit {
	constructor(readonly bus: SystemBus, readonly name: string) {}

	get activeState(): Promise<string> {
		return unit_active_state(this.bus, this.name);
	}
}
