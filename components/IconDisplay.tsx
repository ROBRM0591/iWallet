import React from 'react';
import {
    HouseIcon, CarIcon, TravelIcon, GiftIcon, EducationIcon, ShoppingBagIcon, HealthIcon, CreditCardIcon, TagIcon, WalletIcon,
    ArrowUpIcon, ArrowDownIcon,
    DashboardIcon, PlannedExpenseIcon, SavingsGoalIcon, ReportsIcon, CalculatorIcon, ManualIcon,
    SettingsIcon, PiggyBankIcon, CatalogIcon,
    TrendingUpIcon, TrendingDownIcon, ClockIcon, ArrowsUpDownIcon, ListBulletIcon, ClipboardIcon,
    BriefcaseIcon, CurrencyDollarIcon, TargetIcon, PieChartIcon, ActivityIcon
} from './Icons';

export const PREDEFINED_ICONS: Record<string, { icon: React.FC<{ className?: string }>, name: string }> = {
    'wallet': { icon: WalletIcon, name: 'Cartera' },
    'arrow-up': { icon: ArrowUpIcon, name: 'Flecha Arriba' },
    'arrow-down': { icon: ArrowDownIcon, name: 'Flecha Abajo' },
    'house': { icon: HouseIcon, name: 'Casa' },
    'car': { icon: CarIcon, name: 'Auto' },
    'travel': { icon: TravelIcon, name: 'Viajes' },
    'health': { icon: HealthIcon, name: 'Salud' },
    'education': { icon: EducationIcon, name: 'Educación' },
    'shopping': { icon: ShoppingBagIcon, name: 'Compras' },
    'gift': { icon: GiftIcon, name: 'Regalos' },
    'card': { icon: CreditCardIcon, name: 'Tarjeta' },
    'tag': { icon: TagIcon, name: 'General' },
    'dashboard': { icon: DashboardIcon, name: 'Dashboard' },
    'planned-expense': { icon: PlannedExpenseIcon, name: 'Gasto Planificado' },
    'savings-goal': { icon: SavingsGoalIcon, name: 'Meta de Ahorro' },
    'reports': { icon: ReportsIcon, name: 'Reportes' },
    'calculator': { icon: CalculatorIcon, name: 'Calculadora' },
    'manual': { icon: ManualIcon, name: 'Manual' },
    'settings': { icon: SettingsIcon, name: 'Ajustes' },
    'piggy-bank': { icon: PiggyBankIcon, name: 'Presupuesto' },
    'catalog': { icon: CatalogIcon, name: 'Catálogos' },
    'trending-up': { icon: TrendingUpIcon, name: 'Tendencia Arriba' },
    'trending-down': { icon: TrendingDownIcon, name: 'Tendencia Abajo' },
    'clock': { icon: ClockIcon, name: 'Reloj' },
    'arrows-up-down': { icon: ArrowsUpDownIcon, name: 'Flechas Arriba y Abajo' },
    'list-bullet': { icon: ListBulletIcon, name: 'Lista' },
    'clipboard': { icon: ClipboardIcon, name: 'Portapapeles' },
    'briefcase': { icon: BriefcaseIcon, name: 'Portafolio' },
    'currency-dollar': { icon: CurrencyDollarIcon, name: 'Moneda' },
    'target': { icon: TargetIcon, name: 'Objetivo' },
    'pie-chart': { icon: PieChartIcon, name: 'Gráfica Circular' },
    'activity': { icon: ActivityIcon, name: 'Actividad' },
};

export const IconDisplay: React.FC<{ icon?: string, iconColor?: string, className?: string }> = ({ icon, iconColor, className = 'w-6 h-6' }) => {
    
    const combinedClassName = `${className} ${iconColor || 'text-current'}`;

    if (!icon) {
        return <TagIcon className={combinedClassName} />;
    }

    if (icon.startsWith('data:image')) {
        return <img src={icon} alt="custom icon" className={`${className} rounded-full object-cover`} />;
    }

    const IconComponent = PREDEFINED_ICONS[icon]?.icon;
    if (IconComponent) {
        return <IconComponent className={combinedClassName} />;
    }

    return <TagIcon className={combinedClassName} />;
};