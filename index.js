var respawn = require('respawn');
var xtend = require('xtend');
var afterAll = require('after-all');
var events = require('events');

var stopped = function(status) {
	return status === 'stopped' || status === 'crashed';
};

var respawns = function(defaults) {
	var group = new events.EventEmitter();

	var monitors = {};
	var running = {};
	var shutdown = false;

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

		mon.on('sleep', function() {
			group.emit('sleep', mon);
		});

		mon.on('exit', function(code, signal) {
			group.emit('exit', mon, code, signal);
		});

		mon.on('warn', function(err) {
			group.emit('warn', mon, err);
		});

		mon.on('crash', function() {
			group.emit('crash', mon);
		});

		mon.on('stop', function() {
			if (running[mon.id] === mon) {
				delete running[mon.id];
				group.emit('stop', mon);
			}
			finalize(mon);
		});
	};

	var finalize = function(mon) {
		if (!mon || !stopped(mon.status) || monitors[mon.id] === mon || running[mon.id] === mon) return;
		group.emit('finalize', mon);
	};

	group.list = function() {
		return Object.keys(monitors).map(group.get);
	};

	group.get = function(id) {
		return running[id] || monitors[id];
	};

	group.has = function(id) {
		return !!group.get(id);
	};

	group.add = function(id, command, opts) {
		if (typeof(command) != 'function' && !Array.isArray(command)) return group.add(id, command.command, command);
		opts = xtend(defaults, opts);

		var mon = respawn(command, opts);
		var old = monitors[id];

		mon.id = id;
		monitors[id] = mon;
		bootstrap(mon);
		finalize(old);

		return mon;
	};

	group.remove = function(id, cb) {
		var mon = monitors[id];
		if (!mon) return cb && cb();

		delete monitors[id];
		group.stop(id, cb);
	};

	group.start = function(id) {
		var mon = monitors[id];
		if (!mon || shutdown) return null;

		var old = running[id];
		var status = old ? old.status : 'stopped';
		if (status === 'running' || status === 'sleeping') return mon;

		running[id] = mon;
		finalize(old);

		mon.start();
		if (stopped(status)) group.emit('start', mon);

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

	group.shutdown = function(cb) {
		shutdown = true;

		var next = afterAll(cb);

		Object.keys(monitors).forEach(function(name) {
			group.stop(name, next());
		});
	};

	return group;
};

module.exports = respawns;
