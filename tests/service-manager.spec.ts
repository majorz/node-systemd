import { expect } from './chai';
import { system, ServiceManager } from '../lib';

const bus = system();

describe('ServiceManager', () => {
	describe('Unit', () => {
		it('activeState can be queried', async () => {
			const manager = new ServiceManager(bus);
			await expect(manager.getUnit('dummy.service').activeState).to.not.be
				.rejected;
		});

		it('activeState can be queried in parallel', async () => {
			const manager = new ServiceManager(bus);
			// TODO: how can we test that the call is indeed not blocking the
			// main thread?
			await expect(
				Promise.all([
					await manager.getUnit('dummy.service').activeState,
					await manager.getUnit('dummy.service').activeState,
				]),
			).to.not.be.rejected;
		});
	});
});
