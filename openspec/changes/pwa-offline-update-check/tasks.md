## 1. Real-device checks

- [ ] 1.1 Offline page on Android Chrome: open the installed app, switch on airplane mode, open a page not yet loaded — verify "Sem ligação" appears with the retry button, and "Tentar novamente" returns to the page once the connection is back
- [ ] 1.2 Offline page on iPhone Safari: the same, in the installed home-screen app and in a Safari tab
- [ ] 1.3 Update notice on both phones: with the app installed and open, deploy a new image to the Preview (any small change, bump `SW_VERSION` in `src/lib/pwa/constants.ts` if nothing else changes) — verify "Nova versão disponível" appears, nothing reloads by itself, and "Atualizar" loads the new version
- [ ] 1.4 Log any finding as a new task here and fix it before enabling `pwa` on Production
