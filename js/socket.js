
import {
	NEW_KWM_CONNECTION,
	NEW_VIDEO_CONNECTION,
	NEW_VIDEO_CONNECTIONS,
	NEW_KWM_CONNECTIONS,
	SET_VIDEO_CONNECTION,
	SET_KWM_CONNECTION,
	VIDEO_CONNECTION_TURN_OFF,
	KWM_CONNECTION_TURN_OFF,
	TURN_OFF_VIDEO_CONNECTION,
	TURN_OFF_KWM_CONNECTION
} from "./constants/actionconstants";

import {
	UPDATE_MATRIX_CONNECTION_STATE,
	MATRIX_CONNECTION_STATES
} from "./constants/matrix";

export default (connectSocket = io) => {
	const socket = connectSocket(); // Same origin and protocol; Socket.IO reconnects by default.
	return store => {
		socket.on(MATRIX_CONNECTION_STATES, connectionStates => {
			store.dispatch({ type: MATRIX_CONNECTION_STATES, connectionStates });
		});
		socket.on("disconnect", () => {
			// Losing the browser connection tells us nothing about the hardware.
			store.dispatch({ type: MATRIX_CONNECTION_STATES, connectionStates: {} });
		});
		socket.on(NEW_VIDEO_CONNECTION, (videoConnection) => {
			store.dispatch({
				type: NEW_VIDEO_CONNECTION,
				con: videoConnection.con,
				cpu: videoConnection.cpu
			});
		});

		socket.on(NEW_KWM_CONNECTION, (kwmConnection) => {
			store.dispatch({
				type: NEW_KWM_CONNECTION,
				con: kwmConnection.con,
				cpu: kwmConnection.cpu
			});
		});

		socket.on("CON_PORT_TURN_OFF", con => {
			store.dispatch({
				type: VIDEO_CONNECTION_TURN_OFF,
				con
			});
		});

		socket.on("CPU_PORT_TURN_OFF", (cpu) => {
			store.dispatch({
				type: KWM_CONNECTION_TURN_OFF,
				cpu
			});
		});

		socket.on("MATRIX_CONNECTION_STATE_CHANGED", (state, id, ip, port) => {
			store.dispatch({
				type: UPDATE_MATRIX_CONNECTION_STATE,
				connectionState: state,
				matrixId: id
			});
		});

		socket.on(NEW_VIDEO_CONNECTIONS, (videoConnections) => {
			store.dispatch({
				type: NEW_VIDEO_CONNECTIONS,
				videoConnections,
			});
		});

		socket.on(NEW_KWM_CONNECTIONS, (kwmConnections) => {
			store.dispatch({
				type: NEW_KWM_CONNECTIONS,
				kwmConnections
			});
		});
		
		return next => action => {
			switch (action.type) {
				case SET_VIDEO_CONNECTION:
					socket.emit(SET_VIDEO_CONNECTION, {
						con: action.con,
						cpu: action.cpu
					})
					break;
				case SET_KWM_CONNECTION:
					socket.emit(SET_KWM_CONNECTION, {
						con: action.con,
						cpu: action.cpu
					})
					break;
				case TURN_OFF_VIDEO_CONNECTION:
					socket.emit(TURN_OFF_VIDEO_CONNECTION, action.con);
					break;
				case TURN_OFF_KWM_CONNECTION:
					socket.emit(TURN_OFF_KWM_CONNECTION, action.cpu);
					break;
				case "REQUEST_ALL_STATES":
					socket.emit("REQUEST_ALL_STATES", action.matrixId);
					break;
			}
			next(action);
		}
	}
}
