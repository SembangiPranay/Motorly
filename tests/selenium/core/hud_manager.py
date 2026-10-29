import time
from typing import Optional
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.remote.webelement import WebElement

HUD_CSS = """
#selenium-glass-hud {
    position: fixed;
    top: 20px;
    right: 20px;
    width: 320px;
    background: rgba(10, 15, 29, 0.92);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(6, 182, 212, 0.6);
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.65), 0 0 20px rgba(6, 182, 212, 0.25);
    border-radius: 12px;
    padding: 14px 18px;
    color: #e2e8f0;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    line-height: 1.5;
    z-index: 2147483647;
    pointer-events: none;
    user-select: none;
    transition: all 0.25s ease;
}

#selenium-glass-hud .hud-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 8px;
    margin-bottom: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

#selenium-glass-hud .hud-title {
    font-weight: 700;
    color: #38bdf8;
    letter-spacing: 0.05em;
    display: flex;
    align-items: center;
    gap: 6px;
}

#selenium-glass-hud .hud-badge {
    padding: 2px 8px;
    border-radius: 9999px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.05em;
    background: rgba(34, 197, 94, 0.2);
    color: #4ade80;
    border: 1px solid rgba(34, 197, 94, 0.4);
}

#selenium-glass-hud .hud-badge.failed {
    background: rgba(239, 68, 68, 0.2);
    color: #f87171;
    border-color: rgba(239, 68, 68, 0.5);
}

#selenium-glass-hud .hud-row {
    margin-bottom: 6px;
    word-break: break-word;
}

#selenium-glass-hud .hud-label {
    color: #94a3b8;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    display: block;
}

#selenium-glass-hud .hud-value {
    color: #f8fafc;
    font-weight: 600;
}

#selenium-glass-hud .hud-action {
    color: #facc15;
    font-weight: 600;
}

#selenium-glass-hud .hud-telemetry {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    font-size: 11px;
}

#selenium-glass-hud .hud-stat {
    color: #38bdf8;
}
"""

class GlassCockpitHUD:
    """Controls the visible on-screen HUD and visual interaction highlights during test runs."""

    def __init__(self, driver: WebDriver, slowmo_ms: int = 350):
        self.driver = driver
        self.slowmo_ms = slowmo_ms
        self.action_count = 0
        self.current_test = "Initializing..."
        self.inject_hud()

    def inject_hud(self):
        """Ensures the HUD container and CSS are injected into the DOM."""
        script = f"""
        if (!document.getElementById('selenium-glass-hud-style')) {{
            const style = document.createElement('style');
            style.id = 'selenium-glass-hud-style';
            style.innerHTML = `{HUD_CSS}`;
            document.head.appendChild(style);
        }}
        if (!document.getElementById('selenium-glass-hud')) {{
            const hud = document.createElement('div');
            hud.id = 'selenium-glass-hud';
            hud.innerHTML = `
                <div class="hud-header">
                    <span class="hud-title">🛰️ DRIVE-RENT WATCHER</span>
                    <span id="hud-badge-status" class="hud-badge">LIVE</span>
                </div>
                <div class="hud-row">
                    <span class="hud-label">Test Case</span>
                    <span id="hud-test-val" class="hud-value">{self.current_test}</span>
                </div>
                <div class="hud-row">
                    <span class="hud-label">Current Step</span>
                    <span id="hud-action-val" class="hud-action">Ready</span>
                </div>
                <div class="hud-telemetry">
                    <div><span class="hud-label">Actions</span><span id="hud-count-val" class="hud-stat">#0</span></div>
                    <div><span class="hud-label">API Status</span><span id="hud-api-val" class="hud-stat">Watching...</span></div>
                    <div><span class="hud-label">Console</span><span id="hud-console-val" class="hud-stat" style="color: #4ade80;">Clean</span></div>
                </div>
            `;
            document.body.appendChild(hud);
        }}
        """
        try:
            self.driver.execute_script(script)
        except Exception:
            pass

    def set_test_name(self, test_name: str):
        """Updates the active test name on the HUD."""
        self.current_test = test_name
        self.inject_hud()
        try:
            self.driver.execute_script(
                "const el = document.getElementById('hud-test-val'); if(el) el.innerText = arguments[0];",
                test_name
            )
        except Exception:
            pass

    def record_step(self, description: str, api_status: Optional[str] = None, failed: bool = False):
        """Updates the step description and telemetry."""
        self.action_count += 1
        self.inject_hud()
        try:
            self.driver.execute_script(
                """
                const actEl = document.getElementById('hud-action-val');
                const cntEl = document.getElementById('hud-count-val');
                const apiEl = document.getElementById('hud-api-val');
                const bdgEl = document.getElementById('hud-badge-status');
                if (actEl) actEl.innerText = arguments[0];
                if (cntEl) cntEl.innerText = '#' + arguments[1];
                if (apiEl && arguments[2]) apiEl.innerText = arguments[2];
                if (bdgEl && arguments[3]) {
                    bdgEl.innerText = 'FAIL';
                    bdgEl.className = 'hud-badge failed';
                }
                """,
                description, self.action_count, api_status, failed
            )
        except Exception:
            pass

    def highlight_element(self, element: WebElement, action_type: str = "click", description: str = ""):
        """Smoothly brings the element to center view, draws an animated glowing halo, and pauses for observation."""
        self.record_step(description or f"{action_type.capitalize()} on element")

        # Color palette: Cyan for clicks, Amber for inputs, Emerald for assertions
        glow_color = "#06b6d4" if action_type == "click" else ("#f59e0b" if action_type == "type" else "#10b981")

        pulse_script = f"""
        const el = arguments[0];
        try {{
            el.scrollIntoView({{ behavior: 'smooth', block: 'center', inline: 'center' }});
        }} catch(e) {{}}

        const origOutline = el.style.outline;
        const origBoxShadow = el.style.boxShadow;
        const origTransition = el.style.transition;

        el.style.transition = 'all 0.15s ease-out';
        el.style.outline = '3px solid {glow_color}';
        el.style.boxShadow = '0 0 20px {glow_color}, inset 0 0 8px {glow_color}';

        setTimeout(() => {{
            el.style.outline = origOutline;
            el.style.boxShadow = origBoxShadow;
            el.style.transition = origTransition;
        }}, arguments[1]);
        """
        try:
            self.driver.execute_script(pulse_script, element, max(self.slowmo_ms, 250))
        except Exception:
            pass

        if self.slowmo_ms > 0:
            time.sleep(self.slowmo_ms / 1000.0)

    def mark_pass(self, test_name: str = ""):
        """Visually celebrates test pass on the HUD."""
        self.inject_hud()
        try:
            self.driver.execute_script(
                """
                const bdgEl = document.getElementById('hud-badge-status');
                const actEl = document.getElementById('hud-action-val');
                if (bdgEl) {
                    bdgEl.innerText = 'PASS ✓';
                    bdgEl.style.background = 'rgba(34, 197, 94, 0.4)';
                }
                if (actEl) actEl.innerText = 'All Assertions Passed!';
                """
            )
            time.sleep(0.4)
        except Exception:
            pass
