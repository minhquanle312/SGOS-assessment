import { getAssessment02 } from "@/lib/docs";
import DocPage from "@/components/DocPage";

export default function Assessment02Page() {
  return <DocPage title="Assessment 02" content={getAssessment02()} />;
}
