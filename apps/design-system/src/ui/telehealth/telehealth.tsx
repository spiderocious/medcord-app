import { useState } from 'react';
import {
  Mic, MicOff, Video, VideoOff, Captions, MonitorUp, MessageSquare, PhoneOff,
} from '@icons';

/* ------------------------------------------------------------------ */
/* VideoTile                                                            */
/* ------------------------------------------------------------------ */

export interface VideoTileProps {
  readonly variant: 'patient' | 'provider';
  readonly initials: string;
  readonly name: string;
  readonly role: string;
  readonly showRec?: boolean;
  readonly network?: { readonly label: string; readonly bars: readonly number[] };
}

export function VideoTile({ variant, initials, name, role, showRec = false, network }: VideoTileProps) {
  const bg =
    variant === 'patient'
      ? 'bg-gradient-to-br from-[#1F2A1B] via-[#3B4A2F] to-[#6B7958]'
      : 'bg-gradient-to-br from-[#241F1A] via-[#3F3A33] to-[#6E665B]';

  return (
    <div className={`relative overflow-hidden flex items-center justify-center ${bg}`}>
      <span
        className="font-serif font-medium text-[rgba(244,239,230,0.85)] tracking-[-0.04em] select-none"
        style={{ fontSize: 88 }}
      >
        {initials}
      </span>

      {showRec && (
        <span className="absolute left-3 top-3 bg-[var(--danger-icon)] text-white flex items-center gap-1.5 px-2.5 py-[3px] rounded-sm font-mono text-[9px] font-bold tracking-[0.18em] uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-[blink_1400ms_ease-in-out_infinite]" />
          REC
        </span>
      )}

      {network != null && (
        <span className="absolute right-3 top-3 bg-[rgba(0,0,0,0.5)] flex items-center gap-1.5 px-2 py-[3px] rounded-sm font-mono text-[9px] text-[rgba(244,239,230,1)] tracking-[0.18em] uppercase">
          <span className="inline-flex items-end gap-px">
            {network.bars.map((h, i) => (
              <span key={i} className="w-0.5 bg-green-300 inline-block" style={{ height: h }} />
            ))}
          </span>
          {network.label}
        </span>
      )}

      <span className="absolute left-3 bottom-3 bg-[rgba(0,0,0,0.5)] flex items-center gap-2 px-2.5 py-1 rounded-sm">
        <span className="font-sans text-[12px] font-medium text-[rgba(244,239,230,1)]">{name}</span>
        <span className="font-mono text-[9px] text-[rgba(244,239,230,0.7)] tracking-[0.18em] uppercase">{role}</span>
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* VideoControls                                                        */
/* ------------------------------------------------------------------ */

export interface VideoControlsProps {
  readonly duration: string;
  readonly onEndCall?: () => void;
}

export function VideoControls({ duration, onEndCall }: VideoControlsProps) {
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [captionsOn, setCaptionsOn] = useState(true);

  const baseBtn =
    'w-9 h-9 rounded-full flex items-center justify-center border cursor-pointer transition-colors';
  const defaultBtn = `${baseBtn} bg-[rgba(255,255,255,0.08)] border-[rgba(255,255,255,0.12)] text-[rgba(244,239,230,1)] hover:bg-[#4A4540]`;
  const activeBtn = `${baseBtn} bg-[rgba(244,239,230,1)] border-[rgba(244,239,230,1)] text-[#1A1714]`;

  return (
    <div className="bg-[#1A1714] border-t border-[rgba(255,255,255,0.08)] px-6 py-3 flex items-center gap-2">
      <span className="font-mono text-[11px] text-[rgba(244,239,230,0.55)] mr-auto pl-2.5 tracking-[0]">
        {duration}
      </span>

      <button type="button" className={muted ? activeBtn : defaultBtn} onClick={() => setMuted((v) => !v)} title="Mute">
        {muted ? <MicOff size={16} strokeWidth={1.6} /> : <Mic size={16} strokeWidth={1.6} />}
      </button>

      <button type="button" className={cameraOff ? activeBtn : defaultBtn} onClick={() => setCameraOff((v) => !v)} title="Camera">
        {cameraOff ? <VideoOff size={16} strokeWidth={1.6} /> : <Video size={16} strokeWidth={1.6} />}
      </button>

      <button type="button" className={captionsOn ? activeBtn : defaultBtn} onClick={() => setCaptionsOn((v) => !v)} title="Captions">
        <Captions size={16} strokeWidth={1.6} />
      </button>

      <button type="button" className={defaultBtn} title="Share screen">
        <MonitorUp size={16} strokeWidth={1.6} />
      </button>

      <button type="button" className={defaultBtn} title="Chat">
        <MessageSquare size={16} strokeWidth={1.6} />
      </button>

      <button
        type="button"
        onClick={onEndCall}
        className="ml-auto flex items-center gap-2 h-9 px-3.5 rounded bg-[var(--danger-icon)] text-white border border-[var(--danger-icon)] font-sans text-[12px] font-medium cursor-pointer hover:bg-[#9A1B12] hover:border-[#9A1B12] transition-colors"
      >
        <PhoneOff size={16} strokeWidth={1.6} />
        End call
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* CallCaptions                                                         */
/* ------------------------------------------------------------------ */

export interface CallCaptionsProps {
  readonly speaker: string;
  readonly text: string;
}

export function CallCaptions({ speaker, text }: CallCaptionsProps) {
  return (
    <div
      className="px-6 py-3 border-t border-[rgba(255,255,255,0.08)]"
      style={{ background: 'rgba(24,22,19,0.92)' }}
    >
      <span className="font-mono text-[10px] text-[rgba(244,239,230,0.55)] tracking-[0.18em] uppercase mr-2.5 not-italic">
        {speaker}
      </span>
      <span className="font-serif italic text-[16px] text-[rgba(244,239,230,1)] leading-[1.45]">{text}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* VideoCall                                                            */
/* ------------------------------------------------------------------ */

export interface VideoCallProps {
  readonly tiles: readonly [VideoTileProps, VideoTileProps];
  readonly captions?: CallCaptionsProps;
  readonly duration: string;
  readonly onEndCall?: () => void;
}

export function VideoCall({ tiles, captions, duration, onEndCall }: VideoCallProps) {
  return (
    <div className="bg-[#1A1714] border border-[#1A1714] text-[rgba(244,239,230,1)]" style={{ display: 'grid', gridTemplateRows: '1fr auto auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 1, background: 'rgba(255,255,255,0.08)', height: 360 }}>
        <VideoTile {...tiles[0]} />
        <VideoTile {...tiles[1]} />
      </div>
      {captions != null && <CallCaptions {...captions} />}
      <VideoControls duration={duration} onEndCall={onEndCall} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* TelehealthSidePanel                                                  */
/* ------------------------------------------------------------------ */

export interface VitalItem {
  readonly label: string;
  readonly value: string;
}

export interface TelehealthSidePanelProps {
  readonly name: string;
  readonly demo: string;
  readonly reasonForVisit: string;
  readonly vitals: readonly [VitalItem, VitalItem];
  readonly medications: readonly string[];
  readonly lastAdmit: string;
}

export function TelehealthSidePanel({ name, demo, reasonForVisit, vitals, medications, lastAdmit }: TelehealthSidePanelProps) {
  return (
    <aside className="bg-[var(--surface-raised)] border border-[var(--text-primary)] flex flex-col">
      <div className="px-[18px] py-[14px] border-b border-[var(--text-primary)] bg-[var(--surface-sunken)]">
        <div className="font-serif text-[18px] font-medium tracking-[-0.012em] leading-[1.1] text-[var(--text-primary)]">{name}</div>
        <div className="font-mono text-[10px] text-[var(--text-tertiary)] mt-1 tracking-[0]">{demo}</div>
      </div>

      <div className="px-[18px] py-4 flex-1 overflow-auto flex flex-col gap-[18px]">
        <div>
          <div className="font-mono text-[10px] text-[var(--text-tertiary)] tracking-[0.18em] uppercase mb-1.5">Reason for visit</div>
          <div className="font-serif italic text-[14px] text-[var(--text-primary)] leading-[1.5]">{reasonForVisit}</div>
        </div>

        <div>
          <div className="font-mono text-[10px] text-[var(--text-tertiary)] tracking-[0.18em] uppercase mb-1.5">Last vitals · self-reported</div>
          <div className="grid grid-cols-2 gap-2.5">
            {vitals.map((v) => (
              <div key={v.label} className="bg-[var(--surface-sunken)] border border-[var(--border-default)] px-2.5 py-2">
                <div className="font-mono text-[10px] text-[var(--text-tertiary)] tracking-[0.18em] uppercase mb-1">{v.label}</div>
                <div className="font-mono text-[18px] font-medium tracking-[-0.015em] text-[var(--text-primary)]">{v.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="font-mono text-[10px] text-[var(--text-tertiary)] tracking-[0.18em] uppercase mb-1.5">Current medications</div>
          <div className="font-mono text-[11px] text-[var(--text-secondary)] leading-[1.7] tracking-[0]">
            {medications.map((med) => (
              <div key={med}>{med}</div>
            ))}
          </div>
        </div>

        <div>
          <div className="font-mono text-[10px] text-[var(--text-tertiary)] tracking-[0.18em] uppercase mb-1.5">Last admit</div>
          <div className="font-serif text-[14px] text-[var(--text-secondary)] leading-[1.5]">{lastAdmit}</div>
        </div>
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/* PatientQueueRow                                                      */
/* ------------------------------------------------------------------ */

export interface PatientQueueRowProps {
  readonly name: string;
  readonly age: string;
  readonly reason: string;
  readonly when?: string;
  readonly isActive?: boolean;
  readonly needsAttention?: boolean;
}

export function PatientQueueRow({ name, age, reason, when, isActive = false, needsAttention = false }: PatientQueueRowProps) {
  return (
    <div
      className={[
        'px-[18px] py-3 border-b border-dashed border-[var(--border-default)] last:border-b-0',
        'grid gap-2',
        isActive ? 'bg-[var(--surface-base)] border-l-2 border-l-[var(--text-primary)] pl-4' : '',
      ].join(' ')}
      style={{ gridTemplateColumns: '1fr auto' }}
    >
      <div>
        <div className="font-sans text-[13px] font-semibold text-[var(--text-primary)]">
          {name}
          <span className="font-mono text-[11px] text-[var(--text-tertiary)] ml-1.5 font-normal">{age}</span>
        </div>
        <div className="font-serif italic text-[var(--text-tertiary)] text-[13px] mt-0.5">{reason}</div>
        {when != null && (
          <div
            className={['font-mono text-[11px] mt-1 tracking-[0]', needsAttention ? 'text-[var(--warning-icon)]' : 'text-[var(--text-tertiary)]'].join(' ')}
          >
            {when}
          </div>
        )}
      </div>
      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-green-600 self-center animate-[pulse_1.6s_ease-out_infinite]" />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* DictationNote                                                        */
/* ------------------------------------------------------------------ */

export interface DictationNoteProps {
  readonly title: string;
  readonly meta: string;
  readonly paragraphs: readonly { readonly label?: string; readonly text: string }[];
  readonly aiChips?: readonly string[];
  readonly aiDisclaimer?: string;
}

export function DictationNote({ title, meta, paragraphs, aiChips = [], aiDisclaimer }: DictationNoteProps) {
  return (
    <div className="bg-[var(--surface-raised)] border border-[var(--text-primary)]">
      <div className="flex items-baseline gap-3 px-[22px] py-[14px] border-b border-[var(--text-primary)] bg-[var(--surface-sunken)]">
        <h3 className="m-0 font-serif text-[18px] font-medium tracking-[-0.012em] text-[var(--text-primary)]">{title}</h3>
        <span className="ml-auto font-mono text-[11px] text-[var(--text-tertiary)] tracking-[0]">{meta}</span>
      </div>

      <div className="px-7 py-[22px] font-serif text-[16px] leading-[1.65] text-[var(--text-primary)] tracking-[-0.005em]">
        {paragraphs.map((p, i) => (
          <p key={i} className="m-0 mb-[14px] last:mb-0">
            {p.label != null && <strong>{p.label} </strong>}
            <span dangerouslySetInnerHTML={{ __html: p.text }} />
          </p>
        ))}
      </div>

      <div className="border-t border-[var(--border-default)] px-[22px] py-3 flex items-center gap-3 bg-[var(--surface-sunken)]">
        {aiChips.map((chip) => (
          <button
            key={chip}
            type="button"
            className="inline-flex items-center gap-1.5 h-7 px-2.5 bg-[var(--surface-base)] border border-dashed border-[var(--text-primary)] font-mono text-[11px] text-[var(--text-primary)] tracking-[0.04em] cursor-pointer hover:bg-[var(--surface-sunken)] transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-3 h-3" aria-hidden="true">
              <path d="m12 2 2 7 7 2-7 2-2 7-2-7-7-2 7-2z" />
            </svg>
            {chip}
          </button>
        ))}
        {aiDisclaimer != null && (
          <span className="font-mono text-[11px] text-[var(--text-tertiary)] tracking-[0] ml-auto">{aiDisclaimer}</span>
        )}
        <button type="button" className="h-8 px-3.5 rounded font-sans text-[12px] font-medium text-[var(--text-tertiary)] cursor-pointer bg-transparent border-0 hover:text-[var(--text-primary)] transition-colors">
          Save draft
        </button>
        <button type="button" className="h-8 px-3.5 rounded font-sans text-[12px] font-medium text-[var(--text-primary)] border border-[var(--text-primary)] bg-transparent cursor-pointer hover:bg-[var(--surface-sunken)] transition-colors">
          Send for co-sign
        </button>
        <button type="button" className="h-8 px-3.5 rounded font-sans text-[12px] font-medium text-white bg-[var(--records-700)] border border-[var(--records-700)] cursor-pointer hover:bg-[var(--records-800)] transition-colors">
          Sign &amp; close visit
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* TelehealthRoom                                                       */
/* ------------------------------------------------------------------ */

export interface TelehealthRoomProps {
  readonly call: VideoCallProps;
  readonly sidePanel: TelehealthSidePanelProps;
}

export function TelehealthRoom({ call, sidePanel }: TelehealthRoomProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
      <VideoCall {...call} />
      <TelehealthSidePanel {...sidePanel} />
    </div>
  );
}
