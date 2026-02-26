export interface Quote {
  text: string;
  author: string;
}

const QUOTES: Quote[] = [
  // Disciplina y consistencia
  { text: "La disciplina es el puente entre las metas y los logros.", author: "Jim Rohn" },
  { text: "No importa lo lento que vayas, siempre y cuando no te detengas.", author: "Confucio" },
  { text: "La motivacion te pone en marcha, el habito te mantiene.", author: "Jim Ryun" },
  { text: "Somos lo que hacemos repetidamente. La excelencia no es un acto, sino un habito.", author: "Aristoteles" },
  { text: "El secreto del exito se encuentra en tu rutina diaria.", author: "John C. Maxwell" },
  { text: "La constancia es la virtud por la cual todas las demas dan fruto.", author: "Arturo Graf" },

  // Running y fitness
  { text: "Correr es la forma mas simple de libertad. Solo necesitas un par de zapatillas y ganas.", author: "Jesse Owens" },
  { text: "No corres contra otros. Corres contra la persona que fuiste ayer.", author: "Anonimo" },
  { text: "El dolor que sientes hoy sera la fuerza que sentiras manana.", author: "Arnold Schwarzenegger" },
  { text: "Tu cuerpo puede soportar casi cualquier cosa. Es tu mente la que necesitas convencer.", author: "Anonimo" },
  { text: "Cada kilometro que corres te acerca a la mejor version de vos mismo.", author: "Anonimo" },
  { text: "El running no es solo un deporte, es una forma de vida.", author: "Anonimo" },

  // Habitos
  { text: "Los habitos exitosos se construyen un dia a la vez.", author: "James Clear" },
  { text: "No necesitas ser extremo, solo necesitas ser consistente.", author: "Anonimo" },
  { text: "Primero hacemos nuestros habitos, luego nuestros habitos nos hacen a nosotros.", author: "John Dryden" },
  { text: "El mejor momento para plantar un arbol fue hace 20 anos. El segundo mejor es ahora.", author: "Proverbio chino" },
  { text: "Pequenas acciones diarias crean resultados extraordinarios.", author: "Robin Sharma" },
  { text: "Un habito no se elimina, se reemplaza.", author: "Charles Duhigg" },

  // Pareja y equipo
  { text: "Juntos podemos lograr lo que solos parece imposible.", author: "Anonimo" },
  { text: "Un equipo no es un grupo de personas que trabajan juntas. Es un grupo que confia entre si.", author: "Simon Sinek" },
  { text: "El amor no es mirarse el uno al otro, sino mirar juntos en la misma direccion.", author: "Antoine de Saint-Exupery" },
  { text: "Crecer juntos es la aventura mas hermosa.", author: "Anonimo" },
  { text: "Dos personas comprometidas con mejorar son imparables.", author: "Anonimo" },

  // Rutinas matutinas y dia a dia
  { text: "Cada manana traes dos opciones: seguir durmiendo con tus suenos, o levantarte y perseguirlos.", author: "Anonimo" },
  { text: "Como empieces tu manana determina como viviras tu dia.", author: "Robin Sharma" },
  { text: "La clave no es la intensidad, sino la frecuencia.", author: "Anonimo" },
  { text: "No esperes por la motivacion. Actua y la motivacion te seguira.", author: "Anonimo" },
  { text: "Un paso a la vez es suficiente para llegar lejos.", author: "Anonimo" },
  { text: "Lo que hagas todos los dias importa mas que lo que hagas de vez en cuando.", author: "Gretchen Rubin" },
  { text: "El progreso, no la perfeccion, es lo que importa.", author: "Anonimo" },
  { text: "Hoy es un buen dia para ser mejor que ayer.", author: "Anonimo" },
];

export function getQuoteOfTheDay(): Quote {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return QUOTES[dayOfYear % QUOTES.length];
}
