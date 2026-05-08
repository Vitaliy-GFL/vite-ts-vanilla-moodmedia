import { useRef, useEffect, useState, type ReactNode } from "react";

import "./AspectRatioContainer.scss";

interface AspectRatioContainerProps {
  ratio: number; // width / height, e.g. 16/9
  children: ReactNode;
  className?: string;
}

export default function AspectRatioContainer({ ratio, children, className }: AspectRatioContainerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const update = () => {
      const { clientWidth: w, clientHeight: h } = wrapper;
      if (w / h > ratio) {
        setStyle({ width: h * ratio, height: h });
      } else {
        setStyle({ width: w, height: w / ratio });
      }
    };

    const ro = new ResizeObserver(update);
    ro.observe(wrapper);
    update();

    return () => ro.disconnect();
  }, [ratio]);

  return (
    <div ref={wrapperRef} className={`aspect-wrapper ${className ?? ""}`}>
      <div
        className="aspect-content"
        style={
          {
            width: style.width,
            height: style.height,
            "--aspect-w": `${style.width}px`,
            "--aspect-h": `${style.height}px`,
          } as React.CSSProperties
        }
      >
        {children}
      </div>
    </div>
  );
}
