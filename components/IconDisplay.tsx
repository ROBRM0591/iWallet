import React from 'react';
import {
    HouseIcon, CarIcon, TravelIcon, GiftIcon, EducationIcon, ShoppingBagIcon, HealthIcon, CreditCardIcon, TagIcon, WalletIcon
} from './Icons';

export const PREDEFINED_ICONS: Record<string, { icon: React.FC<{ className?: string }>, name: string }> = {
    'wallet': { icon: WalletIcon, name: 'Cartera' },
    'house': { icon: HouseIcon, name: 'Casa' },
    'car': { icon: CarIcon, name: 'Auto' },
    'travel': { icon: TravelIcon, name: 'Viajes' },
    'health': { icon: HealthIcon, name: 'Salud' },
    'education': { icon: EducationIcon, name: 'Educación' },
    'shopping': { icon: ShoppingBagIcon, name: 'Compras' },
    'gift': { icon: GiftIcon, name: 'Regalos' },
    'card': { icon: CreditCardIcon, name: 'Tarjeta' },
    'tag': { icon: TagIcon, name: 'General' },
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