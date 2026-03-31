export function openDevTools(): void {
  try {
    window.Player.openDevTools();
  } catch (error) {
    console.log("openDevTools: " + error);
  }
}
