import { Loader2 } from "lucide-react";

const Loader = ({ label = "Loading…", testId = "loader" }) => (
  <div
    data-testid={testId}
    className="flex items-center gap-2 text-sm text-zinc-500"
  >
    <Loader2 className="h-4 w-4 animate-spin" /> {label}
  </div>
);

export default Loader;
