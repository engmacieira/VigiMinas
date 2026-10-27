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
import { RelatoriosPage } from './pages/RelatoriosPage';
import { RelatorioIndicador11Page } from './pages/RelatorioIndicador11Page';
import { RelatorioIndicador12Page } from './pages/RelatorioIndicador12Page';
import { RelatorioIndicador13Page } from './pages/RelatorioIndicador13Page';
import { RelatorioIndicador14Page } from './pages/RelatorioIndicador14Page';
import { RelatorioIndicador15Page } from './pages/RelatorioIndicador15Page';
import { RelatorioEmpresasConsolidadasPage } from './pages/RelatorioEmpresasConsolidadasPage';
import { FichaIndividualEmpresaPage } from './pages/FichaIndividualEmpresaPage';
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
                <Route path="/relatorios" element={<RelatoriosPage />} />
                <Route path="/relatorios/indicador-11" element={<RelatorioIndicador11Page />} />
                <Route path="/relatorios/indicador-12" element={<RelatorioIndicador12Page />} />
                <Route path="/relatorios/indicador-13" element={<RelatorioIndicador13Page />} />
                <Route path="/relatorios/indicador-14" element={<RelatorioIndicador14Page />} />
                <Route path="/relatorios/indicador-15" element={<RelatorioIndicador15Page />} />
                <Route path="/relatorios/empresas-consolidadas" element={<RelatorioEmpresasConsolidadasPage />} />
                <Route path="/relatorios/ficha-empresa" element={<FichaIndividualEmpresaPage />} />
                <Route path="/relatorios/ficha-empresa/:id" element={<FichaIndividualEmpresaPage />} />
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
