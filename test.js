var Command = require("./command");

var expressions = [
	"grep -lR unix /var/log",
	"grep -lR connection /var/log"
];

expressions.forEach(function(expression) {
	var command = Command.run(expression, function() {
		console.log("\n" + command, command.getOutput().replace(/\n/g, "\n\t"));
		var runningCommands = Command.getRunningCommands();
		if(!runningCommands.length) {
			console.log("All commands returned!");
		}
		else {
			console.log("Some commands are still running:", runningCommands.map(function(command) { return command.toString(); }));
		}
	});
});

Command.batch(expressions, function(command) {
	console.log("\n[BATCH] " + command, command.getOutput().replace(/\n/g, "\n\t"));
}, function() {
	console.log("[BATCH] All commands returned!");
});