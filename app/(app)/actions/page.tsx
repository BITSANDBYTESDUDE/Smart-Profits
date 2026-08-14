import { redirect } from "next/navigation";

export default function ActionsRedirect() {
  redirect("/settings?tab=actions");
}
