// Routes (hash-based, NFR-TECH-4) and first-run guards (FR-LEGAL-2/3, §3).
import { Suspense, lazy, useEffect } from 'react';
import { Navigate, Outlet, RouterProvider, createHashRouter, useLocation } from 'react-router-dom';
import { download, needsLegal, useStore } from '../state/store';
import { BottomNav, CookieNotice, Footer, Header } from './components/shell';
import { Button, Notice, ToastProvider } from './components/ui';
import { Grocery } from './screens/Grocery';
import { HouseholdScreen } from './screens/HouseholdScreen';
import { Onboarding } from './screens/Onboarding';
import { PlanView } from './screens/PlanView';
import { Plans } from './screens/Plans';
import { Settings } from './screens/Settings';
import { Welcome } from './screens/Welcome';

const Legal = lazy(() => import('./screens/Legal'));

function Layout() {
  const { pathname } = useLocation();
  const data = useStore((s) => s.data);
  const status = useStore((s) => s.status);
  const storageError = useStore((s) => s.storageError);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const isLegal = pathname.startsWith('/legal');
  const isWelcome = pathname === '/welcome';
  const isOnboarding = pathname === '/onboarding';

  if (status === 'corrupt') return <Corrupt />;
  if (!isLegal) {
    if (needsLegal(data) && !isWelcome) return <Navigate to="/welcome" replace />;
    if (!needsLegal(data) && isWelcome) return <Navigate to="/" replace />;
    if (data && !needsLegal(data) && !data.onboarded && !isOnboarding) return <Navigate to="/onboarding" replace />;
  }
  const appNav = !!data?.onboarded && !needsLegal(data);

  return (
    <>
      <a className="ds-skip-link" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>
        Skip to content
      </a>
      <Header nav={appNav} />
      {storageError && (
        <div className="pf-page pf-banner">
          <Notice kind="err" icon="alert" title="Your changes aren't being saved">
            This browser refused to store data (private mode or full storage). Export your data from Settings to keep it.
          </Notice>
        </div>
      )}
      <Suspense fallback={<main className="pf-page" />}>
        <Outlet />
      </Suspense>
      <Footer />
      {appNav && <BottomNav />}
      <CookieNotice />
    </>
  );
}

/** NFR-REL-1: never blank the app over a damaged document. */
function Corrupt() {
  const raw = useStore((s) => s.corruptRaw);
  return (
    <>
      <Header nav={false} />
      <main id="main" className="pf-page pf-page--narrow pf-stack-md">
        <h1 className="pf-h1">Saved data can't be read</h1>
        <Notice kind="err" icon="alert">
          The data in this browser is damaged or from an unknown version. Download it to keep a copy, then start fresh or import a backup from Settings.
        </Notice>
        <div className="pf-row pf-wrap pf-gap-8">
          <Button icon="download" onClick={() => download('plateful-damaged-data.json', raw ?? '')}>Download raw data</Button>
          <Button variant="danger" icon="trash" onClick={() => useStore.getState().resetCorrupt()}>Reset and start fresh</Button>
        </div>
      </main>
      <Footer />
    </>
  );
}

function NotFound() {
  return <Navigate to="/" replace />;
}

const router = createHashRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Plans /> },
      { path: '/welcome', element: <Welcome /> },
      { path: '/onboarding', element: <Onboarding /> },
      { path: '/plan/:id', element: <PlanView /> },
      { path: '/plan/:id/grocery', element: <Grocery /> },
      { path: '/household', element: <HouseholdScreen /> },
      { path: '/settings', element: <Settings /> },
      { path: '/legal/:doc', element: <Legal /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

export function App() {
  return (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  );
}
