import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { VigiMinasProvider } from './contexts/VigiMinasContext';
import { AppLayout } from './layouts/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { FilaMetasPage } from './pages/FilaMetasPage';
import { EstabelecimentosPage } from './pages/EstabelecimentosPage';
import { SaudeTrabalhadorPage } from './pages/SaudeTrabalhadorPage';
import { RelatorioOficialPage } from './pages/RelatorioOficialPage';
import { LogsAuditoriaPage } from './pages/LogsAuditoriaPage';
import { ConfiguracoesPage } from './pages/ConfiguracoesPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <VigiMinasProvider>
          <Routes>
            {/* Rota Pública de Login */}
            <Route path="/login" element={<LoginPage />} />

            {/* Rotas Protegidas por Autenticação */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/metas" element={<FilaMetasPage />} />
                <Route path="/estabelecimentos" element={<EstabelecimentosPage />} />
                <Route path="/saude-trabalhador" element={<SaudeTrabalhadorPage />} />
                <Route path="/relatorio-oficial" element={<RelatorioOficialPage />} />
                <Route path="/logs-auditoria" element={<LogsAuditoriaPage />} />
                <Route path="/configuracoes" element={<ConfiguracoesPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Route>
          </Routes>
        </VigiMinasProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
