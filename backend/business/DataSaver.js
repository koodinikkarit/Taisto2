
import fs from "fs";

export default class {
	constructor({ 
		path,
		interval
	}) {
		this.state = {
			path: path,
			interval: interval
		}

		this.changes = { };
		this.removes = [];
	}

	save(id, changes) {
		var newChanges = { };
		newChanges[id] = changes;
		this.changes = Object.assign({}, this.changes, newChanges);
		if (this.isChanged()) {
			if (this.timeOut) clearTimeout(this.timeOut);
			this.timeOut = setTimeout(() => {
				this.saver();
			}, this.state.interval);
		}
	}

	remove(id) {
		console.log("Lisätään poisto", id);
		this.removes.push(id);
		if (this.timeOut) clearTimeout(this.timeOut);
		this.timeOut = setTimeout(() => {
			this.saver();
		}, this.state.interval);
		// fs.readFile(this.state.path + ".json", "utf8", (err, data) => {
		// 	console.log("rree", this.state.path);
		// 	var oldChanges = data && data !== "undefined" ? JSON.parse(data) : { };
		// 	delete oldChanges[id];
		// 	fs.writeFile(this.state.path + ".json", JSON.stringify(oldChanges), err => {
		// 		if (!err) {
		// 			this.state.changes = { };
		// 		} else {
		// 			console.log("error while saving", err);
		// 		}
		// 	});
		// });
	}

	saver() {
		fs.readFile(this.state.path + ".json", "utf8", (err, data) => {
			var oldChanges = data && data !== "undefined" ? JSON.parse(data) : { };
			Object.keys(this.changes).forEach(id => {
				oldChanges[id] = Object.assign({}, oldChanges[id], this.changes[id]);
			});
			this.removes.forEach((id, i) => {
				console.log("loytyi", id, i);
				delete oldChanges[id];
			});
			this.removes = [];
			fs.writeFile(this.state.path + ".json", JSON.stringify(oldChanges), err => {
				if (!err) {
					this.state.changes = { };
				} else {
					console.log("error while saving", err);
				}
			});
		});
	}

	load() {
		return new Promise((resolve, reject) => {
			fs.readFile(this.state.path + ".json", "utf8", (err, data) => {
				var changes = data && data !== "undefined" ? JSON.parse(data) : { };
				resolve(changes);
			});
		});
	}

	isChanged() {
		return JSON.stringify(this.prevChanges) !== JSON.stringify(this.changes);
	}
}