import { createRoot } from "react-dom/client";
import { Buffer } from "buffer";
import App from "./App.tsx";
import "./index.css";

if (typeof window !== "undefined") {
	window.Buffer = Buffer;
	// @ts-expect-error - global is needed for some packages
	window.global = window;
	
	if (!window.Buffer) {
		console.error('Failed to load Buffer polyfill')
	} else {
		console.log('Buffer polyfill loaded successfully')
	}
}

const rootElement = document.getElementById("root");

if (!rootElement) {
	throw new Error("Root element not found. Make sure there's a <div id='root'></div> in your HTML.");
}

try {
	createRoot(rootElement).render(<App />);
} catch (error) {
	console.error('Failed to render app:', error);
	rootElement.innerHTML = `
		<div style="padding: 20px; font-family: sans-serif;">
			<h1>Application Error</h1>
			<p>Failed to load the application. Please check the console for details.</p>
			<pre>${error instanceof Error ? error.message : String(error)}</pre>
		</div>
	`;
}
