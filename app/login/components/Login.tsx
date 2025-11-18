"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { AiOutlineGoogle } from "react-icons/ai";
import { useRouter } from "next/navigation";

type Inputs = {
  email: string;
};

export const Login = ({
  host,
  searchParams,
}: {
  host?: string;
  searchParams?: { [key: string]: string | string[] | undefined };
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>();

  const handleDemoLogin = () => {
    setIsLoading(true);
    toast({
      title: "Demo Mode Activated!",
      description: "Welcome to ProfilePerfect AI demo. You can explore all features with sample data.",
      duration: 3000,
    });
    
    // Redirect to overview page with demo access
    setTimeout(() => {
      router.push("/overview");
    }, 1000);
  };

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    setIsLoading(true);
    try {
      // TODO: Implement proper authentication with NextAuth.js
      toast({
        title: "Authentication temporarily disabled",
        description: "Please check back later. Azure migration in progress.",
        duration: 5000,
      });
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: "An error occurred during login.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    // TODO: Implement Google OAuth with NextAuth.js
    toast({
      title: "Google login temporarily disabled",
      description: "Please check back later. Azure migration in progress.",
      duration: 5000,
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Sign in to ProfilePerfect AI</h2>
          <p className="mt-2 text-gray-600">
            Transform your photos into professional headshots
          </p>
        </div>
        
        {/* Demo Login Button - Prominently displayed */}
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-3">
              Want to try the app without signing up?
            </p>
            <Button
              onClick={handleDemoLogin}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3"
              disabled={isLoading}
            >
              {isLoading ? "Loading Demo..." : "🚀 Try Demo - No Signup Required"}
            </Button>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">Or sign in with email</span>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Input
              type="email"
              placeholder="Enter your email"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
              className="w-full"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Sign in with Email"}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
          </div>
        </div>

        <Button
          onClick={handleGoogleLogin}
          variant="outline"
          className="w-full"
        >
          <AiOutlineGoogle className="mr-2 h-4 w-4" />
          Continue with Google
        </Button>
      </div>
    </div>
  );
};
