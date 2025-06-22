
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FeedbackForm } from "@/components/feedback/feedback-form";
import { MessageSquareText } from "lucide-react";

export function FeedbackSection() {
  return (
    <section className="py-8 md:py-12 border-t border-border/40 bg-background/70">
      <div className="container mx-auto max-w-screen-lg px-4 sm:px-6 lg:px-8">
        <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
          <CardHeader className="items-center text-center">
            <MessageSquareText className="w-10 h-10 mb-2 text-primary" />
            <CardTitle className="text-2xl md:text-3xl font-headline">Feedback & Requests</CardTitle>
            <CardDescription className="max-w-md">
              Have a suggestion, found a bug, or want to request new content? Let us know!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FeedbackForm />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
