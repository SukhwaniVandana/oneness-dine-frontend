import React, { useState, useEffect } from 'react';

const BRANDS = ['EPSON', 'STAR', 'CITIZEN'];
const CONNECTION_TYPES = ['USB', 'BLUETOOTH', 'LAN', 'WIFI'];
const PAPER_WIDTHS = [
  { value: '80', label: '80mm (48 chars)' },
  { value: '58', label: '58mm (32 chars)' },
];

const ADDRESS_HINTS = {
  USB:       'Windows printer name — e.g. POS80 Printer  (from wmic printer get Name)',
  BLUETOOTH: 'COM port — e.g. COM10  (check Bluetooth Settings → COM Ports)',
  LAN:       'Printer IP — e.g. 192.168.1.100  (port 9100 used by default)',
  WIFI:      'Printer IP — e.g. 192.168.1.101  (port 9100 used by default)',
};

export default function PrinterSettings() {
  const [config, setConfig] = useState({
    brand:          'EPSON',
    connectionType: 'USB',
    address:        '',
    paperWidth:     '80',
    timeout:        5000,
  });
  const [saving,  setSaving]  = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text }

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getPrinterConfig().then(saved => {
        if (saved) setConfig(prev => ({ ...prev, ...saved }));
      });
    }
  }, []);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!config.address.trim()) {
      showMsg('error', 'Please enter a printer address / COM port');
      return;
    }
    setSaving(true);
    try {
      await window.electronAPI.setPrinterConfig(config);
      showMsg('success', 'Settings saved successfully');
    } catch (err) {
      showMsg('error', `Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!config.address.trim()) {
      showMsg('error', 'Please enter and save printer address first');
      return;
    }
    setTesting(true);
    setMessage(null);
    try {
      // Save first, then test
      await window.electronAPI.setPrinterConfig(config);
      const result = await window.electronAPI.testPrinter();
      if (result.success) {
        showMsg('success', 'Test print sent! Check your printer.');
      } else {
        showMsg('error', `Print failed: ${result.error || 'Unknown error'}`);
      }
    } catch (err) {
      showMsg('error', `Error: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  const isLanWifi = config.connectionType === 'LAN' || config.connectionType === 'WIFI';

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>🖨️ Printer Configuration</h3>

      {/* Brand */}
      <Row label="Printer Brand" hint="ESC/POS compatible thermal printer">
        <select style={styles.select} value={config.brand}
          onChange={e => handleChange('brand', e.target.value)}>
          {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </Row>

      {/* Paper Width */}
      <Row label="Paper Width" hint="Physical roll width">
        <select style={styles.select} value={config.paperWidth}
          onChange={e => handleChange('paperWidth', e.target.value)}>
          {PAPER_WIDTHS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </Row>

      {/* Connection Type */}
      <Row label="Connection Type" hint="How is the printer connected?">
        <div style={styles.toggleGroup}>
          {CONNECTION_TYPES.map(type => (
            <button key={type} style={{
              ...styles.toggleBtn,
              ...(config.connectionType === type ? styles.toggleActive : {})
            }} onClick={() => handleChange('connectionType', type)}>
              {type}
            </button>
          ))}
        </div>
      </Row>

      {/* Address */}
      <Row
        label={isLanWifi ? 'IP Address' : 'COM Port'}
        hint={ADDRESS_HINTS[config.connectionType]}
      >
        <input
          style={styles.input}
          value={config.address}
          onChange={e => handleChange('address', e.target.value)}
          placeholder={isLanWifi ? '192.168.1.100' : 'POS80 Printer'}
        />
      </Row>

      {/* Timeout */}
      <Row label="Timeout (ms)" hint="Max wait for printer response">
        <input
          style={{ ...styles.input, width: '120px' }}
          type="number"
          value={config.timeout}
          onChange={e => handleChange('timeout', Number(e.target.value))}
          min={1000} max={15000} step={500}
        />
      </Row>

      {/* Message */}
      {message && (
        <div style={{
          ...styles.message,
          background: message.type === 'success' ? '#1a3a2a' : '#3a1a1a',
          borderColor: message.type === 'success' ? '#4caf50' : '#f44336',
          color:       message.type === 'success' ? '#4caf50' : '#f44336',
        }}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      {/* Actions */}
      <div style={styles.actions}>
        <button style={styles.btnSave} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : '✓ Save Settings'}
        </button>
        <button style={styles.btnTest} onClick={handleTest} disabled={testing}>
          {testing ? 'Printing...' : '🖨 Test Print'}
        </button>
      </div>

      {/* Help */}
      <div style={styles.help}>
        <p style={styles.helpTitle}>How to find your COM port:</p>
        <p style={styles.helpText}>
          <b>USB:</b> Connect printer → Device Manager → Ports (COM &amp; LPT) → look for new entry<br />
          <b>Bluetooth:</b> Pair printer → Control Panel → Bluetooth Settings → COM Ports tab → Outgoing port<br />
          <b>LAN/WiFi:</b> Print a self-test page from printer (hold feed button) — IP is printed on it
        </p>
      </div>
    </div>
  );
}

function Row({ label, hint, children }) {
  return (
    <div style={styles.row}>
      <div style={styles.rowLabel}>
        <span style={styles.labelText}>{label}</span>
        {hint && <span style={styles.hintText}>{hint}</span>}
      </div>
      <div style={styles.rowControl}>{children}</div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────
const styles = {
  container: {
    background: '#161b25',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '700px',
  },
  title: {
    color: '#f5a623',
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '24px',
  },
  row: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: '16px 0',
    borderBottom: '1px solid #1e2535',
    gap: '24px',
  },
  rowLabel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  labelText: { color: '#e0e0e0', fontSize: '14px', fontWeight: 500 },
  hintText:  { color: '#6b7a99', fontSize: '12px' },
  rowControl: { flex: 1, display: 'flex', justifyContent: 'flex-end' },
  select: {
    background: '#1e2535',
    border: '1px solid #2a3650',
    color: '#e0e0e0',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '14px',
    width: '220px',
    cursor: 'pointer',
  },
  input: {
    background: '#1e2535',
    border: '1px solid #2a3650',
    color: '#e0e0e0',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '14px',
    width: '220px',
  },
  toggleGroup: { display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' },
  toggleBtn: {
    background: '#1e2535',
    border: '1px solid #2a3650',
    color: '#6b7a99',
    borderRadius: '6px',
    padding: '6px 14px',
    fontSize: '13px',
    cursor: 'pointer',
    fontWeight: 500,
  },
  toggleActive: {
    background: '#f5a62320',
    border: '1px solid #f5a623',
    color: '#f5a623',
  },
  message: {
    marginTop: '16px',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid',
    fontSize: '14px',
    fontWeight: 500,
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
  },
  btnSave: {
    background: '#f5a623',
    color: '#0d0f14',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  btnTest: {
    background: '#1e2535',
    color: '#e0e0e0',
    border: '1px solid #2a3650',
    borderRadius: '8px',
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  help: {
    marginTop: '24px',
    background: '#1e2535',
    borderRadius: '8px',
    padding: '16px',
  },
  helpTitle: { color: '#f5a623', fontSize: '13px', fontWeight: 600, marginBottom: '8px' },
  helpText:  { color: '#6b7a99', fontSize: '12px', lineHeight: '1.8' },
};
