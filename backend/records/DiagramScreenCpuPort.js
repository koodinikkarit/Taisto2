import Immutable from "immutable";

import {
    db
} from "../TaistoService";

export default class extends Immutable.Record({
	id: null,
    diagramScreenId: null,
    cpuPortId: null
}) {
    get cpuPort() {
        var cpuPort = db.cpuPorts.get(this.cpuPortId);
        if (cpuPort) return cpuPort;
    }
}