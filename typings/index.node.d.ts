declare module "*index.node" {
	class SystemBus { }

	function system(): SystemBus;
	function unit_active_state(s: SystemBus, unit: string): Promise<string>;
}
