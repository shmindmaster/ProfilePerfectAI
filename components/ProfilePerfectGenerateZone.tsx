"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCallback, useState, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { SubmitHandler, useForm } from "react-hook-form";
import { FaImages, FaSpinner } from "react-icons/fa";
import * as z from "zod";
import { upload } from "@vercel/blob/client";
import axios from "axios";
import { getAvailableStylePresets, getAvailableBackgroundPresets } from "@/lib/ai/image-generation";

const profilePerfectFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  stylePreset: z.string().min(1, "Style preset is required"),
  backgroundPreset: z.string().min(1, "Background preset is required"),
  count: z.number().min(16).max(32).default(16),
  size: z.enum(["1024x1024", "1024x1536", "1536x1024"]).default("1024x1024"),
  quality: z.enum(["standard", "high"]).default("high"),
});

type ProfilePerfectFormInput = z.infer<typeof profilePerfectFormSchema>;

interface GenerationJob {
  id: number;
  status: string;
  estimatedCompletion: string;
}

interface GeneratedImage {
  id: string;
  url: string;
  is_favorited: boolean;
  style_preset: string;
  background_preset: string;
  created_at: string;
}

export default function ProfilePerfectGenerateZone() {
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationJob, setGenerationJob] = useState<GenerationJob | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<ProfilePerfectFormInput>({
    resolver: zodResolver(profilePerfectFormSchema),
    defaultValues: {
      name: "",
      stylePreset: "",
      backgroundPreset: "",
      count: 16,
      size: "1024x1024",
      quality: "high",
    },
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Validate file count
      const totalFiles = [...files, ...acceptedFiles];
      if (totalFiles.length > 10) {
        toast({
          title: "Too many files",
          description: "Please select a maximum of 10 reference photos.",
          variant: "destructive",
          duration: 5000,
        });
        return;
      }

      setFiles(totalFiles);

      toast({
        title: "Images selected",
        description: `Selected ${acceptedFiles.length} images. Total: ${totalFiles.length}/10`,
        duration: 5000,
      });
    },
    [files, toast]
  );

  const removeFile = useCallback(
    (file: File) => {
      const newFiles = files.filter((f) => f.name !== file.name);
      setFiles(newFiles);
    },
    [files]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: 10,
    multiple: true,
  });

  const generateHeadshots: SubmitHandler<ProfilePerfectFormInput> = async (data) => {
    // Validate minimum file count
    if (files.length < 5) {
      toast({
        title: "Not enough photos",
        description: "Please upload at least 5 reference photos for optimal results.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    try {
      // Step 1: Upload files to storage
      setProgress(20);
      toast({
        title: "Uploading photos",
        description: "Uploading your reference photos to secure storage...",
        duration: 3000,
      });

      const uploadedUrls = [];
      for (const file of files) {
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/upload", // Need to create this endpoint
        });
        uploadedUrls.push(blob.url);
      }

      // Step 2: Start generation
      setProgress(40);
      toast({
        title: "Starting generation",
        description: "Initiating ProfilePerfect AI headshot generation...",
        duration: 3000,
      });

      const response = await axios.post("/api/generate", {
        referenceImages: uploadedUrls,
        stylePreset: data.stylePreset,
        backgroundPreset: data.backgroundPreset,
        count: data.count,
        size: data.size,
        quality: data.quality,
      });

      if (response.data.success) {
        setGenerationJob(response.data.generationJob);
        setProgress(60);

        // Step 3: Poll for completion
        await pollGenerationStatus(response.data.generationJob.id);
      } else {
        throw new Error(response.data.error || "Generation failed");
      }
    } catch (error) {
      console.error("Generation error:", error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
        duration: 5000,
      });
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const pollGenerationStatus = async (jobId: number) => {
    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await axios.get(`/api/generate?jobId=${jobId}`);
        
        if (response.data.success) {
          const job = response.data.job;
          setProgress(60 + (job.status === 'completed' ? 40 : 20));

          if (job.status === 'completed') {
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            setGeneratedImages(job.images || []);
            setIsGenerating(false);
            setProgress(100);
            
            toast({
              title: "Generation complete!",
              description: `Generated ${job.images?.length || 0} professional headshots`,
              duration: 5000,
            });
          } else if (job.status === 'failed') {
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            setIsGenerating(false);
            setProgress(0);
            
            toast({
              title: "Generation failed",
              description: "The generation process encountered an error",
              variant: "destructive",
              duration: 5000,
            });
          }
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 3000); // Poll every 3 seconds

    // Stop polling after 3 minutes
    setTimeout(() => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (isGenerating) {
        setIsGenerating(false);
        toast({
          title: "Generation timeout",
          description: "Generation took longer than expected. Please check your results later.",
          variant: "destructive",
          duration: 5000,
        });
      }
    }, 180000);
  };

  const toggleFavorite = async (imageId: string) => {
    // TODO: Implement favorite toggle via API
    setGeneratedImages(prev =>
      prev.map(img =>
        img.id === imageId ? { ...img, is_favorited: !img.is_favorited } : img
      )
    );
  };

  // Cleanup polling interval on component unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Upload Section */}
      <div className="space-y-4">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <input {...getInputProps()} />
          <FaImages className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          {isDragActive ? (
            <p className="text-blue-600">Drop the photos here...</p>
          ) : (
            <div>
              <p className="text-gray-600 mb-2">
                Drag & drop 5-10 reference photos here, or click to select
              </p>
              <p className="text-sm text-gray-500">
                High-quality photos showing your face clearly work best
              </p>
            </div>
          )}
        </div>

        {/* Selected Files */}
        {files.length > 0 && (
          <div className="space-y-2">
            <Label>Selected Photos ({files.length}/10)</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {files.map((file, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Reference ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeFile(file)}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Generation Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(generateHeadshots)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Generation Name</FormLabel>
                <FormControl>
                  <Input placeholder="My Professional Headshots" {...field} />
                </FormControl>
                <FormDescription>
                  A descriptive name for your headshot generation
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="stylePreset"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Style Preset</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a style" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {getAvailableStylePresets().map((preset) => (
                        <SelectItem key={preset} value={preset}>
                          {preset}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the professional style for your headshots
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="backgroundPreset"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Background Preset</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a background" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {getAvailableBackgroundPresets().map((preset) => (
                        <SelectItem key={preset} value={preset}>
                          {preset}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the background setting for your headshots
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Images</FormLabel>
                  <Select onValueChange={(value: string) => field.onChange(parseInt(value))} defaultValue={field.value.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="16">16 images</SelectItem>
                      <SelectItem value="24">24 images</SelectItem>
                      <SelectItem value="32">32 images</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="size"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image Size</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1024x1024">Square (1024×1024)</SelectItem>
                      <SelectItem value="1024x1536">Portrait (1024×1536)</SelectItem>
                      <SelectItem value="1536x1024">Landscape (1536×1024)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quality</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="high">High Quality</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Progress Bar */}
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Generating your headshots...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={isGenerating || files.length < 5}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <FaSpinner className="mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Professional Headshots"
            )}
          </Button>
        </form>
      </Form>

      {/* Results Section */}
      {generatedImages.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Generated Headshots ({generatedImages.length})</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {generatedImages.map((image) => (
              <div key={image.id} className="relative group">
                <img
                  src={image.url}
                  alt="Generated headshot"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <div className="absolute top-2 right-2">
                  <Button
                    type="button"
                    variant={image.is_favorited ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleFavorite(image.id)}
                  >
                    {image.is_favorited ? "★" : "☆"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
