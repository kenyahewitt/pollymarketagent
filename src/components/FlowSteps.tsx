interface Props {
  connected: boolean;
  funded: boolean;
  active: boolean;
}

export function FlowSteps({ connected, funded, active }: Props) {
  const steps = [
    { n: 1, label: 'Connect wallet', done: connected },
    { n: 2, label: 'Fund agent wallet', done: funded },
    { n: 3, label: 'Activate auto sniper', done: active },
  ];

  return (
    <div className="panel panel-pad" style={{ marginBottom: '1rem' }}>
      <div className="row" style={{ justifyContent: 'space-between', gap: '1rem' }}>
        {steps.map((s, i) => (
          <div key={s.n} className="row" style={{ flex: 1 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 800,
                background: s.done
                  ? 'rgba(52, 211, 153, 0.2)'
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${s.done ? 'rgba(52,211,153,0.5)' : 'var(--border)'}`,
                color: s.done ? 'var(--success)' : 'var(--text-muted)',
              }}
            >
              {s.done ? '✓' : s.n}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{s.label}</div>
              <div className="dim" style={{ fontSize: '0.75rem' }}>
                {s.done ? 'Complete' : 'Pending'}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: 'var(--border)',
                  marginLeft: 8,
                  minWidth: 24,
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
