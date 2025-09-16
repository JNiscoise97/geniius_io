import { supabase } from "@/lib/supabase";

export type DictionnaireItem = {
  id: string;
  code: string;
  label: string;
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

export async function fetchStatuts(): Promise<{ data: DictionnaireItem[]; error: any }> {
  const { data, error } = await supabase
    .from("ref_statuts")
    .select("id, code, label")
    .order("label", { ascending: true });
  return { data: (data as DictionnaireItem[]) ?? [], error };
}
