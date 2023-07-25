FROM debian:stable


# Install both DBus and systemd support
RUN apt-get update && apt-get install -y --no-install-recommends dbus systemd-sysv

# We want to use the multi-user.target not graphical.target
RUN systemctl set-default multi-user.target && \
		# We never want these to run in a container
		systemctl mask \
    	dev-hugepages.mount \
    	sys-fs-fuse-connections.mount \
    	sys-kernel-config.mount \
    	display-manager.service \
    	getty@.service \
    	systemd-logind.service \
    	systemd-remount-fs.service \
    	getty.target \
    	graphical.target


COPY entry.sh /usr/bin

# Install the dummy service
COPY dummy.service /etc/systemd/system
COPY dbus.socket /lib/systemd/system
RUN systemctl enable dummy.service

STOPSIGNAL 37
ENTRYPOINT ["/usr/bin/entry.sh"]
ENV INITSYSTEM on
VOLUME /run/dbus

# Setting up the user application
WORKDIR /usr/src/app
COPY start.sh ./

CMD ["./start.sh"]
