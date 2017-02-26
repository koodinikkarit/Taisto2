import Immutable from "immutable";

import {
    db
} from "../TaistoService";

export default class extends Immutable.Record({
	id: null,
    slug: ""
}) {
    get diagramScreens() {
        return db.diagramScreens.filter(p => p.diagramId === this.id);
    }
}