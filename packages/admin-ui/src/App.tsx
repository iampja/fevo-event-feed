import { Routes, Route, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import { AuthProvider } from '@/auth/AuthContext';
import { ProtectedRoute } from '@/auth/ProtectedRoute';
import { Sidebar } from '@/components/layout/Sidebar';
import { LoginPage } from '@/pages/LoginPage';
import { KillSwitchDashboard } from '@/components/killswitch/KillSwitchDashboard';
import { DistributionPage } from '@/components/distribution/DistributionPage';
import { AllOffersPage } from '@/pages/AllOffersPage';
import { OfferDetailPage } from '@/pages/OfferDetailPage';
import { SegmentsPage } from '@/pages/SegmentsPage';
import { ApiKeysPage } from '@/pages/ApiKeysPage';
import { SyncDashboardPage } from '@/pages/SyncDashboardPage';
import { OrganizationsPage } from '@/pages/OrganizationsPage';

const AppLayout = styled.div`
  display: flex;
  min-height: 100vh;
`;

const MainContent = styled.main`
  flex: 1;
  margin-left: 260px;
  padding: 32px 40px;
  background: #f5f5f5;
  min-height: 100vh;
`;

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Sidebar />
                <MainContent>
                  <Routes>
                    <Route path="/" element={<Navigate to="/kills" replace />} />
                    <Route path="/kills" element={<KillSwitchDashboard />} />
                    <Route path="/offers" element={<AllOffersPage />} />
                    <Route path="/offers/:offerId/edit" element={<OfferDetailPage />} />
                    <Route
                      path="/offers/:offerId/distribution"
                      element={<DistributionPage />}
                    />
                    <Route path="/segments" element={<SegmentsPage />} />
                    <Route path="/organizations" element={<OrganizationsPage />} />
                    <Route path="/sync" element={<SyncDashboardPage />} />
                    <Route path="/api-keys" element={<ApiKeysPage />} />
                  </Routes>
                </MainContent>
              </AppLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;
