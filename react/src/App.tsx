import { useCallback } from 'react';
import { createPortal } from 'react-dom';

import { Component, getMFparam } from './utils';
import MframeContexts from './context/mfarme';
import Debugger from './components/Debugger';

type AppProps = {
  components: Component[];
};

function App({ components }: AppProps) {
  const getParam = useCallback(
    <T,>(component: string, param: string) => {
      return getMFparam<T>(components, component, param);
    },
    [components]
  );

  return (
    <MframeContexts.Provider value={getParam}>
      <div className="app-content">
        {createPortal(<Debugger />, document.querySelector<HTMLDivElement>('#debugger') as HTMLDivElement)}
        {/* ADD COMPONENT(S) HERE */}
        <pre> {JSON.stringify(components, null, '  ')} </pre>
      </div>
    </MframeContexts.Provider>
  );
}

export default App;
