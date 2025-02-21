import dynamic from "next/dynamic";
import { useState } from "react";
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  thematicBreakPlugin,
  linkPlugin,
  tablePlugin,
  codeBlockPlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  ListsToggle,
  CreateLink,
  InsertTable,
  InsertThematicBreak,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import "./MarkdownEditor.css";

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

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function MarkdownEditor({
  value,
  onChange,
  placeholder,
  className,
}: MarkdownEditorProps) {
  return (
    <MDXEditorDynamic
      markdown={value}
      onChange={onChange}
      plugins={[
        headingsPlugin(),
        listsPlugin(),
        markdownShortcutPlugin(),
        quotePlugin(),
        thematicBreakPlugin(),
        linkPlugin(),
        tablePlugin(),
        codeBlockPlugin(),
        toolbarPlugin({
          toolbarContents: () => (
            <>
              <UndoRedo />
              <BoldItalicUnderlineToggles />
              <ListsToggle />
              <CreateLink />
              <InsertTable />
              <InsertThematicBreak />
            </>
          ),
        }),
      ]}
      placeholder={placeholder}
      className={className}
    />
  );
}
