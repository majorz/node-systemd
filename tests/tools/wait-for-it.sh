#!/bin/sh

set -e

timeout=3000
while :; do
	case $1 in
	-t | --timeout) # Takes an option argument, ensuring it has been specified.
		if [ -n "$2" ]; then
			timeout=$2
			shift
		else
			printf 'ERROR: "--timeout" requires a non-empty option argument.\n' >&2
			exit 1
		fi
		shift
		break
		;;
	--) # End of all options.
		shift
		break
		;;
	-?*)
		printf 'WARN: Unknown option (ignored): %s\n' "$1" >&2
		shift
		;;
	*) # Default case: If no more options then break out of the loop.
		break ;;
	esac

	shift
done

cmd="$*"

dbus_healthy() {
	# Look for the dummy service unit in the bus to see if the bus is ready
	dbus-send --system \
		--print-reply \
		--type=method_call \
		--dest=org.freedesktop.systemd1 \
		/org/freedesktop/systemd1 \
		org.freedesktop.systemd1.Manager.GetUnit string:dummy.service
}

set_abort_timer() {
	sleep "$1"
	# Send a USR2 signal to the given pid after the timeout happens
	kill -USR2 "$2"
}

abort_if_not_ready() {
	# If the timeout is reached and the required services are not ready, it probably
	# means something went wrong so we terminate the program with an error
	echo "Something happened, failed to start in ${timeout}s" >&2
	exit 1
}

# Trap the signal and start the timer if user timeout is greater than 0
if [ "$timeout" -gt 0 ]; then
	trap 'abort_if_not_ready' USR2
	set_abort_timer "$timeout" $$ &
	timer_pid=$!
fi

# Wait for dbus
until dbus_healthy >/dev/null; do
	echo "Waiting for dbus"
	sleep 1
done

# Kill the timer since we are ready to start
if [ "$timer_pid" != "" ]; then
	kill $timer_pid
fi

exec ${cmd}
