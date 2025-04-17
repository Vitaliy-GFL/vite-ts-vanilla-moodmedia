import { FC, memo, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { MframeContexts } from '@/App';
import Logger from '@/components/Logger';

const WINDOW_MIN_HEIGHT = 80;
const WINDOW_MIN_WIDTH = 250;

const Debugger: FC = memo(() => {
  const getParam = useContext(MframeContexts);
  const modalRef = useRef<HTMLDivElement>(null);
  const [clear, setClear] = useState(0);

  const isOpen = useMemo(() => (getParam ? !!getParam<boolean>('debug', 'enabled') : false), [getParam]);

  useEffect(() => {
    if (modalRef.current === null) return;

    let grab = false;
    let resizeMode = false;
    const { innerHeight, innerWidth } = window;
    const coords = { xo: 0, yo: 0 };
    const resizeCoords = { xo: 0, yo: 0 };
    const grabElt = modalRef.current.firstElementChild as HTMLDivElement;
    const resizeElt = modalRef.current.lastElementChild as HTMLDivElement;

    document?.addEventListener('mouseup', () => {
      resizeMode = false;
      grab = false;
    });

    document?.addEventListener('touchend', () => {
      resizeMode = false;
      grab = false;
    });

    // drag logic
    grabElt?.addEventListener('mousedown', (e) => {
      grab = true;

      const { offsetX, offsetY } = e;

      coords.xo = offsetX;
      coords.yo = offsetY;
    });

    grabElt?.addEventListener('touchstart', (e) => {
      if (!modalRef.current) return;
      grab = true;

      const { clientX, clientY } = e.touches[0];
      const { top, left } = modalRef.current.getBoundingClientRect();

      coords.xo = clientX - left;
      coords.yo = clientY - top;
    });

    grabElt?.addEventListener('touchmove', (e) => {
      if (!grab || !modalRef.current) return;

      const { clientX, clientY } = e.touches[0];
      let top = clientY - coords.yo;
      let left = clientX - coords.xo;

      if (top > innerHeight - 50) top = innerHeight - 50;
      if (left > innerWidth - 50) left = innerWidth - 50;

      modalRef.current.style.top = `${top >= 0 ? top : 0}px`;
      modalRef.current.style.left = `${left >= 0 ? left : 0}px`;
    });

    document?.addEventListener('mousemove', (e) => {
      if (!grab || !modalRef.current) return;

      const { clientX, clientY } = e;
      let top = clientY - coords.yo;
      let left = clientX - coords.xo;

      if (top > innerHeight - 50) top = innerHeight - 50;
      if (left > innerWidth - 50) left = innerWidth - 50;

      modalRef.current.style.top = `${top >= 0 ? top : 0}px`;
      modalRef.current.style.left = `${left >= 0 ? left : 0}px`;
    });

    // resize logic
    resizeElt.addEventListener('mousedown', (e) => {
      if (!modalRef.current) return;

      const { clientX, clientY } = e;
      const { right, bottom } = modalRef.current.getBoundingClientRect();

      resizeCoords.xo = right - clientX;
      resizeCoords.yo = bottom - clientY;
      resizeMode = true;
    });

    resizeElt.addEventListener('touchstart', (e) => {
      if (!modalRef.current) return;

      const { right, bottom } = modalRef.current.getBoundingClientRect();
      const { clientX, clientY } = e.touches[0];

      resizeCoords.xo = right - clientX;
      resizeCoords.yo = bottom - clientY;
    });

    resizeElt.addEventListener('touchmove', (e) => {
      if (!modalRef.current) return;

      const { clientX, clientY } = e.touches[0];
      const { left, top } = modalRef.current.getBoundingClientRect();

      const width = clientX - left + resizeCoords.xo;
      const height = clientY - top + resizeCoords.yo;

      modalRef.current.style.width = Math.max(width, WINDOW_MIN_WIDTH) + 'px';
      modalRef.current.style.height = Math.max(height, WINDOW_MIN_HEIGHT) + 'px';
    });

    document?.addEventListener('mousemove', (e) => {
      if (!modalRef.current || !resizeMode) return;

      e.stopPropagation();

      const { clientX, clientY } = e;
      const { left, top } = modalRef.current.getBoundingClientRect();

      const width = clientX - left + resizeCoords.xo;
      const height = clientY - top + resizeCoords.yo;

      modalRef.current.style.width = Math.max(width, WINDOW_MIN_WIDTH) + 'px';
      modalRef.current.style.height = Math.max(height, WINDOW_MIN_HEIGHT) + 'px';
    });
  }, []);

  if (!isOpen) return null;

  return (
    <div ref={modalRef} className="debug-modal">
      <div className="drag-area">
      <div>v{__APP_VERSION__}</div>
        <div>Logs</div>
        <div
          className="clear"
          onClick={(e) => {
            e.stopPropagation();
            setClear((v) => v + 1);
          }}
        >
          Clear
        </div>
      </div>
      <div className="content-area">
        <Logger clear={clear} />
      </div>
      <div className="resize-area"></div>
    </div>
  );
});

export default Debugger;
