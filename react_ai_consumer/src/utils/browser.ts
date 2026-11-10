// The engine the template really runs on, e.g. "Chrome 74.0.3729.136". Taken from the user agent:
// on ELO players it differs from the WebView version shown in Android settings.
const match = navigator.userAgent.match(/Chrome\/([\d.]+)/);

export const BROWSER = match ? "Chrome " + match[1] : "Unknown browser";
