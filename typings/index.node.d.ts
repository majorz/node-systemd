declare module "*index.node" {
	type SystemBus = {};

	function system(): SystemBus;

	// These methods
	function unitActiveState(bus: SystemBus, unitName: string): Promise<string>;
	function unitPartOf(bus: SystemBus, unitName: string): Promise<string[]>;
	function unitStart(bus: SystemBus, unitName: string, mode: string): Promise<void>;
	function unitStop(bus: SystemBus, unitName: string, mode: string): Promise<void>;
	function unitRestart(bus: SystemBus, unitName: string, mode: string): Promise<void>;
	function reboot(bus: SystemBus, interactive: boolean): Promise<void>;
	function powerOff(bus: SystemBus, interactive: boolean): Promise<void>;
}
