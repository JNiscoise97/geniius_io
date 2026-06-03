import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const anthropic = new Anthropic({
  apiKey: Deno.env.get("ANTHROPIC_API_KEY")!,
});

const MODEL = "claude-sonnet-4-6";

// =====================================================
// OUTILS DE L'AGENT
// =====================================================

const AGENT_TOOLS: Anthropic.Tool[] = [
  {
    name: "search_person",
    description:
      "Rechercher une personne dans l'arbre Tree par nom, prénom, surnom ou identité connue. Appeler avant de supposer l'identité de quelqu'un.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Nom, prénom, surnom ou toute désignation" },
      },
      required: ["query"],
    },
  },
  {
    name: "get_person_gaps",
    description: "Obtenir les champs manquants sur la fiche d'une personne dans Tree",
    input_schema: {
      type: "object" as const,
      properties: {
        person_id: { type: "string" },
      },
      required: ["person_id"],
    },
  },
  {
    name: "propose_update",
    description:
      "Proposer une mise à jour d'un champ dans Tree. Ne s'applique JAMAIS automatiquement — attend validation utilisateur.",
    input_schema: {
      type: "object" as const,
      properties: {
        person_id: { type: "string" },
        field: {
          type: "string",
          enum: [
            "identity", "birth_date", "birth_place", "death_date",
            "profession", "location", "relation", "note", "event",
          ],
        },
        proposed_value: { type: "object", description: "Nouvelle valeur avec contexte" },
        source: { type: "string", description: "Ex: 'Témoignage Lucienne, session du 03/06/2026'" },
        confidence: {
          type: "string",
          enum: ["certain", "probable", "uncertain"],
          description: "Niveau de certitude de l'information",
        },
      },
      required: ["person_id", "field", "proposed_value", "source", "confidence"],
    },
  },
  {
    name: "add_identity",
    description: "Proposer l'ajout d'une nouvelle identité sourcée (surnom, variante de nom, etc.)",
    input_schema: {
      type: "object" as const,
      properties: {
        person_id: { type: "string" },
        label: { type: "string", description: "Le nom/surnom tel qu'utilisé" },
        source: { type: "string" },
        period: { type: "string", description: "Période d'usage ex: 'années 1950'" },
        social_context: { type: "string", description: "Qui utilisait ce nom" },
      },
      required: ["person_id", "label", "source"],
    },
  },
  {
    name: "create_unknown_person",
    description: "Créer une fiche 'à confirmer' pour une personne inconnue dans Tree",
    input_schema: {
      type: "object" as const,
      properties: {
        known_name: { type: "string" },
        known_relations: { type: "object" },
        source: { type: "string" },
      },
      required: ["known_name", "source"],
    },
  },
  {
    name: "flag_open_thread",
    description: "Marquer un fil à creuser lors d'une prochaine session",
    input_schema: {
      type: "object" as const,
      properties: {
        note: { type: "string", description: "Description du fil à creuser" },
        person_id: { type: "string", description: "Individu concerné si connu" },
        priority: {
          type: "string",
          enum: ["high", "normal", "low"],
          description: "Priorité du fil",
        },
      },
      required: ["note", "priority"],
    },
  },
];

// =====================================================
// PROMPT SYSTÈME — CHAT
// =====================================================

function buildSystemPrompt(session: Record<string, unknown>): string {
  const today = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const treePersons = ((session.tree_context as any)?.persons ?? []) as any[];
  const knownPersonsList = treePersons.length > 0
    ? treePersons.map((p: any) =>
        `- ${p.given_name ?? ""} ${p.family_name ?? ""} (id: ${p.id})`.trim()
      ).join("\n")
    : "Aucune personne injectée dans ce contexte Tree.";

  const knownFacts = session.known_facts
    ? JSON.stringify(session.known_facts, null, 2)
    : "Aucun fait connu pour l'instant.";

  const subjectDesc = (session.subject_raw as string | null)
    ?? (session.theme_value as string | null)
    ?? "Non précisé";

  const intentLabel: Record<string, string> = {
    confirm: "confirmer des informations existantes",
    enrich: "enrichir des fiches existantes",
    discover: "découvrir de nouvelles informations",
    free: "exploration libre",
  };

  return `Tu es un agent d'interview généalogique pour la suite Geniius.io.
Tu conduis des entretiens de mémoire vivante pour enrichir un arbre généalogique.

CONTEXTE DE CETTE SESSION :
- Personne interrogée : ${(session.interviewer_name as string | null) ?? "Non précisé"}
- Sujet : ${subjectDesc}
- Intention : ${intentLabel[(session.intent as string) ?? "free"] ?? "exploration libre"}
- Date : ${today}

PERSONNES CONNUES DANS L'ARBRE :
${knownPersonsList}

CE QUI EST DÉJÀ CONNU :
${knownFacts}

ONTOLOGIE — CATÉGORIES À COLLECTER :
1. Identités : prénoms, noms, surnoms, sobriquets, variantes orthographiques
2. Dates : naissance, baptême, mariage(s), décès — jour/mois/année/circa
3. Lieux : naissance, enfance, vie adulte, décès — noms locaux et variantes
4. Professions : métiers, employeurs, périodes, contexte économique
5. Relations : fratrie, cousinage, parrainage, voisinage influent
6. Événements marquants : guerres, migrations, deuils, héritages, fêtes
7. Traits, habitudes, anecdotes mémorables
8. Sources documentaires connues (actes, lettres, photos)

RÈGLES DE CONDUITE :
1. Maximum 2 questions à la fois
2. Ne jamais redemander ce qui est dans "CE QUI EST DÉJÀ CONNU" ou dans l'arbre
3. Rebondir sur chaque réponse avant de changer de sujet
4. Si un nom inconnu émerge → search_person() AVANT de continuer
5. Questions sensorielles (odeurs, goûts, objets, lieux précis) — elles débloquent les souvenirs
6. Toujours sourcer : "Témoignage ${(session.interviewer_name as string | null) ?? "interlocuteur"}, session du ${today}"
7. Appeler propose_update() ou add_identity() pour chaque info nouvelle confirmée
8. Ton chaleureux et conversationnel — jamais clinique, jamais formulaire

PRINCIPE DES IDENTITÉS MULTIPLES :
Ne jamais écraser une identité existante — toujours add_identity() avec source + contexte.
Si un surnom est mentionné → search_person() pour identifier à qui il correspond.

RÉSOLUTION D'IDENTITÉ :
1. search_person() avec le nom/surnom mentionné
2. Si plusieurs candidats → présenter à l'utilisateur pour qu'il choisisse
3. Si aucun résultat → create_unknown_person()
4. Confirmer l'identité avant de proposer des mises à jour

NIVEAU DE CERTITUDE :
- certain : la personne l'a dit explicitement et clairement
- probable : c'est vraisemblable mais pas totalement confirmé
- uncertain : approximatif, à vérifier avec d'autres sources`;
}

// =====================================================
// EXÉCUTION DES OUTILS
// =====================================================

async function executeTool(
  toolUse: Anthropic.ToolUseBlock,
  session: Record<string, unknown>,
  supabase: ReturnType<typeof createClient>
): Promise<unknown> {
  const input = toolUse.input as Record<string, unknown>;

  switch (toolUse.name) {
    case "search_person": {
      const query = String(input.query ?? "").toLowerCase();
      const persons = ((session.tree_context as any)?.persons ?? []) as any[];

      const local = persons.filter((p: any) => {
        const names = [
          p.given_name, p.family_name,
          ...(p.known_names ?? []),
          ...(p.identities ?? []).map((i: any) => i.label),
        ].filter(Boolean).map((n: string) => n.toLowerCase());
        return names.some((n) => n.includes(query));
      });

      if (local.length > 0) return { results: local, source: "tree_context" };

      try {
        const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/tree-api/person/search?q=${encodeURIComponent(String(input.query))}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
        });
        if (res.ok) return await res.json();
      } catch { /* tree-api non disponible */ }

      return { results: [], message: "Aucune personne trouvée." };
    }

    case "get_person_gaps": {
      const personId = String(input.person_id ?? "");
      try {
        const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/tree-api/person/${personId}/gaps`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
        });
        if (res.ok) return await res.json();
      } catch { /* ignore */ }
      return { gaps: ["birth_date", "death_date", "birth_place", "professions"] };
    }

    case "propose_update": {
      const { error } = await supabase.from("journal_proposals").insert({
        session_id: session.id,
        person_id: input.person_id,
        field: input.field,
        proposed_value: input.proposed_value,
        source: input.source,
        confidence: input.confidence ?? "probable",
        status: "pending",
      });
      return { success: !error, error: error?.message };
    }

    case "add_identity": {
      const { error } = await supabase.from("journal_proposals").insert({
        session_id: session.id,
        person_id: input.person_id,
        field: "identity",
        proposed_value: {
          label: input.label,
          period: input.period ?? null,
          social_context: input.social_context ?? null,
        },
        source: input.source,
        confidence: "certain",
        status: "pending",
      });
      return { success: !error };
    }

    case "create_unknown_person": {
      const { data, error } = await supabase
        .from("journal_proposals")
        .insert({
          session_id: session.id,
          field: "new_person",
          proposed_value: {
            known_name: input.known_name,
            known_relations: input.known_relations ?? {},
          },
          source: input.source,
          confidence: "uncertain",
          status: "pending",
        })
        .select()
        .single();
      return { success: !error, proposal_id: data?.id };
    }

    case "flag_open_thread": {
      const { error } = await supabase.from("journal_threads_open").insert({
        session_id: session.id,
        note: input.note,
        person_id: input.person_id ?? null,
        priority: input.priority ?? "normal",
      });
      return { success: !error };
    }

    default:
      return { error: `Outil inconnu : ${toolUse.name}` };
  }
}

// =====================================================
// ACTION : GENERATE_CONTEXT
// Génère un résumé avant de créer la session
// =====================================================

async function generateContext(
  interviewerDescription: string,
  themeText: string
): Promise<{ summary: string; parsed: Record<string, string> }> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Tu prépares une session d'interview généalogique.

Qui témoigne : ${interviewerDescription}
Ce dont il/elle veut parler : ${themeText || "(non précisé — l'agent choisira)"}

Génère un résumé naturel en 2-3 phrases, chaleureux, en français.
Format attendu :
"Je vais interroger [qui] sur [sujet/contexte]. [Ce que je compte explorer]. On commence ?"

Réponds UNIQUEMENT avec le résumé, sans introduction ni commentaire.`,
      },
    ],
  });

  const summary = response.content
    .filter((c): c is Anthropic.TextBlock => c.type === "text")
    .map((c) => c.text)
    .join("");

  // Détecter l'intention depuis le texte
  let intent = "free";
  const lower = themeText.toLowerCase();
  if (lower.includes("confirm") || lower.includes("vérif")) intent = "confirm";
  else if (lower.includes("audio") || lower.includes("import")) intent = "enrich";
  else if (lower.includes("décou") || lower.includes("explor")) intent = "discover";
  else if (themeText.length > 10) intent = "enrich";

  let mode = "direct";
  if (lower.includes("audio") || lower.includes("vocal")) mode = "import";

  let theme_type = "free";
  if (lower.includes("famille") || lower.match(/\b(père|mère|frère|sœur|cousin|oncle)\b/)) theme_type = "family";
  else if (lower.match(/\b(lieu|village|ville|quartier|rue)\b/)) theme_type = "place";
  else if (lower.match(/\b(acte|hypothèque|notaire|document)\b/)) theme_type = "legal";
  else if (lower.match(/\b(événement|guerre|cyclone|mariage|naissance|décès)\b/)) theme_type = "event";
  else if (lower.length > 3) theme_type = "person";

  return {
    summary,
    parsed: { intent, mode, theme_type },
  };
}

// =====================================================
// HANDLER PRINCIPAL
// =====================================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader! } } }
    );

    const body = await req.json() as Record<string, unknown>;
    const action = (body.action as string | undefined) ?? "chat";

    // ── Action : générer le contexte avant de créer la session ──
    if (action === "generate_context") {
      const result = await generateContext(
        String(body.interviewer_description ?? ""),
        String(body.theme_text ?? "")
      );
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Action : chat ──
    const session_id = body.session_id as string | undefined;
    const message = body.message as string | undefined;

    if (!session_id || !message?.trim()) {
      return new Response(
        JSON.stringify({ error: "session_id et message requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: session, error: sessionError } = await supabase
      .from("journal_sessions")
      .select("*")
      .eq("id", session_id)
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: "Session introuvable" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: history } = await supabase
      .from("journal_messages")
      .select("role, content")
      .eq("session_id", session_id)
      .order("created_at", { ascending: true });

    await supabase.from("journal_messages").insert({
      session_id,
      role: "user",
      content: message.trim(),
    });

    const claudeMessages: Anthropic.MessageParam[] = [
      ...(history ?? []).map((m) => ({
        role: (m.role === "agent" ? "assistant" : "user") as "user" | "assistant",
        content: m.content as string,
      })),
      { role: "user" as const, content: message.trim() },
    ];

    // Boucle outil (max 5 tours)
    let finalResponse = "";
    let currentMessages = claudeMessages;

    for (let turn = 0; turn < 5; turn++) {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 2048,
        system: buildSystemPrompt(session),
        messages: currentMessages,
        tools: AGENT_TOOLS,
      });

      if (response.stop_reason === "end_turn") {
        finalResponse = response.content
          .filter((c): c is Anthropic.TextBlock => c.type === "text")
          .map((c) => c.text)
          .join("");
        break;
      }

      if (response.stop_reason === "tool_use") {
        const toolUses = response.content.filter(
          (c): c is Anthropic.ToolUseBlock => c.type === "tool_use"
        );
        const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
          toolUses.map(async (tu) => ({
            type: "tool_result" as const,
            tool_use_id: tu.id,
            content: JSON.stringify(await executeTool(tu, session, supabase)),
          }))
        );
        currentMessages = [
          ...currentMessages,
          { role: "assistant" as const, content: response.content },
          { role: "user" as const, content: toolResults },
        ];
        continue;
      }

      finalResponse = response.content
        .filter((c): c is Anthropic.TextBlock => c.type === "text")
        .map((c) => c.text)
        .join("");
      break;
    }

    if (finalResponse) {
      await supabase.from("journal_messages").insert({
        session_id,
        role: "agent",
        content: finalResponse,
      });
    }

    const { count: proposalCount } = await supabase
      .from("journal_proposals")
      .select("*", { count: "exact", head: true })
      .eq("session_id", session_id)
      .eq("status", "pending");

    return new Response(
      JSON.stringify({ content: finalResponse, proposals_count: proposalCount ?? 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("journal-agent error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
