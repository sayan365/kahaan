import { useEffect, useId, useRef, cloneElement, isValidElement, type ReactElement, type ReactNode, type ButtonHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import type { Locale, PlaceType, Place } from './types';
import { text } from './i18n';
export function Button({ className = '', type = 'button', onClick, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) { return <button className={`button ${className}`} type={type} onClick={onClick} {...props} />; }
export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea className="resize-none" {...props} style={{ ...props.style, resize: 'none' }}/>; }
export function Field({ label, children, error }: { label: string; children: ReactNode; error?: string }) {
  const errorId = useId();
  const control = error && isValidElement(children) ? cloneElement(children as ReactElement<Record<string, unknown>>, { 'aria-describedby': errorId }) : children;
  return <label className="field"><span>{label}</span>{control}{error && <span id={errorId} className="field-error" role="alert">{error}</span>}</label>;
}
export function Dialog({ title, children, onClose, locale }: { title: string; children: ReactNode; onClose: () => void; locale: Locale }) {
  const ref = useRef<HTMLDialogElement>(null); const titleId = useId();
  useEffect(() => { const previous = document.activeElement as HTMLElement; const dialog = ref.current!; dialog.showModal(); return () => { dialog.close(); previous?.focus(); }; }, []);
  return <dialog ref={ref} aria-labelledby={titleId} onCancel={e => { e.preventDefault(); onClose(); }}><div className="dialog-head"><h2 id={titleId}>{title}</h2><Button className="icon-button" onClick={onClose} aria-label={text(locale, 'close')}>×</Button></div><div className="dialog-body">{children}</div></dialog>;
}
export function Icon({ type, size = 28 }: { type: PlaceType | 'pin' | 'search' | 'arrow'; size?: number }) {
  const paths = {
    toilet: <><circle cx="9" cy="5" r="2"/><path d="M6 20v-6H4l3-6h4l3 6h-2v6M18 4v16"/></>,
    dustbin: <><path d="M5 7h14M9 4h6M7 7l1 13h8l1-13M10 10v7M14 10v7"/></>,
    ewaste: <><rect x="5" y="3" width="14" height="13" rx="2"/><path d="M9 20h6M12 16v4M13 6l-3 4h4l-3 4"/></>,
    recycling: <><path d="m7 7 3.3-4.7a2 2 0 0 1 3.4 0L17 8m-5-1 5 1 1-5"/><path d="m19 12 2.5 4.5A2 2 0 0 1 19.8 19H13m3-3-3 3 3 3"/><path d="M9 19H4.2a2 2 0 0 1-1.7-3L6 10m-5 1 5-1 1 5"/></>,
    pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0114 0Z"/><circle cx="12" cy="10" r="2"/></>,
    search: <><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></>,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6"/>
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[type]}</svg>;
}
export function Status({ place, locale }: { place: Place; locale: Locale }) { return <span className={`status status-${place.status}`}><span aria-hidden="true">{place.status === 'verified' ? '✓' : place.status === 'reported' ? '!' : '○'}</span> {text(locale, place.status)}</span>; }
