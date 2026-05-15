import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { ShellScreen } from '@features/shell/shell-screen';
import { HomeScreen } from '@features/shell/parts/home-screen';
import { PlaceholderScreen } from '@features/shell/parts/placeholder-screen';
import { ROUTES } from '@shared/routes';

const TokensScreen = lazy(() =>
  import('@features/tokens/tokens-screen').then((m) => ({ default: m.TokensScreen })),
);

const ButtonsScreen = lazy(() =>
  import('@features/buttons/buttons-screen').then((m) => ({ default: m.ButtonsScreen })),
);

const InputsScreen = lazy(() =>
  import('@features/inputs/inputs-screen').then((m) => ({ default: m.InputsScreen })),
);

const SelectionScreen = lazy(() =>
  import('@features/selection/selection-screen').then((m) => ({ default: m.SelectionScreen })),
);

const DatetimeScreen = lazy(() =>
  import('@features/datetime/datetime-screen').then((m) => ({ default: m.DatetimeScreen })),
);

const SpecializedScreen = lazy(() =>
  import('@features/specialized/specialized-screen').then((m) => ({ default: m.SpecializedScreen })),
);

const AvatarsPillsScreen = lazy(() =>
  import('@features/avatars-pills/avatars-pills-screen').then((m) => ({ default: m.AvatarsPillsScreen })),
);

const SkeletonProgressScreen = lazy(() =>
  import('@features/skeleton-progress/skeleton-progress-screen').then((m) => ({ default: m.SkeletonProgressScreen })),
);

const TooltipScreen = lazy(() =>
  import('@features/tooltip/tooltip-screen').then((m) => ({ default: m.TooltipScreen })),
);

const CardsScreen = lazy(() =>
  import('@features/cards/cards-screen').then((m) => ({ default: m.CardsScreen })),
);

const BannersScreen = lazy(() =>
  import('@features/banners/banners-screen').then((m) => ({ default: m.BannersScreen })),
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
      { path: ROUTES.BUTTONS, element: <Lazy><ButtonsScreen /></Lazy> },
      { path: ROUTES.INPUTS, element: <Lazy><InputsScreen /></Lazy> },
      { path: ROUTES.SELECTION, element: <Lazy><SelectionScreen /></Lazy> },
      { path: ROUTES.DATETIME, element: <Lazy><DatetimeScreen /></Lazy> },
      { path: ROUTES.SPECIALIZED, element: <Lazy><SpecializedScreen /></Lazy> },
      { path: ROUTES.AVATARS_PILLS, element: <Lazy><AvatarsPillsScreen /></Lazy> },
      { path: ROUTES.SKELETON_PROGRESS, element: <Lazy><SkeletonProgressScreen /></Lazy> },
      { path: ROUTES.TOOLTIP, element: <Lazy><TooltipScreen /></Lazy> },
      { path: ROUTES.CARDS, element: <Lazy><CardsScreen /></Lazy> },
      { path: ROUTES.TABLES, element: <PlaceholderScreen name="Tables" /> },
      { path: ROUTES.MODALS, element: <PlaceholderScreen name="Modals" /> },
      { path: ROUTES.BANNERS, element: <Lazy><BannersScreen /></Lazy> },
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
