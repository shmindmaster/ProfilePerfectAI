import Login from "@/app/login/page";
import { Icons } from "@/components/icons";
import ClientSideModel from "@/components/realtime/ClientSideModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pool } from 'pg';
import Link from "next/link";
import { redirect } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa";

export const dynamic = "force-dynamic";

export default async function Index({ params }: { params: { id: string } }) {
  // TODO: Add proper authentication later - for now using mock user
  const userId = 'mock-user-id';
  
  const pool = new Pool({
    connectionString: process.env.AZURE_POSTGRES_URL,
  });
  
  const client = await pool.connect();
  
  try {
    const modelResult = await client.query(
      'SELECT * FROM generation_jobs WHERE id = $1 AND user_id = $2',
      [Number(params.id), userId]
    );

    const model = modelResult.rows[0];

    if (!model) {
      return <div>Model not found</div>;
    }

  if (!model) {
      redirect("/overview");
    }

    // Get images for this model
    const imagesResult = await client.query(
      'SELECT * FROM images WHERE model_id = $1 ORDER BY created_at DESC',
      [model.id]
    );

    // Get uploaded photos for this model
    const samplesResult = await client.query(
      'SELECT * FROM uploaded_photos WHERE model_id = $1 ORDER BY created_at DESC',
      [model.id]
    );

    const images = imagesResult.rows;
    const samples = samplesResult.rows;

  return (
    <div id="train-model-container" className="w-full h-full">
      <div className="flex flex-row gap-4">
        <Link href="/overview" className="text-xs w-fit">
          <Button variant={"outline"} className="text-xs" size="sm">
            <FaArrowLeft className="mr-2" />
            Go Back
          </Button>
        </Link>
        <div className="flex flex-row gap-2 align-middle text-center items-center pb-4">
          <h1 className="text-xl">{model.name}</h1>
          <div>
            <Badge
              variant={model.status === "finished" ? "default" : "secondary"}
              className="text-xs font-medium"
            >
              {model.status === "processing" ? "training" : model.status }
              {model.status === "processing" && (
                <Icons.spinner className="h-4 w-4 animate-spin ml-2 inline-block" />
              )}
            </Badge>
          </div>
        </div>
      </div>

      <ClientSideModel samples={samples ?? []} serverModel={model} serverImages={images ?? []} />
    </div>
  );
    
  } catch (error) {
    console.error('Error fetching model:', error);
    return <div>Error loading model</div>;
  } finally {
    client.release();
    await pool.end();
  }
}
