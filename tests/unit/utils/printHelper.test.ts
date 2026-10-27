import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { safePrint } from '../../../src/utils/printHelper';

describe('printHelper (safePrint)', () => {
  let originalPrint: () => void;
  let originalOpen: typeof window.open;

  beforeEach(() => {
    originalPrint = window.print;
    originalOpen = window.open;
  });

  afterEach(() => {
    window.print = originalPrint;
    window.open = originalOpen;
    vi.restoreAllMocks();
  });

  it('chama window.print diretamente quando não estiver em iframe', () => {
    const printSpy = vi.fn();
    window.print = printSpy;

    safePrint();

    expect(printSpy).toHaveBeenCalled();
  });

  it('tenta abrir nova aba com window.open quando em iframe', () => {
    // Simula ambiente de iframe: window.self !== window.top
    const mockWin = {
      addEventListener: vi.fn((event, callback) => {
        if (event === 'load') callback();
      }),
      print: vi.fn(),
    };

    const openSpy = vi.fn().mockReturnValue(mockWin);
    window.open = openSpy;

    // Redefine temporariamente window.top para ser diferente de window.self
    const originalTop = window.top;
    try {
      Object.defineProperty(window, 'top', {
        value: {},
        configurable: true,
      });

      safePrint();

      expect(openSpy).toHaveBeenCalledWith(window.location.href, '_blank');
      expect(mockWin.addEventListener).toHaveBeenCalledWith('load', expect.any(Function));
      expect(mockWin.print).toHaveBeenCalled();
    } finally {
      Object.defineProperty(window, 'top', {
        value: originalTop,
        configurable: true,
      });
    }
  });

  it('faz fallback para window.print se window.open falhar ou for bloqueado por sandbox', () => {
    const printSpy = vi.fn();
    window.print = printSpy;
    window.open = vi.fn().mockImplementation(() => {
      throw new Error('Blocked by sandbox');
    });

    const originalTop = window.top;
    try {
      Object.defineProperty(window, 'top', {
        value: {},
        configurable: true,
      });

      safePrint();

      expect(printSpy).toHaveBeenCalled();
    } finally {
      Object.defineProperty(window, 'top', {
        value: originalTop,
        configurable: true,
      });
    }
  });

  it('imprime elemento específico quando targetElementId é fornecido ou existe no DOM', () => {
    const div = document.createElement('div');
    div.id = 'aviso-vistoria-print';
    div.innerHTML = '<h1>Aviso de Vistoria Oficial</h1>';
    document.body.appendChild(div);

    const mockDoc = {
      open: vi.fn(),
      write: vi.fn(),
      close: vi.fn(),
    };
    const mockWin = {
      document: mockDoc,
      focus: vi.fn(),
      print: vi.fn(),
    };
    window.open = vi.fn().mockReturnValue(mockWin);

    safePrint('aviso-vistoria-print');

    expect(window.open).toHaveBeenCalledWith('', '_blank', 'width=950,height=850');
    expect(mockDoc.write).toHaveBeenCalledWith(expect.stringContaining('Aviso de Vistoria Oficial'));
    expect(mockDoc.close).toHaveBeenCalled();

    document.body.removeChild(div);
  });

  it('não lança erro não tratado se window.print disparar exceção', () => {
    window.print = vi.fn().mockImplementation(() => {
      throw new Error('Print error');
    });

    expect(() => safePrint()).not.toThrow();
  });
});
