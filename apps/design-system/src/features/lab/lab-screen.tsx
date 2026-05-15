import { useState } from 'react';
import { Section } from '@features/shell/parts/preview-canvas';
import { LabSpotlight, LabPanel, LabRow, LabTrendChart } from '@ui/lab';

export function LabScreen() {
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <div>
      {/* Critical spotlight */}
      <Section
        title="Critical value spotlight."
        description="A framed specimen of a single critical lab value. Six-pixel bleeding edge, big mono number, acknowledge workflow."
      >
        <LabSpotlight
          name="Troponin I"
          subtitle="cardiac biomarker — repeat draw at 14:42"
          value="2.10"
          unit="ng/mL"
          refRange="reference range 0.00 – 0.04 ng/mL"
          criticalNote="52× upper limit"
          entries={[
            { label: 'Initial draw', value: '06:14 · 0.04 ng/mL — within range', flag: 'normal' },
            { label: 'Repeat — 6 hours', value: '14:08 · 1.22 ng/mL — flagged H', flag: 'h' },
            { label: 'Now — auto-repeat', value: '14:42 · 2.10 ng/mL — critical', flag: 'crit' },
          ]}
          chartPoints={[
            { time: '06:14', value: 0.04, flag: 'normal' },
            { time: '14:08', value: 1.22, flag: 'h' },
            { time: '14:42', value: 2.10, flag: 'crit' },
          ]}
          refLine={0.04}
          acknowledged={acknowledged}
          onAcknowledge={() => setAcknowledged(true)}
        />
      </Section>

      {/* BMP Panel */}
      <Section
        title="Lab panel — typeset rows."
        description="Each lab row is treated as typeset, not tabular: a big mono number, unit small to its right, and a marker on a hairline where the value sits within range."
      >
        <LabPanel title="Basic metabolic panel" lot="BMP · LIS-29384" meta="collected 06:14 · resulted 06:38">
          <LabRow
            name="Sodium" alt="Na"
            ordinal="04/30 06:38"
            value="138" unit="mEq/L"
            flag="normal"
            rangeBar={{ low: 135, high: 145, markerPct: 30, okLeft: '0%', okRight: '0%', flag: 'normal' }}
          />
          <LabRow
            name="Potassium" alt="K"
            ordinal="04/30 06:38 · ↑ from 4.6"
            value="5.4" unit="mEq/L"
            flag="h"
            rangeBar={{ low: 3.5, high: 5.0, markerPct: 88, okLeft: '0%', okRight: '33%', flag: 'h' }}
          />
          <LabRow
            name="BUN"
            ordinal="04/30 06:38"
            value="22" unit="mg/dL"
            flag="h"
            rangeBar={{ low: 7, high: 20, markerPct: 78, okLeft: '0%', okRight: '30%', flag: 'h' }}
          />
          <LabRow
            name="Creatinine"
            ordinal="04/30 06:38"
            value="0.9" unit="mg/dL"
            flag="normal"
            rangeBar={{ low: 0.6, high: 1.3, markerPct: 42, okLeft: '0%', okRight: '0%', flag: 'normal' }}
          />
          <LabRow
            name="Glucose · random"
            ordinal="04/30 06:38 · ↑ from 248"
            value="312" unit="mg/dL"
            flag="crit"
            rangeBar={{ low: 70, high: 140, markerPct: 96, okLeft: '0%', okRight: '50%', flag: 'crit' }}
          />
          <LabRow
            name="Calcium" alt="Ca"
            ordinal="04/30 06:38"
            value="9.4" unit="mg/dL"
            flag="normal"
            rangeBar={{ low: 8.5, high: 10.5, markerPct: 46, okLeft: '0%', okRight: '0%', flag: 'normal' }}
          />
        </LabPanel>

        {/* CBC Panel */}
        <LabPanel title={<>Complete blood count <span className="text-[var(--text-tertiary)] italic font-normal">— with diff</span></>} lot="CBC-D · LIS-29385" meta="collected 06:14">
          <LabRow
            name="White blood cells" alt="WBC"
            ordinal="04/30 06:38"
            value="7.8" unit="×10³/µL"
            flag="normal"
            rangeBar={{ low: 4.0, high: 11.0, markerPct: 54, okLeft: '0%', okRight: '0%', flag: 'normal' }}
          />
          <LabRow
            name="Red blood cells" alt="RBC"
            ordinal="04/30 06:38"
            value="3.4" unit="×10⁶/µL"
            flag="l"
            rangeBar={{ low: 4.0, high: 5.5, markerPct: 14, okLeft: '60%', okRight: '0%', flag: 'l' }}
          />
          <LabRow
            name="Hemoglobin" alt="Hgb"
            ordinal="04/30 06:38 · ↓ from 11.4"
            value="10.1" unit="g/dL"
            flag="l"
            rangeBar={{ low: 12.0, high: 17.5, markerPct: 8, okLeft: '60%', okRight: '0%', flag: 'l' }}
          />
          <LabRow
            name="Hematocrit" alt="Hct"
            ordinal="04/30 06:38"
            value="31.2" unit="%"
            flag="l"
            rangeBar={{ low: 36, high: 48, markerPct: 18, okLeft: '60%', okRight: '0%', flag: 'l' }}
          />
          <LabRow
            name="MCV"
            ordinal="04/30 06:38"
            value="88" unit="fL"
            flag="normal"
            rangeBar={{ low: 80, high: 100, markerPct: 48, okLeft: '0%', okRight: '0%', flag: 'normal' }}
          />
          <LabRow
            name="Platelets" alt="PLT"
            ordinal="04/30 06:38"
            value="142" unit="×10³/µL"
            flag="l"
            rangeBar={{ low: 150, high: 450, markerPct: 6, okLeft: '60%', okRight: '0%', flag: 'l' }}
          />
        </LabPanel>
      </Section>

      {/* Trend chart */}
      <Section
        title="Trend chart — 7 days."
        description="A dated chart with a target band. Points color-coded by status: green within range, amber flagged, red critical."
      >
        <LabPanel title="Glucose — last seven days" lot="trend · 7 d" meta="target 70 – 140 mg/dL fasting">
          <LabTrendChart
            points={[
              { label: '04/24', value: 128, flag: 'normal' },
              { label: '04/25', value: 136, flag: 'normal' },
              { label: '04/26', value: 152, flag: 'normal' },
              { label: '04/27', value: 181, flag: 'normal' },
              { label: '04/28', value: 226, flag: 'h' },
              { label: '04/29', value: 268, flag: 'h' },
              { label: '04/30', value: 312, flag: 'crit' },
            ]}
            targetLow={70}
            targetHigh={140}
            targetLabel="target band 70–140"
            yLabels={[
              { value: 350, label: '350' },
              { value: 140, label: '140' },
              { value: 70, label: '70' },
            ]}
            unit="mg/dL"
          />
        </LabPanel>
      </Section>
    </div>
  );
}
