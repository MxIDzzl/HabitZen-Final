import React from 'react';
import { Shield, ShieldCheck, Crown, CheckCircle } from 'lucide-react';
import { cn } from './ui/utils';

interface RoleBadgeProps {
  role?: string;
  isVerified?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function RoleBadge({ role = 'user', isVerified = false, size = 'sm', showLabel = false }: RoleBadgeProps) {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const iconSize = sizeMap[size];

  // Owner badge
  if (role === 'owner') {
    return (
      <div className={cn(
        "inline-flex items-center",
        showLabel && "gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500"
      )}>
        <Crown className={cn(iconSize, "text-yellow-500")} fill="currentColor" />
        {showLabel && <span className="text-xs font-medium text-white">Owner</span>}
      </div>
    );
  }

  // Admin badge
  if (role === 'admin') {
    return (
      <div className={cn(
        "inline-flex items-center",
        showLabel && "gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-red-500 to-pink-500"
      )}>
        <ShieldCheck className={cn(iconSize, "text-red-500")} fill="currentColor" />
        {showLabel && <span className="text-xs font-medium text-white">Admin</span>}
      </div>
    );
  }

  // Moderator badge
  if (role === 'mod') {
    return (
      <div className={cn(
        "inline-flex items-center",
        showLabel && "gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
      )}>
        <Shield className={cn(iconSize, "text-green-500")} fill="currentColor" />
        {showLabel && <span className="text-xs font-medium text-white">Mod</span>}
      </div>
    );
  }

  // Verified badge (for regular users)
  if (isVerified) {
    return (
      <div className={cn(
        "inline-flex items-center",
        showLabel && "gap-1 px-2 py-0.5 rounded-full bg-blue-50"
      )}>
        <CheckCircle className={cn(iconSize, "text-blue-500")} fill="currentColor" />
        {showLabel && <span className="text-xs font-medium text-blue-600">Verificado</span>}
      </div>
    );
  }

  return null;
}