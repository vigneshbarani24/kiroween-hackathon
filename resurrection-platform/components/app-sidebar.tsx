'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Resurrections', href: '/resurrections', icon: '⚰️' },
  { name: 'New Resurrection', href: '/resurrections/new', icon: '🎃' },
  { name: 'Intelligence', href: '/intelligence', icon: '🔮' },
  { name: 'Hooks', href: '/hooks', icon: '🪝' },
  { name: 'MCP Logs', href: '/mcp-logs', icon: '📝' },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-[#1a0f2e] border-r border-[#5b21b6] flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-[#5b21b6]">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="text-4xl">🎃</span>
          <div>
            <h1 className="text-xl font-bold text-[#FF6B35]">Resurrection</h1>
            <p className="text-xs text-[#a78bfa]">SAP Modernization</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                isActive
                  ? 'bg-[#2e1065] text-[#FF6B35] border border-[#5b21b6] shadow-[0_0_15px_rgba(139,92,246,0.3)]'
                  : 'text-[#a78bfa] hover:bg-[#2e1065]/50 hover:text-[#F7F7FF]'
              )}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[#5b21b6]">
        <div className="bg-[#2e1065]/30 rounded-lg p-4 border border-[#5b21b6]">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">👻</span>
            <span className="text-sm font-semibold text-[#FF6B35]">Quick Stats</span>
          </div>
          <div className="space-y-1 text-xs text-[#a78bfa]">
            <div className="flex justify-between">
              <span>Active</span>
              <span className="text-[#F7F7FF] font-semibold">3</span>
            </div>
            <div className="flex justify-between">
              <span>Completed</span>
              <span className="text-[#10B981] font-semibold">12</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
