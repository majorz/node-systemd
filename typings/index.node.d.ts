declare module "*index.node" {
	type SystemBus = {};

	function system(): SystemBus;

	// These methods
	function unitActiveState(unitName: string): Promise<string>;
	function unitPartOf(unitName: string): Promise<string[]>;
	function startUnit(unitName: string, mode: string): Promise<void>;
	function stopUnit(unitName: string, mode: string): Promise<void>;
	function restartUnit(unitName: string, mode: string): Promise<void>;
	function reboot(interactive: boolean): Promise<void>;
	function powerOff(interactive: boolean): Promise<void>;
}
