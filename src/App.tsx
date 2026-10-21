import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { VigiMinasProvider } from './contexts/VigiMinasContext';
import { AppLayout } from './layouts/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { EstabelecimentosPage } from './pages/EstabelecimentosPage';
import { SaudeTrabalhadorPage } from './pages/SaudeTrabalhadorPage';
import { RelatorioOficialPage } from './pages/RelatorioOficialPage';
import { LogsAuditoriaPage } from './pages/LogsAuditoriaPage';
import { ConfiguracoesPage } from './pages/ConfiguracoesPage';

export default function App() {
  return (
    <BrowserRouter>
      <VigiMinasProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/estabelecimentos" element={<EstabelecimentosPage />} />
            <Route path="/saude-trabalhador" element={<SaudeTrabalhadorPage />} />
            <Route path="/relatorio-oficial" element={<RelatorioOficialPage />} />
            <Route path="/logs-auditoria" element={<LogsAuditoriaPage />} />
            <Route path="/configuracoes" element={<ConfiguracoesPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </VigiMinasProvider>
    </BrowserRouter>
  );
}
