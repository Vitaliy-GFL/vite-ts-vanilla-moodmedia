import './styles/index.scss';
import Debugger from './services/Debugger';
import { Component, getElement, getMFparam } from './utils';

// remove this listener if you are planning to use viewport dimensions
((docElement) => {
  window.addEventListener('resize', () => {
    const appContainer = getElement<HTMLDivElement>('.app-container');
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
  const appContainer = getElement<HTMLDivElement>('#app');
  const components = await window.Loader.getComponents<Component[]>();
  const getParam = <T>(name: string, param: string) => getMFparam<T>(components as Component[], name, param);

  // to wait for template start (autoPlay is true or player issues play command)
  window.Loader.isStarted().then(() => {
    console.log('COMPONENTS:', components);
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
  getElement<HTMLImageElement>('#preview')?.remove();
});
