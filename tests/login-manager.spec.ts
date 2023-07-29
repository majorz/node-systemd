import { expect } from './chai';
import { system, LoginManager } from '../lib';
import { promisify } from 'util';
import { exec as execSync } from 'child_process';

const exec = promisify(execSync);

const bus = system();

export async function dbusSend(
	dest: string,
	path: string,
	message: string,
	...contents: string[]
) {
	const { stdout, stderr } = await exec(
		[
			'dbus-send',
			'--system',
			`--dest=${dest}`,
			'--print-reply',
			path,
			message,
			...contents,
		].join(' '),
		{ encoding: 'utf8' },
	);

	if (stderr) {
		throw new Error(stderr);
	}

	// Remove first line, trim each line, and join them back together
	return stdout
		.split(/\r?\n/)
		.slice(1)
		.map((s) => s.trim())
		.join('');
}

describe('LoginManager', () => {
	it('allows to reboot the system', async () => {
		const manager = new LoginManager(bus);
		await expect(manager.reboot()).to.not.be.rejected;

		// The mock server provides a MockState to test
		// if the command was successful
		await expect(
			dbusSend(
				'org.freedesktop.login1',
				'/org/freedesktop/login1',
				'org.freedesktop.DBus.Properties.Get',
				'string:org.freedesktop.login1.Manager',
				'string:MockState',
			),
		).to.eventually.equal('variant       string "rebooting"');
	});

	it('allows to power off the system', async () => {
		const manager = new LoginManager(bus);
		await expect(manager.powerOff()).to.not.be.rejected;

		// The mock server provides a MockState to test
		// if the command was successful
		await expect(
			dbusSend(
				'org.freedesktop.login1',
				'/org/freedesktop/login1',
				'org.freedesktop.DBus.Properties.Get',
				'string:org.freedesktop.login1.Manager',
				'string:MockState',
			),
		).to.eventually.equal('variant       string "off"');
	});
});
