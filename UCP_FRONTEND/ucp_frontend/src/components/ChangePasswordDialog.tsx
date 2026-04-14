import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import axios from "@/api/axios";
import { Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { data } from "react-router-dom";


type ChangePasswordDialogProps = {
    trigger?: React.ReactNode
}

export function ChangePasswordDialog({ trigger }: ChangePasswordDialogProps) {
    const [open, setOpen] = useState(false)
    const [newPassword, setNewPassword] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const validatePassword = (password: string) => {
        const minLength = 8
        const hasUpperCase = /[A-Z]/.test(password)
        const hasLowerCase = /[a-z]/.test(password)
        const hasNumber = /[0-9]/.test(password)
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

        return {
            minLength,
            hasUpperCase,
            hasLowerCase,
            hasNumber,
            hasSpecialChar,
            isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar,
        };
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const validation = validatePassword(newPassword);
        if (!validation.isValid) {
            toast.error("Mot de passe invalide", {
                description:
                    `Minimum ${validation.minLength} caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.`,
            });
            return;
        }


        setSubmitting(true)
        try {
            // Intégration backend à venir: appeler l'API pour changer le mot de passe
            if (newPassword != "") {
                const result = await axios.put("/Utilisateur/password", { newPassword }, { withCredentials: true });
                toast.success(result.data || "Mot de passe modifié avec succès");
                // await api.changePassword(newPassword)
                setOpen(false)
                setNewPassword("")
            } else {
                toast.error("Le mot de passe ne peut pas être vide.")
            }

        } catch (error: any) {
            toast.error(error.response?.data?.message || "Erreur lors du changement de mot de passe");
        }

        finally {
            setSubmitting(false)
        }
    }


    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ?? <Button variant="ghost" size="sm">Modifier mot de passe</Button>}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Modifier le mot de passe</DialogTitle>
                    <DialogDescription>Entrez votre nouveau mot de passe puis validez.</DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="relative">
                        <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Nouveau mot de passe"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            className="pr-10"
                        />

                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </button>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
                        <Button type="submit" disabled={submitting || newPassword.length === 0}>
                            {submitting ? "Envoi..." : "Valider"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default ChangePasswordDialog