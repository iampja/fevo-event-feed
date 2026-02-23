import { Routes, Route, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import { AuthProvider } from '@/auth/AuthContext';
import { ProtectedRoute } from '@/auth/ProtectedRoute';
import { Sidebar } from '@/components/layout/Sidebar';
import { LoginPage } from '@/pages/LoginPage';
import { AllOffersPage } from '@/pages/AllOffersPage';
import { OfferDetailPage } from '@/pages/OfferDetailPage';
import { SegmentsPage } from '@/pages/SegmentsPage';
import { SegmentDetailPage } from '@/pages/SegmentDetailPage';
import { ApiKeysPage } from '@/pages/ApiKeysPage';
import { SyncDashboardPage } from '@/pages/SyncDashboardPage';
import { OrganizationsPage } from '@/pages/OrganizationsPage';
import { OrganizationDetailPage } from '@/pages/OrganizationDetailPage';

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
                    <Route path="/" element={<Navigate to="/offers" replace />} />
                    <Route path="/offers" element={<AllOffersPage />} />
                    <Route path="/offers/:offerId" element={<OfferDetailPage />} />
                    <Route path="/segments" element={<SegmentsPage />} />
                    <Route path="/segments/:slug" element={<SegmentDetailPage />} />
                    <Route path="/organizations" element={<OrganizationsPage />} />
                    <Route path="/organizations/:orgId" element={<OrganizationDetailPage />} />
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
