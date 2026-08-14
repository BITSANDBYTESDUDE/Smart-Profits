import { redirect } from "next/navigation";

export default function ArchiveRedirect() {
  redirect("/data?tab=archive");
}
