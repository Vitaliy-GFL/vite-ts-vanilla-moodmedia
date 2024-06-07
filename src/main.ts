import './styles/index.scss';
import Debugger from './services/Debugger';
import { getMFparam } from './utils';

// remove this listener if you are planning to use viewport dimensions
((docElement) => {
  window.addEventListener('resize', () => {
    const appContainer = getElement('.app-container');
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    const portraitAspectRatio = windowHeight / windowWidth;
    const landscapeAspectRatio = windowWidth / windowHeight;

    if (appContainer?.classList.contains('portrait')) {
      const isOversize = portraitAspectRatio > 16 / 9;
      appContainer.classList.toggle('reverse', isOversize);
    }

    if (appContainer?.classList.contains('landscape')) {
      const isOversize = landscapeAspectRatio > 16 / 9;
      appContainer.classList.toggle('reverse', isOversize);
    }

    setTimeout(() => {
      const { height = 0, width = 0 } = appContainer?.getBoundingClientRect() || {};
      docElement.style.setProperty('--container-height', `${height}px`);
      docElement.style.setProperty('--container-width', `${width}px`);
    }, 0);
  });

  window.dispatchEvent(new Event('resize'));
})(document.documentElement);

window.addEventListener('load', async () => {
  const appContainer = getElement('#app');
  const components = await window.Loader.getComponents();
  const getParam = <T>(name: string, param: string) => getMFparam<T>(components, name, param);

  // to wait for template start (autoPlay is true or player issues play command)
  window.Loader.isStarted().then(() => {
    console.log(components);
    if (getParam<boolean>('debug', 'enabled')) {
      new Debugger();
    }

    if (!appContainer) return;

    const preElt = document.createElement('pre');
    appContainer.appendChild(preElt);
    preElt.textContent = JSON.stringify(components, null, '  ');
  });

  // to notify player that the template is ready
  window.Loader.ready();
  getElement('#preview')?.remove();
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getElement(selector: string, context: HTMLElement | Document = document) {
  return context.querySelector(selector);
}
