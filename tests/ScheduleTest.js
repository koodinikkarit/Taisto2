import schedule from "node-schedule";

var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = [0, 1, 2, 3, 4, 5, 6];
//rule.hour = 17;
//rule.minute = 0;
rule.second = null

var j = schedule.scheduleJob(rule, function(){
  console.log("jobi");
});
setTimeout(function() {
	rule.hour = 11;
	j.cancel();
	j = schedule.scheduleJob(rule, function(){
  		console.log("jobi", rule, j);
	});
}, 4500);