"use client";
import { Button } from "@/components/ui/button";
import { modelRowWithSamples } from "@/types/utils";
import Link from "next/link";
import { FaImages } from "react-icons/fa";
import ModelsTable from "../ModelsTable";

const packsIsEnabled = process.env.NEXT_PUBLIC_TUNE_TYPE === "packs";

export const revalidate = 0;

type ClientSideModelsListProps = {
  serverModels: modelRowWithSamples[] | [];
};

export default function ClientSideModelsList({
  serverModels,
}: ClientSideModelsListProps) {
  // TODO: Implement real-time updates with PostgreSQL or polling
  // For now, just display the server-side data from Azure PostgreSQL
  
  if (!serverModels || serverModels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <FaImages className="h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No models yet
        </h3>
        <p className="text-gray-600 mb-6 max-w-md">
          Get started by creating your first AI model to generate professional headshots.
        </p>
        <Link href="/overview/models/train/profileperfect">
          <Button>Create your first model</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Your Models</h2>
        <Link href="/overview/models/train/profileperfect">
          <Button>Create New Model</Button>
        </Link>
      </div>
      
      <ModelsTable models={serverModels} />
      
      {packsIsEnabled && (
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Want more models?
          </h3>
          <p className="text-blue-700 mb-4">
            Check out our model packs for additional styles and presets.
          </p>
          <Link href="/overview/packs">
            <Button variant="outline">Browse Model Packs</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
