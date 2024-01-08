export interface TemplateI {
	getComponents: <T>() => Promise<T | null>;
	isStarted: () => Promise<void>;
	error: (message: string) => void;
	ready: () => void;
	finished: () => void;
	getDuration: () => number;
	getPlayerParameters: (params: string[]) => Promise<(string | null)[]>;
}
