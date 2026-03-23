import { useEffect } from "react";
import { useNavigate } from "react-router";

// Sign-up is handled by the sign-in page (username-only flow)
export default function SignUp() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/sign-in", { replace: true });
  }, [navigate]);

  return null;
}
