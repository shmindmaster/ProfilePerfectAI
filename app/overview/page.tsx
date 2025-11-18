import ClientSideModelsList from "@/components/realtime/ClientSideModelsList";
import { Database } from "@/types/supabase";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function Index() {
  const supabase = createServerComponentClient<Database>({ cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div>User not found</div>;
  }

  const { data: models } = await supabase
    .from("generation_jobs")
    .select(
      `*, uploaded_photos (
      *
    )`
    )
    .eq("user_id", user.id);

  // Transform uploaded_photos to samples for type compatibility
  const modelsWithSamples = models?.map(model => ({
    ...model,
    samples: model.uploaded_photos
  }));

  return <ClientSideModelsList serverModels={modelsWithSamples ?? []} />;
}
