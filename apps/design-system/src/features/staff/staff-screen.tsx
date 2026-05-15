import { Section } from '@features/shell/parts/preview-canvas';
import {
  StaffStatsStrip,
  ScheduleGrid,
  PTORow,
  CredentialRow,
  ShiftSwapCard,
  StaffPanel,
} from '@ui/staff';

export function StaffScreen() {
  return (
    <div>
      <Section
        title="Staff &amp; schedule."
        description="Weekly schedule grid, PTO requests, credential expiry tracker, and shift-swap workflow. 3-North · week of May 4."
      >
        {/* Top Stats Strip */}
        <StaffStatsStrip
          cells={[
            {
              label: 'Charge today',
              title: 'A. Williams RN',
              sub: '7:00 → 19:00 · pager ×3214',
            },
            {
              label: 'On the floor now',
              title: '14 staff',
              sub: '3 MD · 8 RN · 2 tech · 1 admin',
            },
            {
              label: 'Next shift change',
              title: 'in 4 h 18 m',
              sub: 'night cohort: M. Reed RN, J. Park MD',
            },
            {
              label: 'Open shifts · this week',
              title: '2 unfilled',
              sub: 'Sat May 9 · 19–07 · Sun May 10 · 07–19',
              subColor: 'var(--warning-icon)',
            },
          ]}
        />

        {/* Schedule Grid */}
        <ScheduleGrid
          title="Schedule — week view"
          meta="May 4 → May 10"
          todayIndex={2}
          days={[
            { label: 'Mon', date: 4 },
            { label: 'Tue', date: 5 },
            { label: 'Wed', date: 6 },
            { label: 'Thu', date: 7 },
            { label: 'Fri', date: 8 },
            { label: 'Sat', date: 9 },
            { label: 'Sun', date: 10 },
          ]}
          rows={[
            {
              staffCell: { initials: 'RP', role: 'MD', name: 'Patel, R MD', roleLabel: 'Cardiology', variant: 'default' },
              days: [
                { variant: 'day', label: '07–19 · 3-N' },
                { variant: 'day', label: '07–19 · 3-N' },
                { variant: 'oncall', label: 'on-call' },
                { variant: 'day', label: '07–19 · 3-N' },
                null,
                null,
                { variant: 'oncall', label: 'on-call' },
              ],
            },
            {
              staffCell: { initials: 'AW', role: 'RN', name: 'Williams, A RN', roleLabel: '3-N · charge', variant: 'rn' },
              days: [
                { variant: 'day', label: '07–19' },
                { variant: 'day', label: '07–19' },
                { variant: 'pto', label: 'PTO' },
                { variant: 'pto', label: 'PTO' },
                { variant: 'pto', label: 'PTO' },
                null,
                { variant: 'eve', label: '15–23' },
              ],
            },
            {
              staffCell: { initials: 'PA', role: 'DO', name: 'Park, A DO', roleLabel: 'Cardiology fellow', variant: 'default' },
              days: [
                { variant: 'night', label: '19–07' },
                { variant: 'night', label: '19–07' },
                { variant: 'night', label: '19–07' },
                null,
                null,
                { variant: 'day', label: '07–19' },
                { variant: 'day', label: '07–19' },
              ],
            },
            {
              staffCell: { initials: 'JK', role: 'RN', name: 'Kim, J RN', roleLabel: '3-N · bedside', variant: 'rn' },
              days: [
                null,
                { variant: 'eve', label: '15–23' },
                { variant: 'eve', label: '15–23' },
                { variant: 'eve', label: '15–23' },
                { variant: 'eve', label: '15–23' },
                { variant: 'swap', label: 'offered: 07–19' },
                null,
              ],
            },
            {
              staffCell: { initials: 'TJ', role: 'TC', name: 'Johnson, T', roleLabel: 'Phlebotomy tech', variant: 'tech' },
              days: [
                { variant: 'day', label: '07–15' },
                { variant: 'day', label: '07–15' },
                { variant: 'day', label: '07–15' },
                { variant: 'day', label: '07–15' },
                { variant: 'day', label: '07–15' },
                null,
                null,
              ],
            },
            {
              staffCell: { initials: 'SR', role: 'RN', name: 'Reed, S RN', roleLabel: '3-N · float', variant: 'rn' },
              days: [
                { variant: 'night', label: '19–07' },
                null,
                { variant: 'night', label: '19–07' },
                { variant: 'night', label: '19–07' },
                { variant: 'night', label: '19–07' },
                null,
                { variant: 'day', label: '07–19' },
              ],
            },
          ]}
        />

        {/* Second row: PTO + Credentials + Swap */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 24, alignItems: 'start' }}>
          {/* PTO Panel */}
          <StaffPanel title="PTO &amp; absence requests" meta="3 pending">
            <PTORow
              initials="AW"
              name="Williams, A RN"
              reason='"Daughter&apos;s school recital."'
              date="May 12 → May 18 · 5 working days · vacation"
              status="pending"
            />
            <PTORow
              initials="TJ"
              avatarBg="#ECE3D6"
              avatarColor="#5C4B30"
              avatarBorder="#D4C4A6"
              name="Johnson, T · Tech"
              reason='"Routine appointment."'
              date="May 14 · half day · personal"
              status="pending"
            />
            <PTORow
              initials="JK"
              name="Kim, J RN"
              reason='"Approved last week."'
              date="May 22 → May 24 · 3 days · vacation"
              status="approved"
            />
          </StaffPanel>

          {/* Credentials Panel */}
          <StaffPanel title="Credentials &amp; expiries" meta="next 60 days">
            <CredentialRow
              initials="RP"
              name="Patel, R MD"
              credential="DEA registration · expired 31 Mar"
              severity="crit"
              dashArray="88 88"
            />
            <CredentialRow
              initials="RP"
              name="Patel, R MD"
              credential="ACLS · expires 12 Jun · 42 d"
              severity="warn"
              dashArray="76 88"
            />
            <CredentialRow
              initials="AW"
              avatarBg="#DDE3D4"
              avatarColor="#495939"
              avatarBorder="#C2CCB4"
              name="Williams, A RN"
              credential="ACLS · expires 22 Aug · 113 d"
              severity="warn"
              dashArray="48 88"
            />
            <CredentialRow
              initials="JK"
              avatarBg="#DDE3D4"
              avatarColor="#495939"
              avatarBorder="#C2CCB4"
              name="Kim, J RN"
              credential="RN license · renewed 14 Apr · valid through 2028"
              severity="ok"
              dashArray="14 88"
            />
          </StaffPanel>

          {/* Shift Swap Panel */}
          <StaffPanel title="Shift swap — Sat May 9" meta="offered by J. Kim">
            <ShiftSwapCard
              shiftLabel="07–19 · 3-North"
              when="Sat May 9 · 12 h shift"
              reason='"Wedding out of town. Happy to take any of yours next week — let me know."'
              candidates={[
                {
                  initials: 'AW',
                  name: 'Williams, A RN',
                  meta: 'on PTO · unavailable',
                  action: 'muted',
                  actionLabel: 'Unavailable',
                },
                {
                  initials: 'SR',
                  name: 'Reed, S RN',
                  meta: 'no conflict · within hours cap',
                  action: 'accept',
                  actionLabel: 'Offer',
                },
                {
                  initials: 'MJ',
                  name: 'Johnson, M RN',
                  meta: 'overtime threshold +4 h',
                  action: 'secondary',
                  actionLabel: 'Offer with OT',
                },
              ]}
            />
          </StaffPanel>
        </div>
      </Section>
    </div>
  );
}
