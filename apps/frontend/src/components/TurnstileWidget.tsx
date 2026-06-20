import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";

export interface TurnstileHandle {
  reset: () => void;
}

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
}

export const TurnstileWidget = forwardRef<TurnstileHandle, TurnstileWidgetProps>(
  function TurnstileWidget({ onVerify }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);

    const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
        }
      },
    }));

    useEffect(() => {
      if (!siteKey || !containerRef.current) return;

      function render() {
        if (!window.turnstile || !containerRef.current) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: onVerify,
          theme: "light",
        });
      }

      if (window.turnstile) {
        render();
      } else {
        const interval = setInterval(() => {
          if (window.turnstile) {
            clearInterval(interval);
            render();
          }
        }, 200);
        return () => clearInterval(interval);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!siteKey) {
      // Sem chave configurada (ex.: ambiente de dev sem Turnstile ainda) —
      // não bloqueia o formulário, só não exibe o widget.
      return null;
    }

    return <div ref={containerRef} className="my-1" />;
  }
);
