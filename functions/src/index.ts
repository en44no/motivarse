import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
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
}

// ── Scheduled function ────────────────────────────────────────────────────────

export const dailyHabitReminder = onSchedule(
  { schedule: '0 1 * * *', timeZone: 'America/Montevideo' },
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
      await getMessaging().sendEach(messages);
    }
  }
);

// ── AI Proxy ──────────────────────────────────────────────────────────────────

export const aiProxy = onCall(
  { secrets: [anthropicKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Debes estar autenticado para usar esta función.');
    }

    const { type, data } = request.data as {
      type: 'autocategorize' | 'generateHabits' | 'coach';
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

      const content = (response.content[0] as { type: string; text: string }).text;
      return { content };
    }

    throw new HttpsError('invalid-argument', `Tipo de request desconocido: ${type}`);
  }
);
