"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiProxy = exports.dailyHabitReminder = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const messaging_1 = require("firebase-admin/messaging");
const sdk_1 = require("@anthropic-ai/sdk");
(0, app_1.initializeApp)();
const anthropicKey = (0, params_1.defineSecret)('ANTHROPIC_API_KEY');
// ── Scheduled function ────────────────────────────────────────────────────────
exports.dailyHabitReminder = (0, scheduler_1.onSchedule)({ schedule: '0 1 * * *', timeZone: 'America/Montevideo' }, async () => {
    const snap = await (0, firestore_1.getFirestore)()
        .collection('users')
        .where('notificationsEnabled', '==', true)
        .get();
    const messages = snap.docs
        .filter((d) => !!d.data().fcmToken)
        .map((d) => ({
        token: d.data().fcmToken,
        notification: {
            title: 'Motivarse 💪',
            body: '¡Recordá completar tus hábitos de hoy!',
        },
    }));
    if (messages.length > 0) {
        await (0, messaging_1.getMessaging)().sendEach(messages);
    }
});
// ── AI Proxy ──────────────────────────────────────────────────────────────────
exports.aiProxy = (0, https_1.onCall)({ secrets: [anthropicKey] }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Debes estar autenticado para usar esta función.');
    }
    const { type, data } = request.data;
    const client = new sdk_1.default({ apiKey: anthropicKey.value() });
    // ── autocategorize ────────────────────────────────────────────────────────
    if (type === 'autocategorize') {
        const { title, categories } = data;
        const catList = categories
            .map((c) => `- id="${c.id}" emoji=${c.emoji} label="${c.label}"`)
            .join('\n');
        const response = await client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 50,
            messages: [
                {
                    role: 'user',
                    content: `Tenés que categorizar un mandado. Devolvé SOLO el id de la categoría que mejor encaja, o "none" si ninguna aplica. No expliques nada más.

Mandado: "${title}"

Categorías disponibles:
${catList}

Responde únicamente con el id (ej: "cat_abc123") o "none".`,
                },
            ],
        });
        const raw = response.content[0].text.trim().replace(/"/g, '');
        const validIds = categories.map((c) => c.id);
        const categoryId = validIds.includes(raw) ? raw : null;
        return { categoryId };
    }
    // ── generateHabits ────────────────────────────────────────────────────────
    if (type === 'generateHabits') {
        const { goal, scope, existingNames } = data;
        const scopeNote = scope === 'shared'
            ? 'Son hábitos para hacer EN PAREJA, orientados a actividades que la pareja pueda hacer juntos.'
            : 'Son hábitos personales para el usuario individual.';
        const existingNote = existingNames.length > 0
            ? `Evitá sugerir hábitos similares a estos que ya tiene: ${existingNames.join(', ')}.`
            : '';
        const response = await client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 800,
            messages: [
                {
                    role: 'user',
                    content: `Generá exactamente 5 hábitos en formato JSON para alguien con este objetivo: "${goal}".

${scopeNote}
${existingNote}

Devolvé SOLO un array JSON válido con esta estructura exacta, sin texto adicional:
[
  {
    "name": "nombre corto del hábito (máx 40 chars)",
    "category": "sleep|health|productivity|fitness|custom",
    "icon": "un emoji representativo",
    "color": "un color hex como #4CAF50",
    "frequency": "daily|weekdays|weekends",
    "description": "descripción motivadora de 1 oración"
  }
]`,
                },
            ],
        });
        const text = response.content[0].text.trim();
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new https_1.HttpsError('internal', 'No se pudo parsear la respuesta de IA.');
        }
        const habits = JSON.parse(jsonMatch[0]);
        return { habits };
    }
    // ── coach ─────────────────────────────────────────────────────────────────
    if (type === 'coach') {
        const { messages, context } = data;
        const systemPrompt = `Sos un coach de bienestar personal llamado "Moti" dentro de la app Motivarse. Respondés en español, con un tono cálido, motivador y breve (máx 3 oraciones salvo que te pidan más detalle).

Datos del usuario:
- Nombre: ${context.userName}
${context.partnerName ? `- Pareja: ${context.partnerName}` : ''}
- Hábitos activos: ${context.habitsCount}
- Hábitos completados hoy: ${context.completedToday} de ${context.totalToday}
- Mejor racha: ${context.bestStreak} días

Ayudá al usuario con motivación, consejos de hábitos, estrategias de bienestar, o simplemente escuchalo. No inventes datos que no tenés.`;
        const response = await client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 400,
            system: systemPrompt,
            messages: messages.map((m) => ({
                role: m.role,
                content: m.content,
            })),
        });
        const content = response.content[0].text;
        return { content };
    }
    throw new https_1.HttpsError('invalid-argument', `Tipo de request desconocido: ${type}`);
});
//# sourceMappingURL=index.js.map