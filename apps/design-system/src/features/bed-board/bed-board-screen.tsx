import { Section } from '@features/shell/parts/preview-canvas';
import { BedBoard } from '@ui/bed-board';
import type { BedBoardProps } from '@ui/bed-board';

const BED_BOARD_DATA: BedBoardProps = {
  strip: {
    chargeNurse: 'A. Williams',
    chargeNurseDetail: 'RN BSN · ends shift 19:00 · pager ×3214',
    staffCount: 14,
    staffAvatars: [
      { initials: 'RP', role: 'md' },
      { initials: 'AW', role: 'rn' },
      { initials: 'JK', role: 'rn' },
      { initials: 'MK', role: 'md' },
    ],
    staffExtra: 10,
    census: '9 of 12',
    censusDetail: '75% · 3 beds available · 2 cleaning',
    nextShift: 'in 4h 18m',
    nextShiftDetail: 'night cohort: M. Reed RN, J. Park MD',
  },
  floor: {
    beds: [
      // Row 1
      {
        bedNumber: '312 · A',
        status: 'crit',
        patientInitials: 'OA',
        patientName: 'Adebayo, Olumide',
        patientDemo: '64 M · MRN 10458291',
        acuity: 'Trop ↑↑',
        nextAction: 'repeat at 18:00',
        isolation: 'droplet',
        isRoomEnd: false,
        isLastRow: false,
        isLastCol: false,
      },
      {
        bedNumber: '312 · B',
        status: 'adm',
        patientInitials: 'CW',
        patientName: 'Chen, Wei-Lin',
        patientDemo: '40 F · MRN 10293874',
        acuity: 'Stable',
        nextAction: 'BMP pending — 16:00',
        isRoomEnd: true,
        isLastRow: false,
        isLastCol: false,
      },
      {
        bedNumber: '313 · A',
        status: 'empty',
        acuity: 'Available.',
        nextAction: 'next admit at 15:30',
        isRoomEnd: false,
        isLastRow: false,
        isLastCol: false,
      },
      {
        bedNumber: '313 · B',
        status: 'clean',
        acuity: 'Cleaning…',
        nextAction: 'housekeeping · ~12 min',
        isRoomEnd: true,
        isLastRow: false,
        isLastCol: false,
      },
      {
        bedNumber: '314 · A',
        status: 'adm',
        patientInitials: 'DM',
        patientName: 'Diallo, Mariama',
        patientDemo: '54 F · MRN 10883204',
        acuity: 'Stable',
        nextAction: 'cardiology consult, 17:00',
        isRoomEnd: false,
        isLastRow: false,
        isLastCol: false,
      },
      {
        bedNumber: '314 · B',
        status: 'dc',
        patientInitials: 'GL',
        patientName: 'García, Lucía',
        patientDemo: '77 F · MRN 10712558',
        acuity: 'Going home',
        nextAction: 'ride confirmed, AVS printed',
        isRoomEnd: true,
        isLastRow: false,
        isLastCol: true,
      },
      // Row 2
      {
        bedNumber: '315 · A',
        status: 'offline',
        acuity: 'Off-line',
        nextAction: 'biomed hold · suction not pulling',
        isRoomEnd: false,
        isLastRow: true,
        isLastCol: false,
      },
      {
        bedNumber: '315 · B',
        status: 'offline',
        acuity: 'Off-line',
        nextAction: 'biomed hold · since Apr 28',
        isRoomEnd: true,
        isLastRow: true,
        isLastCol: false,
      },
      {
        bedNumber: '316 · A',
        status: 'empty',
        acuity: 'Available.',
        nextAction: 'held for direct admit',
        isRoomEnd: false,
        isLastRow: true,
        isLastCol: false,
      },
      {
        bedNumber: '316 · B',
        status: 'adm',
        patientInitials: 'PJ',
        patientName: 'Park, Jiwoo',
        patientDemo: '71 M · MRN 10128403',
        acuity: 'Stable',
        nextAction: 'OOB ambulating, t 1100',
        isRoomEnd: true,
        isLastRow: true,
        isLastCol: false,
      },
      {
        bedNumber: '317 · A',
        status: 'adm',
        patientInitials: 'RS',
        patientName: 'Reed, Sarah',
        patientDemo: '58 F · MRN 10401872',
        acuity: 'Stable',
        nextAction: 'C. diff result · pending',
        isolation: 'contact',
        isRoomEnd: false,
        isLastRow: true,
        isLastCol: false,
      },
      {
        bedNumber: '317 · B',
        status: 'clean',
        acuity: 'Cleaning…',
        nextAction: 'deep clean · isolation discharge',
        isRoomEnd: true,
        isLastRow: true,
        isLastCol: true,
      },
    ],
  },
  queue: {
    incoming: [
      {
        name: 'Hadi, Samira',
        age: '38 F',
        when: '14:55 · ED',
        reason: 'chest pressure, troponin rising. cath team paged.',
        meta: '→ likely CCU; held here only if CCU full',
        urgent: true,
      },
      {
        name: 'Okonkwo, M.',
        age: '52 M',
        when: '15:30 · direct',
        reason: 'post-ablation, overnight observation.',
        meta: '→ assigned to 313-A on cleaning',
      },
      {
        name: 'Idowu, F.',
        age: '66 F',
        when: '16:45 · transfer',
        reason: 'from 4-South. Cardiology consult requested.',
      },
    ],
    outgoing: [
      {
        name: 'García, L.',
        age: '77 F',
        when: '~15:15 · home',
        meta: 'ride confirmed · AVS printed · eRx sent',
      },
      {
        name: 'Park, J.',
        age: '71 M',
        when: '~16:30 · home health',
        meta: 'awaiting home health intake form',
      },
    ],
    counts: {
      census: 9,
      open: 3,
      avgLOS: '3.4d',
      censusDelta: '+1 since 12:00',
      openDetail: '2 cleaning',
      losDelta: '−0.2 wow',
    },
  },
};

export function BedBoardScreen() {
  return (
    <div>
      <Section
        title="Bed board · 3-North · step-down."
        description="A charge nurse's source of truth — the floor map. Beds are cells in a numbered grid that mirrors the hallway. Status is typeset, not colored fills. The right rail shows the queue and three counts."
      >
        <BedBoard {...BED_BOARD_DATA} />
      </Section>
    </div>
  );
}
