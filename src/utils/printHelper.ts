/**
 * Utilitário de Impressão Segura (Safe Print) para o Sistema VigiMinas
 * Suporte a:
 * 1. Elementos específicos de documento (Aviso de Vistoria, Termo VAPT, etc.)
 * 2. Relatórios executivos de página inteira
 * 3. Ambientes em iframe / sandbox (como o Google AI Studio Preview)
 * 4. Fallback confiável para window.print() sem quebra de dados
 */

export const safePrint = (targetElementId?: string): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    // 1. Identificar se há um elemento de impressão específico
    const elementId = targetElementId || 
      (document.getElementById('aviso-vistoria-print') ? 'aviso-vistoria-print' : 
      (document.getElementById('termo-oficial-print') ? 'termo-oficial-print' : null));

    const targetEl = elementId ? document.getElementById(elementId) : null;

    if (targetEl) {
      // Coleta todos os estilos CSS carregados (Tailwind, fontes institucionais, etc.)
      const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
        .map(el => el.outerHTML)
        .join('\n');

      // Tenta abrir janela/aba limpa com o documento formatado e dados completos
      try {
        const printWindow = window.open('', '_blank', 'width=950,height=850');
        if (printWindow && printWindow.document) {
          printWindow.document.open();
          printWindow.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>VigiMinas - Impressão Oficial</title>
    ${styles}
    <style>
      @page {
        size: A4 portrait;
        margin: 8mm 10mm;
      }
      html, body {
        background: white !important;
        color: #0f172a !important;
        margin: 0 !important;
        padding: 0 !important;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .print\\:hidden, button, select, input {
        display: none !important;
      }
      #${elementId} {
        width: 100% !important;
        max-width: 100% !important;
        padding: 6mm 10mm !important;
        box-shadow: none !important;
        border: none !important;
        background: white !important;
        color: #0f172a !important;
      }
    </style>
  </head>
  <body>
    ${targetEl.outerHTML}
    <script>
      window.onload = function() {
        setTimeout(function() {
          window.focus();
          window.print();
        }, 300);
      };
    </script>
  </body>
</html>`);
          printWindow.document.close();
          return;
        }
      } catch (popupErr) {
        console.warn('[VigiMinas Print] Fallback para impressão direta na janela ativa:', popupErr);
      }
    } else {
      // Impressão de relatório de tela cheia (ex: /relatorios/indicador-14)
      const isInIframe = window.self !== window.top;
      if (isInIframe) {
        try {
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
    }

    // Execução direta padrão no documento
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
