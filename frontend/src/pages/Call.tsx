import { EmergencyDashboard } from "@/components/dashboard/EmergencyDashboard";
import { useLocation } from "react-router-dom";

const Call = () => {
  const location = useLocation();
  const callData = location.state?.callData;

  return <EmergencyDashboard initialCallData={callData} />;
};

export default Call;