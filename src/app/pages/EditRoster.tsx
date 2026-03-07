import { useEffect } from "react";
import { useNavigate } from "react-router";

export default function EditRoster() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to existing Roster page
    navigate("/roster", { replace: true });
  }, [navigate]);

  return null;
}
