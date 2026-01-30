import 'mtemplate-loader/release/js/es6-shim.min.js';
import 'mtemplate-loader/release/js/template-loader.js';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@/styles/index.scss';
import App from './App.tsx';
import ConsoleInterceptor from './services/ConsoleInterceptor';
import { Component, getElement } from './utils/index.ts';

// Intercept console methods early to capture all logs
ConsoleInterceptor.intercept();

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

(async () => {
  // eslint-disable-next-line no-async-promise-executor
  const components = await new Promise<Component[] | null>(async (resolve) => {
    let result: null | Component[] = null;

    setTimeout(() => {
      resolve(result);
    }, 1500);

    result = await window.Loader.getComponents<Component[]>();
    resolve(result);
  });

  console.log('COMPONENTS:', components);

  if (!components) {
    createRoot(getElement('.app-container')!).render(
      <StrictMode>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h1>
            <i>mframe.json</i> is corrupted.
          </h1>
          <h2>Please check if the file exists and has the correct syntax.</h2>
        </div>
      </StrictMode>
    );
    throw Error('mframe.json corrupted');
  }

  createRoot(getElement('.app-container')!).render(
    <StrictMode>
      <App components={components} />
    </StrictMode>
  );
})();
