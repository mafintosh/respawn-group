var respawn = require('respawn');
var xtend = require('xtend');
var events = require('events');

var regroup = function(defaults) {
	var group = new events.EventEmitter();

	var monitors = {};
	var running = {};

	var bootstrap = function(mon) {
		mon.on('stdout', function(data) {
			group.emit('stdout', mon, data);
		});

		mon.on('stderr', function(data) {
			group.emit('stderr', mon, data);
		});

		mon.on('spawn', function(child) {
			group.emit('spawn', mon, child);
		});

		mon.on('exit', function(code, signal) {
			group.emit('exit', mon, code, signal);
		});

		mon.on('warn', function(err) {
			group.emit('warn', mon, err);
		});

		mon.on('stop', function() {
			if (running[mon.id] === mon) {
				delete running[mon.id];
				group.emit('stop', mon);
			}
			remove(mon);
		});
	};

	var remove = function(mon) {
		if (!mon || mon.status !== 'stopped' || monitors[mon.id] === mon || running[mon.id] === mon) return;
		group.emit('remove', mon);
	};

	group.list = function() {
		return Object.keys(monitors).map(group.get);
	};

	group.get = function(id) {
		return running[id] || monitors[id];
	};

	group.add = function(id, command, opts) {
		if (!Array.isArray(command)) return group.add(command.command, command);
		opts = xtend(defaults, opts);

		var mon = respawn(command, opts);
		var old = monitors[id];

		mon.id = id;
		monitors[id] = mon;
		bootstrap(mon);

		group.emit('add', mon);
		remove(old);
	};

	group.remove = function(id, cb) {
		var mon = monitors[id];
		if (!mon) return cb && cb();

		delete monitors[id];
		group.stop(id, cb);
	};

	group.start = function(id) {
		var mon = monitors[id];
		if (!mon) return null;

		var old = running[id];
		var status = old ? old.status : 'stopped';
		if (status === 'running') return mon;

		running[id] = mon;
		remove(old);

		mon.start();
		if (status === 'stopped') group.emit('start', mon);

		return mon;
	};

	group.stop = function(id, cb) {
		var mon = running[id];
		if (!mon) return cb && cb();
		mon.stop(cb);
	};

	group.restart = function(id) {
		group.stop(id);
		var mon = group.start(id);
		if (mon) group.emit('restart', mon);
		return mon;
	};

	return group;
};