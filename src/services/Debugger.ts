export default class Debugger {
  private container: HTMLDivElement | null = null;
  private logsContent: HTMLDivElement | null = null;
  private collapsed: boolean = false;
  private logger = { ...console };

  constructor() {
    this.container = document.querySelector('#debugger');

    if (!this.container) return;
    this.rewriteConsole();
    this.logsContent = this.container.querySelector('.content');
    console.log('debugger enabled');
    this.bindEvents();
    this.container.classList.remove('hidden');
  }

  bindEvents() {
    let moveInProgress = false;
    const moseCoords = { X: 0, Y: 0 };
    const windowCoords = { X: 0, Y: 0 };

    this.container?.querySelector('.header')?.addEventListener('touchstart', (e) => {
      const { left = 0, top = 0 } = (e.target as HTMLDivElement).parentElement?.getBoundingClientRect() || {};

      moveInProgress = true;
      moseCoords.X = (e as TouchEvent).touches[0].clientX;
      moseCoords.Y = (e as TouchEvent).touches[0].clientY;
      windowCoords.X = left;
      windowCoords.Y = top;
    });

    this.container?.querySelector('.header')?.addEventListener('mousedown', (e) => {
      const { left = 0, top = 0 } = (e.target as HTMLDivElement).parentElement?.getBoundingClientRect() || {};

      moveInProgress = true;
      moseCoords.X = (e as MouseEvent).clientX;
      moseCoords.Y = (e as MouseEvent).clientY;
      windowCoords.X = left;
      windowCoords.Y = top;
    });

    this.container?.querySelector('.header')?.addEventListener('touchend', () => {
      moveInProgress = false;
    });

    this.container?.querySelector('.header')?.addEventListener('mouseup', () => {
      moveInProgress = false;
    });

    this.container?.querySelector('.header')?.addEventListener('touchmove', (e) => {
      if (!moveInProgress || !this.container) return;
      e.stopPropagation();

      const X = (e as TouchEvent).touches[0].clientX;
      const Y = (e as TouchEvent).touches[0].clientY;

      const deltaX = X - moseCoords.X;
      const deltaY = Y - moseCoords.Y;

      windowCoords.X += deltaX;
      windowCoords.Y += deltaY;
      moseCoords.X = X;
      moseCoords.Y = Y;

      this.container.style.top = `${windowCoords.Y}px`;
      this.container.style.left = `${windowCoords.X}px`;
    });

    this.container?.querySelector('.header')?.addEventListener('mousemove', (e) => {
      if (!moveInProgress || !this.container) return;

      const X = (e as MouseEvent).clientX;
      const Y = (e as MouseEvent).clientY;

      const deltaX = X - moseCoords.X;
      const deltaY = Y - moseCoords.Y;

      windowCoords.X += deltaX;
      windowCoords.Y += deltaY;
      moseCoords.X = X;
      moseCoords.Y = Y;

      this.container.style.top = `${windowCoords.Y}px`;
      this.container.style.left = `${windowCoords.X}px`;
    });

    this.container?.querySelector('.header .up')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.collapsed = !this.collapsed;
      (e.target as HTMLDivElement)?.classList.toggle('down', this.collapsed);
      this.container?.classList.toggle('close');
    });
  }

  rewriteConsole() {
    console.log = (...data) => {
      data.forEach((info) => {
        const log = document.createElement('pre');
        log.textContent = JSON.stringify(info, null, '   ');
        this.logsContent?.appendChild(log);
        this.logger.log(info);
      });
    };
  }
}
