import { getReadme } from "@/lib/docs";
import DocPage from "@/components/DocPage";

export default function ReadmePage() {
  return <DocPage title="README" content={getReadme()} />;
}
