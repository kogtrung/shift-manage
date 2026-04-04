import { Navigate, createBrowserRouter } from 'react-router-dom'
import { RequireAuth } from '../features/auth/RequireAuth'
import { AppLayout } from '../layouts/AppLayout'
import { GroupLayout } from '../layouts/GroupLayout'
import { PublicLayout } from '../layouts/PublicLayout'
import { AuditLogsPage } from '../pages/group-audit/AuditLogsPage'
import { CreateGroupPage } from '../pages/group/CreateGroupPage'
import { GroupHomePage } from '../pages/group/GroupHomePage'
import { GroupsPage } from '../pages/group/GroupsPage'
import { JoinGroupPage } from '../pages/group/JoinGroupPage'
import { LoginPage } from '../pages/auth/LoginPage'
import { NotFoundPage } from '../pages/common/NotFoundPage'
import { MembersPage } from '../pages/group/MembersPage'
import { PendingMembersPage } from '../pages/group/PendingMembersPage'
import { PositionsPage } from '../pages/shift-config/PositionsPage'
import { RegisterPage } from '../pages/auth/RegisterPage'
import { ShiftTemplatesPage } from '../pages/shift-config/ShiftTemplatesPage'
import { ShiftsPage } from '../pages/shift-config/ShiftsPage'
import { GroupSettingsPage } from '../pages/group/GroupSettingsPage'
import { AvailabilityPage } from '../pages/member/AvailabilityPage'
import { MySchedulePage } from '../pages/member/MySchedulePage'
import { ProfilePage } from '../pages/member/ProfilePage'
import { SalaryConfigPage } from '../pages/manager/SalaryConfigPage'
import { PayrollPage } from '../pages/manager/PayrollPage'
import { PerformancePage } from '../pages/manager/PerformancePage'
import { AlertsPage } from '../pages/manager/AlertsPage'
import { ShiftChangeRequestsPage } from '../pages/shift-change/ShiftChangeRequestsPage'
import { RequireAdmin } from '../features/auth/RequireAdmin'
import { AdminLayout } from '../layouts/AdminLayout'
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage'
import { AdminUsersPage } from '../pages/admin/AdminUsersPage'
import { AdminGroupsPage } from '../pages/admin/AdminGroupsPage'
import { AdminAuditLogsPage } from '../pages/admin/AdminAuditLogsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/app/groups" replace />,
  },
  {
    path: '/auth',
    element: <PublicLayout />,
    children: [
      { index: true, element: <Navigate to="/auth/login" replace /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
    ],
  },
  {
    path: '/app',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/app/groups" replace /> },
      { path: 'groups', element: <GroupsPage /> },
      { path: 'groups/create', element: <CreateGroupPage /> },
      { path: 'groups/join', element: <JoinGroupPage /> },
    ],
  },
  {
    path: '/groups/:groupId',
    element: (
      <RequireAuth>
        <GroupLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <GroupHomePage /> },
      { path: 'members', element: <MembersPage /> },
      { path: 'members/pending', element: <PendingMembersPage /> },
      { path: 'shift-change-requests', element: <ShiftChangeRequestsPage /> },
      { path: 'positions', element: <PositionsPage /> },
      { path: 'shift-templates', element: <ShiftTemplatesPage /> },
      { path: 'shifts', element: <ShiftsPage /> },
      { path: 'availability', element: <AvailabilityPage /> },
      { path: 'my-schedule', element: <MySchedulePage /> },
      { path: 'audit-logs', element: <AuditLogsPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'salary-configs', element: <SalaryConfigPage /> },
      { path: 'payroll', element: <PayrollPage /> },
      { path: 'performance', element: <PerformancePage /> },
      { path: 'alerts', element: <AlertsPage /> },
      { path: 'settings', element: <GroupSettingsPage /> },
    ],
  },
  {
    path: '/admin',
    element: (
      <RequireAdmin>
        <AdminLayout />
      </RequireAdmin>
    ),
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: 'users', element: <AdminUsersPage /> },
      { path: 'groups', element: <AdminGroupsPage /> },
      { path: 'audit-logs', element: <AdminAuditLogsPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
