// Polar Flows -> Broker Portal content script
// Activates on *.timesheetportal.com pages.
// Reads clipboard data written by the "Copy for broker" button in PolarFlows
// and fills in the daily hours inputs on the timesheet.

(function () {
  'use strict';

  // Only activate if the timesheet table is present
  if (!document.querySelector('table.tsEntry')) return;

  // - Inject button -
  const btn = document.createElement('button');
  btn.id        = 'pf-fill-btn';
  btn.className = 'tspButton';
  btn.textContent = 'Fill from Polar Flows';
  btn.style.cssText = [
    'position:fixed',
    'top:12px',
    'right:16px',
    'z-index:9999',
    'cursor:pointer',
    'font-size:0.85rem',
    'padding:0.35rem 0.9rem',
    'background:#012d75',
    'color:#fff',
    'border:none',
    'border-radius:4px',
    'box-shadow:0 2px 8px rgba(0,0,0,0.25)',
  ].join(';');

  document.body.appendChild(btn);

  // - Fill logic -
  btn.addEventListener('click', async () => {
    let text;
    try {
      text = await navigator.clipboard.readText();
    } catch {
      alert('Could not read clipboard. Make sure you clicked "Copy for broker" in Polar Flows first.');
      return;
    }

    let entries;
    try {
      entries = JSON.parse(text);
      if (!Array.isArray(entries) || !entries[0]?.date) throw new Error();
    } catch {
      alert('Clipboard does not contain valid Polar Flows broker data.\nClick "Copy for broker" in Polar Flows first.');
      return;
    }

    // Discover the row index from the first existing input
    const firstInput = document.querySelector('input[id^="ctlEnd_"]');
    if (!firstInput) {
      alert('Could not find timesheet inputs on this page.');
      return;
    }
    // ID format: ctlEnd_{rowIdx}_{dayIndex}_0
    const rowIdx = firstInput.id.split('_')[1];

    let filled = 0;
    let skipped = 0;

    for (const { date, hours } of entries) {
      const d = new Date(date + 'T00:00:00Z');
      const dayIndex = d.getUTCDate() - 1; // 0-based
      const input = document.getElementById(`ctlEnd_${rowIdx}_${dayIndex}_0`);

      if (!input) {
        // Day not visible in the current month view — wrong month open?
        skipped++;
        continue;
      }

      input.value = toHHMM(hours);

      // Trigger the portal's onblur handler (ASP.NET UpdatePanel)
      input.focus();
      input.blur();

      await delay(150); // give UpdatePanel time to process
      filled++;
    }

    // Feedback
    const orig = btn.textContent;
    if (skipped > 0 && filled === 0) {
      btn.textContent = `[!] No matching days found — is the correct month open?`;
    } else if (skipped > 0) {
      btn.textContent = `Done [ok] (${filled} filled, ${skipped} skipped)`;
    } else {
      btn.textContent = `Done [ok] ${filled} days filled`;
    }
    setTimeout(() => { btn.textContent = orig; }, 4000);
  });

  // - Helpers -
  function toHHMM(decimal) {
    const h = Math.floor(decimal);
    const m = Math.round((decimal - h) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
})();
