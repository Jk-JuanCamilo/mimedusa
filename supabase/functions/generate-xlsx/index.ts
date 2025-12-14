import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fórmulas por categoría
const formulaCategories = {
  contabilidad: `
FÓRMULAS DE CONTABILIDAD (incluir según aplique):
- Activo Total = Activo Corriente + Activo No Corriente
- Pasivo Total = Pasivo Corriente + Pasivo No Corriente
- Patrimonio = Activo Total - Pasivo Total
- Capital de Trabajo = Activo Corriente - Pasivo Corriente
- Razón Corriente = Activo Corriente / Pasivo Corriente
- Prueba Ácida = (Activo Corriente - Inventario) / Pasivo Corriente
- Rotación de Inventario = Costo de Ventas / Inventario Promedio
- Días de Inventario = 365 / Rotación de Inventario
- Rotación de Cuentas por Cobrar = Ventas / Cuentas por Cobrar Promedio
- Días de Cobro = 365 / Rotación de Cuentas por Cobrar
- Rotación de Cuentas por Pagar = Compras / Cuentas por Pagar Promedio
- Días de Pago = 365 / Rotación de Cuentas por Pagar
- Ciclo de Conversión de Efectivo = Días Inventario + Días Cobro - Días Pago
- Depreciación Lineal = (Costo - Valor Residual) / Vida Útil
- Depreciación Acelerada (Suma de Dígitos)
- Amortización de Préstamo = PMT(tasa, períodos, valor_presente)
- IVA = Subtotal * Tasa_IVA
- Retención en la Fuente = Base * Tasa_Retención
- Utilidad Bruta = Ventas - Costo de Ventas
- Utilidad Operacional = Utilidad Bruta - Gastos Operacionales
- Utilidad Neta = Utilidad Operacional - Impuestos`,

  finanzas: `
FÓRMULAS FINANCIERAS (incluir según aplique):
- ROI = (Ganancia - Inversión) / Inversión * 100
- ROE = Utilidad Neta / Patrimonio * 100
- ROA = Utilidad Neta / Activos Totales * 100
- Margen Bruto = (Ventas - Costo) / Ventas * 100
- Margen Operacional = Utilidad Operacional / Ventas * 100
- Margen Neto = Utilidad Neta / Ventas * 100
- EBITDA = Utilidad Operacional + Depreciación + Amortización
- Margen EBITDA = EBITDA / Ventas * 100
- VAN (NPV) = Suma de Flujos / (1+tasa)^período - Inversión
- TIR (IRR) = Tasa donde VAN = 0
- Payback = Inversión / Flujo Anual Promedio
- Punto de Equilibrio (Unidades) = Costos Fijos / (Precio - Costo Variable)
- Punto de Equilibrio ($) = Costos Fijos / (1 - Costo Variable / Precio)
- Apalancamiento Financiero = Deuda / Patrimonio
- Cobertura de Intereses = EBIT / Gastos por Intereses
- Valor Futuro = VP * (1 + tasa)^períodos
- Valor Presente = VF / (1 + tasa)^períodos
- Tasa Efectiva Anual = (1 + tasa_nominal/n)^n - 1
- Interés Compuesto = Capital * (1 + tasa)^períodos - Capital
- Cuota Fija (Amortización) = PMT(tasa, períodos, capital)
- WACC = (E/V * Re) + (D/V * Rd * (1-T))
- Beta Apalancado = Beta_Desapalancado * (1 + (1-T) * D/E)
- Costo de Capital = Rf + Beta * (Rm - Rf)`,

  ventas: `
FÓRMULAS DE VENTAS (incluir según aplique):
- Total Venta = Cantidad * Precio Unitario
- Subtotal = SUMA de Totales
- Descuento = Subtotal * Porcentaje_Descuento
- IVA = (Subtotal - Descuento) * Tasa_IVA
- Total con IVA = Subtotal - Descuento + IVA
- Comisión = Total Venta * Tasa_Comisión
- Ganancia = Precio Venta - Costo
- Margen por Producto = (Precio - Costo) / Precio * 100
- Ventas Promedio = PROMEDIO(Ventas)
- Ventas Máximas = MAX(Ventas)
- Ventas Mínimas = MIN(Ventas)
- Cantidad Total = SUMA(Cantidades)
- Ticket Promedio = Total Ventas / Número de Transacciones
- Tasa de Conversión = Ventas Cerradas / Leads * 100
- Crecimiento Ventas = (Ventas_Actual - Ventas_Anterior) / Ventas_Anterior * 100
- Meta Alcanzada = Ventas Reales / Meta * 100
- Pronóstico de Ventas = TENDENCIA o FORECAST
- Ventas por Vendedor = SUMAR.SI(Vendedor, Ventas)
- Ranking = JERARQUIA(Venta, Rango_Ventas)`,

  inventario: `
FÓRMULAS DE INVENTARIO (incluir según aplique):
- Valor Total Stock = Stock * Precio Unitario
- Costo Total Inventario = SUMA(Stock * Costo)
- Valor de Venta Total = SUMA(Stock * Precio_Venta)
- Ganancia Potencial = Valor Venta - Costo Total
- Rotación = Ventas / Inventario Promedio
- Días de Stock = Inventario / (Ventas / 365)
- Punto de Reorden = (Demanda Diaria * Lead Time) + Stock Seguridad
- Stock de Seguridad = Z * Desv_Est * RAIZ(Lead_Time)
- EOQ (Cantidad Óptima) = RAIZ(2 * Demanda * Costo_Pedido / Costo_Mantener)
- Costo de Mantener = Stock_Promedio * Costo_Unitario * Tasa_Mantener
- Valoración FIFO/LIFO/Promedio Ponderado
- Margen por Producto = (Precio_Venta - Costo) / Precio_Venta * 100
- Productos Bajo Mínimo = SI(Stock < Stock_Mínimo, "Reabastecer", "OK")
- ABC Analysis = Clasificación por valor/volumen`,

  nomina: `
FÓRMULAS DE NÓMINA (incluir según aplique):
- Salario Bruto = Salario Base + Bonificaciones + Horas Extra
- Horas Extra Diurnas = Horas * Valor_Hora * 1.25
- Horas Extra Nocturnas = Horas * Valor_Hora * 1.75
- Horas Extra Dominicales = Horas * Valor_Hora * 2.0
- Auxilio de Transporte (si aplica según salario)
- Salud (Empleado) = Salario Base * 4%
- Pensión (Empleado) = Salario Base * 4%
- Total Deducciones = Salud + Pensión + Otros
- Salario Neto = Salario Bruto - Total Deducciones
- Aportes Empleador Salud = Salario * 8.5%
- Aportes Empleador Pensión = Salario * 12%
- ARL = Salario * Tasa_Riesgo
- Parafiscales = SENA + ICBF + Caja Compensación
- Prima = Salario * Días_Trabajados / 360
- Cesantías = Salario * Días_Trabajados / 360
- Intereses Cesantías = Cesantías * 12% * Días/360
- Vacaciones = Salario Base * Días / 720
- Liquidación Total = Prima + Cesantías + Int.Cesantías + Vacaciones`,

  presupuesto: `
FÓRMULAS DE PRESUPUESTO (incluir según aplique):
- Total Presupuestado = SUMA(Montos_Presupuestados)
- Total Ejecutado = SUMA(Montos_Ejecutados)
- Variación = Ejecutado - Presupuestado
- Variación % = (Ejecutado - Presupuestado) / Presupuestado * 100
- Disponible = Presupuestado - Ejecutado
- % Ejecución = Ejecutado / Presupuestado * 100
- Proyección Anual = (Ejecutado / Meses_Transcurridos) * 12
- Desviación Estándar = DESVEST(Valores)
- Presupuesto Acumulado = SUMA Acumulativa
- Tendencia = TENDENCIA(Datos)
- Estado = SI(Ejecutado > Presupuestado, "Sobrepasado", "Dentro del Presupuesto")`,

  kpi: `
FÓRMULAS DE KPIs (incluir según aplique):
- % Cumplimiento = (Valor_Actual / Meta) * 100
- Variación vs Meta = Valor_Actual - Meta
- Estado = SI(Cumplimiento >= 100%, "Logrado", SI(Cumplimiento >= 80%, "En Progreso", "Crítico"))
- Crecimiento = (Actual - Anterior) / Anterior * 100
- Promedio Móvil = PROMEDIO de últimos N períodos
- Tendencia = TENDENCIA(Histórico)
- Índice de Desempeño = SUMA_PONDERADA(KPIs * Pesos)
- Desviación = (Valor - Promedio) / Desv_Est
- Ranking = JERARQUIA(Valor, Rango)`,

  facturas: `
FÓRMULAS DE FACTURACIÓN (incluir según aplique):
- Subtotal = Cantidad * Precio_Unitario
- Descuento = Subtotal * %Descuento
- Base Gravable = Subtotal - Descuento
- IVA = Base_Gravable * Tasa_IVA
- Retención Fuente = Base * Tasa_Retención (si aplica)
- Retención ICA = Base * Tasa_ICA (si aplica)
- Retención IVA = IVA * %Retención_IVA (si aplica)
- Total Factura = Base + IVA - Retenciones
- Días Vencidos = HOY() - Fecha_Vencimiento
- Estado = SI(Días_Vencidos > 0, "Vencida", "Vigente")
- Interés Mora = Monto * Tasa_Mora * Días_Vencidos / 365
- Total con Mora = Monto + Interés_Mora
- Aging (Antigüedad) = Clasificación por días vencidos`
};

const templates: Record<string, { title: string; systemPrompt: string; columns: string[]; formulas: string[]; structure: string }> = {
  "data-analysis": {
    title: "Análisis de Datos",
    systemPrompt: "Genera una tabla de datos para análisis con columnas relevantes, incluyendo fórmulas estadísticas y de análisis.",
    columns: ["ID", "Categoría", "Valor", "Fecha", "Observación"],
    formulas: ["contabilidad", "finanzas"],
    structure: `
ESTRUCTURA DE PLANTILLA - ANÁLISIS DE DATOS:
--- HOJA: Datos Principales
| ID | Categoría | Subcategoría | Valor | Cantidad | Fecha | Observación |
(Mínimo 15 filas de datos realistas)
| RESUMEN | | | =SUMA(D2:D16) | =SUMA(E2:E16) | | |

--- HOJA: Análisis Estadístico
| Métrica | Valor | Fórmula |
| Total | =SUMA('Datos Principales'!D:D) | SUMA |
| Promedio | =PROMEDIO('Datos Principales'!D:D) | PROMEDIO |
| Máximo | =MAX('Datos Principales'!D:D) | MAX |
| Mínimo | =MIN('Datos Principales'!D:D) | MIN |
| Conteo | =CONTARA('Datos Principales'!A:A)-1 | CONTARA |
| Desviación | =DESVEST('Datos Principales'!D:D) | DESVEST |

--- HOJA: Resumen por Categoría
| Categoría | Total | Porcentaje |
(Agregar =SUMAR.SI para cada categoría)`
  },
  "finance": {
    title: "Control Financiero",
    systemPrompt: "Genera una tabla de control financiero completa con ingresos, gastos, balance, categorías y todas las fórmulas financieras necesarias.",
    columns: ["Fecha", "Descripción", "Categoría", "Ingreso", "Gasto", "Balance"],
    formulas: ["contabilidad", "finanzas", "presupuesto"],
    structure: `
ESTRUCTURA DE PLANTILLA - CONTROL FINANCIERO:
--- HOJA: Movimientos
| Fecha | Descripción | Categoría | Tipo | Ingreso | Gasto | Balance |
(Mínimo 20 filas con movimientos realistas)
| TOTALES | | | | =SUMA(E2:E21) | =SUMA(F2:F21) | =E22-F22 |

--- HOJA: Resumen Mensual
| Mes | Ingresos | Gastos | Balance | Ahorro % |
| Enero | =SUMAR.SI(...) | =SUMAR.SI(...) | =B2-C2 | =D2/B2*100 |
(12 meses)
| TOTAL ANUAL | =SUMA(B2:B13) | =SUMA(C2:C13) | =SUMA(D2:D13) | =D14/B14*100 |

--- HOJA: Categorías
| Categoría | Presupuesto | Gastado | Disponible | % Usado |
(Categorías: Alimentación, Transporte, Servicios, Entretenimiento, Salud, Educación, Otros)
| TOTAL | =SUMA(B:B) | =SUMA(C:C) | =SUMA(D:D) | =C9/B9*100 |

--- HOJA: Indicadores
| Indicador | Valor | Estado |
| Tasa de Ahorro | =formula | =SI(B2>20%,"Excelente",SI(B2>10%,"Bueno","Mejorar")) |
| Ratio Gastos/Ingresos | =formula | |
| Balance Promedio | =formula | |`
  },
  "sales": {
    title: "Seguimiento de Ventas",
    systemPrompt: "Genera una tabla de ventas profesional con productos, cantidades, precios, totales, comisiones y todas las fórmulas de ventas.",
    columns: ["Fecha", "Vendedor", "Producto", "Cantidad", "Precio Unitario", "Descuento", "IVA", "Total", "Comisión"],
    formulas: ["ventas", "facturas"],
    structure: `
ESTRUCTURA DE PLANTILLA - VENTAS:
--- HOJA: Registro de Ventas
| No. | Fecha | Cliente | Vendedor | Producto | Cantidad | Precio Unit. | Subtotal | Descuento % | Descuento $ | IVA 19% | Total | Comisión 5% |
(Mínimo 20 ventas con datos realistas)
| TOTALES | | | | | =SUMA(F:F) | =PROMEDIO(G:G) | =SUMA(H:H) | | =SUMA(J:J) | =SUMA(K:K) | =SUMA(L:L) | =SUMA(M:M) |

--- HOJA: Ranking Vendedores
| Vendedor | Ventas Totales | Unidades | Comisión Total | Ticket Promedio | Ranking |
(Usar SUMAR.SI para cada vendedor)

--- HOJA: Productos Más Vendidos
| Producto | Unidades Vendidas | Ingresos | Margen | Ranking |
(Top 10 productos)

--- HOJA: Metas y Cumplimiento
| Vendedor | Meta Mensual | Ventas Actuales | Cumplimiento % | Diferencia | Estado |
| Vendedor 1 | 5000000 | =SUMAR.SI(...) | =C2/B2*100 | =C2-B2 | =SI(D2>=100,"Logrado","Pendiente") |`
  },
  "inventory": {
    title: "Control de Inventario",
    systemPrompt: "Genera una tabla de inventario completa con productos, stock, precios, valoración y fórmulas de gestión de inventario.",
    columns: ["Código", "Producto", "Stock Actual", "Stock Mínimo", "Precio Compra", "Precio Venta", "Valor Total", "Estado"],
    formulas: ["inventario", "ventas"],
    structure: `
ESTRUCTURA DE PLANTILLA - INVENTARIO:
--- HOJA: Inventario
| Código | Producto | Categoría | Ubicación | Stock Actual | Stock Mínimo | Stock Máximo | Precio Compra | Precio Venta | Valor Stock | Margen % | Estado |
(Mínimo 25 productos)
| L2:L26 = =SI(E2<F2,"⚠️ REABASTECER",SI(E2>G2,"⚡ EXCESO","✅ OK")) |
| TOTALES | | | | =SUMA(E:E) | | | | | =SUMA(J:J) | =PROMEDIO(K:K) | |

--- HOJA: Productos Críticos
| Código | Producto | Stock | Mínimo | Unidades Faltantes | Costo Reposición |
(Filtrar donde Stock < Stock Mínimo)

--- HOJA: Valoración
| Categoría | Cantidad Productos | Unidades Totales | Valor Total | % del Inventario |
(Resumen por categoría)
| TOTAL INVENTARIO | =CONTARA(...) | =SUMA(...) | =SUMA(...) | 100% |

--- HOJA: Movimientos
| Fecha | Código | Producto | Tipo | Cantidad | Stock Anterior | Stock Nuevo | Responsable |
(Registro de entradas y salidas)`
  },
  "budget": {
    title: "Presupuesto",
    systemPrompt: "Genera una tabla de presupuesto detallada con categorías, montos, variaciones y fórmulas de control presupuestario.",
    columns: ["Categoría", "Subcategoría", "Presupuestado", "Ejecutado", "Variación", "% Ejecución", "Estado"],
    formulas: ["presupuesto", "finanzas"],
    structure: `
ESTRUCTURA DE PLANTILLA - PRESUPUESTO:
--- HOJA: Presupuesto Detallado
| Área | Categoría | Subcategoría | Presupuesto Anual | Ene | Feb | Mar | Abr | May | Jun | Jul | Ago | Sep | Oct | Nov | Dic | Total Ejecutado | Variación | % Ejecución |
(Categorías principales con subcategorías)
| TOTAL | | | =SUMA(D:D) | =SUMA(E:E) | ... | =SUMA(P:P) | =Q-D | =Q/D*100 |

--- HOJA: Resumen Mensual
| Mes | Presupuestado | Ejecutado | Variación | % Ejecución | Estado | Acumulado |
| Enero | valor | valor | =C2-B2 | =C2/B2*100 | =SI(E2>110%,"Excedido",SI(E2<90%,"Bajo","Normal")) | =C2 |
(12 meses + Total)

--- HOJA: Por Área
| Área | Presupuesto | Ejecutado | Disponible | % Usado | Estado |
(Cada área/departamento)

--- HOJA: Indicadores
| KPI | Valor | Meta | Cumplimiento |
| % Ejecución Total | =formula | 100% | |
| Mayor Desviación | | | |
| Áreas en Rojo | =CONTAR.SI(...) | 0 | |`
  },
  "report": {
    title: "Informe",
    systemPrompt: "Genera una tabla estructurada para informes con métricas, comparativos y fórmulas de análisis.",
    columns: ["Período", "Métrica", "Valor Actual", "Valor Anterior", "Variación", "% Cambio"],
    formulas: ["finanzas", "kpi"],
    structure: `
ESTRUCTURA DE PLANTILLA - INFORME:
--- HOJA: Resumen Ejecutivo
| Indicador | Período Actual | Período Anterior | Variación | % Cambio | Tendencia |
(KPIs principales del negocio)
| =SI(E>0,"↑ Mejora","↓ Atención") en columna Tendencia |

--- HOJA: Datos Detallados
| Fecha | Categoría | Subcategoría | Valor | Observaciones |
(Datos de respaldo)

--- HOJA: Comparativo
| Métrica | Q1 | Q2 | Q3 | Q4 | Total Año | vs Año Anterior |
(Comparativo trimestral)

--- HOJA: Gráficos Datos
| Categoría | Valor | Porcentaje |
(Datos listos para gráficos de Excel)`
  },
  "project": {
    title: "Gestión de Proyecto",
    systemPrompt: "Genera una tabla de seguimiento de proyecto con tareas, responsables, fechas, costos y fórmulas de gestión.",
    columns: ["Tarea", "Responsable", "Fecha Inicio", "Fecha Fin", "Días", "Costo Estimado", "Costo Real", "Variación", "Estado"],
    formulas: ["presupuesto", "kpi"],
    structure: `
ESTRUCTURA DE PLANTILLA - PROYECTO:
--- HOJA: Cronograma
| ID | Fase | Tarea | Responsable | Fecha Inicio | Fecha Fin | Duración | Dependencia | % Avance | Estado |
(Mínimo 20 tareas organizadas por fases)
| Estado = =SI(I2>=100,"✅ Completado",SI(F2<HOY(),"⚠️ Retrasado","🔄 En Progreso")) |

--- HOJA: Presupuesto Proyecto
| Fase | Concepto | Presupuesto | Ejecutado | Comprometido | Disponible | % Usado |
(Desglose por fase y concepto)
| TOTAL | | =SUMA(C:C) | =SUMA(D:D) | =SUMA(E:E) | =C-D-E | =D/C*100 |

--- HOJA: Equipo
| Nombre | Rol | Horas Asignadas | Horas Trabajadas | Costo/Hora | Costo Total |
(Equipo del proyecto)

--- HOJA: Indicadores
| KPI | Valor | Meta | Estado |
| % Avance General | =PROMEDIO(Cronograma!I:I) | 100% | |
| Tareas Completadas | =CONTAR.SI(...) | Total | |
| Desviación Presupuesto | =formula | <10% | |
| Días Restantes | =MAX(Fechas)-HOY() | | |`
  },
  "payroll": {
    title: "Nómina",
    systemPrompt: "Genera una tabla de nómina completa con empleados, salarios, deducciones, aportes y todas las fórmulas de nómina colombiana.",
    columns: ["Empleado", "Cargo", "Salario Base", "Aux. Transporte", "Horas Extra", "Bonificaciones", "Salud", "Pensión", "Otras Deducciones", "Neto a Pagar"],
    formulas: ["nomina"],
    structure: `
ESTRUCTURA DE PLANTILLA - NÓMINA:
--- HOJA: Nómina Mensual
| No. | Cédula | Empleado | Cargo | Área | Salario Base | Aux. Transporte | Días Trabajados | Horas Extra Diurnas | Horas Extra Nocturnas | Bonificaciones | Total Devengado | Salud 4% | Pensión 4% | Otros Descuentos | Total Deducciones | Neto a Pagar |
(Mínimo 10 empleados)
| Aux. Transporte solo si salario <= 2 SMMLV |
| Total Devengado = Salario + Aux + HE + Bonificaciones |
| Neto = Devengado - Deducciones |
| TOTALES en última fila |

--- HOJA: Aportes Empleador
| Empleado | Salud 8.5% | Pensión 12% | ARL | Caja 4% | ICBF 3% | SENA 2% | Total Aportes |
(Por cada empleado)

--- HOJA: Provisiones
| Empleado | Prima | Cesantías | Int. Cesantías | Vacaciones | Total Provisiones |
| Prima = Salario * Días / 360 |
| Cesantías = (Salario + Aux) * Días / 360 |
| Int. Cesantías = Cesantías * 12% |
| Vacaciones = Salario * Días / 720 |

--- HOJA: Resumen
| Concepto | Valor |
| Total Salarios | =SUMA(...) |
| Total Deducciones | =SUMA(...) |
| Total Neto Pagado | =SUMA(...) |
| Costo Empresa (Aportes) | =SUMA(...) |
| COSTO TOTAL NÓMINA | =B2+B4 |`
  },
  "invoice-tracker": {
    title: "Seguimiento de Facturas",
    systemPrompt: "Genera una tabla de facturas completa con clientes, montos, vencimientos, estados y fórmulas de facturación.",
    columns: ["No. Factura", "Cliente", "Fecha Emisión", "Fecha Vencimiento", "Subtotal", "IVA", "Retenciones", "Total", "Días Vencidos", "Estado"],
    formulas: ["facturas", "contabilidad"],
    structure: `
ESTRUCTURA DE PLANTILLA - FACTURAS:
--- HOJA: Registro Facturas
| No. Factura | Cliente | NIT/CC | Concepto | Fecha Emisión | Fecha Vencimiento | Subtotal | IVA 19% | Retención Fuente | Retención ICA | Total a Pagar | Fecha Pago | Estado Pago | Días Vencidos |
(Mínimo 15 facturas)
| IVA = Subtotal * 0.19 |
| Total = Subtotal + IVA - Retenciones |
| Días Vencidos = =SI(M2="Pagada",0,HOY()-F2) |
| Estado = =SI(M2="Pagada","✅",SI(N2>30,"🔴 Crítico",SI(N2>0,"🟡 Vencida","🟢 Vigente"))) |

--- HOJA: Cartera por Edad
| Rango | Cantidad | Monto | % del Total |
| Vigentes | =CONTAR.SI(...) | =SUMAR.SI(...) | |
| 1-30 días | | | |
| 31-60 días | | | |
| 61-90 días | | | |
| Más de 90 días | | | |
| TOTAL CARTERA | | | 100% |

--- HOJA: Por Cliente
| Cliente | Facturas | Monto Total | Pagado | Pendiente | Días Promedio |
(Resumen por cliente)

--- HOJA: Resumen Mensual
| Mes | Facturado | Recaudado | Pendiente | % Recaudo |
(12 meses)`
  },
  "kpi": {
    title: "Indicadores KPI",
    systemPrompt: "Genera una tabla de KPIs profesional con indicadores, metas, valores actuales, cumplimiento y fórmulas de seguimiento.",
    columns: ["KPI", "Área", "Meta", "Valor Actual", "% Cumplimiento", "Tendencia", "Estado"],
    formulas: ["kpi", "finanzas"],
    structure: `
ESTRUCTURA DE PLANTILLA - KPIs:
--- HOJA: Dashboard KPIs
| Área | KPI | Descripción | Unidad | Meta | Valor Actual | % Cumplimiento | Tendencia | Peso | Score Ponderado | Estado |
(Mínimo 15 KPIs de diferentes áreas)
| % Cumplimiento = Actual / Meta * 100 |
| Score Ponderado = Cumplimiento * Peso |
| Estado = =SI(G2>=100,"🟢",SI(G2>=80,"🟡","🔴")) |
| SCORE GLOBAL | | | | | | =PROMEDIO.SI.CONJUNTO(...) | | | =SUMA(J:J)/SUMA(I:I) | |

--- HOJA: Histórico
| KPI | Ene | Feb | Mar | Abr | May | Jun | Jul | Ago | Sep | Oct | Nov | Dic | Promedio | Tendencia |
(Evolución mensual de cada KPI)

--- HOJA: Por Área
| Área | KPIs | Score Promedio | KPIs en Verde | KPIs en Rojo | Estado General |
(Resumen por área/departamento)

--- HOJA: Metas vs Real
| KPI | Meta Anual | Acumulado Real | Gap | Proyección Año | Cumplirá Meta |
(Proyección de cumplimiento)`
  },
  "macros": {
    title: "Plantilla con Macros",
    systemPrompt: "Genera una tabla con datos de ejemplo, fórmulas avanzadas y código VBA para automatización.",
    columns: ["Dato 1", "Dato 2", "Dato 3", "Fórmula", "Resultado"],
    formulas: ["contabilidad", "finanzas", "ventas"],
    structure: `
ESTRUCTURA DE PLANTILLA - MACROS Y AUTOMATIZACIÓN:
--- HOJA: Datos
| ID | Categoría | Valor 1 | Valor 2 | Resultado | Validación |
(Datos para procesar con macros)
| Validación = =SI(E2>0,"OK","Error") |

--- HOJA: Panel Control
| Acción | Descripción | Atajo |
| Actualizar Datos | Recalcula todas las fórmulas | Ctrl+Shift+U |
| Generar Informe | Crea resumen automático | Ctrl+Shift+R |
| Limpiar Datos | Borra datos temporales | Ctrl+Shift+L |

--- HOJA: Instrucciones
| Paso | Instrucción |
| 1 | Habilitar macros al abrir |
| 2 | Ingresar datos en hoja "Datos" |
| 3 | Usar botones del Panel de Control |

--- HOJA: Código VBA
(Incluir ejemplos de código VBA como texto)
Sub ActualizarDatos()
    ActiveWorkbook.RefreshAll
End Sub`
  },
  "custom": {
    title: "Personalizado",
    systemPrompt: "Genera una tabla personalizada según la descripción del usuario, con estructura profesional y fórmulas relevantes.",
    columns: [],
    formulas: ["contabilidad", "finanzas", "ventas", "inventario", "nomina", "presupuesto", "kpi", "facturas"],
    structure: `
INSTRUCCIONES PARA PLANTILLA PERSONALIZADA:
1. Analiza la descripción del usuario
2. Crea una estructura de múltiples hojas:
   - Hoja principal con datos
   - Hoja de resumen/totales
   - Hoja de análisis o gráficos
3. Incluye:
   - Encabezados claros y descriptivos
   - Mínimo 15-20 filas de datos ejemplo
   - Fórmulas de SUMA, PROMEDIO, etc.
   - Columnas calculadas
   - Estados con SI() condicional
   - Fila de totales
4. Usa formato de tabla con | separadores
5. Agrega emojis para estados: ✅ 🟢 🟡 🔴 ⚠️`
  }
};

serve(async (req) => {
  console.log("generate-xlsx: Request received", req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check rate limit (10 requests per minute for XLSX generation)
    const { data: isAllowed, error: rateLimitError } = await supabase
      .rpc('check_api_rate_limit', { 
        p_ip_address: clientIp, 
        p_endpoint: 'generate-xlsx',
        p_max_requests: 10,
        p_window_minutes: 1
      });
    
    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
    }
    
    if (isAllowed === false) {
      console.log(`Rate limit exceeded for IP: ${clientIp}`);
      return new Response(
        JSON.stringify({ error: 'Demasiadas solicitudes. Por favor espera un momento.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Record this request (fire and forget)
    void supabase.rpc('record_api_request', { 
      p_ip_address: clientIp, 
      p_endpoint: 'generate-xlsx' 
    });
    const body = await req.json();
    console.log("generate-xlsx: Body parsed", JSON.stringify(body).substring(0, 200));
    
    const { templateType, description, customTitle, importedData, includeCharts } = body;

    if (!templateType || !description) {
      console.log("generate-xlsx: Missing required fields");
      return new Response(
        JSON.stringify({ error: "Se requiere tipo de plantilla y descripción" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const template = templates[templateType];
    if (!template) {
      console.log("generate-xlsx: Invalid template type", templateType);
      return new Response(
        JSON.stringify({ error: "Tipo de plantilla no válido" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error("generate-xlsx: LOVABLE_API_KEY not found");
      return new Response(
        JSON.stringify({ error: "Error de configuración del servidor" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const hasImportedData = importedData && importedData.trim().length > 0;

    // Build formulas section based on template type
    const relevantFormulas = template.formulas
      .map(cat => formulaCategories[cat as keyof typeof formulaCategories])
      .filter(Boolean)
      .join('\n\n');

    const chartInstructions = includeCharts ? `
También crea una sección adicional separada con "--- HOJA: Resumen y Análisis" que incluya:
- Resumen con totales, promedios, máximos, mínimos
- KPIs calculados automáticamente
- Datos agregados por categoría listos para gráficos
- Fórmulas de tendencia y proyección` : '';

    const systemPrompt = `Eres un experto en Excel, contabilidad, finanzas y análisis de datos. ${template.systemPrompt}

REGLAS OBLIGATORIAS:
1. Genera datos en formato tabla usando | (pipe) como separador
2. Primera fila = encabezados profesionales y claros
3. Datos REALISTAS, PROFESIONALES y ÚTILES (no genéricos)
4. Para múltiples hojas usa "--- HOJA: NombreHoja" en línea separada
5. INCLUYE TODAS LAS FÓRMULAS RELEVANTES en notación Excel (=SUMA, =PROMEDIO, =SI, etc.)
6. Agrega una fila de TOTALES/RESUMEN con fórmulas al final de cada tabla numérica
7. Incluye columnas calculadas con fórmulas donde sea apropiado
8. USA EMOJIS para estados: ✅ Completado, 🟢 OK, 🟡 Atención, 🔴 Crítico, ⚠️ Alerta
9. MÍNIMO 15-20 filas de datos por hoja principal
10. Incluye validaciones con =SI() para estados automáticos
${hasImportedData ? '11. Usa los datos CSV importados como base y aplica las fórmulas' : ''}
${chartInstructions}

ESTRUCTURA REQUERIDA:
${template.structure}

${relevantFormulas}

FÓRMULAS EXCEL A USAR:
- =SUMA(rango) para totales
- =PROMEDIO(rango) para promedios  
- =MAX(rango), =MIN(rango) para extremos
- =SI(condición, verdadero, falso) para estados y validaciones
- =BUSCARV(valor, rango, columna, falso) para búsquedas
- =SUMAR.SI(rango_criterio, criterio, rango_suma) para sumas por categoría
- =CONTAR.SI(rango, criterio) para conteos condicionales
- =REDONDEAR(número, decimales) para redondeos
- =CONCATENAR() o & para unir texto
- =HOY() para fecha actual
- =DIAS(fecha_fin, fecha_inicio) para diferencia de días
- =PORCENTAJE: valor/total*100

${template.columns.length > 0 ? `Columnas sugeridas: ${template.columns.join(', ')}` : ''}

FORMATO EJEMPLO:
--- HOJA: Datos
| Producto | Cantidad | Precio | Total | Margen | Estado |
| Producto A | 10 | 100 | =B2*C2 | =D2*0.3 | =SI(D2>500,"🟢","🟡") |
| Producto B | 5 | 200 | =B3*C3 | =D3*0.3 | =SI(D3>500,"🟢","🟡") |
| TOTAL | =SUMA(B2:B3) | =PROMEDIO(C2:C3) | =SUMA(D2:D3) | =SUMA(E2:E3) | |

--- HOJA: Resumen
| Métrica | Valor |
| Total Productos | =CONTARA('Datos'!A:A)-1 |
| Venta Total | =SUMA('Datos'!D:D) |
| Margen Promedio | =PROMEDIO('Datos'!E:E) |`;

    let userMessage = `Genera un Excel profesional para: ${description}

IMPORTANTE: 
- Incluye TODAS las fórmulas necesarias para cálculos automáticos
- Agrega filas de totales con =SUMA(), =PROMEDIO(), etc.
- Incluye columnas calculadas donde aplique
- Usa formato de fórmula Excel real (=FORMULA)`;
    
    if (hasImportedData) {
      userMessage += `\n\nDATOS CSV IMPORTADOS (usar como base):\n${importedData.substring(0, 8000)}`;
    }

    console.log("generate-xlsx: Calling AI API with formulas");

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
      }),
    });

    console.log("generate-xlsx: AI response status", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("generate-xlsx: AI API Error", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de solicitudes excedido. Intenta en unos momentos." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Error al conectar con el servicio de IA" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log("generate-xlsx: AI response received");
    
    const content = data.choices?.[0]?.message?.content || "";
    
    if (!content) {
      console.error("generate-xlsx: Empty content from AI");
      return new Response(
        JSON.stringify({ error: "No se generó contenido. Intenta de nuevo." }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("generate-xlsx: Success, content length", content.length);

    return new Response(
      JSON.stringify({
        content,
        title: customTitle || template.title,
        templateType
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("generate-xlsx: Error", error);
    return new Response(
      JSON.stringify({ error: "Ocurrió un error inesperado. Por favor intenta de nuevo." }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
