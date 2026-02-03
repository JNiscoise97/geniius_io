//dictionnaires.rpc.ts

import { supabase } from "@/lib/supabase";

export type DictionnaireItem = {
  id: string;
  code: string;
  label: string;
  color?: string;
};

export async function fetchProfession(): Promise<{ data: DictionnaireItem[]; error: any }> {
  const { data, error } = await supabase
    .from("ref_profession")
    .select("id, code, label, label_m, label_f, invariable")
    .order("label", { ascending: true });
  return { data: (data as DictionnaireItem[]) ?? [], error };
}

export async function fetchFiliation(): Promise<{ data: DictionnaireItem[]; error: any }> {
  const { data, error } = await supabase
    .from("ref_filiation")
    .select("id, code, label")
    .order("label", { ascending: true });
  return { data: (data as DictionnaireItem[]) ?? [], error };
}

export async function fetchAuteurInstitutionnel(): Promise<{ data: DictionnaireItem[]; error: any }> {
  const { data, error } = await supabase
    .from("ref_ec_auteur_institutionnel")
    .select("id, code, label")
    .order("label", { ascending: true });
  return { data: (data as DictionnaireItem[]) ?? [], error };
}

export async function fetchConfidence(): Promise<{ data: DictionnaireItem[]; error: any }> {
  const { data, error } = await supabase
    .from("ref_confiance")
    .select("id, code, label")
    .order("label", { ascending: true });
  return { data: (data as DictionnaireItem[]) ?? [], error };
}

export async function fetchLegibility(): Promise<{ data: DictionnaireItem[]; error: any }> {
  const { data, error } = await supabase
    .from("ref_legibilite")
    .select("id, code, label")
    .order("position", { ascending: true });
  return { data: (data as DictionnaireItem[]) ?? [], error };
}

export async function fetchHandwritingStyle(): Promise<{ data: DictionnaireItem[]; error: any }> {
  const { data, error } = await supabase
    .from("ref_handwriting_style")
    .select("id, code, label")
    .order("label", { ascending: true });
  return { data: (data as DictionnaireItem[]) ?? [], error };
}

export async function fetchHandwritingLegibility(): Promise<{ data: DictionnaireItem[]; error: any }> {
  const { data, error } = await supabase
    .from("ref_handwriting_legibility")
    .select("id, code, label")
    .order("position", { ascending: true });
  return { data: (data as DictionnaireItem[]) ?? [], error };
}

export async function fetchTypeActe(): Promise<{ data: DictionnaireItem[]; error: any }> {
  const { data, error } = await supabase
    .from("ref_ec_type_acte")
    .select("id, code, label, color")
    .order("label", { ascending: true });
  return { data: (data as DictionnaireItem[]) ?? [], error };
}
  
export async function fetchQualite(): Promise<{ data: DictionnaireItem[]; error: any }> {
  const { data, error } = await supabase
    .from("ref_qualite")
    .select("id, code, label, genre")
    .order("label", { ascending: true });
  return { data: (data as DictionnaireItem[]) ?? [], error };
}

export async function fetchSignature(): Promise<{ data: DictionnaireItem[]; error: any }> {
  const { data, error } = await supabase
    .from("ref_signature")
    .select("id, code, label")
    .order("label", { ascending: true });
  return { data: (data as DictionnaireItem[]) ?? [], error };
}

export async function fetchSituationMatrimoniale(): Promise<{ data: DictionnaireItem[]; error: any }> {
  const { data, error } = await supabase
    .from("ref_situation_matrimoniale")
    .select("id, code, label, label_m, label_f, invariable")
    .order("label", { ascending: true });
  return { data: (data as DictionnaireItem[]) ?? [], error };
}

export async function fetchStatutProprietaire(): Promise<{ data: DictionnaireItem[]; error: any }> {
  const { data, error } = await supabase
    .from("ref_statut_proprietaire")
    .select("id, code, label, label_m, label_f, invariable")
    .order("label", { ascending: true });
  return { data: (data as DictionnaireItem[]) ?? [], error };
}

export async function fetchCategorieCouleur(): Promise<{ data: DictionnaireItem[]; error: any }> {
  const { data, error } = await supabase
    .from("ref_categorie_couleur")
    .select("id, code, label, label_m, label_f, invariable")
    .order("label", { ascending: true });
  return { data: (data as DictionnaireItem[]) ?? [], error };
}

export async function fetchStatutJuridique(): Promise<{ data: DictionnaireItem[]; error: any }> {
  const { data, error } = await supabase
    .from("ref_statut_juridique")
    .select("id, code, label, label_m, label_f, invariable")
    .order("label", { ascending: true });
  return { data: (data as DictionnaireItem[]) ?? [], error };
}

export async function fetchSituationFiscale(): Promise<{ data: DictionnaireItem[]; error: any }> {
  const { data, error } = await supabase
    .from("ref_situation_fiscale")
    .select("id, code, label, label_m, label_f, invariable")
    .order("label", { ascending: true });
  return { data: (data as DictionnaireItem[]) ?? [], error };
}

export async function fetchStatus(): Promise<{ data: DictionnaireItem[]; error: any }> {
  const { data, error } = await supabase
    .from("ref_status")
    .select("id, code, label")
    .order("label", { ascending: true });
  return { data: (data as DictionnaireItem[]) ?? [], error };
}

export async function fetchEcDocumentForm(): Promise<{ data: DictionnaireItem[]; error: any }> {
  const { data, error } = await supabase
    .from("ref_ec_document_form")
    .select("id, code, label")
    .order("label", { ascending: true });
  return { data: (data as DictionnaireItem[]) ?? [], error };
}

export async function fetchPhysicalCondition(): Promise<{ data: DictionnaireItem[]; error: any }> {
  const { data, error } = await supabase
    .from("ref_physical_condition")
    .select("id, code, label")
    .order("label", { ascending: true });
  return { data: (data as DictionnaireItem[]) ?? [], error };
}

export async function fetchReproQuality(): Promise<{ data: DictionnaireItem[]; error: any }> {
  const { data, error } = await supabase
    .from("ref_repro_quality")
    .select("id, code, label")
    .order("label", { ascending: true });
  return { data: (data as DictionnaireItem[]) ?? [], error };
}
