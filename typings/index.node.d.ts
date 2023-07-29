declare module "*index.node" {
	type SystemBus = {};

	function system(): SystemBus;
	function unitActiveState(bus: SystemBus, unitName: string): Promise<string>;
	function unitPartOf(bus: SystemBus, unitName: string): Promise<string[]>;
	function startUnit(bus: SystemBus, unitName: string, mode: string): Promise<void>;
	function stopUnit(bus: SystemBus, unitName: string, mode: string): Promise<void>;
	function restartUnit(bus: SystemBus, unitName: string, mode: string): Promise<void>;
	function reboot(bus: SystemBus, interactive: boolean): Promise<void>;
	function powerOff(bus: SystemBus, interactive: boolean): Promise<void>;
}
