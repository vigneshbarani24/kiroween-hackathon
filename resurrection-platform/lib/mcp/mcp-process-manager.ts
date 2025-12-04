/**
 * MCP Process Manager
 * 
 * Manages the lifecycle of MCP server processes:
 * - Starts MCP servers as child processes
 * - Monitors health and restarts on failure
 * - Provides graceful shutdown
 * 
 * This ensures MCP servers are running before clients try to connect.
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

export interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  cwd?: string;
  autoRestart?: boolean;
  maxRestarts?: number;
}

export interface MCPServerStatus {
  name: string;
  running: boolean;
  pid?: number;
  startTime?: Date;
  restartCount: number;
  lastError?: string;
}

/**
 * MCP Process Manager
 * 
 * Manages multiple MCP server processes with health monitoring and auto-restart.
 */
export class MCPProcessManager extends EventEmitter {
  private processes: Map<string, ChildProcess> = new Map();
  private configs: Map<string, MCPServerConfig> = new Map();
  private status: Map<string, MCPServerStatus> = new Map();
  private restartTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    super();
  }

  /**
   * Start an MCP server process
   */
  async startServer(config: MCPServerConfig): Promise<void> {
    console.log(`[MCPProcessManager] Starting ${config.name}...`);

    // Check if already running
    if (this.processes.has(config.name)) {
      console.log(`[MCPProcessManager] ${config.name} is already running`);
      return;
    }

    // Store config
    this.configs.set(config.name, config);

    // Initialize status
    this.status.set(config.name, {
      name: config.name,
      running: false,
      restartCount: 0
    });

    try {
      // Spawn process
      const isWindows = process.platform === 'win32';
      const command = isWindows && config.command === 'npx' ? 'npx.cmd' : config.command;
      
      const serverProcess = spawn(command, config.args, {
        env: { ...process.env, ...config.env },
        cwd: config.cwd || process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: isWindows // Use shell on Windows to resolve paths correctly
      });

      // Store process
      this.processes.set(config.name, serverProcess);

      // Update status
      this.status.set(config.name, {
        name: config.name,
        running: true,
        pid: serverProcess.pid,
        startTime: new Date(),
        restartCount: this.status.get(config.name)?.restartCount || 0
      });

      // Handle stdout
      serverProcess.stdout?.on('data', (data) => {
        const message = data.toString().trim();
        if (message) {
          console.log(`[${config.name}] ${message}`);
          this.emit('log', { server: config.name, level: 'info', message });
        }
      });

      // Handle stderr
      serverProcess.stderr?.on('data', (data) => {
        const message = data.toString().trim();
        if (message) {
          console.error(`[${config.name}] ERROR: ${message}`);
          this.emit('log', { server: config.name, level: 'error', message });
        }
      });

      // Handle process exit
      serverProcess.on('exit', (code, signal) => {
        console.log(`[MCPProcessManager] ${config.name} exited with code ${code}, signal ${signal}`);
        
        this.processes.delete(config.name);
        
        const currentStatus = this.status.get(config.name);
        this.status.set(config.name, {
          ...currentStatus!,
          running: false,
          lastError: `Exited with code ${code}`
        });

        this.emit('exit', { server: config.name, code, signal });

        // Auto-restart if enabled
        if (config.autoRestart && (!config.maxRestarts || currentStatus!.restartCount < config.maxRestarts)) {
          console.log(`[MCPProcessManager] Auto-restarting ${config.name} in 5 seconds...`);
          
          const timer = setTimeout(() => {
            this.startServer(config).catch(err => {
              console.error(`[MCPProcessManager] Failed to restart ${config.name}:`, err);
            });
          }, 5000);
          
          this.restartTimers.set(config.name, timer);
        }
      });

      // Handle process error
      serverProcess.on('error', (error) => {
        console.error(`[MCPProcessManager] ${config.name} error:`, error);
        
        const currentStatus = this.status.get(config.name);
        this.status.set(config.name, {
          ...currentStatus!,
          running: false,
          lastError: error.message
        });

        this.emit('error', { server: config.name, error });
      });

      console.log(`[MCPProcessManager] ✅ ${config.name} started (PID: ${serverProcess.pid})`);
      this.emit('started', { server: config.name, pid: serverProcess.pid });

    } catch (error) {
      console.error(`[MCPProcessManager] Failed to start ${config.name}:`, error);
      
      this.status.set(config.name, {
        name: config.name,
        running: false,
        restartCount: 0,
        lastError: error instanceof Error ? error.message : 'Unknown error'
      });

      throw error;
    }
  }

  /**
   * Stop an MCP server process
   */
  async stopServer(name: string): Promise<void> {
    console.log(`[MCPProcessManager] Stopping ${name}...`);

    // Clear restart timer if exists
    const timer = this.restartTimers.get(name);
    if (timer) {
      clearTimeout(timer);
      this.restartTimers.delete(name);
    }

    const serverProcess = this.processes.get(name);
    if (!serverProcess) {
      console.log(`[MCPProcessManager] ${name} is not running`);
      return;
    }

    return new Promise((resolve) => {
      serverProcess.once('exit', () => {
        console.log(`[MCPProcessManager] ✅ ${name} stopped`);
        resolve();
      });

      // On Windows, use taskkill to kill process tree (needed for npx)
      if (process.platform === 'win32' && serverProcess.pid) {
        try {
          spawn('taskkill', ['/pid', serverProcess.pid.toString(), '/t', '/f']);
        } catch (e) {
          console.error(`[MCPProcessManager] Failed to taskkill ${name}:`, e);
          serverProcess.kill('SIGKILL');
        }
      } else {
        // Unix-like systems
        serverProcess.kill('SIGTERM');
        
        // Force kill after 5 seconds
        setTimeout(() => {
          if (this.processes.has(name)) {
            console.log(`[MCPProcessManager] Force killing ${name}...`);
            serverProcess.kill('SIGKILL');
          }
        }, 5000);
      }
    });
  }

  /**
   * Stop all MCP server processes
   */
  async stopAll(): Promise<void> {
    console.log('[MCPProcessManager] Stopping all MCP servers...');

    const stopPromises = Array.from(this.processes.keys()).map(name => 
      this.stopServer(name)
    );

    await Promise.all(stopPromises);
    
    console.log('[MCPProcessManager] ✅ All MCP servers stopped');
  }

  /**
   * Get status of a specific server
   */
  getServerStatus(name: string): MCPServerStatus | undefined {
    return this.status.get(name);
  }

  /**
   * Get status of all servers
   */
  getAllStatus(): MCPServerStatus[] {
    return Array.from(this.status.values());
  }

  /**
   * Check if a server is running
   */
  isRunning(name: string): boolean {
    return this.status.get(name)?.running || false;
  }

  /**
   * Check if all servers are running
   */
  allRunning(): boolean {
    return Array.from(this.status.values()).every(s => s.running);
  }

  /**
   * Wait for a server to be ready
   */
  async waitForServer(name: string, timeoutMs: number = 10000): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      if (this.isRunning(name)) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return false;
  }

  /**
   * Wait for all servers to be ready
   */
  async waitForAll(timeoutMs: number = 30000): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      if (this.allRunning()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return false;
  }
}

/**
 * Create MCP process manager with standard configuration
 */
export function createMCPProcessManager(): MCPProcessManager {
  return new MCPProcessManager();
}
