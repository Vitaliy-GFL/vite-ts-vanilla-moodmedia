import { createContext, useCallback } from 'react';
import { Component, getMFparam } from './utils';
import Debugger from './components/Debugger';
import { createPortal } from 'react-dom';

type AppProps = {
  components: Component[];
};

export const MframeContexts = createContext<(<T>(a: string, b: string) => ReturnType<typeof getMFparam<T>>) | null>(null);

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
        {/* ADD COMPONENT(S) HERE */}
        <pre> {JSON.stringify(components, null, '  ')} </pre>
        {createPortal(<Debugger />, document.querySelector<HTMLDivElement>('#debugger') as HTMLDivElement)}
      </div>
    </MframeContexts.Provider>
  );
}

export default App;
