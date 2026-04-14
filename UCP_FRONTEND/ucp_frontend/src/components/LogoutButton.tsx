import axios from "axios"
import { useNavigate } from "react-router-dom"
import { LogOut } from "lucide-react";


export function LogoutButton() {
  const navigate = useNavigate()

  const logout = async () => {
    try {
      await axios.post(
        "/Utilisateur/logout",
        {},
        { withCredentials: true }
        )
        localStorage.removeItem("role");
        localStorage.removeItem("validateur");
        localStorage.removeItem("username");
    } catch (err) {
      console.warn("Erreur lors de la déconnexion:", err)
    } finally {
      // Toujours rediriger vers login
      navigate("/")
    }
  }

  return (
   
    <button className="w-full flex items-center justify-center gap-2 px-4 py-2 text-white hover:bg-gray-700 rounded"
    onClick={logout}>
  <LogOut className="w-4 h-4" />
  Déconnexion
</button>
  )
}
