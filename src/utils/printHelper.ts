/**
 * Utilitário de Impressão Segura (Safe Print) para o Sistema VigiMinas
 * Suporte a ambientes de preview e iframes (como o Google AI Studio Sandbox),
 * evitando bloqueios de sandbox e vazamento de elementos de navegação.
 */

export const safePrint = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const isInIframe = window.self !== window.top;

    if (isInIframe) {
      try {
        // Tenta abrir uma nova janela/aba limpa e independente
        const win = window.open(window.location.href, '_blank');
        if (win) {
          win.addEventListener('load', () => {
            try {
              win.print();
            } catch (printErr) {
              console.warn('[VigiMinas Print] Erro ao disparar print na nova janela:', printErr);
            }
          });
          return;
        }
      } catch (openErr) {
        console.warn('[VigiMinas Print] window.open restrito por política de sandbox, acionando fallback direto:', openErr);
      }
    }

    // Execução direta padrão
    window.print();
  } catch (err) {
    console.error('[VigiMinas Print] Exceção ao executar impressão:', err);
    try {
      window.print();
    } catch {
      // Falha silenciosa defensiva
    }
  }
};

export default safePrint;
