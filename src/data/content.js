// Contenus affichés dans l'appli : citations, messages de motivation, listes de choix

export const QUOTES = [
  ['La vie est belle, il suffit de savoir la regarder avec des yeux de lumière.', 'Proverbe'],
  ['Le secret pour avancer, c’est de commencer.', 'Mark Twain'],
  ['Ce n’est pas la destination qui compte, mais le chemin parcouru.', 'Proverbe'],
  ['Crois en toi et tout devient possible.', 'Proverbe'],
  ['Chaque jour est une nouvelle page blanche : écris-y quelque chose de beau.', 'Anonyme'],
  ['On ne voit bien qu’avec le cœur. L’essentiel est invisible pour les yeux.', 'Antoine de Saint-Exupéry'],
  ['Petit à petit, l’oiseau fait son nid.', 'Proverbe'],
  ['Le bonheur n’est pas d’avoir ce que l’on désire, mais d’aimer ce que l’on a.', 'Proverbe'],
  ['Sois la douceur que tu aimerais recevoir du monde.', 'Anonyme'],
  ['Il faut toujours viser la lune, car même en cas d’échec, on atterrit dans les étoiles.', 'Oscar Wilde'],
  ['Fais de ta vie un rêve, et d’un rêve, une réalité.', 'Antoine de Saint-Exupéry'],
  ['La persévérance est la mère de toutes les réussites.', 'Proverbe'],
  ['Là où il y a de l’amour, il y a de la vie.', 'Gandhi'],
  ['Apprendre, c’est découvrir ce que tu sais déjà. Agir, c’est le démontrer.', 'Richard Bach'],
  ['Chaque petit pas compte, même les plus lents.', 'Anonyme'],
]

export const MOTIVATIONS = [
  'Aujourd’hui, tu as le droit d’être fière de toi, quoi qu’il arrive. 🌸',
  'Tu es plus forte que tu ne le crois et plus capable que tu ne l’imagines. 💪',
  'Une tâche à la fois, un sourire à la fois. Tu vas y arriver ! ✨',
  'Ta douceur est une force. Avance à ton rythme, mais avance. 🦋',
  'Chaque effort d’aujourd’hui prépare la fierté de demain. 🌷',
  'Tu mérites une journée belle et douce. Fais-toi confiance. 💖',
  'Respire, souris, et fais de ton mieux : c’est déjà énorme. 🌈',
  'Tu brilles, même les jours où tu en doutes. ⭐',
  'Aujourd’hui est une belle occasion de grandir un peu. 🌱',
  'Ne te compare pas : ta route est unique et magnifique. 🌺',
]

export const EMOJIS = ['🌅','🌸','💪','📖','🗣️','🍽️','💆‍♀️','💧','🧘‍♀️','🏃‍♀️','💊','🧹','📞','🛍️','🎨','🎵','💻','🛏️','🚿','☕','🌙','🐱','🧴','✨']
export const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]
export const MOODS = ['😍', '😊', '😐', '😔', '😭']
export const GLASSES = 8
export const SOUNDS = [['carillon', 'Carillon ✨'], ['cloche', 'Cloche 🔔'], ['default', 'Son du téléphone 📱']]
export const THEMES = [['rose', 'Rose'], ['peche', 'Pêche'], ['lilas', 'Lilas']]

// kind : contenu spécial affiché dans la carte de la tâche (welcome | motivation | quote)
const daily = (id, emoji, title, time, kind) => ({ id, emoji, title, time, repeat: 'daily', days: [], date: '', notify: true, ...(kind && { kind }) })

export const DEFAULT_TASKS = [
  daily('d1', '🌅', 'Réveil & message de bienvenue', '07:00', 'welcome'),
  daily('d2', '💪', 'Motivation du jour', '07:15', 'motivation'),
  daily('d3', '💬', 'Citation du jour', '07:30', 'quote'),
  daily('d4', '🍽️', 'Manger', '08:00'),
  daily('d5', '📖', 'Lire en français', '10:00'),
  daily('d6', '🗣️', 'Parler (pratique orale)', '15:00'),
  daily('d7', '💆‍♀️', 'Faire mes soins', '21:00'),
]
