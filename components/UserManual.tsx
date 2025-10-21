import React from 'react';

const ManualSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-8">
        <h2 className="text-2xl font-bold mb-3 text-primary-600 dark:text-primary-400">{title}</h2>
        <div className="space-y-3 text-gray-700 dark:text-gray-300 leading-relaxed">
            {children}
        </div>
    </div>
);

export const UserManual: React.FC = () => {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-lg">
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Manual de Usuario de iWallet</h1>
            
            <ManualSection title="1. Dashboard: Tu Centro Financiero">
                <p>El Dashboard es tu pantalla principal, diseñada para darte una visión completa y rápida de tu estado financiero actual.</p>
                <ul className="list-disc list-inside pl-4 space-y-2">
                    <li><strong>Tarjetas de Resumen:</strong> Muestran tus <strong>Ingresos Totales</strong>, <strong>Gastos Totales</strong>, el <strong>Saldo Disponible</strong> resultante y el <strong>Saldo Pendiente</strong> de tus gastos planificados. ¡Haz clic en ellas para navegar directamente a los reportes y ver el detalle!</li>
                    <li><strong>Progreso de Metas de Ahorro:</strong> Visualiza qué tan cerca estás de alcanzar tus objetivos. Haz clic en una meta para ver o editar sus detalles.</li>
                    <li><strong>Vencimientos Próximos y Vencidos:</strong> Una lista priorizada de tus gastos planificados que requieren tu atención. Los gastos vencidos aparecen en rojo. Puedes hacer clic en un gasto para editarlo o usar el botón del dólar para registrar un abono rápidamente.</li>
                    <li><strong>Gastos del Mes por Categoría:</strong> Un gráfico de barras que te muestra a dónde se ha ido tu dinero durante el mes actual, ayudándote a identificar tus mayores áreas de gasto.</li>
                </ul>
            </ManualSection>

            <ManualSection title="2. Botón de Registro Rápido (+)">
                <p>Ubicado en la esquina inferior derecha, este botón es tu atajo para registrar transacciones sobre la marcha sin necesidad de cambiar de pantalla. Al hacer clic, se abre una ventana con tres pestañas:</p>
                <ul className="list-disc list-inside pl-4 space-y-2">
                    <li><strong>Gasto:</strong> Registra un gasto diario (variable) de forma rápida, seleccionando un concepto y un monto.</li>
                    <li><strong>Abono Planificado:</strong> Realiza un pago a uno de tus gastos fijos recurrentes. La app te mostrará el siguiente periodo a pagar y el monto restante.</li>
                    <li><strong>Ingreso:</strong> Registra tus ingresos, como tu nómina quincenal, de forma sencilla.</li>
                </ul>
            </ManualSection>

            <ManualSection title="3. Catálogos: La Base de tu Organización">
                <p>
                    Esta sección es el cerebro de iWallet. Una configuración inicial bien hecha te permitirá tener un control financiero preciso y automatizado. La estructura es jerárquica:
                </p>
                <ol className="list-decimal list-inside pl-4 space-y-2">
                    <li><strong>Tipos de Movimiento:</strong> La base de todo (Ingreso o Gasto).</li>
                    <li><strong>Tipos de Costo:</strong> Define si un gasto es Fijo o Variable.</li>
                    <li><strong>Categorías:</strong> Agrupa tus gastos en áreas generales (ej. 'Vivienda', 'Alimentación', 'Transporte'). Cada categoría se asocia a un tipo de costo.</li>
                    <li><strong>Conceptos:</strong> Es el nivel más específico de un gasto o ingreso (ej. 'Renta', 'Supermercado', 'Gasolina', 'Nómina'). Los conceptos de gasto se ligan a una categoría, mientras que los de ingreso se definen de forma independiente.</li>
                </ol>
                <p className="mt-2"><strong>Funcionalidades Clave:</strong></p>
                <ul className="list-disc list-inside pl-4 space-y-2">
                    <li><strong>Gestión Completa:</strong> Puedes añadir, editar y eliminar elementos en cada catálogo.</li>
                    <li><strong>Búsqueda Global:</strong> Usa la barra de búsqueda para encontrar ítems en todos los catálogos simultáneamente.</li>
                    <li><strong>Importación y Exportación:</strong> Cada catálogo individual se puede importar o exportar como archivo CSV. Además, puedes usar el botón <strong>"Exportar Todo"</strong> para guardar todos tus catálogos en un único archivo CSV o XLSX, ideal para respaldos o análisis externos.</li>
                </ul>
            </ManualSection>

            <ManualSection title="4. Presupuesto Mensual">
                <p>Define límites de gasto para cada una de tus categorías y asegúrate de no excederte. Es una herramienta poderosa para fomentar la disciplina financiera.</p>
                <ul className="list-disc list-inside pl-4 space-y-2">
                    <li><strong>Asigna Presupuestos:</strong> Para cada categoría de gasto, puedes establecer un monto mensual. Si no tiene uno, verás un botón para "Añadir Presupuesto".</li>
                    <li><strong>Visualiza tu Progreso:</strong> Una barra de progreso te indica qué tan cerca estás del límite. Cambia de color (verde a amarillo y a rojo) a medida que te acercas o excedes tu presupuesto.</li>
                    <li><strong>Detalles al Alcance:</strong> Haz clic en el nombre de una categoría para ser llevado a la sección de Reportes, con el filtro ya aplicado para ver todas las transacciones de esa categoría en el mes.</li>
                </ul>
            </ManualSection>
            
            <ManualSection title="5. Gastos Planificados">
                <p>Aquí es donde registras todos tus gastos fijos y recurrentes, como la renta, hipoteca, suscripciones (Netflix, Spotify) o pagos de tarjetas de crédito.</p>
                <ul className="list-disc list-inside pl-4 space-y-2">
                    <li><strong>Creación Detallada:</strong> Define el concepto, monto por periodo, frecuencia (mensual/bimestral), número de pagos y fechas clave (corte y límite de pago).</li>
                    <li><strong>Personalización Visual:</strong> Asigna un ícono y un color a cada gasto para identificarlo fácilmente en el Dashboard y otras secciones.</li>
                    <li><strong>Recordatorios Inteligentes:</strong> Configura recordatorios para recibir notificaciones antes de la fecha de vencimiento.</li>
                    <li><strong>Control de Pagos:</strong> Registra cada abono que realices. La app llevará un control del monto pagado vs. el total de la deuda.</li>
                </ul>
            </ManualSection>

            <ManualSection title="6. Metas de Ahorro">
                <p>Visualiza tus sueños y objetivos financieros y dales seguimiento. ¡Ver tu progreso te mantendrá motivado!</p>
                 <ul className="list-disc list-inside pl-4 space-y-2">
                    <li><strong>Define tu Meta:</strong> Dale un nombre, un ícono y color, el monto que deseas alcanzar y una fecha límite.</li>
                    <li><strong>Registra tus Aportaciones:</strong> Edita la meta para actualizar el "Monto Actual" y ver cómo la barra de progreso se acerca al 100%.</li>
                </ul>
            </ManualSection>

             <ManualSection title="7. Reportes">
                <p>Analiza a fondo tus finanzas. Esta sección te permite explorar tus datos para entender tus hábitos y tomar mejores decisiones.</p>
                <ul className="list-disc list-inside pl-4 space-y-2">
                    <li><strong>Filtros Avanzados:</strong> Filtra tus transacciones por rango de fechas, tipo (ingreso/gasto) y categoría.</li>
                    <li><strong>Gráficos Interactivos:</strong> Compara tus ingresos vs. gastos a lo largo del tiempo y analiza la distribución de tus gastos por categoría.</li>
                    <li><strong>Lista de Transacciones:</strong> Ve un detalle de cada movimiento que cumple con tus filtros, y elimina registros si es necesario.</li>
                    <li><strong>Herramientas de Datos:</strong> Importa o exporta masivamente tus registros de Ingresos y Gastos Diarios usando archivos CSV.</li>
                </ul>
            </ManualSection>
            
            <ManualSection title="8. Calculadora de Deudas">
                <p>Una herramienta útil para planificar cómo liquidar tus deudas. Puedes simular múltiples escenarios para encontrar la mejor estrategia.</p>
                 <ul className="list-disc list-inside pl-4 space-y-2">
                    <li><strong>Agrega Deudas:</strong> Añade una o más deudas, especificando el monto total, la tasa de interés anual y el pago mensual que planeas realizar.</li>
                    <li><strong>Resumen Consolidado:</strong> La calculadora te mostrará el tiempo total que te tomará liquidar todas las deudas, así como el interés total y el monto total que terminarás pagando.</li>
                </ul>
            </ManualSection>
            
            <ManualSection title="9. Ajustes y Configuración">
                <p>Personaliza iWallet a tu gusto y gestiona tus datos de forma segura.</p>
                <ul className="list-disc list-inside pl-4 space-y-2">
                    <li><strong>Apariencia:</strong> Cambia el ícono principal de la aplicación. El tema (claro/oscuro) y la paleta de colores se configuran desde los íconos en el encabezado.</li>
                    <li><strong>Notificaciones:</strong> Activa los permisos de notificación en tu navegador. Luego, define una configuración de recordatorio predeterminada (días antes y hora) para tus gastos planificados. Recuerda que la configuración individual de un gasto siempre tendrá prioridad sobre la general.</li>
                    <li><strong>Copia de Seguridad y Restauración:</strong> Exporta TODOS tus datos (transacciones, presupuestos, catálogos, etc.) a un único archivo <code>.iwallet</code>. Puedes usar este archivo para restaurar tu información en otro navegador o dispositivo.</li>
                    <li><strong>Restablecer Datos:</strong> ¡Usa con precaución! Esta opción borra toda la información de la aplicación y la deja como nueva. Es una acción irreversible.</li>
                </ul>
            </ManualSection>
        </div>
    );
};
