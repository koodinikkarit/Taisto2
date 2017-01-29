
import {
	SET_VIDEO_CONNECTION,
	SET_KWM_CONNECTION,
	TURN_OFF_VIDEO_CONNECTION,
	TURN_OFF_KWM_CONNECTION
} from "../constants/actionconstants"

export const setVideoConnection = (con, cpu) => {
	return {
		type: SET_VIDEO_CONNECTION,
		con,
		cpu
	}	
}

export const turnOffVideoConnection = (con, cpu) => {
	return {
		type: TURN_OFF_VIDEO_CONNECTION,
		con,
		cpu
	}
}

export const setKwmConnection = (con, cpu) => {
	return {
		type: SET_KWM_CONNECTION,
		con,
		cpu
	}
}

export const turnOffKwmConnection = (con, cpu) => {
	return {
		type: TURN_OFF_KWM_CONNECTION,
		con,
		cpu
	}
}