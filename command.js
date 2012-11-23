var EventEmitter = require("events").EventEmitter;
var ChildProcess = require("child_process");

/**
 * @class
 * @param {String} expression Expression of the command to create.
 */
var Command = (function() {
	var constructor = function(expression) {
		var self = this,
			running = false,
			output,
			errorOutput,
			exitCode,
			emitter = new EventEmitter(),
			childProcess;

		/**
		 * @param {Function} callback Callback to invoke when the command completes.
		 * @returns {ChildProcess}
		 */
		this.run = function(callback) {
			running = true;

			this.once("completed", callback);

			childProcess = ChildProcess.exec(expression, function(error) {
				running = false;
				exitCode = error ? error.code : 0;
				output = arguments[1] || "";
				errorOutput = arguments[2] || "";

				emitter.emit("completed", self);
			});

			return childProcess;
		};

		/**
		 * Returns the error output gotten after this command has run.
		 *
		 * @returns {String}
		 */
		this.getExpression = function() {
			return expression;
		};

		/**
		 * Tells whether this command is running or not.
		 *
		 * @returns {boolean}
		 */
		this.isRunning = function() {
			return running;
		};

		/**
		 * Returns the exit code gotten after this command has run.
		 *
		 * @returns {Integer}
		 */
		this.getExitCode = function() {
			return exitCode;
		};

		/**
		 * Returns the regular output gotten after this command has run.
		 *
		 * @returns {String}
		 */
		this.getOutput = function() {
			return output;
		};

		/**
		 * Returns the error output gotten after this command has run.
		 *
		 * @returns {String}
		 */
		this.getErrorOutput = function() {
			return errorOutput;
		};

		/**
		 * Returns the child process responsible for running this command.
		 *
		 * @param {String} event Name of the event to invoke the callback for.
		 * @param {Function} callback Callback to invoke when the specified event happens.
		 * @see EventEmitter#once
		 */
		this.getChildProcess = function() {
			return childProcess;
		};

		/**
		 * Adds a listener to this command to be called once the specified event happens.
		 *
		 * @param {String} event Name of the event to invoke the callback for.
		 * @param {Function} callback Callback to invoke when the specified event happens.
		 * @returns {Function} The listener actually added.
		 * @see EventEmitter#once
		 */
		this.once = function(event, callback) {
			callback && emitter.once(event, callback);

			return callback;
		};
	};

	constructor.prototype.toString = function() {
		return this.getExpression();
	};

	/**
	 * Shortcut for creating then running a command.
	 * The first argument is passed to the Command constructor whilst the remaining ones are used to call the instance's "run" method.
	 *
	 * @param {String} expression Expression of the command to run.
	 * @returns {Command} Resulting Command object.
	 * @see Command
	 */
	constructor.run = function(expression, callback) {
		var command = new constructor(expression);
		command.run.apply(command, Array.prototype.slice.call(arguments, 1));

		return command;
	};

	/**
	 * Shortcut for creating then running a batch of commands.
	 * The first argument is passed to the Batch constructor whilst the remaining ones are used to call the instance's "run" method.
	 *
	 * @param {String[]|Command[]} expressions Expressions, commands or a mix of those two to be added to the batch initially.
	 * @returns {Batch} Resulting Batch object.
	 * @see Batch
	 */
	constructor.batch = function(expressions, callback) {
		var batch = new Batch(expressions);
		batch.run.apply(batch, Array.prototype.slice.call(arguments, 1));
		return batch;
	};

	return constructor;
})();

/**
 * @class Batch of commands.
 *
 * @param {String[]|Command[]} expressions Expressions, commands or a mix of those two to be added to this batch initially.
 * @see Batch#add
 * @see Command
 */
var Batch = (function() {
	var constructor = function(expressions) {
		var self = this,
			commands = [],
			emitter = new EventEmitter(),
			listener = function(command) {
				if(!commands.some(function(command) { return command.isRunning(); })) {
					emitter.emit("completed", self);
				}
			};

		/**
		 * Adds a command to this batch.

		 * @param {String|Command} expression Expression or command to add to this batch.
		 * @returns {Command} The command which was actually added.
		 */
		this.add = function(expression) {
			var command = (expression.constructor == Command) ? expression : new Command(expression);

			commands.push(command);

			return command;
		};

		/**
		 * Runs this batch of commands.
		 *
		 * @param {Function} callback Callback to invoke when the batch completes.
		 * @returns {ChildProcess[]}
		 */
		this.run = function(callback) {
			var children = [],
				iterativeCallback = (arguments.length > 1) ? callback : undefined,
				callback = iterativeCallback ? arguments[1] : callback;

			callback && this.once("completed", callback);

			commands.forEach(function(command) {
				var child = command.run(iterativeCallback);
				children.push(child);
				// Call "listener" once the command has completed in order to check if the batch itslef has completed.
				command.once("completed", listener);
			});

			return children;
		};

		/**
		 * Returns the commands of this batch.
		 *
		 * @returns {Command[]} Array that contains the commands of this batch.
		 */
		this.getCommands = function() {
			return commands.splice();
		};

		/**
		 * Returns the commands of this batch currently running.
		 *
		 * @returns {Command[]}
		 */
		this.getRunningCommands = function() {
			return commands.filter(function(command) { return command.isRunning(); });
		};

		/**
		 * Adds a listener to this batch to be called once the specified event happens.
		 *
		 * @param {String} event Name of the event to invoke the callback for.
		 * @param {Function} callback Callback to invoke when the specified event happens.
		 * @returns {Function} The listener actually added.
		 * @see EventEmitter#once
		 */
		this.once = function(event, callback) {
			callback && emitter.once("completed", callback);

			return callback;
		};

		// Initially add the commands provided to the constructor.
		expressions.forEach(function(expression) {
			self.add(expression);
		});
	};

	return constructor;
})();

module.exports = {
	"Command": Command,
	"Batch": Batch
};