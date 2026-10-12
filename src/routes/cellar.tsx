import { createFileRoute } from "@tanstack/react-router";
import { Cellar } from "@/components/como/cellar";

export const Route = createFileRoute("/cellar")({ component: Cellar });
