import { Terminal } from '../packages/ui/src/Terminal.js';
import { FitAddon, SearchAddon, WebLinksAddon } from '../packages/ui/src/addons/xterm-compat.js';

const THEMES = {
  termax: {
    background: '#0f1217',
    foreground: '#e6edf3',
    cursor: '#58a6ff',
    selectionBackground: 'rgba(88, 166, 255, 0.3)',
    black: '#0f1217',
    red: '#ff7b72',
    green: '#3fb950',
    yellow: '#d29922',
    blue: '#58a6ff',
    magenta: '#bc8cff',
    cyan: '#39c5cf',
    white: '#f0f6fc',
  },
  'tokyo-night': {
    background: '#1a1b26',
    foreground: '#a9b1d6',
    cursor: '#c0caf5',
    selectionBackground: 'rgba(122, 162, 247, 0.3)',
    black: '#15161e',
    red: '#f7768e',
    green: '#9ece6a',
    yellow: '#e0af68',
    blue: '#7aa2f7',
    magenta: '#bb9af7',
    cyan: '#7dcfff',
    white: '#c0caf5',
  },
  nord: {
    background: '#2e3440',
    foreground: '#d8dee9',
    cursor: '#88c0d0',
    selectionBackground: 'rgba(136, 192, 208, 0.3)',
    black: '#2e3440',
    red: '#bf616a',
    green: '#a3be8c',
    yellow: '#ebcb8b',
    blue: '#81a1c1',
    magenta: '#b48ead',
    cyan: '#88c0d0',
    white: '#e5e9f0',
  },
  catppuccin: {
    background: '#1e1e2e',
    foreground: '#cdd6f4',
    cursor: '#f5e0dc',
    selectionBackground: 'rgba(137, 180, 250, 0.3)',
    black: '#181825',
    red: '#f38ba8',
    green: '#a6e3a1',
    yellow: '#f9e2af',
    blue: '#89b4fa',
    magenta: '#f5c2e7',
    cyan: '#94e2d5',
    white: '#cdd6f4',
  },
};

const terminal = new Terminal({
  cols: 80,
  rows: 24,
  theme: THEMES.termax,
  fontFamily: 'monospace',
  fontSize: 14,
});

const fitAddon = new FitAddon();
const searchAddon = new SearchAddon();
const webLinksAddon = new WebLinksAddon((_e, uri) => {
  window.open(uri, '_blank');
});

terminal.loadAddon(fitAddon);
terminal.loadAddon(searchAddon);
terminal.loadAddon(webLinksAddon);

const container = document.getElementById('terminal-container');
terminal.open(container);
fitAddon.fit();

// Simulated Interactive Shell
class SimulatedShell {
  constructor(term) {
    this.term = term;
    this.inputBuffer = '';
    this.prompt = '\x1b[1;36m➜\x1b[0m \x1b[1;34m~/termaxui\x1b[0m \x1b[1;32m(main)\x1b[0m $ ';
    this.matrixRunning = false;

    this.term.onData((data) => {
      this.handleInput(data);
    });

    this.initBanner();
  }

  initBanner() {
    this.term.writeln('\x1b[1;35mTermaxUI Native Engine Demo\x1b[0m — Dual-Target Terminal Emulator');
    this.term.writeln('Type \x1b[1;33mhelp\x1b[0m to view commands or click toolbar actions above.\r\n');
    this.term.write(this.prompt);
  }

  handleInput(data) {
    if (this.matrixRunning) {
      this.matrixRunning = false;
      this.term.write('\r\n' + this.prompt);
      return;
    }

    if (data === '\r') {
      this.term.write('\r\n');
      const cmd = this.inputBuffer.trim();
      this.inputBuffer = '';
      this.executeCommand(cmd);
    } else if (data === '\x7f' || data === '\b') {
      if (this.inputBuffer.length > 0) {
        this.inputBuffer = this.inputBuffer.slice(0, -1);
        this.term.write('\b \b');
      }
    } else if (data === '\x03') {
      // Ctrl+C
      this.inputBuffer = '';
      this.term.write('^C\r\n' + this.prompt);
    } else if (data.length === 1 && data >= ' ') {
      this.inputBuffer += data;
      this.term.write(data);
    } else if (data.startsWith('\x1b[200~')) {
      // Bracketed paste
      const pasted = data.slice(6, -6);
      this.inputBuffer += pasted;
      this.term.write(pasted);
    }
  }

  executeCommand(cmd) {
    const [name, ...args] = cmd.split(' ');
    switch (name) {
      case 'help':
        this.term.writeln('Available commands:');
        this.term.writeln('  \x1b[1;32mneofetch\x1b[0m     Display system and engine specs');
        this.term.writeln('  \x1b[1;32mcolors\x1b[0m       Test 16 ANSI colors and 24-bit TrueColor spectrum');
        this.term.writeln('  \x1b[1;32mmatrix\x1b[0m       Run 60 FPS falling digital rain throughput test');
        this.term.writeln('  \x1b[1;32mlinks\x1b[0m        Display clickable URLs and path hyperlinks');
        this.term.writeln('  \x1b[1;32magent\x1b[0m        Simulate AI agent notification and progress stream');
        this.term.writeln('  \x1b[1;32mclear\x1b[0m        Clear the terminal display');
        this.term.write(this.prompt);
        break;

      case 'neofetch':
        this.sendNeofetch();
        break;

      case 'colors':
        this.sendColorTest();
        break;

      case 'matrix':
        this.startMatrix();
        break;

      case 'links':
        this.term.writeln('Hyperlinks (Cmd+Click / Ctrl+Click to follow):');
        this.term.writeln('  Repository: \x1b[1;34mhttps://github.com/cmdworks/termax\x1b[0m');
        this.term.writeln('  Engine:     \x1b[1;34mhttps://github.com/cmdworks/termaxui\x1b[0m');
        this.term.writeln('  Local:      \x1b[1;34mhttp://localhost:3000\x1b[0m');
        this.term.write(this.prompt);
        break;

      case 'agent':
        this.sendAgentDemo();
        break;

      case 'clear':
        this.term.clear();
        this.term.write(this.prompt);
        break;

      case '':
        this.term.write(this.prompt);
        break;

      default:
        this.term.writeln(`zsh: command not found: ${name}`);
        this.term.write(this.prompt);
        break;
    }
  }

  sendNeofetch() {
    const info = [
      '  \x1b[1;34m.---.  \x1b[0m   \x1b[1;36mas@termaxui\x1b[0m',
      ' \x1b[1;34m/     \\ \x1b[0m   ------------',
      ' \x1b[1;34m| () () |\x1b[0m   \x1b[1;32mOS\x1b[0m: WebAssembly / macOS (ARM64)',
      '  \x1b[1;34m\\  _  /\x1b[0m    \x1b[1;32mEngine\x1b[0m: termaxui-core v0.1.0 (pure VT + Canvas)',
      '   \x1b[1;34m`---\'\x1b[0m     \x1b[1;32mRenderer\x1b[0m: Retina Canvas 2D + Selection & Links',
      '             \x1b[1;32mDiff Engine\x1b[0m: TMX1 Binary Protocol',
      '             \x1b[1;32mThroughput\x1b[0m: ~850 MB/s (10x xterm.js)',
      ''
    ].join('\r\n');
    this.term.writeln(info);
    this.term.write(this.prompt);
  }

  sendColorTest() {
    this.term.writeln('\x1b[1mStandard 16 Colors:\x1b[0m');
    let out = ' ';
    for (let i = 0; i < 8; i++) out += `\x1b[48;5;${i}m  \x1b[0m`;
    out += '\r\n ';
    for (let i = 8; i < 16; i++) out += `\x1b[48;5;${i}m  \x1b[0m`;
    this.term.writeln(out);

    this.term.writeln('\r\n\x1b[1m24-bit TrueColor RGB Spectrum:\x1b[0m');
    let grad = ' ';
    for (let r = 0; r < 256; r += 6) {
      grad += `\x1b[48;2;${r};${Math.floor(r / 2)};255m \x1b[0m`;
    }
    this.term.writeln(grad);
    this.term.write(this.prompt);
  }

  startMatrix() {
    this.matrixRunning = true;
    this.term.clear();
    const cols = this.term.cols;
    const drops = new Array(cols).fill(0);
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオカキクケコサシスセソタチツテト';

    const interval = setInterval(() => {
      if (!this.matrixRunning) {
        clearInterval(interval);
        return;
      }
      let frame = '';
      for (let i = 0; i < 8; i++) {
        const c = Math.floor(Math.random() * cols);
        const r = drops[c];
        const ch = chars[Math.floor(Math.random() * chars.length)];
        frame += `\x1b[${r + 1};${c + 1}H\x1b[1;32m${ch}\x1b[0m`;
        drops[c] = (drops[c] + 1) % this.term.rows;
      }
      this.term.write(frame);
    }, 30);
  }

  sendAgentDemo() {
    this.term.writeln('\x1b]777;notify;Termax;working\x07\x1b[1;33m[Agent]\x1b[0m Claude Code analyzing AST in 162 languages...');
    setTimeout(() => {
      this.term.writeln('Found 6,951 knowledge nodes and 26,353 call edges in knowledge graph.');
      this.term.writeln('\x1b]777;notify;Termax;finished\x07\x1b[1;32m[Agent]\x1b[0m Task completed successfully.\r\n');
      this.term.write(this.prompt);
    }, 400);
  }
}

const shell = new SimulatedShell(terminal);

// Toolbar buttons
document.getElementById('select-theme')?.addEventListener('change', (e) => {
  const themeKey = e.target.value;
  if (THEMES[themeKey]) {
    terminal.updateTheme(THEMES[themeKey]);
  }
});

document.getElementById('btn-clear')?.addEventListener('click', () => {
  shell.executeCommand('clear');
});

document.getElementById('btn-sample-sgr')?.addEventListener('click', () => {
  shell.executeCommand('colors');
});

document.getElementById('btn-sample-agent')?.addEventListener('click', () => {
  shell.executeCommand('agent');
});

window.addEventListener('resize', () => {
  fitAddon.fit();
});

document.getElementById('btn-sample-fast')?.addEventListener('click', () => {
  shell.executeCommand('matrix');
});
