/* Embedded original source: src/motor/configuracion.js */
/* Módulo compartido original: game-settings.mjs. Conservado sin modificar su lógica. */
window.HepatoSharedModules['game-settings.mjs'] = (() => {
function readGameSettings(saved){return {fastTransfers:saved?.fastTransfers===true,sound:saved?.sound!==false};}

return {readGameSettings};
})();

