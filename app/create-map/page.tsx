"use client";

import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import dynamic from "next/dynamic";
import "@mdxeditor/editor/style.css"; // Default MDXEditor styles
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import MarkdownEditor from "@/components/MarkdownEditor";
import { useRouter } from "next/navigation";

const MDXEditorDynamic = dynamic(
  () => import("@mdxeditor/editor").then((mod) => mod.MDXEditor),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[200px] border border-gray-300 rounded-md shadow-sm bg-white">
        Loading editor...
      </div>
    ),
  }
);

interface CreateMapForm {
  title: string;
  shortDescription: string;
  body: string;
}

export default function CreateMapPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [markdownValue, setMarkdownValue] = useState<string>("");
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CreateMapForm>();

  const supabase = createClient();

  const onSubmit: SubmitHandler<CreateMapForm> = async (data) => {
    if (!user) {
      router.push("/login");
      return;
    }

    const formData = {
      title: data.title,
      shortDescription: data.shortDescription,
      body: data.body,
    };

    console.log("Form data:", formData);

    if (!formData.title || !formData.body) {
      alert("Title and body are required.");
      return;
    }

    try {
      const { error } = await supabase.from("maps").insert({
        title: formData.title,
        short_description: formData.shortDescription,
        body: formData.body,
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Error creating map:", error.message);
        alert(`Failed to create your map. Error: ${error.message}`);
      } else {
        alert("Map created successfully!");
        setMarkdownValue("");
        setValue("title", "");
        setValue("shortDescription", "");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("An unexpected error occurred. Please try again.");
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] p-4 bg-white">
      <section className="max-w-2xl mx-auto space-y-8">
        <header>
          <h1 className="text-2xl font-bold text-gray-900">Create Your Map</h1>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="title"
              className="text-sm font-medium text-gray-700"
            >
              Title *
            </label>
            <Input
              {...register("title", { required: "Title is required" })}
              id="title"
              placeholder="e.g., Fantasy World Map"
              className="w-full border border-gray-300 rounded-md shadow-sm text-gray-700 placeholder-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
              defaultValue=""
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="shortDescription"
              className="text-sm font-medium text-gray-700"
            >
              Short Description
            </label>
            <Textarea
              {...register("shortDescription", {
                required: "Short description is required",
              })}
              id="shortDescription"
              placeholder="Brief description of your map..."
              className="w-full border border-gray-300 rounded-md shadow-sm text-gray-700 placeholder-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 h-24"
              defaultValue=""
            />
            {errors.shortDescription && (
              <p className="text-sm text-red-500">
                {errors.shortDescription.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="body" className="text-sm font-medium text-gray-700">
              Body (Describe what this map is about in detail)
            </label>
            <MarkdownEditor
              value={markdownValue}
              onChange={(markdown) => {
                setMarkdownValue(markdown);
                setValue("body", markdown, { shouldValidate: true });
              }}
              placeholder="Describe your map here using Markdown"
              className="mdxeditor"
            />
            {errors.body && (
              <p className="text-sm text-red-500">{errors.body.message}</p>
            )}
            <p className="text-sm text-gray-500">
              Use # for headers, * for italic, ** for bold, * for lists.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full bg-black text-white hover:bg-gray-800 rounded-md py-2"
            disabled={isLoading}
          >
            Submit
          </Button>
        </form>
      </section>
    </main>
  );
}
