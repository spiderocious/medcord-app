import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { ShellScreen } from '@features/shell/shell-screen';
import { HomeScreen } from '@features/shell/parts/home-screen';
import { PlaceholderScreen } from '@features/shell/parts/placeholder-screen';
import { ROUTES } from '@shared/routes';

const TokensScreen = lazy(() =>
  import('@features/tokens/tokens-screen').then((m) => ({ default: m.TokensScreen })),
);

function Loading() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-4 h-4 rounded-full bg-[var(--brand-400)] animate-pulse-dot" />
    </div>
  );
}

function Lazy({ children }: { readonly children: React.ReactNode }) {
  return <Suspense fallback={<Loading />}>{children}</Suspense>;
}

export const routes: RouteObject[] = [
  {
    path: '/',
    Component: ShellScreen,
    children: [
      { index: true, element: <HomeScreen /> },
      { path: ROUTES.TOKENS, element: <Lazy><TokensScreen /></Lazy> },
      { path: ROUTES.BUTTONS, element: <PlaceholderScreen name="Buttons" /> },
      { path: ROUTES.INPUTS, element: <PlaceholderScreen name="Inputs" /> },
      { path: ROUTES.SELECTION, element: <PlaceholderScreen name="Selection" /> },
      { path: ROUTES.DATETIME, element: <PlaceholderScreen name="Date & Time" /> },
      { path: ROUTES.SPECIALIZED, element: <PlaceholderScreen name="Specialized Inputs" /> },
      { path: ROUTES.AVATARS_PILLS, element: <PlaceholderScreen name="Avatars & Pills" /> },
      { path: ROUTES.SKELETON_PROGRESS, element: <PlaceholderScreen name="Skeleton & Progress" /> },
      { path: ROUTES.TOOLTIP, element: <PlaceholderScreen name="Tooltip" /> },
      { path: ROUTES.CARDS, element: <PlaceholderScreen name="Cards" /> },
      { path: ROUTES.TABLES, element: <PlaceholderScreen name="Tables" /> },
      { path: ROUTES.MODALS, element: <PlaceholderScreen name="Modals" /> },
      { path: ROUTES.BANNERS, element: <PlaceholderScreen name="Banners" /> },
      { path: ROUTES.NAVIGATION, element: <PlaceholderScreen name="Navigation" /> },
      { path: ROUTES.FEEDBACK, element: <PlaceholderScreen name="Feedback" /> },
      { path: ROUTES.LAB, element: <PlaceholderScreen name="Lab" /> },
      { path: ROUTES.VITALS, element: <PlaceholderScreen name="Vitals" /> },
      { path: ROUTES.CHARTS, element: <PlaceholderScreen name="Charts" /> },
      { path: ROUTES.EMR, element: <PlaceholderScreen name="EMR" /> },
      { path: ROUTES.BED_BOARD, element: <PlaceholderScreen name="Bed Board" /> },
      { path: ROUTES.TELEHEALTH, element: <PlaceholderScreen name="Telehealth" /> },
      { path: ROUTES.EQUIPMENT, element: <PlaceholderScreen name="Equipment" /> },
      { path: ROUTES.STAFF, element: <PlaceholderScreen name="Staff" /> },
      { path: ROUTES.REGISTRATION, element: <PlaceholderScreen name="Registration" /> },
    ],
  },
];
