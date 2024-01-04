import type Loader from "./Loader";
declare global {
	interface Window {
		Loader: Loader;
	}
}
