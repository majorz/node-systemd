import { SystemBus, unit_active_state } from "../index.node";

export { system } from '../index.node';
export class SystemdManager {
	constructor(readonly bus: SystemBus) {
	}

	activeState(unit: string): Promise<string> {
		return unit_active_state(this.bus, unit)
	}
}
