window.addEventListener("load", async () => {
	console.log("WINDOW LOADED");
	const appContainer = getElement("#app");
	const components = await window.Loader.getComponents();

	// to wait for template start (autoPlay is true or player issues play command)
	window.Loader.isStarted().then(() => {
		console.log(components);

		if (!appContainer) return;

		const preElt = document.createElement("pre");
		appContainer.appendChild(preElt);
		preElt.textContent = JSON.stringify(components, null, "  ");
	});

	// to notify player that the template is ready
	window.Loader.ready();
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getElement(selector: string, context: HTMLElement | Document = document) {
	return context.querySelector(selector);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getElements(selector: string, context: HTMLElement | Document = document) {
	return context.querySelectorAll(selector);
}
