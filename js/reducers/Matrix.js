
import {
	NEW_VIDEO_CONNECTION,
	NEW_KWM_CONNECTION,
	NEW_KWM_CONNECTIONS,
	NEW_VIDEO_CONNECTIONS,
	VIDEO_CONNECTION_TURN_OFF,
	KWM_CONNECTION_TURN_OFF
} from "../constants/actionconstants";

import {
	Map
} from "immutable";

const initialState = {
	videoConnections: new Map(),
	kwmConnections: new Map()
};

export default function (state = initialState, action) {
	switch(action.type) {
		case NEW_VIDEO_CONNECTION:
			return Object.assign({}, state, {
				videoConnections: state.videoConnections.set(action.con, action.cpu)
			});
		case NEW_KWM_CONNECTION:
			return Object.assign({}, state, {
				kwmConnections: state.kwmConnections.set(action.con, action.cpu)
			});
		case NEW_VIDEO_CONNECTIONS:
			return Object.assign({}, state, {
				videoConnections: state.videoConnections.merge(action.videoConnections)
			});
		case NEW_KWM_CONNECTIONS:
			return Object.assign({}, state, {
				kwmConnections: state.kwmConnections.merge(action.kwmConnections)
			});
		case VIDEO_CONNECTION_TURN_OFF:
			return Object.assign({}, state, {
				videoConnections: state.videoConnections.delete(action.con)
			});
		case KWM_CONNECTION_TURN_OFF:
			return Object.assign({}, state, {
				kwmConnections: state.kwmConnections.delete(action.cpu)
			});
		default:
			return state;
	}
}