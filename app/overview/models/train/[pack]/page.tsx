import ProfilePerfectGenerateZone from "@/components/ProfilePerfectGenerateZone";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";

const packsIsEnabled = process.env.NEXT_PUBLIC_TUNE_TYPE === "packs";

export default async function Index({ params }: { params: { pack : string } }) {
  
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div
        id="train-model-container"
        className="flex flex-1 flex-col gap-2 px-2"
      >
        <Link href={packsIsEnabled ? "/overview/packs" : "/overview"} className="text-sm w-fit">
          <Button variant={"outline"}>
            <FaArrowLeft className="mr-2" />
            Go Back
          </Button>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>Generate Professional Headshots</CardTitle>
            <CardDescription>
              Upload 5-10 reference photos and choose your professional style to create stunning headshots with ProfilePerfect AI.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <ProfilePerfectGenerateZone />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
