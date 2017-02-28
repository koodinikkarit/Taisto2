
import Immutable, {
    Map
} from "immutable";

export default class extends Immutable.Record({
    nextMatrixId: 1,
    nextConPortId: 1,
    nextCpuPortId: 1,
    nextDiagramId: 1,
    nextDiagramScreenId: 1,
    nextDiagramScreenCpuPortId: 1,
    nextDefaultStateId: 1,
    nextDefaultStateVideoConnectionId: 1,
    nextDefaultStateKwmConnectionId: 1, 
	matrixs: new Map(),
    conPorts: new Map(),
    cpuPorts: new Map(),
    diagrams: new Map(),
    diagramScreens: new Map(),
    diagramScreenCpuPorts: new Map(),
    defaultStates: new Map(),
    defaultStateVideoConnections: new Map(),
    defaultStateKwmConnections: new Map()
}) {


}