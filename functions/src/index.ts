import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { defineSecret } from 'firebase-functions/params';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import Anthropic from '@anthropic-ai/sdk';

initializeApp();

const anthropicKey = defineSecret('ANTHROPIC_API_KEY');

// ── Types ─────────────────────────────────────────────────────────────────────

interface CategoryOption {
  id: string;
  label: string;
  emoji: string;
}

interface CoachMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface CoachContext {
  userName: string;
  partnerName?: string;
  habitsCount: number;
  completedToday: number;
  totalToday: number;
  bestStreak: number;
  memory?: string;
}

// ── Scheduled function ────────────────────────────────────────────────────────

export const dailyHabitReminder = onSchedule(
  { schedule: '0 22 * * *', timeZone: 'America/Montevideo' },
  async () => {
    const snap = await getFirestore()
      .collection('users')
      .where('notificationsEnabled', '==', true)
      .get();

    const messages = snap.docs
      .filter((d) => !!d.data().fcmToken)
      .map((d) => ({
        token: d.data().fcmToken as string,
        notification: {
          title: 'Motivarse 💪',
          body: '¡Recordá completar tus hábitos de hoy!',
        },
      }));

    if (messages.length > 0) {
      try {
        await getMessaging().sendEach(messages);
      } catch (err) {
        console.error('dailyHabitReminder sendEach error:', err);
      }
    }
  }
);

// ── Weekly Summary (Sundays 21:00 UY) ─────────────────────────────────────────

export const weeklySummary = onSchedule(
  { schedule: '0 21 * * 0', timeZone: 'America/Montevideo' },
  async () => {
    const db = getFirestore();

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
    if (eligibleUsers.length === 0) return;

    const messages: {
      token: string;
      notification: { title: string; body: string };
    }[] = [];

    for (const userDoc of eligibleUsers) {
      try {
        const uid = userDoc.id;
        const userData = userDoc.data();
        const coupleId = userData.coupleId as string | undefined;

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
          activeHabitCount = habitsSnap.docs.filter(
            (h) => h.data().userId === uid || h.data().scope === 'shared'
          ).length;
        }

        // 3. Weekly percent (approximate: habits * 7 days)
        const totalPossible = activeHabitCount * 7;
        const weeklyPercent =
          totalPossible > 0
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
          const longest = (d.longestStreak as number) || 0;
          const current = (d.currentStreak as number) || 0;
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
        const parts: string[] = [];
        if (activeHabitCount > 0) {
          parts.push(`${weeklyPercent}% hábitos`);
        }
        if (bestStreak > 0) {
          parts.push(`Racha: ${bestStreak} días`);
        }
        if (runsCount > 0) {
          parts.push(`${runsCount} carrera${runsCount > 1 ? 's' : ''}`);
        }

        const body =
          parts.length > 0
            ? `Esta semana: ${parts.join(' · ')} 💪`
            : 'Revisá tus hábitos y arrancá la semana con todo 💪';

        messages.push({
          token: userData.fcmToken as string,
          notification: {
            title: 'Resumen semanal 📊',
            body,
          },
        });
      } catch (err) {
        console.error(`weeklySummary error for user ${userDoc.id}:`, err);
      }
    }

    if (messages.length > 0) {
      try {
        await getMessaging().sendEach(messages);
      } catch (err) {
        console.error('weeklySummary sendEach error:', err);
      }
    }
  }
);

// ── Habit Reminders (per-habit push notifications) ───────────────────────────

export const habitReminders = onSchedule(
  { schedule: '* * * * *', timeZone: 'America/Montevideo' },
  async () => {
    const db = getFirestore();

    // Current time in Montevideo (HH:mm)
    const nowMvd = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'America/Montevideo' })
    );
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

    if (habitsSnap.empty) return;

    // Helper: check if habit is scheduled for today
    function isScheduledToday(habit: FirebaseFirestore.DocumentData): boolean {
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

    const messages: { token: string; notification: { title: string; body: string } }[] = [];

    for (const habitDoc of habitsSnap.docs) {
      try {
        const habit = habitDoc.data();
        if (!isScheduledToday(habit)) continue;

        // Determine which users to notify
        const userIds: string[] = [];
        if (habit.scope === 'shared' && habit.coupleId) {
          const coupleDoc = await db.collection('couples').doc(habit.coupleId).get();
          if (coupleDoc.exists) {
            const members: string[] = coupleDoc.data()?.members || [];
            userIds.push(...members);
          }
        } else {
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

          if (!logSnap.empty) continue; // already completed

          const userDoc = await db.collection('users').doc(uid).get();
          if (!userDoc.exists) continue;

          const userData = userDoc.data()!;
          if (!userData.notificationsEnabled || !userData.fcmToken) continue;

          messages.push({
            token: userData.fcmToken,
            notification: {
              title: 'Recordatorio',
              body: habit.name,
            },
          });
        }
      } catch (err) {
        console.error(`habitReminders error for habit ${habitDoc.id}:`, err);
      }
    }

    if (messages.length > 0) {
      try {
        await getMessaging().sendEach(messages);
      } catch (err) {
        console.error('habitReminders sendEach error:', err);
      }
    }
  }
);

// ── Notify task completed ─────────────────────────────────────────────────────

export const notifyTaskCompleted = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes estar autenticado.');
  }

  const { coupleId, taskTitle } = request.data as {
    coupleId: string;
    taskTitle: string;
  };

  const completedByUid = request.auth.uid;
  const db = getFirestore();

  // Get couple doc to find members
  const coupleDoc = await db.collection('couples').doc(coupleId).get();
  if (!coupleDoc.exists) return { sent: false };

  const coupleData = coupleDoc.data()!;
  const members: string[] = coupleData.members || [];

  // Get the name of who completed
  const completedByDoc = await db.collection('users').doc(completedByUid).get();
  const completedByName = completedByDoc.data()?.displayName || 'Tu pareja';

  // Find the partner (not the one who completed)
  const partnerUid = members.find((uid: string) => uid !== completedByUid);
  if (!partnerUid) return { sent: false };

  const partnerDoc = await db.collection('users').doc(partnerUid).get();
  if (!partnerDoc.exists) return { sent: false };

  const partnerData = partnerDoc.data()!;
  if (!partnerData.notificationsEnabled || !partnerData.fcmToken) {
    return { sent: false };
  }

  try {
    await getMessaging().send({
      token: partnerData.fcmToken,
      notification: {
        title: 'Motivarse 💪',
        body: `${completedByName} completó: ${taskTitle}`,
      },
    });
    return { sent: true };
  } catch (err) {
    console.error('notifyTaskCompleted FCM error:', err);
    return { sent: false };
  }
});

// ── Notify todo added ───────────────────────────────────────────────────────

export const notifyTodoAdded = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes estar autenticado.');
  }

  const { coupleId, titles } = request.data as {
    coupleId: string;
    titles: string[];
  };

  const addedByUid = request.auth.uid;
  const db = getFirestore();

  const coupleDoc = await db.collection('couples').doc(coupleId).get();
  if (!coupleDoc.exists) return { sent: false };

  const members: string[] = coupleDoc.data()!.members || [];

  const senderDoc = await db.collection('users').doc(addedByUid).get();
  const senderName = senderDoc.data()?.displayName || 'Tu pareja';

  const partnerUid = members.find((uid: string) => uid !== addedByUid);
  if (!partnerUid) return { sent: false };

  const partnerDoc = await db.collection('users').doc(partnerUid).get();
  if (!partnerDoc.exists) return { sent: false };

  const partnerData = partnerDoc.data()!;
  if (!partnerData.notificationsEnabled || !partnerData.fcmToken) {
    return { sent: false };
  }

  const body = titles.length === 1
    ? `${senderName} agregó: ${titles[0]} 🛒`
    : `${senderName} agregó ${titles.length} cosas a la lista 🛒`;

  try {
    await getMessaging().send({
      token: partnerData.fcmToken,
      notification: {
        title: 'Motivarse 💪',
        body,
      },
    });
    return { sent: true };
  } catch (err) {
    console.error('notifyTodoAdded FCM error:', err);
    return { sent: false };
  }
});

// ── Notify habit completed ───────────────────────────────────────────────────

export const notifyHabitCompleted = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes estar autenticado.');
  }

  const { coupleId, habitName } = request.data as {
    coupleId: string;
    habitName: string;
  };

  const completedByUid = request.auth.uid;
  const db = getFirestore();

  // Get couple doc to find members
  const coupleDoc = await db.collection('couples').doc(coupleId).get();
  if (!coupleDoc.exists) return { sent: false };

  const coupleData = coupleDoc.data()!;
  const members: string[] = coupleData.members || [];

  // Get the name of who completed
  const completedByDoc = await db.collection('users').doc(completedByUid).get();
  const completedByName = completedByDoc.data()?.displayName || 'Tu pareja';

  // Find the partner (not the one who completed)
  const partnerUid = members.find((uid: string) => uid !== completedByUid);
  if (!partnerUid) return { sent: false };

  const partnerDoc = await db.collection('users').doc(partnerUid).get();
  if (!partnerDoc.exists) return { sent: false };

  const partnerData = partnerDoc.data()!;
  if (!partnerData.notificationsEnabled || !partnerData.fcmToken) {
    return { sent: false };
  }

  try {
    await getMessaging().send({
      token: partnerData.fcmToken,
      notification: {
        title: 'Motivarse 💪',
        body: `${completedByName} completó: ${habitName} ✅`,
      },
    });
    return { sent: true };
  } catch (err) {
    console.error('notifyHabitCompleted FCM error:', err);
    return { sent: false };
  }
});

// ── Notify reaction ─────────────────────────────────────────────────────────

export const notifyReaction = onDocumentCreated('reactions/{reactionId}', async (event) => {
  const data = event.data?.data();
  if (!data) return;

  const { fromUserId, toUserId, type } = data as {
    fromUserId: string;
    toUserId: string;
    type: string;
  };

  const db = getFirestore();

  // Get sender name
  const senderDoc = await db.collection('users').doc(fromUserId).get();
  const senderName = senderDoc.data()?.displayName || 'Tu pareja';

  // Get receiver's FCM token
  const receiverDoc = await db.collection('users').doc(toUserId).get();
  if (!receiverDoc.exists) return;

  const receiverData = receiverDoc.data()!;
  if (!receiverData.notificationsEnabled || !receiverData.fcmToken) return;

  try {
    await getMessaging().send({
      token: receiverData.fcmToken,
      notification: {
        title: 'Motivarse 💪',
        body: `${senderName} te envió ${type}`,
      },
    });
  } catch (err) {
    console.error('notifyReaction FCM error:', err);
  }
});

// ── AI Proxy ──────────────────────────────────────────────────────────────────

export const aiProxy = onCall(
  { secrets: [anthropicKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Debes estar autenticado para usar esta función.');
    }

    const { type, data } = request.data as {
      type: 'autocategorize' | 'generateHabits' | 'coach' | 'updateMemory';
      data: unknown;
    };

    const client = new Anthropic({ apiKey: anthropicKey.value() });

    // ── autocategorize ────────────────────────────────────────────────────────
    if (type === 'autocategorize') {
      const { title, categories } = data as {
        title: string;
        categories: CategoryOption[];
      };

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

      const raw = (response.content[0] as { type: string; text: string }).text.trim().replace(/"/g, '');
      const validIds = categories.map((c) => c.id);
      const categoryId = validIds.includes(raw) ? raw : null;

      return { categoryId };
    }

    // ── generateHabits ────────────────────────────────────────────────────────
    if (type === 'generateHabits') {
      const { goal, scope, existingNames } = data as {
        goal: string;
        scope: 'individual' | 'shared';
        existingNames: string[];
      };

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

      const text = (response.content[0] as { type: string; text: string }).text.trim();
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new HttpsError('internal', 'No se pudo parsear la respuesta de IA.');
      }
      const habits = JSON.parse(jsonMatch[0]);
      return { habits };
    }

    // ── coach ─────────────────────────────────────────────────────────────────
    if (type === 'coach') {
      const { messages, context } = data as {
        messages: CoachMessage[];
        context: CoachContext;
      };

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

      const content = (response.content[0] as { type: string; text: string }).text;
      return { content };
    }

    // ── updateMemory ──────────────────────────────────────────────────────────
    if (type === 'updateMemory') {
      const { messages, existingMemory, userName } = data as {
        messages: CoachMessage[];
        existingMemory: string;
        userName: string;
      };

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

      const memory = (response.content[0] as { type: string; text: string }).text.trim();
      return { memory };
    }

    throw new HttpsError('invalid-argument', `Tipo de request desconocido: ${type}`);
  }
);
