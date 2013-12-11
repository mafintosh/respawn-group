# respawn-group

Manage a group of [respawn](https://github.com/mafintosh/respawn) monitors

	npm install respawn-group

## Usage

``` js
var regroup = require('respawn-group');
var group = regroup();

group.add('test', ['node', 'server.js']);
group.start('test');
```

## API

* `regroup(defaults) -> group` Instantiate a new respawn group. All `opts` will inherit from `defaults`

* `group.add(id, command, opts) -> mon` Add a new respawn monitor. See [respawn](https://github.com/mafintosh/respawn) for more information. If you add a new monitor with the same id as an old one it will be used when the old monitor stops.

* `group.remove(id, cb)` Remove a monitor

* `group.start(id) -> mon` Start a monitor

* `group.stop(id, cb)` Stop a monitor

* `group.restart(id) -> mon` Gracefully restart a monitor

* `group.get(id) -> mon` Get a monitor

* `group.has(id) -> bool` True is group has monitor

* `group.list() -> array` List all monitors

## Events

* `group.on('start', mon)` Monitor has started. `mon.id` contains the id of the monitor

* `group.on('stop', mon)` Monitor is fully stopped

* `group.on('restart', mon)` Monitor is being restarted

* `group.on('spawn', mon, process)` Monitor has spawned a child process

* `group.on('exit', mon, code, signal)` Monitors child process has exited

* `group.on('stdout', mon, data)` child process stdout has emitted data

* `group.on('stderr', mon, data)` child process stderr has emitted data

* `group.on('warn', mon, err)` Monitor has a warning

* `group.on('finalize', mon)` A monitor is fully stopped and being garbage collected. Happens if you call remove or updates a monitor

## Updating existing monitors

To update an existing monitor simply add it again with the same id

``` js
group.add('test', ['node', 'server.js']);

// ... wait a bit ...
// now lets update test

group.add('test', ['node', 'server2.js']);
group.restart('test'); // you need to restart test for the new monitor to take over
                       // this will trigger a 'finalize' event for the old monitor
```

## License

MIT