var Command = require("./command").Command;

var expressions = [
	"grep -lR unix /var/log",
	"grep -lR connection /var/log"
];

expressions.forEach(function(expression) {
	var command = Command.run(expression, function(command) {
		var output = command.getOutput();
		var errorOutput = command.getErrorOutput();
		console.log("\n[COMMAND] \n\t" + command,
			("\n-OUTPUT-\n" + output + (errorOutput ? "-ERROR-\n" + errorOutput : "")).replace(/\n/g, "\n\t\t"));
	});
});

Command.batch(expressions, function(command) {
	var output = command.getOutput();
	var errorOutput = command.getErrorOutput();
	console.log("\n[BATCH] \n\t" + command,
		("\n-OUTPUT-\n" + output + (errorOutput ? "-ERROR-\n" + errorOutput : "")).replace(/\n/g, "\n\t\t"));
}, function() {
	console.log("[BATCH] All commands returned!");
});