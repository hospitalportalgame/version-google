/* HOSPITAL PORTAL · Jornadas con archivo de devoluciones. */
window.HepatoDay1Modules['campaign.mjs'] = (() => {
  const {initialConsultation, sanitizeConsultation, assessConsultation} =
    window.HepatoDay1Modules['consultation.mjs'];
  const {DAY_AGENDAS, getPatientsForDay} =
    window.HepatoDay1Modules['simulation-cases.mjs'];
  const {assessChallenge} = window.HepatoDay1Modules['clinical-challenges.mjs'];
  const clone = value => JSON.parse(JSON.stringify(value));
  const Economy=window.HepatoDay1Modules['economy.mjs'];
  const VALID_SUSPICION_STATUS = ['investigating', 'main', 'discarded'];
  const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
  const cleanStringList = (arr, max = 64) =>
    Array.isArray(arr)
      ? [...new Set(arr.filter(x => typeof x === 'string' && x.length <= 120))].slice(0, max)
      : [];

  function sanitizeSingleNotebook(nb) {
    if (!nb || typeof nb !== 'object' || Array.isArray(nb)) return {};
    const out = {
      notes: typeof nb.notes === 'string' ? nb.notes.slice(0, 4000) : '',
      pinnedClues: cleanStringList(nb.pinnedClues),
      customClueOrder: cleanStringList(nb.customClueOrder),
      relations: {},
      suspicions: {}
    };
    if (typeof nb.legacyNotes === 'string') out.legacyNotes = nb.legacyNotes.slice(0, 4000);
    if (Array.isArray(nb.findings)) out.findings = clone(nb.findings).slice(0, 50);
    if (Array.isArray(nb.hypotheses)) out.hypotheses = clone(nb.hypotheses).slice(0, 50);
    if (Array.isArray(nb.pending)) out.pending = clone(nb.pending).slice(0, 50);
    if (nb.relations && typeof nb.relations === 'object' && !Array.isArray(nb.relations)) {
      for (const [k, v] of Object.entries(nb.relations)) {
        if (FORBIDDEN_KEYS.has(k) || k.length > 120) continue;
        if (typeof v === 'string' && v.length <= 120) out.relations[k] = v;
      }
    }
    if (nb.suspicions && typeof nb.suspicions === 'object' && !Array.isArray(nb.suspicions)) {
      for (const [k, v] of Object.entries(nb.suspicions)) {
        if (FORBIDDEN_KEYS.has(k) || k.length > 120 || !v || typeof v !== 'object') continue;
        out.suspicions[k] = {
          status: VALID_SUSPICION_STATUS.includes(v.status) ? v.status : 'investigating',
          pros: cleanStringList(v.pros),
          cons: cleanStringList(v.cons)
        };
      }
    }
    return out;
  }

  function sanitizeNotebooks(notebooks) {
    if (!notebooks || typeof notebooks !== 'object' || Array.isArray(notebooks)) return {};
    const out = {};
    for (const [caseId, nb] of Object.entries(notebooks)) {
      if (FORBIDDEN_KEYS.has(caseId) || typeof caseId !== 'string' || caseId.length > 120) continue;
      out[caseId] = sanitizeSingleNotebook(nb);
    }
    return out;
  }

  function sanitizePhoneLogs(logs) {
    if (!Array.isArray(logs)) return [];
    const out = [];
    for (const item of logs.slice(-40)) {
      if (!item || typeof item !== 'object') continue;
      const ext = typeof item.ext === 'string' ? item.ext.slice(0, 16) : 'INT 104';
      const contact = typeof item.contact === 'string' ? item.contact.slice(0, 80) : 'Red Hospitalaria';
      const summary = typeof item.summary === 'string' ? item.summary.slice(0, 480) : '';
      const patient = typeof item.patient === 'string' ? item.patient.slice(0, 60) : '';
      const day = Number.isInteger(item.day) ? item.day : 1;
      if (!summary) continue;
      out.push({ ext, contact, summary, patient, day });
    }
    return out;
  }

  function initialCampaign(day = 1) {
    getPatientsForDay(day);
    return {
  version: 3,
  finance: Economy?.initial(),
  day,
  index: 0,
  completed: [],
  finished: false,
  archives: [],
  appointments: [],
  pendingInitial: [],
  notebooks: {},
  phoneLogs: []
};
  }

  function casesFor(campaign, cases) {
    return Array.isArray(cases) && cases.length ? cases : getPatientsForDay(campaign.day || 1);
  }

  function restoreRecords(records, list, complete = false) {
    if (!Array.isArray(records) || records.length > list.length ||
        complete && records.length !== list.length) {
      throw new Error('La partida contiene una jornada incompatible.');
    }
    return records.map((record, index) => {
      const caseData = list[index];
      if (record?.caseId !== caseData.id || !record.clinical) {
        throw new Error('El orden de los pacientes guardados no coincide con la agenda.');
      }
      const clinical = sanitizeConsultation({...record.clinical, caseId: caseData.id}, caseData);
      if (!clinical.outcome) throw new Error('Hay una devolución incompleta o dañada en la partida.');
      return {caseId: caseData.id, clinical};
    });
  }

  function restoreCampaign(saved, cases) {
    const previous = saved?.campaign;
    if (previous && ![2, 3].includes(previous.version)) {
      throw new Error('La versión de campaña no es compatible.');
    }
    const day = previous?.version === 3 ? previous.day : 1;
    if (!Number.isInteger(day) || !Object.hasOwn(DAY_AGENDAS, day)) {
      throw new Error('El día guardado no tiene una agenda disponible.');
    }
    
const campaign = initialCampaign(day);
campaign.phoneLogs = sanitizePhoneLogs(previous?.phoneLogs);
if (previous?.notebooks && typeof previous.notebooks === 'object') {
  campaign.notebooks = sanitizeNotebooks(previous.notebooks);
} else if (saved?.notebook && typeof saved?.caseId === 'string') {
  campaign.notebooks = sanitizeNotebooks({ [saved.caseId]: saved.notebook });
} else {
  campaign.notebooks = {};
}

// Recuperar las reconsultas al cargar el Dia 2.
const permitidosDemo = [
  'masld-intro-v1-reasoning-v2',
  'gilbert-v1-reasoning-v2'
];
const sanitizeDemoAppointments = (lista) => {
  const out = [];
  if (!Array.isArray(lista)) return out;
  for (const cita of lista) {
    if (
      !permitidosDemo.includes(cita?.caseId) ||
      cita.day !== 2 ||
      ![2, 3].includes(cita.slot)
    ) continue;
    if (out.some(a => a.caseId === cita.caseId || (a.day === cita.day && a.slot === cita.slot))) continue;
    out.push({ caseId: cita.caseId, day: 2, slot: cita.slot });
  }
  return out;
};

if (day === 2 && previous?.version === 3) {
  const archivoDia1 = previous.archives?.find(
    a => a?.day === 1 && a.demoDay1Complete === true
  );

  if (!Object.keys(campaign.notebooks).length && archivoDia1?.notebooks) {
    campaign.notebooks = sanitizeNotebooks(archivoDia1.notebooks);
  }

  const citas = previous.appointments ??
    archivoDia1?.appointments;

  const pendientes = previous.pendingInitial ??
    archivoDia1?.pendingInitial;

  campaign.appointments = sanitizeDemoAppointments(citas);

  campaign.pendingInitial = Array.isArray(pendientes)
    ? clone(pendientes)
    : [];
}

    // Recuperar las reservas de la demo.
    if (Array.isArray(previous?.appointments) && !campaign.appointments.length) {
      campaign.appointments = sanitizeDemoAppointments(previous.appointments);
    }

    const list = casesFor(campaign, cases);
    
if (previous) campaign.completed = restoreRecords(previous.completed, list);


if (
  day === 1 &&
  Array.isArray(previous?.pendingInitial)
) {
  campaign.pendingInitial = [];

  for (const paciente of list.slice(0, 2)) {
    const pendiente = previous.pendingInitial.find(
      r => r?.caseId === paciente.id && r?.clinical
    );

    if (!pendiente) continue;

    const clinical = sanitizeConsultation(
      {...pendiente.clinical, caseId: paciente.id},
      paciente
    );

    if (
      clinical.hypothesis &&
      clinical.received.length === 0 &&
      !clinical.outcome
    ) {
      campaign.pendingInitial.push({
        caseId: paciente.id,
        clinical
      });
    }
  }
}


    if (previous?.version === 3) {
      if (!Array.isArray(previous.archives) || previous.archives.length !== day - 1) {
        throw new Error('El historial de jornadas está incompleto.');
      }
      campaign.archives = previous.archives.map((archive, index) => {
        const archiveDay = index + 1;
        if (archive?.day !== archiveDay) throw new Error('El historial de jornadas está desordenado.');
        
if (
  archiveDay === 1 &&
  archive.demoDay1Complete === true
) {
  if (
    !Array.isArray(archive.pendingInitial) ||
    archive.pendingInitial.length !== 2 ||
    !Array.isArray(archive.appointments) ||
    archive.appointments.length !== 2
  ) {
    throw new Error(
      'El historial del Día 1 está incompleto.'
    );
  }

  return {
    day: 1,
    completed: [],
    appointments: sanitizeDemoAppointments(archive.appointments),
    pendingInitial: clone(archive.pendingInitial),
    notebooks: sanitizeNotebooks(archive.notebooks),
    demoDay1Complete: true
  };
}

return {
  day: archiveDay,
  completed: restoreRecords(
    archive.completed,
    getPatientsForDay(archiveDay),
    true
  )
};

      });
    }
    
const demoFinalizada =
  day === 1 &&
  previous?.demoDay1Complete === true &&
  [list[0]?.id, list[1]?.id].every(id =>
    campaign.pendingInitial.some(
      registro => registro.caseId === id
    )
  );

campaign.demoDay1Complete = demoFinalizada;

campaign.finished =
  demoFinalizada ||
  campaign.completed.length === list.length;

campaign.index = Math.min(
  Math.max(
    campaign.completed.length,
    day === 1 && campaign.pendingInitial.length > 0 ? 1 : 0
  ),
  list.length - 1
);

const clinical = demoFinalizada
  ? initialConsultation()
  : campaign.finished
    ? clone(campaign.completed.at(-1).clinical)
    : sanitizeConsultation(saved, list[campaign.index]);

campaign.finance=Economy?.restore(previous?.finance,campaign,{
  ...clinical,
  emergencyHelpCalled:clinical.emergencyHelpCalled||saved?.emergencyHelpCalled,
  elenaWrongChoice:clinical.elenaWrongChoice||saved?.elenaWrongChoice
},list[campaign.index],!!saved);
return {campaign, clinical};

  }

  function recordConsultation(campaign, clinical, cases) {
    const list = casesFor(campaign, cases);
    if (campaign.finished || campaign.completed.length !== campaign.index) return false;
    const caseData = list[campaign.index];
    if (!caseData) return false;
    const outcome = assessConsultation(clinical, caseData, {
      allowLegacy: (clinical.assessmentVersion === 2 && !!clinical.outcome) ||
        (caseData.id === 'masld-intro-v1-reasoning-v2' && !!clinical.outcome && !clinical.decisions?.sctChoice)
    });
    if (!outcome) return false;
    campaign.completed.push({caseId: caseData.id, clinical: clone({...clinical, outcome})});
    return true;
  }

  function advanceCampaign(campaign, cases) {
    const list = casesFor(campaign, cases);
    if (campaign.completed.length !== campaign.index + 1) return null;
    if (campaign.completed.length === list.length) {
      campaign.finished = true;
      return null;
    }

    campaign.index++;

    // Recuperar la reconsulta de Sofia en el Dia 2.
    if (campaign.day === 2 && campaign.index === 1) {
      const paciente = list[campaign.index];

      const pendiente = campaign.pendingInitial?.find(
        registro => registro.caseId === paciente.id
      );

      if (pendiente) {
        const clinical = sanitizeConsultation(
          {
            ...pendiente.clinical,
            caseId: paciente.id
          },
          paciente
        );

        const {receiveStudies} =
          window.HepatoDay1Modules['consultation.mjs'];

        receiveStudies(clinical);

        return clinical;
      }
    }

    return initialConsultation();

  }

  function hasNextDay(campaign) {
    return Object.hasOwn(DAY_AGENDAS, (campaign.day || 1) + 1);
  }

  function startNextDay(campaign) {
    if (!campaign.finished || !hasNextDay(campaign)) return null;
    const list = getPatientsForDay(campaign.day);
    
const demoLista =
  campaign.day === 1 &&
  campaign.demoDay1Complete === true &&
  campaign.pendingInitial?.length === 2 &&
  campaign.appointments?.length === 2;

if (
  !demoLista &&
  campaign.completed.length !== list.length
) return null;

    const next = initialCampaign(campaign.day + 1);
    if(campaign.finance)next.finance=clone(campaign.finance);
    next.notebooks = sanitizeNotebooks(campaign.notebooks);
    next.phoneLogs = sanitizePhoneLogs(campaign.phoneLogs);

next.appointments = clone(
  campaign.appointments || []
);

next.pendingInitial = clone(
  campaign.pendingInitial || []
);

next.archives = clone([
  ...campaign.archives,
  {
    day: campaign.day,
    completed: campaign.completed,
    appointments: campaign.appointments || [],
    pendingInitial: campaign.pendingInitial || [],
    notebooks: sanitizeNotebooks(campaign.notebooks),
    demoDay1Complete: campaign.demoDay1Complete === true
  }
]);

    
const primerPaciente = getPatientsForDay(next.day)[0];

const consultaPendiente = next.pendingInitial?.find(
  registro => registro.caseId === primerPaciente.id
);

const clinical = consultaPendiente
  ? sanitizeConsultation(
      {
        ...consultaPendiente.clinical,
        caseId: primerPaciente.id
      },
      primerPaciente
    )
  : initialConsultation();

// Los estudios solicitados el Dia 1 ya estan
// disponibles cuando el paciente regresa el Dia 2.
if (
  consultaPendiente &&
  clinical.orders.length > 0 &&
  clinical.received.length === 0
) {
  const {receiveStudies} =
    window.HepatoDay1Modules['consultation.mjs'];

  receiveStudies(clinical);
}

return {campaign: next, clinical};

  }

  function campaignSummary(campaign) {
    const total = campaign.completed.reduce((sum, r) => sum + r.clinical.outcome.score, 0);
    let streak = 0, bestStreak = 0, challengesPlayed = 0, challengePoints = 0;
    for (const record of campaign.completed) {
      streak = record.clinical.outcome.adequate ? streak + 1 : 0;
      bestStreak = Math.max(bestStreak, streak);
      const answer = assessChallenge(record.caseId, record.clinical.challenge?.choiceId);
      if (answer) { challengesPlayed++; if (answer.correct) challengePoints++; }
    }
    return {
      total, max: campaign.completed.length * 10, completed: campaign.completed.length,
      perfect: campaign.completed.filter(r => r.clinical.outcome.score === 10).length,
      challengesPlayed, challengePoints, bestStreak, currentStreak: streak
    };
  }
  return {initialCampaign, restoreCampaign, recordConsultation, advanceCampaign,
    campaignSummary, hasNextDay, startNextDay};
})();
