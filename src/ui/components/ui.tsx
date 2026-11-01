// Small building blocks on top of the design system's .ds-* classes.
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

type BtnProps = {
  children?: ReactNode;
  icon?: IconName;
  trail?: IconName;
  variant?: 'default' | 'primary' | 'quiet' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
  label?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
};

export function Button({ children, icon, trail, variant = 'default', size = 'md', block, label, type = 'button', disabled, onClick, className }: BtnProps) {
  const cls = [
    'ds-button',
    variant === 'primary' && 'ds-button--primary',
    variant === 'quiet' && 'ds-button--quiet',
    variant === 'danger' && 'ds-button--primary pf-danger',
    size === 'sm' && 'ds-button--small',
    size === 'lg' && 'pf-button--large',
    !children && 'ds-button--icon',
    block && 'pf-block',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled} aria-label={label} title={!children ? label : undefined}>
      {icon && <Icon name={icon} size={size === 'sm' ? 15 : 17} />}
      {children}
      {trail && <Icon name={trail} size={15} />}
    </button>
  );
}

export function Tag({ children, kind = 'default', icon }: { children: ReactNode; kind?: 'default' | 'accent' | 'ok' | 'warn' | 'err'; icon?: IconName }) {
  return (
    <span className={`ds-tag pf-tag--${kind}`}>
      {icon && <Icon name={icon} size={12} />}
      {children}
    </span>
  );
}

export function Notice({ children, kind, icon, title }: { children: ReactNode; kind?: 'ok' | 'warn' | 'err'; icon?: IconName; title?: string }) {
  return (
    <div className={`ds-notice pf-notice ${kind ? `ds-notice--${kind}` : ''}`} role={kind === 'err' ? 'alert' : undefined}>
      {icon && <Icon name={icon} size={17} className={`pf-notice__icon pf-text--${kind ?? 'soft'}`} />}
      <div>
        {title && <strong className="pf-notice__title">{title}</strong>}
        {children}
      </div>
    </div>
  );
}

export function Overline({ children, accent }: { children: ReactNode; accent?: boolean }) {
  return <p className={`ds-overline pf-overline ${accent ? 'ds-accent' : ''}`}>{children}</p>;
}

export function Segmented<T extends string | number>({ options, value, onChange, label, equal }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; label: string; equal?: boolean }) {
  return (
    <div className={`pf-segmented ${equal ? 'pf-segmented--equal' : ''}`} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={String(o.value)} type="button" role="radio" aria-checked={o.value === value} className="pf-segment" onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Chip({ on, onClick, children, role = 'checkbox' }: { on: boolean; onClick: () => void; children: ReactNode; role?: 'checkbox' | 'radio' }) {
  return (
    <button type="button" role={role} aria-checked={on} className="pf-chip" onClick={onClick}>
      {on && <Icon name="check" size={14} />}
      {children}
    </button>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} className="pf-toggle" onClick={() => onChange(!on)} />;
}

export function Stepper({ value, min, max, onChange, label }: { value: number; min: number; max: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="pf-stepper" role="group" aria-label={label}>
      <button type="button" aria-label="Fewer" disabled={value <= min} onClick={() => onChange(value - 1)}>
        <Icon name="minus" size={16} />
      </button>
      <output aria-live="polite">{value}</output>
      <button type="button" aria-label="More" disabled={value >= max} onClick={() => onChange(value + 1)}>
        <Icon name="plus" size={16} />
      </button>
    </div>
  );
}

export function Check({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="ds-check pf-check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{children}</span>
    </label>
  );
}

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: (id: string, describedBy?: string) => ReactNode }) {
  const id = useId();
  const hintId = hint || error ? id + '-hint' : undefined;
  return (
    <div className="ds-field">
      <label className="ds-label" htmlFor={id}>
        {label}
      </label>
      {children(id, hintId)}
      {(error || hint) && (
        <p id={hintId} className={`ds-hint ${error ? 'pf-text--err' : ''}`}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

export function Bar({ value, tone = 'accent' }: { value: number; tone?: 'accent' | 'warn' }) {
  return (
    <div className="pf-bar" aria-hidden="true">
      <span className={`pf-bar__value pf-bar__value--${tone}`} style={{ width: `${Math.max(1, Math.min(100, value * 100))}%` }} />
    </div>
  );
}

// ---- dialog / bottom sheet --------------------------------------------------------------

export function Sheet({ open, onClose, title, overline, children, actions, wide }: { open: boolean; onClose: () => void; title: string; overline?: string; children: ReactNode; actions?: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={`ds-dialog pf-sheet ${wide ? 'pf-sheet--wide' : ''}`}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby="sheet-title"
    >
      {open && (
        <div className="pf-sheet__inner">
          <span className="pf-sheet__handle" aria-hidden="true" />
          <header className="pf-sheet__head">
            <div>
              {overline && <Overline>{overline}</Overline>}
              <h2 id="sheet-title" className="pf-sheet__title">
                {title}
              </h2>
            </div>
            <Button variant="quiet" icon="x" label="Close" onClick={onClose} />
          </header>
          <div className="pf-sheet__body">{children}</div>
          {actions && <div className="pf-sheet__actions">{actions}</div>}
        </div>
      )}
    </dialog>
  );
}

export function Confirm({ open, title, children, confirmLabel, danger, onConfirm, onCancel, extra }: { open: boolean; title: string; children: ReactNode; confirmLabel: string; danger?: boolean; onConfirm: () => void; onCancel: () => void; extra?: ReactNode }) {
  return (
    <Sheet
      open={open}
      onClose={onCancel}
      title={title}
      actions={
        <>
          {extra}
          <Button variant="quiet" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Sheet>
  );
}

// ---- toasts (live region, NFR-A11Y-1) ---------------------------------------------------

const ToastCtx = createContext<(msg: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const show = useCallback((m: string) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 2600);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className="pf-toast-region" aria-live="polite" role="status">
        {msg && (
          <div className="pf-toast">
            <Icon name="check" size={16} />
            {msg}
          </div>
        )}
      </div>
    </ToastCtx.Provider>
  );
}
