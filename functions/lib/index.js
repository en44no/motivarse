"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiProxy = exports.notifyReaction = exports.notifyHabitCompleted = exports.notifyTaskCompleted = exports.habitReminders = exports.weeklySummary = exports.dailyHabitReminder = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-functions/v2/firestore");
const params_1 = require("firebase-functions/params");
const app_1 = require("firebase-admin/app");
const firestore_2 = require("firebase-admin/firestore");
const messaging_1 = require("firebase-admin/messaging");
const sdk_1 = require("@anthropic-ai/sdk");
(0, app_1.initializeApp)();
const anthropicKey = (0, params_1.defineSecret)('ANTHROPIC_API_KEY');
// ── Scheduled function ────────────────────────────────────────────────────────
exports.dailyHabitReminder = (0, scheduler_1.onSchedule)({ schedule: '0 22 * * *', timeZone: 'America/Montevideo' }, async () => {
    const snap = await (0, firestore_2.getFirestore)()
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
        try {
            await (0, messaging_1.getMessaging)().sendEach(messages);
        }
        catch (err) {
            console.error('dailyHabitReminder sendEach error:', err);
        }
    }
});
// ── Weekly Summary (Sundays 21:00 UY) ─────────────────────────────────────────
exports.weeklySummary = (0, scheduler_1.onSchedule)({ schedule: '0 21 * * 0', timeZone: 'America/Montevideo' }, async () => {
    const db = (0, firestore_2.getFirestore)();
    // Calculate Monday–Sunday range for this week (ISO week)
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0=Sun
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() - diffToMonday);
    const mondayStr = monday.toISOString().slice(0, 10); // YYYY-MM-DD
    const sundayStr = now.toISOString().slice(0, 10);
    const usersSnap = await db
        .collection('users')
        .where('notificationsEnabled', '==', true)
        .get();
    const eligibleUsers = usersSnap.docs.filter((d) => !!d.data().fcmToken);
    if (eligibleUsers.length === 0)
        return;
    const messages = [];
    for (const userDoc of eligibleUsers) {
        try {
            const uid = userDoc.id;
            const userData = userDoc.data();
            const coupleId = userData.coupleId;
            // 1. Completed habit logs this week
            const logsSnap = await db
                .collection('habitLogs')
                .where('userId', '==', uid)
                .where('completed', '==', true)
                .where('date', '>=', mondayStr)
                .where('date', '<=', sundayStr)
                .get();
            const completedCount = logsSnap.size;
            // 2. Active habits for this user
            let activeHabitCount = 0;
            if (coupleId) {
                const habitsSnap = await db
                    .collection('habits')
                    .where('coupleId', '==', coupleId)
                    .where('isActive', '==', true)
                    .get();
                activeHabitCount = habitsSnap.docs.filter((h) => h.data().userId === uid || h.data().scope === 'shared').length;
            }
            // 3. Weekly percent (approximate: habits * 7 days)
            const totalPossible = activeHabitCount * 7;
            const weeklyPercent = totalPossible > 0
                ? Math.min(100, Math.round((completedCount / totalPossible) * 100))
                : 0;
            // 4. Best streak
            const streaksSnap = await db
                .collection('streaks')
                .where('userId', '==', uid)
                .get();
            let bestStreak = 0;
            for (const s of streaksSnap.docs) {
                const d = s.data();
                const longest = d.longestStreak || 0;
                const current = d.currentStreak || 0;
                bestStreak = Math.max(bestStreak, longest, current);
            }
            // 5. Runs this week
            const runsSnap = await db
                .collection('runLogs')
                .where('userId', '==', uid)
                .where('date', '>=', mondayStr)
                .where('date', '<=', sundayStr)
                .get();
            const runsCount = runsSnap.size;
            // 6. Build body parts
            const parts = [];
            if (activeHabitCount > 0) {
                parts.push(`${weeklyPercent}% hábitos`);
            }
            if (bestStreak > 0) {
                parts.push(`Racha: ${bestStreak} días`);
            }
            if (runsCount > 0) {
                parts.push(`${runsCount} carrera${runsCount > 1 ? 's' : ''}`);
            }
            const body = parts.length > 0
                ? `Esta semana: ${parts.join(' · ')} 💪`
                : 'Revisá tus hábitos y arrancá la semana con todo 💪';
            messages.push({
                token: userData.fcmToken,
                notification: {
                    title: 'Resumen semanal 📊',
                    body,
                },
            });
        }
        catch (err) {
            console.error(`weeklySummary error for user ${userDoc.id}:`, err);
        }
    }
    if (messages.length > 0) {
        try {
            await (0, messaging_1.getMessaging)().sendEach(messages);
        }
        catch (err) {
            console.error('weeklySummary sendEach error:', err);
        }
    }
});
// ── Habit Reminders (per-habit push notifications) ───────────────────────────
exports.habitReminders = (0, scheduler_1.onSchedule)({ schedule: '* * * * *', timeZone: 'America/Montevideo' }, async () => {
    var _a;
    const db = (0, firestore_2.getFirestore)();
    // Current time in Montevideo (HH:mm)
    const nowMvd = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Montevideo' }));
    const currentHHmm = `${String(nowMvd.getHours()).padStart(2, '0')}:${String(nowMvd.getMinutes()).padStart(2, '0')}`;
    const todayStr = `${nowMvd.getFullYear()}-${String(nowMvd.getMonth() + 1).padStart(2, '0')}-${String(nowMvd.getDate()).padStart(2, '0')}`;
    const dayOfWeek = nowMvd.getDay(); // 0=Sun, 1=Mon...6=Sat
    // Query habits with reminder at this exact time
    const habitsSnap = await db
        .collection('habits')
        .where('reminder.enabled', '==', true)
        .where('reminder.time', '==', currentHHmm)
        .where('isActive', '==', true)
        .get();
    if (habitsSnap.empty)
        return;
    // Helper: check if habit is scheduled for today
    function isScheduledToday(habit) {
        switch (habit.frequency) {
            case 'daily':
                return true;
            case 'weekdays':
                return dayOfWeek >= 1 && dayOfWeek <= 5;
            case 'weekends':
                return dayOfWeek === 0 || dayOfWeek === 6;
            case 'custom':
                return Array.isArray(habit.customDays) && habit.customDays.includes(dayOfWeek);
            default:
                return true;
        }
    }
    const messages = [];
    for (const habitDoc of habitsSnap.docs) {
        try {
            const habit = habitDoc.data();
            if (!isScheduledToday(habit))
                continue;
            // Determine which users to notify
            const userIds = [];
            if (habit.scope === 'shared' && habit.coupleId) {
                const coupleDoc = await db.collection('couples').doc(habit.coupleId).get();
                if (coupleDoc.exists) {
                    const members = ((_a = coupleDoc.data()) === null || _a === void 0 ? void 0 : _a.members) || [];
                    userIds.push(...members);
                }
            }
            else {
                userIds.push(habit.userId);
            }
            // For each user, check if already completed today
            for (const uid of userIds) {
                const logSnap = await db
                    .collection('habitLogs')
                    .where('habitId', '==', habitDoc.id)
                    .where('userId', '==', uid)
                    .where('date', '==', todayStr)
                    .where('completed', '==', true)
                    .limit(1)
                    .get();
                if (!logSnap.empty)
                    continue; // already completed
                const userDoc = await db.collection('users').doc(uid).get();
                if (!userDoc.exists)
                    continue;
                const userData = userDoc.data();
                if (!userData.notificationsEnabled || !userData.fcmToken)
                    continue;
                messages.push({
                    token: userData.fcmToken,
                    notification: {
                        title: 'Recordatorio',
                        body: habit.name,
                    },
                });
            }
        }
        catch (err) {
            console.error(`habitReminders error for habit ${habitDoc.id}:`, err);
        }
    }
    if (messages.length > 0) {
        try {
            await (0, messaging_1.getMessaging)().sendEach(messages);
        }
        catch (err) {
            console.error('habitReminders sendEach error:', err);
        }
    }
});
// ── Notify task completed ─────────────────────────────────────────────────────
exports.notifyTaskCompleted = (0, https_1.onCall)(async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Debes estar autenticado.');
    }
    const { coupleId, taskTitle } = request.data;
    const completedByUid = request.auth.uid;
    const db = (0, firestore_2.getFirestore)();
    // Get couple doc to find members
    const coupleDoc = await db.collection('couples').doc(coupleId).get();
    if (!coupleDoc.exists)
        return { sent: false };
    const coupleData = coupleDoc.data();
    const members = coupleData.members || [];
    // Get the name of who completed
    const completedByDoc = await db.collection('users').doc(completedByUid).get();
    const completedByName = ((_a = completedByDoc.data()) === null || _a === void 0 ? void 0 : _a.displayName) || 'Tu pareja';
    // Find the partner (not the one who completed)
    const partnerUid = members.find((uid) => uid !== completedByUid);
    if (!partnerUid)
        return { sent: false };
    const partnerDoc = await db.collection('users').doc(partnerUid).get();
    if (!partnerDoc.exists)
        return { sent: false };
    const partnerData = partnerDoc.data();
    if (!partnerData.notificationsEnabled || !partnerData.fcmToken) {
        return { sent: false };
    }
    try {
        await (0, messaging_1.getMessaging)().send({
            token: partnerData.fcmToken,
            notification: {
                title: 'Motivarse 💪',
                body: `${completedByName} completó: ${taskTitle}`,
            },
        });
        return { sent: true };
    }
    catch (err) {
        console.error('notifyTaskCompleted FCM error:', err);
        return { sent: false };
    }
});
// ── Notify habit completed ───────────────────────────────────────────────────
exports.notifyHabitCompleted = (0, https_1.onCall)(async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Debes estar autenticado.');
    }
    const { coupleId, habitName } = request.data;
    const completedByUid = request.auth.uid;
    const db = (0, firestore_2.getFirestore)();
    // Get couple doc to find members
    const coupleDoc = await db.collection('couples').doc(coupleId).get();
    if (!coupleDoc.exists)
        return { sent: false };
    const coupleData = coupleDoc.data();
    const members = coupleData.members || [];
    // Get the name of who completed
    const completedByDoc = await db.collection('users').doc(completedByUid).get();
    const completedByName = ((_a = completedByDoc.data()) === null || _a === void 0 ? void 0 : _a.displayName) || 'Tu pareja';
    // Find the partner (not the one who completed)
    const partnerUid = members.find((uid) => uid !== completedByUid);
    if (!partnerUid)
        return { sent: false };
    const partnerDoc = await db.collection('users').doc(partnerUid).get();
    if (!partnerDoc.exists)
        return { sent: false };
    const partnerData = partnerDoc.data();
    if (!partnerData.notificationsEnabled || !partnerData.fcmToken) {
        return { sent: false };
    }
    try {
        await (0, messaging_1.getMessaging)().send({
            token: partnerData.fcmToken,
            notification: {
                title: 'Motivarse 💪',
                body: `${completedByName} completó: ${habitName} ✅`,
            },
        });
        return { sent: true };
    }
    catch (err) {
        console.error('notifyHabitCompleted FCM error:', err);
        return { sent: false };
    }
});
// ── Notify reaction ─────────────────────────────────────────────────────────
exports.notifyReaction = (0, firestore_1.onDocumentCreated)('reactions/{reactionId}', async (event) => {
    var _a, _b;
    const data = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!data)
        return;
    const { fromUserId, toUserId, type } = data;
    const db = (0, firestore_2.getFirestore)();
    // Get sender name
    const senderDoc = await db.collection('users').doc(fromUserId).get();
    const senderName = ((_b = senderDoc.data()) === null || _b === void 0 ? void 0 : _b.displayName) || 'Tu pareja';
    // Get receiver's FCM token
    const receiverDoc = await db.collection('users').doc(toUserId).get();
    if (!receiverDoc.exists)
        return;
    const receiverData = receiverDoc.data();
    if (!receiverData.notificationsEnabled || !receiverData.fcmToken)
        return;
    try {
        await (0, messaging_1.getMessaging)().send({
            token: receiverData.fcmToken,
            notification: {
                title: 'Motivarse 💪',
                body: `${senderName} te envió ${type}`,
            },
        });
    }
    catch (err) {
        console.error('notifyReaction FCM error:', err);
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
        const memorySection = context.memory
            ? `\nLo que ya sabés del usuario:\n${context.memory}\n`
            : '';
        const systemPrompt = `Sos un coach de bienestar personal llamado "Moti" dentro de la app Motivarse. Respondés en español, con un tono cálido, motivador y breve (máx 3 oraciones salvo que te pidan más detalle).

IMPORTANTE: Solo respondés sobre hábitos, bienestar personal, mandados/tareas, pareja y motivación. Si te preguntan algo fuera de estos temas, respondé amablemente que solo podés ayudar con temas de la app Motivarse.

Datos del usuario:
- Nombre: ${context.userName}
${context.partnerName ? `- Pareja: ${context.partnerName}` : ''}
- Hábitos activos: ${context.habitsCount}
- Hábitos completados hoy: ${context.completedToday} de ${context.totalToday}
- Mejor racha: ${context.bestStreak} días
${memorySection}
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
    // ── updateMemory ──────────────────────────────────────────────────────────
    if (type === 'updateMemory') {
        const { messages, existingMemory, userName } = data;
        const convo = messages.map((m) => `${m.role === 'user' ? userName : 'Moti'}: ${m.content}`).join('\n');
        const existing = existingMemory ? `Memoria actual:\n${existingMemory}\n\n` : '';
        const response = await client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 300,
            messages: [
                {
                    role: 'user',
                    content: `${existing}Conversación reciente:\n${convo}\n\nExtrae y actualiza los hechos clave sobre el usuario que sean útiles para futuras conversaciones de coaching. Máximo 150 palabras, en formato bullets, en español. Solo hechos concretos (metas, dificultades, logros, preferencias). No repitas información ya presente en la memoria actual.`,
                },
            ],
        });
        const memory = response.content[0].text.trim();
        return { memory };
    }
    throw new https_1.HttpsError('invalid-argument', `Tipo de request desconocido: ${type}`);
});
//# sourceMappingURL=index.js.map