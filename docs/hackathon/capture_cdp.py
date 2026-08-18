"""Capture Smart Profits demo screenshots via Chrome DevTools Protocol."""

from __future__ import annotations

import base64
import hashlib
import json
import os
import socket
import struct
import subprocess
import time
import urllib.request
from pathlib import Path

CHROME = Path(os.environ.get("CHROME_PATH", r"C:\Users\HP\AppData\Local\Google\Chrome\Application\chrome.exe"))
PORT = 9334
BASE = "http://localhost:3000"
OUT = Path(__file__).resolve().parent / "screenshots"
OUT.mkdir(exist_ok=True)
PROFILE = Path(__file__).resolve().parent / ".chrome-pitch-profile-2"
PROFILE.mkdir(exist_ok=True)


def ws_connect(url: str):
    # ws://127.0.0.1:9333/devtools/page/ID
    assert url.startswith("ws://")
    rest = url[5:]
    hostport, _, path = rest.partition("/")
    path = "/" + path
    host, _, port_s = hostport.partition(":")
    port = int(port_s or "80")
    key = base64.b64encode(os.urandom(16)).decode()
    sock = socket.create_connection((host, port), timeout=30)
    req = (
        f"GET {path} HTTP/1.1\r\n"
        f"Host: {host}:{port}\r\n"
        "Upgrade: websocket\r\n"
        "Connection: Upgrade\r\n"
        f"Sec-WebSocket-Key: {key}\r\n"
        "Sec-WebSocket-Version: 13\r\n"
        "\r\n"
    )
    sock.sendall(req.encode())
    buf = b""
    while b"\r\n\r\n" not in buf:
        buf += sock.recv(4096)
    expected = base64.b64encode(hashlib.sha1((key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").encode()).digest()).decode()
    if expected not in buf.decode(errors="ignore"):
        raise RuntimeError("websocket handshake failed")
    return sock


def ws_send(sock: socket.socket, payload: str):
    data = payload.encode()
    header = bytearray()
    header.append(0x81)
    n = len(data)
    mask = os.urandom(4)
    if n < 126:
        header.append(0x80 | n)
    elif n < 65536:
        header.append(0x80 | 126)
        header.extend(struct.pack(">H", n))
    else:
        header.append(0x80 | 127)
        header.extend(struct.pack(">Q", n))
    header.extend(mask)
    masked = bytes(b ^ mask[i % 4] for i, b in enumerate(data))
    sock.sendall(header + masked)


def ws_recv(sock: socket.socket) -> str:
    def read(n: int) -> bytes:
        buf = b""
        while len(buf) < n:
            chunk = sock.recv(n - len(buf))
            if not chunk:
                raise RuntimeError("socket closed")
            buf += chunk
        return buf

    while True:
        b1, b2 = read(2)
        opcode = b1 & 0x0F
        ln = b2 & 0x7F
        if ln == 126:
            ln = struct.unpack(">H", read(2))[0]
        elif ln == 127:
            ln = struct.unpack(">Q", read(8))[0]
        if b2 & 0x80:
            mask = read(4)
            data = bytes(b ^ mask[i % 4] for i, b in enumerate(read(ln)))
        else:
            data = read(ln)
        if opcode == 0x8:
            raise RuntimeError("websocket closed")
        if opcode in (0x9, 0xA, 0x2):
            continue
        if opcode == 0x1:
            return data.decode()
        return data.decode(errors="ignore")


class Cdp:
    def __init__(self, url: str):
        self.sock = ws_connect(url)
        self.i = 0

    def call(self, method: str, **params):
        self.i += 1
        mid = self.i
        ws_send(self.sock, json.dumps({"id": mid, "method": method, "params": params}))
        self.sock.settimeout(45)
        while True:
            try:
                raw = ws_recv(self.sock)
            except socket.timeout:
                raise RuntimeError(f"timeout waiting for {method}")
            if not raw:
                continue
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue
            if msg.get("id") == mid:
                if "error" in msg:
                    raise RuntimeError(msg["error"])
                return msg.get("result", {})

    def eval(self, expression: str):
        return self.call("Runtime.evaluate", expression=expression, awaitPromise=True, returnByValue=True)

    def screenshot(self, path: Path):
        raw = self.call("Page.captureScreenshot", format="png", fromSurface=True)["data"]
        path.write_bytes(base64.b64decode(raw))
        print("wrote", path.name)


def json_get(url: str):
    with urllib.request.urlopen(url, timeout=10) as r:
        return json.loads(r.read().decode())


def main():
    proc = subprocess.Popen(
        [
            str(CHROME),
            f"--remote-debugging-port={PORT}",
            f"--user-data-dir={PROFILE}",
            "--no-first-run",
            "--no-default-browser-check",
            "--disable-gpu",
            "--window-size=1440,900",
            "about:blank",
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    try:
        targets = None
        for _ in range(40):
            try:
                targets = json_get(f"http://127.0.0.1:{PORT}/json/list")
                if targets:
                    break
            except Exception:
                time.sleep(0.25)
        if not targets:
            raise RuntimeError("Chrome DevTools did not start")
        page = next((t for t in targets if t.get("type") == "page" and t.get("webSocketDebuggerUrl")), targets[0])
        cdp = Cdp(page["webSocketDebuggerUrl"])
        cdp.call("Page.enable")
        cdp.call("Runtime.enable")
        cdp.call(
            "Emulation.setDeviceMetricsOverride",
            width=1440,
            height=900,
            deviceScaleFactor=1,
            mobile=False,
        )

        def goto(url: str):
            cdp.eval(f"window.location.href = {url!r}")
            time.sleep(4.5)
            cdp.eval("document.readyState")

        goto(f"{BASE}/register")
        cdp.eval(
            """(() => {
              localStorage.setItem('smartprofit-locale', 'en');
              localStorage.setItem('smartprofit-theme', 'dark');
            })()"""
        )
        goto(f"{BASE}/register")
        time.sleep(1.5)
        cdp.screenshot(OUT / "01-register.png")

        email = f"pitch.demo.{int(time.time())}@smartprofits.dev"
        cdp.eval(
            f"""(() => {{
              const fill = (id, v) => {{
                const el = document.getElementById(id);
                if (!el) return;
                const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
                setter.call(el, v);
                el.dispatchEvent(new Event('input', {{ bubbles: true }}));
                el.dispatchEvent(new Event('change', {{ bubbles: true }}));
              }};
              fill('fullName', 'Israa Hamad');
              fill('storeName', 'Gaza Home Store');
              fill('email', {email!r});
              fill('password', 'hackathon2026');
              const box = document.querySelector('input[type="checkbox"]');
              if (box && !box.checked) box.click();
              const btn = document.querySelector('button[type="submit"]');
              if (btn) btn.click();
            }})()"""
        )
        time.sleep(5)
        cdp.screenshot(OUT / "02-dashboard.png")

        for path, name in [
            ("/advisor", "03-advisor.png"),
            ("/data", "04-data.png"),
            ("/simulator", "05-simulator.png"),
            ("/ask", "06-ask.png"),
        ]:
            try:
                goto(f"{BASE}{path}")
                cdp.screenshot(OUT / name)
            except Exception as exc:
                print("skip", name, exc)
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except Exception:
            proc.kill()


if __name__ == "__main__":
    main()
