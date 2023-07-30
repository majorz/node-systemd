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

		it('activeState starts as "inactive"', async () => {
			const manager = new ServiceManager(bus);
			await expect(
				manager.getUnit('dummy.service').activeState,
			).to.eventually.equal('inactive');
		});

		it('partOf can be queried', async () => {
			const manager = new ServiceManager(bus);
			await expect(
				manager.getUnit('dummy.service').partOf,
			).to.eventually.deep.equal([]);
		});
	});

	describe('ServiceManager', () => {
		it('allows to start unit', async () => {
			const manager = new ServiceManager(bus);

			await expect(manager.startUnit('dummy.service', 'fail')).to.not.be
				.rejected;
			await expect(
				manager.getUnit('dummy.service').activeState,
			).to.eventually.equal('active');
		});

		it('allows to stop unit', async () => {
			const manager = new ServiceManager(bus);

			await expect(manager.stopUnit('dummy.service', 'fail')).to.not.be
				.rejected;
			await expect(
				manager.getUnit('dummy.service').activeState,
			).to.eventually.equal('inactive');
		});

		it('allows to restart unit', async () => {
			const manager = new ServiceManager(bus);

			await expect(manager.restartUnit('dummy.service', 'fail')).to.not.be
				.rejected;
			await expect(
				manager.getUnit('dummy.service').activeState,
			).to.eventually.equal('active');
			await expect(manager.stopUnit('dummy.service', 'fail')).to.not.be
				.rejected;
			await expect(
				manager.getUnit('dummy.service').activeState,
			).to.eventually.equal('inactive');
			await expect(manager.restartUnit('dummy.service', 'fail')).to.not.be
				.rejected;
			await expect(
				manager.getUnit('dummy.service').activeState,
			).to.eventually.equal('active');
		});
	});
});
