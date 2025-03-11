"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FileUp, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function ChatWithFiles() {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [totalQuestions, setTotalQuestions] = useState(12);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const router = useRouter();

  const handleSubmitWithFiles = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setProgress(0);
    try {
      const encodedFiles = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          type: file.type,
          data: await encodeFileAsBase64(file),
        }))
      );

      // Start progress simulation
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return prev;
          }
          const nextProgress = prev + Math.random() * 10;
          return Math.min(nextProgress, 95); // Cap at 95% during generation
        });
      }, 1000);

      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: JSON.stringify(encodedFiles) }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Received result:", result);

      clearInterval(progressInterval);

      if (result.questions && result.studySetId) {
        setProgress(100); // Set to exactly 100% when complete
        setTotalQuestions(result.totalQuestions || result.questions.length);
        router.push(`/study-set/${result.studySetId}`);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error generating quiz:", error);
      toast.error("Failed to generate quiz. Please try again.");
    } finally {
      setIsLoading(false);
      setFiles([]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isSafari && isDragging) {
      toast.error(
        "Safari does not support drag & drop. Please use the file picker."
      );
      return;
    }

    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(
      (file) => file.type === "application/pdf" && file.size <= 5 * 1024 * 1024
    );
    console.log("Selected files:", validFiles);

    if (validFiles.length !== selectedFiles.length) {
      toast.error("Only PDF files under 5MB are allowed.");
    }

    setFiles(validFiles);
  };

  const encodeFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  return (
    <div
      className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-gradient-to-b from-transparent to-gray-50 dark:to-zinc-900/50 p-6"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragExit={() => setIsDragging(false)}
      onDragEnd={() => setIsDragging(false)}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        console.log(e.dataTransfer.files);
        handleFileChange({
          target: { files: e.dataTransfer.files },
        } as React.ChangeEvent<HTMLInputElement>);
      }}
    >
      <AnimatePresence>
        {isDragging && (
          <motion.div
            className="fixed pointer-events-none dark:bg-zinc-900/90 h-dvh w-dvw z-10 justify-center items-center flex flex-col gap-2 bg-zinc-100/90 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-2xl font-semibold">Drop your PDF here</div>
            <div className="text-base dark:text-zinc-400 text-zinc-500">
              Maximum file size: 5MB
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Card className="w-full max-w-md border dark:border-zinc-800 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] transition-all duration-300">
        <CardHeader className="text-center space-y-6">
          <motion.div
            className="mx-auto flex items-center justify-center space-x-3 text-muted-foreground"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="rounded-xl bg-primary/10 p-3">
              <FileUp className="h-7 w-7" />
            </div>
            <Plus className="h-5 w-5" />
            <div className="rounded-xl bg-primary/10 p-3">
              <Loader2 className="h-7 w-7" />
            </div>
          </motion.div>
          <motion.div
            className="space-y-3"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              PDF Quiz Generator
            </CardTitle>
            <CardDescription className="text-base leading-relaxed">
              Upload a PDF to generate an interactive quiz based on its content.
            </CardDescription>
          </motion.div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitWithFiles} className="space-y-6">
            <motion.div
              className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 transition-all duration-300 ${
                files.length > 0
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/5"
              }`}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <input
                type="file"
                onChange={handleFileChange}
                accept="application/pdf"
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <FileUp className="h-10 w-10 mb-4 text-muted-foreground" />
              <p className="text-base text-muted-foreground text-center">
                {files.length > 0 ? (
                  <span className="font-medium text-foreground">
                    {files[0].name}
                  </span>
                ) : (
                  <span>Drop your PDF here or click to browse</span>
                )}
              </p>
            </motion.div>
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                type="submit"
                className="w-full h-12 text-base shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_20px_-3px_rgba(0,0,0,0.2)] transition-shadow duration-300"
                disabled={files.length === 0}
              >
                {isLoading ? (
                  <span className="flex items-center space-x-3">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Generating Quiz...</span>
                  </span>
                ) : (
                  "Generate Quiz"
                )}
              </Button>
            </motion.div>
          </form>
        </CardContent>
        {isLoading && (
          <CardFooter className="flex flex-col space-y-6">
            <motion.div
              className="w-full space-y-2"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 h-2 rounded-full overflow-hidden">
                <Progress value={progress} className="h-2" />
              </div>
            </motion.div>
            <motion.div
              className="w-full"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center space-x-3 text-sm">
                <div
                  className={`h-3 w-3 rounded-full ${
                    isLoading ? "bg-yellow-500 animate-pulse" : "bg-muted"
                  }`}
                />
                <span className="text-muted-foreground">
                  {progress < 100
                    ? "Analyzing PDF and generating questions..."
                    : `Generated ${totalQuestions} questions`}
                </span>
              </div>
            </motion.div>
          </CardFooter>
        )}
      </Card>
      <motion.div
        className="flex flex-row gap-4 items-center justify-between mt-8 text-sm"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      ></motion.div>
    </div>
  );
}
