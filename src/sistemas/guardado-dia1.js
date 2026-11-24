/* HOSPITAL PORTAL · Guardado de campaña por jornadas. */
window.HepatoDay1Modules['game-save.mjs'] = (() => {
  const {restoreCampaign} = window.HepatoDay1Modules['campaign.mjs'];
  const {getPatientsForDay} = window.HepatoDay1Modules['simulation-cases.mjs'];
  const {readGameSettings} = window.HepatoDay1Modules['game-settings.mjs'];
  const MAX_SAVE_BYTES = 5 * 1024 * 1024;

  function createGameSave(caseId, clinical, campaign, settings) {
    return JSON.stringify({format: 'hepato-partida', version: 1,
      savedAt: new Date().toISOString(),
      game: {...clinical, caseId, campaign, settings: readGameSettings(settings)}
    }, null, 2);
  }

  function readGameSave(text) {
    if (typeof text !== 'string' || new TextEncoder().encode(text).length > MAX_SAVE_BYTES)
      throw new Error('La partida supera el tamaño permitido.');
    let file;
    try { file = JSON.parse(text); }
    catch { throw new Error('El archivo no contiene una partida válida.'); }
    const game = file?.game;
    if (file?.format !== 'hepato-partida' || file.version !== 1 ||
        game?.version !== 2 || ![2, 3].includes(game?.campaign?.version) ||
        !Array.isArray(game.campaign.completed)) {
      throw new Error('Este archivo no es una partida compatible de Hospital Portal.');
    }
    const restored = restoreCampaign(game);
    const list = getPatientsForDay(restored.campaign.day);
    const count = restored.campaign.completed.length;
    if (!list.some(c => c.id === game.caseId))
      throw new Error('El paciente guardado no pertenece a esta jornada.');
    const expected = list[restored.campaign.index]?.id;
    const inDeparture = count > 0 && count <= list.length && game.caseId === list[count - 1]?.id && !!game.outcome;
    if (!expected || (game.caseId !== expected && !inDeparture))
      throw new Error('El paciente guardado no coincide con la agenda.');
    if (game.caseId === expected && game.outcome && !restored.clinical.outcome)
      throw new Error('La consulta guardada está incompleta o dañada.');
    return {...restored, settings: readGameSettings(game.settings)};
  }
  return {MAX_SAVE_BYTES, createGameSave, readGameSave};
})();
