import Immutable from "immutable";

import {
    db
} from "../TaistoService";

export default class extends Immutable.Record({
	id: null,
    slug: "",
    diagramId: null,
    matrixId: null,
    conPortId: null
}) {
    get diagram() {
        return db.diagrams.get(this.diagramId);
    }

    get matrix() {
        return db.matrixs.get(this.matrixId);
    }

    get conPort() {
        return db.conPorts.get(this.conPortId);
    }

    get cpuPorts() {
        return db.diagramScreenCpuPorts.filter(p => p.diagramScreenId === this.id).map(p => p.cpuPort);
    }
}