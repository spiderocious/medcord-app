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

const TablesScreen = lazy(() =>
  import('@features/tables/tables-screen').then((m) => ({ default: m.TablesScreen })),
);

const ModalsScreen = lazy(() =>
  import('@features/modals/modals-screen').then((m) => ({ default: m.ModalsScreen })),
);

const NavigationScreen = lazy(() =>
  import('@features/navigation/navigation-screen').then((m) => ({ default: m.NavigationScreen })),
);

const FeedbackScreen = lazy(() =>
  import('@features/feedback/feedback-screen').then((m) => ({ default: m.FeedbackScreen })),
);

const LabScreen = lazy(() =>
  import('@features/lab/lab-screen').then((m) => ({ default: m.LabScreen })),
);

const VitalsScreen = lazy(() =>
  import('@features/vitals/vitals-screen').then((m) => ({ default: m.VitalsScreen })),
);

const ChartsScreen = lazy(() =>
  import('@features/charts/charts-screen').then((m) => ({ default: m.ChartsScreen })),
);

const TelehealthScreen = lazy(() =>
  import('@features/telehealth/telehealth-screen').then((m) => ({ default: m.TelehealthScreen })),
);

const EquipmentScreen = lazy(() =>
  import('@features/equipment/equipment-screen').then((m) => ({ default: m.EquipmentScreen })),
);

const BedBoardScreen = lazy(() =>
  import('@features/bed-board/bed-board-screen').then((m) => ({ default: m.BedBoardScreen })),
);

const EMRScreen = lazy(() =>
  import('@features/emr/emr-screen').then((m) => ({ default: m.EMRScreen })),
);

const StaffScreen = lazy(() =>
  import('@features/staff/staff-screen').then((m) => ({ default: m.StaffScreen })),
);

const RegistrationScreen = lazy(() =>
  import('@features/registration/registration-screen').then((m) => ({ default: m.RegistrationScreen })),
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
      { path: ROUTES.TABLES, element: <Lazy><TablesScreen /></Lazy> },
      { path: ROUTES.MODALS, element: <Lazy><ModalsScreen /></Lazy> },
      { path: ROUTES.BANNERS, element: <Lazy><BannersScreen /></Lazy> },
      { path: ROUTES.NAVIGATION, element: <Lazy><NavigationScreen /></Lazy> },
      { path: ROUTES.FEEDBACK, element: <Lazy><FeedbackScreen /></Lazy> },
      { path: ROUTES.LAB, element: <Lazy><LabScreen /></Lazy> },
      { path: ROUTES.VITALS, element: <Lazy><VitalsScreen /></Lazy> },
      { path: ROUTES.CHARTS, element: <Lazy><ChartsScreen /></Lazy> },
      { path: ROUTES.EMR, element: <Lazy><EMRScreen /></Lazy> },
      { path: ROUTES.BED_BOARD, element: <Lazy><BedBoardScreen /></Lazy> },
      { path: ROUTES.TELEHEALTH, element: <Lazy><TelehealthScreen /></Lazy> },
      { path: ROUTES.EQUIPMENT, element: <Lazy><EquipmentScreen /></Lazy> },
      { path: ROUTES.STAFF, element: <Lazy><StaffScreen /></Lazy> },
      { path: ROUTES.REGISTRATION, element: <Lazy><RegistrationScreen /></Lazy> },
    ],
  },
];
