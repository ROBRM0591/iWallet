import React, { useState, useRef } from 'react';
import { WarningIcon } from './Icons';

declare const XLSX: any;

export interface CsvHeader<T> {
    key: keyof T;
    label: string;
    formatter?: (value: any) => string;
}

const ConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    entityName: string;
}> = ({ isOpen, onClose, onConfirm, entityName }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md m-4 transform transition-all text-center p-6">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/50">
                    <WarningIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-300" />
                </div>
                <h3 className="text-lg leading-6 font-bold text-gray-900 dark:text-white mt-4">Confirmar Importación</h3>
                <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                       ¿Estás seguro de que quieres importar este archivo? Esta acción reemplazará todos los {entityName.toLowerCase()} existentes.
                    </p>
                </div>
                <div className="mt-6 flex justify-center gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg transition"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg transition"
                    >
                        Sí, Reemplazar
                    </button>
                </div>
            </div>
        </div>
    );
};

interface CsvToolsProps<T> {
    entityName: string;
    items: T[];
    headers: CsvHeader<T>[];
    onImport: (importedData: T[]) => void;
    onExportSuccess?: () => void;
}

export function CsvTools<T>({ entityName, items, headers, onImport, onExportSuccess }: CsvToolsProps<T>) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isConfirming, setIsConfirming] = useState(false);
    const [importedData, setImportedData] = useState<T[] | null>(null);

    const handleExport = () => {
        try {
            const dataForSheet = items.map(item => {
                const row: { [key: string]: any } = {};
                headers.forEach(header => {
                    const value = item[header.key];
                    row[header.label] = header.formatter ? header.formatter(value) : value;
                });
                return row;
            });

            const ws = XLSX.utils.json_to_sheet(dataForSheet);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, entityName.substring(0, 31));
            XLSX.writeFile(wb, `${entityName.toLowerCase().replace(/ /g, '_')}.xlsx`);

            if (onExportSuccess) {
                onExportSuccess();
            }
        } catch (error) {
            console.error("Error al exportar a XLSX:", error);
            alert("Ocurrió un error al exportar el archivo XLSX.");
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const buffer = e.target?.result;
            try {
                const workbook = XLSX.read(buffer, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                if (!sheetName) throw new Error("El archivo no contiene hojas.");
                
                const worksheet = workbook.Sheets[sheetName];
                const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

                const labelToKeyMap = new Map<string, keyof T>();
                headers.forEach(h => labelToKeyMap.set(h.label, h.key));
                
                const expectedHeaders = headers.map(h => h.label);
                const sheetHeaders = jsonData.length > 0 ? Object.keys(jsonData[0]) : (XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as string[] || []);
                
                if (expectedHeaders.some(h => !sheetHeaders.includes(h))) {
                     throw new Error(`Las cabeceras del archivo no coinciden. Esperado: ${expectedHeaders.join(', ')}`);
                }

                const mappedData = jsonData.map(row => {
                    const newRow: Partial<T> = {};
                    for (const label of expectedHeaders) {
                        const key = labelToKeyMap.get(label);
                        if (key) {
                           (newRow as any)[key] = row[label] !== undefined ? String(row[label]).trim() : '';
                        }
                    }
                    return newRow as T;
                });
                
                setImportedData(mappedData);
                setIsConfirming(true);

            } catch (error) {
                console.error("Error parsing XLSX file:", error);
                alert(`Error al procesar el archivo XLSX: ${error instanceof Error ? error.message : 'Formato incorrecto.'}`);
            }
        };
        reader.readAsArrayBuffer(file);

        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };
    
    const confirmImport = () => {
        if(importedData) {
            onImport(importedData);
        }
        setIsConfirming(false);
        setImportedData(null);
    };

    return (
        <div className="flex items-center gap-2">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            />
            <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 font-bold py-2 px-3 rounded-lg text-sm"
            >
                Importar XLSX
            </button>
             <button
                onClick={handleExport}
                className="bg-primary-100 dark:bg-primary-900/50 hover:bg-primary-200 dark:hover:bg-primary-900 text-primary-800 dark:text-primary-200 font-bold py-2 px-3 rounded-lg text-sm"
            >
                Exportar XLSX
            </button>
            <ConfirmationModal 
                isOpen={isConfirming}
                onClose={() => setIsConfirming(false)}
                onConfirm={confirmImport}
                entityName={entityName}
            />
        </div>
    );
}
