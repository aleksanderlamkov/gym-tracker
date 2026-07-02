import { useEffect, useRef, useState, type ReactNode } from 'react';

let lockCount = 0;
function lockScroll(on: boolean) {
  lockCount = Math.max(0, lockCount + (on ? 1 : -1));
  document.documentElement.style.overflow = lockCount > 0 ? 'hidden' : '';
}

// стек открытых шторок: Escape закрывает только верхнюю
let sheetSeq = 0;
const sheetStack: number[] = [];

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

/** Нижняя шторка с анимацией и свайпом вниз за «ручку» */
export function Sheet({ open, onClose, children }: SheetProps) {
  const [render, setRender] = useState(open);
  const [shown, setShown] = useState(false);
  const [dy, setDy] = useState(0);
  const drag = useRef<{ startY: number; active: boolean }>({ startY: 0, active: false });
  const stackId = useRef(0);

  useEffect(() => {
    if (open) {
      setRender(true);
      const raf = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      lockScroll(true);
      return () => {
        cancelAnimationFrame(raf);
        lockScroll(false);
      };
    }
    if (render) {
      setShown(false);
      setDy(0);
      const t = setTimeout(() => setRender(false), 260);
      return () => clearTimeout(t);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    const myId = ++sheetSeq;
    stackId.current = myId;
    sheetStack.push(myId);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sheetStack[sheetStack.length - 1] === myId) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      const i = sheetStack.indexOf(myId);
      if (i >= 0) sheetStack.splice(i, 1);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!render) return null;

  return (
    <div
      className={'sheet-overlay' + (shown ? ' shown' : '')}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={'sheet' + (dy > 0 ? ' dragging' : '')}
        style={dy > 0 ? { transform: `translateY(${dy}px)` } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="sheet-grab"
          onPointerDown={(e) => {
            drag.current = { startY: e.clientY, active: true };
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!drag.current.active) return;
            setDy(Math.max(0, e.clientY - drag.current.startY));
          }}
          onPointerUp={() => {
            if (!drag.current.active) return;
            drag.current.active = false;
            if (dy > 110) onClose();
            setDy(0);
          }}
          onPointerCancel={() => {
            drag.current.active = false;
            setDy(0);
          }}
        >
          <div className="sheet-handle" />
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}
