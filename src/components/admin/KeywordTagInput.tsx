import { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface KeywordTagInputProps {
  keywords: string[];
  onChange: (keywords: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function KeywordTagInput({
  keywords,
  onChange,
  placeholder = "Wpisz słowo kluczowe i naciśnij Enter...",
  className,
}: KeywordTagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      const newKeyword = inputValue.trim().toLowerCase();
      if (!keywords.includes(newKeyword)) {
        onChange([...keywords, newKeyword]);
      }
      setInputValue("");
    } else if (e.key === "Backspace" && !inputValue && keywords.length > 0) {
      onChange(keywords.slice(0, -1));
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    onChange(keywords.filter((k) => k !== keywordToRemove));
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 border rounded-md bg-background">
        {keywords.map((keyword) => (
          <Badge
            key={keyword}
            variant="secondary"
            className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors group"
            onClick={() => removeKeyword(keyword)}
          >
            {keyword}
            <X className="ml-1 h-3 w-3 opacity-50 group-hover:opacity-100" />
          </Badge>
        ))}
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={keywords.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[150px] border-0 shadow-none focus-visible:ring-0 p-0 h-6"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Naciśnij Enter aby dodać, kliknij aby usunąć. {keywords.length} słów kluczowych.
      </p>
    </div>
  );
}
