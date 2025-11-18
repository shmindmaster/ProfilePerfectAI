import { Database } from "./supabase";

export type modelRow = Database["public"]["Tables"]["generation_jobs"]["Row"];
export type sampleRow = Database["public"]["Tables"]["uploaded_photos"]["Row"];

export type modelRowWithSamples = modelRow & {
  samples: sampleRow[];
};

export type imageRow = Database["public"]["Tables"]["images"]["Row"];

export type creditsRow = Database["public"]["Tables"]["credits"]["Row"];
