import React, { useRef, useState, useEffect } from 'react';
import { PREDEFINED_ICONS } from './IconDisplay';
import { PlusIcon } from './Icons';

interface IconPickerProps {
    onSelect: (details: { icon: string; color: string; }) => void;
    onClose: () => void;
    currentColor?: string;
}

const COLORS = [
    'text-gray-800 dark:text-white',
    'text-red-500 dark:text-red-400',
    'text-yellow-500 dark:text-yellow-400',
    'text-green-500 dark:text-green-400',
    'text-blue-500 dark:text-blue-400',
    'text-indigo-500 dark:text-indigo-400',
    'text-purple-500 dark:text-purple-400',
    'text-pink-500 dark:text-pink-400',
];

const convertTextColorToBgColor = (textColorClass: string): string => {
    // Handles dark: prefix
    return textColorClass.split(' ').map(c => c.replace('text-', 'bg-')).join(' ');
};

export const IconPicker: React.FC<IconPickerProps> = ({ onSelect, onClose, currentColor }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedColor, setSelectedColor] = useState(currentColor || COLORS[0]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onSelect({ icon: reader.result as string, color: selectedColor });
                onClose();
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div 
          className="absolute z-50 mt-2 w-64 sm:w-72 origin-top-right rounded-xl bg-white dark:bg-gray-800 backdrop-blur-xl border border-gray-200 dark:border-white/20 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none"
          role="menu" aria-orientation="vertical" tabIndex={-1}
        >
            <div className="p-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Seleccionar un ícono</p>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                    {Object.entries(PREDEFINED_ICONS).map(([key, { icon: Icon, name }]) => (
                        <button
                            key={key}
                            title={name}
                            onClick={() => { onSelect({ icon: key, color: selectedColor }); onClose(); }}
                            className="flex items-center justify-center p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition"
                        >
                            <Icon className={`w-6 h-6 ${selectedColor}`} />
                        </button>
                    ))}
                    <button
                        title="Subir ícono"
                        onClick={handleUploadClick}
                        className="flex items-center justify-center p-2 rounded-lg bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition"
                    >
                        <PlusIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/png, image/jpeg, image/svg+xml"
                    />
                </div>
                <hr className="my-3 border-gray-200 dark:border-white/20"/>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Seleccionar un color</p>
                <div className="grid grid-cols-8 gap-2">
                    {COLORS.map(color => (
                        <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`w-6 h-6 rounded-full border-2 border-transparent transition-all ${selectedColor === color ? 'ring-2 ring-offset-2 ring-primary-500 ring-offset-white dark:ring-offset-gray-800' : 'ring-0'}`}
                        >
                           <div className={`w-full h-full rounded-full ${convertTextColorToBgColor(color.split(' ')[0])}`}></div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};