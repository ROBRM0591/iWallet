import { AppData, Frequency, MovementTypeName } from './types';

const createPalette = (name: string, hex: string, shades: Record<string, string>) => ({ name, hex, shades });

export const COLOR_PALETTES = [
  createPalette('Blue', '#3b82f6', { '50': '#eff6ff', '100': '#dbeafe', '200': '#bfdbfe', '300': '#93c5fd', '400': '#60a5fa', '500': '#3b82f6', '600': '#2563eb', '700': '#1d4ed8', '800': '#1e40af', '900': '#1e3a8a', '950': '#172554' }),
  createPalette('Indigo', '#6366f1', { '50': '#eef2ff', '100': '#e0e7ff', '200': '#c7d2fe', '300': '#a5b4fc', '400': '#818cf8', '500': '#6366f1', '600': '#4f46e5', '700': '#4338ca', '800': '#3730a3', '900': '#312e81', '950': '#1e1b4b' }),
  createPalette('Purple', '#8b5cf6', { '50': '#f5f3ff', '100': '#ede9fe', '200': '#ddd6fe', '300': '#c4b5fd', '400': '#a78bfa', '500': '#8b5cf6', '600': '#7c3aed', '700': '#6d28d9', '800': '#5b21b6', '900': '#4c1d95', '950': '#2e1065' }),
  createPalette('Pink', '#ec4899', { '50': '#fdf2f8', '100': '#fce7f3', '200': '#fbcfe8', '300': '#f9a8d4', '400': '#f472b6', '500': '#ec4899', '600': '#db2777', '700': '#be185d', '800': '#9d174d', '900': '#831843', '950': '#500724' }),
  createPalette('Green', '#22c55e', { '50': '#f0fdf4', '100': '#dcfce7', '200': '#bbf7d0', '300': '#86efac', '400': '#4ade80', '500': '#22c55e', '600': '#16a34a', '700': '#15803d', '800': '#166534', '900': '#14532d', '950': '#052e16' }),
  createPalette('Teal', '#14b8a6', { '50': '#f0fdfa', '100': '#ccfbf1', '200': '#99f6e4', '300': '#5eead4', '400': '#2dd4bf', '500': '#14b8a6', '600': '#0d9488', '700': '#0f766e', '800': '#115e59', '900': '#134e4a', '950': '#042f2e' }),
];

export const BLANK_DATA: AppData = {
  categories: [],
  costTypes: [
    { id: 'TC-001', name: 'Fijo', movementTypeId: 'TM-001' },
    { id: 'TC-002', name: 'Variable', movementTypeId: 'TM-001' },
  ],
  movementTypes: [
    { id: 'TM-001', name: MovementTypeName.GASTO },
    { id: 'TM-002', name: MovementTypeName.INGRESO },
  ],
  concepts: [],
  dailyExpenses: [],
  incomes: [],
  plannedExpenses: [],
  savingsGoals: [],
  monthlyBudgets: [],
  notifications: {
    defaultReminderDays: 3,
    defaultReminderTime: '09:00',
  },
};

export const DEMO_DATA: AppData = {
  categories: [
    // Gastos Fijos
    { id: 'CA-001', name: 'Vivienda', movementTypeId: 'TM-001', costTypeId: 'TC-001', description: 'Gastos relacionados con el hogar y la renta.' },
    { id: 'CA-002', name: 'Servicios', movementTypeId: 'TM-001', costTypeId: 'TC-001', description: 'Pagos de servicios básicos como luz, agua, gas, etc.' },
    { id: 'CA-003', name: 'Deudas y Créditos', movementTypeId: 'TM-001', costTypeId: 'TC-001' },
    { id: 'CA-004', name: 'Suscripciones', movementTypeId: 'TM-001', costTypeId: 'TC-001' },
    { id: 'CA-005', name: 'Educación', movementTypeId: 'TM-001', costTypeId: 'TC-001' },
    { id: 'CA-006', name: 'Seguros', movementTypeId: 'TM-001', costTypeId: 'TC-001' },
    
    // Gastos Variables
    { id: 'CA-007', name: 'Alimentación', movementTypeId: 'TM-001', costTypeId: 'TC-002', description: 'Compras de supermercado, restaurantes y comida a domicilio.' },
    { id: 'CA-008', name: 'Transporte', movementTypeId: 'TM-001', costTypeId: 'TC-002' },
    { id: 'CA-009', name: 'Salud y Cuidado Personal', movementTypeId: 'TM-001', costTypeId: 'TC-002' },
    { id: 'CA-010', name: 'Entretenimiento y Ocio', movementTypeId: 'TM-001', costTypeId: 'TC-002' },
    { id: 'CA-011', name: 'Compras', movementTypeId: 'TM-001', costTypeId: 'TC-002' },
    { id: 'CA-012', name: 'Familia y Mascotas', movementTypeId: 'TM-001', costTypeId: 'TC-002' },
    { id: 'CA-013', name: 'Otros Gastos', movementTypeId: 'TM-001', costTypeId: 'TC-002' },
  ],
  costTypes: [
    { id: 'TC-001', name: 'Fijo', movementTypeId: 'TM-001' },
    { id: 'TC-002', name: 'Variable', movementTypeId: 'TM-001' },
  ],
  movementTypes: [
    { id: 'TM-001', name: MovementTypeName.GASTO },
    { id: 'TM-002', name: MovementTypeName.INGRESO },
  ],
  concepts: [
    // Vivienda (Fijo)
    { id: 'CO-001', name: 'Renta', movementTypeId: 'TM-001', categoryId: 'CA-001', costTypeId: 'TC-001', description: 'Pago mensual del alquiler del departamento/casa.' },
    { id: 'CO-002', name: 'Hipoteca', movementTypeId: 'TM-001', categoryId: 'CA-001', costTypeId: 'TC-001' },
    
    // Servicios (Fijo)
    { id: 'CO-003', name: 'CFE (Luz)', movementTypeId: 'TM-001', categoryId: 'CA-002', costTypeId: 'TC-001', description: 'Recibo de luz bimestral.' },
    { id: 'CO-004', name: 'Agua y Drenaje', movementTypeId: 'TM-001', categoryId: 'CA-002', costTypeId: 'TC-001' },
    { id: 'CO-005', name: 'Gas Natural', movementTypeId: 'TM-001', categoryId: 'CA-002', costTypeId: 'TC-001' },
    { id: 'CO-006', name: 'Internet (Telmex/TotalPlay)', movementTypeId: 'TM-001', categoryId: 'CA-002', costTypeId: 'TC-001' },
    { id: 'CO-007', name: 'Plan Celular (Telcel/AT&T)', movementTypeId: 'TM-001', categoryId: 'CA-002', costTypeId: 'TC-001' },

    // Deudas y Créditos (Fijo)
    { id: 'CO-008', name: 'TDC Nu', movementTypeId: 'TM-001', categoryId: 'CA-003', costTypeId: 'TC-001' },
    { id: 'CO-009', name: 'TDC BBVA', movementTypeId: 'TM-001', categoryId: 'CA-003', costTypeId: 'TC-001' },
    { id: 'CO-010', name: 'TDC RappiCard', movementTypeId: 'TM-001', categoryId: 'CA-003', costTypeId: 'TC-001' },
    { id: 'CO-011', name: 'Préstamo Personal', movementTypeId: 'TM-001', categoryId: 'CA-003', costTypeId: 'TC-001' },

    // Suscripciones (Fijo)
    { id: 'CO-012', name: 'Netflix', movementTypeId: 'TM-001', categoryId: 'CA-004', costTypeId: 'TC-001' },
    { id: 'CO-013', name: 'Spotify', movementTypeId: 'TM-001', categoryId: 'CA-004', costTypeId: 'TC-001' },
    { id: 'CO-014', name: 'Amazon Prime', movementTypeId: 'TM-001', categoryId: 'CA-004', costTypeId: 'TC-001' },
    { id: 'CO-015', name: 'Xbox Game Pass / PS Plus', movementTypeId: 'TM-001', categoryId: 'CA-004', costTypeId: 'TC-001' },
    { id: 'CO-016', name: 'iCloud / Google One', movementTypeId: 'TM-001', categoryId: 'CA-004', costTypeId: 'TC-001' },

    // Educación (Fijo)
    { id: 'CO-017', name: 'Colegiatura', movementTypeId: 'TM-001', categoryId: 'CA-005', costTypeId: 'TC-001' },
    { id: 'CO-018', name: 'Curso de Idiomas', movementTypeId: 'TM-001', categoryId: 'CA-005', costTypeId: 'TC-001' },

    // Seguros (Fijo)
    { id: 'CO-019', name: 'Seguro de Auto', movementTypeId: 'TM-001', categoryId: 'CA-006', costTypeId: 'TC-001' },
    { id: 'CO-020', name: 'Seguro de Gastos Médicos', movementTypeId: 'TM-001', categoryId: 'CA-006', costTypeId: 'TC-001' },

    // Alimentación (Variable)
    { id: 'CO-021', name: 'Supermercado (Walmart/HEB/Soriana)', movementTypeId: 'TM-001', categoryId: 'CA-007', costTypeId: 'TC-002' },
    { id: 'CO-022', name: 'Restaurantes y Cafés', movementTypeId: 'TM-001', categoryId: 'CA-007', costTypeId: 'TC-002' },
    { id: 'CO-023', name: 'Comida a Domicilio (Uber Eats/Rappi)', movementTypeId: 'TM-001', categoryId: 'CA-007', costTypeId: 'TC-002' },

    // Transporte (Variable)
    { id: 'CO-024', name: 'Gasolina', movementTypeId: 'TM-001', categoryId: 'CA-008', costTypeId: 'TC-002' },
    { id: 'CO-025', name: 'Transporte por App (Uber/Didi)', movementTypeId: 'TM-001', categoryId: 'CA-008', costTypeId: 'TC-002' },
    { id: 'CO-026', name: 'Transporte Público', movementTypeId: 'TM-001', categoryId: 'CA-008', costTypeId: 'TC-002' },
    { id: 'CO-027', name: 'Mantenimiento de Auto', movementTypeId: 'TM-001', categoryId: 'CA-008', costTypeId: 'TC-002' },

    // Salud y Cuidado Personal (Variable)
    { id: 'CO-028', name: 'Farmacia', movementTypeId: 'TM-001', categoryId: 'CA-009', costTypeId: 'TC-002' },
    { id: 'CO-029', name: 'Consulta Médica', movementTypeId: 'TM-001', categoryId: 'CA-009', costTypeId: 'TC-002' },
    { id: 'CO-030', name: 'Gimnasio', movementTypeId: 'TM-001', categoryId: 'CA-009', costTypeId: 'TC-002' },
    { id: 'CO-031', name: 'Corte de Pelo / Barbería', movementTypeId: 'TM-001', categoryId: 'CA-009', costTypeId: 'TC-002' },

    // Entretenimiento y Ocio (Variable)
    { id: 'CO-032', name: 'Cine', movementTypeId: 'TM-001', categoryId: 'CA-010', costTypeId: 'TC-002' },
    { id: 'CO-033', name: 'Salidas con Amigos / Bares', movementTypeId: 'TM-001', categoryId: 'CA-010', costTypeId: 'TC-002' },
    { id: 'CO-034', name: 'Conciertos y Eventos', movementTypeId: 'TM-001', categoryId: 'CA-010', costTypeId: 'TC-002' },
    { id: 'CO-035', name: 'Hobbies', movementTypeId: 'TM-001', categoryId: 'CA-010', costTypeId: 'TC-002' },

    // Compras (Variable)
    { id: 'CO-036', name: 'Ropa y Calzado', movementTypeId: 'TM-001', categoryId: 'CA-011', costTypeId: 'TC-002' },
    { id: 'CO-037', name: 'Tecnología y Gadgets', movementTypeId: 'TM-001', categoryId: 'CA-011', costTypeId: 'TC-002' },
    { id: 'CO-038', name: 'Hogar y Decoración', movementTypeId: 'TM-001', categoryId: 'CA-011', costTypeId: 'TC-002' },

    // Familia y Mascotas (Variable)
    { id: 'CO-039', name: 'Artículos para Bebé / Niños', movementTypeId: 'TM-001', categoryId: 'CA-012', costTypeId: 'TC-002' },
    { id: 'CO-040', name: 'Comida y Juguetes para Mascota', movementTypeId: 'TM-001', categoryId: 'CA-012', costTypeId: 'TC-002' },
    { id: 'CO-041', name: 'Veterinario', movementTypeId: 'TM-001', categoryId: 'CA-012', costTypeId: 'TC-002' },

    // Otros Gastos (Variable)
    { id: 'CO-042', name: 'Regalos', movementTypeId: 'TM-001', categoryId: 'CA-013', costTypeId: 'TC-002' },
    { id: 'CO-043', name: 'Donaciones', movementTypeId: 'TM-001', categoryId: 'CA-013', costTypeId: 'TC-002' },
    { id: 'CO-044', name: 'Gastos Hormiga (Antojos, etc.)', movementTypeId: 'TM-001', categoryId: 'CA-013', costTypeId: 'TC-002' },
    
    // Ingresos (Sin Categoría)
    { id: 'CO-045', name: 'Nómina', movementTypeId: 'TM-002', categoryId: '', costTypeId: ''},
    { id: 'CO-046', name: 'Honorarios / Freelance', movementTypeId: 'TM-002', categoryId: '', costTypeId: ''},
    { id: 'CO-047', name: 'Bonos / Aguinaldo', movementTypeId: 'TM-002', categoryId: '', costTypeId: ''},
    { id: 'CO-048', name: 'Ingreso Extra', movementTypeId: 'TM-002', categoryId: '', costTypeId: ''},
  ],
  dailyExpenses: [],
  incomes: [],
  plannedExpenses: [],
  savingsGoals: [],
  monthlyBudgets: [],
  notifications: {
    defaultReminderDays: 3,
    defaultReminderTime: '09:00',
  },
};

export const INITIAL_DATA: AppData = BLANK_DATA;