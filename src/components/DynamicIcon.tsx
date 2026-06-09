import {
  UtensilsCrossed, Car, ShoppingBag, Gamepad2, Home, Heart, GraduationCap,
  MoreHorizontal, Briefcase, Gift, TrendingUp, Clock, Coins, Wallet, Landmark,
  Smartphone, MessageCircle, Plus, Minus, Edit, Trash2, Check, X, ChevronLeft,
  ChevronRight, Calendar, Search, Filter, PieChart, BarChart3, Settings as IconSettings,
  BookOpen, Target, Lock, Unlock, Download, Upload, RefreshCw, Eye, EyeOff,
  Camera, Image, FileText, CreditCard, Building2, PiggyBank, ArrowUpRight,
  ArrowDownRight, Menu, Moon, Sun, AlertCircle, CheckCircle, Info, Loader2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  UtensilsCrossed, Car, ShoppingBag, Gamepad2, Home, Heart, GraduationCap,
  MoreHorizontal, Briefcase, Gift, TrendingUp, Clock, Coins, Wallet, Landmark,
  Smartphone, MessageCircle, Plus, Minus, Edit, Trash2, Check, X, ChevronLeft,
  ChevronRight, Calendar, Search, Filter, PieChart, BarChart3, IconSettings,
  BookOpen, Target, Lock, Unlock, Download, Upload, RefreshCw, Eye, EyeOff,
  Camera, Image, FileText, CreditCard, Building2, PiggyBank, ArrowUpRight,
  ArrowDownRight, Menu, Moon, Sun, AlertCircle, CheckCircle, Info, Loader2,
};

interface DynamicIconProps {
  name: string;
  size?: number;
  className?: string;
}

export const DynamicIcon = ({ name, size = 20, className = '' }: DynamicIconProps) => {
  const Icon = iconMap[name] || MoreHorizontal;
  return <Icon size={size} className={className} />;
};

export { iconMap };
export type { LucideIcon };
