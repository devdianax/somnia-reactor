import { Buffer } from "buffer";

if (typeof window !== "undefined") {
	// @ts-expect-error - polyfill
	window.Buffer = Buffer;
	// @ts-expect-error - polyfill
	window.global = window;
}
