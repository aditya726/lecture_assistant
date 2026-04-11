import { Expand, Sparkles } from "lucide-react";

import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Textarea } from "./textarea";

export default function StickyNote({ title, value, onChange, onExpand }) {
  return (
    <Card className="h-full transition-shadow hover:shadow-md">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
        {onExpand && (
          <Button size="icon" variant="ghost" onClick={onExpand} aria-label="Expand note">
            <Expand className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[180px] resize-none bg-muted/40"
          placeholder="Write your note"
        />
      </CardContent>
    </Card>
  );
}
