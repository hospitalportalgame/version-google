/* HOSPITAL PORTAL — Sistema de Investigación Clínica y Deducción
 * Módulo de evidencias, deducciones y sospechas para los casos clínicos.
 * Casos disponibles: Martín (masld-intro-v1-reasoning-v2), Sofía (gilbert-v1-reasoning-v2) y Elena (masld-older-v1-reasoning-v2).
 */
(function() {
  'use strict';

  window.HepatoDay1Modules = window.HepatoDay1Modules || {};

  function isMartin(caseData) {
    if (!caseData) return false;
    const id = caseData.id || '';
    const name = caseData.patient?.name || '';
    return id.includes('masld-intro') || id.includes('martin') || name === 'Martín';
  }

  function isSofia(caseData) {
    if (!caseData) return false;
    const id = caseData.id || '';
    const name = caseData.patient?.name || '';
    return id.includes('gilbert') || id.includes('sofia') || name === 'Sofía';
  }

  function isElena(caseData) {
    if (!caseData) return false;
    const id = caseData.id || '';
    const name = caseData.patient?.name || '';
    return id.includes('masld-older') || id.includes('elena') || name === 'Elena';
  }

  // --- CATÁLOGO DE MARTÍN ---
  function getMartinClues(caseData, clinical) {
    const c = clinical || {};
    const asked = Array.isArray(c.asked) ? c.asked : [];
    const reviewed = Array.isArray(c.reviewed) ? c.reviewed : [];
    const examDone = Boolean(c.exam);
    const examChecks = Array.isArray(c.examChecks) ? c.examChecks : [];
    const hasFib4 = Number.isFinite(c.calculations?.fib4);
    const fib4Val = hasFib4 ? c.calculations.fib4 : null;

    return [
      {
        id: 'martin-clue-presentation',
        title: 'Motivo de consulta: Pruebas hepáticas alteradas en chequeo',
        category: 'anamnesis',
        categoryLabel: 'Anamnesis',
        icon: '📋',
        source: 'Relato inicial',
        discovered: true,
        hint: 'Disponible al inicio de la consulta.',
        text: '«Me derivaron porque en un chequeo salieron alteradas unas pruebas del hígado. No siento nada.» Hallazgo incidental en paciente asintomático.'
      },
      {
        id: 'martin-clue-evolution',
        title: 'Evolución: Alteración hace 8 semanas, sin síntomas de alarma',
        category: 'anamnesis',
        categoryLabel: 'Anamnesis',
        icon: '⏱️',
        source: 'Anamnesis · Cronología',
        discovered: asked.includes('evolution'),
        hint: 'Explorar cronología y síntomas en la conversación.',
        text: 'Alteración detectada hace 8 semanas en control laboral con análisis previos normales. Niega ictericia, prurito, dolor abdominal, edema, sangrado o confusión.'
      },
      {
        id: 'martin-clue-metabolico',
        title: 'Antecedentes cardiometabólicos: DM2, obesidad y dislipidemia',
        category: 'anamnesis',
        categoryLabel: 'Anamnesis',
        icon: '🫀',
        source: 'Anamnesis · Antecedentes',
        discovered: asked.includes('background'),
        hint: 'Explorar antecedentes personales en la conversación.',
        text: 'Diagnóstico conocido de diabetes mellitus tipo 2, obesidad y dislipidemia. Sin enfermedad hepática diagnosticada previamente ni antecedentes familiares hepáticos.'
      },
      {
        id: 'martin-clue-dm2-obesidad',
        title: 'Factores metabólicos: Diabetes tipo 2 y obesidad asociadas',
        category: 'anamnesis',
        categoryLabel: 'Anamnesis',
        icon: '🧬',
        source: 'Anamnesis · Antecedentes',
        discovered: asked.includes('background'),
        hint: 'Explorar comorbilidades metabólicas en la conversación.',
        text: 'Coexistencia de diabetes mellitus tipo 2 y obesidad clínica, perfil estrechamente vinculado a resistencia insulínica y depósito graso hepático.'
      },
      {
        id: 'martin-clue-dislipidemia',
        title: 'Comorbilidad lipídica: Dislipidemia conocida',
        category: 'anamnesis',
        categoryLabel: 'Anamnesis',
        icon: '🩸',
        source: 'Anamnesis · Antecedentes',
        discovered: asked.includes('background'),
        hint: 'Explorar antecedentes lipídicos en la conversación.',
        text: 'Antecedente personal de dislipidemia dentro de su contexto de síndrome cardiometabólico.'
      },
      {
        id: 'martin-clue-farmacos',
        title: 'Medicación: Metformina y Atorvastatina estables (2 años)',
        category: 'anamnesis',
        categoryLabel: 'Anamnesis',
        icon: '💊',
        source: 'Anamnesis · Medicación',
        discovered: asked.includes('medications'),
        hint: 'Explorar fármacos y suplementos en la conversación.',
        text: 'Toma metformina y atorvastatina desde hace 2 años sin cambios recientes de dosis ni interrupciones. Niega consumo de hierbas, suplementos o fármacos nuevos.'
      },
      {
        id: 'martin-clue-alcohol',
        title: 'Exposición a alcohol: 0–10 g/semana y sin otros tóxicos',
        category: 'anamnesis',
        categoryLabel: 'Anamnesis',
        icon: '🍷',
        source: 'Anamnesis · Exposiciones',
        discovered: asked.includes('exposures'),
        hint: 'Explorar consumo de alcohol y exposiciones en la conversación.',
        text: 'Consumo referido de alcohol de 0 a 10 g por semana (muy ocasional). Niega transfusiones, procedimientos recientes o uso de drogas inyectables.'
      },
      {
        id: 'martin-clue-contexto',
        title: 'Contexto laboral: Turnos largos al volante y comidas irregulares',
        category: 'anamnesis',
        categoryLabel: 'Anamnesis',
        icon: '🚛',
        source: 'Anamnesis · Entorno',
        discovered: asked.includes('context') || asked.includes('probe-1'),
        hint: 'Explorar entorno laboral y rutina diaria en la conversación.',
        text: 'Trabaja como conductor con jornadas prolongadas al volante; refiere dificultad para sostener horarios regulares de alimentación y temor a perder su aptitud laboral.'
      },
      {
        id: 'martin-clue-antropometria',
        title: 'Antropometría: PA 132/82 mmHg e IMC 31,2 kg/m²',
        category: 'exam',
        categoryLabel: 'Examen Físico',
        icon: '⚖️',
        source: 'Examen físico',
        discovered: examDone || examChecks.includes(0),
        hint: 'Controlar signos vitales y antropometría en la camilla.',
        text: 'Presión arterial 132/82 mmHg. Índice de masa corporal 31,2 kg/m² (obesidad grado I). Paciente lúcido, orientado y en buen estado general.'
      },
      {
        id: 'martin-clue-abdomen',
        title: 'Exploración física: Abdomen blando, sin estigmas crónicos',
        category: 'exam',
        categoryLabel: 'Examen Físico',
        icon: '🩺',
        source: 'Examen físico',
        discovered: examDone || examChecks.includes(1) || examChecks.includes(2),
        hint: 'Inspeccionar piel/escleras y palpar abdomen en la camilla.',
        text: 'Abdomen blando, depresible e indoloro. Sin ascitis clínica, visceromegalias palpables, ictericia ni estigmas periféricos de hepatopatía crónica.'
      },
      {
        id: 'martin-clue-transaminasas',
        title: 'Aminotransferasas: AST 44 U/L y ALT 68 U/L (FA y BT normales)',
        category: 'studies',
        categoryLabel: 'Laboratorio',
        icon: '🧪',
        source: 'Perfil hepático',
        discovered: reviewed.includes('profile'),
        hint: 'Revisar informe de perfil hepático en la bandeja o PC.',
        text: 'AST 44 U/L (ref: 10–40), ALT 68 U/L (ref: 7–40). Bilirrubina total 0,7 mg/dL (ref: 0,2–1,2), Fosfatasa alcalina 88 U/L (ref: 40–130), GGT 43 U/L. Patrón hepatocelular leve.'
      },
      {
        id: 'martin-clue-sintetica',
        title: 'Síntesis y hemograma: Albúmina 4,3, INR 1,0, Plaquetas 240',
        category: 'studies',
        categoryLabel: 'Laboratorio',
        icon: '🔬',
        source: 'Laboratorio',
        discovered: reviewed.includes('profile') && (reviewed.includes('cbc') || reviewed.includes('inr')),
        hint: 'Revisar informes de laboratorio y coagulación/hemograma.',
        text: 'Albúmina 4,3 g/dL (ref: 3,5–5,0), INR 1,0 (ref: 0,8–1,2), Plaquetas 240 × 10⁹/L (ref: 150–400). Función sintética conservada y sin trombocitopenia.'
      },
      {
        id: 'martin-clue-glucolipidos',
        title: 'Perfil metabólico: HbA1c 7,2 % y Triglicéridos 215 mg/dL',
        category: 'studies',
        categoryLabel: 'Laboratorio',
        icon: '🩸',
        source: 'Panel metabólico',
        discovered: reviewed.includes('metabolic'),
        hint: 'Revisar informe de perfil cardiometabólico.',
        text: 'HbA1c 7,2 % (ref: < 5,7), Triglicéridos 215 mg/dL (ref: < 150), LDL 126 mg/dL. Evidencia bioquímica de control glucémico y lipídico subóptimo.'
      },
      {
        id: 'martin-clue-etiologia',
        title: 'Estudios etiológicos: Virus, hierro y autoinmunidad negativos',
        category: 'studies',
        categoryLabel: 'Laboratorio',
        icon: '🛡️',
        source: 'Cribado etiológico',
        discovered: reviewed.includes('hbv') || reviewed.includes('hcv') || reviewed.includes('iron') || reviewed.includes('autoimmune'),
        hint: 'Revisar estudios etiológicos (serologías virales, perfil de hierro o autoinmunidad).',
        text: 'HBsAg y anti-VHC negativos; ferritina 165 ng/mL y saturación de transferrina 26 % normales; ANA/ASMA negativos con IgG 1.100 mg/dL.'
      },
      {
        id: 'martin-clue-ecografia',
        title: 'Ecografía: Aumento difuso de la ecogenicidad hepática',
        category: 'studies',
        categoryLabel: 'Imágenes',
        icon: '🩻',
        source: 'Ecografía abdominal',
        discovered: reviewed.includes('ultrasound'),
        hint: 'Revisar informe de ecografía abdominal en la bandeja o PC.',
        text: 'Hígado de contornos regulares con aumento difuso de la ecogenicidad compatible con esteatosis. Sin lesiones focales, vía biliar no dilatada, porta permeable y bazo normal.'
      },
      {
        id: 'martin-clue-fib4',
        title: hasFib4 ? `Índice FIB-4 calculado: ${fib4Val.toFixed(2)}` : 'Índice FIB-4',
        category: 'calculator',
        categoryLabel: 'Calculadora',
        icon: '🧮',
        source: 'Calculadora clínica',
        discovered: hasFib4,
        hint: 'Calcular con los datos disponibles en la calculadora del escritorio.',
        text: hasFib4
          ? `Resultado obtenido: ${fib4Val.toFixed(2)} (calculado con edad 46 años, AST 44 U/L, ALT 68 U/L y plaquetas 240 × 10⁹/L; inferior al umbral de 1,30).`
          : 'Cálculo pendiente de realizar en la consulta.'
      }
    ];
  }

  function getMartinRelations(caseData) {
    return [
      {
        id: 'martin-rel-metabolic-enzymes',
        clues: ['martin-clue-metabolico', 'martin-clue-transaminasas'],
        title: 'Antecedentes cardiometabólicos ↔ Alteración de transaminasas',
        description: 'Integración entre las comorbilidades metabólicas (DM2, obesidad, dislipidemia) y la elevación leve de AST/ALT.',
        options: [
          {
            id: 'hypo-masld-likely',
            title: 'Orientación hacia enfermedad hepática esteatósica metabólica (MASLD)',
            detail: 'La citólisis leve en presencia de factores de riesgo cardiometabólicos orienta hacia MASLD como hipótesis principal, sin confirmar el diagnóstico por sí sola ni asumir esteatohepatitis (MASH).'
          },
          {
            id: 'hypo-unrelated-pathology',
            title: 'Proceso hepatocelular primario independiente',
            detail: 'Se plantea que la elevación enzimática responde a una etiología parenquimatosa ajena al terreno cardiometabólico del paciente.'
          },
          {
            id: 'hypo-combined-vulnerability',
            title: 'Susceptibilidad metabólica con posible cofactor adicional',
            detail: 'El terreno metabólico predispone a esteatosis, pero obliga a descartar causas concomitantes (virales, férricas o farmacológicas).'
          }
        ]
      },
      {
        id: 'martin-rel-presentation-metabolic',
        clues: ['martin-clue-presentation', 'martin-clue-metabolico'],
        title: 'Hallazgo hepático en chequeo ↔ Antecedentes cardiometabólicos',
        description: 'Relación entre la alteración analítica asintomática del chequeo y los factores de riesgo metabólicos conocidos.',
        options: [
          {
            id: 'hypo-pres-masld-orientation',
            title: 'Sospecha inicial de afectación hepática metabólica (MASLD)',
            detail: 'La forma de presentación más frecuente de MASLD es el hallazgo incidental asintomático en un paciente con diabetes, obesidad o dislipidemia; requiere confirmación estructural y exclusión de otras causas.'
          },
          {
            id: 'hypo-pres-acute-hepatitis',
            title: 'Sospecha de hepatitis aguda infecciosa',
            detail: 'Se interpreta el hallazgo del chequeo como una infección viral aguda pese a la ausencia de síntomas prodrómicos o ictericia.'
          },
          {
            id: 'hypo-pres-biliary',
            title: 'Sospecha de patología obstructiva biliar',
            detail: 'Se atribuye la derivación a una litiasis biliar silente sin dolor cólico ni colestasis clínica.'
          }
        ]
      },
      {
        id: 'martin-rel-dm2-obesity-bmi',
        clues: ['martin-clue-dm2-obesidad', 'martin-clue-antropometria'],
        title: 'Diabetes tipo 2 y obesidad ↔ IMC 31,2 kg/m²',
        description: 'Correlación entre el antecedente referido de diabetes/obesidad y la antropometría objetivada en el examen físico.',
        options: [
          {
            id: 'hypo-insulin-resistance-substrate',
            title: 'Sustrato de resistencia insulínica y riesgo de progresión fibrótica',
            detail: 'La coexistencia de DM2 e IMC ≥ 30 kg/m² promueve lipólisis periférica y esteatosis hepática, siendo la diabetes el principal factor metabólico asociado a progresión de fibrosis.'
          },
          {
            id: 'hypo-isolated-anthropometry',
            title: 'Hallazgo antropométrico sin relevancia hepatológica',
            detail: 'Se considera que el IMC de 31,2 kg/m² y la diabetes no guardan relación fisiopatológica con el parénquima hepático.'
          },
          {
            id: 'hypo-fluid-overload',
            title: 'Aumento ponderal secundario a retención hídrica',
            detail: 'Se interpreta el IMC elevado como sobrecarga de volumen pese a la ausencia de ascitis o edemas en la exploración.'
          }
        ]
      },
      {
        id: 'martin-rel-dm2-enzymes',
        clues: ['martin-clue-dm2-obesidad', 'martin-clue-transaminasas'],
        title: 'Diabetes tipo 2 y obesidad ↔ Elevación leve de AST y ALT',
        description: 'Vínculo entre la resistencia a la insulina y el patrón bioquímico hepatocelular leve (ALT > AST).',
        options: [
          {
            id: 'hypo-dm2-masld-hypothesis',
            title: 'Hipótesis de MASLD sin asumir MASH por bioquímica aislada',
            detail: 'El predominio de ALT sobre AST en un paciente con DM2 y obesidad sugiere MASLD; sin embargo, el nivel de transaminasas no confirma ni descarta esteatohepatitis (MASH) ni define el estadio de fibrosis.'
          },
          {
            id: 'hypo-dm2-mash-confirmed',
            title: 'Asumir esteatohepatitis (MASH) confirmada solo por ALT elevada',
            detail: 'Se concluye erróneamente que toda elevación de ALT en un paciente diabético equivale a inflamación necroinflamatoria con balonización (MASH).'
          },
          {
            id: 'hypo-dm2-unrelated',
            title: 'Alteración enzimática desvinculada del metabolismo glucémico',
            detail: 'Se descarta vínculo entre la resistencia insulínica y la elevación de aminotransferasas.'
          }
        ]
      },
      {
        id: 'martin-rel-dm2-glucolipids',
        clues: ['martin-clue-dm2-obesidad', 'martin-clue-glucolipidos'],
        title: 'Diabetes tipo 2 y obesidad ↔ HbA1c 7,2 % y Triglicéridos 215 mg/dL',
        description: 'Concordancia entre los antecedentes metabólicos y la repercusión analítica actual.',
        options: [
          {
            id: 'hypo-metabolic-dysfunction-active',
            title: 'Disfunción cardiometabólica activa que requiere optimizar el manejo',
            detail: 'La HbA1c de 7,2 % y la hipertrigliceridemia confirman actividad metabólica subóptima que estimula la acumulación hepática de triglicéridos y constituye una diana terapéutica central.'
          },
          {
            id: 'hypo-metabolic-optimal',
            title: 'Control metabólico completamente normalizado',
            detail: 'Se interpreta que los parámetros glucémicos y lipídicos no requieren ajustes en hábitos ni seguimiento.'
          }
        ]
      },
      {
        id: 'martin-rel-dyslipidemia-enzymes',
        clues: ['martin-clue-dislipidemia', 'martin-clue-transaminasas'],
        title: 'Dislipidemia conocida ↔ Alteración de aminotransferasas',
        description: 'Relación entre el trastorno del metabolismo lipídico y la elevación leve de AST/ALT.',
        options: [
          {
            id: 'hypo-dyslip-masld',
            title: 'Componente dislipidémico del espectro MASLD',
            detail: 'La dislipidemia aterogénica forma parte de los criterios cardiometabólicos que orientan hacia MASLD ante una hipertransaminasemia leve en estudio.'
          },
          {
            id: 'hypo-dyslip-cholestasis',
            title: 'Atribuir la dislipidemia a colestasis intrahepática',
            detail: 'Se plantea que el colesterol elevado es secundario a obstrucción biliar pese a tener fosfatasa alcalina y bilirrubina normales.'
          }
        ]
      },
      {
        id: 'martin-rel-dyslipidemia-glucolipids',
        clues: ['martin-clue-dislipidemia', 'martin-clue-glucolipidos'],
        title: 'Dislipidemia conocida ↔ Triglicéridos 215 mg/dL y HbA1c 7,2 %',
        description: 'Evaluación del perfil lipídico y glucémico actual respecto a los antecedentes del paciente.',
        options: [
          {
            id: 'hypo-tg-persistence',
            title: 'Hipertrigliceridemia persistente asociada a resistencia insulínica',
            detail: 'El exceso de triglicéridos circulantes (215 mg/dL) refleja el flujo aumentado de ácidos grasos libres hacia el hígado y refuerza la necesidad de medidas nutricionales y ejercicio.'
          },
          {
            id: 'hypo-tg-artifact',
            title: 'Hallazgo analítico aislado sin valor clínico',
            detail: 'Se desestima la elevación de triglicéridos y HbA1c dentro del abordaje hepatológico.'
          }
        ]
      },
      {
        id: 'martin-rel-glucolipids-enzymes',
        clues: ['martin-clue-glucolipidos', 'martin-clue-transaminasas'],
        title: 'HbA1c 7,2 % y Triglicéridos 215 mg/dL ↔ AST 44 y ALT 68 U/L',
        description: 'Correlación entre los marcadores analíticos de disfunción metabólica y la citólisis hepática leve.',
        options: [
          {
            id: 'hypo-biochem-masld-link',
            title: 'Sobrecarga metabólica hepatocelular compatible con MASLD',
            detail: 'La hiperglucemia crónica y la hipertrigliceridemia se asocian a estrés lipotóxico hepatocitario e hipertransaminasemia leve, orientando hacia MASLD sin confirmar MASH por sí solas.'
          },
          {
            id: 'hypo-biochem-autoimmune',
            title: 'Patrón bioquímico sugestivo de hepatitis autoinmune',
            detail: 'Se interpreta la combinación de HbA1c alta y ALT leve como fenómeno autoinmune primario.'
          }
        ]
      },
      {
        id: 'martin-rel-enzymes-ultrasound',
        clues: ['martin-clue-transaminasas', 'martin-clue-ecografia'],
        title: 'Aminotransferasas (AST 44, ALT 68) ↔ Ecografía con esteatosis difusa',
        description: 'Integración entre el patrón bioquímico hepatocelular leve y el hallazgo estructural ecográfico.',
        options: [
          {
            id: 'hypo-steatosis-concordance',
            title: 'Esteatosis hepática documentada con citólisis leve (sin confirmar MASH)',
            detail: 'El aumento difuso de la ecogenicidad demuestra esteatosis y concuerda con la elevación leve de ALT; la ecografía no permite distinguir esteatosis simple de esteatohepatitis (MASH) ni estadificar fibrosis.'
          },
          {
            id: 'hypo-ultrasound-confirms-mash',
            title: 'Diagnóstico ecográfico directo de esteatohepatitis (MASH) y cirrosis',
            detail: 'Se asume que la hiperecogenicidad difusa basta para confirmar inflamación necroinflamatoria (MASH) y fibrosis avanzada.'
          },
          {
            id: 'hypo-biliary-obstruction-us',
            title: 'Colestasis extrahepática obstructiva',
            detail: 'Se plantea obstrucción biliar pese a observarse vía biliar no dilatada y fosfatasa alcalina normal.'
          }
        ]
      },
      {
        id: 'martin-rel-metabolic-ultrasound',
        clues: ['martin-clue-metabolico', 'martin-clue-ecografia'],
        title: 'Antecedentes cardiometabólicos ↔ Ecografía con esteatosis difusa',
        description: 'Criterio positivo de esteatosis hepática asociada a factores de riesgo cardiometabólicos.',
        options: [
          {
            id: 'hypo-positive-masld-criteria',
            title: 'Cumplimiento de criterios clínicos e imagenológicos de MASLD',
            detail: 'La demostración de esteatosis hepática por imagen junto con al menos un factor de riesgo cardiometabólico (DM2, obesidad, dislipidemia) sustenta la hipótesis de MASLD tras excluir consumo excesivo de alcohol y otras causas.'
          },
          {
            id: 'hypo-incidental-unlinked',
            title: 'Hallazgos coincidentes sin relación patogénica',
            detail: 'Se interpreta que la esteatosis ecográfica es independiente de la diabetes, la obesidad y la dislipidemia.'
          }
        ]
      },
      {
        id: 'martin-rel-statin-enzymes',
        clues: ['martin-clue-farmacos', 'martin-clue-transaminasas'],
        title: 'Atorvastatina estable (2 años) ↔ Elevación leve de transaminasas',
        description: 'Evaluación cronológica de lesión hepática inducida por fármacos (DILI) frente a exposición crónica estable.',
        options: [
          {
            id: 'hypo-statin-uncertainty',
            title: 'Baja probabilidad de DILI aguda conservando incertidumbre clínica',
            detail: 'Dos años de tratamiento estable sin cambios de dosis hacen menos probable una toxicidad farmacológica aguda, aunque no la excluyen de forma absoluta; las estatinas son seguras en MASLD y no deben suspenderse de rutina.'
          },
          {
            id: 'hypo-statin-direct-toxic',
            title: 'Lesión farmacológica confirmada que obliga a suspender la estatina hoy',
            detail: 'Se asume certeza de DILI por atorvastatina y se retira la prevención cardiovascular pese a la ausencia de cronología reciente o elevación >3× LSN.'
          },
          {
            id: 'hypo-statin-zero-risk',
            title: 'Imposibilidad absoluta de cualquier efecto farmacológico',
            detail: 'Se descarta sin matices cualquier participación medicamentosa sin necesidad de vigilancia analítica.'
          }
        ]
      },
      {
        id: 'martin-rel-statin-evolution',
        clues: ['martin-clue-farmacos', 'martin-clue-evolution'],
        title: 'Medicación estable (2 años) ↔ Hallazgo analítico hace 8 semanas',
        description: 'Contraste temporal entre el inicio de la medicación habitual y la aparición reciente de la alteración hepática.',
        options: [
          {
            id: 'hypo-chrono-weak-dili',
            title: 'Latencia prolongada poco típica para DILI por estatinas',
            detail: 'La mayoría de las elevaciones clínicamente significativas por estatinas ocurren en los primeros meses tras iniciar o aumentar la dosis; una analítica previa normal tras 2 años orienta a buscar otra causa sin olvidar el seguimiento.'
          },
          {
            id: 'hypo-chrono-acute-dili',
            title: 'Relación temporal inmediata típica de toxicidad aguda',
            detail: 'Se interpreta una exposición estable de dos años como una introducción farmacológica reciente.'
          }
        ]
      },
      {
        id: 'martin-rel-alcohol-enzymes',
        clues: ['martin-clue-alcohol', 'martin-clue-transaminasas'],
        title: 'Consumo de alcohol (0–10 g/semana) ↔ Alteración de transaminasas',
        description: 'Ponderación del consumo de alcohol en el diagnóstico diferencial etiológico de la hipertransaminasemia.',
        options: [
          {
            id: 'hypo-alcohol-below-threshold',
            title: 'Consumo inferior al umbral hepatotóxico: aleja hepatopatía alcohólica (ALD)',
            detail: 'Un consumo ocasional de 0–10 g/semana está muy por debajo del umbral de enfermedad hepática asociada al alcohol y junto al predominio de ALT sobre AST apoya una etiología metabólica (MASLD).'
          },
          {
            id: 'hypo-alcohol-primary-cause',
            title: 'Hepatopatía alcohólica como causa principal',
            detail: 'Se atribuye la citólisis predominantemente al consumo ocasional referido (<10 g/semana).'
          }
        ]
      },
      {
        id: 'martin-rel-alcohol-ultrasound',
        clues: ['martin-clue-alcohol', 'martin-clue-ecografia'],
        title: 'Consumo de alcohol (0–10 g/semana) ↔ Ecografía con esteatosis',
        description: 'Clasificación nosológica de la esteatosis hepática según la cuantificación del consumo de alcohol.',
        options: [
          {
            id: 'hypo-alcohol-masld-classification',
            title: 'Respaldo para clasificar la esteatosis dentro de MASLD (y no MetALD/ALD)',
            detail: 'La esteatosis ecográfica con ingesta alcohólica mínima (<140–210 g/semana) y factores cardiometabólicos se encuadra en MASLD, recomendando igualmente evitar el alcohol para proteger el hígado.'
          },
          {
            id: 'hypo-alcohol-steatosis-ald',
            title: 'Esteatosis alcohólica primaria confirmada',
            detail: 'Se clasifica como hepatopatía alcohólica pese al consumo casi nulo.'
          }
        ]
      },
      {
        id: 'martin-rel-fib4-metabolic',
        clues: ['martin-clue-fib4', 'martin-clue-metabolico'],
        title: 'Índice FIB-4 calculado ↔ Antecedentes cardiometabólicos (DM2, obesidad)',
        description: 'Estratificación no invasiva del riesgo de fibrosis avanzada en un paciente con diabetes tipo 2.',
        options: [
          {
            id: 'hypo-fib4-low-risk-followup',
            title: 'Bajo riesgo actual de fibrosis avanzada (FIB-4 < 1,30) con vigilancia periódica',
            detail: 'El FIB-4 calculado (< 1,30) descarta con alto valor predictivo negativo una fibrosis avanzada actual y evita biopsia o elastografía inmediata, pero la presencia de DM2 exige repetir la estratificación en 1–2 años.'
          },
          {
            id: 'hypo-fib4-excludes-masld',
            title: 'Un FIB-4 bajo descarta MASLD y exime de todo seguimiento futuro',
            detail: 'Se confunde un índice de fibrosis bajo con la ausencia total de esteatosis metabólica o riesgo evolutivo.'
          },
          {
            id: 'hypo-fib4-cirrhosis',
            title: 'Confirmación de cirrosis establecida',
            detail: 'Se interpreta un FIB-4 inferior a 1,30 como indicador de cirrosis avanzada.'
          }
        ]
      },
      {
        id: 'martin-rel-fib4-ultrasound',
        clues: ['martin-clue-fib4', 'martin-clue-ecografia'],
        title: 'Índice FIB-4 calculado ↔ Ecografía con esteatosis difusa',
        description: 'Complementariedad entre la detección imagenológica de esteatosis y la estimación bioquímica de fibrosis.',
        options: [
          {
            id: 'hypo-fib4-us-complementary',
            title: 'Esteatosis presente con baja probabilidad actual de fibrosis avanzada',
            detail: 'Mientras la ecografía identifica grasa parenquimatosa sin medir fibrosis, el FIB-4 < 1,30 aporta la estratificación pronóstica inicial indicando bajo riesgo de fibrosis significativa.'
          },
          {
            id: 'hypo-fib4-us-contradiction',
            title: 'Contradicción absoluta que invalida ambos estudios',
            detail: 'Se asume erróneamente que un FIB-4 bajo contradice el hallazgo ecográfico de esteatosis.'
          }
        ]
      },
      {
        id: 'martin-rel-fib4-sintetica',
        clues: ['martin-clue-fib4', 'martin-clue-sintetica'],
        title: 'Índice FIB-4 calculado ↔ Albúmina 4,3, INR 1,0 y Plaquetas 240',
        description: 'Concordancia entre el puntaje no invasivo de fibrosis y los marcadores de reserva funcional y portal.',
        options: [
          {
            id: 'hypo-fib4-synthetic-concordant',
            title: 'Ausencia de datos bioquímicos de fibrosis avanzada o hipertensión portal',
            detail: 'El recuento plaquetario normal (240 × 10⁹/L), el FIB-4 < 1,30 y la síntesis conservada (albúmina e INR normales) respaldan de forma coherente una hepatopatía en etapa no avanzada.'
          },
          {
            id: 'hypo-fib4-synthetic-portal',
            title: 'Hipertensión portal clínicamente significativa',
            detail: 'Se plantea hipertensión portal pese a plaquetas normales, bazo normal y FIB-4 bajo.'
          }
        ]
      },
      {
        id: 'martin-rel-etiology-enzymes',
        clues: ['martin-clue-etiologia', 'martin-clue-transaminasas'],
        title: 'Virus, hierro y autoinmunidad negativos ↔ Elevación de AST/ALT',
        description: 'Integración del cribado de causas alternativas de hipertransaminasemia crónica.',
        options: [
          {
            id: 'hypo-etiology-exclusion-supports-masld',
            title: 'Exclusión razonable de etiologías virales, férricas y autoinmunes',
            detail: 'La negatividad de HBsAg, anti-VHC y autoanticuerpos junto con ferritina y saturación de transferrina normales descarta causas alternativas frecuentes y consolida la orientación hacia MASLD.'
          },
          {
            id: 'hypo-etiology-hemochromatosis',
            title: 'Sobrecarga primaria de hierro (Hemocromatosis HFE)',
            detail: 'Se sostiene sospecha de hemocromatosis a pesar de ferritina (165 ng/mL) y saturación de transferrina (26 %) normales.'
          }
        ]
      },
      {
        id: 'martin-rel-context-metabolic',
        clues: ['martin-clue-contexto', 'martin-clue-metabolico'],
        title: 'Turnos largos al volante y comidas irregulares ↔ Antecedentes metabólicos',
        description: 'Impacto del entorno laboral sobre los factores cardiometabólicos y la adherencia terapéutica.',
        options: [
          {
            id: 'hypo-context-tailored-plan',
            title: 'Necesidad de adaptar el plan nutricional y de actividad física a su rutina en ruta',
            detail: 'El trabajo como conductor favorece el sedentarismo y los horarios irregulares, pero no contraindica conducir; el manejo de MASLD requiere acordar pautas realistas que pueda sostener en sus viajes.'
          },
          {
            id: 'hypo-context-work-ban',
            title: 'Incapacidad laboral inmediata por esteatosis simple',
            detail: 'Se indica suspender su actividad laboral como conductor aunque el paciente está asintomático y sin descompensación.'
          }
        ]
      }
    ];
  }

  function getMartinSuspicions(caseData) {
    return [
      {
        id: 'masld',
        title: 'Enfermedad Hepática Esteatósica Metabólica (MASLD)',
        shortTitle: 'MASLD',
        color: 'teal',
        description: 'Sospecha de afección hepática en contexto de comorbilidad metabólica.'
      },
      {
        id: 'dili',
        title: 'Lesión Hepática Inducida por Fármacos (DILI) / Atorvastatina',
        shortTitle: 'DILI (Atorvastatina)',
        color: 'amber',
        description: 'Sospecha de lesión hepatocelular asociada a fármacos.'
      },
      {
        id: 'ald',
        title: 'Hepatopatía Relacionada con Alcohol (ALD)',
        shortTitle: 'Hepatopatía por Alcohol',
        color: 'coral',
        description: 'Sospecha de afección hepática asociada al consumo de alcohol.'
      }
    ];
  }

  // --- CATÁLOGO DE SOFÍA (SÍNDROME DE GILBERT) ---
  function getSofiaClues(caseData, clinical) {
    const c = clinical || {};
    const asked = Array.isArray(c.asked) ? c.asked : [];
    const reviewed = Array.isArray(c.reviewed) ? c.reviewed : [];
    const examDone = Boolean(c.exam);
    const examChecks = Array.isArray(c.examChecks) ? c.examChecks : [];

    return [
      {
        id: 'sofia-clue-presentation',
        title: 'Motivo de consulta: Ojos amarillos intermitentes',
        category: 'anamnesis',
        categoryLabel: 'Anamnesis',
        icon: '📋',
        source: 'Relato inicial',
        discovered: true,
        hint: 'Disponible al inicio de la consulta.',
        text: '«Después de rendir y pasar horas sin comer, noto los ojos un poco amarillos. A los pocos días se me pasa.» Refiere encontrarse asintomática entre los episodios.'
      },
      {
        id: 'sofia-clue-evolution',
        title: 'Evolución: Episodios autolimitados desde la adolescencia',
        category: 'anamnesis',
        categoryLabel: 'Anamnesis',
        icon: '⏱️',
        source: 'Anamnesis · Cronología',
        discovered: asked.includes('evolution'),
        hint: 'Explorar cronología en la conversación.',
        text: 'Episodios leves y autolimitados de ictericia escleral que recurren desde la adolescencia y se resuelven espontáneamente en pocos días.'
      },
      {
        id: 'sofia-clue-triggers',
        title: 'Desencadenantes: Ayuno prolongado, desvelo y estrés de exámenes',
        category: 'anamnesis',
        categoryLabel: 'Anamnesis',
        icon: '⚡',
        source: 'Anamnesis · Exposiciones',
        discovered: asked.includes('exposures') || asked.includes('probe-2'),
        hint: 'Explorar hábitos durante los exámenes y relación con el ayuno.',
        text: 'Los episodios aparecen de forma reproducible cuando pasa muchas horas sin comer, toma poca agua y duerme mal en época de exámenes universitarios; desaparecen al retomar horarios habituales.'
      },
      {
        id: 'sofia-clue-family',
        title: 'Antecedentes: Padre con episodios similares y sin anemia previa',
        category: 'anamnesis',
        categoryLabel: 'Anamnesis',
        icon: '👥',
        source: 'Anamnesis · Familia y antecedentes',
        discovered: asked.includes('context') || asked.includes('background'),
        hint: 'Explorar antecedentes personales y entorno familiar en la conversación.',
        text: 'Su padre presentó episodios similares de ojos amarillos en la juventud con el esfuerzo o el ayuno. Sin enfermedades crónicas ni diagnósticos previos de anemia.'
      },
      {
        id: 'sofia-clue-symptoms-negative',
        title: 'Semiología urinaria y biliar: Sin coluria, acolia, prurito ni dolor',
        category: 'anamnesis',
        categoryLabel: 'Anamnesis',
        icon: '🚫',
        source: 'Anamnesis · Síntomas asociados',
        discovered: asked.includes('evolution') || asked.includes('probe-1'),
        hint: 'Explorar color de la orina y síntomas asociados en la conversación.',
        text: 'Durante los episodios la orina mantiene su color normal (sin coluria) y las deposiciones son normales (sin acolia). Niega prurito, fiebre, dolor en hipocondrio derecho o pérdida de peso.'
      },
      {
        id: 'sofia-clue-medications-toxics',
        title: 'Fármacos y tóxicos: Sin medicamentos, suplementos ni alcohol relevante',
        category: 'anamnesis',
        categoryLabel: 'Anamnesis',
        icon: '💊',
        source: 'Anamnesis · Medicación',
        discovered: asked.includes('medications') || asked.includes('exposures'),
        hint: 'Explorar medicación y hábitos en la conversación.',
        text: 'No toma medicamentos habituales, anticonceptivos orales, hierbas ni suplementos. Exposición a alcohol ocasional (<10 g/semana).'
      },
      {
        id: 'sofia-clue-exam-icterus',
        title: 'Inspección: Ligero tinte ictérico escleral aislado, sin palidez',
        category: 'exam',
        categoryLabel: 'Examen Físico',
        icon: '👁️',
        source: 'Examen físico',
        discovered: examDone || examChecks.includes(1),
        hint: 'Inspeccionar ojos y piel de la paciente en la camilla.',
        text: 'Subictericia escleral leve aislada. Mucosas normocoloreadas sin palidez conjuntival, sin arañas vasculares, sin eritema palmar ni edemas.'
      },
      {
        id: 'sofia-clue-exam-abdomen',
        title: 'Exploración abdominal: Blando, indoloro, sin hepatoesplenomegalia',
        category: 'exam',
        categoryLabel: 'Examen Físico',
        icon: '🩺',
        source: 'Examen físico',
        discovered: examDone || examChecks.includes(2),
        hint: 'Palpar el abdomen durante el examen físico.',
        text: 'Abdomen blando, depresible e indoloro. No se palpa hepatomegalia ni esplenomegalia. Maniobra de Murphy negativa y sin ascitis.'
      },
      {
        id: 'sofia-clue-bilirubin',
        title: 'Bilirrubina: BT 2,6 mg/dL a predominio indirecto (BI 2,3 mg/dL)',
        category: 'studies',
        categoryLabel: 'Laboratorio',
        icon: '🧪',
        source: 'Perfil hepático',
        discovered: reviewed.includes('profile'),
        hint: 'Revisar informe de perfil hepático en la bandeja o PC.',
        text: 'Bilirrubina total 2,6 mg/dL (ref: 0,2–1,2), Bilirrubina directa 0,3 mg/dL (ref: 0–0,3). Bilirrubina indirecta: 2,3 mg/dL (>85 % no conjugada).'
      },
      {
        id: 'sofia-clue-enzymes',
        title: 'Enzimas hepáticas: AST 22 U/L, ALT 19 U/L y FA 70 U/L normales',
        category: 'studies',
        categoryLabel: 'Laboratorio',
        icon: '🔬',
        source: 'Perfil hepático',
        discovered: reviewed.includes('profile'),
        hint: 'Revisar enzimas hepáticas en el informe analítico.',
        text: 'AST 22 U/L (ref: 10–40), ALT 19 U/L (ref: 7–40), Fosfatasa alcalina 70 U/L (ref: 40–130), GGT 17 U/L. Ausencia completa de citólisis y de colestasis.'
      },
      {
        id: 'sofia-clue-hemolysis',
        title: 'Descarte de hemólisis: Hb 13,4, Retis 1,1 %, LDH 170, Hapto 110',
        category: 'studies',
        categoryLabel: 'Laboratorio',
        icon: '🩸',
        source: 'Hemograma y hemólisis',
        discovered: reviewed.includes('hemolysis') || reviewed.includes('cbc'),
        hint: 'Revisar hemograma y panel de hemólisis en la bandeja de estudios.',
        text: 'Hemoglobina 13,4 g/dL (ref: 12–16), Reticulocitos 1,1 % (ref: 0,5–2), LDH 170 U/L (ref: 120–250), Haptoglobina 110 mg/dL (ref: 30–200). Frotis sin alteraciones morfológicas.'
      },
      {
        id: 'sofia-clue-synthesis',
        title: 'Síntesis y coagulación: Albúmina 4,6 g/dL, INR 1,0 y Plaquetas 265',
        category: 'studies',
        categoryLabel: 'Laboratorio',
        icon: '📜',
        source: 'Función hepática',
        discovered: reviewed.includes('profile') || reviewed.includes('inr') || reviewed.includes('cbc'),
        hint: 'Verificar proteínas plasmáticas, coagulación y plaquetas.',
        text: 'Albúmina 4,6 g/dL (ref: 3,5–5,0), INR 1,0 (ref: 0,8–1,2), Plaquetas 265 × 10⁹/L (ref: 150–400). Función sintética intacta.'
      },
      {
        id: 'sofia-clue-ultrasound',
        title: 'Ecografía hepatobiliar: Vía biliar fina y parénquima normal',
        category: 'studies',
        categoryLabel: 'Imágenes',
        icon: '🩻',
        source: 'Ecografía hepatobiliar',
        discovered: reviewed.includes('ultrasound'),
        hint: 'Revisar informe de ecografía previa.',
        text: 'Ecografía abdominal: hígado y bazo de tamaño y ecogenicidad normales. Vía biliar intra y extrahepática no dilatada, sin litiasis ni líquido libre.'
      }
    ];
  }

  function getSofiaRelations(caseData) {
    return [
      {
        id: 'sofia-rel-icterus-triggers',
        clues: ['sofia-clue-presentation', 'sofia-clue-triggers'],
        title: 'Ictericia escleral intermitente ↔ Ayuno prolongado y estrés académico',
        description: 'Relación entre la aparición de los ojos amarillos y los períodos de restricción calórica, deshidratación y desvelo.',
        options: [
          {
            id: 'hypo-fasting-ugt1a1',
            title: 'Fluctuación benigna de bilirrubina no conjugada desencadenada por el ayuno',
            detail: 'La restricción calórica y el estrés fisiológico aumentan la carga de bilirrubina al hepatocito y evidencian la menor actividad promotora de UGT1A1 característica del síndrome de Gilbert.'
          },
          {
            id: 'hypo-fasting-biliary-colic',
            title: 'Obstrucción coledociana aguda inducida por el ayuno',
            detail: 'Se plantea enclavamiento litiásico biliar pese a la ausencia total de dolor abdominal, coluria o fiebre.'
          },
          {
            id: 'hypo-fasting-toxic',
            title: 'Hepatitis aguda fulminante por estrés académico',
            detail: 'Se interpreta el cuadro autolimitado como insuficiencia hepática aguda.'
          }
        ]
      },
      {
        id: 'sofia-rel-evolution-triggers',
        clues: ['sofia-clue-evolution', 'sofia-clue-triggers'],
        title: 'Episodios autolimitados desde la adolescencia ↔ Ayuno y estrés de exámenes',
        description: 'Patrón cronológico recurrente y reversible frente a desencadenantes fisiológicos conocidos.',
        options: [
          {
            id: 'hypo-chronic-benign-course',
            title: 'Curso crónico intermitente típico de síndrome de Gilbert',
            detail: 'El inicio en la adolescencia con episodios breves que remiten al normalizar la ingesta y el descanso es el comportamiento clínico clásico de la hiperbilirrubinemia constitucional benigna.'
          },
          {
            id: 'hypo-progressive-cirrhosis',
            title: 'Descompensación progresiva de cirrosis hepática',
            detail: 'Se interpreta un cuadro benigno recurrente desde la adolescencia como insuficiencia hepática crónica descompensada.'
          }
        ]
      },
      {
        id: 'sofia-rel-family-evolution',
        clues: ['sofia-clue-family', 'sofia-clue-evolution'],
        title: 'Padre con episodios similares ↔ Curso benigno desde la adolescencia',
        description: 'Agregación familiar de ictericia leve e intermitente sin secuelas ni anemia.',
        options: [
          {
            id: 'hypo-hereditary-ugt1a1',
            title: 'Orientación hacia condición hereditaria benigna del metabolismo de la bilirrubina',
            detail: 'El antecedente paterno de cuadros idénticos autolimitados, sin anemia familiar ni esplenomegalia, respalda un rasgo genético benigno de glucuronoconjugación (síndrome de Gilbert).'
          },
          {
            id: 'hypo-contagious-viral',
            title: 'Transmisión aguda reciente de hepatitis viral intrafamiliar',
            detail: 'Se atribuye un cuadro crónico desde la adolescencia a un contagio infeccioso agudo actual.'
          }
        ]
      },
      {
        id: 'sofia-rel-family-presentation',
        clues: ['sofia-clue-family', 'sofia-clue-presentation'],
        title: 'Padre con episodios similares ↔ Ojos amarillos intermitentes',
        description: 'Correlación entre el motivo de consulta de Sofía y el antecedente familiar paterno.',
        options: [
          {
            id: 'hypo-family-gilbert-pattern',
            title: 'Patrón familiar compatible con síndrome de Gilbert',
            detail: 'La repetición familiar de subictericia intermitente desencadenada por el esfuerzo o el ayuno orienta a un defecto constitucional benigno de la conjugación hepática.'
          },
          {
            id: 'hypo-family-obstruction',
            title: 'Obstrucción maligna de la vía biliar extrahepática',
            detail: 'Se interpreta la ictericia intermitente juvenil con antecedente paterno benigno como patología obstructiva tumoral.'
          }
        ]
      },
      {
        id: 'sofia-rel-family-bilirubin',
        clues: ['sofia-clue-family', 'sofia-clue-bilirubin'],
        title: 'Antecedente familiar paterno ↔ Hiperbilirrubinemia indirecta (2,3 mg/dL)',
        description: 'Integración entre el carácter familiar y el predominio bioquímico de bilirrubina no conjugada.',
        options: [
          {
            id: 'hypo-family-indirect-conjugation',
            title: 'Disminución hereditaria de la conjugación hepática (UGT1A1)',
            detail: 'La elevación aislada de bilirrubina indirecta (< 3–4 mg/dL) con antecedente familiar concordante y sin anemia apunta a síndrome de Gilbert, sujeto a descartar hemólisis.'
          },
          {
            id: 'hypo-family-direct-cholestasis',
            title: 'Síndrome colestásico hereditario con bilirrubina directa predominante',
            detail: 'Se asume hiperbilirrubinemia conjugada pese a que la fracción directa es normal (0,3 mg/dL).'
          }
        ]
      },
      {
        id: 'sofia-rel-icterus-no-choluria',
        clues: ['sofia-clue-presentation', 'sofia-clue-symptoms-negative'],
        title: 'Ojos amarillos intermitentes ↔ Ausencia de coluria, acolia y prurito',
        description: 'Semiología clínica para diferenciar hiperbilirrubinemia indirecta (acolúrica) de ictericia colestásica.',
        options: [
          {
            id: 'hypo-acholuric-jaundice',
            title: 'Ictericia acolúrica: orienta a predominio de bilirrubina indirecta (no conjugada)',
            detail: 'La bilirrubina no conjugada es hidrofóbica y circula unida a la albúmina, por lo que no se filtra por el glomérulo renal; la orina clara sin prurito ni dolor aleja colestasis u obstrucción biliar.'
          },
          {
            id: 'hypo-cholestatic-jaundice',
            title: 'Obstrucción completa del colédoco',
            detail: 'Se sostiene obstrucción biliar completa pese a la ausencia de coluria, acolia, prurito y dolor.'
          }
        ]
      },
      {
        id: 'sofia-rel-evolution-no-choluria',
        clues: ['sofia-clue-evolution', 'sofia-clue-symptoms-negative'],
        title: 'Episodios autolimitados ↔ Sin coluria, fiebre ni dolor abdominal',
        description: 'Ausencia de signos de alarma o compromiso hepatobiliar durante las recurrencias.',
        options: [
          {
            id: 'hypo-benign-non-obstructive',
            title: 'Comportamiento benigno sin colangitis ni colestasis clínica',
            detail: 'La resolución espontánea en pocos días sin fiebre, dolor ni coluria refuerza un trastorno funcional benigno y descarta patología biliar aguda.'
          },
          {
            id: 'hypo-acute-cholangitis',
            title: 'Colangitis bacteriana aguda (tríada de Charcot)',
            detail: 'Se plantea infección biliar aguda en una paciente afebril, sin dolor y con vía biliar normal.'
          }
        ]
      },
      {
        id: 'sofia-rel-bilirubin-no-choluria',
        clues: ['sofia-clue-bilirubin', 'sofia-clue-symptoms-negative'],
        title: 'Bilirrubina indirecta 2,3 mg/dL (BD 0,3) ↔ Ausencia de coluria y acolia',
        description: 'Concordancia fisiopatológica entre las fracciones séricas de bilirrubina y el interrogatorio urinario.',
        options: [
          {
            id: 'hypo-indirect-renal-physiology',
            title: 'Concordancia entre bilirrubina no conjugada sérica y ausencia de excreción urinaria',
            detail: 'El laboratorio confirma que >85 % de la bilirrubina es indirecta (2,3 de 2,6 mg/dL), explicando perfectamente por qué la paciente nunca presenta coluria.'
          },
          {
            id: 'hypo-renal-failure-block',
            title: 'Fallo renal agudo que impide excretar bilirrubina directa',
            detail: 'Se atribuye la ausencia de coluria a insuficiencia renal pese a función renal normal (eGFR 110 mL/min).'
          }
        ]
      },
      {
        id: 'sofia-rel-bilirubin-hemolysis',
        clues: ['sofia-clue-bilirubin', 'sofia-clue-hemolysis'],
        title: 'Bilirrubina indirecta elevada ↔ Estudio de hemólisis y hemograma normales',
        description: 'Diferenciación diagnóstica entre sobreproducción prehepática (hemólisis) y defecto de conjugación hepatocitario.',
        options: [
          {
            id: 'hypo-non-hemolytic-origin',
            title: 'Exclusión de hemólisis: respalda defecto de conjugación hepática (Gilbert)',
            detail: 'La normalidad estricta de hemoglobina (13,4 g/dL), reticulocitos (1,1 %), LDH (170 U/L), haptoglobina (110 mg/dL) y frotis descarta anemia hemolítica como causa del exceso de bilirrubina indirecta.'
          },
          {
            id: 'hypo-active-hemolytic-anemia',
            title: 'Crisis hemolítica intravascular activa',
            detail: 'Se diagnostica anemia hemolítica ignorando que hemoglobina, reticulocitos, LDH y haptoglobina son normales.'
          },
          {
            id: 'hypo-splenic-sequestration',
            title: 'Hiperesplenismo severo con destrucción corpuscular',
            detail: 'Se plantea secuestro esplénico masivo pese a bazo normal y plaquetas de 265 × 10⁹/L.'
          }
        ]
      },
      {
        id: 'sofia-rel-bilirubin-enzymes',
        clues: ['sofia-clue-bilirubin', 'sofia-clue-enzymes'],
        title: 'Bilirrubina indirecta elevada ↔ Enzimas hepáticas (AST, ALT, FA) normales',
        description: 'Correlación entre la hiperbilirrubinemia no conjugada aislada y la normalidad de los marcadores de citólisis y colestasis.',
        options: [
          {
            id: 'hypo-gilbert-conjugation',
            title: 'Alteración selectiva de la glucuronoconjugación sin daño hepatocelular ni colestasis',
            detail: 'AST (22 U/L), ALT (19 U/L) y FA (70 U/L) normales descartan inflamación parenquimatosa o colestasis, consolidando junto al descarte de hemólisis el diagnóstico clínico de síndrome de Gilbert.'
          },
          {
            id: 'hypo-latent-hepatocellular',
            title: 'Hepatitis necroinflamatoria aguda grave',
            detail: 'Se asume necrosis hepatocitaria aguda pese a aminotransferasas completamente normales.'
          },
          {
            id: 'hypo-partial-obstruction',
            title: 'Colestasis obstructiva extrahepática',
            detail: 'Se atribuye el cuadro a obstrucción biliar pese a fosfatasa alcalina, GGT y bilirrubina directa normales.'
          }
        ]
      },
      {
        id: 'sofia-rel-enzymes-synthesis',
        clues: ['sofia-clue-enzymes', 'sofia-clue-synthesis'],
        title: 'Enzimas hepáticas normales ↔ Albúmina 4,6 g/dL, INR 1,0 y Plaquetas 265',
        description: 'Evaluación integral de indemnidad parenquimatosa y reserva funcional sintética del hígado.',
        options: [
          {
            id: 'hypo-preserved-liver-reassure',
            title: 'Integridad hepatocelular y sintética: respalda tranquilizar sin estudios invasivos',
            detail: 'La normalidad de transaminasas, albúmina, coagulación (INR 1,0) y plaquetas confirma un hígado sano; en este patrón típico de Gilbert no están indicadas la biopsia hepática ni terapias farmacológicas.'
          },
          {
            id: 'hypo-biopsy-mandatory',
            title: 'Indicación de biopsia hepática urgente y corticoides',
            detail: 'Se propone procedimiento invasivo pese a tener bioquímica y función sintética normales.'
          }
        ]
      },
      {
        id: 'sofia-rel-bilirubin-ultrasound',
        clues: ['sofia-clue-bilirubin', 'sofia-clue-ultrasound'],
        title: 'Hiperbilirrubinemia indirecta ↔ Ecografía con vía biliar y bazo normales',
        description: 'Correlación entre el patrón bioquímico no conjugado y la normalidad anatómica hepatobiliar y esplénica.',
        options: [
          {
            id: 'hypo-us-confirms-normal-anatomy',
            title: 'Ausencia de dilatación biliar o esplenomegalia: coherente con síndrome de Gilbert',
            detail: 'La ecografía previa confirma parénquima homogéneo, vía biliar no dilatada y bazo normal, sin requerir nuevas imágenes seriadas ante un patrón típico de hiperbilirrubinemia indirecta aislada.'
          },
          {
            id: 'hypo-us-monthly-needed',
            title: 'Necesidad de repetir ecografía mensual indefinidamente',
            detail: 'Se indica vigilancia ecográfica mensual perpetua pese a tratarse de hiperbilirrubinemia no conjugada sin colestasis.'
          }
        ]
      },
      {
        id: 'sofia-rel-icterus-abdomen',
        clues: ['sofia-clue-exam-icterus', 'sofia-clue-exam-abdomen'],
        title: 'Subictericia escleral sin palidez ↔ Abdomen indoloro sin visceromegalias',
        description: 'Integración de los hallazgos del examen físico general y abdominal.',
        options: [
          {
            id: 'hypo-exam-isolated-icterus',
            title: 'Ictericia leve aislada sin signos físicos de hemólisis, colestasis ni hepatopatía crónica',
            detail: 'La ausencia de palidez o esplenomegalia aleja clínicamente una anemia hemolítica crónica, mientras que el abdomen indoloro sin estigmas ni hepatomegalia apoya una condición benigna.'
          },
          {
            id: 'hypo-exam-acute-abdomen',
            title: 'Abdomen agudo quirúrgico hepatobiliar',
            detail: 'Se plantea urgencia quirúrgica en un abdomen blando, depresible e indoloro con Murphy negativo.'
          }
        ]
      },
      {
        id: 'sofia-rel-toxics-enzymes',
        clues: ['sofia-clue-medications-toxics', 'sofia-clue-enzymes'],
        title: 'Ausencia de fármacos y tóxicos ↔ Enzimas hepáticas normales',
        description: 'Descarte de lesión hepática inducida por xenobióticos o inhibición farmacológica de UGT1A1.',
        options: [
          {
            id: 'hypo-no-dili-sofia',
            title: 'Exclusión de hepatotoxicidad farmacológica o por suplementos',
            detail: 'La ausencia de exposición a medicamentos, anticonceptivos o hierbas junto con transaminasas normales descarta DILI o hiperbilirrubinemia inducida por fármacos.'
          },
          {
            id: 'hypo-dili-sofia',
            title: 'Lesión hepática tóxica por medicamentos ocultos',
            detail: 'Se atribuye el cuadro a toxicidad medicamentosa con perfil enzimático normal y sin exposición referida.'
          }
        ]
      }
    ];
  }

  function getSofiaSuspicions(caseData) {
    return [
      {
        id: 'gilbert',
        title: 'Síndrome de Gilbert',
        shortTitle: 'Síndrome de Gilbert',
        color: 'teal',
        description: 'Alteración congénita benigna de la conjugación por disminución en la expresión de UGT1A1.'
      },
      {
        id: 'hemolysis',
        title: 'Hemólisis / Anemia Hemolítica',
        shortTitle: 'Hemólisis',
        color: 'amber',
        description: 'Sobreproducción de bilirrubina indirecta por destrucción acelerada de eritrocitos.'
      },
      {
        id: 'hepatocellular',
        title: 'Enfermedad Hepatocelular / Hepatitis',
        shortTitle: 'Hepatopatía Celular',
        color: 'coral',
        description: 'Lesión o disfunción primaria del parénquima hepatocitario con alteración metabólica.'
      },
      {
        id: 'cholestatic',
        title: 'Colestasis / Obstrucción Biliar',
        shortTitle: 'Colestasis / Obstrucción',
        color: 'purple',
        description: 'Trastorno en la excreción biliar o flujo hepatobiliar intra/extrahepático.'
      }
    ];
  }

  // --- CATÁLOGO DE ELENA ---
  function getElenaClues(caseData, clinical) {
    const c = clinical || {};
    const asked = Array.isArray(c.asked) ? c.asked : [];
    const examDone = Boolean(c.exam);
    const hasFib4 = Number.isFinite(c.calculations?.fib4);
    const fib4Val = hasFib4 ? c.calculations.fib4 : null;

    return [
      {
        id: 'elena-clue-presentation',
        title: 'Motivo de consulta: Astenia, malestar epigástrico y mareo',
        category: 'anamnesis',
        categoryLabel: 'Anamnesis',
        icon: '📋',
        source: 'Relato inicial',
        discovered: true,
        hint: 'Disponible al inicio de la consulta.',
        text: '«Doctora, últimamente me siento muy cansada. Desde ayer tengo un malestar en el estómago y hoy me he sentido algo mareada.» Paciente de 68 años, docente jubilada.'
      },
      {
        id: 'elena-clue-evolution',
        title: 'Evolución clínica',
        category: 'anamnesis',
        categoryLabel: 'Anamnesis',
        icon: '⏱️',
        source: 'Anamnesis',
        discovered: asked.includes('evolution'),
        hint: 'Explorar en la conversación con la paciente.',
        text: 'Refiere desde ayer deposiciones oscuras y mareo intenso esta mañana.'
      },
      {
        id: 'elena-clue-background',
        title: 'Antecedentes: Diabetes tipo 2',
        category: 'anamnesis',
        categoryLabel: 'Anamnesis',
        icon: '🫀',
        source: 'Anamnesis',
        discovered: asked.includes('background'),
        hint: 'Explorar en la conversación con la paciente.',
        text: 'Diabetes tipo 2. Sin antecedentes previos documentados de ascitis o encefalopatía.'
      },
      {
        id: 'elena-clue-medications',
        title: 'Medicación habitual',
        category: 'anamnesis',
        categoryLabel: 'Anamnesis',
        icon: '💊',
        source: 'Anamnesis',
        discovered: asked.includes('medications'),
        hint: 'Explorar en la conversación con la paciente.',
        text: 'Tratamiento habitual con metformina y losartán. Sin betabloqueantes ni diuréticos.'
      },
      {
        id: 'elena-clue-exam',
        title: 'Examen físico general',
        category: 'exam',
        categoryLabel: 'Examen Físico',
        icon: '🩺',
        source: 'Examen físico',
        discovered: examDone,
        hint: 'Observar durante la valoración física.',
        text: 'IMC 32,4 kg/m². Valoración clínica sujeta a estabilidad hemodinámica.'
      },
      {
        id: 'elena-clue-fib4',
        title: hasFib4 ? `Índice FIB-4 calculado: ${fib4Val.toFixed(2).replace('.', ',')}` : 'Cálculo de FIB-4 pendiente',
        category: 'calculator',
        categoryLabel: 'Calculadora',
        icon: '🧮',
        source: 'Calculadora clínica',
        discovered: hasFib4,
        hint: 'Calcular FIB-4 en la calculadora del escritorio.',
        text: hasFib4
          ? `FIB-4 = ${fib4Val.toFixed(2).replace('.', ',')} a los 68 años (umbral inferior ajustado por edad: 2,0).`
          : 'Pendiente de cálculo.'
      }
    ];
  }

  function getElenaRelations() {
    return [];
  }

  function getElenaSuspicions() {
    return [
      {
        id: 'masld_fibrosis',
        title: 'MASLD con Riesgo de Fibrosis Significativa',
        shortTitle: 'MASLD / Fibrosis',
        color: 'teal',
        description: 'Enfermedad hepática esteatósica metabólica en paciente mayor de 65 años que requiere estratificación secundaria.'
      },
      {
        id: 'portal_hypertension',
        title: 'Descompensación Aguda / Hemorragia Digestiva Alta',
        shortTitle: 'Sangrado Digestivo',
        color: 'coral',
        description: 'Compromiso agudo por hipertensión portal o lesión gastroduodenal sangrante con repercusión hemodinámica.'
      },
      {
        id: 'other_chronic',
        title: 'Otra Hepatopatía Crónica en Estudio',
        shortTitle: 'Otra Hepatopatía',
        color: 'amber',
        description: 'Causas alternativas de hepatopatía crónica en evaluación ambulatoria.'
      }
    ];
  }

  // --- INTERFAZ GENERAL DE INVESTIGACIÓN ---
  function getCaseClues(caseData, clinical) {
    if (isMartin(caseData)) {
      return getMartinClues(caseData, clinical);
    }
    if (isSofia(caseData)) {
      return getSofiaClues(caseData, clinical);
    }
    if (isElena(caseData)) {
      return getElenaClues(caseData, clinical);
    }
    return [];
  }

  function getCaseRelations(caseData) {
    if (isMartin(caseData)) {
      return getMartinRelations(caseData);
    }
    if (isSofia(caseData)) {
      return getSofiaRelations(caseData);
    }
    if (isElena(caseData)) {
      return getElenaRelations(caseData);
    }
    return [];
  }

  function getCaseSuspicions(caseData) {
    if (isMartin(caseData)) {
      return getMartinSuspicions(caseData);
    }
    if (isSofia(caseData)) {
      return getSofiaSuspicions(caseData);
    }
    if (isElena(caseData)) {
      return getElenaSuspicions(caseData);
    }
    return [];
  }

  const SUSPICION_TO_DIAGNOSIS = {
    masld: 'masld',
    masld_fibrosis: 'masld',
    portal_hypertension: 'decompensated',
    other_chronic: 'undetermined',
    dili: 'dili',
    ald: 'alcohol',
    gilbert: 'gilbert',
    hemolysis: 'hemolysis',
    hepatocellular: 'acute-hepatitis',
    cholestatic: 'obstruction'
  };

  function evaluateCaseNotebook(caseData, clinical, notebook) {
    if (!caseData || (!isMartin(caseData) && !isSofia(caseData) && !isElena(caseData))) {
      return null;
    }
    const nb = notebook && typeof notebook === 'object' ? notebook : {};
    const clues = getCaseClues(caseData, clinical);
    const discoveredClues = clues.filter(c => c.discovered);
    const pinnedClues = Array.isArray(nb.pinnedClues) ? nb.pinnedClues : [];
    const relations = getCaseRelations(caseData);
    const suspicions = getCaseSuspicions(caseData);
    const suspMap = nb.suspicions && typeof nb.suspicions === 'object' ? nb.suspicions : {};
    const relMap = nb.relations && typeof nb.relations === 'object' ? nb.relations : {};

    let mainSuspicion = null;
    const discardedSuspicions = [];
    for (const s of suspicions) {
      const entry = suspMap[s.id];
      const status = entry?.status || 'investigating';
      const pros = Array.isArray(entry?.pros) ? entry.pros : [];
      const cons = Array.isArray(entry?.cons) ? entry.cons : [];
      if (status === 'main' && !mainSuspicion) {
        mainSuspicion = {
          ...s,
          mappedDiagnosisId: SUSPICION_TO_DIAGNOSIS[s.id] || s.id,
          prosCount: pros.length,
          consCount: cons.length
        };
      } else if (status === 'discarded') {
        discardedSuspicions.push({
          ...s,
          prosCount: pros.length,
          consCount: cons.length
        });
      }
    }

    const validRelations = [];
    const flawedRelations = [];
    for (const rel of relations) {
      const chosenId = relMap[rel.id];
      if (!chosenId) continue;
      const chosenOpt = (rel.options || []).find(o => o.id === chosenId);
      const expectedOpt = (rel.options || [])[0];
      if (!chosenOpt || !expectedOpt) continue;
      if (chosenOpt.id === expectedOpt.id) {
        validRelations.push({
          relationId: rel.id,
          relationTitle: rel.title,
          chosenTitle: chosenOpt.title,
          detail: chosenOpt.detail
        });
      } else {
        flawedRelations.push({
          relationId: rel.id,
          relationTitle: rel.title,
          chosenTitle: chosenOpt.title,
          expectedTitle: expectedOpt.title,
          expectedDetail: expectedOpt.detail
        });
      }
    }

    const expectedDiagnosisId = caseData.rubric?.diagnosis || '';
    const mainMatchesExpected = Boolean(mainSuspicion && mainSuspicion.mappedDiagnosisId === expectedDiagnosisId);

    return {
      totalClues: clues.length,
      discoveredCount: discoveredClues.length,
      pinnedCount: pinnedClues.length,
      totalRelationsAvailable: relations.length,
      totalRelationsFormulated: validRelations.length + flawedRelations.length,
      validRelations,
      flawedRelations,
      mainSuspicion,
      discardedSuspicions,
      mainMatchesExpected
    };
  }

  const ClinicalInvestigation = {
    isMartin,
    isSofia,
    isElena,
    SUSPICION_TO_DIAGNOSIS,
    getCaseClues,
    getCaseRelations,
    getCaseSuspicions,
    evaluateCaseNotebook
  };

  window.HepatoDay1Modules['clinical-investigation.mjs'] = ClinicalInvestigation;
  window.ClinicalInvestigation = ClinicalInvestigation;
})();
