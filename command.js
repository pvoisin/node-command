var EventEmitter = require("events").EventEmitter;
var ChildProcess = require("child_process");

var Command = (function() {
	var commands = []
		batchEmitter = new EventEmitter(),
		batchListener = function(command) {
			if(!commands.some(function(command) { return command.isRunning(); })) {
// TODO try to provide what commands have been running since the call to Command.batch
				batchEmitter.emit("completed");
			}
		};

	var constructor = function(expression) {
		var self = this,
			running = false,
			output,
			errorOutput,
			exitCode,
			emitter = new EventEmitter();

		this.run = function(callback) {
			running = true;

			this.once("completed", callback);
			this.once("completed", batchListener);

			return ChildProcess.exec(expression, function(error) {
				running = false;
				exitCode = error ? error.code : 0;
				output = arguments[1] || "";
				errorOutput = arguments[2] || "";

				emitter.emit("completed", self);
			});
		};

		this.getExpression = function() {
			return expression;
		};

		this.isRunning = function() {
			return running;
		};

		this.getExitCode = function() {
			return exitCode;
		};

		this.getOutput = function() {
			return output;
		};

		this.getErrorOutput = function() {
			return errorOutput;
		};

		this.once = function(event, callback) {
			callback && emitter.once(event, callback);
		};

		commands.push(this);
	};

	constructor.prototype.toString = function() {
		return this.getExpression();
	};

	constructor.run = function(expression, callback) {
		var command = new constructor(expression);
		command.run(callback);
		return command;
	};

	constructor.getRunningCommands = function() {
		return commands.filter(function(command) {
			return command.isRunning();
		});
	};

	constructor.once = function(event, callback) {
		callback && batchEmitter.once("completed", callback);
	};

	constructor.batch = function(expressions, callback) {
		var iterativeCallback = (arguments.length > 2) ? callback : undefined,
			callback = iterativeCallback ? arguments[2] : callback;

		callback && this.once("completed", callback);

		expressions.forEach(function(expression) {
			Command.run(expression, iterativeCallback);
		});
	};

	return constructor;
})();

module.exports = Command;