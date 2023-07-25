import { expect } from './chai';
import {
	system,
	SystemdManager
} from '../lib';

const bus = system();

describe('SystemdManager', () => {
	describe('get_unit_active_state', () => {
		it('unit should be active', async () => {
			const systemd = new SystemdManager(bus);
			const state = await systemd.activeState('dummy.service');
			expect(state).to.equal('active');
		});
	})
})
