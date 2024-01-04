interface Loader {
	getComponents: () => Promise<unknown>;
	ready: () => Promise<void>;
	isStarted: () => Promise<void>;
}

export default Loader;
