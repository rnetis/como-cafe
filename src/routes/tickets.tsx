import { createFileRoute } from "@tanstack/react-router";
import { Tickets } from "@/components/como/tickets";

export const Route = createFileRoute("/tickets")({ component: Tickets });
