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

* `regroup(defaults)` Instantiate a new respawn group. All `opts` will inherit from `defaults`

* `group.add(id, command, opts)` Add a new respawn monitor. See [respawn](https://github.com/mafintosh/respawn) for more information

* `group.remove(id, cb)` Remove a monitor

* `group.start(id)` Start a monitor

* `group.stop(id, cb)` Stop a monitor

* `group.restart(id)` Gracefully restart a monitor

## Events

* `group.on('add', mon)` New monitor has been added. `mon.id` contains the id of the monitor

* `group.on('remove', mon)` Monitor has been removed. Note that if you call `add` multiple times with the same id old monitors will be removed automatically.

* `group.on('start', mon)` Monitor has started

* `group.on('stop', mon)` Monitor is fully stopped

* `group.on('restart', mon)` Monitor is being restarted

* `group.on('spawn', mon, process)` Monitor has spawned a child process

* `group.on('exit', mon, code, signal)` Monitors child process has exited

* `group.on('stdout', mon, data)` child process stdout has emitted data

* `group.on('stderr', mon, data)` child process stderr has emitted data

* `group.on('warn', mon, err)` Monitor has a warning

## License

MIT