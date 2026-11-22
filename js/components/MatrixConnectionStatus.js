import React from "react";
import { MATRIX_CONNECTION } from "../constants/matrix";

export default function MatrixConnectionStatus({ code, t }) {
	switch (code) {
		case MATRIX_CONNECTION.ADDRESS_NOT_FOUND:
			return <span style={{ color: "red" }}>{t("invalidAddress")}</span>;
		case MATRIX_CONNECTION.CONNECTED:
			return <span style={{ color: "green" }}>{t("connected")}</span>;
		case MATRIX_CONNECTION.DISCONNECTED:
			return <span style={{ color: "red" }}>{t("disconnected")}</span>;
		case MATRIX_CONNECTION.CONNECTING:
			return <span>{t("matrixConnectionConnecting")}</span>;
		default:
			return <span>{t("matrixConnectionUnknown")}</span>;
	}
}
