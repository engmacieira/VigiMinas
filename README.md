# VigiMinas - Vigilância Sanitária Municipal (Braúnas / MG)

Aplicação React + TypeScript + Vite com suporte ao Bun para gerenciamento do Programa VigiMinas (SES/MG), apuração dos 5 Indicadores Oficiais de Vigilância Sanitária e Saúde do Trabalhador (VAPT), e gerenciamento fiscalizador.

---

## 🧪 Suíte de Testes da Infraestrutura

A infraestrutura de testes foi configurada utilizando **Vitest**, **React Testing Library**, **@testing-library/jest-dom**, **@testing-library/user-event** e **jsdom**.

### Executando as Suítes de Testes

| Comando | Descrição |
| :--- | :--- |
| `bun run test` | Executa todos os testes (unitários, integração e estresse) em execução única. |
| `bun run test:watch` | Inicia os testes no modo observador (watch mode). |
| `bun run test:coverage` | Gera o relatório completo de cobertura de testes. |
| `bun run test:integration` | Executa exclusivamente os testes de integração dos fluxos do sistema. |
| `bun run test:stress` | Executa a suíte dedicada de testes de estresse, carga e concorrência. |

---

## 📁 Estrutura das Suítes de Testes

```
tests/
├── unit/                         # Testes Unitários
│   ├── components/               # Testes de Componentes React (EstabelecimentoModal, RegistrarInspecaoModal, ImportarPlanilhaModal, ExportarEstabelecimentosModal, DashboardMetas)
│   ├── contexts/                 # Testes do VigiMinasContext
│   ├── hooks/                    # Testes do hook useFirestoreWithAudit
│   ├── lib/                      # Testes do middleware firestoreAuditMiddleware
│   └── services/                 # Testes de regras de negócio, utilitários e calculadoras
├── integration/                  # Testes de Integração
│   ├── flow1_estabelecimento_lifecycle.test.tsx  # Ciclo de vida completo (Criação -> Edição -> Log Auditado)
│   ├── flow2_inspecao_sanitaria.test.tsx         # Vistoria sanitária -> Atualização de alvará e calendário
│   ├── flow3_importacao_lote.test.tsx            # Upload de planilha -> Processamento -> Listagem atualizada
│   └── flow4_firestore_rules.test.ts             # Validação das Regras de Segurança (firestore.rules)
└── stress/                       # Testes de Estresse e Carga
    ├── render_performance.test.tsx               # Renderização de 1.000+ registros na UI
    ├── concurrency_audit.test.ts                 # Concorrência com 500+ mutações simultâneas de auditoria
    └── spreadsheet_processing.test.ts            # Importação e leitura de arquivos .xlsx de grande porte
```

---

## 🔒 Regras de Negócio e Cobertura Mapeadas

1. **Calculadora dos 5 Indicadores VigiMinas (SES/MG)**:
   - Indicador 11: Inspeções em Ambientes/Processos de Trabalho (VAPT - Saúde do Trabalhador).
   - Indicador 12: Cadastro Geral de Estabelecimentos do Município.
   - Indicador 13: Risco I (Baixo Risco) - Meta pactuada $\ge 15\%$.
   - Indicador 14: Risco II (Médio Risco) - Meta pactuada $\ge 90\%$.
   - Indicador 15: Risco III (Alto Risco) - Meta de $100\%$.

2. **Garantia de Mocks Externos**:
   - Todas as chamadas do Firebase/Firestore são mockadas com fixtures internas para garantir isolamento e execução offline rápida.
