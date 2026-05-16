import { useState } from 'react';
import { Section } from '@features/shell/parts/preview-canvas';
import {
  Calendar,
  DateRangePicker,
  TimeDrum,
  ClockFace,
  DOBInput,
  RecurrenceBuilder,
  DurationField,
} from '@medcord/ui';
import type { DateRange, TimeValue } from '@medcord/ui';

export function DatetimeScreen() {
  const [admissionDate, setAdmissionDate] = useState<Date>(new Date(2026, 4, 5));
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(2026, 4, 12),
    end: new Date(2026, 4, 18),
  });
  const [drumTime, setDrumTime] = useState<TimeValue>({ hours: 8, minutes: 30, seconds: 15 });
  const [drumOpen, setDrumOpen] = useState(true);
  const [dob, setDob] = useState('1962-03-14');

  const [los, setLos] = useState('4');
  const [visitH, setVisitH] = useState('00');
  const [visitM, setVisitM] = useState('45');
  const [infH, setInfH] = useState('2');
  const [infM, setInfM] = useState('24');

  const markedDates = [new Date(2026, 4, 7), new Date(2026, 4, 14)];
  const unavailableDates = [new Date(2026, 4, 28), new Date(2026, 4, 29)];

  return (
    <div>
      {/* Calendar */}
      <Section
        title="Calendar — pick a day, or a range."
        description="Hairline grid, mono dates. Today is circled. Selected is filled. The range pen-strokes between two days."
      >
        <div className="flex gap-6 flex-wrap items-start">
          <div>
            <div className="font-mono text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.18em] mb-2.5">
              Single — admission date
            </div>
            <Calendar
              value={admissionDate}
              onChange={setAdmissionDate}
              markedDates={markedDates}
            />
            <div className="font-mono text-[11px] text-[var(--text-tertiary)] mt-2 tracking-[0]">
              Selected: {admissionDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>

          <div>
            <div className="font-mono text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.18em] mb-2.5">
              Range — PTO
            </div>
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              unavailableDates={unavailableDates}
            />
          </div>
        </div>
      </Section>

      {/* Time */}
      <Section
        title="Time — face &amp; drum."
        description="A face for setting time at-a-glance. A drum for medication timing where the second hand matters."
      >
        <div className="flex gap-9 items-start flex-wrap">
          <div>
            <div className="font-mono text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.18em] mb-2.5">
              Round — appointment
            </div>
            <ClockFace
              hours={8}
              minutes={15}
              label="08:15 — appointment time"
              size={200}
            />
          </div>

          <div>
            <div className="font-mono text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.18em] mb-2.5">
              Drum — first dose
            </div>
            {drumOpen ? (
              <TimeDrum
                value={drumTime}
                onChange={setDrumTime}
                showSeconds
              />
            ) : null}
            <button
              type="button"
              onClick={() => setDrumOpen((v) => !v)}
              className="mt-2.5 font-mono text-[11px] text-[var(--text-tertiary)] bg-transparent border-0 p-0 cursor-pointer hover:text-[var(--text-primary)] transition-colors duration-100 tracking-[0]"
              title={drumOpen ? 'Close picker' : 'Open picker'}
            >
              {String(drumTime.hours).padStart(2, '0')} : {String(drumTime.minutes).padStart(2, '0')} : {String(drumTime.seconds ?? 0).padStart(2, '0')} — clinical time, 24-hour
            </button>
          </div>

          <div>
            <div className="font-mono text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.18em] mb-2.5">
              Timezone
            </div>
            <div className="flex items-center gap-3.5 px-[18px] py-[14px] bg-[var(--surface-raised)] border border-[var(--text-primary)] max-w-[520px]">
              <span className="font-mono text-[10px] text-[var(--text-tertiary)] tracking-[0.18em] uppercase w-20">
                Locale
              </span>
              <div>
                <div className="font-serif text-[17px] font-medium text-[var(--text-primary)]">Chicago — Central Time</div>
                <div className="font-mono text-[11px] text-[var(--text-tertiary)] mt-0.5 tracking-[0]">UTC−05:00 · auto-detected from workstation</div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* DOB */}
      <Section
        title="Date of birth — age computes itself."
        description="The DOB is the field; the age is the consequence. The age is set in serif because it reads as the patient's identity, not as data."
      >
        <DOBInput value={dob} onChange={setDob} />
      </Section>

      {/* Recurrence */}
      <Section
        title="Recurrence — written as a sentence."
        description="Medication schedules are sentences, not form fields. The clinician reads the order back to themselves; the system parses what they say."
      >
        <RecurrenceBuilder />
      </Section>

      {/* Duration */}
      <Section
        title="Duration — anticipated &amp; observed."
        description="For length of stay, infusion duration, visit length. Same line-field idiom; the unit reads as a small italic word."
      >
        <div className="flex gap-8 flex-wrap items-start">
          <DurationField
            label="Length of stay — anticipated"
            fields={[{ value: los, onChange: setLos, unit: 'days', width: 60 }]}
          />
          <DurationField
            label="Visit duration"
            fields={[
              { value: visitH, onChange: setVisitH, unit: 'h', width: 50 },
              { value: visitM, onChange: setVisitM, unit: 'min', width: 50 },
            ]}
          />
          <DurationField
            label="Infusion remaining"
            fields={[
              { value: infH, onChange: setInfH, unit: 'h', width: 60 },
              { value: infM, onChange: setInfM, unit: 'min', width: 60 },
            ]}
          />
        </div>
      </Section>
    </div>
  );
}
