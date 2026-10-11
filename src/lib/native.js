// Pont avec Android : notifications locales exactes (fonctionnent appli fermée, survivent au redémarrage)
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { App } from '@capacitor/app'
import { Share } from '@capacitor/share'
import { CHANNEL_ID, buildSchedule } from './schedule.js'
import { buildCycleSchedule } from './cycle.js'

export const isNative = () => Capacitor.isNativePlatform()

const toPerm = (display) => (display === 'granted' ? 'granted' : display === 'denied' ? 'denied' : 'default')

export async function nativePermission() {
  try { return toPerm((await LocalNotifications.checkPermissions()).display) } catch { return 'unsupported' }
}

export async function requestNativePermission() {
  try { return toPerm((await LocalNotifications.requestPermissions()).display) } catch { return 'unsupported' }
}

/** Alarmes exactes (Android 12+) : 'granted' | 'denied' */
export async function exactAlarmStatus() {
  try { return (await LocalNotifications.checkExactNotificationSetting()).exact_alarm } catch { return 'granted' }
}
export async function requestExactAlarm() {
  try { return (await LocalNotifications.changeExactNotificationSetting()).exact_alarm } catch { return 'granted' }
}

let queue = Promise.resolve()

/** Remplace toutes les notifications programmées par celles correspondant aux tâches. Appels sérialisés. */
export function syncNative(tasks, now = new Date(), cycle) {
  queue = queue.catch(() => {}).then(async () => {
    const { notifications: pending } = await LocalNotifications.getPending()
    if (pending.length) await LocalNotifications.cancel({ notifications: pending.map(({ id }) => ({ id })) })
    await LocalNotifications.createChannel({
      id: CHANNEL_ID, name: 'Rappels de tâches', description: 'Notifications à l’heure exacte de chaque tâche',
      importance: 5, visibility: 1, vibration: true, lights: true, lightColor: '#FF5FA2',
    })
    const list = [...buildSchedule(tasks, now), ...(cycle ? buildCycleSchedule(cycle, now) : [])]
    const result = list.length ? await LocalNotifications.schedule({ notifications: list }) : {}
    // on renvoie ce que le système a réellement en attente (et non ce qu'on a demandé)
    // et l'avertissement éventuel « programmé en alarme non exacte »
    return { count: (await LocalNotifications.getPending()).notifications.length, inexact: Boolean(result?.warning) }
  })
  return queue
}

/** Notification de test immédiate : vérifie permission + canal, sans alarme */
export function testNow() {
  return LocalNotifications.schedule({
    notifications: [{ id: 2, title: '💖 Test immédiat', body: 'Si tu vois ceci, les notifications sont autorisées !', channelId: CHANNEL_ID }],
  })
}

/** Alarme de test dans 1 minute, programmée comme les vraies tâches (ferme l'appli pour l'essayer). Renvoie { inexact, at }. */
export async function testNative(delayMs = 60000) {
  const at = new Date(Date.now() + delayMs)
  const result = await LocalNotifications.schedule({
    notifications: [{ id: 1, title: '⏰ Test alarme', body: 'Les rappels programmés fonctionnent !', channelId: CHANNEL_ID, schedule: { at, allowWhileIdle: true } }],
  })
  return { inexact: Boolean(result?.warning), at }
}

/** Bouton « retour » Android : `handler` renvoie true s'il a géré l'évènement, sinon on quitte l'appli. Retourne la fonction de nettoyage. */
export function onBackButton(handler) {
  const sub = App.addListener('backButton', () => { if (!handler()) App.exitApp() })
  return () => { sub.then((h) => h.remove()) }
}

/** Rappelle `fn` quand l'appli revient au premier plan. Retourne la fonction de nettoyage. */
export function onResume(fn) {
  const sub = App.addListener('appStateChange', ({ isActive }) => { if (isActive) fn() })
  return () => { sub.then((h) => h.remove()) }
}

/** Version installée (pour savoir quel APK tourne) */
export async function appVersion() {
  try { const { version, build } = await App.getInfo(); return `${version} (build ${build})` } catch { return '?' }
}

export const shareText = (title, text) => Share.share({ title, text, dialogTitle: title })
